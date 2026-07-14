import type { Metadata } from "next";
import {
  getDict,
  locales,
  localePath,
  htmlLang,
  ogLocale,
  defaultLocale,
  type Locale,
} from "@/dictionaries";

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
      title: d.meta.title,
      description: d.meta.description,
    },
  };
}
