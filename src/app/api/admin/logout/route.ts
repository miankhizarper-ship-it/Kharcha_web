import { NextResponse } from "next/server";
import { sessionClearCookie } from "@/lib/analytics/auth";

/** POST /api/admin/logout — clears the admin session cookie and returns to
 * the login screen (form-post friendly). */
export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url), { status: 303 });
  response.headers.append("Set-Cookie", sessionClearCookie());
  return response;
}
