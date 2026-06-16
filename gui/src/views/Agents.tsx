import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSessions, sessionLabel } from "../lib/sessions";
import type { Session, Workspace } from "../types";

// A grid of read-only peeks into agent sessions. Agents accumulate — a ticket
// can have several (impl, then QA, …), each a distinct session. Each peek polls
// capture-pane (cheaper than N live attaches, and it sidesteps tmux's
// smallest-client resize war across a grid) and synthesizes a status from three
// cheap signals — iudex has no liveness signal of its own. Clicking a peek hands
// that exact session to the Terminal view for full interaction.
export default function Agents({
  ws,
  onOpenInTerminal,
}: {
  ws: Workspace;
  onOpenInTerminal: (session: string) => void;
}) {
  const { sessions, available } = useSessions();
  const agents = sessions
    .filter((s) => s.kind === "agent")
    .sort(
      (a, b) =>
        (a.ticket ?? "").localeCompare(b.ticket ?? "") ||
        (a.started ?? "").localeCompare(b.started ?? "")
    );

  if (available === false) {
    return (
      <div className="stub">
        <h2>Agents</h2>
        <p>
          tmux isn't on PATH — agent sessions live in the tmux pool. Install it
          with <code>brew install tmux</code> and reopen this view.
        </p>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="stub">
        <h2>Agents</h2>
        <p>
          No agent sessions running. Activate a ticket (Tickets view) to launch
          one into the pool.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="agents-toolbar">
        <span className="muted">
          {agents.length} agent{agents.length === 1 ? "" : "s"}
        </span>
        <button
          className="ghost"
          onClick={() => invoke("clear_finished").catch(() => {})}
          title="dismiss every agent whose process has exited"
        >
          clear finished
        </button>
      </div>
      <div className="agents">
        {agents.map((a) => (
          <AgentPeek
            key={a.name}
            agent={a}
            ticketState={
              a.ticket
                ? ws.tickets.find((t) => t.id === a.ticket)?.state
                : undefined
            }
            onOpen={() => onOpenInTerminal(a.name)}
          />
        ))}
      </div>
    </div>
  );
}

type AgentStatus =
  | "working"
  | "idle"
  | "awaiting-finish"
  | "review-ready"
  | "crashed"
  | "done"
  | "gone";

// Synthesize the agent's status from process liveness (the pane's dead/exit
// state), output activity, and the ticket's state relative to the agent's role.
// The high-value signals are the ones a bare `iudex status` can't show, and they
// name the *right* next action: an impl agent that exited cleanly while its
// ticket is still active is "awaiting-finish" (run finish); a QA agent that
// exited cleanly while pending-qa is "review-ready" (go approve/reject).
function synthStatus(opts: {
  dead: boolean;
  exitCode: number | null;
  role: string | null | undefined;
  ticketState: string | undefined;
  quietMs: number;
}): AgentStatus {
  const { dead, exitCode, role, ticketState, quietMs } = opts;
  // The state in which this role's agent is the one doing the work.
  const expected = role === "qa" ? "pending-qa" : "active";
  // Ticket has moved past the role's phase — this agent is superseded.
  if (ticketState !== expected) return "done";
  if (dead) {
    if (exitCode !== 0) return "crashed";
    return role === "qa" ? "review-ready" : "awaiting-finish";
  }
  return quietMs < 5000 ? "working" : "idle";
}

const STATUS_LABEL: Record<AgentStatus, string> = {
  working: "working",
  idle: "idle",
  "awaiting-finish": "awaiting finish",
  "review-ready": "review ready",
  crashed: "crashed",
  done: "done",
  gone: "gone",
};

function AgentPeek({
  agent,
  ticketState,
  onOpen,
}: {
  agent: Session;
  ticketState: string | undefined;
  onOpen: () => void;
}) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<AgentStatus>("idle");
  const prev = useRef<string>("");
  const lastChange = useRef<number>(Date.now());

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const [out, live] = await Promise.all([
          invoke<string>("capture_pane", { name: agent.name, lines: 200 }),
          invoke<{ dead: boolean; exitCode: number | null }>(
            "session_status",
            { name: agent.name }
          ),
        ]);
        if (!alive) return;
        if (out !== prev.current) {
          prev.current = out;
          lastChange.current = Date.now();
        }
        setText(out);
        setStatus(
          synthStatus({
            dead: live.dead,
            exitCode: live.exitCode,
            role: agent.role,
            ticketState,
            quietMs: Date.now() - lastChange.current,
          })
        );
      } catch {
        if (alive) setStatus("gone");
      }
    };
    tick();
    const h = setInterval(tick, 1500);
    return () => {
      alive = false;
      clearInterval(h);
    };
  }, [agent.name, agent.role, ticketState]);

  const kill = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await invoke("kill_session", { name: agent.name }).catch(() => {});
  };

  // Show the tail of the captured pane — the most recent lines matter most.
  // Trim trailing blank rows tmux pads below the cursor so the peek isn't empty.
  const tail = text.replace(/\s+$/, "").split("\n").slice(-14).join("\n");

  return (
    <section className="peek" onClick={onOpen} title="open full terminal">
      <header className="peek-head">
        <span className="peek-title">{sessionLabel(agent)}</span>
        <span className={`agent-status status-${status}`}>
          {STATUS_LABEL[status]}
        </span>
        <button className="peek-kill" onClick={kill} title="kill session">
          kill
        </button>
      </header>
      <pre className="peek-screen">{tail || "…"}</pre>
    </section>
  );
}
