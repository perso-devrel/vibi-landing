import type { Dict } from "./types";

export const ja: Dict = {
  meta: {
    title: "VIBI — 映像はそのまま。ノイズだけを消す。",
    description:
      "iOS・Android、そしてAdobe Premiere Proの中で、要らない音だけをAIで消す。音声を「声」「背景音」「話者ごと」のステムに分離し、風の音も、通行人の声も、間違った声もミュート。撮り直せない映像はそのまま残ります。",
  },

  announcement: {
    badge: "ベータ",
    message: "決済はまだ開始していません。VIBIは今なら無料で試せます。",
    feedbackText: "レビューやフィードバックを送っていただくと、ボーナスクレジットを5つ追加します。",
    feedbackLabel: "フィードバックを送る",
    feedbackEmail: "jepark2934@gmail.com",
    feedbackSubject: "VIBI feedback (for 5 bonus credits)",
  },
  nav: {
    appStore: "App Store",
    ios: "iPhone",
    premiere: "Premiere Pro",
    why: "VIBIを選ぶ理由",
    features: "機能",
    scenario: "使い方",
    workflow: "ワークフロー",
    docs: "ドキュメント",
  },

  hero: {
    eyebrow: "AI音声分離",
    titleLines: ["映像はそのまま。", "ノイズだけを消す。"],
    body: "どんなクリップでも、VIBIが音声を「声」「背景音」「話者ごと」のステムに分離。撮り直せない映像には一切触れずに、風の音も、通行人の声も、間違った声もミュートできます。",
    chips: ["声", "背景音", "話者ごと"],
    ctaPrimary: "iOSで入手する",
    ctaAndroid: "Android版リリース時に通知を受け取る",
    ctaSecondary: "Premiere Proパネルを入手する",
    caption: "iOS・Android版はストア審査中 — Adobe Premiere Pro 26+で今すぐ利用可能",
  },

  apps: {
    eyebrow: "2つのアプリ、1つのエンジン",
    title: "作業する場所を選ぼう。",
    body: "同じ分離技術、同じアカウント、同じクレジット。撮影する場所ではスマホで始めて、編集するPremiereで仕上げる — クレジットは両方で共有されます。",
    items: [
      {
        kind: "ios",
        eyebrow: "iPhone・Android版VIBI",
        badge: "ストア審査中",
        tagline: "撮影現場での、素早い修正。",
        body: "クリップを選ぶだけで、トラック全体を分離。区間に分けて、気になる部分だけをミュート・減衰・スロー化 — 5分もかからず完了します。",
        points: ["クリップ全体のステム分離", "区間ごとにミュート／減衰／スロー", "BGM追加、チャットで編集"],
        ctaLabel: "iOSで入手する",
        ctaLabelAndroid: "Android版リリース時に通知を受け取る",
      },
      {
        kind: "premiere",
        eyebrow: "Premiere Pro版VIBI",
        badge: "Premiere Pro 26+",
        tagline: "エディター上での、緻密な編集。",
        body: "タイムコード付き・話者ごとの文字起こしを読み、話者を再割り当てして、音声を再生成。各ステムをdBフェーダーで調整し、クリーンな.wavをタイムラインにミックスして戻せます。",
        points: ["話者ごとの文字起こし編集", "話者を再割り当てして再生成", ".wavをシーケンスにミックス"],
        ctaLabel: "Premiere Proパネルを入手する",
      },
    ],
  },

  waveform: {
    filename: "interview_03.mov",
    title: "1つのクリップ。気になる音だけをミュート。",
    body: "クリップ全体を話者ごと・背景音に分離し、区間を選んでノイズだけをミュート。声は決して圧縮されず、撮り直せない映像はそのまま保たれます。",
    preview: "プレビュー · 0:42",
    tracks: [
      { name: "声 1", subtitle: "声 1 — 残す" },
      { name: "声 2", subtitle: "声 2 — 残す" },
      { name: "背景音", subtitle: "背景音 — ミュート" },
    ],
  },

  why: {
    eyebrow: "VIBIを選ぶ理由",
    titleIntro: "トラック全体を潰すのは、もうやめよう。消すのは ",
    titleEm: "気になる音だけ",
    titleOutro: "。",
    body: "多くのエディターは音を1つの塊として扱います — ノイズを消せば、声も一緒に消えてしまう。VIBIは各クリップを「声」「背景音」「話者ごと」のステムに分離するから、要らない部分だけをミュートできます。iPhoneでもPremiere Proでも、同じエンジンです。",
    legacyHeader: "他のツール",
    vibiHeader: "VIBI",
    rows: [
      { label: "音の単位", legacy: "1クリップ = 1つのミックストラック", vibi: "1クリップ = 声／背景音／話者ごと" },
      { label: "ノイズ除去", legacy: "すべてを潰す(声も一緒に)", vibi: "背景音だけをミュート — 声はそのまま" },
      { label: "1人の話者だけカット", legacy: "不可能", vibi: "インタビューの2人から1人を選択" },
      { label: "音声が台無しになったら", legacy: "撮り直すかクリップを破棄", vibi: "映像は残して、音だけを消す" },
      { label: "作業する場所", legacy: "1つのワークフローに固定", vibi: "現場ではiPhone · デスクではPremiere Pro" },
    ],
  },

  features: {
    eyebrow: "機能",
    title: "分離したら、できること。",
    body: "区間編集、BGM、キャプション、文字起こしレベルの制御 — すべてのツールが、同じ「声／背景音／話者ごと」の分離の上に成り立っています。",
    items: [
      {
        eyebrow: "両方のアプリ",
        title: "クリップ全体を話者ごとに分離",
        body: "クリップを選ぶと、AIがトラック全体を「声」「背景音」「話者ごと」のステムに分離 — すべての土台となる機能で、iPhoneでもPremiere Proでも同じです。",
      },
      {
        eyebrow: "iPhoneで",
        title: "移動中でも、区間ごとに調整",
        body: "分離したクリップを区間に分けて、気になる部分だけをミュート・減衰・スロー化。BGMを重ねたりマイクで録音したりして、書き出して共有 — 5分もかかりません。",
      },
      {
        eyebrow: "Premiere Proで",
        title: "文字起こしから編集",
        body: "タイムコード付き・話者ごとのスクリプトで作業:話者を再割り当てし、誰が何を言ったかを修正して、音声を再生成。各ステムをdBフェーダーで調整し、クリーンな.wavをタイムラインにミックスして戻せます。",
      },
    ],
  },

  scenario: {
    eyebrow: "使い方",
    title: "インタビュークリップ — 片方の声はクリーンに、もう片方は消す。",
    body: "撮り直すには惜しすぎる瞬間なのに、通行人が音声を台無しに。VIBIなら、救出は5分もかかりません。",
    beforeTitle: "Before — 従来のやり方",
    afterTitle: "After — VIBI",
    before: [
      "デスクに戻って、ノートPCを開く",
      "クリップをPCに移す(5〜15分)",
      "「動画から声を消す方法」を検索",
      "アプリもチュートリアルも次々試すが、行き詰まったまま",
      "諦めて、撮り直すかクリップを破棄",
    ],
    after: [
      "カメラロールからクリップを選ぶ",
      "トラック全体を分離 — 声、背景音、話者ごと",
      "通行人が割り込んだ区間をドラッグ",
      "要らない話者をミュート — 自分の声は残る",
      "必要ならBGMを重ねる → 書き出し → 共有",
    ],
  },

  workflow: {
    eyebrow: "ワークフロー",
    title: "かつてスタジオが必要だったことが、今は2つのアプリで。",
    body: "現場でスマホを手にしていても、デスクでPremiereに没頭していても — 大切な瞬間を逃しません。",
    pcLabel: "従来のやり方",
    vibiLabel: "VIBI",
    rows: [
      { step: "クリップを取り込む", pc: "ケーブル / iCloud / AirDrop · 5〜15分", vibi: "iPhoneならギャラリーから、PremiereならProjectパネルから" },
      { step: "ノイズを消す", pc: "EQ+マルチバンド+手動カット — しかも声まで消えがち", vibi: "分離して、要らないステムや区間をミュートするだけ" },
      { step: "プレビュー", pc: "レンダリングしてから再生", vibi: "すぐに再生 — タイムライン上でもパネル内でも" },
      { step: "公開", pc: "書き出し → 送信 → アップロード", vibi: "モバイルでは共有シート、またはクリーンな.wavをシーケンスに戻す" },
    ],
  },

  plugin: {
    panelName: "VIBI: AI Sound Eraser",
    panelHost: "Premiere Pro 26+ · UXPパネル",
    sources: ["ファイル", "プロジェクト", "タイムライン"],
  },

  cta: {
    title: "入り口は2つ。仕上がりは1つのクリーンな音。",
    body: "撮影する場所ではスマホで始めて、編集するPremiereで仕上げる — アカウントとクレジットは両方で共有されます。",
    primary: "iOSで入手する",
    android: "Android版リリース時に通知を受け取る",
    secondary: "Premiere Proパネルを入手する",
    caption: "iOS・Android版はストア審査中 · Premiere Pro 26+ · クレジットは両方で共有",
  },

  jsonLd: {
    featureList: [
      "ワンタップで、どんな映像からも声・楽器・背景音を分離",
      "分離した各トラックのオン・オフと音量調整",
      "指定した区間にBGMを追加",
      "映像タイムラインの特定の区間だけを編集",
      "書き出し前に編集内容をプレビュー",
    ],
  },

  footer: {
    tagline: "映像はそのまま。ノイズだけを消す — iPhoneでも、Premiere Proでも。",
    productHeading: "製品",
    productLinks: [
      { label: "iPhone・Android版VIBI", href: "#app-ios" },
      { label: "Premiere Pro版VIBI", href: "#app-premiere" },
      { label: "機能", href: "#features" },
      { label: "使い方", href: "#scenario" },
      { label: "ドキュメント", href: "/docs" },
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
      { label: "プライバシー", href: "/privacy" },
      { label: "利用規約", href: "/terms" },
    ],
  },
};
