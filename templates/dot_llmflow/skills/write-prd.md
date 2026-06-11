# Skill: write-prd

**Purpose:** Produce a well-structured PRD from a grilled idea or requirement. Synthesizes what is already known — does NOT re-interview the user.

## How to use
Tell Claude: "Use write-prd to write a PRD for: [idea or grill-me output]"

## Process

1. Explore `project/worktrees/main` if not already done. Read `docs/glossary.md` (all top-level `*.md` in `docs/`) and respect any ADRs in `docs/adr/` that touch this area. Use the project's vocabulary throughout.

2. Sketch the seams at which the feature will be tested. Prefer existing seams over new ones; use the highest seam possible. Check with the user that these seams match their expectations before continuing.

3. Write the PRD using the template below. Save to `docs/prd/<feature-name>.md`.

## Output format

```markdown
# PRD: <Feature Name>

## Problem Statement
The problem that the user is facing, from the user's perspective.

## Solution
The solution, from the user's perspective.

## User Stories
A numbered list covering all aspects of the feature. Be extensive.

1. As a <actor>, I want <feature>, so that <benefit>.
2. ...

## Implementation Decisions
- Which modules will be built or modified
- Interface changes and behavioral contracts
- Architectural decisions (reference relevant ADRs in docs/adr/)
- State machine transitions in events.jsonl (if applicable)
- New worktree or queue/ interactions (if applicable)

Do NOT include specific file paths or line numbers — they go stale.
Exception: if a prototype produced a snippet encoding a decision more precisely
than prose can (state machine, type shape), inline it and note it came from
a prototype. Trim to the decision-rich parts only.

## Testing Decisions
- What makes a good test for this feature (test external behavior, not internals)
- Which modules will be tested and at which seam
- Prior art in the codebase (similar test patterns to follow)

## Out of Scope
Features explicitly excluded from this PRD.

## Open Questions
Unresolved decisions the implementer must make.

## Further Notes
Context, constraints, or links.
```
