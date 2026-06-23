# Ableton Live — Design System

A reusable design system reconstructed from **Ableton Live 11/12** — the music-production software (DAW). It captures Live's UI language so agents can generate well-branded interfaces, mockups, and slides in the Ableton idiom.

> **One sentence:** a gray instrument panel where the only color you see is color you (or the system state) put there on purpose.

## Sources
This system was derived from two inputs, both in `uploads/`:
1. **`ableton-design-system.md`** — a written spec whose colors were sampled directly from pixel data of Live screenshots (treated as ground truth), with type/spacing/motion read visually.
2. **Seven reference screenshots** of Live 12 (Default theme): Session View clip matrix, Arrangement View, device racks (Meld / Roar / Compressor / Delay), the two-pane Browser, the Preferences modal, and a right-click context menu. The UI kit was matched to these.

No codebase or Figma was provided — there is no proprietary source to link. If you have access to Live's actual app, treat it as the canonical reference and flag drift.

---

## Design philosophy — five habits
1. **Density over whitespace.** Every pixel works. This is a tool people stare at for 8 hours, not a marketing surface.
2. **Color is information, never decoration.** Hue is reserved for (a) user-assigned identity (track/clip color) and (b) functional state (active, editing, recording, level).
3. **Two-tier depth, not many.** A light structural **Canvas** layer and a near-black **Module** layer. Depth is binary — you're organizing or operating.
4. **Flat by default, curved only at the control.** Panels, headers, rows are square and flat. Roundness is reserved for things you grab — knobs, pills, dropdown chips.
5. **Neutral chrome, loud function.** The base palette is almost entirely gray; the few saturated colors (amber, cyan, mint) are load-bearing.

---

## CONTENT FUNDAMENTALS
How copy is written in Live's UI:

- **Casing:** plain **Title Case** for labels and buttons ("Audio Effects", "Show Preset Name", "Bass Drop"). Never all-caps-tracked-out "pro tool" styling — it reads quieter and more utilitarian. Acronyms stay upper (MIDI, CPU, LFO, EQ, dB, Hz).
- **Voice:** terse, **imperative, second-person-implied** — menus are bare verbs ("Cut", "Duplicate", "Rename", "Edit Info Text", "Save as Default Preset"). No "Please", no marketing adjectives, no sentences where a word will do.
- **I vs you:** neither. The UI almost never addresses the user in prose. It names objects and actions, not feelings. Labels are nouns (parameters) or verbs (actions).
- **Numbers are first-class.** Values are shown precisely with units inline and tabular alignment: `128.00`, `-6.4 dB`, `2400 Hz`, `300 ms`, `4 / 4`, `48.0 kHz`, `11 %`. Never rounded for "friendliness".
- **Naming:** factory content uses descriptive, format-tagged file names — "Basic Organ Bass.adg", "Kick Mkit Synth 9.aif", "BD 909 Tube Long F 06.wav". Track/scene names are short and functional ("Drums", "Bass Drop", "Drop 2", "Verse", "Outro").
- **Emoji:** none. Ever. Status is conveyed by color, dots, and tiny glyphs — not pictographs.
- **Vibe:** professional-instrument calm. Confident, precise, unfussy. The interface trusts the user to be an expert and gets out of the way.

---

## VISUAL FOUNDATIONS
- **Colors.** Structural neutrals are a single gray ramp (`#3f3f3f` chrome → `#929292` workspace → `#dadada` dialog). The Module layer is near-black blue-grays (`#1d1d1d`–`#2f333c`). Functional accents are reserved, one-meaning-each: **amber** `#f4bc41` = active/on, **cyan** `#5bc7d8` = editing/playhead, **mint** `#72f6aa` = graph/level low, **indigo** `#1f2e90` = selected row, **red** `#e0584c` = record, **green** `#5ccf5c` = transport playing. User color-coding is a band of desaturated pastels (cyan, mauve, violet, teal, periwinkle, yellow, salmon, tan) that travel everywhere an object appears.
- **Type.** A neutral grotesk (substituted with **IBM Plex Sans**; numerics in **IBM Plex Mono**). The scale is tiny and flat — the whole app lives near **11px**. Hierarchy comes from **color and weight, not size**. Numerals are tabular so stacked fields align.
- **Spacing.** 4px base unit. Most internal padding is 1–2 units. Strict row grid — every list/table row identical height. Panels butt against each other with **1px dividers, not gaps**.
- **Backgrounds.** Flat solid fills only. No images, no gradients (except the meter level fill and subtle clip-content washes), no textures, no hand-drawn illustration. The "background" is structural gray.
- **Animation.** Restraint to the point of near-absence. **State changes are color changes** — no bounce, no elastic, no skeuomorphic press-depth. Transitions, where present, are short (60–120ms) ease-outs on hover/open only. No decorative loops.
- **Hover.** Slight **lighten** of the fill. No shadow, no scale.
- **Press / active.** No shrink, no depth. Active = solid amber fill; editing = solid cyan fill; selected row = solid indigo fill. The fill *is* the state.
- **Disabled.** Desaturate + dim (~40% opacity). No strikethrough, no icon change.
- **Borders.** 1px, low-contrast (`rgba(0,0,0,0.2–0.4)` on canvas; `#14171d` inside modules). Used as structural dividers, not decoration.
- **Shadows.** Almost none — depth is the tier, not elevation. Only floating layers get one soft drop: context menus/dropdowns (`0 4px 14px`), modal windows (`0 12px 48px`). No multi-level card-elevation ramp.
- **Transparency / blur.** Essentially unused. Surfaces are opaque. (Hover highlights use low-alpha white/black overlays, but there is no frosted-glass blur anywhere.)
- **Corner radii.** `0` for panels, headers, rows, fields (square). `2px` for chips/menus, `3px` for tab pills, `50%` for knobs only. Curvature signals "you can grab this".
- **Cards.** There is no decorative "card" — the equivalent is the **Panel** (Canvas or Module surface) with a 1px border, square corners, no shadow, and a flush header. Don't add rounded-corner + colored-left-border cards; that's not this language.
- **Imagery color vibe.** N/A — the system avoids photography. Where waveforms/spectra appear they're tinted with the track's user color or an accent (warm amber / cool cyan) on near-black.
- **Layout rules.** Fixed transport chrome at top; browser pinned left; device chain pinned bottom; master/scene column pinned right. Everything aligns to the row grid.

---

## ICONOGRAPHY
- **Style:** flat, **single-weight stroke** icons, small (matched to the ~11px type). No fill unless indicating an active state. No duotone, no rounded "friendly" icon sets.
- **Chevrons** are the workhorse: every disclosure/expand/dropdown uses the same small chevron, rotating to indicate open/closed.
- **Colored dots** stand in for icons where a full glyph would be too heavy — the device/track color dot in a panel header is the primary "status/category indicator".
- **Transport glyphs** are geometric primitives: play = triangle, stop = square, record = circle. Rendered as tiny inline SVGs.
- **Emoji / unicode-as-icon:** not used as a system. (Checkmarks `✓` and the occasional `···` overflow glyph appear in menus; treat those as the exception, not a pattern.)
- **No bundled icon font** ships with this system. Icons in the components and UI kit are hand-placed inline SVG primitives (triangles, squares, chevrons, magnifier, file glyph) drawn at single-weight to match Live. If you need a broader set, use a thin-stroke CDN set (e.g. Lucide at `stroke-width:1`) and keep it monochrome — **flag the substitution**. Do not introduce filled or multicolor icons.

---

## SUBSTITUTIONS & OPEN ITEMS (please confirm)
- **Typeface — SUBSTITUTED.** Live's UI uses a custom grotesk; the exact face is unconfirmed. I used **IBM Plex Sans** (UI) + **IBM Plex Mono** (numerics) from Google Fonts as the closest faithful, freely-licensed match. **If you can share Live's actual font files, drop them in `tokens/` and I'll swap the `@font-face` and `--font-ui` token.**
- **Corner radii** are inferred ("barely rounded") rather than pixel-measured.
- **Theme.** Tokens are built on one mid-gray ramp; Live ships many chrome themes (Default, Classic Medium Dark/Light, Riparian, Twenty-Four Carat…). This system commits to one neutral ramp — say the word if you want a second theme scope.
- The full ~70-swatch user-color wheel is represented by a sampled subset of ~11 tokens.

---

## INDEX — what's in this project
**Foundations**
- `styles.css` — global entry point (imports only). Consumers link this one file.
- `tokens/colors.css` — neutrals, module surfaces, functional accents, user color-coding, meter stops, semantic aliases.
- `tokens/typography.css` — families, tiny flat scale, weights, tabular numerics.
- `tokens/spacing.css` — 4px scale, row/control sizing, radii, the binary elevation model, motion.
- `tokens/fonts.css` — IBM Plex Sans/Mono `@font-face` (Google Fonts).
- `guidelines/*.card.html` — foundation specimen cards (Colors, Type, Spacing, Brand) shown in the Design System tab.

**Components** (`window.AbletonLiveDesignSystem_c3707c`)
- `components/core/` — `Button` · `Toggle` · `NumericField` · `Knob` · `Dropdown` · `Tabs` · `PanelHeader` · `Panel` · `ListRow` · `Meter` · `ContextMenu` · `Badge` (card: `core.card.html`)
- `components/forms/` — `TextInput` · `Textarea` · `Checkbox` · `RadioGroup` (amber segmented) · `Slider` (+ vertical fader) (card: `forms.card.html`)
- `components/data/` — `Table` (dense grid w/ inline controls) · `NodeGraph` (DAG / signal-flow routing) (card: `data.card.html`, also demos tabbed content + a notes card)
Each has a `.jsx` (impl), `.d.ts` (props + starting-point tag), and `.prompt.md` (usage).

**UI Kits** (`ui_kits/`)
- `live-session/` — interactive Session View: `index.html` + `TopBar` / `Browser` / `SessionGrid` / `DeviceChain`.
- `preferences/` — Live Preferences modal: macOS window + sidebar nav + pill toggles + MIDI port table (`index.html`).
See each kit's `README.md`.

**Skill** — `SKILL.md` makes this downloadable as a Claude Agent Skill.
