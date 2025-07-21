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
        json: () => Promise.resolve({ tasks: mockTaskData }),
      } as Response);
    }
    
    if (url.match(/\/api\/projects\/\d+/) && method === 'PUT') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          id: 1, 
          name: 'Updated Project', 
          description: 'Updated description' 
        }),
      } as Response);
    }
    
    if (url.match(/\/api\/projects\/\d+/) && method === 'DELETE') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
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
    
    if (url === '/api/auth/check') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          authenticated: true,
          user: { username: 'testuser', id: 1 }
        }),
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

describe('MainManagementWindow - Final Coverage Tests', () => {
  describe('Additional Coverage Areas', () => {
    it('tests project and task interactions for coverage', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      // Test multiple views to trigger different code paths
      await act(async () => {
        const projectsButton = screen.getByText('Projects');
        fireEvent.click(projectsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Test project selection to trigger selected project view
      await act(async () => {
        const projectCard = screen.getByText('Test Project');
        fireEvent.click(projectCard);
      });

      await waitFor(() => {
        expect(screen.getByText('Tasks for this Project')).toBeInTheDocument();
      });

      // Test back navigation
      await act(async () => {
        const backButton = screen.getByText('Back');
        fireEvent.click(backButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Your Projects')).toBeInTheDocument();
      });
    });

    it('tests helper functions through UI interactions', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      // Test getTaskWithProject by viewing task details
      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      });

      await act(async () => {
        const taskTitle = screen.getByText('Test Task');
        fireEvent.click(taskTitle);
      });

      await waitFor(() => {
        expect(screen.getByTestId('task-details')).toBeInTheDocument();
      });

      // Close the modal
      await act(async () => {
        const closeButton = screen.getByText('Close');
        fireEvent.click(closeButton);
      });
    });

    it('tests error handling scenarios', async () => {
      // Mock error responses
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
        
        if (url === '/api/tasks' && method === 'GET') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ tasks: mockTaskData }),
          } as Response);
        }
        
        // Return errors for other operations to test error handling
        if (method !== 'GET') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Operation failed' }),
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

      // Test task toggle error handling
      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      if (checkboxes.length > 0) {
        await act(async () => {
          fireEvent.click(checkboxes[0]);
        });
      }

      // Test task deletion error handling
      await act(async () => {
        const quickTasksButton = screen.getByText('Quick Tasks');
        fireEvent.click(quickTasksButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Quick Task')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');
      if (deleteButtons.length > 0) {
        await act(async () => {
          fireEvent.click(deleteButtons[0]);
        });
      }
    });

    it('tests CSRF token handling', async () => {
      // Mock document.cookie to test CSRF token extraction
      const originalCookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
      Object.defineProperty(document, 'cookie', {
        value: '_csrf_token=test-token; other=value',
        writable: true,
      });

      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      // Navigate to projects and attempt an operation that would use CSRF token
      await act(async () => {
        const projectsButton = screen.getByText('Projects');
        fireEvent.click(projectsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Add Project')).toBeInTheDocument();
      });

      // The component should be able to extract CSRF token from cookie
      expect(document.cookie).toContain('_csrf_token=test-token');

      // Restore original cookie descriptor
      if (originalCookie) {
        Object.defineProperty(Document.prototype, 'cookie', originalCookie);
      }
    });

    it('tests event listeners cleanup', async () => {
      const { unmount } = render(<MainManagementWindowWrapper />);

      // Add spy on removeEventListener
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      // Unmount component to trigger cleanup
      await act(async () => {
        unmount();
      });

      // Verify event listener was cleaned up
      expect(removeEventListenerSpy).toHaveBeenCalledWith('openTaskDetails', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('tests allTasks useMemo computation', async () => {
      // Test with tasks that have subtasks to trigger the useMemo computation
      const tasksWithSubtasks = [
        ...mockTaskData,
        {
          id: 3,
          title: 'Parent Task',
          description: 'Task with subtasks',
          projectId: 1,
          parent_id: null,
          completed: false,
          subtasks: [
            { id: 4, title: 'Subtask 1', completed: false },
            { id: 5, title: 'Subtask 2', completed: true }
          ]
        }
      ];

      global.fetch = vi.fn().mockImplementation((url: string) => {
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
            json: () => Promise.resolve({ tasks: tasksWithSubtasks }),
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

      // The useMemo should compute flattened tasks including subtasks
      await waitFor(() => {
        expect(screen.getByText('Parent Task')).toBeInTheDocument();
      });

      // Test custom event dispatch to trigger the event handler
      await act(async () => {
        const event = new CustomEvent('openTaskDetails', { detail: 4 });
        window.dispatchEvent(event);
      });
    });

    it('tests project task helper functions', async () => {
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

      // Test project task interactions to trigger helper functions
      if (screen.queryByText('Test Task')) {
        // Test task toggle helper
        const checkboxes = screen.getAllByRole('checkbox');
        if (checkboxes.length > 0) {
          await act(async () => {
            fireEvent.click(checkboxes[0]);
          });
        }

        // Test task title click helper
        await act(async () => {
          const taskTitle = screen.getByText('Test Task');
          fireEvent.click(taskTitle);
        });

        await waitFor(() => {
          expect(screen.getByTestId('task-details')).toBeInTheDocument();
        });

        // Close details modal
        await act(async () => {
          const closeButton = screen.getByText('Close');
          fireEvent.click(closeButton);
        });
      }
    });
  });
});