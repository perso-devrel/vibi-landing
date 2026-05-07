import type { ReactNode } from "react";

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <BackgroundOrbs />
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

/* ─────────────────────────────────────────────────────────── */
/* Nav                                                          */
/* ─────────────────────────────────────────────────────────── */

function Nav() {
  return (
    <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <a href="#top" className="flex items-center gap-2">
        <Logo />
        <span className="text-lg font-semibold tracking-tight">vibi</span>
      </a>
      <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
        <a href="#why" className="hover:text-white transition-colors">
          왜 vibi
        </a>
        <a href="#features" className="hover:text-white transition-colors">
          기능
        </a>
        <a href="#scenario" className="hover:text-white transition-colors">
          사용 모습
        </a>
        <a href="#workflow" className="hover:text-white transition-colors">
          워크플로우
        </a>
      </nav>
      <a
        href="#waitlist"
        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:border-white/20 hover:bg-white/10"
      >
        사전 등록
      </a>
    </header>
  );
}

function Logo() {
  return (
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-2)] text-[15px] font-bold text-black">
      v
    </span>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Hero                                                         */
/* ─────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section
      id="top"
      className="grain relative mx-auto max-w-6xl px-6 pb-24 pt-16 md:pb-36 md:pt-24"
    >
      <div className="relative z-10">
        <Badge>iOS 사전 등록 진행 중</Badge>
        <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
          영상 속{" "}
          <span className="gradient-text">보이스만 살리고</span>,
          <br className="hidden md:block" /> 나머지는 갈아끼우세요.
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-lg text-zinc-400 md:text-xl">
          기존 모바일 앱은 영상 사운드를 한 덩어리로 다룹니다.
          <br className="hidden md:block" />{" "}
          <span className="text-white">vibi</span> 는 보이스 / 배경 / 사람별로
          분리해, 원하는 부분만 살리고 BGM·AI 보이스를 다시 얹습니다.
        </p>

        <Waitlist />

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-zinc-500">
          <Stat label="음원 분리 대기" value="30초" />
          <Divider />
          <Stat label="다국어 더빙" value="10+ 언어" />
          <Divider />
          <Stat label="작업 위치" value="모바일 한 손" />
        </div>
      </div>

      <PhonePreview />
    </section>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300 backdrop-blur">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent-2)] opacity-75"></span>
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-accent-2)]"></span>
      </span>
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-white">{value}</span>
      <span>{label}</span>
    </div>
  );
}

function Divider() {
  return <span className="h-3 w-px bg-white/10" />;
}

function Waitlist() {
  return (
    <form
      id="waitlist"
      action="#"
      className="mt-10 flex max-w-md flex-col gap-2 sm:flex-row"
    >
      <label htmlFor="email" className="sr-only">
        이메일
      </label>
      <input
        id="email"
        type="email"
        required
        placeholder="you@email.com"
        className="flex-1 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-white/30 focus:bg-white/10"
      />
      <button
        type="submit"
        className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
      >
        사전 등록
      </button>
    </form>
  );
}

function PhonePreview() {
  return (
    <div className="pointer-events-none relative mx-auto mt-20 hidden max-w-3xl md:block">
      <div className="ring-soft relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80">
        <TrackVisualizer />
      </div>
    </div>
  );
}

function TrackVisualizer() {
  const tracks: { name: string; color: string; bars: number[] }[] = [
    {
      name: "Voice",
      color: "var(--color-accent)",
      bars: [0.3, 0.6, 0.4, 0.8, 0.5, 0.7, 0.4, 0.9, 0.6, 0.5, 0.7, 0.4, 0.8, 0.5, 0.6, 0.7, 0.5, 0.8, 0.4, 0.6],
    },
    {
      name: "Background",
      color: "var(--color-accent-2)",
      bars: [0.4, 0.3, 0.5, 0.4, 0.6, 0.3, 0.5, 0.4, 0.6, 0.5, 0.4, 0.6, 0.3, 0.5, 0.4, 0.6, 0.4, 0.5, 0.3, 0.4],
    },
    {
      name: "BGM (added)",
      color: "#f5d65a",
      bars: [0.2, 0.5, 0.7, 0.6, 0.4, 0.5, 0.6, 0.4, 0.7, 0.5, 0.6, 0.5, 0.4, 0.6, 0.7, 0.5, 0.6, 0.4, 0.5, 0.6],
    },
  ];

  return (
    <div className="absolute inset-0 flex flex-col gap-4 p-8">
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-red-400/80" />
        <span className="h-2 w-2 rounded-full bg-yellow-400/80" />
        <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
        <span className="ml-3 text-xs text-zinc-500">vibi · 여행_vlog_03.mov</span>
      </div>
      <div className="mt-4 flex-1 space-y-3">
        {tracks.map((t) => (
          <div
            key={t.name}
            className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
          >
            <span className="w-32 shrink-0 text-xs font-medium text-zinc-300">
              {t.name}
            </span>
            <div className="flex flex-1 items-center gap-[3px]">
              {t.bars.map((h, i) => (
                <span
                  key={i}
                  className="block w-1 rounded-full"
                  style={{
                    height: `${Math.round(h * 36)}px`,
                    background: t.color,
                    opacity: t.name === "Background" ? 0.25 : 0.85,
                  }}
                />
              ))}
            </div>
            <span className="ml-2 shrink-0 text-[11px] text-zinc-500">
              {t.name === "Background" ? "Muted" : "On"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Differentiator                                               */
/* ─────────────────────────────────────────────────────────── */

function Differentiator() {
  const rows = [
    {
      label: "사운드 단위",
      legacy: "영상 1개 = 사운드 한 덩어리",
      vibi: "영상 1개 = 보이스 / 배경 / 사람별",
    },
    {
      label: "잡음 제거",
      legacy: "다 같이 깎임 (보이스도 손상)",
      vibi: "배경만 끄기 — 보이스 그대로",
    },
    {
      label: "BGM 교체",
      legacy: "기존 위에 덧씌움 (겹쳐 들림)",
      vibi: "보이스만 살리고 BGM 갈아끼움",
    },
    {
      label: "사람별 목소리 부각",
      legacy: "불가능",
      vibi: "두 명 인터뷰 중 한 명만 살리기",
    },
    {
      label: "작업 위치",
      legacy: "PC 전문 도구",
      vibi: "모바일 — 촬영한 그 자리",
    },
  ];

  return (
    <section
      id="why"
      className="relative mx-auto max-w-6xl px-6 py-24 md:py-32"
    >
      <SectionHeading
        eyebrow="왜 vibi"
        title={
          <>
            사운드를 <em className="not-italic gradient-text">분리해서</em>{" "}
            부분 단위로 다루세요.
          </>
        }
        body="기존 모바일 영상 앱은 사운드를 통째로만 만집니다. vibi 는 영상 한 편을 보이스, 배경, 사람별로 쪼개서 — 원하는 부분만 살리고, 끄고, 교체합니다."
      />

      <div className="mt-14 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500 md:px-6 md:text-sm">
          <span></span>
          <span>기존 모바일 앱</span>
          <span className="text-white">vibi</span>
        </div>
        {rows.map((r, i) => (
          <div
            key={r.label}
            className={`grid grid-cols-[1fr_1fr_1fr] gap-4 px-4 py-4 text-sm md:px-6 md:text-base ${
              i !== rows.length - 1 ? "border-b border-white/5" : ""
            }`}
          >
            <span className="text-zinc-400">{r.label}</span>
            <span className="text-zinc-500">{r.legacy}</span>
            <span className="font-medium text-white">{r.vibi}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Features                                                     */
/* ─────────────────────────────────────────────────────────── */

function Features() {
  const items: {
    title: string;
    body: string;
    tag: string;
    icon: ReactNode;
  }[] = [
    {
      title: "음원 분리",
      body: "영상 사운드를 보이스 / 배경 / 사람별로 30초 안에 쪼갭니다. 원하는 트랙만 끄거나 살리세요.",
      tag: "메인 기능",
      icon: <IconStem />,
    },
    {
      title: "자동 자막 + 다국어 번역",
      body: "발화를 자막으로, 그리고 여러 언어로 동시에 번역합니다. 폰트와 위치는 화면에서 바로 조정.",
      tag: "보조",
      icon: <IconCaption />,
    },
    {
      title: "자동 다국어 더빙",
      body: "영상 음성을 다른 언어 AI 보이스로 자연스럽게 합성. 한 영상에서 여러 언어 버전을 동시에 만들어보세요.",
      tag: "보조",
      icon: <IconGlobe />,
    },
    {
      title: "AI 채팅으로 편집",
      body: "“30초 부분 음원분리해줘” 같은 자연어 명령으로 편집 도구를 호출합니다. 메뉴를 뒤지지 않아도 됩니다.",
      tag: "AI",
      icon: <IconChat />,
    },
  ];

  return (
    <section
      id="features"
      className="relative mx-auto max-w-6xl px-6 py-24 md:py-32"
    >
      <SectionHeading
        eyebrow="기능"
        title="촬영부터 발행까지, 한 손에서."
        body="복잡한 PC 도구 없이 모바일에서 끝납니다. 음원 분리를 중심으로 자막, 더빙, AI 채팅 편집이 자연스럽게 이어집니다."
      />

      <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((it) => (
          <article
            key={it.title}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-7 transition hover:border-white/20 hover:bg-white/[0.04]"
          >
            <div className="flex items-start justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-white/10 to-white/[0.02]">
                {it.icon}
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
                {it.tag}
              </span>
            </div>
            <h3 className="mt-6 text-xl font-semibold tracking-tight text-white">
              {it.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {it.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Use case                                                     */
/* ─────────────────────────────────────────────────────────── */

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
    "음원 분리 → 30초 대기 → 보이스 / 배경 분리",
    "배경 끄기 — 보이스만 무손상으로 살림",
    "BGM 픽업 → 타임라인에 추가 → 볼륨 조절",
    "익스포트 → 시스템 공유로 채널 직발행",
  ];

  return (
    <section
      id="scenario"
      className="relative mx-auto max-w-6xl px-6 py-24 md:py-32"
    >
      <SectionHeading
        eyebrow="사용 모습"
        title="여행 vlog — 시장 소음 위에 보이스만 남기기."
        body="현장 분위기는 살리되 잡음은 빼고 싶을 때, vibi 는 5분이 채 걸리지 않습니다."
      />

      <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2">
        <ScenarioCard
          tone="muted"
          title="Before — PC 워크플로우"
          steps={before}
        />
        <ScenarioCard tone="bright" title="After — vibi" steps={after} />
      </div>
    </section>
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
      className={`relative overflow-hidden rounded-2xl border p-7 ${
        isBright
          ? "border-white/15 bg-gradient-to-b from-[rgba(124,92,255,0.12)] to-transparent"
          : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <h3 className="text-sm font-medium uppercase tracking-widest text-zinc-400">
        {title}
      </h3>
      <ol className="mt-6 space-y-4">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-4">
            <span
              className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                isBright
                  ? "bg-white text-black"
                  : "bg-white/10 text-zinc-300"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`text-sm leading-relaxed ${
                isBright ? "text-white" : "text-zinc-400"
              }`}
            >
              {s}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Workflow                                                     */
/* ─────────────────────────────────────────────────────────── */

function Workflow() {
  const rows = [
    {
      step: "영상 가져오기",
      pc: "케이블 / iCloud / AirDrop · 5–15분",
      vibi: "갤러리 직접 픽업 · 5초",
    },
    {
      step: "보이스 추가",
      pc: "PC 마이크 셋업 / 외부 마이크",
      vibi: "폰 마이크 즉석 녹음",
    },
    {
      step: "미리보기",
      pc: "렌더 후 재생",
      vibi: "타임라인에서 즉시 재생",
    },
    {
      step: "발행",
      pc: "익스포트 → 폰으로 보내기 → 채널 업로드",
      vibi: "시스템 공유로 채널 한 번에",
    },
  ];

  return (
    <section
      id="workflow"
      className="relative mx-auto max-w-6xl px-6 py-24 md:py-32"
    >
      <SectionHeading
        eyebrow="워크플로우"
        title="PC 5분 작업이, vibi 에선 5초입니다."
        body="시간·장소 제약 0. 카페든 여행지든 지하철이든, 트렌드의 휘발성을 놓치지 않습니다."
      />

      <div className="mt-14 grid grid-cols-1 gap-3 md:grid-cols-4">
        {rows.map((r) => (
          <article
            key={r.step}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
          >
            <h4 className="text-sm font-semibold text-white">{r.step}</h4>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                  PC
                </p>
                <p className="mt-1 text-zinc-400">{r.pc}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[var(--color-accent-2)]">
                  vibi
                </p>
                <p className="mt-1 text-white">{r.vibi}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Closing CTA                                                  */
/* ─────────────────────────────────────────────────────────── */

function ClosingCta() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-32">
      <div className="ring-soft relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[rgba(124,92,255,0.18)] via-transparent to-[rgba(74,214,230,0.12)] px-8 py-16 text-center md:px-16 md:py-24">
        <h2 className="mx-auto max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          가장 먼저 써보고, 가장 먼저 트렌드를 잡으세요.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-zinc-300">
          iOS 사전 등록자에게 출시 알림과 무료 크레딧을 먼저 드립니다.
        </p>

        <form
          className="mx-auto mt-10 flex max-w-md flex-col gap-2 sm:flex-row"
          action="#"
        >
          <input
            type="email"
            required
            placeholder="you@email.com"
            className="flex-1 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm text-white placeholder:text-zinc-400 outline-none transition focus:border-white/30 focus:bg-white/15"
          />
          <button
            type="submit"
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            사전 등록
          </button>
        </form>

        <p className="mt-6 text-xs text-zinc-500">
          App Store · 곧 출시 · Android 는 추후 지원
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Footer                                                       */
/* ─────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="relative border-t border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-white">vibi</span>
          <span className="text-zinc-600">·</span>
          <span>모바일 영상 보이스 리믹싱</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-white transition-colors">
            개인정보
          </a>
          <a href="#" className="hover:text-white transition-colors">
            이용약관
          </a>
          <a
            href="mailto:devrel.365@gmail.com"
            className="hover:text-white transition-colors"
          >
            문의
          </a>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 pb-10 text-xs text-zinc-600">
        © {new Date().getFullYear()} vibi. Powered by Perso AI.
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Helpers                                                      */
/* ─────────────────────────────────────────────────────────── */

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: ReactNode;
  body?: string;
}) {
  return (
    <div className="max-w-3xl">
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-accent-2)]">
        {eyebrow}
      </span>
      <h2 className="mt-3 text-balance text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
        {title}
      </h2>
      {body ? (
        <p className="mt-5 text-pretty text-base leading-relaxed text-zinc-400 md:text-lg">
          {body}
        </p>
      ) : null}
    </div>
  );
}

function BackgroundOrbs() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-[var(--color-accent)] opacity-[0.18] blur-[120px]" />
      <div className="absolute right-[-20%] top-[10%] h-[600px] w-[600px] rounded-full bg-[var(--color-accent-2)] opacity-[0.12] blur-[140px]" />
      <div className="absolute left-[20%] top-[60%] h-[500px] w-[500px] rounded-full bg-[#f5d65a] opacity-[0.06] blur-[160px]" />
    </div>
  );
}

/* ───────── Inline icons (no external deps) ───────── */

function IconStem() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 12h2" /><path d="M6 9v6" /><path d="M9 6v12" /><path d="M12 9v6" /><path d="M15 4v16" /><path d="M18 9v6" /><path d="M21 12h-2" />
    </svg>
  );
}

function IconCaption() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M7 14h3" /><path d="M14 14h3" /><path d="M7 11h2" /><path d="M12 11h5" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18" /><path d="M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16v11H8l-4 4z" />
      <path d="M8 10h8" /><path d="M8 13h5" />
    </svg>
  );
}
