import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { VIEWS, type View, type Workspace } from "./types";
import { useSessions } from "./lib/sessions";
import Dashboard from "./views/Dashboard";
import Tickets from "./views/Tickets";
import Terminal from "./views/Terminal";
import Agents from "./views/Agents";
import Worktrees from "./views/Worktrees";
import Review from "./views/Review";
import Settings from "./views/Settings";
import "./styles/base.scss";
import a from "./App.module.scss";

function basename(p: string): string {
  const parts = p.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? p;
}

export default function App() {
  // The last folder the user selected — retained for initHere even when it's
  // not a valid workspace yet.
  const [pickedPath, setPickedPath] = useState<string | null>(null);
  const [root, setRoot] = useState<string | null>(null);
  const [ws, setWs] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offerInit, setOfferInit] = useState(false);
  const [initing, setIniting] = useState(false);
  const [lastSync, setLastSync] = useState<string>("");
  const [view, setView] = useState<View>("dashboard");
  const [focusSession, setFocusSession] = useState<string | null>(null);
  const [focusTicket, setFocusTicket] = useState<string | null>(null);
  const [focusAgent, setFocusAgent] = useState<string | null>(null);
  const [autoActivate, setAutoActivate] = useState(false);
  const autoActivateRef = useRef(false);
  const drainingRef = useRef(false);
  const skipRef = useRef<Set<string>>(new Set());
  const [autoQA, setAutoQA] = useState(false);
  const autoQARef = useRef(false);
  const qaDrainingRef = useRef(false);
  const qaHandledRef = useRef<Set<string>>(new Set());
  const { sessions } = useSessions();

  const aaKey = (r: string) => `iudex.autoActivate.${r}`;
  const qaKey = (r: string) => `iudex.autoQA.${r}`;

  const load = useCallback(async (r: string) => {
    try {
      const data = await invoke<Workspace>("iudex_status", { root: r });
      setWs(data);
      setError(null);
      setLastSync(new Date().toLocaleTimeString());
    } catch (e) {
      setError(String(e));
    }
  }, []);

  const enter = useCallback(
    async (r: string) => {
      setRoot(r);
      setError(null);
      setOfferInit(false);
      await load(r);
      await invoke("watch_workspace", { root: r });
    },
    [load]
  );

  async function pickAndOpen() {
    const selected = await openDialog({ directory: true, multiple: false });
    if (!selected) return;
    const picked = Array.isArray(selected) ? selected[0] : selected;
    setPickedPath(picked);
    setError(null);
    setOfferInit(false);
    try {
      const r = await invoke<string>("discover_workspace", { start: picked });
      await enter(r);
    } catch (e) {
      const msg = String(e);
      setRoot(null);
      setWs(null);
      if (msg.includes("not inside an iudex workspace")) {
        setOfferInit(true);
      } else {
        setError(msg);
      }
    }
  }

  async function initHere() {
    if (!pickedPath) return;
    setIniting(true);
    try {
      const r = await invoke<string>("init_workspace", { path: pickedPath });
      await enter(r);
    } catch (e) {
      setError(String(e));
    } finally {
      setIniting(false);
    }
  }

  useEffect(() => {
    if (!root) return;
    const un = listen("events-changed", () => load(root));
    return () => {
      un.then((f) => f());
    };
  }, [root, load]);

  useEffect(() => {
    if (!root) return;
    skipRef.current.clear();
    qaHandledRef.current.clear();
    setAutoActivate(localStorage.getItem(aaKey(root)) === "true");
    setAutoQA(localStorage.getItem(qaKey(root)) === "true");
  }, [root]);

  const toggleAutoActivate = useCallback(
    (v: boolean) => {
      autoActivateRef.current = v;
      skipRef.current.clear();
      if (root) localStorage.setItem(aaKey(root), String(v));
      setAutoActivate(v);
    },
    [root]
  );

  const toggleAutoQA = useCallback(
    (v: boolean) => {
      autoQARef.current = v;
      qaHandledRef.current.clear();
      if (root) localStorage.setItem(qaKey(root), String(v));
      setAutoQA(v);
    },
    [root]
  );

  useEffect(() => {
    if (!autoActivate || !root || !ws) return;
    if (drainingRef.current) return;
    if (!ws.tickets.some((t) => t.state === "queued" && t.ready)) return;
    drainingRef.current = true;
    (async () => {
      try {
        while (autoActivateRef.current) {
          const data = await invoke<Workspace>("iudex_status", { root });
          const next = data.tickets.find(
            (t) => t.state === "queued" && t.ready && !skipRef.current.has(t.id)
          );
          if (!next) break;
          try {
            await invoke("run_iudex", { root, args: ["activate", next.id] });
            await invoke("spawn_agent", { root, ticket: next.id, role: "impl" });
          } catch (e) {
            skipRef.current.add(next.id);
            setError(String(e));
          }
        }
      } finally {
        drainingRef.current = false;
        load(root);
      }
    })();
  }, [autoActivate, root, ws, load]);

  useEffect(() => {
    if (!autoQA || !root || !ws) return;
    const pendingQA = new Set(
      ws.tickets.filter((t) => t.state === "pending-qa").map((t) => t.id)
    );
    for (const id of qaHandledRef.current) {
      if (!pendingQA.has(id)) qaHandledRef.current.delete(id);
    }
    const candidates = [...pendingQA].filter((id) => !qaHandledRef.current.has(id));
    if (candidates.length === 0 || qaDrainingRef.current) return;
    qaDrainingRef.current = true;
    (async () => {
      try {
        for (const id of candidates) {
          if (!autoQARef.current) break;
          const qaSessions = sessions.filter(
            (s) => s.kind === "agent" && s.role === "qa" && s.ticket === id
          );
          let live = false;
          for (const s of qaSessions) {
            try {
              const st = await invoke<{ dead: boolean }>("session_status", {
                name: s.name,
              });
              if (!st.dead) {
                live = true;
                break;
              }
            } catch {
              // unknown → treat as not-live
            }
          }
          qaHandledRef.current.add(id);
          if (live) continue;
          try {
            await invoke("spawn_agent", { root, ticket: id, role: "qa" });
          } catch (e) {
            setError(String(e));
          }
        }
      } finally {
        qaDrainingRef.current = false;
      }
    })();
  }, [autoQA, root, ws, sessions]);

  // ── Splash: no workspace open yet ──────────────────────────────────────────
  if (!root && !offerInit) {
    return (
      <main className={a.app}>
        <div className={a.splash}>
          <h1 className={a.logo}>iudex</h1>
          <button className={a.openBtn} onClick={pickAndOpen}>
            Open Folder
          </button>
          {error && <div className="error">{error}</div>}
        </div>
      </main>
    );
  }

  // ── Not a workspace: offer to initialize ───────────────────────────────────
  if (offerInit) {
    return (
      <main className={a.app}>
        <div className={a.splash}>
          <p className={a.notWs}>not an iudex workspace</p>
          <button className={a.openBtn} disabled={initing} onClick={initHere}>
            {initing ? "Initializing…" : "Initialize"}
          </button>
          <button className={a.linkBtn} onClick={pickAndOpen}>
            open a different folder
          </button>
          {error && <div className="error">{error}</div>}
        </div>
      </main>
    );
  }

  // ── Workspace open ─────────────────────────────────────────────────────────
  return (
    <main className={a.app}>
      <header className={a.bar}>
        <button className={a.wsName} onClick={pickAndOpen} title={root ?? ""}>
          {root ? basename(root) : ""}
        </button>
        {ws && (
          <span className={a.meta}>
            main: <b>{ws.mainBranch}</b> · max-active: <b>{ws.maxActive}</b> · qa-limit:{" "}
            <b>{ws.qaRejectLimit}</b>
            {lastSync && <span className={a.sync}> · synced {lastSync}</span>}
          </span>
        )}
      </header>

      {error && <div className="error">{error}</div>}

      {root && ws && (
        <>
          <nav className={a.nav}>
            {VIEWS.map((v) => (
              <button
                key={v.id}
                className={`${a.navItem} ${view === v.id ? a.active : ""}`}
                onClick={() => setView(v.id)}
              >
                {v.label}
              </button>
            ))}
          </nav>

          <section className={a.view}>
            {view === "dashboard" && (
              <Dashboard
                ws={ws}
                onJump={setView}
                onOpenReview={(id) => {
                  setFocusTicket(id);
                  setView("review");
                }}
                autoActivate={autoActivate}
                onToggleAutoActivate={toggleAutoActivate}
                autoQA={autoQA}
                onToggleAutoQA={toggleAutoQA}
              />
            )}
            {view === "tickets" && (
              <Tickets
                ws={ws}
                root={root}
                onOpenInTerminal={(name) => {
                  setFocusSession(name);
                  setView("terminal");
                }}
                onJumpToAgent={(name) => {
                  setFocusAgent(name);
                  setView("agents");
                }}
              />
            )}
            <div
              style={{ display: view === "terminal" ? "block" : "none" }}
              className={a.viewHost}
            >
              <Terminal
                visible={view === "terminal"}
                focus={focusSession}
                onFocusHandled={() => setFocusSession(null)}
              />
            </div>
            {view === "agents" && (
              <Agents
                ws={ws}
                root={root}
                focusAgent={focusAgent}
                onFocusHandled={() => setFocusAgent(null)}
              />
            )}
            {view === "worktrees" && (
              <Worktrees
                ws={ws}
                root={root}
                onOpenInTerminal={(name) => {
                  setFocusSession(name);
                  setView("terminal");
                }}
              />
            )}
            {view === "review" && (
              <Review
                ws={ws}
                root={root}
                focusTicket={focusTicket}
                onFocusHandled={() => setFocusTicket(null)}
                onOpenInTerminal={(name) => {
                  setFocusSession(name);
                  setView("terminal");
                }}
              />
            )}
            {view === "settings" && (
              <Settings root={root} onConfigSaved={() => load(root)} />
            )}
          </section>
        </>
      )}
    </main>
  );
}
