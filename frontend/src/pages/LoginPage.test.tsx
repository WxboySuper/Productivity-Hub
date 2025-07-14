import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../auth';
import LoginPage from './LoginPage';

// Mock fetch
global.fetch = vi.fn();

const mockFetch = vi.mocked(fetch);

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const LoginPageWrapper = () => (
  <BrowserRouter>
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  </BrowserRouter>
);

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  it('renders login form', () => {
    render(<LoginPageWrapper />);
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /forgot password/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => ({ message: 'Login successful' }),
    } as unknown as Response);

    render(<LoginPageWrapper />);
    
    fireEvent.change(screen.getByLabelText(/username or email/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'TestPass123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/login', 
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'testuser',
            password: 'TestPass123!',
          }),
          credentials: 'include',
        })
      );
    });
  });

  it('displays error on login failure', async () => {
    // Mock a proper fetch rejection with bad response
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<LoginPageWrapper />);
    
    fireEvent.change(screen.getByLabelText(/username or email/i), {
      target: { value: 'wronguser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument();
    });
  });

  it('validates required fields', () => {
    render(<LoginPageWrapper />);
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // HTML5 validation will prevent form submission for required fields
    // Just verify the fields are marked as required
    expect(screen.getByLabelText(/username or email/i)).toBeRequired();
    expect(screen.getByLabelText(/password/i)).toBeRequired();
  });
});
