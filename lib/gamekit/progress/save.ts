import type { GameScoreId } from "@/lib/progress-store";
import type { GameKitGameId, PlayerProfile } from "../types";
import {
  loadGameProfileFromStore,
  saveGameProfileToStore,
} from "@/lib/progress-store";
import {
  createEmptyEconomy,
  migrateV2ToV3,
} from "./economy";

export const SAVE_VERSION = 5;

const DEFAULT_PROFILE: PlayerProfile = {
  version: SAVE_VERSION,
  stars: 0,
  economy: createEmptyEconomy(),
  unlockedVehicles: ["小黃"],
  bests: {},
  medals: {},
  adventureStars: {},
  stickers: [],
  gamesPlayed: {},
  snowboardCoursesUnlocked: ["bonbon-peak"],
};

function migrateV1(parsed: Partial<PlayerProfile>): PlayerProfile {
  return migrateV4ToV5(migrateV3ToV4(migrateV2ToV3({
    ...DEFAULT_PROFILE,
    stars: parsed.stars ?? 0,
    unlockedVehicles: parsed.unlockedVehicles ?? ["小黃"],
    bests: parsed.bests ?? {},
    medals: parsed.medals ?? {},
    stickers: parsed.stickers ?? [],
    gamesPlayed: parsed.gamesPlayed ?? {},
    version: 2,
  })));
}

/** v3→v4：只補車車大冒險的獨立顯示星欄位，既有進度原樣保留。 */
export function migrateV3ToV4(
  profile: Partial<PlayerProfile>,
): PlayerProfile {
  return {
    ...DEFAULT_PROFILE,
    ...profile,
    version: 4,
    adventureStars: profile.adventureStars ?? {},
  };
}

/** v4→v5：雪板分數公式改版，清掉舊語意的分數，保留星章與貼紙。 */
export function migrateV4ToV5(
  profile: Partial<PlayerProfile>,
): PlayerProfile {
  const bests = { ...(profile.bests ?? {}) };
  delete bests.snowboard;
  return {
    ...DEFAULT_PROFILE,
    ...profile,
    version: SAVE_VERSION,
    bests,
    snowboardCoursesUnlocked:
      profile.snowboardCoursesUnlocked?.filter((id) => typeof id === "string") ??
      ["bonbon-peak"],
  };
}

function ensureCurrentVersion(profile: Partial<PlayerProfile>): PlayerProfile {
  if (profile.version === SAVE_VERSION && profile.economy) {
    return { ...DEFAULT_PROFILE, ...profile, version: SAVE_VERSION };
  }
  if ((profile.version ?? 1) < 2) {
    return migrateV1(profile);
  }
  if ((profile.version ?? 1) < 3) {
    return migrateV4ToV5(migrateV3ToV4(migrateV2ToV3(profile)));
  }
  if ((profile.version ?? 1) < 4) {
    return migrateV4ToV5(migrateV3ToV4(profile));
  }
  if ((profile.version ?? 1) < 5) return migrateV4ToV5(profile);
  return { ...DEFAULT_PROFILE, ...profile, version: SAVE_VERSION };
}

export function loadPlayerProfile(): PlayerProfile {
  if (typeof window === "undefined") return { ...DEFAULT_PROFILE };
  try {
    const profile = loadGameProfileFromStore();
    if (profile.version !== SAVE_VERSION || !profile.economy) {
      const migrated = ensureCurrentVersion(profile);
      savePlayerProfile(migrated);
      return migrated;
    }
    return { ...DEFAULT_PROFILE, ...profile };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function savePlayerProfile(profile: PlayerProfile): void {
  if (typeof window === "undefined") return;
  saveGameProfileToStore({ ...profile, version: SAVE_VERSION });
}

export function recordBestScore(
  profile: PlayerProfile,
  gameId: GameScoreId,
  score: number,
): PlayerProfile {
  const prev = profile.bests[gameId] ?? 0;
  if (score <= prev) return profile;
  return {
    ...profile,
    bests: { ...profile.bests, [gameId]: score },
  };
}

export function recordMedal(
  profile: PlayerProfile,
  gameId: GameKitGameId,
  levelIndex: number,
  flags: number,
): PlayerProfile {
  const prev = profile.medals[gameId] ?? [];
  const arr = [...prev];
  const old = arr[levelIndex] ?? 0;
  arr[levelIndex] = old | flags;
  return {
    ...profile,
    medals: { ...profile.medals, [gameId]: arr },
  };
}

/** 寫入車車大冒險單關最佳顯示星數；不觸碰 medal、economy 或 garage。 */
export function recordAdventureStars(
  profile: PlayerProfile,
  levelIndex: number,
  stars: number,
): PlayerProfile {
  if (!Number.isInteger(levelIndex) || levelIndex < 0) return profile;
  const nextStars = Math.max(0, Math.min(3, Math.floor(stars)));
  const adventureStars = profile.adventureStars ?? {};
  const previous = adventureStars[levelIndex] ?? 0;
  if (nextStars <= previous) return profile;
  return {
    ...profile,
    adventureStars: { ...adventureStars, [levelIndex]: nextStars },
  };
}

export function unlockVehicle(profile: PlayerProfile, vehicleId: string): PlayerProfile {
  if (profile.unlockedVehicles.includes(vehicleId)) return profile;
  return {
    ...profile,
    unlockedVehicles: [...profile.unlockedVehicles, vehicleId],
  };
}
