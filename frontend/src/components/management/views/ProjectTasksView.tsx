import React from "react";
import type { Task } from "../../../hooks/useTasks";
import type { Project } from "../../../hooks/useProjects";

export interface ProjectTasksViewProps {
  tasks: Task[];
  selectedProject: Project;
  loading: boolean;
  error: string | null;
  onToggle: (taskId: number) => void;
  onOpen: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onAddTask: () => void;
}

const ProjectTasksView: React.FC<ProjectTasksViewProps> = ({
  tasks,
  selectedProject,
  loading,
  error,
  onToggle,
  onOpen,
  onEdit,
  onDelete,
  onAddTask,
}) => {
  const projectTasks = tasks.filter(
    (t) => t.projectId === selectedProject.id && t.parent_id === null,
  );

  const isTaskCheckboxDisabled = (task: Task): boolean =>
    Boolean(
      task.subtasks &&
        task.subtasks.length > 0 &&
        task.subtasks.some((st) => !st.completed),
    );
  const getTaskCheckboxTitle = (task: Task): string =>
    isTaskCheckboxDisabled(task) ? "Complete all subtasks first" : "";

  if (!loading && !error && projectTasks.length === 0) {
    return (
      <div className="phub-empty-state">
        <div className="phub-empty-icon">📝</div>
        <h3 className="phub-empty-title">No tasks for this project</h3>
        <p className="phub-empty-subtitle">
          Add a task to start making progress on this project!
        </p>
        <button className="phub-action-btn" onClick={onAddTask}>
          <span>📝</span>
          Add Task
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projectTasks.map((task) => (
        <div key={task.id} className="phub-item-card">
          <div className="phub-item-content">
            <div className="phub-item-header">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggle(task.id)}
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
      ))}
    </div>
  );
};

export default ProjectTasksView;
