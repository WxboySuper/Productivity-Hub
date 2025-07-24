import { render, screen } from '@testing-library/react';
import MainManagementWindow from './MainManagementWindow';
import { describe, it, vi, expect } from 'vitest';
import { AuthContext } from '../../auth';
import { BackgroundProvider } from '../../context/BackgroundContext';
import ToastProvider from '../../components/ToastProvider';

vi.mock('../hooks/useProjects', () => ({
  default: () => ({ projects: [], loading: false, error: null, refetch: vi.fn() })
}));
vi.mock('../hooks/useTasks', () => ({
  default: () => ({ tasks: [], loading: false, error: null, refetch: vi.fn() })
}));
vi.mock('../context/BackgroundContext', () => ({
  useBackground: () => ({ backgroundType: 'default', setBackgroundType: vi.fn() })
}));
vi.mock('../context/ToastProvider', () => ({
  useToast: () => ({ showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn(), showInfo: vi.fn() })
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));
vi.mock('../hooks/useAuth', () => ({
  default: () => ({ logout: vi.fn() })
}));

const mockAuth = {
  isAuthenticated: false,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn()
};

describe('MainManagementWindow empty states', () => {
  it('renders without crashing and shows sidebar', () => {
    render(
      <AuthContext.Provider value={mockAuth}>
        <BackgroundProvider>
          <ToastProvider>
            <MainManagementWindow />
          </ToastProvider>
        </BackgroundProvider>
      </AuthContext.Provider>
    );
    expect(screen.getByLabelText(/sidebar/i)).toBeInTheDocument();
  });
});
