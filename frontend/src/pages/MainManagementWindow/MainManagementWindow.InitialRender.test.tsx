import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import MainManagementWindow from '../MainManagementWindow';
import { AuthProvider } from '../../auth';
import { BackgroundProvider } from '../../context/BackgroundContext';
import { ToastProvider } from '../../components/ToastProvider';
import {
  setupFetchMock,
  setupBeforeEach,
  mockAuth,
  mockBackgroundContext,
  mockToastContext,
  mockNavigate,
} from '../__tests__/testUtils';

// Setup global fetch mock
setupFetchMock();

// Mock AuthProvider
vi.mock('../auth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
  useAuth: () => mockAuth,
}));

// Mock BackgroundProvider
vi.mock('../context/BackgroundContext', () => ({
  BackgroundProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="background-provider">{children}</div>
  ),
  useBackground: () => mockBackgroundContext,
}));

// Mock ToastProvider
vi.mock('../components/ToastProvider', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="toast-provider">{children}</div>
  ),
  useToast: () => mockToastContext,
}));

// Mock router navigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const MainManagementWindowWrapper: React.FC = () => (
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

// Setup common mocks
describe('MainManagementWindow - Initial Render & Sidebar', () => {
  beforeEach(() => {
    setupBeforeEach();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Initial Render', () => {
    it('renders main components when authenticated', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });
      
      // Wait for main component to render
      await waitFor(() => {
        expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Check for header components
      expect(screen.getByText('Productivity Hub')).toBeInTheDocument();
      expect(screen.getByLabelText('Change background style')).toBeInTheDocument();
      
      // Check for sidebar
      expect(screen.getAllByText('All Tasks')).toHaveLength(2); // One in sidebar, one in main
      expect(screen.getByText('Quick Tasks')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('renders sidebar with navigation items', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Check for sidebar navigation items
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toBeInTheDocument();
      
      // Check for each navigation item
      expect(screen.getAllByText('All Tasks')).toHaveLength(2); // One in sidebar, one in main
      expect(screen.getByText('Quick Tasks')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('starts with "All Tasks" view active', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Check that All Tasks view is active by default
      // The active class should be on the All Tasks button
      const allTasksButtons = screen.getAllByText('All Tasks');
      const allTasksButton = allTasksButtons.find(button =>
        button.closest('.phub-sidebar-nav')
      )?.closest('button');
      expect(allTasksButton).toHaveClass('phub-sidebar-item-active');
      
      // Check that the main content shows tasks-related content
      await waitFor(() => {
        const allTasksInMain = screen.getAllByText('All Tasks').find(element =>
          element.closest('main')
        );
        expect(allTasksInMain).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Sidebar Functionality', () => {
    it('toggles sidebar collapse state', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Find the collapse button
      const collapseButton = screen.getByLabelText('Collapse sidebar');
      expect(collapseButton).toBeInTheDocument();

      // Check initial state - sidebar should not be collapsed
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).not.toHaveClass('phub-sidebar-collapsed');

      // Click collapse button
      await act(async () => {
        fireEvent.click(collapseButton);
      });

      // Check that sidebar is now collapsed
      expect(sidebar).toHaveClass('phub-sidebar-collapsed');

      // Click again to expand
      const expandButton = screen.getByLabelText('Expand sidebar');
      await act(async () => {
        fireEvent.click(expandButton);
      });

      // Check that sidebar is expanded again
      expect(sidebar).not.toHaveClass('phub-sidebar-collapsed');
    });

    it('switches between different views', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Initially "All Tasks" should be active
      const allTasksButtons = screen.getAllByText('All Tasks');
      // Get the one inside the sidebar navigation
      const allTasksButton = allTasksButtons.find(button =>
        button.closest('.phub-sidebar-nav')
      )?.closest('button');
      expect(allTasksButton).toHaveClass('phub-sidebar-item-active');

      // Click on Quick Tasks
      const quickTasksButtons = screen.getAllByText('Quick Tasks');
      const quickTasksButton = quickTasksButtons.find(button =>
        button.closest('.phub-sidebar-nav')
      )?.closest('button');
      await act(async () => {
        fireEvent.click(quickTasksButton!);
      });

      // Check that Quick Tasks is now active
      expect(quickTasksButton).toHaveClass('phub-sidebar-item-active');
      expect(allTasksButton).not.toHaveClass('phub-sidebar-item-active');

      // Click on Projects
      const projectsButtons = screen.getAllByText('Projects');
      const projectsButton = projectsButtons.find(button =>
        button.closest('.phub-sidebar-nav')
      )?.closest('button');
      await act(async () => {
        fireEvent.click(projectsButton!);
      });

      // Check that Projects is now active
      expect(projectsButton).toHaveClass('phub-sidebar-item-active');
      expect(quickTasksButton).not.toHaveClass('phub-sidebar-item-active');
    });

    it('handles logout when logout button is clicked', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Find and click the Sign Out button
      const signOutButtons = screen.getAllByText('Sign Out');
      const signOutButton = signOutButtons.find(button =>
        button.closest('.phub-sidebar-nav')
      )?.closest('button');
      await act(async () => {
        fireEvent.click(signOutButton!);
      });

      // Check that logout was called
      expect(mockAuth.logout).toHaveBeenCalledTimes(1);
    });
  });
});