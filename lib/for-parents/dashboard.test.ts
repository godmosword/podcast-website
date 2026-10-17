import { describe, expect, it } from "vitest";
import { getStories, storiesByNewest } from "@/data/content";
import { emptyActivityLog, localDateKey, type ActivityLogV1 } from "@/lib/activity-log";
import { DEFAULT_PROGRESS } from "@/lib/progress-store";
import {
  buildParentDashboardSnapshot,
  buildStoryProgressRows,
  buildWeeklySummary,
  minutesFromSeconds,
  recommendStoriesForParent,
} from "./dashboard";
import { buildNextUp } from "./dashboard-next-up";

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

const NO_ENGAGEMENT = {
  storiesCompleted: [],
  reflectionShown: [],
  platformClicks: {},
};

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
        gamesPlayed: { "candy-match": true },
        bests: { "candy-match": 1200 },
        medals: { "candy-match": [7, 3] },
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
    expect(snap.games.find((g) => g.gameId === "candy-match")?.played).toBe(
      true,
    );
    expect(snap.games.find((g) => g.gameId === "block-drop")).toBeUndefined();
    expect(snap.nextUp.primary).toMatchObject({ kind: "resume", slug: "ep-15" });
    expect(snap.recommendedStories.length).toBeGreaterThan(0);
    expect(snap.reflectionSlugs).toContain("ep-9");
  });

  it("故事進度只留聽過的集數，並給總集數", () => {
    const snap = buildParentDashboardSnapshot(
      {
        ...DEFAULT_PROGRESS,
        engagement: { ...NO_ENGAGEMENT, storiesCompleted: ["ep-3"] },
      },
      activityWithToday(),
      TODAY,
    );
    expect(snap.listenedStories.map((row) => row.slug).sort()).toEqual([
      "ep-15",
      "ep-3",
    ]);
    expect(snap.totalStories).toBe(getStories().length);
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
  it("彙整近 7 天的收聽與遊戲時間，最後一天是今天", () => {
    const summary = buildWeeklySummary(activityWithToday(), TODAY);

    expect(summary.days).toHaveLength(7);
    expect(summary.days[6]?.date).toBe(localDateKey(TODAY));
    expect(summary.days[6]?.weekday).toBe("一");
    expect(summary.days.map((day) => day.isToday)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      true,
    ]);
    expect(summary.storiesTouched).toBe(1);
    expect(summary.storySeconds).toBe(2520);
    expect(summary.gameSeconds).toBe(600);
    expect(summary.activeDays).toBe(1);
  });
});

describe("minutesFromSeconds", () => {
  it("四捨五入成分鐘；有紀錄但不到半分鐘也算 1 分鐘", () => {
    expect(minutesFromSeconds(0)).toBe(0);
    expect(minutesFromSeconds(-5)).toBe(0);
    expect(minutesFromSeconds(20)).toBe(1);
    expect(minutesFromSeconds(2520)).toBe(42);
    expect(minutesFromSeconds(Number.NaN)).toBe(0);
  });
});

describe("buildStoryProgressRows", () => {
  it("完播、續播與還沒聽分成三種狀態，進行中排在前面，標題只取主標", () => {
    const rows = buildStoryProgressRows(
      {
        continue: {
          slug: "ep-16",
          page: 1,
          time: 12,
          updatedAt: 1,
        },
        engagement: NO_ENGAGEMENT,
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
    expect(ep15?.title).not.toContain("｜");
    expect(ep16?.status).toBe("in-progress");
    expect(untouched?.status).toBe("not-started");
    expect(rows.findIndex((row) => row.slug === "ep-16")).toBeLessThan(
      rows.findIndex((row) => row.slug === "ep-15"),
    );
  });
});

describe("buildNextUp", () => {
  const newest = storiesByNewest()[0]!;

  it("有上次聽到一半的集數時，主按鈕是繼續聽（頁數從 1 算、直接進播放頁）", () => {
    const progress = {
      continue: { slug: "ep-16", page: 2, time: 30, updatedAt: 1 },
      favorites: ["ep-13"],
      engagement: NO_ENGAGEMENT,
    };
    const rows = buildStoryProgressRows(progress, emptyActivityLog());
    const nextUp = buildNextUp(progress, rows);

    expect(nextUp.firstTime).toBe(false);
    expect(nextUp.primary).toMatchObject({
      kind: "resume",
      slug: "ep-16",
      page: 3,
      href: "/story/ep-16/play",
    });
    expect(nextUp.more[0]).toMatchObject({ slug: "ep-13", reason: "favorite" });
    expect(nextUp.more.some((row) => row.slug === "ep-16")).toBe(false);
    expect(nextUp.more.length).toBeLessThanOrEqual(3);
  });

  it("存的頁數超出該集頁數（過期或損壞）就不叫繼續聽，改列在聽到一半", () => {
    const progress = {
      continue: { slug: "ep-1", page: 30, time: 0, updatedAt: 1 },
      favorites: [],
      engagement: NO_ENGAGEMENT,
    };
    const nextUp = buildNextUp(
      progress,
      buildStoryProgressRows(progress, emptyActivityLog()),
    );
    expect(nextUp.primary?.kind).not.toBe("resume");
    expect(nextUp.more.find((row) => row.slug === "ep-1")?.reason).toBe("in-progress");
  });

  it("單張封面的集數只有 1 頁，繼續聽不寫第幾頁", () => {
    const single = getStories().find((story) => story.pageCount <= 1)!;
    const progress = {
      continue: { slug: single.slug, page: 0, time: 42, updatedAt: 1 },
      favorites: [],
      engagement: NO_ENGAGEMENT,
    };
    const nextUp = buildNextUp(
      progress,
      buildStoryProgressRows(progress, emptyActivityLog()),
    );
    expect(nextUp.primary).toMatchObject({ kind: "resume", slug: single.slug, page: null });
  });

  it("聽到一半的其他集數排在收藏前面", () => {
    const progress = {
      continue: { slug: "ep-16", page: 0, time: 0, updatedAt: 1 },
      favorites: ["ep-13"],
      engagement: NO_ENGAGEMENT,
    };
    const log: ActivityLogV1 = {
      ...emptyActivityLog("device-test-2222"),
      days: {
        [localDateKey(TODAY)]: {
          stories: { "ep-21": { seconds: 300, plays: 1, completions: 0 } },
          games: {},
        },
      },
    };
    const nextUp = buildNextUp(progress, buildStoryProgressRows(progress, log));
    expect(nextUp.more.map((row) => [row.slug, row.reason]).slice(0, 2)).toEqual([
      ["ep-21", "in-progress"],
      ["ep-13", "favorite"],
    ]);
  });

  it("新裝置：主按鈕是最新一集，其他推薦不重複它", () => {
    const progress = { continue: null, favorites: [], engagement: NO_ENGAGEMENT };
    const nextUp = buildNextUp(
      progress,
      buildStoryProgressRows(progress, emptyActivityLog()),
    );

    expect(nextUp.firstTime).toBe(true);
    expect(nextUp.primary).toMatchObject({
      kind: "latest",
      slug: newest.slug,
      href: `/story/${newest.slug}`,
    });
    expect(nextUp.more.length).toBeGreaterThan(0);
    expect(nextUp.more.some((row) => row.slug === newest.slug)).toBe(false);
  });

  it("上次那集已經聽完就不叫繼續聽；最新一集也聽完時改推其他沒聽完的", () => {
    const progress = {
      continue: { slug: newest.slug, page: 5, time: 0, updatedAt: 1 },
      favorites: [],
      engagement: { ...NO_ENGAGEMENT, storiesCompleted: [newest.slug] },
    };
    const nextUp = buildNextUp(
      progress,
      buildStoryProgressRows(progress, emptyActivityLog()),
    );
    expect(nextUp.primary?.kind).toBe("recommended");
    expect(nextUp.primary?.slug).not.toBe(newest.slug);
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
