import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { AnchorHTMLAttributes } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import {
  allDocParams,
  getCategory,
  getDoc,
  isCategorySlug,
  type CategorySlug,
} from "@/lib/docs";
import { resolveDocLink } from "@/lib/docs-links";
import { BadgePill } from "@/app/_components/badge-pill";
import { DocsNav } from "../../_components/docs-nav";

type Params = { category: string; slug: string[] };

const NAV_LINKS = [
  { label: "Home", href: "/" },
];

export function generateStaticParams(): Params[] {
  return allDocParams().map((p) => ({ category: p.category, slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  if (!isCategorySlug(category)) return { title: "Docs" };
  const doc = getDoc(category, slug);
  if (!doc) return { title: "Docs" };
  const canonical = `/docs/${category}/${slug.join("/")}`;
  const title = `${doc.title} — vibi docs`;
  return {
    // Absolute title: the layout template would double-append the brand.
    title: { absolute: title },
    description: doc.excerpt,
    alternates: { canonical },
    openGraph: {
      title,
      description: doc.excerpt,
      url: canonical,
      siteName: "vibi",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: doc.excerpt,
    },
  };
}

export default async function DocPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category, slug } = await params;
  if (!isCategorySlug(category)) notFound();
  const doc = getDoc(category, slug);
  if (!doc) notFound();

  const categoryMeta = getCategory(category);
  const breadcrumb =
    slug.length > 1 ? slug.slice(0, -1).join(" / ") : categoryMeta.eyebrow;

  const site = "https://www.vibi.fm";
  const docUrl = `${site}/docs/${category}/${slug.join("/")}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: doc.title,
        description: doc.excerpt,
        url: docUrl,
        inLanguage: "en",
        articleSection: categoryMeta.label,
        publisher: { "@id": `${site}/#org` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Docs", item: `${site}/docs` },
          { "@type": "ListItem", position: 2, name: categoryMeta.label },
          { "@type": "ListItem", position: 3, name: doc.title, item: docUrl },
        ],
      },
    ],
  };

  return (
    <main className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DocsNav links={NAV_LINKS} />

      <article
        className="mx-auto max-w-[760px] px-6"
        style={{ paddingTop: "72px", paddingBottom: "120px" }}
      >
        <Link
          href="/docs"
          className="caption inline-flex items-center gap-1.5 hover:opacity-60"
          style={{ color: "var(--color-muted)" }}
        >
          <span aria-hidden>←</span> All docs
        </Link>

        <div className="mt-8 flex items-center gap-2">
          <BadgePill>{categoryMeta.label}</BadgePill>
          <span className="caption" style={{ color: "var(--color-muted)" }}>
            {breadcrumb}
          </span>
        </div>

        <h1
          className="display-xl mt-4 text-balance"
          style={{ color: "var(--color-ink)" }}
        >
          {doc.title}
        </h1>

        <div className="prose-doc mt-10">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSlug, rehypeHighlight]}
            components={{
              a: (props) => renderDocAnchor(props, category, slug),
            }}
          >
            {doc.body}
          </ReactMarkdown>
        </div>
      </article>
    </main>
  );
}

function renderDocAnchor(
  props: AnchorHTMLAttributes<HTMLAnchorElement>,
  fromCategory: CategorySlug,
  fromSlug: string[],
) {
  const { href, children, ...rest } = props;
  if (!href) return <span {...rest}>{children}</span>;

  const resolved = resolveDocLink(href, fromCategory, fromSlug);

  if (resolved.kind === "dead") {
    return <span {...rest}>{children}</span>;
  }
  if (resolved.kind === "external") {
    return (
      <a href={resolved.href} target="_blank" rel="noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  if (resolved.kind === "anchor") {
    return (
      <a href={resolved.href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={resolved.href} {...rest}>
      {children}
    </Link>
  );
}
