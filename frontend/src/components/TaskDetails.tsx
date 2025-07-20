import { useState, useEffect } from 'react';
import TaskForm from './TaskForm';
import '../styles/Task.css';

// ModalBackdrop: handles backdrop click, keyboard accessibility, and wraps children
function ModalBackdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
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
        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {children}
    </div>
  );
}

// TaskDetailsModalContent: receives all props and renders the modal content
// TaskDetailsHeader: displays the modal header
function TaskDetailsHeader({ task, parentTask, setShowEditForm, onClose }: {
  task: Task;
  parentTask: { id: number; title: string } | null;
  setShowEditForm: (open: boolean) => void;
  onClose: () => void;
}) {
  return (
    <div className="modern-form-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--modern-space-md)' }}>
        <span style={{ fontSize: '1.5rem' }}>{task.completed ? '✅' : '📝'}</span>
        <div>
          <h2 className="modern-form-title">{task.title}</h2>
          <p className="modern-form-subtitle">
            {task.projectName ? `📁 ${task.projectName}` : '⚡ Quick Task'}
            {parentTask && ` • Subtask of "${parentTask.title}"`}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--modern-space-sm)' }}>
        <button
          className="modern-btn modern-btn-secondary"
          onClick={() => setShowEditForm(true)}
          type="button"
        >
          ✏️ Edit
        </button>
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
function TaskDetailsActions({ onClose, setShowEditForm }: {
  onClose: () => void;
  setShowEditForm: (open: boolean) => void;
}) {
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
        onClick={() => setShowEditForm(true)}
        aria-label="Edit Task"
      >
        <span>✏️</span>
        Edit Details
      </button>
    </div>
  );
}
// TaskRemindersSection: displays reminders in an expandable section
function TaskRemindersSection({ reminder_enabled, reminder_time, expanded, toggle }: {
  reminder_enabled?: boolean;
  reminder_time?: string;
  expanded: boolean;
  toggle: () => void;
}) {
  if (!reminder_enabled) return null;
  return (
    <div className="modern-expandable">
      <button
        type="button"
        className={`modern-expandable-header ${expanded ? 'expanded' : ''}`}
        onClick={toggle}
      >
        <span className="modern-expandable-icon">▶️</span>
        <h3 className="modern-expandable-title">Reminders</h3>
        <span className="modern-expandable-count">(Enabled)</span>
      </button>
      <div className={`modern-expandable-content ${expanded ? 'expanded' : ''}`}>
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
function TaskDependenciesSection({ blockedByTasks, blockingTasks, expanded, toggle }: {
  blockedByTasks: string[];
  blockingTasks: string[];
  expanded: boolean;
  toggle: () => void;
}) {
  const total = blockedByTasks.length + blockingTasks.length;
  if (!total) return null;
  return (
    <div className="modern-expandable">
      <button
        type="button"
        className={`modern-expandable-header ${expanded ? 'expanded' : ''}`}
        onClick={toggle}
      >
        <span className="modern-expandable-icon">▶️</span>
        <h3 className="modern-expandable-title">Dependencies</h3>
        <span className="modern-expandable-count">({total} items)</span>
      </button>
      <div className={`modern-expandable-content ${expanded ? 'expanded' : ''}`}>
        <div className="modern-dependencies-grid">
          {blockedByTasks.length > 0 && (
            <div className="modern-dependency-section">
              <span className="modern-dependency-label">🚫 Blocked By</span>
              <div className="modern-dependency-list">
                {blockedByTasks.map((taskName, index) => (
                  <span key={index} className="modern-dependency-chip blocked-by">
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
                {blockingTasks.map((taskName, index) => (
                  <span key={index} className="modern-dependency-chip blocking">
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
// TaskScheduleSection: displays schedule info in an expandable section
function TaskScheduleSection({ start_date, due_date, recurrence, next_occurrence, expanded, toggle }: {
  start_date?: string;
  due_date?: string;
  recurrence?: string;
  next_occurrence?: string;
  expanded: boolean;
  toggle: () => void;
}) {
  if (!(due_date || start_date || recurrence)) return null;
  return (
    <div className="modern-expandable">
      <button
        type="button"
        className={`modern-expandable-header ${expanded ? 'expanded' : ''}`}
        onClick={toggle}
      >
        <span className="modern-expandable-icon">▶️</span>
        <h3 className="modern-expandable-title">Schedule</h3>
      </button>
      <div className={`modern-expandable-content ${expanded ? 'expanded' : ''}`}>
        <div className="modern-schedule-grid">
          {start_date && (
            <div className="modern-schedule-item">
              <span className="modern-schedule-label">📅 Start Date</span>
              <span className="modern-schedule-value">{new Date(start_date).toLocaleString()}</span>
            </div>
          )}
          {due_date && (
            <div className="modern-schedule-item">
              <span className="modern-schedule-label">🎯 Due Date</span>
              <span className="modern-schedule-value">{new Date(due_date).toLocaleString()}</span>
            </div>
          )}
          {recurrence && (
            <div className="modern-schedule-item">
              <span className="modern-schedule-label">🔄 Recurrence</span>
              <span className="modern-schedule-value">{recurrence}</span>
            </div>
          )}
          {next_occurrence && (
            <div className="modern-schedule-item">
              <span className="modern-schedule-label">⏭️ Next Occurrence</span>
              <span className="modern-schedule-value">{new Date(next_occurrence).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// TaskSubtasksSection: displays subtasks in an expandable section
function TaskSubtasksSection({ subtasks, completedSubtasks, totalSubtasks, expanded, toggle }: {
  subtasks: Subtask[];
  completedSubtasks: number;
  totalSubtasks: number;
  expanded: boolean;
  toggle: () => void;
}) {
  if (!totalSubtasks) return null;
  return (
    <div className="modern-expandable">
      <button
        type="button"
        className={`modern-expandable-header ${expanded ? 'expanded' : ''}`}
        onClick={toggle}
      >
        <span className="modern-expandable-icon">▶️</span>
        <h3 className="modern-expandable-title">Subtasks</h3>
        <span className="modern-expandable-count">({completedSubtasks}/{totalSubtasks} completed)</span>
      </button>
      <div className={`modern-expandable-content ${expanded ? 'expanded' : ''}`}>
        <div className="modern-subtasks-list">
          {subtasks.map((subtask) => (
            <div key={subtask.id} className="modern-subtask-detail-item">
              <input
                type="checkbox"
                className="modern-subtask-checkbox"
                checked={subtask.completed}
                readOnly
              />
              <span className={`modern-subtask-text ${subtask.completed ? 'completed' : ''}`}>
                {subtask.title}
              </span>
              {subtask.completed && <span className="modern-subtask-badge">✓</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// TaskDescriptionSection: displays the description in an expandable section
function TaskDescriptionSection({ description, expanded, toggle }: {
  description: string;
  expanded: boolean;
  toggle: () => void;
}) {
  if (!description) return null;
  return (
    <div className="modern-expandable">
      <button
        type="button"
        className={`modern-expandable-header ${expanded ? 'expanded' : ''}`}
        onClick={toggle}
      >
        <span className="modern-expandable-icon">▶️</span>
        <h3 className="modern-expandable-title">Description</h3>
      </button>
      <div className={`modern-expandable-content ${expanded ? 'expanded' : ''}`}>
        <div className="modern-description-content">
          {description}
        </div>
      </div>
    </div>
  );
}
// TaskOverviewSection: displays status, priority, progress, due date, and progress bar
// Individual chip components for overview grid
function StatusChip({ completed }: { completed: boolean }) {
  return (
    <div className="modern-detail-chip">
      <div className="modern-detail-chip-icon">{completed ? '✅' : '⭕'}</div>
      <div className="modern-detail-chip-content">
        <div className="modern-detail-chip-label">Status</div>
        <div className="modern-detail-chip-value">{completed ? 'Completed' : 'In Progress'}</div>
      </div>
    </div>
  );
}

function PriorityChip({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="modern-detail-chip">
      <div className="modern-detail-chip-icon">{icon}</div>
      <div className="modern-detail-chip-content">
        <div className="modern-detail-chip-label">Priority</div>
        <div className="modern-detail-chip-value">{label}</div>
      </div>
    </div>
  );
}

function ProgressChip({ completedSubtasks, totalSubtasks }: { completedSubtasks: number; totalSubtasks: number }) {
  return (
    <div className="modern-detail-chip">
      <div className="modern-detail-chip-icon">📊</div>
      <div className="modern-detail-chip-content">
        <div className="modern-detail-chip-label">Progress</div>
        <div className="modern-detail-chip-value">{completedSubtasks}/{totalSubtasks}</div>
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
        <div className="modern-detail-chip-value">{new Date(due_date).toLocaleDateString()}</div>
      </div>
    </div>
  );
}
function TaskOverviewSection({ task, currentPriority, completedSubtasks, totalSubtasks, progressPercentage }: {
  task: Task;
  currentPriority: { value: number; label: string; icon: string; color: string };
  completedSubtasks: number;
  totalSubtasks: number;
  progressPercentage: number;
}) {
  return (
    <div className="modern-hero-section">
      <div className="modern-quick-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
        <StatusChip completed={task.completed} />
        <PriorityChip icon={currentPriority.icon} label={currentPriority.label} />
        {totalSubtasks > 0 && <ProgressChip completedSubtasks={completedSubtasks} totalSubtasks={totalSubtasks} />}
        {task.due_date && <DueDateChip due_date={task.due_date} />}
      </div>
      {/* Progress Bar for Subtasks */}
      {totalSubtasks > 0 && (
        <div style={{ marginTop: 'var(--modern-space-md)' }}>
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

interface TaskDetailsModalContentProps {
  task: Task;
  parentTask: { id: number; title: string } | null;
  currentPriority: { value: number; label: string; icon: string; color: string };
  completedSubtasks: number;
  totalSubtasks: number;
  progressPercentage: number;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  setShowEditForm: (open: boolean) => void;
  showEditForm: boolean;
  editFormLoading: boolean;
  editFormError: string | null;
  handleTaskUpdate: (updatedTask: { title: string; description: string }) => void;
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
  showEditForm,
  editFormLoading,
  editFormError,
  handleTaskUpdate,
  onClose,
  tasks,
  projects,
  blockedByTasks,
  blockingTasks,
}: TaskDetailsModalContentProps) {
  return (
    <div className="modern-form-container" style={{ maxWidth: '600px' }} data-testid="task-details">
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
            task={task}
            currentPriority={currentPriority}
            completedSubtasks={completedSubtasks}
            totalSubtasks={totalSubtasks}
            progressPercentage={progressPercentage}
          />
          {/* Description - Expandable */}
          <TaskDescriptionSection
            description={task.description || ''}
            expanded={expandedSections.details}
            toggle={() => toggleSection('details')}
          />
          {/* Subtasks - Expandable */}
          <TaskSubtasksSection
            subtasks={task.subtasks || []}
            completedSubtasks={completedSubtasks}
            totalSubtasks={totalSubtasks}
            expanded={expandedSections.subtasks}
            toggle={() => toggleSection('subtasks')}
          />
          {/* Schedule - Expandable */}
          <TaskScheduleSection
            start_date={task.start_date}
            due_date={task.due_date}
            recurrence={task.recurrence}
            next_occurrence={task.next_occurrence}
            expanded={expandedSections.schedule}
            toggle={() => toggleSection('schedule')}
          />
          {/* Dependencies - Expandable */}
          <TaskDependenciesSection
            blockedByTasks={blockedByTasks}
            blockingTasks={blockingTasks}
            expanded={expandedSections.dependencies}
            toggle={() => toggleSection('dependencies')}
          />
          {/* Reminders - Expandable */}
          <TaskRemindersSection
            reminder_enabled={task.reminder_enabled}
            reminder_time={task.reminder_time}
            expanded={expandedSections.reminders}
            toggle={() => toggleSection('reminders')}
          />
        </div>
      </div>
      {/* Actions */}
      <TaskDetailsActions onClose={onClose} setShowEditForm={setShowEditForm} />
      {/* Edit Form Modal */}
      {showEditForm && (
        <TaskForm
          open={showEditForm}
          onClose={() => setShowEditForm(false)}
          onSubmit={handleTaskUpdate}
          loading={editFormLoading}
          error={editFormError}
          projects={projects}
          allTasks={tasks}
          initialValues={task}
          editMode={true}
        />
      )}
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
  { value: 0, label: 'Low', icon: '🟢', color: '#10b981' },
  { value: 1, label: 'Medium', icon: '🟡', color: '#f59e0b' },
  { value: 2, label: 'High', icon: '🟠', color: '#ef4444' },
  { value: 3, label: 'Critical', icon: '🔴', color: '#dc2626' },
];

const TaskDetails: React.FC<TaskDetailsModalProps> = ({ 
  open, 
  onClose, 
  task, 
  onEdit, 
  parentTask, 
  tasks = [],
  projects = []
}) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormLoading, setEditFormLoading] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    details: false,
    subtasks: false,
    dependencies: false,
    schedule: false,
    reminders: false
  });

  // Reset expanded sections when modal opens
  useEffect(() => {
    if (open) {
      setExpandedSections({
        overview: true,
        details: false,
        subtasks: Boolean(task?.subtasks && task.subtasks.length > 0),
        dependencies: Boolean((task?.blocked_by?.length || 0) + (task?.blocking?.length || 0)),
        schedule: Boolean(task?.due_date || task?.start_date || task?.recurrence),
        reminders: Boolean(task?.reminder_enabled)
      });
      setShowEditForm(false);
      // Reset form state when modal opens
      setEditFormError(null);
      setEditFormLoading(false);
    }
  }, [open, task]);

  // Helper function to ensure CSRF token
  const ensureCsrfToken = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/csrf-token`, {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        return data.csrf_token;
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
    return null;
  };

  // Handle task update
  const handleTaskUpdate = async (updatedTask: Partial<Task>) => {
    if (!task) return;
    
    setEditFormLoading(true);
    setEditFormError(null);
    
    try {
      const csrfToken = await ensureCsrfToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/tasks/${task.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify(updatedTask),
      });
      
      if (!response.ok) {
        const data = await response.json();
        const errorMessage = data.error || 'Failed to update task';
        throw new Error(errorMessage);
      }
      
      // Success - close form and call callback
      setShowEditForm(false);
      if (onEdit) onEdit();
      
    } catch (err: unknown) {
      const finalErrorMessage = err instanceof Error ? err.message : 'Unknown error';
      setEditFormError(finalErrorMessage);
    } finally {
      setEditFormLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!open || !task) return null;

  const currentPriority = priorities.find(p => p.value === task.priority) || priorities[1];
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  // Get dependency task names
  const blockedByTasks = task.blocked_by?.map(id => tasks.find(t => t.id === id)?.title || `Task #${id}`).filter(Boolean) || [];
  const blockingTasks = task.blocking?.map(id => tasks.find(t => t.id === id)?.title || `Task #${id}`).filter(Boolean) || [];

  return (
    <>
      <ModalBackdrop onClose={onClose}>
        <TaskDetailsModalContent
          task={task}
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
          onSubmit={handleTaskUpdate}
          loading={editFormLoading}
          error={editFormError}
          projects={projects}
          allTasks={tasks}
          initialValues={task}
          editMode={true}
        />
      )}
    </>
  );
};

export default TaskDetails;
