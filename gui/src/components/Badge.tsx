import type { ReactNode } from "react";
import { MERGE, ROLE_STYLE, ticketState } from "../lib/badges";

// The one badge/chip used across the app. Colors resolve from the central
// registry by `kind` + `value`; pass `children` to override the label (merge
// badges carry dynamic text), or `bg`/`fg` as an explicit escape hatch.
// `tone="dark"` selects a state's dark-surface fill where one exists (the graph).
type Kind = "state" | "merge" | "role";

export default function Badge({
  kind,
  value,
  tone = "light",
  bg,
  fg,
  children,
}: {
  kind?: Kind;
  value?: string;
  tone?: "light" | "dark";
  bg?: string;
  fg?: string;
  children?: ReactNode;
}) {
  let cbg = bg;
  let cfg = fg;
  let label: ReactNode = children ?? value ?? "";

  if (cbg === undefined || cfg === undefined) {
    if (kind === "state" && value !== undefined) {
      const st = ticketState(value);
      const pair = tone === "dark" && st.dark ? st.dark : { bg: st.bg, fg: st.fg };
      cbg ??= pair.bg;
      cfg ??= pair.fg;
      if (children === undefined) label = st.label;
    } else if (kind === "merge" && value !== undefined) {
      const m = MERGE[value] ?? { bg: "#828282", fg: "#2a2a2a" };
      cbg ??= m.bg;
      cfg ??= m.fg;
    } else if (kind === "role") {
      cbg ??= ROLE_STYLE.bg;
      cfg ??= ROLE_STYLE.fg;
    }
  }

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
        background: cbg ?? "#404040",
        color: cfg ?? "#cfcfcf",
        whiteSpace: "nowrap",
        letterSpacing: "0.02em",
      }}
    >
      {label}
    </span>
  );
}
