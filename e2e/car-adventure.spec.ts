import { expect, test } from "@playwright/test";

test.describe("車車大冒險 Phase 2/3 冒煙", () => {
  test("關卡選單包含 8 關，能切換到月光終點", async ({ page }) => {
    await page.goto("/games/car-adventure");
    const options = page.getByRole("option");
    await expect(options).toHaveCount(8);
    await expect(options.nth(7)).toContainText("月光終點");
    await options.nth(7).click();
    await expect(options.nth(7)).toHaveAttribute("aria-selected", "true");
  });

  test("debug 完成最後一關會顯示通關並保存 adventureStars", async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto("/games/car-adventure?debugFinish=1");
    await page.getByRole("option").nth(7).click();
    await page.getByRole("button", { name: /開始冒險/ }).click();

    await expect(
      page.getByRole("heading", { name: "全關卡通關！" }),
    ).toBeVisible({ timeout: 10_000 });
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const raw = localStorage.getItem("cheche:progress");
            if (!raw) return null;
            return JSON.parse(raw).gameProfile?.adventureStars?.[7] ?? null;
          }),
        { timeout: 5_000 },
      )
      .toBe(3);
  });

  test("不跳躍掉落後可按再玩一次重試", async ({ page }) => {
    test.setTimeout(45_000);
    await page.goto("/games/car-adventure");
    await page.getByRole("button", { name: /開始冒險/ }).click();

    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(13_000);
    await page.keyboard.up("ArrowRight");
    await expect(
      page.getByRole("heading", { name: "再試一次吧" }),
    ).toBeVisible({ timeout: 5_000 });

    await page.getByRole("button", { name: /再玩一次/ }).click();
    await expect(page.getByTestId("car-adventure-menu")).toHaveCount(0);
  });

  test("粗指標可使用衝刺鍵，且遊戲迴圈維持可量測幀率", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/games/car-adventure");
    await page.getByRole("button", { name: /開始冒險/ }).click();
    const dash = page.getByRole("button", { name: "衝刺" });
    await expect(dash).toBeVisible();
    await dash.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch" });
    await page.waitForTimeout(120);
    await dash.dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch" });

    const frames = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let count = 0;
          const start = performance.now();
          const tick = (now: number) => {
            count += 1;
            if (now - start >= 500) resolve(count);
            else requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }),
    );
    // 500ms 至少 20 幀是低門檻 proxy；粒子池上限另由 Vitest 鎖定。
    expect(frames).toBeGreaterThanOrEqual(20);
  });
});
