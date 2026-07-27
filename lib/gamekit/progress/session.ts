import type { GameScoreId } from "@/lib/progress-store";
import type { GameKitGameId, PlayerProfile } from "../types";
import { vehiclesUnlockedAt } from "./garage";
import { applyGrantStars, getLifetimeStars } from "./economy";
import {
  loadPlayerProfile,
  recordBestScore,
  recordMedal,
  savePlayerProfile,
  unlockVehicle,
} from "./save";
import { medalFlags, medalCount } from "./meta";
import { saveBestScoreInStore } from "@/lib/progress-store";
import { trackGameSessionComplete } from "@/lib/analytics";

import { GAMEKIT_PROGRESS_EVENT } from "../runtime/constants";
import { SNOWBOARD_COURSES } from "@/lib/games/snowboard/course";

export { GAMEKIT_PROGRESS_EVENT } from "../runtime/constants";

export type GameSessionResult = {
  gameId: GameScoreId;
  score: number;
  courseId?: string;
  trickScore?: number;
  bestCombo?: number;
  /** 關卡索引。 */
  levelIndex?: number;
  cleared?: boolean;
  flawless?: boolean;
  collectedAll?: boolean;
};

function isGameKitGameId(gameId: GameScoreId): gameId is GameKitGameId {
  return (
    gameId === "block-drop" ||
    gameId === "car-adventure" ||
    gameId === "candy-kart" ||
    gameId === "candy-match" ||
    gameId === "snowboard"
  );
}

function awardSticker(profile: PlayerProfile, stickerId: string): PlayerProfile {
  if (profile.stickers.includes(stickerId)) return profile;
  return { ...profile, stickers: [...profile.stickers, stickerId] };
}

function checkBonusStickers(profile: PlayerProfile): PlayerProfile {
  let next = profile;
  const unlocked = vehiclesUnlockedAt(getLifetimeStars(profile));
  if (unlocked.length >= 3) {
    next = awardSticker(next, "garage-5");
  }
  for (const flags of Object.values(next.medals)) {
    if (!flags) continue;
    for (const f of flags) {
      if (medalCount(f) >= 3) {
        next = awardSticker(next, "medal-master");
        return next;
      }
    }
  }
  return next;
}

function unlockNextSnowboardCourse(
  profile: PlayerProfile,
  result: GameSessionResult,
): PlayerProfile {
  if (result.gameId !== "snowboard" || !result.cleared || !result.courseId) {
    return profile;
  }
  const current = profile.snowboardCoursesUnlocked ?? [SNOWBOARD_COURSES[0].id];
  const course = SNOWBOARD_COURSES.find((item) => item.id === result.courseId);
  if (!course) return profile;
  const next = SNOWBOARD_COURSES.find(
    (item) => item.unlockAfter === course.id,
  )?.id;
  if (!next || current.includes(next)) return profile;
  return {
    ...profile,
    snowboardCoursesUnlocked: [...current, next],
  };
}

/** 回報一局結果，更新存檔並廣播進度事件。 */
export function reportGameSession(result: GameSessionResult): PlayerProfile {
  let profile = loadPlayerProfile();
  profile = recordBestScore(profile, result.gameId, result.score);
  saveBestScoreInStore(result.gameId, result.score);

  if (!profile.gamesPlayed[result.gameId]) {
    profile = {
      ...profile,
      gamesPlayed: { ...profile.gamesPlayed, [result.gameId]: true },
    };
    profile = awardSticker(profile, `played-${result.gameId}`);
  }

  if (result.cleared && isGameKitGameId(result.gameId)) {
    const idx = result.levelIndex ?? 0;
    const prevFlags = profile.medals[result.gameId]?.[idx] ?? 0;
    const flags = medalFlags(
      true,
      Boolean(result.flawless),
      Boolean(result.collectedAll),
    );
    profile = recordMedal(profile, result.gameId, idx, flags);
    const merged = profile.medals[result.gameId]?.[idx] ?? flags;
    for (let bit = 1; bit <= 4; bit <<= 1) {
      if ((merged & bit) && !(prevFlags & bit)) {
        profile = applyGrantStars(profile, {
          id: `medal:${result.gameId}:${idx}:${bit}`,
          amount: 1,
          source: `game:${result.gameId}:medal`,
        });
      }
    }
  }

  profile = unlockNextSnowboardCourse(profile, result);

  for (const id of vehiclesUnlockedAt(getLifetimeStars(profile))) {
    profile = unlockVehicle(profile, id);
  }
  profile = checkBonusStickers(profile);

  savePlayerProfile(profile);
  if (typeof window !== "undefined") {
    trackGameSessionComplete(result.gameId, Boolean(result.cleared));
    window.dispatchEvent(
      new CustomEvent(GAMEKIT_PROGRESS_EVENT, { detail: profile }),
    );
  }
  return profile;
}
