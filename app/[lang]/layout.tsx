import "../globals.css";
import { latinFontClass } from "../_fonts";
import { rootMetadata, rootViewport } from "../_meta";
import { htmlLang, isLocale, pathLocales } from "@/dictionaries";

// Root layout for the localized landing pages. Being its own root layout (the
// default-locale routes live in the (en) group) lets <html lang> reflect the
// locale — hreflang, content language, and the document language then agree.
export const metadata = rootMetadata;
export const viewport = rootViewport;

export function generateStaticParams() {
  return pathLocales.map((lang) => ({ lang }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  // Invalid params still render this layout for the 404 boundary; fall back to en.
  const docLang = isLocale(lang) ? htmlLang[lang] : "en";
  return (
    <html lang={docLang} className={latinFontClass}>
      <body>{children}</body>
    </html>
  );
}
