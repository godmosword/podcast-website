import type { GameKitGameId, PlayerProfile } from "./types";
import { vehiclesUnlockedAt } from "./garage";
import {
  addStars,
  loadPlayerProfile,
  recordBestScore,
  recordMedal,
  savePlayerProfile,
  unlockVehicle,
} from "./save";
import { medalFlags, medalCount } from "./meta";

export const GAMEKIT_PROGRESS_EVENT = "cheche:gamekit-progress";

const LEGACY_BEST_KEYS: Record<GameKitGameId, string> = {
  "car-adventure": "car-adventure-best",
  "block-drop": "block-drop-best",
};

export type GameSessionResult = {
  gameId: GameKitGameId;
  score: number;
  /** 關卡索引。 */
  levelIndex?: number;
  cleared?: boolean;
  flawless?: boolean;
  collectedAll?: boolean;
};

function syncLegacyBest(gameId: GameKitGameId, score: number): void {
  if (typeof window === "undefined") return;
  try {
    const key = LEGACY_BEST_KEYS[gameId];
    const raw = window.localStorage.getItem(key);
    const prev = raw ? parseInt(raw, 10) : 0;
    if (score > prev) window.localStorage.setItem(key, String(score));
  } catch {
    /* ignore */
  }
}

function awardSticker(profile: PlayerProfile, stickerId: string): PlayerProfile {
  if (profile.stickers.includes(stickerId)) return profile;
  return { ...profile, stickers: [...profile.stickers, stickerId] };
}

function checkBonusStickers(profile: PlayerProfile): PlayerProfile {
  let next = profile;
  const unlocked = vehiclesUnlockedAt(profile.stars);
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

function starsFromNewMedalBits(oldFlags: number, newFlags: number): number {
  let earned = 0;
  for (let bit = 1; bit <= 4; bit <<= 1) {
    if ((newFlags & bit) && !(oldFlags & bit)) earned += 1;
  }
  return earned;
}

/** 回報一局結果，更新存檔並廣播進度事件。 */
export function reportGameSession(result: GameSessionResult): PlayerProfile {
  let profile = loadPlayerProfile();
  profile = recordBestScore(profile, result.gameId, result.score);
  syncLegacyBest(result.gameId, result.score);

  if (!profile.gamesPlayed[result.gameId]) {
    profile = {
      ...profile,
      gamesPlayed: { ...profile.gamesPlayed, [result.gameId]: true },
    };
    profile = awardSticker(profile, `played-${result.gameId}`);
  }

  if (result.cleared) {
    const idx = result.levelIndex ?? 0;
    const prevFlags = profile.medals[result.gameId]?.[idx] ?? 0;
    const flags = medalFlags(
      true,
      Boolean(result.flawless),
      Boolean(result.collectedAll),
    );
    profile = recordMedal(profile, result.gameId, idx, flags);
    const merged = profile.medals[result.gameId]?.[idx] ?? flags;
    const starGain = starsFromNewMedalBits(prevFlags, merged);
    if (starGain > 0) profile = addStars(profile, starGain);
  }

  for (const id of vehiclesUnlockedAt(profile.stars)) {
    profile = unlockVehicle(profile, id);
  }
  profile = checkBonusStickers(profile);

  savePlayerProfile(profile);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(GAMEKIT_PROGRESS_EVENT, { detail: profile }),
    );
  }
  return profile;
}

export function totalMedalStars(profile: PlayerProfile): number {
  let sum = 0;
  for (const flags of Object.values(profile.medals)) {
    if (!flags) continue;
    for (const f of flags) sum += medalCount(f);
  }
  return sum;
}

export function gameMedalStars(
  profile: PlayerProfile,
  gameId: GameKitGameId,
): number {
  const flags = profile.medals[gameId];
  if (!flags) return 0;
  return flags.reduce((n, f) => n + medalCount(f), 0);
}
