import { Suspense, lazy, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { FileDiff, Preflight, Session, Ticket, Workspace } from "../types";
import { useReview } from "../lib/review";

const DiffViewer = lazy(() => import("./DiffViewer"));

type Tab = "brief" | "log" | "review" | "files";

const TAB_LABELS: Record<Tab, string> = {
  brief: "Brief",
  log: "Log",
  review: "QA review",
  files: "Files",
};

// The deep-review workspace for pending-human-qa tickets: brief / log / QA
// review + the three-dot diff (what the ticket authored vs the merge-base), with
// a preflighted Approve & merge so the merge only ever fires when guaranteed to
// succeed. Conflicts are predicted and routed, never resolved in-app (except the
// opt-in Begin resolution, which just runs `git merge` in the worktree).
export default function Review({
  ws,
  root,
  focusTicket,
  onFocusHandled,
  onOpenInTerminal,
}: {
  ws: Workspace;
  root: string;
  focusTicket: string | null;
  onFocusHandled: () => void;
  onOpenInTerminal: (session: string) => void;
}) {
  const pending = ws.tickets.filter((t) => t.state === "pending-human-qa");

  const [selId, setSelId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("brief");
  const [selFile, setSelFile] = useState<string | null>(null);
  const [diff, setDiff] = useState<FileDiff | null>(null);
  const [busy, setBusy] = useState(false);
  const [actErr, setActErr] = useState<string | null>(null);

  // Honor a ticket handed in from the Dashboard.
  useEffect(() => {
    if (focusTicket) {
      setSelId(focusTicket);
      onFocusHandled();
    }
  }, [focusTicket, onFocusHandled]);

  // Keep the selection valid as the pending list changes (e.g. after approve).
  useEffect(() => {
    if (pending.length === 0) {
      setSelId(null);
    } else if (!pending.some((t) => t.id === selId)) {
      setSelId(pending[0].id);
    }
  }, [pending, selId]);

  const selected: Ticket | null = pending.find((t) => t.id === selId) ?? null;
  const worktree = selected?.worktree ?? null;
  const { docs, changes, preflight, error, recheck } = useReview(root, worktree, ws);

  // Reset the open file when switching tickets.
  useEffect(() => {
    setSelFile(null);
    setDiff(null);
    setActErr(null);
  }, [selId]);

  // Load the three-dot diff for the selected file.
  useEffect(() => {
    if (!worktree || !selFile) {
      setDiff(null);
      return;
    }
    let alive = true;
    invoke<FileDiff>("worktree_file_diff", {
      worktree,
      path: selFile,
      mainBranch: ws.mainBranch,
      threeDot: true,
    })
      .then((d) => alive && setDiff(d))
      .catch((e) => alive && setActErr(String(e)));
    return () => {
      alive = false;
    };
  }, [worktree, selFile, ws.mainBranch]);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setActErr(null);
    try {
      await fn();
    } catch (e) {
      setActErr(String(e));
    } finally {
      setBusy(false);
    }
  };

  const approve = () =>
    act(async () => {
      try {
        await invoke("run_iudex", { root, args: ["human-qa", "approve", selId] });
        // The doorbell will drop this ticket out of `pending`; selection follows.
      } catch (e) {
        // iudex aborts+restores on any surprise conflict; re-run preflight so the
        // strip reflects the real state, then surface the error.
        recheck();
        throw e;
      }
    });

  const reject = (reason: string) =>
    act(() => invoke("run_iudex", { root, args: ["human-qa", "reject", selId, "--reason", reason] }));

  const beginResolution = () =>
    act(async () => {
      await invoke("begin_resolution", { worktree, mainBranch: ws.mainBranch });
      recheck();
    });
  const abortResolution = () =>
    act(async () => {
      await invoke("abort_resolution", { worktree });
      recheck();
    });
  const openShell = (cwd: string) =>
    act(async () => {
      const s = await invoke<Session>("create_shell", { cwd });
      onOpenInTerminal(s.name);
    });
  const openInEditor = (file: string) =>
    invoke("open_in_editor", { path: `${worktree}/${file}` }).catch((e) => setActErr(String(e)));

  if (pending.length === 0)
    return <div className="rv-empty">Nothing awaiting human review.</div>;

  const docText =
    tab === "brief" ? docs?.brief : tab === "log" ? docs?.log : docs?.review;

  return (
    <div className="rv">
      <aside className="rv-rail">
        <div className="rv-rail-head">PENDING HUMAN QA</div>
        {pending.map((t) => (
          <button
            key={t.id}
            className={`rv-item${t.id === selId ? " active" : ""}`}
            onClick={() => setSelId(t.id)}
          >
            <span className="rv-item-id">{t.id}</span>
            <span className="state state-pending-human-qa">pending-human-qa</span>
          </button>
        ))}
      </aside>

      <div className="rv-main">
        <div className="rv-head">
          <span className="rv-head-id">{selId}</span>
          {preflight && (
            <ReadinessStrip
              pf={preflight}
              busy={busy}
              onShellRoot={() => openShell(root)}
              onShellWorktree={() => worktree && openShell(worktree)}
              onBegin={beginResolution}
              onAbort={abortResolution}
              onRecheck={recheck}
              onPickConflict={(f) => setSelFile(f)}
            />
          )}
        </div>

        {error && <div className="error">{error}</div>}

        <div className="rv-body">
          <div className="rv-docs">
            <div className="rv-doctabs">
              {(["brief", "log", "review", "files"] as Tab[]).map((d) => (
                <button
                  key={d}
                  className={`rv-doctab${tab === d ? " active" : ""}`}
                  onClick={() => setTab(d)}
                >
                  {d === "files" ? `${TAB_LABELS[d]} (${changes.length})` : TAB_LABELS[d]}
                </button>
              ))}
            </div>
            {tab === "files" ? (
              <ul className="rv-filelist">
                {changes.length === 0 && <li className="muted">no changes vs merge-base</li>}
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
            ) : (
              <pre className="rv-doc">{docText?.trim() ? docText : `(no ${tab})`}</pre>
            )}
          </div>

          <div className="rv-diffwrap">
            <div className="rv-diff">
              {selFile && diff ? (
                <Suspense fallback={<div className="wt-loading">loading editor…</div>}>
                  <DiffViewer
                    original={diff.original}
                    modified={diff.modified}
                    language={diff.language}
                    title={selFile}
                    actions={
                      <button className="wt-esc" onClick={() => openInEditor(selFile)}>
                        Open in editor
                      </button>
                    }
                  />
                </Suspense>
              ) : (
                <div className="wt-diff-empty">
                  {changes.length > 0
                    ? "Open the Files tab and pick a file to view its diff."
                    : ""}
                </div>
              )}
            </div>
          </div>
        </div>

        {actErr && <div className="error">{actErr}</div>}

        <div className="rv-actions">
          <RejectButton disabled={busy} onReject={reject} />
          <button
            className="rv-approve"
            disabled={busy || !preflight?.ready}
            title={preflight?.ready ? "merge into main" : "blocked — see merge readiness"}
            onClick={approve}
          >
            {busy ? "…" : "Approve & merge"}
          </button>
        </div>
      </div>
    </div>
  );
}

// The merge-readiness strip: green when the merge is guaranteed to succeed, else
// the blocking gate with its one-click remedy.
function ReadinessStrip({
  pf,
  busy,
  onShellRoot,
  onShellWorktree,
  onBegin,
  onAbort,
  onRecheck,
  onPickConflict,
}: {
  pf: Preflight;
  busy: boolean;
  onShellRoot: () => void;
  onShellWorktree: () => void;
  onBegin: () => void;
  onAbort: () => void;
  onRecheck: () => void;
  onPickConflict: (f: string) => void;
}) {
  if (pf.ready)
    return <span className="rv-ready ok">✓ Ready to merge</span>;

  return (
    <div className="rv-blocked">
      {!pf.onMain && (
        <div className="rv-gate">
          <span className="rv-gate-msg">
            ⚠ Repo root is on <b>{pf.currentBranch}</b>, not the main branch — switch it first.
          </span>
        </div>
      )}
      {pf.onMain && !pf.clean && (
        <div className="rv-gate">
          <span className="rv-gate-msg">
            ⚠ Repo root has {pf.dirtyFiles.length} uncommitted change
            {pf.dirtyFiles.length === 1 ? "" : "s"} — commit or stash first.
          </span>
          <button className="wt-esc" disabled={busy} onClick={onShellRoot}>
            Open shell at root
          </button>
        </div>
      )}
      {pf.mergeInProgress && (
        <div className="rv-gate">
          <span className="rv-gate-msg">
            ⏳ Resolution in progress in the worktree — fix the conflicts, then{" "}
            <code>git add</code> + commit.
          </span>
          <button className="wt-esc" disabled={busy} onClick={onShellWorktree}>
            Open worktree shell
          </button>
          <button className="wt-esc danger" disabled={busy} onClick={onAbort}>
            Abort
          </button>
          <button className="wt-esc" disabled={busy} onClick={onRecheck}>
            Re-check
          </button>
        </div>
      )}
      {pf.onMain && pf.clean && pf.wouldConflict && !pf.mergeInProgress && (
        <div className="rv-gate">
          <span className="rv-gate-msg">
            ⚠ Would conflict in {pf.conflictFiles.length} file
            {pf.conflictFiles.length === 1 ? "" : "s"}:
          </span>
          <span className="rv-conflicts">
            {pf.conflictFiles.map((f) => (
              <button key={f} className="rv-conflict" onClick={() => onPickConflict(f)}>
                {f}
              </button>
            ))}
          </span>
          <button className="wt-esc" disabled={busy} onClick={onBegin}>
            Begin resolution
          </button>
          <button className="wt-esc" disabled={busy} onClick={onShellWorktree}>
            Open worktree shell
          </button>
          <button className="wt-esc" disabled={busy} onClick={onRecheck}>
            Re-check
          </button>
        </div>
      )}
    </div>
  );
}

function RejectButton({
  disabled,
  onReject,
}: {
  disabled: boolean;
  onReject: (reason: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <>
      <button className="rv-reject" disabled={disabled} onClick={() => setOpen(true)}>
        Reject…
      </button>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reject — back to active</h3>
            <label className="field">
              <span>Reason (appended to review.md)</span>
              <textarea
                autoFocus
                rows={5}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="what needs to change…"
              />
            </label>
            <div className="modal-actions">
              <button className="ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                disabled={!reason.trim()}
                onClick={() => {
                  onReject(reason.trim());
                  setOpen(false);
                }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
