import { test, expect } from "@playwright/test";
import { seedParentGatePassed } from "./parent-gate";
import { PROGRESS_STORAGE_KEY } from "../lib/progress-store";

test.describe.configure({ mode: "serial" });

test("Landing Hub 全螢幕分段與導覽", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("車車遊樂園：親子故事與手作");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /podcast-website-mu\.vercel\.app\/?$/,
  );
  // 品牌在 sticky 頂欄；桌面（≥980px）走膠囊內嵌導覽，漢堡**所有寬度都在**
  await expect(
    page.getByRole("link", { name: "車車遊樂園", exact: true }),
  ).toBeVisible();
  // 桌面主列只留兒童三入口（D0=C）；家長項與角色圖鑑／繪本著色收在抽屜
  const capsuleNav = page.getByRole("navigation", { name: "主要分區" });
  await expect(capsuleNav.getByRole("link", { name: "全部故事" })).toBeVisible();
  await expect(capsuleNav.getByRole("link", { name: "遊樂園" })).toBeVisible();
  await expect(capsuleNav.getByRole("link", { name: "宇宙地圖" })).toBeVisible();
  await expect(capsuleNav.getByRole("link")).toHaveCount(3);
  await expect(capsuleNav.getByRole("link", { name: "主題分類" })).toHaveCount(0);
  await expect(capsuleNav.getByRole("link", { name: /育兒專欄/ })).toHaveCount(0);
  await expect(capsuleNav.getByRole("button", { name: /更多/ })).toHaveCount(0);
  await expect(capsuleNav.getByRole("menu")).toHaveCount(0);

  // 頂欄常駐列：品牌（首頁）＋選單觸發器＋首頁文字（窄屏才見）＋訂閱＋留言
  // 多平台時「訂閱」是 dropdown button，單平台／空清單時才是 link
  await expect(
    page.getByRole("button", { name: "訂閱" }).or(
      page.getByRole("link", { name: "訂閱" }),
    ).first(),
  ).toBeVisible();
  // 首頁文字 pill 在頂欄「常用」組（DOM 常駐；桌面 CSS 隱藏，窄屏才見）
  const homeAction = page.getByRole("group", { name: "常用" }).locator('a[href="/"]');
  await expect(homeAction).toHaveCount(1);
  await expect(homeAction).toBeHidden();
  const topFeedback = page.getByRole("link", { name: "留言" });
  await expect(topFeedback).toBeVisible();
  await expect(topFeedback).toHaveAttribute("href", /^(mailto:|https?:)/);

  // 桌面同樣有帶文字的選單觸發器（家長項只在抽屜，桌面隱藏＝入口消失）
  const menuBtn = page.getByRole("button", { name: "開啟選單" });
  await expect(menuBtn).toBeVisible();
  await expect(menuBtn).toContainText("選單");

  await menuBtn.click();
  const desktopDrawer = page.getByRole("navigation", { name: "網站選單" });
  await expect(desktopDrawer.getByRole("link", { name: "親子指南" })).toBeVisible();
  await expect(desktopDrawer.getByRole("link", { name: "親子景點" })).toBeVisible();
  await expect(desktopDrawer.getByRole("link", { name: "首頁" })).toHaveCount(0);
  await expect(desktopDrawer.getByText("給爸媽")).toBeVisible();
  // 首頁與留言在頂欄「常用」組，不在抽屜
  await expect(desktopDrawer.getByRole("link", { name: "留言" })).toHaveCount(0);
  // 面板必須錨定膠囊本體（.inner），不是整條 .bar——否則會掉出全寬下拉
  const capsuleBox = await page.locator("header > div").first().boundingBox();
  const panelBox = await desktopDrawer.boundingBox();
  expect(panelBox!.x).toBeGreaterThanOrEqual(capsuleBox!.x - 1);
  expect(panelBox!.width).toBeLessThan(capsuleBox!.width);
  expect(panelBox!.width).toBeLessThanOrEqual(380);

  // 面板必須真的可點（landing 桌面 .bar 為 pointer-events: none）
  await desktopDrawer.getByRole("link", { name: "親子指南" }).click();
  await expect(page).toHaveURL(/\/for-parents$/);
  await page.goto("/");
  // 首段 Option A：#segment-stories 標題可見；其餘段仍為 titleHidden（DOM 可及名稱在）
  await expect(
    page.getByRole("heading", { name: /車車與\s?遊樂園的故事/ }),
  ).toBeVisible();
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
  await expect(mobileFeedback).toHaveAttribute("href", /^(mailto:|https?:)/);
  // 行動版桌面主列收起，全部分區都走抽屜
  await expect(
    page.getByRole("navigation", { name: "主要分區" }),
  ).not.toBeVisible();
  // 頂欄不得橫向溢出（允許 1px 捲動誤差）
  const headerOverflow = await page.locator("header > div").first().evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }));
  expect(headerOverflow.scrollWidth).toBeLessThanOrEqual(
    headerOverflow.clientWidth + 1,
  );
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
  await expect(drawerNav.getByRole("link", { name: "關於我們" })).toHaveCount(0);
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

test.describe("首頁探索區（PR1）", () => {
  const EXPLORE_HREFS = [
    "/stories",
    "/characters",
    "/games",
    "/games/coloring-book",
    "/adventures",
    "/for-parents",
    "/for-parents/play-map",
  ];

  test("7 個內容頁入口在首頁 HTML 內且可見", async ({ page }) => {
    await page.goto("/");
    const explore = page.getByRole("region", { name: "都去哪裡玩？" });
    await explore.scrollIntoViewIfNeeded();
    await expect(explore).toBeVisible();

    for (const href of EXPLORE_HREFS) {
      await expect(explore.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });

  test("標題與磁貼標籤為 HTML 文字（非燒進圖片）", async ({ page }) => {
    await page.goto("/");
    const html = await page.content();
    for (const label of [
      "都去哪裡玩？",
      "全部故事",
      "遊樂園",
      "繪本著色",
      "角色圖鑑",
      "宇宙地圖",
      "親子指南",
      "親子景點",
    ]) {
      expect(html).toContain(label);
    }
  });

  test("375px 下探索區不造成橫向溢出", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page
      .getByRole("region", { name: "都去哪裡玩？" })
      .scrollIntoViewIfNeeded();
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(scrollWidth).toBeLessThanOrEqual(375);
  });

  test("磁貼可點並跳轉；兒童入口觸控 ≥48px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const explore = page.getByRole("region", { name: "都去哪裡玩？" });
    await explore.scrollIntoViewIfNeeded();

    const tile = explore.locator('a[href="/stories"]');
    const box = await tile.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(48);

    await tile.click();
    await expect(page).toHaveURL(/\/stories$/);
  });

  test("探索區之後仍可捲到頁尾版權列（mandatory snap 超高 pane）", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    // 不用 scrollIntoViewIfNeeded()——那是程式化定位，會繞過 snap 攔截而假性通過。
    // 改為從 footer pane 頂端起，以連續 wheel 事件模擬使用者滑動。
    await page.locator("#landing-foot").scrollIntoViewIfNeeded();

    // 捲動容器是 LandingScrollView（`[data-landing-root]` 內）；hover 到頁尾區塊即可
    // 讓 wheel 事件落在該容器上。
    await page.locator("#landing-foot").hover();

    for (let i = 0; i < 12; i += 1) {
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(80);
    }

    // 捲動確實抵達容器底部（非只是元素被程式化拉進視窗）
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

    // 註：首頁的 <footer> 仍不具 contentinfo——它位於 app/page.tsx 的
    // `<main data-landing-root>` 之內，而 <main> 本身就是 contentinfo 隱含角色的
    // 排除祖先（與 #landing-foot 用 section 或 div 無關）。以版權列當可見性錨點。
    const copyright = page.getByText("© 車車遊樂園™ · Bonbon & 馬米");
    await expect(copyright).toBeInViewport();

    // 版權列不得被 ≤768px 貼底的 SegmentNav 實心列壓住
    const copyrightBox = await copyright.boundingBox();
    const segmentNav = page.getByRole("navigation", { name: /分區|段落/ });
    if (await segmentNav.count()) {
      const navBox = await segmentNav.first().boundingBox();
      if (navBox) {
        expect(copyrightBox!.y + copyrightBox!.height).toBeLessThanOrEqual(
          navBox.y + 1,
        );
      }
    }
  });
  test("≥768px 為左地圖大卡＋右磁貼牆並排，兒童組 4 欄", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const explore = page.getByRole("region", { name: "都去哪裡玩？" });
    await explore.scrollIntoViewIfNeeded();

    const mapBox = await explore.locator('a[href="/adventures"]').boundingBox();
    const firstTile = await explore.locator('a[href="/stories"]').boundingBox();
    // 地圖大卡在左、磁貼在右（並排而非上下堆疊）
    expect(mapBox!.x + mapBox!.width).toBeLessThanOrEqual(firstTile!.x + 1);

    // 兒童組四格同一列（y 座標相同）
    const childHrefs = [
      "/stories",
      "/games",
      "/games/coloring-book",
      "/characters",
    ];
    const ys: number[] = [];
    for (const href of childHrefs) {
      const box = await explore.locator(`a[href="${href}"]`).boundingBox();
      ys.push(Math.round(box!.y));
    }
    expect(new Set(ys).size).toBe(1);
  });
});
