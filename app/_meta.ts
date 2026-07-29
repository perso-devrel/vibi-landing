import type { Metadata, Viewport } from "next";
import {
  dict,
  getDict,
  locales,
  localePath,
  htmlLang,
  ogLocale,
  defaultLocale,
  type Locale,
} from "@/dictionaries";

// Shared by both root layouts — the default-locale group and /{lang}.
// NOTE: canonical is intentionally NOT set here — Next.js cascades layout
// `alternates` to every page, which would mark all subpages as duplicates
// of "/". Each page declares its own canonical instead.
export const rootMetadata: Metadata = {
  // Child pages set a short `title` and the template appends the brand.
  title: {
    default: dict.meta.title,
    template: "%s — VIBI",
  },
  description: dict.meta.description,
  metadataBase: new URL("https://www.vibi.fm"),
  applicationName: "VIBI",
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
  authors: [{ name: "VIBI" }],
  creator: "VIBI",
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
    siteName: "VIBI",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: dict.meta.title,
    description: dict.meta.description,
  },
};

export const rootViewport: Viewport = {
  themeColor: "#f5f5f5",
  width: "device-width",
  initialScale: 1,
};

// Per-locale metadata for the landing page: localized title/description,
// canonical for this locale, and hreflang alternates pointing at every locale.
export function buildLandingMetadata(lang: Locale): Metadata {
  const d = getDict(lang);

  const languages: Record<string, string> = {};
  for (const l of locales) languages[htmlLang[l]] = localePath(l);
  languages["x-default"] = localePath(defaultLocale);

  return {
    title: { absolute: d.meta.title },
    description: d.meta.description,
    alternates: { canonical: localePath(lang), languages },
    openGraph: {
      title: d.meta.title,
      description: d.meta.description,
      url: localePath(lang),
      locale: ogLocale[lang],
    },
    twitter: {
      // Page-level `twitter` replaces the layout's whole object, so the card
      // type must be restated here or it falls back to plain "summary".
      card: "summary_large_image",
      title: d.meta.title,
      description: d.meta.description,
    },
  };
}
