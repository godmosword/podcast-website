import { describe, expect, it } from "vitest";
import {
  GAME_VIEWPORTS,
  computeIntegerScale,
  medalCount,
  medalFlags,
  snapPixel,
  colorsForGame,
} from "@/lib/gamekit";
import { emptyTilemap } from "@/lib/gamekit/tilemap";
import { recordBestScore, loadPlayerProfile } from "@/lib/gamekit/save";

describe("gamekit constants", () => {
  it("四款 viewport 為正整數", () => {
    for (const [id, vp] of Object.entries(GAME_VIEWPORTS)) {
      expect(vp.width).toBeGreaterThan(0);
      expect(vp.height).toBeGreaterThan(0);
      expect(id).toMatch(/^car-|^block-/);
    }
  });
});

describe("computeIntegerScale", () => {
  const vp = { width: 320, height: 240 };

  it("容器足夠大時使用最大整數倍且不超過 maxScale", () => {
    const r = computeIntegerScale(vp, 640, 480, 4);
    expect(r.scale).toBe(2);
    expect(r.displayWidth).toBe(640);
    expect(r.displayHeight).toBe(480);
    expect(r.offsetX).toBe(0);
    expect(r.offsetY).toBe(0);
  });

  it("容器較小時 letterbox 置中", () => {
    const r = computeIntegerScale(vp, 400, 300, 4);
    expect(r.scale).toBe(1);
    expect(r.displayWidth).toBe(320);
    expect(r.displayHeight).toBe(240);
    expect(r.offsetX).toBe(40);
    expect(r.offsetY).toBe(30);
  });

  it("容器為零時 fallback scale 1", () => {
    const r = computeIntegerScale(vp, 0, 0);
    expect(r.scale).toBe(1);
  });
});

describe("palette", () => {
  it("snapPixel 四捨五入", () => {
    expect(snapPixel(1.4)).toBe(1);
    expect(snapPixel(1.6)).toBe(2);
  });

  it("colorsForGame 回傳子調色盤", () => {
    const c = colorsForGame("car-star");
    expect(c.length).toBeGreaterThan(0);
    expect(c[0]).toMatch(/^#/);
  });
});

describe("meta medals", () => {
  it("medalFlags 與 medalCount", () => {
    const f = medalFlags(true, true, false);
    expect(f).toBe(3);
    expect(medalCount(f)).toBe(2);
  });
});

describe("save", () => {
  it("recordBestScore 只在新高分時更新", () => {
    const base = loadPlayerProfile();
    const next = recordBestScore(base, "car-star", 100);
    expect(next.bests["car-star"]).toBe(100);
    const same = recordBestScore(next, "car-star", 50);
    expect(same.bests["car-star"]).toBe(100);
  });
});

describe("tilemap stub", () => {
  it("emptyTilemap 可建立 walkable 查詢", () => {
    const map = emptyTilemap(4, 4);
    expect(map.width).toBe(4);
    expect(map.isWalkable(0, 0)).toBe(false);
  });
});
