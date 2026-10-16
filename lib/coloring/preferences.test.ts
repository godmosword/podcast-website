import { afterEach, expect, test, vi } from "vitest";
import { LEGACY_TO_CURRENT_HEX } from "./palette-migration";
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
    tool: "eraser" as const, colorHex: "#5c86b0", brushSize: "large" as const,
    guided: false, usedBucket: true,
  };
  saveColoringPreferences(preferences);
  expect(loadColoringPreferences()).toEqual(preferences);
});
test("舊飽和色碼換成同 id 的粉彩，不在對照表裡的色碼退回預設", () => {
  const cases: { stored: string; expected: string }[] = [
    { stored: "#e85d4c", expected: LEGACY_TO_CURRENT_HEX["#e85d4c"]! },
    { stored: "#E85D4C", expected: LEGACY_TO_CURRENT_HEX["#e85d4c"]! },
    { stored: "#f2c94c", expected: LEGACY_TO_CURRENT_HEX["#f2c94c"]! },
    { stored: "#56ccf2", expected: LEGACY_TO_CURRENT_HEX["#56ccf2"]! },
    { stored: "#123456", expected: DEFAULT_COLORING_PREFERENCES.colorHex },
    { stored: "#ffffff", expected: "#ffffff" },
  ];
  for (const { stored, expected } of cases) {
    vi.stubGlobal("localStorage", {
      getItem: () => JSON.stringify({ colorHex: stored, tool: "crayon" }),
    });
    expect(loadColoringPreferences().colorHex).toBe(expected);
  }
  expect(LEGACY_TO_CURRENT_HEX["#e85d4c"]).toBe("#e7a8a0");
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
