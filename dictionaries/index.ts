import type { Dict } from "./types";
import type { Locale } from "./locales";
import { en } from "./en";
import { ko } from "./ko";
import { ja } from "./ja";
import { zh } from "./zh";
import { esES } from "./es-es";
import { esMX } from "./es-mx";

export const dictionaries: Record<Locale, Dict> = {
  en,
  ko,
  ja,
  zh,
  "es-es": esES,
  "es-mx": esMX,
};

export function getDict(locale: Locale): Dict {
  return dictionaries[locale];
}

// Backward-compatible default export used by pages that are English-only
// (root layout, docs nav). Localized pages resolve their dict via getDict().
export { en as dict };

export type { Dict, LinkItem } from "./types";
export {
  locales,
  defaultLocale,
  pathLocales,
  isLocale,
  localePath,
  htmlLang,
  ogLocale,
  localeName,
} from "./locales";
export type { Locale } from "./locales";
