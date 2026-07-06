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
        const oceanIsland = page.getByRole("button", { name: /未來園區，規劃中/ });

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
    const zoomIn = page.getByRole("button", { name: "放大地圖" });
    const zoomOut = page.getByRole("button", { name: "縮小地圖" });
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
