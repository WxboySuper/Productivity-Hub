import React from "react";
import type { Project } from "../../../hooks/useProjects";

export interface ProjectsOverviewProps {
  projects: Project[];
  loading: boolean;
  error: string | null;
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project, e: React.MouseEvent<HTMLButtonElement>) => void;
  onSelectProject: (project: Project) => void;
}

const ProjectsOverview: React.FC<ProjectsOverviewProps> = ({ projects, loading, error, onAddProject, onEditProject, onDeleteProject, onSelectProject }) => {
  return (
    <div className="phub-content-section" aria-live="polite">
        <div className="phub-section-header">
          <h2 className="phub-section-title">Your Projects</h2>
          <p className="phub-section-subtitle">Organize your work into meaningful projects</p>
        </div>
        {loading && <div className="phub-loading">Loading projects...</div>}
        {error && <div className="phub-error">⚠️ {error}</div>}
        {!loading && !error && projects.length === 0 && (
          <div className="phub-empty-state">
            <div className="phub-empty-icon">📁</div>
            <h3 className="phub-empty-title">No projects found</h3>
            <p className="phub-empty-subtitle">Start by creating a new project to organize your work.</p>
            <button className="phub-action-btn" onClick={onAddProject}>
              <span>📁</span>
              Add Project
            </button>
          </div>
        )}
        {projects.length > 0 && (
          <div className="flex justify-end mb-6">
            <button className="phub-action-btn" onClick={onAddProject}>
              <span>📁</span>
              Add Project
            </button>
          </div>
        )}
        {projects.length > 0 && (
          <div className="phub-grid auto-fit">
            {projects.map((project) => (
              <div
                key={project.id}
                role="button"
                className="phub-item-card phub-hover-lift cursor-pointer"
                onClick={() => onSelectProject(project)}
                style={{ background: "none", border: "none", padding: 0, textAlign: "left", width: "100%" }}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelectProject(project);
                }}
                aria-label={`Select project ${project.name}`}
              >
                <div className="phub-item-content">
                  <div className="phub-item-header">
                    <span className="phub-item-icon">📂</span>
                    <div className="phub-item-title">{project.name}</div>
                  </div>
                  {project.description && <div className="phub-item-description">{project.description}</div>}
                  <div className="phub-item-meta">
                    <button
                      className="phub-action-btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditProject(project);
                      }}
                      style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700 px-2 py-1 rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project, e);
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
  );
};

export default ProjectsOverview;
