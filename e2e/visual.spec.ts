import { test, expect, type Locator, type Page } from "@playwright/test";
import {
  stabilizeVisualPage,
  type VisualTheme,
  type VisualViewportId,
} from "./visual-helpers";

/**
 * D2 視覺回歸：Phase A smoke（5 頁 × 1280 light）+ Phase B 完整組合。
 * 主頁 × 390/1280 × light/night。
 */
test.describe.configure({ mode: "serial" });

/**
 * 視覺回歸是**本機 pre-push 工具**，刻意不進 CI——baseline 是 `-chromium-darwin`，
 * CI 跑 ubuntu，兩者像素不可能相符；維護雙平台 baseline 的成本高於它的價值。
 * `VISUAL_BASELINE_TRUSTED` gate 就是這個「只在本機跑」的執行機制，**不要拿掉**。
 *
 * 跑法：`npm run test:visual:trusted`；重產：再加 `-- --update-snapshots`，
 * 並**逐張人工目檢**後才提交。
 *
 * ── VIS-DEBT-1 結案（2026-08-24）──
 * 舊註解寫「baseline 與本機渲染環境脫節（OS／字型／Chromium）」是**誤判**。
 * 實測：snapshot 全為 `-chromium-darwin`（與本機同平台）、首頁 390 light 的 diff ratio
 * 只有 0.05（門檻 0.02），diff 圖顯示差異是「EP 18 vs EP 26」——baseline 停在 2026-07 的集數。
 *
 * 真正的根因是本檔自己：`fullPage: true` 且完全沒有 `mask`，把「隨每次上新集就改寫」
 * 的內容一起拍進 baseline，於是每出一集就失效，最後被放棄維護。
 * 下方的 `GROWING_PAGE_IDS` 與 `volatileMasks` 就是修這件事——**新增頁面時請一併評估
 * 該頁有沒有隨集數／資料變動的區域**，否則這個債會原地重生。
 */
const VISUAL_SKIP_REASON =
  "視覺回歸是本機 pre-push 工具（baseline 為 darwin，刻意不進 CI）。跑法：npm run test:visual:trusted；重產再加 -- --update-snapshots 並逐張目檢。";

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
  // T0.2：play-map 是 --cta-warm token 的消費者、D3 語彙來源、D5 拆檔對象，
  // 卻一直不在視覺回歸內——那是動它之前最需要的安全網。
  {
    id: "play-map",
    name: "親子遊樂地圖",
    path: "/for-parents/play-map",
  },
  {
    id: "place",
    name: "景點詳情",
    path: "/for-parents/play-map/ty-kids-museum",
  },
] as const;

type VisualPageId = (typeof VISUAL_PAGES)[number]["id"];

const VIEWPORTS: Record<
  VisualViewportId,
  { width: number; height: number; label: string }
> = {
  mobile: { width: 390, height: 844, label: "390" },
  desktop: { width: 1280, height: 720, label: "1280" },
};

/** 頂欄 980 斷點（已無 desktopNav）：頂欄 clip 回歸（漢堡／膠囊交界）。 */
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

/**
 * Phase A：保留 5 條黃金路徑 smoke（向後相容檔名）。
 * 新增的 play-map／place 不列入，一律走 `${id}-${viewport}-${theme}.png`。
 */
const SMOKE_PAGE_IDS = new Set<VisualPageId>([
  "home",
  "stories",
  "games",
  "adventures",
  "for-parents",
]);

/**
 * 頁高隨新集成長的頁面（stories 每集 +1 張卡、for-parents 共聽清單每集 +1 列）。
 * 尺寸本身會變，mask 救不了「snapshot 尺寸不符」，只能改拍 viewport。
 */
const GROWING_PAGE_IDS = new Set<VisualPageId>([
  "stories",
  "for-parents",
  // play-map 4448px／place 2387px 的 fullPage 有兩個問題：
  // (a) maxDiffPixelRatio 0.02 在 1280×4448 上等於容許 11.4 萬像素不同，
  //     抓不到任何一種規範回歸——頁面越高，測試越測不到東西；
  // (b) 390×5827 的圖在任何 review 介面都會被縮到百來 px 寬，
  //     檔頭要求的「逐張人工目檢」實際上做不到。
  // 真正的覆蓋改由下方 COMPONENT_SHOTS 承擔。
  "play-map",
  "place",
]);

/**
 * ── MASK_DOCTRINE：什麼該遮、什麼不該遮 ──
 *
 * 1. **內容變更該紅**（新增一集、某角色多一個登場集數、景點資料異動）——
 *    那是該被人看到並確認的，讓它紅、目檢後重產。
 * 2. **樣式回歸該紅**——這是視覺測試存在的理由，絕不能被 mask 蓋掉。
 * 3. **只有純噪音才遮**：該區域變動**不會**連帶改變版面尺寸或其他未遮區域，
 *    遮掉它才真的買得到穩定性。
 *
 * 判準 3 是關鍵：Playwright 的 mask 只是在 bounding box 上塗色塊，
 * **不改變 layout**。所以只要該變動會讓元素長高、或同頁還有其他沒遮的同源數字，
 * mask 就擋不住失敗，只是白白盲掉一塊視覺。characters 的 62 顆 EP chip 與
 * play-map 的結果數都是這樣被撤回的。
 *
 * 易變區域的選擇器。
 *
 * **紅線：不得使用 CSS Modules 的 class 名**（例如 `LandingSegment-module__iN6yHW__playCta`）——
 * 那是 build hash，改一行 CSS 就變，mask 會靜默失效而沒有人發現。
 * 一律用 role／可見文字／語意標籤。
 *
 * 錨定 `^…$` 是為了避免整張卡片被吞進 mask：`getByRole("link", { name: /EP/ })`
 * 會命中整張故事卡，把封面與標題一起塗掉，那就等於關掉這頁的視覺測試。
 */
const NEW_EPISODE_RIBBON = /NEW\s*[·•‧]\s*EP\s*\d+/;
const EP_LABEL_ONLY = /^EP\s*\d+$/;
const EPISODE_COUNT_ONLY = /^\d+\s*集$/;

function volatileMasks(page: Page, pageId: VisualPageId): Locator[] {
  switch (pageId) {
    case "home":
      return [];
    case "stories":
      return [
        page.getByText(NEW_EPISODE_RIBBON),
        page.getByText(EP_LABEL_ONLY),
      ];
    case "for-parents":
      // 只遮 stat 卡內的「N 集」數值列；卡片外框、標籤字色、夜間分層都還測得到。
      // 曾另遮共聽清單的 <summary>，被面積守衛抓出來後移除——它在 y≈2186，
      // 根本不在 viewport 取樣範圍內，是會誤導後人「共聽清單有被覆蓋」的死碼。
      return [page.locator("dd").filter({ hasText: EPISODE_COUNT_ONLY })];
    case "characters":
      // **刻意不遮**。曾試遮 62 個角色卡的登場集數連結，實測後撤回：
      // 角色多一顆 EP chip 會讓該卡長高、整個格線往下位移，mask 只遮文字擋不住
      // 尺寸變化——付出 62 個元素的覆蓋率，卻擋不住它想擋的失敗模式。
      // 而且「某角色新增登場集數」本來就是該被看見的內容變更，讓它紅、人工確認後重產，
      // 比永久盲掉 62 顆 chip 的樣式回歸好。
      return [];
    case "play-map":
      // **刻意不遮**，理由與 characters 同一條判準（見檔頭 MASK_DOCTRINE）。
      // 曾遮「共 N 處」註腳與「N 個地方」結果數，複審後撤回：
      // (a) 買不到穩定性——同一張圖上磚牆 22 塊磚的命中數、名單分組標題、
      //     「已顯示 24／99 處」全都沒遮，任何會動到結果數的資料變更必然同時動到它們；
      // (b) 代價卻是塗掉 DESIGN.md 指名的東西——「結果數放大為主資訊」與
      //     資料誠實紅線的 coverage footnote。
      return [];
    case "games":
    case "adventures":
    case "about":
    case "subscribe":
    case "place":
      // 有易變內容（「資料於 2026 年 8 月核對」、附近景點的距離與排序），
      // 但同樣依 MASK_DOCTRINE 不遮：那些是該被看見的內容變更。
      return [];
    default:
      // 新增頁面卻忘了決定 mask 時，這裡會立刻炸。
      // 沒有這行的話 switch 會 fall through 回傳 undefined，
      // 截圖等同沒有 mask 而測試照樣綠——正是這次要修掉的靜默退化。
      return assertNever(pageId);
  }
}

function assertNever(value: never): never {
  throw new Error(
    `visual.spec：新增頁面 "${String(value)}" 未在 volatileMasks 決定 mask。` +
      `請明確回傳 []（該頁無易變區域）或列出要遮的 locator。`,
  );
}

/**
 * mask 靜默失效的防呆。
 *
 * 文案改寫或 role 變更都會讓 locator 命中 0 個元素，而 Playwright **不會報錯**——
 * 截圖只是少遮一塊，測試照樣綠，於是這頁悄悄退回「沒有 mask」的狀態，
 * 下次上新集才會以 baseline 失效的形式爆出來。這裡先斷言每個 mask 都真的抓到東西。
 */
const MAX_MASK_AREA_RATIO = 0.06;

async function assertMasksResolve(
  masks: Locator[],
  pageId: string,
): Promise<void> {
  for (const [index, mask] of masks.entries()) {
    const label = `${pageId} 的第 ${index + 1} 個 mask`;
    const count = await mask.count();

    // 下界：文案改寫或 role 變更會讓 locator 命中 0 個，而 Playwright 不報錯。
    expect(
      count,
      `visual.spec：${label} 命中 0 個元素，代表選擇器已失效（文案改寫或 role 變更）。` +
        `請更新它，不要讓測試靜默退回無 mask 狀態。`,
    ).toBeGreaterThan(0);

    // 上界：DOM 結構調整（例如文字外多包一層）會讓 mask 悄悄擴張成吞掉整張卡，
    // 而測試依然全綠。這是比 0 命中更危險的失效方向，因為它安靜且永久。
    const viewport = mask.page().viewportSize();
    if (!viewport) continue;
    const viewportArea = viewport.width * viewport.height;
    for (let i = 0; i < count; i += 1) {
      const box = await mask.nth(i).boundingBox();
      if (!box) continue;
      const ratio = (box.width * box.height) / viewportArea;
      expect(
        ratio,
        `visual.spec：${label} 的第 ${i + 1} 個元素佔了 viewport 的 ` +
          `${(ratio * 100).toFixed(1)}%（上限 ${MAX_MASK_AREA_RATIO * 100}%）。` +
          `mask 可能已擴張成吞掉整個區塊——那會讓這頁的視覺測試永遠是綠的。`,
      ).toBeLessThanOrEqual(MAX_MASK_AREA_RATIO);
    }
  }
}

/**
 * 元件級 baseline。
 *
 * 頁面級截圖改拍 viewport 後，摺線以下的 IA 會掉出取樣範圍；補回來的方式**不是**退回
 * fullPage（那會同時帶回「隨資料長高」與「容差被稀釋」兩個問題），而是針對
 * 高度不隨資料變動的元件個別取樣。
 *
 * 原則：**用「錨定在不會變的資料上」取代「遮掉會變的資料」**。
 * 錨定最早一集／固定景點 slug 比 mask 最新一集穩，而且不犧牲任何視覺屬性。
 */
const COMPONENT_SHOTS: {
  id: string;
  name: string;
  path: string;
  locator: (page: Page) => Locator;
  masks?: (page: Page) => Locator[];
  /** 預設 1280×900。**改動只在某個斷點內生效的元件必須指定**——否則拍到的是
   *  另一套 CSS 分支，快照看似增加覆蓋、實際完全驗不到那個改動。 */
  viewport?: { width: number; height: number };
}[] = [
  {
    id: "stories-filter",
    name: "找故事篩選列",
    path: "/stories",
    // 走 aria-label + :has(標題)，不用 CSS Modules hash。
    locator: (page) =>
      page
        .locator('section[aria-label="找故事"] > div')
        .filter({ has: page.getByRole("heading", { name: "找故事" }) }),
    // 「N 則故事」是這塊裡唯一隨集數變的字，且它變動不會改變版面高度，
    // 也沒有同源數字散落在同一張圖裡——符合 MASK_DOCTRINE 判準 3，遮它真的買得到穩定性。
    masks: (page) => [page.getByText(/^\d+\s*則故事$/)],
  },
  {
    id: "stories-card",
    name: "故事卡（錨定最早一集）",
    path: "/stories",
    // ep-1 的內容永遠不會再變 → 零 mask，StoryCard 的所有視覺屬性都測得到，
    // 包含 .marker pill 與 StoryProgressBadge。
    locator: (page) => page.locator('a[href="/story/ep-1"]').first(),
  },
  {
    id: "for-parents-tools",
    name: "家長工具雙卡",
    path: "/for-parents",
    locator: (page) =>
      page
        .locator("section")
        .filter({ has: page.getByRole("heading", { name: "家長工具" }) }),
  },
  {
    id: "play-map-wall",
    name: "縣市磚牆",
    path: "/for-parents/play-map",
    // DESIGN.md 對磚牆的規範密度最高（三態編碼、未收錄標示、示意排列免責、觸控尺寸）。
    // 磚上的命中數不遮：景點資料異動是該被看見的內容變更（MASK_DOCTRINE 判準 1）。
    locator: (page) =>
      page
        .locator("section")
        .filter({ has: page.getByRole("group", { name: "依縣市瀏覽" }) }),
  },
  {
    id: "play-map-filters",
    name: "意圖快捷列",
    path: "/for-parents/play-map",
    locator: (page) => page.getByRole("group", { name: "意圖快捷" }),
  },
  {
    id: "play-map-card",
    name: "景點卡（錨定固定 slug）",
    path: "/for-parents/play-map",
    locator: (page) => page.locator("li#ty-kids-museum"),
  },
  /**
   * ≤768 底列分段導覽（短標）。
   *
   * **必須指定 viewport**：這是 `@media (max-width: 768px)` 專屬的 layout，
   * 預設的 1280×900 走的是桌面右側 tooltip 分支，拍再多張也驗不到這裡。
   * 三個寬度各留一張：320 最擠、375 主力、767 斷點邊界。
   *
   * 拍的是「文字密集區」——頁面級快照的 2% 容差在 1280×720 上等於 18,432px，
   * 一整句文案改掉都吞得下（2026-09-02 桌機 baseline 就是這樣存了舊文案還全綠）。
   * 元件級取樣讓容差不被面積稀釋。
   */
  ...([320, 375, 767] as const).map((width) => ({
    id: "landing-segment-nav",
    name: `Landing 底列短標 ${width}`,
    path: "/",
    viewport: { width, height: 760 },
    locator: (page: Page) =>
      page.getByRole("navigation", { name: "專區導覽" }),
  })),
  {
    id: "landing-cta-row",
    name: "Landing 首段 CTA 文字塊",
    path: "/",
    viewport: { width: 390, height: 844 },
    // 錨在第一段（`data/landing-segments.ts` 的 stories），文案固定不隨集數變動
    locator: (page: Page) =>
      page.locator("#segment-stories [class*='ctaRow']"),
  },
];

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
        const masks = volatileMasks(page, pageDef.id);
        await assertMasksResolve(masks, pageDef.id);
        await expect(page).toHaveScreenshot(snapshotName, {
          fullPage: !GROWING_PAGE_IDS.has(pageDef.id),
          maxDiffPixelRatio: theme === "night" ? 0.03 : 0.02,
          animations: "disabled",
          mask: masks,
        });
      });
    }
  }
}

// 元件級 baseline：高度不隨資料變動，圖小且真的看得完，容差不會被面積稀釋。
for (const shot of COMPONENT_SHOTS) {
  for (const theme of THEMES) {
    test(`visual：${shot.name} ${theme}`, async ({ page }) => {
      await page.setViewportSize(shot.viewport ?? { width: 1280, height: 900 });
      await page.goto(shot.path);
      await stabilizeVisualPage(page, { theme });
      const target = shot.locator(page);
      await expect(
        target,
        `visual.spec：元件 ${shot.id} 的錨點失效，截不到東西。`,
      ).toHaveCount(1);
      const masks = shot.masks?.(page) ?? [];
      if (masks.length) await assertMasksResolve(masks, shot.id);
      const shotName = shot.viewport
        ? `${shot.id}-${shot.viewport.width}-${theme}.png`
        : `${shot.id}-${theme}.png`;
      await expect(target).toHaveScreenshot(shotName, {
        maxDiffPixelRatio: theme === "night" ? 0.03 : 0.02,
        animations: "disabled",
        mask: masks,
      });
    });
  }
}

// Landing 專用全覽：四段都各自留 390/1280 × light/night baseline，
// 避免全頁截圖只覆蓋第一個內部 scroll-snap panel。
for (const viewportId of Object.keys(VIEWPORTS) as VisualViewportId[]) {
  for (const theme of THEMES) {
    const viewport = VIEWPORTS[viewportId];
    test(`visual：Landing 四段 ${viewport.label} ${theme}`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
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

// 頂欄 IA／980 斷點：只截 header，避免全頁噪音。實測無集數文案，不需 mask。
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

/** 2026-09-05 產品覆寫：內頁左下 KidsPlayDock 已刪，clip baseline 一併移除。 */
test("visual：內頁不顯示 KidsPlayDock", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/stories");
  await stabilizeVisualPage(page, { theme: "light" });
  await expect(page.getByRole("navigation", { name: "去玩" })).toHaveCount(0);
});
