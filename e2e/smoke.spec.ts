import { test, expect } from "@playwright/test";
import { seedParentGatePassed } from "./parent-gate";
import { PROGRESS_STORAGE_KEY } from "../lib/progress-store";
import sharp from "sharp";
import { skipIntroOverlay } from "./intro-gate";
import { expectHitTestable, expectNoOverlap } from "./overlay-geometry";

test.describe.configure({ mode: "serial" });

// ADR-0004：首次進 `/` 會被 3D 開場覆蓋層蓋住。這支規格測的是 Landing 本身，
// 所以先表明這個分頁看過開場了，否則量到的是覆蓋層。
test.beforeEach(async ({ page }) => {
  await skipIntroOverlay(page);
});


test("Landing Hub 全螢幕分段與導覽", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("[data-landing-root]")).toBeVisible();
  await expect(page.locator("h1")).toHaveText("車車遊樂園：親子故事與手作");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /podcast-website-mu\.vercel\.app\/?$/,
  );
  // 品牌在 sticky 頂欄；漢堡**所有寬度都在**；兒童三入口改在左下 dock／抽屜
  await expect(
    page.getByRole("link", { name: "車車遊樂園", exact: true }),
  ).toBeVisible();
  // 1280 標題列無「主要分區」；header 直接列不含兒童三入口（抽屜內仍有）
  await expect(page.getByRole("navigation", { name: "主要分區" })).toHaveCount(0);
  const headerTopRow = page.locator("header > div").first();
  for (const href of ["/stories", "/games", "/adventures"] as const) {
    const directCount = await headerTopRow.locator(`a[href="${href}"]`).evaluateAll(
      (anchors) => {
        const panel = document.querySelector('header nav[aria-label="網站選單"]');
        return anchors.filter((a) => !panel?.contains(a)).length;
      },
    );
    expect(directCount).toBe(0);
  }

  // 頂欄常駐列：品牌＋常用三詞撐滿中間＋最右漢堡
  // 多平台時「訂閱」是 dropdown button，單平台／空清單時才是 link
  await expect(
    page.getByRole("button", { name: "訂閱" }).or(
      page.getByRole("link", { name: "訂閱" }),
    ).first(),
  ).toBeVisible();
  const homeAction = page.getByRole("group", { name: "常用" }).locator('a[href="/"]');
  await expect(homeAction).toHaveCount(1);
  await expect(homeAction).toBeVisible();
  const topFeedback = page.getByRole("link", { name: "留言" });
  await expect(topFeedback).toBeVisible();
  await expect(topFeedback).toHaveAttribute("href", "/feedback");

  const menuBtn = page.getByRole("button", { name: "開啟選單" });
  await expect(menuBtn).toBeVisible();
  await expect(menuBtn).not.toContainText("選單");
  const feedbackBox = await topFeedback.boundingBox();
  const menuBox = await menuBtn.boundingBox();
  expect(menuBox!.x).toBeGreaterThan(feedbackBox!.x);

  await menuBtn.click();
  const desktopDrawer = page.getByRole("navigation", { name: "網站選單" });
  await expect(desktopDrawer.getByRole("link", { name: "親子指南" })).toBeVisible();
  await expect(desktopDrawer.getByRole("link", { name: "親子景點" })).toBeVisible();
  await expect(desktopDrawer.getByRole("link", { name: "首頁" })).toHaveCount(0);
  await expect(desktopDrawer.getByText("給爸媽")).toBeVisible();
  await expect(desktopDrawer.getByRole("link", { name: "留言" })).toHaveCount(0);
  const capsuleBox = await page.locator("header > div").first().boundingBox();
  const panelBox = await desktopDrawer.boundingBox();
  expect(panelBox!.x).toBeGreaterThan(capsuleBox!.x);
  expect(panelBox!.width).toBeLessThan(capsuleBox!.width);
  expect(panelBox!.width).toBeLessThanOrEqual(380);
  const capsuleRight = capsuleBox!.x + capsuleBox!.width;
  const panelRight = panelBox!.x + panelBox!.width;
  expect(panelRight).toBeLessThanOrEqual(capsuleRight + 1);
  expect(capsuleRight - panelRight).toBeLessThanOrEqual(20);

  // 面板必須真的可點（landing 桌面 .bar 為 pointer-events: none）
  await desktopDrawer.getByRole("link", { name: "親子指南" }).click();
  await expect(page).toHaveURL(/\/for-parents$/);
  await page.goto("/");
  // 首段標題與 GEO 導言都維持 clip，不得再被 #segment-stories 解除隱藏
  const storiesHeading = page.getByRole("heading", {
    name: /車車與\s?遊樂園的故事/,
  });
  await expect(storiesHeading).toBeAttached();
  const headingBox = await storiesHeading.boundingBox();
  expect(headingBox, "段標題應在 DOM").toBeTruthy();
  expect(headingBox!.width).toBeLessThanOrEqual(2);
  expect(headingBox!.height).toBeLessThanOrEqual(2);
  const siteIntro = page.locator("#segment-stories p.sr-only");
  await expect(siteIntro).toContainText("Bonbon 與馬米");
  const introBox = await siteIntro.boundingBox();
  expect(introBox, "GEO 導言應在 DOM").toBeTruthy();
  expect(introBox!.width).toBeLessThanOrEqual(2);
  expect(introBox!.height).toBeLessThanOrEqual(2);
  await expect(page.getByRole("link", { name: "車車遊樂園的故事 →" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "車車遊樂園的故事 →" }),
  ).toHaveAttribute("href", "/stories");
  await expect(page.getByRole("link", { name: /聽最新一集/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /數綿羊/ })).toBeAttached();
  await expect(page.getByRole("heading", { name: /捏黏土/ })).toBeAttached();
  await expect(page.getByRole("heading", { name: /陪孩子建立好習慣/ })).toBeAttached();
  // 往下箭頭錨點存在
  await expect(
    page.getByRole("link", { name: "捲動到下一個專區" }).first(),
  ).toBeVisible();
});

test("夜間桌面開抽屜：微暗只套膠囊，外層 .bar 不因開闔改變（不得出現全寬色帶）", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // 直接寫 data-theme 會被 ThemeProvider 的 effect 覆寫回持久化值；
  // 改在 navigation 前種下偏好，讓 ThemeProvider mount 時就是 night。
  await page.addInitScript(
    ({ storageKey }: { storageKey: string }) => {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ preferences: { theme: "night" } }),
      );
    },
    { storageKey: PROGRESS_STORAGE_KEY },
  );
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");

  const bar = page.locator("header").first();
  const capsule = page.locator("header > div").first();
  const bg = (loc: typeof bar) =>
    loc.evaluate((el) => getComputedStyle(el).backgroundColor);

  const barClosed = await bg(bar);
  const capsuleClosed = await bg(capsule);

  await page.getByRole("button", { name: "開啟選單" }).click();

  // 外層必須不隨開闔改變——否則膠囊外會多出一條橫貫視窗的色帶。
  // （註：landing 桌面的 .bar 本來就不是透明的，見 SiteNavBar.module.css 的
  //  `html:has([data-landing-root]) .bar` 規則；此處鎖的是「開闔不得改變它」。）
  expect(await bg(bar)).toBe(barClosed);

  // 微暗確實套在膠囊本體上（背景走 transition，需輪詢等它到位）
  await expect.poll(() => bg(capsule)).not.toBe(capsuleClosed);

  await page.getByRole("button", { name: "關閉選單" }).click();
  await expect.poll(() => bg(capsule)).toBe(capsuleClosed);
});

test("Landing Hub 在手機尺寸維持四段可見", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  // 行動版漢堡選單；主題分類與桌面一致不進導覽（頁面仍可直達 /topic）
  await expect(page.getByRole("button", { name: "開啟選單" })).toBeVisible();
  await expect(page.getByRole("link", { name: "首頁" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "訂閱" }).or(
      page.getByRole("link", { name: "訂閱" }),
    ).first(),
  ).toBeVisible();
  const mobileFeedback = page.getByRole("link", { name: "留言" });
  await expect(mobileFeedback).toBeVisible();
  await expect(mobileFeedback).toHaveAttribute("href", "/feedback");
  // 行動版無「主要分區」膠囊；全部分區都走抽屜
  await expect(page.getByRole("navigation", { name: "主要分區" })).toHaveCount(0);
  // 頂欄不得橫向溢出（允許 1px 捲動誤差）；980／1024 同契約
  for (const width of [390, 980, 1024] as const) {
    await page.setViewportSize({ width, height: 844 });
    const headerOverflow = await page.locator("header > div").first().evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(
      headerOverflow.scrollWidth,
      `${width}px 頂欄不得橫向溢出`,
    ).toBeLessThanOrEqual(headerOverflow.clientWidth + 1);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "開啟選單" }).click();
  const drawerNav = page.getByRole("navigation", { name: "網站選單" });
  await expect(drawerNav.getByRole("button", { name: "搜尋" })).toHaveCount(0);
  await expect(drawerNav.getByRole("link", { name: "主題分類" })).toHaveCount(0);
  await expect(drawerNav.getByRole("link", { name: "角色圖鑑" })).toBeVisible();
  await expect(drawerNav.getByRole("link", { name: "繪本著色" })).toBeVisible();
  const drawerParentGuide = drawerNav.getByRole("link", { name: "親子指南" });
  await expect(drawerParentGuide).toBeVisible();
  await expect(drawerParentGuide).toHaveAttribute("href", /\/for-parents/);
  const drawerPlayMap = drawerNav.getByRole("link", { name: "親子景點" });
  await expect(drawerPlayMap).toBeVisible();
  await expect(drawerPlayMap).toHaveAttribute("href", /\/for-parents\/play-map/);
  const drawerAbout = drawerNav.getByRole("link", { name: "關於我們" });
  await expect(drawerAbout).toBeVisible();
  await expect(drawerAbout).toHaveAttribute("href", "/about");
  await expect(drawerNav.getByRole("link", { name: "聯絡我們" })).toHaveCount(0);
  await expect(drawerNav.getByRole("link", { name: "首頁" })).toHaveCount(0);
  await expect(drawerNav.getByRole("link", { name: "留言" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /車車與\s?遊樂園的故事/ })).toBeAttached();
  await expect(page.getByRole("heading", { name: /陪孩子建立好習慣/ })).toBeAttached();
});

async function expectStoriesFromLanding(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("link", { name: "車車遊樂園的故事 →" }).click();
  await expect(page).toHaveURL(/\/stories/);
  await expect(page.getByRole("heading", { name: "找故事" })).toBeVisible();
}

test("Landing 四段 CTA href", async ({ page }) => {
  await page.goto("/");
  const expected = [
    { label: "車車遊樂園的故事 →", href: "/stories" },
    { label: "數綿羊123．睡前故事 →", href: "/topic/睡前" },
    { label: "好好玩的捏黏土（另開視窗）", href: /youtube\.com/ },
    { label: "好習慣故事 →", href: "/topic/安全" },
  ] as const;
  for (const { label, href } of expected) {
    const link = page.getByRole("link", { name: label }).first();
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", href);
  }
});

test("Landing 分區 CTA 進全部故事（390）", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expectStoriesFromLanding(page);
});

test("Landing 分區 CTA 進全部故事（桌面）", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await expectStoriesFromLanding(page);
});

test("全部故事頁 → 詳情 → 播放頁 smoke", async ({ page }) => {
  await page.goto("/stories");
  await expect(page.getByRole("heading", { name: "找故事" })).toBeVisible();
  await expect(page.locator("footer").getByRole("link", { name: "去遊樂園玩" })).toHaveCount(0);
  await expect(page.locator("footer").getByText("無廣告")).toHaveCount(0);

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

test("單集出場角色條連到圖鑑", async ({ page }) => {
  await page.goto("/story/ep-3");
  await expect(page.getByRole("heading", { name: "出場角色" })).toBeVisible();
  const cast = page.locator("section[aria-labelledby='characters-heading']");
  const firstCast = cast.getByRole("link").first();
  await expect(firstCast).toBeVisible();
  await expect(firstCast).toHaveAttribute("href", /\/characters#/);
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
  await expect(page.getByText("嗨嗨，我是馬米")).toBeVisible();
  await expect(page.getByRole("heading", { name: "這是什麼？" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "怎麼使用？" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "用車種找故事" })).toHaveCount(0);
});

test("車車宇宙樂園地圖 smoke", async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.removeItem("cc-universe-tap-hint-shown");
  });
  await page.goto("/adventures");
  await expect(
    page.getByRole("region", { name: "車車宇宙樂園地圖" }),
  ).toBeVisible();
  await expect(page.getByTestId("universe-tap-hint")).toContainText("點一座島");

  await expect(
    page.getByRole("button", { name: /恐龍島/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /恐龍島/ }).click();
  await expect(page.getByTestId("universe-tap-hint")).toHaveCount(0);
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
  await expect(page.getByRole("heading", { name: "待生圖佇列" })).toBeVisible();
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

test("角色圖鑑與親子指南不含內頁 hero", async ({ page, request }) => {
  for (const path of ["/characters", "/for-parents"]) {
    const response = await request.get(path);
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).not.toContain("hero-home");
  }

  await page.goto("/characters");
  await expect(
    page.getByRole("heading", { level: 1, name: "角色圖鑑" }),
  ).toBeVisible();
  await expect(page.getByText(/\d+ 位角色/)).toBeVisible();

  await page.goto("/for-parents");
  await expect(
    page.getByRole("heading", { level: 1, name: "中文車車故事，陪孩子安心聽" }),
  ).toBeVisible();
  const tools = page.getByRole("heading", { name: "家長工具" });
  const podcastFaq = page.getByRole("heading", {
    name: "有哪些適合 3–6 歲的中文車車 Podcast？",
  });
  await expect(tools).toBeVisible();
  const toolsBox = await tools.boundingBox();
  const podcastBox = await podcastFaq.boundingBox();
  expect(toolsBox?.y).toBeLessThan(podcastBox?.y ?? Number.POSITIVE_INFINITY);
});

test("家庭儀表板頁面可載入", async ({ page }) => {
  await seedParentGatePassed(page);
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
  await page.locator('button[data-next="true"]').click();
  await expect(page.getByTestId("candy-match-board")).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "任務完成度" })).toBeVisible();
  // 任務列與道具列存在
  await expect(page.getByText(/泡泡/)).toBeVisible();
  await expect(page.getByRole("button", { name: /提示/ })).toBeVisible();
});

test.describe("內頁不掛 KidsPlayDock", () => {
  for (const { path, width, height } of [
    { path: "/", width: 1280, height: 800 },
    { path: "/", width: 390, height: 844 },
    { path: "/stories", width: 1280, height: 800 },
    { path: "/games", width: 390, height: 844 },
    { path: "/games/coloring-book", width: 390, height: 844 },
    { path: "/adventures", width: 390, height: 844 },
    { path: "/story/ep-27/play", width: 390, height: 844 },
    { path: "/games/candy-match", width: 390, height: 844 },
  ] as const) {
    test(`${path}（${width}）不掛去玩 dock`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto(path);
      await expect(page.getByRole("navigation", { name: "去玩" })).toHaveCount(
        0,
      );
    });
  }
});

test.describe("首頁頁尾 snap pane", () => {
  test("可捲到頁尾版權列", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(
      page.getByRole("region", { name: "都去哪裡玩？" }),
    ).toHaveCount(0);

    await page.locator("#landing-foot").scrollIntoViewIfNeeded();
    await page.locator("#landing-foot").hover();

    for (let i = 0; i < 12; i += 1) {
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(80);
    }

    const atBottom = await page.evaluate(() => {
      const el = document.scrollingElement!;
      const candidates: Element[] = [el, ...document.querySelectorAll("*")];
      for (const node of candidates) {
        const c = node as HTMLElement;
        if (c.scrollHeight - c.clientHeight < 200) continue;
        if (c.scrollTop + c.clientHeight >= c.scrollHeight - 4) return true;
      }
      return false;
    });
    expect(atBottom).toBe(true);

    // 首頁 <footer> 仍不具 contentinfo（包在 `<main data-landing-root>` 內）。
    const copyright = page.getByText("© 車車遊樂園™ · Bonbon & 馬米");
    await expect(copyright).toBeInViewport();

    // ADR-0004 之後首頁沒有貼底導覽列了，版權列不再需要跟它讓位。
  });
});

/**
 * 夜間抽屜（2026-08-31）。純 CSS 契約測試擋不住這一輪的兩個真實破口：
 * 開啟態頂欄文字曾經只有 1.48:1、頂欄與面板曾有 3.78:1 的色帶，
 * 兩者都要「合成後的實際像素」才量得到（backdrop-filter、color-mix 皆是渲染期才解析）。
 */
test.describe("夜間漢堡抽屜", () => {
  /** 從截圖 buffer 取「出現最多次的顏色」＝該區域的底色（合成後的真實像素）。 */
  const sampleBg = async (buf: Buffer): Promise<number[]> => {
    const { data } = await sharp(buf)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const counts = new Map<string, number>();
    for (let i = 0; i < data.length; i += 3) {
      const k = `${data[i]},${data[i + 1]},${data[i + 2]}`;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const top = [...counts].sort((a, b) => b[1] - a[1])[0][0];
    return top.split(",").map(Number);
  };

  const srgb = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = ([r, g, b]: number[]) =>
    0.2126 * srgb(r / 255) + 0.7152 * srgb(g / 255) + 0.0722 * srgb(b / 255);
  const contrast = (a: number[], b: number[]) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  for (const width of [390, 1280]) {
    test(`${width}px：頂欄↔面板無色帶，且開啟態頂欄文字過 AA`, async ({ page }) => {
      await page.addInitScript(() => {
        try {
          localStorage.setItem(
            "chechecar.progress.v1",
            JSON.stringify({ preferences: { theme: "night" } }),
          );
        } catch {}
      });
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      await page.evaluate(() =>
        document.documentElement.setAttribute("data-theme", "night"),
      );
      await page.getByRole("button", { name: "開啟選單" }).click();
      await page.waitForTimeout(600);

      // **真的**取合成後像素：頂欄是半透明毛玻璃（backdrop-filter + alpha 0.87），
      // 讀 getComputedStyle().backgroundColor 拿到的是宣告值、不含它疊在頁面上的實際結果。
      const box = await page.evaluate((w: number) => {
        const bar = document.querySelector("header")!;
        const surface = w >= 980 ? bar.querySelector("div")! : bar;
        const panel = bar.querySelector("nav")!;
        const r = (el: Element) => {
          const b = el.getBoundingClientRect();
          return { x: b.x, y: b.y, width: b.width, height: b.height };
        };
        return { surface: r(surface), panel: r(panel) };
      }, width);

      // 取樣：頂欄右段空白（漢堡左側）、面板最下緣空白
      const [surfacePx, panelPx] = await Promise.all([
        sampleBg(
          await page.screenshot({
            clip: {
              x: box.surface.x + box.surface.width * 0.62,
              y: box.surface.y + 6,
              width: 40,
              height: Math.max(6, box.surface.height - 12),
            },
          }),
        ),
        sampleBg(
          await page.screenshot({
            clip: {
              x: box.panel.x + 8,
              y: box.panel.y + box.panel.height - 14,
              width: Math.min(200, box.panel.width - 16),
              height: 8,
            },
          }),
        ),
      ]);
      // 文字色不受 alpha 影響（純色），直接讀 computed 即可
      const textPx = await page.evaluate((w: number) => {
        const bar = document.querySelector("header")!;
        const surface = w >= 980 ? bar.querySelector("div")! : bar;
        const css = getComputedStyle(surface).color;
        const n = (css.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
        // `color-mix()` 在 Chromium 解析成 `color(srgb 0.54 …)`——**0–1 浮點**，
        // 當成 0–255 讀會讓每個色都近黑、任意兩色對比恆為 ~1:1（本測試曾因此假綠）。
        return css.startsWith("color(") ? n.map((v) => v * 255) : n;
      }, width);
      const rgb = { surface: surfacePx, panel: panelPx, text: textPx };

      // 色帶：舊式 38%+--bg 是 3.78:1；現行 10%+--nav-panel-bg 實測 1.35:1
      expect(contrast(rgb.surface, rgb.panel)).toBeLessThan(2);
      // 開啟態頂欄文字：舊值 color-mix(--landing-nav-ink 48%, --ink) 僅 1.48:1
      expect(contrast(rgb.text, rgb.surface)).toBeGreaterThanOrEqual(4.5);
      // 面板不得再是深靛藍：--bg #1e2438 的 b−r = +26
      expect(rgb.panel[2] - rgb.panel[0]).toBeLessThan(10);
    });
  }
});


/**
 * ADR-0004 移除了首頁底列導覽（SegmentNav）。那條細列原本是手機唯一可見的
 * 換段控制——`LandingSegment` 的向下箭頭在 ≤768 是被 CSS 藏起來的，理由就寫在
 * 「平板／手機用 SegmentNav 貼底細條」那行註解裡。移除底列而不放出箭頭，手機
 * 上的四個 snap pane 之間就只剩盲滑。這支守住那個出口。
 */
test.describe("首頁手機換段出口", () => {
  for (const width of [320, 390, 767] as const) {
    test(`${width}px：向下箭頭可見且真的換段`, async ({ page }) => {
      await page.setViewportSize({ width, height: 760 });
      await page.goto("/");
      const next = page.getByRole("link", { name: "捲動到下一個專區" }).first();
      const cta = page
        .locator("#segment-stories")
        .getByRole("link", { name: /車車遊樂園的故事/ });
      await expect(next).toBeVisible();
      const box = await next.boundingBox();
      expect(box, "箭頭沒有版面盒").not.toBeNull();
      // 觸控尺寸：藏了很久的控制放出來時，最容易忘記它還要能按得到。
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
      await expectNoOverlap(next, cta, `${width}px 向下箭頭不得蓋住分區 CTA`);
      await expectHitTestable(page, next, `${width}px 向下箭頭`);
      await next.click();
      await expect
        .poll(async () => (await page.getByRole("region", { name: /睡前/ }).first().boundingBox())?.y ?? Infinity, {
          timeout: 5_000,
        })
        .toBeLessThan(760);
    });
  }
});
