export type CanvasPalette = {
  road: string;
  roadMark: string;
  truck: string;
  wheel: string;
  firefly: string;
  fireflyGlow: string;
  gentleHint: string;
};

/** 與 globals.css token 同值的 fallback（getComputedStyle 不可用時）。 */
export const DEFAULT_CANVAS_PALETTE: CanvasPalette = {
  road: "#8d857b",
  roadMark: "rgba(255, 255, 255, 0.33)",
  truck: "#f7a8c4",
  wheel: "#34302b",
  firefly: "#ffd866",
  fireflyGlow: "rgba(255, 255, 255, 0.2)",
  gentleHint: "#b7df9b",
};

export function readCanvasPalette(root?: HTMLElement | null): CanvasPalette {
  if (typeof window === "undefined") return DEFAULT_CANVAS_PALETTE;

  const el = root ?? document.documentElement;
  const style = getComputedStyle(el);
  const token = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  return {
    road: token("--road", DEFAULT_CANVAS_PALETTE.road),
    roadMark: token("--canvas-road-mark", DEFAULT_CANVAS_PALETTE.roadMark),
    truck: token("--c-pink", DEFAULT_CANVAS_PALETTE.truck),
    wheel: token("--ink", DEFAULT_CANVAS_PALETTE.wheel),
    firefly: token("--c-yellow", DEFAULT_CANVAS_PALETTE.firefly),
    fireflyGlow: token("--canvas-firefly-glow", DEFAULT_CANVAS_PALETTE.fireflyGlow),
    gentleHint: token("--c-mint", DEFAULT_CANVAS_PALETTE.gentleHint),
  };
}
