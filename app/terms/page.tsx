import type { Metadata } from "next";
import { LegalArticle } from "@/app/_components/legal-article";

const DESCRIPTION =
  "The terms governing your use of the vibi app and related services.";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: DESCRIPTION,
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Terms of Service — vibi",
    description: DESCRIPTION,
    url: "/terms",
    siteName: "vibi",
    type: "website",
  },
};

export default function TermsPage() {
  return <LegalArticle slug="terms-of-service" />;
}
