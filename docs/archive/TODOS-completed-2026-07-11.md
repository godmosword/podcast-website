# TODOS Completed Archive — 2026-07-11

> 自 `TODOS.md` 重整移入。現役優先序見主檔檔首「現役隊列」。歷史 commit hash 保留於下文。

## 設計不變式（封存時有效，勿因整理而回歸）

- Landing scroll-snap 受 `prefers-reduced-motion` 控管（見 [DESIGN.md](../DESIGN.md)）
- Viewport 允許家長 pinch-zoom（WCAG 1.4.4），不得為 CTA 重新鎖縮放
- 宇宙地圖場景為「印刷地圖」固定淺色，日夜兩態不反轉
- 觸控目標兒童主路徑 ≥44px（footer 已完成：UX-P0-2 `964f418`）
- 遊戲進度／Candy Kart bridge schema 見 Game Kit 文件

## MAP-ROAM 已入主線（2026-07-11 文件對帳）

| Task | Commit | 備註 |
|------|--------|------|
| MAP-ROAM-2 縮放控制列 | `3166cc5` | 步進／hit area／aria |
| MAP-ROAM-3 少字童趣 UI | `3166cc5` | 島名／pill／「看看」圖示化 |
| MAP-ROAM-4 層次升級概念 | `3166cc5` | `docs/UNIVERSE-PROGRESSION-CONCEPT.md` |
| MAP-ROAM-5 平移核心 | `503ad8b` | slop／rAF／inertia |

---

## GEO 實作計畫 + 第二階段

## GEO 實作計畫（已完成，封存）

> **Gate：** 已核可並完成實作。每個 Task 完成後單獨 commit，訊息格式固定為 `geo: task-N <描述>`，commit hash 已回填。
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

### GEO 已結案紀錄

- `/characters` 已於 GEO-2 上線為 SSG 公開角色頁（`f3687e0`），只讀 `data/characters.ts`／`data/characters.json`。
- `dateModified` 已由 `data/story-dates.ts` 與 `data/page-freshness-dates.ts` 維護，並在 sitemap／metadata／JSON-LD 對齊（`f3687e0`、`6d1e8b1`）。
- `/llms-full.txt` 已改自動產生並接入 `prebuild`（`581b8aa`），避免手寫漂移。
- `/for-parents` 的 `[待確認]` 佔位已升為 W27-1，本週清除，不再留在 GEO 決策池。

### GEO llms 收尾（2026-07-02）

| Task | 狀態 | 主要產出 | 驗證 | Commit hash |
|------|------|----------|------|-------------|
| llms.txt 補路由 | 完成 | `public/llms.txt` 主要路由地圖補 `/for-parents`、`/characters` 兩行 | `git diff -- public/llms.txt` 確認只新增指定兩行 | `cfd1c5f` |
| llms-full.txt 自動產生 | 完成 | 新增 `scripts/generate-llms-full.ts`、`scripts/generate-llms-full.test.ts`、`public/llms-full.txt`，並接入 `prebuild` | `npm run generate:llms-full` passed；`npm run build` passed；`npx tsc --noEmit` passed；`npm test` passed | `581b8aa` |

---

## GEO 第二階段（低干擾閱讀）

> **策略：** 可見層短、機器層全（JSON-LD／llms-full／VTT）、展開層選用 `<details>`。Approved Plan：`/tmp/agent-plan-1783669925.md`。

| Task | 狀態 | 主要產出 | 預計影響檔案 | 驗證 | Commit hash |
|------|------|----------|--------------|------|-------------|
| GEO-P1 單集頁瘦身 | 完成 | 首屏只留定義式摘要；精簡 3 點大綱 + 完整大綱／VTT 收合；角色一行摘要 + 收合；家長延伸收合並連 `/for-parents`；FAQ 可見 1 題其餘收合；JSON-LD FAQ 維持完整 | Modify: `app/story/[slug]/page.tsx`, `page.module.css`, `lib/story-geo.ts`, `lib/story-geo.test.ts` | `npm test` + `npm run build` + `npx tsc --noEmit` passed | `a34f5fe` |
| GEO-P2 離頁匯流 | 完成 | llms-full 每集加大綱要點與 VTT 連結；單集 metadata `alternates.types.text/vtt`；主題／車種頁短導言 + FAQPage JSON-LD | Modify: `scripts/generate-llms-full.ts`, `lib/story-metadata.ts`, `app/topic/[tag]/page.tsx`, `app/vehicles/[vehicle]/page.tsx`; Create: `lib/topic-geo.ts`, `lib/vehicle-geo.ts` + tests | `npm test` + `npm run build` + `npx tsc --noEmit` passed | `a34f5fe` |
| GEO-P3 欄位契約 | 完成 | `docs/GEO-CONTENT-CONTRACT.md`；`lib/geo-content-contract.ts` 通路常數與重複文案檢查 + 測試 | Create: `docs/GEO-CONTENT-CONTRACT.md`, `lib/geo-content-contract.ts`, `lib/geo-content-contract.test.ts`; Modify: `data/content.ts`（JSDoc 連結） | `npm test -- lib/geo-content-contract.test.ts` passed | `a34f5fe` |
| GEO-P4 量測 | 完成 | `docs/geo-checklist.md` 補 llms-full、主題／車種 schema、單集預設可見字數、`<details>` 收合檢查 | Modify: `docs/geo-checklist.md` | 人工清單可執行 | `a34f5fe` |

### GEO 收尾（2026-07-10）

| Task | 狀態 | 主要產出 | 驗證 | Commit hash |
|------|------|----------|------|-------------|
| W27-1 for-parents 佔位清除 | 完成 | 資料層直出數字、定稿年齡與同步文案 | `lib/for-parents.test.ts` | `dbfe7b3` |
| geo-audit 快照 | 完成 | `docs/geo-audit.md` 頂部 2026-07-10 摘要 | — | `dbfe7b3` |
| GEO baseline | 完成 | `docs/metrics/GEO-baseline-2026-07-10.md` | 本機 test/build/verify | `dbfe7b3` |
| REUSE-2 parentGuide | 完成 | sidecar + ShowNotes | `data/parent-guides.test.ts` | `dbfe7b3` |
| SEO polish | 完成 | `/legal`、`/topic` canonical；全集 ageRange 預設 | `npm test` | `dbfe7b3` |

## 設計審查 + 宇宙地圖 UX（已完成）

## 設計審查 deferred 發現（2026-07-03 /design-review）

> 完整報告：`~/.gstack/projects/godmosword-podcast-website/designs/design-audit-20260703/`。
> 已修：F1 小衝破圖 `3a3d582` · F2 landing 主標斷行 `cfbfebf`（斷行策略修正 `30e8300`：主標整句一行、其餘標題於「·」後斷）· F4a 全域 focus ring token 化 `d27ecf5`。
> **2026-07-04 更新：** Map v6（`4f496c9`，forest 島＋click-to-zoom＋新 bottom sheet＋海天融接）已落地，下列宇宙地圖三項的「universe 改動落地」前置已解除，但需**對照 v6 重新驗證**是否仍成立（sheet 流程與縮放行為已改）。

### ~~森林小島底部洋紅色暈圈（v6 資產 bug）~~　`asset · S · 無`　〔design〕 ✅
正式站 `/adventures` 森林小島底緣有一圈 magenta 殘留（生圖 chroma-key 去背不完全，烘進 `public/adventures/zones/forest*.png/webp`）。**已修**：`npm run fix:forest-zone`（boundary flood magenta predicate + despill，重產 webp），`verify:zone-art` 加 fringe=0 迴歸斷言。`c33ebb3` `ea49200`

### ~~宇宙地圖 zone sheet 主 CTA 層級~~　`design · S · universe 改動落地`　〔design〕 ✅
車車樂園 sheet 四顆入口按鈕視覺權重相同，違反 one-primary-CTA；「全部故事」改 landing CTA 橘實色主按鈕、grid 整行置頂，其餘維持次要。日夜驗證。`99e5379`

### ~~宇宙地圖 focus 外框形狀~~　`design · S · universe 改動落地`　〔design+a11y〕 ✅
島嶼 focus ring 改 `tileStack::after` 橢圓雙環（日 `--ink`／夜 `--c-yellow`，跟隨 float/jelly）`5574636`；sheet 初始焦點移到 dialog 容器（`useFocusTrap` 加 `initialFocus: "container"` 選項＋panel `tabIndex=-1`），開啟瞬間 ✕ 不再閃粗黑框 `8f35732`。

### ~~手機版地圖初始構圖 letterbox／舞台硬邊~~　`design · M`　〔design〕 ✅
**已由「海洋滿版」（map-fullbleed task-1~4）解決**：sea rect 以 SEA_BLEED=7200 外擴滿版、移除 rx=40 圓角與 seaHazeTop 接縫；視差層改近景頂層雲（刪遠島剪影）、日月改 screen-space 固定天象（z:3）。相機 fit 行為不變（fitScaleFor 抽純函式+測試）。驗證：{375/1280}×{日/夜}×{fit/MIN_SCALE/pan} 截圖矩陣、prod-mode deep link + e2e 10/10。`8ea28eb` `3b13a55` `b83e48d` `71f0f28`

### 宇宙地圖 dev 模式兩個既有問題（v6，非 map-fullbleed 引入）　`bug · S · 無`　〔eng〕
① ~~console error「button cannot contain a nested button」×2~~ ✅ **已修**：確認即 hydration #418 根因（正式站可重現、本地 prod build 修後 console 乾淨）；許願 button 改兄弟 wishLayer 鏡像 tile 定位。`6c54c93`。② ~~dev 模式 `?zone=` deep link 不開 sheet（疑 StrictMode 雙效應與 openTimer 互動）~~ ✅ **已修**：根因為 StrictMode 模擬卸載 cleanup 清 timer 但門閂已鎖；改條件式 cleanup 釋放門閂＋query 清空重置。連帶修復鏡頭未飛抵目標島（viewport 未量測時 flyTo 靜默 no-op，prod 也中）與進場動畫互搶競態。StrictMode 元件測試＋4 條 E2E 鎖定。`61d098b`

### 宇宙地圖 UX 修正（2026-07-06）

> **Gate：** 依 Claude plan `podcast-lucky-marshmallow` 執行。每項完成後單獨 commit，最後回填 commit hash；收尾需跑 Playwright 375/1280 × 日/夜矩陣並 push main。
> **Commit 切分：** `fix(map): avoid island labels overlapping southern islands` → `feat(map): center islands when focusing map camera` → `refactor(map): simplify map zoom controls` → `feat(map): let roamers greet on tap` → `docs(map): record universe map ux completion`。
> **介面變動記錄：** `useMapCamera` 加 `canZoomIn`／`canZoomOut`／`panBy` 並移除 click-zoom/context-menu bind；`MapControls` 加可選 disabled props；roamer render 加 tap/greeting props；`trackUniverseRoamerTap(characterId)`、`SfxKind="horn"`、`getCharacterName(id)`。

| Task | 狀態 | 主要產出 | 預計影響檔案 | 驗證 | Commit hash |
|------|------|----------|--------------|------|-------------|
| MAP-UX-1 Label 避讓南島 | 完成 | 鎖島「看看」併入 `.pillRow` 第三個 child、修正 `.pillRow`/pill/chip aria、縮短 wish pill 高度；dino/rescue 座標北移；手機 fit 低縮放 label lift，label 不再壓 forest/ocean | Modify: `components/universe/ZoneIsland.tsx`, `components/universe/ZoneIsland.module.css`, `data/universe-zones.ts`; Test: `components/universe/ZoneIsland.test.tsx` | `npm test` passed；`npm run build` passed；`npm run test:e2e` passed，Playwright 375/1280 × 日/夜確認 dino/rescue label 底距南島非透明圖頂 ≥16px | `7a6c6c2` |
| MAP-UX-2 點島置中 | 完成 | 抽 `clampCamera` 純函式，放寬 clamp 讓角落島可置中；鎖島 tap 也 fly-to 但維持 jelly/bubble、不開 sheet | Modify: `lib/universe/map-camera-utils.ts`, `components/universe/useMapCamera.ts`, `components/universe/UniverseMap.tsx`; Test: `lib/universe/map-camera-utils.test.ts` | `npm test` passed；`npm run build` passed；`npm run test:e2e` passed；`clampCamera` fit/zoom/bounds 單元測試覆蓋 | `8d2a7cc` |
| MAP-UX-3 縮放重整 | 完成 | 移除滑鼠左鍵放大/右鍵縮小與右鍵選單劫持；`＋/－` 到 min/max 時 disabled；viewport 支援鍵盤 `+/-` 與方向鍵平移 | Modify: `components/universe/useMapCamera.ts`, `components/universe/UniverseMap.tsx`, `components/universe/MapControls.tsx`, `components/universe/MapControls.module.css`, `lib/universe/map-camera-utils.ts`; Test: `components/universe/MapControls.test.tsx`, `lib/universe/map-camera-utils.test.ts` | `npm test` passed；`npm run build` passed；`npm run test:e2e` passed，Playwright 驗證 disabled attr、鍵盤 transform 變化、點空白海不改 scale | `3d1f84b` |
| MAP-UX-4 Roamer 點擊打招呼 | 完成 | 車車可點擊暫停並打招呼：名字泡泡、sprite 彈跳、喇叭音效、analytics；島內 roamer 點擊 `stopPropagation`，不觸發島 fly/sheet | Modify: `components/universe/MapRoamerLayer.tsx`, `components/universe/IslandRoamerLayer.tsx`, `components/universe/RoamerVehicle.tsx`, `components/universe/useRoamerSim.ts`, `data/universe-roamers.ts`, `data/characters.ts`, `lib/sfx.ts`, `lib/analytics.ts`; Create: `components/universe/RoamerGreeting.tsx`, `components/universe/RoamerGreeting.module.css`; Test: `components/universe/RoamerVehicle.test.tsx`, `components/universe/useRoamerSim.test.ts`, `data/universe-roamers.test.ts`, `data/characters.test.ts` | `npm test` passed；`npm run build` passed；`npm run test:e2e` passed，Playwright click `roam-xiaohong` 顯示「嗨！我是小紅賽車！」，click `roam-aku` 不開島 sheet | `58edb1b` |
| MAP-UX-5 全域驗證與收尾 | 完成 | 新增 `e2e/universe-map.spec.ts`，覆蓋 375/1280 × 日/夜、label clearance、zoom disabled、鍵盤、空白海 click、roamer greeting；跑完整驗證；回填本段 commit hash；分 commit 後 push main | Modify: `e2e/universe-map.spec.ts`, `TODOS.md` | `npm test` passed（103 files / 477 tests）；`npm run build` passed；`npm run test:e2e` passed（25 tests） | `c874ee9` |

### 宇宙地圖遨遊升級（2026-07-09，plan `/tmp/agent-plan-1783596255.md`）

> 決策：A① 強化 `＋/－`（方向鍵維持 pan）｜B 兩段式＋構圖一致｜C 未來園區→**未來夢想島**（顯示名）｜D 層次升級僅設計文件。  
> 後續：`useMapCamera` 拖曳核心已重寫（slop／rAF／inertia）；ocean `id` 不變。

| Task | 狀態 | 摘要 | 驗證 | Commit hash |
|------|------|------|------|-------------|
| MAP-ROAM-1 點島構圖一致 | 完成 | dock offset 構圖一致（`3166cc5`）；點擊語意後改**單段式**（`a2b63fe` 取代 07-09 兩段式） | unit + e2e | `3166cc5` |
| MAP-ROAM-2 縮放控制列 | 完成 | 步進 0.32／-0.24；手機／平板加大 hit area；aria 釐清 | MapControls + e2e zoom | `3166cc5` |
| MAP-ROAM-3 少字童趣 UI | 完成 | 島名略放大、pill 降權、「看看」圖示化；守 label 淨空 ≥16px | ZoneIsland + e2e clearance | `3166cc5` |
| MAP-ROAM-4 層次升級概念 | 完成 | `docs/UNIVERSE-PROGRESSION-CONCEPT.md` | 文件審 | `3166cc5` |
| MAP-ROAM-5 平移核心 | 完成 | slop／rAF 批次／inertia（reduced-motion 關慣性） | unit + e2e | `503ad8b` |

### 宇宙地圖兒童易用性重構（2026-07-10，plan `/tmp/agent-plan-1783686748.md`）

> 決策：Q3=**A′ 單段式＋馴化鏡頭**（翻 07-09 兩段式，明示同意）｜Q5=統一點擊語意（移除 👀）｜Q7=同意翻 Decision D 做無文字語意｜Q4=語音 T6 延後成獨立 ticket。
> 委員會：GPT 5.5 工程審＋Opus 4.8 架構審（Conditional Approve 條件全數整合）；diff 審 GPT 5.5。

| Task | 狀態 | 摘要 | 驗證 | Commit hash |
|------|------|------|------|-------------|
| T1+T2 單段式＋狀態機＋e2e | 完成 | `MapInteraction` 狀態機（idle→flying→sheet）取代三 ref 門閂；點任何島（含鎖島）一次開 sheet；連點加速；deep link 同路徑；移除 👀 | `npm test` 517、deeplink StrictMode 測試、e2e 單段式＋鎖島＋deep link 4 條 | `a2b63fe` |
| T-CAM 鏡頭馴化（A′） | 完成 | `MAX_SCALE` 2.4→2.0；`anyPointVisible`＋靜止 700ms 島群全離場自動回樂園 | unit 3 條＋e2e 迷路自救 | `a2b63fe` |
| T3 ZoneSheet 兒童分流 | 完成 | 故事大圖卡（≥56px 整卡可點）；許願＋trust strip＋car-park 次要入口收進「給爸爸媽媽」disclosure | ZoneSheet 測試 5 條＋smoke | `29b6d0a` |
| T4 回樂園自救鈕 | 完成 | reset 鈕改房子 icon＋「回樂園」文字 | MapControls 測試＋e2e | `a2b63fe` |
| T5 無文字語意層（翻 Decision D） | 完成 | pill icon 🎉🚧🎁💭、開放島氣球🎈、首訪「👆點點看！」（session 一次） | ZoneIsland／universe-zones 測試 | `a2b63fe` |
| T6 聽覺語言（點島唸島名） | **延後**（獨立 ticket） | 需錄音資產＋預設開關＋家長授權決策 | — | — |

## 車車宇宙樂園地圖 R0–Art Bible

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

## ❄️ FROZEN — 車車宇宙樂園地圖（v5 收尾：資產待產）　`asset · M · /adventures`　〔design〕

> 2026-07 設計審查結論：工程管線與接點已就緒，剩以下資產需生圖管線（`OPENAI_API_KEY`）產出後點亮。程式端 v5 收尾（黏土日月接線／去向量月光線／夜罩弱化／夜海惰性載入／視差遠島撤出底部／外連開窗修復）已完成。
> **凍結決策（2026-07-04）：** 地圖美術長尾全部等 STEM-P1 gate 後再解凍；本週只保留 W27-3 森林小島 magenta 暈圈修復。

- [ ] ❄️ **car-park motionParts 零件 PNG**：`car-park.wheel.png`（摩天輪，pivot 輪轂）+ `car-park.flags.png`（彩旗）——§12.1 鐵律：base 已烘焙可動部位，**base 必須一併重出**否則疊影；到位後 `ZONE_MOTION` 對應零件改 `enabled: true`
- [ ] ❄️ **海面 `sea@2x.png` / `sea-night@2x.png`**（§14.1 規格要求）：到位後海面改 CSS `image-set()` 平鋪（SVG `<pattern><image>` 吃不了 srcset），順帶天然懶載
- [ ] ❄️ **漫遊車 rear 視圖**：`xiao-hong.rear.png`、`duo-duo.rear.png`（`npm run generate:roamer-assets`），到位後 `MAP_ROAMERS` 補 `sprites:{front,rear}`
- [ ] ❄️ **planned 狀態美術**（ocean 島）：霧色未成形地基 + 「?」告示浮標（v2 §6），取代純降彩度

## ❄️ FROZEN — 車車宇宙樂園地圖（R-joy 2/3：迪士尼樂園感）　`asset · M · /adventures`　〔design〕

> R-joy 1（純程式：weenie 主島放大、進場降落、點島慶祝+音效、招牌羅盤、鏡頭露天空、舞台圓角）已完成。
> R-joy 2/3 **純程式部分已完成**：`MAP_DECOR` 密度包 11 件（帆船/浮標/魚/鳥/螢火）、開放橋黏土棧道三層描邊、`NightFireworks` 夜間煙火光效、開放島夜間點燈。剩餘為生圖管線資產：
> **凍結決策（2026-07-04）：** 等 STEM-P1 gate 後再重開。

- [ ] ❄️ **R-joy 2 資產**：黏土填充 PNG（鯨魚噴水／燈塔小嶼／漂浮氣球）取代或補充 SVG decor；島際渡輪 roamer（走 `MAP_ROAMERS` stage path，需新角色 sprite）；橋面彩旗串
- [ ] ❄️ **R-joy 3 資產**：四島 `srcNight` 點燈版（§12.5 契約已備；**程式路徑已接線** `b64f223`：`ZONE_ART_TILES.hasNightArt` flag＋`zones/{id}.night.png` srcset＋tile crossfade lazy mount，資產落地後翻該島 flag 即點亮）；黏土煙火 sprite 循環（§12.2，12–24 幀，取代 CSS 光效粒子）；月光波紋烘進 `sea-night.png`

**changelog：** car-park 黃金樣本 + Art Bible v2 + R1 四島整島黏土化 `045f457`。

---

## 車車宇宙樂園地圖（Art Bible v1）　`feature · S · /adventures`　〔eng+design〕

> 把各自獨立產出的島統一成同一世界：相機／光／材質／色票／比例定死，並建立 R1→整島 diorama 的資產對接契約。本階段純文件 + 資料層契約，**不生美術資產、不改視覺**。

- [x] `docs/UNIVERSE-ART-BIBLE.md` — 相機正交俯角 50°、左上暖光右下陰影、霧面黏土、環境色票、小紅賽車比例尺、狀態變體、AI／Blender 管線、交付檢查表（D1 路徑採 `/adventures/zones/`）
- [x] `lib/universe/zone-art-tile.ts` — `ZoneArtTile` 契約（`mode: landmark|island`、`anchor`、`stageSize`）+ `ZONE_ART_TILES` 預設全島 landmark（D2，不改視覺）
- [x] `lib/universe/zone-art-tile.test.ts` — 契約測試（src 對齊路徑、現況 landmark/center、island 必附 stageSize）
- [x] verify：`npm run test` + `npm run build`；`git diff` 確認 landing/page 未動

**待後續（未做）：** ~~改 `next/image` @2x/@3x~~（已完成：`getZoneArtSrcSet`）。色票若要回頭對齊 SVG fallback 為獨立小任務（見 Art Bible §4 D3）。

**changelog：** Art Bible v1 + tile 詮釋資料契約 `506b04a`。

