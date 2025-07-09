import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  token?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | undefined>(() => localStorage.getItem("auth_token") || "session");

  useEffect(() => {
    // Listen for changes to localStorage (e.g., in other tabs)
    const handleStorage = () => {
      const storedToken = localStorage.getItem("auth_token");
      setToken(storedToken || undefined);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = (token: string) => {
    setToken(token);
    localStorage.setItem("auth_token", token);
  };

  const logout = () => {
    setToken(undefined);
    localStorage.removeItem("auth_token");
  };

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
