import { describe, expect, it } from "vitest";
import {
  clamp,
  isIslandPath,
  targetFor,
  targetToFlyParams,
} from "./camera";

describe("targetFor", () => {
  it("世界地圖路徑 → world", () => {
    expect(targetFor("/adventures")).toMatchObject({
      key: "world",
      level: "world",
    });
    expect(targetFor("/adventures/")).toMatchObject({ key: "world" });
  });

  it("島路徑 → island + 該島 camera", () => {
    const t = targetFor("/adventures/dino");
    expect(t.key).toBe("island:dino");
    expect(t.level).toBe("island");
    expect(t.zoom).toBe(1.6);
    expect(t.center[0]).toBeCloseTo(175 / 1000);
    expect(t.center[1]).toBeCloseTo(300 / 720);
  });

  it("無效島 id 退回 world", () => {
    expect(targetFor("/adventures/nope").key).toBe("world");
  });
});

describe("clamp / targetToFlyParams", () => {
  it("zoom 夾在 universe min/max", () => {
    expect(clamp({ center: [0.5, 0.5], zoom: 99 }).zoom).toBe(2);
    expect(clamp({ center: [0.5, 0.5], zoom: 0.01 }).zoom).toBe(0.34);
  });

  it("dino fly 參數還原既有 stage px 與 FOCUS 1.6", () => {
    const { coord, scale } = targetToFlyParams(targetFor("/adventures/dino"));
    expect(coord).toEqual({ x: 175, y: 300 });
    expect(scale).toBe(1.6);
  });
});

describe("isIslandPath", () => {
  it("辨識島／世界", () => {
    expect(isIslandPath("/adventures/dino")).toBe(true);
    expect(isIslandPath("/adventures")).toBe(false);
    expect(isIslandPath("/adventures/nope")).toBe(false);
  });
});
