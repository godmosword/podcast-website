import type { GameScoreId } from "@/lib/progress-store";
import type { GameKitGameId, PlayerProfile } from "./types";
import { vehiclesUnlockedAt } from "./garage";
import {
  loadGameProfileFromStore,
  saveGameProfileToStore,
} from "@/lib/progress-store";

const SAVE_VERSION = 2;

const DEFAULT_PROFILE: PlayerProfile = {
  version: SAVE_VERSION,
  stars: 0,
  unlockedVehicles: ["小黃"],
  bests: {},
  medals: {},
  stickers: [],
  gamesPlayed: {},
};

function migrateV1(parsed: Partial<PlayerProfile>): PlayerProfile {
  return {
    ...DEFAULT_PROFILE,
    stars: parsed.stars ?? 0,
    unlockedVehicles: parsed.unlockedVehicles ?? ["小黃"],
    bests: parsed.bests ?? {},
    medals: parsed.medals ?? {},
    stickers: parsed.stickers ?? [],
    gamesPlayed: parsed.gamesPlayed ?? {},
    version: SAVE_VERSION,
  };
}

export function loadPlayerProfile(): PlayerProfile {
  if (typeof window === "undefined") return { ...DEFAULT_PROFILE };
  try {
    const profile = loadGameProfileFromStore();
    if (profile.version !== SAVE_VERSION) {
      const migrated = migrateV1(profile);
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

export function addStars(profile: PlayerProfile, amount: number): PlayerProfile {
  const stars = Math.max(0, profile.stars + amount);
  const unlocked = vehiclesUnlockedAt(stars);
  const merged = new Set([...profile.unlockedVehicles, ...unlocked]);
  return {
    ...profile,
    stars,
    unlockedVehicles: [...merged],
  };
}

export function unlockVehicle(profile: PlayerProfile, vehicleId: string): PlayerProfile {
  if (profile.unlockedVehicles.includes(vehicleId)) return profile;
  return {
    ...profile,
    unlockedVehicles: [...profile.unlockedVehicles, vehicleId],
  };
}

/** 合併舊版各遊戲 best 分數到 profile（遷移已由 progress-store 處理，保留 API）。 */
export function syncLegacyScores(profile: PlayerProfile): PlayerProfile {
  return profile;
}
