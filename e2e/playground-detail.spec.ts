import { test, expect } from "@playwright/test";

test.describe("親子景點 detail pages", () => {
  test("renders the parent-first page and stable Place JSON-LD", async ({
    page,
    request,
  }) => {
    const response = await request.get("/for-parents/play-map/ty-kids-museum");
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).toContain("桃園市立兒童美術館");
    expect(html).toContain("部分體驗活動需現場登記或另收費");
    expect(html).toContain("創作體驗");
    expect(html).not.toContain("leaflet-container");

    await page.goto("/for-parents/play-map/ty-kids-museum");
    await expect(page).toHaveTitle(
      "桃園市立兒童美術館｜桃園親子景點｜車車遊樂園",
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /桃園市立兒童美術館.*桃園市中壢區.*博物館.*免費.*室內/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/for-parents\/play-map\/ty-kids-museum$/,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "桃園市立兒童美術館｜桃園親子景點｜車車遊樂園",
    );
    await expect(
      page.getByRole("heading", { level: 1, name: "桃園市立兒童美術館" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "媽米帶孩子時會注意" })).toBeVisible();
    await expect(page.getByRole("link", { name: /開始導航前往/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /官方網站/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "← 回親子遊樂地圖" })).toHaveAttribute(
      "href",
      "/for-parents/play-map",
    );
    await expect(page.locator('[aria-labelledby="nearby-heading"]')).toBeVisible();

    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const placeJsonLd = jsonLd
      .map((text) => JSON.parse(text) as Record<string, unknown>)
      .find((data) => data["@type"] === "Place");
    expect(placeJsonLd?.["@id"]).toMatch(
      /\/for-parents\/play-map\/ty-kids-museum#place$/,
    );
    expect(placeJsonLd?.url).toMatch(
      /\/for-parents\/play-map\/ty-kids-museum$/,
    );
    expect(placeJsonLd).not.toHaveProperty("dateModified");
  });

  test("returns 404 for unknown Playground.id", async ({ request }) => {
    const response = await request.get(
      "/for-parents/play-map/not-a-playground-id",
    );
    expect(response.status()).toBe(404);
  });

  test("keeps temporarily closed place indexable with a warning", async ({
    page,
  }) => {
    await page.goto("/for-parents/play-map/ty-puhsin");

    await expect(page.getByRole("heading", { level: 1, name: "埔心牧場" })).toBeVisible();
    await expect(page.locator('p[role="alert"]')).toContainText("暫停營業");
    await expect(page.getByRole("link", { name: /開始導航前往/ })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });

  test("covers the outdoor and mapsQuery prototype branches", async ({ page }) => {
    await page.goto("/for-parents/play-map/ty-fenghe");
    await expect(page.getByRole("heading", { level: 1, name: "風禾公園" })).toBeVisible();
    await expect(page.getByRole("list", { name: "地點重點" })).toContainText("戶外");
    await expect(page.getByRole("link", { name: /官方網站/ })).toHaveCount(0);
    await expect(
      page.locator('[aria-labelledby="basic-info-heading"] dt').filter({ hasText: "收費" }),
    ).toHaveCount(0);

    await page.goto("/for-parents/play-map/hc-nanliao");
    await expect(page.getByRole("heading", { level: 1, name: "南寮親子沙灘" })).toBeVisible();
    await expect(page.getByText("導航落點為南寮漁港旅遊服務中心")).toBeVisible();
    const navHref = await page.getByRole("link", { name: /開始導航前往/ }).getAttribute("href");
    expect(decodeURIComponent(navHref ?? "")).toContain("南寮漁港旅遊服務中心");
    await page.getByText("查看資料來源").click();
    await expect(page.locator('[aria-labelledby="verification-heading"] li')).toHaveCount(3);
  });
});
