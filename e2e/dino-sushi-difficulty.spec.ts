import { expect, test, type Page } from "@playwright/test";
import { pinClassicSushiDay } from "./helpers/dino-sushi";

/** 八天開店第一階段：不再用記憶體裡的進階檔。第 4 天固定 1、1、2、2、3。 */

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
  const lengths: number[] = [];
  for (let n = 1; n <= 5; n++) {
    const label = await page.getByRole("img", { name: new RegExp(`^第 ${n} 單`) }).getAttribute("aria-label");
    const [base, ...toppings] = label!.split("想吃：")[1]!.split("、");
    lengths.push(toppings.length);
    await page.getByRole("button", { name: `選${base}` }).click();
    for (const t of toppings) await page.getByRole("button", { name: `加${t}` }).click();
    await page.getByRole("button", { name: "給多多吃" }).click();
    await expect(
      page.getByRole("img", { name: `吃完 ${n} 盤` }).or(page.getByTestId("dino-sushi-result")).first(),
    ).toBeVisible();
  }
  await expect(page.getByTestId("dino-sushi-result")).toBeVisible();
  return lengths;
}

test("新的一天從第 1 天開始：只有握壽司，料數 1、1、1、1、2，不發全站星星", async ({ page }) => {
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
  await expect(page.getByRole("button", { name: "選握壽司" })).toBeVisible();
  await expect(page.getByRole("button", { name: "選軍艦" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "選手捲" })).toHaveCount(0);
  expect(await perfectRound(page)).toEqual([1, 1, 1, 1, 2]);

  const saved = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("cheche:progress") ?? "{}");
    return {
      medals: raw.gameProfile?.medals?.["dino-sushi"] ?? null,
      days: raw.preferences?.gameKit?.dinoSushiDays ?? null,
      stars: raw.gameProfile?.stars ?? 0,
    };
  });
  expect(saved.medals).toBeNull();
  expect(saved.days[0]).toBe(7);
  expect(saved.stars).toBe(0);

  await page.getByTestId("dino-sushi-result").getByRole("button", { name: "回標題" }).click();
  await expect(page.getByRole("button", { name: /第 2 天，安安/ })).not.toHaveAttribute("aria-disabled", "true");
  await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
  expect(await orderToppings(page, 1)).toHaveLength(1);
  await expect(page.getByRole("button", { name: "選軍艦" })).toBeVisible();
  await expect(page.getByRole("button", { name: "選手捲" })).toHaveCount(0);

  await page.reload();
  await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
  expect(await orderToppings(page, 1)).toHaveLength(1);
});

test("自由做不受天數影響：沒有訂單，三種飯都在", async ({ page }) => {
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: "自由做" }).click();
  await expect(page.getByRole("button", { name: "多多吃飽了" })).toBeVisible();
  await expect(page.getByRole("button", { name: "選手捲" })).toBeVisible();
  await expect(page.getByRole("img", { name: /^第 1 單/ })).toHaveCount(0);
});

test("舊的 3 星留在第 4 天，料數仍是 1 開頭，不再出教學手指", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "cheche:progress",
      JSON.stringify({
        schemaVersion: 2,
        gameProfile: {
          version: 5,
          stars: 3,
          medals: { "dino-sushi": [7] },
          stickers: [],
          gamesPlayed: { "dino-sushi": true },
          bests: {},
          unlockedVehicles: ["小黃"],
        },
      }),
    );
  });
  await page.goto("/games/dino-sushi");
  const day4 = page.getByRole("button", { name: /^第 4 天，多多/ });
  await expect(day4).not.toHaveAttribute("aria-disabled", "true");
  await day4.click();
  expect(await orderToppings(page, 1)).toHaveLength(1);
  await expect(page.getByRole("button", { name: "選手捲" })).toBeVisible();
  await expect(page.getByTestId("dino-sushi").locator("[data-tap-hand]")).toHaveCount(0);
});

/** 第 4 天最後一單是 3 樣料：矮小的畫面泡泡也要放得下。 */
for (const vp of [
  { width: 320, height: 568 },
  { width: 667, height: 375 },
  { width: 568, height: 320 },
]) {
  test(`${vp.width}×${vp.height}：第 4 天 3 樣料的泡泡放得下`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(vp);
    await pinClassicSushiDay(page);
    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
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
          if (c.width < 24) out.push(`格子只有 ${Math.round(c.width)}px`);
        }
        return out;
      });
      expect(problems, `第 ${n} 單`).toEqual([]);
      const label = await bubble.getAttribute("aria-label");
      const [base, ...toppings] = label!.split("想吃：")[1]!.split("、");
      expect(toppings.length).toBe([1, 1, 2, 2, 3][n - 1]);
      if (n === 5) await bubble.screenshot({ path: info.outputPath(`day4-${vp.width}x${vp.height}.png`) });
      if (n < 5) {
        await page.getByRole("button", { name: `選${base}` }).click();
        for (const t of toppings) await page.getByRole("button", { name: `加${t}` }).click();
        await page.getByRole("button", { name: "給多多吃" }).click();
        await expect(page.getByRole("img", { name: `吃完 ${n} 盤` })).toBeVisible();
      }
    }
  });
}
