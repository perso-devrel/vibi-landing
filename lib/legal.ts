import fs from "node:fs";
import path from "node:path";

/**
 * 법무 문서(개인정보처리방침 / 이용약관) 로더. docs 시스템과 달리 카테고리·목록이 없어
 * 단일 파일을 읽어 H1 을 title 로 분리하는 최소 구현 — `legal/<slug>.md` 한 곳이 SSOT.
 */
export type LegalDoc = {
  title: string;
  body: string; // H1 제거된 본문
};

const LEGAL_ROOT = path.resolve(process.cwd(), "legal");

export function getLegalDoc(slug: "privacy-policy" | "terms-of-service"): LegalDoc {
  const raw = fs.readFileSync(path.join(LEGAL_ROOT, `${slug}.md`), "utf8");
  const titleMatch = raw.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : slug;
  const body = raw.replace(/^#\s+.+$/m, "").trimStart();
  return { title, body };
}
