# Skill: write-a-skill

**Purpose:** Create new skills for this workspace with proper structure and clear triggers.

## How to use
Tell Claude: "Use write-a-skill to create a skill for: [task/domain]"

## Process

1. **Gather requirements** — ask the user:
   - What task or domain does the skill cover?
   - What specific use cases should it handle?
   - Any reference materials or workflow steps to include?

2. **Draft the skill** — write a `.md` file in `.llmflow/skills/`. If the content exceeds ~150 lines, split into a main file and a `<skill-name>-reference.md`.

3. **Review with user** — present the draft and ask:
   - Does this cover your use cases?
   - Anything missing or unclear?
   - Should any section be more or less detailed?

## Skill file format

Skills in this workspace are plain markdown files at `.llmflow/skills/<skill-name>.md`.

```markdown
# Skill: <skill-name>

**Purpose:** One sentence. What the skill does and when to use it.

## How to use
Tell Claude: "Use <skill-name> to [do the thing]"

## What Claude does
Steps Claude follows. Use numbered lists for ordered processes, bullets for rules.

## Output
Where artifacts are saved (e.g. queue/, docs/prd/, docs/design/).
```

## Description requirements

The first paragraph (Purpose + How to use) is what the agent sees when deciding which skill to load. Make it specific enough to distinguish this skill from others.

- First sentence: what it does
- Second sentence: when to trigger it (specific keywords, contexts)

Good: "Produce a PRD from a grilled idea or requirement. Use when the user has finished a grill-me session and wants to write it up."

Bad: "Helps with planning."

## When to split files

Split into a main file and `<name>-reference.md` when:
- Main file would exceed 150 lines
- Content has distinct areas (workflow vs detailed reference)
- Advanced sections are rarely needed during normal use

## Review checklist

After drafting, verify:
- [ ] Purpose line is specific enough to distinguish from other skills
- [ ] Output section says exactly where files are saved
- [ ] References to workspace paths are correct (`queue/`, `docs/prd/`, etc.)
- [ ] No time-sensitive information
- [ ] Consistent terminology with `docs/glossary.md`
