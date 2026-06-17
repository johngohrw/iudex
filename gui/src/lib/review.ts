import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { FileChange, Preflight, TaskDocs, Workspace } from "../types";

// Everything the Review workspace needs for one ticket: its .task/ docs, the
// three-dot changed-files list (what the ticket authored vs the merge-base), and
// the merge-preflight. Re-runs when `ws` changes (doorbell-driven) and on an
// explicit recheck() after the user resolves a conflict. `worktree` is the
// ticket's worktree path from `status --json`.
export function useReview(root: string, worktree: string | null, ws: Workspace) {
  const [docs, setDocs] = useState<TaskDocs | null>(null);
  const [changes, setChanges] = useState<FileChange[]>([]);
  const [preflight, setPreflight] = useState<Preflight | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const recheck = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!worktree) {
      setDocs(null);
      setChanges([]);
      setPreflight(null);
      return;
    }
    let alive = true;
    Promise.all([
      invoke<TaskDocs>("worktree_task_docs", { worktree }),
      invoke<FileChange[]>("worktree_changes", {
        worktree,
        mainBranch: ws.mainBranch,
        threeDot: true,
      }),
      invoke<Preflight>("merge_preflight", {
        root,
        worktree,
        mainBranch: ws.mainBranch,
      }),
    ])
      .then(([d, c, p]) => {
        if (!alive) return;
        setDocs(d);
        setChanges(c);
        setPreflight(p);
        setError(null);
      })
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, [root, worktree, ws, nonce]);

  return { docs, changes, preflight, error, recheck };
}
