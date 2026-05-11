import { isCategorySlug, type CategorySlug } from "@/lib/docs";

export type ResolvedLink =
  | { kind: "route"; href: string }
  | { kind: "external"; href: string }
  | { kind: "anchor"; href: string }
  | { kind: "dead" };

const EXTERNAL_PROTOCOL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

function splitHash(href: string): { path: string; hash: string } {
  const i = href.indexOf("#");
  if (i < 0) return { path: href, hash: "" };
  return { path: href.slice(0, i), hash: href.slice(i) };
}

function normalize(segments: string[]): string[] | null {
  const out: string[] = [];
  for (const seg of segments) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") {
      if (out.length === 0) return null;
      out.pop();
      continue;
    }
    out.push(seg);
  }
  return out;
}

/**
 * Resolves a markdown link encountered inside `docs/{fromCategory}/{...fromSlug}.md`.
 *
 * - Returns a Next.js route (`/docs/...`) for any `.md` file inside `docs/`.
 * - Returns a category-index anchor (`/docs#category`) for directory links inside `docs/`.
 * - Returns `external` for absolute URLs / `mailto:` / etc.
 * - Returns `anchor` for hash-only links (stay on the current page).
 * - Returns `dead` for paths that leave `docs/` (workspace root / .claude / etc.) —
 *   the page should render those as non-clickable text.
 */
export function resolveDocLink(
  href: string,
  fromCategory: CategorySlug,
  fromSlug: string[],
): ResolvedLink {
  if (!href) return { kind: "dead" };

  if (href.startsWith("#")) return { kind: "anchor", href };
  if (EXTERNAL_PROTOCOL.test(href)) return { kind: "external", href };

  const { path, hash } = splitHash(href);
  const trailingSlash = path.endsWith("/");

  // Current file's directory inside docs/: [category, ...fromSlug.slice(0, -1)]
  const baseDir = [fromCategory, ...fromSlug.slice(0, -1)];
  const resolved = normalize([...baseDir, ...path.split("/")]);
  if (!resolved) return { kind: "dead" };

  // Whole path resolved to docs root or above — dead unless it's the root
  // itself, which we treat as the docs hub.
  if (resolved.length === 0) {
    return { kind: "route", href: `/docs${hash}` };
  }

  const [topSegment, ...rest] = resolved;

  // A path that resolves to a non-category top segment must have escaped docs/.
  if (!isCategorySlug(topSegment)) return { kind: "dead" };

  // Directory link (trailing slash, no .md). Category root → /docs hub;
  // sub-directory like journal/claude-toolbox/ → /docs hub as well (no
  // dedicated index page exists).
  if (trailingSlash || rest.length === 0) {
    return { kind: "route", href: `/docs${hash}` };
  }

  // File link — must end with .md to be a doc page.
  const last = rest[rest.length - 1];
  if (!last.toLowerCase().endsWith(".md")) return { kind: "dead" };
  rest[rest.length - 1] = last.replace(/\.md$/i, "");

  return {
    kind: "route",
    href: `/docs/${topSegment}/${rest.join("/")}${hash}`,
  };
}
