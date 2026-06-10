import { PROGRESS_STORAGE_KEY } from "@/lib/progress-store";

export type ThemePreference = "light" | "night";

export const THEME_ATTRIBUTE = "data-theme";
export const NIGHT_THEME: ThemePreference = "night";
export const LIGHT_THEME: ThemePreference = "light";
export const NIGHT_THEME_COLOR = "#1c2440";
export const LIGHT_THEME_COLOR = "#ffffff";

/** Blocking inline script — runs before paint to avoid FOUC. */
export const THEME_INIT_SCRIPT = `(function(){try{var r=localStorage.getItem("${PROGRESS_STORAGE_KEY}");var t="light";if(r){var p=JSON.parse(r);t=(p.preferences&&p.preferences.theme)||"light";}if(t==="night"){document.documentElement.setAttribute("${THEME_ATTRIBUTE}","night");}}catch(e){}})();`;

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "night";
}

export function normalizeTheme(value: unknown): ThemePreference {
  return isThemePreference(value) ? value : LIGHT_THEME;
}

export function applyThemeToDocument(theme: ThemePreference): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === NIGHT_THEME) {
    root.setAttribute(THEME_ATTRIBUTE, NIGHT_THEME);
  } else {
    root.removeAttribute(THEME_ATTRIBUTE);
  }
  updateThemeColorMeta(theme);
}

export function readThemeFromDocument(): ThemePreference {
  if (typeof document === "undefined") return LIGHT_THEME;
  return document.documentElement.getAttribute(THEME_ATTRIBUTE) === NIGHT_THEME
    ? NIGHT_THEME
    : LIGHT_THEME;
}

export function updateThemeColorMeta(theme: ThemePreference): void {
  if (typeof document === "undefined") return;
  const color = theme === NIGHT_THEME ? NIGHT_THEME_COLOR : LIGHT_THEME_COLOR;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = color;
}
