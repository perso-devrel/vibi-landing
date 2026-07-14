import type { Metadata } from "next";
import { dict } from "@/dictionaries";
import { LandingPage } from "./_landing";
import { buildLandingMetadata } from "./_meta";

export const metadata: Metadata = buildLandingMetadata("en");

export default function Home() {
  return <LandingPage dict={dict} lang="en" />;
}
