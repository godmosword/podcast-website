import { expect, test } from "@playwright/test";
import { skipIntroOverlay } from "./intro-gate";

test.beforeEach(async ({ page }) => {
  await skipIntroOverlay(page);
});

test.describe("首頁每集角色看板", () => {
  test("點車車出現這一集介紹，播放留在站內", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const board = page.locator("#segment-episode-board");
    await board.scrollIntoViewIfNeeded();
    await expect(board).toBeVisible();
    await expect(page.locator("[data-active-segment='segment-episode-board']")).toBeAttached();

    const duo = board.getByRole("button", { name: /恐龍車多多/ });
    await expect(duo).toBeVisible();
    const box = await duo.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(48);
    expect(box?.height).toBeGreaterThanOrEqual(48);

    const buttons = board.locator("button");
    const count = await buttons.count();
    const boxes = [];
    for (let index = 0; index < count; index += 1) {
      const next = await buttons.nth(index).boundingBox();
      if (next) boxes.push(next);
    }
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i]!;
        const b = boxes[j]!;
        const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        const gapX = Math.max(a.x, b.x) - Math.min(a.x + a.width, b.x + b.width);
        const gapY = Math.max(a.y, b.y) - Math.min(a.y + a.height, b.y + b.height);
        const gap =
          overlapX > 0 && overlapY > 0
            ? -Math.min(overlapX, overlapY)
            : overlapX > 0
              ? gapY
              : overlapY > 0
                ? gapX
                : Math.hypot(Math.max(gapX, 0), Math.max(gapY, 0));
        expect(gap, "車車的點擊範圍至少隔 8px").toBeGreaterThanOrEqual(8);
      }
    }

    await duo.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: /糖果/ })).toBeVisible();
    const play = dialog.getByRole("link", { name: "播放這一集" });
    await expect(play).toHaveAttribute("href", "/story/ep-35/play");
    await expect(dialog.locator("a[href^='http']")).toHaveCount(0);
    const playBox = await play.boundingBox();
    expect(playBox?.height).toBeGreaterThanOrEqual(48);

    await dialog.getByRole("button", { name: "關掉" }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("鍵盤可以選車，減少動態時停在畫面上", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const board = page.locator("#segment-episode-board");
    await board.scrollIntoViewIfNeeded();
    await expect(board).toHaveAttribute("data-motion", "reduced");
    await expect(board.locator("canvas")).toHaveAttribute("data-ready", "true");

    const first = board.getByRole("button", { name: /恐龍車多多/ });
    await first.focus();
    await page.keyboard.press("ArrowRight");
    await expect(board.getByRole("button", { name: /小紅賽車/ })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("離開畫面後動畫暫停", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const board = page.locator("#segment-episode-board");
    await expect(board).toHaveAttribute("data-paused", "true");
    await board.scrollIntoViewIfNeeded();
    await expect(board).toHaveAttribute("data-paused", "false");
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(board).toHaveAttribute("data-paused", "true");
  });
});
