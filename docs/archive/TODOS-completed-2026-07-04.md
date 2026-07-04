# TODOS Completed Archive — 2026-07-04

> Archived from `TODOS.md` during the 2026-07-04 TODO cleanup. Keep future active priorities in `TODOS.md`; use this file for historical completed work.

## Completed

### GHA 同步自動 proofread --fix　`95ba69a`
`sync-apple-podcast` 在 `relocalizeSidecars` 後對本輪新集／新轉錄字幕跑 `applySafeAutoFixes`；`SyncRunReport` 新增 `proofreadAutoFixed`／`proofreadPendingLint`；commit 訊息與 `[illustrate]` Issue checklist 改為「GHA 已 --fix → 人工最終校稿 → `--mark`」。CI 不自動 `--mark`。

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
