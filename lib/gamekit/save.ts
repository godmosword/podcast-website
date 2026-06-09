import type { GameKitGameId, PlayerProfile } from "./types";
import { vehiclesUnlockedAt } from "./garage";

const SAVE_KEY = "cheche:gamekit-profile";
const SAVE_VERSION = 2;

const LEGACY_BEST_KEYS: Record<GameKitGameId, string> = {
  "car-star": "car-star-best",
  "car-mission": "car-mission-best",
  "car-adventure": "car-adventure-best",
  "block-drop": "block-drop-best",
};

const DEFAULT_PROFILE: PlayerProfile = {
  version: SAVE_VERSION,
  stars: 0,
  unlockedVehicles: ["小黃"],
  bests: {},
  medals: {},
  stickers: [],
  gamesPlayed: {},
};

function importLegacyBests(): Partial<Record<GameKitGameId, number>> {
  if (typeof window === "undefined") return {};
  const bests: Partial<Record<GameKitGameId, number>> = {};
  for (const [gameId, key] of Object.entries(LEGACY_BEST_KEYS) as [
    GameKitGameId,
    string,
  ][]) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const n = parseInt(raw, 10);
        if (Number.isFinite(n) && n > 0) bests[gameId] = n;
      }
    } catch {
      /* ignore */
    }
  }
  return bests;
}

function migrateV1(parsed: Partial<PlayerProfile>): PlayerProfile {
  const legacyBests = importLegacyBests();
  return {
    ...DEFAULT_PROFILE,
    stars: parsed.stars ?? 0,
    unlockedVehicles: parsed.unlockedVehicles ?? ["小黃"],
    bests: { ...legacyBests, ...parsed.bests },
    medals: parsed.medals ?? {},
    stickers: parsed.stickers ?? [],
    gamesPlayed: parsed.gamesPlayed ?? {},
    version: SAVE_VERSION,
  };
}

export function loadPlayerProfile(): PlayerProfile {
  if (typeof window === "undefined") return { ...DEFAULT_PROFILE };
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      const withLegacy = migrateV1({});
      savePlayerProfile(withLegacy);
      return withLegacy;
    }
    const parsed = JSON.parse(raw) as PlayerProfile;
    if (parsed.version !== SAVE_VERSION) {
      return migrateV1(parsed);
    }
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function savePlayerProfile(profile: PlayerProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({ ...profile, version: SAVE_VERSION }),
  );
}

export function recordBestScore(
  profile: PlayerProfile,
  gameId: GameKitGameId,
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

/** 合併舊版各遊戲 best 分數到 profile（首次載入 hub 時）。 */
export function syncLegacyScores(profile: PlayerProfile): PlayerProfile {
  const legacy = importLegacyBests();
  let next = { ...profile };
  for (const [gameId, score] of Object.entries(legacy) as [
    GameKitGameId,
    number,
  ][]) {
    next = recordBestScore(next, gameId, score);
  }
  if (JSON.stringify(next.bests) !== JSON.stringify(profile.bests)) {
    savePlayerProfile(next);
  }
  return next;
}
