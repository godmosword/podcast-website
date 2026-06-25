/**
 * Landing 小車車彩蛋的純邏輯排程器。
 * 與 React／DOM 無關，便於單元測試；rng 可注入（預設 Math.random）。
 */

export const MASCOT_EXPRESSIONS = [
  "smile",
  "star",
  "surprised",
  "angry",
  "squint",
  "wave",
] as const;

export type MascotExpression = (typeof MASCOT_EXPRESSIONS)[number];

/** 進場邊：car 從哪一側開進畫面。 */
type MascotEdge = "left" | "right";

export type MascotAppearance = {
  edge: MascotEdge;
  /** 下緣安全帶內的垂直位置比例 [0,1]。 */
  lane: number;
  expression: MascotExpression;
  /** 單趟行駛時間（毫秒）。 */
  durationMs: number;
};

export const MASCOT_TIMING = {
  firstDelayMinMs: 8_000,
  firstDelayMaxMs: 20_000,
  delayMinMs: 25_000,
  delayMaxMs: 60_000,
  tripMinMs: 6_000,
  tripMaxMs: 9_000,
} as const;

type Rng = () => number;

function between(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

/** 下一次出現前的等待時間；首次出現較短，讓使用者較快看到。 */
export function nextDelayMs(rng: Rng = Math.random, isFirst = false): number {
  const [min, max] = isFirst
    ? [MASCOT_TIMING.firstDelayMinMs, MASCOT_TIMING.firstDelayMaxMs]
    : [MASCOT_TIMING.delayMinMs, MASCOT_TIMING.delayMaxMs];
  return Math.round(between(rng, min, max));
}

/** 隨機決定一次出現的進場邊、車道、表情與行駛時間。 */
export function pickAppearance(rng: Rng = Math.random): MascotAppearance {
  const edge: MascotEdge = rng() < 0.5 ? "left" : "right";
  const lane = rng();
  const index = Math.floor(rng() * MASCOT_EXPRESSIONS.length);
  const expression = MASCOT_EXPRESSIONS[index] ?? MASCOT_EXPRESSIONS[0];
  const durationMs = Math.round(
    between(rng, MASCOT_TIMING.tripMinMs, MASCOT_TIMING.tripMaxMs),
  );
  return { edge, lane, expression, durationMs };
}
