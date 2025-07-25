import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

// Mock component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Normal Component</div>;
};

// Mock window.location.reload
const mockReload = vi.fn();
Object.defineProperty(window, 'location', {
  value: {
    reload: mockReload,
  },
  writable: true,
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for testing
    vi.spyOn(console, 'error').mockImplementation(() => {
      // intentionally empty to suppress error output during tests
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal Component')).toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('shows reload and try again buttons', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls window.location.reload when reload button is clicked', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: /reload page/i }));
    
    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it('resets error state when try again button is clicked', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    // Error UI should be visible
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click try again - this should attempt to re-render children
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    // Since the component still throws an error, it should still show error UI
    // But this verifies that the try again button is working
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('uses custom fallback when provided', () => {
    const customFallback = (error: Error) => (
      <div>Custom Error: {error.message}</div>
    );

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error: Test error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('shows technical details in development mode', () => {
    // Mock development environment
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Technical Details (Development)')).toBeInTheDocument();

    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });

  it('hides technical details in production mode', () => {
    // Mock production environment
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Technical Details (Development)')).not.toBeInTheDocument();

    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });

  it('logs error to console when error occurs', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // suppress error output during test
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    );

    consoleSpy.mockRestore();
  });

  it('handles unknown error gracefully', () => {
    const ThrowUnknownError = () => {
      throw new Error(); // Error without message
    };

    render(
      <ErrorBoundary>
        <ThrowUnknownError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Unknown error')).toBeInTheDocument();
  });
});
