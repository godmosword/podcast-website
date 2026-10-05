import { expect, test } from "@playwright/test";
import { getStory } from "../data/content";
import { ACTIVITY_STORAGE_KEY, localDateKey } from "../lib/activity-log";
import { PROGRESS_STORAGE_KEY } from "../lib/progress-keys";
import { DEFAULT_PROGRESS } from "../lib/progress-store";
import { seedParentGatePassed } from "./parent-gate";

test.describe("家長儀表板活動追蹤", () => {
  test.use({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });

  test("顯示本週摘要與故事進度，清除後只拿掉活動時間", async ({ page }) => {
    const story = getStory("ep-15");
    expect(story).toBeTruthy();
    const today = localDateKey(Date.now());
    const activity = {
      schemaVersion: 1,
      deviceKey: "e2e-device-key-0001",
      days: {
        [today]: {
          stories: {
            "ep-15": { seconds: 2520, plays: 2, completions: 1 },
          },
          games: {
            "candy-match": { seconds: 600, sessions: 3, clears: 1 },
          },
        },
      },
    };
    const progress = {
      ...DEFAULT_PROGRESS,
      favorites: ["ep-15"],
    };

    await seedParentGatePassed(page);
    await page.addInitScript(
      ({ activityKey, progressKey, activityLog, progressLog }) => {
        localStorage.setItem(activityKey, JSON.stringify(activityLog));
        localStorage.setItem(progressKey, JSON.stringify(progressLog));
      },
      {
        activityKey: ACTIVITY_STORAGE_KEY,
        progressKey: PROGRESS_STORAGE_KEY,
        activityLog: activity,
        progressLog: progress,
      },
    );

    await page.goto("/for-parents/dashboard");

    await expect(page.getByRole("heading", { name: "本週摘要" })).toBeVisible();
    await expect(page.getByText("這週聽了 1 集、共 42 分鐘，遊戲 10 分鐘。")).toBeVisible();
    const progressCard = page.locator("section").filter({
      has: page.getByRole("heading", { name: "故事進度" }),
    });
    await expect(progressCard).toBeVisible();
    const storyLink = progressCard.getByRole("link", { name: /恐龍車多多洗手故事/ });
    await expect(storyLink).toContainText("聽完了");
    await expect(storyLink).toContainText("聽過 2 次");
    await expect(page.getByText("本週 10 分鐘 · 3 局")).toBeVisible();

    await page.getByRole("button", { name: "看全部" }).click();
    await expect(page.getByRole("button", { name: "收合" })).toBeVisible();

    await page.getByRole("button", { name: "清除活動紀錄" }).click();
    await page.getByRole("button", { name: "確定清除" }).click();

    await expect(page.getByText("這週還沒有收聽或遊戲紀錄。")).toBeVisible();
    await expect(page.getByText("本週 10 分鐘 · 3 局")).toHaveCount(0);
    await expect(storyLink).toContainText("還沒聽");

    const stored = await page.evaluate((key) => localStorage.getItem(key), ACTIVITY_STORAGE_KEY);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored ?? "{}") as { deviceKey?: string; days?: object };
    expect(parsed.deviceKey).toBe("e2e-device-key-0001");
    expect(parsed.days).toEqual({});

    const progressRaw = await page.evaluate(
      (key) => localStorage.getItem(key),
      PROGRESS_STORAGE_KEY,
    );
    expect(progressRaw).toContain("ep-15");
  });
});
