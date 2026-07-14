// Locale configuration — kept free of dictionary DATA so it can be imported by
// the edge middleware without pulling every translation into that bundle.

export const locales = ["en", "ko", "ja", "zh", "es-es", "es-mx"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

// Locales that live under a /{lang} path (everything except the default, which stays at "/").
export const pathLocales = locales.filter((l) => l !== defaultLocale) as Exclude<Locale, "en">[];

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

// URL path for a locale's landing page. Default locale is the bare root.
export function localePath(locale: Locale): string {
  return locale === defaultLocale ? "/" : `/${locale}`;
}

// `<html lang>` / hreflang value per locale (BCP-47).
export const htmlLang: Record<Locale, string> = {
  en: "en",
  ko: "ko",
  ja: "ja",
  zh: "zh-CN",
  "es-es": "es-ES",
  "es-mx": "es-MX",
};

// Open Graph locale codes.
export const ogLocale: Record<Locale, string> = {
  en: "en_US",
  ko: "ko_KR",
  ja: "ja_JP",
  zh: "zh_CN",
  "es-es": "es_ES",
  "es-mx": "es_MX",
};

// Endonyms shown in the language switcher.
export const localeName: Record<Locale, string> = {
  en: "English",
  ko: "한국어",
  ja: "日本語",
  zh: "简体中文",
  "es-es": "Español (España)",
  "es-mx": "Español (México)",
};
