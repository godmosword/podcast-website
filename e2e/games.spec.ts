import { test, expect } from "@playwright/test";

/** 走 GamePageShell 的兩款；coloring-book 用 ColoringPageShell，另行驗收。 */
const SHELL_ROUTES = [
  "candy-match",
  "block-drop",
] as const;

const PHONE = { width: 390, height: 844 };
const PHONE_LANDSCAPE = { width: 844, height: 390 };
const TABLET = { width: 768, height: 1024 };

test.describe("遊戲頁：兒童主路徑優先", () => {
  for (const slug of SHELL_ROUTES) {
    test(`${slug}：遊戲區排在家長說明之前，且首屏可見`, async ({ page }) => {
      await page.setViewportSize(PHONE);
      await page.goto(`/games/${slug}`);

      const playArea = page.locator("#game-play");
      await expect(playArea).toBeVisible();

      const box = await playArea.boundingBox();
      expect(box).not.toBeNull();
      // 量遊戲區本身的起點，而不是外層空容器被推到哪裡
      expect(box!.y).toBeLessThan(160);

      // DOM 順序：遊戲區必須在家長說明之前
      const order = await page.evaluate(() => {
        const play = document.querySelector("#game-play");
        const intro = document.querySelector("[data-game-id]");
        if (!play || !intro) return null;
        return play.compareDocumentPosition(intro) &
          Node.DOCUMENT_POSITION_FOLLOWING
          ? "intro-after-play"
          : "intro-before-play";
      });
      expect(order).toBe("intro-after-play");
    });

    test(`${slug}：整頁恰好一個 h1`, async ({ page }) => {
      await page.goto(`/games/${slug}`);
      await expect(page.locator("h1")).toHaveCount(1);
    });

    test(`${slug}：沉浸模式隱藏全站導覽，但保留返回動線`, async ({ page }) => {
      await page.setViewportSize(PHONE);
      await page.goto(`/games/${slug}`);

      // 整個 SiteNavBar 都不渲染：主列、抽屜、觸發器皆不存在；去玩 dock 全站已刪
      await expect(page.getByRole("navigation", { name: "主要分區" })).toHaveCount(0);
      await expect(page.getByRole("navigation", { name: "去玩" })).toHaveCount(0);
      await expect(page.getByRole("navigation", { name: "網站選單" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "開啟選單" })).toHaveCount(0);
      await expect(page.getByRole("link", { name: /遊樂園/ }).first()).toBeVisible();
    });
  }

  test("家長說明的 aria-labelledby 指向實際存在的標題", async ({ page }) => {
    await page.goto("/games/candy-match");
    const labelledBy = await page
      .locator("[data-game-id]")
      .getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    await expect(page.locator(`#${labelledBy}`)).toHaveCount(1);
  });

  test("操作提示留在遊戲旁，不跟著家長說明下移", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/games/candy-match");

    const hints = page.getByLabel("操作提示");
    await expect(hints).toBeVisible();

    const hintsBox = await hints.boundingBox();
    const introBox = await page.locator("[data-game-id]").boundingBox();
    expect(hintsBox!.y).toBeLessThan(introBox!.y);
  });

  test("橫向與平板下遊戲區仍在首屏", async ({ page }) => {
    for (const size of [PHONE_LANDSCAPE, TABLET]) {
      await page.setViewportSize(size);
      await page.goto("/games/candy-match");
      const box = await page.locator("#game-play").boundingBox();
      expect(box!.y).toBeLessThan(160);
    }
  });
});

test.describe("遊樂園 hub", () => {
  test("第一張遊戲卡進入首屏", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/games");

    // 抽屜連結改常駐 DOM 後，未 scope 的選擇器會先命中隱藏的 /games/coloring-book
    const firstCard = page.locator('main a[href^="/games/"]').first();
    const box = await firstCard.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeLessThan(560);
  });

  test("hub 保留全站導覽（非沉浸路由）", async ({ page }) => {
    await page.goto("/games");
    const header = page.locator("header");
    await expect(page.getByRole("navigation", { name: "主要分區" })).toHaveCount(0);
    await expect(
      header.getByRole("link", { name: "車車遊樂園", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("navigation", { name: "去玩" })).toHaveCount(0);
    const hubFeedback = page.getByRole("link", { name: "留言" });
    await expect(hubFeedback).toBeVisible();
    await expect(hubFeedback).toHaveAttribute("href", /^(mailto:|https?:)/);
    // 漢堡是家長項的唯一入口，必須可開
    const menuBtn = page.getByRole("button", { name: "開啟選單" });
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    await expect(
      page.getByRole("navigation", { name: "網站選單" }),
    ).toBeVisible();
  });

  test("每款遊戲只有一個入口（主打不重複出現）", async ({ page }) => {
    await page.goto("/games");
    const hrefs = await page
      .locator('main a[href^="/games/"]')
      .evaluateAll((nodes) =>
        nodes.map((n) => n.getAttribute("href") ?? ""),
      );
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  test("卡片直接顯示時長與有無時間壓力（家長決策資訊）", async ({ page }) => {
    await page.goto("/games");
    const firstCard = page.locator('main a[href^="/games/"]').first();
    await expect(firstCard).toContainText(/約 \d+ 分鐘/);
    await expect(firstCard).toContainText(/不趕時間|有計時/);
  });

  test("低壓進度文案可見（無存檔也不崩潰）", async ({ page }) => {
    await page.goto("/games");
    await expect(page.getByText(/收集了 \d+ 顆星星/)).toBeVisible();
    await expect(page.getByRole("list", { name: "車庫" })).toBeVisible();
  });
});
