import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Helper to read a cookie value by name
export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

// Helper to fetch CSRF token if missing
export async function ensureCsrfToken(): Promise<string | null> {
  let token = getCookie('csrftoken');
  if (token) return token;
  try {
    const res = await fetch('/api/csrf-token', { method: 'GET', credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.csrf_token || null;
  } catch (err) {
    console.error('Error getting CSRF token:', err);
    return null;
  }
}

// Logout verification helper
export async function verifyLogoutSuccess(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/check', {
      method: 'GET',
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json();
      return !data.authenticated;
    }
    return false;
  } catch (error) {
    console.error('Error verifying logout:', error);
    return false;
  }
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => Promise<boolean>;
  user?: { id: number; username: string; email: string };
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ id: number; username: string; email: string } | undefined>();

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include', // Important for session cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(!!data.authenticated);
        setUser(data.user || undefined);
      } else {
        // If auth check fails, clear everything
        setIsAuthenticated(false);
        setUser(undefined);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUser(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (token: string) => {
    // After successful login, check auth status from server
    checkAuth();
  };

  const logout = async (): Promise<boolean> => {    
    // Clear frontend state FIRST to ensure immediate UI update
    setIsAuthenticated(false);
    setUser(undefined);
    
    try {
      // Get CSRF token for logout request
      const csrfToken = await ensureCsrfToken();
      
      // Then call backend logout to clear server-side session
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
      });
      
      if (response.ok) {        
        // Verify logout was successful
        const logoutVerified = await verifyLogoutSuccess();
        if (logoutVerified) {
          return true;
        } else {
          return false;
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Logout failed with status ${response.status}`);
      }
    } catch (error) {
      // Even if backend logout fails, frontend is already cleared
      // Still verify the actual auth state
      const logoutVerified = await verifyLogoutSuccess();
      return logoutVerified;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      login, 
      logout, 
      user,
      checkAuth 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
