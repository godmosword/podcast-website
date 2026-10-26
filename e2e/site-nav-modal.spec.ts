import { expect, test, type Page } from "@playwright/test";
import { skipIntroOverlay } from "./intro-gate";

/**
 * 全站選單抽屜＝完整模態（10 月待辦 3）：Chromium 與 WebKit 都跑（WebKit 由 playwright.config 的
 * webkit project 只挑這支）。iOS Safari 真機另外驗。
 */
test.beforeEach(async ({ page }) => {
  await skipIntroOverlay(page);
});

const trigger = (page: Page) => page.getByRole("button", { name: "選單", exact: true });
/** main 是否在 inert 子樹裡（inert 可能設在 main 的外層）。 */
const mainInert = (page: Page) => page.evaluate(() => document.querySelector("main")?.closest("[inert]") !== null);
const drawer = (page: Page) => page.getByRole("navigation", { name: "網站選單" });

for (const vp of [
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
]) {
  test(`${vp.width}：開著時背景點不到、Tab 只在抽屜與觸發器之間繞；Esc 關閉、焦點回觸發器`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto("/stories");
    await trigger(page).click();
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
    await expect(drawer(page)).toBeVisible();
    expect(await mainInert(page)).toBe(true);
    // 畫面中間點下去是遮罩，不是背景的卡片
    const hit = await page.evaluate(() => {
      const el = document.elementFromPoint(innerWidth / 2, innerHeight - 40);
      return el?.hasAttribute("data-nav-scrim") || !!el?.closest("nav[aria-label='網站選單']");
    });
    expect(hit).toBe(true);

    const links = await drawer(page).getByRole("link").count();
    for (let i = 0; i < links + 3; i++) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(() => {
        const a = document.activeElement;
        return !!a?.closest("nav[aria-label='網站選單']") || a?.getAttribute("aria-label") === "選單";
      });
      expect(inside, `第 ${i + 1} 次 Tab`).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    await expect(trigger(page)).toBeFocused();
    expect(await mainInert(page)).toBe(false);
  });
}

test("390：開著時頁面捲不動，點遮罩關閉後回到原本的捲動位置與 overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/stories");
  await page.evaluate(() => {
    document.documentElement.style.overflow = "";
    window.scrollTo(0, 600);
  });
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(600);
  await trigger(page).click();
  await expect(page.locator("html")).toHaveCSS("overflow", "hidden");
  await page.mouse.move(195, 700);
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(300);
  expect(Math.round(await page.evaluate(() => window.scrollY))).toBe(600);

  await page.locator("[data-nav-scrim]").click({ position: { x: 20, y: 820 } });
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  await expect(trigger(page)).toBeFocused();
  expect(Math.round(await page.evaluate(() => window.scrollY))).toBe(600);
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
});

test("首頁：開著時首頁自己的捲動區也鎖住，關閉後還原", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const scroller = page.locator("[data-landing-scroll]");
  await expect(scroller).toBeVisible();
  await trigger(page).click();
  await expect(scroller).toHaveCSS("overflow-y", "hidden");
  await page.keyboard.press("Escape");
  await expect(scroller).not.toHaveCSS("overflow-y", "hidden");
});

test("跨過 979／980 斷點就關閉，焦點回觸發器、背景解除 inert", async ({ page }) => {
  await page.setViewportSize({ width: 979, height: 800 });
  await page.goto("/stories");
  await trigger(page).click();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
  await page.setViewportSize({ width: 980, height: 800 });
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  await expect(trigger(page)).toBeFocused();
  await expect(page.locator("main")).not.toHaveAttribute("inert", "");
});

test("點抽屜裡的連結換頁後抽屜關閉、背景可操作", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/stories");
  await trigger(page).click();
  await drawer(page).getByRole("link", { name: /角色圖鑑/ }).click();
  await expect(page).toHaveURL(/\/characters/);
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("main")).not.toHaveAttribute("inert", "");
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
});

test("開著抽屜按瀏覽器上一頁：抽屜關閉、背景可操作、捲動解鎖", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/about");
  await page.goto("/stories");
  await trigger(page).click();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
  await page.goBack();
  await expect(page).toHaveURL(/\/about$/);
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  expect(await mainInert(page)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
});

test("抽屜連結在伺服器輸出的 HTML 裡（關閉狀態也在）", async ({ request }) => {
  const html = await (await request.get("/stories")).text();
  expect(html).toContain('aria-label="網站選單"');
  expect(html).toContain('href="/characters"');
  expect(html).toMatch(/aria-label="選單"/);
});
