import Link from "next/link";
import { Wordmark } from "@/app/_components/wordmark";
import { GithubGlyph } from "@/app/_components/github-glyph";
import { dict, type LinkItem } from "@/dictionaries";

type NavLink = LinkItem & { external?: boolean };
type GithubRepo = LinkItem & { description?: string };

const REPO_DESCRIPTIONS: Record<string, string> = {
  vibi: "Mobile client (KMP/CMP)",
  "vibi-bff": "BFF (Ktor + ffmpeg)",
};

const GITHUB_REPOS: GithubRepo[] = dict.footer.githubLinks.map((l) => ({
  ...l,
  description: REPO_DESCRIPTIONS[l.label],
}));

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
          <GithubMenu />
        </nav>
      </div>
    </header>
  );
}

function GithubMenu() {
  return (
    <details className="group relative">
      <summary
        className="flex cursor-pointer list-none items-center gap-1.5 hover:opacity-60 transition-opacity"
        aria-label="Open GitHub repository menu"
      >
        <GithubGlyph />
        <span>GitHub</span>
        <ChevronDown />
      </summary>
      <div className="hairline absolute right-0 top-full mt-2 w-[260px] overflow-hidden rounded-xl bg-[var(--color-surface-card)] shadow-lg">
        <ul className="divider-y">
          {GITHUB_REPOS.map((r) => (
            <li key={r.href}>
              <a
                href={r.href}
                target="_blank"
                rel="noreferrer"
                className="block px-4 py-3 transition-colors hover:bg-[var(--color-canvas-soft)]"
              >
                <span
                  className="block text-[14px] font-medium"
                  style={{ color: "var(--color-ink)" }}
                >
                  {r.label}
                </span>
                {r.description ? (
                  <span
                    className="block text-[12px]"
                    style={{ color: "var(--color-muted)" }}
                  >
                    {r.description}
                  </span>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

function ChevronDown() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-[12px] w-[12px] transition-transform group-open:rotate-180"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
