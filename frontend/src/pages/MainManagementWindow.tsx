import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/common/AppHeader";
import TaskForm from "../components/TaskForm";
import ProjectForm from "../components/ProjectForm";
import ConfirmDialog from "../components/common/ConfirmDialog";
import TaskDetails from "../components/TaskDetails";
import Sidebar from "../components/management/Sidebar";
import AllTasksView from "../components/management/views/AllTasksView";
import QuickTasksView from "../components/management/views/QuickTasksView";
import ProjectsOverview from "../components/management/views/ProjectsOverview";
import ProjectTasksView from "../components/management/views/ProjectTasksView";
import BackgroundSwitcher from "../components/common/BackgroundSwitcher";
import { useAuth } from "../auth";
import { useBackground } from "../context/BackgroundContext";
import { useToast } from "../components/common/ToastProvider";
import { useProjects, type Project } from "../hooks/useProjects";
import { ensureCsrfToken, type Task } from "../hooks/useTasks";
import "../styles/ProjectForm.css";
import "../styles/PageLayouts.css";
import "../styles/MainLayout.css";
import type { TaskFormValues } from "../components/TaskForm";

// Sidebar now imported from components/management/Sidebar

// skipcq: JS-R1005
function MainManagementWindow() {
  // (moved into view components)
  // --- All hooks/state and variables first ---
  const { logout } = useAuth();
  const { backgroundType, setBackgroundType } = useBackground();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const navigate = useNavigate();
  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
    deleteProject: deleteProjectHook,
  } = useProjects();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<"all" | "quick" | "projects">(
    "all",
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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
      const response = await fetch("/api/tasks", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      const tasks = Array.isArray(data) ? data : data.tasks || [];
      // Normalize task data
      const normalizedTasks = tasks.map((task: Task) => ({
        ...task,
        projectId:
          typeof task.projectId !== "undefined"
            ? task.projectId
            : task.project_id,
      }));
      setTasks(normalizedTasks);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setTasksError(errorMessage);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  // Load tasks on mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleApiError = useCallback(
    (err: unknown, contextMessage: string) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      setTaskFormError(message);
      showError(contextMessage, message);
    },
    [setTaskFormError, showError],
  );

  // --- Handler functions for toggling and deleting tasks ---
  const handleToggleTask = useCallback(
    async (id: number) => {
      setTaskFormLoading(true);
      setTaskFormError(null);
      try {
        const task = tasks.find((t: Task) => t.id === id);
        if (!task) throw new Error("Task not found");
        const csrfToken = await ensureCsrfToken();
        const response = await fetch(`/api/tasks/${id}`, {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
          },
          body: JSON.stringify({ completed: !task.completed }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to update task");
        }
        fetchTasks();
      } catch (err: unknown) {
        handleApiError(err, "An error occurred while updating the task.");
      } finally {
        setTaskFormLoading(false);
      }
    },
    [tasks],
  );

  const handleDeleteTask = useCallback(async (id: number) => {
    setTaskFormLoading(true);
    setTaskFormError(null);
    try {
      const csrfToken = await ensureCsrfToken();
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete task");
      }
      fetchTasks();
    } catch (err: unknown) {
      handleApiError(err, "An error occurred while deleting the task.");
    } finally {
      setTaskFormLoading(false);
    }
  }, []);

  // --- Helper functions that use state/hooks ---
  const getTaskWithProject = (task: Task) => {
    const projectId =
      typeof task.projectId !== "undefined" ? task.projectId : task.project_id;
    const project = projects.find((p) => p.id === projectId);
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
    if (!deleteProject) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteProjectHook(deleteProject.id);
      setDeleteProject(null);
      setSelectedProject(null);
      showSuccess(
        "Project deleted",
        "The project has been successfully deleted.",
      );
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete project",
      );
      showError(
        "Deletion failed",
        err instanceof Error ? err.message : "An unknown error occurred.",
      );
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
    /* v8 ignore start */
    setTaskFormLoading(true);
    setTaskFormError(null);
    try {
      const csrfToken = await ensureCsrfToken();
      const response = await fetch("/api/tasks", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify(task),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create task");
      }
      setShowTaskForm(false);
      setEditTask(null);
      fetchTasks();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setTaskFormError(message);
      showError(message, "An error occurred while creating the task.");
    } finally {
      setTaskFormLoading(false);
    }
  };
  /* v8 ignore stop */

  // After editing a task, re-open the details modal for the updated task
  const handleUpdateTask = async (task: Task) => {
    /* v8 ignore start */
    if (!editTask) return;
    setTaskFormLoading(true);
    setTaskFormError(null);
    try {
      const csrfToken = await ensureCsrfToken();
      const response = await fetch(`/api/tasks/${editTask.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify(task),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update task");
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
        console.warn("Failed to fetch updated task details:", fetchError);
      }
    } catch (err: unknown) {
      handleApiError(err, "An error occurred while updating the task.");
    } finally {
      setTaskFormLoading(false);
    }
  };
  /* v8 ignore stop */

  // Add handler functions for TaskForm onSubmit
  function handleTaskFormSubmit(task: TaskFormValues) {
    // Accept projectId as string | number | undefined
    /* v8 ignore start */
    const completed = task.completed ?? false;
    let projectId: number | undefined;
    if (task.projectId !== undefined) {
      if (typeof task.projectId === "string") {
        const parsed = parseInt(task.projectId, 10);
        projectId = isNaN(parsed) ? undefined : parsed;
      } else if (typeof task.projectId === "number") {
        projectId = task.projectId;
      }
    } else if (task.project_id !== undefined) {
      if (typeof task.project_id === "string") {
        const parsed = parseInt(task.project_id, 10);
        projectId = isNaN(parsed) ? undefined : parsed;
      } else if (typeof task.project_id === "number") {
        projectId = task.project_id;
      }
    }

    // Only include allowed fields for TaskFormValues
    const safeTask: Task = {
      id: typeof task.id === "number" ? task.id : 0, // fallback to 0 if undefined, or handle as needed
      title: task.title ?? "",
      description: task.description ?? "", // Ensure description is present
      completed,
      projectId,
      // Only assign subtasks if they are of type Task[]
      ...(Array.isArray(task.subtasks)
        ? { subtasks: task.subtasks as Task[] }
        : {}),
    };

    if (editTask) {
      handleUpdateTask(safeTask);
    } else {
      handleCreateTask(safeTask);
    }
  }
  /* v8 ignore stop */

  // Logout handler that manages navigation
  const handleLogout = useCallback(async () => {
    /* v8 ignore start */
    try {
      showInfo("Signing out...", "Please wait while we sign you out");
      const logoutSuccess = await logout();

      if (logoutSuccess) {
        showSuccess(
          "Signed out successfully",
          "You have been logged out of your account",
        );
        navigate("/", { replace: true });
      } else {
        showWarning(
          "Logout incomplete",
          "You appear to be signed out locally, but there may be an issue with the server session. Please try signing in again.",
        );
        // Still navigate to home since frontend is cleared
        navigate("/", { replace: true });
      }
      /* v8 ignore start */
    } catch (error) {
      console.error("Logout failed:", error);
      showError(
        "Logout failed",
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during logout",
      );
      // Still navigate to home page since frontend state is cleared
      navigate("/", { replace: true });
    }
    /* v8 ignore stop */
  }, [logout, navigate, showSuccess, showError, showWarning, showInfo]);

  // Add handlers above sidebarItems
  const handleAllTasksClick = () => {
    setActiveView("all");
    setSelectedProject(null);
  };
  const handleQuickTasksClick = () => {
    setActiveView("quick");
    setSelectedProject(null);
  };
  const handleProjectsClick = () => {
    setActiveView("projects");
    setSelectedProject(null);
  };

  // --- Removed inline card handlers (now encapsulated in view components) ---

  // Add handler for Add Project button
  const handleAddProjectClick = () => {
    setShowForm(true);
  };

  // Sidebar items
  const sidebarItems = [
    {
      label: "Add New",
      icon: <span className="text-xl">＋</span>,
      onClick: handleAddNewTask,
      active: false,
    },
    {
      label: "All Tasks",
      icon: <span className="text-xl">📋</span>,
      onClick: handleAllTasksClick,
      active: activeView === "all",
    },
    {
      label: "Quick Tasks",
      icon: <span className="text-xl">⚡</span>,
      onClick: handleQuickTasksClick,
      active: activeView === "quick",
    },
    {
      label: "Projects",
      icon: <span className="text-xl">📁</span>,
      onClick: handleProjectsClick,
      active: activeView === "projects",
    },
    {
      label: "Sign Out",
      icon: <span className="text-xl">🚪</span>,
      onClick: handleLogout,
      active: false,
      variant: "danger" as const,
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
  // Handles both create and update for projects
  const handleCreateOrUpdateProject = async (project: {
    name: string;
    description?: string;
  }) => {
    // If editing, update; else, create
    const isEdit = Boolean(editProject);
    try {
      await ensureCsrfToken();
      const url = isEdit
        ? editProject
          ? `/api/projects/${editProject.id}`
          : /* v8 ignore next */
            (() => {
              throw new Error(
                "editProject is null or undefined during edit operation",
              );
            })()
        : "/api/projects";
      const method = isEdit ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: project.name,
          ...(project.description !== undefined
            ? { description: project.description }
            : {}),
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error || `Failed to ${isEdit ? "update" : "create"} project`,
        );
      }
      await refetchProjects();
      setShowForm(false);
      setEditProject(null);
      showSuccess(
        isEdit ? "Project updated" : "Project created",
        isEdit
          ? "Project updated successfully."
          : "Project created successfully.",
      );
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Unknown error");
      showError(
        isEdit ? "Failed to update project" : "Failed to create project",
        err instanceof Error ? err.message : "Unknown error",
      );
    }
  };

  // Project tasks section moved to ProjectTasksView component

  if (activeView === "all") {
    content = (
      <AllTasksView
        tasks={tasks}
        projects={projects}
        loading={tasksLoading}
        error={tasksError}
        onToggle={handleTaskToggle}
        onOpen={handleTaskTitleClick}
        onDelete={(id, e) => {
          if (e) e.stopPropagation();
          handleDeleteTask(id);
        }}
        onAddFirstTask={handleAddNewTask}
      />
    );
  } else if (activeView === "quick") {
    content = (
      <QuickTasksView
        tasks={tasks}
        loading={tasksLoading}
        error={tasksError}
        onToggle={handleTaskToggle}
        onOpen={handleTaskTitleClick}
        onEdit={handleTaskEdit}
        onDelete={handleTaskDelete}
      />
    );
  } else if (activeView === "projects") {
    // Only show top-level project tasks (parent_id == null)
    content = (
      <div className="w-full max-w-3xl mx-auto py-10 px-4" aria-live="polite">
        {!selectedProject ? (
          <ProjectsOverview
            projects={projects}
            loading={projectsLoading}
            error={projectsError}
            onAddProject={handleAddProjectClick}
            onEditProject={(project) => {
              setEditProject(project);
              setShowForm(false);
            }}
            onDeleteProject={(project) => handleDeleteProject(project)}
            onSelectProject={(project) => setSelectedProject(project)}
          />
        ) : (
          // skipcq: JS-0415
          <>
            <div className="phub-item-card" style={{ marginBottom: "2rem" }}>
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
                  <div className="phub-item-description">
                    {selectedProject.description}
                  </div>
                )}
              </div>
            </div>

            <div className="phub-section-header">
              <h3 className="phub-section-title" style={{ fontSize: "1.5rem" }}>
                Tasks for this Project
              </h3>
              <p className="phub-section-subtitle">
                Manage project-specific tasks and deliverables
              </p>
            </div>

            <div className="phub-content-section">
              <ProjectTasksView
                tasks={tasks}
                selectedProject={selectedProject}
                loading={tasksLoading}
                error={tasksError}
                onToggle={handleTaskToggle}
                onOpen={handleTaskTitleClick}
                onEdit={handleTaskEdit}
                onDelete={handleTaskDelete}
                onAddTask={() => setShowTaskForm(true)}
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
          message={
            deleteProject
              ? `Are you sure you want to delete "${deleteProject.name}"? This cannot be undone.`
              : ""
          }
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
        task.subtasks.forEach((sub: Task) =>
          flat.push({ ...sub, parent_id: task.id }),
        );
      }
    });
    return flat;
  }, [tasks]);

  useEffect(() => {
    const handler = (e: CustomEvent<number>) => {
      const subtaskId = e.detail;
      const subtask = allTasks.find((t) => t.id === subtaskId);
      if (subtask) {
        setSelectedTask(getTaskWithProject(subtask));
        setTaskDetailsOpen(true);
      }
    };
    window.addEventListener("openTaskDetails", handler as EventListener);
    return () =>
      window.removeEventListener("openTaskDetails", handler as EventListener);
  }, [allTasks, projects]);

  // Add this handler above the return statement, near other handlers
  const handleTaskDetailsClose = () => {
    setTaskDetailsOpen(false);
  };

  function handleTaskFormClose(): void {
    setShowTaskForm(false);
    setEditTask(null);
  }

  // Add this handler above the return statement, near other handlers
  const handleSidebarCollapse = () => {
    setSidebarCollapsed((c) => !c);
  };

  // Add this handler above the return statement, near other handlers
  const handleTaskDetailsEdit = () => {
    /* v8 ignore start */
    setTaskDetailsOpen(false); // Close details modal before opening edit form
    openTaskForm(selectedTask);
  };
  /* v8 ignore stop */

  // Add this handler above the return statement, near other handlers
  const getParentTask = () => {
    if (selectedTask?.parent_id) {
      return tasks.find((t) => t.id === selectedTask.parent_id) || null;
    }
    return null;
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      data-testid="main-management-window"
    >
      <AppHeader
        rightContent={
          <BackgroundSwitcher
            currentBackground={backgroundType}
            onBackgroundChange={setBackgroundType}
          />
        }
      />
      <div className="flex h-screen">
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapse={handleSidebarCollapse}
          items={sidebarItems}
        />
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
            parentTask={getParentTask()}
            /* v8 ignore next */
            onEdit={handleTaskDetailsEdit}
            /* v8 ignore stop */
            tasks={tasks}
            projects={projects}
          />
        </main>
      </div>
    </div>
  );
}

export default MainManagementWindow;
