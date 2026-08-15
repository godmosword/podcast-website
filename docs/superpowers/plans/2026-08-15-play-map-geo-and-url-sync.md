# play-map：解除定位封鎖＋網址同步不再打伺服器

**日期**：2026-08-15
**範圍**：`/for-parents/play-map`
**基準 commit**：`8545762`
**執行者**：Codex（`codex exec`，workspace-write）
**狀態**：Approved Plan，可直接實作

---

## 0. 背景與證據

線上站 `https://podcast-website-mu.vercel.app/for-parents/play-map` 實測，兩個問題已證實：

### 證據 A — 定位被 Permissions-Policy 封死

```
$ curl -sSI https://podcast-website-mu.vercel.app/for-parents/play-map | grep -i permissions
permissions-policy: camera=(), microphone=(), geolocation=(), payment=()
```

Chromium 中即使先 `grantPermissions(["geolocation"])` 並灌入座標：

```
navigator.geolocation.getCurrentPosition
  → code 1 "Geolocation has been disabled in this document by permissions policy."

點「離我最近」→ aria-pressed 維持 false
畫面出現：「無法定位。可改選縣市，或稍後再開啟定位。」
```

`geolocation=()` 是**空 allowlist**，連同源自己都禁用。`handleNearMe`
（`components/for-parents/usePlayMapFilters.ts:286-311`）因此永遠走 error callback。
連帶失效：距離標籤、`nearMeCamera` 鏡頭、`pickNearest` 的最近 8 筆框選——這些程式碼線上從未執行過。

`next.config.ts:44-47` 的註解寫「本站不需要…定位」，那是 play-map 上線前的事實。
更糟的是 `next.config.test.ts:18` **把錯的值寫死在斷言裡**，等於測試在保護這個 bug。

### 證據 B — 每點一次篩選 chip 就打一次 RSC 往返

```
初次載入      GET /for-parents/play-map                        270,036 B
點「免費放電」  GET /for-parents/play-map?free=1&_rsc=...          50,904 B
點「室內」     GET /for-parents/play-map?indoor=1&free=1&_rsc=...
```

`syncUrl`（`usePlayMapFilters.ts:243-256`）用 `router.replace()` 同步網址；
因為 `app/for-parents/play-map/page.tsx:35-40` 是讀 `searchParams` 的 async server component，
每次 replace 都會讓整頁 RSC 重新渲染。這條路由不在 prerender-manifest 內，
線上 `cache-control: private, no-cache, no-store`、`x-vercel-cache: MISS`，
所以那 51KB 是**實打實回源**，只為了改網址列。

`usePlayMapFilters.ts:443-461` 那 5 個「把 prop 塞回 state」的 effect，
存在的唯一理由就是 RSC 重繪會把 `initial*` 再推下來一次。

---

## 1. 任務 T1（P0）：允許同源定位

### T1.1 `next.config.ts`

第 44-47 行的 Permissions-Policy，`geolocation=()` 改成 `geolocation=(self)`。
`(self)` 表示只有同源文件可用，**仍然會跳使用者授權提示**，第三方 iframe 照樣擋掉。
`camera` / `microphone` / `payment` **維持 `()` 不動**。

同時更新上方註解，讓它反映現況（play-map 需要同源定位；相機／麥克風／付款仍不需要）。

### T1.2 `next.config.test.ts`

第 18 行的期望值同步改為 `"camera=(), microphone=(), geolocation=(self), payment=()"`。
不要放寬成 regex 或 `toContain`——這條斷言的價值就在於精確鎖住 header 全文。

### T1.3 `e2e/play-map.spec.ts` 新增兩個回歸測試

加在既有 `test.describe("親子遊樂地圖", ...)` 內。

**(a) header 閘門（快、確定性高）**

```ts
test("play-map 回應允許同源定位（P0 回歸）", async ({ request }) => {
  const response = await request.get("/for-parents/play-map");
  expect(response.headers()["permissions-policy"]).toContain("geolocation=(self)");
});
```

**(b) 真實瀏覽器行為閘門**

```ts
test("「離我最近」可取得定位並顯示車程（P0 回歸）", async ({ page, context }) => {
  test.setTimeout(45_000);
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 25.033, longitude: 121.5654 });
  await page.setViewportSize(PHONE);
  await page.goto("/for-parents/play-map");
  await waitForPlayMapReady(page);

  const nearMe = page.getByRole("button", { name: "離我最近" });
  await nearMe.click();

  await expect(nearMe).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByText("無法定位。可改選縣市，或稍後再開啟定位。"),
  ).toHaveCount(0);
  await expect(
    page
      .locator("#play-map-panel-cards")
      .getByText(/約 \d+ 分鐘|車程 \d+ 分以上/)
      .first(),
  ).toBeVisible();
});
```

單元測試擋不住這個 bug（jsdom 不執行 Permissions-Policy），所以 (b) 是真正的閘門，必須有。

---

## 2. 任務 T2（P1）：網址同步改用 History API

### T2.1 `usePlayMapFilters.ts`：`syncUrl` 換掉 router

`router.replace()` → `window.history.replaceState()`。Next 15+ 原生支援用 History API
更新網址而不觸發導航，`useSearchParams` 也會跟著同步。

```ts
const syncUrl = useCallback(
  (next: Partial<PlayMapQuery>) => {
    const qs = buildPlayMapQueryString({
      city,
      type: typeFilter,
      indoorOnly,
      freeOnly,
      view: browseView,
      ...next,
    });
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  },
  [city, typeFilter, indoorOnly, freeOnly, browseView, pathname],
);
```

配套：
- 刪掉 `const router = useRouter();`（第 134 行）
- import 改成 `import { usePathname } from "next/navigation";`（`usePathname` 仍要用來組 URL）
- deps 陣列拿掉 `router`

`syncUrl` 只從事件 handler 呼叫，不在 render／SSR 期間執行，直接用 `window` 是安全的。

### T2.2 `usePlayMapFilters.ts`：5 個 prop-sync effect 合併成 1 個

第 443-461 行那五個各自獨立的 effect，換成一個：

```ts
/*
 * 網址由 history.replaceState 就地更新，不會觸發 server component 重繪，
 * 所以這個 effect 只在「真的換頁」時才會跑（例如從導覽列再點一次親子景點）。
 * 五個值同源於一次 parsePlayMapQuery 快照，一起同步才不會出現半套狀態。
 */
useEffect(() => {
  setCity(initialCity);
  setTypeFilter(initialType);
  setIndoorOnly(initialIndoorOnly);
  setFreeOnly(initialFreeOnly);
  setBrowseView(initialView);
}, [initialCity, initialType, initialIndoorOnly, initialFreeOnly, initialView]);
```

現有測試「上一頁／下一頁換 initial props 時同步回 state」（`PlayMap.test.tsx:427-443`）
一次改兩個 prop，合併後行為一致，該測試應維持綠燈、不要改它。

### T2.3 `PlayMap.test.tsx`：改監看 `history.replaceState`

現況：第 15 行 `const replaceMock = vi.fn()`，第 18 行塞進 `useRouter` mock，
第 379-398 行的「篩選狀態寫回網址，預設值不入 query」對它斷言。

改法：
- **保留** `vi.mock("next/navigation", ...)` 整塊，也保留 `useRouter` 這個 key
  （子元件之後若用到不會炸），只是不再對它斷言
- 新增 `window.history.replaceState` 的 spy，在 `beforeEach` 建立、`afterEach` 還原
- 三處斷言改成對 spy 斷言，形狀為
  `expect(replaceStateSpy).toHaveBeenCalledWith(null, "", "/for-parents/play-map?free=1")`，
  最後一處用 `toHaveBeenLastCalledWith(null, "", "/for-parents/play-map?view=map")`
- 若 `replaceMock` 變成完全沒人用，就一併刪掉

**測試意圖不得改變**：仍要驗「免費放電 → `?free=1`」「切地圖 → `?free=1&view=map`」
「再按一次免費放電 → `?view=map`」這三段，以及預設值不入 query。

### T2.4 `e2e/play-map.spec.ts`：新增「點 chip 不回源」測試

```ts
test("點篩選 chip 不觸發 RSC 往返（P1 回歸）", async ({ page }) => {
  test.setTimeout(30_000);
  const rscRequests: string[] = [];
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("_rsc=") && url.includes("free=1")) rscRequests.push(url);
  });

  await page.goto("/for-parents/play-map");
  await waitForPlayMapReady(page);

  await page.getByRole("button", { name: "免費放電" }).click();
  await expect(page).toHaveURL(/free=1/);
  await page.waitForTimeout(1_000);

  expect(rscRequests).toEqual([]);
});
```

只比對含 `free=1` 的 `_rsc=` 請求，避免導覽列 prefetch 造成偽陽性。

既有測試「免費放電意圖可縮小結果」的 `await expect(page).toHaveURL(/free=1/)`
在 replaceState 之下照樣成立，不要改。

---

## 3. 驗證（全部要跑，貼出實際輸出）

```bash
npm run lint          # eslint --max-warnings=0，會抓到未使用的 useRouter import
npm test              # vitest，基準是 124 passed
npx playwright test e2e/play-map.spec.ts
```

通過標準：

- `npm run lint` 零錯誤零警告
- `npm test` 全綠，且**測試數只增不減**（基準 124；T2.3 是改寫既有測試，不應減少）
- `e2e/play-map.spec.ts` 全綠，含 3 個新測試
- 手動確認 `git diff` 只碰到下列五個檔案

e2e 的 webServer 會跑 `npm run build && npm run start`（見 `playwright.config.ts:16-21`），
`prebuild` 會執行 generate 腳本。**若 build 因環境／網路失敗，不要繞過或改設定**，
直接回報失敗訊息，把 lint 與 vitest 的結果交出來即可。

---

## 4. 允許改動的檔案（白名單）

1. `next.config.ts`
2. `next.config.test.ts`
3. `components/for-parents/usePlayMapFilters.ts`
4. `components/for-parents/PlayMap.test.tsx`
5. `e2e/play-map.spec.ts`

碰到白名單以外的檔案就是超出範圍，停下來回報。

---

## 5. 紅線（不得違反）

- **不要 commit，不要 push，不要開分支。** 做完把工作區留著給人審 diff。
- **不要動 `data/playgrounds.ts`** 的任何一筆資料。
- **不要動「DOM 恆 73 筆」的 SSR 契約**：`VISIBLE_STEP`、`PlayMapCardList` 的
  matched／unmatched 雙軌輸出、`hidden` 遮蔽策略，全部維持原樣。
- **不要動地圖生命週期**：`FitBounds`、`playMapFitKey`、`snapshotRef`、
  `InvalidateSizeOnActive`、地圖分頁保持掛載的 latch，全部不准碰。
  `PlayMapLeaflet.tsx:79-85` 的註解已說明為何不能再加 userMoved 旗標，照做。
- **不要改任何 CSS**。
- **不要改 `camera` / `microphone` / `payment` 的 Permissions-Policy 值**。
- **不要為了讓測試變綠而放寬斷言**。實作要配合測試，不是反過來。

---

## 6. 明確不在本次範圍

以下是同一份 review 找到但**這次不做**的項目，看到也不要順手改：

- `PlayMapCard` / `AccessibleMarker` 加 `React.memo`（P2 效能）
- `/for-parents/play-map/[id]` 地點詳情頁與 SEO 改造（P2）
- OpenStreetMap 官方 tile 換供應商（P2 營運風險）
- PPR / `cacheComponents` 靜態化（需另開 plan，會動到 SSR 契約）
- 死碼清理：`listCoverageSummary`、`DEFAULT_PLAY_MAP_CITY`（P3）
- `filterSummaryLabel` 的無效三元、`points` prop 冗餘、`distanceLabelFor` 包裝（P3）
- 拆 `PlayMap.module.css`（1320 行）與 `data/playgrounds.ts`（2332 行）（P3）

---

## 7. 完成後回報格式

```
STATUS: DONE | DONE_WITH_CONCERNS | BLOCKED
改動檔案：<清單，逐檔一句話說明改了什麼>
lint：<實際輸出摘要>
vitest：<X passed / Y total>
playwright e2e/play-map.spec.ts：<X passed>
偏離計畫之處：<有就寫，沒有寫「無」>
疑慮：<有就寫，沒有寫「無」>
```
