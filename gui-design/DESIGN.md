# Iudex — Agent Orchestrator GUI: Design Document

This document describes the complete design of the Iudex agent orchestrator UI — its visual language, component system, layout rules, state model, and file structure. It is intended to give an AI agent enough context to rework, extend, or redesign the interface from scratch using the same source files.

---

## 1. What This App Is

**Iudex** is a desktop-class GUI for orchestrating AI coding agents. It sits on top of a workspace (e.g. `~/code/iudex-workspace`) and lets an operator:

- Monitor a pipeline of coding tickets moving through states: Queued → Active → QA → Review → Merged
- Inspect individual agent processes (impl agents write code, QA agents review it)
- Review diffs and approve/reject changes
- Manage worktrees, terminal sessions, and settings

The aesthetic is a **dense, information-rich tool UI** — no whitespace padding, no marketing chrome. Every pixel earns its place. The visual language is derived from **Ableton Live's DAW interface**.

---

## 2. Design System — Ableton Live

The design system lives in `_ds/ableton-live-design-system-c3707c72-d746-4164-9733-ce40f3a2bcd5/`. Every DC loads it via `<helmet>`:

```html
<helmet>
  <link rel="stylesheet" href="_ds/ableton-live-design-system-c3707c72-d746-4164-9733-ce40f3a2bcd5/tokens/fonts.css">
  <link rel="stylesheet" href="_ds/ableton-live-design-system-c3707c72-d746-4164-9733-ce40f3a2bcd5/tokens/colors.css">
  <link rel="stylesheet" href="_ds/ableton-live-design-system-c3707c72-d746-4164-9733-ce40f3a2bcd5/tokens/typography.css">
  <link rel="stylesheet" href="_ds/ableton-live-design-system-c3707c72-d746-4164-9733-ce40f3a2bcd5/tokens/spacing.css">
  <link rel="stylesheet" href="_ds/ableton-live-design-system-c3707c72-d746-4164-9733-ce40f3a2bcd5/styles.css">
</helmet>
```

### 2.1 Color Palette

| Role | Value | Usage |
|---|---|---|
| **Canvas / workspace** | `#929292` | Main area background, sidebar |
| **Chrome dark** | `#565656` | Top bar |
| **Sidebar dark** | `#3f3f3f` | Left nav rail |
| **Module near-black** | `#1d1d1d` | Terminal output background |
| **Module surface** | `#2f333c` | Dark panel headers |
| **Panel mid** | `#afafaf` | View headers, agent detail header |
| **Panel light** | `#dadada` | Active tab, light panel surfaces |
| **Dialog / surface** | `#bdbdbd` | Action bars |
| **Divider dark** | `#14171d` | Borders inside dark panels |
| **Divider mid** | `#6f6f6f` | Borders inside gray panels |
| **Divider dark-chrome** | `#2a2a2a` | Borders inside dark chrome |
| **Amber — active/on** | `#f4bc41` | Active state, primary buttons, Auto-Activate on |
| **Cyan — editing** | `#5bc7d8` | Tickets view dot, editing state |
| **Mint — level/graph** | `#72f6aa` | Progress bars, healthy status |
| **Indigo — selected** | `#1f2e90` | Selected nav row (default) |
| **Violet — review** | `#836ddd` | Review state, review-ready badges |
| **Red — error/record** | `#e0584c` | Failed state, danger buttons |
| **Green — success** | `#5ccf5c` | Playing/transport, merged state |
| **Text primary** | `#2a2a2a` | Main content text |
| **Text muted** | `#565656` | Secondary labels |
| **Text dim** | `#8a8f99` | Sidebar metadata, overline labels |
| **Text light** | `#cfcfcf` | Text on dark chrome |
| **Text bright** | `#e8e9eb` | Active nav items, headings on dark |

### 2.2 Typography

| Token | Value |
|---|---|
| `--font-ui` | IBM Plex Sans |
| `--font-mono` | IBM Plex Mono |
| Base size | 12px (most UI), 11px (dense rows), 10px (overlines/labels) |
| Hierarchy | Color + weight, **not** size. The app lives near 11–13px. |

**Rules:**
- Monospace for: IDs, file paths, numbers, logs, brief text, code values
- UI font for: labels, titles, nav items, button text
- No emoji. Status is conveyed by color dots and glyphs.

### 2.3 Spacing & Layout

- **4px base unit.** Padding is 4–12px. Never fractional.
- Panels butt against each other with **1px dividers**, no gaps between panels.
- Row height: 24–26px for list rows, 30px for view headers, 44px for top chrome.
- All panels: `box-sizing: border-box`.

### 2.4 Visual Rules

- **No border-radius on panels, rows, fields** — everything is square by default.
- `border-radius: 2px` on chips/badges only.
- `border-radius: 3px` on tab pills only.
- `border-radius: 50%` on status dots only.
- **No gradients, no shadows, no textures** — flat solid fills everywhere.
- **No decorative cards** with rounded corners + left-border accent. That is not this language.
- **Color is state, not decoration.** Amber = active/on, cyan = editing, violet = review, red = error, green = running/success.
- Hover: slight lighten. Active: solid fill. Disabled: ~40% opacity.
- Scrollbars: `#6f6f6f` thumb on `#828282` track.

### 2.5 Input / Field Conventions

| Field type | Background | Border | Cursor | Notes |
|---|---|---|---|---|
| Read-only markdown/text | `#b8b8b8` | `1px solid #9a9a9a` | `default` | Brief, logs |
| Editable textarea | `#e8e8e8` | `1px solid #9a9a9a` | `auto` | Prompts, reject reason |
| Terminal/log output | `#1d1d1d` | `1px solid #14171d` | `default` | Dark, monospace, `color: #c9ccd1` |

All textareas: `font-family: var(--font-mono)`, `font-size: 11px`, `line-height: 1.6`, `resize: vertical`, `outline: none`.

---

## 3. Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  TOP BAR (44px)  logo · workspace picker · settings     │
├────────────┬────────────────────────────────────────────┤
│            │                                            │
│  LEFT NAV  │         MAIN CONTENT AREA                  │
│  (186px)   │         (flex: 1)                          │
│            │                                            │
│  VIEWS     │         Changes per active view            │
│  nav items │                                            │
│            │                                            │
│  ──────    │                                            │
│  PIPELINE  │                                            │
│  TRANSPORT │                                            │
│  TOGGLES   │                                            │
│  SYS INFO  │                                            │
└────────────┴────────────────────────────────────────────┘
```

### 3.1 Top Bar (`height: 44px`, `background: #565656`)

Contains:
- **Logo** — amber dot + "iudex" wordmark
- **Workspace picker** — monospace path, dropdown chevron
- **Settings icon** — right-aligned

### 3.2 Left Nav Rail (`width: 186px`, `background: #3f3f3f`)

**Views section** (top): nav items for each view. Active item: `border-left: 2px solid #f4bc41`, `background: <selectionColor>`, `color: #e8e9eb`. Inactive: `color: #cfcfcf`.

**Bottom section** (stacked, separated by `1px solid #14171d`):

1. **PIPELINE** — color-coded counts for each ticket state (Queued/Active/QA/Review/Merged). Values in `var(--font-mono)`.
2. **TRANSPORT + TOGGLES** — play (green triangle) and stop (gray square) buttons; Auto-Activate toggle (amber = on) and Auto-QA toggle (gray = off) shown as labeled slide toggles.
3. **SYSTEM INFO** — branch name, active count, watcher status, 3-segment progress bar.

### 3.3 Main Content Area

Switches content based on `state.view`. Each view starts with a `<ViewHeader>` (30px, `#afafaf`).

---

## 4. Views

### Dashboard
- **Dot color:** `#f4bc41` (amber)
- Shows items that need operator attention: blocked tickets, review-ready items, failed tasks.
- Each item: colored left-border row (3px), ticket ID in mono, status chip, action buttons.

### Agents
- **Dot color:** `#5ccf5c` (green)
- Split layout: agent rail (218px) on left + detail panel on right.
- **Agent rail:** list of agents, each row shows role chip, status dot, beat/tick info. Background `#9c9c9c`.
- **Detail panel:** shows console log, changed files (left, 222px), code diff (right, dark `#1d1d1d`). Tabs: Console / Files / Diff / Brief.

### Tickets
- **Dot color:** `#5bc7d8` (cyan)
- `TabSwitcher`: Table | Graph views.
- **Table view:** dense grid with columns for ID, Title, Status chip, Dependencies, QA count.
- **Graph view:** DAG of ticket nodes showing dependencies as bezier edges.
- **Ticket detail panel** (right, slides in on selection): shows brief (read-only), dependencies, agents, log (impl/qa tabs), editable reject reason.

### Review
- **Dot color:** `#836ddd` (violet)
- Shows tickets in `pending-human-qa` state.
- Left rail: review queue. Right: file list + diff + approval actions.

### Terminal
- **Dot color:** `#72f6aa` (mint)
- Session tabs (A / B / C switcher).
- Full-height dark terminal with monospace output.

### Worktrees
- **Dot color:** `#9ea0e0` (periwinkle)
- Read-only inspection of git worktrees; two-dot diff vs main.

### Settings
- **Dot color:** `#8a8f99` (muted)
- Tabs: General | Prompts.
- **General:** key-value config pairs.
- **Prompts:** editable textareas for `impl.md` and `qa.md` system prompts (light bg, editable).

---

## 5. State Model

All state lives in `iudex.dc.html`'s logic class. Key state fields:

```js
state = {
  view: 'dashboard',          // active view
  dir: 'A',                   // terminal session tab
  agent: 'T-01',              // selected agent ID
  agentTab: 'console',        // agent detail tab
  ticketsMode: 'table',       // 'table' | 'graph'
  pan: { x: 0, y: 0 },       // graph pan offset
  nodePos: {},                // graph node positions
  selectedTicket: 'T-01',     // ticket detail panel
  ticketLogTab: 'impl',       // 'impl' | 'qa'
  settingsTab: 'general',     // 'general' | 'prompts'
};
```

**Selection color** is a DC prop: `selectionColor` — enum `Teal | Indigo | Violet | Rust`. Controls the active nav row fill.

---

## 6. Component Library

All components are Design Components (`.dc.html` files) loaded via `<dc-import>`. They are plain HTML + a small JS logic class — no framework, no build step. The runtime is `support.js`.

### `Chip.dc.html`
Compact inline badge for status labels and role indicators.

**Props:**
| Prop | Type | Default | Notes |
|---|---|---|---|
| `children` | string | — | Label text |
| `bg` | string | `#404040` | Background color |
| `fg` | string | `#cfcfcf` | Text color |
| `role` | string | — | Shorthand: auto-sets label to role value |

**Style:** `font-family: var(--font-mono)`, `font-size: 10px`, `border-radius: 2px`, `padding: 1px 5px`.

**Usage:**
```html
<dc-import name="Chip" hint-size="auto,16px">impl</dc-import>
<dc-import name="Chip" bg="#e0584c" fg="#fff" hint-size="auto,16px">failed</dc-import>
<dc-import name="Chip" role="{{ a.role }}" hint-size="auto,16px"></dc-import>
```

---

### `TabSwitcher.dc.html`
Segmented pill switcher for 2–4 tab labels.

**Props:**
| Prop | Type | Default | Notes |
|---|---|---|---|
| `tabs` | string or array | `"Table,Graph"` | Comma-separated or array |
| `value` | string | first tab | Currently active tab label |
| `onChange` | function | — | Called with new label on click |
| `fontSize` | string | `12px` | Font size for tab labels |

**Style:** `background: #929292`, `border: 1px solid #6f6f6f`, `padding: 1px`. Active tab: `background: #dadada`, `color: #2a2a2a`. Inactive: `transparent`, `color: #565656`. Pills: `border-radius: 3px`.

**Usage:**
```html
<dc-import name="TabSwitcher" tabs="Table,Graph" value="{{ tmodeDisplay }}"
  on-change="{{ onChangeTMode }}" hint-size="auto,22px"></dc-import>
```

---

### `Button.dc.html`
Flat, square-cornered action button. Color = state.

**Props:**
| Prop | Type | Options | Notes |
|---|---|---|---|
| `variant` | enum | `primary secondary review danger quiet` | Visual style |
| `size` | enum | `sm md` | `sm` = 20px tall, `md` = 22px tall |
| `onClick` | function | — | Click handler |
| `children` | string | — | Button label |

**Variants:**
| Variant | Background | Text | Border |
|---|---|---|---|
| `primary` | `#f4bc41` | `#2a2a2a` | `1px solid #c79320` |
| `secondary` | `#9c9c9c` | `#2a2a2a` | `1px solid #6f6f6f` |
| `review` | `#836ddd` | `#ffffff` | none |
| `danger` | `#e0584c` | `#ffffff` | `1px solid #b03d33` |
| `quiet` | transparent | `#565656` | `1px solid #6f6f6f` |

**Usage:**
```html
<dc-import name="Button" variant="primary" size="sm" hint-size="auto,20px">+ Compose</dc-import>
<dc-import name="Button" variant="danger" size="sm" on-click="{{ kill }}" hint-size="auto,20px">kill agent</dc-import>
```

---

### `Overline.dc.html`
Small uppercase section label (10px, letter-spaced).

**Props:**
| Prop | Type | Default |
|---|---|---|
| `tone` | `light` \| `dark` | `light` |
| `mt` | string | `0` |
| `mb` | string | `6px` |

`light` tone = `color: #565656`. `dark` tone = `color: #8a8f99`.

**Usage:**
```html
<dc-import name="Overline" mb="5px" hint-size="auto,14px">BRIEF</dc-import>
<dc-import name="Overline" mt="14px" mb="6px" hint-size="auto,14px">LOG</dc-import>
```

---

### `SectionHeader.dc.html`
Flush section label strip at the top of a sidebar column.

**Props:**
| Prop | Type | Default |
|---|---|---|
| `tone` | `light` \| `dark` | `light` |
| `pad` | string | auto per tone |
| `noBorder` | any | — |
| `borderTop` | any | — |

`light` = `color: #3a3a3a`, border `#6f6f6f`. `dark` = `color: #8a8f99`, border `#14171d`.

**Usage:**
```html
<dc-import name="SectionHeader" hint-size="100%,24px">AGENTS · {{ agentCount }}</dc-import>
<dc-import name="SectionHeader" tone="dark" no-border="true" hint-size="100%,26px">VIEWS</dc-import>
```

---

### `ViewHeader.dc.html`
30px header bar at the top of every main view. `background: #afafaf`, `border-bottom: 1px solid #6f6f6f`.

**Props:**
| Prop | Type | Notes |
|---|---|---|
| `dot` | color string | Status dot color (8px circle) |
| `title` | string | Bold 14px title |
| `subtitle` | string | Optional muted 11px subtitle |
| `children` | slot | Right-aligned action buttons |

**Usage:**
```html
<dc-import name="ViewHeader" dot="#5ccf5c" title="Agents" hint-size="100%,30px">
  <dc-import name="Button" variant="secondary" size="sm" hint-size="auto,20px">Clear finished</dc-import>
</dc-import>
```

---

## 7. File Structure

```
iudex.dc.html          — Main app shell. All views, all state.
Button.dc.html         — Action button component
Chip.dc.html           — Inline badge / status chip
TabSwitcher.dc.html    — Segmented pill tab control
Overline.dc.html       — Section label (10px, letter-spaced)
SectionHeader.dc.html  — Flush column header strip
ViewHeader.dc.html     — View title bar (30px)
support.js             — DC runtime (do not edit)
_ds/                   — Ableton Live design system bundle
  ableton-live-design-system-c3707c72-d746-4164-9733-ce40f3a2bcd5/
    _ds_bundle.js
    tokens/fonts.css
    tokens/colors.css
    tokens/typography.css
    tokens/spacing.css
    styles.css
```

---

## 8. DC Authoring Rules

- All files are **Design Components** (`.dc.html`). The runtime is `support.js`.
- Template markup goes between `<x-dc>` and `</x-dc>`.
- Logic goes in `<script type="text/x-dc" data-dc-script>` as `class Component extends DCLogic { renderVals() { … } }`.
- **Inline styles only** — no CSS classes, no stylesheets for UI elements.
- Template holes are **dotted lookups only**: `{{ value }}`, `{{ a.role }}` — never expressions.
- Compute everything in `renderVals()` and expose by name.
- Child components: `<dc-import name="ComponentName" prop="{{ val }}" hint-size="auto,20px">children</dc-import>`
- Always set `hint-size` on `<dc-import>` (placeholder size while loading).
- For standalone HTML export: add `<meta name="ext-resource-dependency" content="./ComponentName.dc.html" data-resource-id="dc_ComponentName">` for each child DC, and patch `window.fetch` to redirect those URLs to `window.__resources[key]`.

---

## 9. Design Rules & Anti-Patterns

**Do:**
- Use `display: flex` + `gap` for all rows and groups of siblings.
- Use `border-left: 2–3px solid <color>` for selected / attention rows.
- Use color dots (8px, `border-radius: 50%`) as state indicators in headers.
- Keep font sizes at 10–13px — hierarchy comes from weight and color.
- Use `var(--font-mono)` for IDs, paths, numbers, code, log content.
- Use 1px dividers between panels — never gaps.

**Don't:**
- Round panel/row corners. Square everywhere except chips (2px) and dots (50%).
- Add shadows to panels (only floating layers like menus get shadows).
- Use color decoratively — every hue must carry functional meaning.
- Add gradient backgrounds.
- Use emoji.
- Pad content generously — this is a dense tool UI, not a landing page.
- Use `flex: auto` or `min-width: 0` sloppily — always be explicit about which panel is `flex: none` vs `flex: 1`.

---

## 10. Ticket & Agent Data Model

**Ticket states:** `queued` → `active` → `qa` → `pending-human-qa` → `merged` | `failed`

**Agent roles:** `impl` (writes code) | `qa` (reviews code)

**Agent shape:**
```js
{
  id: 'T-01',
  title: 'Parser refactor',
  role: 'impl' | 'qa',
  statusLabel: string,
  statusColor: hex,
  pid: string,
  procLabel: string,
  procColor: hex,
  state: 'active' | 'pending-human-qa' | 'failed',
  deps: string,
  qa: string,            // reject count
  console: [{ t: string, c: hex }],   // log lines with color
  files: [{ st, stc, f, stats }],     // changed files
  brief: string,         // task brief markdown
}
```

**Ticket badge colors by state:**

| State | bg | text |
|---|---|---|
| queued | `#3f3f3f` | `#cfcfcf` |
| active | `#2a5a2a` | `#72f6aa` |
| qa | `#1a3a4a` | `#5bc7d8` |
| pending-human-qa | `#3a2a5a` | `#836ddd` |
| merged | `#1a3a1a` | `#5ccf5c` |
| failed | `#5a1a1a` | `#e0584c` |
