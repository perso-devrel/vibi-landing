import { NextResponse, type NextRequest } from "next/server";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "@/dictionaries";

function detect(req: NextRequest): Locale {
  const accept = req.headers.get("accept-language")?.toLowerCase() ?? "";
  // Take the first weighted language tag, normalize to primary subtag.
  const primary = accept.split(",")[0]?.trim().split(";")[0]?.split("-")[0] ?? "";
  return (LOCALES as readonly string[]).includes(primary)
    ? (primary as Locale)
    : DEFAULT_LOCALE;
}

export function middleware(req: NextRequest) {
  // Only the bare root needs language detection. Unknown paths fall through
  // to the [lang] segment which 404s on non-locale values.
  if (req.nextUrl.pathname !== "/") return NextResponse.next();

  const target = detect(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${target}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/"],
};
