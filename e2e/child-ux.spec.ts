import { expect, test } from "@playwright/test";
import { expectTouchTarget } from "./touch-target";

/**
 * UX-P1-5：補齊 `/for-parents` 與播放頁的觸控回歸。
 * 進度條拇指仍屬 UX-P1-4，本檔不主張 ≥44px。
 */
const PHONE = { width: 390, height: 844 };

test.describe("UX-P1-5 親子指南與播放頁觸控", () => {
  test.use({
    viewport: PHONE,
    isMobile: true,
    hasTouch: true,
  });

  test("/for-parents 家長工具 CTA ≥44px，可開地圖與儀表板", async ({
    page,
  }) => {
    await page.goto("/for-parents");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "中文車車故事，陪孩子安心聽",
      }),
    ).toBeVisible();

    const mapCta = page.getByRole("link", { name: "開啟親子遊樂地圖 →" });
    const dashCta = page.getByRole("link", { name: "開啟家庭儀表板 →" });
    await expectTouchTarget(mapCta, "親子遊樂地圖 CTA");
    await expectTouchTarget(dashCta, "家庭儀表板 CTA");

    await mapCta.click();
    await expect(page).toHaveURL(/\/for-parents\/play-map/);

    await page.goto("/for-parents");
    await page.getByRole("link", { name: "開啟家庭儀表板 →" }).click();
    await expect(page).toHaveURL(/\/for-parents\/dashboard/);
  });

  test("播放頁關閉／播放／跳轉鍵 ≥44px", async ({ page }) => {
    await page.goto("/story/ep-3/play");
    const play = page.getByRole("button", { name: /^(播放|暫停)$/ });
    await expect(play).toBeVisible({ timeout: 10_000 });

    await expectTouchTarget(page.getByRole("link", { name: "關閉" }), "關閉");
    await expectTouchTarget(play, "播放／暫停");
    await expectTouchTarget(
      page.getByRole("button", { name: "倒退 10 秒" }),
      "倒退 10 秒",
    );
    await expectTouchTarget(
      page.getByRole("button", { name: "快進 10 秒" }),
      "快進 10 秒",
    );
    await expectTouchTarget(page.getByRole("button", { name: "停止" }), "停止");
    await expectTouchTarget(
      page.getByRole("button", { name: /字幕/ }).first(),
      "字幕",
    );
  });

  test("播放器方向鍵不攔截互動控制，頁面區域仍可跳轉", async ({ page }) => {
    await page.goto("/story/ep-3/play");
    const audio = page.locator("audio");
    await audio.evaluate((el) => {
      const media = el as HTMLAudioElement;
      media.pause();
      media.currentTime = 0;
    });

    const play = page.getByRole("button", { name: "播放", exact: true });
    await play.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => audio.evaluate((el) => (el as HTMLAudioElement).currentTime)).toBe(0);

    const close = page.getByRole("link", { name: "關閉" });
    await close.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => audio.evaluate((el) => (el as HTMLAudioElement).currentTime)).toBe(0);

    const stage = audio.locator("xpath=following-sibling::div[1]");
    await stage.click({ position: { x: 200, y: 300 }, force: true });
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => audio.evaluate((el) => (el as HTMLAudioElement).currentTime)).toBe(10);
  });

  test("睡前定時選單支援觸控尺寸、方向鍵、Esc 與提示焦點", async ({ page }) => {
    // 鎖定日間：system + UTC 睡前窗（19–06）會解析成夜晚，提示對話框不會出現。
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem(
        "cheche:progress",
        JSON.stringify({
          preferences: { theme: "light", nightPromptDismissed: false },
        }),
      );
    });
    await page.goto("/story/ep-3/play");
    const timer = page.getByRole("button", { name: "睡前定時" });
    await timer.click();
    const options = page.getByRole("menuitemradio");
    await expect(options.first()).toHaveCSS("min-height", "44px");
    await options.first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(options.nth(1)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(timer).toBeFocused();

    await timer.click();
    await options.first().click();
    const dialog = page.getByRole("dialog", { name: "夜晚模式提示" });
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(page.getByRole("button", { name: "好呀" })).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "好呀" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(timer).toBeFocused();
  });
});
