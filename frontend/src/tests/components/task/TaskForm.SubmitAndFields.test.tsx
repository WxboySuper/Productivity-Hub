import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaskForm from "../../../components/TaskForm";

const projects = [
  { id: 1, name: "Project A" },
  { id: 2, name: "Project B" },
];

describe("TaskForm - submit wiring and fields", () => {
  it("renders key fields in create mode (title, description, project, dates, priority, reminders)", () => {
    render(
      <TaskForm
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        projects={projects}
        loading={false}
        editMode={false}
        initialValues={{ title: "" }}
        allTasks={[]}
      />,
    );

    // Title input
    expect(
      screen.getByPlaceholderText(/what needs to be done\?/i),
    ).toBeInTheDocument();

    // Description textarea
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();

    // Project select
    expect(screen.getByLabelText(/project/i)).toBeInTheDocument();

    // Start/Due datetime inputs
    expect(screen.getByLabelText(/start/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due/i)).toBeInTheDocument();

  // Priority chips (use title to avoid ambiguous role/name collisions)
  expect(screen.getByTitle("Low")).toBeInTheDocument();
  expect(screen.getByTitle("Critical")).toBeInTheDocument();

    // Reminders toggle and time
    expect(screen.getByLabelText(/reminder$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reminder time/i)).toBeInTheDocument();
  });

  it("submits when clicking the sticky Create button (outside form) and calls onSubmit with minimal payload", async () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    render(
      <TaskForm
        open
        onClose={onClose}
        onSubmit={onSubmit}
        projects={projects}
        loading={false}
        editMode={false}
        initialValues={{ title: "" }}
        allTasks={[]}
      />,
    );

    // Enter a title so the submit button is enabled
    const title = screen.getByPlaceholderText(/what needs to be done\?/i);
  await userEvent.type(title, "Test task");

    // Click Create Task button (outside form but associated via form attribute)
  const createBtns = screen.getAllByRole("button", { name: /create task/i });
  await userEvent.click(createBtns[createBtns.length - 1]);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.title).toBe("Test task");
    // project_id is present in the payload (may be undefined by default)
    expect("project_id" in submitted).toBe(true);
  });
});
