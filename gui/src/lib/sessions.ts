import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Session } from "../types";

// Poll the tmux pool. Session membership changes on tmux commands the GUI
// doesn't route (a shell exiting, an agent dying), so unlike ticket state there
// is no doorbell — a light poll is the pragmatic source of truth here.
export function useSessions(pollMs = 2000) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [loaded, setLoaded] = useState(false); // true after the first list
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    invoke<boolean>("tmux_available").then((a) => alive && setAvailable(a));

    const tick = async () => {
      try {
        const s = await invoke<Session[]>("list_sessions");
        if (alive) {
          setSessions(s);
          setLoaded(true);
          setError(null);
        }
      } catch (e) {
        if (alive) setError(String(e));
      }
    };
    tick();
    const h = setInterval(tick, pollMs);
    return () => {
      alive = false;
      clearInterval(h);
    };
  }, [pollMs]);

  return { sessions, available, loaded, error };
}
