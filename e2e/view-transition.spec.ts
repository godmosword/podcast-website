import { test, expect } from "@playwright/test";

/**
 * D4：封面導覽 fallback／可用性（Chromium）。
 * React stable 不載入 Canary ViewTransition；這裡只驗證導覽、鍵盤與 reduced-motion。
 */
test.describe("D4 view transition navigation", () => {
  function firstStoryCard(page: import("@playwright/test").Page) {
    return page.locator('main a[href^="/story/"]').first();
  }

  test("故事列表點卡進詳情再返回", async ({ page }) => {
    await page.goto("/stories");
    const card = firstStoryCard(page);
    await expect(card).toBeVisible();
    const href = await card.getAttribute("href");
    expect(href).toMatch(/^\/story\//);

    await card.click();
    await page.waitForURL(/\/story\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.goBack();
    await page.waitForURL(/\/stories/);
    await expect(card).toBeVisible();
  });

  test("鍵盤 Enter 可從故事卡進詳情", async ({ page }) => {
    await page.goto("/stories");
    const card = firstStoryCard(page);
    const href = await card.getAttribute("href");
    await card.focus();
    await page.keyboard.press("Enter");
    await page.waitForURL(href ?? /\/story\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("prefers-reduced-motion 下導覽仍正常", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/stories");
    const card = firstStoryCard(page);
    await card.click();
    await page.waitForURL(/\/story\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
