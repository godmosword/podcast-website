import { expect, test, type Page } from "@playwright/test";

/** 通關後接下一天、自由做第一盤才能結束（2026-11-06 PR-D1）。 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __dinoSushiSeed?: number }).__dinoSushiSeed = 7;
  });
});

async function serveOrder(page: Page, n: number) {
  const label = await page.getByRole("img", { name: new RegExp(`^第 ${n} 單`) }).getAttribute("aria-label");
  const [base, ...toppings] = label!.split("想吃：")[1]!.split("、");
  await page.getByRole("button", { name: `選${base}` }).click();
  for (const topping of toppings) await page.getByRole("button", { name: `加${topping}` }).click();
  await page.getByRole("button", { name: "給多多吃" }).click();
  await expect(
    page.getByRole("img", { name: `吃完 ${n} 盤` }).or(page.getByTestId("dino-sushi-result")).first(),
  ).toBeVisible();
}

async function playDay(page: Page) {
  for (let n = 1; n <= 5; n++) await serveOrder(page, n);
  await expect(page.getByTestId("dino-sushi-result")).toBeVisible();
}

function pinDays(page: Page, days: number[]) {
  return page.addInitScript((value) => {
    const key = "cheche:progress";
    const raw = JSON.parse(localStorage.getItem(key) ?? "{}");
    const preferences = raw.preferences ?? {};
    preferences.gameKit = { ...(preferences.gameKit ?? {}), dinoSushiDays: value };
    localStorage.setItem(key, JSON.stringify({ ...raw, preferences }));
  }, days);
}

for (const vp of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
]) {
  test(`${vp.width}×${vp.height}：第一次通關第 1 天，宣布第 2 天開了，主鈕前進、次鈕重玩都在畫面內`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: /^第 1 天/ }).click();
    await playDay(page);
    const result = page.getByTestId("dino-sushi-result");
    await expect(result.getByRole("heading", { name: "第 2 天開了！" })).toBeVisible();
    for (const name of ["開始第 2 天", "再做一輪"]) {
      const button = result.getByRole("button", { name });
      await button.scrollIntoViewIfNeeded();
      await expect(button).toBeInViewport({ ratio: 1 });
    }
    await result.getByRole("button", { name: "開始第 2 天" }).click();
    await expect(page.getByRole("img", { name: /^第 1 單/ })).toBeVisible();
    await expect(page.getByRole("img", { name: "吃完 0 盤" })).toBeAttached();
    await expect
      .poll(() =>
        page.evaluate(() => JSON.parse(localStorage.getItem("cheche:progress") ?? "{}").preferences?.gameKit?.dinoSushiDays?.[0]),
      )
      .toBeGreaterThan(0);
  });
}

test("次鈕重玩第 1 天，再通關不再宣布；主鈕仍往第 2 天走", async ({ page }) => {
  await pinDays(page, [1, 0, 0, 0, 0, 0, 0, 0]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: /^第 1 天/ }).click();
  await playDay(page);
  const result = page.getByTestId("dino-sushi-result");
  await expect(result.getByRole("heading", { name: "多多吃飽飽！" })).toBeVisible();
  await expect(result.getByRole("button", { name: "開始第 2 天" })).toBeVisible();
});

test("外框的 Enter 跟主鈕走同一天：焦點不在按鈕上時進第 2 天", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: /^第 1 天/ }).click();
  await playDay(page);
  const result = page.getByTestId("dino-sushi-result");
  await expect(result).toBeVisible();
  await page.waitForTimeout(400);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Enter");
  await expect(result).toHaveCount(0);
  await expect(page.getByRole("img", { name: /^第 1 單/ })).toBeVisible();
});

test("重玩舊的一天、下一天也通關了：主鈕維持再做一輪", async ({ page }) => {
  await pinDays(page, [1, 1, 0, 0, 0, 0, 0, 0]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: /^第 1 天/ }).click();
  await playDay(page);
  const result = page.getByTestId("dino-sushi-result");
  await expect(result.getByRole("heading", { name: "多多吃飽飽！" })).toBeVisible();
  await expect(result.getByRole("button", { name: /^開始第/ })).toHaveCount(0);
  await expect(result.getByRole("button", { name: "再做一輪" })).toBeVisible();
});

test("自由做：第一盤送出前沒有「多多吃飽了」，送一盤才出現；結算不是 0 盤", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: "自由做" }).click();
  await expect(page.getByRole("button", { name: "選軍艦" })).toBeVisible();
  const full = page.getByRole("button", { name: "多多吃飽了" });
  await expect(full).toHaveCount(0);
  await page.getByRole("button", { name: "選軍艦" }).click();
  await page.getByRole("button", { name: "給多多吃" }).click();
  await expect(page.getByRole("img", { name: "吃完 1 盤" })).toBeVisible();
  await expect(full).toBeVisible();
  await full.click();
  const result = page.getByTestId("dino-sushi-result");
  await expect(result).toBeVisible();
  await expect(result.getByRole("img", { name: "吃了 1 盤" })).toBeVisible();
});

for (const { width, height, overlap } of [
  { width: 320, height: 568, overlap: 4 },
  { width: 375, height: 553, overlap: 0 },
]) {
  test(`${width}×${height}：四格訂單放大後不壓到客人貼紙`, async ({ page }) => {
    await pinDays(page, [1, 1, 1, 0, 0, 0, 0, 0]);
    await page.setViewportSize({ width, height });
    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: /^第 4 天/ }).click();
    for (let n = 1; n <= 4; n++) await serveOrder(page, n);
    await expect(page.getByRole("img", { name: /^第 5 單/ })).toBeVisible();
    const measured = await page.evaluate(() => {
      const items = [...document.querySelectorAll("[data-order-items] > span")];
      const guest = document.querySelector('[class*="guestSticker"]')!.getBoundingClientRect();
      return { count: items.length, overlap: items.at(-1)!.getBoundingClientRect().right - guest.left };
    });
    expect(measured.count).toBe(4);
    expect(measured.overlap).toBeLessThanOrEqual(overlap);
  });
}
