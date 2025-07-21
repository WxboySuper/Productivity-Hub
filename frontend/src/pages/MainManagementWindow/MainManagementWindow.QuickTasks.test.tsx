import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import MainManagementWindow from '../MainManagementWindow';
import { AuthProvider } from '../../auth';
import { BackgroundProvider } from '../../context/BackgroundContext';
import { ToastProvider } from '../../components/ToastProvider';

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

// Helper function to set up empty state mocks
const setupEmptyStateMocks = () => {
  mockFetch.mockClear();
  mockFetch.mockImplementation((url: string) => {
    if (url === '/api/csrf-token') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ csrf_token: 'mock-token' }),
      } as Response);
    }
    if (url === '/api/projects') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ projects: [] }),
      } as Response);
    }
    if (url === '/api/tasks') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ tasks: [] }),
      } as Response);
    }
    return Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: 'Not found' }),
    } as Response);
  });
};

// Mock the auth hook
const mockAuth = {
  isAuthenticated: true,
  isLoading: false,
  user: { id: 1, username: 'testuser', email: 'test@example.com' },
  login: vi.fn(),
  logout: vi.fn().mockResolvedValue(true),
  checkAuth: vi.fn(),
};

vi.mock('../../auth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => mockAuth,
}));

// Mock hooks
vi.mock('../../hooks/useProjects', () => ({
  useProjects: () => ({
    projects: [{ id: 1, name: 'Test Project', description: 'Test project description' }],
    loading: false,
    error: null,
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    refetch: vi.fn(),
  }),
}));

vi.mock('../../hooks/useTasks', () => ({
  useTasks: () => ({
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
    ],
    loading: false,
    error: null,
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    refetch: vi.fn(),
  }),
  ensureCsrfToken: vi.fn(() => Promise.resolve('mocked_csrf_token')),
}));

// Mock the TaskForm component
type TaskFormProps = {
  open: boolean;
  onSubmit: (task: { title: string; description: string }) => void;
  onClose: () => void;
  error?: string | null;
};
vi.mock('../../components/TaskForm', () => ({
  default: ({ open, onSubmit, onClose, error }: TaskFormProps) => {
    if (!open) return null;
    const handleSubmit = () => onSubmit({ title: 'Test Task', description: 'Test Description' });
    return (
      <div data-testid="task-form">
        <h2>Task Form</h2>
        <button onClick={handleSubmit}>
          Submit
        </button>
        <button onClick={onClose}>Cancel</button>
        {error && <div data-testid="task-form-error">{error}</div>}
      </div>
    );
  },
}));

// Mock the ProjectForm component  
type ProjectFormProps = {
  open: boolean;
  onSubmit: (project: { name: string; description: string }) => void;
  onClose: () => void;
  error?: string | null;
};
vi.mock('../../components/ProjectForm', () => ({
  default: ({ open, onSubmit, onClose, error }: ProjectFormProps) => {
    if (!open) return null;
    const handleSubmit = () => onSubmit({ name: 'Test Project', description: 'Test Description' });
    return (
      <div data-testid="project-form">
        <h2>Project Form</h2>
        <button onClick={handleSubmit}>
          Submit
        </button>
        <button onClick={onClose}>Cancel</button>
        {error && <div data-testid="project-form-error">{error}</div>}
      </div>
    );
  },
}));

// Mock the TaskDetails component
type TaskDetailsProps = {
  open: boolean;
  task: { id: number; title: string; description: string; completed: boolean; projectId: number | null; parent_id: number | null };
  onClose: () => void;
  onUpdate: (task: { id: number; title: string; description: string; completed: boolean; projectId: number | null; parent_id: number | null }) => void;
  onDelete: (id: number) => void;
};
vi.mock('../../components/TaskDetails', () => ({
  default: ({ open, task, onClose, onUpdate, onDelete }: TaskDetailsProps) => {
    if (!open) return null;
    const handleToggleComplete = () => onUpdate({ ...task, completed: !task.completed });
    const handleDelete = () => onDelete(task.id);
    return (
      <div data-testid="task-details">
        <h2>Task Details</h2>
        <div>{task?.title}</div>
        <button onClick={handleToggleComplete}>
          Toggle Complete
        </button>
        <button onClick={handleDelete}>Delete</button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  },
}));

// Mock ConfirmDialog
type ConfirmDialogProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};
vi.mock('../../components/ConfirmDialog', () => ({
  default: ({ open, onConfirm, onCancel }: ConfirmDialogProps) => {
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

describe('MainManagementWindow - Quick Tasks', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Quick Tasks View', () => {
    it('switches to quick tasks view and shows quick tasks', async () => {
      render(<MainManagementWindowWrapper />);
      
      const quickTasksButton = screen.getByText('Quick Tasks').closest('button');
      if (quickTasksButton) {
        fireEvent.click(quickTasksButton);
      }

      // Look for quick task specifically - the hook should provide this
      await waitFor(() => {
        expect(screen.getByText('Quick Task')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('shows empty state for quick tasks when none exist', async () => {
      setupEmptyStateMocks();

      render(<MainManagementWindowWrapper />);
      
      const quickTaskButton = await waitFor(() => {
        return screen.getByText('Quick Tasks')
      }, { timeout: 5000 });

      fireEvent.click(quickTaskButton);

      const addQuickTaskButton = await waitFor(() => {
        return screen.getByText('Add Quick Task');
      }, { timeout: 5000 });

      fireEvent.click(addQuickTaskButton);

      await waitFor(() => {
        expect(screen.getByText('No quick tasks found')).toBeInTheDocument();
        expect(screen.getByText('Add Quick Task')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('opens task form when clicking Add Quick Task', async () => {
      setupEmptyStateMocks();

      render(<MainManagementWindowWrapper />);
      
      const quickTasksButton = screen.getByText('Quick Tasks').closest('button');
      if (quickTasksButton) {
        fireEvent.click(quickTasksButton);
      }

      await waitFor(() => {
        const addQuickTaskButton = screen.getByText('Add Quick Task');
        fireEvent.click(addQuickTaskButton);
      }, { timeout: 5000 });

      await waitFor(() => {
        expect(screen.getByTestId('task-form')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});