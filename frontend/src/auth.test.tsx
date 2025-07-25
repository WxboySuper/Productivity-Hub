import { render, screen, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  AuthProvider,
  useAuth,
  getCookie,
  ensureCsrfToken,
  verifyLogoutSuccess,
} from "./auth";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock document.cookie
const mockCookie = vi.fn();
Object.defineProperty(document, "cookie", {
  get: mockCookie,
  configurable: true,
});

// Test component to access auth context
function TestComponent() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="is-authenticated">
        {auth.isAuthenticated.toString()}
      </div>
      <div data-testid="is-loading">{auth.isLoading.toString()}</div>
      <div data-testid="user-id">{auth.user?.id || "none"}</div>
      <div data-testid="user-username">{auth.user?.username || "none"}</div>
      <div data-testid="user-email">{auth.user?.email || "none"}</div>
      <button data-testid="login-btn" onClick={() => auth.login("test-token")}>
        Login
      </button>
      <button data-testid="logout-btn" onClick={() => auth.logout()}>
        Logout
      </button>
    </div>
  );
}

describe("Auth Context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookie.mockReturnValue("");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("AuthProvider", () => {
    it("should render children and provide auth context", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: false }),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
      });

      expect(screen.getByTestId("is-authenticated")).toHaveTextContent("false");
      expect(screen.getByTestId("user-id")).toHaveTextContent("none");
    });

    it("should set authenticated state when auth check returns authenticated user", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: true, user: mockUser }),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "true",
        );
        expect(screen.getByTestId("user-id")).toHaveTextContent("1");
        expect(screen.getByTestId("user-username")).toHaveTextContent(
          "testuser",
        );
        expect(screen.getByTestId("user-email")).toHaveTextContent(
          "test@example.com",
        );
      });
    });

    it("should handle failed auth check response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "false",
        );
        expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
      });
    });

    it("should handle network error during auth check", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "false",
        );
        expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Auth check error:",
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });

    it("should handle auth response without user data", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            authenticated: true,
            // No user field
          }),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "true",
        );
        expect(screen.getByTestId("user-id")).toHaveTextContent("none");
      });
    });

    it("should handle malformed auth response", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "false",
        );
        expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Auth check error:",
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe("login function", () => {
    it("should trigger auth check when login is called", async () => {
      // First call for initial auth check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: false }),
      });

      // Second call for login auth check
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: true, user: mockUser }),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "false",
        );
      });

      await act(() => {
        screen.getByTestId("login-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "true",
        );
        expect(screen.getByTestId("user-id")).toHaveTextContent("1");
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should handle failed login auth check", async () => {
      // First call for initial auth check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: false }),
      });

      // Second call for failed login auth check
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "false",
        );
      });

      await act(() => {
        screen.getByTestId("login-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "false",
        );
      });
    });
  });

  describe("logout function", () => {
    it("should successfully logout user", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
      };

      // Initial auth check - user is logged in
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: true, user: mockUser }),
      });

      // Mock CSRF token request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: "test-csrf-token" }),
      });

      // Mock logout request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Logged out successfully" }),
      });

      // Mock logout verification
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: false }),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "true",
        );
      });

      await act(() => {
        screen.getByTestId("logout-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "false",
        );
        expect(screen.getByTestId("user-id")).toHaveTextContent("none");
      });
    });

    it("should handle logout error but still clear frontend state", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
      };

      // Initial auth check - user is logged in
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: true, user: mockUser }),
      });

      // Mock CSRF token request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: "test-csrf-token" }),
      });

      // Mock failed logout request
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      });

      // Mock logout verification shows user is actually logged out
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: false }),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "true",
        );
      });

      await act(() => {
        screen.getByTestId("logout-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "false",
        );
        expect(screen.getByTestId("user-id")).toHaveTextContent("none");
      });
    });

    it("should handle logout with malformed error response", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
      };

      // Initial auth check - user is logged in
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: true, user: mockUser }),
      });

      // Mock CSRF token request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: "test-csrf-token" }),
      });

      // Mock failed logout request with malformed JSON
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      // Mock logout verification shows user is actually logged out
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: false }),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "true",
        );
      });

      await act(() => {
        screen.getByTestId("logout-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "false",
        );
        expect(screen.getByTestId("user-id")).toHaveTextContent("none");
      });
    });

    it("should handle network error during logout", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
      };

      // Initial auth check - user is logged in
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: true, user: mockUser }),
      });

      // Mock CSRF token request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: "test-csrf-token" }),
      });

      // Mock network error during logout
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      // Mock logout verification shows user is actually logged out
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: false }),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "true",
        );
      });

      await act(() => {
        screen.getByTestId("logout-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "false",
        );
        expect(screen.getByTestId("user-id")).toHaveTextContent("none");
      });
    });

    it("should handle successful logout but failed verification", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
      };

      // Initial auth check - user is logged in
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: true, user: mockUser }),
      });

      // Mock CSRF token request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: "test-csrf-token" }),
      });

      // Mock successful logout request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Logged out successfully" }),
      });

      // Mock logout verification that shows user is still authenticated (verification failed)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: true }),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "true",
        );
      });

      await act(() => {
        screen.getByTestId("logout-btn").click();
      });

      // The frontend state should still be cleared even if verification fails
      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "false",
        );
        expect(screen.getByTestId("user-id")).toHaveTextContent("none");
      });
    });
  });

  describe("useAuth hook", () => {
    it("should throw error when used outside AuthProvider", () => {
      const TestComponentOutsideProvider = () => {
        try {
          useAuth();
          return <div>Should not render</div>;
        } catch (error) {
          return <div data-testid="error">{(error as Error).message}</div>;
        }
      };

      render(<TestComponentOutsideProvider />);

      expect(screen.getByTestId("error")).toHaveTextContent(
        "useAuth must be used within AuthProvider",
      );
    });

    it("should provide auth context values", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: true, user: mockUser }),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "true",
        );
        expect(screen.getByTestId("user-id")).toHaveTextContent("1");
        expect(screen.getByTestId("user-username")).toHaveTextContent(
          "testuser",
        );
        expect(screen.getByTestId("user-email")).toHaveTextContent(
          "test@example.com",
        );
      });
    });
  });

  describe("Helper Functions", () => {
    describe("getCookie", () => {
      it("should extract cookie value correctly", () => {
        mockCookie.mockReturnValue(
          "csrftoken=abc123; sessionid=def456; other=value",
        );

        expect(getCookie("csrftoken")).toBe("abc123");
        expect(getCookie("sessionid")).toBe("def456");
        expect(getCookie("nonexistent")).toBe(null);
      });

      it("should handle empty cookie string", () => {
        mockCookie.mockReturnValue("");

        expect(getCookie("any")).toBe(null);
      });

      it("should handle malformed cookies", () => {
        mockCookie.mockReturnValue("malformed; cookie=value; =invalid");

        expect(getCookie("cookie")).toBe("value");
        expect(getCookie("malformed")).toBe(null);
      });
    });

    describe("ensureCsrfToken", () => {
      it("should return existing CSRF token from cookie", async () => {
        mockCookie.mockReturnValue("csrftoken=existing-token");

        const token = await ensureCsrfToken();
        expect(token).toBe("existing-token");
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it("should fetch new CSRF token when not in cookie", async () => {
        mockCookie.mockReturnValue("");
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: "new-token" }),
        });

        const token = await ensureCsrfToken();
        expect(token).toBe("new-token");
        expect(mockFetch).toHaveBeenCalledWith("/api/csrf-token", {
          method: "GET",
          credentials: "include",
        });
      });

      it("should handle failed CSRF token request", async () => {
        mockCookie.mockReturnValue("");
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

        const token = await ensureCsrfToken();
        expect(token).toBe(null);
      });

      it("should handle network error during CSRF token request", async () => {
        const consoleErrorSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => undefined);
        mockCookie.mockReturnValue("");
        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        const token = await ensureCsrfToken();
        expect(token).toBe(null);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error getting CSRF token:",
          expect.any(Error),
        );
        consoleErrorSpy.mockRestore();
      });
    });

    describe("verifyLogoutSuccess", () => {
      it("should return true when user is not authenticated", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ authenticated: false }),
        });

        const result = await verifyLogoutSuccess();
        expect(result).toBe(true);
      });

      it("should return false when user is still authenticated", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ authenticated: true }),
        });

        const result = await verifyLogoutSuccess();
        expect(result).toBe(false);
      });

      it("should handle failed verification request", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

        const result = await verifyLogoutSuccess();
        expect(result).toBe(false);
      });

      it("should handle network error during verification", async () => {
        const consoleErrorSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => undefined);
        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        const result = await verifyLogoutSuccess();
        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error verifying logout:",
          expect.any(Error),
        );
        consoleErrorSpy.mockRestore();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle multiple rapid login calls", async () => {
      // Initial auth check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: false }),
      });

      // Multiple auth checks for rapid login calls
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ authenticated: true, user: mockUser }),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "false",
        );
      });

      // Rapid login calls
      await act(() => {
        screen.getByTestId("login-btn").click();
        screen.getByTestId("login-btn").click();
        screen.getByTestId("login-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "true",
        );
      });
    });

    it("should handle authentication state changes during loading", async () => {
      let resolveFirstCall: ((value: Response) => void) | undefined;
      const firstCallPromise = new Promise<Response>((resolve) => {
        resolveFirstCall = resolve;
      });

      // First call hangs
      mockFetch.mockReturnValueOnce(firstCallPromise);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      // Should be loading
      expect(screen.getByTestId("is-loading")).toHaveTextContent("true");

      // Resolve the first call
      if (resolveFirstCall) {
        resolveFirstCall({
          ok: true,
          json: () =>
            Promise.resolve({
              authenticated: true,
              user: { id: 1, username: "test" },
            }),
        } as Response);
      }

      await waitFor(() => {
        expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "true",
        );
      });
    });
  });
});
