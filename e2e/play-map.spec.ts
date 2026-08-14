import { test, expect } from "@playwright/test";

const PHONE = { width: 390, height: 844 };

/** 等待 PlayMap 意圖列與結果摘要就緒（Leaflet 僅地圖 tab 才載入）。 */
async function waitForPlayMapReady(page: import("@playwright/test").Page) {
  await expect(page.getByRole("button", { name: "離我最近" })).toBeVisible({
    timeout: 8_000,
  });
  await expect(
    page.getByText(/→ \d+ 個地點|目前沒有符合條件的地點/),
  ).toBeVisible({ timeout: 5_000 });
}

test.describe("親子遊樂地圖", () => {
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

    await expect(
      page.getByText("先點離我最近，或直接點下面卡片看怎麼帶。"),
    ).toBeVisible();
    await expect(page.getByText(/已收錄 \d+ 縣市、共 \d+ 處/)).toBeVisible();
    await expect(page.getByRole("button", { name: "免費放電" })).toBeVisible();
    // 無篩選時摘要只有「全部」一段（不會有 ` · `），既有斷言誤寫成必有第二段。
    await expect(page.getByText(/全部 → \d+ 個地點/)).toBeVisible();

    const cardsPanel = page.locator("#play-map-panel-cards");
    const firstCardButton = cardsPanel
      .getByRole("button", { name: /查看詳情/ })
      .first();
    await expect(firstCardButton).toBeVisible({ timeout: 5_000 });

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

  test("免費放電意圖可縮小結果", async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);

    await page.getByRole("button", { name: "免費放電" }).click();
    await expect(page.getByText(/免費 · .+ → \d+ 個地點|全部 · 免費 →/)).toBeVisible();
    await expect(page).toHaveURL(/free=1/);
  });

  test("地圖 tab 才載入 Leaflet（行動互斥）", async ({ page }) => {
    test.setTimeout(45_000);
    await page.setViewportSize(PHONE);
    const leafletRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (/leaflet|tile\.openstreetmap/i.test(url)) {
        leafletRequests.push(url);
      }
    });

    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);
    expect(leafletRequests.length).toBe(0);

    await page.getByRole("tab", { name: "地圖" }).click();
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

    await page.getByRole("tab", { name: "地圖" }).click();
    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible({ timeout: 15_000 });

    const leafletId = await map.evaluate((el) => {
      const id = (el as HTMLElement & { _leaflet_id?: number })._leaflet_id;
      if (id == null) throw new Error("Leaflet 容器沒有 _leaflet_id");
      return id;
    });

    await page.locator(".leaflet-control-zoom-in").click();
    await page.waitForFunction(
      () => !document.querySelector(".leaflet-zoom-anim"),
      undefined,
      { timeout: 10_000 },
    );

    await page.getByRole("tab", { name: "卡片" }).click();
    await expect(page.locator("#play-map-panel-map")).toBeHidden();
    await expect(map).toHaveCount(1);

    await page.getByRole("tab", { name: "地圖" }).click();
    await expect(map).toBeVisible();
    const leafletIdAgain = await map.evaluate((el) => {
      return (el as HTMLElement & { _leaflet_id?: number })._leaflet_id;
    });
    expect(leafletIdAgain).toBe(leafletId);
  });

  test("桌面並排直接載入地圖", async ({ page }) => {
    test.setTimeout(45_000);
    await page.goto("/for-parents/play-map");
    await waitForPlayMapReady(page);
    await expect(page.getByRole("tab", { name: "地圖" })).toHaveCount(0);
    await expect(page.locator(".leaflet-container")).toBeVisible({
      timeout: 15_000,
    });
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
