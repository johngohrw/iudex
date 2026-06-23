import type { ReactNode } from "react";

// Compact inline badge for status labels and role indicators. Port of
// Chip.dc.html (DESIGN.md §6). `role` is shorthand: label defaults to it.
export default function Chip({
  children,
  bg = "#404040",
  fg = "#cfcfcf",
  role,
}: {
  children?: ReactNode;
  bg?: string;
  fg?: string;
  role?: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        fontWeight: 500,
        padding: "1px 5px",
        borderRadius: 2,
        background: bg,
        color: fg,
        whiteSpace: "nowrap",
        letterSpacing: "0.02em",
      }}
    >
      {children ?? role ?? ""}
    </span>
  );
}
