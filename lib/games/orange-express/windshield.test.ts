import { describe, expect, it } from "vitest";
import { PASS_DURATION } from "@/lib/games/orange-express/reducer";
import {
  PASS_FAR,
  PASS_LENGTH,
  PLATFORM_TOP,
  STATION_WORLD,
  cameraTravel,
  drawWindshield,
  passingNose,
  signBars,
  windshieldFrame,
} from "@/lib/games/orange-express/windshield";
import type { Phase } from "@/lib/games/orange-express/types";

const PHASES: Phase[] = ["running", "in-window", "stopped", "doors-open", "reversing", "route-done"];

describe("前窗", () => {
  it("減少動態時只有三格，相機只停在三個位置", () => {
    const seen = new Set<number>();
    for (const phase of PHASES) {
      for (const progress of [0, 0.2, 0.5, 0.9, 1]) {
        const frame = windshieldFrame(progress, phase);
        expect([0, 1, 2]).toContain(frame);
        seen.add(cameraTravel(true, progress, phase, 0.65));
      }
    }
    expect(seen.size).toBe(3);
  });

  it("停好時相機剛好在停車目標", () => {
    expect(cameraTravel(true, 0.6, "stopped", 0.65)).toBeCloseTo(0.65 * STATION_WORLD);
  });

  it("一般動態跟著進度連續走", () => {
    expect(cameraTravel(false, 0.2, "running", 0.65)).toBeCloseTo(0.2 * STATION_WORLD);
    expect(cameraTravel(false, 0.21, "running", 0.65)).toBeGreaterThan(cameraTravel(false, 0.2, "running", 0.65));
  });
});

describe("前窗：隧道、鐵橋、速限牌、對向列車", () => {
  it("減少動態時在隧道或鐵橋上，相機停在那一段的中間，不跟著進度走", () => {
    const tunnel = { from: 0.1, to: 0.18 };
    const a = cameraTravel(true, 0.11, "running", 0.65, { tunnel });
    const b = cameraTravel(true, 0.17, "running", 0.65, { tunnel });
    expect(a).toBe(b);
    expect(a).toBeCloseTo(0.14 * STATION_WORLD);
    expect(cameraTravel(true, 0.3, "running", 0.65, { tunnel })).toBeCloseTo(0.28 * STATION_WORLD);
  });

  it("對向列車從遠方靠近，最後整列都過去", () => {
    expect(passingNose(0)).toBe(PASS_FAR);
    expect(passingNose(1)).toBeLessThan(passingNose(0.5));
    expect(passingNose(PASS_DURATION) + PASS_LENGTH).toBeLessThanOrEqual(0.001);
  });

  it("速限牌只畫條數：快 3、中 2、慢 1", () => {
    expect(signBars(0.82)).toBe(3);
    expect(signBars(0.55)).toBe(2);
    expect(signBars(0.35)).toBe(1);
  });

  it("三種背景與隧道內外、鐵橋、對向列車都畫得出來，而且不畫字", () => {
    const calls: string[] = [];
    const gradient = { addColorStop: () => {} };
    const ctx = new Proxy(
      {},
      {
        get(_target, prop: string) {
          if (prop === "createLinearGradient") return () => gradient;
          return () => {
            calls.push(prop);
          };
        },
        set() {
          return true;
        },
      },
    ) as unknown as CanvasRenderingContext2D;
    const signs = [{ at: 0.06, limit: 0.55 }];
    for (const scene of ["field", "city", "sea"] as const) {
      for (const progress of [0.02, 0.09, 0.14, 0.2]) {
        drawWindshield(ctx, 480, 270, {
          progress,
          phase: "running",
          reduced: false,
          target: 0.65,
          scene,
          tunnel: { from: 0.1, to: 0.18 },
          bridge: { from: 0.19, to: 0.25 },
          signs,
          passing: 1.6,
        });
      }
    }
    expect(calls).toContain("fill");
    expect(calls).toContain("clip");
    expect(calls).not.toContain("fillText");
    expect(calls).not.toContain("drawImage");
  });
});

type Fill = { color: string; pts: { x: number; y: number }[] };

/** 記下每次 fill 的顏色與路徑點，看月台畫到哪裡。 */
function recordFills(): { ctx: CanvasRenderingContext2D; fills: Fill[] } {
  const fills: Fill[] = [];
  let pts: Fill["pts"] = [];
  let color = "";
  const gradient = { addColorStop: () => {} };
  const ctx = new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop === "createLinearGradient") return () => gradient;
        if (prop === "beginPath") return () => (pts = []);
        if (prop === "moveTo" || prop === "lineTo") return (x: number, y: number) => pts.push({ x, y });
        if (prop === "fill") return () => fills.push({ color, pts });
        return () => {};
      },
      set(_target, prop: string, value: unknown) {
        if (prop === "fillStyle") color = String(value);
        return true;
      },
    },
  ) as unknown as CanvasRenderingContext2D;
  return { ctx, fills };
}

describe("前窗：月台", () => {
  it("停好時月台頂面鋪到前窗下緣，近端不會被切在畫面中段", () => {
    for (const [w, h] of [
      [364, 183],
      [1960, 270],
    ] as const) {
      const { ctx, fills } = recordFills();
      drawWindshield(ctx, w, h, { progress: 0.65, phase: "stopped", reduced: true, target: 0.65 });
      const top = fills.filter((fill) => fill.color === PLATFORM_TOP);
      expect(top.length).toBeGreaterThan(0);
      const lowest = Math.max(...top.flatMap((fill) => fill.pts.map((p) => p.y)));
      expect(lowest).toBeGreaterThanOrEqual(h);
    }
  });
});
