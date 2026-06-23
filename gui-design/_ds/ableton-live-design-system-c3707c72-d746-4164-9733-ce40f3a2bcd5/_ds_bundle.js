/* @ds-bundle: {"format":3,"namespace":"AbletonLiveDesignSystem_c3707c","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"ContextMenu","sourcePath":"components/core/ContextMenu.jsx"},{"name":"Dropdown","sourcePath":"components/core/Dropdown.jsx"},{"name":"Knob","sourcePath":"components/core/Knob.jsx"},{"name":"ListRow","sourcePath":"components/core/ListRow.jsx"},{"name":"Meter","sourcePath":"components/core/Meter.jsx"},{"name":"NumericField","sourcePath":"components/core/NumericField.jsx"},{"name":"Panel","sourcePath":"components/core/Panel.jsx"},{"name":"PanelHeader","sourcePath":"components/core/PanelHeader.jsx"},{"name":"Tabs","sourcePath":"components/core/Tabs.jsx"},{"name":"Toggle","sourcePath":"components/core/Toggle.jsx"},{"name":"NodeGraph","sourcePath":"components/data/NodeGraph.jsx"},{"name":"Table","sourcePath":"components/data/Table.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"RadioGroup","sourcePath":"components/forms/RadioGroup.jsx"},{"name":"Slider","sourcePath":"components/forms/Slider.jsx"},{"name":"TextInput","sourcePath":"components/forms/TextInput.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"fef4a6fc8a87","components/core/Button.jsx":"e74632dc1e4e","components/core/ContextMenu.jsx":"ad0efb6bbc72","components/core/Dropdown.jsx":"c8de76668453","components/core/Knob.jsx":"303e7880d13f","components/core/ListRow.jsx":"fe57585e245c","components/core/Meter.jsx":"97d1fb31a11d","components/core/NumericField.jsx":"54aa4f0cb219","components/core/Panel.jsx":"21e3044f9506","components/core/PanelHeader.jsx":"c270c5881afd","components/core/Tabs.jsx":"106a5873fdbc","components/core/Toggle.jsx":"4a9396615172","components/data/NodeGraph.jsx":"8811b454c70d","components/data/Table.jsx":"64b3590e9141","components/forms/Checkbox.jsx":"572971978981","components/forms/RadioGroup.jsx":"d48cb698e7c3","components/forms/Slider.jsx":"6895ba8b9108","components/forms/TextInput.jsx":"522857d1475c","components/forms/Textarea.jsx":"894db7571d06","ui_kits/live-session/Browser.jsx":"349ad7709198","ui_kits/live-session/DeviceChain.jsx":"98b93bea7a22","ui_kits/live-session/SessionGrid.jsx":"88c92a23aaf4","ui_kits/live-session/TopBar.jsx":"162ab9bb8de6"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.AbletonLiveDesignSystem_c3707c = window.AbletonLiveDesignSystem_c3707c || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
/**
 * Badge — compact status / category indicator. Two forms:
 *  - dot: a tiny color square (user color-coding or status)
 *  - pill: a small barely-rounded chip with a label
 * Color is information: amber = active, cyan = editing, red = record, etc.
 */
function Badge({
  children,
  color = "var(--accent-amber)",
  variant = "pill",
  // "pill" | "dot" | "outline"
  style = {}
}) {
  if (variant === "dot") {
    return /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-block",
        width: "8px",
        height: "8px",
        background: color,
        borderRadius: "var(--radius-sm)",
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.25)",
        ...style
      }
    });
  }
  const outline = variant === "outline";
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      height: "15px",
      padding: "0 6px",
      font: `var(--weight-semi) var(--text-micro)/1 var(--font-ui)`,
      letterSpacing: "var(--tracking-wide)",
      color: outline ? color : "#1a1305",
      background: outline ? "transparent" : color,
      border: `1px solid ${outline ? color : "transparent"}`,
      borderRadius: "var(--radius-sm)",
      whiteSpace: "nowrap",
      userSelect: "none",
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — flat, square-cornered action button.
 * Off/default = neutral gray; primary = solid amber ("on"); record = red.
 * No shadow, no scale-on-press. Hover only lightens. Curved-only-at-controls
 * means this is barely rounded (2px).
 */
function Button({
  variant = "default",
  size = "md",
  active = false,
  disabled = false,
  icon = null,
  children,
  style = {},
  ...rest
}) {
  const fills = {
    default: {
      bg: "var(--canvas-panel)",
      fg: "var(--canvas-text)",
      hov: "var(--canvas-panel-light)"
    },
    primary: {
      bg: "var(--accent-amber)",
      fg: "#241a02",
      hov: "var(--accent-amber-hi)"
    },
    record: {
      bg: "var(--accent-red)",
      fg: "#2a0b08",
      hov: "#ec6f64"
    },
    cyan: {
      bg: "var(--accent-cyan)",
      fg: "#06222a",
      hov: "var(--accent-cyan-hi)"
    },
    ghost: {
      bg: "transparent",
      fg: "var(--canvas-text)",
      hov: "rgba(0,0,0,0.08)"
    }
  };
  // `active` forces the amber "on" treatment regardless of base variant
  const tone = active ? fills.primary : fills[variant] || fills.default;
  const heights = {
    sm: "var(--control-h)",
    md: "var(--control-h-lg)"
  };
  const pads = {
    sm: "0 6px",
    md: "0 10px"
  };
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      height: heights[size],
      padding: pads[size],
      font: `var(--weight-medium) var(--text-label)/1 var(--font-ui)`,
      letterSpacing: "var(--tracking-normal)",
      color: tone.fg,
      background: hover && !disabled ? tone.hov : tone.bg,
      border: variant === "ghost" ? "1px solid transparent" : "1px solid rgba(0,0,0,0.22)",
      borderRadius: "var(--radius-sm)",
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.4 : 1,
      userSelect: "none",
      whiteSpace: "nowrap",
      transition: `background var(--dur-instant) var(--ease-ui)`,
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      lineHeight: 0
    }
  }, icon) : null, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/ContextMenu.jsx
try { (() => {
/**
 * ContextMenu — flat, light, square-cornered (barely rounded) list. Dark text,
 * no heavy drop shadow. Checkmarks for toggled items, keyboard shortcuts
 * right-aligned in a dimmer gray, thin 1px dividers grouping related actions.
 * No icon clutter.
 *
 * Items: { label, shortcut?, checked?, disabled?, danger?, onSelect? }
 * Use { divider: true } to insert a group divider.
 */
function ContextMenu({
  items = [],
  width = 180,
  style = {}
}) {
  const [hoverIdx, setHoverIdx] = React.useState(-1);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: typeof width === "number" ? `${width}px` : width,
      background: "var(--canvas-panel-lighter)",
      border: "1px solid rgba(0,0,0,0.4)",
      borderRadius: "var(--radius-sm)",
      boxShadow: "var(--shadow-popover)",
      padding: "3px 0",
      userSelect: "none",
      ...style
    }
  }, items.map((it, i) => {
    if (it.divider) {
      return /*#__PURE__*/React.createElement("div", {
        key: `d${i}`,
        style: {
          height: "1px",
          background: "rgba(0,0,0,0.16)",
          margin: "3px 0"
        }
      });
    }
    const hov = hoverIdx === i && !it.disabled;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      onMouseEnter: () => setHoverIdx(i),
      onMouseLeave: () => setHoverIdx(-1),
      onClick: () => !it.disabled && it.onSelect && it.onSelect(),
      style: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        height: "var(--row-h-comfy)",
        padding: "0 10px 0 8px",
        font: `var(--weight-regular) var(--text-body)/1 var(--font-ui)`,
        color: it.disabled ? "rgba(42,42,42,0.35)" : it.danger ? "var(--accent-red)" : "var(--canvas-text)",
        background: hov ? "var(--accent-amber)" : "transparent",
        cursor: it.disabled ? "default" : "pointer",
        whiteSpace: "nowrap"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: "10px",
        flex: "none",
        fontSize: "10px"
      }
    }, it.checked ? "✓" : ""), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, it.label), it.shortcut ? /*#__PURE__*/React.createElement("span", {
      style: {
        font: `var(--weight-regular) var(--text-label)/1 var(--font-mono)`,
        color: hov ? "rgba(36,26,2,0.7)" : "var(--canvas-text-dim)"
      }
    }, it.shortcut) : null);
  }));
}
Object.assign(__ds_scope, { ContextMenu });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ContextMenu.jsx", error: String((e && e.message) || e) }); }

// components/core/Dropdown.jsx
try { (() => {
/**
 * Dropdown — flat rectangle with a small chevron, no border emphasis. Opens a
 * flush flat list; the hovered row highlights solid amber. Reads as part of the
 * same surface, not a shadow-heavy floating menu.
 */
function Dropdown({
  value,
  options = [],
  onChange = () => {},
  placeholder = "Select",
  width = 120,
  tone = "module",
  disabled = false,
  style = {}
}) {
  const [open, setOpen] = React.useState(false);
  const [hoverIdx, setHoverIdx] = React.useState(-1);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const close = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, []);
  const opts = options.map(o => typeof o === "string" ? {
    value: o,
    label: o
  } : o);
  const current = opts.find(o => o.value === value);
  const onCanvas = tone === "canvas";
  const fieldBg = onCanvas ? "var(--canvas-panel)" : "var(--module-panel)";
  const fieldFg = onCanvas ? "var(--canvas-text)" : "var(--module-text)";
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      position: "relative",
      display: "inline-block",
      width: typeof width === "number" ? `${width}px` : width,
      ...style
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    disabled: disabled,
    onClick: () => !disabled && setOpen(o => !o),
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "6px",
      width: "100%",
      height: "var(--control-h-lg)",
      padding: "0 6px",
      font: `var(--weight-regular) var(--text-label)/1 var(--font-ui)`,
      color: current ? fieldFg : onCanvas ? "var(--canvas-text-dim)" : "var(--module-text-dim)",
      background: fieldBg,
      border: "1px solid rgba(0,0,0,0.3)",
      borderRadius: "var(--radius-sm)",
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.4 : 1,
      userSelect: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, current ? current.label : placeholder), /*#__PURE__*/React.createElement("svg", {
    width: "8",
    height: "8",
    viewBox: "0 0 8 8",
    style: {
      flex: "none",
      opacity: 0.7
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 2.5 L4 5.5 L7 2.5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.2"
  }))), open ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "calc(100% + 2px)",
      left: 0,
      minWidth: "100%",
      zIndex: 40,
      background: "var(--canvas-panel-lighter)",
      border: "1px solid rgba(0,0,0,0.4)",
      borderRadius: "var(--radius-sm)",
      boxShadow: "var(--shadow-popover)",
      padding: "2px 0"
    }
  }, opts.map((o, i) => {
    const sel = o.value === value;
    return /*#__PURE__*/React.createElement("div", {
      key: o.value,
      onMouseEnter: () => setHoverIdx(i),
      onMouseLeave: () => setHoverIdx(-1),
      onClick: () => {
        onChange(o.value);
        setOpen(false);
      },
      style: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        height: "var(--row-h-comfy)",
        padding: "0 8px 0 6px",
        font: `var(--weight-regular) var(--text-body)/1 var(--font-ui)`,
        color: hoverIdx === i ? "#241a02" : "var(--canvas-text)",
        background: hoverIdx === i ? "var(--accent-amber)" : "transparent",
        cursor: "pointer",
        userSelect: "none",
        whiteSpace: "nowrap"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: "10px",
        flex: "none"
      }
    }, sel ? "✓" : ""), o.label);
  })) : null);
}
Object.assign(__ds_scope, { Dropdown });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Dropdown.jsx", error: String((e && e.message) || e) }); }

// components/core/Knob.jsx
try { (() => {
/**
 * Knob — small circular dial. Thin track ring, accent-colored arc showing
 * current value, value printed as text directly below. Flat, no skeuomorphic
 * shading — one accent color. Drag vertically to change.
 */
function Knob({
  value = 0.5,
  onChange = () => {},
  min = 0,
  max = 1,
  size = 38,
  accent = "var(--accent-amber)",
  label = "",
  unit = "",
  precision = 0,
  display = null,
  disabled = false,
  style = {}
}) {
  const drag = React.useRef(null);
  const t = (value - min) / (max - min); // 0..1
  const clamp = v => Math.min(max, Math.max(min, v));

  // Arc geometry: gap at the bottom, sweep 270deg
  const START = 135,
    SWEEP = 270;
  const r = size / 2 - 3;
  const cx = size / 2,
    cy = size / 2;
  const polar = deg => {
    const a = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const arcPath = frac => {
    const a0 = START,
      a1 = START + SWEEP * frac;
    const [x0, y0] = polar(a0);
    const [x1, y1] = polar(a1);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  };
  // pointer indicator angle
  const [px, py] = polar(START + SWEEP * t);
  const onDown = e => {
    if (disabled) return;
    drag.current = {
      y: e.clientY,
      start: value
    };
    const move = ev => {
      const dy = drag.current.y - ev.clientY;
      onChange(clamp(drag.current.start + dy / 120 * (max - min)));
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };
  const text = display != null ? display : `${Number(value).toFixed(precision)}${unit}`;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "4px",
      opacity: disabled ? 0.4 : 1,
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--weight-regular) var(--text-micro)/1 var(--font-ui)`,
      color: "var(--module-text-dim)",
      letterSpacing: "var(--tracking-wide)"
    }
  }, label) : null, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
    onMouseDown: onDown,
    style: {
      cursor: disabled ? "default" : "ns-resize",
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: r + 2,
    fill: "var(--module-panel)",
    stroke: "rgba(0,0,0,0.4)",
    strokeWidth: "1"
  }), /*#__PURE__*/React.createElement("path", {
    d: arcPath(1),
    fill: "none",
    stroke: "rgba(255,255,255,0.12)",
    strokeWidth: "2.5",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("path", {
    d: arcPath(t),
    fill: "none",
    stroke: accent,
    strokeWidth: "2.5",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("line", {
    x1: cx,
    y1: cy,
    x2: px,
    y2: py,
    stroke: accent,
    strokeWidth: "1.5",
    strokeLinecap: "round"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--weight-medium) var(--text-label)/1 var(--font-mono)`,
      color: "var(--module-text)",
      fontFeatureSettings: '"tnum" 1'
    }
  }, text));
}
Object.assign(__ds_scope, { Knob });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Knob.jsx", error: String((e && e.message) || e) }); }

// components/core/ListRow.jsx
try { (() => {
/**
 * ListRow — dense horizontal row. Selected row = solid indigo fill (not just a
 * border). Optional leading color dot (user color-coding). Alternation is a
 * subtle background shift, never loud zebra striping.
 */
function ListRow({
  children,
  selected = false,
  color = null,
  alt = false,
  height = "var(--row-h)",
  onClick = null,
  right = null,
  tone = "canvas",
  style = {}
}) {
  const [hover, setHover] = React.useState(false);
  const onCanvas = tone === "canvas";
  let bg;
  if (selected) bg = "var(--accent-indigo)";else if (hover) bg = onCanvas ? "rgba(255,255,255,0.12)" : "var(--module-panel-hi)";else bg = alt ? onCanvas ? "var(--canvas-row-alt)" : "var(--module-panel)" : "transparent";
  const fg = selected ? "#eef0ff" : onCanvas ? "var(--canvas-text)" : "var(--module-text)";
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      height,
      padding: "0 8px",
      font: `var(--weight-regular) var(--text-label)/1 var(--font-ui)`,
      color: fg,
      background: bg,
      cursor: onClick ? "pointer" : "default",
      userSelect: "none",
      whiteSpace: "nowrap",
      ...style
    }
  }, color ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: "8px",
      height: "8px",
      flex: "none",
      borderRadius: "var(--radius-sm)",
      background: color,
      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.25)"
    }
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, children), right ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      opacity: selected ? 0.9 : 0.7
    }
  }, right) : null);
}
Object.assign(__ds_scope, { ListRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ListRow.jsx", error: String((e && e.message) || e) }); }

// components/core/Meter.jsx
try { (() => {
/**
 * Meter — thin vertical bar, gradient from a cool color (mint/cyan) at low
 * level through a warning color (amber) near peak, red at clip. No needle, no
 * skeuomorphic VU styling — pure flat gradient fill, clipped to the level.
 */
function Meter({
  level = 0.6,
  // 0..1
  peak = null,
  // 0..1 peak-hold marker
  width = 6,
  height = 90,
  style = {}
}) {
  const l = Math.max(0, Math.min(1, level));
  const grad = "linear-gradient(to top, var(--meter-low) 0%, var(--meter-mid) 55%, var(--meter-peak) 85%, var(--meter-clip) 100%)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: typeof width === "number" ? `${width}px` : width,
      height: typeof height === "number" ? `${height}px` : height,
      background: "var(--module-bg-alt)",
      border: "1px solid rgba(0,0,0,0.5)",
      borderRadius: "var(--radius-sm)",
      overflow: "hidden",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: `${l * 100}%`,
      background: grad
    }
  }), peak != null ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: `${Math.max(0, Math.min(1, peak)) * 100}%`,
      height: "1px",
      background: "var(--module-text)",
      opacity: 0.85
    }
  }) : null);
}
Object.assign(__ds_scope, { Meter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Meter.jsx", error: String((e && e.message) || e) }); }

// components/core/NumericField.jsx
try { (() => {
/**
 * NumericField — rectangular scrub field. Click-and-drag vertically to change
 * the value; click to type. Default = neutral gray. SELECTED/EDITING fills
 * solid cyan — the clearest "I am interacting with this" signal in the system.
 * Numerals are mono + tabular.
 */
function NumericField({
  value = 0,
  onChange = () => {},
  min = -Infinity,
  max = Infinity,
  step = 1,
  precision = 0,
  unit = "",
  sensitivity = 1,
  label = "",
  width = 56,
  disabled = false,
  style = {}
}) {
  const [editing, setEditing] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const drag = React.useRef(null);
  const clamp = v => Math.min(max, Math.max(min, v));
  const fmt = v => Number(v).toFixed(precision);
  const onDown = e => {
    if (disabled) return;
    setEditing(true);
    drag.current = {
      y: e.clientY,
      start: value
    };
    const move = ev => {
      const dy = drag.current.y - ev.clientY;
      onChange(clamp(drag.current.start + dy * step * sensitivity));
    };
    const up = () => {
      setEditing(false);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };
  const active = editing;
  const bg = active ? "var(--accent-cyan)" : hover ? "var(--canvas-panel-light)" : "var(--module-panel)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      flexDirection: "column",
      gap: "3px",
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--weight-regular) var(--text-micro)/1 var(--font-ui)`,
      color: "var(--module-text-dim)",
      letterSpacing: "var(--tracking-wide)"
    }
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    onMouseDown: onDown,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "baseline",
      justifyContent: "center",
      gap: "2px",
      width: typeof width === "number" ? `${width}px` : width,
      height: "var(--control-h-lg)",
      padding: "0 6px",
      background: bg,
      color: active ? "#06222a" : "var(--module-text)",
      border: "1px solid rgba(0,0,0,0.35)",
      borderRadius: "var(--radius-sm)",
      cursor: disabled ? "default" : "ns-resize",
      opacity: disabled ? 0.4 : 1,
      userSelect: "none",
      fontFeatureSettings: '"tnum" 1, "lnum" 1',
      transition: `background var(--dur-instant) var(--ease-ui)`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--weight-medium) var(--text-label)/1 var(--font-mono)`
    }
  }, fmt(value)), unit ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--weight-regular) var(--text-micro)/1 var(--font-mono)`,
      color: active ? "rgba(6,34,42,0.7)" : "var(--module-text-dim)"
    }
  }, unit) : null));
}
Object.assign(__ds_scope, { NumericField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/NumericField.jsx", error: String((e && e.message) || e) }); }

// components/core/PanelHeader.jsx
try { (() => {
/**
 * PanelHeader — the most repeated pattern in the UI:
 * [colored dot or chevron] + [title] + [collapse/expand control], flush against
 * the top edge of every panel, device and section. Zero exceptions.
 */
function PanelHeader({
  title,
  color = null,
  // user color-coding dot
  collapsed = false,
  onToggle = null,
  // if provided, shows a collapse chevron
  tone = "module",
  right = null,
  // optional trailing controls
  style = {}
}) {
  const onCanvas = tone === "canvas";
  const bg = onCanvas ? "var(--canvas-chrome)" : "var(--module-bg-alt)";
  const fg = onCanvas ? "#f0f0f0" : "var(--module-text)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      height: "var(--row-h)",
      padding: "0 6px",
      background: bg,
      color: fg,
      borderBottom: "1px solid var(--module-divider)",
      userSelect: "none",
      ...style
    }
  }, onToggle ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onToggle,
    "aria-label": collapsed ? "Expand" : "Collapse",
    style: {
      display: "inline-flex",
      padding: 0,
      border: "none",
      background: "none",
      cursor: "pointer",
      color: "currentColor"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "8",
    height: "8",
    viewBox: "0 0 8 8",
    style: {
      transform: collapsed ? "rotate(-90deg)" : "none",
      transition: "transform var(--dur-fast) var(--ease-ui)",
      opacity: 0.85
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 2.5 L4 5.5 L7 2.5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.2"
  }))) : null, color ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: "8px",
      height: "8px",
      borderRadius: "var(--radius-sm)",
      background: color,
      flex: "none",
      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.25)"
    }
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--weight-semi) var(--text-section)/1 var(--font-ui)`,
      letterSpacing: "var(--tracking-tight)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, title), right ? /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px"
    }
  }, right) : null);
}
Object.assign(__ds_scope, { PanelHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/PanelHeader.jsx", error: String((e && e.message) || e) }); }

// components/core/Panel.jsx
try { (() => {
/**
 * Panel — the structural surface container. Two tiers only:
 *  - tone="canvas": light-neutral organizing layer
 *  - tone="module": dark-neutral operating layer (devices, racks)
 * Square corners, 1px border, no drop shadow (depth is the tier, not elevation).
 * Optionally renders the universal PanelHeader at the top.
 */
function Panel({
  title = null,
  color = null,
  tone = "module",
  collapsible = false,
  defaultCollapsed = false,
  headerRight = null,
  padded = true,
  children,
  style = {}
}) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const onCanvas = tone === "canvas";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: onCanvas ? "var(--canvas-panel)" : "var(--module-bg)",
      color: onCanvas ? "var(--canvas-text)" : "var(--module-text)",
      border: `1px solid ${onCanvas ? "rgba(0,0,0,0.22)" : "var(--module-divider)"}`,
      borderRadius: "var(--radius-0)",
      overflow: "hidden",
      ...style
    }
  }, title != null ? /*#__PURE__*/React.createElement(__ds_scope.PanelHeader, {
    title: title,
    color: color,
    tone: tone,
    collapsed: collapsed,
    onToggle: collapsible ? () => setCollapsed(c => !c) : null,
    right: headerRight
  }) : null, !collapsed ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: padded ? "var(--space-5)" : 0
    }
  }, children) : null);
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Panel.jsx", error: String((e && e.message) || e) }); }

// components/core/Tabs.jsx
try { (() => {
/**
 * Tabs — pill/rounded-rect group. Active tab gets a light fill against the
 * darker tab bar; inactive tabs are flat text-only with no border. Seen in
 * device panels (A / B / Settings).
 */
function Tabs({
  tabs = [],
  value,
  onChange = () => {},
  tone = "module",
  style = {}
}) {
  const items = tabs.map(t => typeof t === "string" ? {
    value: t,
    label: t
  } : t);
  const onCanvas = tone === "canvas";
  const barBg = onCanvas ? "var(--canvas-chrome)" : "var(--module-bg-alt)";
  const activeBg = onCanvas ? "var(--canvas-panel-lighter)" : "var(--module-panel-hi)";
  const activeFg = onCanvas ? "var(--canvas-text)" : "var(--module-text)";
  const idleFg = onCanvas ? "rgba(255,255,255,0.7)" : "var(--module-text-dim)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      gap: "2px",
      padding: "2px",
      background: barBg,
      borderRadius: "var(--radius-pill)",
      ...style
    }
  }, items.map(t => {
    const active = t.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: t.value,
      type: "button",
      onClick: () => onChange(t.value),
      style: {
        height: "var(--control-h)",
        padding: "0 10px",
        font: `var(--weight-medium) var(--text-label)/1 var(--font-ui)`,
        color: active ? activeFg : idleFg,
        background: active ? activeBg : "transparent",
        border: "none",
        borderRadius: "var(--radius-pill)",
        cursor: "pointer",
        userSelect: "none",
        whiteSpace: "nowrap",
        transition: "background var(--dur-instant) var(--ease-ui)"
      }
    }, t.label);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/core/Toggle.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Toggle — flat rectangle state button, label-only (no separate indicator dot).
 * Off = neutral gray fill. On = solid amber fill. Only intermediate state is
 * hover (slight lighten). This is the canonical "this is on/off" control.
 */
function Toggle({
  on = false,
  onChange = () => {},
  size = "md",
  disabled = false,
  children,
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const heights = {
    sm: "var(--control-h)",
    md: "var(--control-h-lg)"
  };
  const bg = on ? hover ? "var(--accent-amber-hi)" : "var(--accent-amber)" : hover ? "var(--canvas-panel-light)" : "var(--canvas-panel)";
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    role: "switch",
    "aria-checked": on,
    disabled: disabled,
    onClick: () => !disabled && onChange(!on),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      height: heights[size],
      minWidth: "26px",
      padding: "0 8px",
      font: `var(--weight-medium) var(--text-label)/1 var(--font-ui)`,
      color: on ? "#241a02" : "var(--canvas-text)",
      background: bg,
      border: "1px solid rgba(0,0,0,0.22)",
      borderRadius: "var(--radius-sm)",
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.4 : 1,
      userSelect: "none",
      whiteSpace: "nowrap",
      transition: `background var(--dur-instant) var(--ease-ui)`,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Toggle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Toggle.jsx", error: String((e && e.message) || e) }); }

// components/data/NodeGraph.jsx
try { (() => {
/**
 * NodeGraph — a directed (DAG) routing / signal-flow view on the dark Module
 * layer. Nodes are flat boxes with a color-dot header + input/output ports;
 * edges are thin accent bezier curves from an output port to an input port.
 * Drag a node by its header to move it. One visual grammar for any "graph of
 * connected things" (audio routing, modulation matrix, Max-style patch).
 *
 * nodes: [{ id, title, x, y, color?, inputs?: string[], outputs?: string[] }]
 * edges: [{ from, fromPort?, to, toPort?, accent? }]
 */
const NODE_W = 150,
  HEAD_H = 22,
  PORT_H = 19;
function NodeGraph({
  nodes: initialNodes = [],
  edges = [],
  accent = "var(--accent-cyan)",
  width = "100%",
  height = 320,
  style = {}
}) {
  const [nodes, setNodes] = React.useState(initialNodes);
  const drag = React.useRef(null);
  const portY = (node, side, idx) => {
    const list = side === "in" ? node.inputs || [] : node.outputs || [];
    const n = Math.max(list.length, 1);
    return node.y + HEAD_H + idx * PORT_H + PORT_H / 2 + (list.length ? 4 : 0);
  };
  const nodeById = id => nodes.find(n => n.id === id);
  const onHeadDown = (e, id) => {
    e.preventDefault();
    const node = nodeById(id);
    drag.current = {
      id,
      dx: e.clientX - node.x,
      dy: e.clientY - node.y
    };
    const move = ev => {
      const d = drag.current;
      setNodes(ns => ns.map(n => n.id === d.id ? {
        ...n,
        x: ev.clientX - d.dx,
        y: ev.clientY - d.dy
      } : n));
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };
  const nodeHeight = node => HEAD_H + Math.max((node.inputs || []).length, (node.outputs || []).length, 1) * PORT_H + 6;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width,
      height,
      background: "var(--module-bg-alt)",
      backgroundImage: "linear-gradient(var(--module-grid) 1px, transparent 1px), linear-gradient(90deg, var(--module-grid) 1px, transparent 1px)",
      backgroundSize: "22px 22px",
      border: "1px solid var(--module-divider)",
      overflow: "hidden",
      ...style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none"
    }
  }, edges.map((e, i) => {
    const a = nodeById(e.from),
      b = nodeById(e.to);
    if (!a || !b) return null;
    const x1 = a.x + NODE_W,
      y1 = portY(a, "out", e.fromPort || 0);
    const x2 = b.x,
      y2 = portY(b, "in", e.toPort || 0);
    const mx = (x1 + x2) / 2;
    return /*#__PURE__*/React.createElement("g", {
      key: i
    }, /*#__PURE__*/React.createElement("path", {
      d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`,
      fill: "none",
      stroke: e.accent || accent,
      strokeWidth: "1.5",
      opacity: "0.9"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: x1,
      cy: y1,
      r: "2.5",
      fill: e.accent || accent
    }), /*#__PURE__*/React.createElement("circle", {
      cx: x2,
      cy: y2,
      r: "2.5",
      fill: e.accent || accent
    }));
  })), nodes.map(node => /*#__PURE__*/React.createElement("div", {
    key: node.id,
    style: {
      position: "absolute",
      left: node.x,
      top: node.y,
      width: NODE_W,
      background: "var(--module-bg)",
      border: "1px solid var(--module-divider)",
      borderRadius: "var(--radius-sm)",
      boxShadow: "var(--shadow-popover)",
      userSelect: "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onMouseDown: e => onHeadDown(e, node.id),
    style: {
      height: HEAD_H,
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "0 8px",
      background: "var(--module-panel)",
      borderBottom: "1px solid var(--module-divider)",
      cursor: "grab",
      borderTopLeftRadius: "var(--radius-sm)",
      borderTopRightRadius: "var(--radius-sm)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: "7px",
      height: "7px",
      borderRadius: "2px",
      background: node.color || accent,
      flex: "none",
      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.3)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--weight-semi) var(--text-label)/1 var(--font-ui)",
      color: "var(--module-text)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, node.title)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      padding: "4px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column"
    }
  }, (node.inputs || []).map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      height: PORT_H,
      display: "flex",
      alignItems: "center",
      gap: "5px",
      paddingLeft: "5px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      background: "var(--module-text-dim)",
      flex: "none",
      marginLeft: "-3px",
      boxShadow: "0 0 0 2px var(--module-bg)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--weight-regular) var(--text-micro)/1 var(--font-ui)",
      color: "var(--module-text-dim)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, p)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end"
    }
  }, (node.outputs || []).map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      height: PORT_H,
      display: "flex",
      alignItems: "center",
      gap: "5px",
      paddingRight: "5px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--weight-regular) var(--text-micro)/1 var(--font-ui)",
      color: "var(--module-text-dim)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, p), /*#__PURE__*/React.createElement("span", {
    style: {
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      background: node.color || accent,
      flex: "none",
      marginRight: "-3px",
      boxShadow: "0 0 0 2px var(--module-bg)"
    }
  }))))))));
}
Object.assign(__ds_scope, { NodeGraph });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/NodeGraph.jsx", error: String((e && e.message) || e) }); }

// components/data/Table.jsx
try { (() => {
/**
 * Table — dense data grid. Strict row grid, 1px dividers, subtle alternation
 * (not loud zebra). Selected row = solid indigo. Header is a flat chrome strip.
 * Columns: { key, label, align?, width?, mono?, render?(value,row) }.
 * Inline controls (checkboxes, dropdowns) belong in a column `render`.
 */
function Table({
  columns = [],
  rows = [],
  rowKey = "id",
  selectedKey = null,
  onSelect = null,
  tone = "canvas",
  rowHeight = "var(--row-h)",
  style = {}
}) {
  const onCanvas = tone === "canvas";
  const [hoverKey, setHoverKey] = React.useState(null);
  const headBg = onCanvas ? "var(--canvas-chrome)" : "var(--module-bg-alt)";
  const headFg = onCanvas ? "#f0f0f0" : "var(--module-text)";
  const bodyFg = onCanvas ? "var(--canvas-text)" : "var(--module-text)";
  const grid = columns.map(c => c.width ? typeof c.width === "number" ? `${c.width}px` : c.width : "1fr").join(" ");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      border: `1px solid ${onCanvas ? "rgba(0,0,0,0.25)" : "var(--module-divider)"}`,
      background: onCanvas ? "var(--canvas-panel)" : "var(--module-bg)",
      overflow: "hidden",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: grid,
      background: headBg,
      color: headFg
    }
  }, columns.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.key,
    style: {
      height: "var(--row-h)",
      padding: "0 8px",
      display: "flex",
      alignItems: "center",
      justifyContent: c.align === "right" ? "flex-end" : c.align === "center" ? "center" : "flex-start",
      font: "var(--weight-semi) var(--text-micro)/1 var(--font-ui)",
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      borderRight: "1px solid rgba(0,0,0,0.18)"
    }
  }, c.label))), rows.map((row, ri) => {
    const key = row[rowKey];
    const selected = selectedKey != null && key === selectedKey;
    const hovered = hoverKey === key;
    let bg = "transparent";
    if (selected) bg = "var(--accent-indigo)";else if (hovered && onSelect) bg = onCanvas ? "rgba(255,255,255,0.1)" : "var(--module-panel-hi)";else if (ri % 2 === 1) bg = onCanvas ? "var(--canvas-row-alt)" : "var(--module-panel)";
    const fg = selected ? "#eef0ff" : bodyFg;
    return /*#__PURE__*/React.createElement("div", {
      key: key,
      onClick: () => onSelect && onSelect(key, row),
      onMouseEnter: () => setHoverKey(key),
      onMouseLeave: () => setHoverKey(null),
      style: {
        display: "grid",
        gridTemplateColumns: grid,
        background: bg,
        color: fg,
        cursor: onSelect ? "pointer" : "default",
        borderTop: "1px solid rgba(0,0,0,0.1)"
      }
    }, columns.map(c => /*#__PURE__*/React.createElement("div", {
      key: c.key,
      style: {
        height: rowHeight,
        padding: "0 8px",
        display: "flex",
        alignItems: "center",
        justifyContent: c.align === "right" ? "flex-end" : c.align === "center" ? "center" : "flex-start",
        gap: "6px",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        font: `var(--weight-regular) var(--text-label)/1 ${c.mono ? "var(--font-mono)" : "var(--font-ui)"}`,
        fontFeatureSettings: c.mono ? '"tnum" 1' : "normal",
        borderRight: "1px solid rgba(0,0,0,0.08)"
      }
    }, c.render ? c.render(row[c.key], row) : row[c.key])));
  }));
}
Object.assign(__ds_scope, { Table });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Table.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
/**
 * Checkbox — small square. Checked = amber fill with a dark check (matches the
 * MIDI port table in Preferences). Unchecked = empty neutral square. Flat, no
 * rounded corners.
 */
function Checkbox({
  checked = false,
  onChange = () => {},
  label = null,
  tone = "canvas",
  disabled = false,
  style = {}
}) {
  const onCanvas = tone === "canvas";
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.4 : 1,
      userSelect: "none",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: () => !disabled && onChange(!checked),
    style: {
      width: "13px",
      height: "13px",
      flex: "none",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: checked ? "var(--accent-amber)" : onCanvas ? "var(--canvas-panel-lighter)" : "var(--module-panel)",
      border: `1px solid ${checked ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.35)"}`,
      borderRadius: "var(--radius-sm)"
    }
  }, checked ? /*#__PURE__*/React.createElement("svg", {
    width: "9",
    height: "9",
    viewBox: "0 0 9 9"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1.5 4.5 L3.5 6.5 L7.5 2",
    fill: "none",
    stroke: "#241a02",
    strokeWidth: "1.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })) : null), label != null ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--weight-regular) var(--text-label)/1 var(--font-ui)",
      color: onCanvas ? "var(--canvas-text)" : "var(--module-text)"
    }
  }, label) : null);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/RadioGroup.jsx
try { (() => {
/**
 * RadioGroup — Live expresses single-choice as a set of flat buttons (not dot
 * radios); the selected option gets a solid amber fill, the rest stay neutral.
 * Square-ish (2px). Horizontal or vertical.
 */
function RadioGroup({
  options = [],
  value,
  onChange = () => {},
  orientation = "horizontal",
  tone = "canvas",
  disabled = false,
  style = {}
}) {
  const items = options.map(o => typeof o === "string" ? {
    value: o,
    label: o
  } : o);
  const onCanvas = tone === "canvas";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      flexDirection: orientation === "vertical" ? "column" : "row",
      gap: "2px",
      opacity: disabled ? 0.4 : 1,
      ...style
    }
  }, items.map(o => {
    const active = o.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: o.value,
      type: "button",
      onClick: () => !disabled && onChange(o.value),
      style: {
        height: "var(--control-h-lg)",
        padding: "0 12px",
        font: "var(--weight-medium) var(--text-label)/1 var(--font-ui)",
        color: active ? "#241a02" : onCanvas ? "var(--canvas-text)" : "var(--module-text)",
        background: active ? "var(--accent-amber)" : onCanvas ? "var(--canvas-panel)" : "var(--module-panel)",
        border: "1px solid rgba(0,0,0,0.28)",
        borderRadius: "var(--radius-sm)",
        cursor: disabled ? "default" : "pointer",
        userSelect: "none",
        whiteSpace: "nowrap",
        transition: "background var(--dur-instant) var(--ease-ui)"
      }
    }, o.label);
  }));
}
Object.assign(__ds_scope, { RadioGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/RadioGroup.jsx", error: String((e && e.message) || e) }); }

// components/forms/Slider.jsx
try { (() => {
/**
 * Slider / Fader — flat track with an accent-filled portion and a thin handle.
 * Drag to change. `orientation="vertical"` gives a mixer fader. No skeuomorphic
 * cap — just a flat handle. Lives on either tier.
 */
function Slider({
  value = 0.5,
  onChange = () => {},
  min = 0,
  max = 1,
  orientation = "horizontal",
  accent = "var(--accent-cyan)",
  length = 160,
  tone = "module",
  disabled = false,
  style = {}
}) {
  const ref = React.useRef(null);
  const vertical = orientation === "vertical";
  const t = (value - min) / (max - min);
  const onCanvas = tone === "canvas";
  const setFromEvent = (clientX, clientY) => {
    const r = ref.current.getBoundingClientRect();
    let frac = vertical ? 1 - (clientY - r.top) / r.height : (clientX - r.left) / r.width;
    frac = Math.max(0, Math.min(1, frac));
    onChange(min + frac * (max - min));
  };
  const onDown = e => {
    if (disabled) return;
    setFromEvent(e.clientX, e.clientY);
    const move = ev => setFromEvent(ev.clientX, ev.clientY);
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };
  const trackBg = onCanvas ? "var(--canvas-chrome)" : "var(--module-bg-alt)";
  const thick = 4;
  const handle = 10;
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    onMouseDown: onDown,
    style: {
      position: "relative",
      width: vertical ? `${handle + 6}px` : `${length}px`,
      height: vertical ? `${length}px` : `${handle + 6}px`,
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.4 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      ...(vertical ? {
        left: "50%",
        top: 0,
        transform: "translateX(-50%)",
        width: `${thick}px`,
        height: "100%"
      } : {
        top: "50%",
        left: 0,
        transform: "translateY(-50%)",
        height: `${thick}px`,
        width: "100%"
      }),
      background: trackBg,
      border: "1px solid rgba(0,0,0,0.4)",
      borderRadius: "var(--radius-sm)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      ...(vertical ? {
        left: "50%",
        bottom: 0,
        transform: "translateX(-50%)",
        width: `${thick}px`,
        height: `${t * 100}%`
      } : {
        top: "50%",
        left: 0,
        transform: "translateY(-50%)",
        height: `${thick}px`,
        width: `${t * 100}%`
      }),
      background: accent,
      borderRadius: "var(--radius-sm)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      ...(vertical ? {
        left: "50%",
        bottom: `calc(${t * 100}% - ${handle / 2}px)`,
        transform: "translateX(-50%)"
      } : {
        top: "50%",
        left: `calc(${t * 100}% - ${handle / 2}px)`,
        transform: "translateY(-50%)"
      }),
      width: `${handle}px`,
      height: `${handle}px`,
      background: onCanvas ? "var(--canvas-panel-lighter)" : "var(--module-text)",
      border: "1px solid rgba(0,0,0,0.5)",
      borderRadius: "var(--radius-sm)"
    }
  }));
}
Object.assign(__ds_scope, { Slider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Slider.jsx", error: String((e && e.message) || e) }); }

// components/forms/TextInput.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * TextInput — flat single-line field. Default neutral gray; FOCUS fills cyan
 * (the system's "I am editing this" signal) with a cyan border. Square corners.
 */
function TextInput({
  value = "",
  onChange = () => {},
  placeholder = "",
  tone = "canvas",
  width = 180,
  disabled = false,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const onCanvas = tone === "canvas";
  const base = onCanvas ? "var(--canvas-panel-lighter)" : "var(--module-panel)";
  const fg = onCanvas ? "var(--canvas-text)" : "var(--module-text)";
  return /*#__PURE__*/React.createElement("input", _extends({
    type: "text",
    value: value,
    placeholder: placeholder,
    disabled: disabled,
    onChange: e => onChange(e.target.value),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: typeof width === "number" ? `${width}px` : width,
      height: "var(--control-h-lg)",
      padding: "0 7px",
      boxSizing: "border-box",
      font: "var(--weight-regular) var(--text-label)/1 var(--font-ui)",
      color: focus ? "#06222a" : fg,
      background: focus ? "var(--accent-cyan)" : base,
      border: `1px solid ${focus ? "var(--accent-cyan-hi)" : "rgba(0,0,0,0.3)"}`,
      borderRadius: "var(--radius-sm)",
      outline: "none",
      opacity: disabled ? 0.4 : 1,
      transition: "background var(--dur-instant) var(--ease-ui)",
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { TextInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TextInput.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Textarea — flat multi-line field. Same language as TextInput: neutral gray
 * at rest, cyan border on focus (kept readable so multi-line text stays legible
 * — the fill stays light rather than going solid cyan). Square corners.
 * Used for "Edit Info Text", clip notes, comments.
 */
function Textarea({
  value = "",
  onChange = () => {},
  placeholder = "",
  tone = "canvas",
  rows = 4,
  width = 240,
  disabled = false,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const onCanvas = tone === "canvas";
  const base = onCanvas ? "var(--canvas-panel-lighter)" : "var(--module-panel)";
  const fg = onCanvas ? "var(--canvas-text)" : "var(--module-text)";
  return /*#__PURE__*/React.createElement("textarea", _extends({
    value: value,
    rows: rows,
    placeholder: placeholder,
    disabled: disabled,
    onChange: e => onChange(e.target.value),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: typeof width === "number" ? `${width}px` : width,
      padding: "6px 7px",
      boxSizing: "border-box",
      resize: "vertical",
      font: "var(--weight-regular) var(--text-body)/1.45 var(--font-ui)",
      color: fg,
      background: base,
      border: `1px solid ${focus ? "var(--accent-cyan)" : "rgba(0,0,0,0.3)"}`,
      boxShadow: focus ? "inset 0 0 0 1px var(--accent-cyan)" : "none",
      borderRadius: "var(--radius-sm)",
      outline: "none",
      opacity: disabled ? 0.4 : 1,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// ui_kits/live-session/Browser.jsx
try { (() => {
/* global React */
// Live Session View — left Browser (canvas layer): category rail + results list.
const {
  ListRow
} = window.AbletonLiveDesignSystem_c3707c;
const COLLECTIONS = [{
  name: "Favorites",
  color: "#e4c84a"
}, {
  name: "Drums & Synths",
  color: "#5bbf72"
}, {
  name: "Mixing",
  color: "#5b8fd8"
}];
const LIBRARY = ["All", "Sounds", "Drums", "Instruments", "Audio Effects", "MIDI Effects", "Modulators", "Max for Live", "Plug-Ins", "Clips", "Samples"];
const RESULTS = {
  All: ["Kick Mkit Synth 9.aif", "Tom Low DMX Tonic.wav", "BD 2600 05.wav", "BD 2600 15.wav", "BD 909 Tube Long F 06.wav", "Kicky Tom.adv", "Kick 909 2.wav", "BD Deep Dr Sample 02.wav", "Kick 909 Tune11.wav", "BD 909 Clean 02.wav"],
  Sounds: ["Basic Organ Bass.adg", "Detuned Lowpass Bass.adv", "Dynamic Harmonics Bass.adv", "Electric Bass Soft.adg", "Hammer Bass.adg", "Hybrid Bass.adg", "MPE Subtle Wobble Bass.adg"],
  Instruments: ["Operator", "Wavetable", "Analog", "Collision", "Electric", "Meld", "Sampler", "Drift"],
  "Audio Effects": ["EQ Eight", "Reverb", "Delay", "Compressor", "Saturator", "Roar", "Auto Filter", "Limiter"]
};
function RailHeader({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--weight-semi) 9px/1 var(--font-ui)",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "var(--canvas-text-dim)",
      padding: "8px 8px 4px"
    }
  }, children);
}
function Browser({
  picked,
  onPick
}) {
  const [cat, setCat] = React.useState("All");
  const items = RESULTS[cat] || RESULTS.All;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: "300px",
      flex: "none",
      display: "flex",
      background: "var(--canvas-panel)",
      borderRight: "1px solid var(--canvas-divider)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "124px",
      flex: "none",
      display: "flex",
      flexDirection: "column",
      borderRight: "1px solid var(--canvas-divider)",
      overflow: "auto"
    }
  }, /*#__PURE__*/React.createElement(RailHeader, null, "Collections"), COLLECTIONS.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.name,
    style: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      height: "19px",
      padding: "0 8px",
      font: "var(--weight-regular) 11px/1 var(--font-ui)",
      color: "var(--canvas-text)",
      cursor: "pointer",
      userSelect: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: "8px",
      height: "8px",
      borderRadius: "2px",
      background: c.color,
      flex: "none",
      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, c.name))), /*#__PURE__*/React.createElement(RailHeader, null, "Library"), LIBRARY.map(l => {
    const active = cat === l;
    return /*#__PURE__*/React.createElement("div", {
      key: l,
      onClick: () => setCat(l),
      style: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        height: "19px",
        padding: "0 8px",
        font: "var(--weight-regular) 11px/1 var(--font-ui)",
        color: active ? "#eef0ff" : "var(--canvas-text)",
        background: active ? "var(--accent-indigo)" : "transparent",
        cursor: "pointer",
        userSelect: "none"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: "11px",
        flex: "none",
        opacity: 0.6
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "9",
      height: "9",
      viewBox: "0 0 9 9"
    }, /*#__PURE__*/React.createElement("rect", {
      x: "0.5",
      y: "1.5",
      width: "8",
      height: "6",
      rx: "0.5",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "0.9"
    }))), /*#__PURE__*/React.createElement("span", {
      style: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, l));
  }), /*#__PURE__*/React.createElement(RailHeader, null, "Places"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      height: "19px",
      padding: "0 8px",
      font: "var(--weight-regular) 11px/1 var(--font-ui)",
      color: "var(--canvas-text)"
    }
  }, "Packs")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      height: "26px",
      padding: "0 8px",
      borderBottom: "1px solid var(--canvas-divider)",
      background: "var(--canvas-panel-light)"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "11",
    viewBox: "0 0 11 11",
    style: {
      opacity: 0.5
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "4.5",
    cy: "4.5",
    r: "3.2",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.1"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6.8",
    y1: "6.8",
    x2: "9.5",
    y2: "9.5",
    stroke: "currentColor",
    strokeWidth: "1.1"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--weight-regular) 11px/1 var(--font-ui)",
      color: "var(--canvas-text-dim)"
    }
  }, "Search (Cmd + F)")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      height: "20px",
      padding: "0 8px",
      borderBottom: "1px solid rgba(0,0,0,0.12)",
      background: "var(--canvas-panel-light)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--weight-semi) 10px/1 var(--font-ui)",
      color: "var(--canvas-text)"
    }
  }, "Name"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      font: "var(--weight-regular) 9px/1 var(--font-mono)",
      color: "var(--canvas-text-dim)"
    }
  }, items.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      overflow: "auto",
      flex: 1
    }
  }, items.map((it, i) => /*#__PURE__*/React.createElement(ListRow, {
    key: it,
    tone: "canvas",
    alt: i % 2 === 1,
    selected: picked === it,
    onClick: () => onPick(it),
    height: "19px"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "10",
    height: "10",
    viewBox: "0 0 10 10",
    style: {
      opacity: 0.55,
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 1.5h4l2 2v5h-6z",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "0.9"
  })), it))))));
}
window.Browser = Browser;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/live-session/Browser.jsx", error: String((e && e.message) || e) }); }

// ui_kits/live-session/DeviceChain.jsx
try { (() => {
/* global React */
// Live Session View — bottom device chain (dark Module layer).
// Devices sit side-by-side: a title strip + knobs/tabs/curve content.
const {
  Knob,
  Tabs,
  Meter,
  Dropdown
} = window.AbletonLiveDesignSystem_c3707c;
function Power({
  on,
  onClick,
  color
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    title: "Device on/off",
    style: {
      width: "12px",
      height: "12px",
      borderRadius: "50%",
      flex: "none",
      border: "1.5px solid " + (on ? color : "rgba(255,255,255,0.3)"),
      background: on ? color : "transparent",
      cursor: "pointer",
      padding: 0
    }
  });
}
function Device({
  title,
  color,
  children,
  on,
  setOn,
  width
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      flex: "none",
      display: "flex",
      flexDirection: "column",
      background: "var(--module-bg)",
      borderRight: "1px solid var(--module-divider)",
      opacity: on ? 1 : 0.55
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "7px",
      height: "21px",
      padding: "0 8px",
      background: "var(--module-bg-alt)",
      borderBottom: "1px solid var(--module-divider)"
    }
  }, /*#__PURE__*/React.createElement(Power, {
    on: on,
    onClick: () => setOn(!on),
    color: color
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--weight-semi) 12px/1 var(--font-ui)",
      color: "var(--module-text)"
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: "8px",
      color: "var(--module-text-dim)"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "11",
    viewBox: "0 0 11 11"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 2h7v7h-7z M2 2l3.5 3.5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--font-mono)",
      fontSize: "11px"
    }
  }, "\xB7\xB7\xB7"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: "10px 12px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      overflow: "hidden"
    }
  }, children));
}
function Curve({
  accent = "var(--accent-cyan)",
  d = "M2 46 L14 40 L26 8 L70 10 L138 44"
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--module-bg-alt)",
      border: "1px solid var(--module-divider)",
      borderRadius: "2px",
      height: "56px",
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    height: "56",
    viewBox: "0 0 142 56",
    preserveAspectRatio: "none",
    style: {
      position: "absolute",
      inset: 0
    }
  }, [14, 28, 42, 56, 70, 84, 98, 112, 126].map(x => /*#__PURE__*/React.createElement("line", {
    key: x,
    x1: x,
    y1: "0",
    x2: x,
    y2: "56",
    stroke: "var(--module-grid)",
    strokeWidth: "1"
  })), [14, 28, 42].map(y => /*#__PURE__*/React.createElement("line", {
    key: y,
    x1: "0",
    y1: y,
    x2: "142",
    y2: y,
    stroke: "var(--module-grid)",
    strokeWidth: "1"
  })), /*#__PURE__*/React.createElement("path", {
    d: d,
    fill: "none",
    stroke: accent,
    strokeWidth: "1.5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "26",
    cy: "8",
    r: "2.4",
    fill: accent
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "70",
    cy: "10",
    r: "2.4",
    fill: accent
  })));
}
function DeviceChain({
  trackName,
  trackColor
}) {
  const [tab, setTab] = React.useState("A");
  const [meldOn, setMeldOn] = React.useState(true);
  const [roarOn, setRoarOn] = React.useState(true);
  const [compOn, setCompOn] = React.useState(true);
  const [k, setK] = React.useState({
    tone: 0.62,
    rate: 0.3,
    shape: 0.5,
    inv: 0.7,
    drive: 0.4,
    amt: 0.57,
    bias: 0.5,
    freq: 0.8
  });
  const set = key => v => setK(s => ({
    ...s,
    [key]: v
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: "230px",
      flex: "none",
      display: "flex",
      background: "var(--module-bg-alt)",
      borderTop: "1px solid var(--module-divider)",
      overflowX: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "26px",
      flex: "none",
      background: "var(--module-bg-alt)",
      borderRight: "1px solid var(--module-divider)",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      padding: "8px 0"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      writingMode: "vertical-rl",
      transform: "rotate(180deg)",
      font: "var(--weight-medium) 11px/1 var(--font-ui)",
      color: "var(--module-text-dim)"
    }
  }, trackName)), /*#__PURE__*/React.createElement(Device, {
    title: "Meld",
    color: trackColor,
    on: meldOn,
    setOn: setMeldOn,
    width: 300
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "8px",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    tabs: ["A", "B", "Settings"],
    value: tab,
    onChange: setTab
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "8px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Curve, {
    accent: "var(--accent-cyan)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "14px",
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement(Knob, {
    value: k.tone,
    onChange: set("tone"),
    label: "Tone",
    display: (k.tone * 100).toFixed(1),
    accent: "var(--accent-cyan)"
  }), /*#__PURE__*/React.createElement(Knob, {
    value: k.rate,
    onChange: set("rate"),
    label: "Rate",
    display: (k.rate * 100).toFixed(1),
    accent: "var(--accent-amber)"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "14px"
    }
  }, /*#__PURE__*/React.createElement(Knob, {
    value: k.shape,
    onChange: set("shape"),
    label: "Shape",
    display: (k.shape * 200 - 100).toFixed(0),
    accent: "var(--accent-cyan)"
  }), /*#__PURE__*/React.createElement(Knob, {
    value: k.inv,
    onChange: set("inv"),
    label: "Inversion",
    display: (k.inv * 100).toFixed(0),
    accent: "var(--accent-amber)"
  }))), /*#__PURE__*/React.createElement(Device, {
    title: "Roar",
    color: "var(--accent-amber)",
    on: roarOn,
    setOn: setRoarOn,
    width: 300
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "14px",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Knob, {
    value: k.drive,
    onChange: set("drive"),
    label: "Drive",
    unit: " dB",
    display: (k.drive * 24).toFixed(1),
    accent: "var(--accent-amber)"
  }), /*#__PURE__*/React.createElement(Knob, {
    value: k.amt,
    onChange: set("amt"),
    label: "Amount",
    unit: "%",
    display: (k.amt * 100).toFixed(0),
    accent: "var(--accent-cyan)"
  }), /*#__PURE__*/React.createElement(Knob, {
    value: k.bias,
    onChange: set("bias"),
    label: "Bias",
    display: (k.bias * 2 - 1).toFixed(2),
    accent: "var(--accent-amber)"
  }), /*#__PURE__*/React.createElement(Knob, {
    value: k.freq,
    onChange: set("freq"),
    label: "Freq",
    display: (k.freq * 20).toFixed(1) + "k",
    accent: "var(--accent-cyan)"
  })), /*#__PURE__*/React.createElement(Curve, {
    accent: "var(--accent-amber)",
    d: "M2 50 L40 48 L60 20 L80 30 L100 6 L140 8"
  })), /*#__PURE__*/React.createElement(Device, {
    title: "Compressor",
    color: "var(--accent-cyan)",
    on: compOn,
    setOn: setCompOn,
    width: 220
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "14px",
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement(Knob, {
    value: 0.5,
    onChange: () => {},
    label: "Threshold",
    unit: " dB",
    display: "-11.2",
    accent: "var(--accent-cyan)"
  }), /*#__PURE__*/React.createElement(Knob, {
    value: 0.34,
    onChange: () => {},
    label: "Ratio",
    display: "2.0:1",
    accent: "var(--accent-amber)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "5px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "3px"
    }
  }, /*#__PURE__*/React.createElement(Meter, {
    level: 0.7,
    peak: 0.85,
    height: 64
  }), /*#__PURE__*/React.createElement(Meter, {
    level: 0.62,
    peak: 0.8,
    height: 64
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--weight-regular) 9px/1 var(--font-ui)",
      color: "var(--module-text-dim)"
    }
  }, "GR")))));
}
window.DeviceChain = DeviceChain;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/live-session/DeviceChain.jsx", error: String((e && e.message) || e) }); }

// ui_kits/live-session/SessionGrid.jsx
try { (() => {
/* global React */
// Live Session View — the clip matrix (tracks = columns, scenes = rows).
// Click a clip to launch it (exclusive per track). Click a scene number to
// launch the whole row. Playing clip shows a green triangle.

const TRACKS = [{
  name: "Drums",
  color: "var(--user-periwinkle)"
}, {
  name: "Breaks",
  color: "var(--user-cyan)"
}, {
  name: "Percussion",
  color: "var(--user-mauve)"
}, {
  name: "Bass",
  color: "var(--user-teal)"
}, {
  name: "Bass Drop",
  color: "var(--user-mint)"
}, {
  name: "Synth Riser",
  color: "var(--user-lavender)"
}, {
  name: "Keys",
  color: "var(--user-yellow)"
}, {
  name: "Pads",
  color: "var(--user-tan)"
}, {
  name: "Ambience",
  color: "var(--user-salmon)"
}];

// clip presence per [scene][track]; null = empty slot
const CLIPS = [[1, 1, 0, 1, 0, 1, 1, 0, 1], [1, 1, 0, 0, 0, 0, 1, 0, 1], [1, 1, 1, 1, 1, 0, 1, 1, 1], [1, 1, 0, 1, 1, 1, 1, 0, 1], [1, 1, 0, 1, 0, 0, 0, 1, 1], [1, 0, 0, 1, 0, 1, 1, 0, 1], [0, 1, 0, 1, 0, 0, 1, 0, 0], [1, 1, 1, 0, 0, 0, 0, 1, 1]];
const SCENES = ["Intro", "Verse", "Build", "Drop", "Break", "Verse 2", "Build 2", "Outro"];
const COL_W = 96,
  ROW_H = 26,
  HEAD_H = 22;
function Triangle({
  color
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: "9",
    height: "9",
    viewBox: "0 0 9 9",
    style: {
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1.5 1 L8 4.5 L1.5 8 Z",
    fill: color
  }));
}
function Square({
  color
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: "8",
    height: "8",
    viewBox: "0 0 8 8",
    style: {
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0.5",
    y: "0.5",
    width: "7",
    height: "7",
    fill: color
  }));
}
function ClipCell({
  has,
  color,
  name,
  playing,
  queued,
  onClick
}) {
  const [h, setH] = React.useState(false);
  if (!has) {
    return /*#__PURE__*/React.createElement("div", {
      onClick: onClick,
      onMouseEnter: () => setH(true),
      onMouseLeave: () => setH(false),
      style: {
        height: ROW_H,
        borderRight: "1px solid rgba(0,0,0,0.18)",
        borderBottom: "1px solid rgba(0,0,0,0.18)",
        background: h ? "rgba(255,255,255,0.08)" : "transparent",
        display: "flex",
        alignItems: "center",
        paddingLeft: "7px",
        cursor: "default"
      }
    }, h ? /*#__PURE__*/React.createElement(Square, {
      color: "rgba(0,0,0,0.4)"
    }) : null);
  }
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      height: ROW_H,
      borderRight: "1px solid rgba(0,0,0,0.18)",
      borderBottom: "1px solid rgba(0,0,0,0.18)",
      background: color,
      position: "relative",
      cursor: "pointer",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      gap: "5px",
      padding: "0 6px",
      boxShadow: playing ? "inset 0 0 0 1.5px rgba(255,255,255,0.85)" : h ? "inset 0 0 0 1px rgba(255,255,255,0.5)" : "none",
      filter: h && !playing ? "brightness(1.06)" : "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: "15px",
      height: "15px",
      flex: "none",
      borderRadius: "2px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: playing ? "var(--accent-green)" : "rgba(0,0,0,0.16)"
    }
  }, playing ? /*#__PURE__*/React.createElement(Square, {
    color: "#0c2e0c"
  }) : /*#__PURE__*/React.createElement(Triangle, {
    color: "rgba(0,0,0,0.55)"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--weight-regular) 11px/1 var(--font-ui)",
      color: "rgba(20,20,20,0.85)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, name), queued ? /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      width: "5px",
      height: "5px",
      borderRadius: "50%",
      background: "rgba(0,0,0,0.5)"
    }
  }) : null);
}
function SessionGrid({
  selectedTrack,
  onSelectTrack,
  playing
}) {
  // playingClip[trackIdx] = sceneIdx | -1
  const [playingClip, setPlayingClip] = React.useState(() => TRACKS.map((_, i) => i < 4 ? 3 : -1));
  const launch = (scene, track) => {
    setPlayingClip(p => p.map((v, i) => i === track ? v === scene ? -1 : scene : v));
    onSelectTrack(track);
  };
  const launchScene = scene => {
    setPlayingClip(p => p.map((v, i) => CLIPS[scene][i] ? scene : v));
  };
  const stopAll = () => setPlayingClip(TRACKS.map(() => -1));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "var(--canvas-bg)",
      overflow: "auto",
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      position: "sticky",
      top: 0,
      zIndex: 2
    }
  }, TRACKS.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: t.name,
    onClick: () => onSelectTrack(i),
    style: {
      width: COL_W,
      flex: "none",
      height: HEAD_H,
      padding: "0 7px",
      display: "flex",
      alignItems: "center",
      gap: "5px",
      cursor: "pointer",
      background: selectedTrack === i ? "var(--canvas-panel-lighter)" : "var(--canvas-panel)",
      borderRight: "1px solid var(--canvas-divider)",
      borderBottom: "1px solid var(--canvas-divider)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: "7px",
      height: "7px",
      borderRadius: "2px",
      background: t.color,
      flex: "none",
      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.2)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--weight-medium) 11px/1 var(--font-ui)",
      color: "var(--canvas-text)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, t.name), /*#__PURE__*/React.createElement("svg", {
    width: "7",
    height: "7",
    viewBox: "0 0 8 8",
    style: {
      marginLeft: "auto",
      opacity: 0.5
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 2.5 L4 5.5 L7 2.5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.2"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: COL_W,
      flex: "none",
      height: HEAD_H,
      padding: "0 7px",
      display: "flex",
      alignItems: "center",
      background: "var(--canvas-chrome)",
      color: "#f0f0f0",
      borderBottom: "1px solid var(--canvas-divider)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--weight-semi) 11px/1 var(--font-ui)"
    }
  }, "Main"))), SCENES.map((sceneName, s) => /*#__PURE__*/React.createElement("div", {
    key: s,
    style: {
      display: "flex"
    }
  }, TRACKS.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: COL_W,
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement(ClipCell, {
    has: !!CLIPS[s][i],
    color: t.color,
    name: CLIPS[s][i] ? sceneName : "",
    playing: playing && playingClip[i] === s,
    onClick: () => CLIPS[s][i] && launch(s, i)
  }))), /*#__PURE__*/React.createElement("div", {
    onClick: () => launchScene(s),
    style: {
      width: COL_W,
      flex: "none",
      height: ROW_H,
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "0 8px",
      background: "var(--canvas-chrome)",
      color: "#e8e8e8",
      cursor: "pointer",
      borderBottom: "1px solid var(--canvas-chrome-dark)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: "14px",
      height: "14px",
      borderRadius: "2px",
      background: "rgba(255,255,255,0.12)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Triangle, {
    color: "#dcdcdc"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--weight-regular) 11px/1 var(--font-ui)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, sceneName), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      font: "var(--weight-regular) 10px/1 var(--font-mono)",
      opacity: 0.6
    }
  }, s + 1)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      marginTop: "auto",
      position: "sticky",
      bottom: 0
    }
  }, TRACKS.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    onClick: () => setPlayingClip(p => p.map((v, j) => j === i ? -1 : v)),
    style: {
      width: COL_W,
      flex: "none",
      height: "20px",
      display: "flex",
      alignItems: "center",
      padding: "0 7px",
      background: "var(--canvas-panel)",
      borderRight: "1px solid var(--canvas-divider)",
      borderTop: "1px solid var(--canvas-divider)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(Square, {
    color: "rgba(0,0,0,0.45)"
  }))), /*#__PURE__*/React.createElement("div", {
    onClick: stopAll,
    style: {
      width: COL_W,
      flex: "none",
      height: "20px",
      display: "flex",
      alignItems: "center",
      padding: "0 7px",
      background: "var(--canvas-chrome)",
      color: "#ddd",
      borderTop: "1px solid var(--canvas-divider)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(Square, {
    color: "#ddd"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "6px",
      font: "var(--weight-regular) 10px/1 var(--font-ui)"
    }
  }, "Stop Clips"))));
}
window.SessionGrid = SessionGrid;
window.SESSION_TRACKS = TRACKS;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/live-session/SessionGrid.jsx", error: String((e && e.message) || e) }); }

// ui_kits/live-session/TopBar.jsx
try { (() => {
/* global React */
// Live Session View — top transport bar. Light chrome, dark text.
// Play turns GREEN when running; Record turns red. (Matches Default theme.)
const {
  Toggle
} = window.AbletonLiveDesignSystem_c3707c;
function TBtn({
  children,
  onClick,
  active,
  color,
  title,
  style = {}
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    title: title,
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "5px",
      height: "21px",
      padding: "0 9px",
      font: "var(--weight-medium) 11px/1 var(--font-ui)",
      color: active ? "#241a02" : "var(--canvas-text)",
      background: active ? color || "var(--accent-amber)" : h ? "var(--canvas-panel-light)" : "var(--canvas-panel)",
      border: "1px solid rgba(0,0,0,0.28)",
      borderRadius: "2px",
      cursor: "pointer",
      userSelect: "none",
      whiteSpace: "nowrap"
    }
  }, children);
}
function Counter({
  value
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      gap: "2px",
      padding: "0 8px",
      height: "21px",
      alignItems: "center",
      font: "var(--weight-medium) 13px/1 var(--font-mono)",
      color: "var(--canvas-text)",
      background: "var(--canvas-panel-lighter)",
      border: "1px solid rgba(0,0,0,0.28)",
      borderRadius: "2px",
      fontFeatureSettings: '"tnum" 1'
    }
  }, value);
}
function Sep() {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: "1px",
      height: "20px",
      background: "rgba(0,0,0,0.22)",
      margin: "0 5px"
    }
  });
}
function TopBar({
  playing,
  onPlay,
  onStop,
  recording,
  onRecord,
  bpm,
  setBpm,
  loop,
  setLoop,
  metro,
  setMetro,
  position
}) {
  const dec = () => setBpm(Math.max(20, +(bpm - 1).toFixed(2)));
  const inc = () => setBpm(Math.min(300, +(bpm + 1).toFixed(2)));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "5px",
      height: "38px",
      padding: "0 8px",
      background: "var(--canvas-panel)",
      borderBottom: "1px solid var(--canvas-divider)",
      userSelect: "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "2px",
      marginRight: "2px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: "13px",
      height: "13px",
      background: "#1c1c1c",
      borderRadius: "2px"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: "13px",
      height: "13px",
      background: "#1c1c1c",
      borderRadius: "2px",
      opacity: 0.55
    }
  })), /*#__PURE__*/React.createElement(TBtn, {
    title: "Ableton Link"
  }, "Link"), /*#__PURE__*/React.createElement(TBtn, {
    title: "Tap tempo"
  }, "Tap"), /*#__PURE__*/React.createElement("span", {
    onWheel: e => e.deltaY < 0 ? inc() : dec(),
    onClick: inc,
    onContextMenu: e => {
      e.preventDefault();
      dec();
    },
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "ns-resize",
      minWidth: "56px",
      height: "21px",
      padding: "0 8px",
      font: "var(--weight-medium) 12px/1 var(--font-mono)",
      color: "var(--canvas-text)",
      background: "var(--canvas-panel-lighter)",
      border: "1px solid rgba(0,0,0,0.28)",
      borderRadius: "2px",
      fontFeatureSettings: '"tnum" 1'
    },
    title: "Tempo \u2014 scroll to change"
  }, bpm.toFixed(2)), /*#__PURE__*/React.createElement(TBtn, {
    title: "Time signature"
  }, "4 / 4"), /*#__PURE__*/React.createElement(Toggle, {
    on: metro,
    onChange: setMetro,
    size: "sm"
  }, "Metro"), /*#__PURE__*/React.createElement(Sep, null), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--weight-regular) 11px/1 var(--font-ui)",
      color: "var(--canvas-text)",
      display: "inline-flex",
      gap: "4px",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      padding: "3px 6px",
      background: "var(--canvas-panel-lighter)",
      border: "1px solid rgba(0,0,0,0.28)",
      borderRadius: "2px"
    }
  }, "C"), /*#__PURE__*/React.createElement("span", {
    style: {
      padding: "3px 6px",
      background: "var(--canvas-panel-lighter)",
      border: "1px solid rgba(0,0,0,0.28)",
      borderRadius: "2px"
    }
  }, "Minor")), /*#__PURE__*/React.createElement(Sep, null), /*#__PURE__*/React.createElement(Counter, {
    value: position
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onPlay,
    title: "Play",
    style: {
      width: "30px",
      height: "21px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: playing ? "var(--accent-green)" : "var(--canvas-panel)",
      border: "1px solid rgba(0,0,0,0.28)",
      borderRadius: "2px",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "11",
    viewBox: "0 0 11 11"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 1.5 L9.5 5.5 L2 9.5 Z",
    fill: playing ? "#0c2e0c" : "#2a2a2a"
  }))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onStop,
    title: "Stop",
    style: {
      width: "30px",
      height: "21px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--canvas-panel)",
      border: "1px solid rgba(0,0,0,0.28)",
      borderRadius: "2px",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "9",
    height: "9",
    viewBox: "0 0 9 9"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "1",
    y: "1",
    width: "7",
    height: "7",
    fill: "#2a2a2a"
  }))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onRecord,
    title: "Record",
    style: {
      width: "30px",
      height: "21px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: recording ? "var(--accent-red)" : "var(--canvas-panel)",
      border: "1px solid rgba(0,0,0,0.28)",
      borderRadius: "2px",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "11",
    viewBox: "0 0 11 11"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "5.5",
    cy: "5.5",
    r: "3.6",
    fill: recording ? "#3a0b08" : "#b03a32"
  }))), /*#__PURE__*/React.createElement(Toggle, {
    on: loop,
    onChange: setLoop,
    size: "sm"
  }, "Loop"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--weight-regular) 11px/1 var(--font-ui)",
      color: "var(--canvas-text)",
      display: "inline-flex",
      gap: "5px",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--canvas-text-dim)"
    }
  }, "KEY"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--canvas-text-dim)"
    }
  }, "MIDI"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--font-mono)",
      fontFeatureSettings: '"tnum" 1'
    }
  }, "48.0 kHz"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--font-mono)",
      fontFeatureSettings: '"tnum" 1'
    }
  }, "11 %")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "2px"
    }
  }, [0, 1, 2].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: "16px",
      height: "2px",
      background: "#3a3a3a"
    }
  })))));
}
window.TopBar = TopBar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/live-session/TopBar.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.ContextMenu = __ds_scope.ContextMenu;

__ds_ns.Dropdown = __ds_scope.Dropdown;

__ds_ns.Knob = __ds_scope.Knob;

__ds_ns.ListRow = __ds_scope.ListRow;

__ds_ns.Meter = __ds_scope.Meter;

__ds_ns.NumericField = __ds_scope.NumericField;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.PanelHeader = __ds_scope.PanelHeader;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Toggle = __ds_scope.Toggle;

__ds_ns.NodeGraph = __ds_scope.NodeGraph;

__ds_ns.Table = __ds_scope.Table;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.RadioGroup = __ds_scope.RadioGroup;

__ds_ns.Slider = __ds_scope.Slider;

__ds_ns.TextInput = __ds_scope.TextInput;

__ds_ns.Textarea = __ds_scope.Textarea;

})();
