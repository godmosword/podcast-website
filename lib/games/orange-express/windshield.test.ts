import { describe, expect, it } from "vitest";
import { cameraOffset, windshieldFrame } from "@/lib/games/orange-express/windshield";
import type { Phase } from "@/lib/games/orange-express/types";

const PHASES: Phase[] = ["running", "in-window", "stopped", "doors-open", "route-done"];

describe("前窗格", () => {
  it("減少動態時只有三格，偏移只會是 0、3、6", () => {
    for (const phase of PHASES) {
      for (const progress of [0, 0.2, 0.5, 0.9, 1]) {
        const frame = windshieldFrame(progress, phase);
        expect([0, 1, 2]).toContain(frame);
        expect(cameraOffset(true, progress, phase)).toBe(frame * 3);
      }
    }
  });
});
