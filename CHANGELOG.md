# Changelog

本專案變更紀錄。格式參考 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)。

## [Unreleased]

### Added

- **樂園地圖 P1 載入體驗**：島 tile 沙草佔位 + 淡入；標籤反相機縮放；car-park tile preload
- **樂園地圖 P0 資產交付**：島 tile 接 `@2x/@3x` srcset（`getZoneArtSrcSet`）；漫遊者 PNG→WebP + `<picture>`；rear `fetchPriority="low"`
- **漫遊小車 map 層級路線 + 接地影（R-anim 1.5c）**：`MapRoamerLayer` 海面環道／開放橋 stage path；獨立接地橢圓影（不翻轉）；y-sort；停用島內 `IslandRoamerLayer`（消除 car-park 重複車）
- **漫遊小車 2.5D 島上步道（R-anim 1.5b P0）**：小車改渲染於 `ZoneIsland` 內 `IslandRoamerLayer`（tile 14% + 接地陰影）；路徑接 `CAR_PARK_WALKWAY_PATH` 島內步道；`roamer-coords` 座標換算；移除全地圖 `CharacterRoamerLayer` 海面環線
- **樂園地圖漫遊者 PNG 資產（R-anim 1.5 資產）**：`public/adventures/roamers/xiao-hong.png`、`duo-duo.png`（gpt-image-2 edit + 定裝照 reference、magenta chroma-key、sharp 後製 ~728px RGBA、底中心錨點）；生圖腳本 `scripts/generate-roamer-assets.ts`（staging → contact sheet → `--approve`）；`MAP_ROAMERS` 啟用小紅＋多多（`car-park-walkway`、`startOffset` 0／0.5）
- **SEO 進階三刀**：逐字稿 VTT route（`/story/[slug]/transcript.vtt`）+ 故事頁 SSR 可索引 `<details>` 逐字稿；RSS 補 Podcasting 2.0（`podcast:transcript`、`podcast:guid`、`itunes:type`、`itunes:owner`、`itunes:episodeType`）；主要索引頁與故事詳情頁補自我 canonical；Episode JSON-LD 可解析 duration 時加 `timeRequired`（不加非標準 transcript）
- **車車宇宙樂園地圖（R0）`/adventures`**：鳥瞰群島園區地圖骨架——資料驅動 `zones`（`data/universe-zones.ts`）、跨海 Bézier 橋與 viewBox resolver（`lib/universe-map.ts`）、手刻 Pointer Events `pan/zoom/pinch/fly-to` 鏡頭（`useMapCamera`，無第三方手勢庫）、點島 fly-to 放大後開內容或「敬請期待」底部 sheet（`ZoneSheet` R0 stub）。R0 用 emoji／黏土塊佔位，海/沙/草為固定淺色（不隨日夜反轉）；每島為真正 `<button>` 含 `aria-label`、鍵盤 Enter 觸發、`prefers-reduced-motion` 瞬跳，並輸出 sr-only 島嶼清單供報讀器／SEO。車車樂園子連結衍生自 `LANDING_SEGMENTS`（單一資料源）。全站選單「宇宙地圖」入口 + `sitemap.xml` 收錄。**不動** `app/page.tsx` 與 `components/landing/*`
- **車車宇宙樂園地圖（R1）**：`ZoneLandmarkArt` 黏土風 SVG 地標取代 emoji（四島：摩天輪／恐龍／救援車／海浪＋火箭）；`ZONE_TERRAIN` 各島沙洲／草地配色；`ZoneIsland`／`ZoneSheet` 接入
- **車車宇宙樂園地圖（R2）**：`/adventures` OG 分享圖；`public/adventures/zones/*.svg` 靜態 artTile + `ZoneLandmark` fallback；`UniverseMapParallax` 視差雲層
- **樂園地圖 R0.5 去貼紙化 + 黏土光影**（純 code）：`ZoneIsland` 地標移除白框改黏土底座（高光／內陰影／接地投影）+ 木牌名稱；`UniverseMap` 海漸層 + 每島五層（接地投影／泡沫圈／沙草／黏土光影）；`MapControls` reset 改自繪 SVG home icon；`UniverseMapParallax` 雲朵蓬鬆化。場景色日夜皆不反轉
- **樂園地圖 car-park 黃金樣本（R1 起手式，純資產）**：`public/adventures/zones/car-park.{png,@2x,@3x}` 整島 diorama 真 RGBA 去背（AI claymation + magenta chroma-key + PIL despill + 後製接地陰影 + LANCZOS 三階），實機疊圖驗證通過；sidecar `car-park.tile.json` 鎖定 `stageSize 264×260`（trim 實測 228×253）／`anchorUV [0.5,0.84]`。**未接 R1 程式**（程式仍指向 `.svg`）
- **樂園地圖 R1 整島黏土化（四島落地）**：dino／rescue／ocean 依 v2 美術聖經 + `car-park.png` reference 產出整島黏土 diorama PNG（同一 magenta chroma-key + PIL 管線、box 264×260、anchorUV 0.5/0.84、三階 @1x/@2x/@3x），與 car-park 同一家族。程式接線：`zone-art-tile.ts` 四島改 `mode:"island"` + `anchorUV`、`zoneArtTilePath()` 回傳 `.png`；`ZoneIsland` 新增 island 模式（以 anchorUV 對齊 coord、stageSize 鋪島、木牌名稱＋狀態 pill 定位於沙岸底中心下方、hover 縮放）；`UniverseMap` 對 island 島跳過 SVG 沙草橢圓避免疊圖。狀態 pill 仍吃 `ZONE_STATUS_META`，海面/橋維持 SVG
- **樂園地圖美術聖經 v2**：鎖定 `car-park.png` 為全宇宙最高權威黃金樣本（「任何描述與圖衝突時以圖為準」）。相機由「正交 50°」改「3/4 高視角 ~30–35°＋輕透視」；燈光由「左上硬主光＋右下長投影」改「柔和均勻光＋短柔接地陰影」。base/negative prompt、檢查表、Blender 相機/光全面對齊黃金樣本；材質／品牌色／狀態變體／程式契約沿用 v1
- **樂園地圖美術聖經（Art Bible v1）**：新增 `docs/UNIVERSE-ART-BIBLE.md`（相機正交俯角 50°、左上暖光／右下陰影、霧面黏土材質、環境色票、小紅賽車比例尺、狀態變體、AI／Blender 生產管線、交付檢查表）讓各自產出的島維持同一世界感；`lib/universe/zone-art-tile.ts` 新增 `ZoneArtTile` 詮釋資料契約（`mode: landmark|island`、`anchor`、`stageSize`），現況全島 `landmark`／`center` **不改視覺**，為未來整島 diorama 預留切換點

### Changed

- **Landing 手機／平板 CTA 縮小並對齊小紅車**：≤768px 改 auto 寬靠左、縮 padding／字級；≤600px 再縮一級，`content` 底距對齊 `DuduCompanion` 水平線，避開底部進度列
- **Landing nav 與 CTA 統一淡蜜桃橘**：top bar 與「全部故事／睡前故事」CTA 一起改淡蜜桃漸層（`#ffe7cf→#ffd5a8`）+ 暖深棕字（`#7a4012`，非黑）；`.next` 箭頭與 Subscribe pill 改暖深棕、進度小圓點改品牌橘 `#ff8c2b`（淡色在白底會消失）
- **Landing top bar 對齊 CTA 橘色**：nav 漸層改引用 `--landing-cta-*`（與「全部故事／睡前故事」同色），字色維持白；Subscribe pill 改反白
- **Landing top bar 淡橘色調**：`--landing-nav-*` 改蜜桃漸層（`#fff0e0→#ffd9b8`）+ 暖深咖字（`#4a3020`），柔化 shadow／邊框；`SubscribeMenu` pill 改淡 peach 底 + 暖描邊。段內 CTA 維持飽和橘。**不動** hero raster
- **Landing 陽光色系 + 引導按鈕 + 頁尾捲動 + 手機底部排版**（`d6c726f`）：新增 landing 專用色票（`--landing-nav-*` / `--landing-cta-*`，不改全站 `--landing-brand-ink`）。`SiteNavBar` top bar 改日出琥珀漸層（`#ffc857→#ff9f1c`）+ 白字 + 暖色投影，固定不隨 night 反轉。`SubscribeMenu` 訂閱改反白 pill（白底橘字）；hero CTA 改橘黃漸層 + 白字 + 暖 glow；`.next` 改半透明白底 + 琥珀 chevron。`LandingHub` footer 包成全屏 snap pane（`#landing-foot`），最後段 `.next` 可捲至頁尾不再彈回。手機 ≤768px：隱藏 `.next`、CTA 全寬、進度膠囊/嘟嘟分層重排。**不動** hero raster
- **Landing page 去暗沉 + top bar 迭代**（`eeeed4f` `7e42ee5`，top bar/CTA 後續由 `d6c726f` 陽光版取代）：scrim 改底部保護式漸層 + 強化 text-shadow；`.panel`/footer 深咖改 `var(--bg)`；手機進度膠囊改暖色玻璃。中間版 top bar 曾試奶油／木質調 + 品牌橘 CTA。**不動**全站主題 token 與 hero raster

### Fixed

- **車車宇宙地圖 a11y**：sr-only 島嶼清單連結加 `tabIndex={-1}`，鍵盤 Tab 改走可見島嶼 button；`UniverseMap` unmount 時清除 fly-to 後開 sheet 的 `setTimeout`，避免卸載後 setState
- **車車宇宙地圖 pan 手勢**：`useMapCamera` 在島嶼 `<button>` 上不 capture pointer，修復點島無法開 sheet 的問題
- **Storyline 式 Landing Hub**：`/` 為四段 segment 入口（車車故事／睡前數綿羊／捏黏土／衛教宣導）；現 podcast 主頁搬至 **`/stories`**
- **主題跟隨系統**：日間／夜晚切換新增「跟隨系統」選項；首次造訪預設與瀏覽器或手機 `prefers-color-scheme` 同步；`ThemeProvider` 監聽系統配色變更；FOUC 防閃 inline script 同步支援
- **海盜卡丁車大賽（`/games/pirate-kart`）**：16-bit 像素 top-down 海盜賽車；`Kart` 類別、橢圓賽道碰撞、3 AI、圈數＋寶藏計分、Shift 張帆加速、空白鍵大砲；開始／結束畫面
- **車車卡丁車（kart-game P1–P6）**：漂移手感調校、檢查點／圈速 HUD／小地圖、3 AI＋倒數＋結算、Web Audio BGM/SFX、標題／車庫／獎牌存檔、觸控／手把／reduced-motion、載入畫面與粒子池；`net/Net.ts` 多人 stub
- **車車卡丁車（kart-game P0）**：獨立 Vite+Three.js 專案、arcade kinematic 方塊車＋spline 練習道、嵌入 `/games/kart`（iframe → `public/kart/`）
- **Game Kit Phase 8**：`ObjectPool`、`preload` 資產暖機、`GameLoadingGate`、`useGameLoop` 固定步進＋渲染插值（car-adventure）；`/games` hub 預載；a11y layout
- **Game Kit Phase 7**：`GameChrome` 暫停／設定外框、`GamePageShell`（跳過連結、a11y）、`useGameInput` Gamepad、`useGameKitSettings` 兒童模式（預設開啟）；四款接入
- **Game Kit Phase 6**：跨遊戲 meta（`session`／`garage`／`stickers`、存檔 v2 與舊 best 遷移）；`/games` 世界地圖進度（`GamesWorldMap`、車庫、貼紙簿）；四款遊戲通關／結束時 `reportGameSession`
- **Game Kit Phase 5**：`adventure-level`／`tiled-loader`（Tiled JSON → 關卡）；car-adventure 2 關可選；car-star 3 座迷宮可選
- **Game Kit Phase 4**：juice 工具組（粒子／震動／頓幀／緩動）接入四款遊戲；手機操控優化（`useCoarsePointer`、`useSwipeGesture`、大按鈕、滑動手勢、safe-area）
- **Game Kit Phase 3**：四款程序生成 chiptune 循環 BGM（`chiptune-bgm`）、`GameKitAudioBus` music/sfx 分軌混音、擴充 `useGameAudio(gameId)`；四款遊戲接入 BGM 與分頁暫停
- **Game Kit Phase 2**：程序生成 sprite sheet／tileset（`procedural-sheets`、`assets`、`sprite-defs`、`tileset-draw`）；car-mission 卡車＋螢火虫動畫、car-adventure 地形／金幣／尖刺 tile、car-star 道路 tile 背景、block-drop 七色方塊 tile 皮膚
- **營運管線文件**：`TODOS.md` 新增 SoundOn／Apple 同步四階段工作流、生圖通知方案（Issue／webhook／佇列）與 P2–P3 實作條目
- **Game Kit Phase 1**：四款遊戲接入 `PixelGameCanvas`／`GamePixelBoard`、統一調色盤 bridge、整數倍像素放大；car-star／block-drop 格子縮放對齊 viewport
- **Game Kit Phase 0**：`lib/gamekit/` 九大模組骨架、`PixelRenderer`／`GameLoop`／`InputManager`、`ART-BIBLE.md`、`PixelGameCanvas` + hook、單元測試
- **遊樂園 pixel 精進方案**：`RESEARCH.md` + `TODOS.md` 新增 Game Kit 八階段路線、四款對標與驗收表；校正 `car-mission` 為三車道溫柔任務（非俯視賽車）
- **競品研究筆記**：`RESEARCH.md` 收錄 Hey Clay App 架構拆解（phygital、分步教學、收藏解鎖）與車車遊樂園適用性評分；`TODOS.md` 同步 `craft` 手作教學、車庫圖鑑養成、phygital 第四原則與拍照分享待決策
- **產品路線圖（互動故事 × 車車 STEM × 商業）**：`TODOS.md` 新增 STEM-P1～P4 四階段（互動提問、STEM 實驗室、家長端、freemium 訂閱）、三項設計原則、台灣市場定位與一頁總表；README 同步產品定位與遊樂園功能
- **車車遊樂園 `/games`**：4 款原創小遊戲（車車吃星星、怪獸卡車溫柔任務、車車大冒險、繽紛方塊）；黏土風 SVG 縮圖、首頁馬卡龍入口
- **版權合規**：`/legal`、字型 OFL、`THIRD_PARTY_NOTICES.md`、品牌圖示指示性使用、禁止素材再散布說明
- **角色名冊擴充至 6 位定裝照**：`public/characters/` 新增 安安救護車／小紅賽車／怪獸卡車／東東挖土機，連同 鈴鈴清潔車／恐龍車多多 全數登記進 `data/characters.json`（含別名、車種、英文外觀描述）。外部準備的圖統一正規化為 **1400×1400 JPEG、小寫 `.jpg`**，檔名對齊 `safeName()`（去空白與符號、保留中日韓字與英數，如「怪獸卡車 Monster Truck」→ `怪獸卡車.jpg`，英文入 `aliases`）
- README「每集劇情插圖」新增兩個實戰流程：**手動補定裝照**（自繪／外部生圖時的放圖＋正規化＋登記步驟）與**重抽單幕並指定角色（保留 Apple 封面）**——透過單張複製而非 `--approve`，避免覆蓋 Apple 原封面與重寫接線

### Changed

- **Repository consolidation**：Game Kit 收斂為 `react/`、`runtime/`、`progress/`、`games/` 四層，全面使用 leaf imports；四款遊戲路由與既有進度 storage schema 保持相容
- 單集頁：收藏改 SVG 愛心圖示，與分享列（複製連結／LINE）同排對齊
- ep-9 第 6 幕重抽為 鈴鈴清潔車＋恐龍車多多 同框（牙齒保健建議），以兩張定裝照當參考圖；封面 `01.jpg` 維持 Apple 原圖、`pageCount`／`captionTimes` 不變

### Removed

- **未出貨產品表面**：移除 feature flags、停用首頁區塊、Studio placeholder metrics、遊戲「製作中」假卡與 Story 以外的內容型別
- **Game Kit dead code**：移除雙目錄與 barrels、state machine、scene、pool、abilities、tilemap、Tiled loader、sprite scaffolding 及其測試專用 API
- **`public/` 清理**：移除已退役「車車吃星星」遺留素材 `public/games/cars/*.svg`（6 檔）、未被引用的 `apple-touch-icon-1024.png`（`gen_icons.py` 同步移除該尺寸）、`public/stories/ep-1〜6/README.txt` 佔位說明（規範改集中於 README「每集劇情插圖自動生成」一節）

## [1.3.0] - 2026-06-06

### Added

- **跨集角色一致（角色名冊 + 定裝照）**：`data/characters.json` 記每角色名／別名／車種／外觀描述／canonical 定裝照；切場景時文字模型辨識每幕出場角色，生圖時以該角色的定裝照（`public/characters/<名>.jpg`，可多張同框）當參考圖，讓同一角色跨集維持形象。新角色首次登場自動生定裝照，審圖後 `--approve` 存進名冊；`--char <名>` 可重抽定裝照
- **每集劇情插圖自動生成管線**（`npm run illustrate -- <slug>`）：由字幕側車檔切場景（OpenAI 文字模型，或 `--deterministic` 免 key 後備）→ 每幕以該集 `01.jpg` 當參考圖生**黏土風插圖**（OpenAI image，固定 `CLAY_STYLE_PREFIX`）→ 暫存 + `contact.html` **人工審圖** → `--approve` 進 `public/` 並寫 `overrides` 的 `pageCount`/`captionTimes`。播放器既有「依時間換圖」邏輯直接套用，**零播放器改動**。本機手動、CI 不放 key 不生圖。`scripts/illustrate.ts`、`scripts/lib/illustrate-core.ts`；修補 `applyDefaults` 讓 `captionTimes` 能從 overrides 傳遞
- **車車吃星星小遊戲** `/games/car-star`：給 3–7 歲的原創迷宮開車吃金幣遊戲（自繪 SVG 車輛、自訂地圖、WebAudio 音效）。方向鍵／WASD／觸控方向盤操作；`prefers-reduced-motion` 停用所有動畫仍可玩；SSR/hydration 安全、分頁切走自動暫停、320px 不溢出；最佳分數存 `localStorage`。`hooks/useReducedMotion.ts`、`components/games/CarStarGame.tsx`；footer 加入口
- **互動音效回饋**：點播放／翻頁／選車種 chip／開音效有輕「啵」聲，用 **WebAudio 振盪器即時合成**（零音檔、零下載、零網路，貼合「音檔不外送」精神）；播放器頂部 🔊／🔇 靜音切換，偏好存 `localStorage`、預設開（`lib/sfx.ts`）
- **動態生命感**：每頁左上吉祥物輕點頭揮手打招呼、首頁最新一集封面緩緩浮動、車種 chip hover 滑步；全部純 CSS、`prefers-reduced-motion` 由 globals 全域關閉
- **新集近即時上架**：Apple／SoundOn 同步排程由每日一次改為**每 15 分鐘**檢查 feed（來源即 SoundOn 官方 RSS），SoundOn 上架後最多約 15 分上站；新增 `concurrency` 鎖避免排程交疊。可在 Actions 頁手動 **Run workflow** 立即上架
- **字幕字級切換**：播放頁頂部新增 **Aa** 鈕，小／中／大三段循環切換字幕字級；偏好存 `localStorage`（`cc:caption-size`）跨集保留（字往上長，不擠壓底部控制列）
- **逐字即時字幕**：每集字幕存側車檔 [`data/subtitles/<slug>.json`](data/subtitles)，播放器依音檔時間顯示、**獨立於翻頁**（`lib/subtitles.ts`、`StoryPlayer` 的 `subtitles` 軌）；無側車檔則回退舊 `captions`/`captionTimes`。EP1–7 已上字幕
- **音檔自動轉錄**（本機 whisper.cpp，音檔不外送、零金鑰）：`npm run transcribe -- <slug...|--all>`、共用核心 [`scripts/lib/transcribe-core.ts`](scripts/lib/transcribe-core.ts)；**自動簡轉繁**（OpenCC `cn→twp`）並過濾幻覺鳴謝；`--convert` 可只重跑簡轉繁/過濾
- **Apple 同步新集自動上字幕**：`npm run sync:apple` 下載新集後本機有 whisper 即自動轉錄；缺工具/模型或 `SKIP_TRANSCRIBE=1` 自動跳過、不中斷同步
- **即時字幕（頁綁定）`captionTimes`** 與**字幕對時模式 `?cue=1`**：邊聽邊記每句秒數、複製貼回；播放頁維持 SSG
- 首頁標頭：三行 tagline 與**合作聯繫／許願投稿／留言給我**圓鈕（連結由 `SiteHeader.tsx` 的 `ACTIONS` 維護）

### Changed

- 字幕跟讀：有逐字字幕軌時優先顯示逐字字幕（依音檔時間），翻頁仍照舊
- 播放器**音樂播放器式底部重設計**：進度條含**目前／總時間**，控制列為 重複｜倒退 10 秒｜播放／暫停｜快進 10 秒｜停止；字幕與控制列拉開距離；移除「跟讀中會自動翻頁」提示
- **睡前定時**改為右上角 ⏱ 精簡選單（睡前 15／30／45 分），點選單外自動收起；移除「家長設定」收合面板
- 首頁圓鈕（合作聯繫／許願投稿／留言給我）改為**黏土質感**（高光漸層 + 貼紙立體陰影 + 按壓回饋）
- 播放器控制列**重新設計為線性圖示風**（Spotify／Apple Podcasts 風）：次級鈕（重複／倒退／快進／停止）改為透明本體 + 白色 SVG 線性圖示（`PlayerIcon.tsx`，取代 emoji，跨平台一致且銳利），hover／按下才浮現淡圓底；中央紫色播放鈕為唯一實心立體鈕，主從分明；倒退／快進的「10」秒數疊在弧線中央，重複開啟態以主題色 + 小圓點標記
- **viewport 開放縮放**：移除 `maximumScale`／`userScalable`，家長共讀可放大文字／插圖，符合 WCAG 1.4.4
- 同步 workflow 加 **`repository_dispatch`（`sync-now`）外部觸發**：可用免費外部 cron 打 GitHub API 準時觸發,繞過 GitHub 內建 `schedule` 的不可靠(best-effort、常延遲數小時);內建 cron 降為後備。設定步驟見 README「外部排程觸發」
- 同步排程加上**無新集早退**：`sync:apple` 在無新集時不再無意義改寫 `apple-sync-state.json`，CI 以 `git status` 判斷早退，省去空轉的 test／build

### Fixed

- **OG／分享網址**：`getSiteUrl()` 在 production 未設 `NEXT_PUBLIC_SITE_URL` 時改用 canonical 網域，不再輸出每次部署的臨時 Vercel 網域；`app/layout.tsx` 統一改用 `getSiteUrl()` 建 `metadataBase`（補 `lib/site-url.test.ts` 單元測試）
- 重生中文字型子集（含首頁圓鈕新字）

## [1.2.1] - 2026-06-03

### Added

- **Apple Podcast 每日同步**：`npm run sync:apple`、`scripts/sync-apple-podcast.ts`；GHA [`.github/workflows/sync-apple-podcast.yml`](.github/workflows/sync-apple-podcast.yml) 每日 UTC 01:00，有新集時依官網現行框架上架並 push `main`
- `data/apple-synced.json`、`data/apple-sync-state.json`、`data/apple-sync.defaults.json`（含 `overrides.<slug>`）
- `scripts/lib/apple-sync-profile.ts`：標題推斷車種（含高鐵）、`pageCount` 預設 1
- `cleanEpisodeSummary()`：RSS 摘要去除 SoundOn 尾註與節目宣傳段
- 首頁車種 chip **`VehicleClayIcon`**（以該車種故事封面 `01.jpg` 作黏土縮圖）
- EP7（`ep-7`）經同步上架：高鐵、`pageCount: 1`

### Changed

- 首頁篩選改為 **車種 chip 列**（「依車車找故事」），URL `?vehicle=`；主題改由 `/topic` 進入（移除抽屜／主題標籤列）
- 故事內頁 **`StoryMeta`**：僅 EP + **時長**；不再顯示日期與年齡（同步新集亦不寫入 `ageRange`）
- Apple 同步新集預設 **`pageCount: 1`**、單圖 MVP；完整繪本需手動補圖與 overrides
- GHA 同步 workflow 新增 **`npm run build`** 關卡

### Removed

- 故事卡片與封面（Hero、詳情頁）**左下角 emoji 貼紙**
- 首頁故事卡 **縮圖角標 emoji**（`StoryCard`）

### Fixed

- EP7 車種／emoji 鎖定為高鐵 🚄；`overrides.ep-7` 補主題標籤
- RSS 無 `itunes:episode` 時以標題比對，避免重複建立 slug

## [1.2.0] - 2026-06-03

### Added

- 首頁 **ConnectHub**：「追蹤我們」「訂閱收聽」圖示卡片區（Instagram、Threads、Apple Podcasts、Spotify、KKBOX、YouTube、RSS）
- 站內 **RSS Feed**（`/feed.xml`），含 iTunes 延伸欄位與每集 enclosure
- `layout` 的 `<link rel="alternate" type="application/rss+xml">`
- 故事 **`ageRange`** 選填欄位；`StoryCard` 與詳情頁 `StoryMeta` 顯示年齡建議
- **主題標籤** client 篩選（`useState`，不整頁刷新）與 `/topic`、`/topic/[tag]` 靜態分類頁（SEO metadata）
- 首頁 **故事牆網格**（`StoryWall`）、`StoryCard` `grid` 版型
- 首頁 **LatestHero** 黏土風主視覺、`hero-home.jpg`
- 收聽平台圖示列（`PlatformLinks`）於每集故事頁；`lib/platforms.ts`、`lib/connect-icons.tsx`
- 車種分類頁 `/vehicles/[vehicle]`
- 收藏區（`FavoritesSection`）、繼續收聽橫幅（`ContinueBanner`）
- `lib/site-url.ts`、`lib/feed.ts`；RSS 單元測試（`lib/feed.test.ts`）
- `getStoriesByTag`、`getVehicleEmoji`；`allTags` 繁中排序
- Playwright E2E 設定（`npm run test:e2e`）
- `LICENSE`（程式碼 MIT）、`DISCLAIMER.md`（內容與使用聲明）

### Changed

- 首頁故事列表改為 **Server 預渲染**，移除「載入故事中…」Suspense 閃爍
- Open Graph / `metadataBase` 以 **`NEXT_PUBLIC_SITE_URL` 為準**（建置時未設定則不誤用 preview 網域）
- 頁尾由文字 pill 連結改回 **ConnectHub**；RSS 指向站內 `/feed.xml`（非 SoundOn 外鏈）
- 允許 **viewport 縮放**（移除 `maximumScale` / `userScalable: false`）
- 自託管中文圓體 **jf-open 粉圓（huninn）** 子集化（~100KB）
- 設計 tokens、SVG 場景裝飾、卡片／chips／播放器質感與 `prefers-reduced-motion` 守門
- 關於頁車種 chip 顯示各車種 **emoji**
- `TODOS.md`：A+B 成長策略、官網成長腦力激盪待辦

### Removed

- 頁尾 **SoundOn** 外鏈與 SoundOn 官方 RSS（改由站內 feed 提供訂閱）

### Fixed

- 首頁 Hero 圖片比例與置中
- 關於我們頁視覺與首頁 Hero 一致

## [1.1.0] - 2026-06-01

### Added

- 全站與每集故事的 SEO metadata（Open Graph、Twitter 卡片）
- 播放頁 canonical 指向詳情頁；播放頁 `noindex`
- 播放器媒體載入/播放失敗的中文提示
- `lib/story-utils.ts`、`lib/story-metadata.ts` 共用工具
- Vitest 單元測試（`data/stories.test.ts`，9 項）
- `README.md` 開發、部署與新集 SOP
- `TODOS.md`、`CHANGELOG.md` 專案維護文件

### Changed

- 音檔 `preload` 由 `auto` 改為 `metadata`，減少進入播放頁前的流量
- 首頁 title 改為 template 格式（`%s · 車車遊樂園`）
- 支援 `NEXT_PUBLIC_SITE_URL` / Vercel URL 作為 `metadataBase`

## [1.0.0] - 2026-06-01

### Added

- Next.js 15 全靜態站：首頁分類篩選、故事詳情、獨立播放頁
- 6 集《車車遊樂園》真實 SoundOn 音檔與故事資料
- 字幕跟讀與自動翻頁播放器
- 相關故事推薦、Footer podcast 平台連結
- PWA manifest 與 iPhone 主畫面圖示（藍天笑臉卡車）
- 吉祥物、童趣字型（Baloo 2）、每車種主題色
