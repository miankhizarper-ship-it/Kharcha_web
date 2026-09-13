# Kharcha — Landing Page

Marketing site for the **Kharcha** offline-first expense tracker Android app,
with a built-in anonymous analytics system (MongoDB) for the download funnel.

Pages: **/** (hero, live app preview, features, why-Kharcha, how-it-works,
download CTA), **/about**, **/contact** (developer details), **/privacy**,
**/terms**, a themed 404 — plus the private analytics dashboard at
**/admin/analytics** (login-gated).

Fully self-contained frontend: no environment variables are needed to render
the site itself. The analytics backend needs the MongoDB + admin credentials
listed below; without them the site still works — tracking simply stays off.

## Analytics at a glance

Funnel measured: **Visitor → page_view → download_click → APK download**.

- **POST /api/analytics** — single ingestion endpoint (sendBeacon from the
  client, `fetch keepalive` fallback). Strict payload validation (zod),
  2 KB cap, per-client rate limiting, bot filtering. Failures are always
  silent for the visitor — the download never waits on analytics.
- **Anonymous visitor id** — a random UUID in localStorage (`kharcha_vid`)
  plus a per-session id (`kharcha_sid`). No cookies, no fingerprinting, no
  accounts. Do Not Track is respected.
- **What is stored** — page path, referrer HOST only (never full URLs),
  coarse device class / browser family / OS family (parsed server-side from
  the User-Agent), optional 2-letter country (Cloudflare edge header) and
  timestamps. Raw IP addresses are **never persisted** (momentarily hashed
  for rate-limit buckets only). No names, emails, or form data — ever.
- **Events** — `page_view`, `download_click`, `github_click`,
  `external_link_click` (schema has a flat `meta` map, ready for more).
- **MongoDB collections**
  - `analytics_visits` — one doc per session: entry path, referrer host,
    device snapshot, country, first/last seen, pageview counter.
  - `analytics_events` — one doc per tracked event.
  - `app_releases` — one doc per Android release for the mobile app's
    in-app update system (highest `versionCode` with `enabled: true` wins).
  - Indexes (auto-created on first write): `ts`, `name+ts`, `visitorId+ts`,
    `path`, unique `visitorId+sessionId`; optional TTL when
    `ANALYTICS_RETENTION_DAYS` is set.
- **Dashboard `/admin/analytics`** — private, session-cookie gated
  (credentials from env, signed HMAC cookie, constant-time compares).
  Shows totals (sessions / unique visitors / page views / download clicks),
  **download conversion rate = download clicks ÷ unique visitors**, daily
  traffic series, and device / browser / OS / referrer / top-page breakdowns
  with Today / 7d / 30d / All-time filters. All numbers come from MongoDB
  aggregation pipelines (no raw documents are ever loaded).

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | for analytics | MongoDB Atlas connection string (server-side only) |
| `MONGODB_DATABASE` | no (default `kharcha_analytics`) | database name |
| `ANALYTICS_ADMIN_USERNAME` | for dashboard | dashboard login username |
| `ANALYTICS_ADMIN_PASSWORD` | for dashboard | dashboard login password |
| `ANALYTICS_SESSION_SECRET` | recommended | signs the admin session cookie |
| `ANALYTICS_IP_SALT` | optional | extra salt for the ephemeral IP hash |
| `ANALYTICS_RETENTION_DAYS` | optional | auto-delete data older than N days (TTL) |
| `APP_LATEST_VERSION` | optional | latest version string (e.g. `1.1.0`) — in-app update **and** website buttons |
| `APP_LATEST_VERSION_CODE` | optional | latest Android versionCode (e.g. `2`) |
| `APP_LATEST_APK_URL` | optional | DIRECT https download URL of the APK — drives the in-app updater **and** every website download button; Drive share pages and GitHub `blob` links are auto-converted to direct URLs |
| `APP_RELEASE_NOTES` | optional | in-app update: JSON array of release-note strings |
| `APP_UPDATE_MANDATORY` | optional | in-app update: `true` makes the update dialog non-dismissable |
| `APP_RELEASE_SOURCE` | optional | `environment` or `database` — forces the release source |

Never commit real secrets (`.env` / `.dev.vars` are git-ignored; only the
`.example` files are shipped). Without these variables the site renders and
the APK downloads exactly the same — analytics just stays disabled.

## Quickstart (local dev)

Requires Node.js 20.9+ (or Bun) and a MongoDB Atlas cluster (free M0 works).

```bash
npm install
cp .env.example .env        # fill in MONGODB_URI + admin credentials
npm run dev                 # http://localhost:3000
```

Open the site, click around, then sign in at <http://localhost:3000/admin/login>
and open **/admin/analytics** to watch live data.

Production builds:

```bash
npm run build               # Cloudflare Worker bundle (.next + .open-next/)
npm run build:next          # plain Next.js build (other hosts)
```

## Light / dark theme

The site ships with a **light + dark theme and a toggle in the navbar**
(`next-themes`, class strategy, system preference by default, no flash on
load — the choice is persisted in localStorage). Both palettes live in
`src/app/globals.css` (`:root` for light, `.dark` for dark). The scrollbar is
themed to match in both modes.

## Deploy — Cloudflare Workers (recommended)

The site runs on a Worker via the OpenNext adapter (static assets + server
functions in one Worker; MongoDB is reached at runtime with the
`nodejs_compat` flag — supported by the MongoDB Node driver 6.12+).

**1. MongoDB Atlas**
- Create a free cluster (M0), a database user, and note the connection string
  (`mongodb+srv://user:pass@cluster0.xxx.mongodb.net/...`).
- Network Access → add **0.0.0.0/0** (Workers egress from dynamic IPs).
- Both `mongodb+srv://` and standard `mongodb://` strings are supported. The
  Workers runtime cannot perform the driver's own DNS SRV lookups, so this
  project resolves `mongodb+srv://` seeds itself over DNS-over-HTTPS (see
  `src/lib/analytics/srv.ts`, cached 10 min per isolate). If DoH egress is
  ever unavailable in your environment, switch to the **standard** string —
  Atlas → Connect → Driver → Node (choose an older driver version to reveal
  it):
  `mongodb://user:pass@cluster0-shard-00-00.xxx.mongodb.net:27017,cluster0-shard-00-01.xxx.mongodb.net:27017,cluster0-shard-00-02.xxx.mongodb.net:27017/<db>?ssl=true&replicaSet=atlas-xxx-shard-0&authSource=admin&retryWrites=true&w=majority`
- **Never-hang guarantee**: every database step (connection + every read/write)
  is raced against a hard ~8 s timer. A slow or unreachable database degrades
  to an amber banner on the dashboard and a silent 503 on the ingestion
  endpoint — the Worker can never again be cancelled for "hung" code, and a
  timed-out client is evicted so the next request starts fresh.

**2. Deploy the Worker**

Option A — CLI:
```bash
npm install
npx opennextjs-cloudflare build
npx opennextjs-cloudflare deploy
```
(Wrangler prompts you to log in on first use; `npm run deploy` does both.)

Option B — dashboard Git integration (Workers Builds):
- **Build command:** `npm run build` (default) — this repo's `build` script
  runs `next build` and then the OpenNext Worker bundling, so `.open-next/`
  is produced. `npx opennextjs-cloudflare build` works too.
- **Deploy command:** `npx wrangler deploy` (auto-detects OpenNext; or
  `npx opennextjs-cloudflare deploy` — both are equivalent)

> ⚠️ **The one thing the build command must do is produce `.open-next/`.**
> A build command that only runs plain `next build` leaves `.open-next/`
> missing and the deploy step fails with *"Could not find compiled Open
> Next config, did you run the build command?"*. With THIS package.json,
> `npm run build` builds Next in standalone mode (that is what the
> OpenNext bundler consumes) and then compiles the Worker, so the
> dashboard default already produces the Worker bundle. (`build:next` is
> the plain Next build for other hosts, e.g. Netlify.) Two things NOT to
> do: never point the `build` script DIRECTLY at `opennextjs-cloudflare
> build` (it invokes `npm run build` internally → infinite recursion), and
> never drop the `NEXT_PRIVATE_STANDALONE=true` prefix (the bundler needs
> `.next/standalone/`). The env prefix needs a POSIX shell — fine on
> Cloudflare/Netlify/Linux/macOS; on Windows use WSL or run the two steps
> separately.

**3. Set the variables** in Cloudflare Dashboard → Workers → kharcha-web →
Settings → **Variables and Secrets** → make sure the **Production** tab is
selected (workers.dev traffic serves Production, not Preview). Use type
Secret for anything sensitive:

| Name | Example |
| --- | --- |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority` |
| `MONGODB_DATABASE` | `kharcha_analytics` |
| `ANALYTICS_ADMIN_USERNAME` | your admin username |
| `ANALYTICS_ADMIN_PASSWORD` | a long random password |
| `ANALYTICS_SESSION_SECRET` | a long random string |

**4. Redeploy** (bindings only reach deployments created AFTER they are
saved), then verify:

```bash
open https://<your-worker>.workers.dev/
# Diagnostic: which bindings does the RUNNING deployment actually see?
open https://<your-worker>.workers.dev/api/admin/env-check
# The `mongodb` block in the response shows the URI's SHAPE (scheme, seed
# host count — never the value) plus a LIVE classified ping:
#   reachability: ok | timeout | auth-failed | network-unreachable | error
#                 | unconfigured
# That single field tells you whether the database is reachable, whether the
# credentials work, or whether Atlas Network Access is blocking Workers
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://<your-worker>.workers.dev/api/analytics \
  -H "Content-Type: application/json" \
  -A "Mozilla/5.0 (Windows NT 10.0) Chrome/126 Safari/537.36" \
  -d '{"type":"pageview","path":"/","visitorId":"verify-test-01","sessionId":"verify-test-01"}'
# → 204, and the visit shows up in /admin/analytics
```

If `/api/admin/env-check` reports a binding as `missing` although the
dashboard shows it: (a) redeploy — the current deployment predates the
secret; (b) confirm the secret is on THIS worker (name must match the
workers.dev subdomain); (c) confirm it is on the **Production** tab,
not Preview.

Local Worker-mode preview (uses `.dev.vars`): `cp .dev.vars.example .dev.vars`
then `npm run preview`.

## Deploy — Netlify

The Next runtime is auto-detected; `netlify.toml` sets the build command and
Node version. Add the same environment variables in Site settings →
Environment variables, then deploy. (`next dev` and the dashboard work the
same on any Node host.)

## In-app update system (GET /api/app-version)

The Android app checks this endpoint once per launch and offers to install a
newer APK when the server's `versionCode` is higher than the installed one.
It is fully independent of the landing page's download buttons.

```json
{
  "version": "1.1.0",
  "versionCode": 2,
  "apkUrl": "https://…direct download link…",
  "releaseNotes": ["Added monthly analytics"],
  "mandatory": false
}
```

- **404** = no release configured · **503** = lookup failed — the app
  silently continues in both cases; this endpoint never blocks the app.
- **Configure a release** (preferred): insert a document into the MongoDB
  `app_releases` collection — `{platform:"android", version, versionCode,
  apkUrl, releaseNotes, mandatory, enabled:true}`. Highest `versionCode`
  wins; flip `enabled:false` to pull one.
- **Or set env bindings** (`APP_LATEST_VERSION`, `APP_LATEST_VERSION_CODE`,
  `APP_LATEST_APK_URL`, `APP_RELEASE_NOTES`, `APP_UPDATE_MANDATORY`) —
  an env release overrides the database and keeps working during database
  outages. `APP_RELEASE_SOURCE=environment|database` forces a mode.
- `apkUrl` should be a **direct HTTPS file link** (the app downloads it), e.g.
  the Drive direct form `https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t`
  or a GitHub Releases asset URL (`github.com/<u>/<r>/releases/download/<tag>/<file>`).
  Known page-shaped links are auto-converted before serving (see
  `src/lib/apk-url.ts`): Google Drive share pages become the direct endpoint
  and every GitHub repo-file shape (`blob`, `raw`, raw.githubusercontent.com)
  collapses to the canonical `github.com/<u>/<r>/raw/refs/heads/<branch>/<file>`
  form — the one GitHub's own "View raw" button hands out (public repo,
  file ≤ 100 MiB). Do not host the APK on the Worker itself (25 MiB asset cap).
- All payloads pass strict validation (https URL, positive integer
  versionCode) before being served — see `src/lib/app-release.ts`.

Full release workflow (version bumps, signing, testing): see the app repo's
`RELEASE_PROCESS.md`.

## Change the APK download link

The link lives in ONE place: the `APP_LATEST_APK_URL` variable in the
Cloudflare dashboard (Worker → Settings → Variables and Secrets). Once this
build is deployed there is **no hardcoded download link anywhere**:

- Every website download button reads `GET /api/app-version` on page load and
  follows that link; the mobile app's update checker uses the same value —
  one variable edit publishes everywhere, no redeploy.
- Drive share pages and GitHub `blob` links are auto-converted to the
  canonical `github.com/.../raw/refs/heads/...` download URL
  (`src/lib/apk-url.ts`), so pasting a share link still works.
- With `APP_LATEST_VERSION` / `APP_LATEST_VERSION_CODE` set alongside, the
  same edit also publishes the in-app update (version dialog) at once.
- `src/config/site.ts` `APK_DOWNLOAD_URL` is an intentionally EMPTY
  build-time fallback — fill it only if you ever want a baked-in link back;
  while empty, an unreachable/unset variable shows the "link coming soon"
  toast instead of serving an outdated APK.

GitHub hosting tip: use a **public** repo (private repos 404 for visitors and
the app) and prefer a Releases asset link
(`github.com/<u>/<r>/releases/download/<tag>/<file>`); committed files are
capped at 100 MiB. Repo-file links are served in the `raw/refs/heads` form,
which redirects to `raw.githubusercontent.com` — if a network blocks that
host, host the APK on Releases or another CDN instead.

Developer identity (name, email, portfolio) is configured in
`src/config/site.ts` (`DEVELOPER_*` constants) and shown on /about, /contact
and in the footer.

## Project structure

```
src/
  app/
    layout.tsx            SEO/OG metadata, fonts, theme, navbar/footer shell,
                          analytics tracker mount
    page.tsx              home (hero + app preview + features + download CTA)
    about/ contact/ privacy/ terms/   inner pages (PageShell)
    not-found.tsx         themed 404
    admin/login/          dashboard sign-in
    admin/analytics/      private dashboard (KPIs, traffic, breakdowns)
    api/analytics/        POST ingestion endpoint
    api/app-version/      GET latest release (mobile in-app update system)
    api/admin/            login / logout / env-check (diagnostic) endpoints
    globals.css           light/dark palettes, scrollbar theme
  components/
    theme-provider.tsx    light/dark provider (next-themes)
    landing/              Navbar, Hero, HeroPhone3D, DestinationPhone +
                          phoneHandoff.ts (the travelling-phone handoff),
                          PhoneMockup, PhoneCarousel (mobile swipe showcase),
                          AppPreview, Features, WhyUse, HowItWorks,
                          DownloadCTA, Footer, DownloadButton (the only
                          download action), Reveal, PageShell, ContactMethods,
                          SiteChrome, ThemeToggle
    analytics/            AnalyticsTracker (page views), track.ts (event
                          transport: sendBeacon + fetch keepalive fallback)
    ui/                   button, toast, toaster (shadcn/ui, subset)
  lib/analytics/
    mongo.ts             cached MongoDB client (server-only) + hard-cap guards
    srv.ts               DNS-over-HTTPS resolver for mongodb+srv:// URIs
    schema.ts            zod payload validation + referrer/path sanitising
    ingest.ts             visit/event writers + index creation
    queries.ts            dashboard aggregation pipelines
    ua.ts                 user-agent -> device/browser/os classifier
    rate-limit.ts         in-memory fixed-window limiter
    auth.ts               HMAC-signed admin session (Web Crypto)
    server-utils.ts       daily-rotating IP hash (never persisted)
  config/site.ts          APP_DOWNLOAD_URL (intentionally empty — the live
                          link is the APP_LATEST_APK_URL variable), developer
                          identity, SITE_URL — single source of truth
  lib/apk-url.ts          APK link normalizer (Drive share → direct,
                          GitHub blob/raw/raw-host → canonical
                          github.com .../raw/refs/heads/... form)
  lib/app-release.ts      release registry for /api/app-version (env +
                          app_releases collection, strict sanitising)
  hooks/use-toast.ts
  hooks/use-latest-apk-url.ts  runtime APK URL for the website buttons
                          (one shared fetch of /api/app-version per page)
  lib/utils.ts
public/assets/            app icon (logo, favicon, OpenGraph image)
wrangler.jsonc            Cloudflare Workers config (OpenNext)
open-next.config.ts       OpenNext adapter config
.env.example              analytics env template (copy -> .env locally)
.dev.vars.example         same values for local wrangler preview
```

## Branding

- Brand green `#1E5D4B` (design tokens in `src/app/globals.css`)
- App icon: `public/assets/app-icon.png` — matches the Android app icon
- Font: Geist (loaded via `next/font`, no extra install)
