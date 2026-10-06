/** 決定性 RNG（mulberry32）：測試回放、生成器保底盤與模擬共用。 */
export type Rng = () => number;

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

/**
 * 視覺回歸與黃金回放用：測試在載入前設 `window.__blockDropSeed`。
 * 一般玩家沒有這個值，回傳 null。
 */
export function readBlockDropTestSeed(): number | null {
  if (typeof window === "undefined") return null;
  const seed = (window as unknown as { __blockDropSeed?: unknown }).__blockDropSeed;
  return typeof seed === "number" && Number.isFinite(seed) ? seed : null;
}

/** 從 0..n-1 取一個整數；rng 回傳超出 [0,1) 時夾回範圍內。 */
export function pickIndex(n: number, rng: Rng): number {
  if (n <= 1) return 0;
  return Math.floor(Math.min(0.999999, Math.max(0, rng())) * n);
}
