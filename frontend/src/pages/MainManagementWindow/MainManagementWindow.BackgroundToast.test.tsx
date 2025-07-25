import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";
import MainManagementWindow from "../MainManagementWindow";
import { AuthProvider } from "../../auth";
import { BackgroundProvider } from "../../context/BackgroundContext";
import { ToastProvider } from "../../components/ToastProvider";

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

// Mock hooks
vi.mock("../../hooks/useProjects", () => ({
  useProjects: () => ({
    projects: [
      { id: 1, name: "Test Project", description: "Test project description" },
    ],
    loading: false,
    error: null,
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    refetch: vi.fn(),
  }),
}));

vi.mock("../../hooks/useTasks", () => ({
  useTasks: () => ({
    ensureCsrfToken: vi.fn(() => Promise.resolve("mocked_csrf_token")),
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
  }),
}));

// Mock the BackgroundSwitcher component
vi.mock("../../components/BackgroundSwitcher", () => ({
  default: ({
    currentBackground,
    onBackgroundChange,
  }: {
    currentBackground: string;
    onBackgroundChange: (type: string) => void;
  }) => (
    <button
      data-testid="background-switcher"
      onClick={() => onBackgroundChange("neural-network")}
    >
      Background: {currentBackground}
    </button>
  ),
}));

interface TaskFormProps {
  open: boolean;
  onSubmit: (task: { title: string; description: string }) => void;
  onClose: () => void;
  error?: string | null;
}
interface ProjectFormProps {
  open: boolean;
  onSubmit: (project: { name: string; description: string }) => void;
  onClose: () => void;
  error?: string | null;
}
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
interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
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
vi.mock("../../components/TaskDetails", () => ({
  default: (props: TaskDetailsProps) => {
    const { open, task, onClose, onUpdate, onDelete } = props;
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

describe("MainManagementWindow - Background & Toast Providers", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  describe("Background Management", () => {
    it("changes background when background switcher is used", () => {
      act(() => {
        render(<MainManagementWindowWrapper />);
      });

      const backgroundSwitcher = screen.getByTestId("background-switcher");
      act(() => {
        fireEvent.click(backgroundSwitcher);
      });

      expect(mockBackground.setBackgroundType).toHaveBeenCalledWith(
        "neural-network",
      );
    });
  });

  describe("Component Integration", () => {
    it("integrates with all required context providers", () => {
      render(<MainManagementWindowWrapper />);

      // Check that main component renders successfully with all providers
      expect(screen.getByTestId("main-management-window")).toBeInTheDocument();

      // Check background switcher is present and working
      expect(screen.getByTestId("background-switcher")).toBeInTheDocument();
    });

    it("handles form dialogs properly", () => {
      render(<MainManagementWindowWrapper />);

      // Check that forms don't render initially (they should be closed)
      expect(screen.queryByTestId("task-form")).not.toBeInTheDocument();
      expect(screen.queryByTestId("project-form")).not.toBeInTheDocument();
      expect(screen.queryByTestId("task-details")).not.toBeInTheDocument();
    });
  });
});
