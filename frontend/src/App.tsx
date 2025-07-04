import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import PasswordResetRequestPage from './pages/PasswordResetRequestPage';
import PasswordResetConfirmPage from './pages/PasswordResetConfirmPage';
import HomePage from './pages/HomePage';
import DashboardPlaceholderPage from './pages/DashboardPlaceholderPage';
import { AuthProvider, useAuth } from './auth';

// Simple placeholder components
function NotFound() {
  return <div className="text-2xl font-bold text-center mt-10 text-red-600">404 - Page Not Found</div>;
}

// Simple error boundary
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(/*error: unknown*/) {
    return { hasError: true };
  }
  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // You can log error info here
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-2xl font-bold text-center mt-10 text-red-600">Something went wrong.</div>;
    }
    return this.props.children;
  }
}

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <DashboardPlaceholderPage /> : <HomePage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/password-reset/request" element={<PublicRoute><PasswordResetRequestPage /></PublicRoute>} />
      <Route path="/password-reset/confirm" element={<PublicRoute><PasswordResetConfirmPage /></PublicRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
