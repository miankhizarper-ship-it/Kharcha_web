import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, isAdminConfigured, verifySessionToken } from "@/lib/analytics/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Analytics Login",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (!isAdminConfigured()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">Dashboard not configured</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Set <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">ANALYTICS_ADMIN_USERNAME</code> and{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">ANALYTICS_ADMIN_PASSWORD</code> (plus{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">MONGODB_URI</code>) in your
            environment or Cloudflare Worker settings, then redeploy.
          </p>
        </div>
      </div>
    );
  }

  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (await verifySessionToken(token)) {
    redirect("/admin/analytics");
  }

  return <LoginForm />;
}
