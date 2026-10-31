import { COURSE_RULES } from "@/lib/games/orange-express/routes";
import type { RunState } from "@/lib/games/orange-express/types";

export type RunMedals = {
  cleared: boolean;
  flawless: boolean;
  collectedAll: boolean;
  stars: number;
  smoothStops: number;
};

/** 速度每秒減少 0.32 以下視為柔和；落在 B1 與 B2 的設定之間。 */
export const SMOOTH_STOP_JERK = 0.32;

/** 平穩回饋只給大司機、小站長；B0–B2 或停住前減速度低於門檻都算平穩。 */
export function isSmoothStop(state: Pick<RunState, "course" | "brake" | "stopJerk">): boolean {
  if (state.course !== "big" && state.course !== "captain") return false;
  return state.brake <= 2 || state.stopJerk < SMOOTH_STOP_JERK;
}

/** 每一站都第一次就停在綠區。 */
export function allGreen(state: RunState): boolean {
  return state.stations.every((_, index) => state.grades[index] === "green");
}

/**
 * 開完每一站才算過關。
 * 每站都停在綠區、沒開過頭、也沒在還在跑的時候按開門，才是三顆星。
 * 停在黃區或倒車重停過是兩顆星。喇叭不算。開完這一條，朋友都接到了。
 * 慢慢看、小小司機提早按門只在當下提醒，不算進星星。
 */
export function medalsFor(state: RunState, earlyDoorTaps: number): RunMedals {
  const cleared = state.phase === "route-done";
  const doorOk = !COURSE_RULES[state.course].earlyDoorCosts || earlyDoorTaps === 0;
  const flawless = cleared && state.misses === 0 && doorOk && allGreen(state);
  const collectedAll = cleared;
  const stars = (cleared ? 1 : 0) + (flawless ? 1 : 0) + (collectedAll ? 1 : 0);
  return { cleared, flawless, collectedAll, stars, smoothStops: state.smoothStops };
}

export type StarMissReason = "green" | "overrun" | "early-door";

/**
 * 少的那顆星卡在哪裡，結算只說一件事。
 * 停車位置是這款的主要本事，先說；每站都綠區時才輪到開過頭，最後才是門。
 */
export function starMissReason(state: RunState, earlyDoorTaps: number): StarMissReason | null {
  if (medalsFor(state, earlyDoorTaps).flawless) return null;
  if (!allGreen(state)) return "green";
  if (state.misses > 0) return "overrun";
  if (earlyDoorTaps > 0) return "early-door";
  return null;
}
