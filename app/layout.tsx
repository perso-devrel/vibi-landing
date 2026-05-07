import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "vibi — 영상 속 보이스를 분리하고 다시 입히세요",
  description:
    "촬영한 그 자리에서 보이스 / 배경 / 사람별 사운드를 분리하고, 자막·다국어 더빙·AI 채팅 편집까지. 모바일 영상 보이스 리믹싱 앱 vibi.",
  metadataBase: new URL("https://vibi.app"),
  openGraph: {
    title: "vibi — 영상 속 보이스를 분리하고 다시 입히세요",
    description:
      "사운드를 통째로 다루는 앱이 아니라, 분리해서 부분 단위로. 모바일에서 보이스만 살리고 BGM 갈아끼우세요.",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "vibi",
    description: "모바일 영상 보이스 리믹싱 앱",
  },
};

export const viewport: Viewport = {
  themeColor: "#07070a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
