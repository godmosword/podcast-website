import { expect, test, type Page } from "@playwright/test";

/** localStorage 滿了（QuotaExceededError）：結算不能變成錯誤頁，這輪的成果還在，可以再存一次。 */

declare global {
  interface Window {
    __dinoSushiSeed?: number;
    __storageFull?: boolean;
  }
}

const CRASH_TITLE = "這一區暫時休息中";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__dinoSushiSeed = 7;
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

function storedDayOne(page: Page) {
  return page.evaluate(
    () => JSON.parse(localStorage.getItem("cheche:progress") ?? "{}").preferences?.gameKit?.dinoSushiDays?.[0] ?? 0,
  );
}

async function serveOrder(page: Page, n: number) {
  const label = await page.getByRole("img", { name: new RegExp(`^第 ${n} 單`) }).getAttribute("aria-label");
  const [base, ...toppings] = label!.split("想吃：")[1]!.split("、");
  await page.getByRole("button", { name: `選${base}` }).click();
  for (const topping of toppings) await page.getByRole("button", { name: `加${topping}` }).click();
  await page.getByRole("button", { name: /^(送給.+|給多多吃)$/ }).click();
  await expect(
    page.getByRole("img", { name: `吃完 ${n} 盤` }).or(page.getByTestId("dino-sushi-result")).first(),
  ).toBeVisible();
}

async function clearDayOneWithFullStorage(page: Page) {
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: /^第 1 天/ }).click();
  await setStorageFull(page, true);
  for (let n = 1; n <= 5; n++) await serveOrder(page, n);
  await expect(page.getByTestId("dino-sushi-result")).toBeVisible();
  await expect(page.getByText(CRASH_TITLE)).toHaveCount(0);
}

for (const vp of [
  { width: 390, height: 844 },
  { width: 393, height: 659 },
  { width: 320, height: 568 },
  { width: 844, height: 390 },
]) {
  test(`${vp.width}×${vp.height}：通關時存檔滿了，結算照常、提示看得到，好了之後再存一次`, async ({ page }) => {
    await page.setViewportSize(vp);
    await clearDayOneWithFullStorage(page);
    const result = page.getByTestId("dino-sushi-result");
    await expect(result.getByRole("heading", { name: "第 2 天開了！" })).toBeVisible();
    const alert = result.getByRole("alert");
    await expect(alert).toHaveText(/沒存好/);
    await expect(alert).toBeInViewport({ ratio: 1 });
    const main = result.getByRole("button", { name: "開始第 2 天" });
    await expect(main, "提示不能把主鈕擠出畫面").toBeInViewport({ ratio: 1 });
    await expect(main, "對話框一開焦點在主鈕，Enter 不會按到再存一次").toBeFocused();

    const retry = alert.getByRole("button", { name: "再存一次" });
    await retry.click();
    await expect(alert, "還是滿的：提示留著").toBeVisible();
    expect(await storedDayOne(page)).toBe(0);

    await setStorageFull(page, false);
    await retry.click();
    await expect(result.getByRole("alert")).toHaveCount(0);
    await expect.poll(() => storedDayOne(page)).toBeGreaterThan(0);
    await expect(main, "提示收掉後焦點留在對話框裡").toBeFocused();
  });
}

test("一直存不進去：還是能接著玩第 2 天，回標題第 2 天也開著", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await clearDayOneWithFullStorage(page);
  await page.getByTestId("dino-sushi-result").getByRole("button", { name: "開始第 2 天" }).click();
  await expect(page.getByRole("img", { name: /^第 1 單/ })).toBeVisible();
  await expect(page.getByText(CRASH_TITLE)).toHaveCount(0);
  await serveOrder(page, 1);
  await expect(page.getByTestId("dino-sushi").getByRole("alert")).toHaveText(/沒存好/);
});

test("通關存不進去，回標題：第 2 天還是開著", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await clearDayOneWithFullStorage(page);
  await page.getByTestId("dino-sushi-result").getByRole("button", { name: "回標題" }).click();
  const dayTwo = page.getByRole("button", { name: /^第 2 天/ });
  await expect(dayTwo).not.toHaveAttribute("aria-disabled", "true");
  await dayTwo.click();
  await expect(page.getByRole("img", { name: /^第 1 單/ })).toBeVisible();
  await expect(page.getByText(CRASH_TITLE)).toHaveCount(0);
});

test("自由做第一盤就存不進去：吃飽時結算照常，好了之後再存一次", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: "自由做" }).click();
  await setStorageFull(page, true);
  await page.getByRole("button", { name: "選握壽司" }).click();
  await page.getByRole("button", { name: /^加/ }).first().click();
  await page.getByRole("button", { name: /^(送給.+|給多多吃)$/ }).click();
  await expect(page.getByRole("img", { name: "吃完 1 盤" })).toBeVisible();
  await page.getByRole("button", { name: "多多吃飽了" }).click();
  const result = page.getByTestId("dino-sushi-result");
  await expect(result).toBeVisible();
  await expect(page.getByText(CRASH_TITLE)).toHaveCount(0);
  const alert = result.getByRole("alert");
  await expect(alert).toHaveText(/沒存好/);
  await setStorageFull(page, false);
  await alert.getByRole("button", { name: "再存一次" }).click();
  await expect(result.getByRole("alert")).toHaveCount(0);
  await expect(result.getByRole("button", { name: "再自由做" }), "提示收掉後焦點留在對話框裡").toBeFocused();
  const sessions = await page.evaluate(() => {
    const days = JSON.parse(localStorage.getItem("cheche:activity") ?? "{}").days ?? {};
    return Object.values<{ games?: Record<string, { sessions?: number }> }>(days).reduce(
      (sum, day) => sum + (day.games?.["dino-sushi"]?.sessions ?? 0),
      0,
    );
  });
  expect(sessions, "第一盤那筆「玩過」補寫進活動紀錄，只算一次").toBe(1);
});
