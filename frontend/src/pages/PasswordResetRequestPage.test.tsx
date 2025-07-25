import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PasswordResetRequestPage from './PasswordResetRequestPage';

// Mock AppHeader component
vi.mock('../components/AppHeader', () => ({
  default: () => <div data-testid="app-header">App Header</div>
}));

// Mock fetch
global.fetch = vi.fn();

const mockFetch = vi.mocked(fetch);

// Mock document.cookie
const mockCookie = vi.fn();
Object.defineProperty(document, 'cookie', {
  get: mockCookie,
  set: vi.fn(),
});

const PasswordResetRequestPageWrapper = () => (
  <BrowserRouter>
    <PasswordResetRequestPage />
  </BrowserRouter>
);

describe('PasswordResetRequestPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    mockCookie.mockReturnValue('');
  });

  describe('Component Rendering', () => {
    it('renders password reset request form', () => {
      render(<PasswordResetRequestPageWrapper />);
      
      expect(screen.getByTestId('app-header')).toBeInTheDocument();
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    it('renders with proper form structure', () => {
      render(<PasswordResetRequestPageWrapper />);
      
      const form = screen.getByRole('button', { name: /send reset link/i }).closest('form');
      expect(form).toBeInTheDocument();
      
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('autocomplete', 'email');
    });

    it('applies correct CSS classes and styling', () => {
      const { container } = render(<PasswordResetRequestPageWrapper />);
      
      expect(container.querySelector('.phub-main-content')).toBeInTheDocument();
      expect(container.querySelector('.phub-glass')).toBeInTheDocument();
      expect(container.querySelector('.phub-text-gradient')).toBeInTheDocument();
      expect(container.querySelector('.phub-action-btn')).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('allows user to input email', () => {
      render(<PasswordResetRequestPageWrapper />);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('validates email field as required', () => {
      render(<PasswordResetRequestPageWrapper />);
      
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeRequired();
    });

    it('handles form submission with valid email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Reset email sent' }),
      } as Response);

      render(<PasswordResetRequestPageWrapper />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/password-reset/request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email: 'user@example.com' }),
        });
      });
    });
  });

  describe('Success State Handling', () => {
    it('displays success message on successful submission', async () => {
      // Mock CSRF token fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: 'test-csrf-token' }),
      } as Response);
      
      // Mock password reset request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Reset email sent' }),
      } as Response);

      render(<PasswordResetRequestPageWrapper />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/If an account with that email exists, a password reset link has been sent/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('clears email field after successful submission', async () => {
      // Mock CSRF token fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: 'test-csrf-token' }),
      } as Response);
      
      // Mock password reset request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Reset email sent' }),
      } as Response);

      render(<PasswordResetRequestPageWrapper />);
      
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/If an account with that email exists, a password reset link has been sent/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      await waitFor(() => {
        expect(emailInput.value).toBe('');
      }, { timeout: 1000 });
    });

    it('shows success message with proper styling', async () => {
      // Mock CSRF token fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: 'test-csrf-token' }),
      } as Response);
      
      // Mock password reset request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Reset email sent' }),
      } as Response);

      render(<PasswordResetRequestPageWrapper />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const successMessage = screen.getByText(/If an account with that email exists, a password reset link has been sent/i);
    const successDiv = successMessage.closest('div');
    expect(successDiv).toHaveClass('border-green-300', 'bg-green-50', 'text-green-800');
      }, { timeout: 3000 });
    });
  });

  describe('Error State Handling', () => {
    it('displays server error message on API failure', async () => {
      // Mock CSRF token fetch (exactly like success tests)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: 'test-csrf-token' }),
      } as Response);
      
      // Mock password reset request with server error
      mockFetch.mockResolvedValueOnce({
        ok: false,  // Server error response
        json: () => Promise.resolve({ error: 'Email not found' }),
      } as Response);

      render(<PasswordResetRequestPageWrapper />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      fireEvent.change(emailInput, { target: { value: 'notfound@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email not found')).toBeInTheDocument();
      });
    });

    it('displays generic error message when server returns no specific error', async () => {
      // Mock CSRF token fetch (exactly like success tests)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: 'test-csrf-token' }),
      } as Response);
      
      // Mock password reset request with server error but no error field
      mockFetch.mockResolvedValueOnce({
        ok: false,  // Server error response
        json: () => Promise.resolve({}), // No error field
      } as Response);

      render(<PasswordResetRequestPageWrapper />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to send password reset email.')).toBeInTheDocument();
      });
    });

    it('displays network error message when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<PasswordResetRequestPageWrapper />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument();
      });
    });

    it('shows error message with proper styling', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<PasswordResetRequestPageWrapper />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/network error/i);
    const errorDiv = errorMessage.closest('div');
    expect(errorDiv).toHaveClass('border-red-300', 'bg-red-50', 'text-red-800');
      });
    });

    it('clears previous error when form is resubmitted', async () => {
      // First submission fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<PasswordResetRequestPageWrapper />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument();
      });

      // Second submission succeeds
      // Mock CSRF token fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: 'test-csrf-token' }),
      } as Response);
      
      // Mock password reset request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Reset email sent' }),
      } as Response);

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Network error. Please try again.')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      await waitFor(() => {
        expect(screen.getByText(/If an account with that email exists, a password reset link has been sent/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Loading State', () => {
    it('shows loading state during form submission', async () => {
      // Create a promise that won't resolve immediately
      let resolvePromise: ((value: Response) => void) | undefined;
      const pendingPromise = new Promise<Response>(resolve => {
        resolvePromise = resolve;
      });
      
      mockFetch.mockReturnValueOnce(pendingPromise as Promise<Response>);

      render(<PasswordResetRequestPageWrapper />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      // Check loading state
      expect(screen.getByRole('button', { name: /sending.../i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sending.../i })).toBeDisabled();

      // Resolve the promise to cleanup
      if (resolvePromise) {
        resolvePromise({
          ok: true,
          json: () => Promise.resolve({ message: 'Reset email sent' }),
        } as Response);
      }

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
      });
    });

    it('disables submit button during loading', () => {
      let resolvePromise: ((value: Response) => void) | undefined;
      const pendingPromise = new Promise<Response>(resolve => {
        resolvePromise = resolve;
      });
      
      mockFetch.mockReturnValueOnce(pendingPromise as Promise<Response>);

      render(<PasswordResetRequestPageWrapper />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      const loadingButton = screen.getByRole('button', { name: /sending.../i });
      expect(loadingButton).toBeDisabled();

      // Cleanup
      if (resolvePromise) {
        resolvePromise({
          ok: true,
          json: () => Promise.resolve({ message: 'Reset email sent' }),
        } as Response);
      }
    });
  });

  describe('CSRF Token Handling', () => {
    it('includes CSRF token in request when available in cookies', async () => {
      mockCookie.mockReturnValue('_csrf_token=test-csrf-token');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Reset email sent' }),
      } as Response);

      render(<PasswordResetRequestPageWrapper />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/password-reset/request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': 'test-csrf-token',
          },
          credentials: 'include',
          body: JSON.stringify({ email: 'user@example.com' }),
        });
      });
    });

    it('fetches CSRF token when not available in cookies', async () => {
      mockCookie.mockReturnValue('');
      
      // Mock CSRF token fetch
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'fetched-csrf-token' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: 'Reset email sent' }),
        } as Response);

      render(<PasswordResetRequestPageWrapper />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/csrf-token', { credentials: 'include' });
        expect(mockFetch).toHaveBeenCalledWith('/api/password-reset/request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': 'fetched-csrf-token',
          },
          credentials: 'include',
          body: JSON.stringify({ email: 'user@example.com' }),
        });
      });
    });

    it('handles missing CSRF token in response gracefully', async () => {
      mockCookie.mockReturnValue('');
      
      // Mock CSRF token fetch without csrf_token field
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}), // No csrf_token field
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: 'Reset email sent' }),
        } as Response);

      render(<PasswordResetRequestPageWrapper />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/csrf-token', { credentials: 'include' });
        expect(mockFetch).toHaveBeenCalledWith('/api/password-reset/request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Should handle missing CSRF token gracefully
          },
          credentials: 'include',
          body: JSON.stringify({ email: 'user@example.com' }),
        });
      });
    });

    it('properly assigns fetched CSRF token when available', async () => {
      mockCookie.mockReturnValue('');
      
      // Mock CSRF token fetch WITH csrf_token field to hit the assignment line
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ csrf_token: 'fetched-token-123' }), // Has csrf_token field
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: 'Reset email sent' }),
        } as Response);

      render(<PasswordResetRequestPageWrapper />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/csrf-token', { credentials: 'include' });
        expect(mockFetch).toHaveBeenCalledWith('/api/password-reset/request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': 'fetched-token-123',
          },
          credentials: 'include',
          body: JSON.stringify({ email: 'user@example.com' }),
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and associations', () => {
      render(<PasswordResetRequestPageWrapper />);
      
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('id', 'email');
      
      const label = screen.getByText('Email');
      expect(label).toHaveAttribute('for', 'email');
    });

    it('provides appropriate button states for screen readers', () => {
      render(<PasswordResetRequestPageWrapper />);
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
      expect(submitButton).not.toBeDisabled();
    });

    it('includes proper error message accessibility', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<PasswordResetRequestPageWrapper />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/network error/i);
        expect(errorMessage).toBeInTheDocument();
        // Error message should be visible and properly styled for accessibility
        const errorDiv = errorMessage.closest('div');
        expect(errorDiv).toHaveClass('text-red-800');
      });
    });
  });

  describe('Layout and Styling', () => {
    it('uses proper responsive layout classes', () => {
      const { container } = render(<PasswordResetRequestPageWrapper />);
      
      expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
      expect(container.querySelector('.flex-1')).toBeInTheDocument();
      expect(container.querySelector('.max-w-md')).toBeInTheDocument();
    });

    it('applies glass morphism effect correctly', () => {
      const { container } = render(<PasswordResetRequestPageWrapper />);
      
      const glassContainer = container.querySelector('.phub-glass');
      expect(glassContainer).toBeInTheDocument();
      expect(glassContainer).toHaveClass('bg-white/95', 'backdrop-blur-sm');
    });

    it('positions form elements correctly', () => {
      const { container } = render(<PasswordResetRequestPageWrapper />);
      
      const form = container.querySelector('form');
      expect(form).toHaveClass('w-full');
      
      const submitButton = container.querySelector('.phub-action-btn');
      expect(submitButton).toHaveClass('w-full', 'justify-center');
    });
  });
});
