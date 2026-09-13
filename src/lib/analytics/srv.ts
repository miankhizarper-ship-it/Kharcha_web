/**
 * DNS SRV resolution for `mongodb+srv://` URIs — implemented over
 * DNS-over-HTTPS (fetch), NOT the driver's DNS resolver.
 *
 * WHY THIS EXISTS: the Workers runtime (workerd) does not implement the DNS
 * SRV/TXT lookups the MongoDB driver needs for `mongodb+srv://` strings —
 * the driver's lookup promise may NEVER settle there, which hung the whole
 * Worker in production ("code had hung and would never generate a response").
 *
 * `fetch()` works fine in Workers, so we resolve the SRV + TXT records
 * ourselves against public DoH endpoints (Cloudflare 1.1.1.1 first, Google
 * as fallback) and rewrite the URI into the standard seed-list form:
 *
 *   mongodb+srv://user:pass@cluster0.abc12.mongodb.net/db?retryWrites=true
 *     → mongodb://user:pass@h1:27017,h2:27017,h3:27017/db?retryWrites=true
 *        &replicaSet=atlas-abc12-shard-0&authSource=admin&tls=true
 *
 * SECURITY: the seed list is rebuilt from UNTRUSTED DNS answers and spliced
 * into a URI that carries credentials. Every host, port and TXT parameter is
 * therefore validated against a strict allowlist BEFORE it is inserted — a
 * hostile DNS answer can never inject `@`, `/`, `?` or `&` into the result.
 *
 * All failures throw quickly (hard-capped) — callers degrade gracefully.
 */

export interface SrvResolution {
  /** Standard `mongodb://` seed-list URI ready for the driver. */
  seedUri: string;
  /** Number of validated seed hosts (diagnostics only). */
  hosts: number;
  /** Milliseconds the resolution took (diagnostics only). */
  tookMs: number;
}

const DOH_ENDPOINTS = [
  "https://cloudflare-dns.com/dns-query",
  "https://dns.google/resolve",
] as const;

/** Hard cap for the whole DoH exchange — SRV resolution must never become
 * the thing that hangs a request again. */
export const SRV_HARD_TIMEOUT_MS = 5_000;

/** Resolved seed lists are cached per isolate for 10 minutes (DoH answers
 * carry their own TTLs; this is deliberately coarser — cluster topology is
 * stable and one lookup per 10 min is negligible). */
const CACHE_TTL_MS = 10 * 60_000;

// ── strict validators (DNS answers are untrusted input) ──────────────────────

const HOSTNAME_RE =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+\.?$/;

/** TXT parameters we are willing to forward to the driver. */
const TXT_PARAM_KEYS = new Set(["authSource", "replicaSet", "loadBalanced"]);
const TXT_VALUE_RE = /^[A-Za-z0-9._-]{1,128}$/;

function isValidHostname(host: string): boolean {
  return HOSTNAME_RE.test(host);
}

// ── DoH plumbing ─────────────────────────────────────────────────────────────

interface DohAnswer {
  name?: string;
  type?: number;
  /** SRV: "priority weight port target" · TXT: the character-string(s). */
  data?: string;
}

const SRV_RECORD_TYPE = 33;
const TXT_RECORD_TYPE = 16;

function raceTimeout<T>(task: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    task.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

async function dohQuery(name: string, type: "SRV" | "TXT"): Promise<DohAnswer[]> {
  const recordType = type === "SRV" ? SRV_RECORD_TYPE : TXT_RECORD_TYPE;
  let lastError: unknown = new Error("no DoH endpoint attempted");

  for (const endpoint of DOH_ENDPOINTS) {
    try {
      const url = `${endpoint}?name=${encodeURIComponent(name)}&type=${type}`;
      const res = await raceTimeout(
        fetch(url, {
          headers: { accept: "application/dns-json" },
          // DoH responses must never be cached by the edge for longer than
          // the answer's own DNS TTL — we cache above anyway.
          cache: "no-store",
        }),
        SRV_HARD_TIMEOUT_MS,
        `DoH ${type} ${name}`,
      );
      if (!res.ok) throw new Error(`DoH HTTP ${res.status}`);
      const json: unknown = await res.json();
      const answers = (json as { Answer?: DohAnswer[] } | null)?.Answer;
      if (!Array.isArray(answers)) return [];
      // Keep only records of the requested type (DoH answers can mix CNAMEs).
      return answers.filter((a) => a && a.type === recordType && typeof a.data === "string");
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(
    `DoH ${type} lookup failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

// ── record parsing ───────────────────────────────────────────────────────────

/** "10 10 27017 host.to.strip." → { host, port } or null when malformed. */
function parseSrvRecord(data: string): { host: string; port: number } | null {
  const parts = data.trim().split(/\s+/);
  if (parts.length !== 4) return null;
  const port = Number(parts[2]);
  const host = parts[3].replace(/\.+$/, "");
  if (!/^\d{1,5}$/.test(parts[2]) || port < 1 || port > 65_535) return null;
  if (!isValidHostname(host)) return null;
  return { host, port };
}

/** Strip DoH quoting and split a TXT record into `key=value` pairs. */
function parseTxtParams(data: string): [string, string][] {
  const text = data.replace(/^"+|"+$/g, "").trim();
  if (!text.includes("=")) return [];
  const params: [string, string][] = [];
  for (const pair of text.split("&")) {
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const key = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (!TXT_PARAM_KEYS.has(key) || !TXT_VALUE_RE.test(value)) continue;
    params.push([key, value]);
  }
  return params;
}

// ── URI rewriting ────────────────────────────────────────────────────────────

export function isSrvUri(uri: string): boolean {
  return /^mongodb\+srv:\/\//i.test(uri.trim());
}

/**
 * Resolve a `mongodb+srv://` URI into a standard seed-list URI.
 * Throws (quickly) on ANY failure — callers must degrade gracefully.
 */
export async function resolveSrvUri(rawUri: string): Promise<SrvResolution> {
  const started = Date.now();
  const cached = srvCache.get(rawUri);
  if (cached && cached.expires > Date.now()) {
    return { ...cached.value, tookMs: Date.now() - started };
  }

  const result = await raceTimeout(
    resolveUncached(rawUri),
    SRV_HARD_TIMEOUT_MS,
    "SRV resolution",
  );
  srvCache.set(rawUri, { expires: Date.now() + CACHE_TTL_MS, value: result });
  return { ...result, tookMs: Date.now() - started };
}

const MAX_SEED_HOSTS = 8;

async function resolveUncached(rawUri: string): Promise<SrvResolution> {
  const started = Date.now();
  const uri = rawUri.trim();

  // mongodb+srv://[userinfo@]hostname[/path][?params]
  const withoutScheme = uri.replace(/^mongodb\+srv:\/\//i, "");
  const slash = withoutScheme.indexOf("/");
  const authority = slash === -1 ? withoutScheme : withoutScheme.slice(0, slash);
  const rest = slash === -1 ? "" : withoutScheme.slice(slash); // "/db?params"
  if (!authority) throw new Error("SRV URI has no hostname");

  const at = authority.lastIndexOf("@");
  const userinfo = at === -1 ? "" : authority.slice(0, at + 1); // includes "@"
  const hostname = (at === -1 ? authority : authority.slice(at + 1)).trim();

  if (!isValidHostname(hostname)) {
    throw new Error("SRV URI hostname is invalid");
  }

  const [srvAnswers, txtAnswers] = await Promise.all([
    dohQuery(`_mongodb._tcp.${hostname}`, "SRV"),
    dohQuery(hostname, "TXT"),
  ]);

  const seeds = new Map<string, number>();
  for (const answer of srvAnswers) {
    const record = parseSrvRecord(answer.data ?? "");
    if (record && seeds.size < MAX_SEED_HOSTS) seeds.set(record.host, record.port);
  }
  if (seeds.size === 0) {
    throw new Error("SRV lookup returned no valid MongoDB hosts");
  }

  // TXT parameters (Atlas publishes authSource=admin & replicaSet=… there).
  const txtParams: [string, string][] = [];
  for (const answer of txtAnswers) {
    txtParams.push(...parseTxtParams(answer.data ?? ""));
  }

  // Original query params are preserved verbatim; TXT params are appended
  // only for keys the user did not set; TLS is implied by the SRV scheme.
  const originalQuery = rest.includes("?") ? rest.slice(rest.indexOf("?") + 1) : "";
  const path = originalQuery ? rest.slice(0, rest.indexOf("?")) : rest;
  const setKeys = new Set(
    originalQuery
      .split("&")
      .filter(Boolean)
      .map((p) => p.split("=")[0].toLowerCase()),
  );

  const queryParts = originalQuery ? [originalQuery] : [];
  for (const [key, value] of txtParams) {
    if (!setKeys.has(key.toLowerCase())) queryParts.push(`${key}=${value}`);
  }
  if (!setKeys.has("tls") && !setKeys.has("ssl")) queryParts.push("tls=true");

  const seedList = Array.from(seeds.entries())
    .map(([host, port]) => `${host}:${port}`)
    .join(",");

  const query = queryParts.length ? `?${queryParts.join("&")}` : "";
  return {
    seedUri: `mongodb://${userinfo}${seedList}${path}${query}`,
    hosts: seeds.size,
    tookMs: Date.now() - started,
  };
}

const srvCache = new Map<string, { expires: number; value: SrvResolution }>();
