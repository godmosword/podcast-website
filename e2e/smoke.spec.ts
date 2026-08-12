import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("Landing Hub 全螢幕分段與導覽", async ({ page }) => {
  await page.goto("/");
  // 品牌在 sticky 頂欄；桌面（≥980px）走 1c 膠囊內嵌導覽，漢堡僅行動版
  await expect(page.getByRole("link", { name: /車車遊樂園/ })).toBeVisible();
  const capsuleNav = page.getByRole("navigation", { name: "主要分區" });
  await expect(capsuleNav.getByRole("link", { name: "全部故事" })).toBeVisible();
  await expect(capsuleNav.getByRole("link", { name: "遊樂園" })).toBeVisible();
  await expect(capsuleNav.getByRole("link", { name: "宇宙地圖" })).toBeVisible();
  await expect(capsuleNav.getByRole("link", { name: "主題分類" })).toHaveCount(0);
  // 育兒專欄（Threads）已整併進 /for-parents 頁內區塊
  await expect(capsuleNav.getByRole("link", { name: /育兒專欄/ })).toHaveCount(0);
  const parentGuideLink = capsuleNav.getByRole("link", { name: "親子指南" });
  await expect(parentGuideLink).toBeVisible();
  await expect(parentGuideLink).toHaveAttribute("href", /\/for-parents/);
  const playMapLink = capsuleNav.getByRole("link", { name: "親子景點" });
  await expect(playMapLink).toBeVisible();
  await expect(playMapLink).toHaveAttribute("href", /\/for-parents\/play-map/);
  await expect(capsuleNav.getByRole("button", { name: /更多/ })).toHaveCount(0);
  await expect(capsuleNav.getByRole("menu")).toHaveCount(0);
  await expect(capsuleNav.getByText("指南首頁")).toHaveCount(0);

  await expect(page.getByRole("button", { name: "開啟選單" })).toBeHidden();
  // 第一段（車車故事）標題與 CTA、以及四段標題都存在
  await expect(page.getByRole("heading", { name: /車車與\s?遊樂園的故事/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "全部故事 →" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /數綿羊/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /捏黏土/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /陪孩子建立好習慣/ })).toBeVisible();
  // 往下箭頭錨點存在
  await expect(
    page.getByRole("link", { name: "捲動到下一個專區" }).first(),
  ).toBeVisible();
});

test("Landing Hub 在手機尺寸維持四段可見", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  // 行動版漢堡選單；主題分類與桌面一致不進導覽（頁面仍可直達 /topic）
  await expect(page.getByRole("button", { name: "開啟選單" })).toBeVisible();
  await page.getByRole("button", { name: "開啟選單" }).click();
  const drawerNav = page.getByRole("navigation", { name: "網站選單" });
  await expect(drawerNav.getByRole("link", { name: "主題分類" })).toHaveCount(0);
  await expect(drawerNav.getByRole("link", { name: "角色圖鑑" })).toBeVisible();
  await expect(drawerNav.getByRole("link", { name: "繪本著色" })).toBeVisible();
  const drawerParentGuide = drawerNav.getByRole("link", { name: "親子指南" });
  await expect(drawerParentGuide).toBeVisible();
  await expect(drawerParentGuide).toHaveAttribute("href", /\/for-parents/);
  const drawerPlayMap = drawerNav.getByRole("link", { name: "親子景點" });
  await expect(drawerPlayMap).toBeVisible();
  await expect(drawerPlayMap).toHaveAttribute("href", /\/for-parents\/play-map/);
  await expect(drawerNav.getByRole("link", { name: "關於我們" })).toHaveCount(0);
  await expect(drawerNav.getByRole("link", { name: "聯絡我們" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /車車與\s?遊樂園的故事/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /陪孩子建立好習慣/ })).toBeVisible();
});

test("Landing 播放直達鈕一次點擊即開始播放", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("link", { name: /聽最新一集/ }).click();
  await expect(page).toHaveURL(/\/story\/[^/]+\/play\?autoplay=1&from=landing/);
  await expect(
    page.getByRole("button", { name: "暫停", exact: true }),
  ).toBeVisible({ timeout: 10_000 });
});

test("全部故事頁 → 詳情 → 播放頁 smoke", async ({ page }) => {
  await page.goto("/stories");
  await expect(page.getByRole("heading", { name: "找故事" })).toBeVisible();

  const firstStory = page.locator('main a[href^="/story/"]').first();
  await expect(firstStory).toBeVisible();
  const firstStoryHref = await firstStory.getAttribute("href");
  expect(firstStoryHref).toMatch(/^\/story\//);
  await page.goto(firstStoryHref!);

  await expect(page.getByRole("link", { name: /開始看故事/ })).toBeVisible();
  const playHref = await page
    .getByRole("link", { name: /開始看故事/ })
    .getAttribute("href");
  expect(playHref).toBeTruthy();
  await page.goto(playHref!);

  await expect(
    page.getByRole("button", { name: "播放", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^字幕：/ })).toBeVisible();
});

test("404 頁面", async ({ page }) => {
  const response = await page.goto("/story/not-real-slug", {
    waitUntil: "networkidle",
  });
  expect(response?.status()).toBe(404);
});

test("遊樂園 v2 入口與遊戲卡片", async ({ page }) => {
  await page.goto("/games");
  await expect(page.getByRole("heading", { name: "車車遊樂園" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "全部遊戲" })).toBeVisible();
  await expect(page.getByRole("link", { name: /繽紛消消樂.*開始玩/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /繽紛樂園.*開始玩/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /繪本著色.*開始玩/ })).toBeVisible();
});

test("關於頁面", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "關於車車遊樂園" })).toBeVisible();
});

test("車車宇宙樂園地圖 smoke", async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.removeItem("cc-universe-tap-hint-shown");
  });
  await page.goto("/adventures");
  await expect(
    page.getByRole("region", { name: "車車宇宙樂園地圖" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("點一座島飛過去");
  await expect(page.getByRole("status")).toContainText("來這裡逛逛");

  await expect(
    page.getByRole("button", { name: /恐龍島/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /恐龍島/ }).click();
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page).toHaveURL(/\/adventures\/dino$/);
  await expect(page.getByText("還在蓋喔！")).toHaveCount(0);
  await expect(page.locator("[data-hotspot-id]").first()).toBeVisible({
    timeout: 5_000,
  });
  await expect(page.getByRole("button", { name: "來這裡逛逛" })).toBeVisible({
    timeout: 5000,
  });
  await expect(page.getByRole("region", { name: /恐龍島/ })).toHaveCount(0);

  await page
    .getByRole("button", { name: "回樂園（置中車車樂園）" })
    .click();
  await expect
    .poll(() => new URL(page.url()).pathname)
    .toBe("/adventures");

  await expect(
    page.locator('button[data-zone="car-park"]'),
  ).toBeVisible();
  await page.locator('button[data-zone="car-park"]').click();
  await expect(page).toHaveURL(/\/adventures\/car-park$/);
  await expect(page.locator("[data-hotspot-id]").first()).toBeVisible({
    timeout: 5_000,
  });
});

test("節目數據中心 /studio", async ({ page }) => {
  await page.goto("/studio");
  await expect(page.getByRole("heading", { name: "節目數據中心" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "平台後台捷徑" })).toBeVisible();
  await expect(page.getByRole("link", { name: "開啟後台" }).first()).toBeVisible();
});

test("首頁 Hero 不含節目數據入口", async ({ page }) => {
  await page.goto("/stories");
  const header = page.locator("header");
  await expect(header.getByRole("link", { name: "節目數據" })).toHaveCount(0);
});

test("繽紛樂園（Block Drop）頁面可載入", async ({ page }) => {
  await page.goto("/games/block-drop");
  await expect(page.getByRole("link", { name: "回遊樂園" })).toBeVisible();
  await expect(page.getByLabel(/^分數 /)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("progressbar")).toBeVisible();
});

test("家庭儀表板頁面可載入", async ({ page }) => {
  await page.goto("/for-parents/dashboard");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "家庭儀表板" })).toBeVisible();
  await expect(main.getByRole("heading", { name: "小遊戲探索摘要" })).toBeVisible();
  await expect(main.getByRole("heading", { name: "推薦共讀故事" })).toBeVisible();
  await expect(main.getByLabel("家長安心資訊")).toBeVisible();
});

test("繽紛消消樂：標題 → 地圖 → 第 1 關棋盤", async ({ page }) => {
  await page.goto("/games/candy-match");
  await expect(page.getByRole("heading", { name: "繽紛消消樂" })).toBeVisible();
  await page.getByRole("button", { name: /開始/ }).click();
  await expect(page.getByText("遊樂園地圖")).toBeVisible();
  await page.getByRole("button", { name: /第 1 關/ }).click();
  await expect(page.getByTestId("candy-match-board")).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "任務完成度" })).toBeVisible();
  // 任務列與道具列存在
  await expect(page.getByText(/泡泡/)).toBeVisible();
  await expect(page.getByRole("button", { name: /提示/ })).toBeVisible();
});
