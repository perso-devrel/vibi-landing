import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { getLegalDoc, type LegalDoc } from "@/lib/legal";
import { BadgePill } from "@/app/_components/badge-pill";
import { DocsNav } from "@/app/docs/_components/docs-nav";

const NAV_LINKS = [{ label: "Home", href: "/" }];

/** 게시용 법무 문서 한 장 — docs 상세 페이지와 동일한 컨테이너/타이포(prose-doc)로 렌더. */
export function LegalArticle({
  slug,
}: {
  slug: "privacy-policy" | "terms-of-service" | "account-deletion";
}) {
  const doc: LegalDoc = getLegalDoc(slug);
  return (
    <main className="relative">
      <DocsNav links={NAV_LINKS} />
      <article
        className="mx-auto max-w-[760px] px-6"
        style={{ paddingTop: "72px", paddingBottom: "120px" }}
      >
        <Link
          href="/"
          className="caption inline-flex items-center gap-1.5 hover:opacity-60"
          style={{ color: "var(--color-muted)" }}
        >
          <span aria-hidden>←</span> Home
        </Link>

        <div className="mt-8 flex items-center gap-2">
          <BadgePill>Legal</BadgePill>
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
            rehypePlugins={[rehypeSlug]}
            components={{ a: renderLegalAnchor }}
          >
            {doc.body}
          </ReactMarkdown>
        </div>
      </article>
    </main>
  );
}

function renderLegalAnchor(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { href, children, ...rest } = props;
  if (!href) return <span {...rest}>{children}</span>;
  // 외부(스토어/정책) 링크는 새 탭, 내부(/privacy·/terms) 링크는 client nav.
  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  if (href.startsWith("#")) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}
