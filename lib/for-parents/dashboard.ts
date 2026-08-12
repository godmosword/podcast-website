import { GAMES } from "@/data/games";
import { getStory, storiesByNewest, type Story } from "@/data/content";
import { medalCount } from "@/lib/gamekit/progress/meta";
import type { GameKitGameId } from "@/lib/gamekit/types";
import type { ContinueState, ProgressStore } from "@/lib/progress-store";

type ParentGameRow = {
  gameId: GameKitGameId;
  title: string;
  emoji: string;
  played: boolean;
  bestScore: number | null;
  medalStars: number;
  levelsWithMedals: number;
};

export type ParentStoryRow = {
  slug: string;
  title: string;
  ep: number;
  href: string;
  reason: "continue" | "favorite" | "completed" | "reflection";
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
  reflectionSlugs: string[];
  favoritesCount: number;
  completedCount: number;
  continueListening: ContinueState | null;
  kidsMode: boolean;
  sfxEnabled: boolean;
};

const STICKER_LABELS: Record<string, string> = {
  "played-block-drop": "玩過繽紛樂園",
  "played-candy-match": "玩過繽紛消消樂",
  // 已退役遊戲：舊存檔仍留著這些貼紙，孩子賺到的就不收回；
  // 少了 label 會在家長儀表板上顯示成生的英文 ID。
  "played-car-adventure": "玩過車車大冒險",
  "played-candy-kart": "玩過繽紛卡丁車",
  "played-snowboard": "玩過阿蹦雪山衝刺",
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

function buildGameRows(profile: ProgressStore["gameProfile"]): ParentGameRow[] {
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
    return {
      gameId,
      title: meta?.title ?? gameId,
      emoji: meta?.emoji ?? "🎮",
      played: profile.gamesPlayed[gameId] === true,
      bestScore: typeof best === "number" && best > 0 ? best : null,
      medalStars,
      levelsWithMedals,
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
): ParentDashboardSnapshot {
  const profile = progress.gameProfile;
  const games = buildGameRows(profile);
  const gamesPlayedCount = games.filter((g) => g.played).length;

  return {
    gamesPlayedCount,
    totalMedalStars: countMedalStars(profile.medals),
    profileStars: profile.stars,
    stickerCount: profile.stickers.length,
    stickerLabels: profile.stickers.map(
      (id) => STICKER_LABELS[id] ?? id,
    ),
    games,
    recentStories: buildRecentStoryRows(progress),
    recommendedStories: recommendStoriesForParent(progress),
    reflectionSlugs: progress.engagement.reflectionShown,
    favoritesCount: progress.favorites.length,
    completedCount: progress.engagement.storiesCompleted.length,
    continueListening: progress.continue,
    kidsMode: progress.preferences.gameKit.kidsMode,
    sfxEnabled: progress.sfxEnabled,
  };
}
