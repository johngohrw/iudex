import { useEffect, useState } from "react";
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
import StateBadge from "../components/StateBadge";
import ChangedFilesDiff from "../components/ChangedFilesDiff";
import XtermPane from "./XtermPane";
import s from "./Agents.module.scss";

// Maps a synthesized agent status to its scoped pill class.
const STATUS_CLASS: Record<AgentStatus, string> = {
  working: s.working,
  idle: s.idle,
  "awaiting-finish": s.awaitingFinish,
  "review-ready": s.reviewReady,
  crashed: s.crashed,
  done: s.done,
  gone: s.gone,
};

function StatusPill({ status }: { status: AgentStatus }) {
  return (
    <span className={`${s.status} ${STATUS_CLASS[status] ?? ""}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

// Master-detail over the agent sessions in the tmux pool. The left rail lists
// agents (no peeks); the right panel is the selected agent's cockpit — an
// interactive console plus its worktree diff and a ticket summary. Agents
// accumulate (a ticket can have several: impl, qa, resolve), each a distinct
// session; idea-shaping sessions are excluded (they're not ticket agents).
export default function Agents({ ws }: { ws: Workspace }) {
  const { sessions, available } = useSessions();
  const agents = sessions
    .filter((x) => x.kind === "agent")
    .sort(
      (a, b) =>
        (a.ticket ?? "").localeCompare(b.ticket ?? "") ||
        (a.started ?? "").localeCompare(b.started ?? ""),
    );

  const statuses = useAgentStatuses(agents, ws);

  const worktreeOf = (a: Session) =>
    a.ticket ? (ws.tickets.find((t) => t.id === a.ticket)?.worktree ?? null) : null;
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
    <div className={s.root}>
      <aside className={s.rail}>
        <div className={s.list}>
          {agents.length === 0 && (
            <div className={`${s.empty} muted`}>
              No agents running. Activate a ticket to launch one.
            </div>
          )}
          {agents.map((a) => {
            const w = worktreeOf(a);
            const status = statuses[a.name] ?? "idle";
            return (
              <button
                key={a.name}
                className={`${s.card} ${a.name === selName ? s.active : ""}`}
                onClick={() => setSelName(a.name)}
              >
                <span className={s.cardTop}>
                  <span className={s.cardId}>{a.ticket ?? "agent"}</span>
                  <span className={s.cardTitle}>{(w && titles[w]) || ""}</span>
                </span>
                <span className={s.cardBot}>
                  <span className={s.cardRole}>{a.role ?? "agent"}</span>
                  <StatusPill status={status} />
                </span>
              </button>
            );
          })}
        </div>
        <div className={s.foot}>
          <span className="muted">
            {agents.length} agent{agents.length === 1 ? "" : "s"}
          </span>
          <button className="ghost" onClick={clearFinished} title="dismiss done & crashed agents">
            clear all finished
          </button>
        </div>
      </aside>

      <div className={s.main}>
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
          <div className={`${s.detailEmpty} muted`}>
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
  const ticket = agent.ticket ? (ws.tickets.find((t) => t.id === agent.ticket) ?? null) : null;

  return (
    <div className={s.detail}>
      <header className={s.head}>
        <div className={s.headInfo}>
          <span className={s.headId}>{agent.ticket ?? "agent"}</span>
          <span className={s.headRole}>{agent.role ?? "agent"}</span>
          {title && <span className={s.headTitle}>{title}</span>}
        </div>
        <div className={s.headRight}>
          <StatusPill status={status} />
          <button className={s.x} title="dismiss panel (agent keeps running)" onClick={onDismiss}>
            ✕
          </button>
        </div>
      </header>

      <nav className={s.tabs}>
        {(["ticket", "console", "worktree"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`${s.tab} ${tab === t ? s.active : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
        <span className={s.tabsSpacer} />
        <button className="esc danger" title="kill this agent" onClick={onKill}>
          kill agent
        </button>
      </nav>

      <div className={s.content}>
        {/* Console stays mounted while this agent is selected so switching tabs
            never tears down its PTY; only its visibility toggles. */}
        <div className={s.console} style={{ display: tab === "console" ? "block" : "none" }}>
          <XtermPane session={agent.name} active={tab === "console"} />
        </div>
        {tab === "worktree" &&
          (worktree ? (
            <WorktreePanel worktree={worktree} mainBranch={ws.mainBranch} />
          ) : (
            <div className={`${s.pad} muted`}>This agent has no worktree.</div>
          ))}
        {tab === "ticket" && <TicketSummary ticket={ticket} role={agent.role ?? "agent"} />}
      </div>
    </div>
  );
}

// A minimal read-only ticket summary — a placeholder until the dedicated
// "ticket details" view lands.
function TicketSummary({ ticket, role }: { ticket: Ticket | null; role: string }) {
  if (!ticket) return <div className={`${s.pad} muted`}>No ticket for this agent.</div>;
  return (
    <div className={`${s.pad} ${s.ticket}`}>
      <div className={s.kv}>
        <span>ticket</span>
        <b>{ticket.id}</b>
      </div>
      <div className={s.kv}>
        <span>state</span>
        <StateBadge state={ticket.state} />
      </div>
      <div className={s.kv}>
        <span>agent role</span>
        <b>{role}</b>
      </div>
      <div className={s.kv}>
        <span>deps</span>
        <b>{ticket.deps.length ? ticket.deps.join(", ") : "—"}</b>
      </div>
      <div className={s.kv}>
        <span>qa rejects</span>
        <b>{ticket.qaRejects}</b>
      </div>
    </div>
  );
}

// The selected agent's worktree changes vs main (two-dot, so the agent's
// uncommitted progress shows). Fetches; the shared ChangedFilesDiff renders.
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
    <ChangedFilesDiff
      changes={changes}
      selected={selFile}
      onSelect={setSelFile}
      diff={diff}
      error={err}
      noChangesHint="no changes vs main"
      fileActions={
        <button
          className="esc"
          onClick={() =>
            invoke("open_in_editor", { path: `${worktree}/${selFile}` }).catch(() => {})
          }
        >
          Open in editor
        </button>
      }
    />
  );
}
