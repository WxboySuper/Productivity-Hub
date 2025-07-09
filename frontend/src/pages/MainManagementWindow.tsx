import React, { useState, useEffect, useCallback } from 'react';
import AppHeader from '../components/AppHeader';
import ProjectForm from '../components/ProjectForm';
import ConfirmDialog from '../components/ConfirmDialog';
import TaskDetailsModal from '../components/TaskDetailsModal';
import TaskFormModal from '../components/TaskFormModal';
import { useAuth } from '../auth';

interface Project {
  id: number;
  name: string;
  description?: string;
}

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
  items: { label: string; icon?: React.ReactNode; onClick: () => void; active?: boolean }[];
}> = ({ collapsed, onCollapse, items }) => (
  <aside className={`bg-white/90 border-r border-blue-100 shadow-md transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'} flex flex-col`}>
    <button
      className="m-2 p-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition font-bold text-lg"
      onClick={items[0].onClick}
      style={{ marginBottom: '1.5rem' }}
    >
      {items[0].icon} {!collapsed && items[0].label}
    </button>
    <button
      className="mx-2 mb-4 p-2 rounded hover:bg-blue-100 transition text-blue-700"
      onClick={onCollapse}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {collapsed ? <span>&#9776;</span> : <span>&#10094;</span>}
    </button>
    <nav className="flex-1 flex flex-col gap-2 mt-2">
      {items.slice(1).map((item) => (
        <button
          key={item.label}
          className={`flex items-center gap-2 px-4 py-2 rounded text-left hover:bg-blue-50 transition font-medium ${item.active ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
          onClick={item.onClick}
          style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          {item.icon}
          {!collapsed && item.label}
        </button>
      ))}
    </nav>
  </aside>
);

const MainManagementWindow: React.FC = () => {
  const { token } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<'all' | 'quick' | 'projects'>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    if (activeView === 'projects') {
      setLoading(true);
      setError(null);
      fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then((res) => res.ok ? res.json() : Promise.reject('Failed to fetch projects'))
        .then((data) => setProjects(data.projects || []))
        .catch((err) => setError(typeof err === 'string' ? err : 'Unknown error'))
        .finally(() => setLoading(false));
    }
  }, [token, activeView]);

  // Fetch projects on mount (before tasks)
  useEffect(() => {
    fetch('/api/projects', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : Promise.reject('Failed to fetch projects'))
      .then((data) => setProjects(data.projects || []))
      .catch(() => setProjects([]));
  }, [token]);

  // Fetch tasks from API
  const fetchTasks = useCallback(() => {
    setTasksLoading(true);
    setTasksError(null);
    fetch('/api/tasks', {
      headers: { 'Authorization': `Bearer ${token}` },
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
  }, [token]);

  // Fetch tasks on mount and when switching to a tab that needs them
  useEffect(() => {
    if (activeView === 'all' || activeView === 'quick' || (activeView === 'projects' && selectedProject)) {
      fetchTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeView, selectedProject]);

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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify(project),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create project');
      }
      const newProject = await response.json();
      setProjects((prev) => [...prev, newProject]);
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify(updated),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update project');
      }
      const updatedProject = await response.json();
      setProjects((prev) => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
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
        headers: {
          'Authorization': `Bearer ${token}`,
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete project');
      }
      setProjects((prev) => prev.filter(p => p.id !== deleteProject.id));
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
        headers: {
          'Authorization': `Bearer ${token}`,
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
  }, [token, fetchTasks]);
  const handleToggleTask = useCallback(async (id: number) => {
    setTaskFormLoading(true);
    setTaskFormError(null);
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) throw new Error('Task not found');
      const csrfToken = await ensureCsrfToken();
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
  }, [token, tasks, fetchTasks]);

  // Pass dependencies to TaskFormModal
  const handleCreateTask = async (task: any) => {
    setTaskFormLoading(true);
    setTaskFormError(null);
    try {
      const csrfToken = await ensureCsrfToken();
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify(task),
        credentials: 'include',
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
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify(task),
        credentials: 'include',
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
      const updatedTaskRes = await fetch(`/api/tasks/${editTask.id}`);
      if (updatedTaskRes.ok) {
        const updatedTask = await updatedTaskRes.json();
        setSelectedTask(getTaskWithProject(updatedTask));
        setTaskDetailsOpen(true);
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
    if (activeView !== 'projects') {
      // If not in projects view, fetch projects first
      fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then((res) => res.ok ? res.json() : Promise.reject('Failed to fetch projects'))
        .then((data) => setProjects(data.projects || []))
        .finally(() => {
          setEditTask(task ? getTaskWithProject(task) : null);
          setShowTaskForm(true);
        });
    } else {
      setEditTask(task ? getTaskWithProject(task) : null);
      setShowTaskForm(true);
    }
  };

  // Sidebar items
  const sidebarItems = [
    {
      label: 'Add New',
      icon: <span className="text-xl">＋</span>,
      onClick: () => {
        console.log('Add New button clicked');
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
  ];

  // Main content logic
  let content: React.ReactNode = null;
  if (activeView === 'all') {
    // Only show top-level tasks (parent_id == null)
    const topLevelTasks = tasks.filter(task => task.parent_id == null);
    content = (
      <div className="p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-blue-800">All Tasks</h2>
        {tasksLoading && <div>Loading tasks...</div>}
        {tasksError && <div className="text-red-600">{tasksError}</div>}
        {(!tasksLoading && !tasksError && topLevelTasks.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <div className="text-gray-500 mb-2">No tasks found.</div>
            <div className="text-gray-400 mb-4">Start by adding a new task to get productive!</div>
          </div>
        ) : (
          <ul className="space-y-2">
            {topLevelTasks.map(task => (
              <li key={task.id} className="flex items-center justify-between bg-white/90 rounded px-4 py-2 border border-blue-100">
                <input type="checkbox" checked={task.completed} onChange={e => { handleToggleTask(task.id); }} className="mr-2" disabled={task.subtasks && task.subtasks.length > 0 && task.subtasks.some((st: any) => !st.completed)} title={task.subtasks && task.subtasks.length > 0 && task.subtasks.some((st: any) => !st.completed) ? 'Complete all subtasks first' : ''} />
                <div className="flex-1 cursor-pointer" onClick={() => {
                  setSelectedTask(getTaskWithProject(task));
                  setTaskDetailsOpen(true);
                }}>
                  <span className={task.completed ? 'line-through text-gray-400' : ''}>{task.title}</span>
                  <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                    {task.projectId ? `Project: ${projects.find(p => p.id === task.projectId)?.name || 'Unknown'}` : 'Quick Task'}
                  </span>
                  {task.subtasks && task.subtasks.length > 0 && (
                    <span className="ml-2 text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">{task.subtasks.length} subtask{task.subtasks.length > 1 ? 's' : ''}</span>
                  )}
                </div>
                <button className="text-red-500 hover:text-red-700" onClick={e => { e.stopPropagation(); handleDeleteTask(task.id); }}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  } else if (activeView === 'quick') {
    // Only show top-level quick tasks (parent_id == null)
    const quickTasks = tasks.filter(t => !t.projectId && t.parent_id == null);
    content = (
      <div className="p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-blue-800">Quick Tasks</h2>
        {tasksLoading && <div>Loading tasks...</div>}
        {tasksError && <div className="text-red-600">{tasksError}</div>}
        {(!tasksLoading && !tasksError && quickTasks.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">⚡</div>
            <div className="text-gray-500 mb-2">No quick tasks found.</div>
            <div className="text-gray-400 mb-4">Add a quick task for something you need to do soon!</div>
          </div>
        ) : (
          <ul className="space-y-2">
            {quickTasks.map(task => (
              <li key={task.id} className="flex items-center justify-between bg-white/90 rounded px-4 py-2 border border-blue-100">
                <div className="cursor-pointer" onClick={() => { setSelectedTask(getTaskWithProject(task)); setTaskDetailsOpen(true); }}>
                  <input type="checkbox" checked={task.completed} onChange={e => { e.stopPropagation(); handleToggleTask(task.id); }} className="mr-2" disabled={task.subtasks && task.subtasks.length > 0 && task.subtasks.some((st: any) => !st.completed)} title={task.subtasks && task.subtasks.length > 0 && task.subtasks.some((st: any) => !st.completed) ? 'Complete all subtasks first' : ''} />
                  <span className={task.completed ? 'line-through text-gray-400' : ''}>{task.title}</span>
                  {task.subtasks && task.subtasks.length > 0 && (
                    <span className="ml-2 text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">{task.subtasks.length} subtask{task.subtasks.length > 1 ? 's' : ''}</span>
                  )}
                </div>
                <button className="text-red-500 hover:text-red-700" onClick={e => { e.stopPropagation(); handleDeleteTask(task.id); }}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  } else if (activeView === 'projects') {
    // Only show top-level project tasks (parent_id == null)
    const projectTasks = selectedProject ? tasks.filter(t => t.projectId === selectedProject.id && t.parent_id == null) : [];
    content = (
      <div className="w-full max-w-3xl mx-auto py-10 px-4">
        {!selectedProject ? (
          <>
            <h2 className="text-3xl font-bold mb-6 text-blue-800 drop-shadow">Your Projects</h2>
            {loading && <div>Loading projects...</div>}
            {error && <div className="text-red-600">{error}</div>}
            {!loading && !error && projects.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-4">📁</div>
                <div className="text-gray-500 mb-2">No projects found.</div>
                <div className="text-gray-400 mb-4">Start by creating a new project to organize your work.</div>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold mt-2"
                  onClick={() => setShowForm(true)}
                >
                  + Add Project
                </button>
              </div>
            )}
            {projects.length > 0 && (
              <div className="flex justify-end mb-4">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold"
                  onClick={() => setShowForm(true)}
                >
                  + Add Project
                </button>
              </div>
            )}
            {projects.length > 0 && (
              <ul className="space-y-4">
                {projects.map((project) => (
                  <li key={project.id} className="p-4 bg-white/90 rounded shadow hover:shadow-md transition border border-blue-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2 cursor-pointer"
                    onClick={() => setSelectedProject(project)}
                  >
                    <div>
                      <div className="font-semibold text-lg text-blue-700 flex items-center gap-2">
                        <span className="inline-block text-2xl">📂</span> {project.name}
                      </div>
                      {project.description && <div className="text-gray-600 mt-1">{project.description}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between bg-white/90 rounded-t-lg shadow px-6 py-4 border-b border-blue-100 mb-6">
              <div>
                <div className="font-bold text-2xl text-blue-800 flex items-center gap-2">
                  <span className="inline-block text-2xl">📂</span> {selectedProject.name}
                </div>
                {selectedProject.description && <div className="text-gray-600 mt-1">{selectedProject.description}</div>}
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded hover:bg-yellow-300 transition font-semibold"
                  onClick={() => handleEditProject(selectedProject)}
                >
                  Edit
                </button>
                <button
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition font-semibold"
                  onClick={() => handleDeleteProject(selectedProject)}
                >
                  Delete
                </button>
                <button
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition font-semibold"
                  onClick={() => setSelectedProject(null)}
                >
                  Back
                </button>
              </div>
            </div>
            <div className="p-8 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold mb-4 text-blue-700">Tasks for this Project</h3>
              <ul className="space-y-2">
                {(() => {
                  // Only show top-level project tasks (parent_id == null)
                  const projectTasks = tasks.filter(t => t.projectId === selectedProject.id && t.parent_id == null);
                  if (!tasksLoading && !tasksError && projectTasks.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="text-6xl mb-4">📝</div>
                        <div className="text-gray-500 mb-2">No tasks for this project.</div>
                        <div className="text-gray-400 mb-4">Add a task to start making progress on this project!</div>
                      </div>
                    );
                  }
                  return projectTasks.map(task => (
                    <li key={task.id} className="flex items-center justify-between bg-white/90 rounded px-4 py-2 border border-blue-100">
                      <div className="cursor-pointer" onClick={() => { setSelectedTask(getTaskWithProject(task)); setTaskDetailsOpen(true); }}>
                        <input type="checkbox" checked={task.completed} onChange={e => { e.stopPropagation(); handleToggleTask(task.id); }} className="mr-2" disabled={task.subtasks && task.subtasks.length > 0 && task.subtasks.some((st: any) => !st.completed)} title={task.subtasks && task.subtasks.length > 0 && task.subtasks.some((st: any) => !st.completed) ? 'Complete all subtasks first' : ''} />
                        <span className={task.completed ? 'line-through text-gray-400' : ''}>{task.title}</span>
                        {task.subtasks && task.subtasks.length > 0 && (
                          <span className="ml-2 text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">{task.subtasks.length} subtask{task.subtasks.length > 1 ? 's' : ''}</span>
                        )}
                      </div>
                      <button className="text-red-500 hover:text-red-700" onClick={e => { e.stopPropagation(); handleDeleteTask(task.id); }}>Delete</button>
                    </li>
                  ));
                })()}
              </ul>
            </div>
          </>
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

  // Move TaskFormModal outside of content block so it is always mounted
  // Move debug log before return
  console.log('Rendering TaskFormModal:', { showTaskForm });
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex h-screen">
        <Sidebar collapsed={sidebarCollapsed} onCollapse={() => setSidebarCollapsed((c) => !c)} items={sidebarItems} />
        <main className="flex-1 bg-gradient-to-br from-blue-100 via-blue-200 to-green-100 p-0">
          {content}
          <TaskFormModal
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
            initialValues={editTask}
            editMode={!!editTask}
          />
          <TaskDetailsModal
            open={taskDetailsOpen}
            onClose={() => setTaskDetailsOpen(false)}
            task={selectedTask}
            parentTask={selectedTask && selectedTask.parent_id ? allTasks.find(t => t.id === selectedTask.parent_id) : null}
            onEdit={() => {
              setTaskDetailsOpen(false); // Close details modal before opening edit form
              openTaskForm(selectedTask);
            }}
            tasks={allTasks} // Pass allTasks for dependency lookup
          />
        </main>
      </div>
    </div>
  );
};

export default MainManagementWindow;
