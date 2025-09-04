import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import TaskRelationshipsSection from "../../components/TaskRelationshipsSection";

describe("TaskRelationshipsSection", () => {
  const allTasks = [
    { id: 1, title: "Task 1" },
    { id: 2, title: "Task 2" },
    { id: 3, title: "Task 3" },
  ];
  const defaultProps = {
    expanded: true,
    blockedBy: [1],
    blocking: [2],
    linkedTasks: [3],
    allTasks,
    onBlockedByClick: vi.fn(),
    onBlockingClick: vi.fn(),
    onLinkedClick: vi.fn(),
    onRemoveBlockedBy: vi.fn(),
    onRemoveBlocking: vi.fn(),
    onRemoveLinked: vi.fn(),
    onToggleExpand: vi.fn(),
  };

  it("renders all relationship chips and buttons", () => {
    render(<TaskRelationshipsSection {...defaultProps} />);
    expect(screen.getByText("Blocked By")).toBeInTheDocument();
    expect(screen.getByText("Blocking")).toBeInTheDocument();
    expect(screen.getByText("Linked Tasks")).toBeInTheDocument();
    expect(screen.getByText(/Task 1/)).toBeInTheDocument();
    expect(screen.getByText(/Task 2/)).toBeInTheDocument();
    expect(screen.getByText(/Task 3/)).toBeInTheDocument();
  });

  it("calls onBlockedByClick, onBlockingClick, onLinkedClick", () => {
    render(<TaskRelationshipsSection {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Blocked By"));
    fireEvent.click(screen.getByLabelText("Blocking"));
    fireEvent.click(screen.getByLabelText("Linked Tasks"));
    expect(defaultProps.onBlockedByClick).toHaveBeenCalled();
    expect(defaultProps.onBlockingClick).toHaveBeenCalled();
    expect(defaultProps.onLinkedClick).toHaveBeenCalled();
  });

  it("calls onRemoveBlockedBy, onRemoveBlocking, onRemoveLinked", () => {
    render(<TaskRelationshipsSection {...defaultProps} />);
    fireEvent.click(screen.getAllByRole("button", { name: "×" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "×" })[1]);
    fireEvent.click(screen.getAllByRole("button", { name: "×" })[2]);
    expect(defaultProps.onRemoveBlockedBy).toHaveBeenCalled();
    expect(defaultProps.onRemoveBlocking).toHaveBeenCalled();
    expect(defaultProps.onRemoveLinked).toHaveBeenCalled();
  });

  it("toggles expand/collapse", () => {
    render(<TaskRelationshipsSection {...defaultProps} expanded={false} />);
    fireEvent.click(screen.getByLabelText("Task Relationships"));
    expect(defaultProps.onToggleExpand).toHaveBeenCalled();
  });

  it("renders with no relationships", () => {
    render(
      <TaskRelationshipsSection
        {...defaultProps}
        blockedBy={[]}
        blocking={[]}
        linkedTasks={[]}
      />,
    );
    expect(screen.getByText("Blocked By")).toBeInTheDocument();
    expect(screen.getByText("Blocking")).toBeInTheDocument();
    expect(screen.getByText("Linked Tasks")).toBeInTheDocument();
  });

  it("renders chips only for valid task IDs", () => {
    const allTasks = [
      { id: 1, title: "Task 1" },
      { id: 2, title: "Task 2" },
    ];
    // blockedBy references a missing task (id: 99)
    render(
      <TaskRelationshipsSection
        expanded
        blockedBy={[99]}
        blocking={[]}
        linkedTasks={[]}
        allTasks={allTasks}
        onBlockedByClick={vi.fn()}
        onBlockingClick={vi.fn()}
        onLinkedClick={vi.fn()}
        onRemoveBlockedBy={vi.fn()}
        onRemoveBlocking={vi.fn()}
        onRemoveLinked={vi.fn()}
        onToggleExpand={vi.fn()}
      />,
    );
    // Should not render chip for missing task
    expect(screen.queryByText(/blocked-by/i)).not.toBeInTheDocument();
  });

  it("renders nothing for empty allTasks", () => {
    render(
      <TaskRelationshipsSection
        expanded
        blockedBy={[1]}
        blocking={[2]}
        linkedTasks={[3]}
        allTasks={[]}
        onBlockedByClick={vi.fn()}
        onBlockingClick={vi.fn()}
        onLinkedClick={vi.fn()}
        onRemoveBlockedBy={vi.fn()}
        onRemoveBlocking={vi.fn()}
        onRemoveLinked={vi.fn()}
        onToggleExpand={vi.fn()}
      />,
    );
    // No chips should be rendered
    expect(screen.queryByText(/Task 1/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Task 2/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Task 3/)).not.toBeInTheDocument();
  });
});
