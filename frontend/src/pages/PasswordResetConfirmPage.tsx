import React, { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppHeader from '../components/AppHeader';

// Helper to read a cookie value by name
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

// Helper to fetch CSRF token if missing
async function ensureCsrfToken(): Promise<string> {
  let token = getCookie('_csrf_token');
  if (!token) {
    const res = await fetch('/api/csrf-token', { credentials: 'include' });
    const data = await res.json();
    token = data.csrf_token;
  }
  return token || '';
}

export default function PasswordResetConfirmPage() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);
  const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  }, []);
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      let csrfToken = getCookie('_csrf_token');
      if (!csrfToken) {
        csrfToken = await ensureCsrfToken();
      }
      const res = await fetch("/api/password-reset/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ token: resetToken, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Password reset failed.");
      } else {
        setError("Password reset successful! Redirecting to login page in 3 seconds...");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [password, confirmPassword, navigate, resetToken]);

  return (
    <div className="min-h-screen flex flex-col phub-main-content">
      <AppHeader />
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md bg-white/95 rounded-xl shadow-2xl p-10 flex flex-col items-center border border-blue-200 backdrop-blur-sm z-10 mt-10 phub-glass">
          <h2 className="text-2xl font-bold mb-6 text-center phub-text-gradient">Set New Password</h2>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-800 shadow-sm animate-fade-in">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" /></svg>
              <span className="font-semibold">{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-4 w-full">
              <label className="block mb-1 font-medium" htmlFor="password">
                New Password
              </label>
              <input
                className="w-full border rounded px-3 py-2"
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={handlePasswordChange}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="mb-6 w-full">
              <label className="block mb-1 font-medium" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <input
                className="w-full border rounded px-3 py-2"
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                required
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              className="phub-action-btn w-full justify-center"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Set New Password"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
