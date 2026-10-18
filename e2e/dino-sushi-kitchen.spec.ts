import { expect, test, type Page } from "@playwright/test";

/** 多多壽司屋廚房（2026-10-16 實玩審 批次 K）：選飯的皿、「多多吃飽了」、朋友收餐、圓蓋獎品、桌機泡泡。 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __dinoSushiSeed?: number }).__dinoSushiSeed = 7;
  });
});

async function order(page: Page, n: number) {
  const label = await page.getByRole("img", { name: new RegExp(`^第 ${n} 單`) }).getAttribute("aria-label");
  const [base, ...toppings] = label!.split("想吃：")[1]!.split("、");
  return { base: base!, toppings };
}

async function serve(page: Page, n: number, opts: { skipLast?: boolean } = {}) {
  const { base, toppings } = await order(page, n);
  await page.getByRole("button", { name: `選${base}` }).click();
  for (const t of opts.skipLast ? toppings.slice(0, -1) : toppings) await page.getByRole("button", { name: `加${t}` }).click();
  await page.getByRole("button", { name: "給多多吃" }).click();
}

async function waitServed(page: Page, n: number) {
  await expect(page.getByRole("img", { name: `吃完 ${n} 盤` })).toBeVisible();
  await expect(page.getByRole("img", { name: new RegExp(`^第 ${n + 1} 單`) })).toBeVisible();
}

for (const vp of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 430, height: 739 },
  { width: 430, height: 932 },
]) {
  test(`${vp.width}×${vp.height}：選飯的皿長高但停在「給多多吃」上緣之前`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
    const plates = await Promise.all(
      ["選握壽司", "選軍艦", "選手捲"].map(async (name) => (await page.getByRole("button", { name }).boundingBox())!),
    );
    await page.getByRole("button", { name: "選握壽司" }).click();
    const serveBtn = (await page.getByRole("button", { name: "給多多吃" }).boundingBox())!;
    for (const p of plates) {
      expect(p.height).toBeGreaterThanOrEqual(96);
      expect(p.height).toBeLessThanOrEqual(168.5);
      expect(serveBtn.y - (p.y + p.height), "皿下緣到給多多吃至少 8px").toBeGreaterThanOrEqual(7.5);
    }
  });
}

test("自由做「多多吃飽了」是實心綠鈕，跟多多的字卡長得不一樣；鍵盤按得到", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: "自由做" }).click();
  const full = page.getByRole("button", { name: "多多吃飽了" });
  await expect(full).toBeVisible();
  expect(await full.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(63, 127, 42)");
  await page.getByRole("button", { name: "選握壽司" }).click();
  await page.getByRole("group", { name: "壽司料" }).getByRole("button").first().click();
  await page.getByRole("button", { name: "給多多吃" }).click();
  const caption = page.getByTestId("dino-sushi").locator("p[data-mood]");
  await expect(caption).toBeVisible();
  expect(await caption.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe("rgb(63, 127, 42)");
  await expect(page.getByRole("img", { name: "吃完 1 盤" })).toBeVisible();
  await expect(full).toBeEnabled();
  await full.focus();
  await expect(full).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("dino-sushi-result")).toBeVisible();
});

test("做對一單：字卡下面出現點餐朋友的謝謝；只送飯不出現", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
  const game = page.getByTestId("dino-sushi");
  const thanks = game.locator("p[data-customer]");
  await serve(page, 1);
  await expect(thanks).toBeVisible();
  const [captionBox, thanksBox] = await Promise.all([
    game.locator("p[data-mood]").boundingBox(),
    thanks.boundingBox(),
  ]);
  expect(thanksBox!.y, "謝謝在多多字卡下面").toBeGreaterThan(captionBox!.y + captionBox!.height - 1);
  await waitServed(page, 1);
  // 下一單出來後再留一下（朗讀念完多多才念朋友），然後收起
  await expect(thanks).toBeVisible();
  await expect(thanks).toHaveCount(0, { timeout: 4000 });
  // 第 2 單只放飯：多多不吃，沒有謝謝
  await serve(page, 2, { skipLast: true });
  await expect(game.locator('p[data-mood="look"]')).toBeVisible();
  await expect(thanks).toHaveCount(0);
});

test("關掉「念出來」也看得到朋友的謝謝；讀屏宣告接著念謝謝", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
  await page.getByRole("button", { name: "遊戲設定" }).click();
  await page.getByRole("checkbox", { name: /念出來/ }).uncheck();
  await page.getByRole("button", { name: "完成" }).click();
  await serve(page, 1);
  const thanks = page.getByTestId("dino-sushi").locator("p[data-customer]");
  await expect(thanks).toBeVisible();
  const line = (await thanks.textContent())!;
  await expect(page.getByTestId("dino-sushi").locator('[aria-live="polite"]')).toContainText(line);
});

test("送完第 3 盤：圓蓋獎品在舞台裡彈出來、不帶「新」，播完收起；暫停時停住", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
  for (let n = 1; n <= 2; n++) {
    await serve(page, n);
    await waitServed(page, n);
  }
  await serve(page, 3);
  const pop = page.locator("[data-dome-pop]");
  await expect(pop).toBeVisible();
  const inside = await pop.evaluate((el) => {
    const stage = el.closest("section")!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { inStage: r.left >= stage.left && r.right <= stage.right && r.top >= stage.top, text: el.textContent };
  });
  expect(inside.inStage).toBe(true);
  expect(inside.text).not.toContain("新");
  await page.getByRole("button", { name: "暫停遊戲" }).click();
  await page.waitForTimeout(2500);
  await expect(pop).toBeVisible();
  await page.getByRole("button", { name: "繼續遊戲" }).click();
  await expect(pop).toHaveCount(0, { timeout: 4000 });
});

test("844×390：點餐圖至少 40px，托盤底邊在視窗內", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
  // 泡泡進場是 scale，量太早會把格子量小。
  await page.waitForFunction(() => {
    const el = document.querySelector("[class*='bubbleWrap']");
    return !!el && el.getAnimations().every((anim) => anim.playState === "finished");
  });
  const geo = await page.evaluate(() => {
    const cells = [...document.querySelectorAll("[data-order-items] > *")].map((el) => el.getBoundingClientRect().width);
    const trays = [...document.querySelectorAll("button")].filter((button) =>
      (button.getAttribute("aria-label") ?? "").startsWith("加"),
    );
    const bottoms = trays.map((el) => el.getBoundingClientRect().bottom);
    return { cells, trayBottom: Math.max(0, ...bottoms), vh: window.innerHeight };
  });
  expect(geo.cells.length).toBeGreaterThan(0);
  for (const width of geo.cells) expect(width).toBeGreaterThanOrEqual(40);
  expect(geo.trayBottom).toBeLessThanOrEqual(geo.vh + 0.5);
});

test("1280：點餐泡泡的格子跟著舞台放大（≥44px），泡泡不出舞台", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
  for (let n = 1; n <= 4; n++) {
    await serve(page, n);
    await waitServed(page, n);
  }
  const geo = await page.getByRole("img", { name: /^第 5 單/ }).evaluate((bubble) => {
    const stage = bubble.closest("section")!.getBoundingClientRect();
    const b = bubble.getBoundingClientRect();
    const cells = [...bubble.querySelector("[data-order-items]")!.children].map((c) => c.getBoundingClientRect().width);
    return { cells, inStage: b.left >= stage.left - 1 && b.right <= stage.right + 1 };
  });
  expect(geo.cells).toHaveLength(4);
  for (const w of geo.cells) expect(w).toBeGreaterThanOrEqual(44);
  expect(geo.inStage).toBe(true);
});

/** 排隊與座位都是看的：量框，確認不壓到多多、疊盤，也不把點擊吃掉。 */
async function layout(page: Page) {
  return page.evaluate(() => {
    const rect = (el: Element | null) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    const area = (a: { x: number; y: number; w: number; h: number } | null, b: typeof a) => {
      if (!a || !b) return 0;
      const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
      const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      return x * y;
    };
    const stage = document.querySelector("section[aria-label='多多']");
    const queue = document.querySelector("[data-customer-queue]");
    const items = [...document.querySelectorAll("[data-customer-queue] li")].map((el) => ({
      state: el.getAttribute("data-state"),
      id: el.getAttribute("data-customer"),
      w: el.getBoundingClientRect().width,
      hasCheck: el.querySelector("svg") !== null,
    }));
    const now = document.querySelector("[data-customer-queue] li[data-state='next']");
    const bubble = document.querySelector("[role='img'][data-customer]");
    const badge = document.querySelector("[class*='replayBadge']");
    const face = document.querySelector("[class*='guestFaceWrap']");
    const seat = document.querySelector("[data-customer-seat]");
    const duo = document.querySelector("[data-face]");
    const plates = document.querySelector("[class*='plates']");
    const stageR = rect(stage);
    const headerBtns = [...document.querySelectorAll("[class*='playHeader'] button")].map((el) => rect(el));
    const bubbleR = rect(bubble);
    const inside = (r: { x: number; y: number; w: number; h: number } | null) =>
      !!r &&
      !!stageR &&
      r.x >= stageR.x - 1 &&
      r.y >= stageR.y - 1 &&
      r.x + r.w <= stageR.x + stageR.w + 1 &&
      r.y + r.h <= stageR.y + stageR.h + 1;
    const hit = (el: Element | null) => {
      if (!el) return "";
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.x + r.width / 2, r.y + Math.min(r.height / 2, 24));
      return top?.getAttribute("aria-label") || top?.tagName || "";
    };
    const serve = [...document.querySelectorAll("button")].find((b) => (b.textContent || "").includes("給多多吃")) ?? null;
    const replay = document.querySelector("button[aria-label='再聽一次']");
    return {
      queueHidden: queue?.getAttribute("aria-hidden") ?? "",
      queuePE: queue ? getComputedStyle(queue).pointerEvents : "",
      queueButtons: queue?.querySelectorAll("button").length ?? 0,
      items,
      nowW: now ? now.getBoundingClientRect().width : 0,
      minWait: Math.min(...items.filter((item) => item.state === "wait").map((item) => item.w), Infinity),
      /* 打勾會伸出約 3px，連這個邊一起留在舞台和視窗裡 */
      ringIn: [...document.querySelectorAll("[data-customer-queue] li")].every((el) => {
        const b = el.getBoundingClientRect();
        const box = { x: b.x - 3, y: b.y - 3, w: b.width + 6, h: b.height + 6 };
        return (
          inside(box) &&
          box.y >= -0.5 &&
          box.x >= -0.5 &&
          box.y + box.h <= window.innerHeight + 0.5 &&
          box.x + box.w <= window.innerWidth + 0.5
        );
      }),
      faceW: face ? face.getBoundingClientRect().width : 0,
      duoH: duo ? duo.getBoundingClientRect().height : 0,
      seatH: seat ? seat.getBoundingClientRect().height : 0,
      seatId: seat?.getAttribute("data-customer") ?? "",
      bubbleId: bubble?.getAttribute("data-customer") ?? "",
      seatPE: seat ? getComputedStyle(seat).pointerEvents : "",
      nowVsDuo: area(rect(now), rect(duo)),
      queueVsDuo: area(rect(queue), rect(duo)),
      queueVsBubble: area(rect(queue), bubbleR),
      queueVsBadge: area(rect(queue), rect(badge)),
      queueVsHeader: headerBtns.reduce((sum, btn) => sum + area(rect(queue), btn), 0),
      seatVsDuo: area(rect(seat), rect(duo)),
      seatVsPlates: area(rect(seat), rect(plates)),
      bubbleVsPlates: area(bubbleR, rect(plates)),
      queueInside: inside(rect(queue)),
      bubbleInside: bubble ? inside(bubbleR) : true,
      seatInside: seat ? inside(rect(seat)) : true,
      replayHit: hit(replay),
      serveHit: hit(serve),
    };
  });
}

for (const vp of [
  { width: 390, height: 844, now: 72, wait: 46, face: 48 },
  { width: 320, height: 568, now: 46, wait: 34, face: 36 },
  { width: 844, height: 390, now: 88, wait: 56, face: 40 },
  { width: 667, height: 375, now: 54, wait: 34, face: 40 },
  { width: 568, height: 320, now: 50, wait: 36, face: 36 },
]) {
  test(`${vp.width}×${vp.height}：門口排隊與吃的時候的座位不搶點、不壓多多`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
    const queue = page.locator("[data-customer-queue]");
    await expect(queue).toBeVisible();
    await expect(queue.locator("li")).toHaveCount(4);
    await page.evaluate(() => window.scrollTo(0, 0));
    // 泡泡進場是 340ms 的 scale。量太早會把頭像量小，小喇叭也還在往上落到排隊旁邊。
    await expect.poll(async () => (await layout(page)).faceW, { timeout: 2000 }).toBeGreaterThanOrEqual(vp.face);
    await page.waitForFunction(() => {
      const el = document.querySelector("[class*='bubbleWrap']");
      return !!el && el.getAnimations().every((anim) => anim.playState === "finished");
    });
    const ordering = await layout(page);
    expect(ordering.queueHidden).toBe("true");
    expect(ordering.queuePE).toBe("none");
    expect(ordering.queueButtons).toBe(0);
    expect(ordering.items[0]?.state).toBe("next");
    expect(ordering.items.slice(1).every((item) => item.state === "wait")).toBe(true);
    expect(ordering.items.map((item) => item.id)).not.toContain(ordering.bubbleId);
    expect(ordering.nowW).toBeGreaterThanOrEqual(vp.now);
    expect(ordering.minWait).toBeGreaterThanOrEqual(vp.wait);
    expect(ordering.minWait).toBeLessThan(ordering.nowW);
    expect(ordering.faceW).toBeGreaterThanOrEqual(vp.face);
    expect(ordering.ringIn).toBe(true);
    expect(ordering.nowVsDuo).toBe(0);
    expect(ordering.queueVsDuo).toBe(0);
    expect(ordering.queueVsBubble).toBe(0);
    expect(ordering.queueVsBadge).toBe(0);
    expect(ordering.queueVsHeader).toBe(0);
    expect(ordering.bubbleVsPlates).toBe(0);
    expect(ordering.queueInside).toBe(true);
    expect(ordering.bubbleInside).toBe(true);
    expect(ordering.replayHit).toBe("再聽一次");

    await serve(page, 1);
    await expect(page.locator("[data-customer-seat]")).toBeVisible();
    await expect(page.getByRole("img", { name: /^第 1 單/ })).toHaveCount(0);
    await page.getByRole("button", { name: "暫停遊戲" }).click();
    const eating = await layout(page);
    expect(eating.seatPE).toBe("none");
    expect(eating.seatVsDuo).toBe(0);
    expect(eating.seatVsPlates).toBe(0);
    expect(eating.seatH).toBeGreaterThanOrEqual(eating.duoH * 0.5);
    expect(eating.seatInside).toBe(true);
    expect(eating.nowVsDuo).toBe(0);
    expect(eating.seatId).toBe(ordering.bubbleId);
    expect(eating.items.map((item) => item.id)).toEqual(ordering.items.map((item) => item.id));
    expect(eating.items.map((item) => item.id)).not.toContain(eating.seatId);
    expect(eating.serveHit).not.toBe("");
    expect(eating.serveHit).not.toContain("排隊");
    const serveBtn = page.getByRole("button", { name: "給多多吃" });
    const serveBox = (await serveBtn.boundingBox())!;
    const top = await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.closest("button")?.textContent ?? "",
      { x: serveBox.x + serveBox.width / 2, y: serveBox.y + 24 },
    );
    expect(top).toContain("給多多吃");

    await page.getByRole("button", { name: "繼續遊戲" }).click();
    await waitServed(page, 1);
    const next = await layout(page);
    expect(next.items).toHaveLength(3);
    expect(next.items[0]?.state).toBe("next");
    expect(next.items.every((item) => item.state !== "done" && !item.hasCheck)).toBe(true);
    expect(next.items.map((item) => item.id)).not.toContain(eating.seatId);
    expect(next.items.map((item) => item.id)).not.toContain(next.bubbleId);
    expect(next.bubbleInside).toBe(true);
    expect(next.bubbleVsPlates).toBe(0);
  });
}

test("自由做沒有排隊，也沒有客人座位", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: "自由做" }).click();
  await expect(page.getByRole("button", { name: "多多吃飽了" })).toBeVisible();
  await expect(page.locator("[data-customer-queue]")).toHaveCount(0);
  await expect(page.locator("[data-customer-seat]")).toHaveCount(0);
});

test("減少動態時，座位上的愛心不跳", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/dino-sushi");
  await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
  await serve(page, 1);
  const heart = page.locator("[data-customer-seat] svg").first();
  await expect(heart).toBeVisible();
  await expect(heart).toHaveCSS("animation-name", "none");
});

for (const vp of [
  { width: 320, height: 568 },
  { width: 568, height: 320 },
  { width: 667, height: 375 },
  { width: 844, height: 390 },
]) {
  test(`${vp.width}×${vp.height}：第 5 單泡泡仍在舞台內、不壓疊盤`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto("/games/dino-sushi");
    await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
    for (let n = 1; n <= 4; n++) {
      await serve(page, n);
      await waitServed(page, n);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(async () => (await layout(page)).faceW, { timeout: 2000 }).toBeGreaterThanOrEqual(36);
    const geo = await layout(page);
    expect(geo.items).toHaveLength(0);
    expect(geo.bubbleId).not.toBe("");
    expect(geo.items.map((item) => item.id)).not.toContain(geo.bubbleId);
    expect(geo.bubbleInside).toBe(true);
    await serve(page, 5);
    await expect(page.locator("[data-customer-seat]")).toBeVisible();
    await page.getByRole("button", { name: "暫停遊戲" }).click();
    const eating = await layout(page);
    expect(eating.seatId).toBe(geo.bubbleId);
    expect(eating.items.map((item) => item.id)).not.toContain(eating.seatId);
    expect(geo.bubbleVsPlates).toBe(0);
    expect(geo.faceW).toBeGreaterThanOrEqual(36);
  });
}
