import type { Dict } from "@/dictionaries";

/**
 * Top-of-page notice strip — editorial/light, matching the brand canvas (no dark
 * dev-tools band). Pure server component: the feedback CTA is a plain mailto link.
 */
export function AnnouncementBar({ dict }: { dict: Dict }) {
  const a = dict.announcement;
  const feedbackHref = `mailto:${a.feedbackEmail}?subject=${encodeURIComponent(
    a.feedbackSubject,
  )}`;

  return (
    <div
      className="relative z-[60] w-full overflow-hidden border-b"
      style={{ background: "var(--color-canvas-soft)", borderColor: "var(--color-hairline)" }}
    >
      {/* faint atmospheric orb — the brand's only "color" moment */}
      <div
        aria-hidden
        className="orb-peach pointer-events-none absolute -left-24 top-1/2 h-[200px] w-[200px] -translate-y-1/2 opacity-40 blur-[6px]"
      />

      <div className="relative mx-auto flex max-w-[1200px] items-center justify-center px-6 py-2.5 text-center">
        <p className="body-sm inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span
            className="caption-uppercase rounded-full px-2.5 py-0.5"
            style={{ background: "var(--color-surface-strong)", color: "var(--color-ink)" }}
          >
            {a.badge}
          </span>
          <span style={{ color: "var(--color-ink)" }}>{a.message}</span>
          <span style={{ color: "var(--color-muted)" }}>
            {a.feedbackText}{" "}
            <a
              href={feedbackHref}
              className="font-medium underline underline-offset-2 transition-opacity hover:opacity-60"
              style={{ color: "var(--color-ink)" }}
            >
              {a.feedbackLabel}
            </a>
          </span>
        </p>
      </div>
    </div>
  );
}
