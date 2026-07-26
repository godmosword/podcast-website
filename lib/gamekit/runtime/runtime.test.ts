import { describe, expect, it } from "vitest";
import { GameKitAudioBus } from "@/lib/gamekit/runtime/audio";
import { FIXED_DT, viewportFor } from "@/lib/gamekit/runtime/constants";
import { JuiceController, MAX_PARTICLES } from "@/lib/gamekit/runtime/juice";
import { GameLoop } from "@/lib/gamekit/runtime/loop";
import { colorsForGame, snapPixel } from "@/lib/gamekit/runtime/palette";
import {
  TILE_INDEX,
  TILE_SIZE,
} from "@/lib/gamekit/runtime/procedural-sheets";

describe("gamekit runtime", () => {
  it("Game Kit viewport 為正整數", () => {
    for (const id of [
      "car-adventure",
      "block-drop",
      "candy-kart",
      "candy-match",
      "snowboard",
    ] as const) {
      const vp = viewportFor(id);
      expect(vp.width).toBeGreaterThan(0);
      expect(vp.height).toBeGreaterThan(0);
      expect(id).toMatch(/^car-adventure$|^block-drop$|^candy-kart$|^candy-match$|^snowboard$/);
    }
  });

  it("FIXED_DT 錨定 120Hz", () => {
    expect(FIXED_DT).toBeCloseTo(1 / 120, 5);
  });

  it("GameLoop 初始為未執行", () => {
    const loop = new GameLoop();
    expect(loop.isRunning).toBe(false);
    loop.stop();
    expect(loop.isRunning).toBe(false);
  });

  it("snapPixel 四捨五入", () => {
    expect(snapPixel(1.4)).toBe(1);
    expect(snapPixel(1.6)).toBe(2);
  });

  it("colorsForGame 回傳子調色盤", () => {
    const c = colorsForGame("car-adventure");
    expect(c.length).toBeGreaterThan(0);
    expect(c[0]).toMatch(/^#/);
  });

  it("TILE_INDEX 對齊平台遊戲 tiles", () => {
    expect(TILE_SIZE).toBe(16);
    expect(TILE_INDEX.road).toBe(0);
    expect(TILE_INDEX.spike).toBe(5);
  });

  it("JuiceController burst 不拋錯", () => {
    const j = new JuiceController();
    j.burst(10, 10, 4, "#fff");
    const r = j.update(0.016);
    expect(r.shakeX).toBeDefined();
  });

  it("粒子池有固定上限，避免大量互動超出效能預算", () => {
    const juice = new JuiceController();
    for (let i = 0; i < 24; i += 1) juice.burst(10, 10, 16);
    expect(juice.particles.activeCount).toBeLessThanOrEqual(MAX_PARTICLES);
  });

  it("GameKitAudioBus 暴露合理預設音量", () => {
    const volume = new GameKitAudioBus().volume;
    expect(volume.musicVolume).toBeGreaterThan(0);
    expect(volume.musicVolume).toBeLessThan(volume.sfxVolume);
  });
});
