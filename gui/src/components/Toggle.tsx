import s from "./Toggle.module.scss";

// Flat, controlled on/off switch (amber when on). Pass `checked` + `onChange`.
// Single source for the toggle visual shared by the Sidebar automation rail and
// the Settings Behavior tab.
export default function Toggle({
  checked,
  onChange,
  disabled,
  title,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <span
      className={`${s.toggle} ${checked ? s.on : s.off} ${disabled ? s.disabled : ""}`}
      onClick={() => !disabled && onChange(!checked)}
      title={title}
      role="switch"
      aria-checked={checked}
    >
      <span className={s.knob} />
    </span>
  );
}
