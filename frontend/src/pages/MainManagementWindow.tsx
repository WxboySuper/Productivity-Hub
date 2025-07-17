import React, { useState, useEffect, useCallback } from 'react';
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
import '../styles/ProjectForm.css';
import '../styles/PageLayouts.css';
import '../styles/MainLayout.css';

interface Task {
  id: number;
  title: string;
  completed: boolean;
  projectId?: number;
  project_id?: number; // Accept backend field for compatibility
  parent_id?: number | null; // Add parent_id for subtask filtering
  subtasks?: Array<any>; // Add subtasks for subtask count
}

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

const MainManagementWindow: React.FC = () => {
  const { logout, user } = useAuth();
  const { backgroundType, setBackgroundType } = useBackground();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const navigate = useNavigate();
  
  // Use the custom hooks for projects
  const { projects, loading: projectsLoading, error: projectsError, refetch: refetchProjects } = useProjects();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<'all' | 'quick' | 'projects'>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFormLoading, setTaskFormLoading] = useState(false);
  const [taskFormError, setTaskFormError] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<any | null>(null); // Track task being edited

  // Fetch tasks from API
  const fetchTasks = useCallback(() => {
    setTasksLoading(true);
    setTasksError(null);
    fetch('/api/tasks', {
      credentials: 'include',
    })
      .then((res) => res.ok ? res.json() : Promise.reject('Failed to fetch tasks'))
      .then((data) => {
        // Normalize project_id to projectId for all tasks
        const tasks = Array.isArray(data) ? data : (data.tasks || []);
        setTasks(tasks.map((task: any) => ({
          ...task,
          projectId: typeof task.projectId !== 'undefined' ? task.projectId : task.project_id,
        })));
      })
      .catch((err) => setTasksError(typeof err === 'string' ? err : 'Unknown error'))
      .finally(() => setTasksLoading(false));
  }, []);

  // Fetch tasks on mount and when switching to a tab that needs them
  useEffect(() => {
    if (activeView === 'all' || activeView === 'quick' || (activeView === 'projects' && selectedProject)) {
      fetchTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, selectedProject]);

  // Helper to read a cookie value by name
  function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  }

  // Helper to fetch CSRF token if missing
  async function ensureCsrfToken(): Promise<string> {
    let token = getCookie('_csrf_token');
    if (!token) {
      const res = await fetch('/api/csrf-token', { credentials: 'include' });
      const data = await res.json();
      token = data.csrf_token;
    }
    return token || '';
  }

  const handleCreateProject = async (project: { name: string; description?: string }) => {
    setFormLoading(true);
    setFormError(null);
    try {
      const csrfToken = await ensureCsrfToken();
      const response = await fetch('/api/projects', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',

          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify(project),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create project');
      }
      const newProject = await response.json();
      await refetchProjects(); // Refetch projects from the hook
      setShowForm(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditProject = (project: Project) => setEditProject(project);
  const handleUpdateProject = async (updated: { name: string; description?: string }) => {
    if (!editProject) return;
    setFormLoading(true);
    setFormError(null);
    try {
      const csrfToken = await ensureCsrfToken();
      const response = await fetch(`/api/projects/${editProject.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',

          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify(updated),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update project');
      }
      const updatedProject = await response.json();
      await refetchProjects(); // Refetch projects from the hook
      setEditProject(null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setFormLoading(false);
    }
  };
  const handleDeleteProject = (project: Project) => {
    setDeleteProject(project);
    setDeleteError(null);
  };
  const confirmDeleteProject = async () => {
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
      await refetchProjects(); // Refetch projects from the hook
      setDeleteProject(null);
      setSelectedProject(null);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDeleteLoading(false);
    }
  };
  const handleCloseForm = useCallback(() => setShowForm(false), []);
  const handleCloseEdit = useCallback(() => setEditProject(null), []);
  const handleCancelDelete = useCallback(() => setDeleteProject(null), []);

  // Task CRUD handlers (mock) - useCallback for stable references
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
  }, [fetchTasks]);
  const handleToggleTask = useCallback(async (id: number) => {
    setTaskFormLoading(true);
    setTaskFormError(null);
    try {
      const task = tasks.find(t => t.id === id);
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
  }, [tasks, fetchTasks]);

  // Pass dependencies to TaskFormModal
  const handleCreateTask = async (task: any) => {
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
      fetchTasks();
    } catch (err: unknown) {
      setTaskFormError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTaskFormLoading(false);
    }
  };

  const handleEditTask = async (task: any) => {
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
      setEditTask(null);
      setShowTaskForm(false);
      fetchTasks();
    } catch (err: unknown) {
      setTaskFormError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTaskFormLoading(false);
    }
  };

  // After editing a task, re-open the details modal for the updated task
  const handleUpdateTask = async (task: any) => {
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

  // Helper to get full task info with project name
  const getTaskWithProject = (task: any) => {
    // Accept both projectId and project_id for compatibility
    const projectId = typeof task.projectId !== 'undefined' ? task.projectId : task.project_id;
    const project = projects.find(p => p.id === projectId);
    return {
      ...task,
      projectName: project ? project.name : undefined,
      projectId,
      project_id: projectId,
    };
  };

  // Ensure projects are loaded before opening the task form
  const openTaskForm = (task: any = null) => {
    // Projects are always available from the hook now
    setEditTask(task ? getTaskWithProject(task) : null);
    setShowTaskForm(true);
  };

  // Debug helper function to test auth verification
  const testAuthVerification = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include',
      });
      
      const data = await response.json();
      showInfo('Auth Check Result', `Authenticated: ${data.authenticated}, User: ${data.user?.username || 'none'}`);
    } catch (error) {
      showError('Auth Check Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [showInfo, showError]);

  // Logout handler that manages navigation
  const handleLogout = useCallback(async () => {
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
    } catch (error) {
      console.error('Logout failed:', error);
      showError(
        'Logout failed', 
        error instanceof Error ? error.message : 'An unexpected error occurred during logout'
      );
      // Still navigate to home page since frontend state is cleared
      navigate('/', { replace: true });
    }
  }, [logout, navigate, showSuccess, showError, showWarning, showInfo]);

  // Sidebar items
  const sidebarItems = [
    {
      label: 'Add New',
      icon: <span className="text-xl">＋</span>,
      onClick: () => {
        setShowTaskForm(true);
      },
      active: false,
    },
    {
      label: 'All Tasks',
      icon: <span className="text-xl">📋</span>,
      onClick: () => { setActiveView('all'); setSelectedProject(null); },
      active: activeView === 'all',
    },
    {
      label: 'Quick Tasks',
      icon: <span className="text-xl">⚡</span>,
      onClick: () => { setActiveView('quick'); setSelectedProject(null); },
      active: activeView === 'quick',
    },
    {
      label: 'Projects',
      icon: <span className="text-xl">📁</span>,
      onClick: () => { setActiveView('projects'); setSelectedProject(null); },
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
  if (activeView === 'all') {
    // Only show top-level tasks (parent_id == null)
    const topLevelTasks = tasks.filter(task => task.parent_id == null);
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
              <div key={task.id} className="phub-item-card">
                <div className="phub-item-content">
                  <div className="phub-item-header">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={e => { handleToggleTask(task.id); }}
                      className="mr-3 w-5 h-5 accent-blue-600"
                      disabled={task.subtasks && task.subtasks.length > 0 && task.subtasks.some((st: any) => !st.completed)}
                      title={task.subtasks && task.subtasks.length > 0 && task.subtasks.some((st: any) => !st.completed) ? 'Complete all subtasks first' : ''}
                    />
                    <h3
                      className={`phub-item-title cursor-pointer ${task.completed ? 'line-through opacity-60' : ''}`}
                      onClick={() => {
                        setSelectedTask(getTaskWithProject(task));
                        setTaskDetailsOpen(true);
                      }}
                    >
                      {task.title}
                    </h3>
                    <button
                      className="text-sm px-3 py-1 rounded transition-colors font-semibold"
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                      }}
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
            ))}
          </div>
        )}
      </div>
    );
  } else if (activeView === 'quick') {
    // Only show top-level quick tasks (parent_id == null)
    const quickTasks = tasks.filter(t => !t.projectId && t.parent_id == null);
    content = (
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
        ) : (
          <div className="space-y-4">
            {quickTasks.map(task => (
              <div key={task.id} className="phub-item-card">
                <div className="phub-item-content">
                  <div className="phub-item-header">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(e) => { e.stopPropagation(); handleToggleTask(task.id); }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      disabled={task.subtasks && task.subtasks.length > 0 && task.subtasks.some((st: any) => !st.completed)}
                      title={task.subtasks && task.subtasks.length > 0 && task.subtasks.some((st: any) => !st.completed) ? 'Complete all subtasks first' : ''}
                    />
                    <div
                      className="phub-item-title cursor-pointer flex-1"
                      onClick={() => { setSelectedTask(getTaskWithProject(task)); setTaskDetailsOpen(true); }}
                      style={{
                        textDecoration: task.completed ? 'line-through' : 'none',
                        opacity: task.completed ? 0.6 : 1
                      }}
                    >
                      {task.title}
                    </div>
                    <button
                      className="phub-action-btn-secondary"
                      onClick={() => openTaskForm(task)}
                      style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                    >
                      Edit
                    </button>
                    <button
                      className="px-2 py-1 rounded transition-colors font-semibold"
                      onClick={() => handleDeleteTask(task.id)}
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
        )}
      </div>
    );
  } else if (activeView === 'projects') {
    // Only show top-level project tasks (parent_id == null)
    const projectTasks = selectedProject ? tasks.filter(t => t.projectId === selectedProject.id && t.parent_id == null) : [];
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
                  <div key={project.id} className="phub-item-card phub-hover-lift cursor-pointer"
                    onClick={() => setSelectedProject(project)}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProject(project);
                          }}
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700 px-2 py-1 rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="phub-content-section">
            <div className="phub-item-card" style={{ marginBottom: '2rem' }}>
              <div className="phub-item-content">
                <div className="phub-item-header">
                  <span className="phub-item-icon">📂</span>
                  <div className="phub-item-title">{selectedProject.name}</div>
                  <div className="flex gap-2">
                    <button
                      className="phub-action-btn-secondary"
                      onClick={() => handleEditProject(selectedProject)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700 px-3 py-1 rounded transition-colors font-semibold"
                      onClick={() => handleDeleteProject(selectedProject)}
                    >
                      Delete
                    </button>
                    <button
                      className="phub-action-btn-secondary"
                      onClick={() => setSelectedProject(null)}
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

            {(() => {
              // Only show top-level project tasks (parent_id == null)
              const projectTasks = tasks.filter(t => t.projectId === selectedProject.id && t.parent_id == null);
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
                  {projectTasks.map(task => (
                    <div key={task.id} className="phub-item-card">
                      <div className="phub-item-content">
                        <div className="phub-item-header">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleTaskToggle(task.id)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            disabled={task.subtasks && task.subtasks.length > 0 && task.subtasks.some((st: any) => !st.completed)}
                            title={task.subtasks && task.subtasks.length > 0 && task.subtasks.some((st: any) => !st.completed) ? 'Complete all subtasks first' : ''}
                          />
                          <div
                            className="phub-item-title cursor-pointer flex-1"
                            onClick={() => handleTaskTitleClick(task)}
                            style={{
                              textDecoration: task.completed ? 'line-through' : 'none',
                              opacity: task.completed ? 0.6 : 1
                            }}
                          >
                            {task.title}
                          </div>
                          <button
                            className="phub-action-btn-secondary"
                            onClick={() => handleTaskEdit(task)}
                            style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                          >
                            Edit
                          </button>
                          <button
                            className="px-2 py-1 rounded transition-colors font-semibold"
                            onClick={() => handleTaskDelete(task.id)}
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
            })()}
          </div>
        )}
        {showForm && (
          <ProjectForm
            onCreate={handleCreateProject}
            onClose={handleCloseForm}
            loading={formLoading}
            error={formError}
          />
        )}
        {editProject && (
          <ProjectForm
            onCreate={handleUpdateProject}
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
  const allTasks = React.useMemo(() => {
    const flat: any[] = [];
    tasks.forEach((task: any) => {
      flat.push(task);
      if (Array.isArray(task.subtasks)) {
        task.subtasks.forEach((sub: any) => flat.push({ ...sub, parent_id: task.id }));
      }
    });
    return flat;
  }, [tasks]);

  useEffect(() => {
    const handler = (e: any) => {
      const subtaskId = e.detail;
      const subtask = allTasks.find(t => t.id === subtaskId);
      if (subtask) {
        setSelectedTask(getTaskWithProject(subtask));
        setTaskDetailsOpen(true);
      }
    };
    window.addEventListener('openTaskDetails', handler);
    return () => window.removeEventListener('openTaskDetails', handler);
  }, [allTasks, projects]);

  // Helper functions for project task actions
  const handleTaskToggle = (taskId: number) => {
    handleToggleTask(taskId);
  };

  const handleTaskTitleClick = (task: any) => {
    setSelectedTask(getTaskWithProject(task));
    setTaskDetailsOpen(true);
  };

  const handleTaskEdit = (task: any) => {
    openTaskForm(task);
  };

  const handleTaskDelete = (taskId: number) => {
    handleDeleteTask(taskId);
  };

  // Move TaskForm outside of content block so it is always mounted
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
            onClose={() => {
              setShowTaskForm(false);
              setEditTask(null);
              setTaskFormError(null);
            }}
            onSubmit={editTask ? handleUpdateTask : handleCreateTask}
            loading={taskFormLoading}
            error={taskFormError}
            projects={projects}
            allTasks={tasks}
            initialValues={editTask}
            editMode={!!editTask}
          />
          <TaskDetails
            open={taskDetailsOpen}
            onClose={() => setTaskDetailsOpen(false)}
            task={selectedTask}
            parentTask={selectedTask && selectedTask.parent_id ? tasks.find(t => t.id === selectedTask.parent_id) : null}
            onEdit={() => {
              setTaskDetailsOpen(false); // Close details modal before opening edit form
              openTaskForm(selectedTask);
            }}
            tasks={tasks}
            projects={projects}
          />
        </main>
      </div>
    </div>
  );
};

export default MainManagementWindow;
