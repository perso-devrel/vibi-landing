import type { MetadataRoute } from "next";
import { allDocParams } from "@/lib/docs";
import { locales, localePath, htmlLang } from "@/dictionaries";

const BASE = "https://www.vibi.fm";

export default function sitemap(): MetadataRoute.Sitemap {
  // The landing page exists per locale; each entry advertises every locale via hreflang.
  const landingLanguages = Object.fromEntries(
    locales.map((l) => [htmlLang[l], `${BASE}${localePath(l)}`]),
  );
  const landingRoutes: MetadataRoute.Sitemap = locales.map((l) => ({
    url: `${BASE}${localePath(l)}`,
    changeFrequency: "weekly",
    priority: l === "en" ? 1 : 0.9,
    alternates: { languages: landingLanguages },
  }));

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/docs`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/account-deletion`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const docRoutes: MetadataRoute.Sitemap = allDocParams().map((p) => ({
    url: `${BASE}/docs/${p.category}/${p.slug.join("/")}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...landingRoutes, ...staticRoutes, ...docRoutes];
}
