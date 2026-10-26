/** 圓形速度表的純數學：角度、色帶、刻度。畫面只讀這裡算好的值。 */

/** 家長打開刻度時，指針滿格對應的玩具時速。刻意不用真實車種的最高速。 */
export const GAUGE_MAX_KMH = 300;
/** 只有家長打開數字刻度時才畫出來。 */
export const GAUGE_UNIT = "km/h";
export const GAUGE_START_DEG = -120;
export const GAUGE_SWEEP_DEG = 240;
/** 速度旗前面這一段是黃區。 */
export const YELLOW_SPAN = 0.15;

export type GaugeZone = "green" | "yellow" | "red";

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/** 0 在正上方，順時針為正。 */
export function speedToAngle(speed: number): number {
  return GAUGE_START_DEG + clamp01(speed) * GAUGE_SWEEP_DEG;
}

export function kmh(speed: number): number {
  return Math.round(clamp01(speed) * GAUGE_MAX_KMH);
}

export type GaugeBands = {
  green: readonly [number, number];
  yellow: readonly [number, number];
  red: readonly [number, number];
};

/** 綠：可以再快；黃：快到速度旗；紅：旗子以上，指針不會停在這裡。 */
export function gaugeBands(limit: number): GaugeBands {
  const top = clamp01(limit);
  const yellowFrom = clamp01(top * (1 - YELLOW_SPAN));
  return {
    green: [0, yellowFrom],
    yellow: [yellowFrom, top],
    red: [top, 1],
  };
}

export function gaugeZone(speed: number, limit: number): GaugeZone {
  const bands = gaugeBands(limit);
  if (speed > bands.red[0] + 0.005) return "red";
  if (speed >= bands.yellow[0] - 1e-6 && speed > 0) return "yellow";
  return "green";
}

export function gaugeValueText(speed: number, limit: number, withNumbers: boolean): string {
  let words: string;
  if (speed <= 0.001) words = "停著";
  else if (speed >= limit - 0.01) words = "到速度旗了";
  else if (gaugeZone(speed, limit) === "yellow") words = "快到速度旗了";
  else words = "還可以再快";
  return withNumbers ? `${words}，每小時 ${kmh(speed)} 公里` : words;
}

/** 每 50 一個大刻度，每 25 一個小刻度。 */
export function gaugeTicks(): { value: number; major: boolean }[] {
  const out: { value: number; major: boolean }[] = [];
  for (let v = 0; v <= GAUGE_MAX_KMH; v += 25) out.push({ value: v, major: v % 50 === 0 });
  return out;
}

export function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

/** 圓弧的 SVG path，角度同 speedToAngle。 */
export function arcPath(cx: number, cy: number, r: number, fromDeg: number, toDeg: number): string {
  if (toDeg - fromDeg < 0.01) return "";
  const a = polar(cx, cy, r, fromDeg);
  const b = polar(cx, cy, r, toDeg);
  const large = toDeg - fromDeg > 180 ? 1 : 0;
  return `M${a.x.toFixed(2)} ${a.y.toFixed(2)}A${r} ${r} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}
