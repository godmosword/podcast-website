# TODOS

> **成長主戰場（2026-06 共識）：** **A** Spotify／Apple 平台收聽與訂閱 · **B** Threads／IG 短內容導流。
> 官網定位：每集可分享的落地頁 + 訂閱轉換中心；「看圖聽故事」為差異化體驗，不與平台搶完整收聽。
>
> **產品主戰場（2026-06 STEM roadmap）：** 把「音檔 + 看圖 + 字幕 + 網頁小遊戲」放大成**互動故事 × 車車 STEM 實驗室**；學齡前～低年級、開放式探索、家長信任優先。詳見下方 [**產品路線圖（互動 + STEM + 商業）**](#產品路線圖互動--stem--商業)。

> 格式：每項一段，行末標 `優先序 · 工時(人工) · 依賴`。工時 S/M/L；CC+gstack 約 1/10。
> **紀律：** 條目打 ✅ 時必須附 commit hash。
> 來源標記：〔eng〕程式發現 · 〔ceo〕plan-ceo-review · 〔design〕plan-design-review · 〔growth〕成長共識 · 〔stem〕產品-roadmap · 〔research〕[RESEARCH.md](./RESEARCH.md)。
>
> **現役遊戲（canon 四款）：** `car-adventure` 車車大冒險 · `block-drop` 繽紛方塊 · `kart` 車車卡丁車 · `pirate-kart` 海盜卡丁車大賽。  
> **已移除：** `car-star`（車車吃星星）、`car-mission`（溫柔任務）— 文件內歷史提及僅供對照。

---

## GEO 實作計畫（待確認）

> **Gate：** 本段經人工確認後才開始改 code。每個 Task 完成後單獨 commit，訊息格式固定為 `geo: task-N <描述>`，並把 commit hash 回填到本段。
> **紅線：** 不動宇宙地圖 canvas / animation / sprite 系統、不動 Q 版黏土角色 sprite 載入邏輯、不改名或刪除既有 URL、不修改音檔託管與 podcast RSS 既有產生邏輯、不升降 package 既有依賴版本。
> **目前資料基準（2026-07-03 本機掃描）：** `storiesByNewest()` 17 集、最新 `ep-17`（2026-07-02）、`allVehicles()` 13 種、`data/characters.json` 28 個角色。對外文案中的數字仍需人工審稿確認。

| Task | 狀態 | 主要產出 | 預計影響檔案 | 驗證 | Commit hash |
|------|------|----------|--------------|------|-------------|
| GEO-0 audit | 完成 | 產出 `docs/geo-audit.md`，列「現況 → 問題 → 對應 Task」 | Create: `docs/geo-audit.md`; Modify: `TODOS.md` | `git diff --name-only` 只含 docs/TODOS；人工確認 audit 覆蓋 robots、Vercel/middleware、SSR/SSG、metadata、sitemap；`npm test` / `npm run build` passed | `6cda11d` |
| GEO-1 crawler-access | 完成 | AI crawler allowlist + `llms.txt`；未新增 optional `llms-full.txt`，避免摘要索引漂移 | Modify: `app/robots.ts`; Create: `public/llms.txt`; Test: `app/robots.test.ts`, `lib/llms-static.test.ts` | `npm test -- app/robots.test.ts lib/llms-static.test.ts` passed；`npm run build` passed；local `curl /robots.txt`、`curl /llms.txt` 皆 200；既有 `* Allow: /` 與 sitemap 保留 | `0e89735` |
| GEO-2 structured-data | 完成 | Organization/WebSite、PodcastSeries、PodcastEpisode `dateModified`、FAQPage helper、角色頁 CreativeWork/Person JSON-LD；`dateModified` 由 `data/story-dates.ts` 記錄每集專屬素材/字幕最後 commit 時間 | Modify: `app/layout.tsx`, `data/characters.ts`, `lib/json-ld.ts`; Create: `app/characters/page.tsx`, `app/characters/page.module.css`, `data/story-dates.ts`; Test: `lib/json-ld.test.ts`, `data/characters.test.ts`, `data/story-dates.test.ts` | `npm test -- lib/json-ld.test.ts data/characters.test.ts data/story-dates.test.ts` passed；`npm test` passed；`npm run build` passed；local `curl /story/ep-16` 可見 `PodcastEpisode`/`dateModified`/`duration`，`curl /characters` 可見 `CreativeWork`/`Person` | `f3687e0` |
| GEO-3 episode-ssr | 完成 | 單集頁 answer-first 80–120 字摘要、可見 SSR 詳細大綱、出場角色、家長延伸、每集 FAQ + FAQPage schema；metadata description 同步乾淨摘要 | Modify: `app/story/[slug]/page.tsx`, `app/story/[slug]/page.module.css`, `lib/story-metadata.ts`; Create: `lib/story-geo.ts`, `lib/story-geo.test.ts` | `npm test -- lib/story-geo.test.ts lib/story-metadata.test.ts lib/json-ld.test.ts` passed；`npm test` passed；`npm run build` passed；local `curl /story/ep-16` 原始 HTML 可見摘要/大綱/FAQ 且無 `<details>`；`npx --yes lighthouse ... --only-categories=seo` SEO 100 | `3b9fc09` |
| GEO-4 for-parents | 完成 | 新增 `/for-parents` Static GEO landing，問句 H2 + answer-first + FAQPage schema；集數/角色/車種/同步頻率數字均標 `[待確認]` 供審稿；代表性集數連到真實故事頁 | Create: `app/for-parents/page.tsx`, `app/for-parents/page.module.css`, `lib/for-parents.ts`, `lib/for-parents.test.ts`; Modify: `components/landing/SiteNavBar.tsx` | `npm test -- lib/for-parents.test.ts components/landing/SiteNavBar.test.tsx` passed；`npm test` passed；`npm run build` passed 且 `/for-parents` 為 Static；local `curl /for-parents` 原始 HTML 可見問句、`[待確認]` 數字、FAQPage JSON-LD、代表集數連結 | `702b7d5` |
| GEO-5 sitemap-freshness | 完成 | sitemap 涵蓋 `/for-parents`、`/characters`、所有單集；單集 `lastModified` 改用 `data/story-dates.ts`；metadata 與 JSON-LD `dateModified` 一致；移除 sitemap runtime `new Date()` freshness | Modify: `app/sitemap.ts`, `lib/story-metadata.ts`, `lib/json-ld.ts`, `app/characters/page.tsx`, `app/for-parents/page.tsx`; Create: `app/sitemap.test.ts`, `lib/page-freshness.ts` | `npm test -- app/sitemap.test.ts lib/story-metadata.test.ts lib/json-ld.test.ts` passed；`npm test` passed；`npm run build` passed；local 抽查 `ep-16`/`ep-15`/`ep-14` sitemap `lastmod` = metadata = JSON-LD；local HEAD `Last-Modified` absent，未加不精準 header | `6d1e8b1` |
| GEO-6 docs-wrap | 完成 | 回填 GEO-5 hash；新增 `docs/geo-checklist.md` 上線後人工檢查清單（Search Console、schema validator、5 個 AI prompt baseline） | Modify: `TODOS.md`; Create: `docs/geo-checklist.md` | `npx tsc --noEmit` passed；`npm run build` passed；`npm test` passed；GEO-0–6 hash 已回填 | `21f858d` |

### GEO Task DAG

1. `GEO-0 audit` 先行，確認不碰紅線且列出差距。
2. `GEO-1 crawler-access` 與 `GEO-2 structured-data` 可在 audit 後分開做，但 `GEO-2` 的 `dateModified` 欄位若缺真實來源，需先建立資料策略。
3. `GEO-3 episode-ssr` 依賴 `GEO-2` 的 FAQ/episode schema helper 與真實日期策略。
4. `GEO-4 for-parents` 依賴 `GEO-3` 的代表性單集連結與資料統計。
5. `GEO-5 sitemap-freshness` 依賴新增頁與日期欄位完成。
6. `GEO-6 docs-wrap` 最後收尾，回填 hash 與人工上線檢查。

### GEO 待決策

- `/characters` 是否作為新增公開角色介紹頁：目前 repo 沒有此路由；Task 2 建議新增 SSG 頁並只讀 `data/characters.ts`，不動 sprite 載入邏輯。
- `dateModified` 真實來源：目前故事資料只有 `date`；建議新增人工維護欄位或從既有 sync 狀態中找到可證明的更新時間。找不到真實來源時，不輸出假 `dateModified`，先回報。
- `/llms-full.txt` 是否包含全部 17 集摘要索引：若採用，內容需從 `storiesByNewest()` 產生/同步，避免手寫漂移。
- `/for-parents` 的更新頻率、適合年齡、代表集數等文案：先以資料層數字生成並標 `[待確認]`，人工審稿後再移除標記。

### GEO llms 收尾（2026-07-02）

| Task | 狀態 | 主要產出 | 驗證 | Commit hash |
|------|------|----------|------|-------------|
| llms.txt 補路由 | 完成 | `public/llms.txt` 主要路由地圖補 `/for-parents`、`/characters` 兩行 | `git diff -- public/llms.txt` 確認只新增指定兩行 | `cfd1c5f` |
| llms-full.txt 自動產生 | 完成 | 新增 `scripts/generate-llms-full.ts`、`scripts/generate-llms-full.test.ts`、`public/llms-full.txt`，並接入 `prebuild` | `npm run generate:llms-full` passed；`npm run build` passed；`npx tsc --noEmit` passed；`npm test` passed | `581b8aa` |

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

### 本季 Top 5（2026-06 執行優先序）

1. **STEM-P1** 每集結尾開放提問（`reflectionPrompt`）
2. **Growth-P1** 單集頁訂閱 CTA 上移（主按鈕下方）
3. **Growth-P1** 首頁可見訂閱入口（Header／Hero → `#connect`）
4. **Growth-P2** 隱私政策頁（analytics 前置）
5. **STEM-P1** 完播／重訪本機量測驗證

> 分享鈕、平台排序、訂閱文案、viewport 縮放、sitemap 擴充等已上線，見 Completed；不再佔 Top 5 名額。

---

### STEM-P1 — 互動故事（1–2 個月）

目標：不重做架構，在現有故事頁加輕互動，驗證孩子是否更願回訪。

#### ~~故事頁點按熱點（tap-to-explore）~~　`STEM-P1 · M · 插畫座標`　〔stem+eng〕 — **已移除（2026-06）**：虛線提示體驗不佳，待重新設計後再評估。`0d77d7f`

#### 每集結尾開放式「小提問」　`STEM-P1 · S · 文案`　〔stem+content〕
詳情或播放結束畫面加一句不計分提問（例：「你覺得消防車為什麼是紅色的？」）。`data/stories.ts` 加 `reflectionPrompt`；無標準答案。依據：STEM 核心是發問與學習主導權。

#### 互動正向回饋（音效／星星動畫）　`STEM-P1 · S · 收藏／提問`　〔stem+eng〕
收藏等互動：溫和音效 + 小星星動畫（重用 `lib/sfx.ts`）。`prefers-reduced-motion` 可關動畫保留音效。

#### 互動留存簡易量測（本機 + 可選 analytics）　`STEM-P1 · S · reflection 上線`　〔stem+ceo〕
先記錄：同集重訪、完播次數（localStorage 或日後 analytics）；確認互動是否提升回訪再談收費。

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

#### 家長簡易儀表板　`STEM-P3 · M · localStorage 或帳號決策`　〔stem+design〕
用星星／笑臉呈現「聽了哪幾集、玩了什麼、解鎖了幾台車」，不做成績單。可先讀現有收藏／繼續播放／遊戲 best 分／圖鑑解鎖（localStorage）。

#### 家長閘門（parent gate）　`STEM-P3 · S · 付費／設定頁`　〔stem+eng〕
設定、未來付費頁前簡單算術題，防孩子誤觸（對齊 Sago Mini）。

#### 每集「家長共讀指引」　`STEM-P3 · S · P2 parentGuide 上線`　〔stem+content〕
**依賴 P2 合併欄位 `parentGuide`**（見 Growth-P2 同名任務）。P3 階段僅評估：是否在儀表板摘要顯示、是否連結列印物；不再另建 `parentNote`。

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
| **P1** 訂閱轉換 + 分享 | 「沒看到訂閱」消失、可被轉發 | 單集訂閱 CTA 上移 · 首頁訂閱入口 · ~~ConnectHub 文案/排序~~ · ~~每集分享鈕~~ · 試聽橋接 · 入門三集 · 空狀態 · 錨點導覽 |
| **P2** 信任/合規 + 內容 | 兒童產品權重、內容變深 | 隱私頁 → analytics · **同步→生圖通知** · 主持人信任區 · 真實插畫 · 家長共讀指引（`parentGuide`）· 新集通知說明 · 主題頁 SEO · 音檔壓縮 · ~~縮放~~/觸控/塗鴉 |
| **P3** 可靠/工程/可選 | 不掛、可回歸、加分 | 監控 · SW · E2E · ESLint · **Game Kit 0–1** · 四款 pixel 精進 · 角色圖鑑 · 大圖單欄 |
| **STEM-P1→P4** 互動×STEM×商業 | 差異化與變現 | 見上表；**當務之急：結尾提問 + 完播量測** |

**相依鏈（務必照序）：** 正式網域 → sitemap/robots + JSON-LD → 隱私頁（先於 analytics）→ analytics。

**已備齊（勿重做）：** 故事牆、全螢幕播放器、每集落地頁 + **每集 OG 圖**（`lib/story-metadata.ts`）、**每集分享鈕**（`ShareButton`）、`/topic` 與車種 SEO 頁、RSS `/feed.xml`、`ageRange`、PWA／收藏／繼續收聽、ConnectHub（Spotify／Apple 優先 + 訂閱文案）、相關推薦、**`/games` 遊樂園**（車車大冒險／繽紛方塊／車車卡丁車／海盜卡丁車大賽）、`/legal` 與版權合規、逐字字幕管線、角色定裝照名冊、Apple 15 分鐘同步、**viewport 開放縮放**。

**待決策（實作前定）：** ① 自訂網域最終選擇（`chechepark.tw` / `checheland.tw` / 其他）— **基建已就緒**（`NEXT_PUBLIC_SITE_URL` + `CANONICAL_SITE_URL` fallback，P0 ✅）；② analytics 工具（Vercel Analytics 省事 / Plausible 無 cookie / 不做）③ ~~縮放（鎖 vs 家長大字模式）~~ → **已決：開放縮放**（`app/layout.tsx`，P2 ✅）④ 角色圖鑑與親子提示是否現在做（需 Bonbon & 馬米 文案）⑤ **現有 4 款遊樂園遊戲與 STEM 原則** — 見下方「產品決策」⑥ **兒童拍照分享** — 是否做、如何去識別化；跨裝置圖鑑是否需帳號與家長同意（見 [RESEARCH.md](./RESEARCH.md) 風險段）。

### 產品決策：現有遊樂園 vs STEM「不計時、不競爭」

現有 4 款遊戲（車車大冒險、繽紛方塊、車車卡丁車、海盜卡丁車大賽）中，block-drop／car-adventure 含 **localStorage 最佳分／生命數** 等競賽元素，與 STEM 路線「學齡前避免計時與競爭計分」不完全一致。

**建議方向（擇一或混合，實作 STEM-P2 前定案）：**

| 選項 | 說明 |
|------|------|
| **A. 分層** | 現有 4 款保留為「遊樂園經典區」；STEM-P2 新模組嚴守無計時／無排行榜 checklist |
| **B. 漸進淡化** | 保留 best 分顯示但移除生命／Game Over 壓力；大冒險改為無限續關或探索模式 |
| **C. 雙模式** | 每款加「輕鬆玩」（無分數）／「挑戰玩」（可選，預設輕鬆） |

**新遊戲預設：** 無計時、無排行榜、可隨時離開（見 STEM-P2 設計紀律）。舊遊戲是否改版依上表決策後排入 P2 或 P3。**市售 pixel 精進**（Game Kit、三星、高分）見 [遊樂園精進](#遊樂園精進game-kit--市售-pixel-品質)——建議以**兒童模式預設**保留 STEM 調性。

---

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
更新 `DESIGN.md`：`--ink-soft` → `#7a7268`、背景改 `.site-backdrop` + `.site-root`、StoryFilter 塗鴉現況。**待補：** viewport 段落改為「已開放縮放」（實作見 `app/layout.tsx`）。設計文件漂移時改版易回到舊 token。實作見 `app/globals.css`。

### ~~首屏價值主張與資訊架構精簡~~　`P0 · S–M · 無`　〔design+ceo〕 ✅
新訪客需 3 秒內懂「這不是一般 podcast 嵌入頁，是互動繪本」。**已做：** 標頭三行 tagline + 合作/許願/留言圓鈕（見 Completed）。**剩餘：** 檢視區塊順序（Header → LatestHero → FavoritesSection → StoryFilter），避免「最新集」與列表長期重複同一集；副標清楚傳達「給誰聽、睡前幾分鐘」。

---

## P1 — 訂閱轉換 + 分享導流

### 單集頁訂閱 CTA 上移　`P1 · S · 無`　〔design〕
`/story/[slug]` 在「看圖聽故事」主按鈕下方加次要區「在 Spotify／Apple 聽完整版並訂閱」，連 `ConnectHub` 平台連結（目前 `PlatformLinks` 在大綱之後）。從社群進單集的人不必滑到底才轉換（goodwill：先給要的、再要訂閱）。可先只做文案 + 連結。

### 首頁可見的訂閱入口　`P1 · S · 無`　〔eng〕
`SiteHeader`／`LatestHero` 區附小型訂閱入口（連 `#connect`）。平台連結已設定（`lib/platforms.ts` 含 Apple/Spotify/KKBOX/YouTube）但只在頁尾 → 首屏看不到被誤判「沒有訂閱」。

### ~~ConnectHub 訂閱文案與平台排序~~　`P1 · S · 無`　〔growth〕 ✅
頁尾「訂閱收聽」已加「訂閱後，新集會自動出現在你的 Podcast App」；`lib/platforms.ts` 陣列序為 **Spotify → Apple → KKBOX → YouTube**。`components/ConnectHub.tsx`。SoundOn／RSS 已移除，勿加回。

### ~~每集分享鈕（複製連結 / LINE）~~　`P1 · S · 網域`　〔growth〕 ✅
單集頁 `ShareButton`：複製連結 + LINE 分享（`lib/share-story.ts` 組 URL）；可插 `leading` 放收藏鈕。OG 預覽圖已備齊（`lib/story-metadata.ts`）。B 戰場每則貼文固定連單集。

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

### 隱私政策頁（analytics 前置）　`P2 · S · analytics 決策`　〔ceo〕
新增 `/privacy`（或擴充 `/legal` + 隱私段）：說明是否收集資料、localStorage 用途、analytics 方案、家長聯絡。**兒童產品一旦加 analytics，個資合規（COPPA/GDPR-K）即法律問題**，順序上必須先於量測。footer 加連結。**`/legal` 已上線，可在此基礎擴充隱私專章。**

### Analytics：平台點擊分析　`P2 · S–M · 隱私頁`　〔ceo+growth〕
追蹤「哪集詳情頁 → 點了哪個收聽平台」（`ConnectHub`／`PlatformLinks` 外連加事件，必要時 UTM），對照 Spotify／Apple 後台完聽率與訂閱來源。下一集選題依數據而非猜測。無 cookie 方案優先（隱私）。

### 主持人信任區（Bonbon & 馬米）　`P2 · S · 照片+文案`　〔growth〕
關於頁或首頁下半加主持人小卡：照片、各一句話、節目理念（為什麼做親子車車故事）。熱門節目靠人格溫度；B 置頂貼可連同一區。家長會問「誰做的、適合我家孩子嗎」。`app/about/page.tsx`。

### 替換真實多頁插畫　`P2 · M · 授權插畫`　〔growth〕
各集 `public/stories/<slug>/` 佔位圖換成官方插畫，視需要提高 `pageCount`。真實繪本強化「看圖聽故事」睡前儀式感。`pageCount` 與 `01.jpg`～`NN.jpg` 對齊；一圖多句時 `captions` 可多於 `pageCount`（播放器重複封面）。

### 每集「家長共讀指引」（合併欄位）　`P2 · S · 文案`　〔content+design+stem〕
**單一資料欄 `parentGuide`**（取代分散的 `parentNote` 構想）：詳情頁大綱下可選區塊，含 ①「這集可以聊什麼」2–3 句 ② 1–2 個可延伸到現實的提問／小活動（對標睡前共讀、Circle Round show notes）。可與 JSON-LD `description` 共用摘要句。**STEM-P3「家長共讀指引」與此為同一任務**，P3 僅加儀表板呈現或列印物連結，不再新增第二欄位。

### 字幕人名校對　`P2 · S/集 · 無`　〔content〕
EP1–7 已用 `large-v3` 轉錄 + 自動簡轉繁（`data/subtitles/*.json`）。**剩**：校對品牌/人名誤聽——Bonbon→寶寶、馬米→媽咪等（Whisper 無從得知），直接改側車 JSON。屬資料校對、非工程。

### 新集通知路徑（家長向白話說明）　`P2 · S · 無`　〔growth〕
訂閱區簡短說明「如何訂閱／用 App 收新集」。RSS 技術面已有，家長多不熟 RSS，需白話引導。`ConnectHub` 加一兩句 FAQ 或連關於頁錨點。

### SEO：主題與系列頁擴充　`P2 · S–M · 無`　〔growth〕
延續 `/topic/[tag]`，每主題補一句家長向導語（非僅列表）、補站內連結結構。家長依「勇氣、睡前、安全」搜尋，主題頁是長尾入口。`generateStaticParams` 與 metadata 已具備。

### 壓縮 podcast 音檔　`P2 · S · 無`　〔content〕
ffmpeg 將每集 `audio.mp3` 壓到 mono 128kbps、目標 < 5MB（現每集 5–10MB，總 50MB+）。睡前=手機弱網，載入慢。指令見 README；壓後本機聽確認音質再覆蓋。

### ~~家長放大閱讀（viewport 縮放）~~　`P2 · S · 產品決策`　〔design〕 ✅
**已決並實作：** `app/layout.tsx` 移除 `maximumScale`／`userScalable: false`，開放 pinch-zoom，家長共讀可放大文字／插圖（WCAG 1.4.4）。**剩餘（可選）：** 實機驗證 3–5 歲誤觸縮放是否影響操作；若困擾再評估「大字模式」而非重新鎖縮放。`DESIGN.md` viewport 段落待同步為「已開放縮放」。

### 篩選 chip 觸控與鍵盤順序　`P2 · S · 無`　〔design〕
實機確認車種 chip 觸控區 ≥ 44×44px；Tab 順序：主 CTA → chip 列 → 第一張故事卡。兒童/家長多觸控，鍵盤使用者需可「選車種 → 開第一集」。`StoryFilter` 已用 `<button>`，`globals.css` 有 `:focus-visible`。

### StoryFilter 區塊塗鴉一致性　`P2 · S · DESIGN.md`　〔design〕
決定「依車車找故事」區補 1–2 個 `Doodle`（與 Header 呼應）或刻意留白，寫入 DESIGN.md 並實作一致。中段全無裝飾時，全站上下塗鴉多、中間素，像兩套設計拼貼。

---

## 車車宇宙樂園地圖（R0）　`feature · M · /adventures`　〔eng+design〕

> 鳥瞰群島園區地圖：資料驅動 zones、跨海橋、pan/zoom/fly-to 鏡頭、點島開內容或敬請期待 sheet。R0 用 emoji/形狀佔位，精緻美術留 R1。獨立路由 `/adventures`，**不動** `app/page.tsx` 與 `components/landing/*`。

- [x] `data/universe-zones.ts` — zones 資料模型（4 島）+ `ZONE_STATUS_META`（單一來源）
- [x] `data/universe-zones.test.ts` — id 唯一／座標範圍／open 島可達／building 進度／subSegmentIds 合法／bridgeFrom 存在
- [x] `lib/universe-map.ts` — `resolveUniverseMap()`（島 px、Bézier 橋、viewBox）+ `getCarParkLinks()`（衍生自 `LANDING_SEGMENTS`）
- [x] `lib/universe-map.test.ts` — 三橋／path 起始／viewBox 涵蓋／dashed 規則／car-park 連結一致
- [x] `components/universe/useMapCamera.ts` — Pointer Events pan/pinch/wheel、clamp、flyTo、reduced-motion 瞬跳
- [x] `components/universe/UniverseMap.tsx` + `.module.css` — 可拖曳縮放舞台（SVG 海/沙/草固定淺色 + 橋）
- [x] `components/universe/ZoneIsland.tsx` + `.module.css` — HTML button 佔位島（landmark + 名稱 + 狀態 pill）
- [x] `components/universe/MapControls.tsx` + `.module.css` — 回大門 / 縮放 +-
- [x] `components/universe/ZoneSheet.tsx` + `.module.css` — carPark 入口清單 / stub 敬請期待（mailto 通知 R0 stub）
- [x] `app/adventures/page.tsx` — 新路由 + metadata + sr-only 島嶼清單
- [x] verify：`npm run test`（244）+ `npm run build` 綠燈；`git diff` 確認 landing 未動 — `ee04e3f` · a11y/timer cleanup `acff285`

**R0 ship（可發現性）：**

- [x] `app/sitemap.ts` — `/adventures` 納入站點地圖
- [x] `SiteNavBar` — 選單「宇宙地圖」入口
- [x] `e2e/smoke.spec.ts` — 地圖渲染 + 點島開 sheet smoke
- [x] `lib/games/catalog.test.ts` — sitemap 含 `/adventures`

**changelog：** R0 樂園地圖系統 + zones 資料模型上線於 `/adventures`（資料驅動四島、Bézier 跨海橋、手刻 pan/zoom/fly-to、ZoneSheet stub）；car-park 子連結衍生自 `LANDING_SEGMENTS` 單一資料源。R0 ship：`ee04e3f` · a11y `acff285` · 可發現性 + 點島修復 `a676713`。

---

## 車車宇宙樂園地圖（R1）　`feature · M · /adventures`　〔eng+design〕

> R0 emoji 佔位 → 黏土風 SVG 地標 + 各島底座配色。仍不動 `app/page.tsx` 與 `components/landing/*`。

- [x] `ZoneLandmarkArt.tsx` — 四島黏土 SVG（摩天輪／恐龍／救援車／海浪火箭）
- [x] `ZoneIsland` + `ZoneSheet` — 接入 SVG 地標
- [x] `ZONE_TERRAIN` — 各島沙／草底座色（UniverseMap SVG）
- [x] `ZoneLandmarkArt.test.ts` + `universe-zones` terrain 測試
- [x] verify：`npm run test`（247）+ `npm run build` + e2e 車車宇宙 smoke

**changelog：** R1 黏土 SVG 地標取代 emoji；各島 `ZONE_TERRAIN` 底座配色 `62f9b35`。

---

## 車車宇宙樂園地圖（R2）　`feature · M · /adventures`　〔eng+design〕

> OG 分享圖 · 靜態 artTile · 視差雲層。仍不動 `app/page.tsx` 與 `components/landing/*`。

- [x] `app/adventures/opengraph-image.tsx` + `lib/universe/og.tsx`
- [x] `public/adventures/zones/*.svg` + `ZoneLandmark`（artTile 優先，fallback inline SVG）
- [x] `UniverseMapParallax` 遠景雲／丘陵視差（reduced-motion 同步鏡頭）
- [x] verify：`npm run test`（255）+ `npm run build` + e2e 車車宇宙 smoke

**changelog：** R2 OG 分享圖 + 靜態 artTile + 視差雲層 `869436c`。

---

## 車車宇宙樂園地圖（R0.5 去貼紙化 + 黏土光影）　`style · S · /adventures`　〔design+eng〕

> 純 code 視覺升級，不動 raster／資料層／互動：把「白框 app icon 浮在扁平橢圓」拉到「地標站在島上、有黏土光影」。地標圖維持 placeholder（整島 tile 留 R1）。

- [x] `ZoneIsland.module.css` — 移除 4px 白框，改柔和黏土底座（上緣高光／下緣內陰影／接地投影）+ 地標 drop-shadow；名稱改木牌風（固定色）
- [x] `UniverseMap.tsx` — `<defs>` 海漸層／黏土光影／模糊 filter；海底 rect 改 `url(#seaGrad)`；每島五層（接地投影＋泡沫圈＋沙＋草＋黏土光影覆蓋）
- [x] `MapControls.tsx` + `.module.css` — reset 由 🏠 emoji 改自繪 SVG home icon（aria-label 不變）；`.btn svg { display:block }`
- [x] `UniverseMapParallax.tsx` — 雲朵主體加實＋多顆小橢圓蓬鬆化；遠景丘陵略降避免髒斑
- [x] verify：`npm test` + `npm run build` + `npx tsc --noEmit`；場景色日夜皆不反轉；資料層／互動／tile 未動

**changelog：** R0.5 去貼紙化 + 黏土光影 `5d433d2`。

---

## 車車宇宙樂園地圖（R1 起手式：car-park 黃金樣本）　`asset · M · /adventures`　〔design〕

> 對照美術聖經 §7 產出 hero 島整島 diorama 真 RGBA 樣本，鎖定後當其餘三島 style reference；本輪純資產，未接程式。

- [x] 產圖：AI claymation diorama（magenta 純色平背，便於乾淨 chroma-key）
- [x] 去背：PIL chroma-key + despill → 真 alpha（`hasAlpha: yes`，去 rembg 吃陰影風險）
- [x] 排版：trim → `anchorUV [0.5,0.84]`（沙岸底中心）→ 264:260 圖框 box → 後製右下接地陰影(#6b5a48)
- [x] 輸出三階：`car-park.png` 264×260 / `@2x` 528×520 / `@3x` 792×780（master 5× 先大後縮 LANCZOS）
- [x] §7 八項全過；alpha 健檢（transparent/opaque/semi 合理、核心無非預期破洞）
- [x] sidecar `car-park.tile.json` 鎖 stageSize/anchorUV/pipeline；實機疊圖預覽驗證通過（截圖）
- [x] **美術聖經 v2**：鎖 car-park 為最高權威；相機改 3/4 高視角輕透視、燈光改柔和均勻光（取代 v1 正交50°/硬光長投影）；prompt/檢查表/Blender 全面對齊黃金樣本
- [x] 其餘三島（dino/rescue/ocean）以 car-park.png 為 reference + v2 prompt + 洋紅底產圖，同一 PIL 管線出三階；§7 並排檢查 + alpha 健檢通過
- [x] **R1 接線**：`zoneArtTilePath()→.png`、四島 `ZONE_ART_TILES` 改 island + `anchorUV`、`ZoneIsland` island 模式（anchorUV 對齊/stageSize 鋪島/木牌+pill/hover）、`UniverseMap` 跳過 island 島 SVG 沙草；契約測試同步更新
- [x] 驗證：`tsc`/`vitest 258`/`build` 全綠；實機桌機+手機截圖四島黏土一致
- [ ] （未來）逐島 building/coming/planned 狀態美術 overlay（v2 §6）；主島 idle 動態（摩天輪轉/車車跑）

---

## 車車宇宙樂園地圖（v5 收尾：資產待產）　`asset · M · /adventures`　〔design〕

> 2026-07 設計審查結論：工程管線與接點已就緒，剩以下資產需生圖管線（`OPENAI_API_KEY`）產出後點亮。程式端 v5 收尾（黏土日月接線／去向量月光線／夜罩弱化／夜海惰性載入／視差遠島撤出底部／外連開窗修復）已完成。

- [ ] **car-park motionParts 零件 PNG**（最高優先）：`car-park.wheel.png`（摩天輪，pivot 輪轂）+ `car-park.flags.png`（彩旗）——§12.1 鐵律：base 已烘焙可動部位，**base 必須一併重出**否則疊影；到位後 `ZONE_MOTION` 對應零件改 `enabled: true`
- [ ] **海面 `sea@2x.png` / `sea-night@2x.png`**（§14.1 規格要求）：到位後海面改 CSS `image-set()` 平鋪（SVG `<pattern><image>` 吃不了 srcset），順帶天然懶載
- [ ] **漫遊車 rear 視圖**：`xiao-hong.rear.png`、`duo-duo.rear.png`（`npm run generate:roamer-assets`），到位後 `MAP_ROAMERS` 補 `sprites:{front,rear}`
- [ ] **planned 狀態美術**（ocean 島）：霧色未成形地基 + 「?」告示浮標（v2 §6），取代純降彩度

## 車車宇宙樂園地圖（R-joy 2/3：迪士尼樂園感）　`asset · M · /adventures`　〔design〕

> R-joy 1（純程式：weenie 主島放大、進場降落、點島慶祝+音效、招牌羅盤、鏡頭露天空、舞台圓角）已完成。
> R-joy 2/3 **純程式部分已完成**：`MAP_DECOR` 密度包 11 件（帆船/浮標/魚/鳥/螢火）、開放橋黏土棧道三層描邊、`NightFireworks` 夜間煙火光效、開放島夜間點燈。剩餘為生圖管線資產：

- [ ] **R-joy 2 資產**：黏土填充 PNG（鯨魚噴水／燈塔小嶼／漂浮氣球）取代或補充 SVG decor；島際渡輪 roamer（走 `MAP_ROAMERS` stage path，需新角色 sprite）；橋面彩旗串
- [ ] **R-joy 3 資產**：四島 `srcNight` 點燈版（§12.5 契約已備）；黏土煙火 sprite 循環（§12.2，12–24 幀，取代 CSS 光效粒子）；月光波紋烘進 `sea-night.png`

**changelog：** car-park 黃金樣本 + Art Bible v2 + R1 四島整島黏土化（待補 commit hash）。

---

## 車車宇宙樂園地圖（Art Bible v1）　`feature · S · /adventures`　〔eng+design〕

> 把各自獨立產出的島統一成同一世界：相機／光／材質／色票／比例定死，並建立 R1→整島 diorama 的資產對接契約。本階段純文件 + 資料層契約，**不生美術資產、不改視覺**。

- [x] `docs/UNIVERSE-ART-BIBLE.md` — 相機正交俯角 50°、左上暖光右下陰影、霧面黏土、環境色票、小紅賽車比例尺、狀態變體、AI／Blender 管線、交付檢查表（D1 路徑採 `/adventures/zones/`）
- [x] `lib/universe/zone-art-tile.ts` — `ZoneArtTile` 契約（`mode: landmark|island`、`anchor`、`stageSize`）+ `ZONE_ART_TILES` 預設全島 landmark（D2，不改視覺）
- [x] `lib/universe/zone-art-tile.test.ts` — 契約測試（src 對齊路徑、現況 landmark/center、island 必附 stageSize）
- [x] verify：`npm run test` + `npm run build`；`git diff` 確認 landing/page 未動

**待後續（未做）：** ~~改 `next/image` @2x/@3x~~（已完成：`getZoneArtSrcSet`）。色票若要回頭對齊 SVG fallback 為獨立小任務（見 Art Bible §4 D3）。

**changelog：** Art Bible v1 + tile 詮釋資料契約（待補 commit hash）。

---

## P3 — 可靠 / 工程 / 可選

### 錯誤／上線監控　`P3 · S · 無`　〔ceo〕
接輕量 client error 上報（Sentry free / Vercel）+ uptime（UptimeRobot），至少涵蓋首頁與一個播放頁。站掛了、播放器某機型崩了要有人知道。純 SSG，client error 為主要風險（播放器、iOS 合成破圖回歸）。

### Service Worker 離線快取　`P3 · M · 無`　〔eng〕
為 PWA 加 SW，快取已播放過的音檔與插圖。已有 `manifest.json` 但無離線能力；睡前弱網常見。評估 `next-pwa` 或自寫最小 SW；注意 MP3 快取容量與更新策略。

### Playwright E2E smoke　`P3 · M · 無`　〔eng〕
首頁 → 詳情 → 播放頁 smoke test。目前只有單元測試，路由與播放器需回歸保護。播放在 headless 跳過實際 decode，至少驗證渲染與連結。`e2e/` 已設定。

### ESLint CI 設定　`P3 · S · 無`　〔eng〕
`next lint` 改非互動設定（`eslint.config.mjs` + `@next/eslint-plugin-next`）以接 CI。目前會跳首次設定精靈，無法在 CI 用。

### 車車角色圖鑑（新頁 `/characters`）　`P3 · M · 角色文案`　〔ceo+research〕
用既有資料做角色小圖鑑（安安救護車、東東挖土機、鈴鈴清潔車、小紅賽車、小飛無人機、未來電動車…，角色名已在標題）：黏土縮圖 + 一句個性 + 連到該集；**疊加完成度解鎖**（未聽／未完成 craft 的車灰階或問號，見 STEM-P3 車庫養成）。新 SEO 落地頁 + 「找下一集」入口。重用 `VehicleClayIcon`、`getVehicleCoverPath()`、`allVehicles()`、`getStoriesByVehicle()`，仿 `/topic` 結構。
**素材進度：** 已有 6 位 canonical 定裝照於 `public/characters/`（安安救護車／小紅賽車／怪獸卡車／東東挖土機／鈴鈴清潔車／恐龍車多多），登記於 `data/characters.json`（含別名／車種／英文外觀）——可直接當圖鑑縮圖與內部跨集一致來源；剩「一句個性」中文文案待 Bonbon & 馬米。

### 首頁列表「大圖單欄」模式（可選）　`P3 · M · 年齡定位`　〔design〕
若主攻 3–5 歲，評估故事牆改大封面單欄卡（少文字、大圖磚）或僅窄螢幕啟用。對標 YouTube Kids；現左圖右文在 5+ 較合適。需使用者研究，非必做。`StoryCard`。

### 成長與商業（依階段）　`P3 · L · 營運階段`　〔growth〕
逐步把官網從「連結集合」變「成長與變現中樞」：贊助 landing、周邊／活動、多語等。親子 IP 可先不做電商。**訂閱與 freemium 細節見 STEM-P4，勿在 P1 互動驗證前上付費牆。**

### 同步後生圖通知（GitHub Issue）　`P2 · S · 新集偵測`　〔eng+ops〕
**缺口：** GHA 同步新集後只 push MVP（`pageCount: 1`），無人被告知要跑 `npm run illustrate`。在 [`.github/workflows/sync-apple-podcast.yml`](.github/workflows/sync-apple-podcast.yml) 偵測新 `ep-N` 後，用 `gh issue create` 開單（標籤 `illustration` + `sync`），內附 checklist：校對字幕 → segment → 生圖 → 審 `contact.html` → `--approve` → push。Issue 範本見下方 [營運管線](#營運管線soundon--apple-同步--生圖)。

### 同步 commit 訊息帶生圖提示　`P2 · S · 無`　〔eng+ops〕
GHA commit 由 `chore: sync Apple Podcast from RSS` 改為多行 body，列出本輪新 slug、`data/subtitles/<slug>.json` 狀態、下一行指令 `npm run illustrate -- ep-N`。零依賴、與 Issue 並行。

### 生圖完成推播（LINE Notify／Discord）　`P2 · S · Issue 上線`　〔eng+ops〕
repo secret 存 `LINE_NOTIFY_TOKEN` 或 `DISCORD_WEBHOOK_URL`；同步偵測新集後 POST 簡訊（slug、MVP 已上線、待生圖指令、Issue 連結）。給 Bonbon／馬米手機即時提醒；第二期加在 Issue 之後。

### 生圖佇列 `data/illustration-queue.json`　`P3 · S · 通知基建`　〔eng+ops〕
`sync-apple-podcast.ts` 新集寫入 `{ slug, ep, syncedAt, subtitleReady, status: awaiting-illustrate }`；`illustrate --approve` 改 `approved` 或移除。Issue／webhook／未來 Studio 儀表板共用單一真相來源。

### Game Kit 歷史路線（Phase 0–8） ✅

Phase 0–8 的探索已完成並在 2026-06-25 收斂。現行架構只保留四款已出貨遊戲真正使用的能力：

- `lib/gamekit/react/`：React hooks 與觸控控制
- `lib/gamekit/runtime/`：loop、輸入、渲染、音訊、juice、程序圖塊
- `lib/gamekit/progress/`：設定、存檔 migration、獎牌與 session
- `lib/gamekit/games/`：大冒險關卡與 Candy Kart bridge

舊 Phase scaffolding（state machine、scene、pool、abilities、tilemap、Tiled loader、sprite adapter）已移除。歷史變更見 [CHANGELOG.md](./CHANGELOG.md)，現行規範見 [ART-BIBLE.md](./lib/gamekit/ART-BIBLE.md)。

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

## 遊樂園精進：Game Kit × 市售 pixel 品質

> 完整研究與驗收表：[RESEARCH.md — 四款小遊戲精進](./RESEARCH.md#2026-06-09四款小遊戲精進方案對標可市售-pixel-game)。現況元件：`BlockDropGame`、`CarPlatformer`、`/games/kart`、`/games/pirate-kart`；目錄 `data/games.ts`。
>
> **與 STEM 路線關係**：精進版屬「遊樂園經典區」商業級升級；新 STEM 沙盒仍守無計時／無排行榜。每款加**兒童模式**（預設）＋可選挑戰模式，化解年齡與競賽張力。

### 市售級品質門檻（十項，每款必達）

像素完美 60fps · 統一調色盤/點陣字 · 多態精靈 · BGM+SFX+混音 · juice · 完整外框 · 三星/解鎖/存檔 · 鍵盤+觸控+手把 · a11y · 工程品質（固定步進/池/預載）。

### Game Kit 現行四層（`lib/gamekit/`）

| 目錄 | 職責 |
|------|------|
| `react/` | hooks、觸控控制、最佳分數、可見性暫停 |
| `runtime/` | 固定步進、輸入、像素渲染、音訊、juice、圖塊 |
| `progress/` | 存檔、設定、獎牌、車庫、session |
| `games/` | 遊戲專屬關卡與 iframe bridge |

### 四款對照（slug → 精進重點）

| slug | 現況 | 內部解析度（建議） | 精進核心 |
|------|------|-------------------|----------|
| `car-adventure` | Game Kit 6 關 | 320×180 | 關卡內容、boss ❄️ |
| `block-drop` | Game Kit 方塊 | 200×360 | 多模式、消行 juice ❄️ |
| `candy-match` | DOM/SVG 消除 | — | 關卡內容與任務變化 ❄️ |
| `candy-kart` | Godot iframe | — | 操控與賽道調校 ❄️ |

### 跨遊戲 IP（Phase 6）

共用像素卡司 · 跨遊戲星星→車庫解鎖 · `/games` 世界地圖 · podcast 貼紙簿（聽集+玩遊戲）。

### 資產與工具

| 用途 | 工具 |
|------|------|
| 像素美術 | Aseprite；佔位 Kenney CC0 |
| 關卡 | Tiled → JSON（大冒險） |
| SFX | jsfxr / 短 ogg |
| BGM | BeepBox / FamiStudio |
| 點陣字 | pixel TTF + pixelated 或 bitmap font |
| 可選底層 | kontra.js |

### 瓶頸（誠實）

美術人力是市售與否最大門檻；CC0 先跑通管線。四款全商業級 = 數月工程，**勿一次開太大**。

### 市售驗收 checklist（每款發版前）

見 [RESEARCH §7](./RESEARCH.md#7-市售級驗收檢查表每款) 十項全勾。

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
| 13 | `npm test` + `npm run build` | — | 有變更才跑 |
| 14 | Commit + push `main` | Vercel 部署 MVP | 見下方 commit 範圍 |
| 15 | **生圖通知** | Issue／webhook | **待實作**（見 P2 條目） |

**GHA 目前 `git add` 範圍：** `data/apple-synced.json`、`data/apple-sync-state.json`、`data/browse-index.json`、`public/stories/`、`data/subtitles/`。

**GHA 不會碰：** `public/.illustrate-staging/`、`data/apple-sync.defaults.json`（approve 寫入 overrides）、`data/characters.json`、`data/scenes/` — 生圖產物需**人工 commit**。

### Phase 2 — 同步後人工（生圖前）

| # | 項目 | 負責 |
|---|------|------|
| 16 | 收到通知（Issue／LINE） | 維護者 |
| 17 | 抽查站上 MVP | `/story/ep-N` 能播、封面正確 |
| 18 | 字幕校對 + `--mark` | `npm run proofread:subtitles -- ep-N`（[SUBTITLE-PROOFREAD.md](./docs/SUBTITLE-PROOFREAD.md)） |
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
| 30 | Threads／IG 貼文（單集 URL + OG） |
| 31 | 平台訂閱提醒 |
| 32 | 家長向新集說明（見 P2「新集通知路徑」） |

### 端到端時序（一集新故事）

```
T+0     SoundOn 上架
T+15m   外部 cron → GHA sync
T+20m   ep-N MVP 上線（1 封面 + 字幕草稿）
T+20m   【待建】Issue + LINE：「請生圖 ep-N」
T+1d    校對字幕 → illustrate → 審圖 → approve
T+1d    push 完整繪本版
T+2d    社群貼文（B 戰場）
```

### 生圖通知方案（實作優先序）

| 期 | 方案 | 說明 |
|----|------|------|
| **一期** | D commit 訊息強化 + A GitHub Issue | 零／低依賴，可追蹤 checklist |
| **二期** | B LINE／Discord webhook | 手機即時推播 |
| **三期** | C `illustration-queue.json` + Studio 顯示 | 機器可讀佇列 |

**GitHub Issue 範本（一期）：**

```markdown
## 新集待生圖：ep-N

- 同步：{ISO 時間} · 觸發：Apple RSS（SoundOn）
- 狀態：MVP 已上線（pageCount=1），待多頁插圖

### Checklist
- [ ] `npm run proofread:subtitles -- ep-N [--fix]` → 人工修 → `--mark`
- [ ] npm run illustrate -- ep-N --segment-only
- [ ] OPENAI_API_KEY=... npm run illustrate -- ep-N
- [ ] 審 public/.illustrate-staging/ep-N/contact.html
- [ ] npm run illustrate -- ep-N --approve
- [ ] npm run sync:apple && npm run build → commit push
```

### 現況缺口（勿忘）

- 同步與 `illustrate` **完全脫鉤**；腳本僅 log「請視需要補 overrides」。
- 無 `illustrationStatus` 欄位；`ep-8`（1 頁）vs `ep-9`（8 頁）即典型落差。
- CI **不放** `OPENAI_API_KEY`；生圖永遠本機手動 + 人工審圖（設計如此）。

---

## 延後（現階段不優先）

| 項目 | 原因 |
|------|------|
| Email 電子報 / 會員 | 平台 App 已有新集通知；先用 Threads 導流；**正式會員制見 STEM-P4** |
| 著色頁／活動單 PDF | **已納入 STEM-P3 列印物**；P1–P2 前先拉高單集分享與互動留存 |
| 部落格長文 SEO | 初期單集頁 + 平台關鍵字效益較直接 |
| 網站內 RSS 播放器 | 訂閱導向 Spotify／Apple 即可 |
| ~~睡前模式／季節主題皮~~ | **已完成夜晚模式＋跟隨系統**（見 Completed）；季節主題皮仍延後 |
| 全站 redesign／換字體 | 現有手繪風格已具辨識度 |
| 首頁 3 欄 icon 功能介紹 | 違反 AI slop 黑名單，與品牌不符 |
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

## Completed

### ep-17 Apple RSS 同步（Issue #34）　`834b609`
看門狗告警「RSS 有新集未上站」：`sync-apple-podcast` 先前因 CI build 缺 `NEXT_PUBLIC_SITE_URL` 失敗（`cb56f91` 已修）。手動 sync 上架 **ep-17**（噗噗豬好害怕怎麼辦｜漂漂河裡的神祕聲音，MVP `pageCount: 1`）。後續：`npm run illustrate -- ep-17`。

### sync workflow 契約測試（防再發）
`scripts/lib/sync-workflow-contract.test.ts` 鎖定 sync／watchdog workflow 必備步驟與 `NEXT_PUBLIC_SITE_URL`；改 build／site-url／llms 管線時必跑。教訓：非同步功能（如 `generate-llms-full` 防呆）不得假設 Vercel env，CI 無 env 時會 fallback localhost 而阻斷 sync push。

### 修復 sync workflow build 失敗（NEXT_PUBLIC_SITE_URL）
`41af68c` 新增的 `generate-llms-full` 防呆在 CI 上因無 Vercel env 使 siteUrl fallback 成 localhost 而 throw，導致 `Sync Apple Podcast` 的 Production build 失敗（run 28602134470）。修法：workflow build 步驟明確設 `NEXT_PUBLIC_SITE_URL=https://podcast-website-mu.vercel.app`。

### ep-16 字幕校對（proofread --mark）
Whisper 草稿人工校對：`撲撲豬`→`噗噗豬`、`救護車安安`→`安安救護車`、`安安就護車廳了`→`安安救護車呢`、`會淹水`→`會溺水`（開場玩水安全說明）；179 句 `--mark` 完成，illustrate 閘門已解。待 commit。

### 樂園地圖 P1 載入體驗（佔位 + 標籤 + preload）
`ZoneIslandTileArt` 沙草佔位；`tileLabel` 反縮放；`/adventures` preload car-park。`ff762a0`

### 樂園地圖 P0 資產交付（srcset + roamer WebP）
島 `@2x/@3x` srcset；`optimize:roamer-assets`；`<picture>` WebP。`ff762a0`

### 樂園地圖 P2 收尾（動態 sizes + 資產驗證 + 行動 RWD）
`getZoneArtSizes(mapScale)` 減少縮小鏡頭時 @3x overfetch；`npm run verify:zone-art` 四島 1x/@2x/@3x 齊備；行動版 tileLabel／MapControls／map min-height 可讀性微調。

### R-anim 1.5c：漫遊車 map 層級 + 接地影
`MapRoamerLayer`／`RoamerVehicle` 獨立影；y-sort；小紅／多多改走 `map-sea-orbit`（car-park 島不再疊漫遊車）。

### R-anim 3：漫遊小車 → 2.5D 多方向 unit + 深度遮擋
平面 PNG＋scaleX 鏡像 → **面向行進方向的 2.5D unit**。`useRoamerSim` 依 path 切線選 **4 向 sprite**（front/rear × 左右鏡像，遲滯防抖）；**獨立接地陰影**（不隨 bob 浮動、只隨 hop 微縮）；景深縮放 + 過彎 bank；`ZONE_OCCLUDERS` 用同圖 clip-path 露出地標剪影、依 `groundY` vs `baselineY` 做 z-index **深度遮擋**（車鑽到摩天輪後方被擋）。`CAR_PARK_WALKWAY_PATH` 改閉合迴圈、後段繞行地標後方。`RoamerSprites` 契約（rear 回退 front）；`generate-roamer-assets.ts` 擴充 front+rear 雙視圖。
**修補既有資產白底 bug：** 兩台 roamer PNG 殘留不透明近白底（magenta chroma-key 漏抓）→ 新增 `scripts/lib/roamer-alpha.ts` 邊界 flood 去背（保留牙齒／眼白等內部白）、`npm run fix:roamer-alpha` 就地修補、並接入生成管線 postProcess 作保險絲。
**驗證：** `npm test`（322）+ `npm run build`；Playwright 截圖確認去背乾淨、4 向鏡像、接地陰影、摩天輪後方遮擋（roamer z<baseline 時被剪影擋住）。
**待後續：** rear 視圖 PNG 尚需 `npm run generate:roamer-assets` 產出（需 OPENAI_API_KEY）；到位後於 `MAP_ROAMERS` 補 `sprites:{front,rear}` 即點亮真正背面視圖。

### R-anim 1.5b：漫遊小車 2.5D 島上步道（P0）
`IslandRoamerLayer` 掛 `ZoneIsland`；`CAR_PARK_WALKWAY_PATH`；`useRoamerSim`；移除海面 `CharacterRoamerLayer`。
**Completed:** `d89e360`（2026-06-28）

### R-anim 1.5 漫遊者 PNG 資產（小紅賽車 + 恐龍車多多）
`generate-roamer-assets.ts`（magenta chroma-key + sharp 後製）；`public/adventures/roamers/*.png`；`MAP_ROAMERS` enabled（duo-duo `startOffset:0.5`）。
**Completed:** `e471694`（2026-06-28）

### R-anim 1.5：角色漫遊（Q版黏土小車沿道路跑）
`ROAMER_ROUTES`/`MAP_ROAMERS`；`CharacterRoamerLayer` rAF 路徑取樣（直立+scaleX 翻轉）；`?devRoamers=1` 佔位。
**Completed:** `79f8706`（2026-06-28）

### R-anim 1：island tile 渲染器 + motionParts
`ZONE_MOTION` 資料模型、`ZoneMotionPart`/`ZoneMotionLayer` 零件動畫管線；`reduced`/`paused` 串接；enabled 預設關（資產到位再開）。
**Completed:** `c1ff134`（2026-06-28）

### R-anim 2：狀態轉場 + 日夜態
`useZoneTransition`、`StatusOverlay`、`SkyBodies`；螢火 decor；海/雲日夜色調；dev `?devStatus` / `?devMotion=1`。
**Completed:** `91859ef`（2026-06-28）

### R-anim 0：地圖環境動畫層 + MAP_DECOR
純 CSS 環境動態（雲／浪／泡沫／虛線橋／decor）；`MAP_DECOR` 資料層；美術聖經 §12 v3 動畫綁定規格。
**Completed:** `8bdfc02`（2026-06-28）

### SEO 進階三刀（VTT + RSS 標籤 + self canonical）
逐字稿 helper／VTT route／故事頁可索引逐字稿；RSS podcast namespace + transcript + owner/guid；主要頁 self canonical；JSON-LD `timeRequired`。
**Completed:** `029b7e6`（2026-06-28）

### Landing segment 排版 + 膠囊 Nav（2026-07-03）　`e7b6287`
標題改 eyebrow 堆疊、內容區玻璃底、底部 UI 分層（CTA／Dudu／nav pill）；SegmentNav 改膠囊指示條 + 蜜桃玻璃 pill；`.next` 改 chevron 玻璃鈕、768px 以下隱藏。

### Landing 陽光色系 + 引導按鈕 + 頁尾捲動 + 手機排版
landing 專用色票（nav/CTA 分離）；top bar 日出琥珀漸層 + 白字；訂閱反白 pill；hero CTA 橘黃漸層白字；footer 全屏 snap pane + 最後段 next；手機隱藏 .next、CTA 全寬、嘟嘟/進度點分層。
**Completed:** `d6c726f`（2026-06）

### Landing 去暗沉 + top bar 迭代（奶油→木質，後由陽光版取代）
純 CSS 去暗沉：scrim 底部保護式漸層 + text-shadow；`.panel`/footer 改 `var(--bg)`；手機暖色玻璃進度膠囊；top bar 曾試奶油／木質調 + 統一品牌橘 CTA。
**Completed:** `eeeed4f` `7e42ee5`（2026-06）

### Landing 配色調亮
Landing 配色調亮（陽光暖橘 + 淺暖罩），保留日夜主題與 AA。
**Completed:** main（2026-06）

### 主題跟隨系統（日間／夜晚／系統同步）
`ThemeMode` 新增 `system`；預設改為跟隨 `prefers-color-scheme`；`THEME_INIT_SCRIPT` FOUC 防閃同步支援；`ThemeProvider` 監聽系統配色變更；首頁標語旁圖示循環系統→日間→夜晚；睡眠定時器夜晚提示改為固定 `night` 偏好。
**Completed:** `cf50631`（2026-06）

### 遊戲地基工程（星星帳本 × 結算插槽 × Kart 橋接）
`economy` 帳本 v3、`GameResultActions` 與 Kart `postMessage` 橋接。未出貨的能力表、Tiled gate 與 goodnight flag 已在 2026-06-25 清除。ADR `docs/adr/0002-star-economy-ledger.md`。
**Completed:** `3be429e` `8893952` `48643d6` `a606c89`（2026-06）

### 架構重塑第一批（路由薄殼 × Home Registry）
`data/home-sections.ts` registry 驅動首頁；遊戲邏輯與 `reportGameSession` 接線。未啟用的 feature flag framework 已在 2026-06-25 清除；ADR `docs/adr/0001-shell-kernel-architecture.md`。
**Completed:** `dcceca1` `e280a6d` `ddeae8b`（2026-06）

### 移除故事頁插圖點按互動（tap-to-explore）
下架插圖虛線橢圓提示層；保留 `reflectionPrompt`、完播／重訪量測。刪除對應元件、資料與 engagement 量測欄位。
**Completed:** `0d77d7f`（2026-06）

### 收聽平台圖示視覺統一（白底膠囊卡）
四平台等高白底膠囊（`PLATFORM_MARK_TILE` 60px）、2×2 手機 grid；Apple `wide` 徽章隱藏外部 label；Spotify PNG 939×940 驗證 Retina 足夠；HARD-RULES Spotify 白底註記。
**Completed:** `34e0154`（2026-06）

### 首屏 CTA 層級重排 × 睡前模式 × 微動畫系統
主 CTA「▶ 看圖聽最新一集」+ 次 CTA「去遊樂園玩」；受眾定位句上移 SiteHeader；`[data-theme="night"]` token 覆寫 + `ThemeProvider` + FOUC inline script；車種 chips 橫滑單列 + fade；`app/motion.css`（`press-squash`／`pop-in`／`star-burst`／`gentle-float`）；睡眠計時器夜晚模式一次性提示。
**Completed:** `c9fb4ab` `f89fbdd` `f273298` `1d53115` `e69c00d` `66cb4b7`（2026-06）

### Game Kit Phase 0–8 歷史
完成像素渲染、固定步進、輸入、音訊、juice、進度與遊戲外框探索。2026-06-25 依正式使用情況收斂為 `react/`、`runtime/`、`progress/`、`games/` 四層，刪除未出貨 scaffolding；詳見 CHANGELOG 與 `lib/gamekit/ART-BIBLE.md`。
**Completed:** main（2026-06）

### 每集分享鈕 + ConnectHub 訂閱優化
單集頁 `ShareButton`（複製連結、LINE）；收藏鈕可同排 `leading`。ConnectHub「訂閱後，新集會自動出現在你的 Podcast App」；`lib/platforms.ts` Spotify／Apple 優先排序。
**Completed:** main（2026-06）

### Viewport 開放縮放
`app/layout.tsx` 移除鎖縮放，家長可 pinch-zoom 放大共讀內容。
**Completed:** main（2026-06）

### Sitemap 擴充（遊樂園 + 法律頁）
`app/sitemap.ts` 含 `/games`、各遊戲子頁、`/legal`。
**Completed:** main（2026-06）

### 遊樂園小遊戲 hub + 4 款原創遊戲 + 黏土風視覺
`/games` 目錄卡（車車大冒險、繽紛方塊、車車卡丁車、海盜卡丁車大賽）；首頁「去遊樂園玩」入口；卡片黏土風 SVG 縮圖（`GameThumbArt`）。各遊戲：觸控、progress-store 最佳分、`prefers-reduced-motion`、暫停。
**Completed:** main（2026-06）

### 版權合規與 `/legal`
私人 repo 說明、禁止再散布、第三方商標指示性使用、字型 OFL、`THIRD_PARTY_NOTICES.md`、頁尾法律連結。
**Completed:** main（2026-06）

### 產品路線圖文件（互動故事 × 車車 STEM × 商業）
`TODOS.md` 新增 STEM-P1～P4 四階段、三原則、台灣市場定位與一頁總表；README／CHANGELOG 同步。
**Completed:** main（2026-06）

### 逐字即時字幕框架 + EP1–7 自動上字幕（本機 whisper.cpp）
字幕從翻頁解耦：存側車檔 `data/subtitles/<slug>.json`（`lib/subtitles.ts` 載入、播放器依音檔時間顯示、獨立翻頁；無側車則回退舊邏輯）。轉錄核心 `scripts/lib/transcribe-core.ts`（ffmpeg→whisper.cpp、**自動簡轉繁 OpenCC**、濾幻覺鳴謝），CLI `npm run transcribe -- <slug...|--all|--convert>`。Apple 同步下載新集後自動轉錄（有 whisper 才跑，CI/缺模型自動跳過，`SKIP_TRANSCRIBE=1` 可關）。EP1–7 已用 `large-v3` 產繁中字幕（人名校對見 P2）。音檔不外送、零金鑰；`models/` gitignore。
**Completed:** main（2026-06）

### 即時字幕機制 + 字幕對時模式（頁綁定 captionTimes，舊式）
`Story` 加選填 `captionTimes`（每句起始秒數）；播放器有提供時精準換句（插圖同步），未提供回退時長平均切換。`?cue=1` 對時模式邊聽邊記秒數。後續已由「逐字即時字幕框架 + 側車 JSON」取代為主路徑；`captionTimes` 仍向下相容。檔案：`data/stories.ts`、`components/StoryPlayer.tsx`、`app/story/[slug]/play/page.tsx`。
**Completed:** main（2026-06）

### 首頁標頭：三行 tagline + 合作/許願/留言 圓鈕
標頭單行副標 → 三行 tagline（用車車故事陪伴孩子成長／融合生活中事件及發揮想像出發／一起探險、學習、勇敢闖關！）；新增三顆圓鈕（連結由 `SiteHeader.tsx` 頂部 `ACTIONS` 陣列維護），維持手繪黏土風與 WCAG 對比；重生中文字型子集含新字。
**Completed:** main @ a8adef8、57433c4（2026-06）

### 頁尾與關於頁資訊架構重整
ConnectHub 分「追蹤我們／訂閱收聽」、圖示下顯示名稱；移除 SoundOn／RSS；關於頁車種 chip 用對應 emoji；減少重複訂閱區塊。
**Completed:** main @ b46379e 起

### 營運就緒：SEO、測試、文件（CEO 審核 B 方案 P1）
每集 SEO metadata、音檔 preload 策略、播放器錯誤提示、README SOP、Vitest 單元測試。新增 `lib/story-metadata.ts`、`lib/story-utils.ts`、`data/stories.test.ts`、`README.md`。
**Completed:** v1.1.0（2026-06-01）

### 主題標籤篩選與 SEO 分類頁
首頁主題 chip client 篩選、`/topic` 索引與 `/topic/[tag]` 靜態頁。
**Completed:** main @ 4d89422 起

### RSS Feed 與 ageRange
`/feed.xml` podcast RSS、`layout` alternates、ConnectHub／PlatformLinks RSS；故事 `ageRange` 與卡片／詳情顯示。
**Completed:** main @ 640ce5f 起

### ConnectHub 頁尾訂閱／追蹤區
圖示卡片式「追蹤我們」「訂閱收聽」分區，取代文字 pill 連結列。
**Completed:** main @ 0b7b0f2 起
