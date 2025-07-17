import React, { useState, useEffect } from 'react';
import TaskForm from './TaskForm';
import '../styles/Task.css';

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
  tasks: any[];
  projects?: any[]; // Add projects prop
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
  const handleTaskUpdate = async (updatedTask: any) => {
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
      <div 
        className="modern-modal-backdrop" 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="modern-form-container" style={{ maxWidth: '600px' }} data-testid="task-details">
          {/* Header */}
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
              >
                ×
              </button>
            </div>
          </div>

          <div className="modern-form-content">
            <div className="modern-form-body">

              {/* Overview Section - Always Visible */}
              <div className="modern-hero-section">
                <div className="modern-quick-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
                  {/* Status */}
                  <div className="modern-detail-chip">
                    <div className="modern-detail-chip-icon">{task.completed ? '✅' : '⭕'}</div>
                    <div className="modern-detail-chip-content">
                      <div className="modern-detail-chip-label">Status</div>
                      <div className="modern-detail-chip-value">{task.completed ? 'Completed' : 'In Progress'}</div>
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="modern-detail-chip">
                    <div className="modern-detail-chip-icon">{currentPriority.icon}</div>
                    <div className="modern-detail-chip-content">
                      <div className="modern-detail-chip-label">Priority</div>
                      <div className="modern-detail-chip-value">{currentPriority.label}</div>
                    </div>
                  </div>

                  {/* Progress (if has subtasks) */}
                  {totalSubtasks > 0 && (
                    <div className="modern-detail-chip">
                      <div className="modern-detail-chip-icon">📊</div>
                      <div className="modern-detail-chip-content">
                        <div className="modern-detail-chip-label">Progress</div>
                        <div className="modern-detail-chip-value">{completedSubtasks}/{totalSubtasks}</div>
                      </div>
                    </div>
                  )}

                  {/* Due Date */}
                  {task.due_date && (
                    <div className="modern-detail-chip">
                      <div className="modern-detail-chip-icon">🎯</div>
                      <div className="modern-detail-chip-content">
                        <div className="modern-detail-chip-label">Due Date</div>
                        <div className="modern-detail-chip-value">
                          {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
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

              {/* Description - Expandable */}
              {task.description && (
                <div className="modern-expandable">
                  <button
                    type="button"
                    className={`modern-expandable-header ${expandedSections.details ? 'expanded' : ''}`}
                    onClick={() => toggleSection('details')}
                  >
                    <span className="modern-expandable-icon">▶️</span>
                    <h3 className="modern-expandable-title">Description</h3>
                  </button>
                  <div className={`modern-expandable-content ${expandedSections.details ? 'expanded' : ''}`}>
                    <div className="modern-description-content">
                      {task.description}
                    </div>
                  </div>
                </div>
              )}

              {/* Subtasks - Expandable */}
              {totalSubtasks > 0 && (
                <div className="modern-expandable">
                  <button
                    type="button"
                    className={`modern-expandable-header ${expandedSections.subtasks ? 'expanded' : ''}`}
                    onClick={() => toggleSection('subtasks')}
                  >
                    <span className="modern-expandable-icon">▶️</span>
                    <h3 className="modern-expandable-title">Subtasks</h3>
                    <span className="modern-expandable-count">({completedSubtasks}/{totalSubtasks} completed)</span>
                  </button>
                  <div className={`modern-expandable-content ${expandedSections.subtasks ? 'expanded' : ''}`}>
                    <div className="modern-subtasks-list">
                      {task.subtasks?.map((subtask) => (
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
              )}

              {/* Schedule - Expandable */}
              {(task.due_date || task.start_date || task.recurrence) && (
                <div className="modern-expandable">
                  <button
                    type="button"
                    className={`modern-expandable-header ${expandedSections.schedule ? 'expanded' : ''}`}
                    onClick={() => toggleSection('schedule')}
                  >
                    <span className="modern-expandable-icon">▶️</span>
                    <h3 className="modern-expandable-title">Schedule</h3>
                  </button>
                  <div className={`modern-expandable-content ${expandedSections.schedule ? 'expanded' : ''}`}>
                    <div className="modern-schedule-grid">
                      {task.start_date && (
                        <div className="modern-schedule-item">
                          <span className="modern-schedule-label">📅 Start Date</span>
                          <span className="modern-schedule-value">
                            {new Date(task.start_date).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {task.due_date && (
                        <div className="modern-schedule-item">
                          <span className="modern-schedule-label">🎯 Due Date</span>
                          <span className="modern-schedule-value">
                            {new Date(task.due_date).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {task.recurrence && (
                        <div className="modern-schedule-item">
                          <span className="modern-schedule-label">🔄 Recurrence</span>
                          <span className="modern-schedule-value">{task.recurrence}</span>
                        </div>
                      )}
                      {task.next_occurrence && (
                        <div className="modern-schedule-item">
                          <span className="modern-schedule-label">⏭️ Next Occurrence</span>
                          <span className="modern-schedule-value">
                            {new Date(task.next_occurrence).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Dependencies - Expandable */}
              {(blockedByTasks.length > 0 || blockingTasks.length > 0) && (
                <div className="modern-expandable">
                  <button
                    type="button"
                    className={`modern-expandable-header ${expandedSections.dependencies ? 'expanded' : ''}`}
                    onClick={() => toggleSection('dependencies')}
                  >
                    <span className="modern-expandable-icon">▶️</span>
                    <h3 className="modern-expandable-title">Dependencies</h3>
                    <span className="modern-expandable-count">
                      ({blockedByTasks.length + blockingTasks.length} items)
                    </span>
                  </button>
                  <div className={`modern-expandable-content ${expandedSections.dependencies ? 'expanded' : ''}`}>
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
              )}

              {/* Reminders - Expandable */}
              {task.reminder_enabled && (
                <div className="modern-expandable">
                  <button
                    type="button"
                    className={`modern-expandable-header ${expandedSections.reminders ? 'expanded' : ''}`}
                    onClick={() => toggleSection('reminders')}
                  >
                    <span className="modern-expandable-icon">▶️</span>
                    <h3 className="modern-expandable-title">Reminders</h3>
                    <span className="modern-expandable-count">(Enabled)</span>
                  </button>
                  <div className={`modern-expandable-content ${expandedSections.reminders ? 'expanded' : ''}`}>
                    <div className="modern-reminder-info">
                      {task.reminder_time && (
                        <div className="modern-reminder-item">
                          <span className="modern-reminder-icon">🔔</span>
                          <span className="modern-reminder-text">
                            Reminder set for {new Date(task.reminder_time).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Actions */}
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
            >
              <span>✏️</span>
              Edit Task
            </button>
          </div>
        </div>
      </div>

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
