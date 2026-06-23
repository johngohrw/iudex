// Mirrors the `iudex status --json` contract. The GUI holds no authoritative
// state of its own; every field here comes from replaying events.jsonl in the
// CLI, surfaced through that one read path.
export interface Ticket {
  id: string;
  state: string;
  deps: string[];
  qaRejects: number;
  ready: boolean;
  blockedBy: string[];
  blocks?: string[];
  hasWorktree: boolean;
  worktree?: string;
}

export interface Workspace {
  mainBranch: string;
  maxActive: number;
  qaRejectLimit: number;
  tickets: Ticket[];
}

// A physical git worktree (from `list_worktrees`), joined on the frontend with
// the tickets that map onto it. Keyed by `path`, so it appears once even if more
// than one ticket references it; the relationship shows as ticket badges.
export interface Worktree {
  path: string;
  branch: string;
  head: string;
  tickets: { id: string; state: string }[];
}

// A changed file in a worktree vs main (from `worktree_changes`).
export interface FileChange {
  path: string;
  status: string; // "A" | "M" | "D" | "R" | "U"
  additions?: number | null;
  deletions?: number | null;
}

// Base vs head content for one file (from `worktree_file_diff`).
export interface FileDiff {
  original: string;
  modified: string;
  language: string;
}

// The `.task/` docs for a ticket (from `worktree_task_docs`).
export interface TaskDocs {
  brief: string;
  log: string;
  review: string;
}

// One Review-rail card (from `rail_status`): a human title plus a coarse merge
// badge, so the rail can be triaged without opening each ticket.
export interface RailCard {
  worktree: string;
  title: string;
  badge: "clean" | "conflicts" | "resolving";
}

// One conflicted file the agent flagged for human judgment (or any still-unmerged
// file, with the agent's reason when it gave one).
export interface FlaggedItem {
  file: string;
  reason: string;
}

// A conflict the agent resolved on its own (informational, from its report).
export interface ResolvedItem {
  file: string;
  note: string;
}

// The state of an in-worktree conflict resolution (from `read_resolution`):
// whether a merge is underway, git's authoritative unmerged set, and the agent's
// triage report joined onto it.
export interface Resolution {
  mergeInProgress: boolean;
  unmerged: string[];
  flagged: FlaggedItem[];
  resolved: ResolvedItem[];
  hasReport: boolean;
}

// One conflicted file's three sides for the merge editor (from
// `read_conflict_file`): `merged` is the working file with conflict markers.
export interface ConflictFile {
  ours: string;
  theirs: string;
  merged: string;
  language: string;
}

// The merge-preflight for a pending-human-qa ticket (from `merge_preflight`):
// predicts whether `iudex human-qa approve` would succeed.
export interface Preflight {
  currentBranch: string;
  onMain: boolean;
  clean: boolean;
  dirtyFiles: string[];
  wouldConflict: boolean;
  conflictFiles: string[];
  mergeInProgress: boolean;
  ready: boolean;
}

// The editable `.iudex/config.yml` fields (from `read_config`/`write_config`).
export interface Config {
  mainBranch: string;
  maxActive: number;
  qaRejectLimit: number;
  agentCommand: string;
  mergeStrategy: string;
  mergeMessageTemplate: string;
  branchPrefix: string;
}

// A session in the unified tmux pool, mirroring the Rust `Session` struct.
export interface Session {
  name: string;
  kind: "agent" | "shell" | "idea";
  ticket: string | null;
  role?: string | null; // agent's role at spawn ("impl" | "qa")
  started?: string | null; // agent spawn time (unix millis string, sortable)
  title: string;
}

// The seven top-level views, in nav order. Dashboard is the default landing.
export type View =
  | "dashboard"
  | "terminal"
  | "tickets"
  | "agents"
  | "worktrees"
  | "review"
  | "settings";

// Per-view status-dot color (DESIGN.md §4). Settings is reached via the top-bar
// gear, not the left rail, so it carries the muted dot but isn't in RAIL_VIEWS.
export const VIEWS: { id: View; label: string; dot: string }[] = [
  { id: "dashboard", label: "Dashboard", dot: "#f4bc41" },
  { id: "terminal", label: "Terminal", dot: "#72f6aa" },
  { id: "tickets", label: "Tickets", dot: "#5bc7d8" },
  { id: "agents", label: "Agents", dot: "#5ccf5c" },
  { id: "worktrees", label: "Worktrees", dot: "#9ea0e0" },
  { id: "review", label: "Review", dot: "#836ddd" },
  { id: "settings", label: "Settings", dot: "#8a8f99" },
];

// The left-nav rail order (Settings lives in the top-bar gear instead).
export const RAIL_VIEWS = VIEWS.filter((v) => v.id !== "settings");
