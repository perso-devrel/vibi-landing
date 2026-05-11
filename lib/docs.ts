import fs from "node:fs";
import path from "node:path";

export type CategorySlug =
  | "learning"
  | "how-to"
  | "reference"
  | "explanation"
  | "journal";

export type Category = {
  slug: CategorySlug;
  label: string;
  eyebrow: string;
  description: string;
  accent: "mint" | "peach" | "lavender" | "sky" | "rose";
};

export const CATEGORIES: Category[] = [
  {
    slug: "learning",
    label: "Learning",
    eyebrow: "Tutorials",
    description:
      "Step-by-step guides for newcomers — from zero to a working build.",
    accent: "mint",
  },
  {
    slug: "how-to",
    label: "How-to",
    eyebrow: "Task guides",
    description:
      "Targeted recipes for solving specific problems and unblocking yourself.",
    accent: "peach",
  },
  {
    slug: "reference",
    label: "Reference",
    eyebrow: "Specs",
    description:
      "Look-up material: API contracts, environment variables, error codes.",
    accent: "sky",
  },
  {
    slug: "explanation",
    label: "Explanation",
    eyebrow: "Design notes",
    description:
      "The why behind the architecture — BFF, KMP, and pipeline decisions.",
    accent: "lavender",
  },
  {
    slug: "journal",
    label: "Journal",
    eyebrow: "Behind the build",
    description:
      "Meta + retrospective: how vibi was built alongside Claude Code.",
    accent: "rose",
  },
];

const CATEGORY_BY_SLUG: Record<CategorySlug, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
) as Record<CategorySlug, Category>;

export function isCategorySlug(value: string): value is CategorySlug {
  return value in CATEGORY_BY_SLUG;
}

export function getCategory(slug: CategorySlug): Category {
  return CATEGORY_BY_SLUG[slug];
}

export type DocSummary = {
  category: CategorySlug;
  // path segments under the category, e.g. ["claude-toolbox", "agents"]
  slug: string[];
  title: string;
  excerpt: string;
};

export type DocPage = DocSummary & {
  body: string; // markdown content with the leading H1 stripped
};

const DOCS_ROOT = path.resolve(process.cwd(), "docs");

const pathsCache = new Map<CategorySlug, string[][]>();
const docCache = new Map<string, DocPage | null>();

function listMarkdownPaths(category: CategorySlug): string[][] {
  const cached = pathsCache.get(category);
  if (cached) return cached;

  const root = path.join(DOCS_ROOT, category);
  const out: string[][] = [];
  const walk = (dir: string, prefix: string[]) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, [...prefix, entry.name]);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      if (entry.name.toLowerCase() === "readme.md") continue;
      out.push([...prefix, entry.name.replace(/\.md$/, "")]);
    }
  };
  walk(root, []);
  out.sort((a, b) => a.join("/").localeCompare(b.join("/")));
  pathsCache.set(category, out);
  return out;
}

function pickExcerpt(body: string): string {
  let inFence = false;
  for (const rawLine of body.split("\n")) {
    const line = rawLine.trim();
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence || line.length === 0) continue;
    if (line.startsWith("#") || line.startsWith("|") || line.startsWith(">")) {
      continue;
    }
    return line.replace(/\[(.+?)\]\(.+?\)/g, "$1").slice(0, 160);
  }
  return "";
}

function readDoc(category: CategorySlug, slug: string[]): DocPage | null {
  const filePath = path.join(DOCS_ROOT, category, ...slug) + ".md";
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }

  const titleMatch = raw.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : slug[slug.length - 1];
  const body = raw.replace(/^#\s+.+$/m, "").trimStart();

  return {
    category,
    slug,
    title,
    excerpt: pickExcerpt(body),
    body,
  };
}

export function getDoc(category: CategorySlug, slug: string[]): DocPage | null {
  const key = `${category}/${slug.join("/")}`;
  if (docCache.has(key)) return docCache.get(key) ?? null;
  const doc = readDoc(category, slug);
  docCache.set(key, doc);
  return doc;
}

export function listDocs(category: CategorySlug): DocSummary[] {
  return listMarkdownPaths(category)
    .map((slug) => {
      const doc = getDoc(category, slug);
      if (!doc) return null;
      const { body: _body, ...summary } = doc;
      return summary;
    })
    .filter((d): d is DocSummary => d !== null);
}

export function listAllDocs(): Record<CategorySlug, DocSummary[]> {
  return Object.fromEntries(
    CATEGORIES.map((c) => [c.slug, listDocs(c.slug)]),
  ) as Record<CategorySlug, DocSummary[]>;
}

export function allDocParams(): { category: CategorySlug; slug: string[] }[] {
  return CATEGORIES.flatMap((c) =>
    listMarkdownPaths(c.slug).map((slug) => ({ category: c.slug, slug })),
  );
}
