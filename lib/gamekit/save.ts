import type { GameScoreId } from "@/lib/progress-store";
import type { GameKitGameId, PlayerProfile } from "./types";
import {
  loadGameProfileFromStore,
  saveGameProfileToStore,
} from "@/lib/progress-store";
import { PROGRESS_CHANGE_EVENT } from "@/lib/progress-store";
import type { Economy } from "./types";
import {
  applyGrantStars,
  applySpendStars,
  createEmptyEconomy,
  getEconomyFromProfile,
  migrateV2ToV3,
  type SpendResult,
  type StarLedgerInput,
} from "./economy";
import { GAMEKIT_PROGRESS_EVENT } from "./constants";

const SAVE_VERSION = 3;

const DEFAULT_PROFILE: PlayerProfile = {
  version: SAVE_VERSION,
  stars: 0,
  economy: createEmptyEconomy(),
  unlockedVehicles: ["小黃"],
  bests: {},
  medals: {},
  stickers: [],
  gamesPlayed: {},
};

function migrateV1(parsed: Partial<PlayerProfile>): PlayerProfile {
  return migrateV2ToV3({
    ...DEFAULT_PROFILE,
    stars: parsed.stars ?? 0,
    unlockedVehicles: parsed.unlockedVehicles ?? ["小黃"],
    bests: parsed.bests ?? {},
    medals: parsed.medals ?? {},
    stickers: parsed.stickers ?? [],
    gamesPlayed: parsed.gamesPlayed ?? {},
    version: 2,
  });
}

function ensureCurrentVersion(profile: Partial<PlayerProfile>): PlayerProfile {
  if (profile.version === SAVE_VERSION && profile.economy) {
    return { ...DEFAULT_PROFILE, ...profile, version: SAVE_VERSION };
  }
  if ((profile.version ?? 1) < 2) {
    return migrateV1(profile);
  }
  return migrateV2ToV3(profile);
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

export function addStars(profile: PlayerProfile, amount: number): PlayerProfile {
  if (amount <= 0) return profile;
  return applyGrantStars(profile, {
    id: `legacy:add:${getLifetimeStars(profile)}:${amount}`,
    amount,
    source: "legacy:addStars",
  });
}

function getLifetimeStars(profile: PlayerProfile): number {
  return profile.economy?.lifetimeStars ?? profile.stars ?? 0;
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

export function getEconomy(): Economy {
  return getEconomyFromProfile(loadPlayerProfile());
}

export function grantStars(entry: StarLedgerInput): PlayerProfile {
  const profile = applyGrantStars(loadPlayerProfile(), entry);
  savePlayerProfile(profile);
  return profile;
}

export function spendStars(entry: StarLedgerInput): SpendResult {
  const result = applySpendStars(loadPlayerProfile(), entry);
  if (result.ok) savePlayerProfile(result.profile);
  return result;
}

export function subscribeEconomy(cb: (economy: Economy) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const notify = () => cb(getEconomy());

  const onKit = () => notify();
  const onProgress = () => notify();

  window.addEventListener(GAMEKIT_PROGRESS_EVENT, onKit);
  window.addEventListener(PROGRESS_CHANGE_EVENT, onProgress);

  return () => {
    window.removeEventListener(GAMEKIT_PROGRESS_EVENT, onKit);
    window.removeEventListener(PROGRESS_CHANGE_EVENT, onProgress);
  };
}
