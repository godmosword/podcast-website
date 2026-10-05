import { afterEach, expect, test, vi } from "vitest";
import {
  DEFAULT_COLORING_PREFERENCES,
  loadColoringPreferences,
  saveColoringPreferences,
} from "./preferences";
afterEach(() => vi.unstubAllGlobals());
test("returning artists recover their tools and completed guidance", () => {
  let raw: string | null = null;
  vi.stubGlobal("localStorage", {
    getItem: () => raw,
    setItem: (_key: string, value: string) => { raw = value; },
  });
  const preferences = {
    tool: "eraser" as const, colorHex: "#123456", brushSize: "large" as const,
    guided: false, usedBucket: true,
  };
  saveColoringPreferences(preferences);
  expect(loadColoringPreferences()).toEqual(preferences);
});
test("invalid preference fields and corrupt storage recover usable defaults", () => {
  for (const raw of ["{", "null", JSON.stringify({
    tool: "invalid", colorHex: "red", brushSize: "huge", guided: "false", usedBucket: "true",
  })]) {
    vi.stubGlobal("localStorage", { getItem: () => raw });
    expect(loadColoringPreferences()).toEqual(DEFAULT_COLORING_PREFERENCES);
  }
});
test("blocked preference storage never prevents painting", () => {
  vi.stubGlobal("localStorage", {
    getItem: () => { throw new Error("blocked"); },
    setItem: () => { throw new Error("quota"); },
  });
  expect(loadColoringPreferences()).toEqual(DEFAULT_COLORING_PREFERENCES);
  expect(() => saveColoringPreferences(DEFAULT_COLORING_PREFERENCES)).not.toThrow();
});
