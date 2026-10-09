import type { GameKitGameId } from "@/lib/gamekit/types";
import { canonicalStorySlug } from "@/lib/story-slug-aliases";

/** 本機活動紀錄。與 cheche:progress 分開，方便之後只同步這一份白名單。 */
export const ACTIVITY_STORAGE_KEY = "cheche:activity";
const ACTIVITY_CHANGE_EVENT = "cheche:activity-change";

/** 含今天在內往前保留的天數。比這更舊的日期在寫入與讀取時刪除。 */
const ACTIVITY_RETENTION_DAYS = 90;
/** 正規化後的 JSON 超過此大小就整份重來，避免壞資料把 localStorage 撐滿。 */
export const ACTIVITY_MAX_BYTES = 64 * 1024;
/** 播放器單次 timeupdate 前進超過這個秒數，視為拖曳，不計入收聽。 */
const MAX_PLAYED_DELTA_SECONDS = 2;
/** 累計到這個秒數就寫入一次。 */
export const ACTIVITY_FLUSH_SECONDS = 15;
/** 遊戲頁計時若一次跳超過這個秒數（例如電腦睡眠），只記到上限。 */
const MAX_VISIBLE_SLICE_SECONDS = 20;

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_KEY = /^[a-z0-9-]{1,64}$/;
const DEVICE_KEY = /^[A-Za-z0-9:+_-]{8,96}$/;
const MAX_DAY_SECONDS = 86_400;
const MAX_COUNT = 999;
const GAME_IDS: readonly GameKitGameId[] = ["block-drop", "candy-match"];

type StoryActivity = {
  seconds: number;
  plays: number;
  completions: number;
};

type GameActivity = {
  seconds: number;
  sessions: number;
  clears: number;
};

export type DayBucket = {
  stories: Record<string, StoryActivity>;
  games: Partial<Record<GameKitGameId, GameActivity>>;
};

export type ActivityLogV1 = {
  schemaVersion: 1;
  deviceKey: string;
  days: Record<string, DayBucket>;
};

export type PlaybackClock = {
  pendingSeconds: number;
  lastMediaTime: number | null;
};

const listeners = new Set<() => void>();

export function emptyActivityLog(deviceKey = ""): ActivityLogV1 {
  return { schemaVersion: 1, deviceKey, days: {} };
}

export function createPlaybackClock(): PlaybackClock {
  return { pendingSeconds: 0, lastMediaTime: null };
}

/** 本地日曆日，YYYY-MM-DD。跨午夜的兩次寫入會落到不同天。 */
export function localDateKey(at: number): string {
  const date = new Date(at);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function clampPlayedDelta(deltaSeconds: number): number {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return 0;
  return Math.min(deltaSeconds, MAX_PLAYED_DELTA_SECONDS);
}

export function clampVisibleSlice(deltaSeconds: number): number {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return 0;
  return Math.min(deltaSeconds, MAX_VISIBLE_SLICE_SECONDS);
}

/**
 * 只累計播放中的前進量。倒退與超過 2 秒的跳躍不計。
 * 回傳 true 表示累計已達寫入門檻。
 */
export function notePlaybackTime(
  clock: PlaybackClock,
  currentTime: number,
  playing: boolean,
): boolean {
  if (!Number.isFinite(currentTime) || currentTime < 0) return false;
  if (clock.lastMediaTime != null && playing) {
    clock.pendingSeconds += clampPlayedDelta(currentTime - clock.lastMediaTime);
  }
  clock.lastMediaTime = currentTime;
  return clock.pendingSeconds >= ACTIVITY_FLUSH_SECONDS;
}

/** 取出整數秒，小數留在 clock 裡，避免暫停時把不到 1 秒四捨五入成 0 或 1。 */
export function takePendingSeconds(clock: PlaybackClock): number {
  if (!Number.isFinite(clock.pendingSeconds) || clock.pendingSeconds <= 0) {
    clock.pendingSeconds = 0;
    return 0;
  }
  const whole = Math.floor(clock.pendingSeconds);
  clock.pendingSeconds -= whole;
  return whole;
}

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
  window.dispatchEvent(new CustomEvent(ACTIVITY_CHANGE_EVENT));
  for (const cb of listeners) cb();
}

export function subscribeActivity(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function createDeviceKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function finiteInt(value: unknown, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return 0;
  return Math.min(max, Math.floor(value));
}

function isGameId(value: string): value is GameKitGameId {
  return (GAME_IDS as readonly string[]).includes(value);
}

function normalizeStory(value: unknown): StoryActivity | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<StoryActivity>;
  const seconds = finiteInt(raw.seconds, MAX_DAY_SECONDS);
  const plays = finiteInt(raw.plays, MAX_COUNT);
  const completions = finiteInt(raw.completions, MAX_COUNT);
  if (seconds === 0 && plays === 0 && completions === 0) return null;
  return { seconds, plays, completions };
}

function normalizeGame(value: unknown): GameActivity | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<GameActivity>;
  const seconds = finiteInt(raw.seconds, MAX_DAY_SECONDS);
  const sessions = finiteInt(raw.sessions, MAX_COUNT);
  const clears = finiteInt(raw.clears, MAX_COUNT);
  if (seconds === 0 && sessions === 0 && clears === 0) return null;
  return { seconds, sessions, clears };
}

function normalizeDay(value: unknown): DayBucket | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<DayBucket>;
  const stories: Record<string, StoryActivity> = {};
  if (raw.stories && typeof raw.stories === "object") {
    for (const [slug, activity] of Object.entries(raw.stories)) {
      const canonical = canonicalStorySlug(slug);
      if (!SLUG_KEY.test(canonical)) continue;
      const normalized = normalizeStory(activity);
      if (!normalized) continue;
      const prev = stories[canonical];
      stories[canonical] = prev
        ? {
            seconds: Math.min(MAX_DAY_SECONDS, prev.seconds + normalized.seconds),
            plays: Math.min(MAX_COUNT, prev.plays + normalized.plays),
            completions: Math.min(MAX_COUNT, prev.completions + normalized.completions),
          }
        : normalized;
    }
  }
  const games: Partial<Record<GameKitGameId, GameActivity>> = {};
  if (raw.games && typeof raw.games === "object") {
    for (const [gameId, activity] of Object.entries(raw.games)) {
      if (!isGameId(gameId)) continue;
      const normalized = normalizeGame(activity);
      if (normalized) games[gameId] = normalized;
    }
  }
  if (Object.keys(stories).length === 0 && Object.keys(games).length === 0) {
    return null;
  }
  return {
    stories: sortRecord(stories),
    games: sortRecord(games),
  };
}

function sortRecord<T>(record: Record<string, T>): Record<string, T> {
  const sorted: Record<string, T> = {};
  for (const key of Object.keys(record).sort()) {
    const value = record[key];
    if (value !== undefined) sorted[key] = value;
  }
  return sorted;
}

function shiftLocalDays(at: number, days: number): number {
  const date = new Date(at);
  date.setDate(date.getDate() + days);
  return date.getTime();
}

function pruneActivityLog(
  log: ActivityLogV1,
  now = Date.now(),
): ActivityLogV1 {
  const cutoff = localDateKey(shiftLocalDays(now, -ACTIVITY_RETENTION_DAYS));
  const days: Record<string, DayBucket> = {};
  for (const [date, bucket] of Object.entries(log.days)) {
    if (!DATE_KEY.test(date) || date < cutoff) continue;
    days[date] = bucket;
  }
  return {
    schemaVersion: 1,
    deviceKey: log.deviceKey,
    days: sortRecord(days),
  };
}

/** 讀出並正規化。頂層格式不對、或正規化後超過大小上限，回傳 null。 */
function parseActivityLog(raw: unknown): ActivityLogV1 | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Partial<ActivityLogV1>;
  if (record.schemaVersion !== 1) return null;
  if (typeof record.deviceKey !== "string" || !DEVICE_KEY.test(record.deviceKey)) {
    return null;
  }
  if (!record.days || typeof record.days !== "object" || Array.isArray(record.days)) {
    return null;
  }
  const days: Record<string, DayBucket> = {};
  for (const [date, bucket] of Object.entries(record.days)) {
    if (!DATE_KEY.test(date)) continue;
    const normalized = normalizeDay(bucket);
    if (normalized) days[date] = normalized;
  }
  return {
    schemaVersion: 1,
    deviceKey: record.deviceKey,
    days: sortRecord(days),
  };
}

function stabilize(log: ActivityLogV1, now: number): ActivityLogV1 {
  const pruned = pruneActivityLog(log, now);
  return parseActivityLog(pruned) ?? pruned;
}

function serialize(log: ActivityLogV1): string {
  return JSON.stringify(log);
}

function persist(log: ActivityLogV1): void {
  localStorage.setItem(ACTIVITY_STORAGE_KEY, serialize(log));
  emitChange();
}

function freshLog(): ActivityLogV1 {
  const log = emptyActivityLog(createDeviceKey());
  persist(log);
  return log;
}

export function readActivityLog(now = Date.now()): ActivityLogV1 {
  if (!isClient()) return emptyActivityLog();
  const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
  let parsed: ActivityLogV1 | null = null;
  if (raw) {
    try {
      parsed = parseActivityLog(JSON.parse(raw));
    } catch {
      parsed = null;
    }
  }
  if (!parsed) return freshLog();
  const pruned = stabilize(parsed, now);
  if (serialize(pruned).length > ACTIVITY_MAX_BYTES) return freshLog();
  if (serialize(pruned) !== raw) persist(pruned);
  return pruned;
}

function writeLog(log: ActivityLogV1, now: number): ActivityLogV1 {
  const pruned = stabilize(log, now);
  if (serialize(pruned).length > ACTIVITY_MAX_BYTES) return freshLog();
  persist(pruned);
  return pruned;
}

function updateLog(
  now: number,
  change: (log: ActivityLogV1) => ActivityLogV1,
): ActivityLogV1 {
  if (!isClient()) return emptyActivityLog();
  return writeLog(change(readActivityLog(now)), now);
}

function ensureDay(log: ActivityLogV1, date: string): DayBucket {
  const existing = log.days[date];
  if (existing) return existing;
  const created: DayBucket = { stories: {}, games: {} };
  log.days[date] = created;
  return created;
}

function storySlug(slug: string): string | null {
  const canonical = canonicalStorySlug(slug);
  return SLUG_KEY.test(canonical) ? canonical : null;
}

export function addStorySeconds(
  slug: string,
  seconds: number,
  at = Date.now(),
): ActivityLogV1 {
  const whole = Math.floor(seconds);
  const key = storySlug(slug);
  if (!key || whole <= 0) return readActivityLog(at);
  return updateLog(at, (log) => {
    const day = ensureDay(log, localDateKey(at));
    const prev = day.stories[key] ?? { seconds: 0, plays: 0, completions: 0 };
    day.stories[key] = {
      ...prev,
      seconds: Math.min(MAX_DAY_SECONDS, prev.seconds + whole),
    };
    return log;
  });
}

export function recordStoryPlay(slug: string, at = Date.now()): ActivityLogV1 {
  const key = storySlug(slug);
  if (!key) return readActivityLog(at);
  return updateLog(at, (log) => {
    const day = ensureDay(log, localDateKey(at));
    const prev = day.stories[key] ?? { seconds: 0, plays: 0, completions: 0 };
    day.stories[key] = {
      ...prev,
      plays: Math.min(MAX_COUNT, prev.plays + 1),
    };
    return log;
  });
}

export function recordStoryCompletion(
  slug: string,
  at = Date.now(),
): ActivityLogV1 {
  const key = storySlug(slug);
  if (!key) return readActivityLog(at);
  return updateLog(at, (log) => {
    const day = ensureDay(log, localDateKey(at));
    const prev = day.stories[key] ?? { seconds: 0, plays: 0, completions: 0 };
    day.stories[key] = {
      ...prev,
      completions: Math.min(MAX_COUNT, prev.completions + 1),
    };
    return log;
  });
}

export function addGameSeconds(
  gameId: GameKitGameId,
  seconds: number,
  at = Date.now(),
): ActivityLogV1 {
  const whole = Math.floor(seconds);
  if (!isGameId(gameId) || whole <= 0) return readActivityLog(at);
  return updateLog(at, (log) => {
    const day = ensureDay(log, localDateKey(at));
    const prev = day.games[gameId] ?? { seconds: 0, sessions: 0, clears: 0 };
    day.games[gameId] = {
      ...prev,
      seconds: Math.min(MAX_DAY_SECONDS, prev.seconds + whole),
    };
    return log;
  });
}

export function recordGameSession(
  gameId: GameKitGameId,
  cleared: boolean,
  at = Date.now(),
): ActivityLogV1 {
  if (!isGameId(gameId)) return readActivityLog(at);
  return updateLog(at, (log) => {
    const day = ensureDay(log, localDateKey(at));
    const prev = day.games[gameId] ?? { seconds: 0, sessions: 0, clears: 0 };
    day.games[gameId] = {
      sessions: Math.min(MAX_COUNT, prev.sessions + 1),
      clears: Math.min(MAX_COUNT, prev.clears + (cleared ? 1 : 0)),
      seconds: prev.seconds,
    };
    return log;
  });
}

/** 清掉每天的收聽與遊戲時間，但保留 deviceKey，之後同步才不會被當成新裝置。 */
export function clearActivityLog(): ActivityLogV1 {
  if (!isClient()) return emptyActivityLog();
  const current = readActivityLog();
  return writeLog(emptyActivityLog(current.deviceKey || createDeviceKey()), Date.now());
}

function mergeCount(left: number, right: number, sameDevice: boolean, max: number): number {
  const value = sameDevice ? Math.max(left, right) : left + right;
  return Math.min(max, value);
}

function mergeStory(
  left: StoryActivity | undefined,
  right: StoryActivity | undefined,
  sameDevice: boolean,
): StoryActivity | null {
  if (!left && !right) return null;
  const merged = {
    seconds: mergeCount(left?.seconds ?? 0, right?.seconds ?? 0, sameDevice, MAX_DAY_SECONDS),
    plays: mergeCount(left?.plays ?? 0, right?.plays ?? 0, sameDevice, MAX_COUNT),
    completions: mergeCount(
      left?.completions ?? 0,
      right?.completions ?? 0,
      sameDevice,
      MAX_COUNT,
    ),
  };
  if (merged.seconds === 0 && merged.plays === 0 && merged.completions === 0) return null;
  return merged;
}

function mergeGame(
  left: GameActivity | undefined,
  right: GameActivity | undefined,
  sameDevice: boolean,
): GameActivity | null {
  if (!left && !right) return null;
  const merged = {
    seconds: mergeCount(left?.seconds ?? 0, right?.seconds ?? 0, sameDevice, MAX_DAY_SECONDS),
    sessions: mergeCount(left?.sessions ?? 0, right?.sessions ?? 0, sameDevice, MAX_COUNT),
    clears: mergeCount(left?.clears ?? 0, right?.clears ?? 0, sameDevice, MAX_COUNT),
  };
  if (merged.seconds === 0 && merged.sessions === 0 && merged.clears === 0) return null;
  return merged;
}

function mergeDay(
  left: DayBucket | undefined,
  right: DayBucket | undefined,
  sameDevice: boolean,
): DayBucket | null {
  const stories: Record<string, StoryActivity> = {};
  const storySlugs = new Set([
    ...Object.keys(left?.stories ?? {}),
    ...Object.keys(right?.stories ?? {}),
  ]);
  for (const slug of storySlugs) {
    const merged = mergeStory(left?.stories[slug], right?.stories[slug], sameDevice);
    if (merged) stories[slug] = merged;
  }
  const games: Partial<Record<GameKitGameId, GameActivity>> = {};
  for (const gameId of GAME_IDS) {
    const merged = mergeGame(left?.games[gameId], right?.games[gameId], sameDevice);
    if (merged) games[gameId] = merged;
  }
  if (Object.keys(stories).length === 0 && Object.keys(games).length === 0) return null;
  return { stories: sortRecord(stories), games: sortRecord(games) };
}

/**
 * 同一台裝置取各欄位較大值，重複合併結果不變。
 * 不同裝置改為相加。這是之後上雲用的純函式，這一輪不接網路。
 * 跨裝置的結果使用合併後的 deviceKey，不要把它寫回其中一台裝置再合併一次。
 */
export function mergeActivityLogs(
  left: ActivityLogV1,
  right: ActivityLogV1,
): ActivityLogV1 {
  const sameDevice = left.deviceKey !== "" && left.deviceKey === right.deviceKey;
  const days: Record<string, DayBucket> = {};
  const dates = new Set([...Object.keys(left.days), ...Object.keys(right.days)]);
  for (const date of dates) {
    if (!DATE_KEY.test(date)) continue;
    const bucket = mergeDay(left.days[date], right.days[date], sameDevice);
    if (bucket) days[date] = bucket;
  }
  const deviceKey = sameDevice
    ? left.deviceKey
    : [left.deviceKey, right.deviceKey].sort().join("+");
  return {
    schemaVersion: 1,
    deviceKey,
    days: sortRecord(days),
  };
}
