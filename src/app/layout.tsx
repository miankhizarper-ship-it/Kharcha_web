import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SiteChrome } from "@/components/landing/SiteChrome";
import { isAnalyticsConfigured } from "@/lib/analytics/mongo";
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_TAGLINE,
  SITE_URL,
} from "@/config/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s — ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "expense tracker",
    "personal finance",
    "income tracker",
    "budget app",
    "offline expense tracker",
    "Android",
    "money management",
    "Kharcha",
  ],
  authors: [{ name: APP_NAME }],
  icons: {
    icon: "/assets/app-icon-192.png",
    apple: "/assets/app-icon-192.png",
  },
  openGraph: {
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    type: "website",
    images: [
      {
        url: "/assets/app-icon.png",
        width: 512,
        height: 512,
        alt: `${APP_NAME} app icon — a wallet with coins on a deep green background`,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1E5D4B" },
    { media: "(prefers-color-scheme: dark)", color: "#0a100e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {/* Anonymous page-view tracking — no-ops entirely when
              MONGODB_URI is not configured on the server. */}
          <AnalyticsTracker enabled={isAnalyticsConfigured()} />

          {/* Shared shell: navbar + page + footer on every public route. The
              flex column keeps the footer pinned to the bottom on short
              pages. Admin routes opt out via SiteChrome. */}
          <div className="flex min-h-screen flex-col">
            <SiteChrome>
              <Navbar />
            </SiteChrome>
            <main className="flex-1">{children}</main>
            <SiteChrome>
              <Footer />
            </SiteChrome>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
