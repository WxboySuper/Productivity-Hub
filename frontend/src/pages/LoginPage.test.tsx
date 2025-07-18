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
    // Mock the auth check that happens in AuthProvider
    mockFetch.mockImplementation((url) => {
      if (url === '/api/auth/check') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ authenticated: false }),
        } as Response);
      }
      return Promise.reject(new Error('Unmocked fetch call'));
    });
  });

  it('renders login form', () => {
    render(<LoginPageWrapper />);
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /forgot password/i })).toBeInTheDocument();
  });

  it('shows fallback error message when login fails without error property', async () => {
      mockFetch.mockImplementation((url) => {
        if (url === '/api/auth/check') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ authenticated: false }),
          } as Response);
        }
        if (url === '/api/login') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({}), // No error property
          } as Response);
        }
        return Promise.reject(new Error('Unmocked fetch call'));
      });

      render(<LoginPageWrapper />);
      fireEvent.change(screen.getByLabelText(/username or email/i), {
        target: { value: 'wronguser' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpass' },
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Login failed.')).toBeInTheDocument();
      });
    });

  it('handles successful login', async () => {
    // Mock auth check first
    mockFetch.mockImplementation((url) => {
      if (url === '/api/auth/check') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ authenticated: false }),
        } as Response);
      }
      if (url === '/api/login') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Login successful' }),
        } as Response);
      }
      return Promise.reject(new Error('Unmocked fetch call'));
    });

    render(<LoginPageWrapper />);
    
    const usernameInput = screen.getByLabelText(/username or email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(usernameInput, {
      target: { value: 'testuser' },
    });
    fireEvent.change(passwordInput, {
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

    // Wait for success flow to complete - form should be cleared
    await waitFor(() => {
      expect(usernameInput).toHaveValue('');
      expect(passwordInput).toHaveValue('');
    }, { timeout: 2000 }); // Increase timeout for form clearing
    
    // Wait a bit longer for navigation to be called
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    }, { timeout: 2000 });
  });

  it('displays error on login failure', async () => {
    // Mock auth check and network error
    mockFetch.mockImplementation((url) => {
      if (url === '/api/auth/check') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ authenticated: false }),
        } as Response);
      }
      if (url === '/api/login') {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.reject(new Error('Unmocked fetch call'));
    });

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

  it('handles forgot password button click', () => {
    render(<LoginPageWrapper />);
    
    fireEvent.click(screen.getByRole('button', { name: /forgot password/i }));
    
    expect(mockNavigate).toHaveBeenCalledWith('/password-reset/request');
  });

  it('handles login API error properly', async () => {
    // Mock auth check and login API error
    mockFetch.mockImplementation((url) => {
      if (url === '/api/auth/check') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ authenticated: false }),
        } as Response);
      }
      if (url === '/api/login') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Invalid credentials' }),
        } as Response);
      }
      return Promise.reject(new Error('Unmocked fetch call'));
    });

    render(<LoginPageWrapper />);
    
    fireEvent.change(screen.getByLabelText(/username or email/i), {
      target: { value: 'wronguser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('handles basic form submission flow', () => {
    // Test basic form interaction without complex API mocking
    render(<LoginPageWrapper />);
    
    const usernameInput = screen.getByLabelText(/username or email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'TestPass123!' } });
    
    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('TestPass123!');
  });
});
