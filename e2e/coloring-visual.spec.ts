import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { stabilizeVisualPage, type VisualTheme } from "./visual-helpers";

const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 664 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1280, height: 720 },
  { width: 844, height: 390 },
];

test.beforeAll(() => {
  if (process.env.VISUAL_BASELINE_TRUSTED !== "1")
    throw new Error("Review visual baselines with VISUAL_BASELINE_TRUSTED=1");
});

async function capture(page: Page, name: string, a11y: boolean) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const image of document.images) image.loading = "eager";
    await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
    window.scrollTo(0, 0);
  });
  await page.mouse.move(0, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (a11y) {
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
  }
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: (await page.getByRole("dialog").count()) === 0,
    animations: "disabled",
  });
}

for (const viewport of viewports)
  for (const theme of ["light", "night"] as const)
    test(`${viewport.width}×${viewport.height} ${theme}: cover, tools, completion and collection`, async ({ page }) => {
      test.setTimeout(60000);
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "reduce" });
      const prefix = `coloring-${viewport.width}x${viewport.height}-${theme}`;
      const a11y = viewport.width === 390 && viewport.height === 844;
      await page.goto("/games/coloring-book");
      await stabilizeVisualPage(page, { theme: theme as VisualTheme });
      await expect(page.getByRole("button", { name: "打開著色本" })).toBeVisible();
      await capture(page, `${prefix}-cover`, a11y);
      await page.getByRole("button", { name: "打開著色本" }).click();
      await capture(page, `${prefix}-picker`, a11y);
      await page.getByRole("button", { name: "著色：恐龍車多多 · 大色塊", exact: true }).click();
      await expect(page.getByRole("button", { name: "蠟筆", exact: true })).toBeEnabled();
      await capture(page, `${prefix}-canvas`, a11y);
      for (const name of ["蠟筆", "填滿", "擦掉", "復原", "更多"]) {
        const box = await page.getByRole("button", { name, exact: true }).boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
      }
      await page.getByRole("button", { name: "更多", exact: true }).click();
      await capture(page, `${prefix}-more`, a11y);
      await page.getByRole("button", { name: "關閉", exact: true }).click();
      await page.getByRole("button", { name: "填滿", exact: true }).click();
      await page.locator("canvas").click({ position: { x: 5, y: 5 } });
      await page.getByRole("button", { name: "我塗好了", exact: true }).click();
      await expect(page.getByText("作品已收藏在這台裝置", { exact: true })).toBeVisible();
      await capture(page, `${prefix}-done`, a11y);
      await page.getByRole("button", { name: "換一張塗", exact: true }).click();
      await expect(page.getByRole("button", { name: /看作品/ })).toBeVisible();
      await capture(page, `${prefix}-collection`, a11y);
      await page.getByRole("button", { name: /看作品/ }).click();
      await expect(page.getByAltText("恐龍車多多 · 大色塊完成作品")).toBeVisible();
      await capture(page, `${prefix}-viewer`, a11y);
      await page.keyboard.press("Escape");
      await page.goto("/games/coloring-book");
      await expect(page.getByRole("button", { name: /繼續塗：/ })).toBeVisible();
      await capture(page, `${prefix}-resume`, a11y);
    });
