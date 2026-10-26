import { describe, expect, it } from "vitest";
import { STATION_WORLD, cameraTravel, windshieldFrame } from "@/lib/games/orange-express/windshield";
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
