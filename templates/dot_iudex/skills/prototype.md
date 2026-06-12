# Skill: prototype

**Purpose:** Build a throwaway prototype to answer a design question before committing to it. Two branches: a runnable terminal app for logic/state questions, or (if a web UI is added) multiple layout variations on one route.

## How to use
Tell Claude: "Use prototype to [prototype this idea / sanity-check this state machine / try a few designs for X]"

## Pick a branch

Identify the question being answered:
- **"Does this logic / state model feel right?"** → **Logic prototype** (primary for this repo — it's a Go CLI)
- **"What should this screen look like?"** → **UI prototype** (only if the workspace grows a web frontend)

If the question is ambiguous, default to Logic for anything touching the orchestrator, event machine, or CLI commands.

## Rules for both branches

1. **Throwaway from day one.** Name it so a reader can see it's a prototype: `prototype/task-state/main.go` not `internal/state.go`.
2. **One command to run.** Add a `make prototype-<name>` target or note the `go run ./prototype/<name>` command at the top of the file.
3. **No persistence by default.** State lives in memory. If the question involves `events.jsonl`, use a `t.TempDir()`-style scratch directory, not the real workspace.
4. **Skip the polish.** No tests, no error handling beyond making it runnable, no abstractions.
5. **Surface the state.** After every action, print the full relevant state so the user sees what changed.
6. **Delete or absorb when done.** Answer the question, then either delete or fold the validated decision into production code.

---

## Logic prototype (primary)

Use when the question is about **business logic, state transitions, or data shape** — the kind of thing that looks right on paper but only reveals edge cases when you push it.

### Process

1. **State the question.** Write it as a comment at the top of `prototype/<name>/main.go`. A prototype that answers the wrong question is waste.

2. **Isolate the logic in a pure module.** Put the actual logic behind a small, pure Go interface that could be lifted into the real codebase:
   - **A pure reducer**: `func Apply(state State, action Action) State`
   - **A state machine**: explicit states and transitions (mirrors `events.jsonl` state machine)
   - **Pure functions** over a plain data type

   Keep it pure: no I/O, no `fmt.Print` for control flow. The TUI imports it; nothing flows the other direction.

3. **Build the smallest TUI that exposes the state.** Use Bubble Tea (already a dependency):
   - On every tick, re-render the full frame — don't append scrollback
   - Frame has two parts: (1) current state pretty-printed, (2) keyboard shortcuts at bottom
   - Initialize state as an in-memory struct; dispatch keystrokes to the reducer; re-render after every action

4. **Make it runnable.** Add to `Makefile`:
   ```make
   prototype-NAME:
       go run ./prototype/NAME
   ```

5. **Hand it over.** Give the user the run command. Interesting moments: "wait, that shouldn't be possible" — those are bugs in the *idea*.

6. **Capture the answer.** When done, record what was learned: a `NOTES.md` next to the prototype, an ADR at `docs/adr/NNNN-slug.md`, or in the relevant PRD at `docs/prd/`.

### Anti-patterns
- Don't wire it to the real `events.jsonl` workspace — use in-memory or a scratch dir
- Don't add tests — a prototype that needs tests is no longer a prototype
- Don't generalise — one question, one prototype
- Don't blur the logic module and the TUI — if the reducer references `fmt.Print`, it's not portable

---

## UI prototype (secondary — only if a web frontend exists)

Use when the question is about what a screen should look like. Generate 3 radically different layout variations on a single route, switchable via `?variant=` URL param and a floating bottom bar.

Variants must be **structurally different** — different layout, information hierarchy, primary affordance. Colour-only variations are not a prototype.

Once a variant wins, fold it into production and delete the others. Do NOT leave prototype components in production code.
