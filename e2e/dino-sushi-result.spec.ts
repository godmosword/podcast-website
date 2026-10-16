import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * 多多壽司屋結算與貼紙書（2026-10-16 實玩審 批次 R）。
 * 新存檔第一輪點餐會一次拿十幾張貼紙，最容易把結算撐破，所以每個測試都從新存檔玩一輪。
 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __dinoSushiSeed?: number }).__dinoSushiSeed = 7;
  });
});

/** 照第 n 單的泡泡選飯、放料、送出；skipLast 時少放最後一樣（多多不吃）。 */
async function serveOrder(page: Page, n: number, opts: { skipLast?: boolean } = {}) {
  const label = await page.getByRole("img", { name: new RegExp(`^第 ${n} 單`) }).getAttribute("aria-label");
  const [base, ...toppings] = label!.split("想吃：")[1]!.split("、");
  await page.getByRole("button", { name: `選${base}` }).click();
  const put = opts.skipLast ? toppings.slice(0, -1) : toppings;
  for (const t of put) await page.getByRole("button", { name: `加${t}` }).click();
  await page.getByRole("button", { name: "給多多吃" }).click();
  return toppings;
}

async function waitServed(page: Page, n: number) {
  await expect(
    page.getByRole("img", { name: `吃完 ${n} 盤` }).or(page.getByTestId("dino-sushi-result")).first(),
  ).toBeVisible();
}

async function finishRound(page: Page) {
  await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
  for (let n = 1; n <= 5; n++) {
    await serveOrder(page, n);
    await waitServed(page, n);
  }
  await expect(page.getByTestId("dino-sushi-result")).toBeVisible();
}

/** 等結算裡會結束的動畫都播完（迴轉帶是無限循環，不等它）。 */
async function settledResult(result: Locator) {
  await result.evaluate(async (el) => {
    await document.fonts.ready;
    const finite = el
      .getAnimations({ subtree: true })
      .filter((a) => a.effect?.getTiming().iterations !== Infinity);
    await Promise.all(finite.map((a) => a.finished.catch(() => null)));
  });
}

for (const vp of [
  { width: 390, height: 844 },
  { width: 390, height: 664 },
  { width: 430, height: 739 },
  { width: 320, height: 568 },
  { width: 1280, height: 800 },
  { width: 844, height: 390 },
  { width: 932, height: 430 },
]) {
  test(`${vp.width}×${vp.height}：首輪新貼紙不裁切，「放進貼紙書」在畫面內`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto("/games/dino-sushi");
    await finishRound(page);
    const result = page.getByTestId("dino-sushi-result");
    await expect(result.getByRole("button", { name: "放進貼紙書" })).toBeVisible();
    await settledResult(result);
    const geo = await result.evaluate((overlay) => {
      const box = overlay.getBoundingClientRect();
      const visibleBottom = Math.min(box.bottom, window.innerHeight);
      const book = [...overlay.querySelectorAll("button")]
        .find((b) => b.textContent?.includes("放進貼紙書"))!
        .getBoundingClientRect();
      const grid = overlay.querySelector("ul")!;
      const g = grid.getBoundingClientRect();
      const cells = [...grid.children].map((li) => li.getBoundingClientRect());
      return {
        bookTop: book.top - Math.max(box.top, 0),
        bookBottomRoom: visibleBottom - book.bottom,
        cellsInside: cells.every((c) => c.width > 0 && c.left >= g.left - 0.5 && c.right <= g.right + 0.5),
        sideScroll: overlay.scrollWidth - overlay.clientWidth,
      };
    });
    expect(geo.bookTop, "書鈕上緣在結算可見範圍內").toBeGreaterThanOrEqual(0);
    expect(geo.bookBottomRoom, "書鈕下緣在結算可見範圍內").toBeGreaterThanOrEqual(0);
    expect(geo.cellsInside, "每格貼紙都在格子裡，不靠橫向捲動").toBe(true);
    expect(geo.sideScroll, "結算不橫向捲動").toBeLessThanOrEqual(0);
  });
}

test("放不下的收成「+N」：露出的張數＋N＝貼紙書裡的新貼紙；點「+N」打開貼紙書", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/dino-sushi");
  // 標題頁進來就先拿到「天天來」：先開一次書看過，書裡的「新」才只剩這一輪的
  await page.getByRole("button", { name: /^貼紙書，已收集/ }).click();
  await page.getByRole("button", { name: "回去" }).click();
  await finishRound(page);
  const result = page.getByTestId("dino-sushi-result");
  const more = result.locator("[data-fresh-more]");
  await expect(more).toBeVisible();
  const n = Number((await more.textContent())!.replace("+", ""));
  const shown = await result.locator("ul > li:not(:has([data-fresh-more]))").count();
  await expect(more).toHaveAccessibleName(`還有 ${n} 張，打開貼紙書`);
  await more.click();
  const book = page.getByTestId("dino-sushi-sticker-book");
  await expect(book).toBeVisible();
  await expect(book.locator('[data-new="true"]')).toHaveCount(shown + n);
});

test("減少動態：新貼紙直接出現，不彈", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/dino-sushi");
  await finishRound(page);
  const running = await page
    .getByTestId("dino-sushi-result")
    .locator("ul > li")
    .evaluateAll((cells) => cells.flatMap((li) => li.getAnimations()).length);
  expect(running).toBe(0);
});

test("沒拿到的星星提示帶上這輪做到幾盤", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
  await serveOrder(page, 1);
  await waitServed(page, 1);
  // 第 2 單先少放一樣：多多不吃，補上那樣再送才吃
  const toppings = await serveOrder(page, 2, { skipLast: true });
  await page.getByRole("button", { name: `加${toppings.at(-1)}` }).click();
  await page.getByRole("button", { name: "給多多吃" }).click();
  await waitServed(page, 2);
  for (let n = 3; n <= 5; n++) {
    await serveOrder(page, n);
    await waitServed(page, n);
  }
  const hints = page.getByRole("list", { name: "還能多拿星星" });
  await expect(hints).toContainText("5 盤都一次做對（4/5）");
  await expect(hints).not.toContainText("3 盤一次做對");
});
