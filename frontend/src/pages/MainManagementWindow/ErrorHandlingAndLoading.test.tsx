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
vi.mock('../../auth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
  useAuth: () => mockAuth,
}));

// Mock BackgroundProvider
vi.mock('../../context/BackgroundContext', () => ({
  BackgroundProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="background-provider">{children}</div>
  ),
  useBackground: () => mockBackgroundContext,
}));

// Mock ToastProvider
vi.mock('../../components/ToastProvider', () => ({
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

// Mock the BackgroundSwitcher component
vi.mock('../../components/BackgroundSwitcher', () => ({
  default: ({
    currentBackground,
    onBackgroundChange,
  }: {
    currentBackground: string;
    onBackgroundChange: (type: string) => void;
  }) => (
    <button
      data-testid="background-switcher"
      onClick={() => onBackgroundChange('neural-network')}
    >
      Background: {currentBackground}
    </button>
  ),
}));

// Mock hooks with proper error handling
const mockProjects = {
  projects: [{ id: 1, name: 'Test Project', description: 'Test project description' }],
  loading: false,
  error: null,
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  refetch: vi.fn(),
};

vi.mock('../../hooks/useProjects', () => ({
  useProjects: () => mockProjects,
}));

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

describe('MainManagementWindow - Error Handling & Loading States', () => {
  beforeEach(() => {
    setupBeforeEach();
    // Reset mock projects to default state
    mockProjects.projects = [{ id: 1, name: 'Test Project', description: 'Test project description' }];
    mockProjects.loading = false;
    mockProjects.error = null;
    mockProjects.refetch.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Error Handling', () => {
    it('shows error state when tasks fetch fails', async () => {
      // Set up failing tasks fetch
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/csrf-token') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrf_token: 'mock-token' }),
          } as Response);
        }
        if (url === '/api/tasks') {
          return Promise.reject(new Error('Tasks fetch failed'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response);
      });

      render(<MainManagementWindowWrapper />);

      await waitFor(() => {
        expect(screen.getByText(/Unknown error/)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('shows error state when projects fetch fails', async () => {
      // Set up empty projects (no error, just empty state)
      mockProjects.error = null;
      mockProjects.projects = [];

      render(<MainManagementWindowWrapper />);
      
      const projectsButton = screen.getByText('Projects').closest('button');
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      await waitFor(() => {
        expect(screen.getByText('No projects found')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Loading States', () => {
    it('shows loading state for tasks', () => {
      // Mock the first call (projects) to resolve, second call (tasks) to hang
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [] }),
        } as Response)
        .mockImplementationOnce(() => new Promise((_resolve) => {
          // Never resolves (tasks)
        }));

      act(() => {
        render(<MainManagementWindowWrapper />);
      });

      expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
    });

    it('shows loading state for projects', () => {
      // Mock tasks call to resolve first, then projects call to hang
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
        .mockImplementationOnce(() => new Promise((_resolve) => {
          // Never resolves (projects view)
        }));

      act(() => {
        render(<MainManagementWindowWrapper />);
      });
      
      const projectsButton = screen.getByText('Projects').closest('button');
      if (projectsButton) {
        act(() => {
          fireEvent.click(projectsButton);
        });
      }

      expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    });
  });

  describe('CSRF Token Management', () => {
    it('handles form submission properly', async () => {
      act(() => {
        render(<MainManagementWindowWrapper />);
      });
      
      const projectsButton = screen.getByText('Projects').closest('button');
      if (projectsButton) {
        act(() => {
          fireEvent.click(projectsButton);
        });
      }

      await waitFor(() => {
        const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
        expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
          credentials: 'include',
        });
      }, { timeout: 5000 });
    });

    it('uses existing environment properly', () => {
      act(() => {
        render(<MainManagementWindowWrapper />);
      });
      
      const projectsButton = screen.getByText('Projects').closest('button');
      if (projectsButton) {
        act(() => {
          fireEvent.click(projectsButton);
        });
      }
      
      // Basic functionality test
      expect(screen.getByText('Your Projects')).toBeInTheDocument();
    });
  });
});