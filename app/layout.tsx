import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { dict } from "@/dictionaries";

const displayLatin = Fraunces({
  subsets: ["latin"],
  weight: ["300"],
  display: "swap",
  variable: "--font-display-latin",
});

const bodyLatin = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-body-latin",
});

export const metadata: Metadata = {
  // Child pages set a short `title` and the template appends the brand.
  // NOTE: canonical is intentionally NOT set here — Next.js cascades
  // layout `alternates` to every page, which would mark all subpages as
  // duplicates of "/". Each page declares its own canonical instead.
  title: {
    default: dict.meta.title,
    template: "%s — vibi",
  },
  description: dict.meta.description,
  metadataBase: new URL("https://www.vibi.fm"),
  applicationName: "vibi",
  category: "multimedia",
  keywords: [
    "AI sound eraser",
    "AI audio separation",
    "remove background music from video",
    "separate voice from music",
    "remove background noise from video",
    "remove voice from video",
    "isolate vocals from video",
    "stem separation",
    "voice isolation",
    "noise removal app",
    "audio cleanup",
    "per-speaker separation",
    "add background music to video",
    "Premiere Pro plugin",
    "iOS video editor",
    "Android video editor",
  ],
  authors: [{ name: "vibi" }],
  creator: "vibi",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: dict.meta.title,
    description: dict.meta.description,
    url: "/",
    siteName: "vibi",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: dict.meta.title,
    description: dict.meta.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f5f5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVars = [displayLatin.variable, bodyLatin.variable].join(" ");
  return (
    <html lang="en" className={fontVars}>
      <body>{children}</body>
    </html>
  );
}
