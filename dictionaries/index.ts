import type { Dict, Locale } from "./types";
import { en } from "./en";
import { ko } from "./ko";

const dictionaries: Record<Locale, Dict> = { ko, en };

export function getDictionary(locale: Locale): Dict {
  return dictionaries[locale];
}

export { LOCALES, DEFAULT_LOCALE } from "./types";
export type { Dict, Locale } from "./types";
