import { test, expect } from "@playwright/test";
import {
  stabilizeVisualPage,
  type VisualTheme,
  type VisualViewportId,
} from "./visual-helpers";

/**
 * D2 視覺回歸：Phase A smoke（5 頁 × 1280 light）+ Phase B 完整 32 組。
 * 8 主頁 × 390/1280 × light/night。
 */
test.describe.configure({ mode: "serial" });

/** VIS-DEBT-1：baseline 與本機渲染環境脫節；預設 skip，勿盲 --update-snapshots。 */
const VISUAL_SKIP_REASON =
  "VIS-DEBT-1：視覺 baseline 未對齊此環境（OS／字型／Chromium）。預設 skip；重產前對齊產生環境後用 npm run test:visual:trusted（VISUAL_BASELINE_TRUSTED=1）。";

test.beforeEach(() => {
  test.skip(process.env.VISUAL_BASELINE_TRUSTED !== "1", VISUAL_SKIP_REASON);
});

const VISUAL_PAGES = [
  { id: "home", name: "首頁", path: "/" },
  { id: "stories", name: "全部故事", path: "/stories" },
  { id: "games", name: "遊樂園", path: "/games" },
  { id: "adventures", name: "宇宙地圖", path: "/adventures" },
  { id: "for-parents", name: "親子指南", path: "/for-parents" },
  { id: "characters", name: "角色圖鑑", path: "/characters" },
  { id: "about", name: "關於", path: "/about" },
  { id: "subscribe", name: "訂閱", path: "/subscribe" },
] as const;

const VIEWPORTS: Record<
  VisualViewportId,
  { width: number; height: number; label: string }
> = {
  mobile: { width: 390, height: 844, label: "390" },
  desktop: { width: 1280, height: 720, label: "1280" },
};

/** SiteNavBar desktopNav 斷點 980：頂欄 clip 回歸（漢堡／膠囊交界）。 */
const NAV_BREAKPOINT_VIEWPORTS = [
  { width: 979, height: 720, label: "979" },
  { width: 980, height: 720, label: "980" },
  { width: 1024, height: 720, label: "1024" },
] as const;

const THEMES: VisualTheme[] = ["light", "night"];
const LANDING_SEGMENTS = [
  { id: "stories", anchorId: "segment-stories" },
  { id: "bedtime", anchorId: "segment-bedtime" },
  { id: "clay", anchorId: "segment-clay" },
  { id: "health", anchorId: "segment-health" },
] as const;

/** Phase A：保留 5 條黃金路徑 smoke（向後相容檔名）。 */
const SMOKE_PAGE_IDS = new Set([
  "home",
  "stories",
  "games",
  "adventures",
  "for-parents",
]);

test.setTimeout(120_000);

for (const pageDef of VISUAL_PAGES) {
  for (const viewportId of Object.keys(VIEWPORTS) as VisualViewportId[]) {
    for (const theme of THEMES) {
      const viewport = VIEWPORTS[viewportId];
      const isPhaseASmoke =
        viewportId === "desktop" &&
        theme === "light" &&
        SMOKE_PAGE_IDS.has(pageDef.id);

      const snapshotName = isPhaseASmoke
        ? `${pageDef.id}.png`
        : `${pageDef.id}-${viewport.label}-${theme}.png`;

      test(`visual：${pageDef.name} ${viewport.label} ${theme}`, async ({
        page,
      }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        await page.goto(pageDef.path);
        await stabilizeVisualPage(page, { theme });
        await expect(page).toHaveScreenshot(snapshotName, {
          fullPage: true,
          maxDiffPixelRatio: theme === "night" ? 0.03 : 0.02,
          animations: "disabled",
        });
      });
    }
  }
}

// Landing 專用全覽：四段都各自留 390/1280 × light/night baseline，
// 避免全頁截圖只覆蓋第一個內部 scroll-snap panel。
for (const viewportId of Object.keys(VIEWPORTS) as VisualViewportId[]) {
  for (const theme of THEMES) {
    const viewport = VIEWPORTS[viewportId];
    test(`visual：Landing 四段 ${viewport.label} ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");
      await stabilizeVisualPage(page, { theme });

      for (const segment of LANDING_SEGMENTS) {
        await page.locator(`#${segment.anchorId}`).scrollIntoViewIfNeeded();
        await page.waitForTimeout(80);
        await expect(page).toHaveScreenshot(
          `landing-${segment.id}-${viewport.label}-${theme}.png`,
          {
            fullPage: false,
            maxDiffPixelRatio: theme === "night" ? 0.03 : 0.02,
            animations: "disabled",
          },
        );
      }
    });
  }
}

// 頂欄 IA／980 斷點：只截 header，避免全頁噪音。
for (const viewport of NAV_BREAKPOINT_VIEWPORTS) {
  test(`visual：頂欄導覽 ${viewport.label} light`, async ({ page }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.goto("/");
    await stabilizeVisualPage(page, { theme: "light" });
    const header = page.locator("header").first();
    await expect(header).toHaveScreenshot(
      `site-nav-${viewport.label}-light.png`,
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.02,
      },
    );
  });
}
