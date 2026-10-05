import { describe, expect, it } from "vitest";
import { emptyActivityLog, localDateKey, type ActivityLogV1 } from "@/lib/activity-log";
import { DEFAULT_PROGRESS } from "@/lib/progress-store";
import {
  buildParentDashboardSnapshot,
  buildRecentStoryRows,
  buildStoryProgressRows,
  buildWeeklySummary,
  formatWeeklySummaryLine,
  recommendStoriesForParent,
} from "./dashboard";

const TODAY = new Date(2026, 9, 5, 12, 0, 0).getTime();

function activityWithToday(): ActivityLogV1 {
  return {
    ...emptyActivityLog("device-test-1111"),
    days: {
      [localDateKey(TODAY)]: {
        stories: {
          "ep-15": { seconds: 2520, plays: 2, completions: 1 },
        },
        games: {
          "candy-match": { seconds: 600, sessions: 3, clears: 1 },
        },
      },
    },
  };
}

describe("buildParentDashboardSnapshot", () => {
  it("彙整遊戲、收聽與偏好為家長儀表板快照", () => {
    const progress = {
      ...DEFAULT_PROGRESS,
      favorites: ["ep-16"],
      continue: {
        slug: "ep-15",
        page: 2,
        time: 30,
        updatedAt: Date.now(),
      },
      gameProfile: {
        ...DEFAULT_PROGRESS.gameProfile,
        stars: 4,
        gamesPlayed: { "block-drop": true },
        bests: { "block-drop": 1200 },
        medals: { "block-drop": [7, 3] },
        stickers: ["played-block-drop"],
      },
      engagement: {
        storiesCompleted: ["ep-14"],
        reflectionShown: ["ep-9"],
        platformClicks: {},
      },
    };

    const snap = buildParentDashboardSnapshot(progress);

    expect(snap.gamesPlayedCount).toBe(1);
    expect(snap.totalMedalStars).toBe(5);
    expect(snap.profileStars).toBe(4);
    expect(snap.stickerLabels).toContain("玩過方塊轉轉");
    expect(snap.games.find((g) => g.gameId === "block-drop")?.played).toBe(
      true,
    );
    expect(snap.recentStories[0]?.slug).toBe("ep-15");
    expect(snap.recommendedStories.length).toBeGreaterThan(0);
    expect(snap.reflectionSlugs).toContain("ep-9");
  });
});

describe("buildRecentStoryRows", () => {
  it("continue 優先於收藏與聽完", () => {
    const rows = buildRecentStoryRows({
      continue: {
        slug: "ep-16",
        page: 1,
        time: 0,
        updatedAt: 1,
      },
      favorites: ["ep-15"],
      engagement: {
        storiesCompleted: ["ep-14"],
        reflectionShown: [],
        platformClicks: {},
      },
    });

    expect(rows[0]?.slug).toBe("ep-16");
    expect(rows.some((r) => r.slug === "ep-15")).toBe(true);
  });
});

describe("recommendStoriesForParent", () => {
  it("跳過已聽完，優先推薦收藏中未完成的集", () => {
    const picks = recommendStoriesForParent({
      favorites: ["ep-16"],
      engagement: {
        storiesCompleted: ["ep-16"],
        reflectionShown: [],
        platformClicks: {},
      },
    });

    expect(picks.every((s) => s.slug !== "ep-16")).toBe(true);
    expect(picks.length).toBeGreaterThan(0);
  });
});

describe("buildWeeklySummary", () => {
  it("彙整近 7 天的收聽與遊戲時間", () => {
    const summary = buildWeeklySummary(activityWithToday(), TODAY);

    expect(summary.days).toHaveLength(7);
    expect(summary.days[6]?.date).toBe(localDateKey(TODAY));
    expect(summary.days[6]?.weekday).toBe("一");
    expect(summary.storiesTouched).toBe(1);
    expect(summary.storySeconds).toBe(2520);
    expect(summary.gameSeconds).toBe(600);
    expect(summary.activeDays).toBe(1);
    expect(formatWeeklySummaryLine(summary)).toBe(
      "這週聽了 1 集、共 42 分鐘，遊戲 10 分鐘。",
    );
    expect(formatWeeklySummaryLine(buildWeeklySummary(emptyActivityLog(), TODAY))).toBe(
      "這週還沒有收聽或遊戲紀錄。",
    );
  });
});

describe("buildStoryProgressRows", () => {
  it("完播、續播與還沒聽分成三種狀態，進行中排在前面", () => {
    const rows = buildStoryProgressRows(
      {
        continue: {
          slug: "ep-16",
          page: 1,
          time: 12,
          updatedAt: 1,
        },
        engagement: {
          storiesCompleted: [],
          reflectionShown: [],
          platformClicks: {},
        },
      },
      activityWithToday(),
    );
    const ep15 = rows.find((row) => row.slug === "ep-15");
    const ep16 = rows.find((row) => row.slug === "ep-16");
    const untouched = rows.find((row) => row.slug === "ep-1");

    expect(ep15).toMatchObject({
      status: "completed",
      plays: 2,
      lastDate: localDateKey(TODAY),
    });
    expect(ep16?.status).toBe("in-progress");
    expect(untouched?.status).toBe("not-started");
    expect(rows.findIndex((row) => row.slug === "ep-16")).toBeLessThan(
      rows.findIndex((row) => row.slug === "ep-15"),
    );
  });
});

describe("buildParentDashboardSnapshot activity", () => {
  it("把本週遊戲時間併進遊戲列", () => {
    const snap = buildParentDashboardSnapshot(DEFAULT_PROGRESS, activityWithToday(), TODAY);
    const candy = snap.games.find((game) => game.gameId === "candy-match");
    expect(candy?.weekSeconds).toBe(600);
    expect(candy?.weekSessions).toBe(3);
    expect(snap.weekly.storiesTouched).toBe(1);
    expect(snap.storyProgress.some((row) => row.slug === "ep-15" && row.status === "completed")).toBe(true);
  });
});
