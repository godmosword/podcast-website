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
  const progress = page.getByRole("progressbar", { name: "任務完成度" });
  const before = Number(await progress.getAttribute("aria-valuenow"));
  const hints = page.locator('[data-testid="candy-match-board"] button[data-hint="true"]');
  let hintCount = 0;
  for (let frame = 0; frame < 90; frame += 1) {
    if ((await page.getByTestId("candy-match-result").count()) > 0) return;
    // 結算 overlay 可能在上一個 progress poll 後同一個 frame 才掛上；
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

  await page.getByRole("button", { name: labels[0]!, exact: true }).click({ force: true });
  await page.getByRole("button", { name: labels[1]!, exact: true }).click({ force: true });

  await expect
    .poll(
      async () => {
        if ((await page.getByTestId("candy-match-result").count()) > 0) return "done";
        const now = Number(await progress.getAttribute("aria-valuenow"));
        return now > before ? "progress" : "working";
      },
      { timeout: 5_000 },
    )
    .toMatch(/done|progress/);
}

async function finishCandyLevel(page: Page) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
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
    await page.getByRole("button", { name: /開始/ }).click();
    await page.getByRole("button", { name: "下一關" }).click();
    await expect(page.getByTestId("candy-match-board")).toBeVisible();

    const firstBoard = await page
      .locator('[data-testid="candy-match-board"] button')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label")));
    await finishCandyLevel(page);
    await expect(page.getByRole("button", { name: "再玩這一關" })).toBeVisible();

    await page.getByRole("button", { name: "再玩這一關" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByTestId("candy-match-board")).toBeVisible();
    const replayBoard = await page
      .locator('[data-testid="candy-match-board"] button')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label")));
    expect(replayBoard).not.toEqual(firstBoard);

    await finishCandyLevel(page);
    await page.getByRole("button", { name: "回地圖" }).click();
    await expect(page.getByText("遊樂園地圖")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("Block Drop：開始 → gameplay → game over → replay → 再次 gameplay → 離開", async ({ page }) => {
    await page.goto("/games/block-drop");
    await page.getByRole("button", { name: /開始/ }).click();
    await expect(page.locator('[data-status="playing"]')).toBeVisible();
    await topOutBlock(page);
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByRole("button", { name: "再玩一次" }).click();
    await expect(page.locator('[data-status="playing"]')).toBeVisible();
    await topOutBlock(page);
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByRole("dialog").getByRole("link", { name: "回遊樂園" }).click();
    await expect(page).toHaveURL(/\/games$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("Coloring：選頁 → 畫布 → 完成 → 再塗 → 再完成 → 換一張並離開", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await openColoringCanvas(page);
    await expect(page.getByRole("button", { name: "我塗好了" })).toBeVisible();

    await page.getByRole("button", { name: "我塗好了" }).click();
    await expect(page.getByRole("dialog", { name: "塗好了！" })).toBeVisible();
    await page.getByRole("button", { name: "再塗這一張" }).click();
    await expect(page.getByRole("dialog", { name: "塗好了！" })).toHaveCount(0);

    await page.getByRole("button", { name: "我塗好了" }).click();
    await expect(page.getByRole("dialog", { name: "塗好了！" })).toBeVisible();
    await page.getByRole("button", { name: "換一張塗" }).click();
    await expect(page.getByText("選一頁來塗")).toBeVisible();

    await page.getByRole("button", { name: "回封面" }).click();
    await expect(page.getByRole("button", { name: "打開著色本" })).toBeVisible();
  });
});

test.describe("遊戲第二輪 P2 mobile regression", () => {
  test("Candy 標題在 320–430px 都完整可見", async ({ page }) => {
    for (const width of NARROW_WIDTHS) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/games/candy-match");
      const title = page.getByRole("heading", { name: "繽紛消消樂" });
      await expect(title).toBeVisible();
      await expect(title).toContainText("繽紛消消樂");
      await expect(title).toHaveCSS("white-space", "normal");
    }
  });

  test("Block ready 先呈現開始，難度與模式收進 secondary settings", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/games/block-drop");
    const options = page.getByTestId("block-drop-ready-options");
    await expect(options).toBeVisible();
    await expect(options).not.toHaveAttribute("open", "");
    await expect(page.getByRole("button", { name: /開始/ })).toBeVisible();
    await options.locator("summary").click();
    await expect(options).toHaveAttribute("open", "");
    await expect(options.getByRole("radio").first()).toBeVisible();
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
    const bucket = page.getByRole("button", { name: "油漆桶" });
    await bucket.click();
    await expect(bucket).toHaveAttribute("aria-pressed", "true");
    await expect(bucket).toHaveCSS("min-height", "44px");

    await page.setViewportSize({ width: 844, height: 390 });
    await expect(toolbar).toBeVisible();
    await expect(page.getByRole("button", { name: "我塗好了" })).toBeVisible();
  });
});
