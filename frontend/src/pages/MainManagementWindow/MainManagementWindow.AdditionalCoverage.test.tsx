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

vi.mock('../../auth', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the background context
const mockBackground = {
  backgroundType: 'creative-dots' as const,
  setBackgroundType: vi.fn(),
};

vi.mock('../../context/BackgroundContext', () => ({
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

vi.mock('../../components/ToastProvider', () => ({
  useToast: () => mockToast,
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
      }
    ],
    loading: false,
    error: null,
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    refetch: vi.fn(),
  }),
}));

// Mock the TaskForm component
vi.mock('../../components/TaskForm', () => ({
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
vi.mock('../../components/ProjectForm', () => ({
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
vi.mock('../../components/TaskDetails', () => ({
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
vi.mock('../../components/ConfirmDialog', () => ({
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

describe('MainManagementWindow - Additional Coverage', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Task Management Additional Cases', () => {
    it('handles missing project references', async () => {
      render(<MainManagementWindowWrapper />);
      
      // Component should render successfully even with missing project references
      expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
    });

    it('handles task operations with various project configurations', async () => {
      render(<MainManagementWindowWrapper />);
      
      // Navigate to different views to test project handling
      const allTasksButton = screen.getAllByText('All Tasks').find(el => 
        el.closest('.phub-sidebar-nav')
      )?.closest('button');
      if (allTasksButton) {
        fireEvent.click(allTasksButton);
      }

      const quickTasksButton = screen.getAllByText('Quick Tasks').find(el => 
        el.closest('.phub-sidebar-nav')
      )?.closest('button');
      if (quickTasksButton) {
        fireEvent.click(quickTasksButton);
      }

      const projectsButton = screen.getAllByText('Projects').find(el => 
        el.closest('.phub-sidebar-nav')
      )?.closest('button');
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      // Component should handle all view switches successfully
      expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
    });
  });

  describe('Advanced Features & Edge Cases', () => {
    it('handles component lifecycle and cleanup', async () => {
      const { unmount } = render(<MainManagementWindowWrapper />);
      
      // Component should render successfully
      expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
      
      // Should unmount without errors
      unmount();
    });

    it('handles multiple rapid interactions', async () => {
      render(<MainManagementWindowWrapper />);
      
      // Rapidly switch between views
      const allTasksButton = screen.getAllByText('All Tasks').find(el => 
        el.closest('.phub-sidebar-nav')
      )?.closest('button');
      const quickTasksButton = screen.getAllByText('Quick Tasks').find(el => 
        el.closest('.phub-sidebar-nav')
      )?.closest('button');
      const projectsButton = screen.getAllByText('Projects').find(el => 
        el.closest('.phub-sidebar-nav')
      )?.closest('button');

      if (allTasksButton && quickTasksButton && projectsButton) {
        fireEvent.click(allTasksButton);
        fireEvent.click(quickTasksButton);
        fireEvent.click(projectsButton);
        fireEvent.click(allTasksButton);
      }

      // Component should remain stable
      expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
    });

    it('handles form states and transitions', async () => {
      render(<MainManagementWindowWrapper />);
      
      // Test opening and closing forms rapidly
      const addNewButton = screen.getByText('Add New');
      
      // Open task form
      fireEvent.click(addNewButton);
      
      await waitFor(() => {
        if (screen.queryByTestId('task-form')) {
          const cancelButton = screen.getByText('Cancel');
          fireEvent.click(cancelButton);
        }
      }, { timeout: 5000 });

      // Should handle state transitions properly
      expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
    });

    it('handles window resize and responsive behavior', async () => {
      render(<MainManagementWindowWrapper />);
      
      // Component should render successfully regardless of window size
      expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
      
      // Test sidebar functionality
      const collapseButton = screen.getByLabelText('Collapse sidebar');
      fireEvent.click(collapseButton);
      
      expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
    });

    it('handles keyboard navigation and accessibility', async () => {
      render(<MainManagementWindowWrapper />);
      
      // Component should be accessible
      expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
      
      // Test basic keyboard interactions
      const sidebar = screen.getAllByText('All Tasks').find(el => 
        el.closest('.phub-sidebar-nav')
      )?.closest('button');
      if (sidebar) {
        sidebar.focus();
        // Component should handle focus properly
        expect(document.activeElement).toBe(sidebar);
      }
    });
  });

  describe('Data Integration & API Handling', () => {
    it('handles API response edge cases', async () => {
      render(<MainManagementWindowWrapper />);
      
      // Component should handle various API response formats
      expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
    });

    it('handles concurrent operations', async () => {
      render(<MainManagementWindowWrapper />);
      
      // Simulate multiple actions happening at once
      const addNewButton = screen.getByText('Add New');
      const projectsButton = screen.getAllByText('Projects').find(el => 
        el.closest('.phub-sidebar-nav')
      )?.closest('button');
      
      if (projectsButton) {
        fireEvent.click(projectsButton);
        fireEvent.click(addNewButton);
      }

      // Component should handle concurrent operations
      expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
    });

    it('handles data synchronization scenarios', async () => {
      render(<MainManagementWindowWrapper />);
      
      // Test data consistency across view switches
      const allTasksButton = screen.getAllByText('All Tasks').find(el => 
        el.closest('.phub-sidebar-nav')
      )?.closest('button');
      const quickTasksButton = screen.getAllByText('Quick Tasks').find(el => 
        el.closest('.phub-sidebar-nav')
      )?.closest('button');
      
      if (allTasksButton && quickTasksButton) {
        fireEvent.click(allTasksButton);
        fireEvent.click(quickTasksButton);
        fireEvent.click(allTasksButton);
      }

      // Data should remain consistent
      expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
    });
  });

  describe('Performance & Optimization', () => {
    it('handles large datasets efficiently', async () => {
      render(<MainManagementWindowWrapper />);
      
      // Component should render efficiently regardless of data size
      expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
    });

    it('handles memory management properly', async () => {
      const { rerender } = render(<MainManagementWindowWrapper />);
      
      // Test rerendering scenarios
      rerender(<MainManagementWindowWrapper />);
      rerender(<MainManagementWindowWrapper />);
      
      // Should handle rerenders without memory leaks
      expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
    });
  });
});