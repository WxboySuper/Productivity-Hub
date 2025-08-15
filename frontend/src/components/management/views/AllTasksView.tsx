import React from "react";
import type { Task } from "../../../hooks/useTasks";
import type { Project } from "../../../hooks/useProjects";

export interface AllTasksViewProps {
  tasks: Task[];
  projects: Project[];
  loading: boolean;
  error: string | null;
  onToggle: (taskId: number) => void;
  onOpen: (task: Task) => void;
  onDelete: (taskId: number, e?: React.MouseEvent<HTMLButtonElement>) => void;
  onAddFirstTask?: () => void;
}

export const AllTasksView: React.FC<AllTasksViewProps> = ({
  tasks,
  projects,
  loading,
  error,
  onToggle,
  onOpen,
  onDelete,
  onAddFirstTask,
}) => {
  const topLevelTasks = tasks.filter((t) => t.parent_id === null);

  const isTaskCheckboxDisabled = (task: Task): boolean =>
    Boolean(
      task.subtasks &&
        task.subtasks.length > 0 &&
        task.subtasks.some((st) => !st.completed),
    );
  const getTaskCheckboxTitle = (task: Task): string =>
    isTaskCheckboxDisabled(task) ? "Complete all subtasks first" : "";

  const TaskCard = ({ task }: { task: Task }) => (
    <div className="phub-item-card">
      <div className="phub-item-content">
        <div className="phub-item-header">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task.id)}
            className="mr-3 w-5 h-5 accent-blue-600"
            disabled={isTaskCheckboxDisabled(task)}
            title={getTaskCheckboxTitle(task)}
          />
          <button
            className={`phub-item-title cursor-pointer ${task.completed ? "line-through opacity-60" : ""}`}
            onClick={() => onOpen(task)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onOpen(task);
            }}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              margin: 0,
              textAlign: "left",
            }}
            aria-label={`View details for ${task.title}`}
          >
            {task.title}
          </button>
          <button
            className="text-sm px-3 py-1 rounded transition-colors font-semibold"
            onClick={(e) => onDelete(task.id, e)}
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
          <span className="phub-item-badge">
            {task.projectId
              ? `📁 ${projects.find((p) => p.id === task.projectId)?.name || "Unknown"}`
              : "⚡ Quick Task"}
          </span>
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
    <div className="phub-content-section" aria-live="polite">
      <div className="phub-section-header">
        <h2 className="phub-section-title">All Tasks</h2>
        <p className="phub-section-subtitle">Your complete task overview</p>
      </div>
      {loading && <div className="phub-loading">Loading tasks...</div>}
      {error && <div className="phub-error">⚠️ {error}</div>}
      {!loading && !error && topLevelTasks.length === 0 ? (
        <div className="phub-empty-state">
          <div className="phub-empty-icon">📋</div>
          <h3 className="phub-empty-title">No tasks found</h3>
          <p className="phub-empty-subtitle">
            Start by adding a new task to get productive!
          </p>
          {onAddFirstTask && (
            <button className="phub-action-btn" onClick={onAddFirstTask}>
              <span>✨</span>
              Add Your First Task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {topLevelTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllTasksView;
