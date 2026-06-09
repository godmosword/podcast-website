# Changelog

本專案變更紀錄。格式參考 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)。

## [Unreleased]

### Added

- **Game Kit Phase 5**：`adventure-level`／`tiled-loader`（Tiled JSON → 關卡）；car-adventure 2 關可選；car-star 3 座迷宮可選
- **Game Kit Phase 4**：juice 工具組（粒子／震動／頓幀／緩動）接入四款遊戲；手機操控優化（`useCoarsePointer`、`useSwipeGesture`、大按鈕、滑動手勢、safe-area）
- **Game Kit Phase 3**：四款程序生成 chiptune 循環 BGM（`chiptune-bgm`）、`GameKitAudioBus` music/sfx 分軌混音、擴充 `useGameAudio(gameId)`；四款遊戲接入 BGM 與分頁暫停
- **Game Kit Phase 2**：程序生成 sprite sheet／tileset（`procedural-sheets`、`assets`、`sprite-defs`、`tileset-draw`）；car-mission 卡車＋螢火虫動畫、car-adventure 地形／金幣／尖刺 tile、car-star 道路 tile 背景、block-drop 七色方塊 tile 皮膚
- **營運管線文件**：`TODOS.md` 新增 SoundOn／Apple 同步四階段工作流、生圖通知方案（Issue／webhook／佇列）與 P2–P3 實作條目
- **Game Kit Phase 1**：四款遊戲接入 `PixelGameCanvas`／`GamePixelBoard`、統一調色盤 bridge、整數倍像素放大；car-star／block-drop 格子縮放對齊 viewport
- **Game Kit Phase 0**：`lib/gamekit/` 九大模組骨架、`PixelRenderer`／`GameLoop`／`InputManager`、`ART-BIBLE.md`、`PixelGameCanvas` + hook、單元測試
- **遊樂園 pixel 精進方案**：`RESEARCH.md` + `TODOS.md` 新增 Game Kit 八階段路線、四款對標與驗收表；校正 `car-mission` 為三車道溫柔任務（非俯視賽車）
- **競品研究筆記**：`RESEARCH.md` 收錄 Hey Clay App 架構拆解（phygital、分步教學、收藏解鎖）與車車遊樂園適用性評分；`TODOS.md` 同步 `craft` 手作教學、車庫圖鑑養成、phygital 第四原則與拍照分享待決策
- **產品路線圖（互動故事 × 車車 STEM × 商業）**：`TODOS.md` 新增 STEM-P1～P4 四階段（點按熱點、STEM 實驗室、家長端、freemium 訂閱）、三項設計原則、台灣市場定位與一頁總表；README 同步產品定位與遊樂園功能
- **車車遊樂園 `/games`**：4 款原創小遊戲（車車吃星星、怪獸卡車溫柔任務、車車大冒險、繽紛方塊）；黏土風 SVG 縮圖、首頁馬卡龍入口
- **版權合規**：`/legal`、字型 OFL、`THIRD_PARTY_NOTICES.md`、品牌圖示指示性使用、禁止素材再散布說明
- **角色名冊擴充至 6 位定裝照**：`public/characters/` 新增 安安救護車／小紅賽車／怪獸卡車／東東挖土機，連同 鈴鈴清潔車／恐龍車多多 全數登記進 `data/characters.json`（含別名、車種、英文外觀描述）。外部準備的圖統一正規化為 **1400×1400 JPEG、小寫 `.jpg`**，檔名對齊 `safeName()`（去空白與符號、保留中日韓字與英數，如「怪獸卡車 Monster Truck」→ `怪獸卡車.jpg`，英文入 `aliases`）
- README「每集劇情插圖」新增兩個實戰流程：**手動補定裝照**（自繪／外部生圖時的放圖＋正規化＋登記步驟）與**重抽單幕並指定角色（保留 Apple 封面）**——透過單張複製而非 `--approve`，避免覆蓋 Apple 原封面與重寫接線

### Changed

- 單集頁：收藏改 SVG 愛心圖示，與分享列（複製連結／LINE）同排對齊
- ep-9 第 6 幕重抽為 鈴鈴清潔車＋恐龍車多多 同框（牙齒保健建議），以兩張定裝照當參考圖；封面 `01.jpg` 維持 Apple 原圖、`pageCount`／`captionTimes` 不變

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
