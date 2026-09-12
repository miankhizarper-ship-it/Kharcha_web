import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "@/config/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
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
  themeColor: "#1E5D4B",
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
