import { describe, expect, it } from "vitest";
import { chooseQuality, distanceAtProgress, driveProgress, greetingPose, lowerQuality, motionPhase, ROAD_START_ANGLE, ROAD_LENGTH, wheelAnimationTime, resolveHeroStage } from "./config";

describe("hero world quality and arrival timing", () => {
  it("selects a conservative tier from runtime capabilities", () => {
    expect(chooseQuality(2, 8, false)).toBe("low");
    expect(chooseQuality(8, 8, true)).toBe("medium");
    expect(chooseQuality(8, 8, false)).toBe("high");
  });

  it("only lowers quality and keeps the vehicle progress bounded", () => {
    expect(lowerQuality("high")).toBe("medium");
    expect(lowerQuality("medium")).toBe("low");
    expect(lowerQuality("low")).toBe("low");
    expect(driveProgress(-1)).toBe(0);
    expect(driveProgress(18)).toBeCloseTo(1);
    expect(driveProgress(60)).toBe(1);
  });

  it("maps wheel rotation to road distance", () => {
    expect(distanceAtProgress(0)).toBe(0);
    expect(distanceAtProgress(1)).toBeCloseTo(ROAD_LENGTH, 3);
    expect(distanceAtProgress(.5)).toBeCloseTo(ROAD_LENGTH / 2, 2);
    expect(wheelAnimationTime(.75)).toBeGreaterThan(wheelAnimationTime(.25));
    // Independently integrate actual positions on the shifted art-directed road.
    for (const progress of [.07, .23, .67]) {
      let distance = 0;
      for (let i = 1; i <= 4000; i++) {
        const a = ROAD_START_ANGLE + (i - 1) / 4000 * progress * Math.PI * 2;
        const b = ROAD_START_ANGLE + i / 4000 * progress * Math.PI * 2;
        distance += Math.hypot(3.98 * (Math.sin(b) - Math.sin(a)), 2.48 * (Math.cos(b) - Math.cos(a)));
      }
      expect(Math.abs(distanceAtProgress(progress) - distance)).toBeLessThan(.002);
    }
    expect(wheelAnimationTime(1, 2.04)).toBeCloseTo(ROAD_LENGTH / (Math.PI * 2 * .275) * 2.04, 5);
  });

  it("keeps a zero-speed stop and a single greeting window", () => {
    expect(motionPhase(1)).toBe("approach");
    expect(motionPhase(4)).toBe("decelerate");
    expect(motionPhase(4.52)).toBe("stop");
    expect(motionPhase(4.6)).toBe("settle");
    expect(motionPhase(5.2)).toBe("acknowledge");
    expect(motionPhase(10)).toBe("continue");
    expect(motionPhase(18)).toBe("settled");
    expect(driveProgress(4.5) - driveProgress(4.49)).toBeLessThan(.001);
    expect(driveProgress(6.2)).toBeCloseTo(.07);
    expect(driveProgress(6.21)).toBeGreaterThan(.07);
    expect(greetingPose(4.6).greeting).toBe(false);
    expect(greetingPose(5.2).greeting).toBe(true);
    expect(greetingPose(6.2).greeting).toBe(false);
  });
});

describe("resolveHeroStage", () => {
  it("沒有 ?stage 時回傳 build 預設", () => {
    expect(resolveHeroStage("", "world")).toBe("world");
    expect(resolveHeroStage("?heroQa=1", "parallax")).toBe("parallax");
  });

  it("?stage=parallax／world 覆寫預設", () => {
    expect(resolveHeroStage("?stage=parallax", "world")).toBe("parallax");
    expect(resolveHeroStage("?stage=world", "parallax")).toBe("world");
    expect(resolveHeroStage("?heroQa=1&stage=parallax", "world")).toBe("parallax");
  });

  it("不認識的值不會讓舞台變成 undefined", () => {
    expect(resolveHeroStage("?stage=3d", "world")).toBe("world");
    expect(resolveHeroStage("?stage=", "parallax")).toBe("parallax");
  });
});
