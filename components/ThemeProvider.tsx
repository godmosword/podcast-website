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
import { FEATURES } from "@/lib/features";
import {
  applyThemeToDocument,
  cycleThemeMode,
  LIGHT_THEME,
  resolveThemeFromMode,
  subscribeToSystemColorScheme,
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
  /** @deprecated Use cycleMode — kept for existing toggle callers. */
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
  /** build-time flag；關閉時鎖定日間模式 */
  nightModeEnabled?: boolean;
};

export function ThemeProvider({
  children,
  nightModeEnabled = FEATURES.nightMode,
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(SYSTEM_THEME_MODE);
  const [theme, setThemeState] = useState<ThemePreference>(LIGHT_THEME);

  const applyMode = useCallback(
    (nextMode: ThemeMode) => {
      const resolved = nightModeEnabled
        ? resolveThemeFromMode(nextMode)
        : LIGHT_THEME;
      setModeState(nightModeEnabled ? nextMode : SYSTEM_THEME_MODE);
      setThemeState(resolved);
      applyThemeToDocument(resolved);
      if (nightModeEnabled) setThemeInStore(nextMode);
    },
    [nightModeEnabled],
  );

  useEffect(() => {
    if (!nightModeEnabled) {
      setModeState(SYSTEM_THEME_MODE);
      setThemeState(LIGHT_THEME);
      applyThemeToDocument(LIGHT_THEME);
      return;
    }

    const stored = getThemeFromStore();
    applyMode(stored);
  }, [nightModeEnabled, applyMode]);

  useEffect(() => {
    if (!nightModeEnabled || mode !== SYSTEM_THEME_MODE) return;
    return subscribeToSystemColorScheme((resolved) => {
      setThemeState(resolved);
      applyThemeToDocument(resolved);
    });
  }, [nightModeEnabled, mode]);

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
    if (!nightModeEnabled) return;
    setMode(cycleThemeMode(mode));
  }, [nightModeEnabled, mode, setMode]);

  const toggleTheme = cycleMode;

  const value = useMemo(
    () => ({ mode, theme, setMode, setTheme, cycleMode, toggleTheme }),
    [mode, theme, setMode, setTheme, cycleMode, toggleTheme],
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
