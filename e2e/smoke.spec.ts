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
  await expect(page.getByText("字幕跟讀")).toBeVisible();
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
