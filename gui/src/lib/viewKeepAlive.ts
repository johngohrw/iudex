import { useEffect, useRef, useState } from "react";
import type { View } from "../types";

// Keep a view mounted (state preserved) after switching away; prune it only
// after this much inactivity — a separate timer per view.
const KEEP_ALIVE_MS = 10 * 60 * 1000;

// Track which views should stay mounted: the active one, plus recently-visited
// ones until their inactivity timer fires. App renders each mounted view hidden
// (not unmounted) so PTYs and scroll positions survive a tab switch.
export function useViewKeepAlive(view: View): View[] {
  const [mounted, setMounted] = useState<View[]>([view]);
  const prevViewRef = useRef<View>(view);
  const pruneTimers = useRef<Partial<Record<View, ReturnType<typeof setTimeout>>>>({});

  useEffect(() => {
    // Keep the active view mounted; cancel any pending prune for it.
    setMounted((m) => (m.includes(view) ? m : [...m, view]));
    const active = pruneTimers.current[view];
    if (active) {
      clearTimeout(active);
      delete pruneTimers.current[view];
    }
    // Start the inactivity timer for the view we just left.
    const prev = prevViewRef.current;
    if (prev !== view) {
      if (pruneTimers.current[prev]) clearTimeout(pruneTimers.current[prev]);
      pruneTimers.current[prev] = setTimeout(() => {
        setMounted((m) => m.filter((v) => v !== prev));
        delete pruneTimers.current[prev];
      }, KEEP_ALIVE_MS);
    }
    prevViewRef.current = view;
  }, [view]);

  // Clear all pending timers if the app itself unmounts.
  useEffect(() => {
    const timers = pruneTimers.current;
    return () => Object.values(timers).forEach((t) => t && clearTimeout(t));
  }, []);

  return mounted;
}
