import { GAMES, type GameType } from "@/data/games";
import { getStories, getStory, storiesByNewest, type Story } from "@/data/content";
import {
  emptyActivityLog,
  localDateKey,
  type ActivityLogV1,
} from "@/lib/activity-log";
import { medalCount } from "@/lib/gamekit/progress/meta";
import { stickerLabel } from "@/lib/gamekit/progress/stickers";
import type { GameKitGameId } from "@/lib/gamekit/types";
import type { ContinueState, ProgressStore } from "@/lib/progress-store";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"] as const;

type ParentGameRow = {
  gameId: GameKitGameId;
  title: string;
  /** 玩法類型：畫面用 GamePlayIcon 顯示，和遊樂園卡片同一組黏土圖示。 */
  gameType: GameType | null;
  played: boolean;
  bestScore: number | null;
  medalStars: number;
  levelsWithMedals: number;
  weekSeconds: number;
  weekSessions: number;
};

export type ParentStoryRow = {
  slug: string;
  title: string;
  ep: number;
  href: string;
  reason: "continue" | "favorite" | "completed" | "reflection";
};

export type StoryProgressStatus = "completed" | "in-progress" | "not-started";

export type StoryProgressRow = {
  slug: string;
  title: string;
  ep: number;
  href: string;
  status: StoryProgressStatus;
  plays: number;
  lastDate: string | null;
};

type WeeklyDay = {
  date: string;
  weekday: string;
  label: string;
  storySeconds: number;
  gameSeconds: number;
};

export type WeeklySummary = {
  days: WeeklyDay[];
  storySeconds: number;
  gameSeconds: number;
  storiesTouched: number;
  activeDays: number;
};

export type ParentDashboardSnapshot = {
  gamesPlayedCount: number;
  totalMedalStars: number;
  profileStars: number;
  stickerCount: number;
  stickerLabels: string[];
  games: ParentGameRow[];
  recentStories: ParentStoryRow[];
  recommendedStories: Story[];
  storyProgress: StoryProgressRow[];
  weekly: WeeklySummary;
  reflectionSlugs: string[];
  favoritesCount: number;
  completedCount: number;
  continueListening: ContinueState | null;
  kidsMode: boolean;
  sfxEnabled: boolean;
};

function gameMeta(gameId: GameKitGameId) {
  return GAMES.find((g) => g.slug === gameId);
}

function countMedalStars(
  medals: Partial<Record<GameKitGameId, number[]>>,
): number {
  let total = 0;
  for (const levelFlags of Object.values(medals)) {
    if (!levelFlags) continue;
    for (const flags of levelFlags) {
      total += medalCount(flags);
    }
  }
  return total;
}

function shiftLocalDays(at: number, days: number): number {
  const date = new Date(at);
  date.setDate(date.getDate() + days);
  return date.getTime();
}

/** 含今天在內的 7 個本地日期，舊的在前。 */
function weekDateKeys(today: number): string[] {
  const keys: string[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    keys.push(localDateKey(shiftLocalDays(today, -offset)));
  }
  return keys;
}

export function formatActivityDate(dateKey: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return dateKey;
  return `${Number(match[2])}月${Number(match[3])}日`;
}

export function formatDurationLabel(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0 分鐘";
  const minutes = Math.round(seconds / 60);
  if (minutes <= 0) return "不到 1 分鐘";
  return `${minutes} 分鐘`;
}

function dayHasActivity(bucket: ActivityLogV1["days"][string] | undefined): boolean {
  if (!bucket) return false;
  for (const story of Object.values(bucket.stories)) {
    if (story.seconds > 0 || story.plays > 0 || story.completions > 0) return true;
  }
  for (const game of Object.values(bucket.games)) {
    if (!game) continue;
    if (game.seconds > 0 || game.sessions > 0 || game.clears > 0) return true;
  }
  return false;
}

export function buildWeeklySummary(
  log: ActivityLogV1,
  today = Date.now(),
): WeeklySummary {
  const touched = new Set<string>();
  let storySeconds = 0;
  let gameSeconds = 0;
  let activeDays = 0;
  const days = weekDateKeys(today).map((date) => {
    const bucket = log.days[date];
    let dayStory = 0;
    let dayGame = 0;
    if (bucket) {
      for (const [slug, story] of Object.entries(bucket.stories)) {
        dayStory += story.seconds;
        if (story.seconds > 0 || story.plays > 0 || story.completions > 0) {
          touched.add(slug);
        }
      }
      for (const game of Object.values(bucket.games)) {
        if (game) dayGame += game.seconds;
      }
    }
    if (dayHasActivity(bucket)) activeDays += 1;
    storySeconds += dayStory;
    gameSeconds += dayGame;
    const [year, month, dayOfMonth] = date.split("-").map(Number);
    const at = new Date(year ?? 0, (month ?? 1) - 1, dayOfMonth ?? 1, 12);
    return {
      date,
      weekday: WEEKDAYS[at.getDay()] ?? "",
      label: formatActivityDate(date),
      storySeconds: dayStory,
      gameSeconds: dayGame,
    };
  });
  return {
    days,
    storySeconds,
    gameSeconds,
    storiesTouched: touched.size,
    activeDays,
  };
}

export function formatWeeklySummaryLine(summary: WeeklySummary): string {
  if (summary.storySeconds <= 0 && summary.gameSeconds <= 0) {
    return "這週還沒有收聽或遊戲紀錄。";
  }
  if (summary.storySeconds <= 0) {
    return `這週還沒有收聽，遊戲 ${formatDurationLabel(summary.gameSeconds)}。`;
  }
  const game =
    summary.gameSeconds > 0
      ? `，遊戲 ${formatDurationLabel(summary.gameSeconds)}`
      : "";
  return `這週聽了 ${summary.storiesTouched} 集、共 ${formatDurationLabel(summary.storySeconds)}${game}。`;
}

function storyTotals(log: ActivityLogV1, slug: string) {
  let plays = 0;
  let seconds = 0;
  let completions = 0;
  let lastDate: string | null = null;
  for (const [date, bucket] of Object.entries(log.days)) {
    const row = bucket.stories[slug];
    if (!row) continue;
    plays += row.plays;
    seconds += row.seconds;
    completions += row.completions;
    if (
      (row.seconds > 0 || row.plays > 0 || row.completions > 0) &&
      (lastDate == null || date > lastDate)
    ) {
      lastDate = date;
    }
  }
  return { plays, seconds, completions, lastDate };
}

function statusRank(status: StoryProgressStatus): number {
  if (status === "in-progress") return 0;
  if (status === "completed") return 1;
  return 2;
}

/** 每集聽完、聽到一半或還沒聽。播放次數與最後日期來自活動紀錄。 */
export function buildStoryProgressRows(
  progress: Pick<ProgressStore, "continue" | "engagement">,
  log: ActivityLogV1,
): StoryProgressRow[] {
  const completed = new Set(progress.engagement.storiesCompleted);
  const rows = getStories().map((story) => {
    const totals = storyTotals(log, story.slug);
    let status: StoryProgressStatus = "not-started";
    if (completed.has(story.slug) || totals.completions > 0) {
      status = "completed";
    } else if (
      progress.continue?.slug === story.slug ||
      totals.seconds > 0 ||
      totals.plays > 0
    ) {
      status = "in-progress";
    }
    return {
      slug: story.slug,
      title: story.title,
      ep: story.ep,
      href: `/story/${story.slug}`,
      status,
      plays: totals.plays,
      lastDate: totals.lastDate,
    };
  });
  rows.sort((a, b) => {
    const rank = statusRank(a.status) - statusRank(b.status);
    if (rank !== 0) return rank;
    if (a.lastDate !== b.lastDate) {
      if (a.lastDate == null) return 1;
      if (b.lastDate == null) return -1;
      return b.lastDate.localeCompare(a.lastDate);
    }
    return b.ep - a.ep;
  });
  return rows;
}

function weekGameTotals(
  log: ActivityLogV1,
  gameId: GameKitGameId,
  today: number,
): { seconds: number; sessions: number } {
  let seconds = 0;
  let sessions = 0;
  for (const date of weekDateKeys(today)) {
    const game = log.days[date]?.games[gameId];
    if (!game) continue;
    seconds += game.seconds;
    sessions += game.sessions;
  }
  return { seconds, sessions };
}

function buildGameRows(
  profile: ProgressStore["gameProfile"],
  log: ActivityLogV1,
  today: number,
): ParentGameRow[] {
  const ids: GameKitGameId[] = [
    "candy-match",
    "block-drop",
  ];
  return ids.map((gameId) => {
    const meta = gameMeta(gameId);
    const levelFlags = profile.medals[gameId] ?? [];
    let medalStars = 0;
    for (const flags of levelFlags) {
      medalStars += medalCount(flags);
    }
    const levelsWithMedals = levelFlags.filter((f) => f > 0).length;
    const best = profile.bests[gameId];
    const week = weekGameTotals(log, gameId, today);
    return {
      gameId,
      title: meta?.title ?? gameId,
      gameType: meta?.gameType ?? null,
      played: profile.gamesPlayed[gameId] === true,
      bestScore: typeof best === "number" && best > 0 ? best : null,
      medalStars,
      levelsWithMedals,
      weekSeconds: week.seconds,
      weekSessions: week.sessions,
    };
  });
}

function storyRow(
  slug: string,
  reason: ParentStoryRow["reason"],
): ParentStoryRow | null {
  const story = getStory(slug);
  if (!story) return null;
  return {
    slug: story.slug,
    title: story.title,
    ep: story.ep,
    href: `/story/${story.slug}`,
    reason,
  };
}

/** 最近收聽／收藏／聽完（去重，continue 優先）。 */
export function buildRecentStoryRows(
  progress: Pick<
    ProgressStore,
    "continue" | "favorites" | "engagement"
  >,
  limit = 5,
): ParentStoryRow[] {
  const rows: ParentStoryRow[] = [];
  const seen = new Set<string>();

  const push = (slug: string, reason: ParentStoryRow["reason"]) => {
    if (seen.has(slug)) return;
    const row = storyRow(slug, reason);
    if (!row) return;
    seen.add(slug);
    rows.push(row);
  };

  if (progress.continue?.slug) {
    push(progress.continue.slug, "continue");
  }

  for (const slug of [...progress.favorites].reverse()) {
    push(slug, "favorite");
    if (rows.length >= limit) return rows;
  }

  for (const slug of [...progress.engagement.storiesCompleted].reverse()) {
    push(slug, "completed");
    if (rows.length >= limit) return rows;
  }

  for (const slug of progress.engagement.reflectionShown) {
    push(slug, "reflection");
    if (rows.length >= limit) return rows;
  }

  return rows.slice(0, limit);
}

/** 推薦尚未標記聽完的集數（收藏優先，再依新到舊）。 */
export function recommendStoriesForParent(
  progress: Pick<ProgressStore, "favorites" | "engagement">,
  limit = 3,
): Story[] {
  const completed = new Set(progress.engagement.storiesCompleted);
  const picked: Story[] = [];
  const seen = new Set<string>();

  for (const slug of progress.favorites) {
    if (completed.has(slug) || seen.has(slug)) continue;
    const story = getStory(slug);
    if (story) {
      picked.push(story);
      seen.add(slug);
    }
    if (picked.length >= limit) return picked;
  }

  for (const story of storiesByNewest()) {
    if (completed.has(story.slug) || seen.has(story.slug)) continue;
    picked.push(story);
    seen.add(story.slug);
    if (picked.length >= limit) break;
  }

  return picked;
}

export function buildParentDashboardSnapshot(
  progress: ProgressStore,
  activity: ActivityLogV1 = emptyActivityLog(),
  today = Date.now(),
): ParentDashboardSnapshot {
  const profile = progress.gameProfile;
  const games = buildGameRows(profile, activity, today);
  const gamesPlayedCount = games.filter((g) => g.played).length;

  return {
    gamesPlayedCount,
    totalMedalStars: countMedalStars(profile.medals),
    profileStars: profile.stars,
    stickerCount: profile.stickers.length,
    stickerLabels: profile.stickers.map(stickerLabel),
    games,
    recentStories: buildRecentStoryRows(progress),
    recommendedStories: recommendStoriesForParent(progress),
    storyProgress: buildStoryProgressRows(progress, activity),
    weekly: buildWeeklySummary(activity, today),
    reflectionSlugs: progress.engagement.reflectionShown,
    favoritesCount: progress.favorites.length,
    completedCount: progress.engagement.storiesCompleted.length,
    continueListening: progress.continue,
    kidsMode: progress.preferences.gameKit.kidsMode,
    sfxEnabled: progress.sfxEnabled,
  };
}
