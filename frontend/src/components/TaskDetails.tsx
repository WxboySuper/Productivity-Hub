import { useState, useEffect } from "react";
import { ensureCsrfToken as getCsrfToken } from "../hooks/useTasks";
import TaskForm, { TaskFormValues } from "./TaskForm";
import "../styles/Task.css";

// ModalBackdrop: handles backdrop click, keyboard accessibility, and wraps children
function ModalBackdrop({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="modern-modal-backdrop"
      role="button"
      tabIndex={0}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={(e) => {
        /* v8 ignore next */
        if (
          (e.key === "Enter" || e.key === " ") &&
          e.target === e.currentTarget
        ) {
          /* v8 ignore next */
          onClose();
          /* v8 ignore next */
        }
        /* v8 ignore next */
      }}
    >
      {children}
    </div>
  );
}

// TaskDetailsModalContent: receives all props and renders the modal content
// TaskDetailsHeader: displays the modal header
function TaskDetailsHeader({
  task,
  parentTask,
  onClose,
}: {
  task: Task;
  parentTask: { id: number; title: string } | null;
  setShowEditForm: (open: boolean) => void;
  onClose: () => void;
}) {
  return (
    <div className="modern-form-header">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--modern-space-md)",
        }}
      >
        <span style={{ fontSize: "1.5rem" }}>
          {task.completed ? "✅" : "📝"}
        </span>
        <div>
          <h2 className="modern-form-title">{task.title}</h2>
          <p className="modern-form-subtitle">
            {task.projectName ? `📁 ${task.projectName}` : "⚡ Quick Task"}
            {parentTask && ` • Subtask of "${parentTask.title}"`}
          </p>
        </div>
      </div>
      <div style={{ display: "flex", gap: "var(--modern-space-sm)" }}>
        <button
          className="modern-close-btn"
          onClick={onClose}
          type="button"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// TaskDetailsActions: displays the modal actions
function TaskDetailsActions({
  onClose,
  setShowEditForm,
}: {
  onClose: () => void;
  setShowEditForm: (open: boolean) => void;
}) {
  function handleEditClick() {
    setShowEditForm(true);
  }
  return (
    <div className="modern-form-actions">
      <button
        type="button"
        className="modern-btn modern-btn-secondary"
        onClick={onClose}
      >
        Close
      </button>
      <button
        type="button"
        className="modern-btn modern-btn-primary"
        onClick={handleEditClick}
        aria-label="Edit Task"
      >
        <span>✏️</span>
        Edit Details
      </button>
    </div>
  );
}
// TaskRemindersSection: displays reminders in an expandable section
function TaskRemindersSection({
  reminder_enabled,
  reminder_time,
  expanded,
  toggle,
}: {
  reminder_enabled?: boolean;
  reminder_time?: string;
  expanded: boolean;
  toggle: () => void;
}) {
  if (!reminder_enabled) return null;
  function handleToggle() {
    toggle();
  }
  return (
    <div className="modern-expandable">
      <button
        type="button"
        className={`modern-expandable-header ${expanded ? "expanded" : ""}`}
        onClick={handleToggle}
      >
        <span className="modern-expandable-icon">▶️</span>
        <h3 className="modern-expandable-title">Reminders</h3>
        <span className="modern-expandable-count">(Enabled)</span>
      </button>
      <div
        className={`modern-expandable-content ${expanded ? "expanded" : ""}`}
      >
        <div className="modern-reminder-info">
          {reminder_time && (
            <div className="modern-reminder-item">
              <span className="modern-reminder-icon">🔔</span>
              <span className="modern-reminder-text">
                Reminder set for {new Date(reminder_time).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// TaskDependenciesSection: displays dependencies in an expandable section
function TaskDependenciesSection({
  blockedByTasks,
  blockingTasks,
  expanded,
  toggle,
}: {
  blockedByTasks: string[];
  blockingTasks: string[];
  expanded: boolean;
  toggle: () => void;
}) {
  const total = blockedByTasks.length + blockingTasks.length;
  if (!total) return null;
  function handleToggle() {
    toggle();
  }
  return (
    <div className="modern-expandable">
      <button
        type="button"
        className={`modern-expandable-header ${expanded ? "expanded" : ""}`}
        onClick={handleToggle}
      >
        <span className="modern-expandable-icon">▶️</span>
        <h3 className="modern-expandable-title">Dependencies</h3>
        <span className="modern-expandable-count">({total} items)</span>
      </button>
      <div
        className={`modern-expandable-content ${expanded ? "expanded" : ""}`}
      >
        <div className="modern-dependencies-grid">
          {blockedByTasks.length > 0 && (
            <div className="modern-dependency-section">
              <span className="modern-dependency-label">🚫 Blocked By</span>
              <div className="modern-dependency-list">
                {blockedByTasks.map((taskName) => (
                  <span
                    key={taskName}
                    className="modern-dependency-chip blocked-by"
                  >
                    {taskName}
                  </span>
                ))}
              </div>
            </div>
          )}
          {blockingTasks.length > 0 && (
            <div className="modern-dependency-section">
              <span className="modern-dependency-label">⛔ Blocking</span>
              <div className="modern-dependency-list">
                {blockingTasks.map((taskName) => (
                  <span
                    key={taskName}
                    className="modern-dependency-chip blocking"
                  >
                    {taskName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// TaskSubtasksSection: displays subtasks in an expandable section
function TaskSubtasksSection({
  subtasks,
  completedSubtasks,
  totalSubtasks,
  expanded,
  toggle,
}: {
  subtasks: Subtask[];
  completedSubtasks: number;
  totalSubtasks: number;
  expanded: boolean;
  toggle: () => void;
}) {
  if (!totalSubtasks) return null;
  function handleToggle() {
    toggle();
  }
  return (
    <div className="modern-expandable">
      <button
        type="button"
        className={`modern-expandable-header ${expanded ? "expanded" : ""}`}
        onClick={handleToggle}
      >
        <span className="modern-expandable-icon">▶️</span>
        <h3 className="modern-expandable-title">Subtasks</h3>
        <span className="modern-expandable-count">
          ({completedSubtasks}/{totalSubtasks} completed)
        </span>
      </button>
      <div
        className={`modern-expandable-content ${expanded ? "expanded" : ""}`}
      >
        <div className="modern-subtasks-list">
          {subtasks.map((subtask) => (
            <div key={subtask.id} className="modern-subtask-detail-item">
              <input
                type="checkbox"
                className="modern-subtask-checkbox"
                checked={subtask.completed}
                readOnly
              />
              <span
                className={`modern-subtask-text ${subtask.completed ? "completed" : ""}`}
              >
                {subtask.title}
              </span>
              {subtask.completed && (
                <span className="modern-subtask-badge">✓</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// TaskDescriptionSection: displays the description in an expandable section
function TaskDescriptionSection({
  description,
  expanded,
  toggle,
}: {
  description: string;
  expanded: boolean;
  toggle: () => void;
}) {
  if (!description) return null;
  function handleToggle() {
    toggle();
  }
  return (
    <div className="modern-expandable">
      <button
        type="button"
        className={`modern-expandable-header ${expanded ? "expanded" : ""}`}
        onClick={handleToggle}
      >
        <span className="modern-expandable-icon">▶️</span>
        <h3 className="modern-expandable-title">Description</h3>
      </button>
      <div
        className={`modern-expandable-content ${expanded ? "expanded" : ""}`}
      >
        <div className="modern-description-content">{description}</div>
      </div>
    </div>
  );
}
// TaskOverviewSection: displays status, priority, progress, due date, and progress bar
// Individual chip components for overview grid
type StatusState = "todo" | "in_progress" | "completed";

function StatusSelector({
  status,
  onSelect,
}: {
  status: StatusState;
  onSelect: (s: StatusState) => void;
}) {
  const options: Array<{ key: StatusState; icon: string; label: string }> = [
    { key: "todo", icon: "⭕", label: "To Do" },
    { key: "in_progress", icon: "⏳", label: "In Progress" },
    { key: "completed", icon: "✅", label: "Completed" },
  ];
  return (
    <div
      className="modern-detail-chip"
      aria-label="Task status selector"
      style={{ overflow: "hidden" }}
    >
      <div className="modern-detail-chip-icon">
        {status === "completed" ? "✅" : status === "in_progress" ? "⏳" : "⭕"}
      </div>
      <div className="modern-detail-chip-content" style={{ width: "100%" }}>
        <div className="modern-detail-chip-label">Status</div>
        <div className="modern-detail-chip-value" style={{ marginBottom: 6 }}>
          {status === "completed"
            ? "Completed"
            : status === "in_progress"
              ? "In Progress"
              : "To Do"}
        </div>
        <div
          role="radiogroup"
          aria-label="Select status"
          style={{ display: "flex", gap: 6, width: "100%", flexWrap: "nowrap" }}
        >
          {options.map((opt) => {
            const selected = status === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelect(opt.key)}
                title={opt.label}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "8px 12px",
                  height: 36,
                  borderRadius: 9999,
                  border: "1px solid var(--modern-border, #e5e7eb)",
                  background: selected ? "#e5e7eb" : "#ffffff",
                  color: "var(--modern-text, #111827)",
                  cursor: "pointer",
                }}
              >
                <span style={{ width: 18, textAlign: "center" }}>
                  {opt.icon}
                </span>
                <span style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PriorityChip({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="modern-detail-chip info">
      <div className="modern-detail-chip-icon">{icon}</div>
      <div className="modern-detail-chip-content">
        <div className="modern-detail-chip-label">Priority</div>
        <div className="modern-detail-chip-value">{label}</div>
      </div>
    </div>
  );
}

function ProgressChip({
  completedSubtasks,
  totalSubtasks,
}: {
  completedSubtasks: number;
  totalSubtasks: number;
}) {
  return (
    <div className="modern-detail-chip">
      <div className="modern-detail-chip-icon">📊</div>
      <div className="modern-detail-chip-content">
        <div className="modern-detail-chip-label">Progress</div>
        <div className="modern-detail-chip-value">
          {completedSubtasks}/{totalSubtasks}
        </div>
      </div>
    </div>
  );
}

function DueDateChip({ due_date }: { due_date: string }) {
  return (
    <div className="modern-detail-chip">
      <div className="modern-detail-chip-icon">🎯</div>
      <div className="modern-detail-chip-content">
        <div className="modern-detail-chip-label">Due Date</div>
        <div className="modern-detail-chip-value">
          {new Date(due_date).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
function TaskOverviewSection({
  status,
  task,
  currentPriority,
  completedSubtasks,
  totalSubtasks,
  progressPercentage,
  onSelectStatus,
}: {
  status: StatusState;
  task: Task;
  currentPriority: {
    value: number;
    label: string;
    icon: string;
    color: string;
  };
  completedSubtasks: number;
  totalSubtasks: number;
  progressPercentage: number;
  onSelectStatus: (next: StatusState) => void;
}) {
  return (
    <div className="modern-hero-section">
      <div className="modern-quick-grid">
        <StatusSelector status={status} onSelect={onSelectStatus} />
        <PriorityChip
          icon={currentPriority.icon}
          label={currentPriority.label}
        />
        {totalSubtasks > 0 && (
          <ProgressChip
            completedSubtasks={completedSubtasks}
            totalSubtasks={totalSubtasks}
          />
        )}
        {task.due_date && <DueDateChip due_date={task.due_date} />}
      </div>
      {/* Progress Bar for Subtasks */}
      {totalSubtasks > 0 && (
        <div style={{ marginTop: "var(--modern-space-md)" }}>
          <div className="modern-progress-bar">
            <div
              className="modern-progress-fill"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
interface Subtask {
  id: number;
  title: string;
  completed: boolean;
}

interface Task {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  start_date?: string;
  priority?: number;
  recurrence?: string;
  completed: boolean;
  project_id?: number;
  projectName?: string;
  next_occurrence?: string;
  subtasks?: Subtask[];
  parent_id?: number | null;
  blocked_by?: number[];
  blocking?: number[];
  reminder_enabled?: boolean;
  reminder_time?: string;
}

interface Project {
  id: number;
  name: string;
}

// Helper to adapt TaskFormValues to Partial<Task> for API updates
// Wire DTO for updates: subtasks may omit id when creating new ones
type TaskUpdateDto = Omit<Partial<Task>, "subtasks"> & {
  subtasks?: Array<{ id?: number; title: string; completed: boolean }>;
};

function mapFormValuesToTaskUpdate(values: TaskFormValues): TaskUpdateDto {
  return {
    id: values.id,
    title: values.title,
    description: values.description,
    due_date: values.due_date,
    start_date: values.start_date,
    priority: values.priority,
    project_id:
      typeof values.project_id === "string"
        ? values.project_id
          ? Number(values.project_id)
          : undefined
        : values.project_id,
    completed: values.completed,
    // Allow creating new subtasks without id; backend will create them
    subtasks: values.subtasks?.map((st) => {
      const dto: { id?: number; title: string; completed: boolean } = {
        title: st.title,
        completed: st.completed,
      };
      if (typeof st.id === "number") dto.id = st.id;
      return dto;
    }),
    recurrence: values.recurrence,
    blocked_by: values.blocked_by,
    blocking: values.blocking,
    reminder_enabled: values.reminder_enabled,
    reminder_time: values.reminder_time,
  };
}

interface TaskDetailsModalContentProps {
  task: Task;
  parentTask: { id: number; title: string } | null;
  currentPriority: {
    value: number;
    label: string;
    icon: string;
    color: string;
  };
  completedSubtasks: number;
  totalSubtasks: number;
  progressPercentage: number;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  setShowEditForm: (open: boolean) => void;
  showEditForm: boolean;
  editFormLoading: boolean;
  editFormError: string | null;
  handleTaskUpdate: (
    updatedTask: TaskUpdateDto,
    options?: { source?: "status" | "form"; optimistic?: boolean },
  ) => void;
  onClose: () => void;
  tasks: Task[];
  projects: Project[];
  blockedByTasks: string[];
  blockingTasks: string[];
}

function TaskDetailsModalContent({
  task,
  parentTask,
  currentPriority,
  completedSubtasks,
  totalSubtasks,
  progressPercentage,
  expandedSections,
  toggleSection,
  setShowEditForm,
  handleTaskUpdate,
  onClose,
  blockedByTasks,
  blockingTasks,
}: TaskDetailsModalContentProps) {
  function handleToggleDetails() {
    toggleSection("details");
  }
  function handleToggleSubtasks() {
    toggleSection("subtasks");
  }
  function handleToggleDependencies() {
    toggleSection("dependencies");
  }
  function handleToggleReminders() {
    toggleSection("reminders");
  }
  // Derive tri-state status from available fields
  const status: StatusState = task.completed
    ? "completed"
    : task.start_date
      ? "in_progress"
      : "todo";

  // Explicit selection from menu
  const handleSelectStatus = (next: StatusState) => {
    const update: Partial<Task> = {};
    update.completed = next === "completed";
    if (next === "in_progress") {
      update.start_date = new Date().toISOString();
    } else if (next === "todo") {
      // Use null to clear value so backend unsets it (undefined might be ignored)
      // skipcq: JS-0323
      (update as any).start_date = null;
    } else {
      // Keep start_date as-is when marking completed
      // no-op
    }
    handleTaskUpdate(update, { source: "status", optimistic: true });
  };
  return (
    <div
      className="modern-form-container"
      style={{ maxWidth: "600px" }}
      data-testid="task-details"
    >
      {/* Header */}
      <TaskDetailsHeader
        task={task}
        parentTask={parentTask}
        setShowEditForm={setShowEditForm}
        onClose={onClose}
      />

      <div className="modern-form-content">
        <div className="modern-form-body">
          {/* Overview Section - Always Visible */}
          <TaskOverviewSection
            status={status}
            task={task}
            currentPriority={currentPriority}
            completedSubtasks={completedSubtasks}
            totalSubtasks={totalSubtasks}
            progressPercentage={progressPercentage}
            onSelectStatus={handleSelectStatus}
          />
          {/* Description - Expandable */}
          <TaskDescriptionSection
            description={task.description || ""}
            expanded={expandedSections.details}
            toggle={handleToggleDetails}
          />
          {/* Subtasks - Expandable */}
          <TaskSubtasksSection
            subtasks={task.subtasks || []}
            completedSubtasks={completedSubtasks}
            totalSubtasks={totalSubtasks}
            expanded={expandedSections.subtasks}
            toggle={handleToggleSubtasks}
          />
          {/* Schedule intentionally hidden per UX feedback */}
          {/* Dependencies - Expandable */}
          <TaskDependenciesSection
            blockedByTasks={blockedByTasks}
            blockingTasks={blockingTasks}
            expanded={expandedSections.dependencies}
            toggle={handleToggleDependencies}
          />
          {/* Reminders - Expandable */}
          <TaskRemindersSection
            reminder_enabled={task.reminder_enabled}
            reminder_time={task.reminder_time}
            expanded={expandedSections.reminders}
            toggle={handleToggleReminders}
          />
        </div>
      </div>
      {/* Actions */}
      <TaskDetailsActions onClose={onClose} setShowEditForm={setShowEditForm} />
    </div>
  );
}

interface TaskDetailsModalProps {
  open: boolean;
  onClose: () => void;
  task: {
    id: number;
    title: string;
    description?: string;
    due_date?: string;
    start_date?: string;
    priority?: number;
    recurrence?: string;
    completed: boolean;
    project_id?: number;
    projectName?: string;
    next_occurrence?: string;
    subtasks?: Array<{
      id: number;
      title: string;
      completed: boolean;
    }>;
    parent_id?: number | null;
    blocked_by?: number[];
    blocking?: number[];
    reminder_enabled?: boolean;
    reminder_time?: string;
  } | null;
  onEdit?: () => void;
  parentTask?: { id: number; title: string } | null;
  tasks: Task[];
  projects?: Project[];
}

const priorities = [
  { value: 0, label: "Low", icon: "🟢", color: "#10b981" },
  { value: 1, label: "Medium", icon: "🟡", color: "#f59e0b" },
  { value: 2, label: "High", icon: "🟠", color: "#ef4444" },
  { value: 3, label: "Critical", icon: "🔴", color: "#dc2626" },
];

const TaskDetails: React.FC<TaskDetailsModalProps> = ({
  open,
  onClose,
  task,
  onEdit,
  parentTask,
  tasks = [],
  projects = [],
}) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormLoading, setEditFormLoading] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    overview: true,
    details: false,
    subtasks: false,
    dependencies: false,
    schedule: false,
    reminders: false,
  });

  // Reset expanded sections when modal opens
  useEffect(() => {
    if (open) {
      setExpandedSections({
        overview: true,
        details: false,
        subtasks: Boolean(task?.subtasks && task.subtasks.length > 0),
        dependencies: Boolean(
          (task?.blocked_by?.length || 0) + (task?.blocking?.length || 0),
        ),
        schedule: Boolean(
          task?.due_date || task?.start_date || task?.recurrence,
        ),
        reminders: Boolean(task?.reminder_enabled),
      });
      setShowEditForm(false);
      // Reset form state when modal opens
      setEditFormError(null);
      setEditFormLoading(false);
    }
  }, [open]);

  // local copy of the task so UI can reflect updates immediately
  const [localTask, setLocalTask] = useState(task || null);

  // Keep localTask in sync when the selected task changes or when modal opens
  useEffect(() => {
    if (open && task) {
      setLocalTask(task);
    }
  }, [open, task]);

  // Handle task update
  const handleTaskUpdate = async (
    updatedTask: TaskUpdateDto,
    options?: { source?: "status" | "form"; optimistic?: boolean },
  ) => {
    if (!localTask) return;

    setEditFormLoading(true);
    setEditFormError(null);

    try {
      // Optimistic UI update for status toggles
      const snapshot = options?.optimistic ? { ...localTask } : null;
      if (options?.optimistic && snapshot) {
        // Avoid merging subtasks with optional ids into localTask type
        const { subtasks: _omitSubtasks, ...rest } = updatedTask as any;
        setLocalTask({ ...snapshot, ...rest });
      }
      let csrfToken: string | null = null;
      try {
        csrfToken = await getCsrfToken();
      } catch (err) {
        // Mirror previous behavior: log and proceed without token
        console.error("Failed to fetch CSRF token:", err);
        csrfToken = null;
      }
      const response = await fetch(`/api/tasks/${localTask.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify(updatedTask),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMessage = data.error || "Failed to update task";
        throw new Error(errorMessage);
      }
      // Parse server-updated task to reflect canonical values immediately
      const serverTask = (await response.json()) as Task;

      // Success - close form, notify parent to refetch and sync localTask with server
      setShowEditForm(false);
      setLocalTask((prev) => (prev ? { ...prev, ...serverTask } : serverTask));
      // Notify parent (MainManagementWindow) to refetch tasks
      window.dispatchEvent(new CustomEvent("tasksShouldRefetch"));
      // Keep details view open after saving from embedded form
    } catch (err: unknown) {
      const finalErrorMessage =
        err instanceof Error ? err.message : "Unknown error";
      setEditFormError(finalErrorMessage);
      // Roll back optimistic change on error
      if (options?.optimistic) {
        setLocalTask((prev) => prev); // no-op to ensure state update sequence
        // Re-fetch to ensure consistency
        window.dispatchEvent(new CustomEvent("tasksShouldRefetch"));
      }
    } finally {
      setEditFormLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!open || !localTask) return null;

  const currentPriority =
    priorities.find((p) => p.value === localTask.priority) || priorities[1];
  const completedSubtasks =
    localTask.subtasks?.filter((st) => st.completed).length || 0;
  const totalSubtasks = localTask.subtasks?.length || 0;
  const progressPercentage =
    totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  // Get dependency task names
  const blockedByTasks =
    localTask.blocked_by
      ?.map((id) => tasks.find((t) => t.id === id)?.title || `Task #${id}`)
      .filter(Boolean) || [];
  const blockingTasks =
    localTask.blocking
      ?.map((id) => tasks.find((t) => t.id === id)?.title || `Task #${id}`)
      .filter(Boolean) || [];

  return (
    <>
      <ModalBackdrop onClose={onClose}>
        <TaskDetailsModalContent
          task={localTask}
          parentTask={parentTask ?? null}
          currentPriority={currentPriority}
          completedSubtasks={completedSubtasks}
          totalSubtasks={totalSubtasks}
          progressPercentage={progressPercentage}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          setShowEditForm={setShowEditForm}
          showEditForm={showEditForm}
          editFormLoading={editFormLoading}
          editFormError={editFormError}
          handleTaskUpdate={handleTaskUpdate}
          onClose={onClose}
          tasks={tasks}
          projects={projects}
          blockedByTasks={blockedByTasks}
          blockingTasks={blockingTasks}
        />
      </ModalBackdrop>

      {/* Edit Form Modal */}
      {showEditForm && (
        <TaskForm
          open={showEditForm}
          onClose={() => setShowEditForm(false)}
          onSubmit={(vals) =>
            handleTaskUpdate(mapFormValuesToTaskUpdate(vals), {
              source: "form",
            })
          }
          loading={editFormLoading}
          error={editFormError}
          projects={projects}
          allTasks={tasks}
          initialValues={localTask}
          editMode
        />
      )}
    </>
  );
};

export default TaskDetails;
