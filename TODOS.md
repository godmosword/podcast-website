# TODOS

> **成長主戰場（2026-06 共識）：** **A** Spotify／Apple 平台收聽與訂閱 · **B** Threads／IG 短內容導流。
> 官網定位：每集可分享的落地頁 + 訂閱轉換中心；「看圖聽故事」為差異化體驗，不與平台搶完整收聽。
>
> **產品主戰場（2026-06 STEM roadmap）：** 互動故事 × 車車 STEM 實驗室；詳見 [產品路線圖](#產品路線圖互動--stem--商業)。

> 格式：每項一段，行末標 `優先序 · 工時(人工) · 依賴`。工時 S/M/L。
> **紀律：** 條目打 ✅ 時必須附 commit hash。
> **資料基準（2026-07-11）：** `storiesByNewest()` **18 集**、最新 **`ep-18`**；`data/games.ts` 四款見下表。
>
> **現役遊戲（canon，對齊 `data/games.ts`）：** `candy-match` 繽紛消消樂 · `car-adventure` 車車大冒險 · `block-drop` 繽紛樂園 · `candy-kart` 繽紛卡丁車。
> **歷史 slug：** `kart`／`pirate-kart`／`car-star`／`car-mission` 已退役，見 [archive](./docs/archive/TODOS-completed-2026-07-11.md)。

---

## 現役隊列（2026-07-11）

> 單一執行優先序；詳情連結各章。Growth-P1a/b、LIST-2、MAP-UX-P1 已於本日收尾。

| # | ID | 類型 | 工時 | 狀態 |
|---|-----|------|------|------|
| 1 | [UX-P0-1](#兒童-ux-與親子互動稽核2026-07-11) 家長閘門 | trust | M | 待做（待決策） |
| 2 | [UX-P1-5](#兒童-ux-與親子互動稽核2026-07-11) 全站 e2e | eng | S | 部分完成 |
| 3 | [UX-P0-4](#兒童-ux-與親子互動稽核2026-07-11) challenge 遊戲提示 | trust | S | ✅ `1c1ca1b` |
| 4 | [Growth-Measure-1](#growth-measure-1-成長量測) SoundOn 回鏈 | ops/growth | S | ✅ `42a9d38` |
| 5 | [UX-P1-2](#兒童-ux-與親子互動稽核2026-07-11) 詳情頁反思收合 | ux | S | ✅ `42a9d38` |

### 本輪已完成（2026-07-11）

| ID | Commit |
|----|--------|
| UX-P0-2／UX-P0-3 | `964f418` |
| MAP-UX-P1a/b/c、P2a、MAP-ROAM-doc | `80457c4` |
| Growth-P1a／P1b | `eafe30a` |
| Growth-Measure-1a 模板、1b UTM | `6ca8263`、`797de82` |
| LIST-2 email 訂閱 | `6ca8263` |

### 待決策隊列（不進 Top 5）

- **UX-P0-1** 家長閘門範圍（dashboard only vs 含 GameKit）
- **UX-P0-4** challenge 遊戲提示：~~僅文案 vs 隱藏入口~~ → **已採僅文案**（challenge 卡顯示家長陪同提示，不隱藏入口）

### 封存索引

- GEO／地圖完成大段 → [docs/archive/TODOS-completed-2026-07-11.md](./docs/archive/TODOS-completed-2026-07-11.md)
- 2026-07-04 前完成項 → [docs/archive/TODOS-completed-2026-07-04.md](./docs/archive/TODOS-completed-2026-07-04.md)

---

## GEO（已完成 → 已封存）

> 全文見 [docs/archive/TODOS-completed-2026-07-11.md](./docs/archive/TODOS-completed-2026-07-11.md#geo-實作計畫--第二階段)。上線後人工檢查：[docs/geo-checklist.md](./docs/geo-checklist.md)。

---

## 名單收集 × 內容再利用（2026-07-03 品牌盤點）

> **Gate：** 本段經人工確認後才開始改 code。每個 Task 完成後單獨 commit，訊息格式 `brand: task-N <描述>`，hash 回填本段。
> **背景：** 品牌盤點結論——最大缺口是「自有名單」（聽眾全在第三方平台）與「內容只用一次」。完整計劃見 plan 檔（podcaster-humble-yeti）。
> **與既有條目關係：** LIST-2 取代「延後」表的「Email 電子報」條目（僅收名單、不寄信，ESP 之後再議）；REUSE-2 與 P2「家長共讀指引（`parentGuide`）」為**同一任務**（勿另建 `parentNote`）；逐字稿可索引已完成（`029b7e6`），REUSE-2 不重做。
> **紅線：** 不動宇宙地圖與 landing 動畫系統、不改既有 URL、不升降依賴版本。

| Task | 狀態 | 主要產出 | 預計影響檔案 | 驗證 | Commit hash |
|------|------|----------|--------------|------|-------------|
| LIST-1 LINE OA CTA | BLOCKED：等 LINE OA | env-gated LINE 加好友 CTA（`NEXT_PUBLIC_LINE_OA_URL` 未設即隱藏，沿用 `visibleSocials()` 空字串隱藏模式）；掛頁尾／單集頁 `SubscriptionCTA` 旁／landing／`/subscribe` | Modify: `lib/social.ts`（`SocialIcon` 加 `"line"`）、`lib/connect-icons.tsx`、`components/SiteFooter.tsx`、`app/story/[slug]/page.tsx`; Create: `components/LineCTA.tsx` | 設/不設 env 切換顯隱；`npm test` + `npm run build` | — |
| LIST-2 新集通知 email 訂閱 | ✅ `6ca8263` | 複製 zone-wish 技術棧（zod + rate limit + Neon + DB 未設降級）；`subscribers` 表 `lower(email)` unique + `ON CONFLICT DO NOTHING`（冪等、防枚舉）；簡單收集 + 隱私說明（「僅用於新集數通知」），不做 double opt-in；`/legal#privacy` 已涵蓋 analytics／localStorage（`a844f20`），實作時同步掛 privacy link | Create: `scripts/migrations/003_subscribers.sql`、`lib/subscribe-schema.ts`、`lib/subscribe-db.ts`、`app/api/subscribe/route.ts`、`components/SubscribeForm.tsx`、`app/subscribe/page.tsx`（範本：`app/api/zone-wish/route.ts`、`ZoneWishForm.tsx`） | curl：無 `DATABASE_URL` 降級、POST 201、重複 email 201、429 rate limit；`npm test` + `npm run build` | `6ca8263` |
| LIST-3 分析事件 | 部分完成 | `trackSubscribeSubmit(source)` ✅ `6ca8263`；`trackLineCtaClick` 待 LIST-1 | Modify: `lib/analytics.ts` | 本機點擊確認事件發送 | — |
| REUSE-1 校對字幕採用檢查 | 完成 | 確認字幕正文在 `data/subtitles/<slug>.json`、校對標記在 `_proofread/`；`verify:episodes` 全過 | `npm run verify:episodes` passed；見 `docs/metrics/GEO-baseline-2026-07-10.md` | `dbfe7b3` |
| REUSE-2 家長共讀指引呈現（= P2 `parentGuide`） | 完成 | `data/parent-guides.ts` + `ShowNotes` 收合區（ep-1、ep-5 試點）；`enrichStory` 合併 | `data/parent-guides.test.ts` + `npm test` + `npm run build` | `dbfe7b3` |
| REUSE-3 YouTube 整集影片匯出 | 完成 `d9a00fd`（fix 至 `1365fc2`） | 本機 CLI `npm run export:video -- <slug>`：1920×1080 整集 mp4；`data/scenes` 換頁 + `data/subtitles` 原始逐句 ASS burn-in（`jf-openhuninn-2.1`）；`export/video/<slug>/` + manifest（gitignore）；9:16 Shorts 留二期 | Create: `scripts/lib/export-video-core.ts`、`scripts/export-video-assets.ts`、`docs/VIDEO-EXPORT.md`; Modify: `package.json`、`.gitignore` | `export:video -- ep-17`（ep-17 7:15 mp4 驗證）；`npm test -- export-video-core` | `1365fc2` |

### 待使用者提供（不擋開發）

- LINE 官方帳號加好友網址 → Vercel env `NEXT_PUBLIC_LINE_OA_URL`（需先自行建立 LINE OA）
- `DATABASE_URL` 沿用 zone-wish 既有 Neon，同庫加表即可

### Task DAG

1. REUSE-3 已完成（整集 16:9）；REUSE-1 仍待確認。
2. LIST-2 原本等隱私頁；本機驗證 `/legal#privacy` 已由 `a844f20` 上線，改為可開工，但表單旁仍須放明確隱私句與 privacy link。
3. LIST-1 等 LINE OA URL；LIST-3 等 LIST-1／LIST-2 的實際掛點。
4. REUSE-2 先完成 `familyActivity`／`parentGuide` 邊界定義，避免與 HOOKS-1 重疊。

---

## 週報 W27 提案（2026-07-04，詳見 [proposals/2026-W27.md](./proposals/2026-W27.md)）

> 首份週報產出，訊號驅動（/for-parents 實測、heuristics 掃描、TODOS 停滯項）。決策記錄請填 proposals 檔底部。

### W27-1 清除 /for-parents 全部「[待確認]」佔位文案　`content · S · 無`　〔review+geo〕 ✅ `dbfe7b3`
集數／角色／車種直出資料層；適合年齡「約 3–7 歲」、同步「每 15 分鐘檢查 Apple Podcast RSS」定稿。驗收：`lib/for-parents.test.ts` 無「待確認」；部署後 prod grep=0。

### ~~W27-2 許願表單補隱私說明句 + footer 觸控目標~~　`trust · S · 無`　〔review+a11y〕 ✅ `964f418`
**併入 [兒童 UX 稽核 UX-P0-2／UX-P0-3](#兒童-ux-與親子互動稽核2026-07-11)**（2026-07-11 `/agent-plan`）。`ZoneWishForm` 家長向隱私句 + 故事 placeholder；footer「節目數據」「使用條款」≥44px。

### ~~W27-3 森林小島 magenta 暈圈修復~~　`asset · S · 無`　〔review+design〕 ✅
= 下方既有條目「森林小島底部洋紅色暈圈」，W27 週報將其提升優先。`c33ebb3` `ea49200`

---

## 兒童 UX 與親子互動稽核（2026-07-11）

> **Gate：** `/agent-plan` 稽核；Approved Plan：[`/tmp/agent-plan-1783699379.md`](/tmp/agent-plan-1783699379.md)。**紅線：** 不更動主架構與版面（Landing scroll-snap、地圖骨架、故事詳情 grid、路由、zone 座標／art-tile 契約）。
> **總判斷：** 兒童主路徑 **B+**、親子互動 **B**、家長信任 **A-**。播放／地圖 disclosure／`kidsMode` 已達基線；缺口為 **信任 polish + 觸控補強 + 共讀內容覆蓋**（不需架構手術）。
> **與既有條目：** W27-2 → UX-P0-2／UX-P0-3；STEM-P3 家長閘門 → UX-P0-1；STEM-P3 共讀指引擴充 → UX-P1-3（REUSE-2 試點已完成）；footer 觸控（小項 polish）→ UX-P0-2。

### 稽核結論（保留，實作時勿改壞；對齊 [DESIGN.md](./DESIGN.md) 觸控／reduced-motion／viewport）

- **StoryPlayer**：主控制 60–68px、字幕三檔、睡前定時、結尾反思需點「想聊一下」才展開
- **ZoneSheet**：許願／信任收「給爸爸媽媽」；故事卡 ≥64px；close／wishToggle ≥44px（MAP-UX-P1a）；sheet 開時 overlay 擋 pan（MAP-UX-P1b）
- **遊戲**：繽紛消消樂 `explore` 無分數計時；GameKit `kidsMode` 預設 true
- **刻意不做：** 獨立逐字稿頁（新頁型）、故事詳情大改版面、tap-to-explore（已移除）

| ID | 優先 | 狀態 | 摘要 | 主要檔案 | 驗證 |
|----|------|------|------|----------|------|
| UX-P0-1 | P0 | 待做 | **家長閘門**：進 `/for-parents/dashboard`（或切兒童模式）前簡單算術題；session 通過後放行 | 新 `ParentGate.tsx`；`dashboard/page.tsx` | 手動 375px；`npm test` |
| UX-P0-2 | P0 | ✅ `964f418` | **Footer 觸控 ≥44px**（= W27-2 後半） | `SiteFooter.module.css` | CSS 契約 + 手動 |
| UX-P0-3 | P0 | ✅ `964f418` | **許願隱私一句話**（= W27-2 前半）：送出鈕下 inline 說明、message placeholder 勿含個資 | `ZoneWishForm.tsx` | vitest |
| UX-P0-4 | P0 | ✅ `1c1ca1b` | **Challenge 遊戲家長提示**：列表卡加「建議 6 歲以上 · 家長陪同」（僅文案，不隱藏入口） | `data/games.ts`、`app/games/page.tsx` | `npm test` + build ✅ |
| UX-P1-1 | P1 | 部分完成 | **補齊 &lt;44px 按鈕**（只改 CSS）：~~ZoneSheet 關閉／wishToggle~~ → MAP-UX-P1a；StoryPlayer 定時、Landing 箭頭待做 | 各 `*.module.css` | 手動＋e2e |
| UX-P1-2 | P1 | ✅ `42a9d38` | **詳情頁反思收合**：比照 `StoryEndScreen`，家長句不預設露出 | `StoryDetailReflection.tsx`、`app/story/[slug]/page.tsx` | `npm test` |
| UX-P1-3 | P1 | 待做 | **共讀 sidecar 擴至全集**：`parent-guides`／`family-activities` 從 ep-1/ep-5 擴充（內容營運，可分批） | `data/parent-guides.ts`、`data/family-activities.ts` | 同名 `*.test.ts` |
| UX-P1-4 | P1 | 待做 | **播放進度條拇指加大**（CSS 變數，不動控制列 layout） | `StoryPlayer.module.css` | 手動播放頁 |
| UX-P1-5 | P1 | 部分完成 | **e2e 兒童 UX 回歸**：`/adventures` a11y + 地圖觸控 e2e ✅（MAP-UX-P1c）；`/for-parents`、播放頁待補 | `e2e/a11y.spec.ts`、`e2e/universe-map.spec.ts` | `npm run test:e2e` |
| UX-P2-1 | P2 | 待做 | 方塊／卡丁車接 `kidsMode` 或標「挑戰模式」 | `BlockDropGame.tsx`、遊戲 hub | test + 手動 |
| UX-P2-2 | P2 | 待做 | 儀表板「最佳分數」改低壓文案（「探索紀錄」等） | `ParentDashboard.tsx` | 手動 |
| UX-P2-3 | P2 | 待做 | 遊戲頁年齡標示一致（metadata vs chip） | `app/games/page.tsx` | build |
| UX-P2-4 | P2 | 待做 | Dudu 鍵盤可及（內層 `tabIndex={0}`） | `DuduCompanion.tsx` | a11y |
| UX-P2-5 | P2 | 待做 | `reflectionShown` 加 `source: detail \| end-screen` 精準量測 | `progress-store.ts`、`ReflectionPrompt.tsx` | test |

### Task DAG（建議 `/agent-action` 順序）

1. ~~**UX-P0-2 + UX-P0-3**~~ ✅ `964f418`（W27-2）→ ~~**MAP-UX-P1a/b/c／P2a**~~ ✅ `80457c4` → **UX-P1-5**（全站 e2e）
2. **UX-P0-1** 可並行（新元件，需使用者決策：是否含 GameKit 兒童模式開關）
3. **UX-P1-1**（ZoneSheet 部分併入 MAP-UX-P1a）、P1-2、P1-4 CSS／元件微調
4. **UX-P1-3** 內容分批，不擋工程項
5. **UX-P2-\*** 擇機

### 宇宙地圖 UX（2026-07-11，`/tmp/agent-plan-1783730484.md`）

> 五維稽核見 [docs/UNIVERSE-MAP-UX-AUDIT-2026-07-11.md](./docs/UNIVERSE-MAP-UX-AUDIT-2026-07-11.md)。**紅線：** 不動 `useMapCamera`／`ZoneSheet` 核心、zones 座標、art-tile。

| ID | 優先 | 狀態 | 摘要 | 主要檔案 | 驗證 |
|----|------|------|------|----------|------|
| MAP-UX-P1a | P1 | ✅ `80457c4` | close／wishToggle ≥44px | `ZoneSheet.module.css` | CSS 契約測 + e2e |
| MAP-UX-P1b | P1 | ✅ `80457c4` | sheet 開時 overlay 擋地圖手勢 + `min(72vh,34rem)` | `ZoneSheet.module.css` | e2e 拖曳／backdrop |
| MAP-UX-P1c | P1 | ✅ `80457c4` | a11y `/adventures` + 開 sheet axe + 觸控 assertion | `e2e/a11y.spec.ts`、`e2e/universe-map.spec.ts` | `test:e2e` 24 綠 |
| MAP-UX-P2a | P2 | ✅ `80457c4` | reduced-motion 點島即開 sheet | `e2e/universe-map.spec.ts` | `test:e2e` |
| MAP-ROAM-doc | ops | ✅ `80457c4` | archive「待 commit」→ `3166cc5`／`503ad8b` 對帳 | `docs/archive/…` | 文件 only |

### 待使用者決策（實作前）

1. **家長閘門範圍**：僅 dashboard，或含 GameKit「兒童模式」開關？
2. **UX-P1-3 節奏**：一次寫完全集，或每週 3 集？
3. ~~**UX-P0-4**：僅文案提示 vs 對幼兒隱藏 challenge 入口~~ → **已採僅文案**（`gameParentTip` + 列表卡）

---
## 成長量測（Growth-Measure-1）

> 合併原「成長量測缺口」兩條 + Analytics 後續；對齊現役隊列 #4。

### Growth-Measure-1a 平台後台基線記錄　`growth-measurement · S · 無`　〔growth〕 ✅ `6ca8263`（模板）
每週記錄 Spotify／Apple／YouTube／SoundOn 後台基線（訂閱、播放、完播、來源）；截圖或 CSV 存 `docs/metrics/`（不 commit 個資）。見 `docs/metrics/README.md`。

### Growth-Measure-1b UTM 歸因規格　`growth-measurement · S · 平台外連`　〔growth+eng〕 ✅ `797de82`
`utm_source=cheche_web`、`utm_medium=story_page|footer|subscribe_cta|social`、`utm_campaign=<slug|site>`；實作於 `lib/platform-utm.ts`／`TrackedPlatformLink`／`ConnectHub`／`SubscribeMenu`。

### SoundOn show notes 回鏈　`growth · S · sync 管線`　〔growth+ops〕 ✅ `42a9d38`
`lib/soundon-backlink.ts` + `docs/metrics/README.md`／`docs/EPISODE-WORKFLOW.md` 營運步驟；SoundOn 後台手動貼入（sync 管線不寫入）。

---

## 設計待辦（現役 polish）

> 已完成地圖／設計審查見 [archive](./docs/archive/TODOS-completed-2026-07-11.md)。對齊 [DESIGN.md](./DESIGN.md)。

### Landing 無 `<h1>`　`design · S · 無`　〔seo+a11y〕
首頁 headings 從 h2 開始（四段 segment 標題）；第一段標題可升級 h1 或另加 sr-only h1。`components/landing/LandingSegment.tsx`。

### 小項（polish）
- ~~鎖定島 sheet「🔔」emoji 圖示與全站 SVG 語彙不一致，改 inline SVG 鈴鐺。~~〔design〕 ✅ `4350ce2`
- ~~鎖島「看看」pill 預設縮放下被島名木牌完全遮住（功能隱形，正式站既有）；併入木牌欄第三行（島名→狀態→看看），繼承反縮放與 label 層深。~~〔design〕 ✅ `8f35732`
- StatusOverlay 對 planned/coming 維持現狀裁決：coming 用島體濾鏡、planned 留白皆正確，方形 overlay 會在透明島邊對海面露框；planned 專屬美術（霧基＋「?」浮標）仍屬凍結資產項。〔design〕（已裁決不做 CSS 折衷）
- 單集頁車種 chip 顯示「其他」= 資料 fallback 外洩到 UI；無車種時隱藏 chip。〔content+eng〕
- ~~footer「節目數據」「使用條款」觸控高度 20px（<44px）~~ ✅ `964f418`（UX-P0-2）。〔a11y〕
- ~~landing hero jpg（~300KB/張）可轉 WebP 降首屏灰底時間~~ ✅ 併入 D1（`optimize:lcp-images`；首頁 LCP `segment-stories*` AVIF 約 73–79KB）。〔perf〕
- ~~`app/characters/page.module.css` 自成一套 slate/teal 色系（13 個硬編 hex、無 token、不支援夜間模式），與 DESIGN.md 色票脫鉤；建議改 `var(--token, #fallback)` 慣例（參照 `components/landing/*`）。~~ ✅ 併入 D3。〔design+eng〕


---

## 視覺化升級（2026-07-11 審核通過）

> 來源：`/agent-plan` 視覺升級委員會（leader + Codex gpt-5.5 工程審）→ **2026-07-11 使用者＋程式庫對帳審核通過**（Conditional Approve）。完整初稿見 plan 檔（agile-stirring-kernighan）。
> **與現役隊列關係：** 本段為**並行軌 B（視覺）**，不取代檔首信任／成長 Top 5（並行軌 A）。交集：D14↔UX-P1-1 觸控、D9↔UX-P2-4 Dudu 鍵盤。
> **分層：** L0 治理地基 → L1 核心體驗地基 → L2 高價值體驗 → L3 系統化回饋 → L4 品牌亮點（對應工程 P1→P3）。
> **建議執行順序：** D0 → D2（smoke baseline 先）→ 修正版 D1 → D13 剩餘 → D3 → D14 → D6 ∥ D12 → L2 其餘 → L3 → L4。
> **驗證矩陣：** `npm test` + `npm run build` + `test:e2e`（axe 零新增 critical/serious）+（D2 落地後）`test:visual` diff；視覺類不進 `npm run check`。新動效僅 transform/opacity（含 stroke-dashoffset），一律 `prefers-reduced-motion` + visibility pause。
> **紅線：** 宇宙地圖場景固定淺色、不反轉海圖／島 tile；不動 `useMapCamera`／ZoneSheet 核心、landing scroll-snap 骨架；D12 不碰播放／地圖 runtime（OG 動態 route 或 build-time 產圖除外）。

### 狀態圖例

| 標記 | 意義 |
|------|------|
| 待實作 | 審核通過，可 `/agent-action D<n>` |
| 部分完成 | 既有能力已具備，本項只補缺口 |
| spike | 驗證通過才擴大 |

---

### L0 治理地基

#### D0 資產治理　`eng · S · 無`　〔perf+ops〕 ✅ `1c1ca1b`
`scripts/audit-assets.ts`：**四類 taxonomy**——(1) 部署資產（git tracked）(2) staging／gitignore（如 `.illustrate-staging`）(3) 動態推導引用（`storyCoverPath`、`getZoneArtSrcSet` 等）(4) 孤兒資產。不可只 grep 靜態字串路徑。
**基線數字（2026-07-11 量測）：** tracked JPG **358**（其中故事插圖 **319**）；ignored staging **262**。單檔大小上限 + PR 新增大 jpg 警示。先量再改。
**落地：** `npm run audit:assets`（`--strict` 阻擋超大 JPG）；核心 `scripts/lib/audit-assets-core.ts` + vitest。

#### D2 視覺回歸安全網　`eng · M · 無`　〔eng+design〕**Phase A** ✅ `1c1ca1b`　**Phase B** ✅ `42a9d38`
現況：`playwright.config.ts` 僅 **Desktop Chromium**（無 mobile project）。目標：`e2e/visual.spec.ts` + `toHaveScreenshot`——8 主頁 × 390/1280 × light/night ＝ **32 組**完整矩陣。
**分階：** Phase A **smoke baseline**（5 條黃金路徑 × 1280 light）✅ `e2e/visual.spec.ts` + `npm run test:visual`；Phase B **32 組**（8 主頁 × 390/1280 × light/night）✅ `42a9d38`。前置：字型固定、動畫 freeze、localStorage／theme 固定、等 image decode、寬鬆 `maxDiffPixelRatio`；字型渲染穩定性併入。不進 CI gate；視覺類 agent-action **必跑**回貼 diff。

---

### L1 核心體驗地基

> 原名「效能地基」不準確：本層含夜間、字幕、圖示，非純 perf。

#### D1 圖像管線現代化（修正版・雙軌 LCP）　`perf · M · D0`　〔perf〕 ✅ `d42fae1`
**雙軌 LCP（勿再把 `hero-home.jpg` 當首頁 LCP）：**
- **(a) 首頁 `/`：** `segment-stories*.jpg`／portrait，原生 `<picture>` + 預生成 WebP/AVIF（`LandingSegment`、`lib/modern-image-src.ts`）；`npm run optimize:lcp-images`
- **(b) 內頁 header：** `SiteHeader` `hero-home` 同管線 `<picture>` + WebP/AVIF
- **(c) Next `Image`：** `next.config.ts` `images.formats` AVIF；`StoryImage` + `data/story-image-blurs.json` blur-up（`npm run generate:story-blurs`）
- ~~landing hero jpg 小項~~ 併入本項

#### D14 圖示與控制一致性　`design · S–M · 無`　〔design+a11y〕 ✅ `50f3885`
**落地：** `components/ui/Icon` + `IconButton`（≥44px、hover／active／focus-visible）；`data/icons.ts` 名稱契約。替換 StoryCard／PlayButton／games hub `▶`、SiteNavBar 漢堡、ZoneSheet／StoryPlayer 關閉、GameChrome 暫停／音量／設定、ZoneWishForm 鈴鐺。保留鍵盤 `←` `→`、GameChrome 🎡 等童趣 emoji。

#### D3 Night 主題全站打磨　`design · M · 無`　〔design〕 ✅ `50f3885`
**落地：** `globals.css` 頁級暖色 token（`--page-warm-*`、`--warm-surface`、`--warm-card-glow` 等）；`characters`／`for-parents`／dashboard 硬編 hex 全改 token；stories／詳情／games hub 夜間暖燈卡片；`SiteFooter` support CTA token 化。`npm run audit:colors` + `scripts/lib/hardcoded-color-audit.ts`（`--strict-d3` gate D3 驗收頁）。地圖海圖仍固定淺色不反轉。

#### D13 字幕閱讀排版（剩餘）　`ux · S–M · 無`　〔ux+content〕 ✅ `d42fae1`
**已有（勿重做）：** 三段 `captionSize`、對比遮罩（`.caption` blur 底）、行高／字級階梯、句級 `{t,text}` 切換（`data/subtitles/*.json`）。
**本輪 ✅：** `lib/subtitle-cue.ts` 前／當前／後一句 + `StoryCaptionStack` cue 過渡；即時字幕軌與翻頁 `captions`／`captionTimes` 對齊（`resolveCaptionStackState`）。`prefers-reduced-motion` 關閉動畫。
**另開 spike（非本輪 M）：** 逐字卡拉 OK——需 word-level timestamps／VTT 擴充，工作量 **L**，單獨 ticket。

---

### L2 高價值體驗

#### D6 播放器沉浸升級　`ux · M · D2+D13`　〔ux〕 ✅ `76f91c1`
**落地：** `story.color` ambient 漸層底（`--ambient`）；Ken Burns 僅 `isPlaying` + 分頁可見 + 非 reduced-motion（`lib/player-stage.ts`）；夜間振幅／亮度降檔（`.playerNight`）。播放器狀態契約不動。

#### D12 分享卡（OG image）升級　`growth · S · 無`　〔design+growth〕 ✅ `76f91c1`
**落地：** `app/story/[slug]/opengraph-image.tsx` + `lib/story-og.tsx`（1200×630、Noto Sans TC TTF、黏土相框＋EP＋角色＋品牌條）；`story-metadata` 改指向動態 OG；`trackShareClick`（copy_link／line）+ `ShareButton.storySlug`。

#### D10 圖鑑「已認識」狀態　`ux · S · D3`　〔ux+design〕 ✅ `3ac73a3`
**落地：** `lib/character-recognition.ts`（`storiesCompleted` ∩ `appearsIn` 或 `unlocks.characters`）；`hooks/useRecognizedCharacters.ts`（SSR 空集合 → mount 讀 store）；`CharacterCatalogGrid`／`CharacterCard` 統一定裝照相框＋已認識／待認識貼紙、`aria-label` 含狀態。3D tilt 仍列 **L4 D10-tilt**。

#### D4 View Transitions（spike）　`ux · S(spike) 可能升至 M · D2`　〔eng+ux〕 ✅ `3ac73a3`＋`42a9d38`（e2e 導覽；手動 morph 矩陣待勾）
**落地：** `experimental.viewTransition`（Next 15.5.20+）+ `StoryCoverMorph`（`unstable_ViewTransition`）故事卡封面↔詳情 hero；`sharedCoverMorph` 防同頁重複 slug；`app/view-transitions.css` + reduced-motion。手動矩陣見 `docs/D4-VIEW-TRANSITIONS-SPIKE.md`。未啟用 `Link transitionTypes`（待 Next 16+ 評估）。

#### D5 Scroll-driven 進場（CSS-only）　`ux · S · D2`　〔ux〕 ✅ `bed866e`
**落地：** `app/scroll-driven.css`（`@supports (animation-timeline: view())` 才啟用 `.scrollEnter`；預設靜態可見）；`StoryCard`／games hub 改 scroll 進場並關閉支援內 `popIn` 雙跳；`LandingSegment` 標題／CTA 錯落 `scrollEnterStagger1–3`；`prefers-reduced-motion` 關閉。

---

### L3 系統化回饋

#### D8 慶祝回饋（縮小範圍）　`ux · M · 無`　〔ux〕 ✅ `bed866e`
**落地：** `data/celebration.ts` 事件語意＋強度檔；`lib/celebration.ts` 冷卻／合併／burst 預算；`StarBurst`＋`useCelebrationBurst` DOM adapter；`lib/celebration-iframe.ts` postMessage 契約。接線：FavoriteButton、ZoneIsland、CandyKart finish。

#### D9 嘟嘟微互動（重構）　`brand · S–M · 無`　〔brand+ux〕 ✅ `bed866e`
**落地：** `data/dudu-emotions.ts`；`DuduSprite` primitive＋`DuduMoment` wrapper（inline／badge／companion）；`DuduCompanion` 重構（`tabIndex` 可聚焦）；擴 404、GameLoadOverlay 載入、StoryEndScreen 完播。

---

### L4 品牌亮點

#### D11 時間感知首頁　`brand · S · D3+D2`　〔brand〕 ✅ `bed866e`
**落地：** `lib/bedtime.ts`（19:00–06:00）；`THEME_INIT_SCRIPT`＋`ThemeProvider` 同步 `data-bedtime`（`light` 優先）；`LandingBedtimeLayer` CSS 疊層夜色＋重用 `moon.png`（不換 hero）。

#### D7 手繪體驗深化　`design · M · D2`　〔design〕 ✅ `bed866e`
**落地：** `Doodle` `draw` prop（`stroke-dashoffset` 描邊進場）；`RoughFrame` `shiftFilter`（`#rough-1/2/3` 輪替）；`LatestHero`／games header 首屏 `draw`；`decor.module.css.test.ts` 契約。

#### D10 圖鑑 3D tilt（可選 polish）　`ux · S · D10 貼紙上線後`　〔ux〕 ✅ `42a9d38`
手機價值低；列為可選。依賴 D10 貼紙狀態已穩定。

---

### 執行順序（審核定稿）

```
D0 → D2-A(smoke) → D1 → D13-剩餘 → D3 → D14 → D6 ∥ D12
  → D10-貼紙 → D4(spike) → D5 → D8 → D9 → D11 → D7 → D10-tilt?
```

通過單項後以 `/agent-action D<n>` 實作；完成附 commit hash 回填本段。

---

## 產品路線圖（互動 + STEM + 商業）

> 依據：兒童數位產品研究共識（Thinkrolls／DragonBox／Khan Kids／Sago Mini 等）、台灣市場（《顛覆！故事 STEAM》、Firstory 付費成長、叮噹家族 VIP 月 99／年 999）、競品拆解（[RESEARCH.md — Hey Clay](./RESEARCH.md#2026-06-09hey-clay-app-架構拆解與適用性評估)）、以及本站現況（Next.js SSG、逐字字幕、4 款小遊戲、private 素材庫）。

### 三個貫穿原則

1. **不要做成「作業」，要做成「玩」** — 益智與適性任務包裝成遊戲；車車主題是優勢，別把 STEM 變講課。
2. **學齡前：開放式探索，避免計時與競爭計分** — 沙盒、獎勵發現與創造；無廣告、無時間壓力（對齊 Sago Mini／Khan Kids）。
3. **商業：家長信任 > 一切** — 費用購前透明、無 dark patterns；付費牆只在家長區，不讓孩子誤觸。
4. **螢幕是手段，動手是目的（phygital）** — 引導孩子離開螢幕做線下手作／實驗；反「純螢幕時間」賣點（見 Hey Clay 研究）。

### 台灣市場定位

| 面向 | 說明 |
|------|------|
| 對標 | 《顛覆！故事 STEAM》已驗證「故事 + STEM」；我們用**車車**更聚焦、更有畫面 |
| 付費範本 | 叮噹家族 VIP（月 99／年 999）：會員故事合輯、限定無廣告原創 |
| 護城河 | **自製音檔 + 看圖翻頁 + 逐字字幕 + 網頁互動 + phygital 手作引導** — 純 podcast（叮噹、信誼）做不到；roadmap 放大「翻頁引導 → 線下動手」 |

### 四階段總表（一頁摘要）

| 階段 | 核心 | STEM 連結 | 商業 |
|------|------|-----------|------|
| **P1** 互動故事 | 結尾開放提問、完播／重訪量測 | 提問啟蒙、因果 | 純留存驗證，零訂閱 |
| **P2** 車車 STEM 實驗室 | 組裝車沙盒、斜坡實驗、路徑編碼、分類數數 | 工程、物理、運算思維、數學 | 差異化價值主張 |
| **P3** 家長端 | 儀表板、家長閘門、共讀指引、列印物 | 延伸到現實 | 提升轉換與信任 |
| **P4** 商業化 | freemium + 訂閱（家長付費） | 會員進階實驗 | 對標月 99／年 999；進度綁定收費 |

**最該優先做的一件事：** STEM-P1「**每集結尾開放提問 + 完播／重訪量測**」— 成本最低、最快驗證互動意願，並鋪路 P2。

### 命名對照（避免 Growth-P1 與 STEM-P1 混淆）

| 前綴 | 含義 | 範例 |
|------|------|------|
| **P0–P3**（無 STEM 前綴） | **成長／官網** — 訂閱轉換、SEO、信任、工程 | P1 分享鈕、P2 隱私頁 |
| **STEM-P1–P4** | **產品／互動** — 互動提問、STEM 實驗室、家長端、商業化 | STEM-P1 reflectionPrompt |


### 現役 Top 5

**見檔首 [現役隊列](#現役隊列2026-07-11)。** 2026-06 對照：

### 本季 Top 5（2026-06 執行優先序）

1. ~~**STEM-P1** 每集結尾開放提問內容回填~~ ✅ `6ed7758`（全集覆蓋）
2. **Growth-P1** 單集頁訂閱 CTA 上移（主按鈕下方）
3. **Growth-P1** 首頁可見訂閱入口（Header／Hero → `#connect`）
4. ~~**Growth-P2** W27 信任收尾（許願隱私＋footer 觸控）~~ ✅ `964f418`；`/for-parents` 佔位 ✅ `dbfe7b3`
5. ~~**STEM-P1** 完播／重訪量測口徑驗證~~ ✅ `d2ac15c` `9bba1dd`（story_completed＋return_visit，口徑見 lib/analytics.ts）

> **STEM-P1 全數完成（2026-07-06）→ gate 解鎖**：凍結中的地圖美術長尾與遊戲 polish 可依數據擇機重開（建議先看兩週 story_completed／return_visit 基線再決定）。

> **地圖進化方向決策（2026-07-09，委員會 plan `61d098b` 後）**：
> ① **T3b camera 視覺更新外置**（zoom 期間重渲染隔離）——**先量測再定**：需低階裝置實測佐證（pinch zoom 期間 render 計數／FPS 有痛點）才開工；平移已由 memo 化解決（`61d098b`）。
> ② **D4 五島夜間美術**（`hasNightArt` 管線已 wired、零資產）——**等數據解凍**：看兩週 story_completed／return_visit 基線；重開時屬重啟凍結日夜美術決策，須另行同意＋定解凍門檻（比較基準與最低樣本數），走 generate-map-art 管線（Leader/Opus、人工審圖、成本確認）。

> 分享鈕、平台排序、訂閱文案、viewport 縮放、sitemap 擴充等已上線，見 Completed；不再佔 Top 5 名額。
---

### STEM-P1 — 互動故事（1–2 個月）

目標：不重做架構，在現有故事頁加輕互動，驗證孩子是否更願回訪。

#### ~~故事頁點按熱點（tap-to-explore）~~　`STEM-P1 · M · 插畫座標`　〔stem+eng〕 — **已移除（2026-06）**：虛線提示體驗不佳，待重新設計後再評估。`0d77d7f`

#### ~~每集結尾開放式「小提問」~~　`STEM-P1 · S · 文案`　〔stem+content〕 ✅
框架與 UI（`ReflectionPrompt`、詳情頁＋播放結束畫面）`10746b5`；ep-10～ep-17 文案回填完成（無標準答案＋親子延伸一句，角色名對 apple-synced summary 核實），`data/reflection-prompts.ts` 全集覆蓋＋測試。`6ed7758`

#### ~~互動正向回饋（音效／星星動畫）~~　`STEM-P1 · S · 收藏／提問`　〔stem+eng〕 ✅
收藏：星星動畫既有，補 `playSfx("collect")` 溫和音（reduced-motion 關動畫保留音效；取消收藏不出聲）。`f107a42`

#### ~~互動留存簡易量測（本機 + 可選 analytics）~~　`STEM-P1 · S · reflection 上線`　〔stem+ceo〕 ✅
本機紀錄 `10746b5` `a844f20`。**完播口徑已定案**（single source of truth：`lib/analytics.ts` `trackStoryCompleted` JSDoc）：native `ended` 且非 repeat 觸發；對外每次完整播放計一次（含重聽）、本機維持 unique 去重；payload 只送 `{ slug }`。`story_completed` 事件 `d2ac15c` `5e2db59`；`return_visit` 回訪訊號（≥6h、只送天數 bucket、每 session 一次；FE-04 minimal）`9bba1dd`。legal 與 `docs/FOR-PARENTS-DATA.md` 已同步揭露。
**量測品質備註**：`reflectionShown` 於 `ReflectionPrompt` mount 即記錄，而詳情頁無條件渲染 → 訊號≈pageview；後續可加 `source: "detail"|"end-screen"` 只記 end-screen 展開。

---

### STEM-P2 — 車車 STEM 實驗室（2–4 個月）

目標：系統性把「車」連到 STEM；**全部開放式、不計時、不排名**（canon 遊戲中 block-drop／car-adventure 計分僅作參考，新模組預設無競賽）。

#### 「組裝你的車」沙盒　`STEM-P2 · L · 無`　〔stem+eng〕
拖拉輪子、車身、引擎組車，組好可動。工程／結構直覺（對標 marshmallow 橋 + Sago 機器人組裝的車車版）。`/games` hub 新入口。

#### 「斜坡實驗」互動　`STEM-P2 · M · 無`　〔stem+eng〕
調坡度看車滑多遠／多快，玩因果與簡單物理。Canvas 或 DOM + 輕物理即可。

#### 無螢幕式路徑編碼（強化 Car Mission）　`STEM-P2 · M · 無`　〔stem+eng〕
方向箭頭排路徑讓車到終點；獨立關卡編輯器（**已移除** car-mission，不擴充舊元件）。適齡演算法啟蒙。

#### 分類／數數小遊戲　`STEM-P2 · M · 車種素材`　〔stem+eng〕
依顏色、大小、車種分類；符號功能與數學啟蒙。可重用 `VehicleClayIcon`、`/vehicles` 資料。

#### 「車車 DIY」手作教學（`craft` 內容類型）　`STEM-P2 · M · 插畫素材`　〔stem+research〕
新增與 `Story` 並存的 **`craft`** 型別：分步 `steps[]`（每步示意圖 + 語音引導句），複用 `StoryPlayer` 翻頁與字幕同步（同 `captions`／`captionTimes` 時間序列）。例：色紙摺救護車、回收物做垃圾車。架構成本近零，產品從「聽故事」升級為 phygital 引導平台。見 [RESEARCH.md](./RESEARCH.md)。研究見 [RESEARCH.md 2026-06-11 節](./RESEARCH.md#2026-06-11逐步共作模式--lego-說明書--hey-clay-的共同機制與本站轉譯)。

#### Phygital 故事延伸（聽完 → 線下手作）　`STEM-P2 · S · craft 上線`　〔stem+research+content〕
每集故事結尾、`parentGuide` 或詳情頁 CTA 連結對應 `craft` 教學；明確傳達「螢幕引導你動手做」。車車版循環：聽故事（線上）→ 跟著做（線下）→ 完成後解鎖圖鑑（見 STEM-P3）。

**設計紀律：** 新遊戲 checklist — 無計時、無排行榜、可隨時離開、觸控 ≥ 44px、reduced-motion 可玩。

---

### STEM-P3 — 家長端與信任（3–5 個月，可與 P2 並行）

#### 車車圖鑑養成（完成度解鎖）　`STEM-P3 · M · /characters 頁`　〔stem+research〕
聽完一集／完成對應 `craft` → 解鎖該集車進「車庫圖鑑」（localStorage 進度）。純數位版取代 Hey Clay 實體 code：用**完成度解鎖**驅動回訪；進階車款預留**會員解鎖**（STEM-P4）。與下方 `/characters` 角色圖鑑頁合併規劃。
**地圖進度中樞已上線（2026-07-06）**：18 集全數對映 zone（`data/story-zones.ts` `00feab9`）＋`useZoneProgress`/`useCompletedSlugs` hook（`ba7fd7e`）＋**可見層**（島嶼木牌 `⭐ n/N` 星章＋淡暖光暈＋sheet 已聽打星，`cbbe28d`）。「聽完」口徑由 `recordStoryCompleted` 單點定義——STEM-P1 完播口徑定案後只動寫入端，地圖不用改。圖鑑本體（車款解鎖 UI）仍待 P3。

#### 家長簡易儀表板　`STEM-P3 · M · localStorage 或帳號決策`　〔stem+design〕
用星星／笑臉呈現「聽了哪幾集、玩了什麼、解鎖了幾台車」，不做成績單。可先讀現有收藏／繼續播放／遊戲 best 分／圖鑑解鎖（localStorage）。**MVP 已上線**（`/for-parents/dashboard`）；文案 polish 見 [UX-P2-2](#兒童-ux-與親子互動稽核2026-07-11)。

#### 家長閘門（parent gate）　`STEM-P3 · S · 付費／設定頁`　〔stem+eng〕
設定、未來付費頁前簡單算術題，防孩子誤觸（對齊 Sago Mini）。**實作任務：** [UX-P0-1](#兒童-ux-與親子互動稽核2026-07-11)（2026-07-11 稽核具體化：先擋 `/for-parents/dashboard`）。

#### 每集「家長共讀指引」　`STEM-P3 · S · P2 parentGuide 上線`　〔stem+content〕
REUSE-2 試點已完成 `dbfe7b3`；**擴充全集：** [UX-P1-3](#兒童-ux-與親子互動稽核2026-07-11)。P3 階段另評估儀表板摘要、列印物連結。

#### 可下載列印物（著色、剪貼、迷宮）　`STEM-P3 · M · 插畫素材`　〔stem+growth〕
PDF printables 作加值；低成本高感知。會員可全解鎖（P4）。

#### KidSAFE／隱私行銷賣點　`STEM-P3 · S · /legal 已有`　〔stem+ceo〕
對外強調：無廣告、不蒐集兒童帳號、進度在裝置本機；若未來跨裝置帳號，需家長同意與最小蒐集。

---

### STEM-P4 — 商業化（5 個月後，留存與信任跑通後）

#### Freemium + 家長端訂閱　`STEM-P4 · L · P3 閘門`　〔stem+ceo〕
免費＝基本故事 + 部分互動；會員＝無廣告、限定故事、進階 STEM 實驗、列印物全解鎖。**付費牆不出現在孩子主流程。**

#### 收費時機綁「進度／累積」　`STEM-P4 · M · 訂閱基建`　〔stem+growth+research〕
累積收聽／收藏／圖鑑解鎖／craft 完成後再推會員，非註冊當下；中斷會可惜時轉換較高。進階車款、進階 craft、列印物全解鎖可作會員差異（取代 Hey Clay 實體 code 內購）。

#### 訂閱價格帶驗證　`STEM-P4 · S · 營運`　〔stem+growth〕
對標台灣已驗證 **月 99／年 999**；內容節奏靠 Apple 同步新集 + 會員限定互動模組。

#### 持續新鮮內容管線　`STEM-P4 · 持續 · 既有 sync`　〔stem+eng〕
每季 1–2 個新 STEM 小遊戲或互動故事功能；依 P1 留存數據排優先序。

---

## 路線圖（單一優先序總表）

| 期 | 主題 | 條目 |
|----|------|------|
| **P0** 地基 + 第一印象 | 看起來完整、被搜尋到 | 首頁渲染修復 · 正式網域 · sitemap/robots（含 `/games`、`/legal`）· JSON-LD · DESIGN.md 同步 · 首屏精簡 |
| **P1** 訂閱轉換 + 分享 | 「沒看到訂閱」消失、可被轉發 | ~~Growth-P1a/b~~ `eafe30a` · ~~ConnectHub 文案/排序~~ · ~~每集分享鈕~~ · 試聽橋接 · 入門三集 · 空狀態 · 錨點導覽 |
| **P2** 信任/合規 + 內容 | 兒童產品權重、內容變深 | ~~隱私專章 + analytics~~ · 主持人信任區 · 真實插畫 · ~~家長共讀指引試點~~ · UX-P1-3 擴充 · 新集通知說明 · 主題頁 SEO · 音檔壓縮 · ~~縮放~~/觸控/塗鴉 |
| **P3** 可靠/工程/可選 | 不掛、可回歸、加分 | 監控 · E2E CI · ESLint CI · 生圖佇列 · 車車圖鑑養成 |
| **STEM-P1→P4** 互動×STEM×商業 | 差異化與變現 | 見上表；**當務之急：結尾提問 + 完播量測** |

**相依鏈（現況修正）：** 正式網域 → sitemap/robots + JSON-LD 已完成；analytics 與 `/legal#privacy` 已上線（`a844f20`）。後續蒐集 email（LIST-2／許願表單）必須在表單旁補清楚隱私句與用途說明。

**已備齊（勿重做）：** 故事牆、全螢幕播放器、每集落地頁 + **每集 OG 圖**（`lib/story-metadata.ts`）、**每集分享鈕**（`ShareButton`）、`/topic` 與車種 SEO 頁、RSS `/feed.xml`、`ageRange`、PWA／收藏／繼續收聽、ConnectHub（Spotify／Apple 優先 + 訂閱文案）、相關推薦、**`/games` 遊樂園**（繽紛消消樂／車車大冒險／繽紛樂園／繽紛卡丁車）、`/legal#privacy` 與版權合規、Vercel Analytics + 平台點擊事件、逐字字幕管線、角色定裝照名冊、`/characters` 公開角色頁、Apple 15 分鐘同步 + GitHub Issue 通知、**viewport 開放縮放**。

**待決策（實作前定）：** ① 自訂網域最終選擇（`chechepark.tw` / `checheland.tw` / 其他）— **基建已就緒**（`NEXT_PUBLIC_SITE_URL` + `CANONICAL_SITE_URL` fallback，P0 ✅）；② ~~`parentGuide` 與 `familyActivity` 邊界~~ → 已決（[GEO-CONTENT-CONTRACT](./docs/GEO-CONTENT-CONTRACT.md)）；擴充見 UX-P1-3；③ ~~縮放（鎖 vs 家長大字模式）~~ → **已決：開放縮放**（`app/layout.tsx`，P2 ✅）；④ **現有 4 款遊樂園遊戲與 STEM 原則** — 見下方「產品決策」；⑤ **兒童拍照分享** — 是否做、如何去識別化；跨裝置圖鑑是否需帳號與家長同意（見 [RESEARCH.md](./RESEARCH.md) 風險段）。

### 產品決策：現有遊樂園 vs STEM「不計時、不競爭」

現有 4 款遊戲（繽紛消消樂、車車大冒險、繽紛樂園、繽紛卡丁車）中，block-drop／car-adventure 含 **localStorage 最佳分／生命數** 等競賽元素，與 STEM 路線「學齡前避免計時與競爭計分」不完全一致。

**建議方向（擇一或混合，實作 STEM-P2 前定案）：**

| 選項 | 說明 |
|------|------|
| **A. 分層** | 現有 4 款保留為「遊樂園經典區」；STEM-P2 新模組嚴守無計時／無排行榜 checklist |
| **B. 漸進淡化** | 保留 best 分顯示但移除生命／Game Over 壓力；大冒險改為無限續關或探索模式 |
| **C. 雙模式** | 每款加「輕鬆玩」（無分數）／「挑戰玩」（可選，預設輕鬆） |

**新遊戲預設：** 無計時、無排行榜、可隨時離開（見 STEM-P2 設計紀律）。舊遊戲是否改版依上表決策後排入 P2 或 P3。**市售 pixel 精進**（Game Kit、三星、高分）已移至 [RESEARCH.md — 四款小遊戲精進](./RESEARCH.md#2026-06-09四款小遊戲精進方案對標可市售-pixel-game)，待 STEM-P1 gate 後再解凍。


## P0 — 地基 + 第一印象

### ~~首頁集數列表渲染修復~~　`P0 · S · 無`　〔eng〕 ✅
`StoryFilter` 把整段故事牆包在 `<Suspense fallback="載入故事中…">`，內層用 `useSearchParams()`，Next.js 15 中此舉使該邊界退化為 client-only → **靜態 HTML 只有最新一集 + 「載入故事中…」，列表要等 JS 才出現**。這正是「看起來很簡陋」+ 首頁 SEO 空洞的根因。
**修法：** `useState` 初值改 `null`（= server 的「全部」），`vehicleParam` 只在 `useEffect` 套用，避免 hydration mismatch；移除把列表藏在 fallback 的結構。影響檔 `components/StoryFilter.tsx`；`app/page.tsx` 已傳完整 `stories`，不動。修完「首頁載入骨架」需求基本消失。

### ~~設定正式站網域 + `NEXT_PUBLIC_SITE_URL`~~　`P0 · S · 確認網域`　〔ceo〕 ✅
Vercel 設 `NEXT_PUBLIC_SITE_URL=https://正式網域`。OG／Twitter／RSS／sitemap 的絕對連結都靠它；未設時 fallback 到 `VERCEL_URL`／`localhost`。**擋住 sitemap、JSON-LD、每集分享預覽。** `app/layout.tsx` 已讀此變數。

### ~~`sitemap.xml` + `robots.txt`~~　`P0 · S · 網域`　〔ceo〕 ✅
新增 `app/sitemap.ts`（首頁、`/story/[slug]`、`/topic`、`/topic/[tag]`、`/vehicles/[vehicle]`、`/about`、**`/games` hub + 各遊戲頁**、**`/legal`**）與 `app/robots.ts`（允許爬取、指向 sitemap）。主打「每集落地頁被搜尋到」卻沒給站點地圖，這是 SEO 最低門檻。Next.js 15 原生 `MetadataRoute`；重用 `stories()`、`allTags()`、`allVehicles()`、`lib/site-url.ts`。

### ~~Podcast 結構化資料 JSON-LD~~　`P0–P1 · S · 網域`　〔ceo〕 ✅
首頁輸出 `PodcastSeries`、單集頁輸出 `PodcastEpisode`（schema.org `<script type="application/ld+json">`），欄位對應標題／日期／音檔 URL／封面，對齊 `/feed.xml`。協助 Google 理解節目與單集（豐富摘要）。建議抽 `lib/json-ld.ts` 集中產生。

### ~~同步 DESIGN.md 與實作~~　`P0 · S · 無`　〔design〕 ✅
更新 `DESIGN.md`：`--ink-soft` → `#7a7268`、背景改 `.site-backdrop` + `.site-root`、StoryFilter 塗鴉現況，且 viewport 段落已同步為「允許使用者縮放」（實作見 `app/layout.tsx`）。設計文件漂移時改版易回到舊 token。實作見 `app/globals.css`。

### ~~首屏價值主張與資訊架構精簡~~　`P0 · S–M · 無`　〔design+ceo〕 ✅
新訪客需 3 秒內懂「這不是一般 podcast 嵌入頁，是互動繪本」。**已做：** 標頭三行 tagline + 合作/許願/留言圓鈕（見 Completed）。**剩餘：** 檢視區塊順序（Header → LatestHero → FavoritesSection → StoryFilter），避免「最新集」與列表長期重複同一集；副標清楚傳達「給誰聽、睡前幾分鐘」。

---

## P1 — 訂閱轉換 + 分享導流

### ~~ConnectHub 訂閱文案與平台排序~~　`P1 · S · 無`　〔growth〕 ✅
頁尾「訂閱收聽」已加「訂閱後，新集會自動出現在你的 Podcast App」；`lib/platforms.ts` 陣列序為 **Spotify → Apple → KKBOX → YouTube**。`components/ConnectHub.tsx`。SoundOn／RSS 已移除，勿加回。

### ~~每集分享鈕（複製連結 / LINE）~~　`P1 · S · 網域`　〔growth〕 ✅
單集頁 `ShareButton`：複製連結 + LINE 分享（`lib/share-story.ts` 組 URL）；可插 `leading` 放收藏鈕。OG 預覽圖已備齊（`lib/story-metadata.ts`）。B 戰場每則貼文固定連單集。

### Growth-P1a 單集訂閱 CTA 上移　`P1 · S · 無`　〔design〕 ✅ `eafe30a`
單集頁主 CTA（收藏／分享）下方加「訂閱收聽」區塊，視覺層級低於主按鈕但高於次要連結。見現役隊列 #2。

### Growth-P1b 首頁訂閱入口　`P1 · S · 無`　〔eng〕 ✅ `eafe30a`
Header 或 Hero 加明確「訂閱」按鈕連 `#connect`（或 `/subscribe`）。見現役隊列 #3。首段 Hero 加 `#connect` 捷徑；頂欄 SubscribeMenu 維持。

### 試聽片段 → 平台訂閱橋接　`P1 · M · 無`　〔growth〕
單集頁加 30–60 秒試聽（裁切 `public/stories/<slug>/` 預覽檔或播放器限制 `currentTime`），突出 CTA 導去平台聽完整版。社群進站者先感受聲音氣質再轉換。

### 首頁「入門三集」與本週更新　`P1 · S · 無`　〔growth〕
首頁加「第一次來？從這三集開始」精選區（`data/stories.ts` 標 `featured` 或手動 slug 列表）；最新集 Hero 旁補「本週更新」節奏文案。降低新聽眾選擇成本、建立訂閱期待。

### 首頁／篩選空狀態插畫化　`P1 · M · 素材`　〔design〕
為「載入中／篩選無結果／尚無收藏」設計吉祥物 + 一句話 + 明確下一步（換車種、聽最新一集）。純文字空狀態在兒童產品像工程預設。`app/page.tsx`、`StoryFilter`、`FavoritesSection`。

### 首頁錨點導覽（取代手機 sticky 篩選）　`P1 · S–M · 無`　〔design〕
長列表加頁內錨點／捷徑列（最新｜全部故事｜依車車）。iOS 上 StoryFilter 已改 `position: static` 避免合成破圖，犧牲吸頂；錨點補「找得到篩選」而不復活 sticky。集數 >15 優先度提高。

### 每集上線「社群貼文腳本」SOP　`P1 · S · 分享鈕定稿`　〔growth〕（營運，不寫程式）
`README.md`／`docs/` 新增每集 SOP：① 預告 ② 上線貼（官網單集 URL）③ 平台訂閱提醒 ④ 15 秒幕後再導連結。B 靠固定節奏與固定入口。

---
## P2 — 信任/合規 + 內容深化

### ~~隱私專章 + analytics 基礎事件~~　`P2 · S · 無`　〔ceo〕 ✅
`/legal#privacy` 已說明 localStorage、完播紀錄、平台點擊、Vercel Web Analytics 與第三方平台外連；`app/layout.tsx` 已掛 `<Analytics />`，平台外連走 `TrackedPlatformLink` + `trackPlatformClick`。`a844f20`
**剩餘 W27 信任收尾：** ~~許願隱私＋footer 觸控~~ ✅ `964f418`；LIST-2 email 訂閱實作時同步連回 `/legal#privacy`。

### Analytics 後續：UTM + 平台後台對照　`P2 · S–M · 量測基線`　〔ceo+growth〕
站內平台點擊事件已上線（`a844f20`）；UTM 規格與週報模板已補（`797de82`、`docs/metrics/README.md`）；待補 SoundOn show notes 回鏈與平台後台週報實記。見 [Growth-Measure-1](#growth-measure-1-成長量測)。

### 主持人信任區（Bonbon & 馬米）　`P2 · S · 照片+文案`　〔growth〕
關於頁或首頁下半加主持人小卡：照片、各一句話、節目理念（為什麼做親子車車故事）。熱門節目靠人格溫度；B 置頂貼可連同一區。家長會問「誰做的、適合我家孩子嗎」。`app/about/page.tsx`。

### 替換真實多頁插畫　`P2 · M · 授權插畫`　〔growth〕
各集 `public/stories/<slug>/` 佔位圖換成官方插畫，視需要提高 `pageCount`。真實繪本強化「看圖聽故事」睡前儀式感。`pageCount` 與 `01.jpg`～`NN.jpg` 對齊；一圖多句時 `captions` 可多於 `pageCount`（播放器重複封面）。

### ~~每集「家長共讀指引」（`parentGuide` 試點）~~　`P2 · S · 文案`　〔content+design+stem〕 ✅ `dbfe7b3`
REUSE-2 試點（ep-1/ep-5 + ShowNotes）已完成。**擴充全集：** [UX-P1-3](#兒童-ux-與親子互動稽核2026-07-11)（勿在此重開待做條目）。

### 字幕人名校對　`P2 · S/集 · 無`　〔content〕
EP1–7 已用 `large-v3` 轉錄 + 自動簡轉繁（`data/subtitles/*.json`）。**剩**：校對品牌/人名誤聽——Bonbon→寶寶、馬米→媽咪等（Whisper 無從得知），直接改側車 JSON。屬資料校對、非工程。

### 新集通知路徑（家長向白話說明）　`P2 · S · 無`　〔growth〕
訂閱區簡短說明「如何訂閱／用 App 收新集」。RSS 技術面已有，家長多不熟 RSS，需白話引導。`ConnectHub` 加一兩句 FAQ 或連關於頁錨點。

### SEO：主題與系列頁擴充　`P2 · S–M · 無`　〔growth〕
延續 `/topic/[tag]`，每主題補一句家長向導語（非僅列表）、補站內連結結構。家長依「勇氣、睡前、安全」搜尋，主題頁是長尾入口。`generateStaticParams` 與 metadata 已具備。

### 壓縮 podcast 音檔　`P2 · S · 無`　〔content〕
ffmpeg 將每集 `audio.mp3` 壓到 mono 128kbps、目標 < 5MB（現每集 5–10MB，總 50MB+）。睡前=手機弱網，載入慢。指令見 README；壓後本機聽確認音質再覆蓋。

### ~~家長放大閱讀（viewport 縮放）~~　`P2 · S · 產品決策`　〔design〕 ✅
**已決並實作：** `app/layout.tsx` 移除 `maximumScale`／`userScalable: false`，開放 pinch-zoom，家長共讀可放大文字／插圖（WCAG 1.4.4）；`DESIGN.md` 已同步 viewport 原則。**剩餘（可選）：** 實機驗證 3–5 歲誤觸縮放是否影響操作；若困擾再評估「大字模式」而非重新鎖縮放。

### 篩選 chip 觸控與鍵盤順序　`P2 · S · 無`　〔design〕
實機確認車種 chip 觸控區 ≥ 44×44px；Tab 順序：主 CTA → chip 列 → 第一張故事卡。兒童/家長多觸控，鍵盤使用者需可「選車種 → 開第一集」。`StoryFilter` 已用 `<button>`，`globals.css` 有 `:focus-visible`。

### StoryFilter 區塊塗鴉一致性　`P2 · S · DESIGN.md`　〔design〕
決定「依車車找故事」區補 1–2 個 `Doodle`（與 Header 呼應）或刻意留白，寫入 DESIGN.md 並實作一致。中段全無裝飾時，全站上下塗鴉多、中間素，像兩套設計拼貼。

## 車車宇宙樂園地圖（已完成 → 已封存）

> R0–R2、MAP-UX、遨遊升級、兒童易用性全文見 [archive](./docs/archive/TODOS-completed-2026-07-11.md)。MAP-ROAM-2～5 已入主線（`3166cc5`、`503ad8b`）。

**紅線（勿動）：** `useMapCamera`／`ZoneSheet` 核心、zones 座標、zone-art-tile 契約、地圖固定淺色場景。

---

## P3 — 可靠 / 工程 / 可選

### 錯誤／上線監控　`P3 · S · 無`　〔ceo〕
接輕量 client error 上報（Sentry free / Vercel）+ uptime（UptimeRobot），至少涵蓋首頁與一個播放頁。站掛了、播放器某機型崩了要有人知道。純 SSG，client error 為主要風險（播放器、iOS 合成破圖回歸）。

### Playwright E2E CI 接入 + 擴充　`P3 · M · 無`　〔eng〕
本地已有 `e2e/smoke.spec.ts`、`e2e/a11y.spec.ts`、`e2e/universe-map.spec.ts`（25 tests）。待做：CI workflow 接入 + [UX-P1-5](#兒童-ux-與親子互動稽核2026-07-11) 觸控 assertion 擴充。

### ESLint CI 設定　`P3 · S · 無`　〔eng〕
`next lint` 改非互動設定（`eslint.config.mjs` + `@next/eslint-plugin-next`）以接 CI。目前會跳首次設定精靈，無法在 CI 用。

### 車車圖鑑養成（疊加於已上線 `/characters`）　`P3 · M · craft / 進度規格`　〔ceo+research+stem〕
`/characters` SEO 角色頁與 JSON-LD 已上線（`f3687e0`），角色資料讀 `data/characters.json`，故事頁也已可連到角色錨點。不要再另開「新頁 `/characters`」任務；剩餘產品工作併入 STEM-P3 車庫養成：聽完／完成 craft 後以 localStorage 解鎖角色或車款、補一句中文個性文案、決定灰階/問號/貼紙呈現。

### 成長與商業（依階段）　`P3 · L · 營運階段`　〔growth〕
逐步把官網從「連結集合」變「成長與變現中樞」：贊助 landing、周邊／活動、多語等。親子 IP 可先不做電商。**訂閱與 freemium 細節見 STEM-P4，勿在 P1 互動驗證前上付費牆。**

### ~~同步後生圖通知（GitHub Issue）~~　`P2 · S · 新集偵測`　〔eng+ops〕 ✅
GHA 同步新集並 push 成功後，`scripts/sync-alert.ts notify-live` 會開 `[illustrate] 新集待生圖：ep-N` Issue（標籤 `illustration`，可 assign／@mention 觸發 GitHub App 手機通知）；失敗與 RSS stale 也走 GitHub Issue 告警。`113680a`

### ~~同步 commit 訊息帶生圖提示~~　`P2 · S · 無`　〔eng+ops〕 ✅
GHA commit body 已由 `scripts/post-sync-notify.ts` 產生，列出本輪新 slug、字幕狀態、`npm run illustrate -- ep-N` 與完整生圖 checklist。`95ba69a`

### 生圖佇列 `data/illustration-queue.json`　`P3 · S · 通知基建`　〔eng+ops〕
`sync-apple-podcast.ts` 新集寫入 `{ slug, ep, syncedAt, subtitleReady, status: awaiting-illustrate }`；`illustrate --approve` 改 `approved` 或移除。Issue／webhook／未來 Studio 儀表板共用單一真相來源。

### Game Kit 歷史路線（Phase 0–8） ✅

Phase 0–8 的探索已完成並在 2026-06-25 收斂。現行架構只保留四款已出貨遊戲真正使用的能力：

- `lib/gamekit/react/`：React hooks 與觸控控制
- `lib/gamekit/runtime/`：loop、輸入、渲染、音訊、juice、程序圖塊
- `lib/gamekit/progress/`：設定、存檔 migration、獎牌與 session
- `lib/gamekit/games/`：大冒險關卡與 Candy Kart bridge

舊 Phase scaffolding（state machine、scene、pool、abilities、tilemap、Tiled loader、sprite adapter）已移除。歷史變更見 [CHANGELOG.md](./CHANGELOG.md)，現行規範見 [GAMEKIT-ART-BIBLE.md](./docs/GAMEKIT-ART-BIBLE.md)。

### ~~車車卡丁車 Kart P0 — Scaffold~~　`P3 · M · 無`　〔eng〕 ✅
`kart-game/`（Vite+TS+Three）：固定步進、kinematic 方塊車、spline 練習道、跟隨相機、HUD；`npm run build:kart` → `public/kart/`；`/games/kart` iframe 嵌入。

### ❄️ FROZEN — 待 STEM-P1 Gate 之後｜四款 pixel 精進

> **玩法凍結：** 下列精進、kart P1–P6、多人功能暫不實作。canon 四款維持現況。

### ① 車車吃星星精進　`已移除 · car-star`　〔eng+design〕
（遊戲已下架；歷史規格僅供對照。）

### ② 繽紛方塊精進　`P3 · M · Game Kit Phase 2`　〔eng+design〕 ❄️ FROZEN
像素方塊皮膚、Marathon/Sprint/Ultra/**兒童模式**（慢速、不會輸）、消行音畫 juice（依音階奏音）、T-spin/combo 計分（挑戰模式）。

### ③ 車車大冒險精進　`P3 · L · Game Kit + Tiled`　〔eng+design〕 ❄️ FROZEN
Tiled 關卡管線、6–10 關+世界地圖、檢查點、多敵人類型、視差背景、boss 關。

### ④ 溫柔任務（car-mission）精進　`已移除 · car-mission`　〔eng+design〕
（遊戲已下架；歷史規格僅供對照。）

### kart P1–P6、多人　`❄️ FROZEN — 待 STEM-P1 Gate 之後`

### ~~遊樂園 hub 世界地圖化~~　`P3 · M · Phase 6 meta`　〔design+eng〕 ✅
`/games` 新增 `GamesWorldMap`（星星、三星、車庫、貼紙簿、各款最佳）；保留遊戲卡片入口。

---
## 營運管線：SoundOn／Apple 同步 × 生圖

> **關係：** SoundOn 上架 → Apple Podcast RSS（SoundOn 託管 feed）→ `npm run sync:apple`（GHA 每 15 分或手動）→ 站上 **MVP**（單封面）→ **人工**生圖 → 完整繪本版。官網與 SoundOn **不直連**；只讀 Apple 公開 RSS。詳見 [README — Apple Podcast 自動同步](./README.md#apple-podcast-自動同步)。

### 觸發來源

| 來源 | 準時性 | 用途 |
|------|--------|------|
| `repository_dispatch`（外部 cron 打 API） | 準時 | 主要定時（cron-job.org 等） |
| `schedule`（GitHub cron `*/15`） | best-effort，常延遲 | 後備 |
| `workflow_dispatch` | 即時 | SoundOn 上架後手動 Run |

### Phase 1 — CI 自動（GHA，已實作）

| # | 項目 | 產出 | 備註 |
|---|------|------|------|
| 1 | Checkout + `npm ci` | — | Node 22 |
| 2 | Whisper 安裝（ffmpeg + large-v3） | `models/ggml-large-v3.bin` | 快取 ~3GB |
| 3 | iTunes Lookup → RSS | SoundOn 託管 feed URL | 無 API key |
| 4 | 解析 RSS、比對 `seenGuids` | — | 每輪最多 **3 集**新集 |
| 5 | 更新既有集 metadata | title／date／duration／summary | 不重下載音檔 |
| 6 | 下載新集音檔 | `public/stories/ep-N/audio.mp3` | 上限 50MB |
| 7 | 下載 Apple 封面 | `01.jpg` | 單圖 MVP |
| 8 | Whisper 轉錄 | `data/subtitles/ep-N.json` | 草稿，需人名校對 |
| 9 | 寫入 metadata | `data/apple-synced.json` | `pageCount: 1` |
| 10 | 更新狀態 | `data/apple-sync-state.json` | guid 對照 |
| 11 | 車種／標籤推斷 | vehicle、tags | 關鍵字或「其他」 |
| 11b | **找車車索引** | `data/browse-index.json` | 新車種 emoji、新主題 symbol；`npm run verify:browse-index` |
| 12 | 字幕 backfill | 缺字幕的舊集補轉 | 同 run 內 |
| 12b | 簡轉繁 + 幻覺過濾 | `relocalizeSidecars` | 同 run 內 |
| 12c | **字幕自動 `--fix`** | 本輪新集／新轉錄 `ep-N` 品牌名修正 | 不 `--mark`；report 寫入 `proofreadAutoFixed` |
| 13 | `npm test` + `npm run build` | — | 有變更才跑 |
| 14 | Commit + push `main` | Vercel 部署 MVP | 見下方 commit 範圍 |
| 15 | **生圖通知** | GitHub Issue | 已實作：push 成功後開 `[illustrate]` Issue（`113680a`） |

**GHA 目前 `git add` 範圍：** `data/apple-synced.json`、`data/apple-sync-state.json`、`data/browse-index.json`、`public/stories/`、`data/subtitles/`。

**GHA 不會碰：** `public/.illustrate-staging/`、`data/apple-sync.defaults.json`（approve 寫入 overrides）、`data/characters.json`、`data/scenes/` — 生圖產物需**人工 commit**。

### Phase 2 — 同步後人工（生圖前）

| # | 項目 | 負責 |
|---|------|------|
| 16 | 收到 GitHub Issue 通知 | 維護者 |
| 17 | 抽查站上 MVP | `/story/ep-N` 能播、封面正確 |
| 18 | 最終校稿 + `--mark` | GHA 已跑 `--fix`；人工抽查後 `npm run proofread:subtitles -- ep-N --mark`（[SUBTITLE-PROOFREAD.md](./docs/SUBTITLE-PROOFREAD.md)） |
| 19 | 確認車種／標籤 | `apple-sync.defaults.json` overrides；必要時手動補 `data/browse-index.json` patterns |
| 20 | （可選）`npm run font:subset` | 新摘要有生僻字時 |

### Phase 3 — 生圖管線（本機，需 `OPENAI_API_KEY`）

| # | 指令／步驟 | 產出 |
|---|-----------|------|
| 21 | `npm run illustrate -- ep-N --segment-only` | `data/scenes/ep-N.json` |
| 22 | `npm run illustrate -- ep-N` | staging 圖 + `contact.html` |
| 23 | 審圖 | 逐幕檢查走樣／角色 |
| 24 | `--scene N`／`--char 名` | 單張重抽（可選） |
| 25 | `npm run illustrate -- ep-N --approve` | `02.jpg`～`NN.jpg` + `pageCount` + `captionTimes` + `captions` |
| 26 | `npm run verify:episodes` | 對照 ep-9／ep-10 標準（見 [docs/EPISODE-WORKFLOW.md](./docs/EPISODE-WORKFLOW.md)） |
| 27 | `npm run sync:apple && npm run build` | overrides 併入 synced |
| 28 | Commit + push | 含 `public/stories/`、`defaults`、`characters`、`scenes` |
| 29 | 關 Issue／清佇列 | 標記生圖完成 |

詳見 [README — 每集劇情插圖自動生成](./README.md#每集劇情插圖自動生成npm-run-illustrate)。

### Phase 4 — 營運（可選）

| # | 項目 |
|---|------|
| 29b | **YouTube 整集 mp4** | `npm run export:video -- ep-N` → Studio 手動上傳（[VIDEO-EXPORT.md](./docs/VIDEO-EXPORT.md)） |
| 30 | Threads／IG 貼文（單集 URL + OG） |
| 31 | 平台訂閱提醒 |
| 32 | 家長向新集說明（見 P2「新集通知路徑」） |

### 端到端時序（一集新故事）

```
T+0     SoundOn 上架
T+15m   外部 cron → GHA sync
T+20m   ep-N MVP 上線（1 封面 + 字幕草稿 + GHA 自動 --fix）
T+20m   GitHub Issue：「請生圖 ep-N」
T+1d    最終校稿 → --mark → illustrate → 審圖 → approve
T+1d    push 完整繪本版
T+2d    社群貼文（B 戰場）
```

### 生圖通知方案（實作優先序）

| 期 | 方案 | 說明 |
|----|------|------|
| **一期** | D commit 訊息強化 + A GitHub Issue | 已實作，零／低依賴，可追蹤 checklist |
| **二期** | C `illustration-queue.json` + Studio 顯示 | 機器可讀佇列 |

**已砍：** 外部 webhook 即時推播。LINE 舊推播服務已於 2025-03-31 終止；現行 GitHub Issue + GitHub App 手機通知已足夠，不再新增 secret 或 webhook 維護面。

**GitHub Issue 範本（一期）：**

```markdown
## 新集待生圖：ep-N

- 同步：{ISO 時間} · 觸發：Apple RSS（SoundOn）
- 狀態：MVP 已上線（pageCount=1），待多頁插圖

### Checklist
- [x] GHA 已自動 proofread --fix（Bonbon／馬米等品牌名）
- [ ] 最終校稿 `data/subtitles/ep-N.json` → `npm run proofread:subtitles -- ep-N --mark`
- [ ] npm run illustrate -- ep-N --segment-only
- [ ] OPENAI_API_KEY=... npm run illustrate -- ep-N
- [ ] 審 public/.illustrate-staging/ep-N/contact.html
- [ ] npm run illustrate -- ep-N --approve
- [ ] npm run sync:apple && npm run build → commit push
```

### ep-18 上架進度（2026-07-07）

| 步驟 | 狀態 | 備註 |
|------|------|------|
| 字幕校對 + `--mark` | ✅ | 189 句；噗噗豬／飄飄河／靛紫／鞦韆；刪除 Whisper 幻覺段；補收尾反思台詞 → `3cbb28d` |
| `illustrate --segment-only` → 生圖 → `--approve` | ✅ | 18 幕全幕繪本；場景手修 ep-16/17 標準；`verify:episodes` 全過 → `7d85fd3` |

### 現況缺口（勿忘）

- 同步與 `illustrate` **完全脫鉤**；腳本僅 log「請視需要補 overrides」。
- 無 `illustrationStatus` 欄位；`ep-8`（1 頁）vs `ep-9`（8 頁）即典型落差。
- CI **不放** `OPENAI_API_KEY`；生圖永遠本機手動 + 人工審圖（設計如此）。

---

## 延後（現階段不優先）

| 項目 | 原因 |
|------|------|
| ~~Email 電子報~~ / 會員 | **名單收集已升級為主動任務**（見 [名單收集 × 內容再利用](#名單收集--內容再利用2026-07-03-品牌盤點) LIST-2：僅收名單不寄信）；**正式會員制見 STEM-P4** |
| 著色頁／活動單 PDF | **已納入 STEM-P3 列印物**；P1–P2 前先拉高單集分享與互動留存 |
| 部落格長文 SEO | 初期單集頁 + 平台關鍵字效益較直接 |
| 網站內 RSS 播放器 | 訂閱導向 Spotify／Apple 即可 |
| Service Worker 離線快取 | 弱網需求成立但 MP3 快取容量／更新策略風險高；P1–P2 先做信任、訂閱與量測 |
| ~~睡前模式／季節主題皮~~ | **已完成夜晚模式＋跟隨系統**（見 Completed）；季節主題皮仍延後 |
| 全站 redesign／換字體 | 現有手繪風格已具辨識度 |
| 首頁 3 欄 icon 功能介紹 | 違反 AI slop 黑名單，與品牌不符 |
| 首頁列表「大圖單欄」模式 | 需先確認主攻 3–5 歲與實際瀏覽行為；現左圖右文在 5+ 較合適，非本季主戰場 |
| 四款 pixel 精進 | 已移至 [RESEARCH.md — 四款小遊戲精進](./RESEARCH.md#2026-06-09四款小遊戲精進方案對標可市售-pixel-game)；玩法與美術升級全部 ❄️ FROZEN，待 STEM-P1 gate 後再排 |
| iOS sticky 篩選列復活 | 除非有 fixed 複製列方案且通過 iOS 26 實機 |
| 兒童照片上傳／分享手作作品 | COPPA／兒童隱私風險高；見 [RESEARCH.md](./RESEARCH.md) 待確認；可先只做本機「完成」勾選不傳圖 |

---

## 車車宇宙樂園地圖改善（資產／互動／許願／埋點）　`feature · M · /adventures`　〔eng+design〕

> **Gate：** 已核可並完成實作（2026-07-02）。

| Task | 狀態 | 主要產出 | Commit hash |
|------|------|----------|-------------|
| task-1 資產減重 WebP | 完成 | `optimize:adventures`、島 tile `<picture>`、SVG 海面 WebP 偵測 | `a527411` |
| task-2 鎖島微互動 | 完成 | 果凍晃動 + `playSfx(tap)` + 狀態泡泡 | `9eab5fd` |
| task-3 許願表單 + API | 完成 | `POST /api/zone-wish`、Neon schema、`ZoneWishForm` | `8a490c7` |
| task-4 埋點 | 完成 | `universe_zone_tap` 等四事件 | `5673f19` |
| task-5 深連結 | 完成 | `/adventures?zone=dino` + `router.replace` | `5673f19` |
| task-6 收尾 | 完成 | 本段 + 首屏傳輸對照 | `d54453d` |

### 首屏傳輸量（spec 定義：car-park@DPR + sea + 遠景 1x + map roamers）

| 資產 | PNG（改前） | WebP（改後） |
|------|------------|-------------|
| sea | 1952 KB | 56 KB |
| car-park@2x | 287 KB | 46 KB |
| far-island-a + b（1x） | 212 KB | 19 KB |
| xiao-hong + duo-duo | 67 KB | 67 KB（已有） |
| **合計** | **~2518 KB** | **~188 KB** |

### Vercel 後台 env

| 變數 | 用途 |
|------|------|
| `DATABASE_URL` | Neon Postgres（未設時許願表單降級 mailto） |

Migration：`scripts/migrations/001_zone_wishes.sql`

---

## 注意力鉤子三件套（familyActivity / 故事許願 / 集數↔地圖）　`feature · M · feat/attention-hooks`　〔eng+growth〕

> **Gate：** 已核可（plan-first）。分支 `feat/attention-hooks`；每 Task 獨立 commit，前綴 `feat(hooks):`。

| Task | 狀態 | 主要產出 | 驗證 | Commit hash |
|------|------|----------|------|-------------|
| HOOKS-1 familyActivity 三通路 | 完成 | `data/family-activities.ts` sidecar、`FamilyActivityCard`、RSS／FAQPage JSON-LD／llms-full 附加 | `npm test` + `npm run build` 全綠 | `ef1795e` |
| HOOKS-2 故事許願類型 | 完成 | `002_zone_wishes_category_message.sql`、表單 segmented control、`wish_submitted` 事件 | migration 冪等；無 DB 降級 | `d9524c3` |
| HOOKS-3 集數↔地圖互連 | 完成 | `data/story-zones.ts`、`getStoriesByZone`、`ZoneBadge`、ZoneSheet 故事清單、RSS 地圖深連結 | 雙向連結；首屏 bundle 不增重 | `2893e96` |

### 手動步驟（HOOKS-2 上線後）

- Neon：`psql "$DATABASE_URL" -f scripts/migrations/002_zone_wishes_category_message.sql`
- Vercel：沿用既有 `DATABASE_URL`，無新 env

---
## Completed（已歸檔）

- [docs/archive/TODOS-completed-2026-07-11.md](./docs/archive/TODOS-completed-2026-07-11.md)
- [docs/archive/TODOS-completed-2026-07-04.md](./docs/archive/TODOS-completed-2026-07-04.md)

