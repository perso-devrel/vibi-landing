export type LinkItem = { label: string; href: string };

export type Dict = {
  meta: { title: string; description: string };

  nav: {
    appStore: string;
    ios: string;
    premiere: string;
    why: string;
    features: string;
    scenario: string;
    workflow: string;
    docs: string;
  };

  hero: {
    eyebrow: string;
    titleLines: [string, string];
    body: string;
    chips: string[];
    ctaPrimary: string;
    ctaSecondary: string;
    caption: string;
  };

  apps: {
    eyebrow: string;
    title: string;
    body: string;
    items: {
      kind: "ios" | "premiere";
      eyebrow: string;
      badge: string;
      tagline: string;
      body: string;
      points: string[];
      ctaLabel: string;
    }[];
  };

  waveform: {
    filename: string;
    title: string;
    body: string;
    preview: string;
    tracks: { name: string; subtitle: string }[];
  };

  why: {
    eyebrow: string;
    titleIntro: string; // text before the emphasis
    titleEm: string; // muted/em part
    titleOutro: string; // text after the emphasis (often a period)
    body: string;
    legacyHeader: string;
    vibiHeader: string;
    rows: { label: string; legacy: string; vibi: string }[];
  };

  features: {
    eyebrow: string;
    title: string;
    body: string;
    items: { eyebrow: string; title: string; body: string }[];
  };

  scenario: {
    eyebrow: string;
    title: string;
    body: string;
    beforeTitle: string;
    afterTitle: string;
    before: string[];
    after: string[];
  };

  workflow: {
    eyebrow: string;
    title: string;
    body: string;
    pcLabel: string;
    vibiLabel: string;
    rows: { step: string; pc: string; vibi: string }[];
  };

  plugin: {
    panelName: string;
    panelHost: string;
    sources: string[];
  };

  cta: {
    title: string;
    body: string;
    primary: string;
    secondary: string;
    caption: string;
  };

  footer: {
    tagline: string;
    productHeading: string;
    productLinks: LinkItem[];
    copyright: string; // template with {year}
    githubLinks: LinkItem[];
    legalLinks: LinkItem[];
  };
};
