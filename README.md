# Kharcha — Landing Page

Marketing landing page for the **Kharcha** offline-first expense tracker
Android app. Single page: Hero, live app preview, features, why-Kharcha,
how-it-works, download CTA, footer.

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
npm start          # http://localhost:3000
```

## Change the APK download link

Open `src/config/site.ts` and set `APK_DOWNLOAD_URL` — that single value feeds
every download button on the page (navbar, mobile menu, hero, download
section, footer).

For **Google Drive** share links, the direct-download URL (which starts the
download immediately instead of opening Drive's preview page) is derived
automatically. Any other host (e.g. Cloudinary) is used as-is.

## Project structure

```
src/
  app/                    layout (SEO/OG metadata, fonts), page, global styles
  components/landing/     Navbar, Hero, PhoneMockup, AppPreview, Features,
                          WhyUse, HowItWorks, DownloadCTA, Footer,
                          DownloadButton (the only download action), Reveal
  components/ui/          button, toast, toaster (shadcn/ui, subset)
  config/site.ts          APK_DOWNLOAD_URL + app identity — single source of truth
  hooks/use-toast.ts
  lib/utils.ts
public/assets/            app icon (used for logo, favicon, OpenGraph image)
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
CDN assets. In the dashboard set: build command `npm run build`, deploy
command `npx wrangler deploy`. Do NOT pick the OpenNext / Next.js
framework preset — this site is 100% static, no server needed.

**Local production preview:** `npm run preview` (serves the `out/` folder
at http://localhost:3000). Note: with static export there is no
`next start` server — `out/` is the entire site.

Other hosts: Cloudflare Pages / Vercel / GitHub Pages — set build command
`npm run build` and publish directory `out` (or upload `out/`).

## Branding

- Brand green `#1E5D4B` (design tokens in `src/app/globals.css`)
- App icon: `public/assets/app-icon.png` — matches the Android app icon
- Font: Geist (loaded via `next/font`, no extra install)
