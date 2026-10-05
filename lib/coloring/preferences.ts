import type { BrushSizeId, ColoringTool } from "./tools";
export type ColoringPreferences = {
  tool: ColoringTool;
  colorHex: string;
  brushSize: BrushSizeId;
  guided: boolean;
  usedBucket: boolean;
};
export const COLORING_PREFERENCES_KEY = "coloring:preferences:v2";
export const DEFAULT_COLORING_PREFERENCES: ColoringPreferences = {
  tool: "crayon",
  colorHex: "#e85d4c",
  brushSize: "medium",
  guided: true,
  usedBucket: false,
};
export function loadColoringPreferences(): ColoringPreferences {
  try {
    const p = JSON.parse(
      localStorage.getItem(COLORING_PREFERENCES_KEY) ?? "{}",
    );
    return {
      tool: ["crayon", "bucket", "eraser"].includes(p.tool) ? p.tool : "crayon",
      colorHex: /^#[0-9a-f]{6}$/i.test(p.colorHex)
        ? p.colorHex
        : DEFAULT_COLORING_PREFERENCES.colorHex,
      brushSize: ["small", "medium", "large"].includes(p.brushSize)
        ? p.brushSize
        : "medium",
      guided: p.guided !== false,
      usedBucket: p.usedBucket === true,
    };
  } catch {
    return { ...DEFAULT_COLORING_PREFERENCES };
  }
}
export function saveColoringPreferences(p: ColoringPreferences) {
  try {
    localStorage.setItem(COLORING_PREFERENCES_KEY, JSON.stringify(p));
  } catch {
    /* painting remains available */
  }
}
