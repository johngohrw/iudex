import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSessions } from "../lib/sessions";
import type { Session } from "../types";

// A grid of read-only peeks into agent sessions. Each peek polls capture-pane
// (cheaper than N live attaches, and it sidesteps tmux's smallest-client resize
// war across a grid) and synthesizes a status from output activity — iudex has
// no liveness signal, so "is it producing output?" is the cheapest honest one.
// Clicking a peek hands the session to the Terminal view for full interaction.
export default function Agents({
  onOpenInTerminal,
}: {
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
          No agent sessions running. Agents appear here once spawned into the pool
          (activating a ticket will launch one in a later step).
        </p>
      </div>
    );
  }

  return (
    <div className="agents">
      {agents.map((a) => (
        <AgentPeek key={a.name} agent={a} onOpen={() => onOpenInTerminal(a.name)} />
      ))}
    </div>
  );
}

function AgentPeek({ agent, onOpen }: { agent: Session; onOpen: () => void }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"working" | "idle" | "gone">("idle");
  const prev = useRef<string>("");
  const lastChange = useRef<number>(Date.now());

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const out = await invoke<string>("capture_pane", {
          name: agent.name,
          lines: 200,
        });
        if (!alive) return;
        if (out !== prev.current) {
          prev.current = out;
          lastChange.current = Date.now();
        }
        setText(out);
        // working = produced output in the last 5s; otherwise idle/waiting.
        const quietMs = Date.now() - lastChange.current;
        setStatus(quietMs < 5000 ? "working" : "idle");
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
  }, [agent.name]);

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
        <span className={`agent-status status-${status}`}>{status}</span>
        <button className="peek-kill" onClick={kill} title="kill session">
          kill
        </button>
      </header>
      <pre className="peek-screen">{tail || "…"}</pre>
    </section>
  );
}
