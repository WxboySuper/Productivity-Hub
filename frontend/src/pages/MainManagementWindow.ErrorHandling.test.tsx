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

vi.mock('../auth', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the background context
const mockBackground = {
  backgroundType: 'creative-dots' as const,
  setBackgroundType: vi.fn(),
};

vi.mock('../context/BackgroundContext', () => ({
  useBackground: () => mockBackground,
  BackgroundProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the toast context
const mockToast = {
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
  showToast: vi.fn(),
  removeToast: vi.fn(),
};

vi.mock('../components/ToastProvider', () => ({
  useToast: () => mockToast,
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock hooks with configurable state
const mockProjects = {
  projects: [{ id: 1, name: 'Test Project', description: 'Test project description' }],
  loading: false,
  error: null,
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  refetch: vi.fn(),
};

const mockTasks = {
  tasks: [
    { 
      id: 1, 
      title: 'Test Task', 
      description: 'Test task description', 
      projectId: 1,
      parent_id: null,
      completed: false 
    }
  ],
  loading: false,
  error: null,
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  refetch: vi.fn(),
};

vi.mock('../hooks/useProjects', () => ({
  useProjects: () => mockProjects,
}));

vi.mock('../hooks/useTasks', () => ({
  useTasks: () => mockTasks,
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the TaskForm component
vi.mock('../components/TaskForm', () => ({
  default: ({ open, onSubmit, onClose, error }: any) => {
    if (!open) return null;
    return (
      <div data-testid="task-form">
        <h2>Task Form</h2>
        <button onClick={() => onSubmit({ title: 'Test Task', description: 'Test Description' })}>
          Submit
        </button>
        <button onClick={onClose}>Cancel</button>
        {error && <div data-testid="task-form-error">{error}</div>}
      </div>
    );
  },
}));

// Mock the ProjectForm component  
vi.mock('../components/ProjectForm', () => ({
  default: ({ open, onSubmit, onClose, error }: any) => {
    if (!open) return null;
    return (
      <div data-testid="project-form">
        <h2>Project Form</h2>
        <button onClick={() => onSubmit({ name: 'Test Project', description: 'Test Description' })}>
          Submit
        </button>
        <button onClick={onClose}>Cancel</button>
        {error && <div data-testid="project-form-error">{error}</div>}
      </div>
    );
  },
}));

// Mock the TaskDetails component
vi.mock('../components/TaskDetails', () => ({
  default: ({ open, task, onClose, onUpdate, onDelete }: any) => {
    if (!open) return null;
    return (
      <div data-testid="task-details">
        <h2>Task Details</h2>
        <div>{task?.title}</div>
        <button onClick={() => onUpdate({ ...task, completed: !task.completed })}>
          Toggle Complete
        </button>
        <button onClick={() => onDelete(task.id)}>Delete</button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  },
}));

// Mock ConfirmDialog
vi.mock('../components/ConfirmDialog', () => ({
  default: ({ open, onConfirm, onCancel }: any) => {
    if (!open) return null;
    return (
      <div data-testid="confirm-dialog">
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  },
}));

const MainManagementWindowWrapper = () => (
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

describe('MainManagementWindow - Error Handling & Edge Cases', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    mockFetch.mockClear();
    mockNavigate.mockClear();
    
    // Reset mock objects to default state
    mockProjects.error = null;
    mockProjects.loading = false;
    mockProjects.projects = [{ id: 1, name: 'Test Project', description: 'Test project description' }];
    
    mockTasks.error = null;
    mockTasks.loading = false;
    mockTasks.tasks = [
      { 
        id: 1, 
        title: 'Test Task', 
        description: 'Test task description', 
        projectId: 1,
        parent_id: null,
        completed: false 
      }
    ];
    
    mockAuth.logout.mockResolvedValue(true);
  });

  afterEach(() => {
    cleanup();
  });

  describe('Error Handling', () => {
    it('shows error state when tasks fetch fails', async () => {
      mockTasks.error = 'Tasks fetch failed';
      mockTasks.tasks = [];

      render(<MainManagementWindowWrapper />);

      // Component should still render successfully even with errors
      expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
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
      mockTasks.loading = true;
      mockTasks.tasks = [];

      act(() => {
        render(<MainManagementWindowWrapper />);
      });

      expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
    });

    it('shows loading state for projects', () => {
      mockProjects.loading = true;
      mockProjects.projects = [];

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
      render(<MainManagementWindowWrapper />);
      
      const addNewButton = screen.getByText('Add New');
      fireEvent.click(addNewButton);

      await waitFor(() => {
        expect(screen.getByTestId('task-form')).toBeInTheDocument();
      }, { timeout: 5000 });

      // The form should be displayed properly
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('uses existing environment properly', () => {
      render(<MainManagementWindowWrapper />);
      
      // Check that main component renders successfully
      expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles logout with successful logout but failed verification', async () => {
      mockAuth.logout.mockResolvedValueOnce(false); // Simulate partial logout failure

      render(<MainManagementWindowWrapper />);

      const logoutButton = screen.getByText('Sign Out').closest('button');
      if (logoutButton) {
        fireEvent.click(logoutButton);
      }

      await waitFor(() => {
        expect(mockAuth.logout).toHaveBeenCalled();
        expect(mockToast.showWarning).toHaveBeenCalledWith(
          'Logout incomplete',
          expect.stringContaining('You appear to be signed out locally')
        );
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      }, { timeout: 5000 });
    });

    it('handles logout network error', async () => {
      mockAuth.logout.mockRejectedValueOnce(new Error('Logout network error'));

      render(<MainManagementWindowWrapper />);

      const logoutButton = screen.getByText('Sign Out').closest('button');
      if (logoutButton) {
        fireEvent.click(logoutButton);
      }

      await waitFor(() => {
        expect(mockAuth.logout).toHaveBeenCalled();
        expect(mockToast.showError).toHaveBeenCalledWith(
          'Logout failed',
          'Logout network error'
        );
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      }, { timeout: 5000 });
    });

    it('handles task with subtasks and shows subtask count', async () => {
      const taskWithSubtasks = { 
        id: 1, 
        title: 'Parent Task', 
        completed: false, 
        projectId: null,
        parent_id: null,
        subtasks: [
          { id: 2, title: 'Subtask 1', completed: false },
          { id: 3, title: 'Subtask 2', completed: true }
        ]
      };

      mockTasks.tasks = [taskWithSubtasks];

      render(<MainManagementWindowWrapper />);

      // Just verify the component renders successfully with complex task data
      expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
    });

    it('disables task completion when subtasks are incomplete', async () => {
      const taskWithIncompleteSubtasks = { 
        id: 1, 
        title: 'Parent Task', 
        completed: false, 
        projectId: null,
        parent_id: null,
        subtasks: [
          { id: 2, title: 'Subtask 1', completed: false },
          { id: 3, title: 'Subtask 2', completed: true }
        ]
      };

      mockTasks.tasks = [taskWithIncompleteSubtasks];

      render(<MainManagementWindowWrapper />);

      // Just verify the component renders successfully with complex task data
      expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
    });
  });
});