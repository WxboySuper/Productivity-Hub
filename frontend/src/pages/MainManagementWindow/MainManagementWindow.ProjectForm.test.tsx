import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from "@testing-library/react";
import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";
import MainManagementWindow from "../MainManagementWindow";
import { AuthProvider } from "../../auth";
import { BackgroundProvider } from "../../context/BackgroundContext";
import { ToastProvider } from "../../components/common/ToastProvider";

// Mock useTasks with ensureCsrfToken for CSRF-dependent tests (not used for project creation, but keep for other tests)
vi.mock("../../hooks/useTasks", () => ({
  useTasks: () => ({
    tasks: [],
    loading: false,
    error: null,
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    refetch: vi.fn(),
  }),
  ensureCsrfToken: vi.fn(() => Promise.resolve("mocked_csrf_token")),
}));

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
            {
              id: 2,
              title: "Quick Task",
              description: "A quick task",
              projectId: null,
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

// Mock AuthProvider
vi.mock("../../auth", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
  useAuth: () => mockAuth,
}));

// Mock BackgroundProvider
const mockBackgroundContext = {
  backgroundType: "creative-dots",
  setBackgroundType: vi.fn(),
};

vi.mock("../../context/BackgroundContext", () => ({
  BackgroundProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="background-provider">{children}</div>
  ),
  useBackground: () => mockBackgroundContext,
}));

// Mock ToastProvider
const mockToastContext = {
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
};

vi.mock("../../components/ToastProvider", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="toast-provider">{children}</div>
  ),
  useToast: () => mockToastContext,
}));

// Mock router navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the ProjectForm component
vi.mock("../../components/ProjectForm", () => ({
  default: ({
    onCreate,
    onClose,
    initialName,
    editMode,
    error,
  }: {
    onCreate: (project: { name: string; description: string }) => void;
    onClose: () => void;
    initialName?: string;
    editMode?: boolean;
    error?: string | null;
  }) => {
    const handleSaveClick = async () => {
      await onCreate({ name: "Test Project", description: "Test Description" });
    };
    return (
      <div data-testid="project-form">
        <h2>{editMode ? "Edit Project" : "Create Project"}</h2>
        {error ? <div data-testid="project-error">{error}</div> : null}
        {initialName && <div>Initial: {initialName}</div>}
        <button onClick={handleSaveClick}>
          {editMode ? "Save Changes" : "Create Project"}
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  },
}));

// Mock the ConfirmDialog component
vi.mock("../../components/ConfirmDialog", () => ({
  default: ({
    open,
    title,
    onConfirm,
    onCancel,
  }: {
    open: boolean;
    title: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) =>
    open ? (
      <div data-testid="confirm-dialog">
        <h2>{title}</h2>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}));

const MainManagementWindowWrapper: React.FC = () => (
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

describe("MainManagementWindow - Project Form & Management", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockAuth.logout.mockClear();
    mockBackgroundContext.setBackgroundType.mockClear();
    mockToastContext.showSuccess.mockClear();
    mockToastContext.showError.mockClear();
    mockToastContext.showWarning.mockClear();
    mockToastContext.showInfo.mockClear();
    mockNavigate.mockClear();
    // Removed useTasksError and mockCreateTask cleanup as they are no longer used
  });

  afterEach(() => {
    cleanup();
  });

  describe("Project Form", () => {
    it("opens project form when switching to projects and clicking Add Project", async () => {
      // Set up empty projects for this test
      mockFetch.mockImplementation((url: string) => {
        if (url === "/api/csrf-token") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrf_token: "mock-token" }),
          } as Response);
        }
        if (url === "/api/projects") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: [] }),
          } as Response);
        }
        if (url === "/api/tasks") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ tasks: [] }),
          } as Response);
        }
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: "Not found" }),
        } as Response);
      });

      await act(() => {
        render(<MainManagementWindowWrapper />);
      });

      await waitFor(
        () => {
          expect(
            screen.getByTestId("main-management-window"),
          ).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      const projectsButton = screen
        .getAllByText("Projects")
        .find((button) => button.closest(".phub-sidebar-nav"))
        ?.closest("button");
      if (projectsButton) {
        await act(() => {
          fireEvent.click(projectsButton);
        });
      }

      await waitFor(
        () => {
          const addProjectButton = screen.getByText("Add Project");
          fireEvent.click(addProjectButton);
        },
        { timeout: 5000 },
      );

      await waitFor(
        () => {
          expect(screen.getByTestId("project-form")).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });

    it("closes project form when cancel is clicked", async () => {
      // Set up empty projects for this test
      mockFetch.mockImplementation((url: string) => {
        if (url === "/api/csrf-token") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrf_token: "mock-token" }),
          } as Response);
        }
        if (url === "/api/projects") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: [] }),
          } as Response);
        }
        if (url === "/api/tasks") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ tasks: [] }),
          } as Response);
        }
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: "Not found" }),
        } as Response);
      });

      await act(() => {
        render(<MainManagementWindowWrapper />);
      });

      await waitFor(
        () => {
          expect(
            screen.getByTestId("main-management-window"),
          ).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      const projectsButton = screen
        .getAllByText("Projects")
        .find((button) => button.closest(".phub-sidebar-nav"))
        ?.closest("button");
      if (projectsButton) {
        await act(() => {
          fireEvent.click(projectsButton);
        });
      }

      await waitFor(
        () => {
          const addProjectButton = screen.getByText("Add Project");
          fireEvent.click(addProjectButton);
        },
        { timeout: 5000 },
      );

      expect(screen.getByTestId("project-form")).toBeInTheDocument();

      const projectForm = screen.getByTestId("project-form");
      const cancelButton = projectForm.querySelector("button:last-child");
      if (cancelButton) {
        await act(() => {
          fireEvent.click(cancelButton);
        });
      }

      await waitFor(
        () => {
          expect(screen.queryByTestId("project-form")).not.toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });
  });

  describe("Project Management", () => {
    it("handles project creation successfully", async () => {
      mockFetch.mockImplementation((url: string, options?: unknown) => {
        if (url === "/api/csrf-token") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrf_token: "test-token" }),
          } as Response);
        }
        if (
          url === "/api/projects" &&
          (options as { method?: string })?.method === "POST"
        ) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                id: 1,
                name: "Test Project",
                description: "Test Description",
              }),
          } as Response);
        }
        if (url === "/api/projects") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: [] }),
          } as Response);
        }
        if (url === "/api/tasks") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ tasks: [] }),
          } as Response);
        }
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: "Not found" }),
        } as Response);
      });

      await act(() => {
        render(<MainManagementWindowWrapper />);
      });

      await waitFor(
        () => {
          expect(
            screen.getByTestId("main-management-window"),
          ).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      const projectsButton = screen
        .getAllByText("Projects")
        .find((button) => button.closest(".phub-sidebar-nav"))
        ?.closest("button");
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      await waitFor(
        () => {
          const addProjectButton = screen.getByText("Add Project");
          fireEvent.click(addProjectButton);
        },
        { timeout: 5000 },
      );

      await waitFor(
        () => {
          expect(screen.getByTestId("project-form")).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      const createButton = screen.getByRole("button", {
        name: "Create Project",
      });
      fireEvent.click(createButton);

      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledWith(
            "/api/projects",
            expect.objectContaining({
              method: "POST",
              credentials: "include",
            }),
          );
        },
        { timeout: 5000 },
      );
    });

    it("handles project editing", async () => {
      const testProject = {
        id: 1,
        name: "Test Project",
        description: "Test Description",
      };

      mockFetch.mockReset();

      // Projects fetch when switching to projects view
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ projects: [testProject] }),
      } as Response);

      // Initial tasks fetch (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: [] }),
      } as Response);

      await act(() => {
        render(<MainManagementWindowWrapper />);
      });

      // Wait for initial load
      await waitFor(
        () => {
          expect(screen.getByRole("main")).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // Switch to Projects view
      const projectsButton = screen
        .getAllByText("Projects")
        .find((button) => button.closest(".phub-sidebar-nav"))
        ?.closest("button");
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      // Wait for projects to load
      await waitFor(
        () => {
          expect(
            screen.getByText("Organize your work into meaningful projects"),
          ).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      await waitFor(
        () => {
          expect(screen.getByText("Test Project")).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      await waitFor(
        () => {
          const editButton = screen.getByText("Edit");
          fireEvent.click(editButton);
          expect(screen.getByTestId("project-form")).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });

    it("handles project deletion confirmation", async () => {
      const testProject = {
        id: 1,
        name: "Test Project",
        description: "Test Description",
      };

      mockFetch.mockReset();

      // Projects fetch when switching to projects view
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ projects: [testProject] }),
      } as Response);

      // Initial tasks fetch (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: [] }),
      } as Response);

      await act(() => {
        render(<MainManagementWindowWrapper />);
      });

      // Wait for initial load
      await waitFor(
        () => {
          expect(screen.getByRole("main")).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // Switch to Projects view
      const projectsButton = screen
        .getAllByText("Projects")
        .find((button) => button.closest(".phub-sidebar-nav"))
        ?.closest("button");
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      // Wait for projects to load
      await waitFor(
        () => {
          expect(screen.getByText("Test Project")).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // Click delete button
      const deleteButton = screen.getByText("Delete");
      fireEvent.click(deleteButton);

      // Should show confirmation dialog
      await waitFor(
        () => {
          expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });

    it("handles project creation error", async () => {
      // Set up fetch mock for project creation error
      mockFetch.mockImplementation((url: string, options?: unknown) => {
        if (url === "/api/csrf-token") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrf_token: "test-token" }),
          } as Response);
        }
        if (
          url === "/api/projects" &&
          (options as { method?: string })?.method === "POST"
        ) {
          return Promise.resolve({
            ok: false,
            json: () =>
              Promise.resolve({ error: "Project name already exists" }),
          } as Response);
        }
        if (url === "/api/projects") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: [] }),
          } as Response);
        }
        if (url === "/api/tasks") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ tasks: [] }),
          } as Response);
        }
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: "Not found" }),
        } as Response);
      });

      await act(() => {
        render(<MainManagementWindowWrapper />);
      });

      await waitFor(
        () => {
          expect(
            screen.getByTestId("main-management-window"),
          ).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      const projectsButton = screen
        .getAllByText("Projects")
        .find((button) => button.closest(".phub-sidebar-nav"))
        ?.closest("button");
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      const addProjectButton = await waitFor(
        () => {
          return screen.getByText("Add Project");
        },
        { timeout: 5000 },
      );

      await act(() => {
        fireEvent.click(addProjectButton);
      });

      await waitFor(
        () => {
          expect(screen.getByTestId("project-form")).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      const createButton = screen.getByRole("button", {
        name: "Create Project",
      });
      await act(() => {
        fireEvent.click(createButton);
      });

      await waitFor(
        () => {
          expect(screen.getByTestId("project-error")).toHaveTextContent(
            "Project name already exists",
          );
        },
        { timeout: 3000 },
      );
    });
  });
});
