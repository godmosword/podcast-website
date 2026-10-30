import type { RunState } from "@/lib/games/orange-express/types";

/**
 * 小橘的表情只有兩種：平常、開心。
 * 停好（綠區或黃區，黃區也算停好）與開門等朋友上車時開心；其他時候平常的臉，開過頭也不難過。
 */
export type XiaojuMood = "calm" | "happy";

export function xiaojuMood(state: RunState): XiaojuMood {
  const atStation = state.phase === "stopped" || state.phase === "doors-open";
  return atStation && state.grades[state.stationIndex] ? "happy" : "calm";
}
