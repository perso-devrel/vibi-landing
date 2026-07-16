import type { Dict } from "./types";

export const zh: Dict = {
  meta: {
    title: "VIBI — 保留画面，只抹去杂音。",
    description:
      "只清除你不想要的声音的 AI —— 支持 iOS 与 Android，也能在 Adobe Premiere Pro 中直接使用。把音频拆分成人声、背景以及各说话人分轨，再静音掉呼啸的风声、路过的行人、走音的那个声音 —— 无法重拍的画面完好保留。",
  },

  announcement: {
    badge: "Beta",
    message: "付费功能尚未上线 —— VIBI 现在可以免费试用。",
    feedbackText: "给我们留下评价或反馈，即可获赠 5 个额外积分。",
    feedbackLabel: "发送反馈",
    feedbackEmail: "jepark2934@gmail.com",
    feedbackSubject: "VIBI 反馈（赠送 5 个额外积分）",
  },
  nav: {
    appStore: "App Store",
    ios: "iPhone",
    premiere: "Premiere Pro",
    why: "为什么选 VIBI",
    features: "功能",
    scenario: "工作原理",
    workflow: "工作流程",
    docs: "文档",
  },

  hero: {
    eyebrow: "AI 音频分离",
    titleLines: ["保留画面，", "只抹去杂音。"],
    body: "选任意一段素材，VIBI 就把音频拆分成人声、背景以及各说话人分轨 —— 让你静音掉风声、路人或走音的声音，而无法重拍的画面丝毫不受影响。",
    chips: ["人声", "背景", "分说话人"],
    ctaPrimary: "在 iOS 上获取",
    ctaAndroid: "Android 上线时通知我",
    ctaSecondary: "获取 Premiere Pro 面板",
    caption: "iOS 与 Android 应用正在商店审核中 —— Adobe Premiere Pro 26+ 现已可用",
  },

  apps: {
    eyebrow: "两款应用，同一引擎",
    title: "在你顺手的地方开工。",
    body: "同样的分离能力，同一个账号，同一份积分。在拍摄现场用手机开始，回到 Premiere 中收尾 —— 你的积分在两端通用。",
    items: [
      {
        kind: "ios",
        eyebrow: "iPhone 和 Android 版 VIBI",
        badge: "商店审核中",
        tagline: "拍摄现场，快速搞定。",
        body: "选一段素材，整条音轨即刻分离。将它切成若干区段，只对困扰你的那部分做静音、减弱或放慢 —— 五分钟内完成。",
        points: ["整段素材分轨分离", "按区段静音 / 减弱 / 放慢", "添加 BGM，或用聊天来编辑"],
        ctaLabel: "在 iOS 上获取",
        ctaLabelAndroid: "Android 上线时通知我",
      },
      {
        kind: "premiere",
        eyebrow: "Premiere Pro 版 VIBI",
        badge: "Premiere Pro 26+",
        tagline: "在你的剪辑软件里精细打磨。",
        body: "查看带时间码、按说话人区分的转录文本，重新指派说话人，再重新生成音频。用 dB 推子调校每一条分轨，然后把一份干净的 .wav 混回你的时间线。",
        points: ["按说话人编辑转录文本", "重新指派说话人并重新生成", "把 .wav 混入你的序列"],
        ctaLabel: "获取 Premiere Pro 面板",
      },
    ],
  },

  waveform: {
    filename: "interview_03.mov",
    title: "一段素材，只静音困扰你的部分。",
    body: "把整段素材分离成每位说话人和背景，再选定一个区段，只静音那段杂音。人声绝不会被压缩 —— 无法重拍的画面得以保留。",
    preview: "预览 · 0:42",
    tracks: [
      { name: "人声 1", subtitle: "人声 1 — 保留" },
      { name: "人声 2", subtitle: "人声 2 — 保留" },
      { name: "背景", subtitle: "背景 — 已静音" },
    ],
  },

  why: {
    eyebrow: "为什么选 VIBI",
    titleIntro: "别再把整条音轨一并压垮。只抹去",
    titleEm: "困扰你的那部分",
    titleOutro: "。",
    body: "大多数剪辑工具把声音当成一整块 —— 消掉杂音，连人声也一起消掉。VIBI 把每段素材拆分成人声、背景以及各说话人分轨，让你只静音掉不想要的部分。iPhone 与 Premiere Pro 上是同一套引擎。",
    legacyHeader: "其他工具",
    vibiHeader: "VIBI",
    rows: [
      { label: "声音单元", legacy: "1 段素材 = 1 条混合音轨", vibi: "1 段素材 = 人声 / 背景 / 分说话人" },
      { label: "杂音清除", legacy: "把一切都压垮（连人声也不放过）", vibi: "只静音背景 —— 人声完好无损" },
      { label: "剪掉某位说话人", legacy: "无法做到", vibi: "在双人采访中任选其一" },
      { label: "音频被毁时", legacy: "重拍，或丢掉这段素材", vibi: "保留画面，只抹去音频" },
      { label: "在哪里工作", legacy: "被锁死在单一工作流里", vibi: "拍摄现场用 iPhone · 桌前用 Premiere Pro" },
    ],
  },

  features: {
    eyebrow: "功能",
    title: "分离之后，你能做的事。",
    body: "区段编辑、BGM、字幕、转录级别的控制 —— 每一项工具都建立在同一套人声 / 背景 / 分说话人的分离之上。",
    items: [
      {
        eyebrow: "两款应用",
        title: "整段素材、分说话人的分离",
        body: "选一段素材，AI 就把整条音轨拆分成人声、背景以及各说话人分轨 —— 这是其余一切的基础，在 iPhone 与 Premiere Pro 上完全一致。",
      },
      {
        eyebrow: "在 iPhone 上",
        title: "随走随调，按区段处理",
        body: "把分离后的素材切成区段，只对困扰你的那部分做静音、减弱或放慢。叠入 BGM 或用麦克风录音，然后导出分享 —— 五分钟内完成。",
      },
      {
        eyebrow: "在 Premiere Pro 中",
        title: "从转录文本开始编辑",
        body: "基于带时间码、按说话人区分的脚本来工作：重新指派说话人，纠正谁说了什么，重新生成音频，用 dB 推子调校每一条分轨，再把一份干净的 .wav 混回你的时间线。",
      },
    ],
  },

  scenario: {
    eyebrow: "工作原理",
    title: "采访素材 —— 一个人声干净，另一个消失。",
    body: "这一刻太精彩，舍不得重拍，可一位路人毁了音频。有了 VIBI，抢救它不到五分钟。",
    beforeTitle: "以前 —— 老办法",
    afterTitle: "现在 —— VIBI",
    before: [
      "回到桌前，打开笔记本电脑",
      "把素材传到电脑（5–15 分钟）",
      "搜索“如何从视频里去掉一个人声”",
      "一个个 App、一篇篇教程试过来 —— 还是卡住",
      "放弃；重拍，或丢掉这段素材",
    ],
    after: [
      "从相机胶卷里选出这段素材",
      "分离整条音轨 —— 人声、背景、分说话人",
      "拖出路人插话的那个区段",
      "静音掉你不想要的说话人 —— 你的声音保留",
      "需要的话放段 BGM → 导出 → 分享",
    ],
  },

  workflow: {
    eyebrow: "工作流程",
    title: "过去需要一间录音棚，现在两款应用搞定。",
    body: "无论你是在现场用手机，还是在桌前深耕 Premiere —— 这一刻都不会溜走。",
    pcLabel: "老办法",
    vibiLabel: "VIBI",
    rows: [
      { step: "导入素材", pc: "数据线 / iCloud / AirDrop · 5–15 分钟", vibi: "在 iPhone 上从相册导入，或在 Premiere 的 Project 面板导入" },
      { step: "抹去一段杂音", pc: "EQ + 多频段 + 手动剪切 —— 而且人声常常一起没了", vibi: "分离，再静音掉不想要的分轨或区段" },
      { step: "预览", pc: "先渲染，再播放", vibi: "即时播放 —— 在时间线上或在面板里" },
      { step: "发布", pc: "导出 → 发送 → 上传", vibi: "手机上用分享菜单，或把干净的 .wav 混回你的序列" },
    ],
  },

  plugin: {
    panelName: "VIBI: AI Sound Eraser",
    panelHost: "Premiere Pro 26+ · UXP 面板",
    sources: ["文件", "项目", "时间线"],
  },

  cta: {
    title: "两种入口，一刀干净。",
    body: "在拍摄现场用手机开始，回到 Premiere 中收尾 —— 你的账号和积分在两端通用。",
    primary: "在 iOS 上获取",
    android: "Android 上线时通知我",
    secondary: "获取 Premiere Pro 面板",
    caption: "iOS 与 Android 正在商店审核中 · Premiere Pro 26+ · 积分两端共享",
  },

  jsonLd: {
    featureList: [
      "一键从任意视频中分离人声、伴奏与背景音",
      "开关并调节每条分离音轨的音量",
      "在自定义区间添加背景音乐",
      "编辑视频时间线的特定片段",
      "导出视频前预览编辑效果",
    ],
  },

  footer: {
    tagline: "保留画面，只抹去杂音 —— 在 iPhone 上，也在 Premiere Pro 里。",
    productHeading: "产品",
    productLinks: [
      { label: "iPhone 和 Android 版 VIBI", href: "#app-ios" },
      { label: "Premiere Pro 版 VIBI", href: "#app-premiere" },
      { label: "功能", href: "#features" },
      { label: "工作原理", href: "#scenario" },
      { label: "文档", href: "/docs" },
    ],
    copyright: "© {year} VIBI · 由 je0ng3 打造",
    poweredBy: {
      prefix: "技术支持",
      name: "Perso Dubbing",
      href: "https://perso.ai/dubbing",
    },
    githubLinks: [
      { label: "VIBI", href: "https://github.com/je0ng3/vibi" },
      { label: "VIBI-BFF", href: "https://github.com/je0ng3/vibi-bff" },
    ],
    legalLinks: [
      { label: "隐私政策", href: "/privacy" },
      { label: "服务条款", href: "/terms" },
    ],
  },
};
