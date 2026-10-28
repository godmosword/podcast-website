import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Public-site accessibility gate. Gameplay and map interaction scans remain
 * in e2e/a11y.spec.ts so this required check cannot change the stable game
 * baseline or become dependent on Leaflet/OSM timing.
 */
const PUBLIC_PAGES = [
  { name: "首頁", path: "/" },
  { name: "全部故事", path: "/stories" },
  { name: "主題索引", path: "/topic" },
  { name: "角色圖鑑", path: "/characters" },
  { name: "關於我們", path: "/about" },
  { name: "家庭儀表板", path: "/for-parents/dashboard" },
  { name: "育兒文章分享", path: "/for-parents/articles" },
  { name: "育兒文章內頁", path: "/for-parents/articles/vision-care-1" },
  { name: "電子報", path: "/newsletter" },
  { name: "電子報內頁", path: "/newsletter/2026-10-28" },
  { name: "電子報 10/23", path: "/newsletter/2026-10-23" },
  { name: "電子報 10/20", path: "/newsletter/2026-10-20" },
  { name: "電子報 10/16", path: "/newsletter/2026-10-16" },
  { name: "電子報 10/13", path: "/newsletter/2026-10-13" },
  { name: "電子報 10/09", path: "/newsletter/2026-10-09" },
  { name: "訂閱", path: "/subscribe" },
  { name: "留言牆", path: "/feedback" },
  { name: "法律頁", path: "/legal" },
  { name: "故事詳情", path: "/story/ep-3" },
  { name: "故事播放", path: "/story/ep-3/play" },
  { name: "宇宙地圖入口", path: "/adventures" },
  { name: "景點集合", path: "/for-parents/play-map/collections" },
] as const;

const BLOCKING_IMPACTS = new Set(["critical", "serious"]);

// Keep this required gate deterministic. Night-theme contrast has its own
// visual/accessibility regression coverage; system bedtime must not make CI
// depend on the runner's local clock.
test.use({ colorScheme: "light" });

async function expectAccessible(page: Page, path: string): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem(
      "cheche:progress",
      JSON.stringify({ preferences: { theme: "light" } }),
    );
  });
  // Keep this gate focused on Landing. The optional first-session invitation
  // has its own Intro Portal coverage.
  const target = path === "/" ? "/?enter=1" : path;
  await page.goto(target, { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact != null && BLOCKING_IMPACTS.has(violation.impact),
  );
  expect(
    blocking,
    `${path}\n${blocking.map((v) => `[${v.impact}] ${v.id}: ${v.help}`).join("\n")}`,
  ).toEqual([]);
}

for (const pageDefinition of PUBLIC_PAGES) {
  test(`a11y：${pageDefinition.name} 無 critical/serious 違規`, async ({ page }) => {
    await expectAccessible(page, pageDefinition.path);
  });
}
