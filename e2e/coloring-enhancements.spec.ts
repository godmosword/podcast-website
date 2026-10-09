import { test, expect, type Page } from "@playwright/test";
const DUO = "char-恐龍車多多",
  RED = "char-小紅賽車";
async function open(page: Page, id = DUO) {
  await page.goto(`/games/coloring-book?page=${encodeURIComponent(id)}`);
  await expect(
    page.getByRole("button", { name: "蠟筆", exact: true }),
  ).toBeEnabled();
}
async function stroke(page: Page) {
  const c = page.locator("canvas"),
    b = await c.boundingBox();
  if (!b) throw Error("missing canvas");
  await page.mouse.move(b.x + b.width * 0.04, b.y + b.height * 0.04);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.13, b.y + b.height * 0.04, {
    steps: 10,
  });
  await page.mouse.up();
}
async function redPixels(page: Page) {
  return page.locator("canvas").evaluate((c) => {
    const el = c as HTMLCanvasElement,
      p = el.getContext("2d")!.getImageData(0, 0, el.width, el.height).data;
    let n = 0;
    for (let i = 0; i < p.length; i += 4)
      if (p[i]! > 180 && p[i + 1]! < 140 && p[i + 2]! < 140) n++;
    return n;
  });
}
async function more(page: Page) {
  const gate = page.getByRole("button", { name: "家長工具", exact: true });
  await gate.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "更多著色工具" })).toBeVisible();
}
async function closeMore(page: Page) {
  await page.getByRole("button", { name: "關閉", exact: true }).click();
}
async function clearPaint(page: Page) {
  await more(page);
  await page.getByRole("button", { name: "清空", exact: true }).click();
  await page.getByRole("button", { name: "清空畫布", exact: true }).click();
}
/** 離開前先問。有顏色就收起來再走，進度留在作品裡。 */
async function keepOnLeave(page: Page) {
  const sheet = page.getByRole("alertdialog", { name: "要換地方嗎" });
  await expect(sheet).toBeVisible();
  await sheet.getByRole("button", { name: /收起來/ }).click();
}

test("unfinished paint asks first and is kept when leaving; a confirmed page stays in the collection", async ({
  page,
}) => {
  await open(page);
  await stroke(page);
  expect(await redPixels(page)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "換一張", exact: true }).click();
  const stay = page.getByRole("alertdialog", { name: "要換地方嗎" });
  await expect(stay.getByRole("button", { name: "繼續塗", exact: true })).toBeFocused();
  await stay.getByRole("button", { name: "繼續塗", exact: true }).click();
  await expect(stay).toHaveCount(0);
  await page.getByRole("button", { name: "換一張", exact: true }).click();
  await keepOnLeave(page);
  await expect(page.getByText("選一頁來塗", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "看作品：恐龍車多多", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /繼續塗/ })).toHaveCount(0);
  await page
    .getByRole("button", { name: "著色：恐龍車多多", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "蠟筆", exact: true }),
  ).toBeEnabled();
  expect(await redPixels(page)).toBe(0);
  await stroke(page);
  await page.getByRole("button", { name: "我塗好了" }).click();
  await expect(
    page.getByText("作品已收藏在這台裝置", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "換一張塗", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "看作品：恐龍車多多", exact: true }),
  ).toHaveCount(2);
  await page.goto("/games/coloring-book");
  await page.getByRole("button", { name: "開始塗", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "看作品：恐龍車多多", exact: true }),
  ).toHaveCount(2);
  await expect(page.getByRole("button", { name: /繼續塗/ })).toHaveCount(0);
});

test("leaving for the hub asks first, then keeps unfinished paint in the gallery", async ({ page }) => {
  await open(page);
  await stroke(page);
  expect(await redPixels(page)).toBeGreaterThan(0);
  await page.getByRole("link", { name: "回遊樂園", exact: true }).click();
  await keepOnLeave(page);
  await expect(page).toHaveURL(/\/games$/);
  await page.goto("/games/coloring-book");
  await page.getByRole("button", { name: "開始塗", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "看作品：恐龍車多多", exact: true }),
  ).toBeVisible();
  await open(page);
  expect(await redPixels(page)).toBe(0);
});

test("undo, redo, clear, restore, and new strokes preserve history and nonempty completion", async ({
  page,
}) => {
  await open(page);
  await stroke(page);
  const before = await redPixels(page);
  await page.getByRole("button", { name: "復原", exact: true }).click();
  expect(await redPixels(page)).toBe(0);
  await expect(page.getByRole("button", { name: "我塗好了" })).toHaveCount(0);
  await more(page);
  await page.getByRole("button", { name: "↪ 重做", exact: true }).click();
  await closeMore(page);
  expect(await redPixels(page)).toBe(before);
  await clearPaint(page);
  expect(await redPixels(page)).toBe(0);
  await page.getByRole("button", { name: "復原", exact: true }).click();
  expect(await redPixels(page)).toBe(before);
  await page.getByRole("button", { name: "復原", exact: true }).click();
  await stroke(page);
  await more(page);
  await expect(
    page.getByRole("button", { name: "↪ 重做", exact: true }),
  ).toBeDisabled();
});

test("bucket-only painting enables completion and clearing removes it", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: "填滿", exact: true }).click();
  const b = await page.locator("canvas").boundingBox();
  await page.mouse.click(b!.x + b!.width * 0.04, b!.y + b!.height * 0.04);
  await expect(page.getByRole("button", { name: "我塗好了" })).toBeVisible();
  await clearPaint(page);
  await expect(page.getByRole("button", { name: "我塗好了" })).toHaveCount(0);
});

test("same-page completed artworks coexist after a fresh start and open independently", async ({
  page,
}) => {
  await open(page, RED);
  await stroke(page);
  await page.getByRole("button", { name: "我塗好了" }).click();
  await expect(
    page.getByText("作品已收藏在這台裝置", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "開新稿", exact: true }).click();
  expect(await redPixels(page)).toBe(0);
  await page.getByRole("option", { name: "藍色", exact: true }).click();
  await stroke(page);
  await page.getByRole("button", { name: "我塗好了" }).click();
  await expect(
    page.getByText("作品已收藏在這台裝置", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "看這個故事", exact: true }),
  ).toHaveAttribute("href", "/story/ep-3");
  await page.getByRole("button", { name: "換一張塗", exact: true }).click();
  const cards = page.getByRole("button", {
    name: "看作品：小紅賽車",
    exact: true,
  });
  await expect(cards).toHaveCount(2);
  await cards.last().click();
  await expect(page.getByRole("dialog", { name: "收藏作品" })).toBeVisible();
  await expect(page.getByAltText("小紅賽車完成作品")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(cards.last()).toBeFocused();
});

test("deleting one completed artwork asks first and persists", async ({
  page,
}) => {
  await open(page, RED);
  await stroke(page);
  await page.getByRole("button", { name: "我塗好了" }).click();
  await expect(
    page.getByText("作品已收藏在這台裝置", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "換一張塗", exact: true }).click();
  const card = page.getByRole("button", {
    name: "看作品：小紅賽車",
    exact: true,
  });
  await card.click();
  const dialog = page.getByRole("dialog", { name: "收藏作品" });
  await dialog.getByRole("button", { name: "刪除這份收藏", exact: true }).click();
  await dialog.getByRole("button", { name: "保留作品", exact: true }).click();
  await expect(card).toHaveCount(1);
  await dialog.getByRole("button", { name: "刪除這份收藏", exact: true }).click();
  await dialog.getByRole("button", { name: "確認刪除", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(card).toHaveCount(0);
  await expect(page.getByText("選一頁來塗", { exact: true })).toBeFocused();
  await expect(page.getByRole("button", { name: /繼續塗/ })).toHaveCount(0);
  // The picker loads lists asynchronously, so count the stores directly.
  const stored = await page.evaluate(
    () =>
      new Promise<number[]>((resolve, reject) => {
        const req = indexedDB.open("coloring-drafts");
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction(["artworks", "artwork-previews"]);
          const counts = [
            tx.objectStore("artworks").count(),
            tx.objectStore("artwork-previews").count(),
          ];
          tx.oncomplete = () => {
            db.close();
            resolve(counts.map((r) => r.result));
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
  expect(stored).toEqual([0, 0]);
  await page.goto("/games/coloring-book");
  await page.getByRole("button", { name: "開始塗", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "看作品：小紅賽車", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: /繼續塗/ })).toHaveCount(0);
});

test("load failure offers retry and unavailable storage never reports success", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/coloring/char-*/line.png", (route) =>
    fail ? route.abort() : route.continue(),
  );
  await page.goto(`/games/coloring-book?page=${encodeURIComponent(DUO)}`);
  await expect(
    page.getByRole("button", { name: "重試", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "蠟筆", exact: true }),
  ).toBeDisabled();
  fail = false;
  await page.getByRole("button", { name: "重試", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "蠟筆", exact: true }),
  ).toBeEnabled();
  await page.addInitScript(() =>
    Object.defineProperty(window, "indexedDB", { value: undefined }),
  );
  await open(page);
  await stroke(page);
  await page.getByRole("button", { name: "換一張", exact: true }).click();
  // 存不了時「收起來」要說沒收好、留在原地，不能假裝成功。
  const sheet = page.getByRole("alertdialog", { name: "要換地方嗎" });
  await sheet.getByRole("button", { name: /收起來/ }).click();
  await expect(sheet.getByText("沒收好，再按一次試試。")).toBeVisible();
  await expect(page.getByText("選一頁來塗", { exact: true })).toHaveCount(0);
  await sheet.getByRole("button", { name: "不要了", exact: true }).click();
  await expect(page.getByText("選一頁來塗", { exact: true })).toBeVisible();
  await expect(page.getByText(/草稿沒有存起來/)).toHaveCount(0);
  await page
    .getByRole("button", { name: "著色：恐龍車多多", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "蠟筆", exact: true }),
  ).toBeEnabled();
  await stroke(page);
  await page.getByRole("button", { name: "我塗好了" }).click();
  await expect(page.getByText(/作品尚未收藏/)).toBeVisible();
});

for (const width of [320, 390, 430])
  test(`${width}px: primary tools visible, more panel traps focus and does not paint`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 664 });
    await open(page);
    for (const name of ["蠟筆", "填滿", "擦掉", "復原"]) {
      const box = await page
        .getByRole("button", { name, exact: true })
        .boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      expect(box!.width).toBeGreaterThanOrEqual(48);
      expect(box!.height).toBeGreaterThanOrEqual(48);
    }
    const gate = page.getByRole("button", { name: "家長工具", exact: true });
    await gate.click();
    await expect(page.getByRole("dialog", { name: "更多著色工具" })).toHaveCount(0);
    await more(page);
    await page.keyboard.press("Shift+Tab");
    await expect(
      page.getByRole("dialog", { name: "更多著色工具" }),
    ).toContainText("自由塗");
    await page.keyboard.press("Escape");
    await expect(gate).toBeFocused();
    expect(await redPixels(page)).toBe(0);
  });

test("pinch cancels the first finger's dot, zoom reset preserves paint", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const canvas = page.locator("canvas"),
    b = await canvas.boundingBox();
  const p = { bubbles: true, pointerType: "touch", button: 0, buttons: 1 };
  await canvas.dispatchEvent("pointerdown", {
    ...p,
    pointerId: 1,
    clientX: b!.x + 30,
    clientY: b!.y + 30,
  });
  await canvas.dispatchEvent("pointerdown", {
    ...p,
    pointerId: 2,
    clientX: b!.x + 130,
    clientY: b!.y + 30,
  });
  await canvas.dispatchEvent("pointermove", {
    ...p,
    pointerId: 2,
    clientX: b!.x + 230,
    clientY: b!.y + 30,
  });
  await canvas.dispatchEvent("pointerup", {
    ...p,
    buttons: 0,
    pointerId: 2,
    clientX: b!.x + 230,
    clientY: b!.y + 30,
  });
  await canvas.dispatchEvent("pointerup", {
    ...p,
    buttons: 0,
    pointerId: 1,
    clientX: b!.x + 30,
    clientY: b!.y + 30,
  });
  // 畫布在下一個 animation frame 合成；等待取消筆觸的結果顯示。
  await expect.poll(() => redPixels(page)).toBe(0);
  await more(page);
  await expect(
    page.getByRole("button", { name: "縮放還原", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "縮放還原", exact: true }).click();
  await expect(canvas).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
});

test("share falls back to PNG download and print contains the full artwork on A4", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { value: () => false });
    document.addEventListener("DOMContentLoaded", () =>
      new MutationObserver(() => {
        for (const frame of document.querySelectorAll<HTMLIFrameElement>(
          'iframe[title="作品列印"]',
        ))
          if (frame.contentWindow) frame.contentWindow.print = () => {};
      }).observe(document.body, { childList: true, subtree: true }),
    );
  });
  await open(page);
  await stroke(page);
  await page.getByRole("button", { name: "我塗好了" }).click();
  await expect(
    page.getByText("作品已收藏在這台裝置", { exact: true }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "分享作品", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.png$/);
  await page.getByRole("button", { name: "列印作品", exact: true }).click();
  const img = page.frameLocator('iframe[title="作品列印"]').locator("img");
  await expect(img).toBeAttached();
  await expect
    .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
    .toBe(true);
  await expect(img).toHaveCSS("object-fit", "contain");
  expect(
    await page
      .frameLocator('iframe[title="作品列印"]')
      .locator("style")
      .evaluate((el) => el.textContent),
  ).toContain("size:A4 portrait");
});

async function seedOldDraft(page: Page, corrupt = false) {
  await page.goto("/games");
  await page.evaluate(
    async ({ id, corrupt }) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1024;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#e85d4c";
      ctx.fillRect(24, 24, 100, 24);
      const blob = corrupt
        ? new Blob(["broken png"], { type: "image/png" })
        : await new Promise<Blob>((resolve) =>
            canvas.toBlob((b) => resolve(b!), "image/png"),
          );
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const r = indexedDB.open("coloring-drafts", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("drafts");
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
      await new Promise<void>((resolve, reject) => {
        const t = db.transaction("drafts", "readwrite");
        t.objectStore("drafts").put(blob, `${id}@r2`);
        t.oncomplete = () => resolve();
        t.onabort = () => reject(t.error);
      });
      db.close();
    },
    { id: DUO, corrupt },
  );
}

test("an old unfinished draft is not resumed and the stored blob stays put", async ({
  page,
}) => {
  await seedOldDraft(page);
  await page.goto(`/games/coloring-book?page=${encodeURIComponent(DUO)}`);
  await expect(
    page.getByRole("button", { name: "蠟筆", exact: true }),
  ).toBeEnabled();
  expect(await redPixels(page)).toBe(0);
  await expect(page.getByRole("button", { name: /繼續塗/ })).toHaveCount(0);
  const preserved = await page.evaluate(async (id) => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open("coloring-drafts", 2);
      r.onsuccess = () => resolve(r.result);
    });
    const b = await new Promise<Blob>((resolve) => {
      const r = db.transaction("drafts").objectStore("drafts").get(`${id}@r2`);
      r.onsuccess = () => resolve(r.result);
    });
    db.close();
    return b.size;
  }, DUO);
  expect(preserved).toBeGreaterThan(0);
});

test("a corrupt old draft does not block a fresh page", async ({ page }) => {
  await seedOldDraft(page, true);
  await page.goto(`/games/coloring-book?page=${encodeURIComponent(DUO)}`);
  await expect(
    page.getByRole("button", { name: "蠟筆", exact: true }),
  ).toBeEnabled();
  expect(await redPixels(page)).toBe(0);
  await expect(page.getByText(/草稿暫時讀不到/)).toHaveCount(0);
});

test("completed collection failure still offers download and does not claim success", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args) {
      if (this.name === "artworks")
        throw new DOMException("full", "QuotaExceededError");
      return original.apply(this, args);
    };
  });
  await open(page);
  await stroke(page);
  await page.getByRole("button", { name: "我塗好了" }).click();
  await expect(
    page.getByText("作品尚未收藏，請下載保存，或重試收藏。", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "存圖片", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByText("作品已收藏在這台裝置", { exact: true }),
  ).toHaveCount(0);
});

test("native sharing passes the created PNG and cancelled sharing does not download", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { value: () => true });
    Object.defineProperty(navigator, "share", {
      value: async (data: ShareData) => {
        (
          window as unknown as {
            shared: { name: string; type: string; size: number };
          }
        ).shared = {
          name: data.files![0]!.name,
          type: data.files![0]!.type,
          size: data.files![0]!.size,
        };
        throw new DOMException("cancelled", "AbortError");
      },
    });
  });
  await open(page);
  await stroke(page);
  await page.getByRole("button", { name: "我塗好了" }).click();
  await expect(
    page.getByText("作品已收藏在這台裝置", { exact: true }),
  ).toBeVisible();
  let downloaded = false;
  page.on("download", () => {
    downloaded = true;
  });
  await page.getByRole("button", { name: "分享作品", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { shared?: { type: string } }).shared?.type,
      ),
    )
    .toBe("image/png");
  expect(downloaded).toBe(false);
});

test("invalid direct page links fall back to the picker", async ({ page }) => {
  await page.goto("/games/coloring-book?page=missing-page");
  await expect(
    page.getByText("這一頁暫時找不到，選另一頁來塗吧。", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "著色：恐龍車多多", exact: true }),
  ).toBeVisible();
});
