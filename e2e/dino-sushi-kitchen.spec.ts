import { expect, test, type Page } from "@playwright/test";

/** 多多壽司屋廚房（2026-10-16 實玩審 批次 K）：選飯的皿、「多多吃飽了」、朋友收餐、圓蓋獎品、桌機泡泡。 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __dinoSushiSeed?: number }).__dinoSushiSeed = 7;
  });
});

async function order(page: Page, n: number) {
  const label = await page.getByRole("img", { name: new RegExp(`^第 ${n} 單`) }).getAttribute("aria-label");
  const [base, ...toppings] = label!.split("想吃：")[1]!.split("、");
  return { base: base!, toppings };
}

async function serve(page: Page, n: number, opts: { skipLast?: boolean } = {}) {
  const { base, toppings } = await order(page, n);
  await page.getByRole("button", { name: `選${base}` }).click();
  for (const t of opts.skipLast ? toppings.slice(0, -1) : toppings) await page.getByRole("button", { name: `加${t}` }).click();
  await page.getByRole("button", { name: "給多多吃" }).click();
}

async function waitServed(page: Page, n: number) {
  await expect(page.getByRole("img", { name: `吃完 ${n} 盤` })).toBeVisible();
  await expect(page.getByRole("img", { name: new RegExp(`^第 ${n + 1} 單`) })).toBeVisible();
}

for (const vp of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 430, height: 739 },
  { width: 430, height: 932 },
]) {
  test(`${vp.width}×${vp.height}：選飯的皿長高但停在「給多多吃」上緣之前`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
    const plates = await Promise.all(
      ["選握壽司", "選軍艦", "選手捲"].map(async (name) => (await page.getByRole("button", { name }).boundingBox())!),
    );
    await page.getByRole("button", { name: "選握壽司" }).click();
    const serveBtn = (await page.getByRole("button", { name: "給多多吃" }).boundingBox())!;
    for (const p of plates) {
      expect(p.height).toBeGreaterThanOrEqual(96);
      expect(p.height).toBeLessThanOrEqual(168.5);
      expect(serveBtn.y - (p.y + p.height), "皿下緣到給多多吃至少 8px").toBeGreaterThanOrEqual(7.5);
    }
  });
}

test("自由做「多多吃飽了」是實心綠鈕，跟多多的字卡長得不一樣；鍵盤按得到", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: "自由做" }).click();
  const full = page.getByRole("button", { name: "多多吃飽了" });
  await expect(full).toBeVisible();
  expect(await full.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(63, 127, 42)");
  await page.getByRole("button", { name: "選握壽司" }).click();
  await page.getByRole("group", { name: "壽司料" }).getByRole("button").first().click();
  await page.getByRole("button", { name: "給多多吃" }).click();
  const caption = page.getByTestId("dino-sushi").locator("p[data-mood]");
  await expect(caption).toBeVisible();
  expect(await caption.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe("rgb(63, 127, 42)");
  await expect(page.getByRole("img", { name: "吃完 1 盤" })).toBeVisible();
  await expect(full).toBeEnabled();
  await full.focus();
  await expect(full).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("dino-sushi-result")).toBeVisible();
});

test("做對一單：字卡下面出現點餐朋友的謝謝；只送飯不出現", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
  const game = page.getByTestId("dino-sushi");
  const thanks = game.locator("p[data-customer]");
  await serve(page, 1);
  await expect(thanks).toBeVisible();
  const [captionBox, thanksBox] = await Promise.all([
    game.locator("p[data-mood]").boundingBox(),
    thanks.boundingBox(),
  ]);
  expect(thanksBox!.y, "謝謝在多多字卡下面").toBeGreaterThan(captionBox!.y + captionBox!.height - 1);
  await waitServed(page, 1);
  await expect(thanks).toHaveCount(0);
  // 第 2 單只放飯：多多不吃，沒有謝謝
  await serve(page, 2, { skipLast: true });
  await expect(game.locator('p[data-mood="look"]')).toBeVisible();
  await expect(thanks).toHaveCount(0);
});

test("關掉「念出來」也看得到朋友的謝謝；讀屏宣告接著念謝謝", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
  await page.getByRole("button", { name: "遊戲設定" }).click();
  await page.getByRole("checkbox", { name: /念出來/ }).uncheck();
  await page.getByRole("button", { name: "完成" }).click();
  await serve(page, 1);
  const thanks = page.getByTestId("dino-sushi").locator("p[data-customer]");
  await expect(thanks).toBeVisible();
  const line = (await thanks.textContent())!;
  await expect(page.getByTestId("dino-sushi").locator('[aria-live="polite"]')).toContainText(line);
});

test("送完第 3 盤：圓蓋獎品在舞台裡彈出來、不帶「新」，播完收起；暫停時停住", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
  for (let n = 1; n <= 2; n++) {
    await serve(page, n);
    await waitServed(page, n);
  }
  await serve(page, 3);
  const pop = page.locator("[data-dome-pop]");
  await expect(pop).toBeVisible();
  const inside = await pop.evaluate((el) => {
    const stage = el.closest("section")!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { inStage: r.left >= stage.left && r.right <= stage.right && r.top >= stage.top, text: el.textContent };
  });
  expect(inside.inStage).toBe(true);
  expect(inside.text).not.toContain("新");
  await page.getByRole("button", { name: "暫停遊戲" }).click();
  await page.waitForTimeout(2500);
  await expect(pop).toBeVisible();
  await page.getByRole("button", { name: "繼續遊戲" }).click();
  await expect(pop).toHaveCount(0, { timeout: 4000 });
});

test("1280：點餐泡泡的格子跟著舞台放大（≥44px），泡泡不出舞台", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
  for (let n = 1; n <= 4; n++) {
    await serve(page, n);
    await waitServed(page, n);
  }
  const geo = await page.getByRole("img", { name: /^第 5 單/ }).evaluate((bubble) => {
    const stage = bubble.closest("section")!.getBoundingClientRect();
    const b = bubble.getBoundingClientRect();
    const cells = [...bubble.querySelector("[data-order-items]")!.children].map((c) => c.getBoundingClientRect().width);
    return { cells, inStage: b.left >= stage.left - 1 && b.right <= stage.right + 1 };
  });
  expect(geo.cells).toHaveLength(4);
  for (const w of geo.cells) expect(w).toBeGreaterThanOrEqual(44);
  expect(geo.inStage).toBe(true);
});
