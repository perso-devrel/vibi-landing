import "../globals.css";
import { latinFontClass } from "../_fonts";
import { rootMetadata, rootViewport } from "../_meta";

// Root layout for the default-locale (English) routes: the bare landing page,
// docs, and legal pages. Localized landings live under app/[lang]/ with their
// own root layout so <html lang> can match the locale.
export const metadata = rootMetadata;
export const viewport = rootViewport;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={latinFontClass}>
      <body>{children}</body>
    </html>
  );
}
