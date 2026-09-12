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

## Deploy

Any host that runs Next.js: Vercel / Netlify (import the repo, zero config),
or a VPS — `npm run build && npm start`. The landing page is fully static
prerendered; no server-side data is required at runtime.

## Branding

- Brand green `#1E5D4B` (design tokens in `src/app/globals.css`)
- App icon: `public/assets/app-icon.png` — matches the Android app icon
- Font: Geist (loaded via `next/font`, no extra install)
