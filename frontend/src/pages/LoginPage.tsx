import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function LoginPage() {
  const [form, setForm] = useState({
    usernameOrEmail: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setSuccess(false);
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
        const data: { error?: string } = await res.json();
        if (!res.ok) {
          setError(data.error || "Login failed.");
        } else {
          setSuccess(true);
          setForm({ usernameOrEmail: "", password: "" });
          login();
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        className="w-full max-w-md p-8 bg-white rounded shadow-md"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-800 shadow-sm animate-fade-in">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" /></svg>
            <span className="font-semibold">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded border border-green-300 bg-green-50 px-4 py-3 text-green-800 shadow-sm animate-fade-in">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            <span className="font-semibold">Login successful!</span>
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
      </form>
    </div>
  );
}
