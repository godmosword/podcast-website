import { expect, test } from "@playwright/test";
import { getStories } from "../data/content";
import { expectTouchTarget } from "./touch-target";

/**
 * UX-P1-5：補齊播放頁的觸控回歸（原本的 `/for-parents` 工具卡已隨頁面移除）。
 * 進度條（UX-P1-4，2026-10-26）：觸控區 44px、控制點放大，見下方「進度條」那一則。
 */
const PHONE = { width: 390, height: 844 };

test.describe("UX-P1-5 播放頁觸控", () => {
  test.use({
    viewport: PHONE,
    isMobile: true,
    hasTouch: true,
  });

  test("播放頁關閉／播放／跳轉鍵 ≥44px", async ({ page }) => {
    await page.goto("/story/ep-3/play");
    const play = page.getByRole("button", { name: /^(播放|暫停)$/ });
    await expect(play).toBeVisible({ timeout: 10_000 });

    await expectTouchTarget(page.getByRole("link", { name: "關閉" }), "關閉");
    await expectTouchTarget(play, "播放／暫停");
    await expectTouchTarget(
      page.getByRole("button", { name: "上一張插圖" }),
      "上一張插圖",
    );
    await expectTouchTarget(
      page.getByRole("button", { name: "下一張插圖" }),
      "下一張插圖",
    );
    await expectTouchTarget(page.getByRole("button", { name: "停止" }), "停止");
    await expectTouchTarget(
      page.getByRole("button", { name: /字幕/ }).first(),
      "字幕",
    );
  });

  test("進度條觸控區 ≥44px、控制點 ≥28px，控制列順序不變", async ({ page }) => {
    await page.goto("/story/ep-3/play");
    const seek = page.getByRole("slider");
    await expect(seek).toBeVisible({ timeout: 10_000 });
    const box = (await seek.boundingBox())!;
    expect(box.height, "進度條觸控區").toBeGreaterThanOrEqual(44);
    const thumb = await seek.evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue("--seek-thumb")));
    expect(thumb, "控制點直徑").toBeGreaterThanOrEqual(28);
    const order = await page.locator("button").evaluateAll((els) =>
      els
        .map((el) => el.getAttribute("aria-label") ?? el.textContent?.trim() ?? "")
        .filter((name) => ["重複播放", "上一張插圖", "播放", "暫停", "下一張插圖", "停止"].some((n) => name.startsWith(n))),
    );
    expect(order.filter((n) => !n.startsWith("重複"))).toEqual(["上一張插圖", "播放", "下一張插圖", "停止"]);
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
    await expect
      .poll(() => audio.evaluate((el) => (el as HTMLAudioElement).currentTime))
      .toBe(20);
  });

  test("快進倒退依插圖換頁，而不是跳 10 秒", async ({ page }) => {
    await page.goto("/story/ep-3/play");
    const audio = page.locator("audio");
    await audio.evaluate((el) => {
      const media = el as HTMLAudioElement;
      media.pause();
      media.currentTime = 0;
    });

    await page.getByRole("button", { name: "下一張插圖" }).click();
    await expect
      .poll(() => audio.evaluate((el) => (el as HTMLAudioElement).currentTime))
      .toBe(20);

    await page.getByRole("button", { name: "下一張插圖" }).click();
    await expect
      .poll(() => audio.evaluate((el) => (el as HTMLAudioElement).currentTime))
      .toBeCloseTo(42.4, 1);

    await page.getByRole("button", { name: "上一張插圖" }).click();
    await expect
      .poll(() => audio.evaluate((el) => (el as HTMLAudioElement).currentTime))
      .toBe(20);
  });

  test("關閉字幕後，音檔時間仍會換插圖", async ({ page }) => {
    await page.goto("/story/ep-3/play");
    await expect(
      page.getByRole("button", { name: /^(播放|暫停)$/ }),
    ).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "字幕：開" }).click();
    await expect(page.getByRole("button", { name: "字幕：關" })).toBeVisible();

    const audio = page.locator("audio");
    await audio.evaluate(async (el) => {
      const media = el as HTMLAudioElement;
      media.muted = true;
      if (media.readyState < HTMLMediaElement.HAVE_METADATA) {
        await new Promise<void>((resolve, reject) => {
          media.addEventListener("loadedmetadata", () => resolve(), { once: true });
          media.addEventListener("error", () => reject(new Error("audio error")), {
            once: true,
          });
          media.load();
        });
      }
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error("seek timeout")), 10_000);
        media.addEventListener(
          "seeked",
          () => {
            window.clearTimeout(timeout);
            resolve();
          },
          { once: true },
        );
        media.currentTime = 21;
      });
    });

    await expect
      .poll(() => page.locator('[aria-hidden="false"] img').getAttribute("alt"))
      .toMatch(/第 2 頁/);
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

/**
 * 故事頁「給爸媽：一起聊聊」的觸控目標。
 *
 * 2026-09-02 稽核實測 ShowNotes 的 `<summary>` 只有 298×24（純文字沒撐高）。
 * 這一區預設展開、整頁只出現一次；摘要列與內層的「這集可以聊什麼」都要 ≥44px。
 */
test.describe("故事頁「給爸媽」觸控目標", () => {
  const story = getStories().find((entry) => entry.parentGuide && entry.familyActivity);
  if (!story) throw new Error("需要一集同時有 parentGuide 與 familyActivity");

  for (const width of [360, 375, 390] as const) {
    test(`${width}px：「給爸媽」預設展開且只出現一次，摘要列與家長共讀指引皆 ≥44px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(`/story/${story.slug}`);

      await expect(page.getByRole("link", { name: "給爸媽：一起聊聊" })).toHaveCount(0);
      await expect(page.getByText("給爸媽：一起聊聊", { exact: true })).toHaveCount(1);

      const details = page.locator("details#co-listen");
      await expect(details).toHaveAttribute("open", "");
      const summary = details.locator("> summary");
      await details.evaluate((el) => el.scrollIntoView({ block: "start" }));
      await expectTouchTarget(summary, "「給爸媽」摘要列");
      const navBox = await page.locator("header").first().boundingBox();
      const summaryBox = await summary.boundingBox();
      expect(summaryBox!.y).toBeGreaterThanOrEqual(navBox!.y + navBox!.height - 1);

      const guide = details.locator("details > summary", { hasText: "這集可以聊什麼" });
      await expectTouchTarget(guide, "家長共讀指引");
    });
  }
});
