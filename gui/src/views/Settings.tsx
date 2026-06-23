import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Config } from "../types";
import ViewHeader from "../components/ViewHeader";
import s from "./Settings.module.scss";

type Saved = { ok: boolean; msg: string } | null;
type SubTab = "general" | "prompts";

const SUBTABS: { id: SubTab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "prompts", label: "Prompts" },
];

// The settings surface, split into subtabs by category — General (the
// config.yml fields) and Prompts (the impl/review templates) — each with its own
// Save. Reads/writes the files directly (config editing isn't state-machine
// logic); config writes are surgical so comments survive, and prompts use plain
// textareas since Monaco is read-only everywhere by design.
export default function Settings({
  root,
  onConfigSaved,
}: {
  root: string;
  onConfigSaved: () => void;
}) {
  const [tab, setTab] = useState<SubTab>("general");
  const [config, setConfig] = useState<Config | null>(null);
  const [impl, setImpl] = useState("");
  const [review, setReview] = useState("");
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      invoke<Config>("read_config", { root }),
      invoke<string>("read_prompt", { root, name: "impl" }),
      invoke<string>("read_prompt", { root, name: "review" }),
    ])
      .then(([c, i, r]) => {
        if (!alive) return;
        setConfig(c);
        setImpl(i);
        setReview(r);
        setLoadErr(null);
      })
      .catch((e) => alive && setLoadErr(String(e)));
    return () => {
      alive = false;
    };
  }, [root]);

  return (
    <div className={s.settings}>
      <ViewHeader
        dot="#8a8f99"
        title="Settings"
        subtitle={tab === "general" ? ".iudex/config.yml" : ".iudex/prompts/"}
      />
      <div className={s.row}>
        <div className={s.sidebar}>
          <div className={s.sideHead}>SETTINGS</div>
          {SUBTABS.map((t) => (
            <button
              key={t.id}
              className={`${s.sideItem} ${tab === t.id ? s.active : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className={s.body}>
          {loadErr ? (
            <div className="error">{loadErr}</div>
          ) : !config ? (
            <div className={s.loading}>loading config…</div>
          ) : tab === "general" ? (
            <GeneralTab
              config={config}
              setConfig={setConfig}
              root={root}
              onConfigSaved={onConfigSaved}
            />
          ) : (
            <PromptsTab
              root={root}
              impl={impl}
              setImpl={setImpl}
              review={review}
              setReview={setReview}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SavedNote({ saved }: { saved: Saved }) {
  if (!saved) return null;
  return (
    <span className={saved.ok ? s.savedOk : s.savedErr}>
      {saved.ok ? "✓ " : "✗ "}
      {saved.msg}
    </span>
  );
}

function GeneralTab({
  config,
  setConfig,
  root,
  onConfigSaved,
}: {
  config: Config;
  setConfig: (c: Config) => void;
  root: string;
  onConfigSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<Saved>(null);

  const set = <K extends keyof Config>(k: K, v: Config[K]) => {
    setConfig({ ...config, [k]: v });
    setSaved(null);
  };

  const save = async () => {
    setBusy(true);
    setSaved(null);
    try {
      await invoke("write_config", { root, config });
      // Confirm the CLI can still parse what we wrote.
      await invoke("iudex_status", { root });
      onConfigSaved();
      setSaved({ ok: true, msg: "saved" });
    } catch (e) {
      setSaved({ ok: false, msg: String(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={s.card}>
      <div className={s.head}>
        <span className={s.title}>General · config.yml</span>
        <code className={s.path}>.iudex/config.yml</code>
      </div>

      <div className={s.fields}>
      <label className="field">
        <span>Main branch</span>
        <input value={config.mainBranch} onChange={(e) => set("mainBranch", e.target.value)} />
        <small className={`${s.note} ${s.caution}`}>
          ⚠ the canonical merge target — set at init; changing it affects activate/merge.
        </small>
      </label>

      <label className={`field ${s.narrow}`}>
        <span>Max active</span>
        <input
          type="number"
          value={config.maxActive}
          onChange={(e) => set("maxActive", Number(e.target.value))}
        />
        <small className={s.note}>0 = unlimited</small>
      </label>

      <label className={`field ${s.narrow}`}>
        <span>QA reject limit</span>
        <input
          type="number"
          value={config.qaRejectLimit}
          onChange={(e) => set("qaRejectLimit", Number(e.target.value))}
        />
        <small className={s.note}>≤ 0 = unlimited</small>
      </label>

      <label className={`field ${s.narrow}`}>
        <span>Merge strategy</span>
        <select value={config.mergeStrategy} onChange={(e) => set("mergeStrategy", e.target.value)}>
          <option value="no-ff">no-ff</option>
          <option value="squash">squash</option>
        </select>
      </label>

      <label className="field">
        <span>Agent command</span>
        <input value={config.agentCommand} onChange={(e) => set("agentCommand", e.target.value)} />
      </label>

      <label className="field">
        <span>Merge message template</span>
        <input
          value={config.mergeMessageTemplate}
          onChange={(e) => set("mergeMessageTemplate", e.target.value)}
        />
        <small className={s.note}>
          <code>{"{{.Ticket}}"}</code> is substituted with the ticket id.
        </small>
      </label>

      <label className="field">
        <span>Branch prefix</span>
        <input value={config.branchPrefix} onChange={(e) => set("branchPrefix", e.target.value)} />
        <small className={`${s.note} ${s.caution}`}>
          ⚠ applies to new tickets only — existing worktrees keep their branch.
        </small>
      </label>
      </div>

      <div className={s.actions}>
        <SavedNote saved={saved} />
        <button disabled={busy} onClick={save}>
          {busy ? "Saving…" : "Save general"}
        </button>
      </div>
    </section>
  );
}

function PromptsTab({
  root,
  impl,
  setImpl,
  review,
  setReview,
}: {
  root: string;
  impl: string;
  setImpl: (v: string) => void;
  review: string;
  setReview: (v: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<Saved>(null);

  const save = async () => {
    setBusy(true);
    setSaved(null);
    try {
      await invoke("write_prompt", { root, name: "impl", content: impl });
      await invoke("write_prompt", { root, name: "review", content: review });
      setSaved({ ok: true, msg: "saved" });
    } catch (e) {
      setSaved({ ok: false, msg: String(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={s.card}>
      <div className={s.head}>
        <span className={s.title}>Prompt templates</span>
        <code className={s.path}>.iudex/prompts/</code>
      </div>

      <div className={s.fields}>
      <label className="field">
        <span>
          Impl prompt <code className={s.path}>impl.md</code>
        </span>
        <textarea
          className={s.prompt}
          rows={14}
          value={impl}
          onChange={(e) => {
            setImpl(e.target.value);
            setSaved(null);
          }}
          spellCheck={false}
        />
      </label>

      <label className="field">
        <span>
          Review prompt <code className={s.path}>review.md</code>
        </span>
        <textarea
          className={s.prompt}
          rows={14}
          value={review}
          onChange={(e) => {
            setReview(e.target.value);
            setSaved(null);
          }}
          spellCheck={false}
        />
      </label>
      </div>

      <div className={s.actions}>
        <SavedNote saved={saved} />
        <button disabled={busy} onClick={save}>
          {busy ? "Saving…" : "Save prompts"}
        </button>
      </div>
    </section>
  );
}
