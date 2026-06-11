# Skill: create-issues

**Purpose:** Break a PRD into well-scoped, actionable tickets in `queue/`.

## How to use
Tell Claude: "Use create-issues to generate tickets from docs/prd/<name>.md"

## Rules for good tickets
- One clear unit of work per ticket (completable in one agent session).
- Each ticket has: problem statement, acceptance criteria, and relevant context.
- Tickets with dependencies are noted explicitly.
- Prefer smaller tickets over larger ones — easier to review, easier to reject.

## Output
For each ticket, write `queue/task-NNNNN.md`:

```markdown
# task-NNNNN: <title>

_Priority: N/5_

## Problem Statement
<what needs to be done and why>

## Acceptance Criteria
- [ ] ...

## Notes
<context, links, constraints>
```
