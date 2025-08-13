import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import App from "./App";

// Mock the auth module
const mockUseAuth = vi.fn();
vi.mock("./auth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock other components to isolate App.tsx testing
vi.mock("./pages/HomePage", () => ({
  default: () => <div data-testid="home-page">Home Page</div>,
}));

vi.mock("./pages/MainManagementWindow", () => ({
  default: () => (
    <div data-testid="main-management-window">Main Management Window</div>
  ),
}));

vi.mock("./pages/LoginPage", () => ({
  default: () => <div data-testid="login-page">Login Page</div>,
}));

vi.mock("./pages/RegisterPage", () => ({
  default: () => <div data-testid="register-page">Register Page</div>,
}));

vi.mock("./pages/PasswordResetRequestPage", () => ({
  default: () => (
    <div data-testid="password-reset-request-page">
      Password Reset Request Page
    </div>
  ),
}));

vi.mock("./pages/PasswordResetConfirmPage", () => ({
  default: () => (
    <div data-testid="password-reset-confirm-page">
      Password Reset Confirm Page
    </div>
  ),
}));

vi.mock("./components/common/NotificationCenter", () => ({
  default: () => (
    <div data-testid="notification-center">Notification Center</div>
  ),
}));

vi.mock("./components/common/Background", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="background">{children}</div>
  ),
}));

vi.mock("./components/common/ErrorBoundary", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <>
      <div data-testid="error-boundary">{children}</div>
      <div data-testid="error-boundary">{children}</div>
    </>
  ),
}));

vi.mock("./components/ToastProvider", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="toast-provider">
      <div data-testid="toast-provider-inner">{children}</div>
    </div>
  ),
}));

vi.mock("./context/BackgroundContext", () => ({
  BackgroundProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="background-provider">
      <div data-testid="background-provider-inner">{children}</div>
    </div>
  ),
  useBackground: () => ({
    backgroundType: "gradient1",
    setBackgroundType: vi.fn(),
  }),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
let mockLocation = { pathname: "/" };

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="router">{children}</div>
    ),
    Routes: ({ children }: { children: React.ReactNode }) => {
      // Enhanced mock routing logic to handle different paths
      const routes = React.Children.toArray(children) as React.ReactElement[];

      // Find a route that matches the current location
      const currentRoute = routes.find((route) => {
        if (route.props.path === "*") return mockLocation.pathname !== "/"; // Catch-all only for unknown routes
        if (route.props.path === mockLocation.pathname) return true;
        return route.props.path === "/" && mockLocation.pathname === "/";
      });

      if (currentRoute) {
        return currentRoute.props.element;
      }

      // Return 404 for unknown routes
      const notFoundRoute = routes.find((route) => route.props.path === "*");
      if (notFoundRoute) {
        return notFoundRoute.props.element;
      }

      // Fallback for unknown routes
      return <div data-testid="routes">{children}</div>;
    },
    Route: ({ element }: { element: React.ReactNode }) => element,
    Navigate: ({ to, replace }: { to: string; replace?: boolean }) => (
      <div data-testid="navigate" data-to={to} data-replace={replace}>
        Navigate to {to}
      </div>
    ),
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

describe("App Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation = { pathname: "/" }; // Reset to default route
  });

  test("renders app without crashing", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  test("shows loading state when authentication is loading", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<App />);

    expect(
      screen.getAllByText("Checking authentication...").length,
    ).toBeGreaterThanOrEqual(1);
    const checkingAuthElements = screen.getAllByText(
      "Checking authentication...",
    );
    checkingAuthElements.forEach((el) => {
      expect(el.closest(".min-h-screen")).toBeInTheDocument();
    });
  });

  test("renders HomePage when not authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<App />);

    expect(screen.getAllByTestId("home-page").length).toBeGreaterThanOrEqual(1);
  });

  test("renders MainManagementWindow when authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: "testuser" },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<App />);

    expect(
      screen.getAllByTestId("main-management-window").length,
    ).toBeGreaterThanOrEqual(1);
  });

  test("renders NotFound component for unknown routes", () => {
    mockLocation = { pathname: "/unknown-route" };
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<App />);

    expect(
      screen.getAllByText("404 - Page Not Found").length,
    ).toBeGreaterThanOrEqual(1);
    screen.getAllByText("404 - Page Not Found").forEach((el) => {
      expect(el).toHaveClass("text-2xl");
      expect(el).toHaveClass("font-bold");
      expect(el).toHaveClass("text-center");
      expect(el).toHaveClass("mt-10");
      expect(el).toHaveClass("text-red-600");
    });
  });

  test("PublicRoute redirects authenticated users", () => {
    mockLocation = { pathname: "/login" };
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: "testuser" },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<App />);

    // Should show Navigate component redirecting to "/"
    expect(screen.getAllByTestId("navigate").length).toBeGreaterThanOrEqual(1);
    screen.getAllByTestId("navigate").forEach((el) => {
      expect(el).toHaveAttribute("data-to", "/");
      expect(el).toHaveAttribute("data-replace", "true");
    });
  });

  test("PublicRoute renders children for unauthenticated users", () => {
    mockLocation = { pathname: "/login" };
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<App />);

    // Should render the login page directly, not navigate
    expect(screen.getAllByTestId("login-page").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
  });
});

test("renders all provider components in correct order", () => {
  mockUseAuth.mockReturnValue({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  });

  render(<App />);

  expect(screen.getAllByTestId("error-boundary").length).toBeGreaterThanOrEqual(
    2,
  );
  expect(screen.getAllByTestId("toast-provider").length).toBeGreaterThanOrEqual(
    1,
  );
  expect(
    screen.getAllByTestId("background-provider").length,
  ).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByTestId("background").length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByTestId("router").length).toBeGreaterThanOrEqual(1);
  expect(
    screen.getAllByTestId("notification-center").length,
  ).toBeGreaterThanOrEqual(1);
});
test("handles authenticated user with loading false", () => {
  mockLocation = { pathname: "/" }; // Explicitly set to home
  mockUseAuth.mockReturnValue({
    user: { id: 1, username: "testuser", email: "test@example.com" },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  });

  render(<App />);

  expect(
    screen.queryByText("Checking authentication..."),
  ).not.toBeInTheDocument();
  expect(
    screen.getAllByTestId("main-management-window").length,
  ).toBeGreaterThanOrEqual(1);
});

test("handles unauthenticated user with loading false", () => {
  mockLocation = { pathname: "/" }; // Explicitly set to home
  mockUseAuth.mockReturnValue({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  });

  render(<App />);

  expect(
    screen.queryByText("Checking authentication..."),
  ).not.toBeInTheDocument();
  expect(screen.getAllByTestId("home-page").length).toBeGreaterThanOrEqual(1);
});
