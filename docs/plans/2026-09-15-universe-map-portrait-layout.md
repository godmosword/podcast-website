# PLAN — 宇宙地圖手機直向專用排布（美術審 H3）

日期：2026-09-15
狀態：**Approved with changes（v2）**——已吸收工程審（codex `gpt-5.6-luna`）與設計審（Opus）意見；**C-1 待使用者拍板**後即可 `/agent-action`。尚未實作、不可據此宣稱可 release。
風險級別：**L2**（多檔、可見行為；UI 風險：`transform`／`padding`，Opus 設計審已完成）。

## Goal

≤480 直向的 `/adventures` 世界層改用直式舞台與直式五島座標：390×844 小島 ≥120px 見方（C-1 選 (a) 則 ≥105px）、木牌互不疊、島與木牌不被 MapControls／IslandPickerStrip 壓到；進島後熱點標牌不遮島本體。桌機／橫向、deep link、OG 分享圖維持既有橫式契約零差。

## 起點（量測，2026-09-14 production build）

- 五島 cluster（含 `CONTENT_FIT_PAD`）= 986×717 stage px，橫式。
- 390×844：`fitAvailableViewport` → availW 294（扣 `LABEL_SCREEN_PAD` 28 + `MAP_CHROME_RIGHT` 68）、availH 668；contain 0.298 × `PORTRAIT_MAX_ZOOM` 1.15 × `FIT_MARGIN` 0.96 = 0.329 → 被 `MIN_SCALE` 0.34 夾在地板。每島 90×88 px、cluster 335×244，垂直餘裕 ≈424px。
- 舊解「填高 1.5」因外側島橫切退回 1.15；zoom 槓桿最多再 +14%。結論：**問題在構圖不在鏡頭**。
- 進島：島約 220px，三張熱點標牌（~100×29 + 桿 + 底座，48px 命中區）疊在島上。

## Scope / Out of scope

- In：直式舞台常數與五島直式座標（資料＋Zod 契約＋layout-aware camera）、`resolveUniverseMap(layout)`、所有 stage consumer 接 layout、相機 layout transition、直向熱點標牌配置、e2e／視覺基線、DESIGN.md／Art Bible 登記。
- Out：島嶼美術資產、夜間點燈資產（D4）、`/for-parents/play-map`、OG 分享圖（維持橫式）、deep-link URL 契約、ZoneSheet 內容、Landing。

## 審查結論摘要（v1 → v2 的變更依據）

工程審（codex，readonly，未撰寫 Plan）反駁 DAG 五點，全部採納：
1. `zone.camera.center`（`lib/camera.ts:41–47` deep link）與 `islandFocus(zoneId)`（`map-camera-utils.ts:89–105`）只讀橫式 → 直式進島焦點會用舊座標。**camera 必須 layout-aware。**
2. `useMapCamera.ts:71` 模組級 `CONTENT_CENTER` 快取橫式中心 → 移除。
3. resize 分支（`useMapCamera.ts:491–493`）只 clamp 不 re-fit → 旋轉不會自動重 fit；需要顯式 layout transition。
4. 漏列 consumer：`MapBridgeLayer.tsx:96–97`、`MapRoamerLayer.tsx:64–65,143`＋`.module.css`、`UniverseMapParallax.tsx:46–54`、`data/universe-decor.ts:143–144`（水域裝飾全是橫式座標，直式會落到舞台外）。
5. T4 不能與 T3 並行（`HotspotLayer` 位置來自 `resolved`）；e2e `stageTransform()`（`universe-map.spec.ts:26–36`）硬找 1000×720。
   另：夜燈是 tile-UV 跟著 tile 走（OK）；天象／海面／atmosphere 是 screen-space，**從「由座標推導」宣稱移除**。

設計審（Opus，readonly）判定 Approve with changes，必改八點，全部採納：
1. v1 草案座標實算 bbox **716×1022**（非 560×900）、forest tile 出舞台、tile box 兩兩重疊——T1 幾何約束改用島 footprint（tile 內縮橢圓）而非 tile box。
2. 根本矛盾：cp–forest 垂直橋要從 dino／rescue 之間穿過（兩島 x 距 ≥364 → cluster 寬 ≥700），而 availW 294 下小島 ≥120px 需 cluster 寬 ≤621。**→ C-1 待決策。**
3. 直式相機置中改在 chrome-free 盒內（`poseFor` offsetY＋`clampCamera` 吃 inset），否則 1400 高舞台以 844 置中會沉到 picker 底下。
4. `map-camera-visual.ts:63` 木牌 `--label-offset-y` 在 scale <0.5 翻到島上——直式 scale 0.45 會讓五張木牌全蓋島；門檻 layout-aware。
5. 熱點「倒掛」違反標牌語彙（桿朝上讀成吊牌、底座影變成第二個接地）→ **牌子永遠正立，`pos.y ≥ 0.5` 整支下移站到島前沙灘**；320 塞不下時 fallback 為 icon-only 48px 黏土鈕＋`aria-label`。
6. `fitScaleForBox` 直向改「底部帶預留＋盒內置中」而非單純不扣右欄（320×568 會被控制鈕壓到）。
7. 不用 `visibility: hidden`（會與夜圖 `visibility` crossfade 打架、把島 button 移出 a11y tree）；layout 判定併入 `measure()` 同一 tick；旋轉只在 `isMobilePortrait` 翻轉時 instant re-fit，一般 resize（iOS dvh 變動）維持只 clamp。
8. T6 同步 Art Bible §5／§10（座標空間 = 1000×720 的敘述加 v7 註記）與 DESIGN §103 tapHint 例外；T5 加 tapHint vs 最上島島圖斷言。

## 待決策

**C-1 直式構圖取捨（使用者拍板）**

| 選項 | 內容 | 代價 |
|------|------|------|
| **(b) 建議** | 直式世界層把 chrome 當「底部帶」預留（picker＋控制鈕疊高），不扣整欄 `MAP_CHROME_RIGHT` → availW 334；採設計審替代座標（stage 720×1400：forest (360,235)、dino (175,580)、rescue (545,600)、car-park (360,980)、ocean (330,1310)），ocean 改到正下方偏左讓右下角空給 MapControls。實算 scale 0.454 → 小島 **120px**、hero 150px | 直式必須拿掉 rescue–ocean 這條橋（layout-aware `BRIDGE_EDGES`，7 → 6 邊；ocean 為 `planned`、本就是 dashed 淡橋，手機另有 picker strip） |
| (a) | 保留 7 邊與現行右欄預留，Goal 放寬到小島 ≥105px | 只達 +17%，木牌／控制鈕避讓仍靠縮小整體 |

未拍板前 T1 不得鎖測試、T5 不得重錄 baseline。以下 DAG 依 (b) 撰寫；選 (a) 只改 T1 座標與 Goal 門檻。

## 方案

### A. 版面：第二套「直式」權威座標（含 camera）

- `data/universe.ts`：`MAP_STAGE_PORTRAIT = { width: 720, height: 1400 }`；每 zone 新增 `worldPortrait: {x,y}` 與 `cameraPortrait`（或 `camera` 改為 `{ landscape, portrait }`，T0 定契約）；schema 必填（五島全給，不半套）。`BRIDGE_EDGES` layout-aware（直式去 rescue–ocean）。
- `data/universe-zones.ts`：`type MapLayout = "landscape" | "portrait"`、`getMapStage(layout)`、`getZones(layout)`、`isMobilePortrait(w,h)`（與 `fitAvailableViewport` 的 `mobilePortrait` 共用同一式）。既有 `MAP_STAGE`／`ZONES` 匯出不動（= landscape）：`og.tsx`、`story-zones`、`ZoneBadge`、deep-link 零差。
- `data/universe-decor.ts`：水域裝飾加直式座標集或依 layout 過濾（落在直式舞台外者不畫）。
- T1 幾何測試（用島 footprint，不用 tile box）：footprint 兩兩不相交；全 footprint 在舞台內；bbox 寬 ≤ availW×`FIT_MARGIN`÷目標 scale；目標 scale 下木牌矩形（螢幕固定尺寸反算）不進其他島 footprint；橋可見段不穿第三島、橋不交叉；ocean 及其木牌 x 最右 < 控制鈕左緣。

### B. 選 layout：與相機同一份量測、同一個 tick

- `useMapCamera.measure()`（`useMapCamera.ts:450–494`）內同時算 `isMobilePortrait(rect)` → layout state，與 `setIsMeasured`／首次 `publishCam` 同批 commit，首幀不會出現橫式島。`.island` 只 transition `transform`、`left/top` 無 transition，座標切換是瞬跳不是滑動——不需要任何遮罩。
- 旋轉：**只有 `isMobilePortrait` 翻轉**才 `resetForLayout(layout)`：重算 stage、`resolveUniverseMap(layout)`、`fitScaleFor(w,h,layout)` instant re-fit（reduced-motion 與否一致）；進島狀態以 `islandFocus(zoneId, layout)` 重對焦。一般 resize 維持只 clamp。
- SSR 固定 landscape；`MAP_PORTRAIT_LAYOUT_ENABLED=false` 時 layout 恆為 landscape。

### C. 相機工具吃 layout

`map-camera-utils.ts`：`islandContentBounds/Center(layout)`、`fitScaleFor(w,h,layout)`、`fitAvailableViewport(w,h,layout)`（直式：底部帶 = picker 72 + 8 + 12 + 56 疊高，右側只扣 `LABEL_SCREEN_PAD`）、`clampCamera(next,w,h,stage,inset)`（舞台放得下時在 chrome-free 盒內置中，不是整個 viewport）、`islandFocus(zoneId,layout)`、`anyPointVisible(..., layout)`；`lib/camera.ts` `targetToFlyParams` 帶 layout。預設參數 `"landscape"`，既有呼叫端與測試不改也過。直式走純 contain（`FIT_MARGIN` 直式用 1.0，底部帶已是呼吸），`PORTRAIT_MAX_ZOOM` 只在 landscape 且 h>w（平板直立）生效，註解登記。`map-camera-visual.ts:63` 木牌翻轉門檻 layout-aware（直式 scale ≥0.4 維持 6px 下掛）。移除 `useMapCamera.ts:71` `CONTENT_CENTER`。

### D. 進島熱點標牌（直向）

`HotspotLayer.tsx`／`.module.css`：
- `fitScaleForBox` 直向：底部帶預留＋盒內置中（`poseFor` offsetY），不是單純不扣右欄。
- ≤480 compact：icon 18px、字級 `--fs-meta`、`max-width: 6.5rem`、padding 0.2rem 0.5rem；命中區維持 48px；顏色維持 `#c88836` 家族固定美術色。
- `pos.y ≥ 0.5`：**牌子正立、整支下移**（`data-side="below"` 只改位移，不翻方向），站到島前沙灘；底座仍為接地點，命中區留在錨點。
- 320 三張塞不下：fallback icon-only 48px 黏土圓鈕＋`aria-label`，名稱由 hotspot modal 標題承擔（不做「聚焦才展開」——觸控無 hover，等於點兩次）。
- 驗收：牌面兩兩不相交；牌面不壓島名木牌（`tileLabel`）；底座落在錨點；牌面不進「島 footprint 中心 40% 區域」。

### E. 回滾閥

`lib/universe/dev-map-flags.ts` 新增 `MAP_PORTRAIT_LAYOUT_ENABLED = true`；false 時 layout 恆 landscape（D 的 compact 標牌不受旗標影響）。翻旗標即回滾，資料欄位保留無害。

## Task DAG（v2，依工程審最小可行版重排）

- [ ] T0（L1）layout 契約：`MapLayout`、`getMapStage`、`getZones`、`isMobilePortrait`、layout-aware `ZoneDef`（含 camera）、`islandFocus/ContentBounds/ContentCenter(layout)` 簽名；移除 `CONTENT_CENTER`；單元測試（預設 landscape 與既有輸出 byte-equal）— 依賴：C-1
- [ ] T1（L1）資料與 resolver：`data/universe.ts`（stage、`worldPortrait`、`cameraPortrait`、layout-aware `BRIDGE_EDGES`）、`universe.schema.ts`、`universe-zones.ts`、`universe-decor.ts`；`resolveUniverseMap(layout)` 回傳 `zones/bridges/stage/viewBox`；T1 幾何測試（footprint 版，見 A）— 依賴：T0
- [ ] T2（L2）所有 stage consumer 一次接上 layout：`UniverseMap.tsx`（stage 尺寸／svg viewBox／島影）、`MapBridgeLayer.tsx`、`MapRoamerLayer.tsx`＋`.module.css`、`UniverseMapParallax.tsx`、`useRoamerSim.ts`（map space `stageH`）、`roamer-coords.ts` 呼叫端；明確分類 zone-relative（島、橋、漫遊車、接地影、夜燈）vs screen-space（海面、天象、atmosphere、title、controls）；`map-camera-utils`／`map-camera-visual`／`lib/camera.ts` 的 C 節改動併入此任務（同檔單一執行者）；單元測試：320×568／360×640／375×667／390×844 直式 fit scale、小島螢幕寬 ≥120、cluster 底 ≤ viewportH − 底部帶、任一島 footprint／木牌 ∩ MapControls 矩形 = ∅、木牌翻轉門檻 — 依賴：T1
- [ ] T3（L2，UI）相機 layout transition：`useMapCamera.measure()` 同 tick 判 layout、`resetForLayout` 只在翻轉時 instant re-fit、進島重對焦、一般 resize 只 clamp、reduced-motion 同路徑、`MAP_PORTRAIT_LAYOUT_ENABLED` — 依賴：T2
- [ ] T4（L2，UI）Hotspot：compact、正立下移、320 icon-only fallback、直向 `fitScaleForBox` 底部帶＋盒內置中、幾何單元測試（D 節四條）— 依賴：T3（**不與 T3 並行**）
- [ ] T5（L2）e2e／視覺：先改 `stageTransform()` 讀 `data-layout`／stage metadata；新增 320／360／375／390 直向：首幀無橫式島、五島實際可見面積（非 `toBeInViewport`）、木牌 overlap、hotspot 不進島心 40%、tapHint vs 最上島島圖與木牌、旋轉後 stage／camera／active island focus；重估既有手機案例（`universe-map.spec.ts:185–225, 238–252, 569–579, 636–657, 681–720`）不放寬門檻；桌機橫式 regression；`adventures-390-{light,night}` baseline 逐張目檢後重錄 — 依賴：T3、T4
- [ ] T6（L1）文件：DESIGN.md「宇宙地圖景深層」旁登記直式舞台（第二套權威座標＋camera、OG 維持橫式、`isMobilePortrait` 單一判準、直式 6 邊）、DESIGN §103 tapHint 直式例外、`docs/UNIVERSE-ART-BIBLE.md` §5／§10 v7 註記、CHANGELOG、TODOS 收 H3 — 依賴：T5

同一檔案禁止多 agent 同時修改：`map-camera-utils.ts`／`map-camera-visual.ts`／`lib/camera.ts` 只由 T2 改；`HotspotLayer.*` 只由 T4 改。

## Files likely touched

- data/universe.ts、data/universe.schema.ts、data/universe-zones.ts、data/universe-decor.ts（＋各自 test）
- lib/universe-map.ts、lib/universe/map-camera-utils.ts、lib/universe/map-camera-visual.ts、lib/camera.ts、lib/universe/dev-map-flags.ts（＋test）
- components/universe/UniverseMap.tsx、useMapCamera.ts、useRoamerSim.ts、MapBridgeLayer.tsx、MapRoamerLayer.tsx、MapRoamerLayer.module.css、UniverseMapParallax.tsx、HotspotLayer.tsx、HotspotLayer.module.css
- e2e/universe-map.spec.ts、e2e/visual.spec.ts-snapshots/adventures-390-*.png
- DESIGN.md、docs/UNIVERSE-ART-BIBLE.md、CHANGELOG.md、TODOS.md
- 不碰：lib/universe/og.tsx、lib/universe/zone-deep-link.ts、data/story-zones.ts、components/story/ZoneBadge.tsx、SkyBodies.tsx（screen-space）、ZoneNightLights（tile-UV）

## Verification

- `npx vitest run data/universe lib/universe lib/universe-map lib/camera components/universe`
- `npm run typecheck`
- e2e（3000 常被 dev 佔用，依既有做法建 `playwright.tmp.config.ts` 指 3100，`NEXT_PUBLIC_SITE_URL=https://podcast-website-mu.vercel.app` build＋start）：`npx playwright test -c playwright.tmp.config.ts e2e/universe-map.spec.ts`
- 視覺：`VISUAL_BASELINE_TRUSTED=1 npx playwright test -c playwright.tmp.config.ts e2e/visual.spec.ts --grep adventures`，diff 逐張目檢後 `--update-snapshots`
- 手動：320×568、390×844、1280×800 各截世界層＋恐龍島進島（日／夜），貼進 PR

## Risks & rollback

- 首幀錯位：layout 與首次 `publishCam` 不同 commit → T3 以同 tick 批次消除；T5 首幀斷言鎖住。
- 旋轉跳動：只在 `isMobilePortrait` 翻轉時 instant re-fit；不 flyTo（避免「島先跳、鏡頭再滑」）。
- 直式座標美感：T1 只鎖幾何；構圖以 T5 截圖＋Leader 目檢定案，未定案不重錄 baseline。
- consumer 漏接：T2 以 grep `MAP_STAGE|ZONES` 清單逐一過（含 `universe-decor.ts`）。
- e2e 既有手機案例隱含橫式假設：T5 逐案重估，不放寬門檻。
- 回滾：`MAP_PORTRAIT_LAYOUT_ENABLED=false`。

## Review decision

- 已完成的審查：工程審（codex `gpt-5.6-luna`，readonly；以臨時 `CODEX_HOME` 繞過 config.toml 相容問題，見 AGENT-FAILURES）；設計審（Opus，Agent tool readonly）。對抗審依 L2 條件不需派。
- **Approved with changes**：v2 已吸收兩審全部必改項。**待決策：C-1（建議 (b)）**——拍板後以 `/agent-action` 依 T0 → T6 執行。

## Agent 執行分配表

| 任務 ID | subagent_type | model slug | 做了什麼 | 產出 | 狀態 |
|----------|---------------|------------|----------|------|------|
| Leader | — | Claude Code session（Opus） | 量測、草擬 v1、綜合兩審成 v2 | 本文件 | 完成 |
| Review-Eng | shell readonly | `gpt-5.6-luna`（codex exec） | 反駁 DAG 5 點、列 MAP_STAGE consumer、e2e 衝突、最小 DAG | 已併入「審查結論摘要」 | 完成 |
| Review-Design | Agent readonly | Opus | 座標實算、C-1 兩案、標牌語彙、動效與紅線 | 已併入「審查結論摘要」 | 完成 |
| Verify | shell | — | `npx vitest run scripts/check-agent-docs-contract.test.ts` | 8 passed | 完成 |
| Ship | — | Leader | 未 commit／push | — | 未執行 |
