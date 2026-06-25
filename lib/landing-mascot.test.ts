import { describe, expect, it } from "vitest";
import {
  MASCOT_EXPRESSIONS,
  MASCOT_TIMING,
  nextDelayMs,
  pickAppearance,
} from "./landing-mascot";

/** 決定性 PRNG（mulberry32），讓測試可重現。 */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("landing-mascot scheduler", () => {
  it("nextDelayMs 落在一般區間內", () => {
    const rng = seeded(1);
    for (let i = 0; i < 200; i += 1) {
      const d = nextDelayMs(rng, false);
      expect(d).toBeGreaterThanOrEqual(MASCOT_TIMING.delayMinMs);
      expect(d).toBeLessThanOrEqual(MASCOT_TIMING.delayMaxMs);
    }
  });

  it("首次延遲使用較短的區間", () => {
    const rng = seeded(2);
    for (let i = 0; i < 200; i += 1) {
      const d = nextDelayMs(rng, true);
      expect(d).toBeGreaterThanOrEqual(MASCOT_TIMING.firstDelayMinMs);
      expect(d).toBeLessThanOrEqual(MASCOT_TIMING.firstDelayMaxMs);
    }
    // 首次區間整體早於一般區間（避免一開站就太頻繁）
    expect(MASCOT_TIMING.firstDelayMaxMs).toBeLessThanOrEqual(
      MASCOT_TIMING.delayMinMs,
    );
  });

  it("pickAppearance 產出合法且在範圍內的外觀", () => {
    const rng = seeded(3);
    for (let i = 0; i < 500; i += 1) {
      const a = pickAppearance(rng);
      expect(["left", "right"]).toContain(a.edge);
      expect(a.lane).toBeGreaterThanOrEqual(0);
      expect(a.lane).toBeLessThan(1);
      expect(MASCOT_EXPRESSIONS).toContain(a.expression);
      expect(a.durationMs).toBeGreaterThanOrEqual(MASCOT_TIMING.tripMinMs);
      expect(a.durationMs).toBeLessThanOrEqual(MASCOT_TIMING.tripMaxMs);
    }
  });

  it("相同 seed 產生相同序列（決定性）", () => {
    const a = pickAppearance(seeded(42));
    const b = pickAppearance(seeded(42));
    expect(a).toEqual(b);
  });

  it("足夠樣本能涵蓋全部 6 種表情", () => {
    const rng = seeded(7);
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i += 1) {
      seen.add(pickAppearance(rng).expression);
    }
    expect(seen.size).toBe(MASCOT_EXPRESSIONS.length);
  });
});
