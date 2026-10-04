import type { Rng } from "./engine";

/** 決定性 RNG（mulberry32）：固定 seed 的保底盤、模擬與測試共用。 */
export function seededRng(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

/** 從 0..n-1 取一個整數；rng 回傳超出 [0,1) 時夾回範圍內。 */
export function pickIndex(n: number, rng: Rng): number {
  if (n <= 1) return 0;
  const r = Math.min(0.999999, Math.max(0, rng()));
  return Math.floor(r * n);
}
