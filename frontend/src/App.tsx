import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import PasswordResetRequestPage from './pages/PasswordResetRequestPage';
import PasswordResetConfirmPage from './pages/PasswordResetConfirmPage';
import HomePage from './pages/HomePage';
import MainManagementWindow from './pages/MainManagementWindow';
import { useAuth } from './auth';
import NotificationCenter from './components/NotificationCenter';
import Background from './components/Background';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/ToastProvider';
import { BackgroundProvider, useBackground } from './context/BackgroundContext';

// Simple placeholder components
function NotFound() {
  return <div className="text-2xl font-bold text-center mt-10 text-red-600">404 - Page Not Found</div>;
}

function PublicRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <MainManagementWindow /> : <HomePage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/password-reset/request" element={<PublicRoute><PasswordResetRequestPage /></PublicRoute>} />
      <Route path="/password-reset/confirm" element={<PublicRoute><PasswordResetConfirmPage /></PublicRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AppContent() {
  const { backgroundType } = useBackground();
  
  return (
    <ErrorBoundary>
      <Background 
        backgroundType={backgroundType} 
      />
      <div className="content-overlay">
        <Router>
          <NotificationCenter />
          <AppRoutes />
        </Router>
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BackgroundProvider>
          <AppContent />
        </BackgroundProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
