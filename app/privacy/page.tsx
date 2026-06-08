import type { Metadata } from "next";
import { LegalArticle } from "@/app/_components/legal-article";

export const metadata: Metadata = {
  title: "Privacy Policy — vibi",
  description:
    "How vibi collects, uses, and protects your data. No advertising, analytics, or third-party tracking.",
};

export default function PrivacyPage() {
  return <LegalArticle slug="privacy-policy" />;
}
