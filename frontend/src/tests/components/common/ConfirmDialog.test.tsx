import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

describe("ConfirmDialog", () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    open: true,
    title: "Confirm Action",
    message: "Are you sure you want to proceed?",
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when open is false", () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);

    expect(screen.queryByText("Confirm Action")).not.toBeInTheDocument();
  });

  it("renders dialog when open is true", () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to proceed?"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirm/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", () => {
    render(<ConfirmDialog {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button is clicked", () => {
    render(<ConfirmDialog {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("renders custom button labels", () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Delete"
        cancelLabel="Keep"
      />,
    );

    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /keep/i })).toBeInTheDocument();
  });

  it("shows loading state on confirm button", () => {
    render(<ConfirmDialog {...defaultProps} loading />);

    const confirmButton = screen.getByRole("button", { name: /processing/i });
    expect(confirmButton).toBeDisabled();
    expect(screen.getByText("Processing...")).toBeInTheDocument();
  });

  it("disables both buttons when loading", () => {
    render(<ConfirmDialog {...defaultProps} loading />);

    const confirmButton = screen.getByRole("button", { name: /processing/i });
    const cancelButton = screen.getByRole("button", { name: /cancel/i });

    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it("renders danger type with warning message", () => {
    render(<ConfirmDialog {...defaultProps} type="danger" />);

    expect(
      screen.getByText("🛑 This action cannot be undone"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please make sure you want to proceed"),
    ).toBeInTheDocument();
  });

  it("renders warning type without additional warning", () => {
    render(<ConfirmDialog {...defaultProps} type="warning" />);

    expect(
      screen.queryByText("🛑 This action cannot be undone"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to proceed?"),
    ).toBeInTheDocument();
  });

  it("renders info type without additional warning", () => {
    render(<ConfirmDialog {...defaultProps} type="info" />);

    expect(
      screen.queryByText("🛑 This action cannot be undone"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to proceed?"),
    ).toBeInTheDocument();
  });

  it("has correct icons for different types", () => {
    const { rerender } = render(
      <ConfirmDialog {...defaultProps} type="danger" />,
    );
    expect(screen.getByText("⚠️")).toBeInTheDocument();

    rerender(<ConfirmDialog {...defaultProps} type="warning" />);
    expect(screen.getAllByText("⚡")[0]).toBeInTheDocument();

    rerender(<ConfirmDialog {...defaultProps} type="info" />);
    expect(screen.getByText("ℹ️")).toBeInTheDocument();
  });

  it("closes dialog when clicking backdrop", () => {
    render(<ConfirmDialog {...defaultProps} />);

    const backdrop = screen
      .getByText("Confirm Action")
      .closest(".phub-modal-backdrop");
    if (!backdrop) {
      throw new Error("Backdrop element not found");
    }
    fireEvent.click(backdrop);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("does not close dialog when clicking on the dialog content", () => {
    render(<ConfirmDialog {...defaultProps} />);

    const dialogContent = screen.getByText("Are you sure you want to proceed?");
    fireEvent.click(dialogContent);

    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it("handles default type correctly", () => {
    render(<ConfirmDialog {...defaultProps} />);

    // Default type should be 'danger'
    expect(screen.getByText("⚠️")).toBeInTheDocument();
    expect(
      screen.getByText("🛑 This action cannot be undone"),
    ).toBeInTheDocument();
  });

  it("handles button hover events for confirm button", () => {
    render(<ConfirmDialog {...defaultProps} type="danger" />);

    const confirmButton = screen.getByRole("button", { name: /confirm/i });

    // Test mouseEnter
    fireEvent.mouseEnter(confirmButton);
    // Style changes are handled by React, just ensure no errors
    expect(confirmButton).toBeInTheDocument();

    // Test mouseLeave
    fireEvent.mouseLeave(confirmButton);
    expect(confirmButton).toBeInTheDocument();
  });

  it("does not handle hover events when loading", () => {
    render(<ConfirmDialog {...defaultProps} type="danger" loading />);

    const confirmButton = screen.getByRole("button", { name: /processing/i });

    // Test mouseEnter when loading
    fireEvent.mouseEnter(confirmButton);
    expect(confirmButton).toBeDisabled();

    // Test mouseLeave when loading
    fireEvent.mouseLeave(confirmButton);
    expect(confirmButton).toBeDisabled();
  });

  it("renders correct button content for different types when not loading", () => {
    const { rerender } = render(
      <ConfirmDialog {...defaultProps} type="danger" />,
    );
    expect(screen.getByText("🗑️")).toBeInTheDocument();

    rerender(<ConfirmDialog {...defaultProps} type="warning" />);
    expect(screen.getAllByText("⚡")[1]).toBeInTheDocument(); // Second one is in button

    rerender(<ConfirmDialog {...defaultProps} type="info" />);
    expect(screen.getByText("✅")).toBeInTheDocument();
  });

  it("handles unknown type by defaulting to danger", () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        type={"unknown" as unknown as "danger" | "warning" | "info"}
      />,
    );

    // Should default to danger styles
    expect(screen.getByText("⚠️")).toBeInTheDocument();
    expect(
      screen.getByText("🛑 This action cannot be undone"),
    ).toBeInTheDocument();
  });
});
