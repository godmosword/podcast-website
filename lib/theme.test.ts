import { describe, expect, it } from "vitest";
import {
  cycleThemeMode,
  LIGHT_THEME,
  NIGHT_THEME,
  normalizeTheme,
  normalizeThemeMode,
  resolveThemeFromMode,
  SYSTEM_THEME_MODE,
  THEME_INIT_SCRIPT,
  THEME_ATTRIBUTE,
} from "./theme";
import { PROGRESS_STORAGE_KEY } from "./progress-store";

describe("theme helpers", () => {
  it("normalizes unknown theme modes to system", () => {
    expect(normalizeThemeMode("system")).toBe(SYSTEM_THEME_MODE);
    expect(normalizeThemeMode("light")).toBe(LIGHT_THEME);
    expect(normalizeThemeMode("night")).toBe(NIGHT_THEME);
    expect(normalizeThemeMode("dawn")).toBe(SYSTEM_THEME_MODE);
    expect(normalizeThemeMode(undefined)).toBe(SYSTEM_THEME_MODE);
  });

  it("normalizes unknown resolved themes to light", () => {
    expect(normalizeTheme("night")).toBe(NIGHT_THEME);
    expect(normalizeTheme("light")).toBe(LIGHT_THEME);
    expect(normalizeTheme("dawn")).toBe(LIGHT_THEME);
    expect(normalizeTheme(undefined)).toBe(LIGHT_THEME);
  });

  it("cycles system → light → night → system", () => {
    expect(cycleThemeMode(SYSTEM_THEME_MODE)).toBe(LIGHT_THEME);
    expect(cycleThemeMode(LIGHT_THEME)).toBe(NIGHT_THEME);
    expect(cycleThemeMode(NIGHT_THEME)).toBe(SYSTEM_THEME_MODE);
  });

  it("embeds storage key, theme attribute, and system mode in init script", () => {
    expect(THEME_INIT_SCRIPT).toContain(PROGRESS_STORAGE_KEY);
    expect(THEME_INIT_SCRIPT).toContain(THEME_ATTRIBUTE);
    expect(THEME_INIT_SCRIPT).toContain('"night"');
    expect(THEME_INIT_SCRIPT).toContain('"system"');
    expect(THEME_INIT_SCRIPT).toContain("prefers-color-scheme");
  });
});

describe("resolveThemeFromMode", () => {
  it("returns fixed light/night modes directly", () => {
    expect(resolveThemeFromMode(LIGHT_THEME)).toBe(LIGHT_THEME);
    expect(resolveThemeFromMode(NIGHT_THEME)).toBe(NIGHT_THEME);
  });
});

describe("theme init script runtime", () => {
  function runInitScript(
    storeValue: string | null,
    prefersDark = false,
  ): Record<string, string> {
    const store = new Map<string, string>();
    if (storeValue !== null) {
      store.set(PROGRESS_STORAGE_KEY, storeValue);
    }

    const documentElement = {
      attributes: {} as Record<string, string>,
      setAttribute(name: string, value: string) {
        this.attributes[name] = value;
      },
      removeAttribute(name: string) {
        delete this.attributes[name];
      },
      getAttribute(name: string) {
        return this.attributes[name] ?? null;
      },
    };

    const localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
    };

    const matchMedia = () => ({
      matches: prefersDark,
      addEventListener: () => {},
      removeEventListener: () => {},
    });

    // eslint-disable-next-line no-new-func
    const run = new Function(
      "localStorage",
      "document",
      "window",
      THEME_INIT_SCRIPT,
    );
    run(localStorage, { documentElement }, { matchMedia });

    return documentElement.attributes;
  }

  it("sets night attribute when preferences.theme is night", () => {
    const attrs = runInitScript(
      JSON.stringify({ preferences: { theme: "night" } }),
    );
    expect(attrs[THEME_ATTRIBUTE]).toBe("night");
  });

  it("follows system dark preference when mode is system", () => {
    const darkAttrs = runInitScript(
      JSON.stringify({ preferences: { theme: "system" } }),
      true,
    );
    expect(darkAttrs[THEME_ATTRIBUTE]).toBe("night");

    const lightAttrs = runInitScript(
      JSON.stringify({ preferences: { theme: "system" } }),
      false,
    );
    expect(lightAttrs[THEME_ATTRIBUTE]).toBeUndefined();
  });

  it("defaults to system when no stored preference", () => {
    const darkAttrs = runInitScript(null, true);
    expect(darkAttrs[THEME_ATTRIBUTE]).toBe("night");
  });
});
