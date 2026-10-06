import { expect, test, type Page } from "@playwright/test";

const MOBILE = { width: 390, height: 844 };
const NARROW_WIDTHS = [320, 375, 390, 430];

async function openColoringCanvas(page: Page) {
  await page.goto("/games/coloring-book");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "打開著色本" }).click();
  await page.getByRole("button", { name: /^著色：/ }).first().click();
  await page.waitForSelector("canvas");
  await page.waitForFunction(
    () => !document.body.textContent?.includes("載入線稿中"),
  );
}

async function playHintMove(page: Page) {
  const board = page.getByTestId("candy-match-board");
  const hints = page.locator('[data-testid="candy-match-board"] button[data-hint="true"]');
  let hintCount = 0;
  for (let frame = 0; frame < 90; frame += 1) {
    if ((await page.getByTestId("candy-match-result").count()) > 0) return;
    // 結算 overlay 可能在上一個 poll 後同一個 frame 才掛上；
    // force 只避免背後按鈕被 overlay 擋住，下一輪立即以 result test id 收斂。
    await page.getByRole("button", { name: /提示/ }).click({ force: true });
    hintCount = await hints.count();
    if (hintCount === 2) break;
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
  }
  expect(hintCount).toBe(2);
  const labels = await hints.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("aria-label")),
  );
  expect(labels[0]).toBeTruthy();
  expect(labels[1]).toBeTruthy();
  const before = await board
    .locator("button")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label")).join("|"));

  await page.getByRole("button", { name: labels[0]!, exact: true }).click({ force: true });
  await page.getByRole("button", { name: labels[1]!, exact: true }).click({ force: true });

  // 提示步一定合法，但不一定推進目前的收集色；等盤面變動且棋盤恢復可操作
  await expect
    .poll(
      async () => {
        if ((await page.getByTestId("candy-match-result").count()) > 0) return "done";
        if ((await board.getAttribute("aria-disabled")) === "true") return "working";
        const now = await board
          .locator("button")
          .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label")).join("|"));
        return now !== before ? "settled" : "working";
      },
      { timeout: 5_000 },
    )
    .toMatch(/done|settled/);
}

// 新版關卡目標較大（首關收集 50 個），以目標導向提示逐步完成
async function finishCandyLevel(page: Page) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if ((await page.getByTestId("candy-match-result").count()) > 0) return;
    await playHintMove(page);
  }
  await expect(page.getByRole("dialog", { name: /任務完成/ })).toBeVisible();
}

async function topOutBlock(page: Page) {
  for (let i = 0; i < 120; i += 1) {
    if ((await page.locator('[data-status="over"]').count()) > 0) return;
    await page.keyboard.press("Space");
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
  }
  await expect(page.locator('[data-status="over"]')).toBeVisible();
}

test.describe("遊戲完整 lifecycle", () => {
  test("Candy：開始 → 正確操作 → 完成 → replay 新盤面 → 再完成 → 回地圖", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/games/candy-match");
    await page.getByRole("button", { name: /開始冒險/ }).click();
    // 地圖大卡的開始鈕；下一站用 data-next 定位（aria-label＝「開始：第 N 站 地名」）
    await page.locator('button[data-next="true"]').click();
    await expect(page.getByTestId("candy-match-board")).toBeVisible();
    const firstChallenge = await page.locator("[data-challenge]").getAttribute("data-challenge");
    expect(firstChallenge).toBeTruthy();

    const firstBoard = await page
      .locator('[data-testid="candy-match-board"] button')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label")));
    await finishCandyLevel(page);
    await expect(page.getByRole("button", { name: "再挑戰" })).toBeVisible();
    // 結算面列出本局星星條件與累積獎章
    await expect(page.getByRole("list", { name: "本局星星條件" })).toBeVisible();

    // 已通關後重玩：抽同等難度的變體，不再是第一次的教學主線
    await page.getByRole("button", { name: "再挑戰" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByTestId("candy-match-board")).toBeVisible();
    const replayChallenge = await page.locator("[data-challenge]").getAttribute("data-challenge");
    expect(replayChallenge).toBeTruthy();
    expect(replayChallenge).not.toBe(firstChallenge);
    const replayBoard = await page
      .locator('[data-testid="candy-match-board"] button')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label")));
    expect(replayBoard).not.toEqual(firstBoard);

    await finishCandyLevel(page);
    await page.getByRole("button", { name: "回地圖" }).click();
    await expect(page.getByText("遊樂園地圖")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("第 1 關交換教學：點錯還在，換成功才收", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/games/candy-match");
    await page.getByRole("button", { name: /開始冒險/ }).click();
    await page.locator("button[data-next='true']").click();
    const teach = page.locator("[data-teach='true']");
    await expect(teach).toHaveCount(2);
    const ids = await teach.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-cell")),
    );
    await page
      .locator("[data-testid='candy-match-board'] button")
      .filter({ hasNot: page.locator("[data-teach='true']") })
      .first()
      .click();
    await expect(teach).toHaveCount(2);
    await page.locator(`[data-cell="${ids[0]}"]`).click();
    await page.locator(`[data-cell="${ids[1]}"]`).click();
    await expect(teach).toHaveCount(0);
  });

  test("390×664 地圖第一屏有下一站，第 2 關棋子至少 56px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/games/candy-match");
    await page.getByRole("button", { name: /開始冒險/ }).click();
    await expect(page.getByTestId("candy-match-map")).toBeVisible();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    const next = page.locator("button[data-next='true']");
    await expect(next).toBeVisible();
    const nextBox = await next.boundingBox();
    expect(nextBox).toBeTruthy();
    expect(nextBox!.y).toBeGreaterThanOrEqual(0);
    expect(nextBox!.y + nextBox!.height).toBeLessThanOrEqual(664);
    const lockedIcon = page.locator("[data-locked='true'] img").first();
    await expect(lockedIcon).toHaveCSS("opacity", "1");
    await expect(lockedIcon).toHaveCSS("filter", "none");

    await next.click();
    await expect(page.getByTestId("candy-match-board").locator("button")).toHaveCount(36);
    await finishCandyLevel(page);
    await page.getByRole("button", { name: "下一站" }).click();
    const board = page.getByTestId("candy-match-board");
    await expect(board.locator("button")).toHaveCount(36);
    await expect.poll(async () => page.evaluate(() => {
      const el = document.querySelector('[data-testid="candy-match-board"]') as HTMLElement | null;
      const wrap = el?.parentElement;
      if (!el || !wrap) return 99;
      return el.getBoundingClientRect().right - wrap.getBoundingClientRect().right;
    })).toBeLessThanOrEqual(1);
    const fit = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="candy-match-board"]') as HTMLElement | null;
      const wrap = el?.parentElement;
      const btn = el?.querySelector("button");
      if (!el || !wrap || !btn) return null;
      const br = el.getBoundingClientRect();
      const wr = wrap.getBoundingClientRect();
      const task = document.querySelector('[aria-label="本關任務進度"]')?.getBoundingClientRect();
      const hint = document.querySelector('button[aria-label="提示"]')?.getBoundingClientRect();
      return {
        cell: btn.getBoundingClientRect().width,
        clip: br.right - wr.right,
        taskBottom: task?.bottom ?? 9999,
        hintBottom: hint?.bottom ?? 9999,
      };
    });
    expect(fit).toBeTruthy();
    expect(fit!.cell).toBeGreaterThanOrEqual(56);
    expect(fit!.clip).toBeLessThanOrEqual(1);
    expect(fit!.taskBottom).toBeLessThanOrEqual(664);
    expect(fit!.hintBottom).toBeLessThanOrEqual(664);
  });

  test("360×740 夜間第 2 關棋子至少 48px 且不裁切", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("cheche:progress", JSON.stringify({ preferences: { theme: "night" } }));
    });
    await page.setViewportSize({ width: 360, height: 740 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/games/candy-match");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
    await page.getByRole("button", { name: /開始冒險/ }).click();
    await page.locator("button[data-next='true']").click();
    await finishCandyLevel(page);
    await page.getByRole("button", { name: "下一站" }).click();
    await expect.poll(async () => page.evaluate(() => {
      const el = document.querySelector('[data-testid="candy-match-board"]') as HTMLElement | null;
      const wrap = el?.parentElement;
      if (!el || !wrap) return 99;
      return el.getBoundingClientRect().right - wrap.getBoundingClientRect().right;
    })).toBeLessThanOrEqual(1);
    const fit = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="candy-match-board"]') as HTMLElement | null;
      const wrap = el?.parentElement;
      const btn = el?.querySelector("button");
      if (!el || !wrap || !btn) return null;
      const br = el.getBoundingClientRect();
      const wr = wrap.getBoundingClientRect();
      return { cell: btn.getBoundingClientRect().width, clip: br.right - wr.right };
    });
    expect(fit).toBeTruthy();
    expect(fit!.cell).toBeGreaterThanOrEqual(48);
    expect(fit!.clip).toBeLessThanOrEqual(1);
  });

  test("棋盤逐步變大：1–2 關 36 格、3–5 關 42 格、6–10 關 48 格，連續通關每關都存獎章", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/games/candy-match");
    await page.getByRole("button", { name: /開始冒險/ }).click();
    await page.locator('button[data-next="true"]').click();
    await expect(page.getByTestId("candy-match-board").locator("button")).toHaveCount(36);
    await finishCandyLevel(page);
    await page.getByRole("button", { name: "下一站" }).click();
    await expect(page.getByTestId("candy-match-board").locator("button")).toHaveCount(36);
    await finishCandyLevel(page);
    // 回歸：View 內直接開下一局也要重置結算去重，兩關都要存到獎章
    const medals = await page.evaluate(
      () => JSON.parse(localStorage.getItem("cheche:progress") ?? "{}").gameProfile?.medals?.["candy-match"] ?? [],
    );
    expect(medals[0]).toBeGreaterThan(0);
    expect(medals[1]).toBeGreaterThan(0);
    await page.getByRole("button", { name: "下一站" }).click();
    await expect(page.getByTestId("candy-match-board").locator("button")).toHaveCount(42);

    await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("cheche:progress") ?? "{}");
      raw.gameProfile.medals["candy-match"] = [1, 1, 1, 1, 1];
      localStorage.setItem("cheche:progress", JSON.stringify(raw));
    });
    await page.reload();
    await page.getByRole("button", { name: /開始冒險/ }).click();
    await page.locator('button[data-next="true"]').click();
    await expect(page.getByTestId("candy-match-board").locator("button")).toHaveCount(48);
  });

  test("Candy 地圖：玩法切換沿用、鎖住的站說明前一站、道具先預覽可取消", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/games/candy-match");
    await page.getByRole("button", { name: /開始冒險/ }).click();
    await page.getByRole("radio", { name: /挑戰冒險/ }).click();
    await expect(page.getByRole("radio", { name: /挑戰冒險/ })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("candy-match-map")).toContainText("步");
    // aria-disabled 仍可點（點了會說明要先完成哪一站），Playwright 視為停用需 force
    await page.getByRole("button", { name: /第 3 站 冰淇淋小店（未解鎖）/ }).click({ force: true });
    await expect(page.getByRole("status").filter({ hasText: "先完成第 1 站" })).toBeVisible();

    await page.reload();
    await page.getByRole("button", { name: /開始冒險/ }).click();
    await expect(page.getByRole("radio", { name: /挑戰冒險/ })).toHaveAttribute("aria-checked", "true");
    await page.locator('button[data-next="true"]').click();
    await expect(page.getByLabel(/還有 \d+ 步/)).toBeVisible();

    const board = page.getByTestId("candy-match-board");
    await page.getByRole("button", { name: /^掃把/ }).click();
    await board.locator("button").nth(14).hover();
    await expect(board.locator("button[data-preview='true']")).toHaveCount(6);
    await page.getByRole("button", { name: "取消" }).click();
    await expect(board.locator("button[data-preview='true']")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^掃把/ })).toHaveAttribute("aria-label", /還有 1 個/);
  });

  test("Block Drop：開始 → gameplay → game over → replay → 再次 gameplay → 離開", async ({ page }) => {
    await page.goto("/games/block-drop");
    await page.getByRole("button", { name: "自由堆疊" }).click();
    await expect(page.locator('[data-status="playing"]')).toBeVisible();
    const tutorial = page.getByTestId("block-drop-tutorial");
    await expect(tutorial).toHaveAttribute("data-step", "move");
    await page.keyboard.press("ArrowLeft");
    await expect(tutorial).toHaveAttribute("data-step", "rotate");
    await page.keyboard.press("ArrowUp");
    await expect(tutorial).toHaveCount(0);
    await topOutBlock(page);
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByRole("button", { name: "再玩一次" }).click();
    await expect(page.locator('[data-status="playing"]')).toBeVisible();
    await expect(page.getByTestId("block-drop-tutorial")).toHaveCount(0);
    await topOutBlock(page);
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByRole("dialog").getByRole("link", { name: "回遊樂園" }).click();
    await expect(page).toHaveURL(/\/games$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("Coloring：選頁 → 畫布 → 完成 → 再塗 → 再完成 → 換一張並離開", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await openColoringCanvas(page);
    await expect(page.getByRole("button", { name: "我塗好了" })).toHaveCount(0);
    await expect(page.getByTestId("coloring-open-hint")).toHaveAttribute("data-step", "draw");
    const box = await page.locator("canvas").boundingBox();
    if (!box) throw new Error("canvas boundingBox 不存在");
    const y = box.y + box.height * 0.55;
    await page.mouse.move(box.x + box.width * 0.5, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.56, y);
    await page.mouse.up();
    await expect(page.getByRole("button", { name: "我塗好了" })).toBeVisible();

    await page.getByRole("button", { name: "我塗好了" }).click();
    await expect(page.getByRole("dialog", { name: "塗好了！" })).toBeVisible();
    await page.getByRole("button", { name: "再塗這一張" }).click();
    await expect(page.getByRole("dialog", { name: "塗好了！" })).toHaveCount(0);

    await page.getByRole("button", { name: "我塗好了" }).click();
    await expect(page.getByRole("dialog", { name: "塗好了！" })).toBeVisible();
    await page.getByRole("button", { name: "換一張塗" }).click();
    await expect(page.getByText("選一頁來塗")).toBeVisible();

    // G-M7：唯一出口＝抬頭「← 回遊樂園」（回封面已拿掉）
    await page.getByRole("link", { name: /回遊樂園/ }).click();
    await expect(page).toHaveURL(/\/games$/);
  });
});

test.describe("遊戲第二輪 P2 mobile regression", () => {
  test("Candy 標題在 320–430px 都完整可見", async ({ page }) => {
    for (const width of NARROW_WIDTHS) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/games/candy-match");
      const title = page.getByRole("heading", { name: "車車消消樂" });
      await expect(title).toBeVisible();
      await expect(title).toContainText("車車消消樂");
      await expect(title).toHaveCSS("white-space", "normal");
    }
  });

  test("Block ready 只呈現開始，難度與模式只在齒輪設定裡", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/games/block-drop");
    await expect(page.getByRole("button", { name: /開始/ })).toBeVisible();
    // ready 面不再有難度／模式 radio（兒童減法審：孩子讀不懂，家長走齒輪）
    await expect(page.getByRole("radio")).toHaveCount(0);
    await page.getByRole("button", { name: "遊戲設定" }).click();
    await expect(page.getByRole("radiogroup", { name: "方塊轉轉難度" })).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "方塊轉轉特殊模式" })).toBeVisible();
  });

  test("Coloring mobile toolbar 可橫向探索、保留 active tool 與 44px touch target", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await openColoringCanvas(page);
    const toolbar = page.getByRole("toolbar", { name: "著色工具" });
    await expect(toolbar).toBeVisible();
    const scrollState = await toolbar.evaluate((node) => ({
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
    }));
    expect(scrollState.scrollWidth).toBeGreaterThan(scrollState.clientWidth);
    const bucket = page.getByRole("button", { name: "填滿" });
    await bucket.click();
    await expect(bucket).toHaveAttribute("aria-pressed", "true");
    await expect(bucket).toHaveCSS("min-height", "44px");

    await page.setViewportSize({ width: 844, height: 390 });
    await expect(toolbar).toBeVisible();
    await expect(page.getByRole("button", { name: "我塗好了" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "填滿" })).toBeVisible();
  });
});
