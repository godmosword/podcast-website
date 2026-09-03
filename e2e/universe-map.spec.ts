import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  expectHitTestable,
  expectNoOverlap,
  expectWithinViewport,
} from "./overlay-geometry";

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

type LabelGeometry = {
  name: string;
  rect: { left: number; top: number; right: number; bottom: number };
  /** 木牌欄的 z-index（label band）。 */
  z: number;
};

/** 五座島的木牌欄幾何 + 層深，以及所有島身 z 的最大值（畫最前面的島）。 */
async function labelGeometry(page: Page): Promise<{
  labels: LabelGeometry[];
  maxIslandZ: number;
}> {
  return page.evaluate(() => {
    const labels = [
      ...document.querySelectorAll<HTMLElement>('span[class*="tileLabel"]'),
    ].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        name: el.textContent?.replace(/\s+/g, "") ?? "",
        rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom },
        z: Number(el.style.zIndex),
      };
    });
    const maxIslandZ = Math.max(
      ...[...document.querySelectorAll<HTMLElement>('button[class*="islandTile"]')].map(
        (el) => Number(el.style.zIndex),
      ),
    );
    return { labels, maxIslandZ };
  });
}

function rectsOverlap(
  a: LabelGeometry["rect"],
  b: LabelGeometry["rect"],
): boolean {
  return (
    a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
  );
}

function scaleFromTransform(transform: string) {
  const match = transform.match(/scale\(([^)]+)\)/);
  if (!match) throw new Error(`scale missing from ${transform}`);
  return Number(match[1]);
}

async function blankViewportPoint(viewport: Locator) {
  return viewport.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const xs = [0.04, 0.1, 0.18, 0.28, 0.72, 0.82, 0.9, 0.96];
    const ys = [0.06, 0.12, 0.2, 0.8, 0.88, 0.94];
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

/** MapControls 回世界層（具名 aria-label，避免誤點島 tile）。 */
function mapHomeButton(page: Page) {
  return page.getByRole("button", { name: "回樂園（置中車車樂園）" });
}

function zoneSummonHandle(page: Page) {
  return page.getByRole("button", { name: "來這裡逛逛" });
}

/** 島內召喚抽屜 panel（role=region，非 dialog／aria-modal）。 */
function zoneSheetRegion(page: Page, zoneName: string | RegExp) {
  return page.getByRole("region", { name: zoneName });
}

async function waitForIslandReady(page: Page) {
  await expect(zoneSummonHandle(page)).toBeVisible({ timeout: 5000 });
}

async function expandZoneSheet(page: Page) {
  await zoneSummonHandle(page).click();
  await expect(page).toHaveURL(/\/adventures\/[^/?]+(?:\?|$)/);
  await expect(page).toHaveURL(/\?sheet=1/);
  await expect(page.getByRole("button", { name: "關閉" })).toBeVisible();
}

async function collapseZoneSheetByEsc(page: Page) {
  await page.keyboard.press("Escape");
  await expect(page).not.toHaveURL(/\?sheet=1/);
}

async function collapseZoneSheetByClose(page: Page) {
  await page.getByRole("button", { name: "關閉" }).click();
  await expect(page).not.toHaveURL(/\?sheet=1/);
}

test.describe("車車宇宙樂園地圖 UX", () => {
  for (const theme of ["light", "night"] as const) {
    for (const viewport of [
      { width: 375, height: 812 },
      { width: 1280, height: 800 },
    ]) {
      /**
       * 島名木牌可讀性。
       *
       * 舊版比對「後方島的可見圖頂 − 前方島木牌底」≥16px，前提是兩島在螢幕上
       * 垂直相鄰（恐龍島正下方是森林小島）。M0（`02f2a51`）重排座標後森林小島
       * 移到上方中央，該配對失去意義、測試自此長紅（−364px）。
       *
       * 改測真正的不變式：木牌都在視窗內、彼此不重疊、且畫在所有島身之上
       * （原本要防的「木牌被前方島埋掉」由層深保證；band 順序另有單元測試
       * `lib/universe-depth.test.ts`）。
       */
      test(`fit 構圖與島名木牌可讀：${theme} ${viewport.width}px`, async ({ page }) => {
        await openMap(page, theme, viewport.width, viewport.height);

        if (theme === "night") {
          await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
        }

        const frame = (await page
          .getByRole("application", { name: /車車樂園互動地圖/ })
          .boundingBox())!;
        const { labels, maxIslandZ } = await labelGeometry(page);

        expect(labels).toHaveLength(5);

        for (const label of labels) {
          // 垂直方向必須完整可見（上下不裁切）
          expect(label.rect.top, `${label.name} 上緣`).toBeGreaterThanOrEqual(
            frame.y - 1,
          );
          expect(label.rect.bottom, `${label.name} 下緣`).toBeLessThanOrEqual(
            frame.y + frame.height + 1,
          );
          // 橫向：PORTRAIT_MAX_ZOOM=1.15 溫和放大後允許輕微溢出，
          // 木牌仍須大部分可見（不再要求 ≥0.98 全入框）。
          const visibleW =
            Math.min(label.rect.right, frame.x + frame.width) -
            Math.max(label.rect.left, frame.x);
          const ratio = visibleW / (label.rect.right - label.rect.left);
          expect(ratio, `${label.name} 可見比例`).toBeGreaterThanOrEqual(0.85);
          // 木牌永遠畫在最前面的島身之上
          expect(label.z, `${label.name} 層深`).toBeGreaterThan(maxIslandZ);
        }

        // 木牌之間不重疊（真正會讓孩子讀不到島名的情況）
        for (let i = 0; i < labels.length; i += 1) {
          for (let j = i + 1; j < labels.length; j += 1) {
            expect(
              rectsOverlap(labels[i]!.rect, labels[j]!.rect),
              `${labels[i]!.name} 與 ${labels[j]!.name} 木牌重疊`,
            ).toBe(false);
          }
        }
      });
    }
  }

  test("手機世界層顯示底部島選擇列", async ({ page }) => {
    await openMap(page, "light", 375, 812);
    const strip = page.getByTestId("island-picker-strip");
    await expect(strip).toBeVisible();
    await expect(strip.getByRole("button")).toHaveCount(5);
  });

  test("手機 fit：五座島 button 皆在首屏可視區", async ({ page }) => {
    await openMap(page, "light", 375, 812);
    // 限定地圖舞台內的島 button（排除底部 IslandPickerStrip 同名 chip）
    const stage = page.getByRole("application", { name: /車車樂園互動地圖/ });
    const islands = [
      stage.locator('button[data-zone="car-park"]'),
      stage.locator('button[data-zone="dino"]'),
      stage.locator('button[data-zone="rescue"]'),
      stage.locator('button[data-zone="ocean"]'),
      stage.locator('button[data-zone="forest"]'),
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

    for (let i = 0; i < 6 && (await zoomOut.isEnabled()); i += 1) {
      await zoomOut.click();
    }
    const beforeClickScale = scaleFromTransform(await stageTransform(page));
    const point = await blankViewportPoint(viewport);
    await page.mouse.click(point.x, point.y);
    await page.waitForTimeout(150);
    expect(scaleFromTransform(await stageTransform(page))).toBeCloseTo(beforeClickScale, 5);
  });

  test("開放車車樂園一次點擊即飛抵並顯示探索點", async ({ page }) => {
    await openMap(page, "light");
    const carPark = page.locator('button[data-zone="car-park"]');

    await carPark.click();
    await expect
      .poll(async () => (await stageTransformParts(page)).scale)
      .toBeCloseTo(1.6, 1);
    await expect(page).toHaveURL(/\/adventures\/car-park$/);
    await expect(page.locator("[data-hotspot-id]").first()).toBeVisible({
      timeout: 5_000,
    });
    const opened = await stageTransformParts(page);
    await page.waitForTimeout(250);
    expectTransformClose(await stageTransformParts(page), opened);
  });

  test("點島後島真的置中（焦點是島圖中心，不是沙岸錨點）", async ({ page }) => {
    await openMap(page, "light");
    const viewport = page.getByRole("application", { name: /車車樂園互動地圖/ });
    const carPark = page.locator('button[data-zone="car-park"]');

    await carPark.click();
    await expect
      .poll(async () => (await stageTransformParts(page)).scale)
      .toBeCloseTo(1.6, 1);
    await page.waitForTimeout(500);

    const island = (await carPark.boundingBox())!;
    const frame = (await viewport.boundingBox())!;
    const dx =
      island.x + island.width / 2 - (frame.x + frame.width / 2);
    const dy =
      island.y + island.height / 2 - (frame.y + frame.height / 2);

    expect(Math.abs(dx)).toBeLessThan(40);
    expect(Math.abs(dy)).toBeLessThan(60);
    // 島頂不被切出畫面上緣（回歸前 car-park 島頂約在 viewport 上方 117px）
    expect(island.y).toBeGreaterThan(frame.y - 4);
  });

  test("再點一次同一座島＝回樂園（縮回島群全景）", async ({ page }) => {
    await openMap(page, "light");
    const carPark = page.locator('button[data-zone="car-park"]');

    await carPark.click();
    await expect
      .poll(async () => (await stageTransformParts(page)).scale)
      .toBeCloseTo(1.6, 1);
    await expect(page).toHaveURL(/\/adventures\/car-park$/);

    await page.getByRole("button", { name: /車車樂園.*再點一次看整片地圖/ }).click();

    await expect(page).toHaveURL(/\/adventures$/);
    await expect
      .poll(async () => (await stageTransformParts(page)).scale, { timeout: 5000 })
      .toBeLessThan(1.4);
    await expect(carPark).toBeInViewport();
  });

  test("鎖島本體一次點擊飛抵，顯示探索點、無狀態泡泡", async ({ page }) => {
    await openMap(page, "light");
    await page.getByRole("button", { name: /恐龍島/ }).click();
    await expect
      .poll(async () => (await stageTransformParts(page)).scale)
      .toBeCloseTo(1.6, 1);
    await expect(page).toHaveURL(/\/adventures\/dino$/);
    await expect(page.getByText("還在蓋喔！")).toHaveCount(0);
    await expect(page.getByText("建造中")).toHaveCount(0);
    await expect(page.locator("[data-hotspot-id]").first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test("首訪非 deep link 顯示 tap hint，關閉後消失", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => {
      window.sessionStorage.removeItem("cc-universe-tap-hint-shown");
      window.sessionStorage.setItem("cc-universe-entry-played", "1");
    });
    await page.goto("/adventures");
    await expect(page.getByRole("region", { name: "車車宇宙樂園地圖" })).toBeVisible();

    const hint = page.getByTestId("universe-tap-hint");
    // 用最短的穩定子字串，降低下次改文案的脆性
    await expect(hint).toContainText("點一座島");

    await page.getByRole("button", { name: "關閉提示" }).click();
    await expect(hint).toHaveCount(0);
  });

  /**
   * `#universe-map-guide` 是 `aria-describedby` 的目標，也是移除 tapHint
   * `role="status"` 之後 AT 使用者唯一的完整操作說明。
   *
   * 這組存在的理由：`CHANGELOG.md` 已**刻意解除**可見文案必須提到「來這裡逛逛」
   * 的契約，解除後這段承諾在全庫沒有任何測試看守；而它又是一段 sr-only 文字，
   * 視覺回歸與人工目檢都看不到它漂掉。
   */
  test("sr-only 操作說明涵蓋四條路徑（AT 唯一完整說明）", async ({ page }) => {
    await openMap(page, "light");
    const guide = page.locator("#universe-map-guide");

    // 被 aria-describedby 指向，否則這段文字對 AT 等於不存在
    await expect(
      page.getByRole("application", { name: /車車樂園互動地圖/ }),
    ).toHaveAttribute("aria-describedby", "universe-map-guide");

    await expect(guide).toContainText("點一座島");        // 進島
    await expect(guide).toContainText("來這裡逛逛");      // 探索點／故事（ZoneSheet 把手）
    await expect(guide).toContainText("回到整片樂園");    // 再點同島回世界層
    await expect(guide).toContainText("島嶼縮圖");        // ≤480 IslandPickerStrip
    await expect(guide).toContainText("方向鍵");          // 鍵盤操作
  });

  test("首訪 tap hint 點島後消失", async ({ page }) => {
    await openMap(page, "light");
    const hint = page.getByTestId("universe-tap-hint");
    await expect(hint).toContainText("點一座島");

    await page.locator('button[data-zone="car-park"]').click();
    await expect(hint).toHaveCount(0);
  });

  test("深連結 /adventures/dino 顯示探索點、召喚把手，不顯示 tap hint", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => {
      window.sessionStorage.removeItem("cc-universe-tap-hint-shown");
    });
    await page.goto("/adventures/dino");

    await expect(page.locator("[data-hotspot-id]").first()).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByTestId("universe-tap-hint")).toHaveCount(0);
    await waitForIslandReady(page);
    await expect(zoneSheetRegion(page, /恐龍島/)).toHaveCount(0);
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
      // 全套 5-worker 跑法下，地圖動畫可能受其他 Chromium worker 影響而延後。
      .poll(async () => (await stageTransformParts(page)).scale, { timeout: 15000 })
      .toBeLessThan(1.4);
    // 而且車車樂園真的回到可視區（不只縮小，還要回中）
    await expect(
      page.locator('button[data-zone="car-park"]'),
    ).toBeInViewport();
  });

  test("深連結 /adventures/dino 飛抵後可回樂園", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => {
      window.sessionStorage.setItem("cc-universe-entry-played", "1");
    });
    await page.goto("/adventures/dino");

    expect(new URL(page.url()).pathname).toBe("/adventures/dino");
    await waitForIslandReady(page);
    await expect
      .poll(async () => scaleFromTransform(await stageTransform(page)))
      .toBeCloseTo(1.6, 1);
    await expect(page.locator("[data-hotspot-id]").first()).toBeVisible({
      timeout: 5_000,
    });

    await mapHomeButton(page).click();
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe("/adventures");
  });

  test("回樂園後再進同島路徑，layout 保活且探索點仍在", async ({ page }) => {
    await openMap(page, "light");

    await page.getByRole("button", { name: /恐龍島/ }).click();
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe("/adventures/dino");
    await expect(page.locator("[data-hotspot-id]").first()).toBeVisible({
      timeout: 5_000,
    });
    await waitForIslandReady(page);

    await mapHomeButton(page).click();
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe("/adventures");

    await page.getByRole("button", { name: /恐龍島/ }).click();
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe("/adventures/dino");
    await expect(page.locator("[data-hotspot-id]").first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test("首訪帶島路徑跳過進場動畫，鏡頭不被拉回車庫", async ({ page }) => {
    // 不預寫 entry-played：驗證島路徑入場會自行抑制進場降落動畫。
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/adventures/dino");

    await waitForIslandReady(page);
    expect(
      await page.evaluate(() =>
        window.sessionStorage.getItem("cc-universe-entry-played"),
      ),
    ).toBe("1");
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
    await expect(page.locator("[data-hotspot-id]").first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test("M2：探索點可由深連結開 modal，關閉後回島", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => {
      window.sessionStorage.setItem("cc-universe-entry-played", "1");
    });
    await page.goto("/adventures/dino/story-house");
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe("/adventures/dino/story-house");
    const hotspotDialog = page.getByRole("dialog", { name: /故事屋入口/ });
    await expect(hotspotDialog).toBeVisible({ timeout: 3000 });
    await hotspotDialog.getByRole("button", { name: /關閉探索點/ }).click();
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe("/adventures/dino");
  });

  test("漫遊車 prod 關閉：島上不顯示小紅／阿酷動圖", async ({ page }) => {
    await openMap(page, "light");

    await page.getByRole("button", { name: /恐龍島/ }).click();
    await expect(page).toHaveURL(/\/adventures\/dino$/);
    await expect(page.locator('[data-roamer-id="roam-aku"]')).toHaveCount(0);
    await expect(page.locator('[data-roamer-id="roam-xiaohong"]')).toHaveCount(
      0,
    );
    await expect(page.locator('[data-roamer-id="map-xiaohong"]')).toHaveCount(
      0,
    );
  });

  test("MAP-UX-P2a：reduced-motion 點島飛抵並顯示探索點", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openMap(page, "light", 375, 812);

    await page.locator('button[data-zone="car-park"]').click();
    await expect(page).toHaveURL(/\/adventures\/car-park$/);
    await expect(page.locator("[data-hotspot-id]").first()).toBeVisible({
      timeout: 5_000,
    });
    await waitForIslandReady(page);
  });

  test("進島預設召喚把手，展開 region 後 Esc／✕ 收合", async ({ page }) => {
    await openMap(page, "light");
    await page.getByRole("button", { name: /恐龍島/ }).click();
    await expect(page).toHaveURL(/\/adventures\/dino$/);
    await waitForIslandReady(page);
    await expect(zoneSheetRegion(page, /恐龍島/)).toHaveCount(0);

    await expandZoneSheet(page);
    await expect(zoneSheetRegion(page, /恐龍島/)).toBeVisible();

    await collapseZoneSheetByEsc(page);
    await expect(zoneSheetRegion(page, /恐龍島/)).toHaveCount(0);
    await expect(zoneSummonHandle(page)).toBeVisible();

    await expandZoneSheet(page);
    await collapseZoneSheetByClose(page);
    await expect(zoneSummonHandle(page)).toBeVisible();
  });

  test("深連結 ?sheet=1 直接展開召喚抽屜", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => {
      window.sessionStorage.setItem("cc-universe-entry-played", "1");
    });
    await page.goto("/adventures/dino?sheet=1");

    await expect(zoneSheetRegion(page, /恐龍島/)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: "關閉" })).toBeVisible();
    await expect(page).toHaveURL(/\?sheet=1/);
    await expect(zoneSummonHandle(page)).toHaveCount(0);
  });

  test("展開抽屜後點地圖 pin 開 soft modal，關閉後仍在島", async ({ page }) => {
    await openMap(page, "light");
    await page.getByRole("button", { name: /恐龍島/ }).click();
    await waitForIslandReady(page);
    await expandZoneSheet(page);

    const pin = page.locator('[data-hotspot-id="story-house"]');
    await expect(pin).toBeVisible();
    await pin.click();

    await expect(page).toHaveURL(/\/adventures\/dino\/story-house/);
    const hotspotDialog = page.getByRole("dialog", { name: /故事屋入口/ });
    await expect(hotspotDialog).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole("dialog")).toHaveCount(1);

    await hotspotDialog.getByRole("button", { name: /關閉探索點/ }).click();
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe("/adventures/dino");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("[data-hotspot-id]").first()).toBeVisible();
  });

  test("375 展開抽屜後島圖仍有可見區（幾何）", async ({ page }) => {
    await openMap(page, "light", 375, 812);
    const carPark = page.locator('button[data-zone="car-park"]');
    const viewport = page.getByRole("application", { name: /車車樂園互動地圖/ });

    await carPark.click();
    await expect(page).toHaveURL(/\/adventures\/car-park$/);
    await waitForIslandReady(page);
    await expandZoneSheet(page);

    const islandBox = (await carPark.boundingBox())!;
    const frame = (await viewport.boundingBox())!;
    const sheetBox = (await zoneSheetRegion(page, /車車樂園/).boundingBox())!;

    // 抽屜在底部（max-height ≈ 40vh），島身中心應仍在 sheet 上緣之上
    const islandCenterY = islandBox.y + islandBox.height / 2;
    expect(islandCenterY).toBeLessThan(sheetBox.y + 8);

    const islandBottom = islandBox.y + islandBox.height;
    const visibleTop = Math.max(islandBox.y, frame.y);
    const visibleBottom = Math.min(islandBottom, frame.y + frame.height);
    expect(visibleBottom - visibleTop).toBeGreaterThan(48);
  });
});

/**
 * ≤480px 首訪提示的幾何契約。
 *
 * 這一組存在的理由：`openMap()` 預設 1280×800，本檔原有三個 tap hint 測試
 * 全跑桌機寬，而 `IslandPickerStrip` 只在 `@media (max-width: 480px)` 才
 * `display: block`——手機情境從未被執行過。加上 Playwright 的可見性判定
 * **不偵測遮蔽**，即使把既有測試改跑 390px 也照樣綠。
 * 2026-09-02 稽核實測：提示在 360/375/390 被島選擇列（z 6）、KidsPlayDock
 * （z 15）與 MapControls（z 5）三者同時蓋住，且固定 459px 寬左右溢出。
 */
const HINT_NARROW_VIEWPORTS = [
  // 320＝真實裝置下限（iPhone SE 1）。240px 以下 `.tapHintText` 的 nowrap 會讓
  // 關閉鍵被擠掉約 5px，但那已低於任何在售裝置，刻意不列入契約。
  { width: 320, height: 640 },
  { width: 360, height: 800 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
] as const;

test.describe("首訪 tap hint：窄屏幾何", () => {
  for (const vp of HINT_NARROW_VIEWPORTS) {
    test(`${vp.width}px：不出界、不被任何底部浮層遮住`, async ({ page }) => {
      await openMap(page, "light", vp.width, vp.height);

      const hint = page.getByTestId("universe-tap-hint");
      await expect(hint).toContainText("點一座島");

      // hit-test（多點取樣）：使用者真的點得到嗎
      await expectHitTestable(page, hint, "tapHint");
      // 邊距＋不得把自己的內容擠出去
      await expectWithinViewport(page, hint, "tapHint");

      // 矩形不相交：抓 pointer-events: none 的視覺遮蔽（hit-test 對它是透明的）。
      // `optional` 只給**真的**條件渲染的浮層——其餘標 present，這樣 selector
      // 打錯或元件回歸會紅，而不是靜默通過。
      for (const [name, other, presence] of [
        // 島選擇列只在 ≤480 渲染；本組跑到 390 為止，但 767 之類的呼叫端會缺席
        ["IslandPickerStrip", page.getByTestId("island-picker-strip"), "optional"],
        ["KidsPlayDock", page.locator("[data-kids-dock]"), "present"],
        ["MapControls", page.getByRole("group", { name: "地圖控制" }), "present"],
        // 日／月是裝飾，但不透明蓋住會讓月亮看起來缺一角（提示 z 4 > skyLayer z 3）
        ["日／月", page.locator('[class*="skyLayer"] img').first(), "present"],
      ] as const) {
        await expectNoOverlap(hint, other, `tapHint 與 ${name}`, { b: presence });
      }
    });
  }

  test("360px：關閉鍵觸控目標 ≥48×48 且可點掉提示", async ({ page }) => {
    await openMap(page, "light", 360, 800);
    const close = page.getByRole("button", { name: "關閉提示" });
    const box = (await close.boundingBox())!;
    // 取整：提示改頂部錨定後父層位移帶小數，實測會落在 47.99998。CSS 宣告的
    // `min-width/height: 48px` 由 UniverseMap.module.css.test.ts 逐字守住，
    // 這裡守的是「實際 render 出來仍是 48 級距」，不需次像素精度。
    expect(Math.round(box.width)).toBeGreaterThanOrEqual(48);
    expect(Math.round(box.height)).toBeGreaterThanOrEqual(48);
    await close.click();
    await expect(page.getByTestId("universe-tap-hint")).toHaveCount(0);
  });
});
