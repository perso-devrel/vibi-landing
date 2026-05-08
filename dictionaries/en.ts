import type { Dict } from "./types";

export const en: Dict = {
  meta: {
    title: "vibi — Split the voice in your video, then re-dress it",
    description:
      "Pick a region, separate voice / background / per-speaker stems, then layer in BGM, AI dubs, and captions. Mobile video voice remixing — right where you shoot.",
  },
  localeLabel: "English",
  toggleHint: "한국어로 전환",

  nav: {
    browse: "Browse",
    appStore: "App Store",
    why: "Why vibi",
    features: "Features",
    scenario: "How it works",
    workflow: "Workflow",
  },

  hero: {
    badge: "Now on the App Store · iOS",
    titleLines: ["Keep just the voice.", "Re-dress everything else."],
    body: "Other mobile apps treat your audio as one block. vibi splits it into voice, background, and per-speaker stems — keep what you want, layer BGM over the rest.",
    ctaPrimary: "Download on the App Store",
    ctaSecondary: "Explore features",
    ctaCaption: "iOS 17+ · Free download",
    stats: [
      { value: "By region", label: "Stem only what you select" },
      { value: "10+ languages", label: "AI dubbing" },
      { value: "Mobile only", label: "Right where you shoot" },
    ],
  },

  waveform: {
    filename: "travel_vlog_03.mov",
    title: "One clip. Three stems.",
    body: "Pick a region on the timeline, split voice and background, layer in BGM. Just the part you need — voice is never compressed.",
    preview: "Preview · 0:42",
    tracks: [
      { name: "Voice", subtitle: "Voice — intact" },
      { name: "Background", subtitle: "Background — muted" },
      { name: "BGM", subtitle: "BGM — newly added" },
    ],
  },

  why: {
    eyebrow: "Why vibi",
    titleIntro: "Stop treating sound as one block. Work it ",
    titleEm: "stem by stem",
    titleOutro: ".",
    body: "Other mobile editors only touch sound as a single track. vibi splits each clip into voice, background, and per-speaker stems — keep, mute, or swap exactly what you choose.",
    legacyHeader: "Other mobile apps",
    vibiHeader: "vibi",
    rows: [
      { label: "Sound unit", legacy: "1 clip = 1 mixed track", vibi: "1 clip = voice / background / per-speaker" },
      { label: "Noise removal", legacy: "Crushes everything (voice too)", vibi: "Mute background only — voice intact" },
      { label: "BGM swap", legacy: "Layered on top — clashes", vibi: "Keep voice, replace BGM" },
      { label: "Isolate a speaker", legacy: "Not possible", vibi: "Pick one of two in an interview" },
      { label: "Where you work", legacy: "PC pro tools", vibi: "Mobile — right where you shoot" },
    ],
  },

  features: {
    eyebrow: "Features",
    title: "From shooting to publishing, in one hand.",
    body: "No complex PC tools — it all happens on mobile. Stem separation is the spine; captions, dubbing, and AI-chat edits flow from there.",
    items: [
      {
        eyebrow: "Main",
        title: "Region-based stem separation",
        body: "Drag a region on the timeline and split that part's voice, background, and per-speaker audio. Not the whole video — only what you need, stem by stem.",
      },
      {
        eyebrow: "Companion",
        title: "Auto captions + translation",
        body: "Turn speech into captions, translated into multiple languages at once. Adjust font and position right on screen.",
      },
      {
        eyebrow: "Companion",
        title: "AI multi-language dubbing",
        body: "Preserve the original voice's character while re-synthesizing it naturally in another language. Produce multiple language versions of one clip in parallel.",
      },
      {
        eyebrow: "AI",
        title: "Edit by chat",
        body: "“Keep only the voice in the selected region” — natural-language commands trigger editing tools. No more digging through menus.",
      },
    ],
  },

  scenario: {
    eyebrow: "How it works",
    title: "Travel vlog — keep the voice over market noise.",
    body: "When you want the room tone, just not the noise — vibi takes under five minutes.",
    beforeTitle: "Before — PC workflow",
    afterTitle: "After — vibi",
    before: [
      "Get to the hotel, open the laptop",
      "Move the clip to PC (5–15 min)",
      "Strip noise in a pro editor",
      "Search an external BGM library → download → import",
      "Send back to phone, then publish",
    ],
    after: [
      "Pick the clip from your camera roll",
      "Drag a region on the timeline → separate stems",
      "Mute background — voice stays intact",
      "Pick a BGM → drop on timeline → adjust volume",
      "Export → publish via system share sheet",
    ],
  },

  workflow: {
    eyebrow: "Workflow",
    title: "Five-minute PC work becomes five-second vibi work.",
    body: "No constraints on time or place. Cafe, road, subway — never miss a fleeting trend.",
    pcLabel: "PC",
    vibiLabel: "vibi",
    rows: [
      { step: "Bring in the clip", pc: "Cable / iCloud / AirDrop · 5–15 min", vibi: "Pick from gallery directly · 5 sec" },
      { step: "Add voice", pc: "Set up PC mic / external mic", vibi: "Record on phone, instantly" },
      { step: "Preview", pc: "Render, then play", vibi: "Play directly on the timeline" },
      { step: "Publish", pc: "Export → send to phone → upload", vibi: "System share sheet to channel — one tap" },
    ],
  },

  cta: {
    title: "Re-dress the voice on the clip you shot today.",
    body: "Download on the App Store. Your first clip is on us — done in five.",
    primary: "Download on the App Store",
    secondary: "See features again",
    caption: "iOS 17+ · Free download · Android coming later",
  },

  footer: {
    tagline: "Mobile video voice remixing — right where you shoot.",
    productHeading: "Product",
    companyHeading: "Company",
    legalHeading: "Legal",
    productLinks: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#scenario" },
      { label: "Workflow", href: "#workflow" },
    ],
    companyLinks: [
      { label: "Perso AI", href: "https://perso.ai" },
      { label: "Contact", href: "mailto:devrel.365@gmail.com" },
    ],
    legalLinks: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
    copyright: "© {year} vibi. Powered by Perso AI.",
    rightCaption: "Made for short-form creators.",
  },
};
