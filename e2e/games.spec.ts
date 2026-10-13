import { test, expect } from "@playwright/test";

/** 走 GamePageShell 的兩款；coloring-book 用 ColoringPageShell，另行驗收。方塊轉轉已下架。 */
const SHELL_ROUTES = [
  "candy-match",
  "dino-sushi",
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

  test("消消樂不放外框提示：第 1 站只靠棋盤上的手指示範", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/games/candy-match");
    await page.getByRole("button", { name: /開始冒險/ }).click();
    await page.locator('button[data-next="true"]').click();
    await expect(page.getByTestId("candy-match-board")).toBeVisible();

    await expect(page.getByLabel("操作提示")).toBeHidden();
    await expect(page.locator('[data-teach-hand="true"]')).toHaveCount(1);
    await expect(page.getByText("① 先點一個圖案")).toHaveCount(0);
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
    for (const name of ["繪本塗塗鴉", "車車消消樂", "多多壽司屋"]) {
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
      for (const name of ["繪本塗塗鴉", "車車消消樂", "多多壽司屋"]) {
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
      await expect(card).not.toContainText(/塗一塗|找一樣|做壽司|排一排/);
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

  test("手機兩欄、桌面一排三欄，站序著色 → 消消樂 → 壽司", async ({ page }) => {
    const order = ["/games/coloring-book", "/games/candy-match", "/games/dino-sushi"];
    for (const [viewport, cols] of [
      [{ width: 390, height: 844 }, 2],
      [{ width: 1280, height: 800 }, 3],
    ] as const) {
      await page.setViewportSize(viewport);
      await page.goto("/games");
      const cards = page.locator('main a[href^="/games/"]');
      expect(await cards.evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href")))).toEqual(order);
      const tops = await cards.evaluateAll((nodes) => nodes.map((n) => Math.round(n.getBoundingClientRect().top)));
      expect(new Set(tops).size, `${viewport.width}`).toBe(Math.ceil(order.length / cols));
    }
  });
});

test.describe("多多壽司屋", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as Window & { __dinoSushiSeed?: number }).__dinoSushiSeed = 7;
    });
  });

  test("320×568：廚房（多多、砧板、給多多吃、8 格托盤）一屏放下", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
    const tray = page.getByRole("group", { name: "壽司料" });
    await expect(tray.getByRole("button")).toHaveCount(8);
    const bottom = await page.getByTestId("dino-sushi").evaluate((el) => el.getBoundingClientRect().bottom);
    expect(bottom).toBeLessThanOrEqual(568);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(320);
  });

  test("兒童觸控鈕夠大：托盤、飯型、給多多吃 ≥56px，料位 ≥48px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
    for (const name of ["選握壽司", "選軍艦", "選手捲"]) {
      const box = await page.getByRole("button", { name }).boundingBox();
      expect(Math.min(box!.width, box!.height), name).toBeGreaterThanOrEqual(56);
    }
    await page.getByRole("button", { name: "選握壽司" }).click();
    for (const btn of await page.getByRole("group", { name: "壽司料" }).getByRole("button").all()) {
      const box = await btn.boundingBox();
      expect(Math.min(box!.width, box!.height)).toBeGreaterThanOrEqual(56);
    }
    const serve = await page.getByRole("button", { name: "給多多吃" }).boundingBox();
    expect(Math.min(serve!.width, serve!.height)).toBeGreaterThanOrEqual(56);
    await page.getByRole("group", { name: "壽司料" }).getByRole("button").first().click();
    const slot = await page.getByRole("button", { name: /^拿掉/ }).boundingBox();
    expect(Math.min(slot!.width, slot!.height)).toBeGreaterThanOrEqual(48);
  });

  test("觸控點一下只加一層料", async ({ browser }) => {
    const ctx = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } });
    const touch = await ctx.newPage();
    await touch.addInitScript(() => {
      (window as Window & { __dinoSushiSeed?: number }).__dinoSushiSeed = 7;
    });
    await touch.goto("/games/dino-sushi");
    await touch.getByRole("button", { name: "開始幫多多做壽司" }).tap();
    await touch.getByRole("button", { name: "選握壽司" }).tap();
    await touch.getByRole("group", { name: "壽司料" }).getByRole("button").first().tap();
    await expect(touch.getByRole("button", { name: /^拿掉/ })).toHaveCount(1);
    await ctx.close();
  });

  /** 美術審 H2：選飯（三張皿）和加料（砧板＋給多多吃）同高，店面舞台不跟著伸縮；矮畫面一屏放下。 */
  for (const vp of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 1280, height: 800 },
    { width: 844, height: 390 },
  ]) {
    test(`${vp.width}×${vp.height}：選飯與加料兩階段店面不跳`, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.goto("/games/dino-sushi");
      await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
      const stage = page.getByRole("region", { name: "多多" });
      const game = page.getByTestId("dino-sushi");
      const measure = async () => ({ stage: (await stage.boundingBox())!, game: (await game.boundingBox())! });
      const choosing = await measure();
      await page.getByRole("button", { name: "選握壽司" }).click();
      await expect(page.getByRole("button", { name: "給多多吃" })).toBeVisible();
      const topping = await measure();
      expect(Math.abs(topping.stage.y - choosing.stage.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(topping.stage.height - choosing.stage.height)).toBeLessThanOrEqual(1);
      if (vp.height <= 568) {
        for (const m of [choosing, topping]) expect(m.game.y + m.game.height).toBeLessThanOrEqual(vp.height);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(vp.width);
    });
  }

  test("選飯時看不到加料層：讀屏與 Tab 都到不了「給多多吃」", async ({ page }) => {
    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
    await expect(page.getByRole("button", { name: "給多多吃" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^換飯|^選飯$/ })).toHaveCount(0);
    await expect(page.getByRole("group", { name: "選飯" }).getByRole("button")).toHaveCount(3);
  });

  test("用鍵盤選飯後，焦點移到第一個可以加的料", async ({ page }) => {
    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
    await page.getByRole("button", { name: "選握壽司" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(":focus")).toHaveAttribute("aria-label", /^加/);
  });

  test("連點兩下選飯不會直接送出（第三張皿和「給多多吃」位置重疊）", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
    const box = (await page.getByRole("button", { name: "選手捲" }).boundingBox())!;
    const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
    await page.mouse.click(x, y);
    await page.mouse.click(x, y);
    await page.waitForTimeout(600);
    await expect(page.getByTestId("dino-sushi").locator("p[data-mood]")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "給多多吃" })).toBeVisible();
  });

  for (const vp of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
    { width: 1280, height: 800 },
  ]) {
  test(`${vp.width}×${vp.height}：教學手指的指尖落在被提示的那顆上，手身不壓到別顆、不出遊戲框`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
    const probe = () =>
      page.evaluate(() => {
        const hand = document.querySelector('[data-testid="dino-sushi"] [data-tap-hand]');
        if (!hand) return null;
        const box = hand.getBoundingClientRect();
        const host = hand.closest("button");
        const at = (fx: number, fy: number) =>
          document.elementFromPoint(box.left + box.width * fx, box.top + box.height * fy)?.closest("button") ?? null;
        const surface = document.querySelector('[data-testid="dino-sushi"]')!.getBoundingClientRect();
        return {
          label: host?.getAttribute("aria-label") ?? host?.textContent?.trim() ?? null,
          tipOnHost: at(0.53, 0.2) === host,
          bodyClear: [
            [0.45, 0.6],
            [0.4, 0.78],
          ].every(([fx, fy]) => [host, null].includes(at(fx, fy))),
          inside:
            box.left >= surface.left - 0.5 &&
            box.right <= surface.right + 0.5 &&
            box.top >= surface.top - 0.5 &&
            box.bottom <= surface.bottom + 0.5,
        };
      });
    const label = await page.getByRole("img", { name: /^第 1 單/ }).getAttribute("aria-label");
    const [base, ...toppings] = label!.split("多多想吃：")[1]!.split("、");
    const expectHand = async (name: string) => {
      await expect.poll(async () => (await probe())?.label).toBe(name);
      expect(await probe()).toMatchObject({ tipOnHost: true, bodyClear: true, inside: true });
    };
    await expectHand(`選${base}`);
    await page.getByRole("button", { name: `選${base}` }).click();
    for (const t of toppings) {
      await expectHand(`加${t}`);
      await page.getByRole("button", { name: `加${t}` }).click();
    }
    await expectHand("給多多吃");
  });
  }
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
    const card = page.getByRole("button", { name: /^著色：/ }).first();
    await card.click();
    await card.click();
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

/** 320 寬局內：返回＋三顆工具＋日夜切換都在畫面裡，觸控 ≥44px（<360 才收到 44）。 */
test.describe("遊戲抬頭：320 寬局內", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 320, height: 640 } });

  const headerFits = (page: import("@playwright/test").Page) =>
    page.evaluate(() => {
      const header = document.querySelector("header")!;
      const items = [...header.querySelectorAll("a, button")]
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0);
      return {
        count: items.length,
        right: Math.max(...items.map((r) => r.right)),
        minSide: Math.min(...items.flatMap((r) => [r.width, r.height])),
      };
    });

  test("多多壽司屋局內", async ({ page }) => {
    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
    await expect(page.getByTestId("dino-sushi")).toBeVisible();
    const m = await headerFits(page);
    expect(m.count).toBeGreaterThanOrEqual(5);
    expect(m.right).toBeLessThanOrEqual(320);
    expect(m.minSide).toBeGreaterThanOrEqual(44);
    await expect(page.getByRole("link", { name: /回遊樂園/ })).toContainText("回遊樂園");
  });
});
