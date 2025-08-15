import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import RegisterPage from "../../pages/RegisterPage";

// Mock AppHeader component
vi.mock("../components/AppHeader", () => ({
  default: () => <header data-testid="app-header">AppHeader</header>,
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Setup global fetch mock
global.fetch = vi.fn();
const mockFetch = vi.mocked(fetch);

// Wrapper component with router
const RegisterPageWrapper = () => (
  <BrowserRouter>
    <RegisterPage />
  </BrowserRouter>
);

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Page Structure", () => {
    it("renders the app header", () => {
      render(<RegisterPageWrapper />);

      expect(screen.getByTestId("app-header")).toBeInTheDocument();
    });

    it("renders the registration form with correct title", () => {
      render(<RegisterPageWrapper />);

      expect(
        screen.getByRole("heading", { name: /register/i }),
      ).toBeInTheDocument();
    });

    it("renders all form fields", () => {
      render(<RegisterPageWrapper />);

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it("renders submit button", () => {
      render(<RegisterPageWrapper />);

      expect(
        screen.getByRole("button", { name: /create account/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Form Fields", () => {
    it("has correct input types and attributes", () => {
      render(<RegisterPageWrapper />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText("Password");
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      expect(usernameInput).toHaveAttribute("type", "text");
      expect(usernameInput).toHaveAttribute("name", "username");
      expect(usernameInput).toHaveAttribute("autoComplete", "username");
      expect(usernameInput).toBeRequired();

      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("name", "email");
      expect(emailInput).toHaveAttribute("autoComplete", "email");
      expect(emailInput).toBeRequired();

      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("name", "password");
      expect(passwordInput).toHaveAttribute("autoComplete", "new-password");
      expect(passwordInput).toBeRequired();

      expect(confirmPasswordInput).toHaveAttribute("type", "password");
      expect(confirmPasswordInput).toHaveAttribute("name", "confirmPassword");
      expect(confirmPasswordInput).toHaveAttribute(
        "autoComplete",
        "new-password",
      );
      expect(confirmPasswordInput).toBeRequired();
    });

    it("has appropriate placeholder text", () => {
      render(<RegisterPageWrapper />);

      expect(
        screen.getByPlaceholderText("Choose a username"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter your email address"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Create a secure password"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Confirm your password"),
      ).toBeInTheDocument();
    });

    it("allows user input in all fields", () => {
      render(<RegisterPageWrapper />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText("Password");
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password123" },
      });

      expect(usernameInput).toHaveValue("testuser");
      expect(emailInput).toHaveValue("test@example.com");
      expect(passwordInput).toHaveValue("password123");
      expect(confirmPasswordInput).toHaveValue("password123");
    });
  });

  describe("Form Validation", () => {
    it("shows error when passwords do not match", async () => {
      render(<RegisterPageWrapper />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText("Password");
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "differentpassword" },
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
      });
    });

    it("does not submit when passwords do not match", async () => {
      render(<RegisterPageWrapper />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText("Password");
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "differentpassword" },
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });
  });

  describe("Form Submission", () => {
    it("submits form with correct data when validation passes", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Registration successful" }),
      } as Response);

      render(<RegisterPageWrapper />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText("Password");
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password123" },
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "testuser",
            email: "test@example.com",
            password: "password123",
          }),
        });
      });
    });

    it("shows loading state during submission", async () => {
      // Create a promise we can control
      let resolvePromise: ((value: unknown) => void) | undefined;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(fetchPromise as Promise<Response>);

      render(<RegisterPageWrapper />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText("Password");
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password123" },
      });

      fireEvent.click(submitButton);

      // Check loading state
      expect(
        screen.getByRole("button", { name: /creating account.../i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /creating account.../i }),
      ).toBeDisabled();

      // Resolve the promise
      if (resolvePromise) {
        resolvePromise({
          ok: true,
          json: () => Promise.resolve({ message: "Success" }),
        });
      }

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /create account/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /create account/i }),
        ).not.toBeDisabled();
      });
    });

    it("navigates to login page after successful registration", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Registration successful" }),
      } as Response);

      render(<RegisterPageWrapper />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText("Password");
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password123" },
      });

      fireEvent.click(submitButton);

      // Wait for the form submission to complete
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Wait for navigation to be called (with timeout of 4 seconds)
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith("/login");
        },
        { timeout: 4000 },
      );
    });

    it("clears form after successful registration", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Registration successful" }),
      } as Response);

      render(<RegisterPageWrapper />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText("Password");
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password123" },
      });

      fireEvent.click(submitButton);

      // Wait for the form submission to complete and form clearing to happen
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Form clearing happens immediately after successful submission
      await waitFor(() => {
        expect(usernameInput).toHaveValue("");
        expect(emailInput).toHaveValue("");
        expect(passwordInput).toHaveValue("");
        expect(confirmPasswordInput).toHaveValue("");
      });
    });
  });

  describe("Error Handling", () => {
    it("displays server error message when registration fails", async () => {
      vi.useRealTimers();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Username already exists" }),
      } as Response);

      render(<RegisterPageWrapper />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText("Password");
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password123" },
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Username already exists")).toBeInTheDocument();
      });

      vi.useFakeTimers();
    });

    it("displays generic error message when server returns no specific error", async () => {
      vi.useRealTimers();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response);

      render(<RegisterPageWrapper />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText("Password");
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password123" },
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Registration failed.")).toBeInTheDocument();
      });

      vi.useFakeTimers();
    });

    it("displays network error when fetch fails", async () => {
      vi.useRealTimers();

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<RegisterPageWrapper />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText("Password");
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password123" },
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Network error. Please try again."),
        ).toBeInTheDocument();
      });

      vi.useFakeTimers();
    });

    it("clears error when form is resubmitted", async () => {
      vi.useRealTimers();

      // First, create an error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Username already exists" }),
      } as Response);

      render(<RegisterPageWrapper />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText("Password");
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password123" },
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Username already exists")).toBeInTheDocument();
      });

      // Now submit again with success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Registration successful" }),
      } as Response);

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByText("Username already exists"),
        ).not.toBeInTheDocument();
      });

      vi.useFakeTimers();
    });
  });

  describe("Accessibility", () => {
    it("has proper form labels and associations", () => {
      render(<RegisterPageWrapper />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText("Password");
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      expect(usernameInput).toHaveAttribute("id", "username");
      expect(emailInput).toHaveAttribute("id", "email");
      expect(passwordInput).toHaveAttribute("id", "password");
      expect(confirmPasswordInput).toHaveAttribute("id", "confirmPassword");
    });

    it("has proper heading hierarchy", () => {
      render(<RegisterPageWrapper />);

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("Register");
    });

    it("provides error information accessibly", async () => {
      vi.useRealTimers();
      render(<RegisterPageWrapper />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText("Password");
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "differentpassword" },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorElement = screen.getByText("Passwords do not match.");
        expect(errorElement).toBeVisible();
      });
      vi.useFakeTimers();
    });
  });

  describe("Layout and Styling", () => {
    it("applies correct CSS classes", () => {
      render(<RegisterPageWrapper />);

      const heading = screen.getByRole("heading", { name: /register/i });
      expect(heading).toHaveClass("phub-text-gradient");

      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });
      expect(submitButton).toHaveClass("phub-action-btn");
    });

    it("uses glass effect container", () => {
      render(<RegisterPageWrapper />);

      const formContainer = screen
        .getByRole("heading", { name: /register/i })
        .closest(".phub-glass");
      expect(formContainer).toBeInTheDocument();
    });
  });

  describe("User Experience", () => {
    it("focuses appropriately on form elements", () => {
      render(<RegisterPageWrapper />);

      const usernameInput = screen.getByLabelText(/username/i);

      // Focus should work normally
      usernameInput.focus();
      expect(usernameInput).toHaveFocus();
    });

    it("provides helpful placeholder text for guidance", () => {
      render(<RegisterPageWrapper />);

      expect(
        screen.getByPlaceholderText("Choose a username"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter your email address"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Create a secure password"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Confirm your password"),
      ).toBeInTheDocument();
    });

    it("maintains form state during submission", () => {
      // Create a promise we can control
      let resolvePromise: ((value: unknown) => void) | undefined;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(fetchPromise as Promise<Response>);

      render(<RegisterPageWrapper />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);

      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });

      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });
      fireEvent.click(submitButton);

      // Values should remain during loading
      expect(usernameInput).toHaveValue("testuser");
      expect(emailInput).toHaveValue("test@example.com");

      // Resolve the promise
      if (resolvePromise) {
        resolvePromise({
          ok: true,
          json: () => Promise.resolve({ message: "Success" }),
        });
      }
    });
  });
});
