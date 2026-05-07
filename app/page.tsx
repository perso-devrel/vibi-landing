import type { ReactNode } from "react";

export default function Home() {
  return (
    <main className="relative">
      <Nav />
      <Hero />
      <Differentiator />
      <Features />
      <UseCase />
      <Workflow />
      <ClosingCta />
      <Footer />
    </main>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Nav                                                         */
/* ────────────────────────────────────────────────────────── */

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-hairline)] bg-[var(--color-canvas)]/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2">
          <Wordmark />
        </a>
        <nav className="hidden items-center gap-8 text-[15px] font-medium text-[var(--color-ink)] md:flex">
          <a href="#why" className="hover:opacity-60 transition-opacity">왜 vibi</a>
          <a href="#features" className="hover:opacity-60 transition-opacity">기능</a>
          <a href="#scenario" className="hover:opacity-60 transition-opacity">사용 모습</a>
          <a href="#workflow" className="hover:opacity-60 transition-opacity">워크플로우</a>
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="#features"
            className="hidden rounded-full px-4 py-2 text-[15px] font-medium text-[var(--color-ink)] hover:opacity-60 sm:inline-block"
          >
            둘러보기
          </a>
          <a
            href="https://apps.apple.com/app/vibi"
            className="btn-primary"
          >
            <AppleGlyph />
            App Store
          </a>
        </div>
      </div>
    </header>
  );
}

function Wordmark() {
  return (
    <span className="display-sm" style={{ letterSpacing: "-0.02em" }}>
      vibi
    </span>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Hero                                                        */
/* ────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden"
      style={{ paddingTop: "96px", paddingBottom: "96px" }}
    >
      {/* Atmospheric orbs — pure decoration, never as content */}
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
        <BadgePill>iOS · App Store 출시</BadgePill>

        <h1
          className="display-mega mt-8 max-w-[18ch] text-balance"
          style={{ color: "var(--color-ink)" }}
        >
          영상 속 보이스만 살리고,
          <br className="hidden md:block" /> 나머지는 다시 입히다.
        </h1>

        <p className="body-md mt-6 max-w-[58ch] text-pretty" style={{ color: "var(--color-body)" }}>
          기존 모바일 앱은 영상 사운드를 한 덩어리로 다룹니다. vibi 는 보이스 / 배경 /
          사람별로 분리해, 원하는 부분만 살리고 BGM·AI 보이스를 다시 얹습니다.
        </p>

        <HeroCta />

        <div className="mt-12 flex flex-wrap items-baseline gap-x-8 gap-y-3 caption" style={{ color: "var(--color-muted)" }}>
          <Stat label="원하는 부분만 분리" value="구간 선택" />
          <Dot />
          <Stat label="다국어 더빙" value="10+ 언어" />
          <Dot />
          <Stat label="작업 위치" value="모바일 한 손" />
        </div>

        <WaveformCard />
      </div>
    </section>
  );
}

function BadgePill({ children }: { children: ReactNode }) {
  return (
    <span
      className="caption-uppercase inline-flex items-center gap-2 rounded-full px-3 py-1"
      style={{
        background: "var(--color-surface-strong)",
        color: "var(--color-ink)",
      }}
    >
      <span className="relative inline-flex h-1.5 w-1.5">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
          style={{ background: "var(--color-gradient-sky)" }}
        />
        <span
          className="relative inline-flex h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--color-ink)" }}
        />
      </span>
      {children}
    </span>
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
  return <span className="h-1 w-1 rounded-full" style={{ background: "var(--color-hairline-strong)" }} />;
}

function HeroCta() {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-3">
      <a
        href="https://apps.apple.com/app/vibi"
        className="btn-primary"
        style={{ height: "48px", padding: "0 22px", fontSize: "15px" }}
      >
        <AppleGlyph />
        App Store 에서 받기
      </a>
      <a href="#features" className="btn-outline" style={{ height: "48px", padding: "0 22px" }}>
        기능 둘러보기
      </a>
      <span className="caption ml-1" style={{ color: "var(--color-muted)" }}>
        iOS 17+ · 무료 다운로드
      </span>
    </div>
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

function WaveformCard() {
  // ElevenLabs `audio-waveform-card` analog — surface-card, rounded-xl, 1px hairline.
  const tracks: { name: string; subtitle: string; bars: number[]; muted?: boolean }[] = [
    {
      name: "Voice",
      subtitle: "보이스 — 무손상",
      bars: [0.3, 0.6, 0.4, 0.8, 0.5, 0.7, 0.4, 0.9, 0.6, 0.5, 0.7, 0.4, 0.8, 0.5, 0.6, 0.7, 0.5, 0.8, 0.4, 0.6, 0.7, 0.5],
    },
    {
      name: "Background",
      subtitle: "배경 — 음소거",
      muted: true,
      bars: [0.4, 0.3, 0.5, 0.4, 0.6, 0.3, 0.5, 0.4, 0.6, 0.5, 0.4, 0.6, 0.3, 0.5, 0.4, 0.6, 0.4, 0.5, 0.3, 0.4, 0.5, 0.4],
    },
    {
      name: "BGM",
      subtitle: "BGM — 새로 추가",
      bars: [0.2, 0.5, 0.7, 0.6, 0.4, 0.5, 0.6, 0.4, 0.7, 0.5, 0.6, 0.5, 0.4, 0.6, 0.7, 0.5, 0.6, 0.4, 0.5, 0.6, 0.5, 0.4],
    },
  ];

  return (
    <figure
      className="relative mt-20 overflow-hidden rounded-2xl bg-white"
      style={{
        border: "1px solid var(--color-hairline)",
        boxShadow: "0 4px 24px rgba(12,10,9,0.04)",
      }}
    >
      {/* faint atmospheric orb behind the card content */}
      <div
        aria-hidden
        className="orb-sky pointer-events-none absolute -right-20 -top-20 h-[300px] w-[300px] opacity-50"
      />
      <div className="relative grid grid-cols-1 gap-0 md:grid-cols-[1fr_1.4fr]">
        <div className="border-b md:border-b-0 md:border-r" style={{ borderColor: "var(--color-hairline)" }}>
          <div className="p-8">
            <span className="caption-uppercase" style={{ color: "var(--color-muted)" }}>
              여행_vlog_03.mov
            </span>
            <h3 className="display-md mt-3" style={{ color: "var(--color-ink)" }}>
              한 구간, 세 트랙.
            </h3>
            <p className="body-sm mt-3" style={{ color: "var(--color-body)" }}>
              타임라인에서 원하는 구간을 골라 보이스·배경을 분리하고, BGM 트랙을 더해 다시
              합칩니다. 영상 전체가 아니라 필요한 부분만, 보이스는 한 번도 압축되지
              않습니다.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <PlayButton />
              <span className="body-sm" style={{ color: "var(--color-muted)" }}>
                미리듣기 · 0:42
              </span>
            </div>
          </div>
        </div>
        <div className="p-8">
          <ul className="divider-y">
            {tracks.map((t) => (
              <li key={t.name} className="flex items-center gap-5 py-4 first:pt-0 last:pb-0">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
                  style={{ background: "var(--color-surface-strong)" }}
                >
                  <span className="caption-uppercase" style={{ color: "var(--color-ink)" }}>
                    {t.name[0]}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="title-sm" style={{ color: "var(--color-ink)" }}>{t.name}</p>
                  <p className="body-sm" style={{ color: "var(--color-muted)" }}>{t.subtitle}</p>
                </div>
                <div className="flex items-end gap-[2px]" aria-hidden>
                  {t.bars.map((h, i) => (
                    <span
                      key={i}
                      className="block w-[2px] rounded-full"
                      style={{
                        height: `${Math.round(h * 30) + 4}px`,
                        background: t.muted ? "var(--color-hairline-strong)" : "var(--color-ink)",
                        opacity: t.muted ? 0.5 : 0.85,
                      }}
                    />
                  ))}
                </div>
              </li>
            ))}
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
      aria-label="미리듣기"
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

function Differentiator() {
  const rows = [
    { label: "사운드 단위",        legacy: "영상 1개 = 사운드 한 덩어리",      vibi: "영상 1개 = 보이스 / 배경 / 사람별" },
    { label: "잡음 제거",          legacy: "다 같이 깎임 (보이스도 손상)",    vibi: "배경만 끄기 — 보이스 그대로" },
    { label: "BGM 교체",           legacy: "기존 위에 덧씌움 (겹쳐 들림)",    vibi: "보이스만 살리고 BGM 갈아끼움" },
    { label: "사람별 목소리 부각", legacy: "불가능",                          vibi: "두 명 인터뷰 중 한 명만 살리기" },
    { label: "작업 위치",          legacy: "PC 전문 도구",                    vibi: "모바일 — 촬영한 그 자리" },
  ];

  return (
    <Section id="why">
      <SectionHead
        eyebrow="왜 vibi"
        title={<>사운드를 분리해서 <em className="not-italic" style={{ color: "var(--color-muted)" }}>부분 단위로</em> 다루세요.</>}
        body="기존 모바일 영상 앱은 사운드를 통째로만 만집니다. vibi 는 영상 한 편을 보이스, 배경, 사람별로 쪼개서 — 원하는 부분만 살리고, 끄고, 교체합니다."
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
          <span>기존 모바일 앱</span>
          <span style={{ color: "var(--color-ink)" }}>vibi</span>
        </div>
        <div className="divider-y">
          {rows.map((r) => (
            <div
              key={r.label}
              className="grid grid-cols-[1.2fr_1fr_1fr] items-center gap-6 px-6 py-5"
            >
              <span className="body-sm" style={{ color: "var(--color-muted)" }}>{r.label}</span>
              <span className="body-md" style={{ color: "var(--color-body)" }}>{r.legacy}</span>
              <span className="body-strong" style={{ color: "var(--color-ink)" }}>{r.vibi}</span>
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

function Features() {
  const items: {
    eyebrow: string;
    title: string;
    body: string;
    orb: "mint" | "peach" | "lavender" | "sky";
    icon: ReactNode;
  }[] = [
    {
      eyebrow: "메인 기능",
      title: "구간 선택 음원 분리",
      body: "타임라인에서 원하는 구간을 잡고, 그 부분의 보이스 / 배경 / 사람별 사운드를 분리합니다. 영상 전체가 아니라 필요한 만큼만, 부분 단위로.",
      orb: "mint",
      icon: <IconStem />,
    },
    {
      eyebrow: "보조",
      title: "자동 자막 + 다국어 번역",
      body: "발화를 자막으로, 그리고 여러 언어로 동시에 번역합니다. 폰트와 위치는 화면에서 바로 조정.",
      orb: "peach",
      icon: <IconCaption />,
    },
    {
      eyebrow: "보조",
      title: "자동 다국어 더빙",
      body: "영상 음성을 다른 언어 AI 보이스로 자연스럽게 합성. 한 영상에서 여러 언어 버전을 동시에 만들어보세요.",
      orb: "lavender",
      icon: <IconGlobe />,
    },
    {
      eyebrow: "AI",
      title: "채팅으로 편집",
      body: "“선택한 구간 보이스만 살려줘” 같은 자연어 명령으로 편집 도구를 호출합니다. 메뉴를 뒤지지 않아도 됩니다.",
      orb: "sky",
      icon: <IconChat />,
    },
  ];

  return (
    <Section id="features">
      <SectionHead
        eyebrow="기능"
        title="촬영부터 발행까지, 한 손에서."
        body="복잡한 PC 도구 없이 모바일에서 끝납니다. 음원 분리를 중심으로 자막, 더빙, AI 채팅 편집이 자연스럽게 이어집니다."
      />

      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
        {items.map((it) => (
          <article
            key={it.title}
            className="group relative overflow-hidden rounded-2xl bg-white p-8 transition hover:-translate-y-0.5"
            style={{
              border: "1px solid var(--color-hairline)",
              boxShadow: "0 4px 16px rgba(12,10,9,0.0)",
            }}
          >
            {/* atmospheric orb behind the icon */}
            <div
              aria-hidden
              className={`orb-${it.orb} pointer-events-none absolute -right-12 -top-12 h-48 w-48 opacity-70`}
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
                  {it.icon}
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

function UseCase() {
  const before = [
    "호텔 들어가서 노트북 켜기",
    "영상 PC 로 옮기기 (5–15분)",
    "전문 편집 도구에서 잡음 제거",
    "외부 BGM 라이브러리 검색 → 다운로드 → import",
    "다시 모바일로 보내서 발행",
  ];
  const after = [
    "갤러리에서 영상 픽업",
    "타임라인에서 원하는 구간 선택 → 음원 분리",
    "배경 끄기 — 보이스만 무손상으로 살림",
    "BGM 픽업 → 타임라인에 추가 → 볼륨 조절",
    "익스포트 → 시스템 공유로 채널 직발행",
  ];

  return (
    <Section id="scenario">
      <SectionHead
        eyebrow="사용 모습"
        title="여행 vlog — 시장 소음 위에 보이스만 남기기."
        body="현장 분위기는 살리되 잡음은 빼고 싶을 때, vibi 는 5분이 채 걸리지 않습니다."
      />

      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
        <ScenarioCard tone="muted" title="Before — PC 워크플로우" steps={before} />
        <ScenarioCard tone="bright" title="After — vibi" steps={after} />
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

function Workflow() {
  const rows = [
    { step: "영상 가져오기", pc: "케이블 / iCloud / AirDrop · 5–15분", vibi: "갤러리 직접 픽업 · 5초" },
    { step: "보이스 추가",   pc: "PC 마이크 셋업 / 외부 마이크",         vibi: "폰 마이크 즉석 녹음" },
    { step: "미리보기",      pc: "렌더 후 재생",                         vibi: "타임라인에서 즉시 재생" },
    { step: "발행",          pc: "익스포트 → 폰으로 보내기 → 채널 업로드", vibi: "시스템 공유로 채널 한 번에" },
  ];

  return (
    <Section id="workflow">
      <SectionHead
        eyebrow="워크플로우"
        title="PC 5분 작업이, vibi 에선 5초입니다."
        body="시간·장소 제약 0. 카페든 여행지든 지하철이든, 트렌드의 휘발성을 놓치지 않습니다."
      />

      <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-4">
        {rows.map((r, i) => (
          <article
            key={r.step}
            className="rounded-2xl bg-white p-7"
            style={{ border: "1px solid var(--color-hairline)" }}
          >
            <span className="caption-uppercase" style={{ color: "var(--color-muted)" }}>
              0{i + 1}
            </span>
            <h4 className="title-md mt-3" style={{ color: "var(--color-ink)" }}>{r.step}</h4>
            <div className="mt-5 space-y-4 body-sm">
              <div>
                <p className="caption-uppercase" style={{ color: "var(--color-muted-soft)" }}>PC</p>
                <p className="mt-1" style={{ color: "var(--color-body)" }}>{r.pc}</p>
              </div>
              <div className="border-t pt-4" style={{ borderColor: "var(--color-hairline-soft)" }}>
                <p className="caption-uppercase" style={{ color: "var(--color-ink)" }}>vibi</p>
                <p className="mt-1 body-strong" style={{ color: "var(--color-ink)" }}>{r.vibi}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Closing CTA — `cta-band` per DESIGN.md                      */
/* ────────────────────────────────────────────────────────── */

function ClosingCta() {
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
        <h2 className="display-xl mx-auto max-w-[22ch] text-balance" style={{ color: "var(--color-ink)" }}>
          오늘 촬영한 영상에, 보이스를 다시 입혀보세요.
        </h2>
        <p className="body-md mx-auto mt-5 max-w-[44ch]" style={{ color: "var(--color-body)" }}>
          App Store 에서 받고, 첫 영상은 무료 크레딧으로 — 5분 안에 끝납니다.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://apps.apple.com/app/vibi"
            className="btn-primary"
            style={{ height: "48px", padding: "0 22px", fontSize: "15px" }}
          >
            <AppleGlyph />
            App Store 에서 받기
          </a>
          <a
            href="#features"
            className="btn-outline"
            style={{ height: "48px", padding: "0 22px" }}
          >
            기능 다시 보기
          </a>
        </div>
        <p className="caption mt-6" style={{ color: "var(--color-muted)" }}>
          iOS 17+ · 무료 다운로드 · Android 는 추후 지원
        </p>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Footer                                                      */
/* ────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer
      className="border-t"
      style={{
        background: "var(--color-canvas)",
        color: "var(--color-body)",
        borderColor: "var(--color-hairline)",
      }}
    >
      <div
        className="mx-auto grid max-w-[1200px] grid-cols-2 gap-10 px-6 md:grid-cols-5"
        style={{ paddingTop: "64px", paddingBottom: "64px" }}
      >
        <div className="col-span-2">
          <Wordmark />
          <p className="body-sm mt-4 max-w-[28ch]" style={{ color: "var(--color-body)" }}>
            모바일 영상 보이스 리믹싱. 촬영한 그 자리에서.
          </p>
        </div>
        <FooterCol
          title="제품"
          links={[
            { label: "기능", href: "#features" },
            { label: "사용 모습", href: "#scenario" },
            { label: "워크플로우", href: "#workflow" },
          ]}
        />
        <FooterCol
          title="회사"
          links={[
            { label: "Perso AI", href: "https://perso.ai" },
            { label: "문의", href: "mailto:devrel.365@gmail.com" },
          ]}
        />
        <FooterCol
          title="법률"
          links={[
            { label: "개인정보 처리방침", href: "#" },
            { label: "이용약관", href: "#" },
          ]}
        />
      </div>
      <div
        className="border-t"
        style={{ borderColor: "var(--color-hairline-soft)" }}
      >
        <div
          className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-2 px-6 py-6 md:flex-row md:items-center"
        >
          <p className="caption" style={{ color: "var(--color-muted)" }}>
            © {new Date().getFullYear()} vibi. Powered by Perso AI.
          </p>
          <p className="caption" style={{ color: "var(--color-muted)" }}>
            Made for short-form creators.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="caption-uppercase" style={{ color: "var(--color-muted)" }}>{title}</p>
      <ul className="mt-4 space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="body-sm hover:opacity-60"
              style={{ color: "var(--color-body)" }}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Layout helpers                                              */
/* ────────────────────────────────────────────────────────── */

function Section({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <section
      id={id}
      style={{ paddingTop: "96px", paddingBottom: "96px" }}
    >
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
    <div className="max-w-[40ch]">
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

function IconStem() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{ color: "var(--color-ink)" }}>
      <path d="M3 12h2" /><path d="M6 9v6" /><path d="M9 6v12" /><path d="M12 9v6" /><path d="M15 4v16" /><path d="M18 9v6" /><path d="M21 12h-2" />
    </svg>
  );
}

function IconCaption() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-ink)" }}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M7 14h3" /><path d="M14 14h3" /><path d="M7 11h2" /><path d="M12 11h5" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{ color: "var(--color-ink)" }}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18" /><path d="M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-ink)" }}>
      <path d="M4 5h16v11H8l-4 4z" />
      <path d="M8 10h8" /><path d="M8 13h5" />
    </svg>
  );
}
