import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Check localStorage for auth state on mount
    const token = localStorage.getItem("auth_token");
    setIsAuthenticated(Boolean(token));
  }, []);

  const login = (token: string) => {
    setIsAuthenticated(true);
    localStorage.setItem("auth_token", token); // Use actual token
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("auth_token");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
