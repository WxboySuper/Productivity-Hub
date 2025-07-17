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

// Mock the TaskForm component
vi.mock('../components/TaskForm', () => ({
  default: ({
    onSubmit,
    onClose,
    initialValues,
    editMode,
    open,
    error,
  }: {
    onSubmit: (task: { title: string; description: string }) => void;
    onClose: () => void;
    initialValues?: { title?: string; description?: string };
    editMode?: boolean;
    open?: boolean;
    error?: string | null;
  }) => {
    if (!open) return null;
    return (
      <div data-testid="task-form">
        <h2>{editMode ? 'Edit Task' : 'Create Task'}</h2>
        {error && <div>{error}</div>}
        {initialValues?.title && <div>Initial: {initialValues.title}</div>}
        <button onClick={() => onSubmit({ title: 'Test Task', description: 'Test Description' })}>
          Submit
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  },
}));

// Mock the TaskDetails component
vi.mock('../components/TaskDetails', () => ({
  default: ({
    open,
    onClose,
    task,
  }: {
    open: boolean;
    onClose: () => void;
    task: any;
  }) => (
    open ? (
      <div data-testid="task-details">
        <h2>Task Details</h2>
        <div>Title: {task?.title || 'N/A'}</div>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
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

describe('MainManagementWindow - Task Form & Management', () => {
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

  describe('Task Form', () => {
    it('opens task form when Add New button is clicked', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
      }, { timeout: 5000 });

      const addNewButton = screen.getByText('Add New').closest('button');
      if (addNewButton) {
        await act(async () => {
          fireEvent.click(addNewButton);
        });
      }
      
      await waitFor(() => {
        expect(screen.getByTestId('task-form')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('closes task form when cancel is clicked', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
      }, { timeout: 5000 });

      const addNewButton = screen.getByText('Add New').closest('button');
      if (addNewButton) {
        await act(async () => {
          fireEvent.click(addNewButton);
        });
      }

      await waitFor(() => {
        expect(screen.getByTestId('task-form')).toBeInTheDocument();
      }, { timeout: 5000 });

      const taskForm = screen.getByTestId('task-form');
      const cancelButton = taskForm.querySelector('button:last-child');
      if (cancelButton) {
        await act(async () => {
          fireEvent.click(cancelButton);
        });
      }

      await waitFor(() => {
        expect(screen.queryByTestId('task-form')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Task Management', () => {
    it('handles task creation', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ tasks: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'test-token' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: 'Task created' }),
        } as Response);

      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
      }, { timeout: 5000 });

      const addNewButton = screen.getByText('Add New').closest('button');
      if (addNewButton) {
        await act(async () => {
          fireEvent.click(addNewButton);
        });
      }

      await waitFor(() => {
        expect(screen.getByTestId('task-form')).toBeInTheDocument();
      }, { timeout: 5000 });

      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        }));
      }, { timeout: 5000 });
    });

    it('handles task completion toggling', async () => {
      const testTask = { 
        id: 1, 
        title: 'Test Task', 
        completed: false, 
        projectId: 1, 
        parent_id: null,
        description: 'Test task description'
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [{ id: 1, name: 'Test Project' }] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ tasks: [testTask] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'test-token' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ...testTask, completed: true }),
        } as Response);

      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      }, { timeout: 5000 });

      const checkbox = screen.getByRole('checkbox');
      await act(async () => {
        fireEvent.click(checkbox);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(`/api/tasks/${testTask.id}`, expect.objectContaining({
          method: 'PUT',
          credentials: 'include',
        }));
      }, { timeout: 5000 });
    });

    it('handles task deletion', async () => {
      const testTask = { 
        id: 1, 
        title: 'Test Task', 
        completed: false, 
        projectId: 1, 
        parent_id: null,
        description: 'Test task description'
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [{ id: 1, name: 'Test Project' }] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ tasks: [testTask] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response);

      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      }, { timeout: 5000 });

      const deleteButton = screen.getByText('Delete');
      await act(async () => {
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(`/api/tasks/${testTask.id}`, expect.objectContaining({
          method: 'DELETE',
          credentials: 'include',
        }));
      }, { timeout: 5000 });
    });

    it('opens task details when clicking on task title', async () => {
      const testTask = { 
        id: 1, 
        title: 'Test Task', 
        completed: false, 
        projectId: 1, 
        parent_id: null,
        description: 'Test task description'
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [{ id: 1, name: 'Test Project' }] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ tasks: [testTask] }),
        } as Response);

      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      }, { timeout: 5000 });

      const taskTitle = screen.getByText('Test Task');
      await act(async () => {
        fireEvent.click(taskTitle);
      });

      await waitFor(() => {
        expect(screen.getByTestId('task-details')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('handles task form error display', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ tasks: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'test-token' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Task creation failed' }),
        } as Response);

      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
      }, { timeout: 5000 });

      const addNewButton = screen.getByText('Add New').closest('button');
      if (addNewButton) {
        await act(async () => {
          fireEvent.click(addNewButton);
        });
      }

      await waitFor(() => {
        expect(screen.getByTestId('task-form')).toBeInTheDocument();
      }, { timeout: 5000 });

      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Task creation failed')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});
