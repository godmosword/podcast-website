import {
  BEDTIME_ATTRIBUTE,
  BEDTIME_END_HOUR,
  BEDTIME_START_HOUR,
  isLocalBedtimeHour,
} from "@/lib/bedtime";
import { PROGRESS_STORAGE_KEY } from "@/lib/progress-keys";

/** Stored user preference — may follow OS/browser color scheme. */
export type ThemeMode = "light" | "night" | "system";

/** Resolved theme applied to the document. */
export type ThemePreference = "light" | "night";

export const THEME_ATTRIBUTE = "data-theme";
export const NIGHT_THEME: ThemePreference = "night";
export const LIGHT_THEME: ThemePreference = "light";
export const SYSTEM_THEME_MODE: ThemeMode = "system";
const NIGHT_THEME_COLOR = "#1e2438";
const LIGHT_THEME_COLOR = "#ffffff";

const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

function prefersDarkColorScheme(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(DARK_SCHEME_QUERY).matches;
}

export type ResolveThemeOptions = {
  prefersDark?: boolean;
  hour?: number;
};

export function isBedtimeActive(
  mode: ThemeMode,
  hour: number = new Date().getHours(),
): boolean {
  if (mode === LIGHT_THEME) return false;
  return isLocalBedtimeHour(hour);
}

export function resolveThemeFromMode(
  mode: ThemeMode,
  options?: ResolveThemeOptions,
): ThemePreference {
  if (mode === NIGHT_THEME) return NIGHT_THEME;
  if (mode === LIGHT_THEME) return LIGHT_THEME;
  const hour = options?.hour ?? new Date().getHours();
  const prefersDark = options?.prefersDark ?? prefersDarkColorScheme();
  const bedtime = isLocalBedtimeHour(hour);
  return prefersDark || bedtime ? NIGHT_THEME : LIGHT_THEME;
}

export function applyBedtimeToDocument(active: boolean): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (active) {
    root.setAttribute(BEDTIME_ATTRIBUTE, "true");
  } else {
    root.removeAttribute(BEDTIME_ATTRIBUTE);
  }
}

export function syncBedtimeFromMode(mode: ThemeMode, hour?: number): void {
  applyBedtimeToDocument(isBedtimeActive(mode, hour));
}

/** Blocking inline script — runs before paint to avoid FOUC. */
export const THEME_INIT_SCRIPT = `(function(){try{var r=localStorage.getItem("${PROGRESS_STORAGE_KEY}");var m="system";if(r){var p=JSON.parse(r);m=(p.preferences&&p.preferences.theme)||"system";}var h=new Date().getHours();var bedtime=h>=${BEDTIME_START_HOUR}||h<${BEDTIME_END_HOUR};var dark=false;if(m==="night"){dark=true;}else if(m==="system"){var sys=window.matchMedia&&window.matchMedia("${DARK_SCHEME_QUERY}").matches;dark=sys||bedtime;}if(dark){document.documentElement.setAttribute("${THEME_ATTRIBUTE}","night");}if(bedtime&&m!=="light"){document.documentElement.setAttribute("${BEDTIME_ATTRIBUTE}","true");}}catch(e){}})();`;

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "night" || value === SYSTEM_THEME_MODE;
}

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "night";
}

export function normalizeThemeMode(value: unknown): ThemeMode {
  return isThemeMode(value) ? value : SYSTEM_THEME_MODE;
}

export function normalizeTheme(value: unknown): ThemePreference {
  return isThemePreference(value) ? value : LIGHT_THEME;
}

export function cycleThemeMode(mode: ThemeMode): ThemeMode {
  if (mode === SYSTEM_THEME_MODE) return LIGHT_THEME;
  if (mode === LIGHT_THEME) return NIGHT_THEME;
  return SYSTEM_THEME_MODE;
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

function updateThemeColorMeta(theme: ThemePreference): void {
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

export function subscribeToSystemColorScheme(
  onChange: (theme: ThemePreference) => void,
): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const media = window.matchMedia(DARK_SCHEME_QUERY);
  const handler = () => {
    onChange(media.matches ? NIGHT_THEME : LIGHT_THEME);
  };
  media.addEventListener("change", handler);
  return () => media.removeEventListener("change", handler);
}
