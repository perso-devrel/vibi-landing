import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Inter, Fraunces, Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "../globals.css";
import { LOCALES, getDictionary, type Locale } from "@/dictionaries";

// Display — Waldenburg Light analogue (open-source).
// Fraunces 300 carries Latin display; Noto Serif KR 300 carries Hangul.
const displayLatin = Fraunces({
  subsets: ["latin"],
  weight: ["300"],
  display: "swap",
  variable: "--font-display-latin",
});

const displayKR = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["300"],
  display: "swap",
  variable: "--font-display-kr",
});

// Body — Inter (Latin) + Noto Sans KR (Hangul).
const bodyLatin = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-body-latin",
});

const bodyKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-body-kr",
});

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.meta.title,
    description: dict.meta.description,
    metadataBase: new URL("https://vibi.app"),
    alternates: {
      languages: {
        ko: "/ko",
        en: "/en",
        "x-default": "/ko",
      },
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      type: "website",
      locale: lang === "ko" ? "ko_KR" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: "vibi",
      description: dict.meta.description,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#f5f5f5",
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const fontVars = [
    displayLatin.variable,
    displayKR.variable,
    bodyLatin.variable,
    bodyKR.variable,
  ].join(" ");

  return (
    <html lang={lang} className={fontVars}>
      <body>{children}</body>
    </html>
  );
}
