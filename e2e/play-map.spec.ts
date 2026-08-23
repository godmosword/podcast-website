import { test, expect } from "@playwright/test";

const PHONE = { width: 390, height: 844 };

/**
 * 結果列 h2 視覺上拆成「在 X 找 Y」＋放大的數字，內層 span 都 aria-hidden，
 * accessible name 由 srText 提供（「在全台找免費的地方，共 12 個地方」）。
 * 用 role + name 查詢可同時避開磚牆的「選一個縣市」h2。
 */
function resultSummary(
  page: import("@playwright/test").Page,
  scope?: string,
) {
  return page.getByRole("heading", {
    level: 2,
    name: scope
      ? new RegExp(`^在${scope}.*共 \\d+ 個地方$`)
      : /^在.+，共 \d+ 個地方$/,
  });
}

/** 等待 PlayMap 意圖列與結果摘要就緒（Leaflet 僅「看地圖」後才載入）。 */
async function waitForPlayMapReady(page: import("@playwright/test").Page) {
  await expect(page.getByRole("button", { name: "附近" })).toBeVisible({
    timeout: 8_000,
  });
  await expect(resultSummary(page)).toBeVisible({ timeout: 5_000 });
}

test.describe("親子遊樂地圖", () => {
  test("play-map 回應允許同源定位（P0 回歸）", async ({ request }) => {
    const response = await request.get("/for-parents/play-map");
    expect(response.headers()["permissions-policy"]).toContain(
      "geolocation=(self)",
    );
  });

  test("SSR HTML 含 H1 與至少一景點名（G1）", async ({ request }) => {
    const response = await request.get("/for-parents/play-map");
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).toContain("親子遊樂地圖");
    expect(html).not.toContain("hero-home");
    expect(html).not.toMatch(/地圖載入中/);
    expect(html).toMatch(/台北|大安|兒童|科教|動物園|天文|官邸|自來水|風禾/);
  });

  test("頁面載入、意圖、結果數、卡片與詳情抽屜", async ({ page }) => {
    test.setTimeout(30_000);
    await page.setViewportSize(PHONE);
    await page.goto("/for-parents/play-map");

    await expect(
      page.getByRole("heading", { level: 1, name: "親子遊樂地圖" }),
    ).toBeVisible({ timeout: 5_000 });

    await expect(page.getByText("地圖載入中…")).toHaveCount(0);

    await waitForPlayMapReady(page);

    await expect(page.getByRole("button", { name: "看地圖" })).toBeVisible();
    await expect(page.getByRole("button", { name: "免費" })).toBeVisible();
    await expect(resultSummary(page, "全台")).toBeVisible();

    const cardsPanel = page.locator("#play-map-panel-cards");
    const firstCardButton = cardsPanel
      .getByRole("button", { name: /查看詳情/ })
      .first();
    await expect(firstCardButton).toBeVisible({ timeout: 5_000 });
    const mobileNav = cardsPanel
      .locator('a[aria-label^="導航前往"]')
      .first();
    await expect(mobileNav).toBeHidden();
    const becameFocused = await mobileNav.evaluate((element) => {
      (element as HTMLElement).focus();
      return document.activeElement === element;
    });
    expect(becameFocused).toBe(false);

    await firstCardButton.click();

    const sheet = page.getByRole("region", { name: /詳情$/ });
    await expect(sheet).toBeVisible();
    await expect(
      sheet.getByRole("button", { name: "關閉地點詳情" }),
    ).toBeVisible();
    // 卡片點選開完整 sheet：不應只有「更多」精簡態
    await expect(sheet.getByRole("button", { name: "更多" })).toHaveCount(0);
    await expect(sheet.getByText("帶小孩時")).toBeVisible();

    await sheet.getByRole("button", { name: "關閉地點詳情" }).click();
    await expect(sheet).toHaveCount(0);
  });

  test("免費 contextual filter 可縮小結果", async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);

    await page.getByRole("button", { name: "免費" }).click();
    await expect(resultSummary(page, "全台")).toBeVisible();
    await expect(page).toHaveURL(/free=1/);
  });

  test("有縣市 scope 時顯示 editorial pick，點擊沿用既有 full detail", async ({
    page,
  }) => {
    test.setTimeout(30_000);
    await page.setViewportSize(PHONE);
    await page.goto("/for-parents/play-map?city=%E6%A1%83%E5%9C%92%E5%B8%82");
    await waitForPlayMapReady(page);

    await expect(page.getByText("⭐ 媽米先幫你看")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 3, name: "⭐ 媽米先幫你看" }),
    ).toBeVisible();
    await page.getByRole("button", { name: /桃園市立兒童美術館，看看這個/ }).click();

    const sheet = page.getByRole("region", {
      name: "桃園市立兒童美術館 詳情",
    });
    await expect(sheet).toHaveAttribute("data-variant", "full");
    await expect(sheet.getByText("帶小孩時")).toBeVisible();
    await sheet.getByRole("button", { name: "關閉地點詳情" }).click();
  });

  test("「附近」可取得定位並顯示車程（P0 回歸）", async ({
    page,
    context,
  }) => {
    test.setTimeout(45_000);
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 25.033, longitude: 121.5654 });
    await page.setViewportSize(PHONE);
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);

    const nearMe = page.getByRole("button", { name: "附近", exact: true });
    await nearMe.click();

    await expect(nearMe).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByText("無法定位。可改選縣市，或稍後再開啟定位。"),
    ).toHaveCount(0);
    await expect(
      page
        .locator("#play-map-panel-cards")
        .getByText(/約 \d+ 分鐘|車程 \d+ 分以上/)
        .first(),
    ).toBeVisible();
  });

  test("點篩選 chip 不觸發 RSC 往返（P1 回歸）", async ({ page }) => {
    test.setTimeout(30_000);
    const rscRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("_rsc=") && url.includes("free=1")) rscRequests.push(url);
    });

    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);

    await page.getByRole("button", { name: "免費" }).click();
    await expect(page).toHaveURL(/free=1/);
    await page.waitForTimeout(1_000);

    expect(rscRequests).toEqual([]);
  });

  test("contextual quick filters 可組合並寫入網址", async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);

    const rain = page.getByRole("button", { name: "雨天" });
    await rain.click();
    await page.getByRole("button", { name: /篩選/ }).click();
    const outdoor = page.getByRole("button", { name: "戶外" });
    await outdoor.click();

    await expect(rain).toHaveAttribute("aria-pressed", "true");
    await expect(outdoor).toHaveAttribute("aria-pressed", "true");
    await expect(resultSummary(page, "全台")).toBeVisible();
    await expect(page).toHaveURL(/outdoor=1&rain=1/);
  });

  test("地圖 tab 才載入 Leaflet（行動互斥）", async ({ page }) => {
    test.setTimeout(45_000);
    await page.setViewportSize(PHONE);
    const leafletRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (/leaflet\.css|react-leaflet|tile\.openstreetmap/i.test(url)) {
        leafletRequests.push(url);
      }
    });

    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);
    await expect(page.locator(".leaflet-container")).toHaveCount(0);
    expect(leafletRequests.length).toBe(0);

    await page.getByRole("button", { name: "看地圖" }).click();
    await expect(page.locator(".leaflet-container")).toBeVisible({
      timeout: 15_000,
    });
    expect(leafletRequests.length).toBeGreaterThan(0);
  });

  test("行動切換分頁不重建 Leaflet 容器", async ({ page }) => {
    test.setTimeout(45_000);
    await page.setViewportSize(PHONE);
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);

    await page.getByRole("button", { name: "看地圖" }).click();
    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible({ timeout: 15_000 });

    const leafletId = await map.evaluate((el) => {
      const id = (el as HTMLElement & { _leaflet_id?: number })._leaflet_id;
      if (id == null) throw new Error("Leaflet 容器沒有 _leaflet_id");
      return id;
    });

    await page.waitForFunction(
      () => !document.querySelector(".leaflet-zoom-anim"),
      undefined,
      { timeout: 10_000 },
    );
    await page.locator(".leaflet-control-zoom-in").click();
    await expect(
      page.getByRole("button", { name: "搜尋此區域" }),
    ).toBeVisible();
    await page.waitForFunction(
      () => !document.querySelector(".leaflet-zoom-anim"),
      undefined,
      { timeout: 10_000 },
    );

    await page.getByRole("button", { name: "返回名單" }).click();
    await expect(page.locator("#play-map-panel-map")).toBeHidden();
    await expect(map).toHaveCount(1);

    await page.getByRole("button", { name: "看地圖" }).click();
    await expect(map).toBeVisible();
    const leafletIdAgain = await map.evaluate((el) => {
      return (el as HTMLElement & { _leaflet_id?: number })._leaflet_id;
    });
    expect(leafletIdAgain).toBe(leafletId);
  });

  test("手機地圖模式沒有 bottom sheet，可搜尋此區域並返回名單", async ({
    page,
  }) => {
    test.setTimeout(45_000);
    await page.setViewportSize(PHONE);
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);

    await expect(page.locator(".leaflet-container")).toHaveCount(0);
    await expect(page.getByRole("region", { name: "地圖結果" })).toHaveCount(0);

    await page.getByRole("button", { name: "看地圖" }).click();
    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("region", { name: "地圖結果" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "返回名單" })).toBeVisible();
    await expect(page.getByText("⭐ 媽米先幫你看")).toHaveCount(0);

    await page.waitForFunction(
      () => !document.querySelector(".leaflet-zoom-anim"),
      undefined,
      { timeout: 10_000 },
    );
    const box = await map.boundingBox();
    expect(box).toBeTruthy();
    if (!box) return;
    await page.mouse.move(box.x + box.width * 0.28, box.y + 24);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.28, box.y + 52);
    await page.mouse.up();

    const searchArea = page.getByRole("button", { name: "搜尋此區域" });
    await expect(searchArea).toBeVisible({ timeout: 10_000 });
    await searchArea.click();
    await page.getByRole("button", { name: "返回名單" }).click();
    await expect(resultSummary(page, "這個區域")).toBeVisible();
    await expect(page.getByRole("button", { name: "看全台" })).toBeVisible();
  });

  test("桌面並排直接載入地圖", async ({ page }) => {
    test.setTimeout(45_000);
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);
    await expect(page.getByRole("button", { name: "看地圖" })).toHaveCount(0);
    await expect(page.locator(".leaflet-container")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("button", { name: "搜尋此區域" }),
    ).toHaveCount(0);
  });

  test("搜尋此區域 commit 後約束結果，清除後恢復", async ({ page }) => {
    test.setTimeout(45_000);
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);
    await expect(page.locator(".leaflet-container")).toBeVisible({
      timeout: 15_000,
    });

    await page.waitForFunction(
      () => !document.querySelector(".leaflet-zoom-anim"),
      undefined,
      { timeout: 10_000 },
    );
    await page.locator(".leaflet-control-zoom-in").click();
    const searchArea = page.getByRole("button", { name: "搜尋此區域" });
    await expect(searchArea).toBeVisible();
    await searchArea.click();

    await expect(resultSummary(page, "這個區域")).toBeVisible();
    await expect(searchArea).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "看全台" }).first(),
    ).toBeVisible();

    await page.getByRole("button", { name: "免費" }).click();
    await expect(resultSummary(page, "這個區域")).toBeVisible();

    await page.getByRole("button", { name: "看全台" }).first().click();
    await expect(resultSummary(page)).toBeVisible();
  });

  test("桌面 card 與 individual marker 互相同步，marker 維持 compact Sheet", async ({
    page,
  }) => {
    test.setTimeout(45_000);
    await page.goto("/for-parents/play-map?city=%E5%8F%B0%E5%8C%97%E5%B8%82");
    await waitForPlayMapReady(page);
    await expect(page.getByRole("button", { name: "看地圖" })).toHaveCount(0);

    const card = page.locator("#play-map-panel-cards li:not([hidden])").first();
    const placeId = await card.getAttribute("id");
    expect(placeId).toBeTruthy();
    if (!placeId) return;
    await expect(card.getByRole("link", { name: /導航前往/ })).toBeVisible();
    const marker = page.locator(
      `.playMapMarkerButton[data-playground-id="${placeId}"]`,
    );
    await expect(marker).toBeVisible({ timeout: 15_000 });

    await card.locator("article").hover();
    await expect(marker).toHaveAttribute("data-hovered", "true");

    await marker.hover();
    await expect(card).toHaveAttribute("data-card-state", "hover-correlated");

    await page.mouse.move(10, 10);
    await expect(marker).toHaveAttribute("data-hovered", "false");
    await marker.focus();
    await expect(card).toHaveAttribute("data-card-state", "hover-correlated");

    await marker.click();
    await expect(marker).toHaveAttribute("aria-pressed", "true");
    await expect(card).toHaveAttribute("data-card-state", "selected");
    await expect(
      page.getByRole("region", { name: /詳情$/ }).getByRole("button", {
        name: "更多",
      }),
    ).toBeVisible();
  });

  test("手機精簡 sheet 有 coverageNote 時導航仍在 viewport 內", async ({
    page,
  }) => {
    test.setTimeout(45_000);
    await page.setViewportSize(PHONE);
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);

    const hukouName = "王爺壟運動公園";
    const cardsPanel = page.locator("#play-map-panel-cards");
    const hukouCard = cardsPanel.getByRole("button", {
      name: `${hukouName}，查看詳情`,
    });
    for (let i = 0; i < 12; i += 1) {
      if (await hukouCard.isVisible()) break;
      const more = page.getByRole("button", { name: "載入更多" });
      if (!(await more.isVisible())) break;
      await more.click();
    }
    await expect(hukouCard).toBeVisible();
    await hukouCard.click();
    await page.getByRole("button", { name: `在地圖上看 ${hukouName}` }).click();

    const sheet = page.getByRole("region", { name: `${hukouName} 詳情` });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("button", { name: "更多" })).toBeVisible();
    await expect(sheet.getByText("資料範圍")).toBeVisible();
    await expect(
      sheet.getByRole("link", {
        name: `開啟 Google 地圖導航前往 ${hukouName}（另開視窗）`,
      }),
    ).toBeInViewport();
  });

  test("返回名單會關掉精簡預覽，不殘留在名單上", async ({ page }) => {
    test.setTimeout(45_000);
    await page.setViewportSize(PHONE);
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);

    const hukouName = "王爺壟運動公園";
    const cardsPanel = page.locator("#play-map-panel-cards");
    const hukouCard = cardsPanel.getByRole("button", {
      name: `${hukouName}，查看詳情`,
    });
    for (let i = 0; i < 12; i += 1) {
      if (await hukouCard.isVisible()) break;
      const more = page.getByRole("button", { name: "載入更多" });
      if (!(await more.isVisible())) break;
      await more.click();
    }
    await expect(hukouCard).toBeVisible();
    await hukouCard.click();
    await page.getByRole("button", { name: `在地圖上看 ${hukouName}` }).click();

    const sheet = page.getByRole("region", { name: `${hukouName} 詳情` });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("button", { name: "更多" })).toBeVisible();

    await page.getByRole("button", { name: "返回名單" }).click();
    await expect(sheet).toHaveCount(0);
    await expect(page.getByRole("region", { name: /詳情$/ })).toHaveCount(0);
    await expect(cardsPanel).toBeVisible();
    await expect(page.getByRole("button", { name: "看地圖" })).toBeFocused();
    await expect(
      page.locator(`.playMapMarkerButton[aria-pressed="true"]`),
    ).toHaveCount(0);
  });

  test("名單卡片明示免費／需購票與室內／戶外", async ({ page }) => {
    test.setTimeout(30_000);
    await page.setViewportSize(PHONE);
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);

    const firstCard = page.locator("#play-map-panel-cards li:not([hidden])").first();
    await expect(firstCard.getByText(/免費|需購票/)).toBeVisible();
    await expect(firstCard.getByText(/室內|戶外/)).toBeVisible();
    await expect(firstCard.getByText(/^\d+–\d+ 歲$/)).toHaveCount(0);
  });

  test("地圖模式不再顯示過時操作說明，搜尋此區域仍可用", async ({ page }) => {
    test.setTimeout(45_000);
    await page.setViewportSize(PHONE);
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);

    await page.getByRole("button", { name: "看地圖" }).click();
    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("點縣市看該區地點，或先點附近")).toHaveCount(0);
    await expect(page.getByText("雙指或工具列可縮放")).toHaveCount(0);
    await expect(page.getByText("點區域群組聚焦，或繼續縮放看單點")).toHaveCount(0);

    await page.waitForFunction(
      () => !document.querySelector(".leaflet-zoom-anim"),
      undefined,
      { timeout: 10_000 },
    );
    await page.locator(".leaflet-control-zoom-in").click();
    await expect(page.getByRole("button", { name: "搜尋此區域" })).toBeVisible();
  });

  test("行動選單「親子景點」可直達地圖頁", async ({ page }) => {
    test.setTimeout(30_000);
    await page.setViewportSize(PHONE);
    await page.goto("/");
    await page.getByRole("button", { name: "開啟選單" }).click();

    const drawerNav = page.getByRole("navigation", { name: "網站選單" });
    const playMapLink = drawerNav.getByRole("link", { name: "親子景點" });
    await expect(playMapLink).toHaveAttribute("href", /\/for-parents\/play-map/);
    await playMapLink.click();

    await expect(page).toHaveURL(/\/for-parents\/play-map/);
    await expect(
      page.getByRole("heading", { level: 1, name: "親子遊樂地圖" }),
    ).toBeVisible({ timeout: 5_000 });
    await waitForPlayMapReady(page);
  });
});
