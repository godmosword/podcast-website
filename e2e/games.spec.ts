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
    test(`${slug}：遊戲區在首屏，且沒有家長說明`, async ({ page }) => {
      await page.setViewportSize(PHONE);
      await page.goto(`/games/${slug}`);

      const playArea = page.locator("#game-play");
      await expect(playArea).toBeVisible();

      const box = await playArea.boundingBox();
      expect(box).not.toBeNull();
      // 量遊戲區本身的起點，而不是外層空容器被推到哪裡
      expect(box!.y).toBeLessThan(160);
      await expect(page.getByTestId("game-parent-intro")).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "給家長的說明" })).toHaveCount(0);
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

  test("操作提示只在有棋盤時出現，帶文字、留在遊戲正下方", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/games/candy-match");

    // 標題頁還沒有棋盤：提示沒有對象，收起
    const hints = page.getByLabel("操作提示");
    await expect(hints).toBeHidden();

    await page.getByRole("button", { name: /開始冒險/ }).click();
    await page.locator('button[data-next="true"]').click();
    await expect(page.getByTestId("candy-match-board")).toBeVisible();

    await expect(hints).toBeVisible();
    // 圖示必須搭配可見文字；只靠 title 提示，觸控裝置看不到
    await expect(hints).toContainText("點兩格交換");
    await expect(hints).toContainText("拖曳也可以");

    const playBox = await page.locator("#game-play").boundingBox();
    const hintsBox = await hints.boundingBox();
    expect(hintsBox!.y).toBeGreaterThanOrEqual(playBox!.y + playBox!.height - 1);
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
  test("390×844 完整首圖後可捲動到三個遊戲入口", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/games");
    for (const name of ["繪本塗塗鴉", "車車消消樂", "方塊轉轉"]) {
      const title = page.getByText(name, { exact: true });
      await title.scrollIntoViewIfNeeded();
      await expect(title).toBeInViewport();
    }
  });

  test("不同寬度與視窗高度都保留首圖原始比例，角色不裁切", async ({ page }) => {
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 390, height: 700 },
      { width: 640, height: 900 },
      { width: 768, height: 1024 },
      { width: 1280, height: 720 },
      { width: 1980, height: 1440 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/games");
      const image = page.locator("main > header picture img");
      await expect(image).toBeVisible();
      await expect.poll(() => image.evaluate((el: HTMLImageElement) =>
        el.complete && el.naturalWidth > 0,
      )).toBe(true);
      const geometry = await image.evaluate((el: HTMLImageElement) => {
        const box = el.getBoundingClientRect();
        return {
          ratio: box.width / box.height,
          sourceRatio: el.naturalWidth / el.naturalHeight,
          fit: getComputedStyle(el).objectFit,
        };
      });
      expect(geometry.ratio).toBeCloseTo(geometry.sourceRatio, 2);
      expect(geometry.fit).toBe("contain");
    }
  });

  test("窄螢幕遊戲名字沒有被裁成看不見", async ({ page }) => {
    for (const width of [320, 375, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/games");
      for (const name of ["繪本塗塗鴉", "車車消消樂", "方塊轉轉"]) {
        const title = page.getByText(name, { exact: true });
        await expect(title, `${width} ${name}`).toBeVisible();
        const clipped = await title.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
        expect(clipped, `${width} ${name}`).toBe(false);
      }
    }
  });

  test("第一張遊戲卡進入首屏", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/games");

    const firstCard = page.locator('main a[href^="/games/"]').first();
    await expect(firstCard).toHaveAttribute("href", "/games/coloring-book");
    const box = await firstCard.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeLessThan(PHONE.height);
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
    await expect(hubFeedback).toHaveAttribute("href", "/feedback");
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

  /** 卡片＝圖＋名字。動作詞、年齡、時長與時間壓力都不印在卡上。 */
  test("卡片只留遊戲名稱，不顯示動作詞、年齡、時長與時間壓力", async ({ page }) => {
    await page.goto("/games");
    const cards = page.locator('main a[href^="/games/"]');
    await expect(cards).toHaveCount(3);
    for (const card of await cards.all()) {
      await expect(card).not.toContainText(/塗一塗|找一樣|排一排/);
      await expect(card).not.toContainText(/\d+–\d+ 歲/);
      await expect(card).not.toContainText(/約 \d+ 分鐘/);
      await expect(card).not.toContainText(/不趕時間|有計時/);
    }
    // 玩法 play 鈕 ≥ 52px（下一步按哪裡）
    const fab = cards.first().locator('[class*="playFab"]').first();
    const box = await fab.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(52);
  });

  test("hub 只留三張遊戲卡，不顯示車庫進度", async ({ page }) => {
    await page.goto("/games");
    await expect(page.getByRole("heading", { name: "園裡的站" })).toHaveCount(0);
    await expect(page.getByText(/收集了 \d+ 顆星星/)).toHaveCount(0);
    await expect(page.getByRole("list", { name: "車庫" })).toHaveCount(0);
    await expect(page.getByRole("list", { name: "小遊戲" })).toBeVisible();
    await expect(page.locator('main a[href^="/games/"]')).toHaveCount(3);
  });
});

/** G-M7（翻 D5-A）：著色本改走同款 sticky 抬頭——隱藏全站導覽、恰好一個 h1、三個階段都只有「回遊樂園」一個出口。 */
test.describe("繪本塗塗鴉：與遊戲頁同款抬頭", () => {
  test("隱藏全站導覽、一個 h1、三階段皆有回遊樂園、無回封面", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/games/coloring-book");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("navigation", { name: "主要分區" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "開啟選單" })).toHaveCount(0);

    const check = async () => {
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.getByRole("link", { name: /回遊樂園/ })).toBeVisible();
      await expect(page.getByRole("button", { name: "回封面" })).toHaveCount(0);
    };
    await check();
    await page.getByRole("button", { name: "開始塗", exact: true }).click();
    await check();
    await page.getByRole("button", { name: /^著色：/ }).first().click();
    await page.waitForSelector("canvas");
    await check();
    // 往下捲後抬頭仍在（sticky），出口不消失
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(200);
    const back = await page.getByRole("link", { name: /回遊樂園/ }).boundingBox();
    expect(back!.y).toBeGreaterThanOrEqual(0);
    expect(back!.y).toBeLessThan(120);
  });
});

/** G-H1／G-H2：真實手機高度（Safari 有工具列）方塊井要玩得了，井底＋觸控鍵同屏。 */
test.describe("方塊轉轉：手機井尺寸", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 664 } });

  test("390×664：格子 ≥ 25px、井底與觸控鍵同屏、觸控鍵 ≥ 44px", async ({ page }) => {
    await page.goto("/games/block-drop");
    await page.getByRole("button", { name: "自由堆疊" }).click();
    await expect(page.locator('[data-status="playing"]')).toBeVisible();
    await page.waitForTimeout(400);

    const m = await page.evaluate(() => {
      const well = document.querySelector<HTMLElement>(
        '[data-status="playing"] [style*="grid-template-columns: repeat(10"]',
      )!.getBoundingClientRect();
      const pad = [...document.querySelectorAll('[data-testid="touch-control-pad"] button')].map(
        (b) => b.getBoundingClientRect(),
      );
      return {
        cellPx: well.width / 10,
        wellBottom: well.bottom,
        padBottom: Math.max(...pad.map((r) => r.bottom)),
        minSide: Math.min(...pad.flatMap((r) => [r.width, r.height])),
      };
    });
    expect(m.cellPx).toBeGreaterThanOrEqual(25);
    expect(m.wellBottom).toBeLessThanOrEqual(664);
    expect(m.padBottom).toBeLessThanOrEqual(664);
    expect(m.minSide).toBeGreaterThanOrEqual(44);
  });
});
