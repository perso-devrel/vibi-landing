import type { Metadata } from "next";
import { LegalArticle } from "@/app/_components/legal-article";

const DESCRIPTION =
  "How to delete your vibi account and associated data, in the app or by email.";

export const metadata: Metadata = {
  title: "Account & Data Deletion",
  description: DESCRIPTION,
  alternates: { canonical: "/account-deletion" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Account & Data Deletion — vibi",
    description: DESCRIPTION,
    url: "/account-deletion",
    siteName: "vibi",
    type: "website",
  },
};

export default function AccountDeletionPage() {
  return <LegalArticle slug="account-deletion" />;
}
