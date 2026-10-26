import { test, expect, type Locator, type Page } from "@playwright/test";
import {
  stabilizeVisualPage,
  type VisualTheme,
  type VisualViewportId,
} from "./visual-helpers";
import { dismissCandyIntro } from "./candy-helpers";
import { INTRO_PORTAL_ENABLED, skipIntroOverlay } from "./intro-gate";
import { PROGRESS_STORAGE_KEY } from "../lib/progress-store";
import { DUDU_EMOTION_BY_SEGMENT, DUDU_EMOTION_LABEL } from "../data/dudu-emotions";
import { pinClassicSushiDay } from "./helpers/dino-sushi";

/**
 * D2 視覺回歸：Phase A smoke（5 頁 × 1280 light）+ Phase B 完整組合。
 * 主頁 × 390/1280 × light/night。
 */
test.describe.configure({ mode: "serial" });

// ADR-0004：首次進 `/` 會被 3D 開場覆蓋層蓋住。這支規格測的是 Landing 本身，
// 所以先表明這個分頁看過開場了，否則量到的是覆蓋層。
test.beforeEach(async ({ page }) => {
  await skipIntroOverlay(page);
});


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
  // 基準是用凍結資料錄的（VIS-DEBT-2，見 lib/visual-fixture.ts）；拿活資料比只會整片紅，
  // 拿活資料重錄更糟——下個月又全部失效。一律走 npm run test:visual:trusted。
  if (process.env.VISUAL_FIXTURE !== "1") {
    throw new Error("視覺回歸要用凍結資料：請跑 npm run test:visual:trusted（會帶 VISUAL_FIXTURE=1）。");
  }
});

const VISUAL_PAGES = [
  { id: "home", name: "首頁", path: "/" },
  { id: "stories", name: "全部故事", path: "/stories" },
  { id: "games", name: "遊樂園", path: "/games" },
  { id: "story-ep-3", name: "單集 ep-3", path: "/story/ep-3" },
  { id: "adventures", name: "宇宙地圖", path: "/adventures" },
  { id: "characters", name: "角色圖鑑", path: "/characters" },
  { id: "about", name: "關於", path: "/about" },
  { id: "subscribe", name: "訂閱", path: "/subscribe" },
  { id: "feedback", name: "留言", path: "/feedback" },
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
]);

/**
 * 只拍 viewport、不拍整頁的頁面。
 * stories、about 以前也在這裡（每出一集就長高）；改用凍結資料（VIS-DEBT-2）後頁高固定，回到整頁。
 */
const GROWING_PAGE_IDS = new Set<VisualPageId>([
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
function volatileMasks(page: Page, pageId: VisualPageId): Locator[] {
  switch (pageId) {
    case "home":
      return [];
    case "stories":
      // 凍結資料（VIS-DEBT-2）：最新一集固定是 fixture 裡的 ep-22，「NEW · EP」與集數不再隨上新集變，不必遮。
      return [];
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
      // (a) 買不到穩定性——同一張圖上位置選擇器 15 個縣市的命中數、名單分組標題、
      //     「已看 24／99」全都沒遮，任何會動到結果數的資料變更必然同時動到它們；
      // (b) 代價卻是塗掉 DESIGN.md 指名的東西——結果列的「N 個地方」與
      //     資料誠實紅線的頁首收錄摘要。
      return [];
    case "games":
    case "story-ep-3":
    case "adventures":
    case "about":
    case "subscribe":
    case "feedback":
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
  /** 截圖前的操作（例如打開面板）；在 stabilizeVisualPage 之後執行。 */
  prepare?: (page: Page) => Promise<void>;
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
    // 「N 則故事」以前要遮；凍結資料下固定是 6 則，不遮。
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
    id: "play-map-scenarios",
    name: "今天想怎麼玩？情境卡",
    path: "/for-parents/play-map",
    // 四張程式畫的黏土插畫＋卡框底影語彙；卡上筆數不遮（MASK_DOCTRINE 判準 1）。
    locator: (page) => page.getByRole("group", { name: "今天想怎麼玩" }),
  },
  {
    id: "play-map-location-sheet",
    name: "選縣市面板（手機底部 sheet）",
    path: "/for-parents/play-map",
    viewport: { width: 390, height: 844 },
    // DESIGN.md 對位置選擇的規範密度最高（北中南分組、0 筆虛線、未收錄聲明、觸控尺寸）。
    prepare: async (page) => {
      await page.getByRole("button", { name: /^選擇地點，目前：/ }).click();
    },
    locator: (page) => page.getByRole("dialog", { name: "去哪裡玩？" }),
  },
  {
    id: "play-map-card",
    name: "景點卡（錨定固定 slug）",
    path: "/for-parents/play-map",
    locator: (page) => page.locator("li#ty-kids-museum"),
  },
  {
    id: "place-nearby",
    name: "景點詳情：附近還能去哪裡（地圖卡語彙）",
    path: "/for-parents/play-map/ty-kids-museum",
    viewport: { width: 390, height: 844 },
    // 凍結資料下附近景點固定是同一批（桃園三個 fixture 景點），類型圓章與卡框都在這張裡。
    locator: (page) => page.locator('section[aria-labelledby="nearby-heading"]'),
  },
  {
    id: "site-nav-drawer",
    name: "全站選單抽屜（開啟，390）",
    path: "/stories",
    viewport: { width: 390, height: 844 },
    prepare: async (page) => {
      await page.getByRole("button", { name: "選單", exact: true }).click();
    },
    locator: (page) => page.getByRole("navigation", { name: "網站選單" }),
  },
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
        if (pageDef.id === "feedback") {
          // 表單在初始 HTML；牆可能是空標題或已核准列表，等殼穩定再截。
          await expect(
            page.getByRole("heading", { name: "留言給馬米跟Bonbon", level: 1 }),
          ).toBeVisible();
          await expect(
            page.getByRole("heading", { name: "大家的留言", level: 2 }),
          ).toBeVisible();
        }
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

/** 標題頁只截卡片：抬頭的遊戲名稱另有改動，不讓它牽動這張基準。 */
for (const [width, height, theme] of [
  [390, 844, "light"],
  [1280, 800, "night"],
] as const) {
  test(`visual：消消樂標題 ${width} ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/games/candy-match");
    await stabilizeVisualPage(page, { theme });
    await expect(page.getByRole("list", { name: "玩法三步驟" })).toBeVisible();
    await expect(page.locator('[data-screen="title"]')).toHaveScreenshot(
      `candy-title-${width}-${theme}.png`,
      { maxDiffPixelRatio: 0.02, animations: "disabled" },
    );
  });
}

test("visual：消消樂地圖 390 light", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/games/candy-match");
  await stabilizeVisualPage(page, { theme: "light" });
  await page.getByRole("button", { name: /開始冒險/ }).click();
  await expect(page.getByTestId("candy-match-map")).toBeVisible();
  await expect(page).toHaveScreenshot("candy-map-390-light.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
    animations: "disabled",
    mask: [],
  });
});

/** 固定棋盤 seed（只有測試會設），可預設已通關站數以直接進後期大棋盤。 */
async function seedCandy(page: Page, clearedLevels = 0) {
  await page.addInitScript(
    ({ storageKey, cleared }: { storageKey: string; cleared: number }) => {
      (window as unknown as { __candyMatchSeed: number }).__candyMatchSeed = 11;
      if (cleared <= 0) return;
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.gameProfile = {
        version: 5,
        ...(parsed.gameProfile ?? {}),
        medals: { "candy-match": Array(cleared).fill(1) },
      };
      localStorage.setItem(storageKey, JSON.stringify(parsed));
    },
    { storageKey: PROGRESS_STORAGE_KEY, cleared: clearedLevels },
  );
}

async function openCandyLevel(page: Page) {
  await page.getByRole("button", { name: /開始冒險/ }).click();
  await page.locator('button[data-next="true"]').click();
  await expect(page.getByTestId("candy-match-board")).toBeVisible();
  await dismissCandyIntro(page);
}

test("visual：消消樂第 1 關 390 light（固定棋盤）", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await seedCandy(page);
  await page.goto("/games/candy-match");
  await stabilizeVisualPage(page, { theme: "light" });
  await openCandyLevel(page);
  await expect(page).toHaveScreenshot("candy-level1-390-light.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
    animations: "disabled",
    mask: [],
  });
});

test("visual：消消樂第 8 站禮物 6×8 390 light（固定棋盤）", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await seedCandy(page, 7);
  await page.goto("/games/candy-match");
  await stabilizeVisualPage(page, { theme: "light" });
  await openCandyLevel(page);
  await expect(page).toHaveScreenshot("candy-level8-390-light.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
    animations: "disabled",
    mask: [],
  });
});

test("visual：消消樂第 6 站 1280 寬螢幕側欄（固定棋盤）", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await seedCandy(page, 5);
  await page.goto("/games/candy-match");
  await stabilizeVisualPage(page, { theme: "light" });
  await openCandyLevel(page);
  await expect(page).toHaveScreenshot("candy-level6-1280-light.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
    animations: "disabled",
    mask: [],
  });
});

test("visual：著色本畫布 390 light", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/games/coloring-book");
  await stabilizeVisualPage(page, { theme: "light" });
  await page.getByRole("button", { name: "開始塗", exact: true }).click();
  const card = page.getByRole("button", { name: /^著色：/ }).first();
  await card.click();
  await page.waitForSelector("canvas");
  await page.waitForFunction(
    () => !document.body.textContent?.includes("載入線稿中"),
  );
  await expect(page).toHaveScreenshot("coloring-canvas-390-light.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
    animations: "disabled",
    mask: [],
  });
});

/** 多多壽司屋固定 seed（只有測試會設）：同一盤托盤、同一串訂單，截圖可重現。 */
async function openDinoSushi(
  page: Page,
  width: number,
  height: number,
  theme: VisualTheme,
  classic = false,
) {
  await page.setViewportSize({ width, height });
  await page.addInitScript(() => {
    (window as unknown as { __dinoSushiSeed: number }).__dinoSushiSeed = 7;
  });
  if (classic) await pinClassicSushiDay(page);
  await page.goto("/games/dino-sushi");
  await stabilizeVisualPage(page, { theme });
  await expect(page.getByRole("heading", { name: "多多肚子餓了！" })).toBeVisible();
}

/** 照第 n 單的泡泡選飯、放料；serve 時順便送出並等多多吃完。 */
async function makeDinoOrder(page: Page, n: number, serve: boolean) {
  const label = await page.getByRole("img", { name: new RegExp(`^第 ${n} 單`) }).getAttribute("aria-label");
  const [base, ...toppings] = label!.split("想吃：")[1]!.split("、");
  await page.getByRole("button", { name: `選${base}` }).click();
  for (const t of toppings) await page.getByRole("button", { name: `加${t}` }).click();
  if (!serve) return;
  await page.getByRole("button", { name: "給多多吃" }).click();
  await expect(
    page.getByRole("img", { name: `吃完 ${n} 盤` }).or(page.getByTestId("dino-sushi-result")).first(),
  ).toBeVisible();
}

/** 標題頁只截卡片：抬頭的遊戲名稱與工具列另有基準。 */
for (const [width, height, theme] of [
  [390, 844, "light"],
  [1280, 800, "night"],
] as const) {
  test(`visual：多多壽司屋標題 ${width} ${theme}`, async ({ page }) => {
    await openDinoSushi(page, width, height, theme);
    await expect(page.getByTestId("dino-sushi")).toHaveScreenshot(`dino-sushi-title-${width}-${theme}.png`, {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });
}

/** 廚房：第 1 單做齊（泡泡全打勾、料位三格、托盤 2×4）。直向、橫向手機三欄、桌面夜間三欄。 */
for (const [width, height, theme] of [
  [390, 844, "light"],
  [844, 390, "light"],
  [1280, 800, "night"],
] as const) {
  test(`visual：多多壽司屋廚房 ${width}×${height} ${theme}（固定 seed）`, async ({ page }) => {
    await openDinoSushi(page, width, height, theme, true);
    await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
    await makeDinoOrder(page, 1, false);
    await expect(page.getByTestId("dino-sushi")).toHaveScreenshot(
      `dino-sushi-kitchen-${width}x${height}-${theme}.png`,
      { maxDiffPixelRatio: theme === "night" ? 0.03 : 0.02, animations: "disabled" },
    );
  });
}

test("visual：多多壽司屋結算 390 light（5 單一次做對、三星）", async ({ page }) => {
  await openDinoSushi(page, 390, 844, "light", true);
  await page.getByRole("button", { name: "開始幫多多做壽司" }).click();
  for (let n = 1; n <= 5; n++) await makeDinoOrder(page, n, true);
  const result = page.getByTestId("dino-sushi-result");
  await expect(result.getByRole("img", { name: "拿到 3 顆星，共 3 顆" })).toBeVisible();
  await expect(result).toHaveScreenshot("dino-sushi-result-390-light.png", {
    maxDiffPixelRatio: 0.02,
    animations: "disabled",
  });
});

test("visual：單集 ep-3 768 light", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/story/ep-3");
  await stabilizeVisualPage(page, { theme: "light" });
  const masks = volatileMasks(page, "story-ep-3");
  await assertMasksResolve(masks, "story-ep-3");
  await expect(page).toHaveScreenshot("story-ep-3-768-light.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
    animations: "disabled",
    mask: masks,
  });
});

/**
 * 播放器（DESIGN.md §播放器狀態、VIS-GAP-1）：停在 ep-3 第 21 秒，畫面固定是第 2 張插圖＋那一句字幕。
 * 不按播放、不等音檔跑：讀到 metadata 就暫停、seek，`seeked` 之後才截，跟播放時機無關。
 */
for (const viewportId of Object.keys(VIEWPORTS) as VisualViewportId[]) {
  for (const theme of THEMES) {
    const viewport = VIEWPORTS[viewportId];
    test(`visual：播放器 ep-3 ${viewport.label} ${theme}（暫停在第 21 秒）`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/story/ep-3/play");
      await stabilizeVisualPage(page, { theme });
      await page.locator("audio").evaluate(async (el) => {
        const media = el as HTMLAudioElement;
        media.muted = true;
        media.pause();
        if (media.readyState < HTMLMediaElement.HAVE_METADATA) {
          await new Promise<void>((resolve, reject) => {
            media.addEventListener("loadedmetadata", () => resolve(), { once: true });
            media.addEventListener("error", () => reject(new Error("audio error")), { once: true });
            media.load();
          });
        }
        await new Promise<void>((resolve, reject) => {
          const timeout = window.setTimeout(() => reject(new Error("seek timeout")), 10_000);
          media.addEventListener(
            "seeked",
            () => {
              window.clearTimeout(timeout);
              resolve();
            },
            { once: true },
          );
          media.currentTime = 21;
        });
        media.pause();
      });
      await expect(page.getByRole("button", { name: "播放", exact: true })).toBeVisible();
      await expect.poll(() => page.locator('[aria-hidden="false"] img').getAttribute("alt")).toMatch(/第 2 頁/);
      await expect(page.locator('[aria-hidden="false"] img')).toHaveJSProperty("complete", true);
      await expect(page).toHaveScreenshot(`story-player-${viewport.label}-${theme}.png`, {
        maxDiffPixelRatio: theme === "night" ? 0.03 : 0.02,
        animations: "disabled",
      });
    });
  }
}

/**
 * 播放完成（DESIGN.md §播放器狀態 第 3 態）：唯一有自己版面、三顆按鈕的狀態，主次與 390 寬換行只能靠截圖守。
 * 從最後 0.2 秒靜音播到結束，等「再聽一次」出現；下一集在凍結資料下固定是 ep-1。
 */
for (const viewportId of Object.keys(VIEWPORTS) as VisualViewportId[]) {
  const viewport = VIEWPORTS[viewportId];
  test(`visual：播放器 ep-3 播放完成 ${viewport.label} light`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/story/ep-3/play");
    await stabilizeVisualPage(page, { theme: "light" });
    await page.locator("audio").evaluate(async (el) => {
      const media = el as HTMLAudioElement;
      media.muted = true;
      if (media.readyState < HTMLMediaElement.HAVE_METADATA) {
        await new Promise<void>((resolve, reject) => {
          media.addEventListener("loadedmetadata", () => resolve(), { once: true });
          media.addEventListener("error", () => reject(new Error("audio error")), { once: true });
          media.load();
        });
      }
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error("ended timeout")), 10_000);
        media.addEventListener(
          "ended",
          () => {
            window.clearTimeout(timeout);
            resolve();
          },
          { once: true },
        );
        media.currentTime = Math.max(0, media.duration - 0.2);
        void media.play();
      });
    });
    await expect(page.getByRole("button", { name: "再聽一次" })).toBeVisible();
    await expect(page.getByText(/^下一集：/)).toBeVisible();
    await expect(page).toHaveScreenshot(`story-player-ended-${viewport.label}-light.png`, {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });
}

// 元件級 baseline：高度不隨資料變動，圖小且真的看得完，容差不會被面積稀釋。
for (const shot of COMPONENT_SHOTS) {
  for (const theme of THEMES) {
    test(`visual：${shot.name} ${theme}`, async ({ page }) => {
      await page.setViewportSize(shot.viewport ?? { width: 1280, height: 900 });
      await page.goto(shot.path);
      await stabilizeVisualPage(page, { theme });
      await shot.prepare?.(page);
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
        // 夜色遮罩與嘟嘟表情跟著捲到的段落切換；等兩者都換好再截，
        // 不然平行跑時會截到前一段的狀態（2026-10-25：landing-health-390-night 錄成冷色遮罩）。
        await expect(
          page.locator(`[data-active-segment="${segment.anchorId}"]`),
        ).toBeAttached();
        const emotion = DUDU_EMOTION_LABEL[DUDU_EMOTION_BY_SEGMENT[segment.id]];
        await expect(
          page.getByRole("button", { name: `小紅豆金龜車：${emotion}` }),
        ).toBeVisible();
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
test("visual：留言頁頂欄 active 1280 light", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/feedback");
  await stabilizeVisualPage(page, { theme: "light" });
  await expect(
    page.getByRole("link", { name: "留言", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  const header = page.locator("header").first();
  await expect(header).toHaveScreenshot("site-nav-feedback-1280-light.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.02,
  });
});

test("visual：內頁不顯示 KidsPlayDock", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/stories");
  await stabilizeVisualPage(page, { theme: "light" });
  await expect(page.getByRole("navigation", { name: "去玩" })).toHaveCount(0);
});

/**
 * Intro 核心畫面 baseline。舞台是橫向 2.5D 視差帶（Phase 3b 起為預設）：走
 * reduced-motion 讓四層 strip 停在 translateX(-33.333%) 的起點、主角不浮動，
 * 畫面才是確定的。舊的 poster／ready／greeting 三態是 3D 舞台的東西，已隨
 * 預設切換一併退役。
 */
const INTRO_VISUAL_VIEWPORTS = [
  { width: 1440, height: 900, label: "1440x900" },
  { width: 390, height: 844, label: "390x844" },
] as const;

test.describe("Intro visual baselines", () => {
  test.skip(!INTRO_PORTAL_ENABLED, "產品已關掉開場；baseline 仍保留");

for (const viewport of INTRO_VISUAL_VIEWPORTS) {
  test(`visual：Intro ${viewport.label} parallax`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/intro");
    await stabilizeVisualPage(page, { theme: "light" });
    const hero = page.locator("[data-hero-world]");
    await expect(hero).toHaveAttribute("data-stage", "parallax");
    await expect(hero.locator("[data-hero-parallax]")).toHaveAttribute("data-ready", "true", { timeout: 15_000 });
    await expect(hero).toHaveAttribute("data-scene-state", "ready");
    await expect(hero.locator("canvas")).toHaveCount(0);
    await expect(page).toHaveScreenshot(`intro-parallax-${viewport.label}-light.png`, {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });
}
});
