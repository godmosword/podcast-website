import { expect, test } from "@playwright/test";

test.describe("親子景點 curated collections", () => {
  test("collections index exposes exactly the 22 launch links", async ({
    page,
    request,
  }) => {
    await page.goto("/for-parents/play-map/collections");

    await expect(page).toHaveTitle("各地親子景點整理｜車車遊樂園");
    await expect(
      page.getByRole("heading", { level: 1, name: "各地親子景點整理" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "依地區找" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "依需求找" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("active 景點");
    await expect(
      page.locator('a[href^="/for-parents/play-map/collections/"]'),
    ).toHaveCount(22);
    await expect(page.locator(".leaflet-container")).toHaveCount(0);

    for (const slug of [
      "changhua-free",
      "chiayi-county-indoor",
      "chiayi-city-indoor",
      "taoyuan-rainy-day",
    ]) {
      const response = await request.get(
        `/for-parents/play-map/collections/${slug}`,
      );
      expect(response.status(), slug).toBe(404);
    }

    await page.goto("/for-parents/play-map");
    await expect(
      page.locator('a[href="/for-parents/play-map/collections"]'),
    ).toHaveCount(1);
  });

  test("taoyuan keeps active counts and excludes the closed place", async ({
    page,
    request,
  }) => {
    const response = await request.get(
      "/for-parents/play-map/collections/taoyuan",
    );
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).not.toContain("leaflet-container");
    expect(html).not.toContain("埔心牧場");

    await page.goto("/for-parents/play-map/collections/taoyuan");
    await expect(page).toHaveTitle("桃園親子景點｜車車遊樂園");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/for-parents\/play-map\/collections\/taoyuan$/,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "桃園親子景點｜車車遊樂園",
    );
    await expect(
      page.getByRole("heading", { level: 1, name: "桃園親子景點" }),
    ).toBeVisible();
    await expect(page.getByText("9 個可以去的景點")).toBeVisible();
    await expect(page.getByText("免費 6")).toBeVisible();
    await expect(page.getByText("室內 5")).toBeVisible();
    await expect(page.getByText("放電 5")).toBeVisible();
    await expect(page.locator('[class*="editorialInline"]')).toContainText(
      "媽米先看",
    );
    await expect(page.locator('[aria-labelledby="editorial-heading"]')).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("PR7");
    await expect(page.locator("body")).not.toContainText("active 清單");
    await expect(page.locator('[data-collection-card="true"]')).toHaveCount(9);
    await expect(
      page.getByRole("link", { name: "在地圖上看桃園景點" }),
    ).toHaveAttribute(
      "href",
      "/for-parents/play-map?city=%E6%A1%83%E5%9C%92%E5%B8%82&view=map",
    );
    await expect(
      page.locator('a[href="/for-parents/play-map/ty-fenghe"]'),
    ).toHaveCount(1);
    await expect(
      page.locator(
        'a[href="/for-parents/play-map/collections/taoyuan-free"]',
      ),
    ).toHaveCount(1);
    await expect(
      page.locator(
        'a[href="/for-parents/play-map/collections/taoyuan-indoor"]',
      ),
    ).toHaveCount(1);

    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const graph = jsonLd
      .map((text) => JSON.parse(text) as Record<string, unknown>)
      .find(
        (data) =>
          Array.isArray(data["@graph"]) &&
          (data["@graph"] as Record<string, unknown>[]).some(
            (item) => item["@type"] === "CollectionPage",
          ),
      );
    const graphItems = (graph?.["@graph"] as Record<string, unknown>[]) ?? [];
    expect(graphItems.map((item) => item["@type"])).toEqual(
      expect.arrayContaining(["CollectionPage", "ItemList"]),
    );
    const itemList = graphItems.find((item) => item["@type"] === "ItemList");
    expect(itemList?.numberOfItems).toBe(9);
    expect(
      jsonLd
        .map((text) => JSON.parse(text) as Record<string, unknown>)
        .some((data) => data["@type"] === "BreadcrumbList"),
    ).toBe(true);
    expect(
      JSON.stringify(itemList),
    ).toContain("/for-parents/play-map/ty-fenghe#place");
  });

  test("taoyuan-indoor launches with the indoor map filter", async ({
    page,
    request,
  }) => {
    const response = await request.get(
      "/for-parents/play-map/collections/taoyuan-indoor",
    );
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).not.toContain("leaflet-container");
    expect(html).toContain("桃園防災教育館");
    expect(html).not.toContain("雨天景點");

    await page.goto("/for-parents/play-map/collections/taoyuan-indoor");
    await expect(page).toHaveTitle("桃園室內親子景點｜車車遊樂園");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/for-parents\/play-map\/collections\/taoyuan-indoor$/,
    );
    await expect(page.getByText("5 個可以去的景點")).toBeVisible();
    await expect(page.getByText("免費 2")).toBeVisible();
    await expect(page.getByText("室內 5")).toBeVisible();
    await expect(page.locator('[data-collection-card="true"]')).toHaveCount(5);
    await expect(
      page.getByRole("link", { name: "在地圖上看桃園室內景點" }),
    ).toHaveAttribute(
      "href",
      "/for-parents/play-map?city=%E6%A1%83%E5%9C%92%E5%B8%82&indoor=1&view=map",
    );
    await expect(page.locator('[class*="editorialInline"]')).toContainText(
      "媽米先看",
    );
    await expect(
      page.locator('a[href="/for-parents/play-map/ty-disaster-education"]'),
    ).toHaveCount(1);

    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const graph = jsonLd
      .map((text) => JSON.parse(text) as Record<string, unknown>)
      .find(
        (data) =>
          Array.isArray(data["@graph"]) &&
          (data["@graph"] as Record<string, unknown>[]).some(
            (item) => item["@type"] === "CollectionPage",
          ),
      );
    const graphItems = (graph?.["@graph"] as Record<string, unknown>[]) ?? [];
    const itemList = graphItems.find((item) => item["@type"] === "ItemList");
    expect(itemList?.numberOfItems).toBe(5);
    expect(
      jsonLd
        .map((text) => JSON.parse(text) as Record<string, unknown>)
        .some((data) => data["@type"] === "BreadcrumbList"),
    ).toBe(true);
  });

  test("chiayi-city is distinct from the county and opens the city map filter", async ({
    page,
    request,
  }) => {
    const response = await request.get(
      "/for-parents/play-map/collections/chiayi-city",
    );
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).not.toContain("leaflet-container");
    expect(html).not.toContain("國立故宮博物院南部院區");

    await page.goto("/for-parents/play-map/collections/chiayi-city");
    await expect(page).toHaveTitle("嘉義市親子景點｜車車遊樂園");
    await expect(
      page.getByRole("heading", { level: 1, name: "嘉義市親子景點" }),
    ).toBeVisible();
    await expect(page.getByText("5 個可以去的景點")).toBeVisible();
    await expect(page.getByText("免費 2")).toBeVisible();
    await expect(page.getByText("室內 4")).toBeVisible();
    await expect(page.locator('[class*="editorialInline"]')).toHaveCount(0);
    await expect(page.locator('[data-collection-card="true"]')).toHaveCount(5);
    await expect(
      page.getByRole("link", { name: "在地圖上看嘉義市景點" }),
    ).toHaveAttribute(
      "href",
      "/for-parents/play-map?city=%E5%98%89%E7%BE%A9%E5%B8%82&view=map",
    );
    await expect(
      page.locator('a[href="/for-parents/play-map/collections/chiayi-city-indoor"]'),
    ).toHaveCount(0);
    await expect(
      page.locator('a[href="/for-parents/play-map/collections/chiayi-county"]'),
    ).toHaveCount(0);
    await expect(
      page.locator('a[href="/for-parents/play-map/cyc-chiayi-park"]'),
    ).toHaveCount(1);
  });

  test("taoyuan-free uses the free map filter and detail links", async ({
    page,
  }) => {
    await page.goto("/for-parents/play-map/collections/taoyuan-free");

    await expect(page).toHaveTitle("桃園免費親子景點｜車車遊樂園");
    await expect(page.getByText("6 個可以去的景點")).toBeVisible();
    await expect(page.getByText("免費 6")).toBeVisible();
    await expect(page.getByText("室內 2")).toBeVisible();
    await expect(page.getByText("放電 4")).toBeVisible();
    await expect(
      page.getByText("桃園目前 9 個親子景點中，有 6 個不用門票。"),
    ).toBeVisible();
    await expect(page.locator('[class*="editorialInline"]')).toContainText(
      "媽米先看",
    );
    await expect(page.locator('[data-redundant-flag="true"]')).toHaveCount(6);
    await expect(page.locator('[data-collection-card="true"]')).toHaveCount(6);
    await expect(
      page.getByRole("link", { name: "在地圖上看桃園免費景點" }),
    ).toHaveAttribute(
      "href",
      "/for-parents/play-map?city=%E6%A1%83%E5%9C%92%E5%B8%82&free=1&view=map",
    );
    await expect(
      page.locator(
        '[data-collection-card="true"] a[href="/for-parents/play-map/ty-kids-museum"]',
      ),
    ).toHaveCount(1);
  });

  test("hsinchu free communicates its parent relationship and outdoor trait", async ({
    page,
  }) => {
    await page.goto("/for-parents/play-map/collections/hsinchu-city-free");

    await expect(page).toHaveTitle("新竹免費親子景點｜車車遊樂園");
    await expect(page.getByText("6 個可以去的景點")).toBeVisible();
    await expect(page.getByText("免費 6")).toBeVisible();
    await expect(page.getByText("室內 0")).toBeVisible();
    await expect(page.getByText("放電 4")).toBeVisible();
    await expect(
      page.getByText(
        "新竹目前 8 個親子景點中，有 6 個不用門票。目前這 6 個免費選擇都是戶外景點。",
      ),
    ).toBeVisible();
    await expect(page.locator('[class*="editorialInline"]')).toContainText(
      "南寮親子沙灘",
    );
    await expect(page.getByRole("link", { name: "在地圖上看新竹免費景點" })).toHaveAttribute(
      "href",
      "/for-parents/play-map?city=%E6%96%B0%E7%AB%B9%E5%B8%82&free=1&view=map",
    );
    await expect(page.locator('[data-collection-card="true"]')).toHaveCount(6);
  });

  test("removed duplicate variants are absent while their Play Map filters remain available", async ({
    request,
  }) => {
    for (const slug of ["changhua-free", "chiayi-county-indoor", "chiayi-city-indoor"]) {
      const response = await request.get(
        `/for-parents/play-map/collections/${slug}`,
      );
      expect(response.status(), slug).toBe(404);
    }

    for (const query of [
      "/for-parents/play-map?city=%E5%BD%B0%E5%8C%96%E7%B8%A3&free=1&view=map",
      "/for-parents/play-map?city=%E5%98%89%E7%BE%A9%E7%B8%A3&indoor=1&view=map",
    ]) {
      const response = await request.get(query);
      expect(response.ok(), query).toBeTruthy();
    }

    const rainyResponse = await request.get(
      "/for-parents/play-map/collections/chiayi-county-rainy-day",
    );
    expect(rainyResponse.status()).toBe(404);
  });

  test("renders the same server content at desktop and mobile widths", async ({
    page,
  }) => {
    for (const viewport of [
      { width: 1280, height: 720 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/for-parents/play-map/collections/taoyuan");
      await expect(
        page.getByRole("heading", { level: 1, name: "桃園親子景點" }),
      ).toBeVisible();
      if (viewport.width === 390) {
        await expect(page.locator('nav[aria-label="麵包屑"]')).toBeHidden();
        await expect(
          page.getByRole("link", { name: /回各地親子景點整理/ }),
        ).toHaveCount(1);
        const firstCardBox = await page
          .locator('[data-collection-card="true"]')
          .first()
          .boundingBox();
        expect(firstCardBox?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(480);
      } else {
        await expect(page.locator('nav[aria-label="麵包屑"]')).toBeVisible();
        await expect(
          page.getByRole("link", { name: /回各地親子景點整理/ }),
        ).toBeHidden();
      }
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `${viewport.width}px horizontal overflow`).toBeLessThanOrEqual(1);
    }
  });
});
