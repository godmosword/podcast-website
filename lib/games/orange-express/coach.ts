import { currentStation, predictStop, step } from "@/lib/games/orange-express/reducer";
import type { BrakeNotch, RunState } from "@/lib/games/orange-express/types";

/** 「停」那一格（低齡桿面三格裡的中間那格）。 */
const STOP_NOTCH: BrakeNotch = 3;

/**
 * 聽到「現在拉停」到真的拉下去，孩子大約要這麼久（秒）。brake 拍對準「等這麼久再拉」會停在綠區正中間，
 * 一聽到就拉、或慢一倍才拉，都還在綠區裡（大司機第一站約 ±0.6 秒；小站長綠區窄一半，約 ±0.4 秒）。
 */
export const COACH_LEAD = 0.6;
const LEAD_DT = 1 / 30;

/**
 * 進站示範分兩拍，同一時間只強調一樣：
 * - watch：進站點到了，停車目標條外圈亮、說「快到了，準備拉停」，讓孩子先看這裡、手放好。
 * - brake：照現在這樣再開 COACH_LEAD 秒才拉「停」，會停在綠區中心以後（或更晚、已經要來不及）：強調煞車、說「現在拉停」。
 *   不在一進站就叫孩子拉，不然學到的是「一出現就拉」，停在月台前面；也不在剛好停進黃區時叫，照做才停得進綠區。
 * 停好、開門、倒車、還沒到進站點：none。車停在區間前（停太早）回到 watch。
 */
export type CoachBeat = "none" | "watch" | "brake";

export function coachBeat(state: RunState): CoachBeat {
  if (state.phase !== "running" && state.phase !== "in-window") return "none";
  const station = currentStation(state);
  if (state.progress < station.approachAt) return "none";
  if (state.speed <= 0) return "watch";
  const ifPulled = stopIfPulledAfter(state, COACH_LEAD);
  if (ifPulled === null) return "watch";
  return ifPulled >= station.target ? "brake" : "watch";
}

/**
 * 照現在的桿位再開 lead 秒，然後拉「停」（已經拉得更多就照現在的），會停在哪。
 * 用真的換桿算：作用從當下的值開始、照樣先跳一點再跟上，跟孩子真的拉下去一樣。
 */
function stopIfPulledAfter(state: RunState, lead: number): number | null {
  let later = state;
  for (let t = 0; t < lead - 1e-9; t += LEAD_DT) {
    later = step(later, { type: "tick", dt: LEAD_DT });
    if (later.phase !== "running" && later.phase !== "in-window") return later.progress;
  }
  const brake = (later.brake > STOP_NOTCH ? later.brake : STOP_NOTCH) as BrakeNotch;
  const pulled = step(step(later, { type: "set-power", notch: 0 }), { type: "set-brake", notch: brake });
  return predictStop({ ...pulled, autoBrake: false });
}
