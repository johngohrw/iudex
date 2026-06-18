# PRD — iudex GUI Client

> A native cross-platform desktop GUI that drives the existing `iudex` CLI, the way a git client drives `git`. It does not replace the CLI or reimplement its state machine; it observes `events.jsonl`, shells every mutation through `iudex`, and adds the things a CLI cannot give: live agent supervision, glanceable triage, and visual review.
>
> This PRD was hardened through a `grill-me` session (13 resolved decisions). It describes a **separate project** that depends on iudex; the only change it requires *inside* this repo is a machine-readable read path (`iudex status --json`).

## Implementation status

_Updated 2026-06-18. Built on branch `feat/gui-read-path` (off `main`, not yet merged). Code lives in `gui/`; per-commit detail is in the git history._

All seven views are implemented and verified live:

| View | Status | Notes |
|------|--------|-------|
| Read-path spine | ✅ | `iudex status --json` (the one upstream change, landed) + the `events.jsonl` doorbell. |
| Dashboard | ✅ | Triage piles; **auto-activate toggle not yet built**. |
| Terminal | ✅ | tmux pool via `portable-pty` + xterm.js; survives view switches. |
| Tickets | ✅ | Reactive table + state-aware actions + front-of-funnel launchers (compose / shape-an-idea). **Dep-DAG toggle and ticket-detail panel not yet built.** |
| Agents | ✅ | `capture-pane` peeks + synthesized status; multiple agents per ticket. |
| Worktrees | ✅ | Read-only Monaco diff (two-dot vs main) + escape hatches; rail keyed on physical worktrees. |
| Review | ✅ | brief/log/QA tabs + three-dot diff via the shared `DiffViewer`; preflighted approve & merge predicts conflicts with `git merge-tree` and offers one-click Begin-resolution. |
| Settings | ✅ | General / Prompts subtabs; surgical `config.yml` writes preserve comments. |

Plus: a header that offers to `iudex init` a non-workspace folder.

**Not yet built (the lighter remaining items):** Dashboard **auto-activate** toggle, **ticket-detail panel**, the Tickets **dependency-DAG** toggle, and a **recent-projects** launcher.

**Deliberate departures from this PRD, decided during the build:** agent peeks **poll `capture-pane`** rather than a live `-r` attach (dodges tmux's smallest-client resize war across a grid); Worktrees uses **two-dot** diff (shows uncommitted agent edits) while Review uses **three-dot** (what the ticket authored); merge-conflicts are **predicted and routed**, not resolved in-app (Monaco stays read-only), beyond an opt-in "Begin resolution" that runs `git merge` in the worktree.

## Problem Statement

iudex is deliberately a pure, command-driven CLI with no daemon, no TUI, and no process launching — every state transition is a command a human runs, and the human is the scheduler. That purity is the right call for the CLI, but it pushes real cognitive load onto the operator:

- **Nothing tells me what needs me right now.** Tickets whose deps just cleared, agents that crashed or stalled, agents that finished but haven't been `finish`ed, items waiting on human review — all of it is invisible until I run `iudex status` and read carefully. Across many tickets this is constant manual polling.
- **I can't see my agents.** iudex prints a spawn command and walks away; whatever the agent is doing lives in a terminal I opened myself, with no consolidated view of "are my five agents healthy?"
- **Reviewing is clumsy.** Approving a ticket means mentally stitching together a diff, the QA agent's `review.md`, and the ticket brief across separate commands and panes — for the single most irreversible action in the pipeline (the merge to `main`), which can also fail at the worst moment if my root worktree happens to be dirty.
- **Context-switching is expensive.** Browsing what an agent did, jumping into its session, opening the worktree, and checking the diff are four different tools and several `cd`s.

The operator wants a cockpit, not a command reference.

## Solution

A **stateless Tauri desktop app** (Rust backend, web frontend) scoped to a single iudex workspace per window. It rides two live substrates — **tmux** (agent sessions) and **`events.jsonl`** (ticket truth) — and treats both as the source of truth: it **writes** by shelling out to the `iudex` CLI and **reads** derived state via `iudex status --json`, never reimplementing the state machine. On top of that it adds a process-supervision and triage layer the CLI consciously omitted.

Seven top-level views behind a top navigation bar:

1. **Dashboard** (default landing) — a light, glanceable router answering "what needs me?": tickets ready to activate, agents needing attention (crashed / idle / awaiting-finish), items pending human review, failed tickets. Every item is one click to its destination. Surfaces an opt-in **auto-activate** toggle for the one mechanical transition safe to automate.
2. **Terminal** — VS Code/cmux-style tabbed terminal sessions, each backed by a tmux session in a unified pool. Includes ad-hoc shells and the interactive, full-size view of any agent.
3. **Tickets** — a searchable, filterable table of tickets, with a toggle into a **dependency-DAG graph** view (nodes colored by state, edges = deps). Includes a thin native "compose ticket" form and a "shape this idea" action that spawns a skill-preloaded agent.
4. **Agents** — a grid of read-only "peeks" into each live agent session, each with a mini status panel (synthesized heuristic status) and an actions dropdown (focus full terminal, kill, restart, open worktree). Clicking a peek focuses that agent's tab in Terminal.
5. **Worktrees** — read-only, code-editor-style inspection of any ticket worktree (file tree + Monaco read-only + diff), with escape hatches to open the worktree in the user's real editor or a shell rooted there.
6. **Review** — a heavy, focused deep-review workspace for `pending-human-qa` items: brief + QA agent's `review.md` + verdict + Fork-style diff, with the iudex human-qa actions (approve / reject with reason). Approve is preflighted so the merge only fires when guaranteed to succeed.
7. **Settings** — edit `config.yml` fields and the prompt templates.

Plus two cross-cutting surfaces reachable from multiple views: a **diff viewer** (minimalist, Fork-style, three-dot vs `main_branch`) and a **ticket detail panel** (a side/floating panel over the Tickets view).

## User Stories

### Workspace & navigation

1. As an operator, I want to open an iudex workspace by pointing the app at a project directory, so that the GUI scopes itself to that one `.iudex/`.
2. As an operator, I want a recent-projects launcher, so that I can reopen a workspace without re-navigating to it.
3. As an operator, I want to open multiple workspaces in separate windows, so that each project is fully independent.
4. As an operator, I want a top navigation bar with seven views, so that I can switch context with one click.
5. As an operator, I want the Dashboard to be the default landing view, so that I see what needs me the moment the app opens.
6. As an operator, I want the GUI to reflect changes made by the `iudex` CLI in my embedded terminal within a second, so that the GUI and CLI never appear out of sync.

### Dashboard / triage

7. As an operator, I want to see all tickets ready to activate (deps done, under `max_active`), so that I know what work I can start now.
8. As an operator, I want to see agents needing attention (crashed, idle, or awaiting-finish), so that I can intervene before time is wasted.
9. As an operator, I want to see all items pending human review, so that I know what's waiting on my judgment.
10. As an operator, I want to see failed tickets needing a retry decision, so that nothing silently dies.
11. As an operator, I want each dashboard item to be one click to its destination view, so that triage flows straight into action.
12. As an operator, I want an opt-in "auto-activate ready tickets" toggle, so that I can remove the mechanical toil of activation without losing oversight of the judgment gates.
13. As an operator, I want the dashboard to warn me when a pending-review item's merge would be blocked by a dirty root worktree, so that I can fix it before I sit down to review.

### Terminal & sessions

14. As an operator, I want tabbed terminal sessions, so that I can run several shells and agents side by side.
15. As an operator, I want to open a fresh ad-hoc shell tab, so that I can run arbitrary commands (including `iudex` itself) inside the workspace.
16. As an operator, I want agent sessions and my own shells to live in one unified pool distinguished by a tag, so that there is one terminal system, not two.
17. As an operator, I want my agent sessions to survive closing and reopening the GUI, so that I never lose an hour of in-flight agent work to a window close or crash.
18. As an operator, I want full scrollback when I reattach to a session, so that I can see what happened while the GUI was closed.

### Agent launch & supervision

19. As an operator, I want clicking "Activate" on a queued ticket to run the impl spawn command into a managed session, so that I don't have to copy-paste it myself.
20. As an operator, I want the GUI to own each agent's process lifecycle, so that I can monitor, kill, and restart it from the UI.
21. As an operator, I want a grid of read-only peeks into all live agent sessions, so that I can monitor many agents at a glance without risking a stray keystroke landing in the wrong one.
22. As an operator, I want each agent peek to show a synthesized status (working / idle / crashed / awaiting-finish / done), so that I can tell at a glance which agents are healthy.
23. As an operator, I want the status to be honest about uncertainty (e.g. "idle 4m" rather than a confident "stuck"), so that I'm not misled by a heuristic.
24. As an operator, I want to click an agent peek to jump straight to its full interactive terminal, so that when I spot a problem I'm one gesture from fixing it.
25. As an operator, I want an actions dropdown under each agent (focus, kill, restart, open worktree), so that I can act without leaving the grid.
26. As an operator, I want to be warned when an agent has exited but its ticket is still `active` (awaiting-finish), so that I remember to run `iudex finish`.

### Tickets, authoring & dependencies

27. As an operator, I want a searchable, filterable table of all tickets, so that I can find any ticket fast.
28. As an operator, I want each ticket row to show its state and ready/blocked status, so that I understand where it sits in the pipeline.
29. As an operator, I want to toggle the Tickets view into a dependency-graph (DAG) view, so that I can see what blocks what and what unblocks when a ticket lands.
30. As an operator, I want to click a ticket to open a detail panel from the side, so that I can read its brief, log, state, and deps without leaving the table.
31. As an operator, I want a thin native "compose ticket" form (brief + dep picker) that writes the brief and runs `iudex queue`, so that jotting a quick manual ticket is fast.
32. As an operator, I want a "shape this idea" action that spawns an agent preloaded with the relevant work-shaping skill, so that the GUI launches the funnel without reimplementing it.
33. As an operator, I want newly-queued tickets (whether created by my compose form or by a spawned `to-issues` agent) to appear automatically, so that the GUI stays the single window I watch.

### Worktrees

34. As an operator, I want to browse any ticket worktree's files in a read-only editor layout, so that I can inspect what the agent did.
35. As an operator, I want to freely switch which worktree I'm inspecting, so that I can compare across tickets.
36. As an operator, I want to open the diff viewer from the worktree view, so that I can see the change vs `main`.
37. As an operator, I want a one-click "open in my editor" escape hatch, so that when I spot a fix I can edit it in the tool I already use.
38. As an operator, I want a one-click "open a shell here" escape hatch rooted in the worktree, so that I can run commands against it without manual `cd`.

### Diff viewer

39. As an operator, I want a minimalist Fork-style diff viewer, so that reviewing changes is pleasant.
40. As an operator, I want the diff to be the ticket's change vs `main_branch` (three-dot), so that I see exactly what would merge.
41. As an operator, I want to launch the diff viewer from the worktree view and from the review view, so that it's available wherever I'm inspecting a change.

### Review & merge

42. As a reviewer, I want a backlog of all items pending human review, so that I can work through them.
43. As a reviewer, I want each item to show the ticket brief, the QA agent's review, and its verdict, so that I have full context for my decision.
44. As a reviewer, I want to launch the diff viewer from a review item, so that I can inspect the actual change.
45. As a reviewer, I want to approve or reject (with a reason) from the review view, so that I can drive the iudex human-qa gate without switching tools.
46. As a reviewer, I want the GUI to preflight the root worktree before enabling "Approve & Merge," so that the merge never fails at the click.
47. As a reviewer, I want clear one-click remedies when the root worktree is blocking the merge (stash, switch to `main_branch`, commit), so that I stay in control while unblocking it.
48. As a reviewer, I want the approve action to only fire when the merge is guaranteed to succeed, so that the most irreversible step in the pipeline is also the safest click.

### Settings

49. As an operator, I want to edit `config.yml` fields (max_active, qa_reject_limit, agent_command, merge_strategy, merge_message_template, branch_prefix), so that I can tune the workspace from the GUI.
50. As an operator, I want to edit the impl and review prompt templates, so that I can shape how agents are spawned.

## Implementation Decisions

### Stack & shell

- **Tauri** (Rust backend, web frontend). Cross-platform (macOS + Linux). The frontend uses **xterm.js** for terminals and **Monaco** (read-only) for the worktree file preview and the diff viewer. Chosen because the three heaviest views (terminal, worktree, diff) lean on components the web stack owns outright, while the Rust backend is a natural fit for the real work: process supervision and filesystem reactivity.
- **One workspace per window.** Each window's backend is scoped to exactly one `.iudex/`, discovered by walking up from the chosen directory (mirroring how iudex's `workspace.Find` and git locate their root). A recent-projects launcher and independent multi-window support cover switching; there is no in-window multi-repo aggregator.

### The CLI seam (write path)

- **Every state mutation shells out to the `iudex` binary** (`queue`, `activate`, `finish`, `qa`, `human-qa`, `retry`, `remove`). The GUI never reimplements the state machine. This is the core "git client uses git" principle and the guarantee that GUI and CLI cannot diverge.

### The read path (requires an upstream change to iudex)

- The GUI **reads derived ticket state via a new machine-readable mode on the CLI** — `iudex status --json` (and likely a fuller `iudex export --json` for archive/event history). This keeps the state machine single-sourced in the CLI while giving the GUI stable structured data. **This is the one change this project requires inside the iudex repo, and it should land first.**
- The **`.iudex/events.jsonl` file watcher is the change trigger ("doorbell"), not the data source.** On any change the GUI re-invokes `iudex status --json` to get the truth. The GUI holds no authoritative ticket state of its own.
- Rationale for *not* reimplementing `Derive` in Rust: it would create a second implementation of the replay rules (state, deps, qa-reject counter) that silently drifts the day iudex changes a rule. Go↔Rust can't share the implementation, so reimplementation is genuinely risky here.

### Agent launch & process supervision

- The GUI is a **full launcher and supervisor.** Activating/finishing a ticket runs the spawn command iudex prints into a managed session; the GUI owns that process's lifecycle (start, kill, restart, observe exit). This is the deliberate philosophical bridge: iudex's "prints, never execs" rule keeps the *CLI* agent-agnostic and dependency-free; a GUI *client* owning processes no more violates that than a git GUI running `git` violates git. The CLI stays pure.
- **Persistence is tmux-backed.** Agents are spawned inside tmux sessions (fallback to direct `portable-pty` children when tmux is absent); xterm.js attaches to them. Sessions survive GUI restart with scrollback intact, and tmux's read-only attach (`-r`) gives the agents-grid peeks for free. tmux becomes the persistence layer the stateless GUI itself lacks — the GUI rides tmux + `events.jsonl` and stores nothing authoritative.

### Unified session pool

- **One tmux-session pool**, each session `kind`-tagged (`agent` vs `shell`). The Agents view filters to `kind=agent` and renders each as a small read-only attached xterm; the Terminal view shows all tabs and is the interactive, full-size surface. One agent = one tmux session = the single source fanned out to both a read-only peek and an interactive tab. Free shells are sessions with no ticket attached. "Click peek → focus full terminal" is the core gesture.

### Synthesized agent status

- iudex has **no liveness signal** — `events.jsonl` only changes on an `iudex` command, so working / crashed / idle-waiting / finished-but-not-`finish`ed agents all read identically as `active`. The GUI therefore **synthesizes status from three cheap signals**: ticket state (`iudex status --json`), process liveness (the tmux pane's PID and exit code), and **output activity** (timestamp of last PTY byte). Derived statuses: `working` (alive + recent output), `idle/waiting` (alive + silent ≥ N seconds), `crashed` (exited non-zero, ticket still `active`), `awaiting-finish` (exited zero, ticket still `active`), `done` (ticket advanced).
- Status is **presented as a heuristic** (durations, not verdicts). Structured agent-cooperation (a wrapper emitting precise status) is explicitly an *optional future layer*, never required — requiring it would forfeit iudex's agent-agnosticism.

### Automation policy

- **Surface-and-one-click everywhere**, with exactly **one opt-in automation: auto-activate** ready tickets (deps done + under `max_active` — a purely mechanical, judgment-free transition). All judgment gates — `finish`, `qa`, `human-qa` — stay human. Auto-`finish` is explicitly rejected: "agent exited zero" does **not** mean the work is correct or complete, so auto-advancing there would ship garbage into QA.

### Navigation & views

- **Seven top-level views:** Dashboard · Terminal · Tickets · Agents · Worktrees · Review · Settings. **Dashboard and Review are kept distinct:** Dashboard is a *light glanceable router* (counts, one-line items, jump links) that must stay fast; Review is a *heavy focused workspace* (diff + verdict + approve/reject) where the operator spends real minutes. Folding Review into the Dashboard would bloat the glanceable screen with the app's heaviest UI.
- **Ticket detail** is a side/floating panel over the Tickets view, not a nav item. The **dependency DAG** is a toggle *mode* inside Tickets, not its own nav slot (overview duty belongs to the Dashboard). The **diff viewer** is a shared surface launched from Worktrees and Review, not a nav item.

### Front-of-funnel

- The GUI is an **operations console over the queue→merge pipeline.** It does **not** reimplement the pre-queue work-shaping funnel (grill / to-prd / to-issues), which is deliberately skill- and agent-driven and one-directional (skills call the CLI; the CLI knows nothing of skills). Instead the GUI offers (a) a thin native compose form (`write tN.md` + `iudex queue`) for trivial manual tickets, and (b) a "shape this idea" action that **spawns an agent preloaded with the relevant skill** into the unified pool. The GUI orchestrates the funnel by launching agents and then observes the resulting tickets via the `events.jsonl` watcher; the one-directional coupling stays intact.

### Merge safety (Review)

- **`human-qa approve` is preflighted.** Because the merge runs in the repo-root worktree and iudex refuses unless root is on `main_branch` and clean (git forbids `main` checked out in two worktrees), the GUI inspects root state via git *before enabling the approve button* and, when blocked, presents the specific blockers with explicit, user-approved one-click remedies (stash / switch to `main_branch` / commit). The merge only fires when preflight is green, so the most irreversible click in the app is also guaranteed to succeed. The GUI never silently mutates the root worktree.

### Diff source

- Diffs are the ticket's change vs `main_branch`, **three-dot**, matching what iudex already computes (`git.Diff`). The GUI reads diffs directly via git (it already has git-read capability for the merge preflight).

## Testing Decisions

A good test asserts **external behavior at the highest available seam**, not implementation details — consistent with iudex's own `main_test.go`, which builds the binary and drives the pipeline through the CLI rather than poking internals.

- **The `iudex … --json` contract (in this repo).** The upstream addition is tested at the CLI seam exactly like iudex's existing `main_test.go`: build the binary with a hermetic git config, drive the pipeline in a temp repo, and assert the JSON output's *shape and values* after each transition (states, deps, ready/blocked, qa-reject counter). This is the one piece that lands inside iudex and the one with existing prior art to follow.
- **GUI backend (Rust).** Test the seams the backend owns, with the `iudex` binary and tmux as real collaborators where practical:
  - *CLI adapter* — given a fixture workspace, invoking the mutation/read wrappers produces the expected `iudex` calls and parses `--json` output into the backend's view model. Prefer driving a real temp workspace over mocking the binary.
  - *Status synthesizer* — a pure function over (ticket-state, process-alive, exit-code, last-output-timestamp) → derived status. This is the highest-value pure unit; table-test every combination, including the boundary cases (`crashed` vs `awaiting-finish`, the idle threshold).
  - *Merge preflight* — given a root worktree in known git states (clean-on-main, dirty, wrong-branch), the preflight reports the correct blockers and remedies. Drive against real temp git repos.
  - *Reactivity* — touching `events.jsonl` triggers a re-read and the view model updates. Assert the observable update, not the watcher internals.
- **Frontend.** Keep logic thin; test view-model→render mapping for the status-dependent UI (agent peek badges, dashboard sections, the preflight-gated approve button enabled/disabled). Avoid asserting on terminal pixel output — xterm.js and Monaco are trusted third-party components.
- **Out of automated scope:** the visual fidelity of xterm.js/Monaco rendering and tmux attach behavior are validated manually.

## Out of Scope

- **In-app merge-conflict resolution.** A conflicting `human-qa approve` aborts (iudex restores state); the GUI surfaces it and the user resolves manually — consistent with iudex's own non-goal.
- **Multi-repo aggregation.** One workspace per window; no cross-repo unified dashboard/agent pool. Possible additive over-layer later, not a v1 rework.
- **A structured agent-cooperation protocol.** Status stays a heuristic; a wrapper that emits precise agent status is an optional future layer, never required.
- **A full code editor in the worktree view.** Read-only inspection only; real editing is delegated to the user's editor via an escape hatch. No save/dirty-state/LSP.
- **Remote / multi-machine coordination.** iudex state is local-only; the GUI is local-only.
- **Reimplementing the work-shaping funnel** (grill / to-prd / to-issues) as native UI. The GUI launches the skills; it does not rebuild them.
- **Any automation past auto-activate.** No auto-finish, auto-QA, or auto-merge.
- **Reimplementing iudex's state machine / event replay** in the GUI. All derived state comes from the CLI.

## Further Notes

- **Sequencing.** The single upstream dependency — `iudex status --json` (and likely `export --json`) — should land in the iudex repo *first*, as its own ticket(s), before the GUI's read path can be built. Everything else lives entirely in the separate GUI project. A natural slice order: (1) `--json` read path in iudex → (2) Tauri shell + workspace discovery + recent-projects → (3) CLI adapter + `events.jsonl` watcher + view model → (4) tmux session pool + unified terminal/agents → (5) launcher/supervisor + status synthesizer → (6) Tickets (+ compose, + DAG) → (7) Worktrees + diff viewer → (8) Review + merge preflight → (9) Dashboard + auto-activate → (10) Settings.
- **Design lineage.** The closest reference points are VS Code (xterm.js + Monaco + tmux-free direct PTY) and cmux (tmux-backed persistent agent sessions). This design borrows VS Code's component choices and cmux's persistence model.
- **Why the GUI is allowed to do what the CLI won't.** iudex's non-goals (no daemon, no launching, no automation, no liveness) are constraints that keep the *CLI* pure, file-based, and agent-agnostic. The GUI is explicitly the layer where a human's hands and eyes live: it launches, supervises, synthesizes liveness, and triages — while still deferring every authoritative state decision to the CLI. The boundary is precise: the GUI may *act* and *observe*, but the CLI alone *decides*.
- **Next step:** run **to-issues** to slice this PRD into independently-grabbable iudex tickets and register them in the queue (the upstream `--json` work as the first, dependency-free slice; the GUI slices depend on it).
