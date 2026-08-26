import { describe, expect, it } from "vitest";
import { DEFAULT_PROGRESS } from "@/lib/progress-store";
import {
  buildParentDashboardSnapshot,
  buildRecentStoryRows,
  recommendStoriesForParent,
} from "./dashboard";

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
        reflectionShown: [{ slug: "ep-9", source: "end-screen" as const }],
        platformClicks: {},
      },
    };

    const snap = buildParentDashboardSnapshot(progress);

    expect(snap.gamesPlayedCount).toBe(1);
    expect(snap.totalMedalStars).toBe(5);
    expect(snap.profileStars).toBe(4);
    expect(snap.stickerLabels).toContain("玩過繽紛樂園");
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
