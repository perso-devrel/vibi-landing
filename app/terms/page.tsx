import type { Metadata } from "next";
import { LegalArticle } from "@/app/_components/legal-article";

export const metadata: Metadata = {
  title: "Terms of Service — vibi",
  description:
    "The terms governing your use of the vibi app and related services.",
};

export default function TermsPage() {
  return <LegalArticle slug="terms-of-service" />;
}
