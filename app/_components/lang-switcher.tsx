"use client";

import { locales, localeName, localePath, type Locale } from "@/dictionaries";

// Persist the choice so the middleware's auto-redirect on "/" respects it
// (including an explicit switch back to English).
function remember(locale: Locale) {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function LangSwitcher({ current }: { current: Locale }) {
  return (
    <details className="group relative">
      <summary
        aria-label="Language"
        className="flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-full px-3 text-[14px] font-medium [&::-webkit-details-marker]:hidden"
        style={{ border: "1px solid var(--color-hairline-strong)", color: "var(--color-ink)" }}
      >
        <GlobeGlyph />
        <span className="hidden sm:inline">{localeName[current]}</span>
        <ChevronGlyph />
      </summary>
      <div
        className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl bg-white py-1.5 shadow-lg"
        style={{ border: "1px solid var(--color-hairline)" }}
      >
        <nav aria-label="Language" className="flex flex-col">
          {locales.map((l) => {
            const active = l === current;
            return (
              <a
                key={l}
                href={localePath(l)}
                onClick={() => remember(l)}
                aria-current={active ? "true" : undefined}
                className="flex items-center justify-between px-4 py-2 text-[14px] font-medium transition-colors hover:bg-[var(--color-canvas-soft)]"
                style={{ color: active ? "var(--color-ink)" : "var(--color-body)" }}
              >
                {localeName[l]}
                {active ? <CheckGlyph /> : null}
              </a>
            );
          })}
        </nav>
      </div>
    </details>
  );
}

function GlobeGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-[16px] w-[16px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.5 3.8 5.6 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.6-3.8-9S9.5 5.5 12 3z" />
    </svg>
  );
}

function ChevronGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-[14px] w-[14px] transition-transform group-open:rotate-180"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-[15px] w-[15px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--color-ink)" }}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
