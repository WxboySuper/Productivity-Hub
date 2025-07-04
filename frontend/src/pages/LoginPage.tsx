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

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
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
        });
        const data: { error?: string; token?: string } = await res.json();
        if (!res.ok) {
          setError(data.error || "Login failed.");
        } else if (!data.token) {
          setError("No authentication token received from server.");
        } else {
          setForm({ usernameOrEmail: "", password: "" });
          login(data.token); // Pass the actual token
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 800);
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [form, navigate, login]
  );

  const handleForgotPassword = useCallback(() => {
    window.location.href = "/password-reset/request";
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 via-blue-200 to-green-100">
      <AppHeader />
      <main className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white/90 rounded-xl shadow-2xl p-10 flex flex-col items-center border border-blue-200 backdrop-blur-sm z-10 mt-10">
          <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-800 shadow-sm animate-fade-in">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" /></svg>
              <span className="font-semibold">{error}</span>
            </div>
          )}
          <div className="mb-4">
            <label className="block mb-1 font-medium" htmlFor="usernameOrEmail">
              Username or Email
            </label>
            <input
              className="w-full border rounded px-3 py-2"
              type="text"
              id="usernameOrEmail"
              name="usernameOrEmail"
              value={form.usernameOrEmail}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>
          <div className="mb-6">
            <label className="block mb-1 font-medium" htmlFor="password">
              Password
            </label>
            <input
              className="w-full border rounded px-3 py-2"
              type="password"
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition mb-2"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          <button
            type="button"
            className="w-full bg-gray-100 text-blue-700 font-semibold py-2 rounded hover:bg-blue-200 transition mb-2"
            onClick={handleForgotPassword}
          >
            Forgot password?
          </button>
        </div>
      </main>
    </div>
  );
}
