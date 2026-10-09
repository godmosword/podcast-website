import { expect, test, type Page } from "@playwright/test";
import { COLORING_PALETTE } from "../lib/coloring/tools";
import { BACKGROUNDS } from "../scripts/lib/coloring-reference-overrides";

/**
 * 著色本 P0 防回歸：線稿 line.png 為不透明白底 RGB，
 * 合成若非 multiply，塗色會被白底整層蓋住（2026-07 曾發生）。
 * 以像素驗證「塗了要看得到」。
 */

async function openColoringPage(page: Page, name: RegExp) {
  await page.goto("/games/coloring-book");
  await page.waitForLoadState("networkidle"); // 等 hydration，點擊才有 handler
  await page.getByRole("button", { name: "開始塗", exact: true }).click();
  const card = page.getByRole("button", { name }).first();
  await card.click();
  await expect(card).toHaveAttribute("data-revealed", "true");
  await expect(page.locator("canvas")).toHaveCount(0);
  await card.click();
  await page.waitForSelector("canvas");
  await page.waitForFunction(
    () => !document.body.textContent?.includes("載入線稿中"),
  );
}

async function openFirstColoringPage(page: Page) {
  await openColoringPage(page, /^著色：/);
}

async function openAdultTools(page: Page) {
  const gate = page.getByRole("button", { name: "家長工具", exact: true });
  await gate.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "家長工具" })).toBeVisible();
}

/** 統計 display canvas 一段水平列上的紅色像素數。 */
async function countRedOnRow(page: Page, fx0: number, fx1: number, fy: number) {
  return page.evaluate(
    ([x0f, x1f, yf]) => {
      const canvas = document.querySelector("canvas");
      if (!canvas) return -1;
      const ctx = canvas.getContext("2d");
      if (!ctx) return -1;
      const y = Math.round(canvas.height * yf!);
      const x0 = Math.round(canvas.width * x0f!);
      const x1 = Math.round(canvas.width * x1f!);
      const row = ctx.getImageData(x0, y, x1 - x0, 1).data;
      let red = 0;
      for (let i = 0; i < row.length; i += 4) {
        if (row[i]! > 180 && row[i + 1]! < 140 && row[i + 2]! < 140) red += 1;
      }
      return red;
    },
    [fx0, fx1, fy],
  );
}

test.describe("coloring book", () => {
  test("蠟筆塗色在畫面上可見（multiply 合成）且可復原", async ({ page }) => {
    await openFirstColoringPage(page);

    const box = await page.locator("canvas").boundingBox();
    if (!box) throw new Error("canvas boundingBox 不存在");
    const y = box.y + box.height * 0.55;
    await page.mouse.move(box.x + box.width * 0.5, y);
    await page.mouse.down();
    for (let i = 0; i <= 10; i += 1) {
      await page.mouse.move(box.x + box.width * (0.5 + 0.012 * i), y);
    }
    await page.mouse.up();

    expect(await countRedOnRow(page, 0.5, 0.62, 0.55)).toBeGreaterThan(0);
    await expect(page.getByTestId("coloring-open-hint")).toHaveAttribute(
      "data-step",
      "fill",
    );
    await expect(page.getByRole("button", { name: "我塗好了" })).toBeVisible();

    await page.getByRole("button", { name: "復原" }).click();
    expect(await countRedOnRow(page, 0.5, 0.62, 0.55)).toBe(0);
  });

  /** 油漆桶點外底：外框可上色，但不得灌進主體中心（輪廓閉合防漏色）。 */
  async function bucketExteriorStaysOut(page: Page, pickerName: RegExp) {
    await openColoringPage(page, pickerName);
    await page.getByRole("button", { name: "填滿" }).click();

    const box = await page.locator("canvas").boundingBox();
    if (!box) throw new Error("canvas boundingBox 不存在");
    // 點左上外底（避開邊界 margin），中心應保持未上色
    await page.mouse.click(box.x + box.width * 0.04, box.y + box.height * 0.04);
    await page.waitForTimeout(300);
    expect(await countRedOnRow(page, 0.45, 0.55, 0.5)).toBe(0);
  }

  /** G-L3：蠟筆自動不出線——從外底起筆拖進主體中心，中心那一列不該有紅。 */
  test("蠟筆從外底拖進主體，不會塗出線（character 頁）", async ({ page }) => {
    await openColoringPage(page, /^著色：恐龍車多多$/);
    await openAdultTools(page);
    await page.getByRole("button", { name: "筆刷粗" }).click();
    await page.getByRole("button", { name: "關閉", exact: true }).click();
    const box = await page.locator("canvas").boundingBox();
    if (!box) throw new Error("canvas boundingBox 不存在");
    const from = { x: box.x + box.width * 0.04, y: box.y + box.height * 0.04 };
    const to = { x: box.x + box.width * 0.5, y: box.y + box.height * 0.5 };
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    for (let i = 1; i <= 30; i += 1) {
      await page.mouse.move(
        from.x + ((to.x - from.x) * i) / 30,
        from.y + ((to.y - from.y) * i) / 30,
      );
    }
    await page.mouse.up();
    await page.waitForTimeout(200);
    // 起筆區（外底）有塗到
    expect(await countRedOnRow(page, 0.02, 0.1, 0.04)).toBeGreaterThan(0);
    // 主體中心沒被塗到
    expect(await countRedOnRow(page, 0.45, 0.55, 0.5)).toBe(0);
  });

  test("油漆桶點外底不灌進主體（character 頁）", async ({ page }) => {
    await bucketExteriorStaysOut(page, /^著色：恐龍車多多$/);
  });

  test("油漆桶點外底不灌進主體（scene 頁）", async ({ page }) => {
    await bucketExteriorStaysOut(page, /^著色：恐龍車多多的大黃牙$/);
  });

  test("工具列具備筆刷三檔，縮放還原只在放大後出現", async ({ page }) => {
    await openFirstColoringPage(page);
    await expect(page.getByTestId("coloring-open-hint")).toHaveAttribute(
      "data-step",
      "draw",
    );
    await expect(page.getByRole("button", { name: "我塗好了" })).toHaveCount(0);
    await openAdultTools(page);
    for (const name of ["筆刷細", "筆刷中", "筆刷粗"]) {
      const sizeBtn = page.getByRole("button", { name });
      await expect(sizeBtn).toBeVisible();
      await expect(sizeBtn).not.toHaveText(name.replace("筆刷", ""));
    }
    await page.getByRole("button", { name: "關閉", exact: true }).click();
    await expect(page.getByRole("button", { name: "蠟筆" })).toContainText(
      "蠟筆",
    );
    await expect(
      page.getByRole("button", { name: "蠟筆" }).locator("svg"),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "縮放還原" })).toHaveCount(0);
  });

  async function paintCrayonStroke(page: Page) {
    const box = await page.locator("canvas").boundingBox();
    if (!box) throw new Error("canvas boundingBox 不存在");
    const y = box.y + box.height * 0.55;
    await page.mouse.move(box.x + box.width * 0.5, y);
    await page.mouse.down();
    for (let i = 0; i <= 10; i += 1) {
      await page.mouse.move(box.x + box.width * (0.5 + 0.012 * i), y);
    }
    await page.mouse.up();
  }

  /** 完成面快照 img 上的紅色像素數。 */
  async function countRedInDoneSnapshot(page: Page) {
    return page.evaluate(async () => {
      const img = document.querySelector(
        '[data-testid="coloring-done-snapshot"]',
      ) as HTMLImageElement | null;
      if (!img) return -1;
      if (img.naturalWidth === 0) await img.decode();
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w <= 0 || h <= 0) return -1;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return -1;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, w, h).data;
      let red = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i]! > 180 && data[i + 1]! < 140 && data[i + 2]! < 140)
          red += 1;
      }
      return red;
    });
  }

  test("390×664：完成面顯示作品快照且行動鈕在視窗內", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await openFirstColoringPage(page);
    await paintCrayonStroke(page);
    await page.getByRole("button", { name: "我塗好了" }).click();
    await expect(page.getByRole("dialog", { name: "塗好了！" })).toBeVisible();
    const snapshot = page.getByTestId("coloring-done-snapshot");
    await expect(snapshot).toBeVisible();
    expect(await countRedInDoneSnapshot(page)).toBeGreaterThan(0);

    const changePage = page.getByRole("button", { name: "換一張塗" });
    const replay = page.getByRole("button", { name: "再塗這一張" });
    for (const btn of [changePage, replay]) {
      const box = await btn.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(664);
    }
    expect(
      await page.evaluate(() => document.scrollingElement?.scrollTop ?? 0),
    ).toBe(0);
  });

  test("390×400：矮視窗完成面不顯示快照", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 400 });
    await openFirstColoringPage(page);
    const canvas = page.locator("canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("canvas boundingBox 不存在");
    const start = { x: box.x + box.width * 0.5, y: box.y + box.height * 0.5 };
    const end = { x: start.x + 16, y: start.y };
    const pointer = {
      bubbles: true,
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
    };
    await canvas.dispatchEvent("pointerdown", {
      ...pointer,
      clientX: start.x,
      clientY: start.y,
      buttons: 1,
    });
    await canvas.dispatchEvent("pointermove", {
      ...pointer,
      clientX: end.x,
      clientY: end.y,
      buttons: 1,
    });
    await canvas.dispatchEvent("pointerup", {
      ...pointer,
      clientX: end.x,
      clientY: end.y,
      buttons: 0,
    });
    await page.getByRole("button", { name: "我塗好了" }).click();
    await expect(page.getByRole("dialog", { name: "塗好了！" })).toBeVisible();
    await expect(page.getByTestId("coloring-done-snapshot")).toBeHidden();
  });

  test("我塗好了打開完成站，可再塗這一張", async ({ page }) => {
    await openFirstColoringPage(page);
    await paintCrayonStroke(page);
    await page.getByRole("button", { name: "我塗好了" }).click();
    await expect(page.getByRole("dialog", { name: "塗好了！" })).toBeVisible();
    await page.getByRole("button", { name: "再塗這一張" }).click();
    await expect(page.getByRole("dialog", { name: "塗好了！" })).toHaveCount(0);
    await expect(page.locator("canvas")).toBeVisible();
  });

  /** K-10：下載圖是加了品牌邊框的版本——比 1024 作品高（底部品牌列）且寬高不等。 */
  test("下載的作品帶品牌邊框", async ({ page }) => {
    await openFirstColoringPage(page);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      (async () => {
        await openAdultTools(page);
        await page.getByRole("button", { name: "下載", exact: true }).click();
      })(),
    ]);
    const stream = await download.createReadStream();
    const head = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (c: Buffer) => {
        chunks.push(c);
        if (Buffer.concat(chunks).length >= 24) {
          stream.destroy();
          resolve(Buffer.concat(chunks));
        }
      });
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });
    // PNG IHDR：寬在 offset 16、高在 offset 20（big-endian）
    const width = head.readUInt32BE(16);
    const height = head.readUInt32BE(20);
    expect(width).toBeGreaterThan(1024);
    expect(height).toBeGreaterThan(width);
  });

  /** G-H3：畫布在視野內時，色盤與工具列不用捲動就搆得到（sticky 底欄／桌機右欄）。 */
  for (const vp of [
    { name: "390×664 手機", width: 390, height: 664 },
    { name: "1280×800 桌機", width: 1280, height: 800 },
  ]) {
    test(`${vp.name}：畫布可見時色盤與工具列 elementFromPoint 可命中`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await openFirstColoringPage(page);
      const hit = await page.evaluate(() => {
        const canvas = document
          .querySelector("canvas")!
          .getBoundingClientRect();
        const probe = (el: Element | null) => {
          if (!el) return false;
          const r = el.getBoundingClientRect();
          if (r.top < 0 || r.bottom > innerHeight) return false;
          const at = document.elementFromPoint(
            r.x + r.width / 2,
            r.y + r.height / 2,
          );
          return at === el || el.contains(at);
        };
        return {
          canvasVisible: canvas.top < innerHeight && canvas.bottom > 0,
          swatch: probe(document.querySelector('[role="option"]')),
          tool: probe(document.querySelector('button[aria-label="填滿"]')),
        };
      });
      expect(hit).toEqual({ canvasVisible: true, swatch: true, tool: true });
    });
  }
});

test.describe("coloring book 參考彩圖", () => {
  const selectedSwatch = (page: Page) =>
    page.locator('[role="option"][aria-selected="true"]');
  /** 猛猛彩圖左緣中段是背景，顏色照 BACKGROUNDS。 */
  const backgroundName = COLORING_PALETTE.find(
    (s) => s.id === BACKGROUNDS["char-猛猛"],
  )!.name;

  test("桌機：點彩圖直接換色，拿橡皮擦時換回蠟筆", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openColoringPage(page, /^著色：猛猛$/);
    await page.getByRole("button", { name: "擦掉", exact: true }).click();
    const figure = page.getByRole("button", { name: /參考彩圖，點一下拿顏色/ });
    const box = (await figure.boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.04, box.y + box.height * 0.5);
    await expect(selectedSwatch(page)).toHaveAttribute("aria-label", backgroundName);
    await expect(page.getByText(`換成${backgroundName}了`)).toBeVisible();
    await expect(page.getByRole("button", { name: "蠟筆", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("手機：點小圖放大到畫布上，點顏色後回去塗", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openColoringPage(page, /^著色：猛猛$/);
    await page.getByRole("button", { name: /參考彩圖，點一下拿顏色/ }).click();
    const peek = page.getByRole("group", { name: "猛猛參考彩圖" });
    await expect(peek).toBeVisible();
    const image = page.getByRole("button", { name: "點彩圖上的顏色，回去塗" });
    const box = (await image.boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.04, box.y + box.height * 0.5);
    await expect(peek).toHaveCount(0);
    await expect(selectedSwatch(page)).toHaveAttribute("aria-label", backgroundName);
  });

  test("放大圖可用 Esc 關閉", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openColoringPage(page, /^著色：猛猛$/);
    await page.getByRole("button", { name: /參考彩圖，點一下拿顏色/ }).click();
    await expect(page.getByRole("button", { name: "回去塗", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("group", { name: "猛猛參考彩圖" })).toHaveCount(0);
  });
});

test.describe("coloring book 離開提醒與塗過標記", () => {
  /** 用填滿點畫布左上角（背景）塗一塊。 */
  async function paintBackground(page: Page) {
    await page.getByRole("button", { name: "填滿", exact: true }).click();
    await page.locator("canvas").click({ position: { x: 6, y: 6 } });
    await expect(page.getByRole("button", { name: "我塗好了" })).toBeVisible();
  }

  test("塗了沒收就按換一張：先問，繼續塗留在原地，收起來才回選頁", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openColoringPage(page, /^著色：猛猛$/);
    await paintBackground(page);
    await page.getByRole("button", { name: "換一張", exact: true }).click();
    const sheet = page.getByRole("alertdialog", { name: "要換地方嗎" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("button", { name: "繼續塗" })).toBeFocused();
    await sheet.getByRole("button", { name: "繼續塗" }).click();
    await expect(sheet).toHaveCount(0);
    await expect(page.locator("canvas")).toBeVisible();

    await page.getByRole("button", { name: "換一張", exact: true }).click();
    await sheet.getByRole("button", { name: /收起來/ }).click();
    await expect(page.getByText("選一頁來塗", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "看作品：猛猛", exact: true })).toBeVisible();
  });

  test("按回遊樂園選收起來：存好作品再離開，回來那頁貼了塗過", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openColoringPage(page, /^著色：猛猛$/);
    await paintBackground(page);
    await page.getByRole("link", { name: /回遊樂園/ }).click();
    const sheet = page.getByRole("alertdialog", { name: "要換地方嗎" });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: /收起來/ }).click();
    await expect(page).toHaveURL(/\/games$/);

    await page.goto("/games/coloring-book");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "開始塗", exact: true }).click();
    await expect(page.getByRole("button", { name: "看作品：猛猛", exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "著色：猛猛", exact: true }),
    ).toHaveAccessibleDescription("塗過");
    await expect(
      page.getByRole("button", { name: "著色：噗噗豬", exact: true }),
    ).not.toHaveAccessibleDescription("塗過");
  });

  test("沒塗也要再確認才離開；塗好了從完成面換頁不再問一次", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openColoringPage(page, /^著色：猛猛$/);
    await page.getByRole("button", { name: "換一張", exact: true }).click();
    const sheet = page.getByRole("alertdialog", { name: "要換地方嗎" });
    await expect(sheet).toBeVisible();
    await expect(page.getByText("選一頁來塗", { exact: true })).toHaveCount(0);
    await sheet.getByRole("button", { name: "換一張", exact: true }).click();
    await expect(page.getByText("選一頁來塗", { exact: true })).toBeVisible();

    const again = page.getByRole("button", { name: "著色：猛猛", exact: true });
    await again.click();
    await again.click();
    await paintBackground(page);
    await page.getByRole("button", { name: "我塗好了" }).click();
    await expect(page.getByText("作品已收藏在這台裝置", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "換一張塗", exact: true }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page.getByText("選一頁來塗", { exact: true })).toBeVisible();
  });

  for (const vp of [
    { width: 320, height: 568 },
    { width: 390, height: 664 },
  ]) {
    test(`${vp.width}×${vp.height}：畫布中心沒被黏底色盤蓋住`, async ({ page }) => {
      await page.setViewportSize(vp);
      await openFirstColoringPage(page);
      const hitsCanvas = await page.evaluate(() => {
        const canvas = document.querySelector("canvas")!;
        const r = canvas.getBoundingClientRect();
        const y = r.top + r.height / 2;
        if (y < 0 || y > innerHeight) return false;
        return document.elementFromPoint(r.left + r.width / 2, y) === canvas;
      });
      expect(hitsCanvas).toBe(true);
    });
  }

  for (const vp of [
    { width: 390, height: 844 },
    { width: 505, height: 896 },
    { width: 320, height: 568 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 844, height: 390 },
    { width: 1280, height: 800 },
  ]) {
    test(`${vp.width}×${vp.height}：畫布和全部顏色不用捲動就看得到`, async ({ page }) => {
      await page.setViewportSize(vp);
      await openFirstColoringPage(page);
      const fit = await page.evaluate(() => {
        const canvas = document.querySelector("canvas")!.getBoundingClientRect();
        const controls = document
          .querySelector("[data-testid='coloring-controls']")!
          .getBoundingClientRect();
        const swatches = [...document.querySelectorAll('[role="option"]')].map((el) =>
          el.getBoundingClientRect(),
        );
        const doc = document.scrollingElement!;
        const hit = (x: number, y: number) => document.elementFromPoint(x, y);
        const bottomHit = hit(canvas.left + canvas.width / 2, Math.min(canvas.bottom - 2, window.innerHeight - 1));
        const separated =
          canvas.right <= controls.left + 1 ||
          controls.right <= canvas.left + 1 ||
          canvas.bottom <= controls.top + 1 ||
          controls.bottom <= canvas.top + 1;
        return {
          noScroll: doc.scrollHeight <= doc.clientHeight + 1,
          noHorizontal: doc.scrollWidth <= doc.clientWidth + 1,
          canvasInView: canvas.top >= 0 && canvas.bottom <= window.innerHeight + 1,
          canvasClearOfControls: separated,
          bottomIsCanvas: bottomHit === document.querySelector("canvas"),
          swatchCount: swatches.length,
          swatchesInView: swatches.every(
            (r) =>
              r.top >= -1 &&
              r.bottom <= window.innerHeight + 1 &&
              r.left >= -1 &&
              r.right <= window.innerWidth + 1 &&
              r.width >= 48 &&
              r.height >= 48,
          ),
        };
      });
      expect(fit).toEqual({
        noScroll: true,
        noHorizontal: true,
        canvasInView: true,
        canvasClearOfControls: true,
        bottomIsCanvas: true,
        swatchCount: 12,
        swatchesInView: true,
      });
      const back = await page.getByRole("link", { name: "回遊樂園", exact: true }).boundingBox();
      const swap = await page.getByRole("button", { name: "換一張", exact: true }).boundingBox();
      expect(swap!.x).toBeGreaterThan(back!.x + back!.width + 48);
    });
  }
});

