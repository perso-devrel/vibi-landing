import type { Dict } from "./types";

export const ko: Dict = {
  meta: {
    title: "vibi — 영상 속 보이스를 분리하고 다시 입히다",
    description:
      "촬영한 그 자리에서 보이스 / 배경 / 사람별 사운드를 분리하고, 자막·다국어 더빙·AI 채팅 편집까지. 모바일 영상 보이스 리믹싱 앱 vibi.",
  },
  localeLabel: "한국어",
  toggleHint: "Switch to English",

  nav: {
    browse: "둘러보기",
    appStore: "App Store",
    why: "왜 vibi",
    features: "기능",
    scenario: "사용 모습",
    workflow: "워크플로우",
  },

  hero: {
    badge: "iOS · App Store 출시",
    titleLines: ["영상 속 보이스만 살리고,", "나머지는 다시 입히다."],
    body: "기존 모바일 앱은 영상 사운드를 한 덩어리로 다룹니다. vibi 는 보이스 / 배경 / 사람별로 분리해, 원하는 부분만 살리고 BGM·AI 보이스를 다시 얹습니다.",
    ctaPrimary: "App Store 에서 받기",
    ctaSecondary: "기능 둘러보기",
    ctaCaption: "iOS 17+ · 무료 다운로드",
    stats: [
      { value: "구간 선택", label: "원하는 부분만 분리" },
      { value: "10+ 언어", label: "다국어 더빙" },
      { value: "모바일 한 손", label: "작업 위치" },
    ],
  },

  waveform: {
    filename: "여행_vlog_03.mov",
    title: "한 구간, 세 트랙.",
    body: "타임라인에서 원하는 구간을 골라 보이스·배경을 분리하고, BGM 트랙을 더해 다시 합칩니다. 영상 전체가 아니라 필요한 부분만, 보이스는 한 번도 압축되지 않습니다.",
    preview: "미리듣기 · 0:42",
    tracks: [
      { name: "Voice", subtitle: "보이스 — 무손상" },
      { name: "Background", subtitle: "배경 — 음소거" },
      { name: "BGM", subtitle: "BGM — 새로 추가" },
    ],
  },

  why: {
    eyebrow: "왜 vibi",
    titleIntro: "사운드를 분리해서 ",
    titleEm: "부분 단위로",
    titleOutro: " 다루세요.",
    body: "기존 모바일 영상 앱은 사운드를 통째로만 만집니다. vibi 는 영상 한 편을 보이스, 배경, 사람별로 쪼개서 — 원하는 부분만 살리고, 끄고, 교체합니다.",
    legacyHeader: "기존 모바일 앱",
    vibiHeader: "vibi",
    rows: [
      { label: "사운드 단위", legacy: "영상 1개 = 사운드 한 덩어리", vibi: "영상 1개 = 보이스 / 배경 / 사람별" },
      { label: "잡음 제거", legacy: "다 같이 깎임 (보이스도 손상)", vibi: "배경만 끄기 — 보이스 그대로" },
      { label: "BGM 교체", legacy: "기존 위에 덧씌움 (겹쳐 들림)", vibi: "보이스만 살리고 BGM 갈아끼움" },
      { label: "사람별 목소리 부각", legacy: "불가능", vibi: "두 명 인터뷰 중 한 명만 살리기" },
      { label: "작업 위치", legacy: "PC 전문 도구", vibi: "모바일 — 촬영한 그 자리" },
    ],
  },

  features: {
    eyebrow: "기능",
    title: "촬영부터 발행까지, 한 손에서.",
    body: "복잡한 PC 도구 없이 모바일에서 끝납니다. 음원 분리를 중심으로 자막, 더빙, AI 채팅 편집이 자연스럽게 이어집니다.",
    items: [
      {
        eyebrow: "메인 기능",
        title: "구간 선택 음원 분리",
        body: "타임라인에서 원하는 구간을 잡고, 그 부분의 보이스 / 배경 / 사람별 사운드를 분리합니다. 영상 전체가 아니라 필요한 만큼만, 부분 단위로.",
      },
      {
        eyebrow: "보조",
        title: "자동 자막 + 다국어 번역",
        body: "발화를 자막으로, 그리고 여러 언어로 동시에 번역합니다. 폰트와 위치는 화면에서 바로 조정.",
      },
      {
        eyebrow: "보조",
        title: "자동 다국어 더빙",
        body: "영상 음성을 다른 언어 AI 보이스로 자연스럽게 합성. 한 영상에서 여러 언어 버전을 동시에 만들어보세요.",
      },
      {
        eyebrow: "AI",
        title: "채팅으로 편집",
        body: "“선택한 구간 보이스만 살려줘” 같은 자연어 명령으로 편집 도구를 호출합니다. 메뉴를 뒤지지 않아도 됩니다.",
      },
    ],
  },

  scenario: {
    eyebrow: "사용 모습",
    title: "여행 vlog — 시장 소음 위에 보이스만 남기기.",
    body: "현장 분위기는 살리되 잡음은 빼고 싶을 때, vibi 는 5분이 채 걸리지 않습니다.",
    beforeTitle: "Before — PC 워크플로우",
    afterTitle: "After — vibi",
    before: [
      "호텔 들어가서 노트북 켜기",
      "영상 PC 로 옮기기 (5–15분)",
      "전문 편집 도구에서 잡음 제거",
      "외부 BGM 라이브러리 검색 → 다운로드 → import",
      "다시 모바일로 보내서 발행",
    ],
    after: [
      "갤러리에서 영상 픽업",
      "타임라인에서 원하는 구간 선택 → 음원 분리",
      "배경 끄기 — 보이스만 무손상으로 살림",
      "BGM 픽업 → 타임라인에 추가 → 볼륨 조절",
      "익스포트 → 시스템 공유로 채널 직발행",
    ],
  },

  workflow: {
    eyebrow: "워크플로우",
    title: "PC 5분 작업이, vibi 에선 5초입니다.",
    body: "시간·장소 제약 0. 카페든 여행지든 지하철이든, 트렌드의 휘발성을 놓치지 않습니다.",
    pcLabel: "PC",
    vibiLabel: "vibi",
    rows: [
      { step: "영상 가져오기", pc: "케이블 / iCloud / AirDrop · 5–15분", vibi: "갤러리 직접 픽업 · 5초" },
      { step: "보이스 추가", pc: "PC 마이크 셋업 / 외부 마이크", vibi: "폰 마이크 즉석 녹음" },
      { step: "미리보기", pc: "렌더 후 재생", vibi: "타임라인에서 즉시 재생" },
      { step: "발행", pc: "익스포트 → 폰으로 보내기 → 채널 업로드", vibi: "시스템 공유로 채널 한 번에" },
    ],
  },

  cta: {
    title: "오늘 촬영한 영상에, 보이스를 다시 입혀보세요.",
    body: "App Store 에서 받고, 첫 영상은 무료 크레딧으로 — 5분 안에 끝납니다.",
    primary: "App Store 에서 받기",
    secondary: "기능 다시 보기",
    caption: "iOS 17+ · 무료 다운로드 · Android 는 추후 지원",
  },

  footer: {
    tagline: "모바일 영상 보이스 리믹싱. 촬영한 그 자리에서.",
    productHeading: "제품",
    companyHeading: "회사",
    legalHeading: "법률",
    productLinks: [
      { label: "기능", href: "#features" },
      { label: "사용 모습", href: "#scenario" },
      { label: "워크플로우", href: "#workflow" },
    ],
    companyLinks: [
      { label: "Perso AI", href: "https://perso.ai" },
      { label: "문의", href: "mailto:devrel.365@gmail.com" },
    ],
    legalLinks: [
      { label: "개인정보 처리방침", href: "#" },
      { label: "이용약관", href: "#" },
    ],
    copyright: "© {year} vibi. Powered by Perso AI.",
    rightCaption: "Made for short-form creators.",
  },
};
