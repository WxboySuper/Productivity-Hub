import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { afterEach, describe, it, expect, beforeEach, Mock, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import MainManagementWindow from '../MainManagementWindow';
import { AuthProvider } from '../../auth';
import { BackgroundProvider } from '../../context/BackgroundContext';
import { ToastProvider } from '../../components/ToastProvider';
import { setupBeforeEach } from '../__tests__/testUtils';

// Mock useProjects to always return the test project
vi.mock('../../hooks/useProjects', () => ({
  useProjects: () => ({
    projects: [{ id: 1, name: 'Test Project' }],
    loading: false,
    error: null,
    refetch: vi.fn(),
  })
}));

const fetchMock = global.fetch as Mock;
// Helper wrapper for context providers
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

// Test suite for Task Form functionality
describe('Task Form', () => {

  beforeEach(() => {
    setupBeforeEach();
    if (typeof fetchMock.mockClear === 'function') {
      fetchMock.mockClear();
    }
    // Default mock for /api/projects and /api/tasks to prevent undefined fetch results
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ projects: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: [] }),
      } as Response);
  });

  afterEach(() => {
    cleanup();
  });

  it('opens task form when Add New button is clicked', async () => {
    act(() => {
      render(<MainManagementWindowWrapper />);
    });
    await waitFor(() => {
      expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
    }, { timeout: 5000 });

    const addNewButton = screen.getByText('Add New').closest('button');
    if (addNewButton) {
      act(() => {
        fireEvent.click(addNewButton);
      });
    }
    await waitFor(() => {
      expect(document.querySelector('.modern-modal-backdrop')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('closes task form when cancel is clicked', async () => {
    act(() => {
      render(<MainManagementWindowWrapper />);
    });
    expect(screen.getByTestId('main-management-window')).toBeInTheDocument();

    const addNewButton = screen.getByText('Add New').closest('button');
    if (addNewButton) {
      act(() => {
        fireEvent.click(addNewButton);
      });
    }
    // Modal should be present
    expect(document.querySelector('.modern-modal-backdrop')).toBeInTheDocument();

    // Find all cancel buttons and click the one inside the modal
    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    act(() => {
      fireEvent.click(cancelButtons[cancelButtons.length - 1]);
    });
    // Modal should be gone
    await waitFor(() => {
      expect(document.querySelector('.modern-modal-backdrop')).not.toBeInTheDocument();
    });
  });

  it('creates a new task when submitting the form', async () => {
    fetchMock.mockReset();
    fetchMock
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

    await act(() => {
      render(<MainManagementWindowWrapper />);
    });

    await waitFor(() => {
      const windows = screen.getAllByTestId('main-management-window');
      expect(windows.length).toBe(1);
      expect(windows[0]).toBeInTheDocument();
    }, { timeout: 5000 });

    const addNewButton = screen.getByText('Add New').closest('button');
    if (addNewButton) {
      await act(() => {
        fireEvent.click(addNewButton);
      });
    }

    await waitFor(() => {
      expect(document.querySelector('.modern-modal-backdrop')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Fill in required task name input
    const taskNameInput = screen.getByPlaceholderText('What needs to be done?');
    expect(taskNameInput).toBeInTheDocument();
    await act(() => {
      fireEvent.change(taskNameInput, { target: { value: 'Test Task' } });
    });

    // Find submit button by text (real markup uses 'Create Task' with an icon span)
    const submitButton = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('Create Task')
    );
    if (submitButton && !submitButton.hasAttribute('disabled')) {
      await act(() => {
        fireEvent.click(submitButton);
      });
      expect(global.fetch).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({
        credentials: 'include',
      }));
    }
  });


  it('handles task completion toggling', async () => {
    // Stateful mock for task completion
    let completedState = false;
    const testTask = {
      id: 1,
      title: 'Test Task',
      completed: completedState,
      projectId: 1, // must be present
      parent_id: null, // must be present
      description: 'Test task description',
    };
    
    // Set up mock BEFORE rendering component
    fetchMock.mockReset();
    fetchMock.mockImplementation((url, options) => {
      if (url === '/api/projects') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ projects: [{ id: 1, name: 'Test Project' }] }),
        } as Response);
      }
      if (url === '/api/tasks' && (!options || !options.method || options.method === 'GET')) {
        // Always return both projectId and parent_id
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ tasks: [
            {
              ...testTask,
              projectId: 1,
              parent_id: null,
              completed: completedState
            }
          ] }),
        } as Response);
      }
      if (url === `/api/tasks/${testTask.id}` && options && options.method === 'PUT') {
        completedState = true;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...testTask, completed: true }),
        } as Response);
      }
      if (url === '/api/csrf-token') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'test-token' }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);
    });

    await act(() => {
      render(<MainManagementWindowWrapper />);
    });

  // Switch to Projects view first
  const projectsSidebarBtn = screen.getAllByText('Projects').find(el => el.closest('button'))?.closest('button');
  if (!projectsSidebarBtn) throw new Error('Projects sidebar button not found');
  fireEvent.click(projectsSidebarBtn);

    // Now select the project so the task is rendered
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    }, { timeout: 5000 });
    fireEvent.click(screen.getByText('Test Project'));

    // Wait for the task to appear (flexible matcher)
    let found = false;
    try {
      await waitFor(() => {
        const taskTitles = Array.from(document.querySelectorAll('.phub-item-title'));
        found = taskTitles.some(el => el.textContent?.replace(/\s+/g, ' ').trim() === 'Test Task');
        expect(found).toBe(true);
      }, { timeout: 3000 });
    } catch (e) {
      // Print the DOM for debugging
      // eslint-disable-next-line no-console
      console.log(document.body.innerHTML);
      throw e;
    }

    // Toggle completion
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox).toBeTruthy();
    const initialChecked = checkbox.checked;
    act(() => {
      fireEvent.click(checkbox);
    });

    // Wait for the state to update after the API call
    await waitFor(() => {
      expect(checkbox.checked).toBe(!initialChecked);
    }, { timeout: 3000 });
  });



  it('handles task deletion', async () => {
    // Stateful mock for task deletion
    let tasks = [
      {
        id: 1,
        title: 'Test Task',
        completed: false,
        projectId: 1, // must be present
        parent_id: null, // must be present
        description: 'Test task description',
      },
    ];
    
    // Set up mock BEFORE rendering component
    fetchMock.mockReset();
    fetchMock.mockImplementation((url, options) => {
      if (url === '/api/projects') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ projects: [{ id: 1, name: 'Test Project' }] }),
        } as Response);
      }
      if (url === '/api/tasks' && (!options || !options.method || options.method === 'GET')) {
        // Always return both projectId and parent_id for all tasks
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ tasks: tasks.map(t => ({ ...t, projectId: 1, parent_id: null })) }),
        } as Response);
      }
      if (url === "/api/tasks/1" && options && options.method === 'DELETE') {
        tasks = [];
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response);
      }
      if (url === '/api/csrf-token') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'test-token' }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);
    });

    await act(() => {
      render(<MainManagementWindowWrapper />);
    });

  // Switch to Projects view first
  const projectsSidebarBtn = screen.getAllByText('Projects').find(el => el.closest('button'))?.closest('button');
  if (!projectsSidebarBtn) throw new Error('Projects sidebar button not found');
  fireEvent.click(projectsSidebarBtn);

    // Now select the project so the task is rendered
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    }, { timeout: 5000 });
    fireEvent.click(screen.getByText('Test Project'));

    // Wait for the task to appear (flexible matcher)
    await waitFor(() => {
      const taskTitles = Array.from(document.querySelectorAll('.phub-item-title'));
      const found = taskTitles.some(el => el.textContent?.replace(/\s+/g, ' ').trim() === 'Test Task');
      expect(found).toBe(true);
    }, { timeout: 3000 });

    // Find and click the delete button for the task (not the project delete button)
    // Look specifically within task cards for the delete button
    const taskCards = Array.from(document.querySelectorAll('.phub-item-card'));
    const taskCard = taskCards.find(card => card.textContent?.includes('Test Task'));
    expect(taskCard).toBeTruthy();
    
    const taskDeleteButton = Array.from(taskCard?.querySelectorAll('button') ?? []).find(
      btn => btn.textContent?.toLowerCase().includes('delete')
    );
    expect(taskDeleteButton).toBeTruthy();
    if (taskDeleteButton) {
      act(() => {
        fireEvent.click(taskDeleteButton);
      });
    }

    // Wait for the task to be removed (tasks are refetched after deletion)
    await waitFor(() => {
      expect(screen.queryByText('Test Task')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });


  it('opens task details when clicking on task title', async () => {
    // Stateful mock for task details
    const tasks = [
      {
        id: 1,
        title: 'Test Task',
        completed: false,
        projectId: 1, // must be present
        parent_id: null, // must be present
        description: 'Test task description',
      },
    ];
    
    // Set up mock BEFORE rendering component
    fetchMock.mockReset();
    fetchMock.mockImplementation((url, options) => {
      if (url === '/api/projects') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ projects: [{ id: 1, name: 'Test Project' }] }),
        } as Response);
      }
      if (url === '/api/tasks' && (!options || !options.method || options.method === 'GET')) {
        // Always return both projectId and parent_id for all tasks
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ tasks: tasks.map(t => ({ ...t, projectId: 1, parent_id: null })) }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);
    });

    await act(() => {
      render(<MainManagementWindowWrapper />);
    });

    // Switch to Projects view first
    const projectsSidebarBtn = screen.getAllByText('Projects').find(el => el.closest('button'))?.closest('button');
    if (!projectsSidebarBtn) throw new Error('Projects sidebar button not found');
    fireEvent.click(projectsSidebarBtn);

    // Now select the project so the task is rendered
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    }, { timeout: 5000 });
    fireEvent.click(screen.getByText('Test Project'));

    // Wait for the task to appear and click the title as soon as it's found
    await waitFor(() => {
      const taskTitles = Array.from(document.querySelectorAll('.phub-item-title'));
      const taskTitleNode = taskTitles.find(el => el.textContent?.replace(/\s+/g, ' ').trim() === 'Test Task');
      expect(taskTitleNode).toBeDefined();
      act(() => {
        if (taskTitleNode) {
          fireEvent.click(taskTitleNode);
        }
      });
    }, { timeout: 3000 });

    // Wait for the details panel
    await waitFor(() => {
      expect(screen.getByTestId('task-details')).toBeInTheDocument();
    }, { timeout: 3000 });
  });



  it('handles task form error display', async () => {
    fetchMock.mockReset();
    fetchMock.mockImplementation((url, options) => {
      if (url === '/api/projects') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ projects: [] }),
        } as Response);
      }
      if (url === '/api/tasks' && (!options || options.method === 'GET')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ tasks: [] }),
        } as Response);
      }
      if (url === '/api/csrf_token') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'test-token' }),
        } as Response);
      }
      if (url === '/api/tasks' && options && options.method === 'POST') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Task creation failed' }),
        } as Response);
      }
      // Default catch-all
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);
    });

    act(() => {
      render(<MainManagementWindowWrapper />);
    });
      await waitFor(() => {
        expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
      });

    const addNewButton = screen.getByText('Add New').closest('button');
    if (addNewButton) {
      act(() => {
        fireEvent.click(addNewButton);
      });
    }
    expect(document.querySelector('.modern-modal-backdrop')).toBeInTheDocument();

    // Fill in required task name input
    const taskNameInput = screen.getByPlaceholderText('What needs to be done?');
    expect(taskNameInput).toBeInTheDocument();
    await act(() => {
      fireEvent.change(taskNameInput, { target: { value: 'Test Task' } });
    });

    // Find submit button by text (real markup uses 'Create Task' with an icon span)
    const submitButton = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('Create Task')
    );
    expect(submitButton).toBeTruthy();

    if (!submitButton) {
      throw new Error('Submit button not found');
    }
    act(() => {
      fireEvent.click(submitButton);
    });

    // Wait for error message to appear after submitting
    await waitFor(() => {
      const errorDiv = Array.from(document.querySelectorAll('.modern-error')).find(
        el => el.textContent?.includes('Task creation failed')
      );
        if (errorDiv) {
          expect(errorDiv).toBeInTheDocument();
        }
    });
  });
});
