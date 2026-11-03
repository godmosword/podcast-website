import { describe, expect, it } from "vitest";
import {
  boatBob,
  cloudAt,
  drawFlock,
  drawSmoke,
  drawWaiting,
  ferrisSpin,
  flockAt,
  friendHop,
  smokePuffs,
  treeSway,
  waveSlide,
} from "@/lib/games/orange-express/windshield-life";
import { viewFor } from "@/lib/games/orange-express/windshield-geometry";

/** 什麼都不做的 ctx：記下呼叫了哪些方法。 */
function recorder() {
  const calls: string[] = [];
  const ctx = new Proxy(
    {},
    {
      get: (_target, key) => (typeof key === "string" ? (...args: unknown[]) => calls.push(key) && args : undefined),
      set: () => true,
    },
  ) as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}

describe("前窗自己會動的小東西（PR-J3）", () => {
  it("時鐘 0（定格、減少動態）時都在原位：雲在原本的位置、樹不搖、摩天輪不轉、帆船不晃", () => {
    expect(cloudAt(0.2, 0)).toBeCloseTo(0.2, 9);
    expect(cloudAt(0.64, 0)).toBeCloseTo(0.64, 9);
    expect(ferrisSpin(0)).toBe(0);
    expect(treeSway(0, 7, 80)).toBe(0);
    expect(boatBob(0, 20)).toBe(0);
  });

  it("雲很慢地往右飄，飄出右邊從左邊外面回來，不會跳進畫面中間", () => {
    expect(cloudAt(0.2, 10) - cloudAt(0.2, 0)).toBeCloseTo(0.08, 6);
    for (let t = 0; t < 400; t += 0.5) {
      const x = cloudAt(0.64, t);
      expect(x).toBeGreaterThanOrEqual(-0.2);
      expect(x).toBeLessThan(1.2);
    }
  });

  it("樹冠搖最多 2px，小樹更小（不超過半徑 6%）", () => {
    for (let t = 0; t < 20; t += 0.1) {
      expect(Math.abs(treeSway(t, 3, 100))).toBeLessThanOrEqual(2 + 1e-9);
      expect(Math.abs(treeSway(t, 3, 10))).toBeLessThanOrEqual(0.6 + 1e-9);
    }
  });

  it("一小群鳥：24 秒裡只飛 6 秒（不常出現），飛的時候從左往右、在天上（地平線以上）", () => {
    expect(flockAt(0)).not.toBeNull();
    expect(flockAt(12)).toBeNull();
    const a = flockAt(1)!;
    const b = flockAt(5)!;
    expect(b.x).toBeGreaterThan(a.x);
    for (let t = 0; t < 6; t += 0.25) expect(flockAt(t)!.y).toBeLessThan(0.3);
    const { ctx, calls } = recorder();
    drawFlock(ctx, viewFor(390, 400), "field", 12);
    expect(calls).toHaveLength(0);
  });

  it("月台等車的朋友：太遠不畫、近了每人畫身體、頭、揮的手；不寫字", () => {
    const view = viewFor(390, 400);
    const far = recorder();
    drawWaiting(far.ctx, view, 400, 0, 1.1, ["bonbon"], 0);
    expect(far.calls).toHaveLength(0);
    const near = recorder();
    drawWaiting(near.ctx, view, 400, 350, 1.1, ["bonbon", "xiaonan", "dot", "mami", "sprout"], 1);
    // 頭照座位頭像：圓頭（Bonbon、馬米、小芽）與方臉（小南、紫方塊）都有，腳下有影子。
    expect(near.calls.filter((name) => name === "arc").length).toBeGreaterThan(4);
    expect(near.calls).toContain("ellipse");
    expect(near.calls).not.toContain("fillText");
    // 舊 iOS Safari 沒有 roundRect：身體用 arcTo 畫。
    expect(near.calls).not.toContain("roundRect");
    expect(near.calls).toContain("arcTo");
  });

  it("收尾的小動態（PR-J4）：浪線時鐘 0 在原位；煙三團先淡入、越高越淡；朋友車近了才跳、一次只跳一個", () => {
    expect(waveSlide(0, 37)).toBe(0);
    expect(Math.abs(waveSlide(2, 37))).toBeLessThanOrEqual(1.6);
    const puffs = smokePuffs(1);
    expect(puffs).toHaveLength(3);
    for (const puff of puffs) {
      expect(puff.rise).toBeGreaterThanOrEqual(0);
      expect(puff.rise).toBeLessThan(1);
      expect(puff.alpha).toBeCloseTo(0.85 * Math.min(1, puff.rise / 0.15) * (1 - puff.rise), 9);
    }
    expect(friendHop(0.1, 0, 2, 60)).toBe(0);
    // 定格、減少動態（時鐘 0）：就算車很近也站好不跳。
    for (const index of [0, 1]) expect(friendHop(0, index, 2, 10)).toBe(0);
    for (let t = 0.01; t < 8; t += 0.02) {
      const hops = [0, 1].map((i) => friendHop(t, i, 2, 12));
      for (const hop of hops) {
        expect(hop).toBeGreaterThanOrEqual(0);
        expect(hop).toBeLessThanOrEqual(0.22);
      }
      // 一次只有一個人在空中。
      expect(hops.filter((hop) => hop > 0).length).toBeLessThanOrEqual(1);
    }
    // 一站只有一位：也是約 2 秒才跳一次，跳 0.4 秒。
    const airborne = Array.from({ length: 400 }, (_, k) => friendHop(0.005 + k * 0.01, 0, 1, 12) > 0).filter(Boolean).length;
    expect(airborne).toBeGreaterThan(70);
    expect(airborne).toBeLessThan(90);
    const { ctx, calls } = recorder();
    drawSmoke(ctx, 10, 10, 4, 1);
    expect(calls.filter((name) => name === "arc")).toHaveLength(3);
    // 透明度還原成呼叫前的值，畫到一半出錯也一樣。
    const real = { globalAlpha: 0.5, fillStyle: "", beginPath() {}, arc() {}, fill() {} };
    drawSmoke(real as unknown as CanvasRenderingContext2D, 10, 10, 4, 1);
    expect(real.globalAlpha).toBe(0.5);
    const broken = { ...real, globalAlpha: 0.8, fill() { throw new Error("boom"); } };
    expect(() => drawSmoke(broken as unknown as CanvasRenderingContext2D, 10, 10, 4, 1)).toThrow("boom");
    expect(broken.globalAlpha).toBe(0.8);
  });
});
