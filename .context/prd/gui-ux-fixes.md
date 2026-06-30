# GUI UX Fixes — Backlog

> A running list of UX problems found by walking the GUI from the seat of a
> **user driving their own project** through iudex (not a developer critiquing
> the iudex codebase). Each item is a discrete, mostly-independent fix.
>
> Started 2026-06-30, branch `feat/gui-read-path`. Findings + priorities are a
> snapshot of a review session; the numbering keeps the original finding ids so
> conversations stay stable (some ids are intentionally absent — see Decisions).
>
> **Through-line:** the backend model is beautifully consistent (one agent role
> per state, derived truth, detach-not-kill). The *surface* leaks the raw
> mechanics — multiple agents per worktree, kill-on-close, finish-anytime —
> without the guardrails or naming that make those mechanics feel safe. Most
> findings are "the UI exposes a powerful primitive as if it were the routine
> button."

## Status (2026-07-01)

**Done:** P0, P2, and P3 are all cleared, plus the seam refactor everything
hangs off of.

| Item | What landed | Commit |
| ---- | ----------- | ------ |
| #4 | unified `nextAction(ticket, sessions)` helper, consumed by table + detail | `fd115ab` |
| #6 | action-named labels (Activate & start / Start QA / …) — folded into #4 | `fd115ab` |
| #1 | spawn guard: a present agent → "Open agent" instead of a second spawn | `1a5d373` |
| #5 | reject-to-active surfaces "Resume impl" | `1a5d373` |
| #7 | opt-in auto-retire of superseded agents (impl/qa/resolve) | `6b2162b` |
| #8 | idea agents moved into the Agents view; Terminal is pure shells | `d36b35c` |
| #10 | "✓ No predicted conflicts" + calm surprise-conflict note | P3 pass |
| #11 | QA-column tooltip legend (count + reject limit) | P3 pass |
| #12 | compose-modal id framed "will be tN" | P3 pass |
| #13 | post-action nav rule codified in `lib/nav.ts` (already uniform) | P3 pass |
| Decision #2 | resolved by #8 — Terminal only ever holds shells now | `d36b35c` |

**Remaining:** only the #3 decision (does `finish` leave the GUI?). One
sub-thread of Decision #2 is still open (should plain shells survive a GUI
restart?).

---

## Highest-leverage first move — DONE

**#4** was the root of #1, #5, and #6 and the seam for the agent-presence guard.
Built first (`fd115ab`), then the safety layered on top (#1/#5 in `1a5d373`),
exactly as planned.

---

## P0 — Prevent lost work / wasted spend / corrupted state

### #1 — Spawn must be idempotent per (ticket, role) — ✅ DONE (`1a5d373`)
**Problem:** Every spawn creates a new tmux session; they accumulate, none
replaces the prior. On an `active` ticket the UI keeps offering "Spawn agent",
so a second click yields **two impl agents editing the same worktree at once**,
with no warning.
**Shipped:** `nextAction` is presence-based — when a session already exists for
the ticket's role, the primary becomes **"Open agent"** (jumps to it via
`liveAgentFor`, most-recent-by-`started`); applies to `active` (impl) and
`pending-qa` (qa). No "Spawn another" path — kill the existing agent to flip the
button back. (Liveness is presence-based, not status-derived; a lingering dead
session is handled by opening then killing it.)

## P1 — Fix wrong-action and stranding traps

### #4 — Single-source "the next action" (table and detail must agree) — ✅ DONE (`fd115ab`)
**Problem:** The Tickets *table* row and the *detail panel* footer maintained two
separate switch statements, so the same ticket showed different primary buttons
(e.g. active → table "Finish" vs panel "Spawn agent").
**Shipped:** one pure `nextAction(ticket, sessions)` in `lib/ticketActions.ts`
returns a declarative `{intent, label, variant}`; each view keeps a thin
`runIntent` mapping intent → its own handler (busy/nav stay per-view). Fixed the
active / pending-qa / pending-human-qa divergences. Finish left the table row and
the panel primary, surviving only in the panel overflow (Decision #3 lean).

### #5 — Reject-to-active needs a real "resume" path — ✅ DONE (`1a5d373`)
**Problem:** A QA/human reject drops the ticket back to `active` with feedback in
`review.md`, but the obvious next step (re-run impl against the feedback) had no
button — the table just said "Finish".
**Shipped:** an `active` ticket with no live impl agent surfaces **"Resume
impl"** (spawns the impl agent), closing the loop the reject opens.

### #6 — Disambiguate the "Spawn Agent" label by what it does — ✅ DONE (`fd115ab`)
**Problem:** One label, two meanings — "Spawn Agent" meant *activate + worktree +
impl agent* on a queued ticket but *launch a QA reviewer* on pending-qa.
**Shipped:** labels by action — queued → **"Activate & start"**, pending-qa →
**"Start QA"**, active+no-agent → **"Resume impl"**, active+agent → **"Open
agent"**. Fell out of #4.

## P2 — Reduce clutter and surprise

### #7 — Auto-retire finished agents — ✅ DONE (`6b2162b`)
**Problem:** When a ticket moves past a role's phase its agent reads "done" but
the tmux session keeps running. Done sessions pile up in the rail; clearing them
was a buried manual step.
**Shipped:** an **opt-in** "Auto-Retire" toggle (third switch beside
auto-activate/auto-QA, off by default). While on, an effect kills any agent whose
ticket has left its role's phase (`AGENT_PHASE = impl→active, qa→pending-qa,
resolve→pending-human-qa`), derived from ws+sessions on the doorbell with no tmux
poll — so it leaves **crashed** agents (ticket never moved) and **flagged/working
resolvers** (still pending-human-qa) alone by construction. The manual rail
"Clear" stays as the fallback for crashed/resolved.

### #8 — One home for everything that's running — ✅ DONE (`d36b35c`)
**Problem:** `idea`-shaping agents were `kind: "idea"`, so they appeared as tabs
in the **Terminal** view, while impl/qa/resolve agents lived in **Agents**.
**Shipped:** idea agents now render in **Agents** (filter relaxed to include
`idea`, an "idea" role chip, the skill shown as the title, pure-liveness
`ideaStatus`). The idea launcher routes to Agents and seeds the session
optimistically. Terminal's restore filter tightened to `kind === "shell"`, so it
is now pure shells (also the resolution of Decision #2). Auto-retire excludes
idea agents — they clear via the manual rail "Clear".

## P3 — Honesty & polish

### #10 — Soften the merge guarantee — ✅ DONE (P3 pass)
**Problem:** Review showed a confident "✓ ready to merge" (Approve tooltip: "merge
into main"), but Approve re-runs the real merge and can surprise-conflict — so a
green button sometimes errored.
**Shipped:** "✓ Ready to merge — no conflicts." → **"✓ No predicted conflicts."**
(and the muted line now says files *would* change, predicted via git merge-tree).
On the surprise-conflict path Approve re-runs the preflight and shows a calm
**"main moved since the preflight — re-checking for conflicts. See the Conflicts
tab."** instead of git's raw CONFLICT dump; non-merge errors still surface
verbatim.

### #11 — Label the QA column — ✅ DONE (P3 pass)
**Problem:** A bare number that reddens at >0, with no explanation.
**Shipped:** a `qaLegend` tooltip on the **QA** header and each cell — "QA
rejections — times QA bounced this ticket back (N → ticket fails)", or
"(unlimited)" when `qa_reject_limit <= 0`.

### #12 — Frame the compose ticket id as provisional — ✅ DONE (P3 pass)
**Problem:** The modal title said "New ticket (t5)" but the id is only claimed at
Create; if anything queues in between it silently becomes t6.
**Shipped:** the title now reads **"New ticket — will be t5"**, framing the id as
provisional.

### #13 — Consistent post-action navigation — ✅ DONE (P3 pass)
**Problem:** Activate → jumps to Agents; Finish → stays on Tickets; Spawn QA →
jumps to Agents. No rule, so the user got randomly teleported.
**Shipped:** the #4/#8 refactors already made it uniform — spawning a session
jumps to its cockpit (agents → Agents, shells → Terminal), state-only transitions
stay put, explicit "Go to X" buttons navigate as labelled. The rule is now
codified as an invariant in `lib/nav.ts` so new call sites follow it; the one
deliberate exception (the merge resolver stays in Review — the Conflicts tab is
its cockpit, with "Watch" to reach the console) is documented at the spawn site.

---

## Decisions (findings reframed, not implemented as originally proposed)

### #2 — Terminals stay dumb terminals (kill = kill) — ✅ RESOLVED via #8
**Original finding:** Closing a Terminal tab terminates a live session, and an
`idea`/`resolve` agent could be a tab, so middle-clicking it mid-run killed the
work. Original proposal was "make close detach, not kill."
**Decision (user):** Reject the detach proposal. Terminals are **simply
terminals** — close means kill, full stop.
**Resolved:** the real fix shipped in #8 — agents no longer live in Terminal
(idea routed to Agents; Terminal restores only `kind === "shell"`). Terminal now
only ever holds plain shells, where kill-on-close is the desired behavior.
**Open question (still open):** Should shells still survive a GUI restart (the
tmux pool's detach-on-app-close), or is even that "magic" we want gone for
terminals?

### #3 — Reconsider exposing `finish` in the GUI at all — 🟡 LEAN TAKEN, decision open
**Original finding:** `finish` auto-commits WIP, so firing it mid-edit corrupts
the handoff; it was also treated inconsistently (table primary button vs buried
in the detail ⋮ menu). Original proposal was "guard finish with a confirm."
**Decision (user lean):** Question whether `finish` belongs in the GUI surface at
all. **Ideally the impl agent runs `iudex finish` itself** from the worktree when
it's done — the human shouldn't be clicking it.
**Progress:** #4 already removed Finish from the table row and the panel primary;
it survives only in the panel ⋮ overflow as a manual escape hatch. Separately,
the impl prompt now instructs the agent to run `iudex finish t<N>` itself
(`98e196e`).
**Open question:** Is there any case where a human *must* finish manually (e.g. a
human-driven ticket with no agent), and if so does the ⋮ escape hatch suffice or
should `finish` leave the GUI entirely?
