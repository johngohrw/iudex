import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
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

// Convenience default for local dev; paste any workspace path.
const DEFAULT_PATH = "/Users/rengwu/Desktop/Projects/iudex-demo";

export default function App() {
  const [path, setPath] = useState(DEFAULT_PATH);
  const [root, setRoot] = useState<string | null>(null);
  const [ws, setWs] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  // True when the typed path exists but holds no iudex workspace — we then offer
  // to initialize one there instead of just erroring.
  const [offerInit, setOfferInit] = useState(false);
  const [initing, setIniting] = useState(false);
  const [lastSync, setLastSync] = useState<string>("");
  const [view, setView] = useState<View>("dashboard");
  // Set when another view (an agent peek) asks Terminal to focus a session.
  const [focusSession, setFocusSession] = useState<string | null>(null);
  // Set when the Dashboard opens a specific ticket straight into Review.
  const [focusTicket, setFocusTicket] = useState<string | null>(null);
  // Set when a ticket detail panel wants to jump to a specific agent in Agents.
  const [focusAgent, setFocusAgent] = useState<string | null>(null);
  // The PRD's one sanctioned automation: when on, ready tickets (queued, deps
  // done, under max_active) are activated automatically. Persisted per-workspace.
  const [autoActivate, setAutoActivate] = useState(false);
  const autoActivateRef = useRef(false); // so the async drain sees toggle-off
  const drainingRef = useRef(false); // prevents overlapping drain passes
  const skipRef = useRef<Set<string>>(new Set()); // ids that errored this session
  // The symmetric automation for the QA gate: auto-spawn a QA agent for each
  // pending-qa ticket (the agent then runs `qa approve/reject` itself). Unlike
  // activate, spawning doesn't change ticket state, so a per-episode "handled"
  // set prevents re-spawning on every tick; it's cleared when a ticket leaves
  // pending-qa so a reject→refinish gets a fresh QA agent.
  const [autoQA, setAutoQA] = useState(false);
  const autoQARef = useRef(false);
  const qaDrainingRef = useRef(false);
  const qaHandledRef = useRef<Set<string>>(new Set());
  // The session pool — needed to detect an already-live QA agent (manual spawn
  // or one that survived a GUI restart) so auto-QA doesn't double up.
  const { sessions } = useSessions();

  const aaKey = (r: string) => `iudex.autoActivate.${r}`;
  const qaKey = (r: string) => `iudex.autoQA.${r}`;

  // The sole read path: re-run `iudex status --json` and replace local view.
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

  // Wire up a resolved workspace root: read it and start the doorbell.
  const enter = useCallback(
    async (r: string) => {
      setRoot(r);
      setError(null);
      setOfferInit(false);
      await load(r);
      // Start the doorbell: any events.jsonl change triggers a re-read.
      await invoke("watch_workspace", { root: r });
    },
    [load]
  );

  async function open() {
    try {
      const r = await invoke<string>("discover_workspace", { start: path });
      await enter(r);
    } catch (e) {
      const msg = String(e);
      setRoot(null);
      setWs(null);
      // A resolvable folder with no workspace → offer to initialize one there;
      // anything else (e.g. a bad path) is a real error.
      if (msg.includes("not inside an iudex workspace")) {
        setOfferInit(true);
        setError(null);
      } else {
        setError(msg);
        setOfferInit(false);
      }
    }
  }

  async function initHere() {
    setIniting(true);
    try {
      const r = await invoke<string>("init_workspace", { path });
      await enter(r);
    } catch (e) {
      setError(String(e));
    } finally {
      setIniting(false);
    }
  }

  // Subscribe once per workspace: the backend emits `events-changed`; we re-read.
  useEffect(() => {
    if (!root) return;
    const un = listen("events-changed", () => load(root));
    return () => {
      un.then((f) => f());
    };
  }, [root, load]);

  // Restore the per-workspace automation preferences once root resolves.
  useEffect(() => {
    if (!root) return;
    skipRef.current.clear();
    qaHandledRef.current.clear();
    setAutoActivate(localStorage.getItem(aaKey(root)) === "true");
    setAutoQA(localStorage.getItem(qaKey(root)) === "true");
  }, [root]);

  // Keep the toggle handler honest: mirror into the ref the drain loop reads,
  // persist per-workspace, and forget prior errors so a flip retries cleanly.
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
      qaHandledRef.current.clear(); // re-evaluate every pending-qa ticket fresh
      if (root) localStorage.setItem(qaKey(root), String(v));
      setAutoQA(v);
    },
    [root]
  );

  // Drain ready tickets while auto-activate is on. Self-contained: it re-reads
  // status each iteration (so deps + the max_active cap, both baked into
  // `ready`, stay current as slots fill) rather than leaning on the doorbell to
  // re-enter. Mirrors the manual activate path — activate then spawn the impl
  // agent — minus the view jump. Errors park the id in skipRef so a failing
  // ticket can't spin the loop.
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

  // Auto-spawn a QA agent for each pending-qa ticket. One pass over the current
  // pending-qa set (spawning, unlike activate, doesn't mutate ws, so there's
  // nothing to re-read): mark each handled, skipping any that already has a
  // LIVE qa session. `ws` re-triggers as tickets enter pending-qa; the sessions
  // poll re-triggers but is a no-op once everything is handled. Episode marks
  // are cleared here as tickets leave pending-qa, so a reject→refinish re-QAs.
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
          // Already covered by a live QA agent (manual spawn or restart)? Mark
          // handled without spawning. A dead session doesn't count — that's a
          // crash or a prior episode.
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

  return (
    <main className={a.app}>
      <header className={a.bar}>
        <input
          value={path}
          onChange={(e) => {
            setPath(e.target.value);
            setOfferInit(false);
            setError(null);
          }}
          placeholder="path to an iudex workspace"
          spellCheck={false}
        />
        <button onClick={open}>Open</button>
        {ws && (
          <span className={a.meta}>
            main: <b>{ws.mainBranch}</b> · max-active: <b>{ws.maxActive}</b> · qa-limit:{" "}
            <b>{ws.qaRejectLimit}</b>
            {lastSync && <span className={a.sync}> · synced {lastSync}</span>}
          </span>
        )}
      </header>

      {error && <div className="error">{error}</div>}

      {offerInit && (
        <div className={a.initOffer}>
          <div>
            No iudex workspace at <code>{path}</code>.
            <span className={a.initHint}>
              {" "}
              Initializing creates <code>.iudex/</code> here (and a git repo with an
              initial commit if there isn’t one).
            </span>
          </div>
          <button disabled={initing} onClick={initHere}>
            {initing ? "Initializing…" : "Initialize iudex here"}
          </button>
        </div>
      )}

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
            {/* Terminal stays mounted across view switches so its tabs and
                live PTYs survive; we only toggle its visibility. */}
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
