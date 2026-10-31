"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  applyPrefs,
  DEFAULT_PREFS,
  readPrefs,
  savePrefs,
  systemPrefersDark,
  type Prefs,
} from "@/lib/prefs";

interface PrefsContextValue {
  prefs: Prefs;
  /** Whether dark mode is currently showing (resolves "system"). */
  isDark: boolean;
  update: (patch: Partial<Prefs>) => void;
  reset: () => void;
}

const PrefsContext = createContext<PrefsContextValue | null>(null);

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  // The <head> script has already applied stored prefs to <html>; state starts at
  // the defaults on the server and catches up after mount. Controls only live in
  // closed popovers, so nothing visibly changes.
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    // Sync from storage once on mount: a client-only source the server can't read.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefs(readPrefs());
    setSystemDark(systemPrefersDark());

    // Follow OS changes live while any setting is "system".
    const queries = [
      "(prefers-color-scheme: dark)",
      "(prefers-contrast: more)",
    ].map((query) => window.matchMedia(query));
    const onChange = () => {
      setSystemDark(systemPrefersDark());
      applyPrefs(readPrefs());
    };
    queries.forEach((mq) => mq.addEventListener("change", onChange));
    return () =>
      queries.forEach((mq) => mq.removeEventListener("change", onChange));
  }, []);

  const commit = useCallback((next: Prefs) => {
    setPrefs(next);
    savePrefs(next);
    applyPrefs(next);
  }, []);

  const update = useCallback(
    (patch: Partial<Prefs>) => commit({ ...readPrefs(), ...patch }),
    [commit],
  );
  const reset = useCallback(() => commit(DEFAULT_PREFS), [commit]);

  const value = useMemo<PrefsContextValue>(
    () => ({
      prefs,
      isDark:
        prefs.theme === "dark" || (prefs.theme === "system" && systemDark),
      update,
      reset,
    }),
    [prefs, systemDark, update, reset],
  );

  return <PrefsContext value={value}>{children}</PrefsContext>;
}

export function usePrefs(): PrefsContextValue {
  const context = use(PrefsContext);
  if (!context) throw new Error("usePrefs must be used inside <PrefsProvider>");
  return context;
}
