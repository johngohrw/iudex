import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Ticket, Workspace } from "../types";

// What to show in the trailing "detail" column for a ticket.
function detail(t: Ticket): string {
  if (t.state === "queued") {
    return t.ready ? "ready" : `blocked by ${t.blockedBy.join(", ")}`;
  }
  if (t.hasWorktree && t.worktree) return t.worktree;
  return "";
}

// The reactive tickets table plus the write-path action column. Every mutation
// shells through `iudex` (run_iudex) so the state machine stays single-sourced
// in the CLI; activating also launches the agent into the tmux pool. We never
// re-read after a mutation — the events.jsonl doorbell refreshes the table.
export default function Tickets({
  ws,
  root,
}: {
  ws: Workspace;
  root: string;
}) {
  const [busy, setBusy] = useState<string | null>(null); // ticket id mid-action
  const [error, setError] = useState<string | null>(null);

  const act = async (id: string, fn: () => Promise<void>) => {
    setBusy(id);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(`${id}: ${String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const activate = (id: string) =>
    act(id, async () => {
      await invoke("run_iudex", { root, args: ["activate", id] });
      await invoke("spawn_agent", { root, ticket: id, role: "impl" });
    });
  const finish = (id: string) =>
    act(id, () => invoke("run_iudex", { root, args: ["finish", id] }));
  const spawnImpl = (id: string) =>
    act(id, () => invoke("spawn_agent", { root, ticket: id, role: "impl" }));
  const spawnQa = (id: string) =>
    act(id, () => invoke("spawn_agent", { root, ticket: id, role: "qa" }));
  const retry = (id: string) =>
    act(id, () => invoke("run_iudex", { root, args: ["retry", id] }));

  const actionsFor = (t: Ticket) => {
    const disabled = busy !== null;
    switch (t.state) {
      case "queued":
        return t.ready ? (
          <button disabled={disabled} onClick={() => activate(t.id)}>
            Activate
          </button>
        ) : null;
      case "active":
        return (
          <>
            <button disabled={disabled} onClick={() => finish(t.id)}>
              Finish
            </button>
            <button
              className="ghost"
              disabled={disabled}
              onClick={() => spawnImpl(t.id)}
              title="launch another impl agent"
            >
              Agent
            </button>
          </>
        );
      case "pending-qa":
        return (
          <button
            disabled={disabled}
            onClick={() => spawnQa(t.id)}
            title="launch a QA agent"
          >
            QA agent
          </button>
        );
      case "failed":
        return (
          <button disabled={disabled} onClick={() => retry(t.id)}>
            Retry
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <table className="tickets">
        <thead>
          <tr>
            <th>id</th>
            <th>state</th>
            <th>qa rejects</th>
            <th>detail</th>
            <th>actions</th>
          </tr>
        </thead>
        <tbody>
          {ws.tickets.length === 0 && (
            <tr>
              <td colSpan={5} className="empty">
                no tickets yet
              </td>
            </tr>
          )}
          {ws.tickets.map((t) => (
            <tr key={t.id}>
              <td className="id">{t.id}</td>
              <td>
                <span className={`state state-${t.state}`}>{t.state}</span>
              </td>
              <td className="num">{t.qaRejects || ""}</td>
              <td className="muted">{detail(t)}</td>
              <td className="actions">
                {busy === t.id ? <span className="muted">…</span> : actionsFor(t)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
