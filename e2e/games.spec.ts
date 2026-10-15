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

  test("320×568：廚房（多多、砧板、給多多吃、8 格托盤）不橫向溢出", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
    const tray = page.getByRole("group", { name: "壽司料" });
    await expect(tray.getByRole("button")).toHaveCount(8);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(320);
  });

  test("兒童觸控鈕夠大：托盤與料位 ≥64px，給多多吃高 ≥80px", async ({ page }) => {
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
      expect(box!.width).toBeGreaterThanOrEqual(64);
      expect(box!.height).toBeGreaterThanOrEqual(64);
    }
    const serve = await page.getByRole("button", { name: "給多多吃" }).boundingBox();
    expect(serve!.height).toBeGreaterThanOrEqual(80);
    await page.getByRole("group", { name: "壽司料" }).getByRole("button").first().click();
    const slot = await page.getByRole("button", { name: /^拿掉/ }).boundingBox();
    expect(Math.min(slot!.width, slot!.height)).toBeGreaterThanOrEqual(64);
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

  /** 平行跑滿載時，點完按鈕立刻量可能還在載圖、還沒排好：等廚房裡的圖都載完、字型就緒、再過兩個畫格才量。 */
  async function settled(page: import("@playwright/test").Page) {
    await page.getByTestId("dino-sushi").evaluate(async (root) => {
      await Promise.all(
        [...root.querySelectorAll("img")].map((img) => (img.complete ? null : img.decode().catch(() => null))),
      );
      await document.fonts.ready;
      await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    });
  }

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
      const measure = async () => {
        await settled(page);
        return { stage: (await stage.boundingBox())!, game: (await game.boundingBox())! };
      };
      const choosing = await measure();
      await page.getByRole("button", { name: "選握壽司" }).click();
      await expect(page.getByRole("button", { name: "給多多吃" })).toBeVisible();
      const topping = await measure();
      expect(Math.abs(topping.stage.y - choosing.stage.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(topping.stage.height - choosing.stage.height)).toBeLessThanOrEqual(1);
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

  /** 美術審 M1：疊盤放大後不能壓到點餐泡泡或「多多吃飽了」（矮直向與橫向手機最擠）。 */
  for (const vp of [
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    const stackBox = (page: import("@playwright/test").Page) =>
      page.evaluate(() => {
        const stack = document.querySelector('[data-testid="dino-sushi"] [role="img"][aria-label^="吃完"]')!;
        const rects = [stack, ...stack.querySelectorAll("*")].map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0);
        return {
          left: Math.min(...rects.map((r) => r.left)),
          top: Math.min(...rects.map((r) => r.top)),
          right: Math.max(...rects.map((r) => r.right)),
          bottom: Math.max(...rects.map((r) => r.bottom)),
        };
      });
    const apart = (a: { left: number; top: number; right: number; bottom: number }, b: { x: number; y: number; width: number; height: number }) =>
      a.right <= b.x || b.x + b.width <= a.left || a.bottom <= b.y || b.y + b.height <= a.top;

    test(`${vp.width}×${vp.height}：點餐疊到 4 盤不碰泡泡`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize(vp);
      await page.goto("/games/dino-sushi");
      await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
      for (let n = 1; n <= 4; n++) {
        const label = await page.getByRole("img", { name: new RegExp(`^第 ${n} 單`) }).getAttribute("aria-label");
        const [base, ...toppings] = label!.split("想吃：")[1]!.split("、");
        await page.getByRole("button", { name: `選${base}` }).click();
        for (const t of toppings) await page.getByRole("button", { name: `加${t}` }).click();
        await page.getByRole("button", { name: "給多多吃" }).click();
        await expect(page.getByRole("img", { name: `吃完 ${n} 盤` })).toBeVisible();
      }
      const bubble = (await page.getByRole("img", { name: /^第 5 單/ }).boundingBox())!;
      expect(apart(await stackBox(page), bubble)).toBe(true);
    });

    test(`${vp.width}×${vp.height}：自由做疊 8 盤不碰「多多吃飽了」`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize(vp);
      await page.goto("/games/dino-sushi");
      await page.getByRole("button", { name: "自由做" }).click();
      for (let n = 1; n <= 8; n++) {
        await page.getByRole("button", { name: "選軍艦" }).click();
        await page.getByRole("button", { name: "給多多吃" }).click();
        await expect(page.getByRole("img", { name: `吃完 ${n} 盤` })).toBeVisible();
        await expect(page.getByRole("button", { name: "選軍艦" })).toBeVisible();
      }
      const full = (await page.getByRole("button", { name: "多多吃飽了" }).boundingBox())!;
      expect(apart(await stackBox(page), full)).toBe(true);
    });
  }

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
    const [base, ...toppings] = label!.split("想吃：")[1]!.split("、");
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

  /** 照第 n 單的泡泡選飯、放料、送出，等這一盤疊上去。 */
  const serveOrder = async (page: import("@playwright/test").Page, n: number) => {
    const label = await page.getByRole("img", { name: new RegExp(`^第 ${n} 單`) }).getAttribute("aria-label");
    const [base, ...toppings] = label!.split("想吃：")[1]!.split("、");
    await page.getByRole("button", { name: `選${base}` }).click();
    for (const t of toppings) await page.getByRole("button", { name: `加${t}` }).click();
    await page.getByRole("button", { name: "給多多吃" }).click();
    await expect(page.getByRole("img", { name: `吃完 ${n} 盤` })).toBeVisible();
  };

  /** 點牙刷正中央要點到牙刷，不能點到別的鈕（#215 的朗讀開關曾蓋在上面）。 */
  for (const vp of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 1280, height: 800 },
  ]) {
    test(`${vp.width}×${vp.height}：牙刷正中央點得到牙刷`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize(vp);
      await page.goto("/games/dino-sushi");
      await page.getByRole("button", { name: "自由做" }).click();
      await page.getByRole("button", { name: "選軍艦" }).click();
      await page.getByRole("button", { name: "加布丁" }).click();
      await page.getByRole("button", { name: "給多多吃" }).click();
      const brush = page.getByRole("button", { name: "幫多多刷牙" });
      await expect(brush).toBeVisible();
      /* 320 廚房比一屏高，點送出後舞台會捲到抬頭底下；先把牙刷捲到畫面中間再量 */
      await brush.evaluate((el) => el.scrollIntoView({ block: "center", inline: "nearest" }));
      const hit = await brush.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest("button") === el;
      });
      expect(hit).toBe(true);
    });
  }

  /** 第 5 單有飯＋三樣料：四格都要在店面舞台裡，不被裁掉；點泡泡的「再聽一次」也在舞台裡。 */
  for (const vp of [
    { width: 320, height: 568 },
    { width: 360, height: 640 },
    { width: 390, height: 844 },
    { width: 667, height: 375 },
    { width: 844, height: 390 },
  ]) {
    test(`${vp.width}×${vp.height}：三料單的泡泡整顆在舞台裡`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize(vp);
      await page.goto("/games/dino-sushi");
      await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
      for (let n = 1; n <= 4; n++) await serveOrder(page, n);
      const bubble = page.getByRole("img", { name: /^第 5 單/ });
      await expect(bubble).toBeVisible();
      const stage = (await page.getByRole("region", { name: "多多" }).boundingBox())!;
      // 溢出的子元素不算在泡泡的框裡，要一格一格量
      const items = await bubble.evaluate((el) =>
        [...el.querySelector("[data-order-items]")!.children].map((c) => {
          const r = c.getBoundingClientRect();
          return { left: r.left, right: r.right };
        }),
      );
      expect(items).toHaveLength(4);
      for (const item of items) {
        expect(item.left).toBeGreaterThanOrEqual(stage.x);
        expect(item.right).toBeLessThanOrEqual(stage.x + stage.width);
      }
      const replay = (await page.getByRole("button", { name: "再聽一次" }).boundingBox())!;
      expect(replay.x + replay.width).toBeLessThanOrEqual(stage.x + stage.width);
    });
  }

  test("320×568：料位和「給多多吃」各點各的，相鄰至少 8px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
    await page.getByRole("button", { name: "選軍艦" }).click();
    const tray = page.getByRole("group", { name: "壽司料" }).getByRole("button");
    for (let i = 0; i < 3; i++) await tray.nth(i).click();
    const slots = page.getByRole("button", { name: /^拿掉/ });
    await expect(slots).toHaveCount(3);
    const serve = (await page.getByRole("button", { name: "給多多吃" }).boundingBox())!;
    const boxes = await Promise.all((await slots.all()).map(async (s) => (await s.boundingBox())!));
    for (const [i, box] of boxes.entries()) {
      const hit = await slots.nth(i).evaluate((el) => {
        const r = el.getBoundingClientRect();
        return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest("button") === el;
      });
      expect(hit, `料位 ${i + 1}`).toBe(true);
      expect(Math.min(box.width, box.height), `料位 ${i + 1}`).toBeGreaterThanOrEqual(64);
      /* 給多多吃在料位下面，全寬，上下至少隔 8px */
      expect(serve.y - (box.y + box.height), `料位 ${i + 1} 到給多多吃`).toBeGreaterThanOrEqual(8);
    }
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i]!.x - (boxes[i - 1]!.x + boxes[i - 1]!.width)).toBeGreaterThanOrEqual(8);
    }
  });

  /** 料位每個寬度都是 64px。直向手機「給多多吃」在料位下面；矮橫向可以捲，但不能橫向溢出。 */
  for (const { vp, fits = true } of [
    { vp: { width: 390, height: 844 } },
    { vp: { width: 360, height: 740 } },
    { vp: { width: 1280, height: 800 } },
    { vp: { width: 375, height: 667 } },
    // 800×600 視窗是直排版面，本來就放不進一屏（既有），只量料位
    { vp: { width: 800, height: 600 }, fits: false },
    { vp: { width: 844, height: 390 }, fits: false },
    { vp: { width: 568, height: 320 }, fits: false },
  ]) {
    test(`${vp.width}×${vp.height}：料位 64px，跟「給多多吃」不重疊`, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.goto("/games/dino-sushi");
      await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
      await page.getByRole("button", { name: "選軍艦" }).click();
      const tray = page.getByRole("group", { name: "壽司料" }).getByRole("button");
      for (let i = 0; i < 3; i++) await tray.nth(i).click();
      await settled(page);
      const slots = await Promise.all((await page.getByRole("button", { name: /^拿掉/ }).all()).map(async (s) => (await s.boundingBox())!));
      expect(slots).toHaveLength(3);
      for (const box of slots) {
        expect(box.width).toBeGreaterThanOrEqual(64);
        expect(box.height).toBeGreaterThanOrEqual(64);
        expect(Math.abs(box.height - box.width)).toBeLessThanOrEqual(1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(vp.width);
      const serve = (await page.getByRole("button", { name: "給多多吃" }).boundingBox())!;
      const last = slots[2]!;
      const apart = serve.x >= last.x + last.width + 8 || serve.y >= last.y + last.height + 8;
      expect(apart, "料位和「給多多吃」相隔至少 8px").toBe(true);
      if (fits) {
        const bottom = await page.getByTestId("dino-sushi").evaluate((el) => el.getBoundingClientRect().bottom);
        expect(bottom).toBeLessThanOrEqual(vp.height);
      }
    });
  }

  test("料位滿了再點料：擠掉最舊那層，新的放最後，不會卡住", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: "自由做" }).click();
    await page.getByRole("button", { name: "選握壽司" }).click();
    const tray = page.getByRole("group", { name: "壽司料" }).getByRole("button");
    const names = (await tray.evaluateAll((bs) => bs.map((b) => b.getAttribute("aria-label")!))).map((n) => n.slice(1));
    for (let i = 0; i < 3; i++) await tray.nth(i).click();
    const slotButtons = page.getByRole("button", { name: /^拿掉/ });
    await expect(slotButtons).toHaveCount(3);
    // 做記號：擠掉最舊那層後，留下來的兩格要是同一顆元素（不重掛，彈出動畫只給新的那格）
    await slotButtons.evaluateAll((bs) => bs.forEach((b, i) => b.setAttribute("data-mark", String(i))));
    await tray.nth(3).click();
    await expect(slotButtons).toHaveCount(3);
    const slots = await slotButtons.evaluateAll((bs) => bs.map((b) => [b.getAttribute("aria-label"), b.getAttribute("data-mark")]));
    expect(slots).toEqual([
      [`拿掉${names[1]}`, "1"],
      [`拿掉${names[2]}`, "2"],
      [`拿掉${names[3]}`, null],
    ]);
  });

  test("滿格再加料：被擠掉的料縮小飛回托盤；減少動態改成淡出", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: "自由做" }).click();
    await page.getByRole("button", { name: "選握壽司" }).click();
    const tray = page.getByRole("group", { name: "壽司料" }).getByRole("button");
    for (let i = 0; i < 3; i++) await tray.nth(i).click();
    const oldest = await tray.nth(0).getAttribute("data-topping");
    const readFly = () =>
      page.waitForFunction(() => {
        const el = document.querySelector("[data-evict]");
        if (!el) return null;
        return { id: el.getAttribute("data-evict"), name: getComputedStyle(el).animationName };
      });
    const motionPromise = readFly();
    await tray.nth(3).click();
    expect(await (await motionPromise).jsonValue()).toMatchObject({ id: oldest, name: expect.stringMatching(/evictFly/) });
    await expect(page.locator("[data-evict]")).toHaveCount(0);

    await page.emulateMedia({ reducedMotion: "reduce" });
    const nextOldest = await tray.nth(1).getAttribute("data-topping");
    const fadePromise = readFly();
    await tray.nth(4).click();
    expect(await (await fadePromise).jsonValue()).toMatchObject({ id: nextOldest, name: expect.stringMatching(/evictFade/) });
  });

  test("從托盤開始滑動不會加料", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: "自由做" }).click();
    await page.getByRole("button", { name: "選握壽司" }).click();
    const ingredient = page.getByRole("group", { name: "壽司料" }).getByRole("button").first();
    await ingredient.scrollIntoViewIfNeeded();
    const box = (await ingredient.boundingBox())!;
    await page.mouse.move(box.x + 20, box.y + 16);
    await page.mouse.down();
    await page.mouse.move(box.x + 20, box.y + 16 + 28);
    await page.mouse.up();
    await expect(page.getByRole("button", { name: /^拿掉/ })).toHaveCount(0);
    await ingredient.click();
    await expect(page.getByRole("button", { name: /^拿掉/ })).toHaveCount(1);
  });

  for (const vp of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 1280, height: 800 },
  ]) {
    test(`${vp.width}：互動元素達到觸控尺寸`, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.goto("/games/dino-sushi");
      const start = (await page.getByRole("button", { name: "開始幫多多做壽司" }).boundingBox())!;
      expect(Math.min(start.width, start.height), "開始").toBeGreaterThanOrEqual(88);
      const free = (await page.getByRole("button", { name: "自由做" }).boundingBox())!;
      expect(free.width, "自由做寬").toBeGreaterThanOrEqual(120);
      expect(free.height, "自由做高").toBeGreaterThanOrEqual(64);

      await page.getByRole("button", { name: "自由做" }).click();
      const full = (await page.getByRole("button", { name: "多多吃飽了" }).boundingBox())!;
      expect(Math.min(full.width, full.height), "多多吃飽了").toBeGreaterThanOrEqual(64);

      await page.getByRole("button", { name: "選握壽司" }).click();
      const tray = page.getByRole("group", { name: "壽司料" }).getByRole("button");
      for (const btn of await tray.all()) {
        const box = (await btn.boundingBox())!;
        expect(box.width, "托盤寬").toBeGreaterThanOrEqual(64);
        expect(box.height, "托盤高").toBeGreaterThanOrEqual(64);
      }
      await tray.first().click();
      const slot = (await page.getByRole("button", { name: /^拿掉/ }).boundingBox())!;
      expect(Math.min(slot.width, slot.height), "料位").toBeGreaterThanOrEqual(64);
      const serve = (await page.getByRole("button", { name: "給多多吃" }).boundingBox())!;
      expect(serve.height, "給多多吃").toBeGreaterThanOrEqual(80);

      const chrome = await page.evaluate(() =>
        [...document.querySelectorAll("header a, header button")]
          .map((el) => el.getBoundingClientRect())
          .filter((r) => r.width > 0 && r.height > 0)
          .map((r) => Math.min(r.width, r.height)),
      );
      expect(chrome.length).toBeGreaterThanOrEqual(5);
      for (const side of chrome) expect(side, "抬頭").toBeGreaterThanOrEqual(48);

      await tray.nth(1).click();
      await tray.nth(2).click();
      await page.getByRole("button", { name: /加(草莓|布丁)/ }).click();
      await page.getByRole("button", { name: "給多多吃" }).click();
      const brush = page.getByRole("button", { name: "幫多多刷牙" });
      await expect(brush).toBeVisible();
      const brushBox = (await brush.boundingBox())!;
      expect(Math.min(brushBox.width, brushBox.height), "幫多多刷牙").toBeGreaterThanOrEqual(80);

      await page.getByRole("button", { name: "多多吃飽了" }).click();
      const title = (await page.getByRole("button", { name: "回標題" }).boundingBox())!;
      expect(Math.min(title.width, title.height), "回標題").toBeGreaterThanOrEqual(64);
      const again = (await page.getByRole("button", { name: "再自由做" }).boundingBox())!;
      expect(Math.min(again.width, again.height), "再自由做").toBeGreaterThanOrEqual(88);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(vp.width);
    });
  }

  test("用鍵盤拿掉料：焦點留在料位，拿光了回到托盤", async ({ page }) => {
    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: "自由做" }).click();
    await page.getByRole("button", { name: "選握壽司" }).click();
    const tray = page.getByRole("group", { name: "壽司料" }).getByRole("button");
    for (let i = 0; i < 3; i++) await tray.nth(i).click();
    await page.getByRole("button", { name: /^拿掉/ }).nth(1).focus();
    for (const left of [2, 1]) {
      await page.keyboard.press("Enter");
      await expect(page.getByRole("button", { name: /^拿掉/ })).toHaveCount(left);
      await expect(page.locator(":focus")).toHaveAttribute("aria-label", /^拿掉/);
    }
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: /^拿掉/ })).toHaveCount(0);
    await expect(page.locator(":focus")).toHaveAttribute("aria-label", /^加/);
  });

  /**
   * 手捲三樣料時中間那樣抬高到兩側上方：扁的鮭魚夾在蝦、蟹肉棒中間也要露出上緣；
   * 最高的布丁放中間也不能冒出砧板、壓到上面的店面。
   */
  for (const vp of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 932, height: 430 },
  ]) {
    test(`${vp.width}×${vp.height}：手捲三樣料，中間那樣看得到、不冒出砧板`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize(vp);
      await page.goto("/games/dino-sushi");
      await page.getByRole("button", { name: "自由做" }).click();
      await page.getByRole("button", { name: "選手捲" }).click();
      const board = page.getByRole("region", { name: "砧板" });
      const measure = (middle: string) =>
        board.evaluate((el, middle) => {
          const layers = [...el.querySelectorAll("[data-sushi] > span img")].map((img) => ({
            middle: img.getAttribute("src")!.endsWith(`${middle}.webp`),
            r: img.getBoundingClientRect(),
          }));
          const center = layers.find((l) => l.middle)!.r;
          return {
            boardTop: el.getBoundingClientRect().top,
            top: Math.min(...layers.map((l) => l.r.top)),
            // 中間那樣的上緣要比兩側的料都高一截，才看得到
            above: layers.filter((l) => !l.middle).every((l) => center.top < l.r.top - 3),
          };
        }, middle);
      const clear = async () => {
        while (await page.getByRole("button", { name: /^拿掉/ }).count()) {
          await page.getByRole("button", { name: /^拿掉/ }).first().click();
        }
      };
      for (const [middle, names] of [
        ["salmon", ["加鮭魚", "加蝦", "加蟹肉棒"]],
        ["pudding", ["加布丁", "加蝦", "加蟹肉棒"]],
      ] as const) {
        await clear();
        for (const name of names) await page.getByRole("button", { name }).click();
        await settled(page);
        const m = await measure(middle);
        expect(m.above, `${middle} 在中間`).toBe(true);
        expect(m.top, `${middle} 在中間`).toBeGreaterThanOrEqual(m.boardTop - 0.5);
      }
    });
  }

  test("托盤的料圖整張在格子裡，高的料（蝦、蟹肉棒）頂端不被切平", async ({ page }) => {
    for (const vp of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1280, height: 800 }]) {
      await page.setViewportSize(vp);
      await page.goto("/games/dino-sushi");
      await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
      await settled(page);
      const out = await page.getByRole("group", { name: "壽司料" }).evaluate((tray) =>
        [...tray.querySelectorAll("button")].flatMap((b) => {
          const art = b.querySelector("img")!;
          const cell = art.parentElement!.getBoundingClientRect();
          const r = art.getBoundingClientRect();
          const clipped = getComputedStyle(art.parentElement!).overflow !== "visible";
          const inside = r.top >= cell.top - 1 && r.bottom <= cell.bottom + 1 && r.left >= cell.left - 1 && r.right <= cell.right + 1;
          return inside && !clipped && r.height > 0 ? [] : [b.getAttribute("aria-label")];
        }),
      );
      expect(out, `${vp.width}×${vp.height}`).toEqual([]);
    }
  });

  /** 假的 speechSynthesis 要用 defineProperty 換掉（直接指定在 Chromium 會被忽略，測試會白過）。 */
  async function installFakeSpeech(page: import("@playwright/test").Page) {
    await page.addInitScript(() => {
      type Entry = { op: "speak" | "cancel"; text?: string };
      const log: Entry[] = [];
      let current: { text: string; onend?: (() => void) | null } | null = null;
      const synth = {
        speaking: false,
        pending: false,
        speak(u: { text: string; onend?: (() => void) | null }) {
          log.push({ op: "speak", text: u.text });
          current = u;
          synth.speaking = true;
        },
        cancel() {
          log.push({ op: "cancel" });
          current = null;
          synth.speaking = false;
        },
      };
      class FakeUtterance {
        lang = "";
        rate = 1;
        pitch = 1;
        volume = 1;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(public text: string) {}
      }
      Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
      Object.defineProperty(window, "SpeechSynthesisUtterance", { value: FakeUtterance, configurable: true });
      const w = window as unknown as { __speech: Entry[]; __finishSpeech: () => void };
      w.__speech = log;
      w.__finishSpeech = () => {
        const u = current;
        current = null;
        synth.speaking = false;
        u?.onend?.();
      };
    });
    const log = () => page.evaluate(() => (window as unknown as { __speech: { op: string; text?: string }[] }).__speech);
    const spoken = async () => (await log()).filter((e) => e.op === "speak").map((e) => e.text);
    const finish = () => page.evaluate(() => (window as unknown as { __finishSpeech: () => void }).__finishSpeech());
    return { log, spoken, finish };
  }

  /** 朗讀跟抬頭「音效」同一個開關；多多的字卡念完才接著念下一單。 */
  test("朗讀：字卡不被換單切掉、關掉抬頭音效就不念", async ({ page }) => {
    const { log, spoken, finish } = await installFakeSpeech(page);

    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
    await expect.poll(spoken).toEqual([expect.stringMatching(/^我想要/)]);
    const firstOrder = (await spoken())[0];
    await finish();

    // 點泡泡再聽一次（音效開著時有念：正向對照）
    await page.getByRole("button", { name: "再聽一次" }).click();
    await expect.poll(async () => (await spoken()).at(-1)).toBe(firstOrder);
    await finish();

    // 做完第 1 單：字卡開始念，下一單出現時不能 cancel 掉它，要等它念完才念下一單
    const mark = (await log()).length;
    await serveOrder(page, 1);
    await expect(page.getByRole("img", { name: /^第 2 單/ })).toBeVisible();
    expect((await log()).slice(mark)).toEqual([{ op: "speak", text: expect.stringMatching(/！$/) }]);
    await finish();
    await expect.poll(async () => (await spoken()).at(-1)).toMatch(/^我想要/);

    // 關掉抬頭音效：之後不念、泡泡上的「再聽一次」也收起來
    await page.getByRole("button", { name: "關閉音效" }).click();
    await expect(page.getByRole("button", { name: "再聽一次" })).toHaveCount(0);
    const before = (await spoken()).length;
    await serveOrder(page, 2);
    await expect(page.getByRole("img", { name: /^第 3 單/ })).toBeVisible();
    expect((await spoken()).length).toBe(before);
  });

  /** 設定裡的「念出來」只關人聲：音效開關不動，泡泡上的「再聽一次」收起來。 */
  test("朗讀：在遊戲設定關掉「念出來」就不念，音效照常開著", async ({ page }) => {
    const { spoken, finish } = await installFakeSpeech(page);

    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
    // 正向對照：預設開著，第 1 單有念
    await expect.poll(spoken).toEqual([expect.stringMatching(/^我想要/)]);
    await finish();
    await expect(page.getByRole("button", { name: "再聽一次" })).toBeVisible();

    await page.getByRole("button", { name: "遊戲設定" }).click();
    const voice = page.getByRole("checkbox", { name: /念出來/ });
    await expect(voice).toBeChecked();
    await voice.uncheck();
    await page.getByRole("button", { name: "完成" }).click();

    await expect(page.getByRole("button", { name: "再聽一次" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "關閉音效" })).toBeVisible();
    const before = (await spoken()).length;
    await serveOrder(page, 1);
    await expect(page.getByRole("img", { name: /^第 2 單/ })).toBeVisible();
    expect((await spoken()).length).toBe(before);

    // 重新整理後仍是關著（存在進度裡）
    await page.reload();
    await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
    await expect(page.getByRole("img", { name: /^第 1 單/ })).toBeVisible();
    expect(await spoken()).toEqual([]);
  });

  test("320×568：遊戲設定放得下，「念出來」整列可點且至少 44px 高", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: "遊戲設定" }).click();
    const dialog = page.getByRole("dialog", { name: "遊戲設定" });
    const box = (await dialog.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
    const row = dialog.locator("label").filter({ has: page.getByRole("checkbox", { name: /念出來/ }) });
    await row.scrollIntoViewIfNeeded();
    expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await dialog.getByRole("button", { name: "完成" }).scrollIntoViewIfNeeded();
    await expect(dialog.getByRole("button", { name: "完成" })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });

  /** 泡泡每一格的圖都要縮在格子裡：瘦長的手捲曾經把格子撐高、凸出泡泡、蓋住進度小盤。 */
  const bubbleOverflow = (page: import("@playwright/test").Page) =>
    page.getByRole("img", { name: /^第 \d 單/ }).evaluate((bubble) =>
      [...bubble.querySelector("[data-order-items]")!.children].flatMap((cell) => {
        const c = cell.getBoundingClientRect();
        const i = cell.querySelector("img")!.getBoundingClientRect();
        const out = i.top < c.top - 1 || i.bottom > c.bottom + 1 || i.left < c.left - 1 || i.right > c.right + 1;
        return out ? [`${Math.round(i.width)}×${Math.round(i.height)} 超出 ${Math.round(c.width)}×${Math.round(c.height)}`] : [];
      }),
    );

  for (const vp of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 667, height: 375 },
    { width: 1280, height: 800 },
  ]) {
    test(`${vp.width}×${vp.height}：泡泡裡的飯和料（含手捲）都縮在格子裡`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize(vp);
      await page.goto("/games/dino-sushi");
      await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
      const bases = new Set<string>();
      for (let n = 1; n <= 5; n++) {
        const label = (await page.getByRole("img", { name: new RegExp(`^第 ${n} 單`) }).getAttribute("aria-label"))!;
        bases.add(label.split("想吃：")[1]!.split("、")[0]!);
        expect(await bubbleOverflow(page), `第 ${n} 單`).toEqual([]);
        if (n < 5) await serveOrder(page, n);
      }
      // 固定 seed 7：五單裡至少有手捲（最瘦長、最容易凸出）
      expect(bases).toContain("手捲");
    });
  }

  /** 店名刻在櫃台前板：多多、疊盤（含數字）、泡泡都不能疊在字上（以前掛在多多後面的直式招牌整個被擋住）。送餐盤停在舞台 30% 起，店名寬度不到 26%，由 CSS 保證。 */
  for (const vp of [
    { width: 390, height: 844 },
    { width: 667, height: 375 },
    { width: 844, height: 390 },
    { width: 932, height: 430 },
    { width: 1280, height: 800 },
  ]) {
    test(`${vp.width}×${vp.height}：「多多壽司」店名看得到，疊到 4 盤也不被擋`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize(vp);
      await page.goto("/games/dino-sushi");
      await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
      for (let n = 1; n <= 4; n++) await serveOrder(page, n);
      const result = await page.getByRole("region", { name: "多多" }).evaluate((stage) => {
        const name = [...stage.querySelectorAll("span")].find((s) => s.textContent === "多多壽司")!;
        const n = name.getBoundingClientRect();
        const box = (el: Element | null) => el?.getBoundingClientRect() ?? null;
        const overlaps = (r: DOMRect | null) =>
          r !== null && r.width > 0 && !(r.right <= n.left || n.right <= r.left || r.bottom <= n.top || n.bottom <= r.top);
        const stack = stage.querySelector('[role="img"][aria-label^="吃完"]')!;
        const blockers = {
          多多: box(stage.querySelector('[data-mouth] img[data-active="true"]')),
          疊盤: box(stack),
          疊盤數字: box(stack.querySelector("b")),
          泡泡: box(stage.querySelector('[role="img"][aria-label^="第"]')),
        };
        const s = stage.getBoundingClientRect();
        return {
          size: parseFloat(getComputedStyle(name).fontSize),
          inside: n.left >= s.left && n.right <= s.right && n.bottom <= s.bottom + 0.5 && n.width > 0,
          // 選擇器沒抓到會讓檢查白過：每一樣都要真的在畫面上
          missing: Object.entries(blockers)
            .filter(([, r]) => r === null || r.width === 0)
            .map(([k]) => k),
          blocked: Object.entries(blockers)
            .filter(([, r]) => overlaps(r))
            .map(([k]) => k),
        };
      });
      expect(result.missing).toEqual([]);
      expect(result.inside).toBe(true);
      expect(result.size).toBeGreaterThanOrEqual(11);
      expect(result.blocked).toEqual([]);
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

/** 320 寬局內：返回＋三顆工具＋日夜切換都在畫面裡，觸控 ≥48px。 */
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
    expect(m.minSide).toBeGreaterThanOrEqual(48);
    await expect(page.getByRole("link", { name: /回遊樂園/ })).toContainText("回遊樂園");
  });
});
