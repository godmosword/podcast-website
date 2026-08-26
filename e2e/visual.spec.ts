import { test, expect, type Locator, type Page } from "@playwright/test";
import {
  stabilizeVisualPage,
  type VisualTheme,
  type VisualViewportId,
} from "./visual-helpers";
import {
  VISUAL_PLAYER_STATES,
  type VisualPlayerState,
} from "../lib/visual-fixture";

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
 * 跑法：`npm run test:visual:trusted`（會以 `VISUAL_FIXTURE=1` 重建 SSG）；
 * 重產：再加 `-- --update-snapshots`，並**逐張人工目檢**後才提交。
 * 必須在 **darwin + 對齊的 Chromium** 上重產；Linux agent 不得 `--update-snapshots`。
 *
 * ── VIS-DEBT-2（資料凍結）──
 * 截圖打在凍結子集（EP1–6、前 12 景點，錨點 `ty-kids-museum`）。
 * 資料不再隨新集長高，所以 mask 歸零、頁面截圖改回 `fullPage`。
 * `html[data-visual-fixture=1]` 是防呆：打到活資料 build 會立刻失敗。
 *
 * ── VIS-GAP-1（兒童主路徑）──
 * `/story/ep-1`、`/games/coloring-book`、StoryPlayer DESIGN.md 四態（`?vp=`）。
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
  { id: "story", name: "單集故事頁", path: "/story/ep-1" },
  { id: "coloring-book", name: "繪本著色", path: "/games/coloring-book" },
] as const;

type VisualPageId = (typeof VISUAL_PAGES)[number]["id"];

const VIEWPORTS: Record<
  VisualViewportId,
  { width: number; height: number; label: string }
> = {
  mobile: { width: 390, height: 844, label: "390" },
  desktop: { width: 1280, height: 720, label: "1280" },
};

/** SiteNavBar desktopNav 斷點 980：頂欄 clip 回歸（漢堡／膠囊交界）。 */
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

const PLAYER_STATE_LABEL: Record<VisualPlayerState, string> = {
  "caption-follow": "字幕跟讀",
  "manual-page": "手動翻頁",
  ended: "播放完成",
  loading: "載入中",
};

/**
 * Phase A：保留 5 條黃金路徑 smoke（向後相容檔名）。
 * 新增頁不列入，一律走 `${id}-${viewport}-${theme}.png`。
 */
const SMOKE_PAGE_IDS = new Set<VisualPageId>([
  "home",
  "stories",
  "games",
  "adventures",
  "for-parents",
]);

/**
 * ── MASK_DOCTRINE ──
 *
 * VIS-DEBT-2 把資料釘在 fixture 子集後，內容不再隨新集改寫，
 * **所有頁的 volatile mask 都是 []**。不要為了「看起來有在遮」加回 EP 文案 mask——
 * 那會把 fixture 買回來的 gloss／marker／結果數覆蓋再盲掉。
 *
 * 新增頁面仍必須在 switch 裡明確回傳 []（assertNever 防呆）。
 *
 * 紅線：不得使用 CSS Modules 的 class 名。
 */
function volatileMasks(_page: Page, pageId: VisualPageId): Locator[] {
  switch (pageId) {
    case "home":
    case "stories":
    case "for-parents":
    case "characters":
    case "play-map":
    case "games":
    case "adventures":
    case "about":
    case "subscribe":
    case "place":
    case "story":
    case "coloring-book":
      return [];
    default:
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
 * mask 靜默失效的防呆（目前 mask 皆空；若再加 mask 仍受此守衛）。
 */
const MAX_MASK_AREA_RATIO = 0.06;

async function assertMasksResolve(
  masks: Locator[],
  pageId: string,
): Promise<void> {
  for (const [index, mask] of masks.entries()) {
    const label = `${pageId} 的第 ${index + 1} 個 mask`;
    const count = await mask.count();

    expect(
      count,
      `visual.spec：${label} 命中 0 個元素，代表選擇器已失效（文案改寫或 role 變更）。` +
        `請更新它，不要讓測試靜默退回無 mask 狀態。`,
    ).toBeGreaterThan(0);

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
 * 原則：**用「錨定在不會變的資料上」取代「遮掉會變的資料」**。
 * fixture 已凍結 catalog，元件 shot 也不再需要 mask。
 */
const COMPONENT_SHOTS: {
  id: string;
  name: string;
  path: string;
  locator: (page: Page) => Locator;
  masks?: (page: Page) => Locator[];
}[] = [
  {
    id: "stories-filter",
    name: "找故事篩選列",
    path: "/stories",
    locator: (page) =>
      page
        .locator('section[aria-label="找故事"] > div')
        .filter({ has: page.getByRole("heading", { name: "找故事" }) }),
  },
  {
    id: "stories-card",
    name: "故事卡（錨定最早一集）",
    path: "/stories",
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
          fullPage: true,
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
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(shot.path);
      await stabilizeVisualPage(page, { theme });
      const target = shot.locator(page);
      await expect(
        target,
        `visual.spec：元件 ${shot.id} 的錨點失效，截不到東西。`,
      ).toHaveCount(1);
      const masks = shot.masks?.(page) ?? [];
      if (masks.length) await assertMasksResolve(masks, shot.id);
      await expect(target).toHaveScreenshot(`${shot.id}-${theme}.png`, {
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

// 頂欄 IA／980 斷點：只截 header，避免全頁噪音。
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

// VIS-GAP-1：播放器四態。兒童主路徑以 390 為準；播放器是 viewport app，不拍 fullPage。
for (const state of VISUAL_PLAYER_STATES) {
  for (const theme of THEMES) {
    test(`visual：播放器 ${PLAYER_STATE_LABEL[state]} 390 ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/story/ep-1/play?vp=${state}`);
      await stabilizeVisualPage(page, { theme });
      await expect(
        page.locator(`[data-visual-player-state="${state}"]`),
      ).toBeVisible({ timeout: 15_000 });
      await expect(page).toHaveScreenshot(
        `story-player-${state}-390-${theme}.png`,
        {
          fullPage: false,
          maxDiffPixelRatio: theme === "night" ? 0.03 : 0.02,
          animations: "disabled",
        },
      );
    });
  }
}
