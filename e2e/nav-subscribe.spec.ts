import { expect, test, type Page } from "@playwright/test";

/**
 * 頂欄訂閱下拉的幾何契約。
 *
 * `e2e/subscribe.spec.ts` 測的是 `/subscribe` **頁面表單**，與 `SiteNavBar`
 * 的訂閱下拉是兩個不同的東西——全 repo 對該下拉原本零幾何斷言。
 * 2026-09-02 稽核實測：`.dropdown` 錨定在只有 67px 寬的觸發鍵上（`.wrap`
 * 是 `position: relative`），240px 面板向左展開後左緣在 390/375/360 分別
 * 溢出 −23／−31／−38px，左圓角被切、貼齊螢幕邊，且頁面 scrollWidth 不變
 * （靜默裁切，橫向捲動偵測抓不到）。
 */

/** 頂欄（SiteNavBar）是 body 層第一個 header；內頁另有 SiteHeader。 */
function navBar(page: Page) {
  return page.locator("header").first();
}

function subscribeTrigger(page: Page) {
  return navBar(page).getByRole("button", { name: "訂閱" });
}

async function openSubscribe(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto("/stories");
  const trigger = subscribeTrigger(page);
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("menu")).toBeVisible();
  return trigger;
}

async function dropdownGeometry(page: Page) {
  return page.evaluate(() => {
    const menu = document.querySelector('[role="menu"]');
    if (!menu) throw new Error("訂閱下拉不存在");
    const r = menu.getBoundingClientRect();
    const items = [...menu.querySelectorAll("a")].map((a) => {
      const b = a.getBoundingClientRect();
      return {
        label: a.textContent?.trim() ?? "",
        left: b.left,
        right: b.right,
        top: b.top,
        bottom: b.bottom,
      };
    });
    return {
      menu: { left: r.left, right: r.right, top: r.top, bottom: r.bottom },
      items,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });
}

const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  // CSS 行為的實際切換點：480 套用新錨定、481 走原本的 .wrap 錨定
  { width: 480, height: 800 },
  { width: 481, height: 800 },
  { width: 768, height: 1024 },
  // 頂欄 980 斷點兩側：<980 漢堡＋一般頂欄，≥980 懸浮膠囊
  { width: 979, height: 720 },
  { width: 980, height: 720 },
  { width: 1280, height: 800 },
] as const;

test.describe("頂欄訂閱下拉：幾何", () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.width}px：下拉完整在畫面內，不溢出左右邊`, async ({ page }) => {
      await openSubscribe(page, vp.width, vp.height);
      const geo = await dropdownGeometry(page);

      expect(geo.menu.left).toBeGreaterThanOrEqual(8);
      expect(geo.menu.right).toBeLessThanOrEqual(geo.innerWidth - 8);
      // 靜默裁切不會撐大 scrollWidth，故此項是輔助而非主要斷言
      expect(geo.scrollWidth).toBeLessThanOrEqual(geo.innerWidth);

      expect(geo.items.length).toBeGreaterThan(1);
      for (const item of geo.items) {
        expect(item.left, `${item.label} 左緣`).toBeGreaterThanOrEqual(0);
        expect(item.right, `${item.label} 右緣`).toBeLessThanOrEqual(
          geo.innerWidth,
        );
        expect(item.bottom, `${item.label} 下緣`).toBeLessThanOrEqual(
          geo.innerHeight,
        );
      }
    });
  }

  test("240px 極窄：仍不溢出（min-width 的 264px 轉折點以下）", async ({
    page,
  }) => {
    await openSubscribe(page, 240, 600);
    const geo = await dropdownGeometry(page);
    expect(geo.menu.left).toBeGreaterThanOrEqual(0);
    expect(geo.menu.right).toBeLessThanOrEqual(geo.innerWidth);
  });

  for (const width of [360, 1280] as const) {
    test(`${width}px：下拉水平跨距須包住訂閱鍵（指向關係）`, async ({ page }) => {
      const trigger = await openSubscribe(page, width, 800);
      const geo = await dropdownGeometry(page);
      const box = (await trigger.boundingBox())!;
      expect(geo.menu.left).toBeLessThanOrEqual(box.x);
      expect(geo.menu.right).toBeGreaterThanOrEqual(box.x + box.width);
    });
  }

  /**
   * ≤480 的 `.wrap { position: static }` **不得**被推廣到全寬度：`.panel`
   * 也是 `.inner` 的子節點且 ≥980 用 `right: 16px`，全域套用會讓訂閱下拉與
   * 漢堡抽屜共用右緣、開在同一個位置。沒有這條，把 media query 拿掉仍全綠。
   */
  test("1280px：下拉不得與漢堡抽屜共用右緣（≥980 紅線）", async ({ page }) => {
    await openSubscribe(page, 1280, 800);
    const menuRight = (await dropdownGeometry(page)).menu.right;

    await page.keyboard.press("Escape");
    await navBar(page).getByRole("button", { name: /選單/ }).click();
    const panelRight = await page.evaluate(() => {
      const panel = document.querySelector('nav[aria-label="網站選單"]');
      return panel!.getBoundingClientRect().right;
    });

    expect(Math.abs(menuRight - panelRight)).toBeGreaterThan(1);
  });
});

test.describe("頂欄訂閱下拉：互動契約不得回歸", () => {
  test("Esc 關閉並把焦點還給觸發鍵", async ({ page }) => {
    const trigger = await openSubscribe(page, 360, 800);
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("點浮層外部關閉", async ({ page }) => {
    const trigger = await openSubscribe(page, 360, 800);
    // 刻意點頁尾空白：/stories 中段滿是故事卡，點下去會導頁，
    // 之後 trigger 在新頁面重新解析仍回報 aria-expanded=false → 假綠
    await page.locator("footer").click({ position: { x: 5, y: 5 } });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("menu")).toHaveCount(0);
  });

  test("同時只開一個浮層：開訂閱時漢堡抽屜必須是關的", async ({ page }) => {
    await openSubscribe(page, 360, 800);
    const menuBtn = navBar(page).getByRole("button", { name: /選單/ });
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");

    // 反向：開抽屜時訂閱必須收起
    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "true");
    await expect(subscribeTrigger(page)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
