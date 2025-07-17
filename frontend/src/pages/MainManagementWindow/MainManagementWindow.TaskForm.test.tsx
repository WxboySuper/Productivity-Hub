import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { afterEach, describe, it, expect, beforeEach, Mock } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import MainManagementWindow from '../MainManagementWindow';
import { AuthProvider } from '../../auth';
import { BackgroundProvider } from '../../context/BackgroundContext';
import { ToastProvider } from '../../components/ToastProvider';
import { setupFetchMock, setupBeforeEach } from '../__tests__/testUtils';

setupFetchMock();

const fetchMock = global.fetch as Mock;

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
    setupBeforeEach();
    if (typeof fetchMock.mockClear === 'function') {
      fetchMock.mockClear();
    }
  });

  afterEach(() => {
    cleanup();
  });

  describe('Task Form', () => {
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
        expect(screen.getByTestId('task-form')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('closes task form when cancel is clicked', async () => {
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
        expect(screen.getByTestId('task-form')).toBeInTheDocument();
      }, { timeout: 5000 });

      const taskForm = screen.getByTestId('task-form');
      const cancelButton = taskForm.querySelector('button:last-child');
      if (cancelButton) {
        act(() => {
          fireEvent.click(cancelButton);
        });
      }
      await waitFor(() => {
        expect(screen.queryByTestId('task-form')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Task Management', async () => {
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
      expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
    }, { timeout: 5000 });

    const addNewButton = screen.getByText('Add New').closest('button');
    if (addNewButton) {
      await act(() => {
        fireEvent.click(addNewButton);
      });
    }

    await waitFor(() => {
      expect(screen.getByTestId('task-form')).toBeInTheDocument();
    }, { timeout: 5000 });

    const submitButton = screen.getByText('Submit');
    await act(() => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({
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
          json: () => Promise.resolve({}),
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
          ok: false,
          json: () => Promise.resolve({ error: 'Task creation failed' }),
        } as Response);

      await act(() => {
        render(<MainManagementWindowWrapper />);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('main-management-window')).toBeInTheDocument();
      }, { timeout: 5000 });

      const addNewButton = screen.getByText('Add New').closest('button');
      if (addNewButton) {
        await act(() => {
          fireEvent.click(addNewButton);
        });
      }

      await waitFor(() => {
        expect(screen.getByTestId('task-form')).toBeInTheDocument();
      }, { timeout: 5000 });

      const submitButton = screen.getByText('Submit');
      await act(() => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Task creation failed')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
});
