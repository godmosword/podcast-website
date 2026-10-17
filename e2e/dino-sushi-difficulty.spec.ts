import { expect, test, type Page } from "@playwright/test";

/** 多多壽司屋難度自動調整：檔位只在記憶體，起始檔看存檔星星，一輪結束依一次做對幾單升降。 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __dinoSushiSeed?: number }).__dinoSushiSeed = 7;
  });
  await page.setViewportSize({ width: 390, height: 844 });
});

async function orderToppings(page: Page, n: number): Promise<string[]> {
  const label = await page.getByRole("img", { name: new RegExp(`^第 ${n} 單`) }).getAttribute("aria-label");
  return label!.split("想吃：")[1]!.split("、").slice(1);
}

async function perfectRound(page: Page) {
  for (let n = 1; n <= 5; n++) {
    const label = await page.getByRole("img", { name: new RegExp(`^第 ${n} 單`) }).getAttribute("aria-label");
    const [base, ...toppings] = label!.split("想吃：")[1]!.split("、");
    await page.getByRole("button", { name: `選${base}` }).click();
    for (const t of toppings) await page.getByRole("button", { name: `加${t}` }).click();
    await page.getByRole("button", { name: "給多多吃" }).click();
    await expect(
      page.getByRole("img", { name: `吃完 ${n} 盤` }).or(page.getByTestId("dino-sushi-result")).first(),
    ).toBeVisible();
  }
  await expect(page.getByTestId("dino-sushi-result")).toBeVisible();
}

test("新存檔一般檔；五單都一次做對，再做一輪升進階；重新整理後 3 星直接進階", async ({ page }) => {
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
  expect(await orderToppings(page, 1)).toHaveLength(1);
  await perfectRound(page);
  await page.getByTestId("dino-sushi-result").getByRole("button", { name: "再做一輪" }).click();
  expect(await orderToppings(page, 1)).toHaveLength(2);

  await page.reload();
  await expect(page.getByRole("img", { name: "已經拿到 3 顆星，全部 3 顆" })).toBeVisible();
  await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
  expect(await orderToppings(page, 1)).toHaveLength(2);
  // 進階不出首單教學手指
  await expect(page.getByTestId("dino-sushi").locator("[data-tap-hand]")).toHaveCount(0);
});

test("自由做不受檔位影響：3 星存檔照樣沒有訂單", async ({ page }) => {
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
  await perfectRound(page);
  await page.getByTestId("dino-sushi-result").getByRole("button", { name: "回標題" }).click();
  await page.getByRole("button", { name: "自由做" }).click();
  await expect(page.getByRole("button", { name: "多多吃飽了" })).toBeVisible();
  await expect(page.getByRole("img", { name: /^第 1 單/ })).toHaveCount(0);
});

/** 進階檔第 3–5 單都是 3 樣料：矮小的畫面泡泡也要放得下（每格圖不凸出、泡泡不出舞台）。 */
for (const vp of [
  { width: 320, height: 568 },
  { width: 667, height: 375 },
  { width: 568, height: 320 },
]) {
  test(`${vp.width}×${vp.height}：進階連續三單 3 樣料，泡泡放得下`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(vp);
    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
    await perfectRound(page);
    await page.getByTestId("dino-sushi-result").getByRole("button", { name: "再做一輪" }).click();
    for (let n = 1; n <= 5; n++) {
      const bubble = page.getByRole("img", { name: new RegExp(`^第 ${n} 單`) });
      const problems = await bubble.evaluate((el) => {
        const stage = el.closest("section")!.getBoundingClientRect();
        const b = el.getBoundingClientRect();
        const out: string[] = [];
        if (b.left < stage.left - 1 || b.right > stage.right + 1 || b.top < stage.top - 1) out.push("泡泡出舞台");
        for (const cell of el.querySelector("[data-order-items]")!.children) {
          const c = cell.getBoundingClientRect();
          const i = cell.querySelector("img")!.getBoundingClientRect();
          if (i.top < c.top - 1 || i.bottom > c.bottom + 1 || i.left < c.left - 1 || i.right > c.right + 1) out.push("圖凸出格子");
          // 料圖太小（< 24px）孩子分不出小黃瓜和酪梨；手捲本來就瘦長，量格子的寬
          if (c.width < 24) out.push(`格子只有 ${Math.round(c.width)}px`);
        }
        return out;
      });
      expect(problems, `第 ${n} 單`).toEqual([]);
      if (n === 4) await bubble.screenshot({ path: info.outputPath(`advanced-${vp.width}x${vp.height}.png`) });
      if (n < 5) {
        const label = await bubble.getAttribute("aria-label");
        const [base, ...toppings] = label!.split("想吃：")[1]!.split("、");
        expect(toppings.length).toBe(n <= 2 ? 2 : 3);
        await page.getByRole("button", { name: `選${base}` }).click();
        for (const t of toppings) await page.getByRole("button", { name: `加${t}` }).click();
        await page.getByRole("button", { name: "給多多吃" }).click();
        await expect(page.getByRole("img", { name: `吃完 ${n} 盤` })).toBeVisible();
      }
    }
  });
}
