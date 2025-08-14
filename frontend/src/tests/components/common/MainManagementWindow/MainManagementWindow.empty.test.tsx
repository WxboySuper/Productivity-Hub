import { render, screen } from "@testing-library/react";
import MainManagementWindow from "../../../../pages/MainManagementWindow";
import { describe, it, vi, expect } from "vitest";
import { AuthContext } from "../../../../auth";
import { BackgroundProvider } from "../../../../context/BackgroundContext";
import { ToastProvider } from "../../../../components/common/ToastProvider";

vi.mock("../../../../hooks/useProjects", () => ({
  default: () => ({
    projects: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));
vi.mock("../../../../hooks/useTasks", () => ({
  default: () => ({ tasks: [], loading: false, error: null, refetch: vi.fn() }),
}));
vi.mock("../../../../context/BackgroundContext", async () => {
  const mockBackgroundContext = {
    backgroundType: "creative-dots",
    setBackgroundType: vi.fn(),
  };
  return {
    __esModule: true,
    BackgroundProvider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="background-provider">{children}</div>
    ),
    useBackground: () => mockBackgroundContext,
  };
});
vi.mock("../../../../components/common/ToastProvider", async () => {
  const actual = await vi.importActual<
    typeof import("../../../../components/common/ToastProvider")
  >("../../../../components/common/ToastProvider");
  return {
    ...actual,
    useToast: () => ({
      showSuccess: vi.fn(),
      showError: vi.fn(),
      showWarning: vi.fn(),
      showInfo: vi.fn(),
    }),
  };
});
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  Link: (({
    children,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) => (
    <a {...props}>{children}</a>
  )) as React.FC<React.PropsWithChildren<Record<string, unknown>>>,
}));
// No need to mock useAuth directly; we provide AuthContext value below.

const mockAuth = {
  isAuthenticated: false,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn(),
};

describe("MainManagementWindow empty states", () => {
  it("renders without crashing and shows sidebar", () => {
    render(
      <AuthContext.Provider value={mockAuth}>
        <BackgroundProvider>
          <ToastProvider>
            <MainManagementWindow />
          </ToastProvider>
        </BackgroundProvider>
      </AuthContext.Provider>,
    );
  // Sidebar is rendered as an <aside role="complementary">
  expect(screen.getByRole("complementary")).toBeInTheDocument();
  });
});
