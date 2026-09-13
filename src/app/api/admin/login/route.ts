import { NextResponse } from "next/server";
import {
  createSessionToken,
  isAdminConfigured,
  sessionSetCookie,
  verifyAdminCredentials,
} from "@/lib/analytics/auth";
import { RATE_LIMITS, rateLimit } from "@/lib/analytics/rate-limit";
import { anonymizeIp } from "@/lib/analytics/server-utils";

/**
 * POST /api/admin/login — dashboard sign-in.
 * Credentials verified against env in constant time; on success sets a
 * signed HttpOnly session cookie. Generic error messages only; attempts are
 * rate-limited per anonymized client.
 */
export async function POST(request: Request) {
  try {
    if (!isAdminConfigured()) {
      return NextResponse.json(
        { error: "Dashboard is not configured" },
        { status: 503 },
      );
    }

    const ipHash = anonymizeIp(request);
    if (!rateLimit(`login:${ipHash}`, RATE_LIMITS.login.limit, RATE_LIMITS.login.windowMs).allowed) {
      return NextResponse.json({ error: "Too many attempts. Try later." }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    const username = typeof body?.username === "string" ? body.username.slice(0, 128) : "";
    const password = typeof body?.password === "string" ? body.password.slice(0, 256) : "";
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    if (!(await verifyAdminCredentials(username, password))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createSessionToken();
    const secure = new URL(request.url).protocol === "https:";
    const response = NextResponse.json({ ok: true });
    response.headers.append("Set-Cookie", sessionSetCookie(token, secure));
    return response;
  } catch {
    return NextResponse.json({ error: "Sign-in failed" }, { status: 500 });
  }
}
