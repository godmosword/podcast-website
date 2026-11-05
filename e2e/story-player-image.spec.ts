import { expect, test } from "@playwright/test";

/**
 * 播放頁插圖的退回（2026-11-04）：<picture> 遇到 AVIF 404 不會自己退回 JPG，ep-33～36 因此破圖。
 * 現代格式載入失敗就改用 JPG；JPG 也失敗才說「插圖載入失敗」。
 */
test.describe("播放頁插圖退回", () => {
  // Service Worker 發的請求 page.route 攔不到。
  test.use({ serviceWorkers: "block" });

  test("AVIF 404：改用 JPG 顯示，不出現錯誤訊息", async ({ page }) => {
    await page.route("**/stories/ep-3/*.avif", (route) => route.fulfill({ status: 404, body: "" }));
    await page.goto("/story/ep-3/play");
    const image = page.locator("picture img").first();
    await expect
      .poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth), { timeout: 15_000 })
      .toBeGreaterThan(0);
    expect(await image.evaluate((el: HTMLImageElement) => el.currentSrc)).toMatch(/\.jpg/);
    await expect(page.getByText("插圖載入失敗")).toHaveCount(0);
  });

  test("JPG 也 404：才顯示插圖載入失敗", async ({ page }) => {
    await page.route("**/stories/ep-3/*.{avif,webp,jpg}", (route) => route.fulfill({ status: 404, body: "" }));
    await page.route("**/_next/image**", (route) => route.fulfill({ status: 404, body: "" }));
    await page.goto("/story/ep-3/play");
    await expect(page.getByText("插圖載入失敗")).toBeVisible({ timeout: 15_000 });
  });
});
