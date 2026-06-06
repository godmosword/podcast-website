# Changelog

本專案變更紀錄。格式參考 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)。

## [1.3.0] - 2026-06-06

### Added

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
- **viewport 開放縮放**：移除 `maximumScale`／`userScalable`，家長共讀可放大文字／插圖，符合 WCAG 1.4.4

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
