import { expect, type Locator, type Page, test } from "@playwright/test";

type ThemeMode = "light" | "night";

async function openMap(page: Page, theme: ThemeMode, width = 1280, height = 800) {
  await page.setViewportSize({ width, height });
  await page.addInitScript((mode) => {
    window.sessionStorage.removeItem("cc-universe-tap-hint-shown");
    window.sessionStorage.setItem("cc-universe-entry-played", "1");
    window.localStorage.setItem(
      "cheche:progress",
      JSON.stringify({ preferences: { theme: mode } }),
    );
  }, theme);
  await page.goto("/adventures");
  await expect(page.getByRole("region", { name: "車車宇宙樂園地圖" })).toBeVisible();
  await expect(page.getByRole("application", { name: /車車樂園互動地圖/ })).toBeVisible();
  await page.waitForTimeout(250);
}

async function assertLockedIslandChildFirstScreen(dialog: Locator) {
  await expect(dialog.getByText("恐龍島在長大")).toBeVisible();
  await expect(dialog.getByRole("link", { name: "去聽車車故事" })).toHaveAttribute(
    "href",
    /\/stories/,
  );
  const parentToggle = dialog.getByRole("button", { name: "給爸爸媽媽" });
  await expect(parentToggle).toBeVisible();
  await expect(parentToggle).toHaveAttribute("aria-expanded", "false");
  await expect(dialog.getByText(/恐龍島還在蓋/)).not.toBeVisible();
}

async function assertLockedIslandParentExpanded(dialog: Locator) {
  await expect(dialog.getByText(/恐龍島還在蓋/)).toBeVisible();
  await expect(dialog.getByLabel("建造進度")).toBeVisible();
  await expect(dialog.getByRole("link", { name: "回故事屋" })).toHaveAttribute(
    "href",
    /\/stories/,
  );
}

async function stageTransform(page: Page) {
  return page.evaluate(() => {
    const stage = [...document.querySelectorAll<HTMLDivElement>("div")].find(
      (el) =>
        el.style.width === "1000px" &&
        el.style.height === "720px" &&
        el.style.transform.includes("scale"),
    );
    if (!stage) throw new Error("map stage not found");
    return stage.style.transform;
  });
}

type StageTransform = {
  tx: number;
  ty: number;
  scale: number;
};

function parseStageTransform(transform: string): StageTransform {
  const match = transform.match(
    /translate\(([-\d.]+)px, ([-\d.]+)px\) scale\(([-\d.]+)\)/,
  );
  if (!match) throw new Error(`stage transform has unexpected shape: ${transform}`);
  return {
    tx: Number(match[1]),
    ty: Number(match[2]),
    scale: Number(match[3]),
  };
}

async function stageTransformParts(page: Page) {
  return parseStageTransform(await stageTransform(page));
}

function expectTransformClose(actual: StageTransform, expected: StageTransform) {
  expect(actual.tx).toBeCloseTo(expected.tx, 5);
  expect(actual.ty).toBeCloseTo(expected.ty, 5);
  expect(actual.scale).toBeCloseTo(expected.scale, 5);
}

async function labelBottom(locator: Locator) {
  return locator.evaluate((el) => {
    const label = el.closest('span[class*="tileLabel"]');
    if (!label) throw new Error("tile label not found");
    return label.getBoundingClientRect().bottom;
  });
}

async function visibleImageTop(locator: Locator) {
  return locator.evaluate(async (el) => {
    const img = el.querySelector("img");
    if (!img) throw new Error("island image not found");
    if (!img.complete) await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("canvas context not available");
    ctx.drawImage(img, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let top = 0;
    scan: for (; top < canvas.height; top += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        if (pixels[(top * canvas.width + x) * 4 + 3] > 16) break scan;
      }
    }
    const rect = img.getBoundingClientRect();
    return rect.y + (top / canvas.height) * rect.height;
  });
}

function scaleFromTransform(transform: string) {
  const match = transform.match(/scale\(([^)]+)\)/);
  if (!match) throw new Error(`scale missing from ${transform}`);
  return Number(match[1]);
}

async function blankViewportPoint(viewport: Locator) {
  return viewport.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const xs = [0.12, 0.22, 0.78, 0.88, 0.5];
    const ys = [0.14, 0.26, 0.74, 0.86, 0.5];
    for (const y of ys) {
      for (const x of xs) {
        const point = {
          x: rect.left + rect.width * x,
          y: rect.top + rect.height * y,
        };
        const hit = document.elementFromPoint(point.x, point.y);
        if (!hit?.closest("button,[data-roamer-id]")) return point;
      }
    }
    throw new Error("blank sea point not found");
  });
}

test.describe("車車宇宙樂園地圖 UX", () => {
  for (const theme of ["light", "night"] as const) {
    for (const viewport of [
      { width: 375, height: 812 },
      { width: 1280, height: 800 },
    ]) {
      test(`fit 構圖與鎖島 label 淨空：${theme} ${viewport.width}px`, async ({ page }) => {
        await openMap(page, theme, viewport.width, viewport.height);

        if (theme === "night") {
          await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
        }

        const dinoLabel = page
          .locator('span[class*="tileLabel"]')
          .filter({ hasText: "恐龍島" });
        const forestIsland = page.getByRole("button", { name: /森林小島，建造中/ });
        const rescueLabel = page
          .locator('span[class*="tileLabel"]')
          .filter({ hasText: "英雄救援隊" });
        const oceanIsland = page.getByRole("button", { name: /未來夢想島，規劃中/ });

        expect(
          (await visibleImageTop(forestIsland)) - (await labelBottom(dinoLabel)),
        ).toBeGreaterThanOrEqual(16);
        expect(
          (await visibleImageTop(oceanIsland)) - (await labelBottom(rescueLabel)),
        ).toBeGreaterThanOrEqual(16);
      });
    }
  }

  test("手機 fit：五座島 button 皆在首屏可視區", async ({ page }) => {
    await openMap(page, "light", 375, 812);
    const islands = [
      page.getByRole("button", { name: /車車樂園，開放中/ }),
      page.getByRole("button", { name: /恐龍島，建造中/ }),
      page.getByRole("button", { name: /英雄救援隊，即將登場/ }),
      page.getByRole("button", { name: /未來夢想島，規劃中/ }),
      page.getByRole("button", { name: /森林小島，建造中/ }),
    ];
    for (const island of islands) {
      await expect(island).toBeInViewport();
    }
  });

  test("縮放按鈕 disabled、鍵盤、空白海點擊不會 click-zoom", async ({ page }) => {
    await openMap(page, "light");
    const zoomIn = page.getByRole("button", { name: /放大地圖/ });
    const zoomOut = page.getByRole("button", { name: /縮小地圖/ });
    const viewport = page.getByRole("application", { name: /車車樂園互動地圖/ });

    for (let i = 0; i < 24 && (await zoomIn.isEnabled()); i += 1) {
      await zoomIn.click();
    }
    await expect(zoomIn).toBeDisabled();

    for (let i = 0; i < 32 && (await zoomOut.isEnabled()); i += 1) {
      await zoomOut.click();
    }
    await expect(zoomOut).toBeDisabled();

    await viewport.focus();
    const beforeKey = await stageTransform(page);
    await page.keyboard.press("+");
    await expect.poll(() => stageTransform(page)).not.toBe(beforeKey);

    for (let i = 0; i < 5; i += 1) {
      await page.keyboard.press("+");
    }
    const beforeArrow = await stageTransform(page);
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => stageTransform(page)).not.toBe(beforeArrow);

    const beforeClickScale = scaleFromTransform(await stageTransform(page));
    const point = await blankViewportPoint(viewport);
    await page.mouse.click(point.x, point.y);
    await page.waitForTimeout(150);
    expect(scaleFromTransform(await stageTransform(page))).toBeCloseTo(beforeClickScale, 5);
  });

  test("開放車車樂園一次點擊即飛抵並開 sheet（單段式）", async ({ page }) => {
    await openMap(page, "light");
    const carPark = page.getByRole("button", { name: /車車樂園，開放中/ });
    const dialog = page.getByRole("dialog");

    await carPark.click();
    await expect
      .poll(async () => (await stageTransformParts(page)).scale)
      .toBeCloseTo(1.6, 1);
    await expect(dialog).toBeVisible({ timeout: 3000 });
    await expect(dialog).toContainText("車車樂園");
    // sheet 開啟時鏡頭已停在 dock-offset 構圖，不再位移
    const opened = await stageTransformParts(page);
    await page.waitForTimeout(250);
    expectTransformClose(await stageTransformParts(page), opened);
  });

  test("鎖島本體一次點擊也開介紹 sheet（統一點擊語意）", async ({ page }) => {
    await openMap(page, "light");
    await page.getByRole("button", { name: /恐龍島，建造中/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 3000 });
    await expect(dialog).toContainText("恐龍島");
    await assertLockedIslandChildFirstScreen(dialog);

    await dialog.getByRole("button", { name: "給爸爸媽媽" }).click();
    await assertLockedIslandParentExpanded(dialog);
  });

  test("首訪非 deep link 顯示 tap hint，關閉後消失", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => {
      window.sessionStorage.removeItem("cc-universe-tap-hint-shown");
      window.sessionStorage.setItem("cc-universe-entry-played", "1");
    });
    await page.goto("/adventures");
    await expect(page.getByRole("region", { name: "車車宇宙樂園地圖" })).toBeVisible();

    const hint = page.getByRole("status");
    await expect(hint).toContainText("點一座島看看");

    await page.getByRole("button", { name: "關閉提示" }).click();
    await expect(hint).toHaveCount(0);
  });

  test("首訪 tap hint 點島後消失", async ({ page }) => {
    await openMap(page, "light");
    const hint = page.getByRole("status");
    await expect(hint).toContainText("點一座島看看");

    await page.getByRole("button", { name: /車車樂園，開放中/ }).click();
    await expect(hint).toHaveCount(0);
  });

  test("深連結 /adventures/dino 不顯示 tap hint", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => {
      window.sessionStorage.removeItem("cc-universe-tap-hint-shown");
    });
    await page.goto("/adventures/dino");

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole("status")).toHaveCount(0);
  });

  test("把地圖拖到只剩海，鏡頭自動飛回樂園（迷路自救）", async ({ page }) => {
    await openMap(page, "light");
    const viewport = page.getByRole("application", { name: /車車樂園互動地圖/ });
    const zoomIn = page.getByRole("button", { name: /放大地圖/ });

    for (let i = 0; i < 24 && (await zoomIn.isEnabled()); i += 1) {
      await zoomIn.click();
    }
    await viewport.focus();
    for (let i = 0; i < 16; i += 1) {
      await page.keyboard.press("ArrowRight");
    }
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press("ArrowUp");
    }

    // 鏡頭靜止（RECENTER_IDLE_MS）後自動 reset：scale 回到島群 fit（遠小於 MAX_SCALE／FOCUS 1.6）
    await expect
      .poll(async () => (await stageTransformParts(page)).scale, { timeout: 8000 })
      .toBeLessThan(1.4);
    // 而且車車樂園真的回到可視區（不只縮小，還要回中）
    await expect(
      page.getByRole("button", { name: /車車樂園，開放中/ }),
    ).toBeInViewport();
  });

  test("深連結 /adventures/dino 開 overlay，關閉後回到世界地圖", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => {
      window.sessionStorage.setItem("cc-universe-entry-played", "1");
    });
    await page.goto("/adventures/dino");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 3000 });
    await expect(dialog).toContainText("恐龍島");
    expect(new URL(page.url()).pathname).toBe("/adventures/dino");

    // 鏡頭真的飛到目標島（FOCUS_SCALE=1.6），而非停在 car-park fit（≈0.9）。
    await expect
      .poll(async () => scaleFromTransform(await stageTransform(page)))
      .toBeCloseTo(1.6, 1);

    await dialog.getByRole("button", { name: /關閉/ }).click();
    await expect(dialog).toHaveCount(0);
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe("/adventures");
  });

  test("關閉 overlay 後再進同島路徑，可再開（layout 保活）", async ({ page }) => {
    await openMap(page, "light");

    await page.getByRole("button", { name: /恐龍島，建造中/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 3000 });
    await dialog.getByRole("button", { name: /關閉/ }).click();
    await expect(dialog).toHaveCount(0);
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe("/adventures");

    await page.getByRole("button", { name: /恐龍島，建造中/ }).click();
    await expect(dialog).toBeVisible({ timeout: 3000 });
    await expect(dialog).toContainText("恐龍島");
    expect(new URL(page.url()).pathname).toBe("/adventures/dino");
  });

  test("首訪帶島路徑跳過進場動畫，鏡頭不被拉回車庫", async ({ page }) => {
    // 不預寫 entry-played：驗證島路徑入場會自行抑制進場降落動畫。
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/adventures/dino");

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole("dialog")).toContainText("恐龍島");
    expect(
      await page.evaluate(() =>
        window.sessionStorage.getItem("cc-universe-entry-played"),
      ),
    ).toBe("1");
    // 首訪也要真的飛到目標島，不是停在車庫 fit。
    await expect
      .poll(async () => scaleFromTransform(await stageTransform(page)))
      .toBeCloseTo(1.6, 1);
  });

  test("舊 ?zone=dino 永久導向 /adventures/dino", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => {
      window.sessionStorage.setItem("cc-universe-entry-played", "1");
    });
    await page.goto("/adventures?zone=dino");
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe("/adventures/dino");
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 3000 });
  });

  test("島內 roamer 點擊打招呼，且不觸發島 sheet", async ({ page }) => {
    await openMap(page, "light");

    // 海上繞圈漫遊車已移除；改由島內 roamer（恐龍島阿酷）驗證點擊打招呼。
    await page.locator('[data-roamer-id="roam-aku"]').dispatchEvent("click");
    await expect(page.locator('[data-roamer-id="roam-aku"]')).toHaveAttribute(
      "data-greet",
      "true",
    );
    await expect(page.getByText("嗨！我是阿酷鑽地車！")).toBeVisible();
    // roamer 點擊不冒泡到島 button → 不開島 sheet。
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("MAP-UX-P1b：sheet 開啟時拖曳 dimmed 海面不會平移地圖", async ({ page }) => {
    await openMap(page, "light", 375, 812);
    await page.getByRole("button", { name: /車車樂園，開放中/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 3000 });

    const before = await stageTransformParts(page);
    await page.mouse.move(188, 140);
    await page.mouse.down();
    await page.mouse.move(260, 200, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(120);
    expectTransformClose(await stageTransformParts(page), before);
  });

  test("MAP-UX-P1b：點擊 backdrop 可關閉 sheet", async ({ page }) => {
    await openMap(page, "light", 375, 812);
    await page.getByRole("button", { name: /車車樂園，開放中/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 3000 });

    await page.mouse.click(188, 140);
    await expect(dialog).toHaveCount(0);
  });

  test("MAP-UX-P1a：關閉鈕觸控區 ≥44px", async ({ page }) => {
    await openMap(page, "light", 375, 812);
    await page.getByRole("button", { name: /車車樂園，開放中/ }).click();
    const close = page.getByRole("button", { name: "關閉" });
    await expect(close).toBeVisible({ timeout: 3000 });

    const box = await close.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  });

  test("MAP-UX-P2a：reduced-motion 點島即開 sheet", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openMap(page, "light", 375, 812);
    const dialog = page.getByRole("dialog");

    await page.getByRole("button", { name: /車車樂園，開放中/ }).click();
    await expect(dialog).toBeVisible({ timeout: 250 });
    await expect(dialog).toContainText("車車樂園");
  });
});
