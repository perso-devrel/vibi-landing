import type { Metadata } from "next";
import { LegalArticle } from "@/app/_components/legal-article";

export const metadata: Metadata = {
  title: "Account & Data Deletion — vibi",
  description:
    "How to delete your vibi account and associated data, in the app or by email.",
};

export default function AccountDeletionPage() {
  return <LegalArticle slug="account-deletion" />;
}
