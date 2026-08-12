# 親子遊樂地圖意圖優先改版設計（2026-08-12）

## Goal

讓家長在 **3 秒內**開始篩選，並用最少點擊找到「今天可以立刻帶小孩去」的地方。

解決現況：

1. 預設鎖「台北市」，外縣市家長多一步。
2. 手機上縣市＋類型＋進階篩選佔過多垂直空間。
3. 卡片資訊過瘦（缺適齡、距離、推車等決策訊號）。
4. 缺少意圖優先入口（離我最近／免費／室內／主題樂園）。

Canonical 路徑：`/for-parents/play-map`（導覽仍稱「親子景點」）。

## Decisions（已確認）

| 題目 | 決策 |
|---|---|
| 產品方案 | **B：意圖優先＋縣市可選**（非 A 疊在台北上、非 C 永遠搶定位） |
| 預設範圍 | `city = null`（全部已收錄）；**不再**預設台北市 |
| 首屏 | 4 大意圖 chip 置頂；縣市／類型降為次要 |
| 「離我最近」與縣市 | **不強制清空縣市**：有選縣市 → 該縣內近→遠；未選 → 全國近→遠 |
| 排序 | 有定位 → 距離近→遠；無定位 → 免費優先，其次名稱 `zh-Hant` |
| 類型 chip | count = 0 **隱藏**（已選中例外，避免無法取消空結果） |
| 手機篩選 | sticky 摘要列＋預設收合；桌面可預設展開 |
| 地圖點 marker | 先開 **精簡 bottom sheet**；完整詳情可經「更多」 |
| 卡片／地圖切換 | 保留既有互斥 tabs |
| 推車友善 | 第一版啟發式顯示標籤；**不加**新資料欄位（另開任務） |
| 距離文案 | 有定位才顯示「約 X 分鐘」；用**開車粗估**（非步行） |

## Current State（現況）

- UI：`components/for-parents/PlayMap.tsx` + `.module.css`、`PlayMapLeaflet.tsx`
- 查詢：`lib/playgrounds-query.ts`（`city` 省略＝不過濾，但 UI 仍強制預設縣市）
- 預設常數：`DEFAULT_PLAY_MAP_CITY = "台北市"`（`lib/playground-coverage.ts`）
- 資料：`data/playgrounds.ts`（`free`／`indoor`／`ageRange`／`type`／`tags`／`tips`；無 `strollerFriendly`）
- 卡片已有左側 `::before` 類型色條與「導航」；meta 僅區名＋免費／室內
- 類型 0 筆目前 **disabled** 而非隱藏
- 無 geolocation、無距離排序
- SEO：全部地點 SSR 進 HTML，不符條件者 `hidden`（須保留）
- Editorial：`docs/PLAY-MAP-EDITORIAL.md`

## Information Architecture

### 手機首屏結構

```
[SiteNav]
標題「親子遊樂地圖」＋ coverage 摘要 ＋ [卡片|地圖]
「今天想去哪？」
[離我最近] [免費放電]   ← 2×2 大意圖
[室內]     [主題樂園]
──────── sticky ────────
摘要列：條件 · N 處  [篩選 ▾] [清除?]
（展開）縣市矮橫滾｜類型橫滾（隱藏 0）
────────────────────────
卡片列表 / 地圖
```

### 桌面調整

- 寬度維持工具頁 **1100px**。
- 意圖列 **單列 4 顆**。
- 縣市／類型可預設展開；仍隱藏 count=0 類型。
- 卡片 2～3 欄；地圖精簡 sheet 可略寬，仍先精簡後完整。

## Intent Model

| 意圖 | 行為 | 可疊加 |
|---|---|---|
| 離我最近 | 請求 geolocation；成功寫入 `userLatLng` 並改距離排序；失敗則摘要提示「無法定位，已改為免費優先」 | 與其他意圖／縣市可並存 |
| 免費放電 | `freeOnly = true` | 是 |
| 室內 | `indoorOnly = true` | 是 |
| 主題樂園 | `type = "主題樂園"` | 與免費／室內可並存；再點同一顆可取消 type |

意圖不自動切換到地圖 tab（減少跳轉）；家長可自行切地圖。

「離我最近」為排序／定位意圖，不是互斥 radio；可與篩選條件並存。若使用者關閉定位語意（例如清除條件），清除 `userLatLng` 依賴的「強制近→遠」僅在仍持有有效座標時生效——**有座標就距離排序**，與是否剛點過 chip 無關（簡化狀態機）。

## Card Hierarchy

```
[type 色條]
① 名稱（粗體）                         [導航]
② district ?? city  ·  約 X 分鐘（有定位）
③ 標籤列（有資料才顯示，建議 ≤4）
   免費｜室內｜推車友善｜3–8 歲
```

- 點卡片主體 → `variant="full"` 詳情（沿用 tips／收費／來源／官網）。
- 「導航」為獨立 `<a>`，不觸發選中。
- 需購票／戶外：卡片標籤列**不**再放 muted 反向標籤（減少噪音）；詳情 sheet 仍可顯示完整狀態。

### 推車友善啟發式（第一版）

顯示當且僅當文案明確正面（例如 tags／facilities／tips 含「推車友善」，或明確「推車可行」且無「慎選／不宜」等否定）。  
含「推車慎選」「坡道多／階梯」等風險語 → **不顯示**。  
不新增 boolean；不進篩選 facet。

### 距離粗估

- `haversineKm(user, place)` → `estimateDriveMinutes(km)`（市區約 2.5–3 分/km，結果 clamp 約 1–90）。
- 文案：`約 ${n} 分鐘`（不寫「開車」，避免過度承諾；實作為開車粗估）。

## Filter UX

### Sticky 摘要列（手機）

- 收合預設：顯示目前條件摘要＋結果數＋「篩選」展開鈕。
- 展開：縣市 chip 橫滾（含「全部」）、類型 chip 橫滾。
- `position: sticky`；top 避開半透明 SiteNav；動畫只用 transform／opacity，遵守 `prefers-reduced-motion`。

### 縣市

- 新增「全部」＝ `city = null`。
- Chip 高度再壓低（手機 compact）；橫滾＋選中 scrollIntoView 沿用。
- 某縣在其他條件下 0 筆：可 disabled（與現況「剩餘數」語意一致），仍顯示縣名以利發現覆蓋。

### 類型

- 只渲染 `count > 0` 的類型；**已選中即使 count=0 仍顯示**以便取消。
- 「全部」永遠在。

### 空狀態

- 文案：目前沒有符合條件的地點，試試改意圖或放寬篩選。
- 提供「清除條件」（清 type／indoor／free；**不**強制清 city／定位，除非產品後續要「重設全部」——本輪清除＝現有 `handleClearFilters` 語意＋可一併取消意圖對應的 type／flags）。

## Map Compact Sheet

點 marker 或從地圖選點：

| 區塊 | 精簡 sheet | 完整 sheet |
|---|---|---|
| 名稱 | ✓ | ✓ |
| 關鍵標籤 | ✓（同卡片 L3） | ✓（meta 列可更完整） |
| 導航 | ✓ | ✓ |
| Tips／收費／來源／官網 | ✗（「更多」才開） | ✓ |

實作：`PlayMapSheet` 加 `variant: "compact" | "full"`。

- **地圖**選點 → 一律 `compact`；精簡 sheet 內提供「更多」切成 `full`。
- **卡片**點選 → 一律 `full`（家長已在列表看過摘要，進來要決策細節）。

Escape／關閉／焦點回報沿用。

## URL / Query Contract

```ts
type PlayMapQuery = {
  city: string | null; // null = 全部；URL 省略 city
  type: PlaygroundType | null;
  indoorOnly: boolean;
  freeOnly: boolean;
  view: "cards" | "map";
};
```

- `parsePlayMapQuery`：無合法 `city` → `null`（**不再**填預設台北）。簽名可改為不再需要 `defaultCity`，或保留參數但忽略「缺省填入」行為（實作選較小 diff；測試必須鎖定「無參數 → city null」）。
- `buildPlayMapQueryString`：`city === null` 不寫入；有縣市才 `city=`。第二參數若仍叫 `defaultCity`，僅用於「等於預設就省略」——因預設改為 null，有縣市一律寫入即可。
- `userLatLng` **不**進 URL（隱私＋不穩定）；重新整理後需再次授權才有距離。
- Deep link 既有 `?city=…&type=…&indoor=1&free=1&view=map` 行為保留；僅「無參數」預設從台北改為全部。
- `app/for-parents/play-map/page.tsx`：`PlayMap` 的 `initialCity` 改接 `string | null`；拿掉「用 DEFAULT_PLAY_MAP_CITY 當進頁選中」的傳遞。

`DEFAULT_PLAY_MAP_CITY`：不再作為「無參數進頁」的選中縣市。可保留常數供舊測試／文件對照，或改名／縮小用途；地圖空中心繼續用 `DEFAULT_PLAY_MAP_CENTER`。

## Architecture

### 分層（對齊專案慣例）

```
data/playgrounds.ts              # 不動欄位契約（本輪）
lib/playgrounds-query.ts         # city null、filter／count
lib/playground-distance.ts       # 新增：距離、分鐘粗估、sort
lib/playground-coverage.ts       # 預設縣市語意調整
components/for-parents/
  PlayMap.tsx                    # 編排
  PlayMap.module.css
  PlayMapLeaflet.tsx              # 選點 → compact sheet
  （可內聯或抽出）IntentRow / Filters / Card
app/for-parents/play-map/page.tsx
e2e/play-map.spec.ts
docs/PLAY-MAP-EDITORIAL.md       # UI 契約一句更新
```

### 建議元件邊界

| 單位 | 職責 |
|---|---|
| Intent row | 4 意圖；geolocation 請求與 pressed 態 |
| Filters | sticky 摘要、收合、縣市／類型 chips |
| PlaygroundCard | 色條、名稱、區＋距離、標籤、導航 |
| PlayMapSheet | compact／full |
| PlayMap | state、URL sync、sort、空狀態、tabs |

### 資料流

```
intents + city + type + indoor + free + view + userLatLng?
  → filterPlaygrounds
  → sortPlaygrounds (distance | free-first)
  → cards（全量 SSR + hidden）／map markers
  → sheet (compact | full)
```

### 排序規則（明確）

1. 若 `userLatLng` 有效 → 依距離升序；同距離用名稱。
2. 否則 → `free` 真值優先，再 `localeCompare(name, "zh-Hant")`。

## Accessibility & Motion

- 意圖／篩選用真正 `<button>`＋`aria-pressed`／`aria-expanded`／`aria-label`。
- 導航用 `<a>`＋另開視窗語意。
- 裝飾 SVG／色條 `aria-hidden`。
- sticky 展開動畫：transform／opacity only；`prefers-reduced-motion: reduce` 時關閉。
- 分頁隱藏時地圖暫停（沿用 Leaflet `active`）。

## Out of Scope（本輪禁止）

- 日／夜主題系統、`useMapCamera`／`ZoneSheet`、zone-art、宇宙地圖
- Apple sync workflow／`scripts/sync-apple-podcast.ts`
- 新增 `strollerFriendly` 欄位或全庫資料回填
- 付費 Places API、自動爬蟲
- 改 OSM tile 夜間反轉
- 行銷向 hero／統計條／多段推廣區塊（本頁維持工具頂列）

## Testing

- `lib/playgrounds-query.test.ts`：`city: null`、URL 省略、parse 無 city
- 新 `lib/playground-distance.test.ts`：haversine、分鐘 clamp、sort 穩定
- 推車啟發式單元測試（若抽成純函式）
- 更新 `e2e/play-map.spec.ts`：意圖、全部縣市、收合、空狀態、卡片欄位、compact sheet
- 閘門：`npm test`、`npm run build`、`npx tsc --noEmit`
- 完成後更新 `TODOS.md`

## Success Criteria

1. 無 query 進頁：不預選台北；可見 4 意圖；手機篩選預設收合。
2. 點「免費放電／室內／主題樂園」≤1 次即可縮小結果。
3. 授權定位後卡片出現「約 X 分鐘」且近者在前。
4. 拒絕定位仍可用，且排序為免費優先。
5. 類型 0 筆不佔 chip 列；結果 0 有友善空狀態。
6. 地圖 marker → 精簡 sheet＋導航；卡片／地圖切換仍在。
7. SSR 全量地點可索引行為不回歸。
