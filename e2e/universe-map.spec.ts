import { expect, type Locator, type Page, test } from "@playwright/test";

type ThemeMode = "light" | "night";

async function openMap(page: Page, theme: ThemeMode, width = 1280, height = 800) {
  await page.setViewportSize({ width, height });
  await page.addInitScript((mode) => {
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

async function waitForStableStageTransform(page: Page) {
  let previous = await stageTransformParts(page);
  await expect
    .poll(async () => {
      await page.waitForTimeout(50);
      const current = await stageTransformParts(page);
      const maxDelta = Math.max(
        Math.abs(current.tx - previous.tx),
        Math.abs(current.ty - previous.ty),
        Math.abs(current.scale - previous.scale),
      );
      previous = current;
      return maxDelta;
    })
    .toBeLessThan(0.001);
  return previous;
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

        const dinoWatch = page.getByRole("button", { name: /恐龍島看看/ });
        const forestIsland = page.getByRole("button", { name: /森林小島，建造中/ });
        const rescueWatch = page.getByRole("button", { name: /英雄救援隊看看/ });
        const oceanIsland = page.getByRole("button", { name: /未來夢想島，規劃中/ });

        expect(
          (await visibleImageTop(forestIsland)) - (await labelBottom(dinoWatch)),
        ).toBeGreaterThanOrEqual(16);
        expect(
          (await visibleImageTop(oceanIsland)) - (await labelBottom(rescueWatch)),
        ).toBeGreaterThanOrEqual(16);
      });
    }
  }

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

  test("開放車車樂園第一次點擊只聚焦，第二次才開 sheet 且不二次 fly", async ({ page }) => {
    await openMap(page, "light");
    const carPark = page.getByRole("button", { name: /車車樂園，開放中/ });
    const dialog = page.getByRole("dialog");

    await carPark.click();
    await expect(dialog).toHaveCount(0);
    await expect
      .poll(async () => (await stageTransformParts(page)).scale)
      .toBeCloseTo(1.6, 1);
    await expect(dialog).toHaveCount(0);
    const afterFirstClick = await waitForStableStageTransform(page);

    await carPark.click();
    await expect(dialog).toBeVisible({ timeout: 3000 });
    await expect(dialog).toContainText("車車樂園");
    expectTransformClose(await stageTransformParts(page), afterFirstClick);
  });

  test("deep link ?zone=dino 開 sheet，關閉後移除 query（與點擊語意等價）", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => {
      window.sessionStorage.setItem("cc-universe-entry-played", "1");
    });
    await page.goto("/adventures?zone=dino");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 3000 });
    await expect(dialog).toContainText("恐龍島");
    expect(new URL(page.url()).searchParams.get("zone")).toBe("dino");

    // 鏡頭真的飛到目標島（FOCUS_SCALE=1.6），而非停在 car-park fit（≈0.9）。
    await expect
      .poll(async () => scaleFromTransform(await stageTransform(page)))
      .toBeCloseTo(1.6, 1);

    await dialog.getByRole("button", { name: /關閉/ }).click();
    await expect(dialog).toHaveCount(0);
    await expect
      .poll(() => new URL(page.url()).searchParams.get("zone"))
      .toBeNull();
  });

  test("關閉 sheet 後同一 mount 內再進同深連結，可再開（門閂重置）", async ({ page }) => {
    await openMap(page, "light");

    // 站內第二次深連結：Next App Router 會同步 history.pushState 的 search params。
    await page.evaluate(() => {
      window.history.pushState(null, "", "/adventures?zone=dino");
    });
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 3000 });
    await dialog.getByRole("button", { name: /關閉/ }).click();
    await expect(dialog).toHaveCount(0);
    // 等 closeSheet 的 router.replace 落地，避免與下一次 pushState 競態。
    await expect
      .poll(() => new URL(page.url()).searchParams.get("zone"))
      .toBeNull();

    await page.evaluate(() => {
      window.history.pushState(null, "", "/adventures?zone=dino");
    });
    await expect(dialog).toBeVisible({ timeout: 3000 });
    await expect(dialog).toContainText("恐龍島");
  });

  test("首訪帶 ?zone= 跳過進場動畫，鏡頭不被拉回車庫", async ({ page }) => {
    // 不預寫 entry-played：驗證 deep link 入場會自行抑制進場降落動畫。
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/adventures?zone=dino");

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

  test("roamer 點擊打招呼，島內 roamer 不觸發島 sheet", async ({ page }) => {
    await openMap(page, "light");

    await page.locator('[data-roamer-id="roam-xiaohong"]').dispatchEvent("click");
    await expect(page.locator('[data-roamer-id="roam-xiaohong"]')).toHaveAttribute(
      "data-greet",
      "true",
    );
    await expect(page.getByText("嗨！我是小紅賽車！")).toBeVisible();

    await page.locator('[data-roamer-id="roam-aku"]').dispatchEvent("click");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
