---
name: to-prd
description: Turn the current conversation context into a PRD and write it to .context/prd/ so it can be sliced into iudex tickets. Use when the user wants to create a PRD from the current context.
---

This skill takes the current conversation context and codebase understanding and produces a PRD. Do NOT interview the user — just synthesize what you already know. (If the idea still needs hardening, run **grill-me** or **grill-with-docs** first.)

## Where the PRD goes

PRDs are tracked project documentation, written to `.context/prd/<slug>.md` (kebab-case slug derived from the feature name, e.g. `.context/prd/agent-spawn-templates.md`). Create `.context/prd/` lazily if it doesn't exist.

`.context/` is committed (unlike the gitignored `.iudex/`), so the PRD travels into iudex ticket worktrees and an impl or QA agent can read the originating spec. Keep PRDs in the `prd/` subfolder — every top-level `*.md` directly in `.context/` is read as domain glossary, so a PRD must never sit at the top level.

## Process

1. Explore the repo to understand the current state of the codebase, if you haven't already. Read the domain glossary — every top-level `*.md` in `.context/` — and use its vocabulary throughout the PRD. Respect any ADRs in `.context/adr/` that touch the area you're working in.

2. Sketch out the seams at which you're going to test the feature. Existing seams should be preferred to new ones. Use the highest seam possible. If new seams are needed, propose them at the highest point you can.

   Check with the user that these seams match their expectations.

3. Write the PRD using the template below to `.context/prd/<slug>.md`.

4. Tell the user the PRD path and that the next step is **to-issues** — it slices this PRD into independently-grabbable iudex tickets and registers them in the queue.

<prd-template>

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each user story should be in the format of:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

This list of user stories should be extremely extensive and cover all aspects of the feature.

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.

Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it within the relevant decision and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.

## Testing Decisions

A list of testing decisions that were made. Include:

- A description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests (i.e. similar types of tests in the codebase)

## Out of Scope

A description of the things that are out of scope for this PRD.

## Further Notes

Any further notes about the feature.

</prd-template>
