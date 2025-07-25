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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

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
          setForm({
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
          });
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [form, navigate],
  );

  return (
    <>
      <AppHeader />
      <form
        onSubmit={handleSubmit}
        className="min-h-screen flex flex-col flex-1 items-center justify-center relative z-10 px-4 w-full max-w-lg bg-white/95 rounded-xl shadow-2xl p-10 border border-blue-200 backdrop-blur-sm z-10 mt-10 phub-glass"
      >
        <h2 className="text-2xl font-bold mb-6 text-center phub-text-gradient">
          Register
        </h2>
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-800 shadow-sm animate-fade-in"
          >
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z"
              />
            </svg>
            <span className="font-semibold">{error}</span>
          </div>
        )}
        <div className="mb-4">
          <label className="block mb-1 font-medium" htmlFor="username">
            Username
          </label>
          <input
            className="w-full border rounded px-4 py-3 text-base mt-1"
            type="text"
            id="username"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            autoComplete="username"
            placeholder="Choose a username"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium" htmlFor="email">
            Email
          </label>
          <input
            className="w-full border rounded px-4 py-3 text-base mt-1"
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            placeholder="Enter your email address"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium" htmlFor="password">
            Password
          </label>
          <input
            className="w-full border rounded px-4 py-3 text-base mt-1"
            type="password"
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
            placeholder="Create a secure password"
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1 font-medium" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            className="w-full border rounded px-4 py-3 text-base mt-1"
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
            placeholder="Confirm your password"
          />
        </div>
        <button
          type="submit"
          className="phub-action-btn w-full justify-center mt-6"
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </>
  );
}
