// The unified tmux session pool — the persistence substrate the stateless GUI
// itself lacks. Agents and ad-hoc shells all live as tmux sessions in one pool,
// kind-tagged by name (`iudex-shell-N`, `iudex-agent-tN`). The GUI attaches to a
// session through a PTY for an interactive terminal, and reads a session's
// screen with `capture-pane` for the lightweight read-only peeks in the Agents
// grid. Sessions outlive the GUI: closing a terminal only detaches the client.

use std::collections::HashMap;
use std::io::{Read, Write};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;

use base64::Engine;
use portable_pty::{native_pty_system, Child, CommandBuilder, MasterPty, PtySize};
use tauri::{AppHandle, Emitter, State};

/// Every session this GUI owns is named with this prefix so we never touch the
/// user's own tmux sessions.
const PREFIX: &str = "iudex-";

/// A session in the pool, as surfaced to the frontend.
#[derive(serde::Serialize)]
pub struct Session {
    pub name: String,
    pub kind: String,           // "agent" | "shell"
    pub ticket: Option<String>, // set for agent sessions (e.g. "t3")
    pub title: String,          // display label
}

/// Map an `iudex-…` tmux session name back into a typed Session. Returns None
/// for names that aren't part of our pool.
fn parse_session(name: &str) -> Option<Session> {
    let rest = name.strip_prefix(PREFIX)?;
    let (kind, tail) = rest.split_once('-')?;
    match kind {
        "shell" => Some(Session {
            name: name.to_string(),
            kind: "shell".to_string(),
            ticket: None,
            title: format!("shell {tail}"),
        }),
        "agent" => Some(Session {
            name: name.to_string(),
            kind: "agent".to_string(),
            ticket: Some(tail.to_string()),
            title: format!("agent {tail}"),
        }),
        _ => None,
    }
}

/// A live PTY attached to a tmux session, held so its threads/handles outlive
/// the command that created it. Dropping it (via `close_terminal`) kills the
/// attach client — which only detaches; the tmux session lives on.
struct Pty {
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
    child: Box<dyn Child + Send + Sync>,
}

/// Holds every open interactive terminal, keyed by a frontend-supplied id.
#[derive(Default)]
pub struct PtyState(Mutex<HashMap<String, Pty>>);

static SEQ: AtomicU64 = AtomicU64::new(1);

/// True when a usable `tmux` is on PATH. The Terminal/Agents views degrade to a
/// hint when it isn't.
#[tauri::command]
pub fn tmux_available() -> bool {
    Command::new("tmux")
        .arg("-V")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

/// List the pool: every `iudex-…` tmux session. A missing tmux server just means
/// an empty pool, not an error.
#[tauri::command]
pub fn list_sessions() -> Result<Vec<Session>, String> {
    let out = Command::new("tmux")
        .args(["list-sessions", "-F", "#{session_name}"])
        .output()
        .map_err(|e| format!("tmux: {e}"))?;
    if !out.status.success() {
        let err = String::from_utf8_lossy(&out.stderr);
        if err.contains("no server running") || err.contains("error connecting") {
            return Ok(vec![]);
        }
        return Err(err.trim().to_string());
    }
    Ok(String::from_utf8_lossy(&out.stdout)
        .lines()
        .filter_map(parse_session)
        .collect())
}

/// Create a fresh detached shell session with the lowest free index.
#[tauri::command]
pub fn create_shell() -> Result<Session, String> {
    let existing = list_sessions()?;
    let mut n = 1;
    while existing.iter().any(|s| s.name == format!("{PREFIX}shell-{n}")) {
        n += 1;
    }
    let name = format!("{PREFIX}shell-{n}");
    let st = Command::new("tmux")
        .args(["new-session", "-d", "-s", &name])
        .status()
        .map_err(|e| format!("tmux new-session: {e}"))?;
    if !st.success() {
        return Err("tmux new-session failed".to_string());
    }
    parse_session(&name).ok_or_else(|| "internal: bad session name".to_string())
}

/// Launch (or relaunch) the agent for a ticket into the pool. Captures the
/// spawn command iudex prints for the ticket's *current* state (`iudex spawn`
/// — impl while active, QA once pending-qa), then runs it inside a fresh
/// `iudex-agent-<id>` tmux session. This is the deliberate bridge: iudex only
/// prints the command, the GUI is the hand that runs it. Any existing session
/// for the ticket is replaced so the agent always matches the ticket's state.
#[tauri::command]
pub fn spawn_agent(root: String, id: String) -> Result<Session, String> {
    let out = Command::new(crate::iudex_bin())
        .args(["spawn", &id])
        .current_dir(&root)
        .output()
        .map_err(|e| format!("iudex spawn: {e}"))?;
    if !out.status.success() {
        return Err(String::from_utf8_lossy(&out.stderr).trim().to_string());
    }
    let cmd = String::from_utf8_lossy(&out.stdout).trim().to_string();
    if cmd.is_empty() {
        return Err("iudex spawn produced no command".to_string());
    }

    let name = format!("{PREFIX}agent-{id}");
    // Replace any prior agent session for this ticket (e.g. impl → QA).
    let _ = Command::new("tmux")
        .args(["kill-session", "-t", &name])
        .status();
    let st = Command::new("tmux")
        .args(["new-session", "-d", "-s", &name, &cmd])
        .status()
        .map_err(|e| format!("tmux new-session: {e}"))?;
    if !st.success() {
        return Err("tmux new-session failed".to_string());
    }
    // Keep the pane after the agent process exits, so its exit status survives
    // for the status heuristic (alive→working/idle, exited 0→awaiting-finish,
    // exited non-zero→crashed). Without this the session would just vanish.
    let _ = Command::new("tmux")
        .args(["set-option", "-w", "-t", &name, "remain-on-exit", "on"])
        .status();
    parse_session(&name).ok_or_else(|| "internal: bad session name".to_string())
}

/// Process-liveness of a session's pane: whether its command has exited and, if
/// so, the exit code. Combined with output activity and ticket state on the
/// frontend, this yields the synthesized agent status. iudex has no liveness
/// signal of its own; this is the GUI's cheap process-level one.
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaneStatus {
    pub dead: bool,
    pub exit_code: Option<i32>,
}

#[tauri::command]
pub fn session_status(name: String) -> Result<PaneStatus, String> {
    let out = Command::new("tmux")
        .args([
            "display-message",
            "-p",
            "-t",
            &name,
            "-F",
            "#{pane_dead}|#{pane_dead_status}",
        ])
        .output()
        .map_err(|e| format!("tmux display-message: {e}"))?;
    if !out.status.success() {
        return Err(String::from_utf8_lossy(&out.stderr).trim().to_string());
    }
    let s = String::from_utf8_lossy(&out.stdout);
    let line = s.trim();
    let (dead_s, code_s) = line.split_once('|').unwrap_or((line, ""));
    let dead = dead_s.trim() == "1";
    let exit_code = if dead {
        code_s.trim().parse::<i32>().ok()
    } else {
        None
    };
    Ok(PaneStatus { dead, exit_code })
}

/// Kill a pool session (refusing anything outside our prefix). This ends the
/// session for real — used by the explicit "kill" action, not by tab close.
#[tauri::command]
pub fn kill_session(name: String) -> Result<(), String> {
    if !name.starts_with(PREFIX) {
        return Err(format!("refusing to kill non-iudex session {name}"));
    }
    Command::new("tmux")
        .args(["kill-session", "-t", &name])
        .status()
        .map_err(|e| format!("tmux kill-session: {e}"))?;
    Ok(())
}

/// Capture the last `lines` rows of a session's visible pane as plain text — the
/// data source for a read-only peek. Cheap enough to poll for a grid.
#[tauri::command]
pub fn capture_pane(name: String, lines: Option<i32>) -> Result<String, String> {
    let n = lines.unwrap_or(40);
    let start = format!("-{n}");
    let out = Command::new("tmux")
        .args(["capture-pane", "-p", "-t", &name, "-S", &start])
        .output()
        .map_err(|e| format!("tmux capture-pane: {e}"))?;
    if !out.status.success() {
        return Err(String::from_utf8_lossy(&out.stderr).trim().to_string());
    }
    Ok(String::from_utf8_lossy(&out.stdout).into_owned())
}

/// Attach to a session through a PTY and stream its output to the frontend as
/// `pty-{id}` events (base64 chunks). The frontend supplies the id so it can
/// subscribe before output flows. `readonly` uses tmux's `-r` so a peek can
/// never inject a keystroke. Returns once the attach is running.
#[tauri::command]
pub fn open_terminal(
    app: AppHandle,
    state: State<PtyState>,
    id: String,
    name: String,
    readonly: bool,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let pair = native_pty_system()
        .openpty(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("openpty: {e}"))?;

    let mut cmd = CommandBuilder::new("tmux");
    if readonly {
        cmd.args(["attach-session", "-r", "-t", &name]);
    } else {
        cmd.args(["attach-session", "-t", &name]);
    }
    cmd.env("TERM", "xterm-256color");

    let child = pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| format!("spawn tmux attach: {e}"))?;
    drop(pair.slave);

    let reader = pair
        .master
        .try_clone_reader()
        .map_err(|e| format!("clone reader: {e}"))?;
    let writer = pair
        .master
        .take_writer()
        .map_err(|e| format!("take writer: {e}"))?;

    // Pump PTY output to the frontend until EOF, then signal exit.
    let out_event = format!("pty-{id}");
    let exit_event = format!("pty-{id}-exit");
    let app2 = app.clone();
    std::thread::spawn(move || {
        let mut reader = reader;
        let mut buf = [0u8; 8192];
        let engine = base64::engine::general_purpose::STANDARD;
        loop {
            match reader.read(&mut buf) {
                Ok(0) | Err(_) => break,
                Ok(n) => {
                    let _ = app2.emit(&out_event, engine.encode(&buf[..n]));
                }
            }
        }
        let _ = app2.emit(&exit_event, ());
    });

    state.0.lock().unwrap().insert(
        id,
        Pty {
            master: pair.master,
            writer,
            child,
        },
    );
    Ok(())
}

/// Feed keystrokes from xterm into a terminal's PTY.
#[tauri::command]
pub fn write_terminal(state: State<PtyState>, id: String, data: String) -> Result<(), String> {
    let mut map = state.0.lock().unwrap();
    let pty = map.get_mut(&id).ok_or("no such terminal")?;
    pty.writer
        .write_all(data.as_bytes())
        .map_err(|e| e.to_string())?;
    pty.writer.flush().map_err(|e| e.to_string())?;
    Ok(())
}

/// Resize a terminal's PTY (and thus the attached tmux client).
#[tauri::command]
pub fn resize_terminal(
    state: State<PtyState>,
    id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let map = state.0.lock().unwrap();
    let pty = map.get(&id).ok_or("no such terminal")?;
    pty.master
        .resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Close a terminal: kill the attach client, which detaches without ending the
/// tmux session. The session keeps running for the next attach.
#[tauri::command]
pub fn close_terminal(state: State<PtyState>, id: String) -> Result<(), String> {
    if let Some(mut pty) = state.0.lock().unwrap().remove(&id) {
        let _ = pty.child.kill();
    }
    Ok(())
}

/// Allocate a unique terminal id (used when the frontend wants the backend to
/// pick one; the frontend usually supplies its own).
#[tauri::command]
pub fn next_terminal_id() -> String {
    format!("pty{}", SEQ.fetch_add(1, Ordering::Relaxed))
}
