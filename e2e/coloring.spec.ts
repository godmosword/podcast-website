import { expect, test, type Page } from "@playwright/test";

/**
 * 著色本 P0 防回歸：線稿 line.png 為不透明白底 RGB，
 * 合成若非 multiply，塗色會被白底整層蓋住（2026-07 曾發生）。
 * 以像素驗證「塗了要看得到」。
 */

async function openFirstColoringPage(page: Page) {
  await page.goto("/games/coloring-book");
  await page.waitForLoadState("networkidle"); // 等 hydration，點擊才有 handler
  await page.getByRole("button", { name: "打開著色本" }).click();
  await page.getByRole("button", { name: /^著色：/ }).first().click();
  await page.waitForSelector("canvas");
  await page.waitForFunction(
    () => !document.body.textContent?.includes("載入線稿中"),
  );
}

/** 統計 display canvas 一段水平列上的紅色像素數。 */
async function countRedOnRow(page: Page, fx0: number, fx1: number, fy: number) {
  return page.evaluate(
    ([x0f, x1f, yf]) => {
      const canvas = document.querySelector("canvas");
      if (!canvas) return -1;
      const ctx = canvas.getContext("2d");
      if (!ctx) return -1;
      const y = Math.round(canvas.height * yf!);
      const x0 = Math.round(canvas.width * x0f!);
      const x1 = Math.round(canvas.width * x1f!);
      const row = ctx.getImageData(x0, y, x1 - x0, 1).data;
      let red = 0;
      for (let i = 0; i < row.length; i += 4) {
        if (row[i]! > 180 && row[i + 1]! < 140 && row[i + 2]! < 140) red += 1;
      }
      return red;
    },
    [fx0, fx1, fy],
  );
}

test.describe("coloring book", () => {
  test("蠟筆塗色在畫面上可見（multiply 合成）且可復原", async ({ page }) => {
    await openFirstColoringPage(page);

    const box = await page.locator("canvas").boundingBox();
    if (!box) throw new Error("canvas boundingBox 不存在");
    const y = box.y + box.height * 0.55;
    await page.mouse.move(box.x + box.width * 0.5, y);
    await page.mouse.down();
    for (let i = 0; i <= 10; i += 1) {
      await page.mouse.move(box.x + box.width * (0.5 + 0.012 * i), y);
    }
    await page.mouse.up();

    expect(await countRedOnRow(page, 0.5, 0.62, 0.55)).toBeGreaterThan(0);

    await page.getByRole("button", { name: "復原" }).click();
    expect(await countRedOnRow(page, 0.5, 0.62, 0.55)).toBe(0);
  });

  test("工具列具備筆刷三檔與縮放還原", async ({ page }) => {
    await openFirstColoringPage(page);
    for (const name of ["筆刷細", "筆刷中", "筆刷粗"]) {
      await expect(page.getByRole("button", { name })).toBeVisible();
    }
    await expect(page.getByRole("button", { name: "縮放還原" })).toBeDisabled();
  });
});
