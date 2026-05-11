import Link from "next/link";
import { Wordmark } from "@/app/_components/wordmark";

type NavLink = { label: string; href: string; external?: boolean };

export function DocsNav({ links }: { links: NavLink[] }) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-hairline)] bg-[var(--color-canvas)]/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <Link href="/docs" className="flex items-center gap-2">
          <Wordmark />
          <span
            className="caption-uppercase rounded-full px-2 py-0.5"
            style={{
              background: "var(--color-surface-strong)",
              color: "var(--color-ink)",
            }}
          >
            Docs
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-[15px] font-medium text-[var(--color-ink)] md:flex">
          {links.map((l) =>
            l.external ? (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="hover:opacity-60 transition-opacity"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.href}
                href={l.href}
                className="hover:opacity-60 transition-opacity"
              >
                {l.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}
