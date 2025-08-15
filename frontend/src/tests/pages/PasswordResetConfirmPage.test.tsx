import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import PasswordResetConfirmPage from "../../pages/PasswordResetConfirmPage";

// Mock components and dependencies
vi.mock("../components/AppHeader", () => ({
  default: () => <div data-testid="app-header">App Header</div>,
}));

// Mock navigate
const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams("?token=test-token");
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams, vi.fn()],
  };
});

// Mock document.cookie
const mockCookie = vi.fn();
Object.defineProperty(document, "cookie", {
  get: mockCookie,
  set: vi.fn(),
});

// Mock global fetch
global.fetch = vi.fn();

// Mock timers
vi.useFakeTimers();

// Test wrapper component
const PasswordResetConfirmPageWrapper = () => (
  <BrowserRouter>
    <PasswordResetConfirmPage />
  </BrowserRouter>
);

describe("PasswordResetConfirmPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    mockNavigate.mockClear();
    mockCookie.mockReturnValue("");
    // Use real timers for all tests since fake timers are causing issues with waitFor
    vi.useRealTimers();
  });

  afterEach(() => {
    // Restore fake timers after each test if needed for other test files
    vi.useFakeTimers();
  });

  describe("Component Rendering", () => {
    it("renders without crashing", () => {
      render(<PasswordResetConfirmPageWrapper />);
      expect(
        screen.getByRole("heading", { name: "Set New Password" }),
      ).toBeInTheDocument();
    });

    it("displays password input fields", () => {
      render(<PasswordResetConfirmPageWrapper />);

      expect(screen.getByLabelText("New Password")).toBeInTheDocument();
      expect(screen.getByLabelText("Confirm New Password")).toBeInTheDocument();
    });

    it("displays submit button", () => {
      render(<PasswordResetConfirmPageWrapper />);

      expect(
        screen.getByRole("button", { name: /set new password/i }),
      ).toBeInTheDocument();
    });

    it("renders with proper form structure", () => {
      render(<PasswordResetConfirmPageWrapper />);

      const form = screen
        .getByRole("button", { name: /set new password/i })
        .closest("form");
      expect(form).toBeInTheDocument();
    });
  });

  describe("Password Validation", () => {
    it("shows error when passwords do not match", () => {
      render(<PasswordResetConfirmPageWrapper />);

      const passwordInput = screen.getByLabelText("New Password");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password",
      );
      const submitButton = screen.getByRole("button", {
        name: /set new password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "differentpassword" },
      });
      fireEvent.click(submitButton);

      // The error should appear immediately since it's just client-side validation
      // Let's try with a simple synchronous check first
      const errorMessage = screen.getByText(/passwords do not match/i);
      expect(errorMessage).toBeInTheDocument();
    });

    it("allows form submission when passwords match", async () => {
      // Mock CSRF token fetch
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: "test-csrf-token" }),
      });

      // Mock password reset confirm request
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Success" }),
      });

      render(<PasswordResetConfirmPageWrapper />);

      const passwordInput = screen.getByLabelText("New Password");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password",
      );
      const submitButton = screen.getByRole("button", {
        name: /set new password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password123" },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/password-reset/confirm",
          expect.any(Object),
        );
      });
    });
  });

  describe("Form Submission", () => {
    it("submits form with correct data when passwords match", async () => {
      // Mock CSRF token fetch
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: "test-csrf-token" }),
      });

      // Mock password reset confirm request
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Success" }),
      });

      render(<PasswordResetConfirmPageWrapper />);

      const passwordInput = screen.getByLabelText("New Password");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password",
      );
      const submitButton = screen.getByRole("button", {
        name: /set new password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "newpassword123" },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/password-reset/confirm",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": "test-csrf-token",
            },
            credentials: "include",
            body: JSON.stringify({
              token: "test-token",
              new_password: "newpassword123",
            }),
          },
        );
      });
    });

    it("includes CSRF token in request when available", async () => {
      mockCookie.mockReturnValue("_csrf_token=csrf-token-123");

      // Mock password reset confirm request directly (no CSRF fetch needed)
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Password reset successful" }),
      });

      render(<PasswordResetConfirmPageWrapper />);

      const passwordInput = screen.getByLabelText("New Password");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password",
      );
      const submitButton = screen.getByRole("button", {
        name: /set new password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "newpassword123" },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/password-reset/confirm",
          expect.objectContaining({
            headers: expect.objectContaining({
              "X-CSRF-Token": "csrf-token-123",
            }),
          }),
        );
      });
    });
  });

  describe("Success State Handling", () => {
    it("shows success message and redirects on successful password reset", async () => {
      // Mock CSRF token fetch
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: "test-csrf-token" }),
      });

      // Mock password reset confirm request
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Password reset successful" }),
      });

      render(<PasswordResetConfirmPageWrapper />);

      const passwordInput = screen.getByLabelText("New Password");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password",
      );
      const submitButton = screen.getByRole("button", {
        name: /set new password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "newpassword123" },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password reset successful/i),
        ).toBeInTheDocument();
      });
    });

    it("navigates to login page after success message", async () => {
      // Mock CSRF token fetch
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: "test-csrf-token" }),
      });

      // Mock password reset confirm request
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Password reset successful" }),
      });

      render(<PasswordResetConfirmPageWrapper />);

      const passwordInput = screen.getByLabelText("New Password");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password",
      );
      const submitButton = screen.getByRole("button", {
        name: /set new password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "newpassword123" },
      });
      fireEvent.click(submitButton);

      // Wait for the success message to appear
      await waitFor(() => {
        expect(
          screen.getByText(/password reset successful/i),
        ).toBeInTheDocument();
      });

      // Wait for navigation after delay
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith("/login");
        },
        { timeout: 4000 },
      );
    });
  });

  describe("Error State Handling", () => {
    it("displays server error message on API failure", async () => {
      // Mock CSRF token fetch
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: "test-csrf-token" }),
      });

      // Mock password reset confirm request
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Invalid token" }),
      });

      render(<PasswordResetConfirmPageWrapper />);

      const passwordInput = screen.getByLabelText("New Password");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password",
      );
      const submitButton = screen.getByRole("button", {
        name: /set new password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "newpassword123" },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Invalid token")).toBeInTheDocument();
      });
    });

    it("displays generic error message when server returns no specific error", async () => {
      // Mock CSRF token fetch
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: "test-csrf-token" }),
      });

      // Mock password reset confirm request
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      render(<PasswordResetConfirmPageWrapper />);

      const passwordInput = screen.getByLabelText("New Password");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password",
      );
      const submitButton = screen.getByRole("button", {
        name: /set new password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "newpassword123" },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Password reset failed.")).toBeInTheDocument();
      });
    });

    it("displays network error message when fetch fails", async () => {
      // Mock CSRF token fetch
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: "test-csrf-token" }),
      });

      // Mock password reset confirm request
      (global.fetch as Mock).mockRejectedValueOnce(new Error("Network error"));

      render(<PasswordResetConfirmPageWrapper />);

      const passwordInput = screen.getByLabelText("New Password");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password",
      );
      const submitButton = screen.getByRole("button", {
        name: /set new password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "newpassword123" },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Network error. Please try again."),
        ).toBeInTheDocument();
      });
    });

    it("shows error message with proper styling", async () => {
      render(<PasswordResetConfirmPageWrapper />);

      const passwordInput = screen.getByLabelText("New Password");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password",
      );
      const submitButton = screen.getByRole("button", {
        name: /set new password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "password1" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password2" },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen
          .getByText("Passwords do not match.")
          .closest("div");
        expect(errorMessage).toHaveClass(
          "border-red-300",
          "bg-red-50",
          "text-red-800",
        );
      });
    });

    it("clears previous error when form is resubmitted", async () => {
      render(<PasswordResetConfirmPageWrapper />);

      const passwordInput = screen.getByLabelText("New Password");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password",
      );
      const submitButton = screen.getByRole("button", {
        name: /set new password/i,
      });

      // First submission with mismatched passwords
      fireEvent.change(passwordInput, { target: { value: "password1" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password2" },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
      });

      // Second submission with matching passwords and successful response
      // Mock CSRF token fetch
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: "test-csrf-token" }),
      });

      // Mock password reset confirm request
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Success" }),
      });

      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password123" },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByText("Passwords do not match."),
        ).not.toBeInTheDocument();
        expect(
          screen.getByText(/password reset successful/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("disables submit button during loading", () => {
      // Mock CSRF token fetch
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: "test-csrf-token" }),
      });

      // Mock password reset confirm request with delay
      (global.fetch as Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ message: "Success" }),
                }),
              1000,
            ),
          ),
      );

      render(<PasswordResetConfirmPageWrapper />);

      const passwordInput = screen.getByLabelText("New Password");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password",
      );
      const submitButton = screen.getByRole("button", {
        name: /set new password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "newpassword123" },
      });
      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
    });

    it("shows loading state during form submission", async () => {
      // Mock CSRF token fetch
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: "test-csrf-token" }),
      });

      // Mock password reset confirm request with delay
      (global.fetch as Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ message: "Success" }),
                }),
              100,
            ),
          ),
      );

      render(<PasswordResetConfirmPageWrapper />);

      const passwordInput = screen.getByLabelText("New Password");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password",
      );
      const submitButton = screen.getByRole("button", {
        name: /set new password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "newpassword123" },
      });
      fireEvent.click(submitButton);

      // Check that loading state appears immediately
      await waitFor(() => {
        expect(screen.getByText(/resetting/i)).toBeInTheDocument();
      });

      // Wait for the loading to complete
      await waitFor(
        () => {
          expect(screen.queryByText(/resetting/i)).not.toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });
  });

  describe("CSRF Token Handling", () => {
    it("fetches CSRF token when not available in cookies", async () => {
      // Mock the CSRF token fetch
      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: "fetched-csrf-token" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: "Password reset successful" }),
        });

      render(<PasswordResetConfirmPageWrapper />);

      const passwordInput = screen.getByLabelText("New Password");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password",
      );
      const submitButton = screen.getByRole("button", {
        name: /set new password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "newpassword123" },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/csrf-token", {
          credentials: "include",
        });
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/password-reset/confirm",
          expect.objectContaining({
            headers: expect.objectContaining({
              "X-CSRF-Token": "fetched-csrf-token",
            }),
          }),
        );
      });
    });

    it("handles case where CSRF token fetch returns null/empty token", async () => {
      // Mock the CSRF token fetch to return empty token
      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: null }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: "Password reset successful" }),
        });

      render(<PasswordResetConfirmPageWrapper />);

      const passwordInput = screen.getByLabelText("New Password");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password",
      );
      const submitButton = screen.getByRole("button", {
        name: /set new password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "newpassword123" },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Should still make the request without CSRF token header
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/password-reset/confirm",
          expect.objectContaining({
            headers: {
              "Content-Type": "application/json",
            },
          }),
        );
      });
    });
  });

  describe("Accessibility", () => {
    it("includes proper error message accessibility", async () => {
      render(<PasswordResetConfirmPageWrapper />);

      const passwordInput = screen.getByLabelText("New Password");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password",
      );
      const submitButton = screen.getByRole("button", {
        name: /set new password/i,
      });

      fireEvent.change(passwordInput, { target: { value: "password1" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password2" },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorElement = screen.getByText("Passwords do not match.");
        expect(errorElement).toBeInTheDocument();

        // Check that error is properly styled for accessibility
        const errorContainer = errorElement.closest("div");
        expect(errorContainer).toHaveClass("text-red-800");
      });
    });

    it("has accessible form labels", () => {
      render(<PasswordResetConfirmPageWrapper />);

      expect(screen.getByLabelText("New Password")).toBeInTheDocument();
      expect(screen.getByLabelText("Confirm New Password")).toBeInTheDocument();
    });

    it("provides clear button text for screen readers", () => {
      render(<PasswordResetConfirmPageWrapper />);

      const submitButton = screen.getByRole("button", {
        name: /set new password/i,
      });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveTextContent("Set New Password");
    });
  });
});

describe("PasswordResetConfirmPage - URL Parameter Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    mockCookie.mockReturnValue("");
    vi.useRealTimers();

    // Ensure mockSearchParams is reset to a neutral state for edge case testing
    mockSearchParams = new URLSearchParams();
  });

  afterEach(() => {
    vi.useFakeTimers();
  });

  it("handles missing token parameter in URL", async () => {
    // Change the mock search params to have no token
    mockSearchParams = new URLSearchParams("");

    // Mock CSRF token fetch
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ csrf_token: "test-csrf-token" }),
    });

    // Mock password reset confirm request
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Invalid token" }),
    });

    render(<PasswordResetConfirmPageWrapper />);

    const passwordInput = screen.getByLabelText("New Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm New Password");
    const submitButton = screen.getByRole("button", {
      name: /set new password/i,
    });

    fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "newpassword123" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/password-reset/confirm",
        expect.objectContaining({
          body: JSON.stringify({
            token: "", // Empty token from missing URL parameter fallback
            new_password: "newpassword123",
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Invalid token")).toBeInTheDocument();
    });
  });
});
