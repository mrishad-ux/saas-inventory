"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@rishart.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Login failed");
        return;
      }

      // Store token for client-side API calls
      localStorage.setItem("token", data.data.token);

      // Redirect based on role
      const role = data.data.user.role;
      if (role === "admin") router.push("/");
      else if (role === "manager") router.push("/inventory-daily");
      else if (role === "accounts") router.push("/sales");
      else router.push("/");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-700/50 bg-slate-800/50 p-8 shadow-2xl backdrop-blur-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-lg">
            S
          </div>
          <h1 className="text-xl font-bold text-slate-100">SAAS Inventory</h1>
          <p className="mt-1 text-sm text-slate-400">
            Lord Of Wraps — Restaurant Management
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              placeholder="admin@rishart.com"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-700/50 pt-5 text-center">
          <p className="mb-3 text-xs text-slate-500">Demo credentials</p>
          <div className="space-y-1 text-xs text-slate-500">
            <p>admin@rishart.com / admin123</p>
            <p>manager@rishart.com / manager123</p>
            <p>accounts@rishart.com / accounts123</p>
          </div>
        </div>
      </div>
    </div>
  );
}