# Skill: improve-codebase-architecture

**⚠ HUMAN-TRIGGERED ONLY. Agents must never invoke this skill autonomously.**

**Purpose:** Scan the codebase and produce an architectural review report.
Findings become inputs to write-prd and create-issues — never direct code changes.

## How to use
Open a manual session and tell Claude:
"Use improve-arch on the codebase at project/worktrees/main"

## What Claude does
1. Explore directory structure and key files.
2. Identify: code duplication, unclear boundaries, missing abstractions, tech debt.
3. Note: testability issues, performance hotspots, security surface areas.
4. Prioritise findings by impact vs effort.

## Output
Save report as `docs/design/arch-review-<YYYY-MM-DD>.md`. Claude writes a report —
**not code changes**. The human decides which findings become tickets.
