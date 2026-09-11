# PLAN — Hero 視差首頁視覺修整

日期：2026-09-11  
狀態：**交接實作計畫；尚未實作、尚未通過設計／工程審查、不可據此宣稱可 release。**

使用者已同意修正截圖中的文字重疊、文案與 CTA 距離、前景份量；其後指示「先把 PLAN 寫好，我找別人實作」。本文件供下一位實作者直接接手。

## 1. 起點與目標

先讀：

1. [HANDOVER-HERO-PARALLAX.md](../HANDOVER-HERO-PARALLAX.md)，尤其 §5／§7。
2. [HERO-PARALLAX-SPEC.md](../specs/HERO-PARALLAX-SPEC.md) §4／§5。
3. [AGENT-WORKFLOW.md](../AGENT-WORKFLOW.md) 與 [AGENT-DOMAIN.md](../AGENT-DOMAIN.md) 的 UI 驗證及共同工作區規則。

Hero 功能基準為 `02c34151`（parallax 成為預設）；handover commit 為 `397f02b2`。本輪開始時 HEAD 為 `5ba1a20e`，後者是 feedback 工作，並非本計畫的一部分。接手時重新記錄 HEAD 與工作區狀態，不把文件中的 commit 當成永遠不變的 main。

使用者稱「3D 首頁」的截圖，實際對應目前的 **2.5D CSS 視差舞台**。本輪調整對象為首頁 `/` 首訪覆蓋層，以及 `/intro` 獨立頁共用的 parallax 畫面。

目標：保留現有黏土素材、小紅大小與暖色調，讓標題 → 副標 → 進入按鈕形成清楚的一組；任何背景位置都不干擾文字，前景退為陪襯。

### 截圖所見與優先序

| 優先 | 問題 | 完成定義 |
|---|---|---|
| P1，視覺發布阻擋 | 路牌頂端與「故事，就從這裡出發。」重疊，破壞辨識 | 標題、副標及其周邊安全區在整段動態中均無高對比道具穿過 |
| P2，閱讀與操作關係 | 文案在左上、CTA 在左下，中間被景物隔開 | CTA 隨副標正常排版，維持穩定的相鄰間距 |
| P2，視覺份量 | 底部大石頭、草叢搶走小紅的注意力 | L5 可見高度／面積降低，仍能讀出前後景深 |

截圖能證實閱讀問題，不能單憑它判定真機效能、觸控或整段動畫已通過。

## 2. Scope 與必守契約

### In scope

- 將文案與 CTA／暫停控制組成同一個排版容器。
- 桌機、平板橫向與短橫向的文字安全區。
- 手機直向的內容／場景高度分配。
- L5 近景的縮放或底部露出高度。
- 與上述變更直接相關的 e2e、macOS visual baseline、驗收報告及文件同步。

### Out of scope

- **Phase 3c：不刪 R3F／Three、world 開關、3D 資產或 QA 管線。** 真機驗收後另行決策。
- 不重抽、不放大重製主角、不修改 tile 合成或路面校色。
- 不改導覽、Landing 其他區塊、首頁閘門頻率、路由、canonical、公開文案。
- 不處理另一個 session 的 feedback、StoryPlayer 或其他修改。

### 不得回歸

- `/intro` 的 Enter／Skip 維持原生連結語意；覆蓋層維持 button／dismiss 語意。
- 閘門關閉時不下載 tile；覆蓋層圖片 lazy，`/intro` 只有必要圖片 eager。
- ready 仍以路面與主角 settled 為準；破圖不得阻擋出口。
- parallax 永不請求 WebGL；motion、24 秒 active-time 休眠、暫停／恢復、焦點交接不變。
- 小紅不鏡像；沿用現有 sprite 與尺寸。不得為讓版面塞得下，先把主角縮成次要裝飾。
- 保留 `.band` 的 stacking context、`pointer-events: none` 與視窗內裁切。
- 保留 `100svh` 全螢幕產品形式；不套回規格早期的 520–600px 頁面區塊高度。
- 動畫只改 transform；不在 keyframes 讀 custom property；不增加動態場景層數。

## 3. 建議版面方案

以下數值是**第一輪調整起點**，並非已經驗證的最終 CSS。以 §6 的實際畫面與操作驗收收斂。

### 3.1 文案與操作共用容器

在 `HeroWorld.tsx` 增加內容容器，順序為標題／副標／操作列。將目前分散的 `.copy`、`.actions` 放在其中，保留所有 handler、條件與可及名稱。可加 `data-hero-content` 作為量測錨點。

parallax 下讓 `.copy`、`.actions` 回到正常文件流，以容器的 flex／grid gap 管理關係；避免再用兩組互不相關的 `top`、`bottom` 定位。

- 副標 → 操作列：一般字級先取桌機 24px、手機／短橫向 20px，驗收時以約 16–32px 為目標。
- 操作列可換行；文字放大後不截字、不縮到低於既有控制項字級。
- Enter 保持主要實心按鈕，Pause 保持次要樣式，Skip 保留奶油底 pill。
- world 的原本定位需要保留。可讓包裝容器在 world 使用 `display: contents`，parallax 才建立新排版；確認包裝沒有意外建立 world 的 containing block。

### 3.2 桌機：左側文字區，右側有完整景物

內容組先以左側約 6%、寬度約 42%、上限 36rem、距頂約 20% 排列。大尺寸及畫面含導覽時，實際量測首行是否被導覽遮住；所有座標以 Hero 容器為基準。

安全區需要覆蓋**整個內容組外框及至少 16px 的呼吸空間**。不能只把某一張路牌向旁邊移，因為其他道具稍後仍會捲過來。

建議對 **L1／L2 的靜止 layer 容器**使用水平透明遮罩，讓景物在文字區完全消失、往右柔和恢復：

- 第一版可試左側 50% 完全透明，至 64% 恢復完整景物。
- 遮罩不能掛在會移動的 strip，否則安全區本身會捲走。
- 實作時讓內容邊界與遮罩邊界共用 Hero 上的變數，或明確驗證兩者的幾何關係，避免兩個 CSS 模組各寫一套數字而漂移。
- 只處理道具背景；天空、連續路面與小紅保持原有色彩及清晰度。
- 目檢漸入區是否出現突兀的半棵樹／半座摩天輪；若明顯，調整過渡區寬度與內容位置。
- 在 Safari 驗證 mask 與動畫一起運作，不新增 blur、backdrop-filter 或額外 will-change 層。
- 遮罩若在目標瀏覽器有實際問題，改用分離的文字／場景版面；不以文字加粗或提高 z-index 取代安全區。

### 3.3 手機直向：內容在上，場景在其後

在現有 `≤768px` 範圍內，建議 Hero 用兩列 grid：

1. 標題、副標、操作列，依內容自然決定高度。
2. 視差場景，分配剩餘高度並維持裁切。

內容左右各留約 5%，置中；第一列包含 safe-area 上緣。L1／L2 取消桌機水平遮罩，手機直接以兩列分離保障文字安全。

注意：`.band` 改為第二列後，`--horizon` 的百分比會變成**場景列高度**，不再是整個 Hero。必须一起重新驗證路面位置、小紅腳底位置、L5、Skip，不能只搬容器就算完成。

- `--horizon: 55%` 僅是起點；以小紅仍為視覺主角、場景不被切成過矮的條帶為準。
- 第一列與道具最上緣需有至少 16px 視覺距離；第二列裁切不能切壞主要地標。
- 320×568 及 200% 文字放大時，兩個出口仍要完整、可操作；適度降低裝飾露出，不以隱藏出口解決高度不足。
- 保持主角 slot 置中、img 本身只負責 bob，避免兩個 transform 相互覆寫。

### 3.4 短橫向

沿用既有短橫向條件 `max-height: 560px`、`min-width: 600px`，先採左右配置與桌機背景安全區。

- 內容距頂先試 28px 加 safe-area，寬度約 43%；副標與 CTA 保持同組。
- 背景／主角留在右側，確認 CTA 折行後仍與 Skip 分離。
- 600–768px 會同時命中手機規則，須顯式處理 grid、band 定位與 `.heroSlot` 的置中 transform，避免主角被拉回文字區。
- 超寬但很矮的視窗也會命中此 media query；不得因套用手機縮放而讓三份 tile 蓋不住視窗。

### 3.5 前景份量

只動 L5 的單層縮放與 bottom，目標讓其**可見高度約比目前減少三分之一**，保留有節奏的草叢／花／石頭。

第一版可試 `.l5` 的 `--k: 0.8`、`bottom: calc(-40px * var(--s))`；再依桌機／手機截圖調整。不要縮小整個 `.band`，以免連小紅一起縮小。

`--k` 會同時縮短 tile 寬度。每個斷點都要檢查：

```text
可覆蓋寬度 = (TILE_COPIES - 1) × tile.width × --s × --k
可覆蓋寬度 ≥ band 寬度
```

若不成立，優先只降低露出高度，或限制此縮放的適用條件；不要為裝飾份量直接增加下載資產。Skip 底色維持可讀，不能被前景壓住或與主角重疊。

## 4. 預計修改檔案

| 檔案 | 用途 |
|---|---|
| `components/landing/hero-world/HeroWorld.tsx` | 內容與操作容器；保持兩種出口語意 |
| `components/landing/hero-world/HeroWorld.module.css` | 內容群組、直向 grid、短橫向與 safe-area |
| `components/landing/hero-parallax/HeroParallax.module.css` | L1／L2 安全區、手機場景列、L5 份量 |
| `e2e/intro-portal.spec.ts` | 必要的內容／場景分離與控制項回歸；沿用既有生命週期測試 |
| `e2e/visual.spec.ts` | 補短橫向／窄手機與必要的覆蓋層畫面 |
| `e2e/visual.spec.ts-snapshots/intro-*.png` | 在 macOS 重錄本輪改動的 Intro baseline |
| `docs/qa/hero-parallax/2026-09-11-visual-polish.md` | 接手者實作後填入的驗收報告，現在尚未建立 |
| `CHANGELOG.md`、`docs/HANDOVER-HERO-PARALLAX.md` | 驗證後同步可見行為、調整值與未完成的真機項目 |

`HeroParallax.tsx`、`layers.ts` 原則上不需改；若新增幾何測試需要錨點，可加小範圍 data 屬性。無須重新 compose 素材。

## 5. 執行順序（Task DAG）

| 任務 | 依賴 | 產出 |
|---|---|---|
| T0：盤點 HEAD／他人改動、建立獨立測試環境 | 無 | 確定待改檔案與 production server 的擁有者、埠號 |
| T1：重現截圖，記錄桌機／直向／短橫向現況 | T0 | before 畫面與重疊位置 |
| T2：內容群組與背景安全區 | T1 | TSX／CSS 最小修正，普通字級及放大字級可用 |
| T3：L5 減量及平鋪覆蓋 | T2 | 多尺寸 foreground 調整；路面与主角維持連續 |
| T4：動態抽樣、相關 e2e、工程／設計審查 | T2、T3 | 問題清單與修正；不能只看 reduced-motion 定格 |
| T5：macOS baseline 重錄與逐張目檢，再跑比較 | T4 | 可重現的 Intro baseline、PASS 證據 |
| T6：填驗收報告與 handover | T5 | 已驗／未驗明確分開，交由維護者做真機與 release 決策 |

這是涉及可見行為與動畫樣式的 L2 UI 調整；依 repo 流程安排獨立工程審與設計審。實作期間由同一人修改 Hero 檔案，審查者 readonly。不能把本文件標為已通過這些尚未執行的審查。

## 6. 驗收方式

### 6.1 畫面矩陣

| 情境 | 必看尺寸／條件 |
|---|---|
| 桌機 | 1280×720、1440×900、1470×739（接近使用者截圖比例）、1920×1080、2560×1440 |
| 手機直向 | 320×568、390×844、430×932 |
| 平板與斷點 | 768×1024、769×1024、980×720 |
| 短橫向 | 640×400、844×390、2560×540（超寬平鋪防漏） |
| 放大 | 1280×800 的 200% page zoom 等效 640×400；390×844 的 200% 文字放大 |
| 入口 | `/intro` 與全新 session 的 `/` 覆蓋層，至少桌機／手機／短橫向各一組 |
| 動態偏好 | 正常動畫、暫停、恢復、reduced motion、執行中切換 reduced motion |

量測瀏覽器的 CSS viewport，不以裝置名稱或截圖實體像素推算。手機 profile 的 screen size 不一定等於可用 viewport。

### 6.2 全程文字安全區

1. 用 `no-preference` 跑正常前 24 秒，觀察開始、6、12、18、即將休眠的畫面。
2. 恢復動態後檢查循環交界。可在 QA 中用 Web Animations API 暫停／seek，抽樣各層 0%、25%、50%、75%、接近 100% 位置，避免測试真的等待最慢層整圈。
3. 遮罩留在原位置、背景條帶確實移動；前後對照文字區裁圖，確認字形周邊沒有道具色塊穿過。
4. 至少查看 L1／L2 道具在過渡區的畫面，以及 L3 接縫進入視窗的畫面。路面不得出現細縫／露底，L5 不得蓋過主角與 Skip。
5. QA seek 只用於測試；產品的 24 秒休眠與動態時間預算不得因此修改。

**單靠 `toBeVisible()`、較高 z-index、DOM 外框不相交或一張靜態 baseline，不足以證明文字可讀。** 背景在較低 z-index 仍會透過字形間隙形成干擾；遮罩後的 layer 外框則可能仍與文字相交。

### 6.3 幾何、出口與載入

- 全部尺寸無水平溢出；band 留在 Hero 內。
- 文字組不被導覽／safe-area 遮住。正常字級下副標與 CTA 間距穩定；放大字級依換行自然增高。
- Enter、Pause、Skip 觸控區至少 44×44，出口完整留在首屏，且 `elementFromPoint` 命中正確控制項或其子節點。
- 直向場景不侵入內容列；短橫向恢復左右布局後主角仍在安全區外。
- 覆蓋層 Enter／Skip 關閉後，Landing 可用且焦點交回 main；`/intro` 的兩條連結可正常进站。
- 圖片在 hydration 前已載好／失敗、tile 404、reduced motion 等既有契約繼續通過。
- 用載入前裝上的 `PerformanceObserver` 觀察 LCP 與實際元素；版型改動可能改變 LCP，不預設它永遠是 road。記錄 viewport、DPR、網路／CPU 條件與 cold／warm，不以單次桌機數值代表手機。

### 6.4 指令與測試環境

**所有 e2e／visual 指令都要帶下列 URL，末尾不得含中文句號：**

```bash
npx vitest run components/landing/hero-parallax components/landing/hero-world
npm run typecheck
npm run lint

NEXT_PUBLIC_SITE_URL=https://podcast-website-mu.vercel.app npm run build
NEXT_PUBLIC_SITE_URL=https://podcast-website-mu.vercel.app npx playwright test e2e/intro-portal.spec.ts

# 先完成目檢，macOS 上才更新；新增的 Intro tests 也使用 Intro 名称以涵蓋此篩選。
NEXT_PUBLIC_SITE_URL=https://podcast-website-mu.vercel.app npm run test:visual:trusted -- --grep 'Intro .*parallax' --update-snapshots
NEXT_PUBLIC_SITE_URL=https://podcast-website-mu.vercel.app npm run test:visual:trusted -- --grep 'Intro .*parallax'
```

- `playwright.config.ts` 的 webServer 固定 3000。先確認埠號程序；不能看見 `next-server` 就判定是 production。
- 若 3000 為別的 session 的 dev server，使用獨立 worktree、自己的 `.next`、自己的 production server 與暫時 Playwright config。該 config 繼承原測試選項，只改 baseURL／webServer／outputDir，指向正確的測試及 snapshot 路徑。
- `PW_REUSE_SERVER=1` 只用於已確認由自己管理的 production server；不停止他人的 server、不覆寫他人的 `.next`。
- 本輪曾在隔離工作樹試 `next build --webpack`，被既有 `PlayMap.module.css` 的 pure selector 規則擋下；**不是 Hero 驗證成功，也不是本計畫要修的檔案**。接手者優先保持專案預設建置器；隔離依賴時處理 Turbopack root／node_modules 解析，不順手改地圖。
- 既有 `visual.spec.ts` 的全域 beforeEach 會標記「已看過開場」。新增覆蓋層 visual 時必須使用獨立 context 或明確排除該初始化；`reducedMotion: reduce` 也會讓首頁閘門關閉。因此覆蓋層快照須用正常偏好開啟，再由測試凍結動畫，不拿一張 Landing 當作覆蓋層 PASS。
- baseline 一定在 macOS 產生 `-chromium-darwin`，逐張查看。除既有 1440×900／390×844，至少補短橫向與窄手機；正常動態的暫停按鈕需有可見的 QA 證據。
- 不更新 feedback 或其他頁面的過期 baseline。非本輪失敗記錄原因與責任範圍。

## 7. Release gate 與真機交接

此次程式工作可交付的條件：三項視覺問題修正完成，相關 e2e／型別／lint／production build 通過，baseline 已重錄並驗證，工程與設計審查有實際結果。

**正式 release 另需實機確認**：iPhone Safari、Android Chrome 的 `/` 與 `/intro`，包含直向／橫向、工具列伸縮、safe-area、暫停／恢復、背景返回、兩個出口、減少動態及 LCP。設備不可用時寫 NOT-RUN，不用 Chromium 模擬取代。上線前依 Domain 跑完整 `npm run check`。

若修完後維護者尚未提供真機驗收，結論寫「版面修正與自動化驗證完成，真機待驗」，不能寫「已可正式發布」。Phase 3c 必須另案決策。

## 8. 風險、回滾與共同工作區

- 手機改列布局會改變場景高度與 LCP；重點查看短手機、文字放大，以及暫停鈕出現前後是否讓內容跳位。
- 桌機安全區過寬可能使左側過空、漸入的景物像被擦掉；以完整動畫目檢收斂。
- L5 縮小可能降低三份 tile 的覆蓋寬度；按 §3.5 逐斷點核算。
- 舊 world 經過新增 wrapper 必須維持原定位；保留既有單元測試，不加回已退役的 3D e2e。
- 回滾只撤回本次 Hero 排版及對應 Intro snapshots。不得用 `git reset --hard`、全工作區 checkout／stash 收走別人的檔案。
- 接手、改檔及交付前各看一次 `git status`。只 stage 自己的具名檔案；此任務沒有 commit／push 授權。

## 9. 本次交接實際狀態

- 已讀取既有 Hero TSX／CSS、視差 layer 定義、相關 unit／e2e／visual 規則，並定位到 `.copy`／`.actions` 分離定位與背景缺少安全區。
- 使用者改為只要 PLAN 後，本輪先前套用的 `HeroWorld.tsx`、`HeroWorld.module.css`、`HeroParallax.module.css` **均已撤回**；主工作區不保留這些未驗證的試作。
- 此 PLAN 是本次最終交付。沒有新的 Hero baseline，沒有可採信的本方案 e2e／效能結果，沒有宣稱真機 PASS。
- 先前 65 個單元測試通過屬於修改前的版本，不能充當新方案驗證。
- 他人目前可能在改 feedback snapshots、StoryPlayer、CHANGELOG、DESIGN；以接手當下工作區為準。
