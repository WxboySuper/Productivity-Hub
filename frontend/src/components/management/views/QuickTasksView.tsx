import React from "react";
import type { Task } from "../../../hooks/useTasks";

export interface QuickTasksViewProps {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  onToggle: (taskId: number) => void;
  onOpen: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
}

const QuickTasksView: React.FC<QuickTasksViewProps> = ({
  tasks,
  loading,
  error,
  onToggle,
  onOpen,
  onEdit,
  onDelete,
}) => {
  const quickTasks = tasks.filter((t) => !t.projectId && t.parent_id === null);

  const isTaskCheckboxDisabled = (task: Task): boolean =>
    Boolean(
      task.subtasks &&
        task.subtasks.length > 0 &&
        task.subtasks.some((st) => !st.completed),
    );
  const getTaskCheckboxTitle = (task: Task): string =>
    isTaskCheckboxDisabled(task) ? "Complete all subtasks first" : "";

  const QuickTaskCard = ({ task }: { task: Task }) => (
    <div className="phub-item-card">
      <div className="phub-item-content">
        <div className="phub-item-header">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={(e) => {
              e.stopPropagation();
              onToggle(task.id);
            }}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            disabled={isTaskCheckboxDisabled(task)}
            title={getTaskCheckboxTitle(task)}
          />
          <button
            className="phub-item-title cursor-pointer flex-1"
            onClick={() => onOpen(task)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onOpen(task);
            }}
            style={{
              textDecoration: task.completed ? "line-through" : "none",
              opacity: task.completed ? 0.6 : 1,
              background: "none",
              border: "none",
              padding: 0,
              margin: 0,
              textAlign: "left",
              width: "100%",
            }}
            aria-label={`View details for ${task.title}`}
          >
            {task.title}
          </button>
          <button
            className="phub-action-btn-secondary"
            onClick={() => onEdit(task)}
            style={{ padding: "0.5rem", fontSize: "0.8rem" }}
          >
            Edit
          </button>
          <button
            className="px-2 py-1 rounded transition-colors font-semibold"
            onClick={() => onDelete(task.id)}
            style={{
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "white",
              border: "1px solid #dc2626",
            }}
          >
            Delete
          </button>
        </div>
        <div className="phub-item-meta">
          {task.subtasks && task.subtasks.length > 0 && (
            <span className="phub-item-badge">
              📝 {task.subtasks.length} subtask
              {task.subtasks.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="phub-content-section" aria-live="polite">
        <div className="phub-section-header">
          <h2 className="phub-section-title">Quick Tasks</h2>
          <p className="phub-section-subtitle">Your rapid-fire action items</p>
        </div>
        {loading && <div className="phub-loading">Loading tasks...</div>}
        {error && <div className="phub-error">⚠️ {error}</div>}
        {!loading && !error && quickTasks.length === 0 ? (
          <div className="phub-empty-state">
            <div className="phub-empty-icon">⚡</div>
            <h3 className="phub-empty-title">No quick tasks found</h3>
            <p className="phub-empty-subtitle">
              Add a quick task for something you need to do soon!
            </p>
          </div>
        ) : null}
      </div>
      {!loading && !error && quickTasks.length > 0 && (
        <div className="space-y-4">
          {quickTasks.map((task) => (
            <QuickTaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </>
  );
};

export default QuickTasksView;
