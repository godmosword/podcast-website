import { describe, expect, it } from "vitest";
import {
  LIGHT_THEME,
  NIGHT_THEME,
  normalizeTheme,
  THEME_INIT_SCRIPT,
  THEME_ATTRIBUTE,
} from "./theme";
import { PROGRESS_STORAGE_KEY } from "./progress-store";

describe("theme helpers", () => {
  it("normalizes unknown values to light", () => {
    expect(normalizeTheme("night")).toBe(NIGHT_THEME);
    expect(normalizeTheme("light")).toBe(LIGHT_THEME);
    expect(normalizeTheme("dawn")).toBe(LIGHT_THEME);
    expect(normalizeTheme(undefined)).toBe(LIGHT_THEME);
  });

  it("embeds storage key and theme attribute in init script", () => {
    expect(THEME_INIT_SCRIPT).toContain(PROGRESS_STORAGE_KEY);
    expect(THEME_INIT_SCRIPT).toContain(THEME_ATTRIBUTE);
    expect(THEME_INIT_SCRIPT).toContain('"night"');
  });
});

describe("theme init script runtime", () => {
  it("sets night attribute when preferences.theme is night", () => {
    const store = new Map<string, string>();
    store.set(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ preferences: { theme: "night" } }),
    );

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

    // eslint-disable-next-line no-new-func
    const run = new Function("localStorage", "document", THEME_INIT_SCRIPT);
    run(localStorage, { documentElement: documentElement });

    expect(documentElement.getAttribute(THEME_ATTRIBUTE)).toBe("night");
  });
});
