import {
  Inter,
  Fraunces,
  Noto_Sans_KR,
  Noto_Serif_KR,
  Noto_Sans_JP,
  Noto_Serif_JP,
  Noto_Sans_SC,
  Noto_Serif_SC,
} from "next/font/google";
import type { Locale } from "@/dictionaries";

// Latin brand fonts, exposed as CSS variables on <html> by every root layout
// (the default-locale group and the /{lang} group share one definition).
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

export const latinFontClass = `${displayLatin.variable} ${bodyLatin.variable}`;

// Per-language CJK fonts. Body = Noto Sans (pairs with Inter), display = Noto
// Serif (echoes the Fraunces serif used for latin headings). Latin subset is
// preloaded; the heavy CJK glyph ranges load on demand only on that locale's
// page (preload: false), so English/Spanish visitors download none of this.
const notoSansKR = Noto_Sans_KR({ weight: ["400", "500", "600"], subsets: ["latin"], display: "swap", preload: false, variable: "--font-body-cjk" });
const notoSerifKR = Noto_Serif_KR({ weight: ["300", "400", "600"], subsets: ["latin"], display: "swap", preload: false, variable: "--font-display-cjk" });
const notoSansJP = Noto_Sans_JP({ weight: ["400", "500", "600"], subsets: ["latin"], display: "swap", preload: false, variable: "--font-body-cjk" });
const notoSerifJP = Noto_Serif_JP({ weight: ["300", "400", "600"], subsets: ["latin"], display: "swap", preload: false, variable: "--font-display-cjk" });
const notoSansSC = Noto_Sans_SC({ weight: ["400", "500", "600"], subsets: ["latin"], display: "swap", preload: false, variable: "--font-body-cjk" });
const notoSerifSC = Noto_Serif_SC({ weight: ["300", "400", "600"], subsets: ["latin"], display: "swap", preload: false, variable: "--font-display-cjk" });

// className exposes --font-body-cjk / --font-display-cjk on the element it's
// applied to; the landing wrapper then folds those vars into --font-body /
// --font-display so CJK glyphs render in Noto while latin brand words keep
// their Inter / Fraunces rendering.
export const cjkFontClass: Partial<Record<Locale, string>> = {
  ko: `${notoSansKR.variable} ${notoSerifKR.variable}`,
  ja: `${notoSansJP.variable} ${notoSerifJP.variable}`,
  zh: `${notoSansSC.variable} ${notoSerifSC.variable}`,
};
