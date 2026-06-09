import { test, expect } from "@playwright/test";

test("首頁 → 詳情 → 播放頁 smoke", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "車車遊樂園" })).toBeVisible();

  const firstStory = page.getByRole("link").filter({ hasText: "EP" }).first();
  await expect(firstStory).toBeVisible();
  await firstStory.click();

  await expect(page.getByRole("link", { name: "▶ 開始看故事" })).toBeVisible();
  await page.getByRole("link", { name: "▶ 開始看故事" }).click();

  await expect(page.getByRole("button", { name: "播放" })).toBeVisible();
  await expect(page.getByRole("button", { name: /字幕/ })).toBeVisible();
});

test("404 頁面", async ({ page }) => {
  await page.goto("/story/not-real-slug");
  await expect(page.getByRole("heading", { name: "這裡還沒有故事" })).toBeVisible();
  await expect(page.getByRole("link", { name: "← 回故事屋" })).toBeVisible();
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
