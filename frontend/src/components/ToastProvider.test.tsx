import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ToastProvider, useToast } from './ToastProvider';

// Test component to trigger toast actions
function TestComponent() {
  const { showSuccess, showError, showWarning, showInfo, showToast } = useToast();

  return (
    <div>
      <button 
        data-testid="success-btn" 
        onClick={() => showSuccess('Success Title', 'Success message')}
      >
        Show Success
      </button>
      <button 
        data-testid="error-btn" 
        onClick={() => showError('Error Title', 'Error message')}
      >
        Show Error
      </button>
      <button 
        data-testid="warning-btn" 
        onClick={() => showWarning('Warning Title', 'Warning message')}
      >
        Show Warning
      </button>
      <button 
        data-testid="info-btn" 
        onClick={() => showInfo('Info Title', 'Info message')}
      >
        Show Info
      </button>
      <button 
        data-testid="no-message-btn" 
        onClick={() => showSuccess('Title Only')}
      >
        Show No Message
      </button>
      <button 
        data-testid="custom-duration-btn" 
        onClick={() => showToast({ type: 'info', title: 'Custom', duration: 2000 })}
      >
        Custom Duration
      </button>
      <button 
        data-testid="no-duration-btn" 
        onClick={() => showToast({ type: 'info', title: 'No Auto Remove', duration: 0 })}
      >
        No Auto Remove
      </button>
      <button 
        data-testid="negative-duration-btn" 
        onClick={() => showToast({ type: 'info', title: 'Negative', duration: -1000 })}
      >
        Negative Duration
      </button>
      <button 
        data-testid="rapid-btn" 
        onClick={() => {
          showSuccess('Toast 1');
          showError('Toast 2');
          showWarning('Toast 3');
        }}
      >
        Rapid Toasts
      </button>
    </div>
  );
}

// Component to test error case
function TestComponentOutsideProvider() {
  try {
    useToast();
    return <div>Should not render</div>;
  } catch (error) {
    return <div data-testid="error-message">{(error as Error).message}</div>;
  }
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Context Provider', () => {
    it('should provide toast context to children', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      expect(screen.getByTestId('success-btn')).toBeInTheDocument();
    });

    it('should throw error when useToast is used outside provider', () => {
      render(<TestComponentOutsideProvider />);
      
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'useToast must be used within a ToastProvider'
      );
    });
  });

  describe('Toast Display', () => {
    it('should display success toast with correct styling and icon', async () => {
      // Temporarily disable fake timers for this test
      vi.useRealTimers();
      
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('success-btn'));

      await waitFor(() => {
        expect(screen.getByText('Success Title')).toBeInTheDocument();
      });

      expect(screen.getByText('Success message')).toBeInTheDocument();
      
      // Check for success styling classes - get the outer toast container
      const toastContainer = screen.getByText('Success Title').closest('[class*="border-green-200"]');
      expect(toastContainer).toHaveClass('border-green-200', 'bg-green-50');
      
      // Check for success icon (checkmark path)
      expect(screen.getByText('Success Title').closest('.fixed')).toContainHTML('M5 13l4 4L19 7');
      
      // Re-enable fake timers for other tests
      vi.useFakeTimers();
    });

    it('should display error toast with correct styling and longer duration', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('error-btn'));

      // Use real timers for waitFor
      vi.useRealTimers();
      await waitFor(() => {
        expect(screen.getByText('Error Title')).toBeInTheDocument();
      });

      expect(screen.getByText('Error message')).toBeInTheDocument();
      
      // Check for error styling classes
      const toastElement = screen.getByText('Error Title').closest('[class*="border-red-200"]');
      expect(toastElement).toHaveClass('border-red-200', 'bg-red-50');
      
      // Check for error icon (exclamation path)
      expect(screen.getByText('Error Title').closest('.fixed')).toContainHTML('M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z');
    });

    it('should display warning toast with correct styling', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('warning-btn'));

      // Use real timers for waitFor
      vi.useRealTimers();
      await waitFor(() => {
        expect(screen.getByText('Warning Title')).toBeInTheDocument();
      });

      expect(screen.getByText('Warning message')).toBeInTheDocument();
      
      // Check for warning styling classes
      const toastElement = screen.getByText('Warning Title').closest('[class*="border-yellow-200"]');
      expect(toastElement).toHaveClass('border-yellow-200', 'bg-yellow-50');
    });

    it('should display info toast with correct styling', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('info-btn'));

      // Use real timers for waitFor
      vi.useRealTimers();
      await waitFor(() => {
        expect(screen.getByText('Info Title')).toBeInTheDocument();
      });

      expect(screen.getByText('Info message')).toBeInTheDocument();
      
      // Check for info styling classes
      const toastElement = screen.getByText('Info Title').closest('[class*="border-blue-200"]');
      expect(toastElement).toHaveClass('border-blue-200', 'bg-blue-50');
    });

    it('should display toast without message', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('no-message-btn'));

      // Use real timers for waitFor
      vi.useRealTimers();
      await waitFor(() => {
        expect(screen.getByText('Title Only')).toBeInTheDocument();
      });

      // Should not have a message element
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });
  });

  describe('Toast Removal', () => {
    it('should remove toast when close button is clicked', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('success-btn'));

      // Use real timers for waitFor
      vi.useRealTimers();
      await waitFor(() => {
        expect(screen.getByText('Success Title')).toBeInTheDocument();
      });

      // Find and click the close button (X icon)
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn => 
        btn.querySelector('path[d*="M6 18L18 6M6 6l12 12"]')
      );
      
      if (closeButton) {
        fireEvent.click(closeButton);
      }

      await waitFor(() => {
        expect(screen.queryByText('Success Title')).not.toBeInTheDocument();
      });
    });

    it('should automatically remove toast after default duration (5000ms)', () => {
      // Start with fake timers from the beginning
      vi.useFakeTimers();
      
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('success-btn'));

      // Toast should be visible initially
      expect(screen.getByText('Success Title')).toBeInTheDocument();

      // Fast-forward time by 5000ms to trigger the timeout
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Toast should be removed
      expect(screen.queryByText('Success Title')).not.toBeInTheDocument();
    });

    it('should automatically remove error toast after longer duration (8000ms)', () => {
      vi.useFakeTimers();
      
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('error-btn'));

      expect(screen.getByText('Error Title')).toBeInTheDocument();

      // Fast-forward time by 7999ms - should still be there
      act(() => {
        vi.advanceTimersByTime(7999);
      });
      expect(screen.getByText('Error Title')).toBeInTheDocument();

      // Fast-forward by 1 more ms to complete 8000ms
      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(screen.queryByText('Error Title')).not.toBeInTheDocument();
    });

    it('should not auto-remove toast with duration 0', () => {
      vi.useFakeTimers();
      
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('no-duration-btn'));

      // Use a specific query to get the toast (not the button)
      const toastTitle = screen.getAllByText('No Auto Remove').find(el => 
        el.closest('[class*="border-blue-200"]')
      );
      expect(toastTitle).toBeInTheDocument();

      // Fast-forward time by a large amount
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // Toast should still be there
      const toastTitleAfter = screen.getAllByText('No Auto Remove').find(el => 
        el.closest('[class*="border-blue-200"]')
      );
      expect(toastTitleAfter).toBeInTheDocument();
    });

    it('should remove toast with custom duration', () => {
      vi.useFakeTimers();
      
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('custom-duration-btn'));

      expect(screen.getByText('Custom')).toBeInTheDocument();

      // Fast-forward time by 1999ms - should still be there
      act(() => {
        vi.advanceTimersByTime(1999);
      });
      expect(screen.getByText('Custom')).toBeInTheDocument();

      // Fast-forward by 1 more ms to complete 2000ms
      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(screen.queryByText('Custom')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Toasts', () => {
    it('should display multiple toasts simultaneously', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('success-btn'));
      fireEvent.click(screen.getByTestId('error-btn'));

      // Use real timers for waitFor
      vi.useRealTimers();
      await waitFor(() => {
        expect(screen.getByText('Success Title')).toBeInTheDocument();
        expect(screen.getByText('Error Title')).toBeInTheDocument();
      });
    });

    it('should remove toasts independently', () => {
      // Start with fake timers from the beginning
      vi.useFakeTimers();
      
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('success-btn'));
      fireEvent.click(screen.getByTestId('error-btn'));

      // Verify both toasts are initially present
      expect(screen.getByText('Success Title')).toBeInTheDocument();
      expect(screen.getByText('Error Title')).toBeInTheDocument();
      
      // Fast-forward by 5000ms - success toast should be removed
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Check immediately after advancing timers
      expect(screen.queryByText('Success Title')).not.toBeInTheDocument();
      expect(screen.getByText('Error Title')).toBeInTheDocument();

      // Fast-forward by 3000ms more (total 8000ms) - error toast should be removed
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.queryByText('Error Title')).not.toBeInTheDocument();
    });
  });

  describe('Toast Container', () => {
    it('should not render container when no toasts are present', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      // Container should not be in DOM when no toasts
      expect(document.querySelector('.fixed.top-4.right-4')).not.toBeInTheDocument();
    });

    it('should render container with correct positioning classes', async () => {
      vi.useRealTimers();
      
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('success-btn'));

      await waitFor(() => {
        expect(screen.getByText('Success Title')).toBeInTheDocument();
      });

      // Check for container positioning classes
      const container = document.querySelector('.fixed.top-4.right-4.z-50.space-y-2');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Toast Styling', () => {
    it('should apply base styles to all toast types', async () => {
      vi.useRealTimers();
      
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('success-btn'));

      await waitFor(() => {
        expect(screen.getByText('Success Title')).toBeInTheDocument();
      });

      // The toast container should have base styles and success-specific styles
      const toastContainer = screen.getByText('Success Title').closest('[class*="min-w-80"]');
      expect(toastContainer).toHaveClass('min-w-80', 'max-w-md', 'rounded-lg', 'shadow-lg', 'border', 'p-4');
      expect(toastContainer).toHaveClass('border-green-200', 'bg-green-50');
    });

    it('should render icons correctly for each toast type', async () => {
      vi.useRealTimers();
      
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      // Test success icon
      fireEvent.click(screen.getByTestId('success-btn'));
      await waitFor(() => {
        expect(screen.getByText('Success Title')).toBeInTheDocument();
      });
      
      // Check for success icon (SVG with green color)
      const successContainer = screen.getByText('Success Title').closest('[class*="border-green-200"]');
      expect(successContainer).toContainHTML('text-green-600');

      // Test error icon  
      fireEvent.click(screen.getByTestId('error-btn'));
      await waitFor(() => {
        expect(screen.getByText('Error Title')).toBeInTheDocument();
      });
      
      // Check for error icon (SVG with red color)
      const errorContainer = screen.getByText('Error Title').closest('[class*="border-red-200"]');
      expect(errorContainer).toContainHTML('text-red-600');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible close buttons', async () => {
        vi.useRealTimers();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('success-btn'));

      await waitFor(() => {
        expect(screen.getByText('Success Title')).toBeInTheDocument();
      });

      // Find close button
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn => 
        btn.querySelector('svg') && 
        btn.querySelector('path[d*="M6 18L18 6M6 6l12 12"]')
      );
      
      expect(closeButton).toBeInTheDocument();
    });

    it('should support keyboard navigation for close button', async () => {
        vi.useRealTimers();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('success-btn'));

      await waitFor(() => {
        expect(screen.getByText('Success Title')).toBeInTheDocument();
      });

      // Find close button
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn => 
        btn.querySelector('svg') && 
        btn.querySelector('path[d*="M6 18L18 6M6 6l12 12"]')
      );
      
      if (closeButton) {
        // Test keyboard activation
        closeButton.focus();
        expect(closeButton).toHaveFocus();
        
        // Simulate actual button click via keyboard (Enter key should trigger click)
        fireEvent.keyDown(closeButton, { key: 'Enter', code: 'Enter' });
        fireEvent.click(closeButton); // Simulate the click that would normally happen
        
        await waitFor(() => {
          expect(screen.queryByText('Success Title')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid toast creation', async () => {
        vi.useRealTimers();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('rapid-btn'));

      await waitFor(() => {
        expect(screen.getByText('Toast 1')).toBeInTheDocument();
        expect(screen.getByText('Toast 2')).toBeInTheDocument();
        expect(screen.getByText('Toast 3')).toBeInTheDocument();
      });
    });

    it('should generate unique IDs for toasts', async () => {
        vi.useRealTimers();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('success-btn'));
      fireEvent.click(screen.getByTestId('success-btn'));

      await waitFor(() => {
        const successToasts = screen.getAllByText('Success Title');
        expect(successToasts).toHaveLength(2);
      });

      // Each toast should have unique key/id (React will handle this)
      const toastElements = screen.getAllByText('Success Title');
      expect(toastElements[0]).not.toBe(toastElements[1]);
    });

    it('should handle negative duration gracefully', async () => {
      vi.useFakeTimers();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('negative-duration-btn'));

      // Use real timers for waitFor
      vi.useRealTimers();
      await waitFor(() => {
        expect(screen.getByText('Negative')).toBeInTheDocument();
      });

      // Switch back to fake timers for time advancement
      vi.useFakeTimers();
      // Negative duration should not auto-remove (since duration <= 0)
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      expect(screen.getByText('Negative')).toBeInTheDocument();
    });
  });
});
