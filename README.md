# Kharcha — Landing Page

Marketing site for the **Kharcha** offline-first expense tracker Android app.
Pages: **/** (hero, live app preview, features, why-Kharcha, how-it-works,
download CTA), **/about**, **/contact** (developer details), **/privacy**,
**/terms**, plus a themed 404.

Fully self-contained: **no backend, no database, no environment variables.**
The only external reference is the APK download link (see below).

## Quickstart

Requires Node.js 20.9+ (or Bun).

```bash
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm run preview    # serves the static out/ folder at http://localhost:3000
```

## Light / dark theme

The site ships with a **light + dark theme and a toggle in the navbar**
(`next-themes`, class strategy, system preference by default, no flash on
load — the choice is persisted in localStorage). Both palettes live in
`src/app/globals.css` (`:root` for light, `.dark` for dark). The scrollbar is
themed to match in both modes.

## Change the APK download link

Open `src/config/site.ts` and set `APK_DOWNLOAD_URL` — that single value feeds
every download button on the site (navbar, mobile menu, hero, download
section, footer, about page).

For **Google Drive** share links, the direct-download URL (which starts the
download immediately instead of opening Drive's preview page) is derived
automatically. Any other host (e.g. Cloudinary) is used as-is.

Developer identity (name, email, portfolio) is also configured in
`src/config/site.ts` (`DEVELOPER_*` constants) and shown on /about, /contact
and in the footer.

## Project structure

```
src/
  app/                    layout (SEO/OG metadata, fonts, navbar/footer shell),
                          home page, about/, contact/, privacy/, terms/,
                          not-found (404), global styles + dark palette
  components/
    theme-provider.tsx    light/dark provider (next-themes)
    landing/              Navbar (+ theme toggle), Hero, PhoneMockup,
                          AppPreview, Features, WhyUse, HowItWorks,
                          DownloadCTA, Footer, DownloadButton (the only
                          download action), Reveal, PageShell (inner-page
                          shell), ContactMethods (developer card)
    components/ui/        button, toast, toaster (shadcn/ui, subset)
  config/site.ts          APK_DOWNLOAD_URL, developer identity, SITE_URL —
                          single source of truth
  hooks/use-toast.ts
  lib/utils.ts
public/assets/            app icon (logo, favicon, OpenGraph image)
```

## Deploy — Netlify-ready (and any static host)

The site compiles to a fully static bundle in `out/` (pure HTML/CSS/JS —
no server required anywhere).

**Option 1 — connect the repo (recommended):**
Push this project to GitHub/GitLab/Bitbucket, then in Netlify:
"Add new site → Import an existing project". `netlify.toml` already
defines everything (build `npm run build`, publish `out`, Node 20) —
no manual settings. Every push to the production branch auto-deploys.

**Option 2 — drag & drop:**
Run `npm run build`, then drop the generated `out/` folder onto
<https://app.netlify.com/drop>. Done.

**Cloudflare (Workers Builds):**
`wrangler.jsonc` is preconfigured to publish the static `out/` folder as
CDN assets (404s fall back to the themed 404 page). In the dashboard set:
build command `npm run build`, deploy command `npx wrangler deploy`.
Do NOT pick the OpenNext / Next.js framework preset — this site is 100%
static, no server needed.

**Other hosts:** Cloudflare Pages / Vercel / GitHub Pages — set build command
`npm run build` and publish directory `out` (or upload `out/`).

## Branding

- Brand green `#1E5D4B` (design tokens in `src/app/globals.css`)
- App icon: `public/assets/app-icon.png` — matches the Android app icon
- Font: Geist (loaded via `next/font`, no extra install)
