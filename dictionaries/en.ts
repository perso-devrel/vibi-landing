import type { Dict } from "./types";

export const en: Dict = {
  meta: {
    title: "vibi — Keep the video. Erase just the noise.",
    description:
      "Mobile AI that removes only the sounds you don't want. Pick a region, split the audio into voice, background, and per-speaker stems, then mute the wind, the passerby, the wrong voice — the footage you can't reshoot stays.",
  },
  nav: {
    browse: "Browse",
    appStore: "App Store",
    why: "Why vibi",
    features: "Features",
    scenario: "How it works",
    workflow: "Workflow",
    docs: "Docs",
  },

  hero: {
    badge: "Now on the App Store · iOS",
    titleLines: ["Keep the video.", "Erase just the noise."],
    body: "Wind, crowd, a passerby's voice, a curse word — vibi splits any region of your clip into voice, background, and per-speaker stems. Mute only what's bothering you. The footage you can't reshoot stays intact.",
    ctaPrimary: "Download on the App Store",
    ctaSecondary: "See how it works",
    ctaCaption: "iOS 17+ · Free download",
    stats: [
      { value: "By region", label: "Mute just the part that bothers you" },
      { value: "Per speaker", label: "Isolate one voice from two" },
      { value: "On mobile", label: "Right where you shoot" },
    ],
  },

  waveform: {
    filename: "interview_03.mov",
    title: "One clip. Mute just what bothers you.",
    body: "Pick a region, separate voice and background, mute the noise. The voice is never compressed — the footage you can't reshoot is preserved.",
    preview: "Preview · 0:42",
    tracks: [
      { name: "Voice", subtitle: "Voice — kept" },
      { name: "Background", subtitle: "Background — muted" },
      { name: "BGM", subtitle: "BGM — newly added" },
    ],
  },

  why: {
    eyebrow: "Why vibi",
    titleIntro: "Stop crushing the whole track. Erase ",
    titleEm: "just what bothers you",
    titleOutro: ".",
    body: "Other mobile editors treat sound as one block — kill the noise, kill the voice with it. vibi splits each clip into voice, background, and per-speaker stems so you can mute only the parts you don't want.",
    legacyHeader: "Other mobile apps",
    vibiHeader: "vibi",
    rows: [
      { label: "Sound unit", legacy: "1 clip = 1 mixed track", vibi: "1 clip = voice / background / per-speaker" },
      { label: "Noise removal", legacy: "Crushes everything (voice too)", vibi: "Mute background only — voice intact" },
      { label: "Cut one speaker", legacy: "Not possible", vibi: "Pick one of two in an interview" },
      { label: "If audio is ruined", legacy: "Re-shoot or trash the clip", vibi: "Keep the footage, erase just the audio" },
      { label: "Where you work", legacy: "PC pro tools", vibi: "Mobile — right where you shoot" },
    ],
  },

  features: {
    eyebrow: "Features",
    title: "The footage you can't reshoot, finally salvageable.",
    body: "Region selection plus stem separation is the spine. BGM tools, captions, dubbing, and AI chat sit on top — the same separation engine all the way through.",
    items: [
      {
        eyebrow: "Main",
        title: "Region + per-stem separation",
        body: "Drag a region on the timeline. AI splits that part into voice, background, and per-speaker stems — then mute the wind, dim the passerby's volume, or slow the wrong voice down. Not the whole clip, only what you picked.",
      },
      {
        eyebrow: "Main",
        title: "Drop in BGM, or record on the spot",
        body: "Layer a BGM file or record straight from the phone mic. Adjust each BGM clip's volume, speed, duplicate, delete. The BGM itself can run through the same separation — keep only its clean part, fill the gap the noise left behind.",
      },
      {
        eyebrow: "AI",
        title: "Edit by chat",
        body: "“Mute the background between 0:30 and 0:42” — natural-language commands trigger the editing tools directly. No menu digging when the moment is already past.",
      },
    ],
  },

  scenario: {
    eyebrow: "How it works",
    title: "Interview clip — one voice clean, the other gone.",
    body: "The moment was too good to reshoot but a passerby ruined the audio. With vibi, salvaging it takes under five minutes.",
    beforeTitle: "Before — PC workflow",
    afterTitle: "After — vibi",
    before: [
      "Get back to the desk, open the laptop",
      "Move the clip to PC (5–15 min)",
      "Search “how to remove a voice from a video”",
      "Try app after app, tutorial after tutorial — still stuck",
      "Give up; re-shoot or trash the clip",
    ],
    after: [
      "Pick the clip from your camera roll",
      "Drag the region where the passerby cut in",
      "Separate stems — voice, background, per-speaker",
      "Mute the speaker you don't want — yours stays",
      "Drop a BGM if needed → export → share",
    ],
  },

  workflow: {
    eyebrow: "Workflow",
    title: "Five-minute PC work becomes five seconds on vibi.",
    body: "Time and place don't matter. Cafe, road, subway — the moment doesn't get away.",
    pcLabel: "PC",
    vibiLabel: "vibi",
    rows: [
      { step: "Bring in the clip", pc: "Cable / iCloud / AirDrop · 5–15 min", vibi: "Pick from gallery directly · 5 sec" },
      { step: "Erase a noise", pc: "EQ + multiband + manual cuts — and voice often dies with it", vibi: "Drag the region, then tap mute on the stem you don't want" },
      { step: "Preview", pc: "Render, then play", vibi: "Play directly on the timeline" },
      { step: "Publish", pc: "Export → send to phone → upload", vibi: "System share sheet to channel — one tap" },
    ],
  },

  cta: {
    title: "The clip you almost trashed today — salvage it.",
    body: "Download on the App Store. Your first save is on us — done in five.",
    primary: "Download on the App Store",
    secondary: "See features again",
    caption: "iOS 17+ · Free download · Android coming later",
  },

  footer: {
    tagline: "Keep the video. Erase just the noise — on mobile.",
    productHeading: "Product",
    productLinks: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#scenario" },
      { label: "Workflow", href: "#workflow" },
      { label: "Docs", href: "/docs" },
    ],
    copyright: "© {year} vibi · Built by je0ng3",
    githubLinks: [
      { label: "vibi", href: "https://github.com/perso-devrel/vibi" },
      { label: "vibi-bff", href: "https://github.com/perso-devrel/vibi-bff" },
    ],
    legalLinks: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
};
