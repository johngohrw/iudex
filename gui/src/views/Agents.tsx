import { Suspense, lazy, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSessions } from "../lib/sessions";
import {
  isFinished,
  STATUS_LABEL,
  useAgentStatuses,
  useBriefTitles,
  type AgentStatus,
} from "../lib/agents";
import type { FileChange, FileDiff, Session, Ticket, Workspace } from "../types";
import XtermPane from "./XtermPane";

const DiffViewer = lazy(() => import("./DiffViewer"));

// Master-detail over the agent sessions in the tmux pool. The left rail lists
// agents (no peeks); the right panel is the selected agent's cockpit — an
// interactive console plus its worktree diff and a ticket summary. Agents
// accumulate (a ticket can have several: impl, qa, resolve), each a distinct
// session; idea-shaping sessions are excluded (they're not ticket agents).
export default function Agents({ ws }: { ws: Workspace }) {
  const { sessions, available } = useSessions();
  const agents = sessions
    .filter((s) => s.kind === "agent")
    .sort(
      (a, b) =>
        (a.ticket ?? "").localeCompare(b.ticket ?? "") ||
        (a.started ?? "").localeCompare(b.started ?? ""),
    );

  const statuses = useAgentStatuses(agents, ws);

  const worktreeOf = (a: Session) =>
    a.ticket ? ws.tickets.find((t) => t.id === a.ticket)?.worktree ?? null : null;
  const titles = useBriefTitles(
    agents.flatMap((a) => {
      const w = worktreeOf(a);
      return w ? [w] : [];
    }),
    ws,
  );

  const [selName, setSelName] = useState<string | null>(null);
  const selected = agents.find((a) => a.name === selName) ?? null;

  // Drop the selection if its agent vanished from the pool.
  useEffect(() => {
    if (selName && !agents.some((a) => a.name === selName)) setSelName(null);
  }, [agents, selName]);

  const kill = async (name: string) => {
    await invoke("kill_session", { name }).catch(() => {});
  };
  const clearFinished = async () => {
    await Promise.all(
      agents.filter((a) => isFinished(statuses[a.name])).map((a) => kill(a.name)),
    );
  };

  if (available === false) {
    return (
      <div className="stub">
        <h2>Agents</h2>
        <p>
          tmux isn't on PATH — agent sessions live in the tmux pool. Install it with{" "}
          <code>brew install tmux</code> and reopen this view.
        </p>
      </div>
    );
  }

  return (
    <div className="ag">
      <aside className="ag-rail">
        <div className="ag-list">
          {agents.length === 0 && (
            <div className="ag-empty muted">
              No agents running. Activate a ticket to launch one.
            </div>
          )}
          {agents.map((a) => {
            const w = worktreeOf(a);
            const status = statuses[a.name] ?? "idle";
            return (
              <button
                key={a.name}
                className={`ag-card${a.name === selName ? " active" : ""}`}
                onClick={() => setSelName(a.name)}
              >
                <span className="ag-card-top">
                  <span className="ag-card-id">{a.ticket ?? "agent"}</span>
                  <span className="ag-card-title">{(w && titles[w]) || ""}</span>
                </span>
                <span className="ag-card-bot">
                  <span className="ag-card-role">{a.role ?? "agent"}</span>
                  <span className={`agent-status status-${status}`}>
                    {STATUS_LABEL[status]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="ag-foot">
          <span className="muted">
            {agents.length} agent{agents.length === 1 ? "" : "s"}
          </span>
          <button className="ghost" onClick={clearFinished} title="dismiss done & crashed agents">
            clear all finished
          </button>
        </div>
      </aside>

      <div className="ag-main">
        {selected ? (
          <AgentDetail
            key={selected.name}
            agent={selected}
            ws={ws}
            status={statuses[selected.name] ?? "idle"}
            title={(worktreeOf(selected) && titles[worktreeOf(selected)!]) || ""}
            worktree={worktreeOf(selected)}
            onDismiss={() => setSelName(null)}
            onKill={async () => {
              await kill(selected.name);
              setSelName(null);
            }}
          />
        ) : (
          <div className="ag-detail-empty muted">
            {agents.length > 0 ? "Select an agent." : ""}
          </div>
        )}
      </div>
    </div>
  );
}

type Tab = "ticket" | "console" | "worktree";

function AgentDetail({
  agent,
  ws,
  status,
  title,
  worktree,
  onDismiss,
  onKill,
}: {
  agent: Session;
  ws: Workspace;
  status: AgentStatus;
  title: string;
  worktree: string | null;
  onDismiss: () => void;
  onKill: () => void;
}) {
  const [tab, setTab] = useState<Tab>("console");
  const ticket = agent.ticket ? ws.tickets.find((t) => t.id === agent.ticket) ?? null : null;

  return (
    <div className="ag-detail">
      <header className="ag-head">
        <div className="ag-head-info">
          <span className="ag-head-id">{agent.ticket ?? "agent"}</span>
          <span className="ag-head-role">{agent.role ?? "agent"}</span>
          {title && <span className="ag-head-title">{title}</span>}
        </div>
        <div className="ag-head-right">
          <span className={`agent-status status-${status}`}>{STATUS_LABEL[status]}</span>
          <button className="ag-x" title="dismiss panel (agent keeps running)" onClick={onDismiss}>
            ✕
          </button>
        </div>
      </header>

      <nav className="ag-tabs">
        {(["ticket", "console", "worktree"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`ag-tab${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
        <span className="ag-tabs-spacer" />
        <button className="wt-esc danger" title="kill this agent" onClick={onKill}>
          kill agent
        </button>
      </nav>

      <div className="ag-content">
        {/* Console stays mounted while this agent is selected so switching tabs
            never tears down its PTY; only its visibility toggles. */}
        <div className="ag-console" style={{ display: tab === "console" ? "block" : "none" }}>
          <XtermPane session={agent.name} active={tab === "console"} />
        </div>
        {tab === "worktree" &&
          (worktree ? (
            <WorktreePanel worktree={worktree} mainBranch={ws.mainBranch} />
          ) : (
            <div className="ag-pad muted">This agent has no worktree.</div>
          ))}
        {tab === "ticket" && <TicketSummary ticket={ticket} role={agent.role ?? "agent"} />}
      </div>
    </div>
  );
}

// A minimal read-only ticket summary — a placeholder until the dedicated
// "ticket details" view lands.
function TicketSummary({ ticket, role }: { ticket: Ticket | null; role: string }) {
  if (!ticket) return <div className="ag-pad muted">No ticket for this agent.</div>;
  return (
    <div className="ag-pad ag-ticket">
      <div className="ag-kv">
        <span>ticket</span>
        <b>{ticket.id}</b>
      </div>
      <div className="ag-kv">
        <span>state</span>
        <span className={`state state-${ticket.state}`}>{ticket.state}</span>
      </div>
      <div className="ag-kv">
        <span>agent role</span>
        <b>{role}</b>
      </div>
      <div className="ag-kv">
        <span>deps</span>
        <b>{ticket.deps.length ? ticket.deps.join(", ") : "—"}</b>
      </div>
      <div className="ag-kv">
        <span>qa rejects</span>
        <b>{ticket.qaRejects}</b>
      </div>
    </div>
  );
}

// The selected agent's worktree changes vs main (two-dot, so the agent's
// uncommitted progress shows) + the shared Monaco diff. Read-only inspection.
function WorktreePanel({ worktree, mainBranch }: { worktree: string; mainBranch: string }) {
  const [changes, setChanges] = useState<FileChange[]>([]);
  const [selFile, setSelFile] = useState<string | null>(null);
  const [diff, setDiff] = useState<FileDiff | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    invoke<FileChange[]>("worktree_changes", { worktree, mainBranch })
      .then((c) => alive && setChanges(c))
      .catch((e) => alive && setErr(String(e)));
    return () => {
      alive = false;
    };
  }, [worktree, mainBranch]);

  useEffect(() => {
    if (!selFile) {
      setDiff(null);
      return;
    }
    let alive = true;
    invoke<FileDiff>("worktree_file_diff", { worktree, path: selFile, mainBranch })
      .then((d) => alive && setDiff(d))
      .catch((e) => alive && setErr(String(e)));
    return () => {
      alive = false;
    };
  }, [worktree, selFile, mainBranch]);

  return (
    <div className="rv-split">
      <ul className="rv-filelist">
        {err && <li className="error">{err}</li>}
        {!err && changes.length === 0 && <li className="muted">no changes vs main</li>}
        {changes.map((c) => (
          <li
            key={c.path}
            className={`wt-file${c.path === selFile ? " active" : ""}`}
            onClick={() => setSelFile(c.path)}
          >
            <span className={`wt-st wt-st-${c.status}`}>{c.status}</span>
            <span className="wt-path">{c.path}</span>
          </li>
        ))}
      </ul>
      <div className="rv-diff">
        {selFile && diff ? (
          <Suspense fallback={<div className="wt-loading">loading editor…</div>}>
            <DiffViewer
              original={diff.original}
              modified={diff.modified}
              language={diff.language}
              title={selFile}
              actions={
                <button
                  className="wt-esc"
                  onClick={() =>
                    invoke("open_in_editor", { path: `${worktree}/${selFile}` }).catch(() => {})
                  }
                >
                  Open in editor
                </button>
              }
            />
          </Suspense>
        ) : (
          <div className="wt-diff-empty">{changes.length > 0 ? "Pick a file to view its diff." : ""}</div>
        )}
      </div>
    </div>
  );
}
