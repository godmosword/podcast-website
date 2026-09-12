# 車車遊樂園 3D Intro / Portal — 詳細產品與技術規格

版本：1.0 · 日期：2026-09-06（狀態於 2026-09-08 依工作樹重新核對） · 狀態：設計規格；Phase 1、4、5 已實作並驗證。Phase 6／7 對**前端實際引用的 v3** 已成立：v3 現在由 `assets/blender/hero-world/build.py` 在 Blender 4.5（PyPI `bpy` 模組；實體 Blender CLI 驗證列為 Phase 13 前必做）乾淨重建，經 `optimize-hero-world.mjs`／`render-hero-posters.mjs` 產出，`polish-hero-world.mjs` 已刪除，manifest 記載 `blenderCleanRebuild: true`（證據見 `docs/qa/intro-portal/v3-clean-rebuild-20260908/`）。ADR-0003 的 opt-in 入口已實作。Phase 8 已就 v3 做視覺驗收（同上目錄的 before／after 對照）；Phase 9 的進站轉場與 focus 交接已實作並驗證（`docs/qa/intro-portal/phase9-20260908/`）；Phase 10（效能）與 Phase 11（可及性）已在無 GPU 的容器上量測與驗證（`phase10-20260908/`、`phase11-20260908/`），FPS 與螢幕閱讀器仍待真機；Phase 12 的模擬部分（跨 viewport 版面、旋轉、網路情境）已完成，真機部分因無實體裝置全部 NOT-RUN（`phase12-20260908/`）；Phase 13 待驗收

本次交付遵循最新指示「把 SPEC／PLAN 寫給我就好，越細節越好」。文件中的「應」「必須」「驗收」均表示未來實作要求，不表示目前程式已達成。本文與 [執行計畫](INTRO-PORTAL-PLAN.md) 配套使用。

## 0. 決策摘要與交付邊界

### 0.1 產品定義

產品路徑：**3D Intro World → Main Landing Page → Stories／Games／Play Map／其他內容**。

- Intro = 感受車車遊樂園：原創黏土玩具世界、角色存在感、情緒入口。
- Landing = 探索車車遊樂園：內容導覽、故事、遊戲、地圖與家長資訊。
- Intro 應像翻開繪本封面；Landing 像抵達目錄。
- 任何時刻都可進入網站；3D 的成功、下載速度與動畫進度不得成為使用網站的條件。

### 0.2 本版決策

| 決策 | 規格 |
|---|---|
| 概念 | A「書封裡的小樂園」：延續現有故事屋、環路、摩天輪、小紅 |
| Intro URL | `/intro`，獨立頁面 |
| Landing URL | `/`，保留既有內容、canonical 與內部連結 |
| 強制直達 Landing | `/?enter=1`，不論 session 是否存在均直達 |
| 自動邀請 | 僅符合條件的本分頁首次首頁訪問；深連結不經 Intro |
| 返回策略 | 自動邀請與 Enter 使用 replace，避免循環；使用者主動重看可 push |
| 最小 UI | 一個 h1、一句短文、一個 Enter、可選「略過動畫」 |
| 吉祥物 | Intro 僅保留世界內的小紅；Landing 保留既有 DuduCompanion |
| 3D 架構 | Blender → GLB → 現有 R3F／Three 元件與品質系統 |
| 核心動態 | 小紅一次問候；摩天輪 56 秒／圈；兩株樹極輕微擺動 |
| 煙霧 | 預設不加入；僅通過視覺與效能實驗後才選用 |
| 音訊 | 預設靜音；本版不新增環境音 |
| 壽命 | 主敘事約 18 秒，次級動態最多約 24 秒有效可見時間，之後休眠 |
| SEO | `/` 保持 SSG／SSR；Intro noindex、follow；不依 user-agent 分流 |
| 發布 | 本輪完成 Phase 1、4、5 的本機驗證；不 commit、不 push、不部署 |

### 0.3 適用範圍與禁止擴張

應沿用已建立的載入邏輯、語意 HTML、正交相機、R3F 元件、品質分級與 fallback。只做必要的路由分離、動態節奏、材質／燈光與构圖改善。不得因新增 Intro 重建 Landing、播放器、遊戲、宇宙地圖、親子景點、API、訂閱或資料管線。

不得為增加細節堆疊無敘事用途的物件、粒子、燈光或套件。不加入自由飛行相機、物理碰撞、DOF、動態模糊、強烈 bloom、鏡頭耀光、長片頭或轉動模型用的可見控制器。

## 1. Repository 基礎與現況

### 1.1 已檢視的結構

以下依本機工作樹檢視結果記錄；套件的精確安裝版本以 lockfile 為準，版本範圍以 package.json 為準。

| 領域 | 現有來源 | 對 Intro 的含義 |
|---|---|---|
| 框架 | Next.js 16.3.2、React 19.2.7、TypeScript strict | 延續 App Router、server page＋client scene，不改框架 |
| 首頁 | `app/page.tsx`、LandingHub、LandingSegment | 保留內容頁地址及 SSG |
| 捲動 | LandingScrollView、LandingScrollContext | Intro 不借用四段 snap 容器 |
| 導覽 | SiteNavBar、SegmentNav | SiteNavBar 在 Intro 隱藏，SegmentNav 只留 Landing |
| 吉祥物 | DuduCompanion | 不搬入 Intro，不從 Landing 刪除 |
| 主題 | ThemeProvider、theme／bedtime utilities | Intro 不疊睡前 veil 或月亮；Landing 行為不變 |
| 字體 | Baloo 2、粉圓子集、Gochi Hand | 中文以粉圓為主，新文案檢查子集字元 |
| 設計 | DESIGN.md、CSS tokens、CSS Modules | 沿用字階、圓角、44px 觸控與 focus 原則 |
| 原型場景 | `components/landing/hero-world/` | 保留模組分工，不為命名美化大搬遷 |
| Blender | `assets/blender/hero-world/build.py`／`.blend` | 腳本可重建，編輯檔與導出資產同時交付 |
| 模型 | environment、little-red、tree | 場景拆分、樹實例化、動畫 clip 保留 |
| 優化 | `scripts/optimize-hero-world.mjs` | quantize、dedup、weld、局部簡化與 validator |
| SEO | homepage metadata、JSON-LD、sitemap、robots | 不讓 Intro 取代內容索引 |
| 快取 | Next chunk hash、public/sw.js | 不把大型 Intro 資產放進故事 precache |
| 音訊 | LandingPlayLink、story player | 播放繼續由明確操作觸發，Intro 不介入 |
| 遊戲 | `/games`、各遊戲頁與 shell | 深連結直達，保持既有互動 |
| 地圖 | `/adventures`、`/for-parents/play-map` | 虛構宇宙地圖與真實景點維持區別 |
| 可觀測性 | Vercel Analytics、ReturnVisitPing | 不重複 pageview、不送出兒童識別資料 |
| 品質驗證 | Vitest、Playwright、axe、verify scripts | 新增針對 Intro 的測試，同時跑既有驗證 |

以上是架構層級盤點，不代表已逐檔審閱全庫所有商業邏輯。執行計畫 Phase 1 規定補齊受影響依賴與驗證來源，避免把一般性盤點稱為完整安全審查。

### 1.2 已存在但未驗收的草稿

基線時已存在 `/intro` 頁面草稿與 IntroVisit、layout／SiteNavBar 整合、3D 動態、CSS、Blender 腳本與版本路徑等 dirty tree 變更。本輪已將 Phase 4、5 的入口與載入契約補齊並以測試驗證；Blender 美術（Phase 8）與上線資產的來源鏈仍未驗收。

基線時（Phase 1）`public/models/hero-world/v2/` **只有 `poster.png`**；因此當時 Phase 5 改用已有完整模型與 poster 的 `/models/hero-world` 資產。Phase 6 已產出完整 v2 release（environment／little-red／tree／desktop 與 mobile poster／manifest 皆存在），manifest、validator 與 capture 證據見 `docs/qa/intro-portal/phase6-7-20260906/`。

工作樹現況（2026-09-08 核對）：`components/landing/hero-world/config.ts` 的 `MODEL_PATH` 是 `/models/hero-world/v3`。v3 的來源鏈已閉合——`assets/blender/hero-world/build.py`（Blender 4.5）→ `export/*.raw.glb` + `build-info.json` → `scripts/optimize-hero-world.mjs` → `scripts/render-hero-posters.mjs`；`polish-hero-world.mjs` 已刪除，manifest 記載 `blenderCleanRebuild: true` 以及 Blender 版本、build seed、build.py 雜湊與 raw export 雜湊。重建後三個 GLB 合計 291,484 bytes（原 384,320）、16,373 triangles（原 16,343）、0 貼圖（原有 palette atlas），validator 0 errors／0 warnings，`npm run validate:hero-world` 88 項全通過。證據見 `docs/qa/intro-portal/v3-clean-rebuild-20260908/`。v1 與 v2 目錄保留作回退。跨裝置與真機量測仍未完成。

本次不自動撤銷工作樹、不提交、不部署，也不把未驗收草稿當成需求依據。未來執行時先建立隔離快照，逐項決定沿用或修正。

### 1.3 既有畫面的問題證據

修改前的實拍：[desktop](../qa/intro-portal/before-desktop.png)、[mobile](../qa/intro-portal/before-mobile.png)。畫面顯示：3D 世界與浮動紅車重複；頁面同時承擔入口氛圍與四段內容導覽；前庭空間缺少明確界線；摩天輪缺乏生命感；整個島的完整外輪廓帶來模型陳列感。

旧文件中的 349,048 bytes GLB、46 calls、34,402 triangles、60 FPS 等屬於**舊 Hero 的歷史測量**，不得作為新 Intro 的驗收成績；新結果必須附本次 artifact ID、浏览器、裝置與測試條件。

## 2. 使用者與成功情境

### 2.1 主要對象

- 3–7 歲孩子：透過小紅與空間理解「這裡有故事」，不需文字說明操作相機。
- 家長首次訪問：短暫體驗後立即進入內容，能迅速找到故事／遊戲／景點。
- 家長回訪：直接使用 Landing 或深連結，不被重复片頭攔截。
- 輔助科技／減少動態使用者：使用正常標題與連結完成相同路徑。
- 慢網、舊機或無 WebGL 訪客：看到完整靜態畫面，進站權利與其他人相同。

### 2.2 成功定義

可在無 3D 載入完成的情況下進站；內容導航不多出強制步驟；第一次看到場景時能辨認小紅、故事屋、摩天輪；小紅的問候可被注意但不吵鬧；手機文字和車輛不互相遮擋；離頁後停止 GPU 與下載工作。

### 2.3 非目標

Intro 不是選關、角色圖鑑、遊戲 hub、故事目錄或可自由探索的開放世界。資料分類、最新集數、訂閱、家長地圖及所有功能 CTA 繼續由 Landing／下游頁面承擔。

## 3. 三個美術概念與選型

### A. 書封裡的小樂園（選定）

- 情緒：親近、被迎接、即將展開一個故事。
- 構圖：故事屋偏中左、摩天輪偏後右、環路前景，小紅沿路接近訪客；前庭由地面材質與短步道構成。
- 相機：克制正交三分之四俯視；桌面不對稱留白；手機更正面、較低，聚焦車和屋。
- 小紅時刻：接近→減速→懸吊收穩→眼神／輕微朝向問候→出發。
- 環境動畫：56 秒／圈摩天輪、直立吊艙、暖窗、最多兩株樹冠微擺。
- Blender：沿用三模組；輪盤與吊艙新增明確 pivot；車輪保留 Drive clip；車身、眼睛保持可動畫層級。
- 複雜度：中；資產與生命周期能延用，需處理材質合併與動態節點的衝突。
- GLB 預估：0.4–0.7 MB，優化目標低於 500 KB；這是預估。
- 手機策略：6 或 4 棵樹、少陰影、DPR 1.25／1、屋前地面留出車輛輪廓。
- GPU：目標 <40k visible triangles、<70 calls；實際含陰影成本另記。
- 優勢：品牌延續強、載入成本可控、易保持語意 HTML、可維護。
- 風險：若只放大模型、不改善節奏與光材質，仍可能像商品展示。

### B. 故事群島的早晨

- 情緒：好奇、遼闊、不同故事世界彼此相連。
- 構圖：三個微型地景，以橋與中央站連接；必須保持裝飾，不能變成第二套地圖導航。
- 相機：高俯角慢慢沉向中央站；手機只呈現中央島與一條延伸橋。
- 小紅時刻：從桥出現，到站減速，朝訪客致意。
- 環境動畫：遠近樹影、單一小煙；不讓多個地景同時活動。
- Blender：新增地景、橋、站台、額外樹植，需 LOD／分區資產。
- 複雜度：高；手機裁切、資產載入與小紅路徑更複雜。
- GLB 預估：1.5–2.5 MB；GPU 預估 60k triangles／90 calls，超過本案首選預算。
- 優勢：世界延伸感強；風險：重複 `/adventures`、手機過於擁擠、初次載入更重。

### C. 小紅的送書路

- 情緒：期待、陪伴、故事正在路上。
- 構圖：縱深彎路串起森林、閱讀門口與小樂園；以道路切出視野暗示更大的世界。
- 相機：微量向前移動，不依賴 scroll 驅動；手機只顯示一次抵達。
- 小紅時刻：抵達故事屋送書、停留、看向訪客後繼續。
- 環境動畫：抵達時窗光微亮，其餘靜止。
- Blender：較長道路、三套分鏡地景、車的運動路徑與交付動作。
- 複雜度：高；鏡頭与敘事容易耦合；GLB 預估 1–2 MB；GPU 50k triangles／80 calls。
- 優勢：敘事明確；風險：過度電影化、等待時間、缺少完整場景時 fallback 比較難設計。

### 選型結論

選 A。其餘兩案的主要收益是拓展場景，而本次最重要的收益來自角色節奏、空間意圖與材質深度。A 能保留既有架構與素材，以最小必要新增改善品牌感、手機可讀性和維護成本。這是實作方向選擇，不需額外概念核准。

## 4. 路由、Session、History 與 SEO

> **自動邀請依 [ADR-0003](../adr/0003-intro-auto-invite.md) 取消（2026-09-08 實作），
> 隨後 [ADR-0004](../adr/0004-intro-overlay-on-home.md) 把 3D 開場改成首頁的同頁覆蓋層。**
> `/` 仍然永遠回傳完整 Landing HTML、零 client redirect、零 middleware、canonical 不變；
> 差別是首次到訪時有一層蓋在 Landing 上的 3D 開場，由 `<head>` 的同步 script
> （`lib/intro-gate.ts`）在首次繪製前決定，按「進入」就地淡出，網址全程是 `/`。
> Landing 首段的 opt-in 膠囊（`IntroEntry`）與之後的重回開場鈕都已移除。Landing **沒有**重回開場入口；首次進站覆蓋層仍在，之後要再看開場請開 `/intro`。§4.2 的舊 session 規則仍然作廢——
> 覆蓋層用的是新的 key 與新的判斷，不是把舊機制接回來。
>
> **現行產品（2026-09-12）：** `INTRO_PORTAL_ENABLED` 已關掉。下表是實作當時的契約；線上行為改為 `/` 不掛覆蓋層、`/intro` 導回 `/`。程式與本規格仍保留。

### 4.1 路由契約

| 位置 | Server response／內容 | Client 行為 | Canonical |
|---|---|---|---|
| `/` | 200、完整 Landing SSR／SSG（含 3D 覆蓋層的 markup） | 停在 `/`；首次到訪由閘門開啟覆蓋層，按進入就地關閉，不做任何 client redirect | `/` |
| `/?enter=1` | 同一 Landing、200 | 直接進入（Intro 的出口，舊連結不壞） | `/` |
| `/#segment-*` | Landing + anchor | 保留該段定位，不開 Intro | `/` |
| `/intro` | 200、標題／poster／Enter SSR | 優先載入靜態，再漸進增強 | `/intro` |
| story／games／maps | 原路由 response | 直接進入；沒有任何入口攔截 | 原 canonical |
| 不存在 URL | 原品牌 404 | 不先轉 Intro | 原 404 規則 |

首選保留 `/`，避免把所有既有品牌回家連結改成 `/landing`。不建立第二份內容相同的 Landing 路由。

### 4.2 Session 規則（舊機制已作廢；ADR-0004 的閘門是另一套）

ADR-0003 取消自動邀請時，`cheche-intro-visited-v1` 與 `components/intro/IntroVisit.tsx`
連同掛載點一起刪除，那套 session 機制不會回來。

ADR-0004 的覆蓋層另用一個 key：`cheche:intro-seen-v1`，語意是「這個分頁看過開場了」，
只影響覆蓋層要不要打開，不影響任何路由。判斷寫在 `lib/intro-gate.ts` 的
`shouldOpenIntroGate()` 純函式裡，`<head>` 的同步 script 是它的字串鏡像，兩者由
`lib/intro-gate.test.ts` 交叉驗證。讀寫失敗時一律 fail-safe 成「不打開覆蓋層」——
方向刻意選在這一邊，因為反向失效會讓 Landing 被一層關不掉的覆蓋層鎖死。
Landing 沒有重回開場入口。storage 被封鎖時覆蓋層依 fail-safe 不打開，行為與無 JS 相同：直接看到 Landing。

### 4.3 動作與 Back 行為

| 情境 | 應有歷史行為 |
|---|---|
| 外站→`/`→點入口→Intro→Enter | `/` 不 redirect；Enter 以 replace 回 Landing，Back 不回片頭 |
| `/intro` 直接開啟→Enter | replace 至 Landing；不在 Back 建立強制重看 |
| Landing→story→Back | 回原 Landing，保留既有捲動處理，沒有 Intro |
| 深連結→首頁 | 首頁直達；沒有任何入口攔截 |
| 使用者主動打開 `/intro` 重看 | 允許重看，即使 session 已訪問；不自動跳走 |
| Ctrl／Cmd／中鍵 Enter | 尊重原生 link 開新頁；不攔截成當前頁動畫 |
| Storage 被封鎖 | 行為不變：Intro 不使用 storage |
| Back／forward cache 還原 | 不重播迎賓，不重置內容位置；僅恢復可見性生命周期 |

### 4.4 SSR、搜尋與首次閃爍

SSR 的 `/` 應包含 Landing 標題、內文、故事／其他內容連結及現有 JSON-LD。不能只輸出 Intro 再把所有內容留給 JavaScript。不能以 crawler user-agent 特判送不同產品內容。

Intro 設 noindex、follow；不以 robots.txt 封鎖 `/intro`，否則搜尋引擎無法讀到 noindex；不加入主 sitemap。`/?enter=1` 與 `/` canonical 相同，不能在每次導航累積更多參數。既有 sitemap 的內容 URL 保持不變。

首次 `/` 的閃爍問題連同自動 redirect 一起消失：`/` 的 server HTML 就是最終畫面，沒有
client 端換頁。SEO 驗收仍須同時看 server HTML 與 rendered HTML；noindex 是 Intro 的屬性，
不能污染 `/`。Landing 上的入口連結是普通 `<a href="/intro">`，follow 但目標 noindex。

## 5. Intro HTML、文案與互動

### 5.1 文案定稿

- H1：**車車遊樂園**
- 短句：**故事，就從這裡出發。**
- Primary link：**進入車車遊樂園 →**
- Secondary link：**略過動畫**

標題、短句及 Enter 在 SSR 就存在。不可等小紅抵達才建立 CTA；「CTA becomes prominent」僅指既有 CTA 的輕微外圈／陰影變化。

### 5.2 語意結構

```html
<main data-intro-root>
  <section aria-labelledby="intro-title">
    <h1 id="intro-title">車車遊樂園</h1>
    <p>故事，就從這裡出發。</p>
    <div aria-hidden="true"><picture>…</picture><!-- decorative canvas --></div>
    <a href="/?enter=1">進入車車遊樂園 →</a>
    <a href="/?enter=1">略過動畫</a>
  </section>
</main>
```

不要額外重複 `main`。Canvas 與模型不是焦點目標；不在 canvas 內放文字或點擊入口。全域「跳到主內容」保留，跳入真正的內容容器。必要的無障礙動態暫停控制可加入低干擾按鈕，不屬內容導航。

### 5.3 Enter 與 Skip

Enter 初始可操作；未載入、fallback、低動態、WebGL 失敗時直接導航。3D 已 ready 時，立即開始路由切換，最多 360ms 的視覺入園效果與導航並行，不等待車走完或鏡頭到點才建立導航請求。不得讓 360ms fade 後出現等待 route chunk 的白屏。

Skip 永遠直接導航，不播放 exit 動畫。兩者同目的地；在重複點击、鍵盤 Enter、觸控雙擊時只觸發一次。保留原生連結 fallback，無 JavaScript 仍可用。

**實作（2026-09-08，Phase 9）：** 決策集中在 `components/landing/hero-world/enter-transition.ts`
的 `resolveEnterAction()`：修飾鍵／中鍵回 `native`（完全不攔截 `<a href="/?enter=1">`）、
重複觸發回 `ignore`、live 場景回 `transition`、其餘（poster／載入中／fallback／
reduced motion）回 `direct`。`transition` 與 `direct` 都**先呼叫 `router.replace("/")`**，
淡出與相機推近只是同時發生的裝飾；`EXIT_TRANSITION_MS = 360` 同時餵給 CSS custom property
與 `CameraRig`，兩邊不會各自漂移。轉場沒能完成（route chunk 失敗）時，1.5 秒後解除
`data-entering` 並把原生連結還給使用者。JS 可用時兩個連結都落在乾淨的 `/`；`?enter=1`
留在 href 作為無 JS 與深連結的語意入口，canonical 仍是 `/`。ADR-0003 之後不再有 session 記錄。

## 6. 視覺構圖與響應式規格

### 6.1 共同原則

世界的視覺權重高於文案；保留負空間作為閱讀和呼吸區。場景整體相對舊版測試 1.05／1.08／1.10 三個尺度，首選 1.08。不可同時把 container 和 camera 各放大 8% 卻宣稱總共只放大 8%；以最終地標畫面尺寸計算。

允許裁掉底座或遠端植栽的一小部分，不能裁掉小紅面部、主門、輪盤中心或 CTA。裁切是 viewport 內的美術處理，不能造成 document 水平捲動。Intro 不顯示右緣分段指示器；Landing 的指示器維持其導覽角色。

### 6.2 版面參數（初始設計範圍，須實拍收斂）

| Viewport | 文案 | 世界 | CTA／Skip |
|---|---|---|---|
| 320×568 | 頂部 6–8%，標題約 32px，短句 15–16px | 中段约 24–72%，兩側可各裁底座 | 下方，Enter ≥52px；Skip ≥44px；彼此不重疊 |
| 360／375／390 | 標題 fluid 32–38px，居中 | 屋和車置中心可見區，輪盤偏右後 | 底部保留 safe area，按鈕距場景輪廓至少 16px |
| 414／430 | 不新增文字或卡片 | 稍增環境留白，不放大到遮住標題 | 相同操作階層 |
| Tablet 768×1024 | 頂部偏左或居中，取更清晰方案 | 比手機稍廣，仍可見車和主屋 | 底部左／中；不得沿用桌面位置造成大空洞 |
| Tablet 橫向 | 左側文案、右側世界 | 限制鏡頭俯角，避免屋遮車 | CTA 不壓輪盤 |
| Desktop 1440×1000 | 左約 6–9%，標題約 56–64px | 中右約 75–82% 寬，偏下，底座少量出框 | 左下、位於文案視線延續處 |
| Large 1920／2560 | 字體設上限，留白不無限拉寬 | 相機 scale 保持場景存在感 | CTA 與標題維持同一對齊線 |
| 短橫屏 844×390 | 左文案約32px，不套長頁豎版 | 右側約 65–75%，減少上下留白 | Enter／Skip 均在首屏內 |

斷點優先採既有 480、640、768、980；除大型桌面美術校正外，先使用 clamp 與 container 尺寸，不用大量裝置特判。縮放 200%／文字放大時允許頁面自然變高，不能因固定 100vh 把出口推到不可達區域。

### 6.3 相機

保留正交或克制 perspective。若沿用正交，初始位置以現有 desktop `(7,10,12)`、mobile `(5,10.5,14)` 為調整起點，不當作最終驗收結果。lookAt 約屋與車之間的地面上方。Near／far 緊貼必要空間，不截近景。

Desktop pointer 視差限於原約 X 0.22、Y 0.10 的小幅範圍；touch 不依賴 hover，不攔截垂直手勢，不開 OrbitControls。相機入園最多約 6.5% 微推近，無大角度旋轉；reduced motion 完全停用。

### 6.4 色彩與亮度

首選暖奶油背景、薄荷／森林綠文字和 CTA、陶土紅角色、柔和黃色窗光。Intro 固定美術配色，避免 Landing 睡前遮罩同時壓暗模型和文字；既有 night mode 的 Landing 不受影響。若後續加入夜間 Intro，需要独立 poster 與測試，不能只套 CSS 深色背景就宣稱完成夜版。

## 7. 場景設計與微敘事

### 7.1 Story House

保留書本造型屋頂和既有小書，門口建立連續的「道路→短石階→小前庭→門檻」空間關係。前庭可採略不對稱橢圓或圓角鋪地，外緣和草地有低對比色差；高差很小，不能像額外平台懸在草上。

窗戶改成暖 amber 的簡單 PBR emissive，初值 intensity 約 0.2–0.4；不是新增兩盞 point light，不加 bloom。屋框和窗格保留立體陰影，不成一塊發白矩形。中低品質仍能看見暖窗，不依賴即時陰影。

前庭的可見範圍應被明確幾何邊緣與材質定義，不把原本難看的屋影誤當成要填滿的空白。屋影方向須與主光一致。

### 7.2 Ferris Wheel

一圈 56 秒，容許美術調整 45–60 秒；無加速衝刺。輪框和 spokes 隨共同軸心旋轉，支架不動。吊艙旋轉補償應在正確的 local axis 上抵銷，任何角度都保持車廂朝上；不能讓乘坐艙倒吊。

Blender 建立軸心與分組，GLB 保留 transforms。可以把輪盤旋轉導出為簡單 loop clip，或由 R3F 以 active delta 驅動；不得兩種驅動同時控制同一 transform。材質合併僅發生在共享動態父節點內。

### 7.3 樹木

最多兩株可見樹冠微擺，振幅約 0.3–0.6°，週期約 8–12 秒、相位錯開。樹幹基座固定，不能整棵樹滑動。High 開啟，Medium 預設關閉，Low 關閉。InstancedMesh 每幀只更新必要 instance，不重新分配所有 matrix。

### 7.4 煙霧（選配）

不作為本版必要物件。若實拍認為屋仍缺生命感，可測試最多三個低面數薄煙團，約 12–18 秒偶爾一小次、持續 1–2 秒；僅 High，透明 overdraw 受控。不新增貼圖、粒子框架或持續 emitter。無顯著收益即刪除實驗。

### 7.5 Little Red 的 Signature Moment

以模型 ready 後的**有效活動時間**為零點，原 HTML 早已可用：

| 時間 | 行為 | 約束 |
|---|---|---|
| 0–0.4s | 靜態起始構圖銜接 live | 不在淡入時瞬移車位 |
| 0.4–3.5s | 沿前景道路接近 | 車頭與路徑切線一致，轮转隨路程 |
| 3.5–4.5s | 明確但平滑減速 | 速度連續收至0，沒有線性突然停止 |
| 4.5–4.9s | 懸吊收穩 | 車身約高度1–2%的位移或≤1°點頭，輪胎接地 |
| 4.9–6.2s | 短暫朝向／眼神致意 | 微轉約3–7°；表情不變成大幅搖頭 |
| 6.2–8s | 平滑再起步 | 速度由0開始，車輪不在停止時滑轉 |
| 8–18s | 繼續旅程 | 不反覆停在訪客前重播問候 |
| 18–24s | 保留短暫環境活動後休眠 | 車無重播跳點；使用者仍可 Enter |

行進路徑應以距離／弧長映射輪速；不能只用橢圓角度線性變化卻造成不合理加速。車身與四輪的變換分開：懸吊只影響 body，車輪保持接地。若目前模型把眼睛與車身全部合併，需在 Blender 保留 Pupils／Body 的獨立控制節點，或用小角度車身轉向呈現致意；不可聲稱眼睛有看向訪客而只改整車位置。

## 8. 動態可及性與休眠

產品選擇：開場**沒有**「暫停動態／繼續動態」鈕，看著頁面時視差一直跑，也不在 24 秒後自動休眠。離開開場靠「進入車車遊樂園」或「略過動畫」。`prefers-reduced-motion` 仍直接退成靜態圖（不建立 canvas、不載入 3D chunk、不播放 fade／camera exit／CTA pulse），偏好在 runtime 改變時也應生效。隱藏分頁或離開視窗時凍結 `animation-play-state`，不釋放 layer；回到前景從原位置繼續。

Reduced motion：poster＋完整 HTML，不建立 canvas、不載入 3D chunk、不播放 fade／camera exit／CTA pulse。偏好在 runtime 改變時也應生效。

## 9. Blender 資產規格

### 9.1 來源與產物

- 來源：`assets/blender/hero-world/build.py`、可編輯 `.blend`。
- 中間：`assets/blender/hero-world/export/*.raw.glb`，不進 public。
- 產品：版本化 GLB、兩種 poster、資產 manifest／validator report。
- Blender 只作為本機建模工具，不是瀏覽器執行時依賴。

### 9.2 層級契約

```text
Environment
  Static_<material>          地面、房屋、固定支架、前庭
  FerrisRotor                原點位於輪軸中心
    RimAndSpokes_<material>
    GondolaPivot0..7         原點位於吊掛點
      GondolaGeometry
Vehicle
  Body                       懸吊與致意
    Eyes / Pupils            若採眼神動畫，需独立且少量材質
  Wheel_0..3                 各自輪軸原點；Drive clip
Tree
  Trunk
  Crown                      允許 foliage-only sway
```

這是語意契約；實際 glTF node 名稱若已被優化器改寫，需用 manifest／驗證保證前端 lookup 能找到，不可依模糊 `includes()` 取錯物件。檢查 Blender Z-up→glTF Y-up 後的旋轉軸；至少實拍輪盘90°角度與吊艙直立。

### 9.3 建模與材質

套用必要 transform／modifier；只導出選定可見 mesh、必要 animation 和 hierarchy。不導出 Blender camera、light、隱藏 preview tree 或備用渲染物件。材質使用 glTF 能表示的 base color、roughness、metallic=0、合理 emissive。

Roughness 起始區間：車身0.70–0.80、屋牆0.85–0.95、葉片0.80–0.90、窗0.50–0.65。小幅色差集中在地面／車殼，不以每塊幾何一個新材質造成 draw calls 暴增。優先保留輪廓、眼睛、車頭、屋頂的可辨識度。

### 9.4 AO、接觸深度與紋理

先改善主光方向、shadow normal bias、粗糙度與接觸色差。若需 baked AO，可用小 atlas 或 vertex colors；避免重複乘上過強 AO 和 realtime shadow。低階沒有即時陰影時，輪胎與地面仍應有合理接觸感。

預設 GLB 不含纹理。只有材質表现確有收益才加入 ≤1024² atlas；2048² 以上需提供手機收益與記憶體證據。KTX2／Basis 只有在節省網路及 GPU memory 超過 decoder 成本時才啟用。

## 10. GLB 優化與版本管理

### 10.1 流程

Blender export → validator(raw) → dedup／weld／quantize → 僅靜態環境簡化 → 保留動態 hierarchy → validator(final) → 尺寸／三角形／材質／動畫報告 → 與 live 視覺核對 → 發布資產。

現有 environment ratio 0.76、error 0.002 是實驗起點，不是無條件套用到車廂或眼睛的參數。不要用全域 flatten／join 毀掉 pivot；不要保留所有 Blender action。Drive 以外 clips 需在命名表中逐一列用途。

Meshopt／Draco 做 A/B：比較 GLB bytes、decoder gzip、解析時間、弱機 ready、視覺與記憶體。小模型不必為單一數字更小而引入額外 decoder。Drei／GSAP／Motion 同理：現有 useFrame／CSS 能完成便不新增。

### 10.2 資產一致性

同一 release 必須具備 environment、little-red、tree、desktop poster、mobile poster 和 manifest；任一缺失阻止發布。manifest 含 SHA-256、bytes、triangle／material／clip 數、生成工具版本、日期與相機／燈光參數。前端不能先指向新路徑、卻留資產待下次執行。

### 10.3 快取策略

選擇版本目錄。目前前端引用 `/models/hero-world/v3/`（v2 為上一版、v1 為最舊回退）。在開發中該版本目錄可變動、使用 revalidation；一旦正式標記 immutable，該目錄不可覆寫，再改版用下一個版本號。也可從一開始使用內容 hash，但不要混用到無法追蹤版本。

HTML／manifest／程式碼同步引用同一 release。舊目錄需保留到所有仍服務的旧 deployment／快取 client 都不再引用。禁止以固定檔名＋長期 immutable 快取後直接覆蓋檔案。

Service worker 不預抓所有 Intro 模型、不替換故事快取、不為此清空 v6 離線故事。需檢查 SW 是 network-first 還是 cache-first 的匹配路徑；不要把 HTML fallback 200 當成 GLB 下載成功，需驗 binary header／解析結果。

## 11. 前端元件與狀態機

### 11.1 責任邊界

| 元件 | 責任 | 不應負責 |
|---|---|---|
| Intro page server shell | metadata、HTML 語意、poster入口 | server 對 deep link 強制 redirect |
| IntroEntry（已刪） | 舊 Landing opt-in／重回開場入口；現行 Landing 不再放此控制 | session、redirect、載入 Three |
| HeroWorld／Intro shell | eligibility、ready/fallback、Enter、pause、transition | 模型幾何每幀運算 |
| HeroScene | Canvas、燈光、children、context-loss | 全站導覽、內容資料 |
| SceneLoader | fetch／parse／abort／dispose | 無限重試、長期無 owner 全域模型 cache |
| World | environment、wheel、instanced trees | 玩家控制、內容分類 |
| Vehicle | arc-length 路徑、clip、signature moment | 路由決策 |
| CameraRig | viewport構圖、細微視差、entry | scroll hijack、自由旋轉 |
| QualityManager | DPR／降級／量測 | 以裝置名稱猜測性能、頻繁升降 |

### 11.2 分離狀態

- Scene：poster → eligible → loading → ready → fallback／disposed。
- Motion：idle → arrival → greeting → continue → settled；可被 paused／hidden 暫停。
- Navigation：idle → entering → landed；從任何 Scene 狀態可進入 entering。

不要用單一 `ready` 布林同時代表資產存在、畫面完成和動畫是否播放。`ready` 需以至少一次成功渲染後才設定；2個幀確認可保留，但沒有幀來源時也要能在 timeout 退回 poster。

### 11.3 Lifecycle

只掛一個 Canvas；只有 eligible 且可見才 mount。離開後 abort 全部請求，GLTF parse 若晚完成仍需 dispose；geometry／material／texture 使用 Set 去重釋放。AnimationMixer stop／uncacheRoot、移除 visibility／pointer／media query／connection／context event、disconnect observer、清除 timer／RAF／entry callback。

資產共享須有清楚 owner。不要同時讓 primitive 自動 dispose 和 SceneLoader 重複釋放，也不要為避免重複而全面 `dispose={null}` 後無人清理。影子 map、Three renderer 管理資源與 context 的釋放需包含在循環測試。

### 11.4 Loading 與 Fallback 表

| 情境 | 畫面 | 下載／運算 | Enter |
|---|---|---|---|
| JS disabled | SSR poster＋文字 | 無3D | 原生 link |
| reduced motion | poster | 不載3D chunk、不建Canvas | 立即 |
| Save-Data | poster | 不載模型 | 立即 |
| slow-2g／2g | poster | 不載模型 | 立即 |
| WebGL unavailable | poster | 能力檢查／error boundary 安全退出 | 立即 |
| GLB 404／parse error | 同一 poster | 中止其餘必要工作、無自動重試風暴 | 立即 |
| 15s active load timeout | poster | abort／卸載；背景時間不誤算為載入時長 | 立即 |
| context lost | poster | 停動畫、卸載；不無限重建 context | 立即 |
| runtime reduced motion on | poster | 釋放3D | 立即 |
| poster本身失敗 | 保留背景、標題、Enter | 不阻止導航；記錄測試失敗 | 立即 |

## 12. Poster → Live 連續性

同一模型、起始車位、輪盤角度、樹數、鏡頭與裁切。桌面與手機要有各自構圖，不能只縮小 desktop poster 然後 live 換成另一個角度。

首選用實際 Three renderer 固定初始姿勢產生 poster，讓 tone mapping／shadow／roughness一致；若用 Blender Cycles，需對齊其 AgX 與 Three ACES 的亮度、曝光和顏色，實際做並排比對。Blender 渲染成功不代表 poster 與 live 一致。

Capture 0ms poster、ready第一幀、ready後650ms、減少動態 poster；比較屋頂／輪盤／車頭的 anchor screen coordinates，目標位移≤畫面寬高2%，同地標尺度差≤5%。再看天空／背景、車紅、窗黃與接觸陰影，不能只用整圖差分判斷（動畫會造成差異）。

Crossfade 約500–650ms，reduced motion 不淡入。模型載入未完成前 poster 不可被透明／空 canvas 蓋住。避免因 poster 大圖和 canvas 尺寸各自決定高度而造成 CLS。

## 13. 效能預算、量測與降級

### 13.1 初始預算

| 指標 | 目標／硬限制 | 測量說明 |
|---|---|---|
| Intro 額外初始 JS | ≤15 KB gzip目標 | 不含既有共用Next／React；同時報總初始JS |
| lazy 3D JS | ≤300 KB gzip | Three／R3F與scene所有延遲依賴合計 |
| GLB | ≤500 KB目標，<1 MB硬限制 | raw和實際CDN transfer分列 |
| poster desktop／mobile | ≤180 KB／100 KB | 實際檔案與wire bytes分列 |
| GLB texture bytes | 預設0，若新增合計≤256 KB目標 | 另外報GPU解碼memory，不能拿壓縮檔代替 |
| Visible triangles | High<40k，Medium<30k，Low<20k目標 | 不是三份GLB triangle簡單加總；含instance |
| draw calls | High<70，Medium<50，Low<35目標 | 主pass與shadow pass分開，renderer計數方法注明 |
| DPR | 1.5／1.25／1 上限 | 非全Retina；3×手機不例外 |
| FPS | High接近60，Medium30+ | 提供median、p10、frame-time p95与裝置情境 |
| LCP | lab冷載目標<2.5s | 指定網路／CPU條件；另比較Landing基線 |
| CLS | <0.05目標 | poster、live、轉場分别觀察 |
| INP | field p75≤200ms目標 | 無field資料就標未量測，不偽造 |
| 合成互動 | Enter事件回饋≤100ms目標 | browser Event Timing／trace代理，不稱field INP |
| Memory | 同頁5次往返後無線性增長 | 先warmup；GPU資產owner應歸零；heap不是GPU memory |
| Background | 無自行invalidate／動畫更新 | hidden／pause／leave各測 |

任何超預算先改善材質合併、陰影、DPR、樹與非必要動畫；不犧牲 Enter 或 semantic HTML。超過硬限制不得發布；超過目標需有具體原因、差異與替代方案，列為open issue。

### 13.2 自適應品質

| Tier | 初始提示 | Render配置 | 動態 |
|---|---|---|---|
| High | 非窄屏且能力足夠 | DPR1.5，8樹，選擇性1024陰影 | 小紅＋慢輪＋最多2樹 |
| Medium | mobile或中等能力 | DPR1.25，6樹，無／簡化陰影 | 小紅＋慢輪，無樹擺／煙 |
| Low | ≤2 logical cores或≤2GB提示，或runtime降級 | DPR1，4樹，無shadow／AA低成本 | 靜態或單次最短動作 |
| Fallback | 偏好／網路／WebGL／錯誤 | poster | 無 |

deviceMemory可能缺失；hardwareConcurrency也不能代表GPU。初始分類只是保守起點；warmup約45 frames後，連續有效幀sample約2秒，低於38FPS降一級，不頻繁回升。hidden、sleep、parse、首個shader compile不能混進穩態sample。Low仍不穩定時回靜態。

### 13.3 量測協定

至少三次冷cache＋三次暖cache；每次記commit/worktree artifact、browser精確版本、OS、device、viewport、DPR、tier、網路與CPU throttle、供電／低耗電狀態。看0–3秒載入、4–7秒問候、12–18秒運行、24秒後idle、hidden與5次進出。

LCP／CLS來自PerformanceObserver；INP需真實使用資料，實驗室只報腳本互動Event Timing与long-task。Lighthouse只做一種證據，不能代替真機長時間和視覺判斷。降級後是否可用比峰值FPS更重要。

## 14. 可及性、音訊、Analytics

- Enter／Skip／pause最小44×44px；可見focus對背景有明確對比，文字一般≥4.5:1。
- 標題不依賴canvas；一個有效h1；screen reader不能讀到數十個模型物件。
- Tab順序按閱讀序；無focus trap。Entry後焦點移到Landing main／標題；不能恢復頁面時任意搶走使用者原焦點。
- 使用VoiceOver/Safari驗證，不以axe零錯誤代替手動screen reader檢查。
- Zoom200%及文字200%時出口仍可達；短螢幕可捲動，不將必要控制硬裁掉。
- 不auto-play、不建AudioContext、不新增遠端音訊；前一頁story audio生命周期依既有播放器處理。
- Analytics保留既有pageview；可選intro_view／intro_enter／intro_skip／intro_fallback，只記原因枚舉與tier，不送session key／指紋／角色偏好。量測不能成為首屏阻塞依賴。

## 15. 驗收交付格式

### 15.1 視覺檔案

`docs/qa/intro-portal/<artifact>/` 保存：before／poster／ready／greeting／exit／landing，每個必要viewport都記錄。手機320/360/375/390/414/430、tablet768/1024、desktop1440、large1920或2560、短橫屏至少一組。問候與慢輪需要短錄影或時間序列，不能只靠一張靜態PNG證明動畫。

### 15.2 測試報告

每項用 pass／fail／blocked／not-run，不以空白等於pass。包含指令、exit code、browser、失敗分類、證據路徑；測試修改必須解釋產品契約變動，不能刪斷言讓測試變綠。

### 15.3 完成判定

功能、視覺、微敘事、性能、可及性、深連結、Landing保留與資產一致性各自通過。若無真機iPhone／Android可測，要明列限制與後續負責人，不能宣稱完成真機驗收；「emulated iPhone」不等於實體Safari。完整需求對照及18項最終報告見PLAN。
