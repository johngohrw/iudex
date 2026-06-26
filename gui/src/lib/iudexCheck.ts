import { useCallback, useEffect, useState } from "react";
import * as api from "./api";

// Probe iudex CLI availability at startup (and on demand via recheck). The GUI
// shells every operation through the binary, so this gates the whole app — App
// renders a splash/recovery screen off { version, error, checking }.
export function useIudexCheck() {
  const [version, setVersion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const recheck = useCallback(async () => {
    setChecking(true);
    try {
      const v = await api.checkIudex();
      setVersion(v);
      setError(null);
    } catch (e) {
      setVersion(null);
      setError(String(e));
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    recheck();
  }, [recheck]);

  return { version, error, checking, recheck };
}
