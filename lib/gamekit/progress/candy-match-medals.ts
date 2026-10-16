import type { PlayerProfile } from "../types";
import type { CandyMode } from "@/lib/games/candy-match/stages";

/** 舊資料只歸入輕鬆，不把挑戰主線當成已完成。 */
export function candyModeMedals(profile: PlayerProfile, mode: CandyMode): number[] {
  return profile.candyMatchMedals?.[mode] ?? (mode === "easy" ? profile.medals["candy-match"] ?? [] : []);
}
