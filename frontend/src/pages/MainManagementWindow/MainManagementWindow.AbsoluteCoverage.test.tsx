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
  });

  mockUseTasks.mockReturnValue({
    tasks: mockTaskData,
    loading: false,
    error: null,
    refetch: vi.fn(),
    deleteTask: vi.fn().mockRejectedValue({ error: "Task delete failed" }),
    updateTask: vi.fn().mockRejectedValue({ error: "Task update failed" }),
    createTask: vi.fn().mockRejectedValue({ error: "Task create failed" }),
  });

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
    });

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
      expect(createProjectMock).toHaveBeenCalled();
      expect(mockToastContext.showError).toHaveBeenCalledWith(
        "Create failed",
        expect.any(String),
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
      expect(updateProjectMock).toHaveBeenCalled();
      expect(mockToastContext.showError).toHaveBeenCalledWith(
        "Update failed",
        expect.any(String),
      );
    });

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    await waitFor(() =>
      expect(screen.getByText("Confirm Deletion")).toBeInTheDocument(),
    );
    const confirmDeleteButton = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(confirmDeleteButton);
    await waitFor(() => {
      expect(deleteProjectMock).toHaveBeenCalledWith(mockProjectData[0].id);
      expect(mockToastContext.showError).toHaveBeenCalledWith(
        "Delete failed",
        expect.any(String),
      );
    });
  });

  it("covers task CRUD error branches", async () => {
    const createTaskMock = vi
      .fn()
      .mockRejectedValue({ error: "Task create failed" });
    const updateTaskMock = vi
      .fn()
      .mockRejectedValue({ error: "Task update failed" });
    const deleteTaskMock = vi
      .fn()
      .mockRejectedValue({ error: "Task delete failed" });
    mockUseTasks.mockReturnValue({
      tasks: mockTaskData,
      loading: false,
      error: null,
      refetch: vi.fn(),
      createTask: createTaskMock,
      updateTask: updateTaskMock,
      deleteTask: deleteTaskMock,
    });

    render(<Wrapper />);
    fireEvent.click(screen.getByRole("button", { name: /add new/i }));
    await waitFor(() =>
      expect(screen.getByText("✨Create Task")).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByPlaceholderText(/what needs to be done/i), {
      target: { value: "New Failing Task" },
    });
    fireEvent.click(screen.getByText("Create Task"));
    await waitFor(() => {
      expect(createTaskMock).toHaveBeenCalled();
      expect(mockToastContext.showError).toHaveBeenCalledWith(
        "Task create failed",
        expect.any(String),
      );
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    fireEvent.click(editButtons[0]);
    await waitFor(() =>
      expect(screen.getByText("Save Changes")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Save Changes"));
    await waitFor(() => {
      expect(updateTaskMock).toHaveBeenCalled();
      expect(mockToastContext.showError).toHaveBeenCalledWith(
        "Task update failed",
        expect.any(String),
      );
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    await waitFor(() =>
      expect(screen.getByText("Confirm Deletion")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(deleteTaskMock).toHaveBeenCalledWith(mockTaskData[0].id);
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
    const updateTaskMock = vi.fn().mockResolvedValue({});
    mockUseTasks.mockReturnValue({
      tasks: mockTaskData,
      loading: false,
      error: null,
      refetch: vi.fn(),
      deleteTask: vi.fn(),
      updateTask: updateTaskMock,
      createTask: vi.fn(),
    });
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
    fireEvent.click(checkbox);
    await waitFor(() => expect(updateTaskMock).toHaveBeenCalled());

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
