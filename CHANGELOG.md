# Changelog

本專案變更紀錄。格式參考 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)。

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
