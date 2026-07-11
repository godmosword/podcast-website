import { test, expect } from "@playwright/test";
import { stabilizeVisualPage } from "./visual-helpers";

/**
 * D2-A 視覺回歸 smoke baseline（Phase A：5 條黃金路徑 × Desktop 1280 light）。
 * Phase B 再擴 8 主頁 × 390/1280 × light/night 完整矩陣。
 */
test.describe.configure({ mode: "serial" });

const SMOKE_PAGES = [
  { id: "home", name: "首頁", path: "/" },
  { id: "stories", name: "全部故事", path: "/stories" },
  { id: "games", name: "遊樂園", path: "/games" },
  { id: "adventures", name: "宇宙地圖", path: "/adventures" },
  { id: "for-parents", name: "家長指南", path: "/for-parents" },
] as const;

test.setTimeout(90_000);

test.use({
  viewport: { width: 1280, height: 720 },
  colorScheme: "light",
});

for (const pageDef of SMOKE_PAGES) {
  test(`visual smoke：${pageDef.name}`, async ({ page }) => {
    await page.goto(pageDef.path);
    await stabilizeVisualPage(page);
    await expect(page).toHaveScreenshot(`${pageDef.id}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });
}
