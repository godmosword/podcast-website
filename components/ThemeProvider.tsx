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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(LIGHT_THEME);

  useEffect(() => {
    const stored = getThemeFromStore();
    setThemeState(stored);
    applyThemeToDocument(stored);
  }, []);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    applyThemeToDocument(next);
    setThemeInStore(next);
  }, []);

  const toggleTheme = useCallback(() => {
    const current = readThemeFromDocument();
    setTheme(current === NIGHT_THEME ? LIGHT_THEME : NIGHT_THEME);
  }, [setTheme]);

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
