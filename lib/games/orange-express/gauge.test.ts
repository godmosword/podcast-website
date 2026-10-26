import { describe, expect, it } from "vitest";
import {
  GAUGE_MAX_KMH,
  GAUGE_START_DEG,
  GAUGE_SWEEP_DEG,
  arcPath,
  gaugeBands,
  gaugeTicks,
  gaugeValueText,
  gaugeZone,
  kmh,
  speedToAngle,
} from "@/lib/games/orange-express/gauge";

describe("圓形速度表", () => {
  it("指針角度從左下掃到右下，超出範圍會夾住", () => {
    expect(speedToAngle(0)).toBe(GAUGE_START_DEG);
    expect(speedToAngle(1)).toBe(GAUGE_START_DEG + GAUGE_SWEEP_DEG);
    expect(speedToAngle(5)).toBe(speedToAngle(1));
    expect(speedToAngle(-1)).toBe(speedToAngle(0));
    expect(speedToAngle(0.5)).toBe(0);
  });

  it("色帶接起來剛好一整圈，黃區在速度旗前面", () => {
    const bands = gaugeBands(0.82);
    expect(bands.green[0]).toBe(0);
    expect(bands.green[1]).toBe(bands.yellow[0]);
    expect(bands.yellow[1]).toBe(0.82);
    expect(bands.red).toEqual([0.82, 1]);
  });

  it("綠、黃、紅三區", () => {
    expect(gaugeZone(0.3, 0.82)).toBe("green");
    expect(gaugeZone(0.78, 0.82)).toBe("yellow");
    expect(gaugeZone(0.9, 0.82)).toBe("red");
  });

  it("沒開數字時讀屏只說話，不報公里", () => {
    expect(gaugeValueText(0, 0.82, false)).toBe("停著");
    expect(gaugeValueText(0.3, 0.82, false)).toBe("還可以再快");
    expect(gaugeValueText(0.82, 0.82, false)).toBe("到速度旗了");
    expect(gaugeValueText(0.3, 0.82, false)).not.toMatch(/\d/);
    expect(gaugeValueText(0.3, 0.82, true)).toBe("還可以再快，每小時 90 公里");
  });

  it("刻度最高是玩具時速，不用照片上的數字", () => {
    expect(GAUGE_MAX_KMH).toBe(300);
    expect(kmh(1)).toBe(300);
    const majors = gaugeTicks().filter((tick) => tick.major).map((tick) => tick.value);
    expect(majors).toEqual([0, 50, 100, 150, 200, 250, 300]);
    expect(majors).not.toContain(320);
  });

  it("太短的弧不畫", () => {
    expect(arcPath(100, 100, 70, 10, 10)).toBe("");
    expect(arcPath(100, 100, 70, -120, 120)).toMatch(/^M.+A70 70 0 1 1 /);
  });
});
