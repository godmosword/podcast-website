import type { RunState, Station } from "@/lib/games/orange-express/types";

/**
 * 旅程的兩套座標（大司機）：
 * - 站段局部：`progress` 0–1，停車、物理、預測都用這個，跟沒有旅程時一樣。
 * - 風景段：同一個 `progress` 往負的延伸，-（風景段總長）是出站那一刻，0 是站段起點。
 * - 全程：每一站從出站開到停車目標算一程，路線條用（單位是一站的 0–1）。
 * 這個檔只引 types，前窗與路線條都可以用。
 */

/** 只看風景段的函式收這個，前窗不必湊一整個站。 */
type HasScenic = Pick<Station, "scenic">;

/** 這一站前面的風景段總長。 */
export function scenicLength(station: HasScenic): number {
  return station.scenic.reduce((sum, section) => sum + section.length, 0);
}

/** 出站那一刻的 progress：有風景段時是負的。 */
export function legStart(station: HasScenic): number {
  // 0 - 0 是 +0（-0 會讓「回到 0」的比較出錯）。
  return 0 - scenicLength(station);
}

/** 第 k 段風景段起點的 progress；k 等於段數（或更大）時是站段起點 0。 */
export function sectionStart(station: HasScenic, k: number): number {
  let at = legStart(station);
  for (let i = 0; i < Math.min(k, station.scenic.length); i += 1) at += station.scenic[i]!.length;
  return at;
}

/** 現在在第幾段：風景段是 0 到段數－1，站段是 scenic.length。 */
export function sectionAt(station: HasScenic, progress: number): number {
  if (progress >= 0) return station.scenic.length;
  let end = legStart(station);
  for (let i = 0; i < station.scenic.length; i += 1) {
    end += station.scenic[i]!.length;
    if (progress < end) return i;
  }
  return station.scenic.length;
}

/** 現在在風景段（站段以前）。 */
export function onScenic(progress: number): boolean {
  return progress < 0;
}

/** 一程的長度：出站到停車目標。 */
function legLength(station: Station): number {
  return scenicLength(station) + station.target;
}

/** 全程長度（每一站出站到停車目標加起來）。 */
export function routeTotal(stations: readonly Station[]): number {
  return stations.reduce((sum, station) => sum + legLength(station), 0);
}

/** 每一站的停車目標在全程的哪裡（0–1）。 */
export function routeStops(stations: readonly Station[]): number[] {
  const total = routeTotal(stations);
  if (total <= 0) return stations.map(() => 1);
  let at = 0;
  return stations.map((station) => {
    at += legLength(station);
    return at / total;
  });
}

/**
 * 小橘在全程的哪裡（0–1）。開過頭、倒車都夾在這一站的停車目標，路線條上不會跑過站點章。
 * 到終點後是 1。
 */
export function routePosition(state: RunState): number {
  const total = routeTotal(state.stations);
  if (total <= 0 || state.phase === "route-done") return 1;
  let before = 0;
  for (let i = 0; i < state.stationIndex; i += 1) before += legLength(state.stations[i]!);
  const station = state.stations[state.stationIndex] ?? state.stations[0]!;
  const inLeg = Math.min(legLength(station), Math.max(0, state.progress - legStart(station)));
  return Math.min(1, (before + inLeg) / total);
}
