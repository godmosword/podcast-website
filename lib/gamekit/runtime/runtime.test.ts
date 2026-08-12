import { describe, expect, it } from "vitest";
import { GameKitAudioBus } from "@/lib/gamekit/runtime/audio";
import { FIXED_DT } from "@/lib/gamekit/runtime/constants";
import { JuiceController, MAX_PARTICLES } from "@/lib/gamekit/runtime/juice";
import { GameLoop } from "@/lib/gamekit/runtime/loop";
import { snapPixel } from "@/lib/gamekit/runtime/palette";

describe("gamekit runtime", () => {
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
