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
  title: dict.meta.title,
  description: dict.meta.description,
  metadataBase: new URL("https://www.vibi.fm"),
  openGraph: {
    title: dict.meta.title,
    description: dict.meta.description,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "vibi",
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
