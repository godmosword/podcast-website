import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("Landing Hub 全螢幕分段與導覽", async ({ page }) => {
  await page.goto("/");
  // 品牌在 sticky 頂欄、選單鍵可用
  await expect(page.getByRole("link", { name: /車車遊樂園/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "開啟選單" })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: /車車與\s?遊樂園的故事/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /陪孩子建立好習慣/ })).toBeVisible();
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

test("關於頁面", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "關於車車遊樂園" })).toBeVisible();
});

test("車車宇宙樂園地圖 smoke", async ({ page }) => {
  await page.goto("/adventures");
  await expect(
    page.getByRole("region", { name: "車車宇宙樂園地圖" }),
  ).toBeVisible();
  // 統一點擊語意：點鎖島本體一次即開介紹 sheet
  await expect(
    page.getByRole("button", { name: /恐龍島，建造中/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /恐龍島，建造中/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 2_000 });
  await expect(page.getByText("恐龍島還在蓋")).toBeVisible();
  // 家長內容收進「給爸爸媽媽」disclosure，孩子首屏不見許願表單
  await expect(page.getByRole("button", { name: "給爸爸媽媽" })).toBeVisible();
  await expect(page.getByText("想留一句話")).toHaveCount(0);
  await expect(page.getByPlaceholder("暱稱或 Email")).toHaveCount(0);
  await page.getByRole("button", { name: "關閉" }).click();

  await expect(
    page.getByRole("button", { name: /車車樂園，開放中/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /車車樂園，開放中/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 2_000 });
  await expect(page.getByRole("heading", { name: "車車樂園" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "車車樂園入口" })).toBeVisible();
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

test("繽紛卡丁車 debugFinish 會透過 Godot iframe 更新進度", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/games/candy-kart?debugFinish=macaron-meadow");
  await expect(page.getByRole("link", { name: "← 回遊樂園" })).toBeVisible();
  await expect(page.locator("iframe[title='繽紛卡丁車遊戲']")).toHaveCount(0);
  await page.getByRole("button", { name: "出發！開始遊戲" }).click();
  await expect(page.locator("iframe[title='繽紛卡丁車遊戲']")).toHaveAttribute(
    "src",
    "/candy-kart/index.html?debugFinish=macaron-meadow",
  );
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const raw = localStorage.getItem("cheche:progress");
          if (!raw) return false;
          const progress = JSON.parse(raw);
          return (
            progress.gameProfile?.gamesPlayed?.["candy-kart"] === true &&
            progress.gameProfile?.medals?.["candy-kart"]?.[0] === 7
          );
        }),
      { timeout: 30_000 },
    )
    .toBe(true);
});

test("車車大冒險頁面可載入", async ({ page }) => {
  await page.goto("/games/car-adventure");
  await expect(page.getByRole("link", { name: "← 回遊樂園" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /開始冒險/ }),
  ).toBeVisible({ timeout: 15_000 });
});

test("繽紛樂園（Block Drop）頁面可載入", async ({ page }) => {
  await page.goto("/games/block-drop");
  await expect(page.getByRole("link", { name: "← 回遊樂園" })).toBeVisible();
  await expect(page.getByLabel(/^分數 /)).toBeVisible({ timeout: 15_000 });
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
  // 任務列與道具列存在
  await expect(page.getByText(/泡泡/)).toBeVisible();
  await expect(page.getByRole("button", { name: /提示/ })).toBeVisible();
});
