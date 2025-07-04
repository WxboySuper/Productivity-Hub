import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      setLoading(true);
      try {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: form.username,
            email: form.email,
            password: form.password,
          }),
        });
        const data: { error?: string } = await response.json();
        if (!response.ok) {
          setError(data.error || "Registration failed.");
        } else {
          setTimeout(() => {
            navigate("/login");
          }, 3000);
          setForm({ username: "", email: "", password: "", confirmPassword: "" });
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [form, navigate]
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 via-blue-200 to-green-100">
      <AppHeader />
      <main className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white/90 rounded-xl shadow-2xl p-10 flex flex-col items-center border border-blue-200 backdrop-blur-sm z-10 mt-10">
          <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-800 shadow-sm animate-fade-in">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" /></svg>
              <span className="font-semibold">{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1 font-medium" htmlFor="username">
                Username
              </label>
              <input
                className="w-full border rounded px-3 py-2"
                type="text"
                id="username"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                autoComplete="username"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium" htmlFor="email">
                Email
              </label>
              <input
                className="w-full border rounded px-3 py-2"
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
            <div className="mb-4">
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
                autoComplete="new-password"
              />
            </div>
            <div className="mb-6">
              <label className="block mb-1 font-medium" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                className="w-full border rounded px-3 py-2"
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
