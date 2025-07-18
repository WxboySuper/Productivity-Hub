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
  
  // Setup fetch mock with more comprehensive responses
  global.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
    const method = options?.method || 'GET';
    
    if (url === '/api/csrf-token') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ csrf_token: 'mock-csrf-token' }),
      } as Response);
    }
    
    if (url === '/api/projects' && method === 'GET') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ projects: mockProjectData }),
      } as Response);
    }
    
    if (url === '/api/projects' && method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          id: 2, 
          name: 'New Project', 
          description: 'New project description' 
        }),
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
    
    if (url === '/api/tasks') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ tasks: mockTaskData }),
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

describe('MainManagementWindow - Project Management', () => {
  describe('Project Update Functionality', () => {
    it('handles project update successfully', async () => {
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

      // Click edit button on the project
      await act(async () => {
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);
      });

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
      });

      // Fill in updated project details
      const nameInput = screen.getByRole('textbox', { name: /name/i });
      const descriptionInput = screen.getByRole('textbox', { name: /description/i });

      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Updated Project' } });
        fireEvent.change(descriptionInput, { target: { value: 'Updated description' } });
      });

      // Submit the form
      await act(async () => {
        const submitButton = screen.getByRole('button', { name: /update/i });
        fireEvent.click(submitButton);
      });

      // Verify API was called with correct data
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/projects/1',
          expect.objectContaining({
            method: 'PUT',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'X-CSRF-Token': 'mock-csrf-token',
            }),
            body: JSON.stringify({
              name: 'Updated Project',
              description: 'Updated description',
            }),
          })
        );
      });
    });

    it('handles project update error', async () => {
      // Mock fetch to return error for PUT request
      global.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
        const method = options?.method || 'GET';
        
        if (url === '/api/csrf-token') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrf_token: 'mock-csrf-token' }),
          } as Response);
        }
        
        if (url === '/api/projects' && method === 'GET') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: mockProjectData }),
          } as Response);
        }
        
        if (url.match(/\/api\/projects\/\d+/) && method === 'PUT') {
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

      // Navigate to projects view
      await act(async () => {
        const projectsButton = screen.getByText('Projects');
        fireEvent.click(projectsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Click edit button
      await act(async () => {
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);
      });

      // Wait for form and fill it
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
      });

      const nameInput = screen.getByRole('textbox', { name: /name/i });
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Updated Project' } });
      });

      // Submit the form
      await act(async () => {
        const submitButton = screen.getByRole('button', { name: /update/i });
        fireEvent.click(submitButton);
      });

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
      });
    });
  });

  describe('Project Deletion Functionality', () => {
    it('handles project deletion successfully', async () => {
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

      // Click delete button
      await act(async () => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });

      // Wait for confirmation dialog
      await waitFor(() => {
        expect(screen.getByText('Delete Project?')).toBeInTheDocument();
      });

      // Confirm deletion
      await act(async () => {
        const confirmButtons = screen.getAllByRole('button', { name: /delete/i });
        const dialogConfirmButton = confirmButtons.find(btn => btn.textContent?.includes('🗑️'));
        fireEvent.click(dialogConfirmButton || confirmButtons[confirmButtons.length - 1]);
      });

      // Verify API was called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/projects/1',
          expect.objectContaining({
            method: 'DELETE',
            headers: expect.objectContaining({
              'X-CSRF-Token': 'mock-csrf-token',
            }),
          })
        );
      });
    });

    it('handles project deletion error', async () => {
      // Mock fetch to return error for DELETE request
      global.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
        const method = options?.method || 'GET';
        
        if (url === '/api/csrf-token') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrf_token: 'mock-csrf-token' }),
          } as Response);
        }
        
        if (url === '/api/projects' && method === 'GET') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: mockProjectData }),
          } as Response);
        }
        
        if (url.match(/\/api\/projects\/\d+/) && method === 'DELETE') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Deletion failed' }),
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

      // Navigate to projects view
      await act(async () => {
        const projectsButton = screen.getByText('Projects');
        fireEvent.click(projectsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Click delete button
      await act(async () => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });

      // Wait for confirmation dialog
      await waitFor(() => {
        expect(screen.getByText('Delete Project?')).toBeInTheDocument();
      });

      // Confirm deletion
      await act(async () => {
        const confirmButtons = screen.getAllByRole('button', { name: /delete/i });
        const dialogConfirmButton = confirmButtons.find(btn => btn.textContent?.includes('🗑️'));
        fireEvent.click(dialogConfirmButton || confirmButtons[confirmButtons.length - 1]);
      });

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText('Deletion failed')).toBeInTheDocument();
      });
    });

    it('handles cancel deletion', async () => {
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

      // Click delete button
      await act(async () => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });

      // Wait for confirmation dialog
      await waitFor(() => {
        expect(screen.getByText('Delete Project?')).toBeInTheDocument();
      });

      // Cancel deletion
      await act(async () => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButton);
      });

      // Verify dialog is closed and no deletion occurred
      await waitFor(() => {
        expect(screen.queryByText('Delete Project?')).not.toBeInTheDocument();
      });

      // Verify no DELETE request was made
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/projects\/\d+/),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});