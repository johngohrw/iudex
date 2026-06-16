import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

// One live, interactive terminal bound to a tmux session through a backend PTY.
// The bridge: backend streams `pty-{id}` events (base64) → xterm.write; xterm
// onData → `write_terminal`. We generate the id up front so we can subscribe
// before any output flows. Unmounting only detaches (close_terminal kills the
// attach client) — the tmux session, and its scrollback, persist.
export default function XtermPane({
  session,
  active,
}: {
  session: string;
  active: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const idRef = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const id = idRef.current;

    const term = new Terminal({
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: 13,
      theme: { background: "#16171a", foreground: "#e6e6e6" },
      cursorBlink: true,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(host);
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;

    const b64ToBytes = (b64: string) =>
      Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

    let disposed = false;
    const unlisteners: Array<() => void> = [];

    (async () => {
      // Subscribe first, then start the attach, so the initial screen dump
      // (tmux replays the pane on attach) is never dropped.
      unlisteners.push(
        await listen<string>(`pty-${id}`, (e) =>
          term.write(b64ToBytes(e.payload))
        )
      );
      unlisteners.push(
        await listen(`pty-${id}-exit`, () =>
          term.write("\r\n\x1b[90m[detached]\x1b[0m\r\n")
        )
      );
      if (disposed) return;
      await invoke("open_terminal", {
        id,
        name: session,
        readonly: false,
        cols: term.cols,
        rows: term.rows,
      });
      term.onData((data) => {
        invoke("write_terminal", { id, data }).catch(() => {});
      });
    })();

    // Keep the PTY sized to the pane.
    const ro = new ResizeObserver(() => {
      if (!active) return;
      try {
        fit.fit();
        invoke("resize_terminal", {
          id,
          cols: term.cols,
          rows: term.rows,
        }).catch(() => {});
      } catch {
        /* element hidden / zero-size */
      }
    });
    ro.observe(host);

    return () => {
      disposed = true;
      ro.disconnect();
      unlisteners.forEach((u) => u());
      invoke("close_terminal", { id }).catch(() => {});
      term.dispose();
    };
    // Bind once per session; `active` is read live via the ref-held term.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Refit when this pane becomes the visible tab (fit on a hidden element is a
  // no-op, so a tab that was background needs a nudge on show).
  useEffect(() => {
    if (!active) return;
    const term = termRef.current;
    const fit = fitRef.current;
    if (!term || !fit) return;
    requestAnimationFrame(() => {
      try {
        fit.fit();
        term.focus();
        invoke("resize_terminal", {
          id: idRef.current,
          cols: term.cols,
          rows: term.rows,
        }).catch(() => {});
      } catch {
        /* ignore */
      }
    });
  }, [active]);

  return <div className="xterm-host" ref={hostRef} />;
}
