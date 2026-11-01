import type { RunState } from "@/lib/games/orange-express/types";

/**
 * 小橘的表情只有兩種：平常、開心。
 * 停好（綠區或黃區，黃區也算停好）與開門等朋友上車時開心；降速牌前提前慢下來也開心一下。
 * 其他時候平常的臉，開過頭也不難過。
 */
export type XiaojuMood = "calm" | "happy";

/** cheer：剛在降速牌前提前慢下來，開心一秒（畫面那邊計時）。 */
export function xiaojuMood(state: RunState, cheer = false): XiaojuMood {
  if (cheer) return "happy";
  const atStation = state.phase === "stopped" || state.phase === "doors-open";
  return atStation && state.grades[state.stationIndex] ? "happy" : "calm";
}
