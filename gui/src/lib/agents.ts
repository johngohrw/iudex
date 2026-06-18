import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Session, Workspace } from "../types";

export type AgentStatus =
  | "working"
  | "idle"
  | "awaiting-finish"
  | "review-ready"
  | "crashed"
  | "done"
  | "gone";

export const STATUS_LABEL: Record<AgentStatus, string> = {
  working: "working",
  idle: "idle",
  "awaiting-finish": "awaiting finish",
  "review-ready": "review ready",
  crashed: "crashed",
  done: "done",
  gone: "gone",
};

// "Finished" for clear-all-finished: the agent won't do more work — its ticket
// has moved past its role (done) or its process died (crashed).
export function isFinished(s: AgentStatus): boolean {
  return s === "done" || s === "crashed";
}

// Synthesize an agent's status from process liveness (pane dead/exit), output
// activity, and the ticket's state relative to the agent's role. iudex has no
// liveness signal of its own; these are the signals a bare `iudex status` can't
// show, named after the *right* next action.
export function synthStatus(opts: {
  dead: boolean;
  exitCode: number | null;
  role: string | null | undefined;
  ticketState: string | undefined;
  quietMs: number;
}): AgentStatus {
  const { dead, exitCode, role, ticketState, quietMs } = opts;
  // The state in which this role's agent is the one doing the work.
  const expected =
    role === "qa" ? "pending-qa" : role === "resolve" ? "pending-human-qa" : "active";
  // Ticket has moved past the role's phase — this agent is superseded.
  if (ticketState !== expected) return "done";
  if (dead) {
    if (exitCode !== 0) return "crashed";
    return role === "qa" ? "review-ready" : "awaiting-finish";
  }
  return quietMs < 5000 ? "working" : "idle";
}

// Poll every agent's liveness + output activity and project it to a status map
// keyed by session name. Lifted to a hook (rather than per-card) so the parent
// can both render the cards and compute the clear-all-finished set.
export function useAgentStatuses(
  agents: Session[],
  ws: Workspace,
): Record<string, AgentStatus> {
  const [map, setMap] = useState<Record<string, AgentStatus>>({});
  const activity = useRef<Record<string, { prev: string; last: number }>>({});
  const names = agents.map((a) => a.name).join(",");

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const entries = await Promise.all(
        agents.map(async (a) => {
          try {
            const [out, live] = await Promise.all([
              invoke<string>("capture_pane", { name: a.name, lines: 200 }),
              invoke<{ dead: boolean; exitCode: number | null }>("session_status", {
                name: a.name,
              }),
            ]);
            const act = activity.current[a.name] ?? { prev: "", last: Date.now() };
            if (out !== act.prev) {
              act.prev = out;
              act.last = Date.now();
            }
            activity.current[a.name] = act;
            const ticketState = a.ticket
              ? ws.tickets.find((t) => t.id === a.ticket)?.state
              : undefined;
            return [
              a.name,
              synthStatus({
                dead: live.dead,
                exitCode: live.exitCode,
                role: a.role,
                ticketState,
                quietMs: Date.now() - act.last,
              }),
            ] as const;
          } catch {
            return [a.name, "gone" as AgentStatus] as const;
          }
        }),
      );
      if (alive) setMap(Object.fromEntries(entries));
    };
    tick();
    const h = setInterval(tick, 1500);
    return () => {
      alive = false;
      clearInterval(h);
    };
    // `names` stands in for the agent array; `ws` carries the latest ticket states.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [names, ws]);

  return map;
}

// Ticket titles for a set of worktree paths, keyed by path — the Agents card
// labels. Re-runs when the worktree set or `ws` (doorbell) changes.
export function useBriefTitles(worktrees: string[], ws: Workspace): Record<string, string> {
  const [titles, setTitles] = useState<Record<string, string>>({});
  const key = worktrees.join("|");

  useEffect(() => {
    if (worktrees.length === 0) {
      setTitles({});
      return;
    }
    let alive = true;
    invoke<{ worktree: string; title: string }[]>("brief_titles", { worktrees })
      .then((rows) => {
        if (!alive) return;
        const m: Record<string, string> = {};
        for (const r of rows) m[r.worktree] = r.title;
        setTitles(m);
      })
      .catch(() => alive && setTitles({}));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ws]);

  return titles;
}
