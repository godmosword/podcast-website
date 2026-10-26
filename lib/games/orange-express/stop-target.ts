import { currentStation, predictStop } from "@/lib/games/orange-express/reducer";
import type { RunState, StopGrade } from "@/lib/games/orange-express/types";

/** 家長打開數字時，一站的 0–1 換成幾公尺。只給剩餘距離用。 */
export const STATION_METERS = 1500;
/** 窗尾後面再多畫一點，預測點超過時還看得到。 */
const TAIL = 0.05;

export type StopBar = {
  /** 以下都是 0–100 的百分比位置。 */
  train: number;
  yellow: readonly [number, number];
  green: readonly [number, number];
  target: number;
  predicted: number | null;
  /** 預測點落在哪一區；null 表示還沒在減速或會停在窗外。 */
  predictedGrade: StopGrade | null;
  remainingMeters: number;
  words: string;
};

function pct(value: number, from: number, to: number): number {
  const span = to - from <= 0 ? 1 : to - from;
  return Math.round(Math.min(100, Math.max(0, ((value - from) / span) * 100)) * 10) / 10;
}

export function remainingWords(remainingMeters: number, greenMeters: number): string {
  if (Math.abs(remainingMeters) <= greenMeters) return "停在這裡";
  if (remainingMeters < 0) return "過了一點點";
  if (remainingMeters <= 80) return "再一點點";
  if (remainingMeters <= 250) return "快到了";
  return "還有一段路";
}

/** 進站之後才出現。倒車時也留著，讓孩子看到車退回窗前。 */
export function stopBarFor(state: RunState): StopBar | null {
  if (state.phase === "route-done") return null;
  const station = currentStation(state);
  if (state.progress < station.approachAt && state.phase !== "reversing") return null;
  const from = station.approachAt;
  const to = station.window.end + TAIL;
  const predictedRaw =
    state.phase === "reversing" || state.phase === "stopped" || state.phase === "doors-open"
      ? null
      : predictStop(state);
  let predictedGrade: StopGrade | null = null;
  if (predictedRaw !== null && predictedRaw >= station.window.start && predictedRaw <= station.window.end) {
    predictedGrade = Math.abs(predictedRaw - station.target) <= station.greenHalf + 1e-6 ? "green" : "yellow";
  }
  const remainingMeters = Math.round((station.target - state.progress) * STATION_METERS);
  const greenMeters = station.greenHalf * STATION_METERS;
  return {
    train: pct(state.progress, from, to),
    yellow: [pct(station.window.start, from, to), pct(station.window.end, from, to)],
    green: [
      pct(station.target - station.greenHalf, from, to),
      pct(station.target + station.greenHalf, from, to),
    ],
    target: pct(station.target, from, to),
    predicted: predictedRaw === null ? null : pct(predictedRaw, from, to),
    predictedGrade,
    remainingMeters,
    words: remainingWords(remainingMeters, greenMeters),
  };
}
