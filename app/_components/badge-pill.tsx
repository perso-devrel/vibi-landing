import type { ReactNode } from "react";

export function BadgePill({
  children,
  dot = false,
}: {
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className="caption-uppercase inline-flex items-center gap-2 rounded-full px-3 py-1"
      style={{
        background: "var(--color-surface-strong)",
        color: "var(--color-ink)",
      }}
    >
      {dot ? (
        <span className="relative inline-flex h-1.5 w-1.5">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ background: "var(--color-gradient-sky)" }}
          />
          <span
            className="relative inline-flex h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--color-ink)" }}
          />
        </span>
      ) : null}
      {children}
    </span>
  );
}
