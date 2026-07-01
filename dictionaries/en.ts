import type { Dict } from "./types";

export const en: Dict = {
  meta: {
    title: "vibi — Keep the video. Erase just the noise.",
    description:
      "AI that removes only the sounds you don't want — on iOS, and inside Adobe Premiere Pro. Split the audio into voice, background, and per-speaker stems, then mute the wind, the passerby, the wrong voice — the footage you can't reshoot stays.",
  },

  announcement: {
    badge: "Beta",
    message: "Payments aren't live yet — vibi is free to try right now.",
    feedbackText: "Send us a review or feedback and we'll add 5 bonus credits.",
    feedbackLabel: "Send feedback",
    feedbackEmail: "jepark2934@gmail.com",
    feedbackSubject: "vibi feedback (for 5 bonus credits)",
  },
  nav: {
    appStore: "App Store",
    ios: "iPhone",
    premiere: "Premiere Pro",
    why: "Why vibi",
    features: "Features",
    scenario: "How it works",
    workflow: "Workflow",
    docs: "Docs",
  },

  hero: {
    eyebrow: "AI audio separation",
    titleLines: ["Keep the video.", "Erase just the noise."],
    body: "Pick any clip and vibi separates the audio into voice, background, and per-speaker stems — so you can mute the wind, the passerby, or the wrong voice without ever touching the footage you can't reshoot.",
    chips: ["Voice", "Background", "Per-speaker"],
    ctaPrimary: "Download on the App Store",
    ctaSecondary: "Get the Premiere Pro panel",
    caption: "On iPhone (iOS 17+) and inside Adobe Premiere Pro 26+",
  },

  apps: {
    eyebrow: "Two apps, one engine",
    title: "Pick where you work.",
    body: "The same separation, the same account, the same credits. Start on your phone where you shoot, finish in Premiere where you edit — your credits follow you across both.",
    items: [
      {
        kind: "ios",
        eyebrow: "vibi for iPhone",
        badge: "iOS 17+",
        tagline: "The quick fix, where you shoot.",
        body: "Pick a clip and the whole track separates. Split it into regions and mute, dim, or slow just the part that bothers you — done in under five minutes.",
        points: ["Whole-clip stem separation", "Mute / dim / slow by region", "Add BGM, or edit by chat"],
        ctaLabel: "Download on the App Store",
      },
      {
        kind: "premiere",
        eyebrow: "vibi for Premiere Pro",
        badge: "Premiere Pro 26+",
        tagline: "The detailed cut, in your editor.",
        body: "Read the timecoded, per-speaker transcript, reassign speakers, and regenerate the audio. Ride each stem with a dB fader, then mix a clean .wav back onto your timeline.",
        points: ["Per-speaker transcript editing", "Reassign speakers, regenerate", "Mix a .wav to your sequence"],
        ctaLabel: "Get the Premiere Pro panel",
      },
    ],
  },

  waveform: {
    filename: "interview_03.mov",
    title: "One clip. Mute just what bothers you.",
    body: "Separate the whole clip into each speaker and the background, then pick a region and mute just the noise. The voices are never compressed — the footage you can't reshoot is preserved.",
    preview: "Preview · 0:42",
    tracks: [
      { name: "Voice 1", subtitle: "Voice 1 — kept" },
      { name: "Voice 2", subtitle: "Voice 2 — kept" },
      { name: "Background", subtitle: "Background — muted" },
    ],
  },

  why: {
    eyebrow: "Why vibi",
    titleIntro: "Stop crushing the whole track. Erase ",
    titleEm: "just what bothers you",
    titleOutro: ".",
    body: "Most editors treat sound as one block — kill the noise, kill the voice with it. vibi splits each clip into voice, background, and per-speaker stems so you can mute only the parts you don't want. Same engine on iPhone and in Premiere Pro.",
    legacyHeader: "Other tools",
    vibiHeader: "vibi",
    rows: [
      { label: "Sound unit", legacy: "1 clip = 1 mixed track", vibi: "1 clip = voice / background / per-speaker" },
      { label: "Noise removal", legacy: "Crushes everything (voice too)", vibi: "Mute background only — voice intact" },
      { label: "Cut one speaker", legacy: "Not possible", vibi: "Pick one of two in an interview" },
      { label: "If audio is ruined", legacy: "Re-shoot or trash the clip", vibi: "Keep the footage, erase just the audio" },
      { label: "Where you work", legacy: "Locked to one workflow", vibi: "iPhone on location · Premiere Pro at the desk" },
    ],
  },

  features: {
    eyebrow: "Features",
    title: "What you can do once it's split.",
    body: "Region edits, BGM, captions, transcript-level control — every tool stands on the same voice / background / per-speaker separation.",
    items: [
      {
        eyebrow: "Both apps",
        title: "Whole-clip, per-speaker separation",
        body: "Pick a clip and AI splits the entire track into voice, background, and per-speaker stems — the foundation everything else is built on, identical on iPhone and in Premiere Pro.",
      },
      {
        eyebrow: "On iPhone",
        title: "Adjust by region, on the go",
        body: "Split the separated clip into regions and mute, dim, or slow just the part that bothers you. Layer in BGM or record from the mic, then export and share — done in under five minutes.",
      },
      {
        eyebrow: "In Premiere Pro",
        title: "Edit from the transcript",
        body: "Work from a timecoded, per-speaker script: reassign speakers, fix who said what, regenerate the audio, ride each stem with a dB fader, then mix a clean .wav back onto your timeline.",
      },
    ],
  },

  scenario: {
    eyebrow: "How it works",
    title: "Interview clip — one voice clean, the other gone.",
    body: "The moment was too good to reshoot but a passerby ruined the audio. With vibi, salvaging it takes under five minutes.",
    beforeTitle: "Before — the old way",
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
      "Separate the whole track — voice, background, per-speaker",
      "Drag the region where the passerby cut in",
      "Mute the speaker you don't want — yours stays",
      "Drop a BGM if needed → export → share",
    ],
  },

  workflow: {
    eyebrow: "Workflow",
    title: "What used to need a studio, now in two apps.",
    body: "Whether you're on your phone on location or deep in Premiere at the desk — the moment doesn't get away.",
    pcLabel: "The old way",
    vibiLabel: "vibi",
    rows: [
      { step: "Bring in the clip", pc: "Cable / iCloud / AirDrop · 5–15 min", vibi: "From your gallery on iPhone, or the Project panel in Premiere" },
      { step: "Erase a noise", pc: "EQ + multiband + manual cuts — and voice often dies with it", vibi: "Separate, then mute the stem or region you don't want" },
      { step: "Preview", pc: "Render, then play", vibi: "Play instantly — on the timeline or in the panel" },
      { step: "Publish", pc: "Export → send → upload", vibi: "Share sheet on mobile, or a clean .wav back to your sequence" },
    ],
  },

  plugin: {
    panelName: "Vibi: AI Sound Eraser",
    panelHost: "Premiere Pro 26+ · UXP panel",
    sources: ["File", "Project", "Timeline"],
  },

  cta: {
    title: "Two ways in. One clean cut.",
    body: "Start on your phone where you shoot, finish in Premiere where you edit — your account and credits follow you across both.",
    primary: "Download on the App Store",
    secondary: "Get the Premiere Pro panel",
    caption: "iOS 17+ · Premiere Pro 26+ · credits shared across both",
  },

  footer: {
    tagline: "Keep the video. Erase just the noise — on iPhone and in Premiere Pro.",
    productHeading: "Product",
    productLinks: [
      { label: "vibi for iPhone", href: "#app-ios" },
      { label: "vibi for Premiere Pro", href: "#app-premiere" },
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#scenario" },
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
