# iudex GUI

A native desktop client for [iudex](../README.md) — a cockpit for driving the
`queue → implement → QA → human-review → merge` pipeline. It drives the CLI the
way a git client drives `git`: it **holds no authoritative state**, **reads**
derived truth via `iudex status --json`, **writes** by shelling out to `iudex`,
and treats `.iudex/events.jsonl` as a doorbell (on any change it re-reads). It is
also the human's hands — it owns agent process lifecycles via a tmux pool, which
the CLI deliberately never does.

> The design is specified in [`.context/prd/gui-client.md`](../.context/prd/gui-client.md)
> (hardened through a `grill-me` session → 13 decisions).

## Stack

- **Tauri 2** — Rust backend (`src-tauri/`), web frontend (`src/`).
- **React + TypeScript + Vite**.
- **xterm.js** + `portable-pty` — interactive terminals over a tmux session pool.
- **Monaco** (read-only) — the shared diff viewer (Worktrees + Review). Bundled
  locally and lazy-loaded (no CDN; works offline / under Tauri's CSP).

## Prerequisites

- **Rust** (`cargo`) — Tauri's backend toolchain.
- **Node + pnpm** — the frontend uses pnpm.
- **tmux** — backs the terminal/agent session pool (the Terminal and Agents
  views degrade to a hint without it).
- A built **`iudex`** binary on `PATH`, or pointed at via `$IUDEX_BIN`.

## Run

```bash
cd gui
pnpm install
# point the GUI at your iudex binary; the first cargo build is slow, then cached
IUDEX_BIN=/path/to/iudex pnpm tauri dev
```

The window opens with a path field — enter any iudex workspace and click **Open**
(opening a folder with no workspace offers to `iudex init` it). Build a release
bundle with `pnpm tauri build`.

## The seven views

| View | What it does |
|------|--------------|
| **Dashboard** | Glanceable triage piles (ready-to-activate, pending human review, in-QA, failed); each item jumps to its view. Default landing. |
| **Terminal** | Tabbed live tmux sessions (interactive). Stays mounted across view switches so PTYs survive. |
| **Tickets** | Reactive table + a state-aware action column (activate/finish/agent/retry) and the front-of-funnel launchers (compose a ticket, shape an idea via a skill agent). |
| **Agents** | Grid of read-only `capture-pane` peeks into each live agent, with a synthesized status (working / idle / awaiting-finish / crashed / done). Click a peek → focus its terminal. |
| **Worktrees** | Read-only, editor-style inspection keyed on physical worktrees: changed files (two-dot vs main, incl. uncommitted) + Monaco diff + escape hatches (open in editor / shell). |
| **Review** | Deep-review workspace for `pending-human-qa`: brief / log / QA-review tabs + three-dot diff, with a **preflighted** approve & merge (predicts conflicts via `git merge-tree`; one-click Begin-resolution) and reject-with-reason. |
| **Settings** | General / Prompts subtabs: edit `config.yml` fields and the impl/review prompt templates (surgical writes preserve comments). |

## Architecture

```
React UI ──reads──> iudex status --json ──┐
   │                                       ├─ the GUI never reimplements Derive;
   ├──writes──> iudex <subcommand>         │  the state machine stays single-
   │                                       │  sourced in the CLI.
   └──supervises──> tmux pool (agents/shells, via portable-pty + capture-pane)

.iudex/events.jsonl ──(notify watcher)──> "events-changed" doorbell ──> re-read
```

- **Backend** (`src-tauri/src/`): `lib.rs` holds the read/write seam (workspace
  discovery, `iudex_status`, `run_iudex`, workspace `init`, config/prompt and git
  read commands, the events watcher); `tmux.rs` holds the session pool + PTY
  bridge. Git reads (worktree diffs, merge-preflight) shell `git -C <dir>`
  directly — plain plumbing, not state-machine logic, so they stay out of the CLI.
- **Frontend** (`src/`): `App.tsx` (workspace bar + nav + view router + doorbell),
  `views/` (one per view + the shared `DiffViewer`), `lib/` (poll/derive hooks),
  `types.ts` (mirrors the `status --json` contract).
- **Invariant:** writes go through `iudex`, reads through `iudex … --json`,
  `events.jsonl` is a doorbell — so the GUI and CLI can never diverge.
