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
  LIGHT_THEME,
  NIGHT_THEME,
  readThemeFromDocument,
  type ThemePreference,
} from "@/lib/theme";
import {
  getThemeFromStore,
  setThemeInStore,
} from "@/lib/progress-store";

type ThemeContextValue = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
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
  const [theme, setThemeState] = useState<ThemePreference>(LIGHT_THEME);

  useEffect(() => {
    if (!nightModeEnabled) {
      setThemeState(LIGHT_THEME);
      applyThemeToDocument(LIGHT_THEME);
      return;
    }
    const stored = getThemeFromStore();
    setThemeState(stored);
    applyThemeToDocument(stored);
  }, [nightModeEnabled]);

  const setTheme = useCallback(
    (next: ThemePreference) => {
      const resolved = nightModeEnabled ? next : LIGHT_THEME;
      setThemeState(resolved);
      applyThemeToDocument(resolved);
      if (nightModeEnabled) setThemeInStore(resolved);
    },
    [nightModeEnabled],
  );

  const toggleTheme = useCallback(() => {
    if (!nightModeEnabled) return;
    const current = readThemeFromDocument();
    setTheme(current === NIGHT_THEME ? LIGHT_THEME : NIGHT_THEME);
  }, [nightModeEnabled, setTheme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
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
