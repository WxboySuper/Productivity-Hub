import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import AppHeader from '../components/AppHeader';
import ProjectForm from '../components/ProjectForm';
import ConfirmDialog from '../components/ConfirmDialog';

interface Project {
  id: number;
  name: string;
  description?: string;
}

const ProjectListPage: React.FC = () => {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/projects', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data = await response.json();
        setProjects(data.projects || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [token]);

  const getCsrfToken = () => document.cookie.match(/_csrf_token=([^;]+)/)?.[1];

  const handleCreateProject = async (project: { name: string; description?: string }) => {
    setFormLoading(true);
    setFormError(null);
    try {
      const csrfToken = getCsrfToken();
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
      const csrfToken = getCsrfToken();
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
      const csrfToken = getCsrfToken();
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
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-green-100 flex flex-col">
      <AppHeader betaLabel="Project Management Beta" />
      <main className="flex-1 flex flex-col items-center justify-start w-full">
        <div className="w-full max-w-3xl py-10 px-4">
          <h2 className="text-3xl font-bold mb-6 text-blue-800 drop-shadow">Your Projects</h2>
          {projects.length > 0 && (
            <button
              className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              onClick={() => setShowForm(true)}
            >
              + New Project
            </button>
          )}
          {loading && <div>Loading projects...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {!loading && !error && projects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-6xl mb-4">📁</div>
              <div className="text-gray-500 mb-2">No projects found.</div>
              <div className="text-gray-400 mb-4">Start by creating a new project to organize your work.</div>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                onClick={() => setShowForm(true)}
              >
                + New Project
              </button>
            </div>
          )}
          {projects.length > 0 && (
            <ul className="space-y-4">
              {projects.map((project) => (
                <li key={project.id} className="p-4 bg-white/90 rounded shadow hover:shadow-md transition border border-blue-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="font-semibold text-lg text-blue-700 flex items-center gap-2">
                      <span className="inline-block text-2xl">📂</span> {project.name}
                    </div>
                    {project.description && <div className="text-gray-600 mt-1">{project.description}</div>}
                  </div>
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <button
                      className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded hover:bg-yellow-300 transition font-semibold"
                      onClick={() => handleEditProject(project)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition font-semibold"
                      onClick={() => handleDeleteProject(project)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {showForm && (
          <ProjectForm
            onCreate={handleCreateProject}
            onClose={() => setShowForm(false)}
            loading={formLoading}
            error={formError}
          />
        )}
        {editProject && (
          <ProjectForm
            onCreate={handleUpdateProject}
            onClose={() => setEditProject(null)}
            loading={formLoading}
            error={formError}
            initialName={editProject.name}
            initialDescription={editProject.description}
            editMode
          />
        )}
        <ConfirmDialog
          open={!!deleteProject}
          title="Delete Project?"
          message={deleteProject ? `Are you sure you want to delete "${deleteProject.name}"? This cannot be undone.` : ''}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmDeleteProject}
          onCancel={() => setDeleteProject(null)}
          loading={deleteLoading}
        />
        {deleteError && <div className="text-red-600 mt-2">{deleteError}</div>}
      </main>
    </div>
  );
};

export default ProjectListPage;
