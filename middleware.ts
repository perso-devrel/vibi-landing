import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, type Locale } from "@/dictionaries/locales";

// Decide the visitor's locale: an explicit cookie choice wins, otherwise fall
// back to the browser's Accept-Language preference order.
function pickLocale(req: NextRequest): Locale {
  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (isLocale(cookie)) return cookie;

  const header = req.headers.get("accept-language") ?? "";
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { full: tag.toLowerCase(), base: tag.toLowerCase().split("-")[0], q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { full, base } of ranked) {
    if (isLocale(full)) return full; // exact es-es / es-mx / en / ...
    if (base === "es") {
      // Generic "es" and Spain → es-ES; every other Spanish region → es-MX.
      return full === "es" || full === "es-es" ? "es-es" : "es-mx";
    }
    if (isLocale(base)) return base; // en-US → en, zh-CN / zh-TW → zh, ...
  }
  return defaultLocale;
}

export function middleware(req: NextRequest) {
  const chosen = pickLocale(req);
  if (chosen === defaultLocale) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/${chosen}`;
  return NextResponse.redirect(url);
}

// Only the bare landing root auto-redirects. Localized routes, docs, legal
// pages, and all assets are left untouched.
export const config = { matcher: ["/"] };
