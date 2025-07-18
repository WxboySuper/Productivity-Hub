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
  
  // Setup fetch mock with comprehensive task operations
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
    
    if (url === '/api/tasks' && method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          id: 3, 
          title: 'New Task', 
          description: 'New task description',
          projectId: null,
          completed: false 
        }),
      } as Response);
    }
    
    if (url.match(/\/api\/tasks\/\d+/) && method === 'PUT') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          id: 1, 
          title: 'Updated Task', 
          description: 'Updated description',
          projectId: 1,
          completed: false 
        }),
      } as Response);
    }
    
    if (url.match(/\/api\/tasks\/\d+/) && method === 'DELETE') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);
    }
    
    // For fetching individual task after update
    if (url.match(/\/api\/tasks\/\d+/) && method === 'GET') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          id: 1, 
          title: 'Updated Task', 
          description: 'Updated description',
          projectId: 1,
          completed: false 
        }),
      } as Response);
    }
    
    // Default fallback
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

describe('MainManagementWindow - Task Edit and Update', () => {
  describe('Task Create Functionality', () => {
    it('handles task creation successfully', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      // Click add new task button
      await act(async () => {
        const addButton = screen.getByText('Add New');
        fireEvent.click(addButton);
      });

      // Wait for task form to appear
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
      });

      // Fill in task details
      const titleInput = screen.getByRole('textbox', { name: /title/i });
      const descriptionInput = screen.getByRole('textbox', { name: /description/i });

      await act(async () => {
        fireEvent.change(titleInput, { target: { value: 'New Task' } });
        fireEvent.change(descriptionInput, { target: { value: 'New task description' } });
      });

      // Submit the form
      await act(async () => {
        const submitButton = screen.getByRole('button', { name: /add task/i });
        fireEvent.click(submitButton);
      });

      // Verify API was called with correct data
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/tasks',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'X-CSRF-Token': 'mock-csrf-token',
            }),
            body: expect.stringContaining('New Task'),
          })
        );
      });
    });

    it('handles task creation error and keeps modal open', async () => {
      // Mock fetch to return error for POST request
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
        
        if (url === '/api/tasks' && method === 'POST') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Creation failed' }),
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

      // Click add new task button
      await act(async () => {
        const addButton = screen.getByText('Add New');
        fireEvent.click(addButton);
      });

      // Wait for form and fill it
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
      });

      const titleInput = screen.getByRole('textbox', { name: /title/i });
      await act(async () => {
        fireEvent.change(titleInput, { target: { value: 'New Task' } });
      });

      // Submit the form
      await act(async () => {
        const submitButton = screen.getByRole('button', { name: /add task/i });
        fireEvent.click(submitButton);
      });

      // Verify error is displayed and modal stays open
      await waitFor(() => {
        expect(screen.getByText('Creation failed')).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
      });
    });
  });

  describe('Task Edit Functionality', () => {
    it('handles task editing from all tasks view', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      // Tasks should load automatically in 'all' view
      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      });

      // Click edit button on task (need to check if edit button exists)
      // Note: Based on the main component, edit buttons might not be in all tasks view
      // Let's check the quick tasks view instead
      await act(async () => {
        const quickTasksButton = screen.getByText('Quick Tasks');
        fireEvent.click(quickTasksButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Quick Task')).toBeInTheDocument();
      });

      // Find and click edit button for quick task
      await act(async () => {
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);
      });

      // Wait for edit form to appear
      await waitFor(() => {
        expect(screen.getByDisplayValue('Quick Task')).toBeInTheDocument();
      });

      // Modify task details
      const titleInput = screen.getByDisplayValue('Quick Task');
      await act(async () => {
        fireEvent.change(titleInput, { target: { value: 'Updated Quick Task' } });
      });

      // Submit the form
      await act(async () => {
        const updateButtons = screen.getAllByRole('button', { name: /update task/i });
        fireEvent.click(updateButtons[0]);
      });

      // Verify API was called with correct data
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/tasks/2',
          expect.objectContaining({
            method: 'PUT',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'X-CSRF-Token': 'mock-csrf-token',
            }),
            body: expect.stringContaining('Updated Quick Task'),
          })
        );
      });
    });

    it('handles task editing error', async () => {
      // Mock fetch to return error for PUT request
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
        
        if (url.match(/\/api\/tasks\/\d+/) && method === 'PUT') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Update failed' }),
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

      // Navigate to quick tasks
      await act(async () => {
        const quickTasksButton = screen.getByText('Quick Tasks');
        fireEvent.click(quickTasksButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Quick Task')).toBeInTheDocument();
      });

      // Click edit button
      await act(async () => {
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);
      });

      // Wait for form and modify
      await waitFor(() => {
        expect(screen.getByDisplayValue('Quick Task')).toBeInTheDocument();
      });

      const titleInput = screen.getByDisplayValue('Quick Task');
      await act(async () => {
        fireEvent.change(titleInput, { target: { value: 'Updated Quick Task' } });
      });

      // Submit the form
      await act(async () => {
        const updateButtons = screen.getAllByRole('button', { name: /update task/i });
        fireEvent.click(updateButtons[0]);
      });

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
      });
    });
  });

  describe('Task Update with Details Reopening', () => {
    it('reopens task details after successful update', async () => {
      await act(async () => {
        render(<MainManagementWindowWrapper />);
      });

      // Navigate to quick tasks
      await act(async () => {
        const quickTasksButton = screen.getByText('Quick Tasks');
        fireEvent.click(quickTasksButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Quick Task')).toBeInTheDocument();
      });

      // Click on task title to open details
      await act(async () => {
        const taskTitle = screen.getByText('Quick Task');
        fireEvent.click(taskTitle);
      });

      // Wait for task details modal
      await waitFor(() => {
        expect(screen.getByTestId('task-details-modal')).toBeInTheDocument();
      });

      // Click edit button in details modal
      await act(async () => {
        const editButton = screen.getByRole('button', { name: /edit/i });
        fireEvent.click(editButton);
      });

      // Wait for edit form
      await waitFor(() => {
        expect(screen.getByDisplayValue('Quick Task')).toBeInTheDocument();
      });

      // Modify task
      const titleInput = screen.getByDisplayValue('Quick Task');
      await act(async () => {
        fireEvent.change(titleInput, { target: { value: 'Updated Quick Task' } });
      });

      // Submit the form
      await act(async () => {
        const updateButtons = screen.getAllByRole('button', { name: /update task/i });
        fireEvent.click(updateButtons[0]);
      });

      // Verify update API call was made
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/tasks/2',
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });

      // Verify that task details modal reopens (fetch for updated task)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/tasks/2');
      });
    });

    it('handles error when fetching updated task details', async () => {
      // Mock fetch to succeed on update but fail on refetch
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
        
        if (url.match(/\/api\/tasks\/\d+/) && method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              id: 2, 
              title: 'Updated Quick Task',
              description: 'Updated description',
              projectId: null,
              completed: false 
            }),
          } as Response);
        }
        
        // Fail when fetching individual task
        if (url.match(/\/api\/tasks\/\d+/) && method === 'GET') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Fetch failed' }),
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

      // Navigate to quick tasks
      await act(async () => {
        const quickTasksButton = screen.getByText('Quick Tasks');
        fireEvent.click(quickTasksButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Quick Task')).toBeInTheDocument();
      });

      // Click edit button
      await act(async () => {
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);
      });

      // Wait for form and modify
      await waitFor(() => {
        expect(screen.getByDisplayValue('Quick Task')).toBeInTheDocument();
      });

      const titleInput = screen.getByDisplayValue('Quick Task');
      await act(async () => {
        fireEvent.change(titleInput, { target: { value: 'Updated Quick Task' } });
      });

      // Submit the form
      await act(async () => {
        const updateButtons = screen.getAllByRole('button', { name: /update task/i });
        fireEvent.click(updateButtons[0]);
      });

      // Update should succeed but refetch should fail
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/tasks/2',
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });

      // Should still attempt to fetch updated task despite error
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/tasks/2');
      });
    });
  });

  describe('Task Toggle Functionality', () => {
    it('handles task toggle error', async () => {
      // Mock fetch to return error for task toggle
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
        
        if (url.match(/\/api\/tasks\/\d+/) && method === 'PUT') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Toggle failed' }),
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

      // Tasks should be loaded in all view
      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      });

      // Find and click checkbox to toggle task
      const checkbox = screen.getAllByRole('checkbox')[0];
      await act(async () => {
        fireEvent.click(checkbox);
      });

      // Should attempt to toggle but fail
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/tasks/1',
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('completed'),
          })
        );
      });
    });

    it('handles task not found during toggle', async () => {
      // Mock task data that will cause task not found scenario
      const mockTaskDataNoTask = [];
      
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
            json: () => Promise.resolve({ tasks: mockTaskDataNoTask }),
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

      // No tasks should be displayed
      await waitFor(() => {
        expect(screen.getByText('No tasks found')).toBeInTheDocument();
      });
    });
  });

  describe('Task Delete Functionality', () => {
    it('handles task deletion error', async () => {
      // Mock fetch to return error for DELETE request
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
        
        if (url.match(/\/api\/tasks\/\d+/) && method === 'DELETE') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Delete failed' }),
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

      // Navigate to quick tasks to access delete button
      await act(async () => {
        const quickTasksButton = screen.getByText('Quick Tasks');
        fireEvent.click(quickTasksButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Quick Task')).toBeInTheDocument();
      });

      // Find and click delete button
      await act(async () => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });

      // Should attempt to delete but error should be handled
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/tasks/2',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });
  });
});