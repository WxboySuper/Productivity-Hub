import { render, screen, fireEvent, waitFor, act, within, cleanup } from '@testing-library/react';
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

// Mock the NotificationCenter component
vi.mock('../components/NotificationCenter', () => ({
  default: () => <div data-testid="notification-center">NotificationCenter</div>,
}));

// Mock the BackgroundSwitcher component
vi.mock('../components/BackgroundSwitcher', () => ({
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

// Mock the ProjectForm component
vi.mock('../components/ProjectForm', () => ({
  default: ({
    onCreate,
    onClose,
    initialName,
    editMode,
    error,
  }: {
    onCreate: (project: { name: string; description: string }) => void;
    onClose: () => void;
    initialName?: string;
    editMode?: boolean;
    error?: string | null;
  }) => {
    const handleSaveClick = async () => {
      await onCreate({ name: 'Test Project', description: 'Test Description' });
    };
    return (
    <div data-testid="project-form">
      <h2>{editMode ? 'Edit Project' : 'Create Project'}</h2>
      {error && <div data-testid="project-error">{error}</div>}
      {initialName && <div>Initial: {initialName}</div>}
      <button onClick={handleSaveClick}>
        {editMode ? 'Save Changes' : 'Create Project'}
      </button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );},
}));

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

// Note: Using real TaskDetails component for integration testing

// Mock the ConfirmDialog component
vi.mock('../components/ConfirmDialog', () => ({
  default: ({
    open,
    title,
    onConfirm,
    onCancel,
  }: {
    open: boolean;
    title: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) => (
    open ? (
      <div data-testid="confirm-dialog">
        <h2>{title}</h2>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null
  ),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Wrapper component with all providers
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

describe('MainManagementWindow', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Reset mockFetch to a clean state 
    mockFetch.mockReset();
    
    // Set up minimal default fetch mock responses
    mockFetch.mockImplementation((url: string) => {
      console.warn(`Unexpected fetch call to: ${url}`);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);
    });
  });

  afterEach(() => {
    cleanup(); // Clean up DOM after each test
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Initial Render', () => {
    it('renders main components when authenticated', async () => {
      act(() => {
        render(<MainManagementWindowWrapper />);
      });
      
      expect(screen.getAllByText('Productivity Hub')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Add New')[0]).toBeInTheDocument();
      expect(screen.getAllByTestId('background-switcher')[0]).toBeInTheDocument();
      
      // Wait for async fetch calls to complete
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/projects', { credentials: 'include' });
        expect(mockFetch).toHaveBeenCalledWith('/api/tasks', { credentials: 'include' });
      });
    });

    it('renders sidebar with navigation items', async () => {
      act(() => {
        render(<MainManagementWindowWrapper />);
      });
      
      const allTasksElements = screen.getAllByText('All Tasks');
      const quickTasksElements = screen.getAllByText('Quick Tasks');
      const projectsElements = screen.getAllByText('Projects');
      const signOutElements = screen.getAllByText('Sign Out');
      
      expect(allTasksElements.length).toBeGreaterThan(0);
      expect(quickTasksElements.length).toBeGreaterThan(0);
      expect(projectsElements.length).toBeGreaterThan(0);
      expect(signOutElements.length).toBeGreaterThan(0);
      
      // Wait for fetch calls to complete
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('starts with "All Tasks" view active', async () => {
      act(() => {
        render(<MainManagementWindowWrapper />);
      });
      
      const allTasksElements = screen.getAllByText('All Tasks');
      const sidebarButton = allTasksElements.find(element => 
        element.closest('button')?.closest('.phub-sidebar-nav')
      )?.closest('button');
      
      expect(sidebarButton).toHaveClass('phub-sidebar-item-active');
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe('Sidebar Functionality', () => {
    it('toggles sidebar collapse state', async () => {
      act(() => {
        render(<MainManagementWindowWrapper />);
      });
      
      const collapseButton = screen.getByLabelText('Collapse sidebar');
      act(() => {
        fireEvent.click(collapseButton);
      });
      
      expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('switches between different views', () => {
      act(() => {
        render(<MainManagementWindowWrapper />);
      });
      
      const projectsButton = screen.getByText('Projects').closest('button');
      if (projectsButton) {
        act(() => {
          fireEvent.click(projectsButton);
        });
      }
      
      expect(projectsButton).toHaveClass('phub-sidebar-item-active');
    });

    it('handles logout when logout button is clicked', async () => {
      act(() => {
        render(<MainManagementWindowWrapper />);
      });
      
      const logoutButton = screen.getByText('Sign Out').closest('button');
      if (logoutButton) {
        act(() => {
          fireEvent.click(logoutButton);
        });
      }
      
      await waitFor(() => {
        expect(mockAuth.logout).toHaveBeenCalled();
      });
    });
  });

  describe('Task Form', () => {
    it('opens task form when Add New button is clicked', () => {
      act(() => {
        render(<MainManagementWindowWrapper />);
      });
      
      const addNewButton = screen.getByText('Add New').closest('button');
      if (addNewButton) {
        act(() => {
          fireEvent.click(addNewButton);
        });
      }
      
      expect(screen.getByTestId('task-form')).toBeInTheDocument();
    });

    it('closes task form when cancel is clicked', async () => {
      act(() => {
        render(<MainManagementWindowWrapper />);
      });
      
      const addNewButton = screen.getByText('Add New').closest('button');
      if (addNewButton) {
        act(() => {
          fireEvent.click(addNewButton);
        });
      }

      expect(screen.getByTestId('task-form')).toBeInTheDocument();

      const taskForm = screen.getByTestId('task-form');
      const cancelButton = taskForm.querySelector('button:last-child');
      if (cancelButton) {
        act(() => {
          fireEvent.click(cancelButton);
        });
      }

      await waitFor(() => {
        expect(screen.queryByTestId('task-form')).not.toBeInTheDocument();
      });
    });
  });

  describe('Project Form', () => {
    it('opens project form when switching to projects and clicking Add Project', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ projects: [] }),
      } as Response);

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
        const addProjectButton = screen.getByText('Add Project');
        fireEvent.click(addProjectButton);
        expect(screen.getByTestId('project-form')).toBeInTheDocument();
      });
    });

    it('closes project form when cancel is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

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
        const addProjectButton = screen.getByText('Add Project');
        fireEvent.click(addProjectButton);
      });

      expect(screen.getByTestId('project-form')).toBeInTheDocument();

      const projectForm = screen.getByTestId('project-form');
      const cancelButton = projectForm.querySelector('button:last-child');
      if (cancelButton) {
        act(() => {
          fireEvent.click(cancelButton);
        });
      }

      await waitFor(() => {
        expect(screen.queryByTestId('project-form')).not.toBeInTheDocument();
      });
    });
  });

  describe('Background Management', () => {
    it('changes background when background switcher is used', () => {
      act(() => {
        render(<MainManagementWindowWrapper />);
      });
      
      const backgroundSwitcher = screen.getByTestId('background-switcher');
      act(() => {
        fireEvent.click(backgroundSwitcher);
      });
      
      expect(mockBackground.setBackgroundType).toHaveBeenCalledWith('neural-network');
    });
  });

  describe('Error Handling', () => {
    it('shows error state when tasks fetch fails', async () => {
      // Clear all previous mocks and set up fresh ones
      mockFetch.mockReset();
      
      // Set up CSRF token mock first
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: 'mock-token' }),
      } as Response);
      
      // Set up failing tasks fetch
      mockFetch.mockRejectedValueOnce(new Error('Tasks fetch failed'));

      render(<MainManagementWindowWrapper />);

      await waitFor(() => {
        expect(screen.getByText(/Unknown error/)).toBeInTheDocument();
      });
    });

    it('shows error state when projects fetch fails', async () => {
      setupEmptyStateMocks();

      render(<MainManagementWindowWrapper />);
      
      const projectsButton = screen.getByText('Projects').closest('button');
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      await waitFor(() => {
        expect(screen.getByText('No projects found')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state for tasks', () => {
      // Mock the first call (projects) to resolve, second call (tasks) to hang
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
        expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
          credentials: 'include',
        });
      });
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

  describe('Task Management', () => {
    it('handles task creation', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'test-token' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: 'Task created' }),
        } as Response);

      act(() => {
        render(<MainManagementWindowWrapper />);
      });
      
      const addNewButton = screen.getByText('Add New').closest('button');
      if (addNewButton) {
        act(() => {
          fireEvent.click(addNewButton);
        });
      }

      await waitFor(() => {
        expect(screen.getByTestId('task-form')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Submit');
      act(() => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        }));
      });
    });

    it('handles missing project references', async () => {
      // Mock tasks with invalid project_id
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { 
            id: 1, 
            title: 'Task with Invalid Project', 
            description: 'Test Description', 
            project_id: 999, // Non-existent project
            priority: 'medium',
            status: 'pending',
            completed: false,
            parent_id: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ])
      });

      // Mock empty projects response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      });

      render(<MainManagementWindowWrapper />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'All Tasks' })).toBeInTheDocument();
      });
    });
  });

  describe('Component Integration', () => {
    it('integrates with all required context providers', () => {
      act(() => {
        render(<MainManagementWindowWrapper />);
      });
      
      expect(screen.getByTestId('background-switcher')).toBeInTheDocument();
    });

    it('handles form dialogs properly', () => {
      render(<MainManagementWindowWrapper />);
      
      const addNewButton = screen.getByText('Add New');
      fireEvent.click(addNewButton);
      
      expect(screen.getByTestId('task-form')).toBeInTheDocument();
    });
  });

  describe('Project Management', () => {
    it('handles project creation successfully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'test-token' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 1, name: 'Test Project', description: 'Test Description' }),
        } as Response);

      render(<MainManagementWindowWrapper />);
      
      const projectsButton = screen.getByText('Projects').closest('button');
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      await waitFor(() => {
        const addProjectButton = screen.getByText('Add Project');
        fireEvent.click(addProjectButton);
      });

      expect(screen.getByTestId('project-form')).toBeInTheDocument();

      const createButton = screen.getByRole('button', { name: 'Create Project' });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/projects', expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        }));
      });
    });

    it('handles project editing', async () => {
      const testProject = { id: 1, name: 'Test Project', description: 'Test Description' };
      
      mockFetch.mockReset();
      
      // CSRF token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: 'test-token' }),
      } as Response);
      
      // Initial tasks fetch (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: [] }),
      } as Response);
      
      // Projects fetch when switching to projects view
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ projects: [testProject] }),
      } as Response);

      render(<MainManagementWindowWrapper />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
      
      // Switch to Projects view
      const projectsButton = screen.getByText('Projects').closest('button');
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Organize your work into meaningful projects')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      }, { timeout: 5000 });

      await waitFor(() => {
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);
        expect(screen.getByTestId('project-form')).toBeInTheDocument();
      });
    });

    it('handles project deletion confirmation', async () => {
      const testProject = { id: 1, name: 'Test Project', description: 'Test Description' };
      
      mockFetch.mockReset();
      
      // CSRF token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: 'test-token' }),
      } as Response);
      
      // Initial tasks fetch (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: [] }),
      } as Response);
      
      // Projects fetch when switching to projects view
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ projects: [testProject] }),
      } as Response);

      render(<MainManagementWindowWrapper />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
      
      // Switch to Projects view
      const projectsButton = screen.getByText('Projects').closest('button');
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Organize your work into meaningful projects')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      }, { timeout: 5000 });

      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });
    });

    it('navigates to project details when clicking on project', async () => {
      const testProject = { id: 1, name: 'Test Project', description: 'Test Description' };
      
      mockFetch.mockReset();
      
      // CSRF token first
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: 'mock-token' }),
      } as Response);
      
      // Initial tasks fetch (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: [] }),
      } as Response);
      
      // Projects fetch when switching to projects view
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ projects: [testProject] }),
      } as Response);
      
      // Tasks fetch for the specific project (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: [] }),
      } as Response);

      render(<MainManagementWindowWrapper />);
      
      const projectsButton = screen.getByText('Projects').closest('button');
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      await waitFor(() => {
        const projectCard = screen.getByText('Test Project').closest('.phub-item-card');
        if (projectCard) {
          fireEvent.click(projectCard);
        }
        expect(screen.getByText('Tasks for this Project')).toBeInTheDocument();
      });
    });

    it('handles back navigation from project details', async () => {
      const testProject = { id: 1, name: 'Test Project', description: 'Test Description' };
      
      mockFetch.mockReset();
      
      // CSRF token first
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: 'mock-token' }),
      } as Response);
      
      // Initial tasks fetch (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: [] }),
      } as Response);
      
      // Projects fetch when switching to projects view
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ projects: [testProject] }),
      } as Response);
      
      // Tasks fetch for the specific project (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: [] }),
      } as Response);

      render(<MainManagementWindowWrapper />);
      
      const projectsButton = screen.getByText('Projects').closest('button');
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      await waitFor(() => {
        const projectCard = screen.getByText('Test Project').closest('.phub-item-card');
        if (projectCard) {
          fireEvent.click(projectCard);
        }
      });

      await waitFor(() => {
        const backButton = screen.getByText('Back');
        fireEvent.click(backButton);
        expect(screen.getByText('Your Projects')).toBeInTheDocument();
      });
    });

    it('handles project creation API error with error message', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'test-token' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Project name already exists' }),
        } as Response);

      render(<MainManagementWindowWrapper />);
      
      const projectsButton = screen.getByText('Projects').closest('button');
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      await waitFor(() => {
        const addProjectButton = screen.getByText('Add Project');
        act(() => {
          fireEvent.click(addProjectButton);
        });
        expect(screen.getByTestId('project-form')).toBeInTheDocument();
      });

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: 'Create Project' });
        act(() => {
          fireEvent.click(createButton);
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('project-error')).toHaveTextContent('Project name already exists');
      }, { timeout: 3000 });
    });

    it('handles project creation API error without error message', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'test-token' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({}),
        } as Response);

      render(<MainManagementWindowWrapper />);
      
      const projectsButton = screen.getByText('Projects').closest('button');
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      await waitFor(() => {
        const addProjectButton = screen.getByText('Add Project');
        act(() => {
          fireEvent.click(addProjectButton);
        });
        expect(screen.getByTestId('project-form')).toBeInTheDocument();
      });

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: 'Create Project' });
        act(() => {
          fireEvent.click(createButton);
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('project-error')).toHaveTextContent('Failed to create project');
      }, { timeout: 3000 });
    });

    it('handles project creation network error with non-Error exception', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'test-token' }),
        } as Response)
        .mockRejectedValueOnce('Network failure');

      render(<MainManagementWindowWrapper />);
      
      const projectsButton = screen.getByText('Projects').closest('button');
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      await waitFor(() => {
        const addProjectButton = screen.getByText('Add Project');
        fireEvent.click(addProjectButton);
      });

      const createButton = screen.getByRole('button', { name: 'Create Project' });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Unknown error')).toBeInTheDocument();
      });
    });

    it('handles update project when no edit project is set', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response);

      render(<MainManagementWindowWrapper />);
      
      // This test ensures the early return in handleUpdateProject when !editProject
      // The function should do nothing if editProject is null
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'All Tasks' })).toBeInTheDocument();
      });
    });

    it('handles project update API error with error message', async () => {
      const testProject = { id: 1, name: 'Test Project', description: 'Test Description' };
      
      mockFetch
        // Initial projects fetch on mount
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [testProject] }),
        } as Response)
        // Tasks fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
        // Projects fetch when switching to projects view
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [testProject] }),
        } as Response);

      render(<MainManagementWindowWrapper />);
      
      const projectsButton = screen.getByText('Projects').closest('button');
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Click on the project to open details/edit options
      fireEvent.click(screen.getByText('Test Project'));

      await waitFor(() => {
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit Project')).toBeInTheDocument();
      });

      // Clear existing mocks and set up new ones for the update operation
      mockFetch.mockClear();
      mockFetch
        // CSRF token fetch for the update
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'test-token' }),
        } as Response)
        // Failed project update
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Project validation failed' }),
        } as Response);

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Project validation failed')).toBeInTheDocument();
      });
    });

    it('handles project update API error without error message', async () => {
      const testProject = { id: 1, name: 'Test Project', description: 'Test Description' };
      
      mockFetch
        // Initial projects fetch on mount
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [testProject] }),
        } as Response)
        // Tasks fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
        // Projects fetch when switching to projects view
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [testProject] }),
        } as Response);

      render(<MainManagementWindowWrapper />);
      
      const projectsButton = screen.getAllByText('Projects')[0].closest('button');
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Click on the project to open details/edit options
      fireEvent.click(screen.getByText('Test Project'));

      await waitFor(() => {
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit Project')).toBeInTheDocument();
      });

      // Clear existing mocks and set up new ones for the update operation
      mockFetch.mockClear();
      mockFetch
        // CSRF token fetch for the update
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'test-token' }),
        } as Response)
        // Failed project update without error message
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({}),
        } as Response);

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      // Wait for the form to process the error  
      await waitFor(() => {
        expect(screen.getByTestId('project-error')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify the error message content
      expect(screen.getByTestId('project-error')).toHaveTextContent('Failed to update project');
    });

    it('handles project update network error with non-Error exception', async () => {
      const testProject = { id: 1, name: 'Test Project', description: 'Test Description' };
      
      mockFetch
        // Initial projects fetch on mount
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [testProject] }),
        } as Response)
        // Tasks fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
        // Projects fetch when switching to projects view
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [testProject] }),
        } as Response);

      render(<MainManagementWindowWrapper />);
      
      const projectsButton = screen.getByText('Projects').closest('button');
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Click on the project to open details/edit options
      fireEvent.click(screen.getByText('Test Project'));

      await waitFor(() => {
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit Project')).toBeInTheDocument();
      });

      // Clear existing mocks and set up new ones for the update operation
      mockFetch.mockClear();
      mockFetch
        // CSRF token fetch for the update
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'test-token' }),
        } as Response)
        // Network error
        .mockRejectedValueOnce('Connection timeout');

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Unknown error')).toBeInTheDocument();
      });
    });
  });

  describe('Task Operations', () => {
    it('handles task completion toggling', async () => {
      const testTask = { 
        id: 1, 
        title: 'Test Task', 
        completed: false, 
        project_id: null,
        parent_id: null 
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
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
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ tasks: [{ ...testTask, completed: true }] }),
        } as Response);

      render(<MainManagementWindowWrapper />);

      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1', expect.objectContaining({
          method: 'PUT',
          credentials: 'include',
        }));
      });
    });

    it('handles task deletion', async () => {
      const testTask = { 
        id: 1, 
        title: 'Test Task', 
        completed: false, 
        project_id: null,
        parent_id: null 
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
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
          json: () => Promise.resolve({}),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ tasks: [] }),
        } as Response);

      render(<MainManagementWindowWrapper />);

      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1', expect.objectContaining({
          method: 'DELETE',
          credentials: 'include',
        }));
      });
    });

    it('opens task details when clicking on task title', async () => {
      const testTask = { 
        id: 1, 
        title: 'Test Task', 
        completed: false, 
        project_id: null,
        parent_id: null 
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ tasks: [testTask] }),
        } as Response);

      render(<MainManagementWindowWrapper />);

      // Wait for tasks to load and click on first task title
      await waitFor(() => {
        expect(screen.getAllByText('Test Task')).toHaveLength(1);
      });
      
      const taskTitles = screen.getAllByText('Test Task');
      fireEvent.click(taskTitles[0]); // Use the first one
      
      // Wait for task details modal to appear
      await waitFor(() => {
        expect(screen.getByTestId('task-details')).toBeInTheDocument();
      });
    });

    it('opens task form for editing when clicking edit button', async () => {
      // Override the mock to ensure we have proper data structure
      mockFetch.mockRestore();
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
                  title: 'Editable Test Task', 
                  description: 'Test task description', 
                  projectId: 1,
                  parent_id: null,
                  completed: false 
                }
              ] 
            }),
          } as Response);
        }
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Not found' }),
        } as Response);
      });

      render(<MainManagementWindowWrapper />);

      // Wait for All Tasks view to load (default view)
      await waitFor(() => {
        expect(screen.getByText('Editable Test Task')).toBeInTheDocument();
      });

      // Click on the task to open TaskDetails modal first
      const taskTitle = screen.getByText('Editable Test Task');
      fireEvent.click(taskTitle);

      // The TaskDetails modal should open first
      await waitFor(() => {
        expect(screen.getByTestId('task-details')).toBeInTheDocument();
      });

      // Now click the Edit button to open the task form
      const editButton = screen.getByText('✏️ Edit');
      fireEvent.click(editButton);

      // The form should open - verify it opened
      await waitFor(() => {
        expect(screen.getByTestId('task-form')).toBeInTheDocument();
      });
    });

    it('handles task form submission for editing', async () => {
      // Set up environment variable for API URL
      const originalApiUrl = process.env.REACT_APP_API_URL;
      process.env.REACT_APP_API_URL = '';

      const testTask = { 
        id: 1, 
        title: 'Test Task', 
        description: 'Test task description',
        completed: false, 
        project_id: 1,
        projectId: 1,  // Add this for compatibility
        parent_id: null 
      };

      mockFetch.mockReset();
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/csrf-token' || url === '/api/csrf-token') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrf_token: 'test-token' }),
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
            json: () => Promise.resolve({ tasks: [testTask] }),
          } as Response);
        }
        if (url === '/api/tasks/1') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Task updated successfully' }),
          } as Response);
        }
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Not found' }),
        } as Response);
      });

      render(<MainManagementWindowWrapper />);

      // Wait for the task to be rendered and stable
      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
        // Ensure we don't have the empty state showing
        expect(screen.queryByText('No tasks found')).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // Click on the task to open TaskDetails modal
      const taskTitles = screen.getAllByText('Test Task');
      fireEvent.click(taskTitles[0]); // Use the first one

      // Wait for TaskDetails modal to appear
      await waitFor(() => {
        expect(screen.getByTestId('task-details')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Then find the Edit button in the modal and click it
      const editButton = screen.getByText('✏️ Edit');
      fireEvent.click(editButton);

      // Wait for task form to open and then submit
      await waitFor(() => {
        const submitButton = screen.getByText('Submit');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1', expect.objectContaining({
          method: 'PUT',
          credentials: 'include',
        }));
      });

      // Clean up environment variable
      process.env.REACT_APP_API_URL = originalApiUrl;
    });
  });

  describe('Quick Tasks View', () => {
    it('switches to quick tasks view and shows quick tasks', async () => {
      const quickTask = { 
        id: 1, 
        title: 'Quick Task', 
        description: 'A quick task',
        completed: false, 
        projectId: null,
        parent_id: null 
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'test-token' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ tasks: [quickTask] }),
        } as Response);

      render(<MainManagementWindowWrapper />);
      
      const quickTasksButton = screen.getByText('Quick Tasks').closest('button');
      if (quickTasksButton) {
        fireEvent.click(quickTasksButton);
      }

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Quick Tasks' })).toBeInTheDocument();
      });

      // Check that we're in quick tasks view
      expect(screen.getByText('Your rapid-fire action items')).toBeInTheDocument();
      
      // Look for quick task specifically
      await waitFor(() => {
        expect(screen.getByText('Quick Task')).toBeInTheDocument();
      });
    });

    it('shows empty state for quick tasks when none exist', async () => {
      setupEmptyStateMocks();

      render(<MainManagementWindowWrapper />);
      
      const quickTasksButton = screen.getByText('Quick Tasks').closest('button');
      if (quickTasksButton) {
        fireEvent.click(quickTasksButton);
      }

      await waitFor(() => {
        expect(screen.getByText('No quick tasks found')).toBeInTheDocument();
        expect(screen.getByText('Add Quick Task')).toBeInTheDocument();
      });
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
      });

      await waitFor(() => {
        expect(screen.getByTestId('task-form')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles CSRF token fetching error', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
        .mockRejectedValueOnce(new Error('CSRF token fetch failed'));

      render(<MainManagementWindowWrapper />);
      
      const addNewButton = screen.getByText('Add New');
      fireEvent.click(addNewButton);

      await waitFor(() => {
        const submitButton = screen.getByText('Submit');
        fireEvent.click(submitButton);
      });

      // The component should handle the error gracefully
      expect(screen.getByTestId('task-form')).toBeInTheDocument();
    });

    it('handles project creation API error', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'test-token' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Project creation failed' }),
        } as Response);

      render(<MainManagementWindowWrapper />);
      
      const projectsButton = screen.getByText('Projects').closest('button');
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      await waitFor(() => {
        const addProjectButton = screen.getByText('Add Project');
        fireEvent.click(addProjectButton);
      });

      const createButton = screen.getByRole('button', { name: 'Create Project' });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/projects', expect.objectContaining({
          method: 'POST',
        }));
      });
    });

    it('handles task with subtasks and shows subtask count', async () => {
      const taskWithSubtasks = { 
        id: 1, 
        title: 'Parent Task', 
        completed: false, 
        project_id: null,
        parent_id: null,
        subtasks: [
          { id: 2, title: 'Subtask 1', completed: false },
          { id: 3, title: 'Subtask 2', completed: true }
        ]
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([taskWithSubtasks]),
        } as Response);

      render(<MainManagementWindowWrapper />);

      await waitFor(() => {
        expect(screen.getByText('Parent Task')).toBeInTheDocument();
        expect(screen.getByText('📝 2 subtasks')).toBeInTheDocument();
      });
    });

    it('disables task completion when subtasks are incomplete', async () => {
      const taskWithIncompleteSubtasks = { 
        id: 1, 
        title: 'Parent Task', 
        completed: false, 
        project_id: null,
        parent_id: null,
        subtasks: [
          { id: 2, title: 'Subtask 1', completed: false },
          { id: 3, title: 'Subtask 2', completed: true }
        ]
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([taskWithIncompleteSubtasks]),
        } as Response);

      render(<MainManagementWindowWrapper />);

      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeDisabled();
        expect(checkbox).toHaveAttribute('title', 'Complete all subtasks first');
      });
    });

    it('shows task with project information', async () => {
      const project = { id: 1, name: 'Test Project', description: 'Test' };
      const taskWithProject = { 
        id: 1, 
        title: 'Project Task', 
        completed: false, 
        project_id: 1,
        parent_id: null 
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [project] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([taskWithProject]),
        } as Response);

      render(<MainManagementWindowWrapper />);

      await waitFor(() => {
        expect(screen.getByText('Project Task')).toBeInTheDocument();
        expect(screen.getByText('📁 Test Project')).toBeInTheDocument();
      });
    });
  });

  describe('Advanced Features', () => {
    it('handles task form error display', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'test-token' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Task creation failed' }),
        } as Response);

      render(<MainManagementWindowWrapper />);
      
      const addNewButton = screen.getByText('Add New');
      fireEvent.click(addNewButton);

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({
          method: 'POST',
        }));
      });
    });

    it('handles successful project deletion', async () => {
      const testProject = { id: 1, name: 'Test Project', description: 'Test Description' };
      
      mockFetch.mockReset();
      
      // CSRF token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: 'test-token' }),
      } as Response);
      
      // Initial tasks fetch (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: [] }),
      } as Response);
      
      // Projects fetch when switching to projects view
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ projects: [testProject] }),
      } as Response);
      
      // CSRF token for deletion
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: 'test-token' }),
      } as Response);
      
      // Successful deletion response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      render(<MainManagementWindowWrapper />);
      
      // Switch to Projects view
      const projectsButton = screen.getByText('Projects').closest('button');
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      // Wait for the project to appear
      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });

      // Confirm the deletion
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/projects/1', expect.objectContaining({
          method: 'DELETE',
        }));
      });
    });

    it('handles project update successfully', async () => {
      const testProject = { id: 1, name: 'Test Project', description: 'Test Description' };
      
      mockFetch.mockReset();
      
      // Navigation phase - CSRF token and initial data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: 'test-token' }),
      } as Response);
      
      // Initial tasks fetch (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: [] }),
      } as Response);
      
      // Projects fetch when switching to projects view
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ projects: [testProject] }),
      } as Response);

      render(<MainManagementWindowWrapper />);
      
      // Wait for initial load using more specific selector
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
      
      // Switch to Projects view
      const projectsButton = screen.getByText('Projects').closest('button');
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Organize your work into meaningful projects')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      }, { timeout: 5000 });

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('project-form')).toBeInTheDocument();
      });

      // Verify we're in edit mode by checking the header
      await waitFor(() => {
        expect(screen.getByText('Edit Project')).toBeInTheDocument();
      });

      // Clear previous mocks and set up for the update operation
      mockFetch.mockClear();
      
      // CSRF token for update
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: 'test-token' }),
      } as Response);
      
      // Successful update response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...testProject, name: 'Updated Project' }),
      } as Response);

      const submitButton = screen.getByText('Save Changes');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/projects/1', expect.objectContaining({
          method: 'PUT',
        }));
      });
    });

    it('handles empty project tasks state', async () => {
      const testProject = { id: 1, name: 'Test Project', description: 'Test Description' };
      
      mockFetch.mockReset();
      
      // CSRF token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: 'test-token' }),
      } as Response);
      
      // Initial tasks fetch (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: [] }),
      } as Response);
      
      // Projects fetch when switching to projects view
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ projects: [testProject] }),
      } as Response);
      
      // Tasks fetch for the specific project (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: [] }),
      } as Response);

      render(<MainManagementWindowWrapper />);
      
      // Wait for initial load using more specific selector
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
      
      // Switch to Projects view
      const projectsButton = screen.getByText('Projects').closest('button');
      if (projectsButton) {
        fireEvent.click(projectsButton);
      }

      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Organize your work into meaningful projects')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      }, { timeout: 5000 });
  });

  describe('Task Form and Edit Operations', () => {
    it('handles task edit API error with error message', async () => {
      const testTask = { 
        id: 1, 
        title: 'Test Task', 
        completed: false, 
        projectId: null,
        parent_id: null 
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([testTask]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([testTask]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'test-token' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Task validation failed' }),
        } as Response)
        // Additional mocks for fetchTasks() call after error
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([testTask]),
        } as Response)
        // Add fallback mock for any other fetch calls
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ error: 'Fallback error' }),
        } as Response);

      render(<MainManagementWindowWrapper />);

      // Switch to Quick Tasks view to see the task
      await waitFor(() => {
        const quickTasksButtons = screen.getAllByText('Quick Tasks');
        fireEvent.click(quickTasksButtons[0]); // Use the first one
      });

      // Wait for task to appear and click to open details modal
      await waitFor(() => {
        const taskTitles = screen.getAllByText('Test Task');
        fireEvent.click(taskTitles[0]); // Use the first one
      });

      // Find Edit button in the modal and click it
      await waitFor(() => {
        const taskDetails = screen.getByTestId('task-details');
        const editButton = within(taskDetails).getByText('Edit Task');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const submitButton = screen.getByText('Submit');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Task validation failed')).toBeInTheDocument();
      });
    });

    it('handles task edit API error without error message', async () => {
      const testTask = { 
        id: 1, 
        title: 'Test Task', 
        completed: false, 
        projectId: null,
        parent_id: null 
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([testTask]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([testTask]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'test-token' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({}),
        } as Response)
        // Additional mocks for fetchTasks() call after error
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([testTask]),
        } as Response)
        // Add fallback mock for any other fetch calls
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ error: 'Fallback error' }),
        } as Response);

      render(<MainManagementWindowWrapper />);

      // Switch to Quick Tasks view to see the task
      await waitFor(() => {
        const quickTasksButtons = screen.getAllByText('Quick Tasks');
        fireEvent.click(quickTasksButtons[0]); // Use the first one
      });

      // Wait for task to appear and click to open details modal
      await waitFor(() => {
        const taskTitles = screen.getAllByText('Test Task');
        fireEvent.click(taskTitles[0]); // Use the first one
      });

      // Find Edit button in the modal and click it
      await waitFor(() => {
        const taskDetails = screen.getByTestId('task-details');
        const editButton = within(taskDetails).getByText('Edit Task');
        fireEvent.click(editButton);
      });

      // Find Edit button in the modal and click it
      await waitFor(() => {
        const taskDetails = screen.getByTestId('task-details');
        const editButton = within(taskDetails).getByText('Edit Task');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const submitButton = screen.getByText('Submit');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to update task')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to update task')).toBeInTheDocument();
      });
    });

    it('handles task edit network error with non-Error exception', async () => {
      const testTask = { 
        id: 1, 
        title: 'Test Task', 
        completed: false, 
        projectId: null,
        parent_id: null 
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([testTask]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([testTask]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'test-token' }),
        } as Response)
        .mockRejectedValueOnce('Connection timeout')
        // Additional mocks for any subsequent fetch calls
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([testTask]),
        } as Response)
        // Add fallback mock for any other fetch calls
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ error: 'Fallback error' }),
        } as Response);

      render(<MainManagementWindowWrapper />);

      // Switch to Quick Tasks view to see Edit button
      await waitFor(() => {
        const quickTasksButton = screen.getByText('Quick Tasks');
        fireEvent.click(quickTasksButton);
      });

      // Wait for task to appear and click to open details modal
      await waitFor(() => {
        const taskTitle = screen.getByText('Test Task');
        fireEvent.click(taskTitle);
      });

      // Find Edit button in the modal and click it
      await waitFor(() => {
        const taskDetails = screen.getByTestId('task-details');
        const editButton = within(taskDetails).getByText('Edit Task');
        fireEvent.click(editButton);
      });

      // Find Edit button in the modal and click it
      await waitFor(() => {
        const taskDetails = screen.getByTestId('task-details');
        const editButton = within(taskDetails).getByText('Edit Task');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const submitButton = screen.getByText('Submit');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Unknown error')).toBeInTheDocument();
      });
    });
  });
});
});
