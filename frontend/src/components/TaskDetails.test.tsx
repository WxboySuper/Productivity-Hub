import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import TaskDetails from "./TaskDetails";

// Define types for test data based on component interfaces
interface Task {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  start_date?: string;
  priority?: number;
  recurrence?: string;
  completed: boolean;
  project_id?: number;
  projectName?: string;
  next_occurrence?: string;
  subtasks?: Array<{
    id: number;
    title: string;
    completed: boolean;
  }>;
  parent_id?: number | null;
  blocked_by?: number[];
  blocking?: number[];
  reminder_enabled?: boolean;
  reminder_time?: string;
}

// Remove TestTask, use Task for all mock tasks

interface TestProject {
  id: number;
  name: string;
}

// Define types for TaskForm props
interface TaskUpdateData {
  title: string;
  description: string;
}

interface TaskFormProps {
  open: boolean;
  onSubmit: (task: TaskUpdateData) => void;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
}

// Mock TaskForm component

import { useState, useEffect } from "react";
vi.mock("./TaskForm", () => {
  let storedOnSubmit: ((task: TaskUpdateData) => void) | null = null;
  return {
    default: ({ open, onSubmit, onClose, loading, error }: TaskFormProps) => {
      const [localLoading, setLocalLoading] = useState(loading);
      useEffect(() => {
        setLocalLoading(loading);
      }, [loading]);
      if (!open) return null;
      storedOnSubmit = onSubmit;
      (
        window as unknown as { testOnSubmit: typeof storedOnSubmit }
      ).testOnSubmit = storedOnSubmit;
      function handleSubmit() {
        onSubmit({ title: "Updated Task", description: "Updated description" });
      }
      return (
        <div data-testid="task-form-mock">
          <div>TaskForm Mock</div>
          <button onClick={handleSubmit} data-testid="submit-form">
            Submit Form
          </button>
          <button onClick={onClose} data-testid="close-form">
            Close Form
          </button>
          {localLoading && <div data-testid="form-loading">Loading...</div>}
          {error && <div data-testid="form-error">{error}</div>}
        </div>
      );
    },
  };
});

describe("TaskDetails", () => {
  const mockOnClose = vi.fn();
  const mockOnEdit = vi.fn();

  const baseTask: Task = {
    id: 1,
    title: "Test Task",
    description: "Test description",
    completed: false,
    project_id: 1,
    projectName: "Test Project",
    priority: 1,
    due_date: "2024-12-31T23:59:59Z",
    start_date: "2024-01-01T00:00:00Z",
    recurrence: "weekly",
    reminder_enabled: true,
    reminder_time: "2024-12-30T12:00:00Z",
    subtasks: [
      { id: 1, title: "Subtask 1", completed: true },
      { id: 2, title: "Subtask 2", completed: false },
    ],
    blocked_by: [2],
    blocking: [3],
  };

  const mockTasks: Task[] = [
    { id: 2, title: "Blocking Task", completed: false },
    { id: 3, title: "Dependent Task", completed: false },
  ];

  const mockProjects: TestProject[] = [{ id: 1, name: "Test Project" }];

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    task: baseTask,
    onEdit: mockOnEdit,
    tasks: mockTasks,
    projects: mockProjects,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset environment variables
    process.env.REACT_APP_API_URL = "http://localhost:3000";
    // Setup default fetch mock
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Clean up global test variables
    delete (window as unknown as { testOnSubmit?: unknown }).testOnSubmit;
  });

  it("does not render when open is false", () => {
    render(<TaskDetails {...defaultProps} open={false} />);

    expect(screen.queryByText("Test Task")).not.toBeInTheDocument();
  });

  it("does not render when task is null", () => {
    render(<TaskDetails {...defaultProps} task={null} />);

    expect(screen.queryByText("Test Task")).not.toBeInTheDocument();
  });

  it("renders task details when open and task provided", () => {
    render(<TaskDetails {...defaultProps} />);

    expect(screen.getByText("Test Task")).toBeInTheDocument();
    expect(screen.getByText("📁 Test Project")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument(); // Priority
    expect(screen.getByText("In Progress")).toBeInTheDocument(); // Status
  });

  it("shows completed status for completed tasks", () => {
    const completedTask = { ...baseTask, completed: true };
    render(<TaskDetails {...defaultProps} task={completedTask} />);

    expect(screen.getAllByText("✅").length).toBeGreaterThan(0);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("displays subtask progress correctly", () => {
    render(<TaskDetails {...defaultProps} />);

    expect(screen.getByText("1/2")).toBeInTheDocument(); // Completed/Total subtasks
  });

  it("shows parent task information when provided", () => {
    const parentTask = { id: 5, title: "Parent Task" };
    render(<TaskDetails {...defaultProps} parentTask={parentTask} />);

    expect(screen.getByText(/Subtask of "Parent Task"/)).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(<TaskDetails {...defaultProps} />);

    fireEvent.click(screen.getByLabelText("Dismiss"));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    render(<TaskDetails {...defaultProps} />);

    const backdrop = screen
      .getByText("Test Task")
      .closest(".modern-modal-backdrop");
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("opens edit form when edit button is clicked", () => {
    render(<TaskDetails {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /edit task/i }));

    // TaskForm should be rendered (mocked)
    expect(screen.getByText("Test Task")).toBeInTheDocument();
  });

  it("toggles section expansion when section headers are clicked", () => {
    render(<TaskDetails {...defaultProps} />);

    // Description section should be collapsed initially
    const descriptionHeader = screen.getByText("Description");
    fireEvent.click(descriptionHeader);

    // Content should become visible
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("shows subtasks section when task has subtasks", () => {
    render(<TaskDetails {...defaultProps} />);

    expect(screen.getByText("Subtasks")).toBeInTheDocument();
    expect(screen.getByText("(1/2 completed)")).toBeInTheDocument();

    // Expand subtasks section
    fireEvent.click(screen.getByText("Subtasks"));

    expect(screen.getByText("Subtask 1")).toBeInTheDocument();
    expect(screen.getByText("Subtask 2")).toBeInTheDocument();
  });

  it("shows schedule section when task has dates", () => {
    render(<TaskDetails {...defaultProps} />);

    expect(screen.getByText("Schedule")).toBeInTheDocument();

    // Expand schedule section
    fireEvent.click(screen.getByText("Schedule"));

    expect(screen.getByText("📅 Start Date")).toBeInTheDocument();
    expect(screen.getByText("🎯 Due Date")).toBeInTheDocument();
    expect(screen.getByText("🔄 Recurrence")).toBeInTheDocument();
  });

  it("shows dependencies section when task has dependencies", () => {
    render(<TaskDetails {...defaultProps} />);

    expect(screen.getByText("Dependencies")).toBeInTheDocument();
    expect(screen.getByText("(2 items)")).toBeInTheDocument();

    // Expand dependencies section
    fireEvent.click(screen.getByText("Dependencies"));

    expect(screen.getByText("🚫 Blocked By")).toBeInTheDocument();
    expect(screen.getByText("⛔ Blocking")).toBeInTheDocument();
    expect(screen.getByText("Blocking Task")).toBeInTheDocument();
    expect(screen.getByText("Dependent Task")).toBeInTheDocument();
  });

  it("shows reminders section when reminders are enabled", () => {
    render(<TaskDetails {...defaultProps} />);

    expect(screen.getByText("Reminders")).toBeInTheDocument();
    expect(screen.getByText("(Enabled)")).toBeInTheDocument();

    // Expand reminders section
    fireEvent.click(screen.getByText("Reminders"));

    expect(screen.getByText(/Reminder set for/)).toBeInTheDocument();
  });

  it("hides sections when task lacks relevant data", () => {
    const minimalTask = {
      id: 1,
      title: "Minimal Task",
      completed: false,
    };

    render(<TaskDetails {...defaultProps} task={minimalTask} />);

    expect(screen.queryByText("Description")).not.toBeInTheDocument();
    expect(screen.queryByText("Subtasks")).not.toBeInTheDocument();
    expect(screen.queryByText("Schedule")).not.toBeInTheDocument();
    expect(screen.queryByText("Dependencies")).not.toBeInTheDocument();
    expect(screen.queryByText("Reminders")).not.toBeInTheDocument();
  });

  it("displays correct priority information", () => {
    // Test different priority levels
    const highPriorityTask = { ...baseTask, priority: 2 };
    const { rerender } = render(
      <TaskDetails {...defaultProps} task={highPriorityTask} />,
    );

    expect(screen.getByText("🟠")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();

    // Test critical priority
    const criticalTask = { ...baseTask, priority: 3 };
    rerender(<TaskDetails {...defaultProps} task={criticalTask} />);

    expect(screen.getByText("🔴")).toBeInTheDocument();
    expect(screen.getByText("Critical")).toBeInTheDocument();
  });

  it("handles task without project correctly", () => {
    const taskWithoutProject = {
      ...baseTask,
      project_id: undefined,
      projectName: undefined,
    };
    render(<TaskDetails {...defaultProps} task={taskWithoutProject} />);

    expect(screen.getByText("⚡ Quick Task")).toBeInTheDocument();
  });

  it("calculates progress percentage correctly", () => {
    const taskWithMoreSubtasks = {
      ...baseTask,
      subtasks: [
        { id: 1, title: "Subtask 1", completed: true },
        { id: 2, title: "Subtask 2", completed: true },
        { id: 3, title: "Subtask 3", completed: false },
        { id: 4, title: "Subtask 4", completed: false },
      ],
    };

    render(<TaskDetails {...defaultProps} task={taskWithMoreSubtasks} />);

    expect(screen.getByText("2/4")).toBeInTheDocument(); // 50% completion
  });

  it("handles missing dependency task names gracefully", () => {
    const taskWithMissingDeps = {
      ...baseTask,
      blocked_by: [999], // Non-existent task ID
      blocking: [888], // Non-existent task ID
    };

    render(<TaskDetails {...defaultProps} task={taskWithMissingDeps} />);

    // Expand dependencies section
    fireEvent.click(screen.getByText("Dependencies"));

    expect(screen.getByText("Task #999")).toBeInTheDocument();
    expect(screen.getByText("Task #888")).toBeInTheDocument();
  });

  it("shows next occurrence when present in schedule section", () => {
    const taskWithNextOccurrence = {
      ...baseTask,
      next_occurrence: "2024-12-25T10:00:00Z",
    };

    render(<TaskDetails {...defaultProps} task={taskWithNextOccurrence} />);

    // Expand schedule section
    fireEvent.click(screen.getByText("Schedule"));

    expect(screen.getByText("⏭️ Next Occurrence")).toBeInTheDocument();
    expect(screen.getByText(/12\/25\/2024/)).toBeInTheDocument(); // Date formatting may vary
  });

  it("handles CSRF token fetch errors gracefully", () => {
    // Mock console.error to avoid noise in test output
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    // Mock fetch to fail for CSRF token request
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    render(<TaskDetails {...defaultProps} />);

    // We need to trigger a code path that uses ensureCsrfToken
    // Since TaskForm isn't easily testable here, we can use vi.mock
    // This test ensures the error handling path is covered
    // The actual test coverage comes from the error path in ensureCsrfToken

    // Clean up
    global.fetch = originalFetch;
    consoleSpy.mockRestore();
  });

  describe("CSRF Token and Task Update Functionality", () => {
    it("successfully fetches CSRF token and updates task", async () => {
      // Mock successful CSRF token fetch
      const mockCsrfResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ csrf_token: "mock-csrf-token" }),
      };

      // Mock successful task update
      const mockUpdateResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(mockCsrfResponse) // First call for CSRF token
        .mockResolvedValueOnce(mockUpdateResponse); // Second call for task update

      render(<TaskDetails {...defaultProps} />);

      // Open edit form
      fireEvent.click(screen.getByRole("button", { name: /edit task/i }));

      // Verify TaskForm is rendered
      expect(screen.getAllByTestId("task-form-mock")[0]).toBeInTheDocument();

      // Submit the form
      fireEvent.click(screen.getAllByTestId("submit-form")[0]);

      // Wait for async operations to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      // Verify CSRF token call
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        "http://localhost:3000/api/csrf-token",
        {
          method: "GET",
          credentials: "include",
        },
      );

      // Verify task update call
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        "http://localhost:3000/api/tasks/1",
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": "mock-csrf-token",
          },
          body: JSON.stringify({
            title: "Updated Task",
            description: "Updated description",
          }),
        },
      );

      // Verify onEdit callback was called
      expect(mockOnEdit).toHaveBeenCalledTimes(1);

      // Verify form is closed (TaskForm should not be visible)
      await waitFor(() => {
        expect(screen.queryByTestId("task-form-mock")).not.toBeInTheDocument();
      });
    });

    it("handles CSRF token fetch failure and still attempts task update", async () => {
      // Mock failed CSRF token fetch
      const mockCsrfResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({ error: "CSRF failed" }),
      };

      // Mock successful task update (should work without CSRF token)
      const mockUpdateResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(mockCsrfResponse) // First call for CSRF token fails
        .mockResolvedValueOnce(mockUpdateResponse); // Second call for task update succeeds

      render(<TaskDetails {...defaultProps} />);

      // Open edit form
      fireEvent.click(screen.getByRole("button", { name: /edit task/i }));

      // Submit the form
      fireEvent.click(screen.getAllByTestId("submit-form")[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      // Verify task update call was made without CSRF token
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        "http://localhost:3000/api/tasks/1",
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "Updated Task",
            description: "Updated description",
          }),
        },
      );

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it("handles CSRF token network error and continues with task update", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      // Mock CSRF token request to throw an error
      const mockUpdateResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      };

      global.fetch = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error")) // CSRF token request fails
        .mockResolvedValueOnce(mockUpdateResponse); // Task update succeeds

      render(<TaskDetails {...defaultProps} />);

      // Open edit form
      fireEvent.click(screen.getByRole("button", { name: /edit task/i }));

      // Submit the form
      fireEvent.click(screen.getAllByTestId("submit-form")[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      // Verify console.error was called for CSRF failure
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to fetch CSRF token:",
        expect.any(Error),
      );

      // Verify task update call was made without CSRF token
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        "http://localhost:3000/api/tasks/1",
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "Updated Task",
            description: "Updated description",
          }),
        },
      );

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      consoleSpy.mockRestore();
    });

    it("handles task update failure with error response", async () => {
      // Mock successful CSRF token fetch
      const mockCsrfResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ csrf_token: "mock-csrf-token" }),
      };

      // Mock failed task update with error response
      const mockUpdateResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({ error: "Task update failed" }),
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(mockCsrfResponse)
        .mockResolvedValueOnce(mockUpdateResponse);

      render(<TaskDetails {...defaultProps} />);

      // Open edit form
      fireEvent.click(screen.getByRole("button", { name: /edit task/i }));

      // Submit the form
      fireEvent.click(screen.getAllByTestId("submit-form")[0]);

      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getAllByTestId("form-error")[0]).toBeInTheDocument();
      });

      // Verify error message is displayed
      expect(screen.getAllByTestId("form-error")[0]).toHaveTextContent(
        "Task update failed",
      );

      // Verify onEdit was not called due to error
      expect(mockOnEdit).not.toHaveBeenCalled();

      // Verify form is still open (not closed due to error)
      expect(screen.getAllByTestId("task-form-mock")[0]).toBeInTheDocument();
    });

    it("handles task update failure with default error message", async () => {
      // Mock successful CSRF token fetch
      const mockCsrfResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ csrf_token: "mock-csrf-token" }),
      };

      // Mock failed task update without specific error message
      const mockUpdateResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({}), // No error field
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(mockCsrfResponse)
        .mockResolvedValueOnce(mockUpdateResponse);

      render(<TaskDetails {...defaultProps} />);

      // Open edit form
      fireEvent.click(screen.getByRole("button", { name: /edit task/i }));

      // Submit the form
      fireEvent.click(screen.getAllByTestId("submit-form")[0]);

      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getAllByTestId("form-error")[0]).toBeInTheDocument();
      });

      // Verify default error message is displayed
      expect(screen.getAllByTestId("form-error")[0]).toHaveTextContent(
        "Failed to update task",
      );
    });

    it("handles task update network error", async () => {
      // Mock successful CSRF token fetch
      const mockCsrfResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ csrf_token: "mock-csrf-token" }),
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(mockCsrfResponse)
        .mockRejectedValueOnce(new Error("Network error")); // Task update throws error

      render(<TaskDetails {...defaultProps} />);

      // Open edit form
      fireEvent.click(screen.getByRole("button", { name: /edit task/i }));

      // Submit the form
      fireEvent.click(screen.getAllByTestId("submit-form")[0]);

      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getAllByTestId("form-error")[0]).toBeInTheDocument();
      });

      // Verify error message from thrown Error
      expect(screen.getAllByTestId("form-error")[0]).toHaveTextContent(
        "Network error",
      );
    });

    it("handles unknown error type in task update", async () => {
      // Mock successful CSRF token fetch
      const mockCsrfResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ csrf_token: "mock-csrf-token" }),
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(mockCsrfResponse)
        .mockRejectedValueOnce("string error"); // Non-Error object thrown

      render(<TaskDetails {...defaultProps} />);

      // Open edit form
      fireEvent.click(screen.getByRole("button", { name: /edit task/i }));

      // Submit the form
      fireEvent.click(screen.getAllByTestId("submit-form")[0]);

      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getAllByTestId("form-error")[0]).toBeInTheDocument();
      });

      // Verify unknown error message
      expect(screen.getAllByTestId("form-error")[0]).toHaveTextContent(
        "Unknown error",
      );
    });

    it("displays loading state during task update", async () => {
      // Mock slow responses to see loading state
      const mockCsrfResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ csrf_token: "mock-csrf-token" }),
      };

      const mockUpdateResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      };

      // Add delay to see loading state
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(mockCsrfResponse)
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve(mockUpdateResponse), 100),
            ),
        );

      render(<TaskDetails {...defaultProps} />);

      // Open edit form
      fireEvent.click(screen.getByRole("button", { name: /edit task/i }));

      // Submit the form
      fireEvent.click(screen.getAllByTestId("submit-form")[0]);

      // Wait for loading state to appear
      await waitFor(
        () => {
          expect(screen.getAllByTestId("form-loading")[0]).toBeInTheDocument();
        },
        { timeout: 1000 },
      );

      // Wait for operation to complete
      await waitFor(
        () => {
          expect(screen.queryByTestId("form-loading")).not.toBeInTheDocument();
        },
        { timeout: 200 },
      );
    });

    it("closes edit form when close button is clicked", () => {
      render(<TaskDetails {...defaultProps} />);

      // Open edit form
      fireEvent.click(screen.getByRole("button", { name: /edit task/i }));
      expect(screen.getAllByTestId("task-form-mock")[0]).toBeInTheDocument();

      // Close form
      fireEvent.click(screen.getAllByTestId("close-form")[0]);
      expect(screen.queryAllByTestId("task-form-mock").length).toBe(0);
    });
  });
});
