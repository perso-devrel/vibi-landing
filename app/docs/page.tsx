import Link from "next/link";
import type { Metadata } from "next";
import { CATEGORIES, listAllDocs, type Category, type DocSummary } from "@/lib/docs";
import { BadgePill } from "@/app/_components/badge-pill";
import { DocsNav } from "./_components/docs-nav";

const DOCS_DESCRIPTION =
  "Tutorials, how-tos, reference, and design notes for vibi — AI audio separation on iPhone, Android, and in Adobe Premiere Pro.";

export const metadata: Metadata = {
  title: "Docs",
  description: DOCS_DESCRIPTION,
  alternates: { canonical: "/docs" },
  openGraph: {
    title: "Docs — vibi",
    description: DOCS_DESCRIPTION,
    url: "/docs",
    siteName: "vibi",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Docs — vibi",
    description: DOCS_DESCRIPTION,
  },
};

const NAV_LINKS = [
  { label: "Home", href: "/" },
];

export default function DocsIndex() {
  const docsByCategory = listAllDocs();

  return (
    <main className="relative">
      <DocsNav links={NAV_LINKS} />
      <DocsHero />

      <section className="mx-auto max-w-[1200px] px-6" style={{ paddingBottom: "120px" }}>
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {CATEGORIES.map((category) => (
            <CategoryCard
              key={category.slug}
              category={category}
              docs={docsByCategory[category.slug]}
              wide={category.slug === "journal"}
            />
          ))}
        </ul>
      </section>
    </main>
  );
}

function DocsHero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ paddingTop: "96px", paddingBottom: "64px" }}
    >
      <div
        aria-hidden
        className="orb-mint pointer-events-none absolute -left-32 top-0 h-[480px] w-[480px] opacity-60 blur-[8px]"
      />
      <div
        aria-hidden
        className="orb-sky pointer-events-none absolute -right-32 top-20 h-[420px] w-[420px] opacity-60 blur-[8px]"
      />
      <div className="relative z-10 mx-auto max-w-[1200px] px-6">
        <BadgePill>Docs</BadgePill>
        <h1
          className="display-xl mt-8 max-w-[20ch] text-balance"
          style={{ color: "var(--color-ink)" }}
        >
          How vibi works, and how it was built.
        </h1>
        <p
          className="body-md mt-5 max-w-[58ch] text-pretty"
          style={{ color: "var(--color-body)" }}
        >
          vibi splits the audio in any region of your clip — voice,
          background, and per-speaker stems — so you can mute just the
          wind, the passerby, or the wrong voice. The footage you can't
          reshoot stays intact. All on mobile.
        </p>
        <p
          className="body-md mt-4 max-w-[58ch] text-pretty"
          style={{ color: "var(--color-body)" }}
        >
          These docs cover both: how to use vibi, and the notes behind how it
          was built.
        </p>
      </div>
    </section>
  );
}

function CategoryCard({
  category,
  docs,
  wide = false,
}: {
  category: Category;
  docs: DocSummary[];
  wide?: boolean;
}) {
  return (
    <li
      className={`group relative overflow-hidden rounded-2xl bg-white p-8 transition hover:-translate-y-0.5${
        wide ? " md:col-span-2" : ""
      }`}
      style={{ border: "1px solid var(--color-hairline)" }}
    >
      <div
        aria-hidden
        className={`orb-${category.accent} pointer-events-none absolute -right-12 -top-12 h-48 w-48 opacity-70`}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span
            className="caption-uppercase"
            style={{ color: "var(--color-muted)" }}
          >
            {category.eyebrow}
          </span>
          <BadgePill>{docs.length}</BadgePill>
        </div>
        <h2
          className="display-md mt-6"
          style={{ color: "var(--color-ink)" }}
        >
          {category.label}
        </h2>
        <p
          className={`body-md mt-3${wide ? "" : " max-w-[44ch]"}`}
          style={{ color: "var(--color-body)" }}
        >
          {category.description}
        </p>
        <ul
          className={
            wide
              ? "mt-6 grid gap-x-10 gap-y-2 sm:grid-cols-2"
              : "mt-6 space-y-2"
          }
        >
          {docs.length === 0 ? (
            <li className="body-sm" style={{ color: "var(--color-muted)" }}>
              Coming soon.
            </li>
          ) : (
            docs.map((d) => {
              const slugPath = d.slug.join("/");
              return (
                <li key={slugPath}>
                  <Link
                    href={`/docs/${category.slug}/${slugPath}`}
                    className="body-sm inline-flex items-center gap-2 hover:opacity-60"
                    style={{ color: "var(--color-ink)" }}
                  >
                    <span aria-hidden style={{ color: "var(--color-muted)" }}>
                      →
                    </span>
                    {d.title}
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </li>
  );
}
