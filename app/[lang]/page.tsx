import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDict, isLocale, pathLocales, defaultLocale } from "@/dictionaries";
import { LandingPage } from "../_landing";
import { buildLandingMetadata } from "../_meta";

// Only the non-default locales are valid /{lang} routes; anything else 404s.
export const dynamicParams = false;

export function generateStaticParams() {
  return pathLocales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang) || lang === defaultLocale) return {};
  return buildLandingMetadata(lang);
}

export default async function LocalizedHome({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang) || lang === defaultLocale) notFound();
  return <LandingPage dict={getDict(lang)} lang={lang} />;
}
