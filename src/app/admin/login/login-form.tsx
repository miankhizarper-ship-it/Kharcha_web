"use client";

import { BarChart3, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

/**
 * Minimal, dependency-free sign-in form for the private analytics dashboard.
 * Credentials go to POST /api/admin/login and are verified against env
 * server-side; success sets an HttpOnly signed cookie.
 */
export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        router.replace("/admin/analytics");
        router.refresh();
        return;
      }
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Sign-in failed. Try again.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-700 text-white shadow-lg shadow-brand-700/25">
            <BarChart3 className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
            Kharcha Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Private dashboard — owner access only</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <label htmlFor="admin-username" className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Username
          </label>
          <input
            id="admin-username"
            name="username"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />

          <label htmlFor="admin-password" className="mt-4 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Password
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />

          {error ? (
            <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-700 text-sm font-medium text-white shadow-lg shadow-brand-700/25 transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <ShieldCheck className="size-4" aria-hidden="true" />
            )}
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
