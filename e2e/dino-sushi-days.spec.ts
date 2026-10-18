import { expect, test, type Page } from "@playwright/test";

/** 選天：八張臉、第 5–8 天先鎖著、每張至少 48px、間距至少 8px。 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __dinoSushiSeed?: number }).__dinoSushiSeed = 7;
  });
});

function dayButtons(page: Page) {
  return page.getByRole("button", { name: /^第 [1-8] 天/ });
}

async function expectDayTargets(page: Page) {
  const boxes = await dayButtons(page).evaluateAll((nodes) =>
    nodes.map((node) => {
      const r = node.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }),
  );
  expect(boxes).toHaveLength(8);
  for (const box of boxes) {
    expect(Math.min(box.w, box.h)).toBeGreaterThanOrEqual(48);
  }
  const rows = new Map<number, typeof boxes>();
  for (const box of boxes) {
    const key = Math.round(box.y / 8) * 8;
    rows.set(key, [...(rows.get(key) ?? []), box]);
  }
  for (const row of rows.values()) {
    const sorted = [...row].sort((a, b) => a.x - b.x);
    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i]!.x - (sorted[i - 1]!.x + sorted[i - 1]!.w);
      expect(gap).toBeGreaterThanOrEqual(8);
    }
  }
  const rowTops = [...rows.keys()].sort((a, b) => a - b);
  for (let i = 1; i < rowTops.length; i++) {
    const above = rows.get(rowTops[i - 1]!)!;
    const below = rows.get(rowTops[i]!)!;
    const gap = Math.min(...below.map((box) => box.y)) - Math.max(...above.map((box) => box.y + box.h));
    expect(gap).toBeGreaterThanOrEqual(8);
  }
}

for (const vp of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
]) {
  test(`${vp.width}×${vp.height}：八張臉至少 48px，間距至少 8px`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto("/games/dino-sushi");
    await expect(page.getByRole("heading", { name: "多多肚子餓了！" })).toBeVisible();
    await expectDayTargets(page);
  });
}

test("沒解開的天有鎖、讀屏說未解鎖，點了不會開始", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/dino-sushi");
  const open = page.getByRole("button", { name: /^第 1 天/ });
  await expect(open).not.toHaveAttribute("aria-disabled", "true");
  await expect(open.locator("[data-lock]")).toHaveCount(0);
  for (const day of [2, 3, 4, 5, 6, 7, 8]) {
    const button = page.getByRole("button", { name: new RegExp(`^第 ${day} 天`) });
    await expect(button).toHaveAttribute("aria-disabled", "true");
    await expect(button).toHaveAccessibleName(/（未解鎖）/);
    await expect(button.locator("[data-lock]")).toBeVisible();
    await button.click({ force: true });
    await expect(page.getByRole("heading", { name: "多多肚子餓了！" })).toBeVisible();
    await expect(page.getByRole("img", { name: /^第 1 單/ })).toHaveCount(0);
  }
});

test("舊檔通關可以點第 4 天，第 5–8 天仍鎖著", async ({ page }) => {
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
          gamesPlayed: {},
          bests: {},
          unlockedVehicles: ["小黃"],
        },
      }),
    );
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/dino-sushi");
  await expect(page.getByRole("button", { name: /^第 5 天/ })).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByRole("button", { name: /^第 8 天/ })).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("button", { name: /^第 4 天，多多/ }).click();
  await expect(page.getByRole("img", { name: /^第 1 單/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "選握壽司" })).toBeVisible();
  await expect(page.getByRole("button", { name: "選手捲" })).toBeVisible();
});
