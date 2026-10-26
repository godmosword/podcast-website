import { expect, test } from "@playwright/test";

/**
 * 遊樂園卡片的玩法示範（10 月待辦 4，K-18）：進畫面播一次、三張依序（同一時間最多一段在動）、
 * 播完收掉回到封面、播放中首張的玩法鈕呼吸暫停、滑鼠停留才重播、減少動態完全不播。
 */
const SLUGS = ["coloring-book", "candy-match", "dino-sushi"] as const;

test("1280（四張同時在畫面內）：有示範的三張依序各播一次，同一時間最多一段，播完都收掉；播放中首張呼吸暫停", async ({ page }) => {
  // 桌機兩欄（#264）：視窗要夠高，四張卡同時在畫面內，才測得到「同時進畫面時依序播」
  await page.setViewportSize({ width: 1280, height: 2200 });
  await page.goto("/games");
  const seen: string[] = [];
  let maxConcurrent = 0;
  let breathPausedWhilePlaying = false;
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => {
      const playing = [...document.querySelectorAll("[data-demo]")].map(
        (el) => el.closest("a")?.getAttribute("href") ?? "",
      );
      const lead = document.querySelector('a[href="/games/coloring-book"]');
      const fab = lead?.querySelector('[class*="playFabLead"]');
      return {
        playing,
        leadPlaying: lead?.hasAttribute("data-demo-playing") ?? false,
        fabState: fab ? getComputedStyle(fab).animationPlayState : "",
      };
    });
    for (const href of state.playing) if (!seen.includes(href)) seen.push(href);
    maxConcurrent = Math.max(maxConcurrent, state.playing.length);
    if (state.leadPlaying && state.fabState === "paused") breathPausedWhilePlaying = true;
    if (seen.length === SLUGS.length && state.playing.length === 0) break;
    await page.waitForTimeout(100);
  }
  // 依卡片順序一張接一張
  expect(seen).toEqual(SLUGS.map((s) => `/games/${s}`));
  expect(maxConcurrent, "同一時間只有一段示範").toBeLessThanOrEqual(1);
  expect(breathPausedWhilePlaying, "首張播示範時呼吸暫停").toBe(true);
  await expect(page.locator("[data-demo]")).toHaveCount(0);
  await expect(page.locator("a[data-demo-playing]")).toHaveCount(0);
});

test("滑鼠停在卡上才重播；只是掃過不會播", async ({ page }) => {
  // 桌機兩欄（#264）：視窗要夠高，四張卡同時在畫面內，才測得到「同時進畫面時依序播」
  await page.setViewportSize({ width: 1280, height: 2200 });
  await page.goto("/games");
  // 等第一輪三段播完
  await expect(page.locator('a[href="/games/dino-sushi"] [data-demo]')).toHaveCount(1, { timeout: 10_000 });
  await expect(page.locator("[data-demo]")).toHaveCount(0, { timeout: 5_000 });
  // 最後一段的時段（含間隔）也放掉，之後的播放只會來自滑鼠
  await page.waitForTimeout(600);

  const card = page.locator('a[href="/games/candy-match"]');
  const box = (await card.boundingBox())!;
  // 掃過：進去馬上出來
  await page.mouse.move(box.x + box.width / 2, box.y + 40);
  await page.mouse.move(box.x + box.width / 2, box.y - 60);
  await page.waitForTimeout(400);
  await expect(page.locator("[data-demo]")).toHaveCount(0);
  // 停住
  await page.mouse.move(box.x + box.width / 2, box.y + 40);
  await expect(card.locator('[data-demo="match"]')).toHaveCount(1, { timeout: 2_000 });
});

test("減少動態：完全不播示範", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/games");
  for (const slug of SLUGS) {
    await page.locator(`a[href="/games/${slug}"]`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(1_500);
  expect(await page.evaluate(() => document.querySelectorAll("[data-demo]").length)).toBe(0);
});

test("播到一半切成減少動態：示範收掉、卡片不殘留 data-demo-playing", async ({ page }) => {
  // 桌機兩欄（#264）：視窗要夠高，四張卡同時在畫面內，才測得到「同時進畫面時依序播」
  await page.setViewportSize({ width: 1280, height: 2200 });
  await page.goto("/games");
  await expect(page.locator('a[href="/games/coloring-book"] [data-demo]')).toHaveCount(1, { timeout: 5_000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("[data-demo]")).toHaveCount(0);
  await expect(page.locator("a[data-demo-playing]")).toHaveCount(0);
});
