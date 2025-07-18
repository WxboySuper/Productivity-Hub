import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { useTasks } from './useTasks';

// Mock fetch globally
global.fetch = vi.fn();
const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

// Mock document.cookie for CSRF token tests
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

describe('useTasks', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    document.cookie = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchTasks', () => {
    it('should fetch tasks successfully', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', description: 'Description 1', completed: false, projectId: 1 },
        { id: 2, title: 'Task 2', description: 'Description 2', completed: true, projectId: null }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: mockTasks }),
      } as Response);

      const { result } = renderHook(() => useTasks());

      // Initially should have empty state
      expect(result.current.tasks).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);

      // Call fetchTasks
      act(() => {
        result.current.fetchTasks();
      });

      // Should be loading
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tasks).toEqual(mockTasks);
      expect(result.current.error).toBe(null);
      expect(mockFetch).toHaveBeenCalledWith('/api/tasks', { credentials: 'include' });
    });

    it('should handle array response format', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', description: 'Description 1', completed: false }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTasks), // Direct array response
      } as Response);

      const { result } = renderHook(() => useTasks());

      act(() => {
        result.current.fetchTasks();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tasks).toEqual(mockTasks);
    });

    it('should normalize task data with project_id', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', project_id: 1, completed: false },
        { id: 2, title: 'Task 2', projectId: 2, completed: false }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: mockTasks }),
      } as Response);

      const { result } = renderHook(() => useTasks());

      act(() => {
        result.current.fetchTasks();
      });

      await waitFor(() => {
        expect(result.current.tasks).toEqual([
          { id: 1, title: 'Task 1', project_id: 1, projectId: 1, completed: false },
          { id: 2, title: 'Task 2', projectId: 2, completed: false }
        ]);
      });
    });

    it('should set projectId as undefined if both projectId and project_id are missing', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', completed: false }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: mockTasks }),
      } as Response);

      const { result } = renderHook(() => useTasks());

      act(() => {
        result.current.fetchTasks();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].projectId).toBeUndefined();
    });

    it('should fallback to empty array if data.tasks is undefined', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: undefined }),
      } as Response);

      const { result } = renderHook(() => useTasks());

      act(() => {
        result.current.fetchTasks();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tasks).toEqual([]);
    });

    it('should use project_id if projectId is explicitly undefined', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', projectId: undefined, project_id: 42, completed: false }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: mockTasks }),
      } as Response);

      const { result } = renderHook(() => useTasks());

      act(() => {
        result.current.fetchTasks();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tasks[0].projectId).toBe(42);
    });

    it('should use project_id if only project_id is present', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', project_id: 99, completed: false }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: mockTasks }),
      } as Response);

      const { result } = renderHook(() => useTasks());

      act(() => {
        result.current.fetchTasks();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tasks[0].projectId).toBe(99);
    });

    it('should handle fetch error', async () => {
      const errorMessage = 'Failed to fetch tasks';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useTasks());

      act(() => {
        result.current.fetchTasks();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tasks).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle response not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      } as Response);

      const { result } = renderHook(() => useTasks());

      act(() => {
        result.current.fetchTasks();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tasks).toEqual([]);
      expect(result.current.error).toBe('Failed to fetch tasks');
    });

    it('should handle unknown error types', async () => {
      mockFetch.mockRejectedValueOnce('String error'); // Non-Error object

      const { result } = renderHook(() => useTasks());

      act(() => {
        result.current.fetchTasks();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Unknown error');
      });
    });
  });

  describe('updateTask', () => {
    it('should update task successfully with existing CSRF token', async () => {
      document.cookie = '_csrf_token=existing_token';

      const { result } = renderHook(() => useTasks());

      // First fetch tasks to populate state
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          tasks: [{ id: 1, title: 'Task 1', description: 'Desc 1', completed: false }]
        }),
      } as Response);

      act(() => {
        result.current.fetchTasks();
      });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      // Then test update
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Task updated' }),
      } as Response);

      let updateResult: boolean = false;
      await act(async () => {
        updateResult = await result.current.updateTask(1, { completed: true });
      });

      expect(updateResult).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': 'existing_token',
        },
        credentials: 'include',
        body: JSON.stringify({ completed: true }),
      });

      // Should update local state optimistically
      expect(result.current.tasks[0].completed).toBe(true);
    });

    it('should fetch CSRF token when not available in cookies', async () => {
      document.cookie = ''; // No CSRF token

      const { result } = renderHook(() => useTasks());

      // Mock CSRF token fetch
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'fetched_token' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: 'Task updated' }),
        } as Response);

      let updateResult: boolean = false;
      await act(async () => {
        updateResult = await result.current.updateTask(1, { completed: true });
      });

      expect(updateResult).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/csrf-token', { credentials: 'include' });
      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1', expect.objectContaining({
        headers: expect.objectContaining({
          'X-CSRFToken': 'fetched_token',
        }),
      }));
    });

    it('should handle update failure', async () => {
      document.cookie = '_csrf_token=test_token';
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useTasks());

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Update failed' }),
      } as Response);

      let updateResult: boolean = false;
      await act(async () => {
        updateResult = await result.current.updateTask(1, { completed: true });
      });

      expect(updateResult).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error updating task:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle network error during update', async () => {
      document.cookie = '_csrf_token=test_token';
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useTasks());

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      let updateResult: boolean = false;
      await act(async () => {
        updateResult = await result.current.updateTask(1, { completed: true });
      });

      expect(updateResult).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error updating task:', expect.any(Error));

      consoleSpy.mockRestore();
    });

      it('should leave other tasks unchanged when updating a single task', async () => {
        document.cookie = '_csrf_token=test_token';

        const { result } = renderHook(() => useTasks());

        // Initial state: two tasks
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            tasks: [
              { id: 1, title: 'Task 1', completed: false },
              { id: 2, title: 'Task 2', completed: false }
            ]
          }),
        } as Response);

        act(() => {
          result.current.fetchTasks();
        });

        await waitFor(() => {
          expect(result.current.tasks).toHaveLength(2);
        });

        // Update only task 1
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: 'Task updated' }),
        } as Response);

        await act(async () => {
          await result.current.updateTask(1, { completed: true });
        });

        // Task 1 should be updated, task 2 should remain unchanged
        expect(result.current.tasks[0].completed).toBe(true);
        expect(result.current.tasks[1]).toEqual({ id: 2, title: 'Task 2', completed: false });
      });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      const { result } = renderHook(() => useTasks());

      // First fetch tasks to populate state
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          tasks: [
            { id: 1, title: 'Task 1', description: 'Desc 1', completed: false },
            { id: 2, title: 'Task 2', description: 'Desc 2', completed: false }
          ]
        }),
      } as Response);

      act(() => {
        result.current.fetchTasks();
      });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(2);
      });

      // Then test delete
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Task deleted' }),
      } as Response);

      let deleteResult: boolean = false;
      await act(async () => {
        deleteResult = await result.current.deleteTask(1);
      });

      expect(deleteResult).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1', {
        method: 'DELETE',
        credentials: 'include',
      });

      // Should remove from local state
      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].id).toBe(2);
    });

    it('should handle delete failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useTasks());

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Delete failed' }),
      } as Response);

      let deleteResult: boolean = false;
      await act(async () => {
        deleteResult = await result.current.deleteTask(1);
      });

      expect(deleteResult).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error deleting task:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle network error during delete', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useTasks());

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      let deleteResult: boolean = false;
      await act(async () => {
        deleteResult = await result.current.deleteTask(1);
      });

      expect(deleteResult).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error deleting task:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('CSRF token helper', () => {
    it('should handle empty CSRF token response', async () => {
      document.cookie = ''; // No CSRF token

      const { result } = renderHook(() => useTasks());

      // Mock CSRF token fetch with empty response
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}), // No csrf_token field
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: 'Task updated' }),
        } as Response);

      await act(async () => {
        await result.current.updateTask(1, { completed: true });
      });

      // Check that /api/csrf-token was called
      expect(mockFetch.mock.calls.some(call => call[0] === '/api/csrf-token')).toBe(true);

      // Check that /api/tasks/1 was called with X-CSRFToken: ''
      const taskCall = mockFetch.mock.calls.find(call => call[0] === '/api/tasks/1');
      expect(taskCall).toBeDefined();
      if (taskCall) {
        expect(taskCall[1].headers['X-CSRFToken']).toBe('');
      }
    });

    it('should parse CSRF token from cookie correctly', async () => {
      document.cookie = 'other=value; _csrf_token=correct_token; another=value';

      const { result } = renderHook(() => useTasks());

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Task updated' }),
      } as Response);

      await act(async () => {
        await result.current.updateTask(1, { completed: true });
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1', expect.objectContaining({
        headers: expect.objectContaining({
          'X-CSRFToken': 'correct_token',
        }),
      }));
    });

    it('should handle URL encoded cookie values', async () => {
      document.cookie = '_csrf_token=token%20with%20spaces';

      const { result } = renderHook(() => useTasks());

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Task updated' }),
      } as Response);

      await act(async () => {
        await result.current.updateTask(1, { completed: true });
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1', expect.objectContaining({
        headers: expect.objectContaining({
          'X-CSRFToken': 'token with spaces', // Should be decoded
        }),
      }));
    });

    it('should fetch CSRF token if cookie value is empty string', async () => {
      document.cookie = '_csrf_token='; // present but empty

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'fetched_token' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: 'Task updated' }),
        } as Response);

      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.updateTask(1, { completed: true });
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/csrf-token', { credentials: 'include' });
      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1', expect.objectContaining({
        headers: expect.objectContaining({
          'X-CSRFToken': 'fetched_token',
        }),
      }));
    });
  });

  describe('state management', () => {
    it('should reset error state on successful fetch', async () => {
      const { result } = renderHook(() => useTasks());

      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      act(() => {
        result.current.fetchTasks();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tasks: [] }),
      } as Response);

      act(() => {
        result.current.fetchTasks();
      });

      // Error should be cleared
      expect(result.current.error).toBe(null);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(null);
    });

    it('should maintain loading state properly', async () => {
      const { result } = renderHook(() => useTasks());

      let resolvePromise: (value: any) => void;
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(delayedPromise as any);

      act(() => {
        result.current.fetchTasks();
      });

      // Should be loading
      expect(result.current.loading).toBe(true);

      // Resolve the promise
      act(() => {
        resolvePromise({
          ok: true,
          json: () => Promise.resolve({ tasks: [] }),
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});