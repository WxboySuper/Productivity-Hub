// Example of how to refactor for better testability
import { useState, useCallback } from 'react';

export interface Task {
  id: number;
  title: string;
  description: string;
  projectId?: number;
  project_id?: number;
  parent_id?: number | null;
  completed: boolean;
  subtasks?: Task[];
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tasks', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      
      const data = await response.json();
      const tasks = Array.isArray(data) ? data : (data.tasks || []);
      
      // Normalize task data
      const normalizedTasks = tasks.map((task: any) => ({
        ...task,
        projectId: typeof task.projectId !== 'undefined' ? task.projectId : task.project_id,
      }));
      
      setTasks(normalizedTasks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTask = useCallback(async (taskId: number, updates: Partial<Task>) => {
    try {
      const token = await ensureCsrfToken();
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': token,
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update task');
      
      // Optimistically update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ));
      
      return true;
    } catch (err) {
      console.error('Error updating task:', err);
      return false;
    }
  }, []);

  const deleteTask = useCallback(async (taskId: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete task');
      
      // Remove from local state
      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      return true;
    } catch (err) {
      console.error('Error deleting task:', err);
      return false;
    }
  }, []);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    updateTask,
    deleteTask
  };
}

// Helper function (would be moved to a utils file)
async function ensureCsrfToken(): Promise<string> {
  const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  };

  let token = getCookie('_csrf_token');
  if (!token) {
    const res = await fetch('/api/csrf-token', { credentials: 'include' });
    const data = await res.json();
    token = data.csrf_token;
  }
  return token || '';
}
