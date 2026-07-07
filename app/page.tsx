import type { ReactNode } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { dict, type Dict } from "@/dictionaries";
import iosShot from "./_media/ios-editor.png";
import pluginShot from "./_media/plugin-panel.png";
import { Wordmark } from "@/app/_components/wordmark";
import { BadgePill } from "@/app/_components/badge-pill";
import { GithubGlyph } from "@/app/_components/github-glyph";
import { AnnouncementBar } from "@/app/_components/announcement-bar";

// iOS is live on the App Store; Android is still in store review, so its CTA keeps
// collecting launch-notify requests over email until the listing goes live.
// TODO(launch): swap NOTIFY_ANDROID_URL for the real Play Store URL once review clears.
const NOTIFY_EMAIL = "jepark2934@gmail.com";
const IOS_APP_STORE_URL = "https://apps.apple.com/us/app/vibi-ai-sound-eraser/id6770426755";
const NOTIFY_ANDROID_URL = `mailto:${NOTIFY_EMAIL}?subject=${encodeURIComponent("Notify me when vibi for Android launches")}`;
const PREMIERE_URL = "https://exchange.adobe.com/apps/cc/b3d5d5b5/vibi-ai-sound-eraser";
const PLUGIN_REPO_URL = "https://github.com/perso-devrel/vibi-adobe-plugin";

// App-screenshot sizing — single knobs for the device/window mockups (px).
const PHONE_FRAME_WIDTH = 212;
// Tuned so the Premiere window renders at the same height as the iOS phone mock.
const PLUGIN_PANEL_MAX_WIDTH = 360;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const NAV_LINKS = [
  { href: "#why", key: "why" as const },
  { href: "#features", key: "features" as const },
  { href: "#scenario", key: "scenario" as const },
  { href: "#workflow", key: "workflow" as const },
];

export default function Home() {
  return (
    <main className="relative">
      <JsonLd dict={dict} />
      <AnnouncementBar dict={dict} />
      <Nav dict={dict} />
      <BrandHero dict={dict} />
      <AppsSection dict={dict} />
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
/* Structured data (JSON-LD)                                   */
/* ────────────────────────────────────────────────────────── */

function JsonLd({ dict }: { dict: Dict }) {
  const site = "https://www.vibi.fm";
  const graph = [
    {
      "@type": "Organization",
      "@id": `${site}/#org`,
      name: "vibi",
      url: site,
      sameAs: ["https://github.com/perso-devrel/vibi", PLUGIN_REPO_URL],
    },
    {
      "@type": "WebSite",
      "@id": `${site}/#website`,
      url: site,
      name: "vibi",
      description: dict.meta.description,
      publisher: { "@id": `${site}/#org` },
    },
    {
      "@type": "MobileApplication",
      name: "vibi",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "iOS 17+, Android",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@id": `${site}/#org` },
    },
    {
      "@type": "SoftwareApplication",
      name: dict.plugin.panelName,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Adobe Premiere Pro 26+",
      url: PREMIERE_URL,
      publisher: { "@id": `${site}/#org` },
    },
  ];
  const json = { "@context": "https://schema.org", "@graph": graph };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

/* ────────────────────────────────────────────────────────── */
/* Nav                                                         */
/* ────────────────────────────────────────────────────────── */

function Nav({ dict }: { dict: Dict }) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-hairline)] bg-[var(--color-canvas)]/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2">
          <Wordmark />
        </a>
        <nav
          aria-label="Primary"
          className="hidden items-center gap-8 text-[15px] font-medium text-[var(--color-ink)] md:flex"
        >
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:opacity-60 transition-opacity">
              {dict.nav[l.key]}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href="/docs" className="btn-outline hidden sm:inline-flex">
            {dict.nav.docs}
            <ArrowUpRightGlyph />
          </a>
          <MobileMenu dict={dict} />
        </div>
      </div>
    </header>
  );
}

/* CSS-only mobile menu — keeps the page a server component (no client JS). */
function MobileMenu({ dict }: { dict: Dict }) {
  return (
    <details className="group relative md:hidden">
      <summary
        aria-label="Menu"
        className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full [&::-webkit-details-marker]:hidden"
        style={{ border: "1px solid var(--color-hairline-strong)" }}
      >
        <MenuGlyph />
      </summary>
      <div
        className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl bg-white py-2 shadow-lg"
        style={{ border: "1px solid var(--color-hairline)" }}
      >
        <nav aria-label="Mobile" className="flex flex-col">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-5 py-2.5 text-[15px] font-medium transition-colors hover:bg-[var(--color-canvas-soft)]"
              style={{ color: "var(--color-ink)" }}
            >
              {dict.nav[l.key]}
            </a>
          ))}
          <a
            href="/docs"
            className="px-5 py-2.5 text-[15px] font-medium transition-colors hover:bg-[var(--color-canvas-soft)]"
            style={{ color: "var(--color-ink)" }}
          >
            {dict.nav.docs}
          </a>
        </nav>
      </div>
    </details>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Brand hero — device-agnostic, value-prop first              */
/* ────────────────────────────────────────────────────────── */

function BrandHero({ dict }: { dict: Dict }) {
  const { hero } = dict;
  return (
    <section
      id="top"
      className="relative overflow-hidden"
      style={{ paddingTop: "104px", paddingBottom: "96px" }}
    >
      <div
        aria-hidden
        className="orb-mint pointer-events-none absolute -left-40 top-0 h-[520px] w-[520px] opacity-70 blur-[8px]"
      />
      <div
        aria-hidden
        className="orb-peach pointer-events-none absolute -right-32 top-24 h-[460px] w-[460px] opacity-70 blur-[8px]"
      />
      <div
        aria-hidden
        className="orb-lavender pointer-events-none absolute left-[38%] top-[55%] h-[420px] w-[420px] opacity-45 blur-[6px]"
      />

      <div className="relative z-10 mx-auto max-w-[1100px] px-6 text-center">
        <p className="caption-uppercase" style={{ color: "var(--color-muted)" }}>
          {hero.eyebrow}
        </p>

        <h1
          className="display-mega mx-auto mt-5 max-w-[16ch] text-balance"
          style={{ color: "var(--color-ink)", letterSpacing: "-0.03em" }}
        >
          {hero.titleLines[0]}
          <br />
          {hero.titleLines[1]}
        </h1>

        <p
          className="body-md mx-auto mt-6 max-w-[60ch] text-pretty"
          style={{ color: "var(--color-body)" }}
        >
          {hero.body}
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          {hero.chips.map((c) => (
            <span
              key={c}
              className="caption-uppercase rounded-full px-3.5 py-1.5"
              style={{ background: "var(--color-surface-strong)", color: "var(--color-ink)" }}
            >
              {c}
            </span>
          ))}
        </div>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a
            href={IOS_APP_STORE_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ height: "48px", padding: "0 22px", fontSize: "15px" }}
          >
            <AppleGlyph />
            {hero.ctaPrimary}
          </a>
          <a
            href={NOTIFY_ANDROID_URL}
            className="btn-primary"
            style={{ height: "48px", padding: "0 22px", fontSize: "15px" }}
          >
            <AndroidGlyph />
            {hero.ctaAndroid}
          </a>
          <a
            href={PREMIERE_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ height: "48px", padding: "0 22px", fontSize: "15px" }}
          >
            <PremiereGlyph />
            {hero.ctaSecondary}
          </a>
        </div>

        <p className="caption mt-5" style={{ color: "var(--color-muted)" }}>
          {hero.caption}
        </p>

        <div className="mx-auto mt-16 max-w-[920px] text-left">
          <WaveformCard dict={dict} />
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Two apps, one engine — co-equal product cards               */
/* ────────────────────────────────────────────────────────── */

function AppsSection({ dict }: { dict: Dict }) {
  const { apps } = dict;
  const ios = apps.items.find((i) => i.kind === "ios")!;
  const premiere = apps.items.find((i) => i.kind === "premiere")!;
  return (
    <Section id="apps">
      <SectionHead eyebrow={apps.eyebrow} title={apps.title} body={apps.body} />

      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 md:items-stretch">
        <AppCard id="app-ios" item={ios} accent="orb-mint" media={<PhoneMock />} />
        <AppCard
          id="app-premiere"
          item={premiere}
          accent="orb-sky"
          media={
            <div className="mx-auto w-full" style={{ maxWidth: PLUGIN_PANEL_MAX_WIDTH }}>
              <WindowFrame title="Premiere Pro">
                <PluginPanel />
              </WindowFrame>
            </div>
          }
        />
      </div>
    </Section>
  );
}

function AppCard({
  id,
  item,
  accent,
  media,
}: {
  id: string;
  item: Dict["apps"]["items"][number];
  accent: string;
  media: ReactNode;
}) {
  const isIos = item.kind === "ios";
  return (
    <article
      id={id}
      className="relative flex scroll-mt-20 flex-col overflow-hidden rounded-2xl bg-white"
      style={{ border: "1px solid var(--color-hairline)" }}
    >
      <div
        className="relative grid place-items-center px-8 pb-12 pt-14"
        style={{
          minHeight: "380px",
          background: "var(--color-canvas-soft)",
          borderBottom: "1px solid var(--color-hairline)",
        }}
      >
        <div
          aria-hidden
          className={`${accent} pointer-events-none absolute -right-10 -top-12 h-72 w-72 opacity-70`}
        />
        <div className="relative w-full max-w-[460px]">{media}</div>
      </div>

      <div className="flex flex-1 flex-col p-8">
        <div className="flex items-center justify-between gap-3">
          <p className="caption-uppercase" style={{ color: "var(--color-muted)" }}>
            {item.eyebrow}
          </p>
          <BadgePill>{item.badge}</BadgePill>
        </div>

        <h3 className="display-md mt-4" style={{ color: "var(--color-ink)" }}>
          {item.tagline}
        </h3>
        <p className="body-md mt-3" style={{ color: "var(--color-body)" }}>
          {item.body}
        </p>

        <ul className="mt-6 space-y-2.5">
          {item.points.map((p) => (
            <li
              key={p}
              className="body-sm flex items-center gap-3"
              style={{ color: "var(--color-body-strong)" }}
            >
              <CheckGlyph />
              {p}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-wrap gap-3 pt-8">
          {isIos ? (
            <>
              <a
                href={IOS_APP_STORE_URL}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{ height: "48px", padding: "0 22px", fontSize: "15px" }}
              >
                <AppleGlyph />
                {item.ctaLabel}
              </a>
              {item.ctaLabelAndroid ? (
                <a
                  href={NOTIFY_ANDROID_URL}
                  className="btn-primary"
                  style={{ height: "48px", padding: "0 22px", fontSize: "15px" }}
                >
                  <AndroidGlyph />
                  {item.ctaLabelAndroid}
                </a>
              ) : null}
            </>
          ) : (
            <a
              href={PREMIERE_URL}
              className="btn-primary"
              style={{ height: "48px", padding: "0 22px", fontSize: "15px" }}
              target="_blank"
              rel="noreferrer"
            >
              <PremiereGlyph />
              {item.ctaLabel}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/* iPhone device frame wrapping a real screenshot of the iOS editor */
function PhoneMock() {
  return (
    <div className="mx-auto" style={{ width: PHONE_FRAME_WIDTH }}>
      <div
        className="relative rounded-[44px] p-[10px]"
        style={{
          background: "var(--color-ink)",
          boxShadow: "0 24px 60px rgba(12,10,9,0.28)",
        }}
      >
        {/* Dynamic Island — overlays the screenshot's empty status-bar center */}
        <div
          aria-hidden
          className="absolute left-1/2 top-[20px] z-10 h-[22px] w-[84px] -translate-x-1/2 rounded-full"
          style={{ background: "var(--color-ink)" }}
        />
        <div className="overflow-hidden rounded-[36px]">
          <Image
            src={iosShot}
            alt="vibi on iPhone — separating a clip into Speaker 1 and Background with per-range volume"
            sizes="212px"
            placeholder="blur"
            className="block h-auto w-full"
          />
        </div>
      </div>
    </div>
  );
}

/* macOS-style application window chrome around a panel */
function WindowFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-xl bg-white"
      style={{
        border: "1px solid var(--color-hairline)",
        boxShadow: "0 18px 44px rgba(12,10,9,0.14)",
      }}
    >
      <div
        className="flex items-center gap-3 px-4"
        style={{
          height: "38px",
          background: "var(--color-canvas-soft)",
          borderBottom: "1px solid var(--color-hairline)",
        }}
      >
        {/* OS traffic lights — intentionally literal system colors, not brand tokens */}
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full" style={{ background: "#ec6a5e" }} />
          <span className="h-3 w-3 rounded-full" style={{ background: "#f4bf4f" }} />
          <span className="h-3 w-3 rounded-full" style={{ background: "#61c554" }} />
        </div>
        <span className="caption" style={{ color: "var(--color-muted)" }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Waveform card (neutral hero visual)                         */
/* ────────────────────────────────────────────────────────── */

function WaveformCard({ dict }: { dict: Dict }) {
  const { waveform } = dict;
  const barPatterns: number[][] = [
    [0.3, 0.6, 0.4, 0.8, 0.5, 0.7, 0.4, 0.9, 0.6, 0.5, 0.7, 0.4, 0.8, 0.5, 0.6, 0.7, 0.5, 0.8, 0.4, 0.6, 0.7, 0.5],
    [0.4, 0.3, 0.5, 0.4, 0.6, 0.3, 0.5, 0.4, 0.6, 0.5, 0.4, 0.6, 0.3, 0.5, 0.4, 0.6, 0.4, 0.5, 0.3, 0.4, 0.5, 0.4],
    [0.2, 0.5, 0.7, 0.6, 0.4, 0.5, 0.6, 0.4, 0.7, 0.5, 0.6, 0.5, 0.4, 0.6, 0.7, 0.5, 0.6, 0.4, 0.5, 0.6, 0.5, 0.4],
  ];

  return (
    <figure
      className="relative overflow-hidden rounded-2xl bg-white"
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
            <span className="caption-uppercase" style={{ color: "var(--color-muted)" }}>
              {waveform.filename}
            </span>
            <p className="display-md mt-3" style={{ color: "var(--color-ink)" }}>
              {waveform.title}
            </p>
            <p className="body-sm mt-3" style={{ color: "var(--color-body)" }}>
              {waveform.body}
            </p>
          </div>
        </div>
        <div className="p-8">
          <ul className="divider-y">
            {waveform.tracks.map((t, idx) => {
              const muted = idx === 2;
              const bars = barPatterns[idx] ?? barPatterns[0];
              return (
                <li key={t.name} className="flex items-center gap-5 py-4 first:pt-0 last:pb-0">
                  <span
                    aria-hidden
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
                    style={{ background: "var(--color-surface-strong)" }}
                  >
                    <span className="caption-uppercase" style={{ color: "var(--color-ink)" }}>
                      {t.name[0]}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="title-sm" style={{ color: "var(--color-ink)" }}>
                      {t.name}
                    </p>
                    <p className="body-sm" style={{ color: "var(--color-muted)" }}>
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

/* ────────────────────────────────────────────────────────── */
/* Premiere panel mockup (bare — chrome supplied by WindowFrame) */
/* ────────────────────────────────────────────────────────── */

function PluginPanel() {
  return (
    <figure className="bg-[var(--color-ink)]">
      <Image
        src={pluginShot}
        alt="vibi panel in Premiere Pro — stem separation with per-speaker mix controls"
        sizes="(max-width: 768px) 100vw, 360px"
        placeholder="blur"
        className="block h-auto w-full"
      />
    </figure>
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
            <em className="not-italic" style={{ color: "var(--color-muted)" }}>
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
        {/* Column headers — desktop only; on mobile each cell is labeled inline */}
        <div
          className="caption-uppercase hidden gap-6 px-6 py-4 md:grid md:grid-cols-[1.2fr_1fr_1fr]"
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
              className="grid grid-cols-1 gap-2 px-6 py-5 md:grid-cols-[1.2fr_1fr_1fr] md:items-center md:gap-6"
            >
              <span className="body-sm" style={{ color: "var(--color-muted)" }}>
                {r.label}
              </span>
              <span className="body-md" style={{ color: "var(--color-body)" }}>
                <span
                  className="caption-uppercase mr-2 md:hidden"
                  style={{ color: "var(--color-muted-soft)" }}
                >
                  {why.legacyHeader}
                </span>
                {r.legacy}
              </span>
              <span className="body-strong" style={{ color: "var(--color-ink)" }}>
                <span
                  className="caption-uppercase mr-2 md:hidden"
                  style={{ color: "var(--color-muted)" }}
                >
                  {why.vibiHeader}
                </span>
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
  const orbs = ["mint", "peach", "lavender"] as const;
  const icons = [<IconStem />, <IconBgm />, <IconChat />];

  return (
    <Section id="features">
      <SectionHead eyebrow={features.eyebrow} title={features.title} body={features.body} />

      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
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
                <span className="caption-uppercase" style={{ color: "var(--color-muted)" }}>
                  {it.eyebrow}
                </span>
                <div
                  className="grid h-10 w-10 place-items-center rounded-full"
                  style={{ background: "var(--color-surface-strong)" }}
                >
                  {icons[idx] ?? icons[0]}
                </div>
              </div>
              <h3 className="display-md mt-8" style={{ color: "var(--color-ink)" }}>
                {it.title}
              </h3>
              <p className="body-md mt-3 max-w-[44ch]" style={{ color: "var(--color-body)" }}>
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
      <SectionHead eyebrow={scenario.eyebrow} title={scenario.title} body={scenario.body} />

      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
        <ScenarioCard tone="muted" title={scenario.beforeTitle} steps={scenario.before} />
        <ScenarioCard tone="bright" title={scenario.afterTitle} steps={scenario.after} />
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
        background: isBright ? "var(--color-surface-card)" : "var(--color-canvas-soft)",
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
                  background: isBright ? "var(--color-ink)" : "var(--color-surface-strong)",
                  color: isBright ? "var(--color-on-primary)" : "var(--color-ink)",
                }}
              >
                {i + 1}
              </span>
              <span
                className="body-md"
                style={{ color: isBright ? "var(--color-ink)" : "var(--color-body)" }}
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
      <SectionHead eyebrow={workflow.eyebrow} title={workflow.title} body={workflow.body} />

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {workflow.rows.map((r, i) => (
          <article
            key={r.step}
            className="rounded-2xl bg-white p-7"
            style={{ border: "1px solid var(--color-hairline)" }}
          >
            <span className="caption-uppercase" style={{ color: "var(--color-muted)" }}>
              0{i + 1}
            </span>
            <h3 className="title-md mt-3" style={{ color: "var(--color-ink)" }}>
              {r.step}
            </h3>
            <div className="mt-5 space-y-4 body-sm">
              <div>
                <p className="caption-uppercase" style={{ color: "var(--color-muted)" }}>
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
                <p className="caption-uppercase" style={{ color: "var(--color-ink)" }}>
                  {workflow.vibiLabel}
                </p>
                <p className="mt-1 body-strong" style={{ color: "var(--color-ink)" }}>
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
      style={{ paddingTop: "96px", paddingBottom: "96px", background: "var(--color-canvas)" }}
    >
      <div
        aria-hidden
        className="orb-lavender pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 opacity-50"
      />
      <div className="relative mx-auto max-w-[1200px] px-6 text-center">
        <h2 className="display-xl mx-auto max-w-[24ch] text-balance" style={{ color: "var(--color-ink)" }}>
          {cta.title}
        </h2>
        <p className="body-md mx-auto mt-5 max-w-[52ch]" style={{ color: "var(--color-body)" }}>
          {cta.body}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a
            href={IOS_APP_STORE_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ height: "48px", padding: "0 22px", fontSize: "15px" }}
          >
            <AppleGlyph />
            {cta.primary}
          </a>
          <a
            href={NOTIFY_ANDROID_URL}
            className="btn-primary"
            style={{ height: "48px", padding: "0 22px", fontSize: "15px" }}
          >
            <AndroidGlyph />
            {cta.android}
          </a>
          <a
            href={PREMIERE_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ height: "48px", padding: "0 22px", fontSize: "15px" }}
          >
            <PremiereGlyph />
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
            <p className="body-md mt-4" style={{ color: "var(--color-body)" }}>
              {footer.tagline}
            </p>
          </div>

          <nav aria-label={footer.productHeading} className="md:text-right">
            <p className="caption-uppercase" style={{ color: "var(--color-muted)" }}>
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

      <div className="relative border-t" style={{ borderColor: "var(--color-hairline-soft)" }}>
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-3 px-6 py-6 md:flex-row md:items-center">
          <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-5">
            <p className="caption" style={{ color: "var(--color-muted)" }}>
              {copyright}
            </p>
            <ul className="flex items-center gap-4">
              {footer.legalLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="caption transition-opacity hover:opacity-60"
                    style={{ color: "var(--color-muted)" }}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
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
      <h2 className="display-lg mt-3 text-balance" style={{ color: "var(--color-ink)" }}>
        {title}
      </h2>
      {body ? (
        <p className="body-md mt-5 text-pretty" style={{ color: "var(--color-body)" }}>
          {body}
        </p>
      ) : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Inline icons                                                */
/* ────────────────────────────────────────────────────────── */

function ArrowUpRightGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-[14px] w-[14px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17L17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

function MenuGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-[16px] w-[16px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--color-ink)" }}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

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

function AndroidGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-[16px] w-[16px]"
      style={{ marginRight: "2px" }}
      fill="currentColor"
    >
      <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.7-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24a11.46 11.46 0 0 0-8.94 0L5.65 5.67c-.19-.28-.54-.37-.83-.22-.3.15-.42.54-.26.85L6.4 9.48A10.81 10.81 0 0 0 1 18h22a10.81 10.81 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" />
    </svg>
  );
}

function PremiereGlyph({ small }: { small?: boolean }) {
  const size = small ? 14 : 16;
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      width={size}
      height={size}
      style={{ marginRight: small ? 0 : "2px" }}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M8 16V9.5h2.4a2 2 0 0 1 0 4H8" />
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

function IconBgm() {
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
      <path d="M9 18V6l11-2v12" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="17" cy="16" r="2.5" />
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
