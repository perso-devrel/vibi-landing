import { ImageResponse } from "next/og";
import { dict } from "@/dictionaries";

export const alt = dict.meta.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#f5f5f5",
          color: "#0c0a09",
          padding: "80px 96px",
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 700, letterSpacing: "-4px" }}>vibi</div>
        <div style={{ fontSize: 52, marginTop: 8, color: "#0c0a09" }}>
          Keep the video. Erase just the noise.
        </div>
        <div style={{ fontSize: 30, marginTop: 28, color: "#6b655d" }}>
          AI audio separation · iPhone · Android · Adobe Premiere Pro
        </div>
      </div>
    ),
    { ...size },
  );
}
