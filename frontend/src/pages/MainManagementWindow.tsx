import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import TaskForm from '../components/TaskForm';
import ProjectForm from '../components/ProjectForm';
import ConfirmDialog from '../components/ConfirmDialog';
import TaskDetails from '../components/TaskDetails';
import BackgroundSwitcher from '../components/BackgroundSwitcher';
import { useAuth } from '../auth';
import { useBackground } from '../context/BackgroundContext';
import { useToast } from '../components/ToastProvider';
import { useProjects, type Project } from '../hooks/useProjects';
import { ensureCsrfToken, type Task } from '../hooks/useTasks';
import '../styles/ProjectForm.css';
import '../styles/PageLayouts.css';
import '../styles/MainLayout.css';
import type { TaskFormValues } from '../components/TaskForm';

// Sidebar component
const Sidebar: React.FC<{
  collapsed: boolean;
  onCollapse: () => void;
  items: { label: string; icon?: React.ReactNode; onClick: () => void; active?: boolean; variant?: 'danger' }[];
}> = ({ collapsed, onCollapse, items }) => (
  <aside className={`phub-sidebar ${collapsed ? 'phub-sidebar-collapsed' : ''}`}>
    <button
      className="phub-sidebar-toggle"
      onClick={items[0].onClick}
      style={{ marginBottom: '1rem' }}
    >
      {items[0].icon} {!collapsed && items[0].label}
    </button>
    <button
      className="phub-sidebar-toggle"
      onClick={onCollapse}
      style={{
        background: 'rgba(59, 130, 246, 0.1)',
        fontSize: '0.9rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: collapsed ? '3rem' : 'auto',
        minWidth: '3rem',
        padding: collapsed ? '0.75rem' : '0.75rem 1rem',
        border: '1px solid rgba(59, 130, 246, 0.2)'
      }}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {collapsed ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5">
          <polyline points="9,18 15,12 9,6"></polyline>
        </svg>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" style={{ marginRight: '0.5rem' }}>
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
          <span style={{ color: '#3b82f6', fontSize: '0.875rem', fontWeight: '600' }}>Collapse</span>
        </>
      )}
    </button>
    <nav className="phub-sidebar-nav">{items.slice(1).map((item) => (
        <button
          key={item.label}
          className={`phub-sidebar-item ${item.active ? 'phub-sidebar-item-active' : ''}`}
          onClick={item.onClick}
          style={item.variant === 'danger' ? {
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: 'white',
            border: '1px solid #dc2626'
          } : {}}
        >
          {item.icon}
          {!collapsed && <span className="phub-sidebar-label">{item.label}</span>}
        </button>
      ))}
    </nav>
  </aside>
);

// skipcq: JS-R1005
const MainManagementWindow: React.FC = () => {
  // --- All hooks/state and variables first ---
  const { logout } = useAuth();
  const { backgroundType, setBackgroundType } = useBackground();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const navigate = useNavigate();
  const { projects, loading: projectsLoading, error: projectsError, refetch: refetchProjects } = useProjects();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<'all' | 'quick' | 'projects'>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formLoading] = useState(false);
  const [formError] = useState<string | null>(null);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFormLoading, setTaskFormLoading] = useState(false);
  const [taskFormError, setTaskFormError] = useState<string | null>(null);

  const [editTask, setEditTask] = useState<Task | null>(null); // Track task being edited

  // Local fetchTasks implementation (copied from useTasks.ts)
  const fetchTasks = useCallback(async () => {
    setTasksLoading(true);
    setTasksError(null);
    try {
      await ensureCsrfToken();
      const response = await fetch('/api/tasks', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      const tasks = Array.isArray(data) ? data : (data.tasks || []);
      // Normalize task data
      const normalizedTasks = tasks.map((task: Task) => ({
        ...task,
        projectId: typeof task.projectId !== 'undefined' ? task.projectId : task.project_id,
      }));
      setTasks(normalizedTasks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setTasksError(errorMessage);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  // Load tasks on mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // --- Handler functions for toggling and deleting tasks ---
  const handleToggleTask = useCallback(async (id: number) => {
    setTaskFormLoading(true);
    setTaskFormError(null);
    try {
      const task = tasks.find((t: Task) => t.id === id);
      if (!task) throw new Error('Task not found');
      const csrfToken = await ensureCsrfToken();
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update task');
      }
      fetchTasks();
    } catch (err: unknown) {
      setTaskFormError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTaskFormLoading(false);
    }
  }, [tasks]);

  const handleDeleteTask = useCallback(async (id: number) => {
    setTaskFormLoading(true);
    setTaskFormError(null);
    try {
      const csrfToken = await ensureCsrfToken();
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete task');
      }
      fetchTasks();
    } catch (err: unknown) {
      setTaskFormError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTaskFormLoading(false);
    }
  }, []);

  // --- Helper functions that use state/hooks ---
  const getTaskWithProject = (task: Task) => {
    const projectId = typeof task.projectId !== 'undefined' ? task.projectId : task.project_id;
    const project = projects.find(p => p.id === projectId);
    return {
      ...task,
      projectName: project ? project.name : undefined,
      projectId,
      project_id: projectId,
    };
  };

  const openTaskForm = (task: Task | null = null) => {
    setEditTask(task ? getTaskWithProject(task) : null);
    setShowTaskForm(true);
  };

  // --- Handler/helper function declarations are now unique and above their usage ---
  const handleTaskToggle = (taskId: number) => {
    handleToggleTask(taskId);
  };

  const handleTaskTitleClick = (task: Task) => {
    setSelectedTask(getTaskWithProject(task));
    setTaskDetailsOpen(true);
  };

  const handleTaskEdit = (task: Task) => {
    /* v8 ignore start */
    openTaskForm(task);
  };
  /* v8 ignore stop */

  const handleTaskDelete = (taskId: number) => {
    handleDeleteTask(taskId);
  };
  const handleDeleteProject = (project: Project) => {
    setDeleteProject(project);
    setDeleteError(null);
  };
  const confirmDeleteProject = async () => {
  /* v8 ignore next */
  if (!deleteProject) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const csrfToken = await ensureCsrfToken();
      const response = await fetch(`/api/projects/${deleteProject.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {

          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete project');
      }
      /* v8 ignore start */
      await refetchProjects(); // Refetch projects from the hook
      setDeleteProject(null);
      setSelectedProject(null);
      /* v8 ignore stop */
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDeleteLoading(false);
    }
  };
  const handleCloseForm = useCallback(() => setShowForm(false), []);
  const handleCloseEdit = useCallback(() => setEditProject(null), []);
  const handleCancelDelete = useCallback(() => setDeleteProject(null), []);

  const handleAddNewTask = () => {
    setShowTaskForm(true);
  };

  // Add this function above handleTaskFormSubmit
  const handleCreateTask = async (task: Task) => {
    setTaskFormLoading(true);
    setTaskFormError(null);
    try {
      const csrfToken = await ensureCsrfToken();
      const response = await fetch('/api/tasks', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify(task),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create task');
      }
      setShowTaskForm(false);
      setEditTask(null);
      fetchTasks();
    } catch (err: unknown) {
      setTaskFormError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTaskFormLoading(false);
    }
  };

  // After editing a task, re-open the details modal for the updated task
  const handleUpdateTask = async (task: Task) => {
    /* v8 ignore start */
    if (!editTask) return;
    setTaskFormLoading(true);
    setTaskFormError(null);
    try {
      const csrfToken = await ensureCsrfToken();
      const response = await fetch(`/api/tasks/${editTask.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify(task),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update task');
      }
      setShowTaskForm(false);
      setEditTask(null);
      fetchTasks();
      // Reopen details modal for updated task
      try {
        const updatedTaskRes = await fetch(`/api/tasks/${editTask.id}`);
        if (updatedTaskRes.ok) {
          const updatedTask = await updatedTaskRes.json();
          setSelectedTask(getTaskWithProject(updatedTask));
          setTaskDetailsOpen(true);
        }
      } catch (fetchError) {
        // If fetching updated task fails, just log it and continue
        console.warn('Failed to fetch updated task details:', fetchError);
      }
    } catch (err: unknown) {
      setTaskFormError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTaskFormLoading(false);
    }
  };
  /* v8 ignore stop */

  // Add handler functions for TaskForm onSubmit
  function handleTaskFormSubmit(task: TaskFormValues) {
    // Accept projectId as string | number | undefined
    const completed = task.completed ?? false;
    let projectId: number | undefined;
    if (task.projectId !== undefined) {
      if (typeof task.projectId === 'string') {
        const parsed = parseInt(task.projectId, 10);
        projectId = isNaN(parsed) ? undefined : parsed;
      } else if (typeof task.projectId === 'number') {
        projectId = task.projectId;
      }
    } else if (task.project_id !== undefined) {
      if (typeof task.project_id === 'string') {
        const parsed = parseInt(task.project_id, 10);
        projectId = isNaN(parsed) ? undefined : parsed;
      } else if (typeof task.project_id === 'number') {
        projectId = task.project_id;
      }
    }

    // Only include allowed fields for TaskFormValues
    const safeTask: Task = {
      id: typeof task.id === 'number' ? task.id : 0, // fallback to 0 if undefined, or handle as needed
      title: task.title ?? "",
      description: task.description ?? '', // Ensure description is present
      completed,
      projectId,
      // Only assign subtasks if they are of type Task[]
      ...(Array.isArray(task.subtasks) ? { subtasks: task.subtasks as Task[] } : {})
    };

    if (editTask) {
      handleUpdateTask(safeTask);
    } else {
      handleCreateTask(safeTask);
    }
  }

  // Logout handler that manages navigation
  const handleLogout = useCallback(async () => {
  /* v8 ignore start */
    try {
      showInfo('Signing out...', 'Please wait while we sign you out');
      const logoutSuccess = await logout();
      
      if (logoutSuccess) {
        showSuccess('Signed out successfully', 'You have been logged out of your account');
        navigate('/', { replace: true });
      } else {
        showWarning(
          'Logout incomplete', 
          'You appear to be signed out locally, but there may be an issue with the server session. Please try signing in again.'
        );
        // Still navigate to home since frontend is cleared
        navigate('/', { replace: true });
      }
    /* v8 ignore start */
    } catch (error) {
      console.error('Logout failed:', error);
      showError(
        'Logout failed', 
        error instanceof Error ? error.message : 'An unexpected error occurred during logout'
      );
      // Still navigate to home page since frontend state is cleared
      navigate('/', { replace: true });
    }
    /* v8 ignore stop */
  }, [logout, navigate, showSuccess, showError, showWarning, showInfo]);

  // Add handlers above sidebarItems
  const handleAllTasksClick = () => {
    setActiveView('all');
    setSelectedProject(null);
  };
  const handleQuickTasksClick = () => {
    setActiveView('quick');
    setSelectedProject(null);
  };
  const handleProjectsClick = () => {
    setActiveView('projects');
    setSelectedProject(null);
  };

  // --- Add handler functions for all arrow functions used in JSX props ---

  // For All Tasks TaskCard
  const handleTaskCardCheckboxChange = (task: Task) => {
    handleToggleTask(task.id);
  };
  const handleTaskCardTitleButtonClick = (task: Task) => {
    setSelectedTask(getTaskWithProject(task));
    setTaskDetailsOpen(true);
  };
  const handleTaskCardTitleButtonKeyDown = (task: Task, e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setSelectedTask(getTaskWithProject(task));
      setTaskDetailsOpen(true);
    }
  };
  const handleTaskCardDeleteButtonClick = (taskId: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    handleDeleteTask(taskId);
  };

  // For QuickTaskCard
  const handleQuickTaskCardCheckboxChange = (task: Task, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    handleToggleTask(task.id);
  };
  const handleQuickTaskCardTitleButtonClick = (task: Task) => {
    setSelectedTask(getTaskWithProject(task));
    setTaskDetailsOpen(true);
  };
  const handleQuickTaskCardTitleButtonKeyDown = (task: Task, e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setSelectedTask(getTaskWithProject(task));
      setTaskDetailsOpen(true);
    }
  };
  const handleQuickTaskCardEditButtonClick = (task: Task) => {
    openTaskForm(task);
  };
  const handleQuickTaskCardDeleteButtonClick = (taskId: number) => {
    handleDeleteTask(taskId);
  };

  // For Project Card
  const handleProjectCardClickWrapper = (project: Project) => {
    setSelectedProject(project);
  };
  const handleProjectCardKeyDownWrapper = (project: Project, e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setSelectedProject(project);
    }
  };
  const handleProjectDeleteButtonClickWrapper = (project: Project, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    handleDeleteProject(project);
  };

  // Sidebar items
  const sidebarItems = [
    {
      label: 'Add New',
      icon: <span className="text-xl">＋</span>,
      onClick: handleAddNewTask,
      active: false,
    },
    {
      label: 'All Tasks',
      icon: <span className="text-xl">📋</span>,
      onClick: handleAllTasksClick,
      active: activeView === 'all',
    },
    {
      label: 'Quick Tasks',
      icon: <span className="text-xl">⚡</span>,
      onClick: handleQuickTasksClick,
      active: activeView === 'quick',
    },
    {
      label: 'Projects',
      icon: <span className="text-xl">📁</span>,
      onClick: handleProjectsClick,
      active: activeView === 'projects',
    },
    {
      label: 'Sign Out',
      icon: <span className="text-xl">🚪</span>,
      onClick: handleLogout,
      active: false,
      variant: 'danger' as const,
    },
  ];

  // Main content logic
  let content: React.ReactNode = null;
  // --- Handlers for selected project actions (must be above JSX usage) ---
  const handleSelectedProjectEdit = () => {
    if (selectedProject) {
      setEditProject(selectedProject);
      setShowForm(false);
    }
  };
  const handleSelectedProjectDeleteButtonClick = () => {
    if (selectedProject) {
      setDeleteProject(selectedProject);
      setDeleteError(null);
    }
  };
  const handleProjectBackButtonClick = () => {
    setSelectedProject(null);
  };
  const handleCreateOrUpdateProject = () => {
    // TODO: Implement project create/update logic
    setShowForm(false);
    setEditProject(null);
  };

  if (activeView === 'all') {
    // Only show top-level tasks (parent_id == null)
    const topLevelTasks = tasks.filter((task: Task) => task.parent_id === null);
    // Extracted TaskCard to reduce nesting
    const TaskCard = ({ task }: { task: Task }) => {
      return (
        <div className="phub-item-card">
          <div className="phub-item-content">
            <div className="phub-item-header">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleTaskCardCheckboxChange(task)}
                className="mr-3 w-5 h-5 accent-blue-600"
                disabled={task.subtasks && task.subtasks.length > 0 && task.subtasks.some((st: Task) => !st.completed)}
                title={task.subtasks && task.subtasks.length > 0 && task.subtasks.some((st: Task) => !st.completed) ? 'Complete all subtasks first' : ''}
              />
              <button
                className={`phub-item-title cursor-pointer ${task.completed ? 'line-through opacity-60' : ''}`}
                onClick={() => handleTaskCardTitleButtonClick(task)}
                tabIndex={0}
                onKeyDown={e => handleTaskCardTitleButtonKeyDown(task, e)}
                style={{ background: 'none', border: 'none', padding: 0, margin: 0, textAlign: 'left' }}
                aria-label={`View details for ${task.title}`}
              >
                {task.title}
              </button>
              <button
                className="text-sm px-3 py-1 rounded transition-colors font-semibold"
                onClick={e => handleTaskCardDeleteButtonClick(task.id, e)}
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  border: '1px solid #dc2626'
                }}
              >
                Delete
              </button>
            </div>
            <div className="phub-item-meta">
              <span className="phub-item-badge">
                {task.projectId ? `📁 ${projects.find(p => p.id === task.projectId)?.name || 'Unknown'}` : '⚡ Quick Task'}
              </span>
              {task.subtasks && task.subtasks.length > 0 && (
                <span className="phub-item-badge">
                  📝 {task.subtasks.length} subtask{task.subtasks.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    };

    content = (
      <div className="phub-content-section">
        <div className="phub-section-header">
          <h2 className="phub-section-title">All Tasks</h2>
          <p className="phub-section-subtitle">Your complete task overview</p>
        </div>
        {tasksLoading && <div className="phub-loading">Loading tasks...</div>}
        {tasksError && <div className="phub-error">⚠️ {tasksError}</div>}
        {(!tasksLoading && !tasksError && topLevelTasks.length === 0) ? (
          <div className="phub-empty-state">
            <div className="phub-empty-icon">📋</div>
            <h3 className="phub-empty-title">No tasks found</h3>
            <p className="phub-empty-subtitle">Start by adding a new task to get productive!</p>
            <button
              className="phub-action-btn"
              onClick={() => setShowTaskForm(true)}
            >
              <span>✨</span>
              Add Your First Task
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {topLevelTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    );
  } else if (activeView === 'quick') {
    // Only show top-level quick tasks (parent_id == null)
    const quickTasks = tasks.filter((t: Task) => !t.projectId && t.parent_id === null);
    // Extracted QuickTaskCard to reduce nesting
    const QuickTaskCard = ({ task }: { task: Task }) => (
      <div className="phub-item-card">
        <div className="phub-item-content">
          <div className="phub-item-header">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={e => handleQuickTaskCardCheckboxChange(task, e)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              disabled={task.subtasks && task.subtasks.length > 0 && task.subtasks.some((st: Task) => !st.completed)}
              title={task.subtasks && task.subtasks.length > 0 && task.subtasks.some((st: Task) => !st.completed) ? 'Complete all subtasks first' : ''}
            />
            <button
              className="phub-item-title cursor-pointer flex-1"
              onClick={() => handleQuickTaskCardTitleButtonClick(task)}
              tabIndex={0}
              onKeyDown={e => handleQuickTaskCardTitleButtonKeyDown(task, e)}
              style={{
                textDecoration: task.completed ? 'line-through' : 'none',
                opacity: task.completed ? 0.6 : 1,
                background: 'none',
                border: 'none',
                padding: 0,
                margin: 0,
                textAlign: 'left',
                width: '100%'
              }}
              aria-label={`View details for ${task.title}`}
            >
              {task.title}
            </button>
            <button
              className="phub-action-btn-secondary"
              onClick={() => handleQuickTaskCardEditButtonClick(task)}
              style={{ padding: '0.5rem', fontSize: '0.8rem' }}
            >
              Edit
            </button>
            <button
              className="px-2 py-1 rounded transition-colors font-semibold"
              onClick={() => handleQuickTaskCardDeleteButtonClick(task.id)}
              style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: 'white',
                border: '1px solid #dc2626'
              }}
            >
              Delete
            </button>
          </div>
          <div className="phub-item-meta">
            {task.subtasks && task.subtasks.length > 0 && (
              <span className="phub-item-badge">
                📝 {task.subtasks.length} subtask{task.subtasks.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    );

    content = (
      <>
        <div className="phub-content-section">
          <div className="phub-section-header">
            <h2 className="phub-section-title">Quick Tasks</h2>
            <p className="phub-section-subtitle">Your rapid-fire action items</p>
          </div>
          {tasksLoading && <div className="phub-loading">Loading tasks...</div>}
          {tasksError && <div className="phub-error">⚠️ {tasksError}</div>}
          {(!tasksLoading && !tasksError && quickTasks.length === 0) ? (
            <div className="phub-empty-state">
              <div className="phub-empty-icon">⚡</div>
              <h3 className="phub-empty-title">No quick tasks found</h3>
              <p className="phub-empty-subtitle">Add a quick task for something you need to do soon!</p>
              <button
                className="phub-action-btn"
                onClick={() => setShowTaskForm(true)}
              >
                <span>⚡</span>
                Add Quick Task
              </button>
            </div>
          ) : null}
        </div>
        {(!tasksLoading && !tasksError && quickTasks.length > 0) && (
          <div className="space-y-4">
            {quickTasks.map(task => (
              <QuickTaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </>
    );
  } else if (activeView === 'projects') {
    // Only show top-level project tasks (parent_id == null)
    content = (
      <div className="w-full max-w-3xl mx-auto py-10 px-4">
        {!selectedProject ? (
          <div className="phub-content-section">
            <div className="phub-section-header">
              <h2 className="phub-section-title">Your Projects</h2>
              <p className="phub-section-subtitle">Organize your work into meaningful projects</p>
            </div>
            {projectsLoading && <div className="phub-loading">Loading projects...</div>}
            {projectsError && <div className="phub-error">⚠️ {projectsError}</div>}
            {!projectsLoading && !projectsError && projects.length === 0 && (
              <div className="phub-empty-state">
                <div className="phub-empty-icon">📁</div>
                <h3 className="phub-empty-title">No projects found</h3>
                <p className="phub-empty-subtitle">Start by creating a new project to organize your work.</p>
                <button
                  className="phub-action-btn"
                  onClick={() => setShowForm(true)}
                >
                  <span>📁</span>
                  Add Project
                </button>
              </div>
            )}
            {projects.length > 0 && (
              <div className="flex justify-end mb-6">
                <button
                  className="phub-action-btn"
                  onClick={() => setShowForm(true)}
                >
                  <span>📁</span>
                  Add Project
                </button>
              </div>
            )}
            {projects.length > 0 && (
              <div className="phub-grid auto-fit">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    className="phub-item-card phub-hover-lift cursor-pointer"
                    onClick={() => handleProjectCardClickWrapper(project)}
                    style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', width: '100%' }}
                    tabIndex={0}
                    onKeyDown={e => handleProjectCardKeyDownWrapper(project, e)}
                    aria-label={`Select project ${project.name}`}
                  >
                    <div className="phub-item-content">
                      <div className="phub-item-header">
                        <span className="phub-item-icon">📂</span>
                        <div className="phub-item-title">{project.name}</div>
                      </div>
                      {project.description && (
                        <div className="phub-item-description">{project.description}</div>
                      )}
                      <div className="phub-item-meta">
                        <button
                          className="phub-action-btn-secondary"
                          onClick={e => {
                            e.stopPropagation();
                            setEditProject(project);
                            setShowForm(false);
                          }}
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700 px-2 py-1 rounded transition-colors"
                          onClick={e => handleProjectDeleteButtonClickWrapper(project, e)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // skipcq: JS-0415
          <>
            <div className="phub-item-card" style={{ marginBottom: '2rem' }}>
              <div className="phub-item-content">
                <div className="phub-item-header">
                  <span className="phub-item-icon">📂</span>
                  <div className="phub-item-title">{selectedProject.name}</div>
                  <div className="flex gap-2">
                    <button
                      className="phub-action-btn-secondary"
                      onClick={handleSelectedProjectEdit}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700 px-3 py-1 rounded transition-colors font-semibold"
                      onClick={handleSelectedProjectDeleteButtonClick}
                    >
                      Delete
                    </button>
                    <button
                      className="phub-action-btn-secondary"
                      onClick={handleProjectBackButtonClick}
                    >
                      Back
                    </button>
                  </div>
                </div>
                {selectedProject.description && (
                  <div className="phub-item-description">{selectedProject.description}</div>
                )}
              </div>
            </div>

            <div className="phub-section-header">
              <h3 className="phub-section-title" style={{ fontSize: '1.5rem' }}>Tasks for this Project</h3>
              <p className="phub-section-subtitle">Manage project-specific tasks and deliverables</p>
            </div>

            <div className="phub-content-section">
              <ProjectTasksSection
                tasks={tasks}
                selectedProject={selectedProject}
                tasksLoading={tasksLoading}
                tasksError={tasksError}
                handleTaskToggle={handleTaskToggle}
                handleTaskTitleClick={handleTaskTitleClick}
                handleTaskEdit={handleTaskEdit}
                handleTaskDelete={handleTaskDelete}
                setShowTaskForm={setShowTaskForm}
              />
            </div>
          </>
        )}
        {showForm && !editProject && (
          <ProjectForm
            onCreate={handleCreateOrUpdateProject}
            onClose={handleCloseForm}
            loading={formLoading}
            error={formError}
          />
        )}
        {editProject && (
          <ProjectForm
            onCreate={handleCreateOrUpdateProject}
            onClose={handleCloseEdit}
            loading={formLoading}
            error={formError}
            initialName={editProject.name}
            initialDescription={editProject.description}
            editMode
          />
        )}
        <ConfirmDialog
          open={Boolean(deleteProject)}
          title="Delete Project?"
          message={deleteProject ? `Are you sure you want to delete "${deleteProject.name}"? This cannot be undone.` : ''}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmDeleteProject}
          onCancel={handleCancelDelete}
          loading={deleteLoading}
          type="danger"
        />
        {deleteError && <div className="text-red-600 mt-2">{deleteError}</div>}
      </div>
    );
  }

  // Flatten all tasks and subtasks into a single array for lookup
  const allTasks = useMemo(() => {
    const flat: Task[] = [];
    tasks.forEach((task: Task) => {
      flat.push(task);
      if (Array.isArray(task.subtasks)) {
        task.subtasks.forEach((sub: Task) => flat.push({ ...sub, parent_id: task.id }));
      }
    });
    return flat;
  }, [tasks]);

  useEffect(() => {
    const handler = (e: CustomEvent<number>) => {
      const subtaskId = e.detail;
      const subtask = allTasks.find(t => t.id === subtaskId);
      if (subtask) {
        setSelectedTask(getTaskWithProject(subtask));
        setTaskDetailsOpen(true);
      }
    };
    window.addEventListener('openTaskDetails', handler as EventListener);
    return () => window.removeEventListener('openTaskDetails', handler as EventListener);
  }, [allTasks, projects]);


  // Add this handler above the return statement, near other handlers
  const handleTaskDetailsClose = () => {
    setTaskDetailsOpen(false);
  };

  function handleTaskFormClose(): void {
    setShowTaskForm(false);
    setEditTask(null);
  }

  return (
    <div className="min-h-screen flex flex-col" data-testid="main-management-window">
      <AppHeader 
        rightContent={
          <BackgroundSwitcher 
            currentBackground={backgroundType}
            onBackgroundChange={setBackgroundType}
          />
        }
      />
      <div className="flex h-screen">
        <Sidebar collapsed={sidebarCollapsed} onCollapse={() => setSidebarCollapsed((c) => !c)} items={sidebarItems} />
        <main className="flex-1 p-0">
          {content}
          <TaskForm
            open={showTaskForm}
            onClose={handleTaskFormClose}
            onSubmit={handleTaskFormSubmit}
            loading={taskFormLoading}
            error={taskFormError}
            projects={projects}
            allTasks={tasks}
            initialValues={editTask ?? undefined}
            editMode={Boolean(editTask)}
          />
          <TaskDetails
            open={taskDetailsOpen}
            onClose={handleTaskDetailsClose}
            task={selectedTask}
            parentTask={selectedTask?.parent_id ? tasks.find(t => t.id === selectedTask.parent_id) : null}
            /* v8 ignore next */
            onEdit={() => {
              /* v8 ignore start */
              setTaskDetailsOpen(false); // Close details modal before opening edit form
              openTaskForm(selectedTask);
            }}
            /* v8 ignore stop */
            tasks={tasks}
            projects={projects}
          />
        </main>
      </div>
    </div>
  );
};

interface ProjectTasksSectionProps {
  tasks: Task[];
  selectedProject: Project;
  tasksLoading: boolean;
  tasksError: string | null;
  handleTaskToggle: (taskId: number) => void;
  handleTaskTitleClick: (task: Task) => void;
  handleTaskEdit: (task: Task) => void;
  handleTaskDelete: (taskId: number) => void;
  setShowTaskForm: (show: boolean) => void;
}

function ProjectTasksSection({
  tasks,
  selectedProject,
  tasksLoading,
  tasksError,
  handleTaskToggle,
  handleTaskTitleClick,
  handleTaskEdit,
  handleTaskDelete,
  setShowTaskForm,
}: ProjectTasksSectionProps) {
  // Only show top-level project tasks (parent_id == null)
  const projectTasks = tasks.filter((t: Task) => t.projectId === selectedProject.id && t.parent_id === null);

  // Handler functions for ProjectTasksSection
  const handleCheckboxChange = (task: Task) => {
    handleTaskToggle(task.id);
  };
  const handleTitleButtonClick = (task: Task) => {
    handleTaskTitleClick(task);
  };
  const handleTitleButtonKeyDown = (task: Task, e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleTaskTitleClick(task);
    }
  };
  const handleEditButtonClick = (task: Task) => {
    handleTaskEdit(task);
  };
  const handleDeleteButtonClick = (task: Task) => {
    handleTaskDelete(task.id);
  };

  if (!tasksLoading && !tasksError && projectTasks.length === 0) {
    return (
      <div className="phub-empty-state">
        <div className="phub-empty-icon">📝</div>
        <h3 className="phub-empty-title">No tasks for this project</h3>
        <p className="phub-empty-subtitle">Add a task to start making progress on this project!</p>
        <button
          className="phub-action-btn"
          onClick={() => setShowTaskForm(true)}
        >
          <span>📝</span>
          Add Task
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {projectTasks.map((task: Task) => (
        <div key={task.id} className="phub-item-card">
          <div className="phub-item-content">
            <div className="phub-item-header">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleCheckboxChange(task)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                disabled={task.subtasks && task.subtasks.length > 0 && task.subtasks.some((st: Task) => !st.completed)}
                title={task.subtasks && task.subtasks.length > 0 && task.subtasks.some((st: Task) => !st.completed) ? 'Complete all subtasks first' : ''}
              />
              <button
                className="phub-item-title cursor-pointer flex-1"
                onClick={() => handleTitleButtonClick(task)}
                tabIndex={0}
                onKeyDown={e => handleTitleButtonKeyDown(task, e)}
                style={{
                  textDecoration: task.completed ? 'line-through' : 'none',
                  opacity: task.completed ? 0.6 : 1,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  textAlign: 'left',
                  width: '100%'
                }}
                aria-label={`View details for ${task.title}`}
              >
                {task.title}
              </button>
              <button
                className="phub-action-btn-secondary"
                onClick={() => handleEditButtonClick(task)}
                style={{ padding: '0.5rem', fontSize: '0.8rem' }}
              >
                Edit
              </button>
              <button
                className="px-2 py-1 rounded transition-colors font-semibold"
                onClick={() => handleDeleteButtonClick(task)}
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  border: '1px solid #dc2626'
                }}
              >
                Delete
              </button>
            </div>
            <div className="phub-item-meta">
              {task.subtasks && task.subtasks.length > 0 && (
                <span className="phub-item-badge">
                  📝 {task.subtasks.length} subtask{task.subtasks.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MainManagementWindow;
