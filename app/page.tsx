import type { ReactNode } from "react";
import { dict, type Dict } from "@/dictionaries";
import { Wordmark } from "@/app/_components/wordmark";
import { BadgePill } from "@/app/_components/badge-pill";
import { GithubGlyph } from "@/app/_components/github-glyph";

export default function Home() {
  return (
    <main className="relative">
      <Nav dict={dict} />
      <Hero dict={dict} />
      <Differentiator dict={dict} />
      <Features dict={dict} />
      <UseCase dict={dict} />
      <Workflow dict={dict} />
      <ClosingCta dict={dict} />
      <Footer dict={dict} />
    </main>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Nav                                                         */
/* ────────────────────────────────────────────────────────── */

function Nav({ dict }: { dict: Dict }) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-hairline)] bg-[var(--color-canvas)]/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2">
          <Wordmark />
        </a>
        <nav className="hidden items-center gap-8 text-[15px] font-medium text-[var(--color-ink)] md:flex">
          <a href="#why" className="hover:opacity-60 transition-opacity">{dict.nav.why}</a>
          <a href="#features" className="hover:opacity-60 transition-opacity">{dict.nav.features}</a>
          <a href="#scenario" className="hover:opacity-60 transition-opacity">{dict.nav.scenario}</a>
          <a href="#workflow" className="hover:opacity-60 transition-opacity">{dict.nav.workflow}</a>
          <a href="/docs" className="hover:opacity-60 transition-opacity">{dict.nav.docs}</a>
        </nav>
        <a href="https://apps.apple.com/app/vibi" className="btn-primary">
          <AppleGlyph />
          {dict.nav.appStore}
        </a>
      </div>
    </header>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Hero                                                        */
/* ────────────────────────────────────────────────────────── */

function Hero({ dict }: { dict: Dict }) {
  const { hero } = dict;
  return (
    <section
      id="top"
      className="relative overflow-hidden"
      style={{ paddingTop: "96px", paddingBottom: "96px" }}
    >
      <div
        aria-hidden
        className="orb-mint pointer-events-none absolute -left-40 top-10 h-[520px] w-[520px] opacity-70 blur-[8px]"
      />
      <div
        aria-hidden
        className="orb-peach pointer-events-none absolute -right-32 top-40 h-[460px] w-[460px] opacity-70 blur-[8px]"
      />
      <div
        aria-hidden
        className="orb-lavender pointer-events-none absolute left-[30%] top-[60%] h-[420px] w-[420px] opacity-50 blur-[6px]"
      />

      <div className="relative z-10 mx-auto max-w-[1200px] px-6">
        <BadgePill dot>{hero.badge}</BadgePill>

        <h1
          className="display-mega mt-8 max-w-[18ch] text-balance"
          style={{ color: "var(--color-ink)" }}
        >
          {hero.titleLines[0]}
          <br className="hidden md:block" /> {hero.titleLines[1]}
        </h1>

        <p
          className="body-md mt-6 max-w-[58ch] text-pretty"
          style={{ color: "var(--color-body)" }}
        >
          {hero.body}
        </p>

        <HeroCta hero={hero} />

        <div
          className="mt-12 flex flex-wrap items-baseline gap-x-8 gap-y-3 caption"
          style={{ color: "var(--color-muted)" }}
        >
          {hero.stats.flatMap((s, i, all) => {
            const node = <Stat key={`s-${i}`} value={s.value} label={s.label} />;
            return i < all.length - 1
              ? [node, <Dot key={`d-${i}`} />]
              : [node];
          })}
        </div>

        <WaveformCard dict={dict} />
      </div>
    </section>
  );
}

function HeroCta({ hero }: { hero: Dict["hero"] }) {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-3">
      <a
        href="https://apps.apple.com/app/vibi"
        className="btn-primary"
        style={{ height: "48px", padding: "0 22px", fontSize: "15px" }}
      >
        <AppleGlyph />
        {hero.ctaPrimary}
      </a>
      <a
        href="#features"
        className="btn-outline"
        style={{ height: "48px", padding: "0 22px" }}
      >
        {hero.ctaSecondary}
      </a>
      <span className="caption ml-1" style={{ color: "var(--color-muted)" }}>
        {hero.ctaCaption}
      </span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="title-sm" style={{ color: "var(--color-ink)" }}>
        {value}
      </span>
      <span>{label}</span>
    </span>
  );
}

function Dot() {
  return (
    <span
      className="inline-block h-1 w-1 rounded-full"
      style={{ background: "var(--color-hairline-strong)" }}
    />
  );
}

function WaveformCard({ dict }: { dict: Dict }) {
  const { waveform } = dict;
  const barPatterns: number[][] = [
    [0.3, 0.6, 0.4, 0.8, 0.5, 0.7, 0.4, 0.9, 0.6, 0.5, 0.7, 0.4, 0.8, 0.5, 0.6, 0.7, 0.5, 0.8, 0.4, 0.6, 0.7, 0.5],
    [0.4, 0.3, 0.5, 0.4, 0.6, 0.3, 0.5, 0.4, 0.6, 0.5, 0.4, 0.6, 0.3, 0.5, 0.4, 0.6, 0.4, 0.5, 0.3, 0.4, 0.5, 0.4],
    [0.2, 0.5, 0.7, 0.6, 0.4, 0.5, 0.6, 0.4, 0.7, 0.5, 0.6, 0.5, 0.4, 0.6, 0.7, 0.5, 0.6, 0.4, 0.5, 0.6, 0.5, 0.4],
  ];

  return (
    <figure
      className="relative mt-20 overflow-hidden rounded-2xl bg-white"
      style={{
        border: "1px solid var(--color-hairline)",
        boxShadow: "0 4px 24px rgba(12,10,9,0.04)",
      }}
    >
      <div
        aria-hidden
        className="orb-sky pointer-events-none absolute -right-20 -top-20 h-[300px] w-[300px] opacity-50"
      />
      <div className="relative grid grid-cols-1 gap-0 md:grid-cols-[1fr_1.4fr]">
        <div
          className="border-b md:border-b-0 md:border-r"
          style={{ borderColor: "var(--color-hairline)" }}
        >
          <div className="p-8">
            <span
              className="caption-uppercase"
              style={{ color: "var(--color-muted)" }}
            >
              {waveform.filename}
            </span>
            <h3 className="display-md mt-3" style={{ color: "var(--color-ink)" }}>
              {waveform.title}
            </h3>
            <p className="body-sm mt-3" style={{ color: "var(--color-body)" }}>
              {waveform.body}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <PlayButton />
              <span className="body-sm" style={{ color: "var(--color-muted)" }}>
                {waveform.preview}
              </span>
            </div>
          </div>
        </div>
        <div className="p-8">
          <ul className="divider-y">
            {waveform.tracks.map((t, idx) => {
              const muted = idx === 1;
              const bars = barPatterns[idx] ?? barPatterns[0];
              return (
                <li
                  key={t.name}
                  className="flex items-center gap-5 py-4 first:pt-0 last:pb-0"
                >
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
                    style={{ background: "var(--color-surface-strong)" }}
                  >
                    <span
                      className="caption-uppercase"
                      style={{ color: "var(--color-ink)" }}
                    >
                      {t.name[0]}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="title-sm" style={{ color: "var(--color-ink)" }}>
                      {t.name}
                    </p>
                    <p
                      className="body-sm"
                      style={{ color: "var(--color-muted)" }}
                    >
                      {t.subtitle}
                    </p>
                  </div>
                  <div className="flex items-end gap-[2px]" aria-hidden>
                    {bars.map((h, i) => (
                      <span
                        key={i}
                        className="block w-[2px] rounded-full"
                        style={{
                          height: `${Math.round(h * 30) + 4}px`,
                          background: muted
                            ? "var(--color-hairline-strong)"
                            : "var(--color-ink)",
                          opacity: muted ? 0.5 : 0.85,
                        }}
                      />
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </figure>
  );
}

function PlayButton() {
  return (
    <button
      type="button"
      aria-label="play"
      className="grid h-10 w-10 place-items-center rounded-full transition hover:scale-105"
      style={{ background: "var(--color-ink)", color: "var(--color-on-primary)" }}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    </button>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Differentiator                                              */
/* ────────────────────────────────────────────────────────── */

function Differentiator({ dict }: { dict: Dict }) {
  const { why } = dict;
  return (
    <Section id="why">
      <SectionHead
        eyebrow={why.eyebrow}
        title={
          <>
            {why.titleIntro}
            <em
              className="not-italic"
              style={{ color: "var(--color-muted)" }}
            >
              {why.titleEm}
            </em>
            {why.titleOutro}
          </>
        }
        body={why.body}
      />

      <div
        className="mt-14 overflow-hidden rounded-2xl bg-white"
        style={{ border: "1px solid var(--color-hairline)" }}
      >
        <div
          className="caption-uppercase grid grid-cols-[1.2fr_1fr_1fr] gap-6 px-6 py-4"
          style={{
            background: "var(--color-canvas-soft)",
            color: "var(--color-muted)",
            borderBottom: "1px solid var(--color-hairline)",
          }}
        >
          <span></span>
          <span>{why.legacyHeader}</span>
          <span style={{ color: "var(--color-ink)" }}>{why.vibiHeader}</span>
        </div>
        <div className="divider-y">
          {why.rows.map((r) => (
            <div
              key={r.label}
              className="grid grid-cols-[1.2fr_1fr_1fr] items-center gap-6 px-6 py-5"
            >
              <span className="body-sm" style={{ color: "var(--color-muted)" }}>
                {r.label}
              </span>
              <span className="body-md" style={{ color: "var(--color-body)" }}>
                {r.legacy}
              </span>
              <span
                className="body-strong"
                style={{ color: "var(--color-ink)" }}
              >
                {r.vibi}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Features                                                    */
/* ────────────────────────────────────────────────────────── */

function Features({ dict }: { dict: Dict }) {
  const { features } = dict;
  const orbs = ["mint", "peach", "lavender", "sky"] as const;
  const icons = [<IconStem />, <IconCaption />, <IconGlobe />, <IconChat />];

  return (
    <Section id="features">
      <SectionHead
        eyebrow={features.eyebrow}
        title={features.title}
        body={features.body}
      />

      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
        {features.items.map((it, idx) => (
          <article
            key={it.title}
            className="group relative overflow-hidden rounded-2xl bg-white p-8 transition hover:-translate-y-0.5"
            style={{ border: "1px solid var(--color-hairline)" }}
          >
            <div
              aria-hidden
              className={`orb-${orbs[idx] ?? "mint"} pointer-events-none absolute -right-12 -top-12 h-48 w-48 opacity-70`}
            />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span
                  className="caption-uppercase"
                  style={{ color: "var(--color-muted)" }}
                >
                  {it.eyebrow}
                </span>
                <div
                  className="grid h-10 w-10 place-items-center rounded-full"
                  style={{ background: "var(--color-surface-strong)" }}
                >
                  {icons[idx] ?? icons[0]}
                </div>
              </div>
              <h3
                className="display-md mt-8"
                style={{ color: "var(--color-ink)" }}
              >
                {it.title}
              </h3>
              <p
                className="body-md mt-3 max-w-[44ch]"
                style={{ color: "var(--color-body)" }}
              >
                {it.body}
              </p>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Use case                                                    */
/* ────────────────────────────────────────────────────────── */

function UseCase({ dict }: { dict: Dict }) {
  const { scenario } = dict;
  return (
    <Section id="scenario">
      <SectionHead
        eyebrow={scenario.eyebrow}
        title={scenario.title}
        body={scenario.body}
      />

      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
        <ScenarioCard
          tone="muted"
          title={scenario.beforeTitle}
          steps={scenario.before}
        />
        <ScenarioCard
          tone="bright"
          title={scenario.afterTitle}
          steps={scenario.after}
        />
      </div>
    </Section>
  );
}

function ScenarioCard({
  tone,
  title,
  steps,
}: {
  tone: "muted" | "bright";
  title: string;
  steps: string[];
}) {
  const isBright = tone === "bright";
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-8"
      style={{
        background: isBright
          ? "var(--color-surface-card)"
          : "var(--color-canvas-soft)",
        border: "1px solid var(--color-hairline)",
      }}
    >
      {isBright ? (
        <div
          aria-hidden
          className="orb-rose pointer-events-none absolute -right-16 -top-16 h-64 w-64 opacity-60"
        />
      ) : null}
      <div className="relative">
        <p className="caption-uppercase" style={{ color: "var(--color-muted)" }}>
          {title}
        </p>
        <ol className="mt-6 space-y-5">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-4">
              <span
                className="caption-uppercase mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full"
                style={{
                  background: isBright
                    ? "var(--color-ink)"
                    : "var(--color-surface-strong)",
                  color: isBright
                    ? "var(--color-on-primary)"
                    : "var(--color-ink)",
                }}
              >
                {i + 1}
              </span>
              <span
                className="body-md"
                style={{
                  color: isBright
                    ? "var(--color-ink)"
                    : "var(--color-body)",
                }}
              >
                {s}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Workflow                                                    */
/* ────────────────────────────────────────────────────────── */

function Workflow({ dict }: { dict: Dict }) {
  const { workflow } = dict;
  return (
    <Section id="workflow">
      <SectionHead
        eyebrow={workflow.eyebrow}
        title={workflow.title}
        body={workflow.body}
      />

      <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-4">
        {workflow.rows.map((r, i) => (
          <article
            key={r.step}
            className="rounded-2xl bg-white p-7"
            style={{ border: "1px solid var(--color-hairline)" }}
          >
            <span
              className="caption-uppercase"
              style={{ color: "var(--color-muted)" }}
            >
              0{i + 1}
            </span>
            <h4
              className="title-md mt-3"
              style={{ color: "var(--color-ink)" }}
            >
              {r.step}
            </h4>
            <div className="mt-5 space-y-4 body-sm">
              <div>
                <p
                  className="caption-uppercase"
                  style={{ color: "var(--color-muted-soft)" }}
                >
                  {workflow.pcLabel}
                </p>
                <p className="mt-1" style={{ color: "var(--color-body)" }}>
                  {r.pc}
                </p>
              </div>
              <div
                className="border-t pt-4"
                style={{ borderColor: "var(--color-hairline-soft)" }}
              >
                <p
                  className="caption-uppercase"
                  style={{ color: "var(--color-ink)" }}
                >
                  {workflow.vibiLabel}
                </p>
                <p
                  className="mt-1 body-strong"
                  style={{ color: "var(--color-ink)" }}
                >
                  {r.vibi}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Closing CTA                                                 */
/* ────────────────────────────────────────────────────────── */

function ClosingCta({ dict }: { dict: Dict }) {
  const { cta } = dict;
  return (
    <section
      className="relative overflow-hidden"
      style={{
        paddingTop: "96px",
        paddingBottom: "96px",
        background: "var(--color-canvas)",
      }}
    >
      <div
        aria-hidden
        className="orb-lavender pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 opacity-50"
      />
      <div className="relative mx-auto max-w-[1200px] px-6 text-center">
        <h2
          className="display-xl mx-auto max-w-[24ch] text-balance"
          style={{ color: "var(--color-ink)" }}
        >
          {cta.title}
        </h2>
        <p
          className="body-md mx-auto mt-5 max-w-[48ch]"
          style={{ color: "var(--color-body)" }}
        >
          {cta.body}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://apps.apple.com/app/vibi"
            className="btn-primary"
            style={{ height: "48px", padding: "0 22px", fontSize: "15px" }}
          >
            <AppleGlyph />
            {cta.primary}
          </a>
          <a
            href="#features"
            className="btn-outline"
            style={{ height: "48px", padding: "0 22px" }}
          >
            {cta.secondary}
          </a>
        </div>
        <p className="caption mt-6" style={{ color: "var(--color-muted)" }}>
          {cta.caption}
        </p>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Footer                                                      */
/* ────────────────────────────────────────────────────────── */

function Footer({ dict }: { dict: Dict }) {
  const { footer } = dict;
  const year = new Date().getFullYear();
  const copyright = footer.copyright.replace("{year}", String(year));

  return (
    <footer
      className="relative overflow-hidden border-t"
      style={{
        background: "var(--color-canvas)",
        color: "var(--color-body)",
        borderColor: "var(--color-hairline)",
      }}
    >
      <div
        aria-hidden
        className="orb-mint pointer-events-none absolute -bottom-24 -left-32 h-[360px] w-[360px] opacity-40 blur-[8px]"
      />
      <div
        aria-hidden
        className="orb-sky pointer-events-none absolute -right-24 -top-20 h-[280px] w-[280px] opacity-40 blur-[8px]"
      />

      <div
        className="relative mx-auto max-w-[1200px] px-6"
        style={{ paddingTop: "80px", paddingBottom: "40px" }}
      >
        <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-[36ch]">
            <Wordmark />
            <p
              className="body-md mt-4"
              style={{ color: "var(--color-body)" }}
            >
              {footer.tagline}
            </p>
          </div>

          <nav aria-label={footer.productHeading} className="md:text-right">
            <p
              className="caption-uppercase"
              style={{ color: "var(--color-muted)" }}
            >
              {footer.productHeading}
            </p>
            <ul className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 md:justify-end">
              {footer.productLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="body-sm transition-opacity hover:opacity-60"
                    style={{ color: "var(--color-body-strong)" }}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div
        className="relative border-t"
        style={{ borderColor: "var(--color-hairline-soft)" }}
      >
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-3 px-6 py-6 md:flex-row md:items-center">
          <p className="caption" style={{ color: "var(--color-muted)" }}>
            {copyright}
          </p>
          <ul className="flex items-center gap-4">
            {footer.githubLinks.map((g) => (
              <li key={g.href}>
                <a
                  href={g.href}
                  target="_blank"
                  rel="noreferrer"
                  className="caption inline-flex items-center gap-1.5 transition-opacity hover:opacity-60"
                  style={{ color: "var(--color-muted)" }}
                >
                  <GithubGlyph />
                  <span>{g.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Layout helpers                                              */
/* ────────────────────────────────────────────────────────── */

function Section({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <section id={id} style={{ paddingTop: "96px", paddingBottom: "96px" }}>
      <div className="mx-auto max-w-[1200px] px-6">{children}</div>
    </section>
  );
}

function SectionHead({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: ReactNode;
  body?: string;
}) {
  return (
    <div className="max-w-[44ch]">
      <p className="caption-uppercase" style={{ color: "var(--color-muted)" }}>
        {eyebrow}
      </p>
      <h2
        className="display-lg mt-3 text-balance"
        style={{ color: "var(--color-ink)" }}
      >
        {title}
      </h2>
      {body ? (
        <p
          className="body-md mt-5 text-pretty"
          style={{ color: "var(--color-body)" }}
        >
          {body}
        </p>
      ) : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Inline icons                                                */
/* ────────────────────────────────────────────────────────── */

function AppleGlyph() {
  return (
    <svg
      viewBox="0 0 17 20"
      aria-hidden
      className="h-[18px] w-[15px]"
      style={{ marginRight: "2px" }}
      fill="currentColor"
    >
      <path d="M13.94 10.62c-.02-2.16 1.77-3.2 1.85-3.25-1-1.47-2.58-1.67-3.13-1.69-1.34-.13-2.6.78-3.27.78-.68 0-1.72-.76-2.83-.74-1.46.02-2.81.84-3.55 2.13-1.51 2.62-.39 6.5 1.09 8.62.72 1.04 1.58 2.21 2.69 2.17 1.08-.04 1.49-.7 2.79-.7 1.31 0 1.68.7 2.83.68 1.17-.02 1.91-1.06 2.62-2.1.83-1.21 1.17-2.39 1.19-2.45-.03-.01-2.27-.87-2.28-3.45zM11.79 4.27c.59-.72.99-1.71.88-2.7-.85.04-1.89.57-2.5 1.28-.55.63-1.04 1.65-.91 2.62.95.07 1.93-.48 2.53-1.2z" />
    </svg>
  );
}

function IconStem() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      style={{ color: "var(--color-ink)" }}
    >
      <path d="M3 12h2" /><path d="M6 9v6" /><path d="M9 6v12" />
      <path d="M12 9v6" /><path d="M15 4v16" /><path d="M18 9v6" />
      <path d="M21 12h-2" />
    </svg>
  );
}

function IconCaption() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--color-ink)" }}
    >
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M7 14h3" /><path d="M14 14h3" />
      <path d="M7 11h2" /><path d="M12 11h5" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      style={{ color: "var(--color-ink)" }}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--color-ink)" }}
    >
      <path d="M4 5h16v11H8l-4 4z" />
      <path d="M8 10h8" />
      <path d="M8 13h5" />
    </svg>
  );
}
