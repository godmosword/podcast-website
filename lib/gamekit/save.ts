import type { GameKitGameId, PlayerProfile } from "./types";

const SAVE_KEY = "cheche:gamekit-profile";
const SAVE_VERSION = 1;

const DEFAULT_PROFILE: PlayerProfile = {
  version: SAVE_VERSION,
  stars: 0,
  unlockedVehicles: ["小黃"],
  bests: {},
  medals: {},
};

export function loadPlayerProfile(): PlayerProfile {
  if (typeof window === "undefined") return { ...DEFAULT_PROFILE };
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw) as PlayerProfile;
    if (parsed.version !== SAVE_VERSION) return { ...DEFAULT_PROFILE, stars: parsed.stars ?? 0 };
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function savePlayerProfile(profile: PlayerProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAVE_KEY, JSON.stringify({ ...profile, version: SAVE_VERSION }));
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

export function addStars(profile: PlayerProfile, amount: number): PlayerProfile {
  return { ...profile, stars: Math.max(0, profile.stars + amount) };
}

export function unlockVehicle(profile: PlayerProfile, vehicleId: string): PlayerProfile {
  if (profile.unlockedVehicles.includes(vehicleId)) return profile;
  return {
    ...profile,
    unlockedVehicles: [...profile.unlockedVehicles, vehicleId],
  };
}
