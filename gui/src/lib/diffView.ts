import { useSyncExternalStore } from "react";

// Global, persisted inline/split preference shared by every DiffViewer instance.
// Backed by localStorage (survives restarts) and an in-process listener set so
// all currently-mounted diff viewers update the moment one toggles.
const KEY = "iudex.diffView"; // "split" | "inline"
const listeners = new Set<() => void>();

function getSnapshot(): boolean {
  return localStorage.getItem(KEY) === "split";
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  // Cross-window sync (multiple app windows share localStorage).
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function setDiffSideBySide(v: boolean): void {
  localStorage.setItem(KEY, v ? "split" : "inline");
  listeners.forEach((l) => l());
}

// [sideBySide, setSideBySide] — drop-in replacement for the old local useState.
export function useDiffSideBySide(): [boolean, (v: boolean) => void] {
  const sideBySide = useSyncExternalStore(subscribe, getSnapshot);
  return [sideBySide, setDiffSideBySide];
}
