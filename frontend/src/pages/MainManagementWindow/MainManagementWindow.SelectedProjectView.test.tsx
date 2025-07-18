import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import MainManagementWindow from '../MainManagementWindow';
import { AuthProvider } from '../../auth';
import { BackgroundProvider } from '../../context/BackgroundContext';
import { ToastProvider } from '../../components/ToastProvider';
import {
  setupBeforeEach,
  mockAuth,
  mockBackgroundContext,
  mockToastContext,
  mockNavigate,
  mockProjectData,
  mockTaskData,
} from '../__tests__/testUtils';

// Setup global fetch mock
const originalFetch = global.fetch;

// Extended mock data for project tasks
const mockTaskDataWithProject = [
  ...mockTaskData,
  {
    id: 3,
    title: 'Another Project Task',
    description: 'Another task for testing',
    projectId: 1,
    parent_id: null,
    completed: false,
    subtasks: [
      { id: 4, title: 'Subtask 1', completed: false },
      { id: 5, title: 'Subtask 2', completed: true }
    ]
  }
];

beforeEach(() => {
  setupBeforeEach();
  
  global.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
    const method = options?.method || 'GET';
    
    if (url === '/api/csrf-token') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ csrf_token: 'mock-csrf-token' }),
      } as Response);
    }
    
    if (url === '/api/projects') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ projects: mockProjectData }),
      } as Response);
    }
    
    if (url === '/api/tasks') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ tasks: mockTaskDataWithProject }),
      } as Response);
    }
    
    if (url.match(/\/api\/tasks\/\d+/) && method === 'PUT') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);
    }
    
    if (url.match(/\/api\/tasks\/\d+/) && method === 'DELETE') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);
    }
    
    return Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: 'Not found' }),
    } as Response);
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  global.fetch = originalFetch;
});

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

// Mock project-related hooks
vi.mock('../../hooks/useProjects', () => ({
  useProjects: () => ({
    projects: mockProjectData,
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

const MainManagementWindowWrapper = ({ children }: { children?: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <BackgroundProvider>
        <ToastProvider>
          {children || <MainManagementWindow />}
        </ToastProvider>
      </BackgroundProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('MainManagementWindow - Selected Project View', () => {
  describe('Project Selection and Navigation', () => {
    it('displays project list when no project is selected', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      // Navigate to projects view
      await act(async () => {
        const projectsButton = screen.getByText('Projects');
        fireEvent.click(projectsButton);
      });

      // Should show project list view
      await waitFor(() => {
        expect(screen.getByText('Your Projects')).toBeInTheDocument();
        expect(screen.getByText('Organize your work into meaningful projects')).toBeInTheDocument();
        expect(screen.getByText('Test Project')).toBeInTheDocument();
        expect(screen.getByText('Add Project')).toBeInTheDocument();
      });
    });

    it('displays selected project details and tasks', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      // Navigate to projects view
      await act(async () => {
        const projectsButton = screen.getByText('Projects');
        fireEvent.click(projectsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Click on project to select it
      await act(async () => {
        const projectCard = screen.getByText('Test Project');
        fireEvent.click(projectCard);
      });

      // Should show selected project view
      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
        expect(screen.getByText('Tasks for this Project')).toBeInTheDocument();
        expect(screen.getByText('Manage project-specific tasks and deliverables')).toBeInTheDocument();
      });

      // Should show project action buttons
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(editButtons.length).toBeGreaterThan(0);
      expect(deleteButtons.length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('shows project description when available', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await act(async () => {
        const projectsButton = screen.getByText('Projects');
        fireEvent.click(projectsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      await act(async () => {
        const projectCard = screen.getByText('Test Project');
        fireEvent.click(projectCard);
      });

      // Should show project description if it exists
      await waitFor(() => {
        expect(screen.getByText('Test project description')).toBeInTheDocument();
      });
    });

    it('handles back navigation from selected project', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      // Navigate to projects and select one
      await act(async () => {
        const projectsButton = screen.getByText('Projects');
        fireEvent.click(projectsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      await act(async () => {
        const projectCard = screen.getByText('Test Project');
        fireEvent.click(projectCard);
      });

      await waitFor(() => {
        expect(screen.getByText('Tasks for this Project')).toBeInTheDocument();
      });

      // Click back button
      await act(async () => {
        const backButton = screen.getByRole('button', { name: /back/i });
        fireEvent.click(backButton);
      });

      // Should return to project list view
      await waitFor(() => {
        expect(screen.getByText('Your Projects')).toBeInTheDocument();
        expect(screen.queryByText('Tasks for this Project')).not.toBeInTheDocument();
      });
    });
  });

  describe('Project Tasks Display', () => {
    it('shows empty state when project has no tasks', async () => {
      // Mock empty tasks for the project
      global.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/csrf-token') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrf_token: 'mock-csrf-token' }),
          } as Response);
        }
        
        if (url === '/api/projects') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: mockProjectData }),
          } as Response);
        }
        
        if (url === '/api/tasks') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ tasks: [] }), // No tasks
          } as Response);
        }
        
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Not found' }),
        } as Response);
      });

      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await act(async () => {
        const projectsButton = screen.getByText('Projects');
        fireEvent.click(projectsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      await act(async () => {
        const projectCard = screen.getByText('Test Project');
        fireEvent.click(projectCard);
      });

      // Should show empty state for project tasks
      await waitFor(() => {
        expect(screen.getByText('No tasks for this project')).toBeInTheDocument();
        expect(screen.getByText('Add a task to start making progress on this project!')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
      });
    });

    it('displays project tasks with subtask information', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await act(async () => {
        const projectsButton = screen.getByText('Projects');
        fireEvent.click(projectsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      await act(async () => {
        const projectCard = screen.getByText('Test Project');
        fireEvent.click(projectCard);
      });

      // Should show project tasks
      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
        expect(screen.getByText('Another Project Task')).toBeInTheDocument();
      });

      // Should show subtask count for tasks that have subtasks
      expect(screen.getByText('📝 2 subtasks')).toBeInTheDocument();
    });

    it('handles task interactions in project view', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await act(async () => {
        const projectsButton = screen.getByText('Projects');
        fireEvent.click(projectsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      await act(async () => {
        const projectCard = screen.getByText('Test Project');
        fireEvent.click(projectCard);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      });

      // Test task checkbox toggle
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);

      await act(async () => {
        fireEvent.click(checkboxes[0]);
      });

      // Should trigger task toggle API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringMatching(/\/api\/tasks\/\d+/),
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('completed'),
          })
        );
      });
    });

    it('handles task title click to open details', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await act(async () => {
        const projectsButton = screen.getByText('Projects');
        fireEvent.click(projectsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      await act(async () => {
        const projectCard = screen.getByText('Test Project');
        fireEvent.click(projectCard);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      });

      // Click on task title
      await act(async () => {
        const taskTitle = screen.getByText('Test Task');
        fireEvent.click(taskTitle);
      });

      // Should open task details modal
      await waitFor(() => {
        expect(screen.getByTestId('task-details-modal')).toBeInTheDocument();
      });
    });

    it('handles task edit in project view', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await act(async () => {
        const projectsButton = screen.getByText('Projects');
        fireEvent.click(projectsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      await act(async () => {
        const projectCard = screen.getByText('Test Project');
        fireEvent.click(projectCard);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      });

      // Find and click edit button for project task
      const editButtons = screen.getAllByText('Edit');
      expect(editButtons.length).toBeGreaterThan(0);

      await act(async () => {
        fireEvent.click(editButtons[editButtons.length - 1]); // Click the last edit button (for task, not project)
      });

      // Should open task edit form
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
      });
    });

    it('handles task delete in project view', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await act(async () => {
        const projectsButton = screen.getByText('Projects');
        fireEvent.click(projectsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      await act(async () => {
        const projectCard = screen.getByText('Test Project');
        fireEvent.click(projectCard);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      });

      // Find and click delete button for project task
      const deleteButtons = screen.getAllByText('Delete');
      expect(deleteButtons.length).toBeGreaterThan(0);

      await act(async () => {
        fireEvent.click(deleteButtons[deleteButtons.length - 1]); // Click the last delete button (for task, not project)
      });

      // Should trigger delete API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringMatching(/\/api\/tasks\/\d+/),
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });
  });

  describe('Project Actions in Selected View', () => {
    it('handles project edit from selected view', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await act(async () => {
        const projectsButton = screen.getByText('Projects');
        fireEvent.click(projectsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      await act(async () => {
        const projectCard = screen.getByText('Test Project');
        fireEvent.click(projectCard);
      });

      await waitFor(() => {
        expect(screen.getByText('Tasks for this Project')).toBeInTheDocument();
      });

      // Click edit button in project header
      const editButtons = screen.getAllByText('Edit');
      const projectEditButton = editButtons[0]; // First edit button should be for the project

      await act(async () => {
        fireEvent.click(projectEditButton);
      });

      // Should open project edit form
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
      });
    });

    it('handles project delete from selected view', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await act(async () => {
        const projectsButton = screen.getByText('Projects');
        fireEvent.click(projectsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      await act(async () => {
        const projectCard = screen.getByText('Test Project');
        fireEvent.click(projectCard);
      });

      await waitFor(() => {
        expect(screen.getByText('Tasks for this Project')).toBeInTheDocument();
      });

      // Click delete button in project header
      const deleteButtons = screen.getAllByText('Delete');
      const projectDeleteButton = deleteButtons[0]; // First delete button should be for the project

      await act(async () => {
        fireEvent.click(projectDeleteButton);
      });

      // Should open delete confirmation dialog
      await waitFor(() => {
        expect(screen.getByText('Delete Project?')).toBeInTheDocument();
      });
    });
  });

  describe('Task Creation from Project View', () => {
    it('opens task form from empty project state', async () => {
      // Mock empty tasks for the project
      global.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/csrf-token') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrf_token: 'mock-csrf-token' }),
          } as Response);
        }
        
        if (url === '/api/projects') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: mockProjectData }),
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

      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await act(async () => {
        const projectsButton = screen.getByText('Projects');
        fireEvent.click(projectsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      await act(async () => {
        const projectCard = screen.getByText('Test Project');
        fireEvent.click(projectCard);
      });

      await waitFor(() => {
        expect(screen.getByText('No tasks for this project')).toBeInTheDocument();
      });

      // Click Add Task button from empty state
      await act(async () => {
        const addTaskButton = screen.getByRole('button', { name: /add task/i });
        fireEvent.click(addTaskButton);
      });

      // Should open task form
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
      });
    });
  });

  describe('Task Subtask Handling', () => {
    it('disables task checkbox when subtasks are incomplete', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await act(async () => {
        const projectsButton = screen.getByText('Projects');
        fireEvent.click(projectsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      await act(async () => {
        const projectCard = screen.getByText('Test Project');
        fireEvent.click(projectCard);
      });

      await waitFor(() => {
        expect(screen.getByText('Another Project Task')).toBeInTheDocument();
      });

      // Find checkbox for task with incomplete subtasks
      const checkboxes = screen.getAllByRole('checkbox');
      const taskWithSubtasks = checkboxes.find(checkbox => {
        const container = checkbox.closest('.phub-item-card');
        return container && container.textContent?.includes('Another Project Task');
      });

      expect(taskWithSubtasks).toBeDefined();
      if (taskWithSubtasks) {
        expect(taskWithSubtasks).toBeDisabled();
        expect(taskWithSubtasks).toHaveAttribute('title', 'Complete all subtasks first');
      }
    });

    it('shows subtask count badge', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await act(async () => {
        const projectsButton = screen.getByText('Projects');
        fireEvent.click(projectsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      await act(async () => {
        const projectCard = screen.getByText('Test Project');
        fireEvent.click(projectCard);
      });

      await waitFor(() => {
        expect(screen.getByText('Another Project Task')).toBeInTheDocument();
      });

      // Should show subtask badge
      expect(screen.getByText('📝 2 subtasks')).toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    it('shows loading state for tasks', async () => {
      // Mock slow response for tasks
      global.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/csrf-token') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrf_token: 'mock-csrf-token' }),
          } as Response);
        }
        
        if (url === '/api/projects') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: mockProjectData }),
          } as Response);
        }
        
        if (url === '/api/tasks') {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve({ tasks: mockTaskDataWithProject }),
              } as Response);
            }, 100);
          });
        }
        
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Not found' }),
        } as Response);
      });

      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await act(async () => {
        const projectsButton = screen.getByText('Projects');
        fireEvent.click(projectsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      await act(async () => {
        const projectCard = screen.getByText('Test Project');
        fireEvent.click(projectCard);
      });

      // Should show loading initially
      expect(screen.getByText('Loading tasks...')).toBeInTheDocument();

      // Wait for tasks to load
      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      });
    });

    it('shows error state for tasks', async () => {
      // Mock error response for tasks
      global.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/csrf-token') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrf_token: 'mock-csrf-token' }),
          } as Response);
        }
        
        if (url === '/api/projects') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: mockProjectData }),
          } as Response);
        }
        
        if (url === '/api/tasks') {
          return Promise.reject(new Error('Failed to fetch tasks'));
        }
        
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Not found' }),
        } as Response);
      });

      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      await act(async () => {
        const projectsButton = screen.getByText('Projects');
        fireEvent.click(projectsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      await act(async () => {
        const projectCard = screen.getByText('Test Project');
        fireEvent.click(projectCard);
      });

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/⚠️.*Unknown error/)).toBeInTheDocument();
      });
    });
  });
});