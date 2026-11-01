import { routePosition, routeStops } from "@/lib/games/orange-express/journey";
import { COURSE_RULES } from "@/lib/games/orange-express/routes";
import { stopBarFor } from "@/lib/games/orange-express/stop-target";
import type { LandmarkId, Passenger, RunState, StationId } from "@/lib/games/orange-express/types";

export type RouteStripStop = {
  id: StationId;
  name: string;
  landmark: LandmarkId;
  /** 站點章在路線條上的位置（0–100）。 */
  at: number;
  /** 還站在章上等車的朋友。 */
  waiting: readonly Passenger[];
  /** 已經停過的站。 */
  reached: boolean;
  /** 現在要開去的那一站。 */
  next: boolean;
};

export type RouteStrip = {
  /** 小橘的位置（0–100）。 */
  train: number;
  stops: readonly RouteStripStop[];
  /** 已經上車、跟著小橘走的朋友。 */
  riding: readonly Passenger[];
  /** 現在要開去的那一站。 */
  next: string;
};

function pct(value: number): number {
  return Math.round(Math.min(1, Math.max(0, value)) * 1000) / 10;
}

/** 這一站上車了幾位：開過的站全上了，正在開門的站看 boarded。 */
function boardedAt(state: RunState, index: number): number {
  const station = state.stations[index]!;
  if (index < state.stationIndex) return station.passengers.length;
  if (index === state.stationIndex && state.phase === "doors-open") return state.boarded;
  if (index === state.stationIndex && state.phase === "route-done") return station.passengers.length;
  return 0;
}

/**
 * 前窗上緣的路線條（只有旅程的規則組）：站點地標章、章上等車的朋友、小橘與車上的朋友。
 * 進站後停車目標條佔上緣，這裡不出；前窗提示要說話時由畫面另外讓位。不寫數字、不寫距離。
 */
export function routeStripFor(state: RunState): RouteStrip | null {
  if (!COURSE_RULES[state.course].journey || state.phase === "route-done") return null;
  if (stopBarFor(state)) return null;
  const at = routeStops(state.stations);
  const stops = state.stations.map((station, index) => ({
    id: station.id,
    name: station.name,
    landmark: station.landmark,
    at: pct(at[index]!),
    waiting: station.passengers.slice(boardedAt(state, index)),
    reached: index < state.stationIndex || state.grades[index] !== undefined,
    next: index === state.stationIndex,
  }));
  const riding = state.stations.flatMap((station, index) => station.passengers.slice(0, boardedAt(state, index)));
  const next = state.stations[state.stationIndex] ?? state.stations[0]!;
  return { train: pct(routePosition(state)), stops, riding, next: next.name };
}
