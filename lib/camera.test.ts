import { describe, expect, it } from "vitest";
import { islandFocus } from "@/lib/universe/map-camera-utils";
import {
  clamp,
  isIslandPath,
  targetFor,
  targetToFlyParams,
  type IslandCameraTarget,
} from "./camera";

/** 取島層目標並收窄型別；非島層直接讓測試失敗。 */
function islandTarget(pathname: string): IslandCameraTarget {
  const t = targetFor(pathname);
  if (t.level !== "island") {
    throw new Error(`expected island target for ${pathname}, got ${t.level}`);
  }
  return t;
}

describe("targetFor", () => {
  it("世界地圖路徑 → world", () => {
    expect(targetFor("/adventures")).toMatchObject({
      key: "world",
      level: "world",
    });
    expect(targetFor("/adventures/")).toMatchObject({ key: "world" });
  });

  it("world 目標不帶靜態 center/zoom（構圖唯一真相在 useMapCamera.reset）", () => {
    const t = targetFor("/adventures");
    expect(t).toEqual({ key: "world", level: "world" });
    expect("center" in t).toBe(false);
    expect("zoom" in t).toBe(false);
  });

  it("島路徑 → island + 該島 camera", () => {
    const t = islandTarget("/adventures/dino");
    expect(t.key).toBe("island:dino");
    expect(t.level).toBe("island");
    expect(t.zoom).toBe(1.6);
    expect(t.center[0]).toBeCloseTo(175 / 1000);
    expect(t.center[1]).toBeCloseTo(300 / 720);
  });

  it("無效島 id 退回 world", () => {
    expect(targetFor("/adventures/nope").key).toBe("world");
  });

  it("島內 hotspot 路徑仍鎖定該島相機", () => {
    const t = targetFor("/adventures/dino/story-house");
    expect(t.key).toBe("island:dino");
    expect(t.level).toBe("island");
  });
});

describe("clamp / targetToFlyParams", () => {
  it("zoom 夾在 universe min/max", () => {
    expect(clamp({ center: [0.5, 0.5], zoom: 99 }).zoom).toBe(2);
    expect(clamp({ center: [0.5, 0.5], zoom: 0.01 }).zoom).toBe(0.34);
  });

  it("dino fly 焦點取島圖視覺中心（非沙岸錨點）＋ FOCUS 1.6", () => {
    const { coord, scale, fitBox } = targetToFlyParams(
      islandTarget("/adventures/dino"),
    );
    const focus = islandFocus("dino");

    expect(coord).toEqual(focus.center);
    expect(fitBox).toEqual(focus.box);
    expect(scale).toBe(1.6);
    // 沙岸錨點在 y=300；焦點必須落在它上方（否則 84% 島高會被推出畫面上緣）
    expect(coord.x).toBe(175);
    expect(coord.y).toBeLessThan(300);
  });

  it("島層目標帶 zoneId，供焦點／構圖框查表", () => {
    expect(islandTarget("/adventures/car-park").zoneId).toBe("car-park");
    expect(islandTarget("/adventures/dino/story-house").zoneId).toBe("dino");
  });
});

describe("isIslandPath", () => {
  it("辨識島／世界", () => {
    expect(isIslandPath("/adventures/dino")).toBe(true);
    expect(isIslandPath("/adventures")).toBe(false);
    expect(isIslandPath("/adventures/nope")).toBe(false);
  });
});
