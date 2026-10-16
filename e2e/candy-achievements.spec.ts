import { test, expect } from "@playwright/test";

async function seed(page: import("@playwright/test").Page, cleared = 0) {
  await page.addInitScript((cleared) => {
    (window as unknown as { __candyMatchSeed: number }).__candyMatchSeed = 11;
    if (localStorage.getItem("cheche:progress")) return;
    localStorage.setItem("cheche:progress", JSON.stringify({
      gameProfile: { version: 5, medals: { "candy-match": Array(cleared).fill(7) } },
      preferences: { theme: "light", gameKit: { kidsMode: true, candyMatchMode: "easy", voiceEnabled: false } },
    }));
  }, cleared);
}

test("消消樂：舊存檔與模式分流、主線與三星規則", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, 10);
  await page.goto("/games/candy-match");
  await page.getByRole("button", { name: "開始冒險" }).click();
  await expect(page.getByRole("button", { name: /^再玩一次：第 10 站/ })).toBeVisible();
  await expect(page.locator('[aria-label*="已完成"]')).toHaveCount(10);
  await page.getByRole("radio", { name: /挑戰冒險/ }).click();
  await expect(page.getByRole("button", { name: /^開始：第 1 站/ })).toBeVisible();
  await expect(page.locator('[data-locked="true"]')).toHaveCount(9);
  await expect(page.locator('[data-challenge]')).toHaveCount(0);
  await page.getByText("★ 怎麼拿三星？", { exact: true }).click();
  await expect(page.getByText("過關時剩 4 步以上")).toBeVisible();
  await expect(page.getByText(/提示不影響星星/)).toBeVisible();
  await page.screenshot({ path: info.outputPath("challenge-rules-phone.png"), fullPage: true });
  await page.reload();
  await page.getByRole("button", { name: "開始冒險" }).click();
  await expect(page.getByRole("radio", { name: /挑戰冒險/ })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: /^開始：第 1 站/ }).click();
  await expect(page.locator('[data-challenge="c1-any-92"]')).toBeVisible();
  await expect(page.getByTestId("candy-match-intro")).toBeVisible();
  await page.getByRole("button", { name: "開始！", exact: true }).click();
  await expect(page.getByTestId("candy-match-board")).toBeVisible();
  await expect(page.getByRole("button", { name: /打開朗讀|關閉朗讀/ })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("challenge-board-phone.png"), fullPage: true });
});

test("消消樂：收集飛向任務、減少動態略過飛行", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.goto("/games/candy-match");
  await page.getByRole("button", { name: "開始冒險" }).click();
  await page.getByRole("button", { name: /^開始：第 1 站/ }).click();
  await page.getByRole("button", { name: "開始！", exact: true }).click();
  await page.getByRole("button", { name: "提示", exact: true }).click();
  const hints = await page.locator('[data-cell][data-hint="true"]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-cell")));
  expect(hints).toHaveLength(2);
  const frozen = new Date("2026-10-16T12:00:00Z");
  await page.clock.install({ time: frozen });
  await page.clock.pauseAt(frozen);
  await page.locator(`[data-cell="${hints[0]}"]`).click({ force: true });
  await page.locator(`[data-cell="${hints[1]}"]`).click({ force: true });
  await page.clock.runFor(200);
  const flights = page.getByTestId("candy-collection-fx");
  await expect(flights).toHaveCount(1);
  await expect(flights.locator('[data-flight-cell]')).toHaveCount(2);
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      if ((animation.effect as KeyframeEffect | null)?.target instanceof HTMLElement &&
          ((animation.effect as KeyframeEffect).target as HTMLElement).hasAttribute("data-flight-cell")) {
        animation.pause();
        animation.currentTime = 120;
      }
    }
  });
  await page.screenshot({ path: info.outputPath("collection-flight-phone.png"), fullPage: true });
  await page.clock.runFor(10000);
  await expect(flights).toHaveCount(0);
  await expect(page.getByTestId("candy-match-board")).not.toHaveAttribute("aria-disabled", "true");
  const collected = await page.getByRole("progressbar").first().getAttribute("aria-valuenow");
  expect(Number(collected)).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "提示", exact: true }).click();
  const next = await page.locator('[data-cell][data-hint="true"]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-cell")));
  await page.locator(`[data-cell="${next[0]}"]`).click({ force: true });
  await page.locator(`[data-cell="${next[1]}"]`).click({ force: true });
  await page.clock.runFor(200);
  await expect(flights).toHaveCount(0);
  await page.clock.runFor(10000);
  expect(Number(await page.getByRole("progressbar").first().getAttribute("aria-valuenow"))).toBeGreaterThan(Number(collected));
});

test("消消樂：完整過關結算與累積獎章一致", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seed(page);
  await page.goto("/games/candy-match");
  await page.getByRole("button", { name: "開始冒險" }).click();
  await page.getByRole("button", { name: /^開始：第 1 站/ }).click();
  await page.getByRole("button", { name: "開始！", exact: true }).click();
  const frozen = new Date("2026-10-16T12:00:00Z");
  await page.clock.install({ time: frozen });
  await page.clock.pauseAt(frozen);
  const result = page.getByTestId("candy-match-result");
  for (let move = 0; move < 25 && await result.count() === 0; move++) {
    await page.getByRole("button", { name: "提示", exact: true }).click({ force: true });
    const hints = await page.locator('[data-cell][data-hint="true"]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-cell")));
    expect(hints).toHaveLength(2);
    await page.locator(`[data-cell="${hints[0]}"]`).click({ force: true });
    await page.locator(`[data-cell="${hints[1]}"]`).click({ force: true });
    await page.clock.runFor(10000);
  }
  await expect(result).toBeVisible();
  await expect(result.getByText(/^本次表現/)).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("cheche:progress") ?? "{}").gameProfile.candyMatchMedals);
  expect(saved.easy[0]).toBeGreaterThan(0);
  expect(saved.challenge).toEqual([]);
  const count = [1, 2, 4].filter((bit) => saved.easy[0] & bit).length;
  await expect(result.getByText(`新獲得 ${count} 枚獎章 · 累積 ${count}/3`)).toBeVisible();
  await expect(result.getByRole("button", { name: "下一站", exact: true })).toBeInViewport();
  await page.screenshot({ path: info.outputPath("result-phone.png"), fullPage: true });
  await result.getByRole("button", { name: "回地圖", exact: true }).click();
  await expect(page.getByRole("button", { name: /^第 1 站.*已完成/ })).toBeVisible();
  await page.screenshot({ path: info.outputPath("completed-map-phone.png"), fullPage: true });
});
