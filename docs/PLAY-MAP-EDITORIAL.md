# 親子遊樂地圖 — Editorial 規範

> canonical 路徑：`/for-parents/play-map`  
> 資料 sidecar：`data/playgrounds.ts`  
> 與虛構「宇宙地圖」（`/adventures`）完全分離，不得共用命名或資料來源。

## 目的

提供家長可長期維運的**真實世界親子景點** editorial 地圖：合法來源、可驗證、可分批覆蓋全台；**不以**自動爬取社群或論壇為資料管道。

## 收錄邊界（CRITICAL-2 B）

### 收

- 公園、遊具場、親子友善綠地
- 博物館、科學館、農場、親子體驗農場
- **審核過的商業室內樂園、觀光工廠**等明確親子取向場館（以 `type`／`tags` 區隔，例如 `室內樂園`、`觀光工廠`）
- 具固定親子設施、可獨立規劃半日行程的場域

### 不收

- 一般餐廳、咖啡廳、商場（除非**本身即明確親子景點**，例如以親子遊樂設施為主打的專屬場域，且經 editorial 審核）
- 僅有兒童餐或偶發活動、無固定親子設施的店家
- 未經審核的社群貼文、論壇爆料、UGC 候選

### 商業場館特別規則

審核過的商業室內樂園／觀光工廠可收錄，但維護成本較高：

- 必填 `officialUrl`（官網或官方購票頁）
- `tips` 與 UI 固定提示：**「票價與營業時間易變動，出發前請以官網為準。」**
- `lastVerified` 週期較公園／免費場域更短；過期須優先複核

## 資料來源與禁止事項

| 來源類型 | 角色 | 可否進 repo |
|----------|------|-------------|
| IG／Threads／PTT／論壇／Facebook 社團 | **僅候選**（人工初篩後另找官方來源） | **禁止** |
| 官方網站、公部門開放資料、場館官網 | 主要依據 | 允許（寫入 `sources[]`） |
| Google Maps／付費 Places API | Wave 0 不用 | 禁止自動匯入 |
| 自動爬蟲（含 headless、RSS 聚合） | — | **禁止** |

社群內容僅作 editorial 研究筆記，**不得**以貼文 URL、截圖或未驗證座標直接寫入 `data/playgrounds.ts`。

## 必填欄位與 provenance

每筆收錄至少具備：

| 欄位 | 說明 |
|------|------|
| `id` | 穩定 slug，不重複 |
| `name`、`city`、`lat`、`lng`、`address` | 基本定位 |
| `type` | 場館家族（`PlaygroundType`）；與 `indoor` 獨立，勿混用 |
| `ageRange`、`free`、`indoor` | 家長篩選；`indoor` 表物理室內條件（雨天備案），非 type 別名 |
| `sources[]` | 公開可點的依據 URL（官網、縣市政府、觀光局等） |
| `lastVerified` | ISO 日期（`YYYY-MM-DD`），最後人工複核日 |

`officialUrl` 對商業場館為必填；公園等免費場域建議填縣市開放資料或管理單位頁面。

## 分類契約（type 與 indoor）

- **`type`**：場館家族，供類型 chip 篩選；合法值：`公園`、`室內樂園`、`主題樂園`、`博物館`、`農場`、`其他`
- **`indoor`**：物理上是否以室內為主（雨天備案）；與 `type` **獨立**
- **主題樂園**：戶外或混合式主題／遊樂園（如六福村、兒童新樂園）；通常 `indoor: false`
- **室內樂園**：以室內遊樂設施為主的商業場館（如卡司蒂樂園）；須 `indoor: true`
- **Invariant**：`type` 字串含「室內」者必須 `indoor: true`；每個 `PlaygroundType` 至少一筆資料
- **`tags`** 可保留「室內放電」等描述性標籤；**不得**再作為 `type` 值

## 分級覆蓋門檻（Wave 1+）

以**縣市**為單位追蹤覆蓋；達標後可在 UI 標示該縣「已覆蓋」或「部分覆蓋」。

| 分級 | 定義 | 覆蓋門檻 |
|------|------|----------|
| **Tier A** | 六都＋新竹縣市 | ≥ 8 筆有效收錄 |
| **Tier B** | 其他縣市（非離島） | ≥ 5 筆 |
| **Tier C** | 離島、人口較少縣市 | ≥ 3 筆，或標示 **partial**（≥1 筆且 editorial 認定已足供起步） |

未達門檻的縣市：地圖可顯示「涵蓋建置中」，不捏造 filler 點位。

## 覆蓋 ledger 概念

`coverage ledger` 為 editorial 追蹤表（可放 issue／試算表／後續 `data/playground-coverage.ts`，Wave 0 先以文件＋ TODOS 登記），每列一縣市：

- `tier`（A／B／C）
- `count`（repo 內有效筆數）
- `status`（`none`／`partial`／`met`）
- `lastWave`（最近一次資料波次，如 `wave-0`、`wave-1`）
- `notes`（缺什麼類型、待複核場館）

ledger **不**進使用者-facing UI 細節；PlayMap 僅顯示摘要狀態（由 `coverageHeadline()` 產生，例如「已收錄 11 縣市、共 73 處」）。

### 波次對照（摘要）

| 波次 | 縣市 | 狀態 |
|------|------|------|
| Wave 1 | 台北市、新北市、基隆市、桃園市 | 達標 |
| Wave 2 | 新竹市、新竹縣、苗栗縣、台中市、彰化縣、南投縣、雲林縣 | 達標 |
| Wave 3+ | 嘉義以南西台灣／宜花東／離島 | 待擴充 |

## 發現路徑（CRITICAL-R A）

| 裝置 | 行為 |
|------|------|
| **桌面 Top bar** | 主列含「親子景點」→ `/for-parents/play-map`（路徑不另開 `/play-map`） |
| **行動抽屜 · 家長組** | 「📍 親子景點」→ `/for-parents/play-map` |
| **桌面輔助** | `/for-parents` 工具卡仍可進景點地圖 |

## UI 與 DESIGN 對齊

- 導覽稱「**親子景點**」；頁內 H1「**親子遊樂地圖**」（工具頂列，非行銷 hero）
- 「宇宙地圖」僅指 `/adventures`，三者不互換
- 瀏覽模式互斥：**卡片**（預設目錄）｜**地圖**（Leaflet／OSM）；桌面亦不並陳雙面板
- 篩選面：縣市 chip、類型 chip、室內／免費；詳情 Sheet 來源預設收合
- 地圖／儀表板工具頁寬度上限 1100px（豁免一般 640px 單欄）
- 真實地圖 chrome 可用 `--map-chip*`；OSM tile **禁止** invert（含夜間主題）

## Editorial SOP（新增／更新一筆）

1. 從官方或公部門來源確認名稱、地址、座標、適齡、收費、營業時間
2. 若僅有社群候選 → 找到官網或政府頁面後才可寫入
3. 商業場館：填 `officialUrl`，`tips` 加票價／營業易變提示
4. 寫入 `sources[]` 與當日 `lastVerified`
5. 更新該縣 coverage ledger 計數
6. `npm test -- data/playgrounds.test.ts` 通過後合併

## 相關文件

- 視覺與命名：[DESIGN.md](../DESIGN.md)
- 資料型別：`data/playgrounds.ts`
- 家長端其他資料：[FOR-PARENTS-DATA.md](./FOR-PARENTS-DATA.md)
