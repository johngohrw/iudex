# iudex

A CLI tool that orchestrates parallel AI coding agents across git worktrees. It manages a queue → implement → QA → human review → merge pipeline, keeping everything file-based and git-native with no runtime dependencies beyond `git`.

## How it works

Each ticket gets its own git worktree. The orchestrator claims tickets from a queue, surfaces terminal commands to spawn agents, and handles the handoff between implementation, QA, and human review. You stay in control — nothing merges to main without your explicit approval.

```
queue/ → [orchestrator claims] → worktree → agent implements
       → QA agent reviews → you approve → iudex merge → main
```

## Install

Requires Go 1.22+.

```bash
go build -o iudex .
```

## Quick start

```bash
# Set up a workspace
iudex init ~/my-workspace

# Create tickets
iudex new-ticket ticket-00001 "Add login page"
iudex new-ticket ticket-00002 "Add dashboard" --deps ticket-00001

# Start the orchestrator + TUI
cd ~/my-workspace
iudex start

# When an agent finishes, hand off to QA
iudex finish ticket-00001

# Review and merge
iudex review ticket-00001
iudex merge ticket-00001
```

## Commands

| Command | Description |
|---------|-------------|
| `iudex init <dir>` | Scaffold a new workspace |
| `iudex start` | Launch TUI and orchestrator |
| `iudex new-ticket <id> [title]` | Add a ticket to the queue |
| `iudex finish <id>` | Hand off: impl → QA, or QA approve → human review |
| `iudex revise <id>` | QA requests revision |
| `iudex review <id>` | Print brief, diff, and QA notes |
| `iudex merge <id>` | Merge to main, archive, remove worktree |
| `iudex reject <id>` | Archive as rejected, return brief to queue |
| `iudex manual <id>` | Take over a ticket manually |
| `iudex status` | Print all ticket states |
| `iudex archive-list` | List completed/rejected tickets |

## Ticket dependencies

Tickets can declare blockers — they won't be claimed until all dependencies are merged:

```bash
iudex new-ticket ticket-00002 "Feature B" --deps ticket-00001
```

## Workspace layout

```
<workspace>/
├── .iudex/config.yml       # max_agents, poll interval, agent command, prompts
├── queue/                  # unclaimed tickets
├── archive/                # completed and rejected tickets
├── events.jsonl            # append-only state log (source of truth)
└── project/worktrees/      # one git worktree per active ticket
```
