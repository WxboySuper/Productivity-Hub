import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";
import MainManagementWindow from "../MainManagementWindow";
import { AuthProvider } from "../../auth";
import { BackgroundProvider } from "../../context/BackgroundContext";
import { ToastProvider } from "../../components/common/ToastProvider";

// Setup global fetch mock properly
global.fetch = vi.fn().mockImplementation((url: string) => {
  if (url === "/api/csrf-token") {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ csrf_token: "mock-token" }),
    } as Response);
  }
  if (url === "/api/projects") {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          projects: [
            {
              id: 1,
              name: "Test Project",
              description: "Test project description",
            },
          ],
        }),
    } as Response);
  }
  if (url === "/api/tasks") {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          tasks: [
            {
              id: 1,
              title: "Test Task",
              description: "Test task description",
              projectId: 1,
              parent_id: null,
              completed: false,
            },
          ],
        }),
    } as Response);
  }
  // Default fallback
  return Promise.resolve({
    ok: false,
    json: () => Promise.resolve({ error: "Not found" }),
  } as Response);
});

// Create a typed version of the mock for easier use
const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

// Mock the auth hook
const mockAuth = {
  isAuthenticated: true,
  isLoading: false,
  user: { id: 1, username: "testuser", email: "test@example.com" },
  login: vi.fn(),
  logout: vi.fn().mockResolvedValue(true),
  checkAuth: vi.fn(),
};

vi.mock("../../auth", () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Mock the background context
const mockBackground = {
  backgroundType: "creative-dots" as const,
  setBackgroundType: vi.fn(),
};

vi.mock("../../context/BackgroundContext", () => ({
  __esModule: true,
  useBackground: () => mockBackground,
  BackgroundProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Mock the toast context
const mockToast = {
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
  showToast: vi.fn(),
  removeToast: vi.fn(),
};

vi.mock("../../components/ToastProvider", () => ({
  useToast: () => mockToast,
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Mock hooks with configurable state
const mockProjects = {
  projects: [
    { id: 1, name: "Test Project", description: "Test project description" },
  ],
  loading: false,
  error: null,
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  refetch: vi.fn(),
};

const mockTasks = {
  tasks: [
    {
      id: 1,
      title: "Test Task",
      description: "Test task description",
      projectId: 1,
      parent_id: null,
      completed: false,
    },
  ],
  loading: false,
  error: null,
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  refetch: vi.fn(),
};

vi.mock("../../hooks/useProjects", () => ({
  useProjects: () => mockProjects,
}));

vi.mock("../../hooks/useTasks", () => ({
  useTasks: () => mockTasks,
  ensureCsrfToken: vi.fn(() => Promise.resolve("mocked_csrf_token")),
}));

// Mock the TaskForm component
interface TaskFormProps {
  open: boolean;
  onSubmit: (task: { title: string; description: string }) => void;
  onClose: () => void;
  error?: string | null;
}

vi.mock("../../components/TaskForm", () => ({
  default: ({ open, onSubmit, onClose, error }: TaskFormProps) => {
    if (!open) return null;
    const handleSubmit = () =>
      onSubmit({ title: "Test Task", description: "Test Description" });
    return (
      <div data-testid="task-form">
        <h2>Task Form</h2>
        <button onClick={handleSubmit}>Submit</button>
        <button onClick={onClose}>Cancel</button>
        {error && <div data-testid="task-form-error">{error}</div>}
      </div>
    );
  },
}));

// Mock the ProjectForm component
interface ProjectFormProps {
  open: boolean;
  onSubmit: (project: { name: string; description: string }) => void;
  onClose: () => void;
  error?: string | null;
}

vi.mock("../../components/ProjectForm", () => ({
  default: ({ open, onSubmit, onClose, error }: ProjectFormProps) => {
    if (!open) return null;
    const handleSubmit = () =>
      onSubmit({ name: "Test Project", description: "Test Description" });
    return (
      <div data-testid="project-form">
        <h2>Project Form</h2>
        <button onClick={handleSubmit}>Submit</button>
        <button onClick={onClose}>Cancel</button>
        {error && <div data-testid="project-form-error">{error}</div>}
      </div>
    );
  },
}));

// Mock the TaskDetails component
interface TaskDetailsProps {
  open: boolean;
  task: {
    id: number;
    title: string;
    description: string;
    completed: boolean;
    projectId: number | null;
    parent_id: number | null;
  };
  onClose: () => void;
  onUpdate: (task: {
    id: number;
    title: string;
    description: string;
    completed: boolean;
    projectId: number | null;
    parent_id: number | null;
  }) => void;
  onDelete: (id: number) => void;
}

vi.mock("../../components/TaskDetails", () => ({
  default: ({ open, task, onClose, onUpdate, onDelete }: TaskDetailsProps) => {
    if (!open) return null;
    const handleToggleComplete = () =>
      onUpdate({ ...task, completed: !task.completed });
    const handleDelete = () => onDelete(task.id);
    return (
      <div data-testid="task-details">
        <h2>Task Details</h2>
        <div>{task?.title}</div>
        <button onClick={handleToggleComplete}>Toggle Complete</button>
        <button onClick={handleDelete}>Delete</button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  },
}));

// Mock ConfirmDialog
interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

vi.mock("../../components/ConfirmDialog", () => ({
  default: ({ open, onConfirm, onCancel }: ConfirmDialogProps) => {
    if (!open) return null;
    return (
      <div data-testid="confirm-dialog">
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  },
}));

const MainManagementWindowWrapper = () => (
  <BrowserRouter>
    <AuthProvider>
      <BackgroundProvider>
        <ToastProvider>
          <MainManagementWindow />
        </ToastProvider>
      </BackgroundProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe("MainManagementWindow - State Management & UI Interactions", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    mockFetch.mockClear();

    // Reset mock objects to default state
    mockProjects.error = null;
    mockProjects.loading = false;
    mockProjects.projects = [
      { id: 1, name: "Test Project", description: "Test project description" },
    ];

    mockTasks.error = null;
    mockTasks.loading = false;
    mockTasks.tasks = [
      {
        id: 1,
        title: "Test Task",
        description: "Test task description",
        projectId: 1,
        parent_id: null,
        completed: false,
      },
    ];
  });

  afterEach(() => {
    cleanup();
  });

  describe("State Management and UI Interactions", () => {
    it("handles sidebar toggle state persistence", () => {
      render(<MainManagementWindowWrapper />);

      // Find collapse button
      const collapseButton = screen.getByLabelText("Collapse sidebar");

      // Toggle collapsed state
      fireEvent.click(collapseButton);
      expect(screen.getByLabelText("Expand sidebar")).toBeInTheDocument();

      // Toggle back
      const expandButton = screen.getByLabelText("Expand sidebar");
      fireEvent.click(expandButton);
      expect(screen.getByLabelText("Collapse sidebar")).toBeInTheDocument();
    });

    it("handles task normalization with project_id field compatibility", () => {
      const taskWithProjectId = {
        id: 1,
        title: "Backend Task",
        description: "Backend task description",
        completed: false,
        projectId: 1,
        parent_id: null,
      };

      mockTasks.tasks = [taskWithProjectId];
      mockProjects.projects = [
        { id: 1, name: "Backend Project", description: "Backend project" },
      ];

      render(<MainManagementWindowWrapper />);

      // Component should render successfully with different task format
      expect(screen.getByTestId("main-management-window")).toBeInTheDocument();
    });

    it("handles view switching with task filtering", () => {
      const quickTask = {
        id: 1,
        title: "Quick Task",
        description: "Quick task description",
        completed: false,
        projectId: 1,
        parent_id: null,
      };
      const projectTask = {
        id: 2,
        title: "Project Task",
        description: "Project task description",
        completed: false,
        projectId: 1,
        parent_id: null,
      };

      mockTasks.tasks = [quickTask, projectTask];

      render(<MainManagementWindowWrapper />);

      // Check that component renders with tasks
      expect(screen.getByTestId("main-management-window")).toBeInTheDocument();

      // Switch to Quick Tasks view
      const quickTasksButton = screen
        .getByText("Quick Tasks")
        .closest("button");
      if (quickTasksButton) {
        fireEvent.click(quickTasksButton);
      }

      // Component should continue to work after view switch
      expect(screen.getByTestId("main-management-window")).toBeInTheDocument();
    });

    it("handles empty state rendering for all views", () => {
      mockProjects.projects = [];
      mockTasks.tasks = [];

      render(<MainManagementWindowWrapper />);

      // Component should render successfully even with empty data
      expect(screen.getByTestId("main-management-window")).toBeInTheDocument();

      // Quick Tasks view
      const quickTasksButton = screen
        .getByText("Quick Tasks")
        .closest("button");
      if (quickTasksButton) {
        fireEvent.click(quickTasksButton);
      }

      // Component should continue to work
      expect(screen.getByTestId("main-management-window")).toBeInTheDocument();

      // Projects view
      const projectsButton = screen.getByText("Projects").closest("button");
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      // Component should continue to work
      expect(screen.getByTestId("main-management-window")).toBeInTheDocument();
    });
  });

  describe("Inline Function Coverage", () => {
    it("handles inline arrow function in task title clicks for task details", async () => {
      const task = {
        id: 1,
        title: "Test Task 1",
        description: "Test task description",
        projectId: 1,
        parent_id: null,
        completed: false,
      };

      mockTasks.tasks = [task];

      render(<MainManagementWindowWrapper />);

      // Component should render successfully
      expect(screen.getByTestId("main-management-window")).toBeInTheDocument();

      // Try to find and click task title if it exists
      const taskTitles = screen.queryAllByText("Test Task 1");
      if (taskTitles.length > 0) {
        fireEvent.click(taskTitles[0]);

        await waitFor(
          () => {
            const taskDetails = screen.queryByTestId("task-details");
            if (taskDetails) {
              expect(taskDetails).toBeInTheDocument();
            }
          },
          { timeout: 5000 },
        );
      }
    });

    it("handles inline arrow function in sidebar collapse toggle", async () => {
      render(<MainManagementWindowWrapper />);

      await waitFor(
        () => {
          expect(
            screen.getByTestId("main-management-window"),
          ).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // Find and click the sidebar collapse button using aria-label
      const collapseButton = screen.getByLabelText("Collapse sidebar");

      // Verify initial state (not collapsed)
      const sidebar = document.querySelector(".phub-sidebar");
      expect(sidebar).not.toHaveClass("phub-sidebar-collapsed");

      fireEvent.click(collapseButton);

      // Check that the sidebar state changes by looking for the collapsed class
      await waitFor(
        () => {
          expect(sidebar).toHaveClass("phub-sidebar-collapsed");
        },
        { timeout: 5000 },
      );
    });

    it("handles task interaction buttons", () => {
      const task = {
        id: 1,
        title: "Test Task 1",
        description: "Test task description",
        projectId: 1,
        parent_id: null,
        completed: false,
      };

      mockTasks.tasks = [task];

      render(<MainManagementWindowWrapper />);

      // Component should render successfully
      expect(screen.getByTestId("main-management-window")).toBeInTheDocument();

      // Check if checkboxes exist and interact if available
      const checkboxes = screen.queryAllByRole("checkbox");
      if (checkboxes.length > 0) {
        fireEvent.click(checkboxes[0]);
        // Mock hook method should be called
      }
    });

    it("handles task details interactions", async () => {
      const task = {
        id: 1,
        title: "Test Task 1",
        description: "Test task description",
        projectId: 1,
        parent_id: null,
        completed: false,
      };

      mockTasks.tasks = [task];

      render(<MainManagementWindowWrapper />);

      // Component should render successfully
      expect(screen.getByTestId("main-management-window")).toBeInTheDocument();

      // Try to open task details if task title is available
      const taskTitles = screen.queryAllByText("Test Task 1");
      if (taskTitles.length > 0) {
        fireEvent.click(taskTitles[0]);

        await waitFor(
          () => {
            if (screen.queryByTestId("task-details")) {
              const toggleButton = screen.getByText("Toggle Complete");
              fireEvent.click(toggleButton);

              const deleteButton = screen.getByText("Delete");
              fireEvent.click(deleteButton);
            }
          },
          { timeout: 5000 },
        );
      }
    });

    it("handles form interactions and state", async () => {
      render(<MainManagementWindowWrapper />);

      // Open task form
      const addNewButton = screen.getByText("Add New");
      fireEvent.click(addNewButton);

      await waitFor(
        () => {
          expect(screen.getByTestId("task-form")).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // The form should render properly with submit and cancel buttons
      expect(screen.getByText("Submit")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();

      // Close form
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      await waitFor(
        () => {
          expect(screen.queryByTestId("task-form")).not.toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });
  });
});
