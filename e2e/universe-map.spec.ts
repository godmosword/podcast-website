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
          // 橫向：直向視窗刻意讓島群比畫面寬（PORTRAIT_MAX_ZOOM，減少上下空海），
          // 最外側島本身就會被裁一角，孩子拖曳即可看全，故不能要求完整可見。
          // 實測 375×812 最差為未來夢想島 0.76（`LABEL_SCREEN_PAD` 已把恐龍島從
          // 0.66 拉到完整可見）；門檻取 0.7 守住「島名還認得出來、沒被推出畫面」。
          const visibleW =
            Math.min(label.rect.right, frame.x + frame.width) -
            Math.max(label.rect.left, frame.x);
          const ratio = visibleW / (label.rect.right - label.rect.left);
          expect(ratio, `${label.name} 可見比例`).toBeGreaterThanOrEqual(0.7);
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

  test("手機 fit：五座島 button 皆在首屏可視區", async ({ page }) => {
    await openMap(page, "light", 375, 812);
    const islands = [
      page.getByRole("button", { name: /車車樂園/ }),
      page.getByRole("button", { name: /恐龍島/ }),
      page.getByRole("button", { name: /英雄救援隊/ }),
      page.getByRole("button", { name: /未來夢想島/ }),
      page.getByRole("button", { name: /森林小島/ }),
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

  test("開放車車樂園一次點擊即飛抵並顯示探索點", async ({ page }) => {
    await openMap(page, "light");
    const carPark = page.getByRole("button", { name: /車車樂園/ });

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
    const carPark = page.getByRole("button", { name: /車車樂園/ });

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
    const carPark = page.getByRole("button", { name: /車車樂園/ });

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

    const hint = page.getByRole("status");
    await expect(hint).toContainText("點一座島飛過去，再點探索點");

    await page.getByRole("button", { name: "關閉提示" }).click();
    await expect(hint).toHaveCount(0);
  });

  test("首訪 tap hint 點島後消失", async ({ page }) => {
    await openMap(page, "light");
    const hint = page.getByRole("status");
    await expect(hint).toContainText("點一座島飛過去，再點探索點");

    await page.getByRole("button", { name: /車車樂園/ }).click();
    await expect(hint).toHaveCount(0);
  });

  test("深連結 /adventures/dino 顯示探索點、不顯示 tap hint", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => {
      window.sessionStorage.removeItem("cc-universe-tap-hint-shown");
    });
    await page.goto("/adventures/dino");

    await expect(page.locator("[data-hotspot-id]").first()).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(page.getByRole("dialog")).toHaveCount(0);
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
      page.getByRole("button", { name: /車車樂園/ }),
    ).toBeInViewport();
  });

  test("深連結 /adventures/dino 飛抵後可回樂園", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => {
      window.sessionStorage.setItem("cc-universe-entry-played", "1");
    });
    await page.goto("/adventures/dino");

    expect(new URL(page.url()).pathname).toBe("/adventures/dino");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect
      .poll(async () => scaleFromTransform(await stageTransform(page)))
      .toBeCloseTo(1.6, 1);
    await expect(page.locator("[data-hotspot-id]").first()).toBeVisible({
      timeout: 5_000,
    });

    await page.getByRole("button", { name: /回樂園/ }).click();
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
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.getByRole("button", { name: /回樂園/ }).click();
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

    await expect(page.getByRole("dialog")).toHaveCount(0);
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

    await page.getByRole("button", { name: /車車樂園/ }).click();
    await expect(page).toHaveURL(/\/adventures\/car-park$/);
    await expect(page.locator("[data-hotspot-id]").first()).toBeVisible({
      timeout: 5_000,
    });
  });
});
