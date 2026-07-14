import type { Dict } from "./types";

export const ko: Dict = {
  meta: {
    title: "VIBI — 영상은 그대로, 소음만 지우세요.",
    description:
      "원하지 않는 소리만 골라 지우는 AI — iOS와 Android, 그리고 Adobe Premiere Pro 안에서. 오디오를 목소리, 배경, 화자별 스템으로 분리해 바람 소리, 지나가는 행인, 잘못 섞인 목소리만 음소거하세요. 다시 찍을 수 없는 그 장면은 그대로 남습니다.",
  },

  announcement: {
    badge: "Beta",
    message: "아직 결제는 열리지 않았어요 — 지금 VIBI를 무료로 써보세요.",
    feedbackText: "리뷰나 피드백을 보내주시면 보너스 크레딧 5개를 드려요.",
    feedbackLabel: "피드백 보내기",
    feedbackEmail: "jepark2934@gmail.com",
    feedbackSubject: "VIBI 피드백 (보너스 크레딧 5개)",
  },
  nav: {
    appStore: "App Store",
    ios: "iPhone",
    premiere: "Premiere Pro",
    why: "VIBI를 쓰는 이유",
    features: "기능",
    scenario: "사용 방법",
    workflow: "워크플로우",
    docs: "문서",
  },

  hero: {
    eyebrow: "AI 오디오 분리",
    titleLines: ["영상은 그대로.", "소음만 지우세요."],
    body: "클립을 고르면 VIBI가 오디오를 목소리, 배경, 화자별 스템으로 분리해요. 다시 찍을 수 없는 영상은 건드리지 않고 바람 소리, 지나가는 행인, 잘못 섞인 목소리만 음소거하세요.",
    chips: ["목소리", "배경", "화자별"],
    ctaPrimary: "iOS에서 받기",
    ctaAndroid: "Android 출시 알림 받기",
    ctaSecondary: "Premiere Pro 패널 받기",
    caption: "iOS·Android 앱 스토어 심사 중 — Adobe Premiere Pro 26+ 에서 지금 사용 가능",
  },

  apps: {
    eyebrow: "두 개의 앱, 하나의 엔진",
    title: "일하는 곳을 고르세요.",
    body: "같은 분리, 같은 계정, 같은 크레딧. 촬영하는 폰에서 시작하고 편집하는 Premiere에서 마무리하세요 — 크레딧은 두 곳을 그대로 따라옵니다.",
    items: [
      {
        kind: "ios",
        eyebrow: "iPhone·Android용 VIBI",
        badge: "스토어 심사 중",
        tagline: "촬영하는 곳에서 바로, 빠른 수정.",
        body: "클립을 고르면 트랙 전체가 분리돼요. 구간을 나눠 거슬리는 부분만 음소거하거나 줄이거나 늦추세요 — 5분이면 끝납니다.",
        points: ["클립 전체 스템 분리", "구간별 음소거 / 줄이기 / 늦추기", "BGM 추가, 또는 채팅으로 편집"],
        ctaLabel: "iOS에서 받기",
        ctaLabelAndroid: "Android 출시 알림 받기",
      },
      {
        kind: "premiere",
        eyebrow: "Premiere Pro용 VIBI",
        badge: "Premiere Pro 26+",
        tagline: "편집기 안에서, 정교한 컷.",
        body: "타임코드가 붙은 화자별 자막을 읽고, 화자를 다시 지정하고, 오디오를 다시 생성하세요. dB 페이더로 스템을 조절한 뒤 깨끗한 .wav를 타임라인에 다시 믹스하세요.",
        points: ["화자별 자막 편집", "화자 재지정, 재생성", ".wav를 시퀀스에 믹스"],
        ctaLabel: "Premiere Pro 패널 받기",
      },
    ],
  },

  waveform: {
    filename: "interview_03.mov",
    title: "클립 하나. 거슬리는 것만 음소거.",
    body: "클립 전체를 화자별과 배경으로 분리한 뒤, 구간을 골라 소음만 음소거하세요. 목소리는 절대 눌리지 않아요 — 다시 찍을 수 없는 영상은 그대로 보존됩니다.",
    preview: "미리보기 · 0:42",
    tracks: [
      { name: "목소리 1", subtitle: "목소리 1 — 유지" },
      { name: "목소리 2", subtitle: "목소리 2 — 유지" },
      { name: "배경", subtitle: "배경 — 음소거" },
    ],
  },

  why: {
    eyebrow: "VIBI를 쓰는 이유",
    titleIntro: "트랙 전체를 뭉개지 마세요. ",
    titleEm: "거슬리는 것만",
    titleOutro: " 지우세요.",
    body: "대부분의 편집기는 소리를 하나의 덩어리로 다뤄요 — 소음을 죽이면 목소리까지 죽죠. VIBI는 클립을 목소리, 배경, 화자별 스템으로 나눠 원하지 않는 부분만 음소거하게 해줍니다. iPhone과 Premiere Pro에서 같은 엔진.",
    legacyHeader: "다른 도구",
    vibiHeader: "VIBI",
    rows: [
      { label: "소리 단위", legacy: "클립 1개 = 믹스된 트랙 1개", vibi: "클립 1개 = 목소리 / 배경 / 화자별" },
      { label: "소음 제거", legacy: "전부 뭉갠다 (목소리까지)", vibi: "배경만 음소거 — 목소리는 그대로" },
      { label: "한 명만 지우기", legacy: "불가능", vibi: "인터뷰 두 명 중 한 명만 선택" },
      { label: "오디오가 망가지면", legacy: "재촬영하거나 클립 폐기", vibi: "영상은 유지, 오디오만 지우기" },
      { label: "작업하는 곳", legacy: "하나의 워크플로우에 묶임", vibi: "현장에선 iPhone · 책상에선 Premiere Pro" },
    ],
  },

  features: {
    eyebrow: "기능",
    title: "분리하고 나면 할 수 있는 것들.",
    body: "구간 편집, BGM, 자막, 자막 단위 제어 — 모든 도구가 같은 목소리 / 배경 / 화자별 분리 위에 놓입니다.",
    items: [
      {
        eyebrow: "두 앱 모두",
        title: "클립 전체, 화자별 분리",
        body: "클립을 고르면 AI가 트랙 전체를 목소리, 배경, 화자별 스템으로 나눠요 — 나머지 모든 것의 토대이며, iPhone과 Premiere Pro에서 동일합니다.",
      },
      {
        eyebrow: "iPhone에서",
        title: "이동 중에, 구간별로 조정",
        body: "분리된 클립을 구간으로 나눠 거슬리는 부분만 음소거하거나 줄이거나 늦추세요. BGM을 얹거나 마이크로 녹음한 뒤 내보내고 공유하세요 — 5분이면 끝납니다.",
      },
      {
        eyebrow: "Premiere Pro에서",
        title: "자막으로 편집하기",
        body: "타임코드가 붙은 화자별 스크립트로 작업하세요: 화자를 다시 지정하고, 누가 무슨 말을 했는지 고치고, 오디오를 다시 생성하고, dB 페이더로 각 스템을 조절한 뒤 깨끗한 .wav를 타임라인에 다시 믹스하세요.",
      },
    ],
  },

  scenario: {
    eyebrow: "사용 방법",
    title: "인터뷰 클립 — 한 목소리는 깨끗하게, 다른 하나는 삭제.",
    body: "다시 찍기엔 너무 좋은 순간이었지만 지나가던 행인이 오디오를 망쳤죠. VIBI라면 5분 안에 살려냅니다.",
    beforeTitle: "이전 — 예전 방식",
    afterTitle: "이후 — VIBI",
    before: [
      "책상으로 돌아와 노트북을 켠다",
      "클립을 PC로 옮긴다 (5~15분)",
      "“영상에서 목소리 하나 지우는 법” 검색",
      "이 앱 저 앱, 이 튜토리얼 저 튜토리얼 — 여전히 막힘",
      "포기; 재촬영하거나 클립 폐기",
    ],
    after: [
      "카메라 롤에서 클립을 고른다",
      "트랙 전체 분리 — 목소리, 배경, 화자별",
      "행인이 끼어든 구간을 드래그한다",
      "원하지 않는 화자를 음소거 — 내 목소리는 유지",
      "필요하면 BGM 추가 → 내보내기 → 공유",
    ],
  },

  workflow: {
    eyebrow: "워크플로우",
    title: "예전엔 스튜디오가 필요했던 일, 이제 두 앱으로.",
    body: "현장에서 폰을 들고 있든 책상에서 Premiere에 파묻혀 있든 — 그 순간을 놓치지 않아요.",
    pcLabel: "예전 방식",
    vibiLabel: "VIBI",
    rows: [
      { step: "클립 가져오기", pc: "케이블 / iCloud / AirDrop · 5~15분", vibi: "iPhone 갤러리에서, 또는 Premiere의 Project 패널에서" },
      { step: "소음 지우기", pc: "EQ + 멀티밴드 + 수동 컷 — 그리고 목소리도 함께 죽기 일쑤", vibi: "분리한 뒤 원하지 않는 스템이나 구간만 음소거" },
      { step: "미리보기", pc: "렌더링 후 재생", vibi: "즉시 재생 — 타임라인에서든 패널에서든" },
      { step: "게시", pc: "내보내기 → 전송 → 업로드", vibi: "모바일에선 공유 시트, 또는 깨끗한 .wav를 시퀀스에 다시" },
    ],
  },

  plugin: {
    panelName: "VIBI: AI Sound Eraser",
    panelHost: "Premiere Pro 26+ · UXP 패널",
    sources: ["파일", "프로젝트", "타임라인"],
  },

  cta: {
    title: "두 갈래 입구. 하나의 깨끗한 컷.",
    body: "촬영하는 폰에서 시작하고 편집하는 Premiere에서 마무리하세요 — 계정과 크레딧이 두 곳을 그대로 따라옵니다.",
    primary: "iOS에서 받기",
    android: "Android 출시 알림 받기",
    secondary: "Premiere Pro 패널 받기",
    caption: "iOS·Android 스토어 심사 중 · Premiere Pro 26+ · 크레딧은 두 곳 공유",
  },

  jsonLd: {
    featureList: [
      "탭 한 번으로 어떤 영상에서든 음성·반주·배경음 분리",
      "분리된 각 트랙을 켜고 끄고 볼륨 조절",
      "원하는 구간에 배경음악 추가",
      "영상 타임라인의 특정 구간만 편집",
      "내보내기 전에 편집 결과 미리보기",
    ],
  },

  footer: {
    tagline: "영상은 그대로. 소음만 지우세요 — iPhone과 Premiere Pro에서.",
    productHeading: "제품",
    productLinks: [
      { label: "iPhone·Android용 VIBI", href: "#app-ios" },
      { label: "Premiere Pro용 VIBI", href: "#app-premiere" },
      { label: "기능", href: "#features" },
      { label: "사용 방법", href: "#scenario" },
      { label: "문서", href: "/docs" },
    ],
    copyright: "© {year} VIBI · Built by je0ng3",
    poweredBy: {
      prefix: "Powered by",
      name: "Perso AI",
      href: "https://perso.ai",
    },
    githubLinks: [
      { label: "VIBI", href: "https://github.com/je0ng3/vibi" },
      { label: "VIBI-BFF", href: "https://github.com/je0ng3/vibi-bff" },
    ],
    legalLinks: [
      { label: "개인정보 처리방침", href: "/privacy" },
      { label: "이용약관", href: "/terms" },
    ],
  },
};
