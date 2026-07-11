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

const VISUAL_PAGES = [
  { id: "home", name: "首頁", path: "/" },
  { id: "stories", name: "全部故事", path: "/stories" },
  { id: "games", name: "遊樂園", path: "/games" },
  { id: "adventures", name: "宇宙地圖", path: "/adventures" },
  { id: "for-parents", name: "家長指南", path: "/for-parents" },
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

const THEMES: VisualTheme[] = ["light", "night"];

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
