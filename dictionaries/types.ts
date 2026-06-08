export type LinkItem = { label: string; href: string };

export type Dict = {
  meta: { title: string; description: string };

  nav: {
    browse: string;
    appStore: string;
    why: string;
    features: string;
    scenario: string;
    workflow: string;
    docs: string;
  };

  hero: {
    badge: string;
    titleLines: [string, string];
    body: string;
    ctaPrimary: string;
    ctaSecondary: string;
    ctaCaption: string;
    stats: { value: string; label: string }[];
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
