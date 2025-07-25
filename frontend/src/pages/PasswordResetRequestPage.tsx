import { useState, useCallback } from "react";
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

export default function PasswordResetRequestPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);
      setLoading(true);
      try {
        let csrfToken = getCookie('_csrf_token');
        if (!csrfToken) {
          csrfToken = await ensureCsrfToken();
        }
        const res = await fetch("/api/password-reset/request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
          },
          credentials: 'include', // Ensure cookies (CSRF token) are sent
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to send password reset email.");
        } else {
          setSuccess(
            "If an account with that email exists, a password reset link has been sent. Please check your inbox."
          );
          setEmail("");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [email]
  );

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  return (
    <>
      <AppHeader />
      <main className="min-h-screen flex flex-col flex-1 px-4 phub-main-content items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white/95 rounded-xl shadow-2xl p-10 border border-blue-200 backdrop-blur-sm z-10 mt-10 phub-glass"
        >
          <h2 className="text-2xl font-bold mb-6 text-center phub-text-gradient">Reset Password</h2>
          {error && <div role="alert" className="mb-4 flex items-center gap-2 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-800 shadow-sm animate-fade-in">
            <svg className="w-5 h-5 text-red-500 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" /></svg>
            <span className="font-semibold">{error}</span>
          </div>}
          {success && <div role="alert" className="mb-4 flex items-center gap-2 rounded border border-green-300 bg-green-50 px-4 py-3 text-green-800 shadow-sm animate-fade-in">
            <svg className="w-5 h-5 text-green-500 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            <span className="font-semibold">{success}</span>
          </div>}
          <label className="block mb-1 font-medium mb-6" htmlFor="email">
            Email
            <input
              className="w-full border rounded px-3 py-2 mt-1"
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleEmailChange}
              required
              autoComplete="email"
            />
          </label>
          <button
            type="submit"
            className="phub-action-btn w-full justify-center"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </main>
    </>
  );
}
