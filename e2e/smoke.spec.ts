import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("首頁 → 詳情 → 播放頁 smoke", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "車車遊樂園" })).toBeVisible();

  const firstStory = page.getByRole("link").filter({ hasText: "EP" }).first();
  await expect(firstStory).toBeVisible();
  const firstStoryHref = await firstStory.getAttribute("href");
  expect(firstStoryHref).toBeTruthy();
  await page.goto(firstStoryHref!);

  await expect(page.getByRole("link", { name: "▶ 開始看故事" })).toBeVisible();
  const playHref = await page
    .getByRole("link", { name: "▶ 開始看故事" })
    .getAttribute("href");
  expect(playHref).toBeTruthy();
  await page.goto(playHref!);

  await expect(
    page.getByRole("button", { name: "播放", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^字幕：/ })).toBeVisible();
});

test("404 頁面", async ({ page }) => {
  const response = await page.goto("/story/not-real-slug", {
    waitUntil: "networkidle",
  });
  expect(response?.status()).toBe(404);
});

test("關於頁面", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "關於車車遊樂園" })).toBeVisible();
});

test("節目數據中心 /studio", async ({ page }) => {
  await page.goto("/studio");
  await expect(page.getByRole("heading", { name: "節目數據中心" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "平台後台捷徑" })).toBeVisible();
  await expect(page.getByRole("link", { name: "開啟後台" }).first()).toBeVisible();
});

test("首頁 Hero 不含節目數據入口", async ({ page }) => {
  await page.goto("/");
  const header = page.locator("header");
  await expect(header.getByRole("link", { name: "節目數據" })).toHaveCount(0);
});

test("繽紛卡丁車 debugFinish 會透過 Godot iframe 更新進度", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/games/candy-kart?debugFinish=macaron-meadow");
  await expect(page.getByRole("link", { name: "← 回遊樂園" })).toBeVisible();
  await expect(page.locator("iframe[title='繽紛卡丁車遊戲']")).toHaveAttribute(
    "src",
    "/candy-kart/index.html?debugFinish=macaron-meadow",
  );
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const raw = localStorage.getItem("cheche:progress");
          if (!raw) return false;
          const progress = JSON.parse(raw);
          return (
            progress.gameProfile?.gamesPlayed?.["candy-kart"] === true &&
            progress.gameProfile?.medals?.["candy-kart"]?.[0] === 7
          );
        }),
      { timeout: 30_000 },
    )
    .toBe(true);
});

test("繽紛消消樂：標題 → 地圖 → 第 1 關棋盤", async ({ page }) => {
  await page.goto("/games/candy-match");
  await expect(page.getByRole("heading", { name: "繽紛消消樂" })).toBeVisible();
  await page.getByRole("button", { name: /開始/ }).click();
  await expect(page.getByText("遊樂園地圖")).toBeVisible();
  await page.getByRole("button", { name: /第 1 關/ }).click();
  await expect(page.getByTestId("candy-match-board")).toBeVisible();
  // 任務列與道具列存在
  await expect(page.getByText(/泡泡/)).toBeVisible();
  await expect(page.getByRole("button", { name: /提示/ })).toBeVisible();
});
