import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * 無障礙回歸：用 axe-core 掃描主要頁面，只擋下 critical / serious 等級的問題，
 * 避免裝飾性低風險規則造成假性失敗。新頁面請一併補進清單。
 */
const PAGES: { name: string; path: string }[] = [
  { name: "首頁 Landing", path: "/" },
  { name: "全部故事", path: "/stories" },
  { name: "關於我們", path: "/about" },
  { name: "主題索引", path: "/topic" },
  { name: "遊樂園", path: "/games" },
  { name: "宇宙地圖", path: "/adventures" },
];

const BLOCKING_IMPACTS = new Set(["critical", "serious"]);

for (const pageDef of PAGES) {
  test(`a11y：${pageDef.name} 無 critical/serious 違規`, async ({ page }) => {
    await page.goto(pageDef.path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

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

test("a11y：宇宙地圖開 sheet 無 critical/serious 違規", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => {
    window.sessionStorage.setItem("cc-universe-entry-played", "1");
  });
  await page.goto("/adventures/dino");
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 3000 });

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

test("a11y：桌面家長指南直連可見且無 critical/serious 違規", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  const capsuleNav = page.getByRole("navigation", { name: "主要分區" });
  const parentGuideLink = capsuleNav.getByRole("link", { name: "家長指南" });
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
