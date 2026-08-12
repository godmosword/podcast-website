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
    await page.goto("/for-parents/play-map");

    await expect(
      page.getByRole("heading", { level: 1, name: "親子遊樂地圖" }),
    ).toBeVisible({ timeout: 5_000 });

    await expect(page.getByText("地圖載入中…")).toHaveCount(0);

    await waitForPlayMapReady(page);

    await expect(page.getByText(/已收錄 \d+ 縣市、共 \d+ 處/)).toBeVisible();
    await expect(page.getByRole("button", { name: "免費放電" })).toBeVisible();
    await expect(page.getByText(/全部 · .+ → \d+ 個地點/)).toBeVisible();

    const cardsPanel = page.locator("#play-map-panel-cards");
    const firstCardButton = cardsPanel.getByRole("button").first();
    await expect(firstCardButton).toBeVisible({ timeout: 5_000 });

    await firstCardButton.click();

    const sheet = page.getByRole("region", { name: /詳情$/ });
    await expect(sheet).toBeVisible();
    await expect(
      sheet.getByRole("button", { name: "關閉地點詳情" }),
    ).toBeVisible();
    // 卡片點選開完整 sheet：不應只有「更多」精簡態
    await expect(sheet.getByRole("button", { name: "更多" })).toHaveCount(0);

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

  test("地圖 tab 才載入 Leaflet", async ({ page }) => {
    test.setTimeout(45_000);
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
