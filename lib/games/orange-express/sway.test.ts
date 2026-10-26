import { describe, expect, it } from "vitest";
import { NO_SWAY, SWAY_MAX_PX, decayBump, swayAt } from "@/lib/games/orange-express/sway";

describe("前窗晃動", () => {
  it("停著不晃", () => {
    expect(swayAt(1.3, 0, 0)).toBe(NO_SWAY);
  });

  it("越快晃越大，但不超過幾個像素", () => {
    let slowMax = 0;
    let fastMax = 0;
    for (let t = 0; t < 3; t += 0.01) {
      slowMax = Math.max(slowMax, Math.abs(swayAt(t, 0.2, 0).x));
      fastMax = Math.max(fastMax, Math.abs(swayAt(t, 1, 0).x));
      const s = swayAt(t, 5, 1);
      expect(Math.abs(s.x)).toBeLessThanOrEqual(SWAY_MAX_PX);
      expect(Math.abs(s.y)).toBeLessThanOrEqual(SWAY_MAX_PX + 2);
      expect(Math.abs(s.rot)).toBeLessThan(0.3);
    }
    expect(fastMax).toBeGreaterThan(slowMax);
  });

  it("接縫的那一下很快收掉", () => {
    let bump = 1;
    for (let i = 0; i < 20; i += 1) bump = decayBump(bump, 1 / 60);
    expect(bump).toBeLessThan(0.05);
    expect(decayBump(0.005, 0.016)).toBe(0);
  });
});
