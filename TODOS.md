# TODOS

## 內容

### 替換真實多頁插畫

**What:** 將各集 `public/stories/<slug>/` 的佔位圖換成官方 podcast 插畫，並視需要提高 `pageCount`。

**Why:** 目前多數集數只有一張圖配多句字幕；真實繪本能強化「看圖聽故事」的睡前儀式感。

**Context:** `data/stories.ts` 的 `pageCount` 與 `01.jpg`～`NN.jpg` 需對齊。若仍是一圖多句，`captions` 長度可大於 `pageCount`，播放器會重複使用封面（見 `app/story/[slug]/play/page.tsx`）。

**Effort:** M  
**Priority:** P1  
**Depends on:** 取得 Bonbon & 馬米授權的插畫素材

### 壓縮 podcast 音檔

**What:** 用 ffmpeg 將每集 `audio.mp3` 壓到 mono 128kbps，目標單檔 < 5MB。

**Why:** 目前 6 集合計約 35MB+，行動網路進入播放頁載入慢。

**Context:** 指令見 `README.md`「音檔體積建議」。壓縮後需在本機播放確認音質可接受，再覆蓋原檔。

**Effort:** S  
**Priority:** P2  
**Depends on:** None

## 產品

### 設定正式站網域（NEXT_PUBLIC_SITE_URL）

**What:** 在 Vercel（或部署平台）設定 `NEXT_PUBLIC_SITE_URL=https://正式網域`。

**Why:** Open Graph / Twitter 分享需絕對網址；未設定時本機建置會 fallback 到 `localhost`。

**Context:** `app/layout.tsx` 已讀取此變數；Vercel 未設定時會用 `VERCEL_URL` 作為 fallback。

**Effort:** S  
**Priority:** P1  
**Depends on:** 確認 production 網域

### Footer 社群連結

**What:** 在 `components/SiteFooter.tsx` 的 `SOCIAL_LINKS` 填入 Instagram / YouTube / Threads URL。

**Why:** 家長從網站導流到社群與 podcast 生態；留空時連結正確隱藏。

**Context:** `PLATFORM_LINKS`（Apple Podcasts、SoundOn、RSS）已設定。只需補社群 URL，非空即顯示。

**Effort:** S  
**Priority:** P2  
**Depends on:** None

## 工程

### Service Worker 離線快取

**What:** 為 PWA 加入 service worker，快取已播放過的故事音檔與插圖。

**Why:** 已有 `manifest.json` 與主畫面圖示，但無離線能力；睡前場景常見弱網。

**Context:** 可評估 `next-pwa` 或自寫最小 SW；需注意 MP3 快取容量與更新策略。

**Effort:** M  
**Priority:** P3  
**Depends on:** None

### Playwright E2E smoke

**What:** 加入首頁 → 詳情 → 播放頁的 smoke test。

**Why:** 目前只有 `data/stories.ts` 單元測試；路由與播放器需回歸保護。

**Context:** 播放需 mock 或 headless 中跳過實際 audio decode；至少驗證頁面渲染與連結。

**Effort:** M  
**Priority:** P3  
**Depends on:** None

### ESLint CI 設定

**What:** 將 `next lint` 改為非互動 ESLint 設定，並可接入 CI。

**Why:** 目前 `npm run lint` 會跳出首次設定精靈，無法在 CI 使用。

**Context:** 依 Next.js 15 文件新增 `eslint.config.mjs` 與 `@next/eslint-plugin-next`。

**Effort:** S  
**Priority:** P3  
**Depends on:** None

## Completed

### 營運就緒：SEO、測試、文件（CEO 審核 B 方案 P1）

**What:** 每集 SEO metadata、音檔 preload 策略、播放器錯誤提示、README SOP、Vitest 單元測試。

**Why:** 讓站點可被分享/搜尋、載入更省流量、失敗有提示、新集可交接。

**Context:** 新增 `lib/story-metadata.ts`、`lib/story-utils.ts`、`data/stories.test.ts`、`README.md`。

**Effort:** M  
**Priority:** P1  
**Depends on:** None  

**Completed:** v1.1.0 (2026-06-01)

### 主題標籤篩選與 SEO 分類頁

**What:** 首頁主題 chip client 篩選、`/topic` 索引與 `/topic/[tag]` 靜態頁。

**Completed:** main @ 4d89422 起

### RSS Feed 與 ageRange

**What:** `/feed.xml` podcast RSS、`layout` alternates、ConnectHub／PlatformLinks RSS；故事 `ageRange` 與卡片／詳情顯示。

**Completed:** main @ 640ce5f 起

### ConnectHub 頁尾訂閱／追蹤區

**What:** 圖示卡片式「追蹤我們」「訂閱收聽」分區，取代文字 pill 連結列。

**Completed:** main @ 0b7b0f2 起
