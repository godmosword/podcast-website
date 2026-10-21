import { test, expect } from "@playwright/test";
import { skipIntroOverlay } from "./intro-gate";

// ADR-0004：這支規格測的是 Landing／內容頁本身，先跳過首頁的 3D 開場覆蓋層。
test.beforeEach(async ({ page }) => {
  await skipIntroOverlay(page);
});

const PHONE = { width: 390, height: 844 };

/**
 * 結果列 h2 視覺上是「台北市下雨也能玩 · 3 處」＋條件小字，內層 span 都 aria-hidden，
 * accessible name 由 srText 提供（「在全台找免費的地方，共 58 處」）。
 * 用 role + name 查詢可同時避開選縣市面板的「去哪裡玩？」h2。
 */
function resultSummary(
  page: import("@playwright/test").Page,
  scope?: string,
) {
  return page.getByRole("heading", {
    level: 2,
    name: scope
      ? new RegExp(`^在${scope}.*共 \\d+ (個地方|處)$`)
      : /^在.+，共 \d+ (個地方|處)$/,
  });
}

/** 等待 PlayMap 位置列與結果摘要就緒（Leaflet 僅「看地圖」後才載入）。 */
async function waitForPlayMapReady(page: import("@playwright/test").Page) {
  await expect(page.getByRole("button", { name: "我附近" })).toBeVisible({
    timeout: 8_000,
  });
  await expect(resultSummary(page)).toBeVisible({ timeout: 5_000 });
}

/** 位置列「全台 ▾」→ 選縣市面板 → 點縣市（面板選完自動關閉）。 */
async function selectCoveredCity(
  page: import("@playwright/test").Page,
  city = "台北市",
) {
  await page.getByRole("button", { name: /^選擇地點，目前：/ }).click();
  await page
    .getByRole("dialog", { name: "去哪裡玩？" })
    .getByRole("button", { name: new RegExp(`^${city}，\\d+ 個地點$`) })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

/** 情境卡的 accessible name 是「下雨也能玩，全台 34 處」。 */
function scenarioCard(page: import("@playwright/test").Page, label: string) {
  return page.getByRole("button", { name: new RegExp(`^${label}，`) });
}

async function openMap(page: import("@playwright/test").Page) {
  if ((await page.getByRole("button", { name: "看地圖" }).count()) === 0) {
    await selectCoveredCity(page);
  }
  await page.getByRole("button", { name: "看地圖" }).click();
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

    await expect(page.getByRole("button", { name: "看地圖" })).toHaveCount(0);
    await selectCoveredCity(page);
    await expect(page.getByRole("button", { name: "看地圖" })).toBeVisible();
    await expect(scenarioCard(page, "免費就好")).toBeVisible();
    await expect(resultSummary(page, "台北市")).toBeVisible();

    const cardsPanel = page.locator("#play-map-panel-cards");
    const firstCardButton = cardsPanel
      .getByRole("button", { name: /查看詳情/ })
      .first();
    await expect(firstCardButton).toBeVisible({ timeout: 5_000 });
    // D3：手機卡片直接放導航，從名單一下就能出發（不必先開詳情）。
    const mobileNav = cardsPanel
      .locator('a[aria-label^="導航前往"]')
      .first();
    await expect(mobileNav).toBeVisible();
    const navBox = await mobileNav.boundingBox();
    expect(navBox?.height ?? 0).toBeGreaterThanOrEqual(44);

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

  test("免費就好情境卡可縮小結果", async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);

    await scenarioCard(page, "免費就好").click();
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

    await expect(page.getByText("媽米先幫你看")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 3, name: "媽米先幫你看" }),
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

    const nearMe = page.getByRole("button", { name: "我附近", exact: true });
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

  test("點情境卡不觸發 RSC 往返（P1 回歸）", async ({ page }) => {
    test.setTimeout(30_000);
    const rscRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("_rsc=") && url.includes("free=1")) rscRequests.push(url);
    });

    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);

    await scenarioCard(page, "免費就好").click();
    await expect(page).toHaveURL(/free=1/);
    await page.waitForTimeout(1_000);

    expect(rscRequests).toEqual([]);
  });

  test("情境卡＋更多條件可組合並寫入網址", async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);

    const rain = scenarioCard(page, "下雨也能玩");
    await rain.click();
    await page.getByRole("button", { name: /^更多條件/ }).click();
    const outdoor = page.getByRole("button", { name: "戶外" });
    await outdoor.click();

    await expect(rain).toHaveAttribute("aria-pressed", "true");
    await expect(outdoor).toHaveAttribute("aria-pressed", "true");
    await expect(resultSummary(page, "全台")).toBeVisible();
    await expect(page).toHaveURL(/outdoor=1&rain=1/);
  });

  test("無縣市的 view=map 不掛 Leaflet，並把網址改回名單", async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto("/for-parents/play-map?view=map&free=1");
    await waitForPlayMapReady(page);
    await expect(page.locator(".leaflet-container")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "看地圖" })).toHaveCount(0);
    await expect(page).not.toHaveURL(/view=map/);
    await expect(page).toHaveURL(/free=1/);
  });

  test("地圖 tab 才載入 Leaflet（行動互斥）", async ({ page }) => {
    test.setTimeout(45_000);
    await page.setViewportSize(PHONE);
    const leafletRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (/leaflet\.css|react-leaflet|tile\.openstreetmap|openfreemap|maplibre/i.test(url)) {
        leafletRequests.push(url);
      }
    });

    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);
    await expect(page.locator(".leaflet-container")).toHaveCount(0);
    expect(leafletRequests.length).toBe(0);

    await openMap(page);
    await expect(page.locator(".leaflet-container")).toBeVisible({
      timeout: 15_000,
    });
    expect(leafletRequests.length).toBeGreaterThan(0);
    expect(leafletRequests.some((url) => url.includes("tile.openstreetmap.org"))).toBe(false);
  });

  test("行動切換分頁不重建 Leaflet 容器", async ({ page }) => {
    test.setTimeout(45_000);
    await page.setViewportSize(PHONE);
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);

    await openMap(page);
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

    await openMap(page);
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

    await openMap(page);
    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("region", { name: "地圖結果" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "返回名單" })).toBeVisible();
    await expect(page.getByText("媽米先幫你看")).toHaveCount(0);

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
    await expect(
      page.getByRole("button", { name: "看全台", exact: true }),
    ).toBeVisible();
  });

  test("桌面首屏不載入 Leaflet，看地圖後才並排（效能回歸）", async ({ page }) => {
    test.setTimeout(45_000);
    // 桌面 view=cards 也不該碰 Leaflet 或 OSM tile——這是本次改版的效能承諾。
    const mapRequests: string[] = [];
    page.on("request", (request) => {
      if (/leaflet|tile\.openstreetmap|openfreemap|maplibre/i.test(request.url())) {
        mapRequests.push(request.url());
      }
    });

    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);
    await expect(page.getByRole("group", { name: "今天想怎麼玩" })).toBeVisible();
    await expect(page.locator(".leaflet-container")).toHaveCount(0);
    expect(mapRequests).toEqual([]);

    await openMap(page);
    await expect(page.locator(".leaflet-container")).toBeVisible({
      timeout: 15_000,
    });
    // 並排：地圖出現後名單仍在，且「看地圖」因為已同框而消失。
    await expect(page.locator("#play-map-panel-cards")).toBeVisible();
    await expect(page.getByRole("button", { name: "看地圖" })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "搜尋此區域" }),
    ).toHaveCount(0);
    expect(mapRequests.some((url) => url.includes("tile.openstreetmap.org"))).toBe(false);
    await expect
      .poll(() => mapRequests.some((url) => url.includes("tiles.openfreemap.org")))
      .toBe(true);
  });

  test("搜尋此區域 commit 後約束結果，清除後恢復", async ({ page }) => {
    test.setTimeout(45_000);
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);
    await openMap(page);
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

    await scenarioCard(page, "免費就好").click();
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
    // hover 關聯只在並排時成立，桌面也要先切到地圖分頁。
    await openMap(page);
    await expect(page.getByRole("button", { name: "看地圖" })).toHaveCount(0);

    // Individual markers intentionally appear only after zooming past the
    // spatial-cluster threshold. Keep this test about the card/marker
    // contract, not the initial zoom level.
    const zoomIn = page.locator(".leaflet-control-zoom-in");
    for (let i = 0; i < 6; i += 1) {
      if (await page.locator(".playMapMarkerButton").count()) break;
      await zoomIn.click();
      await page.waitForTimeout(150);
    }
    const marker = page.locator(".playMapMarkerButton").first();
    await expect(marker).toBeVisible({ timeout: 15_000 });
    const placeId = await marker.getAttribute("data-playground-id");
    expect(placeId).toBeTruthy();
    if (!placeId) return;
    const card = page.locator(`#${placeId}`);
    await expect(card).toBeVisible();
    await expect(card.getByRole("link", { name: /導航前往/ })).toBeVisible();

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
      const more = page.getByRole("button", { name: /^再看 \d+ 個$/ });
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
      const more = page.getByRole("button", { name: /^再看 \d+ 個$/ });
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

  test("位置列捲動後黏在頂欄下方、縮成一列並列出目前情境", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);
    await scenarioCard(page, "免費就好").click();

    await page.evaluate(() => window.scrollTo(0, 1500));
    const bar = page.locator("[data-location-bar]");
    await expect(bar).toHaveAttribute("data-stuck", "true");
    const box = await bar.boundingBox();
    expect(box, "位置列應留在畫面內").not.toBeNull();
    if (!box) return;
    // 黏住的話會落在頂欄下方；沒黏住時 boundingBox 會是大負數。
    expect(box.y).toBeGreaterThan(0);
    expect(box.y).toBeLessThan(200);
    await expect(bar.getByRole("button", { name: "取消「免費就好」" })).toBeVisible();
    await expect(bar.getByText("在", { exact: true })).toBeHidden();

    // 用真實座標點「更多條件」，避開 Playwright 的 actionability 捲動。
    const more = bar.getByRole("button", { name: /^更多條件/ });
    const moreBox = await more.boundingBox();
    if (!moreBox) throw new Error("更多條件鈕不在畫面上");
    await page.mouse.click(moreBox.x + moreBox.width / 2, moreBox.y + moreBox.height / 2);
    await expect(more).toHaveAttribute("aria-expanded", "true");
    // 展開後仍留在原處附近，不會被彈回頁頂。
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(800);
  });

  test("桌面：情境卡一列四張、名單三欄", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);

    const cards = page.getByRole("group", { name: "今天想怎麼玩" }).getByRole("button");
    await expect(cards).toHaveCount(4);
    const tops = await cards.evaluateAll((nodes) =>
      nodes.map((node) => Math.round(node.getBoundingClientRect().top)),
    );
    expect(new Set(tops).size).toBe(1);

    const firstRow = await page
      .locator("#play-map-panel-cards li:not([hidden])")
      .evaluateAll((nodes) =>
        nodes.slice(0, 3).map((node) => Math.round(node.getBoundingClientRect().top)),
      );
    expect(new Set(firstRow).size).toBe(1);
  });

  test("選縣市面板：焦點困在面板、Esc 關閉後焦點回觸發鈕、背景不能操作", async ({
    page,
  }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);

    const trigger = page.getByRole("button", { name: /^選擇地點，目前：/ });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "去哪裡玩？" });
    await expect(dialog).toBeVisible();
    const mainInert = () =>
      page.evaluate(() => !!document.querySelector("main")?.closest("[inert]"));
    expect(await mainInert()).toBe(true);

    for (let i = 0; i < 30; i += 1) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(
        () => !!document.activeElement?.closest('[role="dialog"]'),
      );
      expect(inside, `第 ${i + 1} 次 Tab 跑出面板`).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(await mainInert()).toBe(false);
  });

  test("桌面從黏住的位置列打開面板：面板貼在觸發鈕下方、位置列不脫黏", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);
    await page.evaluate(() => window.scrollTo(0, 1400));
    const bar = page.locator("[data-location-bar]");
    await expect(bar).toHaveAttribute("data-stuck", "true");

    const trigger = page.getByRole("button", { name: /^選擇地點，目前：/ });
    const triggerBox = await trigger.boundingBox();
    if (!triggerBox) throw new Error("觸發鈕不在畫面上");
    await page.mouse.click(
      triggerBox.x + triggerBox.width / 2,
      triggerBox.y + triggerBox.height / 2,
    );
    const dialog = page.getByRole("dialog", { name: "去哪裡玩？" });
    await expect(dialog).toBeVisible();
    const dialogBox = await dialog.boundingBox();
    expect(dialogBox?.y ?? -1).toBeGreaterThan(triggerBox.y);
    expect(dialogBox?.y ?? 9999).toBeLessThan(triggerBox.y + triggerBox.height + 40);
    await expect(bar).toHaveAttribute("data-stuck", "true");
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
  });

  test("網址同時帶多個情境：不亮卡，結果列下方列出每個條件", async ({ page }) => {
    await page.goto("/for-parents/play-map?free=1&rain=1");
    await waitForPlayMapReady(page);
    const pressed = page
      .getByRole("group", { name: "今天想怎麼玩" })
      .locator('[aria-pressed="true"]');
    await expect(pressed).toHaveCount(0);
    const chips = page.getByRole("group", { name: "目前套用的情境" }).getByRole("button");
    await expect(chips).toHaveText(["下雨也能玩", "免費就好"]);
  });

  test("手機 390×664：首屏看得到頁首、四張情境卡與位置列；4 下就能導航", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);

    await expect(page.getByRole("heading", { level: 1, name: "親子遊樂地圖" })).toBeInViewport();
    await expect(page.getByText("今天想怎麼玩？")).toBeInViewport();
    const cards = page.getByRole("group", { name: "今天想怎麼玩" }).getByRole("button");
    for (let i = 0; i < 4; i += 1) {
      await expect(cards.nth(i)).toBeInViewport({ ratio: 1 });
    }
    await expect(page.getByRole("button", { name: /^選擇地點，目前：/ })).toBeInViewport();

    // ① 情境 → ② 全台 ▾ → ③ 縣市 → ④ 導航
    await scenarioCard(page, "下雨也能玩").click();
    await selectCoveredCity(page, "台北市");
    await expect(resultSummary(page, "台北市")).toBeInViewport();
    const nav = page
      .locator("#play-map-panel-cards li:not([hidden])")
      .first()
      .getByRole("link", { name: /^導航前往/ });
    await expect(nav).toBeInViewport();
    await expect(nav).toHaveAttribute("href", /google\.com\/maps\/dir/);
    await expect(nav).toHaveAttribute("target", "_blank");
  });

  test("名單卡片明示免費／需購票與室內／戶外", async ({ page }) => {
    test.setTimeout(30_000);
    await page.setViewportSize(PHONE);
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);

    const firstCard = page.locator("#play-map-panel-cards li:not([hidden])").first();
    await expect(firstCard.locator('[data-card-fact="fee"]')).toHaveText(/^(免費|需購票)$/);
    await expect(firstCard.locator('[data-card-fact="environment"]')).toHaveText(/^(室內|戶外)$/);
    await expect(firstCard.getByText(/^\d+–\d+ 歲$/)).toHaveCount(0);
  });

  test("地圖模式不再顯示過時操作說明，搜尋此區域仍可用", async ({ page }) => {
    test.setTimeout(45_000);
    await page.setViewportSize(PHONE);
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);

    await openMap(page);
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
