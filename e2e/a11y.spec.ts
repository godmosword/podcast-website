import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * 無障礙回歸：用 axe-core 掃描主要頁面，只擋下 critical / serious 等級的問題，
 * 避免裝飾性低風險規則造成假性失敗。新頁面請一併補進清單。
 */
const PAGES: { name: string; path: string; exclude?: string }[] = [
  { name: "首頁 Landing", path: "/" },
  { name: "全部故事", path: "/stories" },
  { name: "關於我們", path: "/about" },
  { name: "主題索引", path: "/topic" },
  { name: "遊樂園", path: "/games" },
  // 遊戲頁只排除遊戲自身的美術節點（canvas／iframe／標題屏），DESIGN.md 允許這些用
  // component-local 固定色。**不排除 `#game-play` 整區** —— 暫停／靜音／設定工具列是
  // 兒童最常點的控制，必須留在回歸掃描範圍內。
  {
    name: "遊戲頁（探索）",
    path: "/games/candy-match",
    exclude: "canvas, iframe, [class*=titleScreen], [class*=gameTitle]",
  },
  { name: "宇宙地圖", path: "/adventures" },
  { name: "親子遊樂地圖", path: "/for-parents/play-map" },
];

const BLOCKING_IMPACTS = new Set(["critical", "serious"]);

for (const pageDef of PAGES) {
  test(`a11y：${pageDef.name} 無 critical/serious 違規`, async ({ page }) => {
    await page.goto(pageDef.path);
    let builder = new AxeBuilder({ page }).withTags([
      "wcag2a",
      "wcag2aa",
      "wcag21a",
      "wcag21aa",
    ]);
    if (pageDef.exclude) builder = builder.exclude(pageDef.exclude);
    const results = await builder.analyze();

    const blocking = results.violations.filter(
      (v) => v.impact != null && BLOCKING_IMPACTS.has(v.impact),
    );

    expect(
      blocking,
      blocking
        .map((v) => `[${v.impact}] ${v.id}: ${v.help}`)
        .join("\n"),
    ).toEqual([]);
  });
}

test("a11y：故事詳情頁無 critical/serious 違規", async ({ page }) => {
  await page.goto("/stories");
  const firstStory = page.locator('main a[href^="/story/"]').first();
  const href = await firstStory.getAttribute("href");
  await page.goto(href!);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const blocking = results.violations.filter(
    (v) => v.impact != null && BLOCKING_IMPACTS.has(v.impact),
  );

  expect(
    blocking,
    blocking.map((v) => `[${v.impact}] ${v.id}: ${v.help}`).join("\n"),
  ).toEqual([]);
});

test("a11y：宇宙地圖島路徑（召喚抽屜、探索點）無 critical/serious 違規", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => {
    window.sessionStorage.setItem("cc-universe-entry-played", "1");
  });
  await page.goto("/adventures/dino");
  await expect(page.getByRole("button", { name: "來這裡逛逛" })).toBeVisible({
    timeout: 5000,
  });
  await expect(page.locator('[data-hotspot-id="story-house"]')).toBeVisible({
    timeout: 3000,
  });
  await expect(page.getByRole("region", { name: /恐龍島/ })).toHaveCount(0);

  const collapsed = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const collapsedBlocking = collapsed.violations.filter(
    (v) => v.impact != null && BLOCKING_IMPACTS.has(v.impact),
  );

  expect(
    collapsedBlocking,
    collapsedBlocking
      .map((v) => `[${v.impact}] ${v.id}: ${v.help}`)
      .join("\n"),
  ).toEqual([]);

  await page.getByRole("button", { name: "來這裡逛逛" }).click();
  await expect(page.getByRole("region", { name: /恐龍島/ })).toBeVisible();

  const expanded = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const expandedBlocking = expanded.violations.filter(
    (v) => v.impact != null && BLOCKING_IMPACTS.has(v.impact),
  );

  expect(
    expandedBlocking,
    expandedBlocking
      .map((v) => `[${v.impact}] ${v.id}: ${v.help}`)
      .join("\n"),
  ).toEqual([]);
});

/**
 * 上面的 PAGES 迴圈只掃預設的卡片檢視，地圖檢視與詳情 Sheet 從未進掃描範圍——
 * Leaflet marker 的巢狀互動元素違規曾因此長期存活。這裡補雙態掃描。
 */
test("a11y：親子遊樂地圖（地圖檢視、地點詳情）無 critical/serious 違規", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/for-parents/play-map?city=%E5%8F%B0%E5%8C%97%E5%B8%82");

  await page.getByRole("tab", { name: "地圖" }).click();
  await expect(page.locator(".leaflet-container")).toBeVisible({
    timeout: 15_000,
  });
  const firstMarker = page.locator(".playMapMarkerButton").first();
  await expect(firstMarker).toBeVisible({ timeout: 15_000 });

  /*
   * OSM 會擋 headless UA，圖磚在 e2e 幾乎不會載完，networkidle 也等不到穩態。
   * 直接等 Leaflet 完成一次 fitBounds／縮放動畫後的靜止狀態再掃，
   * 否則會掃到過場中的半透明疊層而偶發 color-contrast 假陽性。
   */
  await page.waitForFunction(
    () => !document.querySelector(".leaflet-zoom-anim"),
    undefined,
    { timeout: 10_000 },
  );
  await page.waitForTimeout(1_000);

  const mapView = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const mapBlocking = mapView.violations.filter(
    (v) => v.impact != null && BLOCKING_IMPACTS.has(v.impact),
  );

  expect(
    mapBlocking,
    mapBlocking.map((v) => `[${v.impact}] ${v.id}: ${v.help}`).join("\n"),
  ).toEqual([]);

  // 標記彼此的 44×44 命中區會重疊，force 只為穩定開啟 Sheet，非受測行為。
  await firstMarker.click({ force: true });
  await expect(page.getByRole("region", { name: /詳情$/ })).toBeVisible({
    timeout: 5_000,
  });

  const sheetOpen = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const sheetBlocking = sheetOpen.violations.filter(
    (v) => v.impact != null && BLOCKING_IMPACTS.has(v.impact),
  );

  expect(
    sheetBlocking,
    sheetBlocking.map((v) => `[${v.impact}] ${v.id}: ${v.help}`).join("\n"),
  ).toEqual([]);
});

test("a11y：桌面親子指南直連可見且無 critical/serious 違規", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  const capsuleNav = page.getByRole("navigation", { name: "主要分區" });
  const parentGuideLink = capsuleNav.getByRole("link", { name: "親子指南" });
  await expect(parentGuideLink).toBeVisible();
  await expect(parentGuideLink).toHaveAttribute("href", /\/for-parents/);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const blocking = results.violations.filter(
    (v) => v.impact != null && BLOCKING_IMPACTS.has(v.impact),
  );

  expect(
    blocking,
    blocking.map((v) => `[${v.impact}] ${v.id}: ${v.help}`).join("\n"),
  ).toEqual([]);
});
