import { vi } from 'vitest';

// Common mock data
export const mockProjectData = [
  { id: 1, name: 'Test Project', description: 'Test project description' }
];

export const mockTaskData = [
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
];

// Setup global fetch mock
export const setupFetchMock = () => {
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
        json: () => Promise.resolve({ projects: mockProjectData }),
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
};

// Mock auth object
export const mockAuth = {
  isAuthenticated: true,
  isLoading: false,
  user: { id: 1, username: 'testuser', email: 'test@example.com' },
  login: vi.fn(),
  logout: vi.fn().mockResolvedValue(true),
  checkAuth: vi.fn(),
};

// Mock background context
export const mockBackgroundContext = {
  backgroundType: 'creative-dots',
  setBackgroundType: vi.fn(),
};

// Mock toast context
export const mockToastContext = {
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
};

// Mock navigate function
export const mockNavigate = vi.fn();

// Common beforeEach cleanup
export const setupBeforeEach = () => {
  const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
  mockFetch?.mockClear();
  mockAuth.logout.mockClear();
  mockBackgroundContext.setBackgroundType.mockClear();
  mockToastContext.showSuccess.mockClear();
  mockToastContext.showError.mockClear();
  mockToastContext.showWarning.mockClear();
  mockToastContext.showInfo.mockClear();
  mockNavigate.mockClear();
};