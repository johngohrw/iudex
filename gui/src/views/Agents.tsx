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
import { useTicketDocs } from "../lib/tickets";
import ChangedFilesDiff from "../components/ChangedFilesDiff";
import Chip from "../components/Chip";
import Button from "../components/Button";
import XtermPane from "./XtermPane";
import s from "./Agents.module.scss";

// Synthesized agent status → its signal color (DESIGN.md: color is state).
const STATUS_COLOR: Record<AgentStatus, string> = {
  working: "#5ccf5c",
  idle: "#f4bc41",
  "awaiting-finish": "#f4bc41",
  "review-ready": "#836ddd",
  crashed: "#e0584c",
  done: "#5ccf5c",
  gone: "#565656",
};

// A status as a colored dot + label — the rail/header status indicator.
function StatusDot({ status }: { status: AgentStatus }) {
  return (
    <>
      <span className={s.statusDot} style={{ background: STATUS_COLOR[status] }} />
      {STATUS_LABEL[status]}
    </>
  );
}

// Role as a Chip. impl/qa get the canonical cyan accent; others fall back.
const ROLE_CHIP: Record<string, { bg: string; fg: string }> = {
  impl: { bg: "#3a3f4a", fg: "#8ce8fa" },
  qa: { bg: "#3a2f4a", fg: "#baa0fc" },
};
function RoleChip({ role }: { role: string }) {
  const c = ROLE_CHIP[role] ?? { bg: "#404040", fg: "#cfcfcf" };
  return (
    <Chip bg={c.bg} fg={c.fg}>
      {role}
    </Chip>
  );
}

// Master-detail over the agent sessions in the tmux pool. The left rail lists
// agents (no peeks); the right panel is the selected agent's cockpit — an
// interactive console plus its worktree diff and a ticket summary. Agents
// accumulate (a ticket can have several: impl, qa, resolve), each a distinct
// session; idea-shaping sessions are excluded (they're not ticket agents).
export default function Agents({
  ws,
  root,
  focusAgent,
  onFocusHandled,
}: {
  ws: Workspace;
  root: string;
  focusAgent?: string | null;
  onFocusHandled?: () => void;
}) {
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

  // Cross-view focus: select a specific agent when jumping from Tickets.
  useEffect(() => {
    if (focusAgent && agents.some((a) => a.name === focusAgent)) {
      setSelName(focusAgent);
      onFocusHandled?.();
    }
  }, [focusAgent, agents, onFocusHandled]);

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
                style={{ borderLeftColor: STATUS_COLOR[status] }}
              >
                <span className={s.cardTop}>
                  <span className={s.cardId}>{a.ticket ?? "agent"}</span>
                  <span className={s.cardTitle}>{(w && titles[w]) || ""}</span>
                </span>
                <span className={s.cardBot}>
                  <RoleChip role={a.role ?? "agent"} />
                  <span className={s.cardStatus}>
                    <StatusDot status={status} />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div className={s.foot}>
          <span className="muted">
            {agents.length} agent{agents.length === 1 ? "" : "s"}
          </span>
          <Button variant="quiet" size="sm" onClick={clearFinished}>
            clear all finished
          </Button>
        </div>
      </aside>

      <div className={s.main}>
        {selected ? (
          <AgentDetail
            key={selected.name}
            agent={selected}
            ws={ws}
            root={root}
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
  root,
  status,
  title,
  worktree,
  onDismiss,
  onKill,
}: {
  agent: Session;
  ws: Workspace;
  root: string;
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
        <span className={s.headId}>agent·{agent.ticket ?? "—"}</span>
        <RoleChip role={agent.role ?? "agent"} />
        {title && <span className={s.headTitle}>{title}</span>}
        {!title && <span className={s.headTitle} />}
        <span className={s.headStatus}>
          <StatusDot status={status} />
        </span>
        <Button variant="danger" size="sm" onClick={onKill} title="kill this agent">
          kill agent
        </Button>
        <button className={s.x} title="dismiss panel (agent keeps running)" onClick={onDismiss}>
          ✕
        </button>
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
        {tab === "ticket" && (
          ticket
            ? <TicketBrief root={root} ticket={ticket} role={agent.role ?? "—"} />
            : <div className={`${s.pad} muted`}>No ticket for this agent.</div>
        )}
      </div>
    </div>
  );
}


// The ticket brief shown in the Agents panel ticket tab — a simple read-only
// display of the brief text, without the full TicketDetail panel chrome.
function TicketBrief({ root, ticket, role }: { root: string; ticket: Ticket; role: string }) {
  const { docs, loading } = useTicketDocs(root, ticket);
  const cells: [string, string][] = [
    ["STATE", ticket.state],
    ["ROLE", role],
    ["WORKTREE", ticket.worktree || "—"],
    ["DEPS", ticket.deps.length ? ticket.deps.join(" ") : "—"],
    ["QA REJECTS", String(ticket.qaRejects)],
  ];
  return (
    <div className={s.pad}>
      <div className={s.metaGrid}>
        {cells.map(([label, val]) => (
          <div key={label} className={s.metaCell}>
            <div className={s.metaLabel}>{label}</div>
            <div className={s.metaVal}>{val}</div>
          </div>
        ))}
      </div>
      {loading && <span className="muted">loading…</span>}
      {!loading && docs?.brief?.trim() && <pre className={s.doc}>{docs.brief}</pre>}
      {!loading && !docs?.brief?.trim() && <span className="muted">(no brief)</span>}
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
        <Button
          variant="quiet"
          size="sm"
          onClick={() =>
            invoke("open_in_editor", { path: `${worktree}/${selFile}` }).catch(() => {})
          }
        >
          Open in editor
        </Button>
      }
    />
  );
}
