import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import MainManagementWindow from './MainManagementWindow';
import { AuthProvider } from '../auth';
import { BackgroundProvider } from '../context/BackgroundContext';
import { ToastProvider } from '../components/ToastProvider';

// Setup global fetch mock properly
global.fetch = vi.fn().mockImplementation((url: string) => {
  if (url === '/api/csrf-token') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ csrf_token: 'mock-token' }),
    } as Response);
  }
  if (url === '/api/projects') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ 
        projects: [
          { id: 1, name: 'Test Project', description: 'Test project description' }
        ] 
      }),
    } as Response);
  }
  if (url === '/api/tasks') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ 
        tasks: [
          { 
            id: 1, 
            title: 'Test Task', 
            description: 'Test task description', 
            projectId: 1,
            parent_id: null,
            completed: false 
          },
          { 
            id: 2, 
            title: 'Quick Task', 
            description: 'A quick task', 
            projectId: null,
            parent_id: null,
            completed: false 
          }
        ] 
      }),
    } as Response);
  }
  // Default fallback
  return Promise.resolve({
    ok: false,
    json: () => Promise.resolve({ error: 'Not found' }),
  } as Response);
});

// Create a typed version of the mock for easier use
const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

// Mock the auth hook
const mockAuth = {
  isAuthenticated: true,
  isLoading: false,
  user: { id: 1, username: 'testuser', email: 'test@example.com' },
  login: vi.fn(),
  logout: vi.fn().mockResolvedValue(true),
  checkAuth: vi.fn(),
};

// Mock AuthProvider
vi.mock('../auth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
  useAuth: () => mockAuth,
}));

// Mock BackgroundProvider
const mockBackgroundContext = {
  backgroundType: 'creative-dots',
  setBackgroundType: vi.fn(),
};

vi.mock('../context/BackgroundContext', () => ({
  BackgroundProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="background-provider">{children}</div>
  ),
  useBackground: () => mockBackgroundContext,
}));

// Mock ToastProvider
const mockToastContext = {
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
};

vi.mock('../components/ToastProvider', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="toast-provider">{children}</div>
  ),
  useToast: () => mockToastContext,
}));

// Mock router navigate
const mockNavigate = vi.fn();
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

describe('MainManagementWindow - Initial Render & Sidebar', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockAuth.logout.mockClear();
    mockBackgroundContext.setBackgroundType.mockClear();
    mockToastContext.showSuccess.mockClear();
    mockToastContext.showError.mockClear();
    mockToastContext.showWarning.mockClear();
    mockToastContext.showInfo.mockClear();
    mockNavigate.mockClear();
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
      });

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
      });

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
      });

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
      });
    });
  });

  describe('Sidebar Functionality', () => {
    it('toggles sidebar collapse state', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
      });

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
      });

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
      });

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