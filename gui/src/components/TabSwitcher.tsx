// Segmented pill switcher for 2–4 tabs. See gui/design-system/README.md §5.
// A tab is either a bare value (label === value) or { label, value } when the
// rendered label should differ from the value reported to onChange — so the
// value can be an opaque id/enum while the label is a pretty string/node.
export type TabItem<V extends string | number = string> =
  | V
  | { label: React.ReactNode; value: V };

function normalize<V extends string | number>(
  t: TabItem<V>,
): { label: React.ReactNode; value: V } {
  return typeof t === "object" ? t : { label: String(t), value: t };
}

export default function TabSwitcher<V extends string | number = string>({
  tabs,
  value,
  onChange,
  fontSize = "12px",
  style,
}: {
  tabs: TabItem<V>[];
  value: V;
  onChange: (value: V) => void;
  fontSize?: string;
  style?: React.CSSProperties;
}) {
  const items = tabs.map(normalize);
  return (
    <div style={{ display: "inline-flex", background: "#929292", border: "1px solid #6f6f6f", padding: 1, ...style }}>
      {items.map((t) => {
        const on = t.value === value;
        return (
          <span
            key={String(t.value)}
            onClick={() => onChange(t.value)}
            style={{
              padding: "1px 11px",
              borderRadius: 3,
              cursor: "pointer",
              WebkitUserSelect: "none",
              userSelect: "none",
              fontSize,
              background: on ? "#dadada" : "transparent",
              color: on ? "#2a2a2a" : "#565656",
            }}
          >
            {t.label}
          </span>
        );
      })}
    </div>
  );
}
