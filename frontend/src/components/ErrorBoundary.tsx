import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: React.ErrorInfo) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
    this.handleReload = this.handleReload.bind(this);
    this.handleTryAgain = this.handleTryAgain.bind(this);
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload() {
    // referencing this to satisfy linter
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this; // skipcq: JS-0093
    window.location.reload();
  }

  handleTryAgain() {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(
          this.state.error,
          this.state.errorInfo || { componentStack: "" },
        );
      }

      return (
        <section className="min-h-screen flex items-center justify-center max-w-md w-full bg-white rounded-lg shadow-lg p-6 border border-red-200">
          <header className="flex items-center mb-4">
            <span className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Something went wrong
              </h2>
              <p className="text-sm text-gray-600">
                An unexpected error occurred
              </p>
            </div>
          </header>

          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-sm text-red-800 font-medium">
              {this.state.error?.message || "Unknown error"}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={this.handleReload}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
            <button
              onClick={this.handleTryAgain}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Try Again
            </button>
          </div>

          {process.env.NODE_ENV === "development" && this.state.errorInfo && (
            <details className="mt-4">
              <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                Technical Details (Development)
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
                <div className="text-red-600 font-bold mb-2">Error:</div>
                <div className="mb-2">{this.state.error?.stack}</div>
                <div className="text-red-600 font-bold mb-2">
                  Component Stack:
                </div>
                <div>{this.state.errorInfo.componentStack}</div>
              </div>
            </details>
          )}
        </section>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
