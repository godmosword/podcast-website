import { expect, test, type Page } from "@playwright/test";
import { startOrangeExpress } from "./helpers/orange-express";

/**
 * localStorage 滿了（QuotaExceededError）：消消樂、小橘的結算不能變成錯誤頁或卡在局內，
 * 提示「再存一次」；焦點仍在主鈕，存得進去之後補寫同一筆、不重複發獎。
 * 壽司屋的同一件事見 dino-sushi-save-failure.spec.ts。
 */

declare global {
  interface Window {
    __storageFull?: boolean;
  }
}

const CRASH_TITLE = "這一區暫時休息中";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(key: string, value: string) {
      if (window.__storageFull) throw new DOMException("storage is full", "QuotaExceededError");
      original.call(this, key, value);
    };
  });
});

function setStorageFull(page: Page, full: boolean) {
  return page.evaluate((value) => {
    window.__storageFull = value;
  }, full);
}

function storedProfile(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("cheche:progress") ?? "{}").gameProfile ?? {});
}

test.describe("存檔滿了", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("消消樂：過關時存不進去，結算照常、焦點在下一站；再存一次補寫同一筆", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
      (window as unknown as { __candyMatchSeed: number }).__candyMatchSeed = 11;
      if (localStorage.getItem("cheche:progress")) return;
      localStorage.setItem(
        "cheche:progress",
        JSON.stringify({
          gameProfile: { version: 5, medals: {} },
          preferences: { theme: "light", gameKit: { kidsMode: true, candyMatchMode: "easy", voiceEnabled: false } },
        }),
      );
    });
    await page.goto("/games/candy-match");
    await page.getByRole("button", { name: "開始冒險" }).click();
    await page.getByRole("button", { name: /^開始：第 1 站/ }).click();
    await page.getByRole("button", { name: "開始！", exact: true }).click();
    const frozen = new Date("2026-10-16T12:00:00Z");
    await page.clock.install({ time: frozen });
    // 停在 install 之後一秒：install 後時鐘仍會走，停在同一刻偶爾會變成「倒回過去」而報錯
    await page.clock.pauseAt(new Date(frozen.getTime() + 1000));
    await setStorageFull(page, true);

    const result = page.getByTestId("candy-match-result");
    for (let move = 0; move < 25 && (await result.count()) === 0; move++) {
      await page.getByRole("button", { name: "提示", exact: true }).click({ force: true });
      const hints = await page
        .locator('[data-cell][data-hint="true"]')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-cell")));
      await page.locator(`[data-cell="${hints[0]}"]`).click({ force: true });
      await page.locator(`[data-cell="${hints[1]}"]`).click({ force: true });
      await page.clock.runFor(10000);
    }
    await expect(result).toBeVisible();
    await expect(page.getByText(CRASH_TITLE)).toHaveCount(0);

    const alert = result.getByRole("alert");
    await expect(alert).toHaveText(/這一關沒存好/);
    await expect(result.getByRole("button", { name: "下一站", exact: true }), "Enter 是下一站，不是再存一次").toBeFocused();
    expect((await storedProfile(page)).candyMatchMedals?.easy?.[0] ?? 0).toBe(0);

    await alert.getByRole("button", { name: "再存一次" }).click();
    await expect(alert, "還是滿的：提示留著").toBeVisible();

    await setStorageFull(page, false);
    await alert.getByRole("button", { name: "再存一次" }).click();
    await expect(result.getByRole("alert")).toHaveCount(0);
    const saved = await storedProfile(page);
    expect(saved.candyMatchMedals.easy[0]).toBeGreaterThan(0);
    expect(saved.stickers).toContain("played-candy-match");
  });

  test("小橘：到家時存不進去，結算照常；再存一次補寫同一筆", async ({ page }) => {
    await page.addInitScript(() => {
      window.__orangeExpress = { progress: 0.6, speed: 0 };
    });
    await page.goto("/games/orange-express");
    await startOrangeExpress(page, "慢慢看");
    await setStorageFull(page, true);
    await page.getByRole("button", { name: "開門" }).click();
    await page.getByRole("button", { name: "關門" }).click();

    await expect(page.getByRole("heading", { name: "到家了" })).toBeVisible();
    await expect(page.getByText(CRASH_TITLE)).toHaveCount(0);
    const result = page.getByTestId("orange-express-result");
    const alert = result.getByRole("alert");
    await expect(alert).toHaveText(/這一趟沒存好/);
    expect((await storedProfile(page)).medals?.["orange-express"]?.[0] ?? 0).toBe(0);

    await setStorageFull(page, false);
    await alert.getByRole("button", { name: "再存一次" }).click();
    await expect(result.getByRole("alert")).toHaveCount(0);
    const saved = await storedProfile(page);
    expect(saved.medals["orange-express"][0] & 1).toBe(1);
    expect(saved.stickers).toContain("played-orange-express");
  });
});
