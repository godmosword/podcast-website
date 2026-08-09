import { test, expect } from "@playwright/test";

const PHONE = { width: 390, height: 844 };

/** 等待 PlayMap 動態載入（Leaflet／OSM 可能較慢）。 */
async function waitForPlayMapReady(page: import("@playwright/test").Page) {
  await expect(page.getByLabel("依縣市篩選")).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByText(/找到 \d+ 個地點|目前沒有符合條件的地點/),
  ).toBeVisible({ timeout: 15_000 });
}

test.describe("親子遊樂地圖", () => {
  test("頁面載入、結果數、列表與詳情抽屜", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/for-parents/play-map");

    await expect(
      page.getByRole("heading", { level: 1, name: "親子遊樂地圖" }),
    ).toBeVisible();

    await waitForPlayMapReady(page);

    await expect(page.getByText(/目前收錄：/)).toBeVisible();

    const firstListButton = page
      .locator("#play-map-panel-list ul button")
      .first();
    await expect(firstListButton).toBeVisible({ timeout: 15_000 });

    const placeName = (
      await firstListButton.locator("span").first().textContent()
    )?.trim();
    expect(placeName).toBeTruthy();

    await firstListButton.click();

    const sheet = page.getByRole("region", { name: `${placeName} 詳情` });
    await expect(sheet).toBeVisible();
    await expect(
      sheet.getByRole("button", { name: "關閉地點詳情" }),
    ).toBeVisible();

    await sheet.getByRole("button", { name: "關閉地點詳情" }).click();
    await expect(sheet).toHaveCount(0);
  });

  test("行動選單「親子景點」可直達地圖頁", async ({ page }) => {
    test.setTimeout(60_000);
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
    ).toBeVisible();
    await waitForPlayMapReady(page);
  });
});
