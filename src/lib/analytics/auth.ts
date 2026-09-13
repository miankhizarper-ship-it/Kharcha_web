/**
 * Admin session auth for the private analytics dashboard.
 *
 * - Credentials come from env (ANALYTICS_ADMIN_USERNAME / _PASSWORD) — never
 *   hard-coded. When unset, the whole admin area is disabled.
 * - Session = signed, expiring cookie: `<expiry>.<HMAC-SHA256(secret, exp)>`.
 *   HttpOnly + SameSite=Lax (+ Secure on https). No database, no JWT libs —
 *   Web Crypto only, so the exact same code runs on Node and Cloudflare
 *   Workers (nodejs_compat).
 * - All comparisons are constant-time over SHA-256 digests (no length or
 *   timing leaks).
 */

const globalStore = globalThis as typeof globalThis & {
  __kharchaSessionKeyBytes?: Uint8Array;
};

export const ADMIN_COOKIE = "kharcha_admin";
/** Admin session lifetime: 12 hours. */
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return bytesToHex(new Uint8Array(digest));
}

async function hmacHex(keyBytes: Uint8Array, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes as unknown as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return bytesToHex(new Uint8Array(sig));
}

async function getSessionKeyBytes(): Promise<Uint8Array> {
  globalStore.__kharchaSessionKeyBytes ??= await (async () => {
    const explicit = process.env.ANALYTICS_SESSION_SECRET?.trim();
    const base =
      explicit ||
      `${adminUsername()}:${adminPassword()}`; // derived fallback when no explicit secret
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`kharcha-admin:${base}`),
    );
    return new Uint8Array(digest);
  })();
  return globalStore.__kharchaSessionKeyBytes;
}

function adminUsername(): string {
  return process.env.ANALYTICS_ADMIN_USERNAME?.trim() ?? "";
}

function adminPassword(): string {
  return process.env.ANALYTICS_ADMIN_PASSWORD?.trim() ?? "";
}

/** True when dashboard credentials are configured — safe to expose. */
export function isAdminConfigured(): boolean {
  return adminUsername().length > 0 && adminPassword().length > 0;
}

/** Constant-time credential check. */
export async function verifyAdminCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  const [givenUser, expectedUser] = await Promise.all([
    sha256Hex(`u:${username}`),
    sha256Hex(`u:${adminUsername()}`),
  ]);
  const [givenPass, expectedPass] = await Promise.all([
    sha256Hex(`p:${password}`),
    sha256Hex(`p:${adminPassword()}`),
  ]);
  return constantTimeEqualHex(givenUser, expectedUser) && constantTimeEqualHex(givenPass, expectedPass);
}

/** `<expiryMs>.<hmac>` signed session token. */
export async function createSessionToken(now = Date.now()): Promise<string> {
  const exp = now + SESSION_TTL_MS;
  const sig = await hmacHex(await getSessionKeyBytes(), `admin:${exp}`);
  return `${exp}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp <= Date.now()) return false;
  const expected = await hmacHex(await getSessionKeyBytes(), `admin:${expStr}`);
  return constantTimeEqualHex(sig, expected);
}

/** Full Set-Cookie header value for a fresh admin session. */
export function sessionSetCookie(token: string, secure: boolean): string {
  return [
    `${ADMIN_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : "",
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ]
    .filter(Boolean)
    .join("; ");
}

/** Set-Cookie header value that clears the admin session. */
export function sessionClearCookie(): string {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
