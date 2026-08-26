import {
  createEmptyEconomy,
  migrateV2ToV3,
} from "@/lib/gamekit/progress/economy";
import type { GameKitGameId } from "@/lib/gamekit/types";
import type { PlayerProfile } from "@/lib/gamekit/types";
import { canonicalStorySlug } from "@/lib/story-slug-aliases";
import { normalizeThemeMode, type ThemeMode } from "@/lib/theme";

import {
  PROGRESS_STORAGE_KEY,
  PROGRESS_CHANGE_EVENT,
} from "@/lib/progress-keys";

export { PROGRESS_STORAGE_KEY, PROGRESS_CHANGE_EVENT };
const PROGRESS_SCHEMA_VERSION = 2;

export type CaptionSize = "sm" | "md" | "lg";
export type ThemePreference = ThemeMode;
export type GameScoreId = GameKitGameId;
export type BlockDropDifficultyPreference = "relaxed" | "standard" | "challenge";
export type BlockDropSpecialModePreference = "classic" | "rainbow";
export type MotionPreference = "system" | "on" | "off";

export type GameKitPreferenceStore = {
  kidsMode: boolean;
  blockDropDifficulty: BlockDropDifficultyPreference;
  blockDropSpecialMode: BlockDropSpecialModePreference;
  gameVolume: number;
  motionPreference: MotionPreference;
};

export type ContinueState = {
  slug: string;
  page: number;
  time: number;
  updatedAt: number;
};

export type ReflectionShownSource = "detail" | "end-screen";

export type ReflectionShownEvent = {
  slug: string;
  source: ReflectionShownSource;
};

export type EngagementStore = {
  storiesCompleted: string[];
  reflectionShown: ReflectionShownEvent[];
  platformClicks: Record<string, number>;
};

export type ProgressStore = {
  schemaVersion: number;
  favorites: string[];
  continue: ContinueState | null;
  sfxEnabled: boolean;
  preferences: {
    captionSize: CaptionSize;
    gameKit: GameKitPreferenceStore;
    theme: ThemePreference;
    nightPromptDismissed?: boolean;
  };
  bestScores: Partial<Record<GameScoreId, number>>;
  gameProfile: PlayerProfile;
  unlocks: {
    characters: string[];
    vehicles: string[];
  };
  engagement: EngagementStore;
};

const DEFAULT_ENGAGEMENT: EngagementStore = {
  storiesCompleted: [],
  reflectionShown: [],
  platformClicks: {},
};

const LEGACY_KEYS = {
  favorites: "chechecar-favorites",
  continue: "chechecar-continue",
  sfx: "cc:sfx",
  captionSize: "cc:caption-size",
  gamekitProfile: "cheche:gamekit-profile",
  gamekitSettings: "cheche:gamekit-settings",
  blockDropBest: "block-drop-best",
} as const;

const DEFAULT_GAME_PROFILE: PlayerProfile = {
  version: 5,
  stars: 0,
  economy: createEmptyEconomy(),
  unlockedVehicles: ["小黃"],
  bests: {},
  medals: {},
  stickers: [],
  gamesPlayed: {},
};

/** progress-store 與 GameKit save 共用 v4 的純加欄位相容形狀。 */
function migrateGameProfile(raw: Partial<PlayerProfile>): PlayerProfile {
  const v3 = migrateV2ToV3(raw);
  return {
    ...v3,
    version: 5,
  };
}

export const DEFAULT_PROGRESS: ProgressStore = {
  schemaVersion: PROGRESS_SCHEMA_VERSION,
  favorites: [],
  continue: null,
  sfxEnabled: true,
  preferences: {
    captionSize: "md",
    gameKit: {
      kidsMode: true,
      blockDropDifficulty: "relaxed",
      blockDropSpecialMode: "classic",
      gameVolume: 1,
      motionPreference: "system",
    },
    theme: "system",
    nightPromptDismissed: false,
  },
  bestScores: {},
  gameProfile: { ...DEFAULT_GAME_PROFILE },
  unlocks: {
    characters: [],
    vehicles: [],
  },
  engagement: { ...DEFAULT_ENGAGEMENT },
};

const listeners = new Set<() => void>();

function isClient(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return typeof window.localStorage?.getItem === "function";
  } catch {
    return false;
  }
}

function emitChange(): void {
  if (!isClient()) return;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PROGRESS_CHANGE_EVENT));
  }
  for (const cb of listeners) cb();
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readLegacyBest(key: string): number {
  if (!isClient()) return 0;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function mergeBest(
  target: Partial<Record<GameScoreId, number>>,
  gameId: GameScoreId,
  score: number,
): void {
  if (score <= 0) return;
  const prev = target[gameId] ?? 0;
  if (score > prev) target[gameId] = score;
}

// UX-P2-1：預設落在 relaxed，與 kidsMode 預設開啟互相搭配；只有使用者透過
// 難度切換明確選過 standard／challenge 才會離開 relaxed，且該選擇會持久化。
function normalizeBlockDropDifficulty(
  value: unknown,
): BlockDropDifficultyPreference {
  return value === "standard" || value === "challenge" ? value : "relaxed";
}

function normalizeBlockDropSpecialMode(
  value: unknown,
): BlockDropSpecialModePreference {
  return value === "rainbow" ? "rainbow" : "classic";
}

function normalizeMotionPreference(value: unknown): MotionPreference {
  return value === "on" || value === "off" ? value : "system";
}

function normalizeGameVolume(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : 1;
}

function normalizeGameKitPreferences(
  value: Partial<GameKitPreferenceStore> | undefined,
): GameKitPreferenceStore {
  return {
    kidsMode:
      typeof value?.kidsMode === "boolean"
        ? value.kidsMode
        : DEFAULT_PROGRESS.preferences.gameKit.kidsMode,
    blockDropDifficulty: normalizeBlockDropDifficulty(value?.blockDropDifficulty),
    blockDropSpecialMode: normalizeBlockDropSpecialMode(value?.blockDropSpecialMode),
    gameVolume: normalizeGameVolume(value?.gameVolume),
    motionPreference: normalizeMotionPreference(value?.motionPreference),
  };
}

/** 一次性將散落 localStorage keys 搬遷至統一 schema。 */
export function migrateProgress(): ProgressStore {
  if (!isClient()) return { ...DEFAULT_PROGRESS };

  const existing = parseJson<ProgressStore>(
    localStorage.getItem(PROGRESS_STORAGE_KEY),
  );
  const hasLegacy = Object.values(LEGACY_KEYS).some(
    (key) => localStorage.getItem(key) !== null,
  );
  if (
    existing &&
    existing.schemaVersion >= PROGRESS_SCHEMA_VERSION &&
    !hasLegacy
  ) {
    return normalizeProgress(existing);
  }

  const next: ProgressStore = existing
    ? normalizeProgress(existing)
    : structuredClone(DEFAULT_PROGRESS);

  const legacyFavorites = parseJson<unknown>(
    localStorage.getItem(LEGACY_KEYS.favorites),
  );
  if (Array.isArray(legacyFavorites)) {
    next.favorites = legacyFavorites.filter((s) => typeof s === "string");
  }

  const legacyContinue = parseJson<ContinueState>(
    localStorage.getItem(LEGACY_KEYS.continue),
  );
  if (legacyContinue?.slug) {
    next.continue = legacyContinue;
  }

  try {
    const sfxRaw = localStorage.getItem(LEGACY_KEYS.sfx);
    if (sfxRaw === "off") next.sfxEnabled = false;
    else if (sfxRaw === "on") next.sfxEnabled = true;
  } catch {
    /* ignore */
  }

  const legacyCaption = localStorage.getItem(LEGACY_KEYS.captionSize);
  if (legacyCaption === "sm" || legacyCaption === "md" || legacyCaption === "lg") {
    next.preferences.captionSize = legacyCaption;
  }

  const legacySettings = parseJson<{ kidsMode?: boolean }>(
    localStorage.getItem(LEGACY_KEYS.gamekitSettings),
  );
  if (legacySettings && typeof legacySettings.kidsMode === "boolean") {
    next.preferences.gameKit.kidsMode = legacySettings.kidsMode;
  }

  const legacyProfile = parseJson<PlayerProfile>(
    localStorage.getItem(LEGACY_KEYS.gamekitProfile),
  );
  if (legacyProfile) {
    next.gameProfile = migrateGameProfile({
      ...DEFAULT_GAME_PROFILE,
      ...legacyProfile,
    });
  }

  mergeBest(next.bestScores, "block-drop", readLegacyBest(LEGACY_KEYS.blockDropBest));
  for (const [gameId, score] of Object.entries(next.gameProfile.bests) as [
    GameKitGameId,
    number,
  ][]) {
    mergeBest(next.bestScores, gameId, score);
  }

  next.gameProfile.bests = {
    ...next.gameProfile.bests,
    "block-drop": next.bestScores["block-drop"] ?? next.gameProfile.bests["block-drop"],
  };

  if (!next.engagement) {
    next.engagement = { ...DEFAULT_ENGAGEMENT };
  }
  next.schemaVersion = PROGRESS_SCHEMA_VERSION;
  localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next));

  for (const key of Object.values(LEGACY_KEYS)) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }

  return next;
}

function migrateStorySlug(slug: string): string {
  return canonicalStorySlug(slug);
}

function isReflectionShownSource(value: unknown): value is ReflectionShownSource {
  return value === "detail" || value === "end-screen";
}

/** 舊版 string[] 視為 end-screen；同 slug＋source 去重。 */
export function normalizeReflectionShown(raw: unknown): ReflectionShownEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: ReflectionShownEvent[] = [];
  const seen = new Set<string>();

  const push = (slug: string, source: ReflectionShownSource) => {
    const migrated = migrateStorySlug(slug);
    if (!migrated) return;
    const key = `${migrated}:${source}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ slug: migrated, source });
  };

  for (const item of raw) {
    if (typeof item === "string") {
      push(item, "end-screen");
      continue;
    }
    if (typeof item !== "object" || item === null || !("slug" in item)) {
      continue;
    }
    const slug = item.slug;
    if (typeof slug !== "string") continue;
    const sourceRaw = "source" in item ? item.source : undefined;
    push(slug, isReflectionShownSource(sourceRaw) ? sourceRaw : "end-screen");
  }
  return out;
}

function normalizeProgress(raw: Partial<ProgressStore>): ProgressStore {
  const favorites = (raw.favorites ?? DEFAULT_PROGRESS.favorites).map(
    migrateStorySlug,
  );
  const continueState = raw.continue?.slug
    ? { ...raw.continue, slug: migrateStorySlug(raw.continue.slug) }
    : (raw.continue ?? null);
  const storiesCompleted = (raw.engagement?.storiesCompleted ?? []).map(
    migrateStorySlug,
  );
  const reflectionShown = normalizeReflectionShown(
    raw.engagement?.reflectionShown,
  );

  const bestScores = {
    ...DEFAULT_PROGRESS.bestScores,
    ...raw.bestScores,
  };

  return {
    ...DEFAULT_PROGRESS,
    ...raw,
    favorites,
    continue: continueState,
    bestScores,
    preferences: {
      ...DEFAULT_PROGRESS.preferences,
      ...raw.preferences,
      theme: normalizeThemeMode(raw.preferences?.theme),
      gameKit: normalizeGameKitPreferences(raw.preferences?.gameKit),
    },
    gameProfile: migrateGameProfile({
      ...DEFAULT_GAME_PROFILE,
      ...raw.gameProfile,
    }),
    unlocks: {
      ...DEFAULT_PROGRESS.unlocks,
      ...raw.unlocks,
    },
    engagement: {
      storiesCompleted,
      reflectionShown,
      platformClicks: {
        ...DEFAULT_ENGAGEMENT.platformClicks,
        ...raw.engagement?.platformClicks,
      },
    },
    schemaVersion: PROGRESS_SCHEMA_VERSION,
  };
}

function readProgress(): ProgressStore {
  if (!isClient()) return { ...DEFAULT_PROGRESS };
  return migrateProgress();
}

function writeProgress(next: ProgressStore): ProgressStore {
  if (!isClient()) return next;
  const normalized = normalizeProgress(next);
  localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(normalized));
  emitChange();
  return normalized;
}

export async function getProgress(): Promise<ProgressStore> {
  return readProgress();
}

export function getProgressSync(): ProgressStore {
  return readProgress();
}

export async function updateProgress(
  fn: (prev: ProgressStore) => Partial<ProgressStore>,
): Promise<ProgressStore> {
  const current = readProgress();
  return writeProgress({ ...current, ...fn(current) });
}

export function subscribeProgress(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getFavoritesFromStore(): string[] {
  return readProgress().favorites;
}

export function toggleFavoriteInStore(slug: string): string[] {
  const current = readProgress();
  const next = current.favorites.includes(slug)
    ? current.favorites.filter((s) => s !== slug)
    : [...current.favorites, slug];
  writeProgress({ ...current, favorites: next });
  return next;
}

export function isFavoriteInStore(slug: string): boolean {
  return readProgress().favorites.includes(slug);
}

export function saveContinueInStore(
  state: Omit<ContinueState, "updatedAt">,
): void {
  const current = readProgress();
  writeProgress({
    ...current,
    continue: { ...state, updatedAt: Date.now() },
  });
}

export function loadContinueFromStore(): ContinueState | null {
  return readProgress().continue;
}

export function clearContinueInStore(): void {
  const current = readProgress();
  writeProgress({ ...current, continue: null });
}

export function isSfxEnabledInStore(): boolean {
  return readProgress().sfxEnabled;
}

export function setSfxEnabledInStore(on: boolean): void {
  const current = readProgress();
  writeProgress({ ...current, sfxEnabled: on });
}

export function getCaptionSizeFromStore(): CaptionSize {
  return readProgress().preferences.captionSize;
}

export function setCaptionSizeInStore(size: CaptionSize): void {
  const current = readProgress();
  writeProgress({
    ...current,
    preferences: { ...current.preferences, captionSize: size },
  });
}

export function getBestScoreFromStore(gameId: GameScoreId): number {
  const p = readProgress();
  return p.bestScores[gameId] ?? p.gameProfile.bests[gameId as GameKitGameId] ?? 0;
}

export function saveBestScoreInStore(gameId: GameScoreId, score: number): number {
  const current = readProgress();
  const prev =
    current.bestScores[gameId] ??
    current.gameProfile.bests[gameId as GameKitGameId] ??
    0;
  if (score <= prev) return prev;
  const bestScores = { ...current.bestScores, [gameId]: score };
  const gameProfile =
    gameId === "block-drop"
      ? {
          ...current.gameProfile,
          bests: { ...current.gameProfile.bests, [gameId]: score },
        }
      : current.gameProfile;
  writeProgress({ ...current, bestScores, gameProfile });
  return score;
}

export function loadGameProfileFromStore(): PlayerProfile {
  return readProgress().gameProfile;
}

export function saveGameProfileToStore(profile: PlayerProfile): void {
  const current = readProgress();
  const bestScores = { ...current.bestScores };
  for (const [id, score] of Object.entries(profile.bests) as [GameKitGameId, number][]) {
    mergeBest(bestScores, id, score);
  }
  writeProgress({
    ...current,
    gameProfile: migrateGameProfile({ ...profile, version: 5 }),
    bestScores,
  });
}

export function getGameKitSettingsFromStore(): GameKitPreferenceStore {
  return readProgress().preferences.gameKit;
}

export function saveGameKitSettingsToStore(
  settings: Partial<GameKitPreferenceStore>,
): void {
  const current = readProgress();
  writeProgress({
    ...current,
    preferences: {
      ...current.preferences,
      gameKit: normalizeGameKitPreferences({
        ...current.preferences.gameKit,
        ...settings,
      }),
    },
  });
}

export function getThemeFromStore(): ThemePreference {
  return normalizeThemeMode(readProgress().preferences.theme);
}

export function setThemeInStore(theme: ThemePreference): void {
  const current = readProgress();
  writeProgress({
    ...current,
    preferences: { ...current.preferences, theme },
  });
}

export function getNightPromptDismissedFromStore(): boolean {
  return readProgress().preferences.nightPromptDismissed ?? false;
}

export function setNightPromptDismissedInStore(dismissed: boolean): void {
  const current = readProgress();
  writeProgress({
    ...current,
    preferences: { ...current.preferences, nightPromptDismissed: dismissed },
  });
}
