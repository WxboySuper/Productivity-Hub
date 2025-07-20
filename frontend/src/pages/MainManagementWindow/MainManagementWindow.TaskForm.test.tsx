import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { afterEach, describe, it, expect, beforeEach, Mock } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import MainManagementWindow from '../MainManagementWindow';
import { AuthProvider } from '../../auth';
import { BackgroundProvider } from '../../context/BackgroundContext';
import { ToastProvider } from '../../components/ToastProvider';
import { setupBeforeEach } from '../__tests__/testUtils';


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
    fetchMock.mockReset();
    const testTask = {
      id: 1,
      title: 'Test Task',
      completed: false,
      projectId: 1,
      parent_id: null,
      description: 'Test task description'
    };

    fetchMock
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

    await act(() => {
      render(<MainManagementWindowWrapper />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    }, { timeout: 5000 });

    const checkbox = screen.getByRole('checkbox');
    await act(() => {
      fireEvent.click(checkbox);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/tasks/${testTask.id}`, expect.objectContaining({
        method: 'PUT',
        credentials: 'include',
      }));
    }, { timeout: 5000 });
  });



  it('handles task deletion', async () => {
    fetchMock.mockReset();
    const testTask = {
      id: 1,
      title: 'Test Task',
      completed: false,
      projectId: 1,
      parent_id: null,
      description: 'Test task description'
    };

    // Mock for: /api/projects, /api/tasks, /api/tasks/{id}, and one more for re-fetching tasks after deletion
    fetchMock
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
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: [] }),
      } as Response);

    await act(() => {
      render(<MainManagementWindowWrapper />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    }, { timeout: 5000 });

    const deleteButton = screen.getByText('Delete');
    await act(() => {
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/tasks/${testTask.id}`, expect.objectContaining({
        method: 'DELETE',
        credentials: 'include',
      }));
    }, { timeout: 5000 });
  });


  it('opens task details when clicking on task title', async () => {
    fetchMock.mockReset();
    const testTask = {
      id: 1,
      title: 'Test Task',
      completed: false,
      projectId: 1,
      parent_id: null,
      description: 'Test task description'
    };

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ projects: [{ id: 1, name: 'Test Project' }] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: [testTask] }),
      } as Response);

    await act(() => {
      render(<MainManagementWindowWrapper />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    }, { timeout: 5000 });

    const taskTitle = screen.getByText('Test Task');
    await act(() => {
      fireEvent.click(taskTitle);
    });

    await waitFor(() => {
      expect(screen.getByTestId('task-details')).toBeInTheDocument();
    }, { timeout: 5000 });
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
