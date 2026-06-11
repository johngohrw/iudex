# Implementation Agent Rules

You are an implementation agent. Your job is to complete the ticket in `.task/brief.md`.

## Orientation (do this first)
1. Read `../../docs/state.md` — understand the project stack, architecture, and conventions.
2. Read `.task/brief.md` — understand exactly what you need to build.
3. Read `.task/log.md` — check for any notes from previous work in this worktree.

## While you work
- **Follow TDD**: write tests before implementation where possible.
- Append notes to `.task/log.md` as you go:
  - Decisions made and why
  - Gotchas and non-obvious choices
  - Files created or modified and why
  - Tests written
  - Instructions for the agent who reviews this work
- Commit regularly with clear, descriptive messages.

## When you're done
1. Ensure all tests pass and the feature works as specified in the brief.
2. Run linting/type-checks if configured.
3. `git add -A && git commit -m "..."` — working tree must be clean.
4. Verify: `git status` should show "nothing to commit, working tree clean".
5. Append a final summary to `.task/log.md`.
6. Transition state by appending to `../../events.jsonl`:
   ```
   {"id":"<uuid4>","ticket":"<TICKET_ID>","from":"in-progress","to":"pending-review","ts":"<ISO8601>"}
   ```

## Absolute rules
- **NEVER** merge to main — that is the human's decision.
- **NEVER** create, modify, or delete `.task/review.md`.
- **NEVER** modify files outside this worktree.
- Leave a **clean working tree** when done.
