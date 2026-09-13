cat > "$STAGE/README.md" << 'EOF'
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

Production build:

```bash
npm run build               # Next.js server build
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
- Note: the Workers runtime does not fully implement the DNS SRV lookups the
  `mongodb+srv://` scheme needs. If the site deploys fine but /api/analytics
  logs a DNS error, switch to the **standard** connection string — Atlas →
  Connect → Driver → Node (choose an older driver version to reveal it):
  `mongodb://user:pass@cluster0-shard-00-00.xxx.mongodb.net:27017,cluster0-shard-00-01.xxx.mongodb.net:27017,cluster0-shard-00-02.xxx.mongodb.net:27017/<db>?ssl=true&replicaSet=atlas-xxx-shard-0&authSource=admin&retryWrites=true&w=majority`

**2. Deploy the Worker**

Option A — CLI:
```bash
npm install
npx opennextjs-cloudflare build
npx opennextjs-cloudflare deploy
```
(Wrangler prompts you to log in on first use; `npm run deploy` does both.)

Option B — dashboard Git integration (Workers Builds):
- **Build command:** `npx opennextjs-cloudflare build`  ← NOT `npm run build`
- **Deploy command:** `npx wrangler deploy` (auto-detects OpenNext; or
  `npx opennextjs-cloudflare deploy` — both are equivalent)

> ⚠️ **Why not `npm run build`?** It only runs `next build`, which produces
> `.next/` but never the `.open-next/` Worker bundle. The deploy step then
> fails with *"Could not find compiled Open Next config, did you run the
> build command?"*. `npx opennextjs-cloudflare build` runs `next build`
> itself and then compiles the Worker — that is the ONLY build command the
> Cloudflare dashboard needs. (`npm run build:cf` is a shortcut for it.)

**3. Set the variables** in Cloudflare Dashboard → Workers → kharcha-web →
Settings → **Variables and Secrets** (type Secret for anything sensitive):

| Name | Example |
| --- | --- |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority` |
| `MONGODB_DATABASE` | `kharcha_analytics` |
| `ANALYTICS_ADMIN_USERNAME` | your admin username |
| `ANALYTICS_ADMIN_PASSWORD` | a long random password |
| `ANALYTICS_SESSION_SECRET` | a long random string |

**4. Redeploy** (so the new variables are picked up), then verify:

```bash
open https://<your-worker>.workers.dev/
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://<your-worker>.workers.dev/api/analytics \
  -H "Content-Type: application/json" \
  -A "Mozilla/5.0 (Windows NT 10.0) Chrome/126 Safari/537.36" \
  -d '{"type":"pageview","path":"/","visitorId":"verify-test-01","sessionId":"verify-test-01"}'
# → 204, and the visit shows up in /admin/analytics
```

Local Worker-mode preview (uses `.dev.vars`): `cp .dev.vars.example .dev.vars`
then `npm run preview`.

## Deploy — Netlify

The Next runtime is auto-detected; `netlify.toml` sets the build command and
Node version. Add the same environment variables in Site settings →
Environment variables, then deploy. (`next dev` and the dashboard work the
same on any Node host.)

## Change the APK download link

Open `src/config/site.ts` and set `APK_DOWNLOAD_URL` — that single value feeds
every download button on the site (navbar, mobile menu, hero, download
section, footer, about page). For **Google Drive** share links, the
direct-download URL (which starts the download immediately instead of opening
Drive's preview page) is derived automatically. Any other host (e.g.
Cloudinary) is used as-is.

Developer identity (name, email, portfolio) is also configured in
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
    api/admin/            login / logout endpoints
    globals.css           light/dark palettes, scrollbar theme
  components/
    theme-provider.tsx    light/dark provider (next-themes)
    landing/              Navbar, Hero, HeroPhone3D, PhoneMockup, AppPreview,
                          Features, WhyUse, HowItWorks, DownloadCTA, Footer,
                          DownloadButton (the only download action), Reveal,
                          PageShell, ContactMethods, SiteChrome, ThemeToggle
    analytics/            AnalyticsTracker (page views), track.ts (event
                          transport: sendBeacon + fetch keepalive fallback)
    ui/                   button, toast, toaster (shadcn/ui, subset)
  lib/analytics/
    mongo.ts              cached MongoDB client (server-only)
    schema.ts             zod payload validation + referrer/path sanitising
    ingest.ts             visit/event writers + index creation
    queries.ts            dashboard aggregation pipelines
    ua.ts                 user-agent -> device/browser/os classifier
    rate-limit.ts         in-memory fixed-window limiter
    auth.ts               HMAC-signed admin session (Web Crypto)
    server-utils.ts       daily-rotating IP hash (never persisted)
  config/site.ts          APK_DOWNLOAD_URL, developer identity, SITE_URL —
                          single source of truth
  hooks/use-toast.ts
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
