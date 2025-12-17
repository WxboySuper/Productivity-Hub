# 🛡️ Error Handling & User Feedback System

## Overview

The Productivity Hub error handling system provides comprehensive error management, user feedback, and graceful degradation for all application components. It includes React Error Boundaries, Toast notifications, form validation, and API error handling.

## 🎯 Core Components

### 1. ErrorBoundary Component

A React Error Boundary that catches JavaScript errors anywhere in the component tree and displays a fallback UI.

#### Features

- **Error Catching:** Catches errors during rendering, lifecycle methods, and constructors
- **Graceful Fallback:** Displays user-friendly error messages instead of white screen
- **Error Reporting:** Logs detailed error information for debugging
- **Recovery Options:** Provides refresh and navigation options for users

#### Usage

```tsx
<ErrorBoundary fallback={(error, errorInfo) => <CustomErrorUI />}>
  <App />
</ErrorBoundary>
```

#### Implementation

```tsx
interface Props {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: React.ErrorInfo) => ReactNode;
}

class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    // Report to error tracking service in production
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback?.(this.state.error!, this.state.errorInfo!) || (
          <DefaultErrorFallback />
        )
      );
    }
    return this.props.children;
  }
}
```

### 2. Toast Notification System

A comprehensive toast notification system for user feedback with multiple severity levels.

#### Features

- **Multiple Types:** Success, Error, Warning, Info
- **Auto-dismiss:** Configurable timeout for automatic dismissal
- **Manual Dismiss:** Click to dismiss functionality
- **Positioning:** Consistent positioning in top-right corner
- **Animation:** Smooth slide-in/slide-out animations
- **Accessibility:** Screen reader announcements

#### API

```tsx
interface ToastContextType {
  showToast: (toast: Omit<Toast, "id">) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  removeToast: (id: string) => void;
}

// Usage
const { showSuccess, showError } = useToast();

showSuccess("Task created", "Your task has been successfully created");
showError("Failed to save", "Please check your connection and try again");
```

#### Implementation

```tsx
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    if (toast.duration !== 0) {
      setTimeout(() => removeToast(id), toast.duration || 5000);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      showToast,
      showSuccess: (title: string, message?: string) =>
        showToast({ type: "success", title, message }),
      showError: (title: string, message?: string) =>
        showToast({ type: "error", title, message }),
      showWarning: (title: string, message?: string) =>
        showToast({ type: "warning", title, message }),
      showInfo: (title: string, message?: string) =>
        showToast({ type: "info", title, message }),
      removeToast,
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}
```

## 🔍 Error Categories

### 1. Network Errors

#### API Request Failures

```tsx
// Centralized API error handling
async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.error || `HTTP ${response.status}`,
        response.status,
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new NetworkError("Network request failed");
  }
}

class APIError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "APIError";
  }
}

class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}
```

#### Error Handling Patterns

```tsx
// Component-level error handling
function TaskList() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showError } = useToast();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const tasks = await apiRequest<Task[]>("/api/tasks");
      setTasks(tasks);
    } catch (error) {
      const message =
        error instanceof APIError ? error.message : "Failed to load tasks";
      setError(message);
      showError("Load Failed", message);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <ErrorState error={error} onRetry={fetchTasks} />;
  }

  return <TaskListContent />;
}
```

### 2. Form Validation Errors

#### Real-time Validation

```tsx
interface FormErrors {
  [field: string]: string;
}

function useFormValidation<T>(
  initialValues: T,
  validate: (values: T) => FormErrors,
) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback(
    (name: string, value: any) => {
      const fieldErrors = validate({ ...values, [name]: value });
      setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] || "" }));
    },
    [values, validate],
  );

  const handleChange = useCallback(
    (name: string, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      if (touched[name]) {
        validateField(name, value);
      }
    },
    [touched, validateField],
  );

  const handleBlur = useCallback(
    (name: string) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      validateField(name, values[name as keyof T]);
    },
    [values, validateField],
  );

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    isValid: Object.keys(errors).every((key) => !errors[key]),
  };
}
```

#### Field-level Error Display

```tsx
function FormField({ label, name, error, touched, children }: FormFieldProps) {
  const hasError = touched && error;

  return (
    <div className={`phub-field-group ${hasError ? "phub-field-error" : ""}`}>
      <label className="phub-field-label">{label}</label>
      {children}
      {hasError && (
        <div className="phub-error-message" role="alert">
          <Icon name="alert-circle" />
          {error}
        </div>
      )}
    </div>
  );
}
```

### 3. Authentication Errors

#### Session Management

```tsx
function useAuth() {
  const [authError, setAuthError] = useState<string | null>(null);
  const { showError } = useToast();

  const handleAuthError = useCallback(
    (error: Error) => {
      if (error instanceof APIError && error.status === 401) {
        setAuthError("Your session has expired. Please log in again.");
        showError("Session Expired", "Please log in again to continue");
        // Redirect to login
        window.location.href = "/login";
      } else if (error instanceof APIError && error.status === 403) {
        setAuthError("You do not have permission to perform this action.");
        showError(
          "Permission Denied",
          "You do not have permission for this action",
        );
      } else {
        setAuthError("Authentication failed. Please try again.");
        showError("Authentication Error", "Please try logging in again");
      }
    },
    [showError],
  );

  return { authError, handleAuthError };
}
```

#### CSRF Token Errors

```tsx
function useCsrfToken() {
  const [csrfError, setCsrfError] = useState<string | null>(null);
  const { showError } = useToast();

  const handleCsrfError = useCallback(
    (error: Error) => {
      if (error instanceof APIError && error.status === 403) {
        setCsrfError("Security token expired. Please refresh the page.");
        showError("Security Error", "Please refresh the page and try again");
        // Auto-refresh after a delay
        setTimeout(() => window.location.reload(), 3000);
      }
    },
    [showError],
  );

  return { csrfError, handleCsrfError };
}
```

## 🎨 User Interface Patterns

### 1. Error States

#### Inline Errors

```tsx
function InlineError({ message, action }: InlineErrorProps) {
  return (
    <div className="phub-inline-error">
      <Icon name="alert-triangle" className="phub-error-icon" />
      <div className="phub-error-content">
        <p className="phub-error-message">{message}</p>
        {action && (
          <button className="phub-error-action" onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
```

#### Full Page Errors

```tsx
function ErrorPage({
  title = "Something went wrong",
  message = "An unexpected error occurred",
  onRetry,
  showHome = true,
}: ErrorPageProps) {
  return (
    <div className="phub-error-page">
      <div className="phub-error-container">
        <Icon name="alert-circle" className="phub-error-icon-large" />
        <h1 className="phub-error-title">{title}</h1>
        <p className="phub-error-description">{message}</p>
        <div className="phub-error-actions">
          {onRetry && (
            <button className="phub-btn phub-btn-primary" onClick={onRetry}>
              Try Again
            </button>
          )}
          {showHome && (
            <Link to="/" className="phub-btn phub-btn-secondary">
              Go Home
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 2. Loading States

#### Skeleton Loading

```tsx
function SkeletonLoader({ type = "card", count = 1 }: SkeletonProps) {
  return (
    <div className="phub-skeleton-container">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`phub-skeleton phub-skeleton-${type}`}>
          {type === "card" && (
            <>
              <div className="phub-skeleton-header" />
              <div className="phub-skeleton-content">
                <div className="phub-skeleton-line phub-skeleton-line-long" />
                <div className="phub-skeleton-line phub-skeleton-line-medium" />
                <div className="phub-skeleton-line phub-skeleton-line-short" />
              </div>
            </>
          )}
          {type === "list" && (
            <div className="phub-skeleton-list-item">
              <div className="phub-skeleton-circle" />
              <div className="phub-skeleton-text">
                <div className="phub-skeleton-line phub-skeleton-line-medium" />
                <div className="phub-skeleton-line phub-skeleton-line-short" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

#### Spinner Loading

```tsx
function LoadingSpinner({
  size = "medium",
  message,
  overlay = false,
}: LoadingSpinnerProps) {
  const Component = overlay ? "div" : Fragment;
  const overlayProps = overlay ? { className: "phub-loading-overlay" } : {};

  return (
    <Component {...overlayProps}>
      <div className={`phub-loading-spinner phub-loading-spinner-${size}`}>
        <div className="phub-spinner" />
        {message && <p className="phub-loading-message">{message}</p>}
      </div>
    </Component>
  );
}
```

## 📱 Responsive Error Handling

### Mobile-Optimized Errors

```css
/* Mobile error styles */
@media (max-width: 640px) {
  .phub-error-page {
    padding: 1rem;
  }

  .phub-error-title {
    font-size: 1.5rem;
  }

  .phub-error-actions {
    flex-direction: column;
    width: 100%;
  }

  .phub-btn {
    width: 100%;
    margin-bottom: 0.5rem;
  }

  /* Toast adjustments */
  .phub-toast-container {
    left: 0.5rem;
    right: 0.5rem;
    top: 0.5rem;
  }

  .phub-toast {
    width: 100%;
    max-width: none;
  }
}
```

## 🔧 Advanced Features

### 1. Error Retry Logic

#### Exponential Backoff

```tsx
function useRetryableRequest<T>(
  request: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const executeWithRetry = useCallback(async (): Promise<T> => {
    try {
      const result = await request();
      setRetryCount(0);
      return result;
    } catch (error) {
      if (retryCount < maxRetries) {
        setIsRetrying(true);
        const delay = baseDelay * Math.pow(2, retryCount);

        await new Promise((resolve) => setTimeout(resolve, delay));

        setRetryCount((prev) => prev + 1);
        setIsRetrying(false);
        return executeWithRetry();
      }
      throw error;
    }
  }, [request, retryCount, maxRetries, baseDelay]);

  return { executeWithRetry, retryCount, isRetrying };
}
```

### 2. Error Reporting

#### Error Tracking Integration

```tsx
interface ErrorReport {
  error: Error;
  errorInfo?: React.ErrorInfo;
  userAgent: string;
  timestamp: number;
  userId?: string;
  route: string;
  additionalContext?: Record<string, any>;
}

function reportError(errorReport: ErrorReport) {
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry, LogRocket, etc.
    console.error('Error reported:', errorReport);
  } else {
    console.error('Development error:', errorReport);
  }
}

// Enhanced ErrorBoundary with reporting
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  const errorReport: ErrorReport = {
    error,
    errorInfo,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
    route: window.location.pathname,
    additionalContext: {
      buildVersion: process.env.REACT_APP_VERSION,
      environment: process.env.NODE_ENV
    }
  };

  reportError(errorReport);
}
```

## 🧪 Testing Error Handling

### Error Boundary Testing

```tsx
// Test utilities
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
}

// Test cases
describe("ErrorBoundary", () => {
  it("catches and displays errors", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("renders children when no error", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(getByText("No error")).toBeInTheDocument();
  });
});
```

### Toast Testing

```tsx
describe("Toast System", () => {
  it("shows and auto-dismisses toasts", async () => {
    const { getByText, queryByText } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(getByText("Show Toast"));
    expect(getByText("Test message")).toBeInTheDocument();

    await waitFor(
      () => {
        expect(queryByText("Test message")).not.toBeInTheDocument();
      },
      { timeout: 6000 },
    );
  });
});
```

## 📊 Monitoring & Analytics

### Error Metrics

```tsx
interface ErrorMetrics {
  errorCount: number;
  errorRate: number;
  topErrors: Array<{ message: string; count: number }>;
  userAffected: number;
  resolvedErrors: number;
}

function useErrorMetrics(): ErrorMetrics {
  // Implementation would integrate with analytics service
  return {
    errorCount: 0,
    errorRate: 0,
    topErrors: [],
    userAffected: 0,
    resolvedErrors: 0,
  };
}
```

### Performance Impact

```tsx
// Monitor error handling performance
function useErrorPerformance() {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name.includes("error-")) {
          console.log(`Error handling took ${entry.duration}ms`);
        }
      });
    });

    observer.observe({ entryTypes: ["measure"] });

    return () => observer.disconnect();
  }, []);
}
```

## 🚀 Best Practices

### 1. Error Prevention

- **Input Validation:** Validate all user inputs before processing
- **Type Safety:** Use TypeScript for compile-time error prevention
- **API Contracts:** Define clear API contracts and validate responses
- **Defensive Programming:** Handle edge cases and null/undefined values

### 2. User Experience

- **Clear Messaging:** Use user-friendly, actionable error messages
- **Recovery Options:** Always provide ways for users to recover from errors
- **Progressive Enhancement:** Gracefully degrade functionality when errors occur
- **Accessibility:** Ensure error messages are accessible to screen readers

### 3. Developer Experience

- **Error Boundaries:** Implement error boundaries at appropriate component levels
- **Centralized Handling:** Use centralized error handling for consistency
- **Logging:** Log errors with sufficient context for debugging
- **Testing:** Test error scenarios and edge cases thoroughly

### 4. Performance

- **Lazy Loading:** Load error handling components only when needed
- **Debouncing:** Debounce validation to avoid excessive error checking
- **Caching:** Cache error states to avoid repeated error processing
- **Memory Management:** Clean up error handlers and listeners properly
