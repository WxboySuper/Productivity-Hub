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
import MainManagementWindow from "../MainManagementWindow";
import { AuthProvider } from "../../auth";
import { BackgroundProvider } from "../../context/BackgroundContext";
import { ToastProvider } from "../../components/common/ToastProvider";
import {
  mockAuth,
  mockBackgroundContext,
  mockToastContext,
  mockNavigate,
  mockProjectData,
  mockTaskData,
} from "../__tests__/testUtils";
import { useProjects } from "../../hooks/useProjects";
import { useTasks, ensureCsrfToken } from "../../hooks/useTasks";

// Mock the hooks
vi.mock("../../hooks/useProjects");
vi.mock("../../hooks/useTasks");

const mockUseProjects = vi.mocked(useProjects);
const mockUseTasks = vi.mocked(useTasks);
const mockEnsureCsrfToken = vi.mocked(ensureCsrfToken);

beforeEach(() => {
  vi.clearAllMocks();

  // Provide a default implementation for fetch that can be overridden in tests
  global.fetch = vi.fn((url) => {
    if (url === "/api/tasks") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ tasks: mockTaskData }),
      } as Response);
    }
    if (url === "/api/projects") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ projects: mockProjectData }),
      } as Response);
    }
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Not Found" }),
    } as Response);
  });

  mockUseProjects.mockReturnValue({
    projects: mockProjectData,
    loading: false,
    error: null,
    refetch: vi.fn(),
    deleteProject: vi.fn().mockRejectedValue({ error: "Delete failed" }),
    updateProject: vi.fn().mockRejectedValue({ error: "Update failed" }),
    createProject: vi.fn().mockRejectedValue({ error: "Create failed" }),
  } as any);

  mockUseTasks.mockReturnValue({
    tasks: mockTaskData,
    loading: false,
    error: null,
    refetch: vi.fn(),
    deleteTask: vi.fn().mockRejectedValue({ error: "Task delete failed" }),
    updateTask: vi.fn().mockRejectedValue({ error: "Task update failed" }),
    createTask: vi.fn().mockRejectedValue({ error: "Task create failed" }),
  } as any);

  mockEnsureCsrfToken.mockResolvedValue("mock-csrf-token");
});

afterEach(() => {
  cleanup();
});

// Mock other providers
vi.mock("../../auth", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useAuth: () => mockAuth,
}));
vi.mock("../../context/BackgroundContext", () => ({
  BackgroundProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useBackground: () => mockBackgroundContext,
}));
vi.mock("../../components/common/ToastProvider", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useToast: () => mockToastContext,
}));
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const Wrapper = () => (
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

describe("MainManagementWindow - Absolute Coverage", () => {
  it("covers project CRUD error branches", async () => {
    // Override fetch for this test to ensure create/update errors surface via toast
    global.fetch = vi.fn((input: any, init?: any) => {
      const url = typeof input === "string" ? input : input?.url;
      const method = (init && init.method) || "GET";
      // Fail create
      if (url === "/api/projects" && method === "POST") {
        return Promise.resolve(
          new Response(JSON.stringify({ error: "Create failed" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      // Fail update
      if (url && url.startsWith("/api/projects/") && method === "PUT") {
        return Promise.resolve(
          new Response(JSON.stringify({ error: "Update failed" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      // Pass-through for project/tasks GET requests
      if (url === "/api/projects" && method === "GET") {
        return Promise.resolve(
          new Response(JSON.stringify({ projects: mockProjectData }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      if (url === "/api/tasks" && method === "GET") {
        return Promise.resolve(
          new Response(JSON.stringify({ tasks: mockTaskData }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      // Default 404 for anything else
      return Promise.resolve(
        new Response(JSON.stringify({ error: "Not Found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
    const createProjectMock = vi
      .fn()
      .mockRejectedValue({ error: "Create failed" });
    const updateProjectMock = vi
      .fn()
      .mockRejectedValue({ error: "Update failed" });
    const deleteProjectMock = vi
      .fn()
      .mockRejectedValue({ error: "Delete failed" });
    mockUseProjects.mockReturnValue({
      projects: mockProjectData,
      loading: false,
      error: null,
      refetch: vi.fn(),
      createProject: createProjectMock,
      updateProject: updateProjectMock,
      deleteProject: deleteProjectMock,
    } as any);

    render(<Wrapper />);
    fireEvent.click(screen.getByRole("button", { name: /Projects/i }));
    await waitFor(() =>
      expect(screen.getByText("Add Project")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("Add Project"));
    await waitFor(() =>
      expect(screen.getByText("Create Project")).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByPlaceholderText(/project name/i), {
      target: { value: "New Failing Project" },
    });
    fireEvent.click(screen.getByText("Create Project"));
    await waitFor(() => {
      // ProjectForm renders inline error via error prop
      expect(screen.getByTestId("project-error")).toHaveTextContent(
        /Create failed/i,
      );
    });

    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    fireEvent.click(editButtons[0]);
    await waitFor(() =>
      expect(screen.getByText("Save Changes")).toBeInTheDocument(),
    );
    fireEvent.change(screen.getAllByPlaceholderText(/project name/i)[0], {
      target: { value: "Updated Failing Project" },
    });
    fireEvent.click(screen.getByText("Save Changes"));
    await waitFor(() => {
      expect(screen.getByTestId("project-error")).toHaveTextContent(
        /Update failed/i,
      );
    });

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    // Wait for the real confirmation dialog rendered by ConfirmDialog
    const dialog = await screen.findByRole("dialog", {
      name: /delete project/i,
    });
    const confirmDeleteButton = within(dialog).getByRole("button", {
      name: /delete/i,
    });
    fireEvent.click(confirmDeleteButton);
    await waitFor(() => {
      // Title for project deletion failures is "Deletion failed" in the component
      expect(mockToastContext.showError).toHaveBeenCalledWith(
        "Deletion failed",
        expect.any(String),
      );
    });
  });

  it("covers task CRUD error branches", async () => {
    const createTaskMock = vi.fn().mockRejectedValue({
      error: "Task create failed",
    });
    const updateTaskMock = vi.fn().mockRejectedValue({
      error: "Task update failed",
    });
    const deleteTaskMock = vi.fn().mockRejectedValue({
      error: "Task delete failed",
    });

    mockUseTasks.mockReturnValue({
      tasks: mockTaskData,
      loading: false,
      error: null,
      refetch: vi.fn(),
      createTask: createTaskMock,
      updateTask: updateTaskMock,
      deleteTask: deleteTaskMock,
    } as any);

    // Mock network for task create/update/delete failures while preserving GETs
    global.fetch = vi.fn((input: any, init?: any) => {
      const url = typeof input === "string" ? input : input?.url;
      const method = (init && init.method) || "GET";
      if (url && url.includes("/api/tasks") && method === "POST") {
        return Promise.resolve(
          new Response(JSON.stringify({ error: "Task create failed" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      if (url && url.includes("/api/tasks") && (method === "PUT" || method === "PATCH")) {
        return Promise.resolve(
          new Response(JSON.stringify({ error: "Task update failed" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      if (url && url.includes("/api/tasks") && method === "DELETE") {
        return Promise.resolve(
          new Response(JSON.stringify({ error: "Task delete failed" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      // Keep GET handlers working
      if (url === "/api/tasks") {
        return Promise.resolve(
          new Response(JSON.stringify({ tasks: mockTaskData }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      if (url === "/api/projects") {
        return Promise.resolve(
          new Response(JSON.stringify({ projects: mockProjectData }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ error: "Not Found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    render(<Wrapper />);

    // Create (fail)
    fireEvent.click(screen.getByRole("button", { name: /add new/i }));
    await waitFor(() => expect(screen.getByText("📝 New Task")).toBeInTheDocument());
    const createDialog = screen.getByRole("dialog");
    const titleInput = within(createDialog).getByPlaceholderText(/what needs to be done/i);
    fireEvent.change(titleInput, { target: { value: "New Failing Task" } });
    const createForm = createDialog.querySelector("form") as HTMLFormElement | null;
    if (!createForm) throw new Error("Task form not found in dialog");
    fireEvent.submit(createForm);
    await waitFor(() => {
      expect(mockToastContext.showError).toHaveBeenCalledWith(
        "Task create failed",
        expect.any(String),
      );
    });
    // Close create dialog
    fireEvent.click(within(createDialog).getByLabelText("Cancel Task"));

    // Open details and edit (edit path surfaces inline error)
    fireEvent.click(screen.getByLabelText("View details for Test Task"));
    await waitFor(() => expect(screen.getByTestId("task-details")).toBeInTheDocument());
    const detailsPanel = screen.getByTestId("task-details");
    fireEvent.click(within(detailsPanel).getByLabelText("Edit Task"));
    // Wait for the edit dialog and work within it
    await waitFor(() => expect(screen.getAllByRole("dialog").length).toBeGreaterThan(0));
    const editDialogs = screen.getAllByRole("dialog");
    const editDialog = editDialogs[editDialogs.length - 1];
    const editInput = within(editDialog).getByPlaceholderText(/what needs to be done/i) as HTMLInputElement;
    // clear then type new title
    fireEvent.change(editInput, { target: { value: "" } });
    fireEvent.change(editInput, { target: { value: "Updated Failing Task" } });
    const editForm = editDialog.querySelector("form") as HTMLFormElement | null;
    if (!editForm) throw new Error("Edit Task form not found in dialog");
    fireEvent.submit(editForm);
    await waitFor(() => {
      const dialogs = screen.getAllByRole("dialog");
      const latest = dialogs[dialogs.length - 1];
      expect(within(latest).getByText("Task update failed")).toBeInTheDocument();
    });
    // Cancel edit
    const latestDialogs = screen.getAllByRole("dialog");
    const latestEditDialog = latestDialogs[latestDialogs.length - 1];
    fireEvent.click(within(latestEditDialog).getByLabelText("Cancel Task"));
    // Close details panel
    fireEvent.click(within(detailsPanel).getByText("Close"));

    // Delete from list (fail)
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => {
      expect(mockToastContext.showError).toHaveBeenCalledWith(
        "Task delete failed",
        expect.any(String),
      );
    });
  });

  it("covers openTaskDetails event handler", async () => {
    render(<Wrapper />);
    await waitFor(() =>
      expect(screen.getByText("Test Task")).toBeInTheDocument(),
    );
    act(() => {
      window.dispatchEvent(new CustomEvent("openTaskDetails", { detail: 1 }));
    });
    await waitFor(() =>
      expect(screen.getByTestId("task-details")).toBeInTheDocument(),
    );
  });

  it("covers project task helper functions", async () => {
    render(<Wrapper />);
    fireEvent.click(screen.getByText("Projects"));
    await waitFor(() =>
      expect(screen.getByText("Test Project")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Test Project"));
    await waitFor(() =>
      expect(screen.getByText("Tasks for this Project")).toBeInTheDocument(),
    );

    const checkbox = screen.getAllByRole("checkbox")[0];
    // Save initial checked state
    const wasChecked = (checkbox as HTMLInputElement).checked;
    fireEvent.click(checkbox);
    // Wait for the checked state to toggle
    await waitFor(() => {
      expect((checkbox as HTMLInputElement).checked).toBe(!wasChecked);
    });

    fireEvent.click(screen.getByText("Test Task"));
    await waitFor(() =>
      expect(screen.getByTestId("task-details")).toBeInTheDocument(),
    );
  });

  it("covers sign out sidebar item", async () => {
    render(<Wrapper />);
    fireEvent.click(screen.getByText("Sign Out"));
    expect(mockAuth.logout).toHaveBeenCalled();
  });
});
