// Vitest hoisting fix: declare all shared state and mock functions INSIDE the vi.mock factory
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

import React from "react";
// Add global fetch mock
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Add mockAuth object
const mockAuth = {
  logout: vi.fn(),
};

// Reactive mock for useProjects with manual mutation helpers
let __projectsData: Array<{ id: number; name: string; description: string }> = [
  { id: 1, name: "Test Project", description: "Test Description" },
];
const __subscribers: Array<() => void> = [];
function __notify() {
  __subscribers.forEach((fn) => fn());
}
vi.mock("../../hooks/useProjects", () => {
  const React = require("react");
  return {
    __esModule: true,
    useProjects: () => {
      const [, setTick] = React.useState(0);
      React.useEffect(() => {
        const sub = () => setTick((t: number) => t + 1);
        __subscribers.push(sub);
        return () => {
          const idx = __subscribers.indexOf(sub);
          if (idx >= 0) __subscribers.splice(idx, 1);
        };
      }, []);
      return {
        projects: __projectsData,
        fetchProjects: vi.fn(),
        createProject: vi.fn(async (p: any) => {
          __projectsData = [...__projectsData, { id: Date.now(), ...p }];
          __notify();
        }),
        updateProject: vi.fn(),
        deleteProject: vi.fn(async (id: number) => {
          __projectsData = __projectsData.filter((p) => p.id !== id);
          __notify();
        }),
      };
    },
    __setProjectsData: (data: any[]) => {
      __projectsData = data;
      __notify();
    },
    __forceUpdate: () => __notify(),
  };
});

// Mock BackgroundProvider
const mockBackgroundContext = {
  backgroundType: "creative-dots",
  setBackgroundType: vi.fn(),
};

vi.mock("../../context/BackgroundContext", () => ({
  __esModule: true,
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
      // Provide a distinct project name so assertions differ from initial seed
      await onCreate({ name: "New Project", description: "A new project" });
    };
    const handleCancelClick = () => onClose();
    return (
      <div data-testid="project-form">
        <h2>{editMode ? "Edit Project" : "Create Project"}</h2>
        {error ? <div data-testid="project-error">{error}</div> : null}
        {initialName && <div>Initial: {initialName}</div>}
        <button onClick={handleSaveClick}>
          {editMode ? "Save Changes" : "Create Project"}
        </button>
        <button onClick={handleCancelClick}>Cancel</button>
      </div>
    );
  },
}));

// Mock the ConfirmDialog component
// Spy for onConfirm callback
export const onConfirmSpy = vi.fn();
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
  }) => {
    const handleConfirmClick = () => {
      onConfirmSpy();
      onConfirm();
    };
    const handleCancelClick = () => {
      onCancel();
    };
    return open ? (
      <div data-testid="confirm-dialog">
        <h2>{title}</h2>
        <button onClick={handleConfirmClick}>Confirm</button>
        <button onClick={handleCancelClick}>Cancel</button>
      </div>
    ) : null;
  },
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
  afterEach(() => {
    cleanup();
    mockFetch.mockReset();
  });

  describe("Project Form", () => {
    it("opens project form when switching to projects and clicking Add Project", async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("main-management-window")).toBeInTheDocument();
      }, { timeout: 5000 });

      const projectsBtn = screen
        .getAllByText("Projects")
        .find((button) => button.closest(".phub-sidebar-nav"))
        ?.closest("button");
      expect(projectsBtn).toBeTruthy();
      if (projectsBtn) {
        fireEvent.click(projectsBtn);
      }

      await waitFor(() => {
        const addProjectButton = screen.getByText("Add Project");
        fireEvent.click(addProjectButton);
      }, { timeout: 5000 });

      await waitFor(() => {
        expect(screen.getByTestId("project-form")).toBeInTheDocument();
      }, { timeout: 5000 });
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
                id: 2,
                name: "New Project",
                description: "A new project",
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

      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("main-management-window")).toBeInTheDocument();
      }, { timeout: 5000 });

      const projectsBtn = screen
        .getAllByText("Projects")
        .find((button) => button.closest(".phub-sidebar-nav"))
        ?.closest("button");
      expect(projectsBtn).toBeTruthy();
      if (projectsBtn) {
        fireEvent.click(projectsBtn);
      }

      await waitFor(() => {
        const addProjectButton = screen.getByText("Add Project");
        fireEvent.click(addProjectButton);
      }, { timeout: 5000 });

      await waitFor(() => {
        expect(screen.getByTestId("project-form")).toBeInTheDocument();
      }, { timeout: 5000 });

      const createButton = screen.getByRole("button", {
        name: "Create Project",
      });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText("New Project")).toBeInTheDocument();
      }, { timeout: 5000 });
  });

    it("closes project form when cancel is clicked", async () => {
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

      const projectsBtn = screen
        .getAllByText("Projects")
        .find((button) => button.closest(".phub-sidebar-nav"))
        ?.closest("button");
      if (projectsBtn) {
        fireEvent.click(projectsBtn);
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

      const cancelButton = screen.getByRole("button", {
        name: "Cancel",
      });
      fireEvent.click(cancelButton);

      await waitFor(
        () => {
          expect(screen.queryByTestId("project-form")).not.toBeInTheDocument();
        },
        { timeout: 5000 },
      );
  });

  it("handles project editing (placeholder - currently duplicates deletion flow)", async () => {
      const projectsBtn = screen
        .getAllByText("Projects")
        .find((button) => button.closest(".phub-sidebar-nav"))
        ?.closest("button");
      expect(projectsBtn).toBeTruthy();
      if (projectsBtn) {
        await act(async () => {
          fireEvent.click(projectsBtn);
        });
      }

      await waitFor(() => {
        expect(screen.getByText("Test Project")).toBeInTheDocument();
      });

      const deleteButton = await waitFor(() => screen.getByText("Delete"));
      expect(deleteButton).toBeTruthy();
      await act(async () => {
        fireEvent.click(deleteButton);
      });

      // Use class selector for confirmation dialog
      await waitFor(() => {
        expect(document.querySelector('.phub-modal-backdrop')).toBeInTheDocument();
      });

      // Find the Delete button inside the modal and click it
      const modal = document.querySelector('.phub-modal-backdrop');
      expect(modal).toBeTruthy();
      const confirmButton = modal?.querySelector('button');
      expect(confirmButton).toBeTruthy();
      if (confirmButton) {
        await act(async () => {
          fireEvent.click(confirmButton);
        });
      }

      // Assert that onConfirmSpy was called
      expect(onConfirmSpy).toHaveBeenCalled();

      // Check that the dialog and project are gone
      expect(document.querySelector('.phub-modal-backdrop')).not.toBeInTheDocument();
      expect(screen.queryByText("Test Project")).not.toBeInTheDocument();
    });

    it("handles project deletion confirmation", async () => {
      onConfirmSpy.mockClear();
      // Reset shared projects array before test using mock helper
  // Reset internal reactive data
  __projectsData = [{ id: 1, name: "Test Project", description: "Test Description" }];

      mockFetch.mockReset();
      // Initial projects fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ projects: [{ id: 1, name: "Test Project", description: "Test Description" }] }),
      } as Response);
      // Initial tasks fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: [] }),
      } as Response);
      // Project deletion API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);
      // Projects fetch after deletion (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ projects: [] }),
      } as Response);

      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await waitFor(() => {
        expect(screen.getByRole("main")).toBeInTheDocument();
      });

      const projectsBtn = screen
        .getAllByText("Projects")
        .find((button) => button.closest(".phub-sidebar-nav"))
        ?.closest("button");
      expect(projectsBtn).toBeTruthy();
      if (projectsBtn) {
        await act(async () => {
          fireEvent.click(projectsBtn);
        });
      }

      await waitFor(() => {
        expect(screen.getByText("Test Project")).toBeInTheDocument();
      });

      const deleteButton = await waitFor(() => screen.getByText("Delete"));
      expect(deleteButton).toBeTruthy();
      await act(async () => {
        fireEvent.click(deleteButton);
      });

      // Use class selector for confirmation dialog
      await waitFor(() => {
        expect(document.querySelector('.phub-modal-backdrop')).toBeInTheDocument();
      });

      // Find the Delete button inside the modal and click it
      const modal = document.querySelector('.phub-modal-backdrop');
      expect(modal).toBeTruthy();
      const confirmButton = modal?.querySelector('button');
      expect(confirmButton).toBeTruthy();
      if (confirmButton) {
        await act(async () => {
          fireEvent.click(confirmButton);
        });
      }

      // Assert that onConfirmSpy was called
      expect(onConfirmSpy).toHaveBeenCalled();

      // Check that the dialog and project are gone
      expect(document.querySelector('.phub-modal-backdrop')).not.toBeInTheDocument();
      expect(screen.queryByText("Test Project")).not.toBeInTheDocument();
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

      // Check for error message by text instead of test ID
      await waitFor(() => {

        expect(screen.getByText(/Project name already exists/i)).toBeInTheDocument();
      });
    });
  });
});
