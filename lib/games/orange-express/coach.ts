import { currentStation, predictStop } from "@/lib/games/orange-express/reducer";
import type { BrakeNotch, RunState } from "@/lib/games/orange-express/types";

/** 「停」那一格（低齡桿面三格裡的中間那格）。 */
const STOP_NOTCH: BrakeNotch = 3;

/**
 * 進站示範分兩拍，同一時間只強調一樣：
 * - watch：進站點到了，停車目標條外圈亮，讓孩子看這裡。
 * - brake：現在拉「停」會停在區間起點以後（或已經來不及在區間前停），強調煞車、說「右邊拉，停在綠區」。
 *   不在一進站就叫孩子拉，不然學到的是「一出現就拉」，停在月台前面。
 * 停好、開門、倒車、還沒到進站點：none。車停在區間前（停太早）回到 watch。
 */
export type CoachBeat = "none" | "watch" | "brake";

export function coachBeat(state: RunState): CoachBeat {
  if (state.phase !== "running" && state.phase !== "in-window") return "none";
  const station = currentStation(state);
  if (state.progress < station.approachAt) return "none";
  if (state.speed <= 0) return "watch";
  const brake = (state.brake > STOP_NOTCH ? state.brake : STOP_NOTCH) as BrakeNotch;
  const ifPulled = predictStop({ ...state, power: 0, brake, autoBrake: false });
  if (ifPulled === null) return "watch";
  return ifPulled >= station.window.start ? "brake" : "watch";
}
