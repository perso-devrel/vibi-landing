import type { Metadata } from "next";
import { LegalArticle } from "@/app/_components/legal-article";

const DESCRIPTION =
  "How vibi collects, uses, and protects your data. No advertising, analytics, or third-party tracking.";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: DESCRIPTION,
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Privacy Policy — vibi",
    description: DESCRIPTION,
    url: "/privacy",
    siteName: "vibi",
    type: "website",
  },
};

export default function PrivacyPage() {
  return <LegalArticle slug="privacy-policy" />;
}
