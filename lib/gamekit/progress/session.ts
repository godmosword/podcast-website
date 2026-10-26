import type { GameScoreId } from "@/lib/progress-store";
import type { PlayerProfile } from "../types";
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
import { recordGameSession } from "@/lib/activity-log";
import { trackGameSessionComplete } from "@/lib/analytics";

import { GAMEKIT_PROGRESS_EVENT } from "../runtime/constants";
export { GAMEKIT_PROGRESS_EVENT } from "../runtime/constants";

export type GameSessionResult = {
  gameId: GameScoreId;
  score: number;
  candyMode?: "easy" | "challenge";
  /** 小橘特快車這一輪的檔。只做紀錄，不另開存檔欄位。 */
  orangeExpressLevel?: "look" | "drive" | "captain";
  /** 關卡索引。 */
  levelIndex?: number;
  cleared?: boolean;
  flawless?: boolean;
  collectedAll?: boolean;
  /**
   * false：這局算玩過、活動紀錄仍記通關，但不寫獎牌、不發全站星星、不解車庫。
   * 壽司屋第 1–3 天用這個。沒寫＝照舊發星。
   */
  grantMedals?: boolean;
};

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

  if (result.cleared && result.grantMedals !== false) {
    const idx = result.levelIndex ?? 0;
    const candyMode = result.gameId === "candy-match" ? result.candyMode ?? "easy" : null;
    const modeMedals = profile.candyMatchMedals ?? {
      easy: profile.medals["candy-match"]?.slice() ?? [], challenge: [],
    };
    const prevFlags = (candyMode ? modeMedals[candyMode][idx] : profile.medals[result.gameId]?.[idx]) ?? 0;
    const flags = medalFlags(
      true,
      Boolean(result.flawless),
      Boolean(result.collectedAll),
    );
    profile = recordMedal(profile, result.gameId, idx, flags);
    const merged = prevFlags | flags;
    if (candyMode) {
      const medals = modeMedals[candyMode].slice();
      medals[idx] = merged;
      profile = { ...profile, candyMatchMedals: { ...modeMedals, [candyMode]: medals } };
    }
    for (let bit = 1; bit <= 4; bit <<= 1) {
      if ((merged & bit) && !(prevFlags & bit)) {
        profile = applyGrantStars(profile, {
          id: `medal:${result.gameId}:${candyMode === "challenge" ? "challenge:" : ""}${idx}:${bit}`,
          amount: 1,
          source: `game:${result.gameId}:medal`,
        });
      }
    }
  }

  for (const id of vehiclesUnlockedAt(getLifetimeStars(profile))) {
    profile = unlockVehicle(profile, id);
  }
  profile = checkBonusStickers(profile);

  savePlayerProfile(profile);
  recordGameSession(result.gameId, Boolean(result.cleared));
  if (typeof window !== "undefined") {
    trackGameSessionComplete(result.gameId, Boolean(result.cleared));
    window.dispatchEvent(
      new CustomEvent(GAMEKIT_PROGRESS_EVENT, { detail: profile }),
    );
  }
  return profile;
}
