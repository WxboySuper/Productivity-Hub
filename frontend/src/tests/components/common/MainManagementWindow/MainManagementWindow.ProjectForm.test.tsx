// Vitest hoisting fix: declare all shared state and mock functions INSIDE the vi.mock factory
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  cleanup,
  within,
} from "@testing-library/react";

import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";
import MainManagementWindow from "../../../../pages/MainManagementWindow";
import { AuthProvider } from "../../../../auth";
import { BackgroundProvider } from "../../../../context/BackgroundContext";
import { ToastProvider } from "../../../../components/common/ToastProvider";

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

// Define mock functions in an outer scope
const mockUpdateProject = vi.fn();

vi.mock("../../../../hooks/useProjects", () => {
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
        refetch: vi.fn(async () => {
          // Simulate refetching by adding the new project to the dataset
          const newProject = {
            id: 2,
            name: "New Project",
            description: "A new project",
          };
          if (!__projectsData.some((p) => p.name === newProject.name)) {
            __projectsData.push(newProject);
          }
          __notify();
        }),
        createProject: vi.fn(async (p: any) => {
          __projectsData = [...__projectsData, { id: Date.now(), ...p }];
          __notify();
        }),
        updateProject: mockUpdateProject,
        deleteProject: vi.fn(async (id: number) => {
          const index = __projectsData.findIndex((p) => p.id === id);
          if (index > -1) {
            __projectsData.splice(index, 1);
          }
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

vi.mock("../../../../context/BackgroundContext", () => ({
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

vi.mock("../../../../components/ToastProvider", () => ({
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
vi.mock("../../../../components/ProjectForm", () => ({
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
// Do not mock ConfirmDialog, use the real component
vi.unmock("../../../../components/common/ConfirmDialog");
// Spy for onConfirm callback
export const onConfirmSpy = vi.fn();

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
      expect(projectsBtn).toBeTruthy();
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
    });
  });
  describe("Project Management", () => {
    beforeEach(() => {
      // Reset mock data before each test in this suite
      __projectsData = [
        { id: 1, name: "Test Project", description: "Test Description" },
      ];
    });

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
      expect(projectsBtn).toBeTruthy();
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

      const createButton = screen.getByRole("button", {
        name: "Create Project",
      });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText("New Project")).toBeInTheDocument();
      });
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

    it("handles project editing successfully", async () => {
      mockFetch.mockImplementation((url) => {
        if (url === "/api/csrf-token") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrf_token: "test-token" }),
          } as Response);
        }
        if (url === "/api/projects/1") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 1, name: "Updated Project" }),
          } as Response);
        }
        // Default mock for other calls
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response);
      });

      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      // Navigate to projects view
      const projectsBtn = screen
        .getAllByText("Projects")
        .find((button) => button.closest(".phub-sidebar-nav"))
        ?.closest("button");
      if (projectsBtn) fireEvent.click(projectsBtn);

      // Find the project card and then the "Edit" button within it
      const projectCard = await screen
        .findByText("Test Project")
        .then((el) => el.closest(".phub-item-card") as HTMLElement);
      const editButton = within(projectCard).getByRole("button", {
        name: /edit/i,
      });
      fireEvent.click(editButton);

      // Verify the form opens in edit mode
      const form = await screen.findByTestId("project-form");
      expect(form).toBeInTheDocument();
      expect(
        within(form).getByRole("heading", { name: /edit project/i }),
      ).toBeInTheDocument();

      // Click the "Save Changes" button
      const saveButton = within(form).getByRole("button", {
        name: /save changes/i,
      });
      fireEvent.click(saveButton);

      // Verify that fetch was called with the update request
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/projects/1",
          expect.objectContaining({
            method: "PUT",
            body: JSON.stringify({
              name: "New Project",
              description: "A new project",
            }),
          }),
        );
      });
    });

    it("handles project deletion confirmation", async () => {
      onConfirmSpy.mockClear();
      // Reset shared projects array before test using mock helper
      // Reset internal reactive data
      __projectsData = [
        { id: 1, name: "Test Project", description: "Test Description" },
      ];

      mockFetch.mockReset();
      // Initial projects fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            projects: [
              { id: 1, name: "Test Project", description: "Test Description" },
            ],
          }),
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

      const projectCard = await screen
        .findByText("Test Project")
        .then((el) => el.closest(".phub-item-card") as HTMLElement);
      const deleteButton = within(projectCard).getByRole("button", {
        name: /delete/i,
      });
      await act(async () => {
        fireEvent.click(deleteButton);
      });

      // Wait for the real confirmation dialog
      const dialog = await screen.findByRole("dialog", {
        name: /delete project/i,
      });

      // Click the "Delete" button inside the real dialog
      const confirmButton = within(dialog).getByRole("button", {
        name: "🗑️ Delete",
      });
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      // Assert that the project is deleted from the mock data
      await waitFor(() => {
        expect(__projectsData.find((p) => p.id === 1)).toBeUndefined();
      });

      // Check that the dialog and project are gone
      expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();
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

      // Check for the error message specifically within the form
      await waitFor(() => {
        const form = screen.getByTestId("project-form");
        expect(
          within(form).getByText(/Project name already exists/i),
        ).toBeInTheDocument();
      });
    });
  });
});
