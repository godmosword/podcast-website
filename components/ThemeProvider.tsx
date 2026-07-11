"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyThemeToDocument,
  cycleThemeMode,
  LIGHT_THEME,
  resolveThemeFromMode,
  subscribeToSystemColorScheme,
  syncBedtimeFromMode,
  SYSTEM_THEME_MODE,
  type ThemeMode,
  type ThemePreference,
} from "@/lib/theme";
import {
  getThemeFromStore,
  setThemeInStore,
} from "@/lib/progress-store";

type ThemeContextValue = {
  /** Stored preference — may be system. */
  mode: ThemeMode;
  /** Resolved theme currently applied to the document. */
  theme: ThemePreference;
  setMode: (mode: ThemeMode) => void;
  /** Force a fixed light/night preference (clears system follow). */
  setTheme: (theme: ThemePreference) => void;
  /** Cycle system → light → night. */
  cycleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(SYSTEM_THEME_MODE);
  const [theme, setThemeState] = useState<ThemePreference>(LIGHT_THEME);

  const applyMode = useCallback((nextMode: ThemeMode) => {
    const resolved = resolveThemeFromMode(nextMode);
    setModeState(nextMode);
    setThemeState(resolved);
    applyThemeToDocument(resolved);
    syncBedtimeFromMode(nextMode);
    setThemeInStore(nextMode);
  }, []);

  useEffect(() => {
    const stored = getThemeFromStore();
    applyMode(stored);
  }, [applyMode]);

  useEffect(() => {
    if (mode !== SYSTEM_THEME_MODE) return;
    return subscribeToSystemColorScheme(() => {
      const resolved = resolveThemeFromMode(SYSTEM_THEME_MODE);
      setThemeState(resolved);
      applyThemeToDocument(resolved);
      syncBedtimeFromMode(SYSTEM_THEME_MODE);
    });
  }, [mode]);

  // 睡前窗跨過整點時同步 theme／疊層（light 模式不進睡前）。
  useEffect(() => {
    if (mode === LIGHT_THEME) return;
    const tick = () => {
      const resolved = resolveThemeFromMode(mode);
      setThemeState(resolved);
      applyThemeToDocument(resolved);
      syncBedtimeFromMode(mode);
    };
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [mode]);

  const setMode = useCallback(
    (next: ThemeMode) => {
      applyMode(next);
    },
    [applyMode],
  );

  const setTheme = useCallback(
    (next: ThemePreference) => {
      applyMode(next);
    },
    [applyMode],
  );

  const cycleMode = useCallback(() => {
    setMode(cycleThemeMode(mode));
  }, [mode, setMode]);

  const value = useMemo(
    () => ({ mode, theme, setMode, setTheme, cycleMode }),
    [mode, theme, setMode, setTheme, cycleMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
