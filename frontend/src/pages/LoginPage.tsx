import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import AppHeader from '../components/AppHeader';

export default function LoginPage() {
  const [form, setForm] = useState({
    usernameOrEmail: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);
  const handleForgotPassword = useCallback(() => {
    navigate("/password-reset/request");
  }, [navigate]);
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.usernameOrEmail,
          password: form.password,
        }),
        credentials: "include", // <-- ensure cookies are sent/received
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
      } else {
        setForm({ usernameOrEmail: "", password: "" });
        login("session"); // Use a dummy value to mark as logged in
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 800);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [form, login, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
        <div className="w-full max-w-lg bg-white/95 rounded-xl shadow-2xl p-10 flex flex-col items-center border border-blue-200 backdrop-blur-sm z-10 mt-10 phub-glass">
          <h2 className="text-2xl font-bold mb-6 text-center phub-text-gradient">Login</h2>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-800 shadow-sm animate-fade-in">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" /></svg>
              <span className="font-semibold">{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1 font-medium" htmlFor="usernameOrEmail">
                Username or Email
              </label>
              <input
                className="w-full border rounded px-4 py-3 text-base"
                type="text"
                id="usernameOrEmail"
                name="usernameOrEmail"
                value={form.usernameOrEmail}
                onChange={handleChange}
                required
                autoComplete="username"
                placeholder="Enter your username or email"
              />
            </div>
            <div className="mb-6">
              <label className="block mb-1 font-medium" htmlFor="password">
                Password
              </label>
              <input
                className="w-full border rounded px-4 py-3 text-base"
                type="password"
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              className="phub-action-btn w-full mb-4 justify-center"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
            <button
              type="button"
              className="w-full bg-gray-100 text-blue-700 font-semibold py-3 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
