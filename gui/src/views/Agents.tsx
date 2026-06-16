import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSessions } from "../lib/sessions";
import type { Session, Workspace } from "../types";

// A grid of read-only peeks into agent sessions. Each peek polls capture-pane
// (cheaper than N live attaches, and it sidesteps tmux's smallest-client resize
// war across a grid) and synthesizes a status from three cheap signals — iudex
// has no liveness signal of its own. Clicking a peek hands the session to the
// Terminal view for full interaction.
export default function Agents({
  ws,
  onOpenInTerminal,
}: {
  ws: Workspace;
  onOpenInTerminal: (session: string) => void;
}) {
  const { sessions, available } = useSessions();
  const agents = sessions.filter((s) => s.kind === "agent");

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
  );
}

type AgentStatus =
  | "working"
  | "idle"
  | "awaiting-finish"
  | "crashed"
  | "done"
  | "gone";

// Synthesize the agent's status from process liveness (the pane's dead/exit
// state), output activity, and the ticket's own state. The high-value signals
// are the ones a bare `iudex status` can't show: an agent that exited cleanly
// while its ticket is still active is "awaiting-finish" (it needs you to run
// finish); one that exited non-zero is "crashed".
function synthStatus(opts: {
  dead: boolean;
  exitCode: number | null;
  ticketState: string | undefined;
  quietMs: number;
}): AgentStatus {
  const { dead, exitCode, ticketState, quietMs } = opts;
  // The ticket no longer has an agent-bearing state — the agent is superseded.
  if (ticketState !== "active" && ticketState !== "pending-qa") return "done";
  if (dead) return exitCode === 0 ? "awaiting-finish" : "crashed";
  return quietMs < 5000 ? "working" : "idle";
}

const STATUS_LABEL: Record<AgentStatus, string> = {
  working: "working",
  idle: "idle",
  "awaiting-finish": "awaiting finish",
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
  }, [agent.name, ticketState]);

  const kill = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await invoke("kill_session", { name: agent.name }).catch(() => {});
  };

  // Show the tail of the captured pane — the most recent lines matter most.
  const tail = text.split("\n").slice(-14).join("\n");

  return (
    <section className="peek" onClick={onOpen} title="open full terminal">
      <header className="peek-head">
        <span className="peek-title">{agent.title}</span>
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
