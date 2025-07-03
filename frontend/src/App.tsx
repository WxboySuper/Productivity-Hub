import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import RegisterPage from './pages/RegisterPage';

// Simple placeholder components
function Home() {
  return <div className="text-2xl font-bold text-center mt-10">Home Page</div>;
}
function Login() {
  return <div className="text-2xl font-bold text-center mt-10">Login Page</div>;
}
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

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
