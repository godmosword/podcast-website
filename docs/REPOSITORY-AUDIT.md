# Repository Audit

掃描日期：2026-06-25
基準：`main` at `24ef43c`

本報告整理目前程式庫的執行邏輯、內容自動化入口與本次 dead-code 清理證據。清理原則是只移除「沒有執行入口且沒有任何外部引用」或由 TypeScript 編譯器直接確認未使用的程式，不改變網站可見行為。

## Runtime architecture

專案是 Next.js 15 App Router 網站，主要採靜態預渲染：

- `app/layout.tsx` 掛載全站字型、主題、導覽列、SVG definitions、Service Worker 與全域 CSS。
- `/` 由 `app/page.tsx` 與 `components/landing/` 組成全螢幕 Landing Hub。
- `/stories` 從 `data/content.ts` 取得排序後的故事資料，再由 `components/home/HomeSectionRenderer.tsx` 組合最新故事、精選與篩選區塊。
- `/story/[slug]` 以 `generateStaticParams()` 生成故事詳情；`/story/[slug]/play` 載入 `StoryPlayer` 播放音訊、圖片與字幕。
- `/topic/[tag]`、`/vehicles/[vehicle]` 從同一份內容索引產生分類頁。
- `/feed.xml` 將 `storiesByNewest()` 交給 `lib/feed.ts` 產生 RSS。
- `app/sitemap.ts` 產生靜態頁、故事、主題與車種 URL；`app/robots.ts` 指向 sitemap。

Next.js 會依檔名自動載入下列隱式入口，因此不能只用一般 import graph 判定：

- `app/**/page.tsx`
- `app/**/layout.tsx`
- `app/**/route.ts`
- `app/**/opengraph-image.tsx`
- `app/robots.ts`
- `app/sitemap.ts`
- `app/not-found.tsx`

## Podcast content flow

內容的單一讀取入口是 `data/content.ts`：

```text
data/stories.ts ───────────────┐
                              ├─ applyStoryOverrides()
data/apple-synced.json ────────┤
data/apple-sync.defaults.json ─┘
             │
             ▼
         enrichStory()
  colors + characters + reflection prompts
             │
             ▼
        sorted storyList
             │
       ┌─────┼──────────┬─────────────┐
       ▼     ▼          ▼             ▼
   /stories  /story/*   topic/vehicle  feed + sitemap
```

- `data/stories.ts` 保存手動維護故事。
- `data/apple-synced.json` 保存 Apple Podcast 同步產生的故事 metadata。
- `data/apple-sync.defaults.json` 的 overrides 可補上完整插圖後的頁數、字幕與時間。
- `enrichStory()` 加入 episode 顏色、角色與親子反思題。
- `public/stories/<slug>/` 保存正式音訊與插圖；本次掃描未修改任何內容素材。

Apple Podcast 自動化由 `.github/workflows/sync-apple-podcast.yml` 啟動：

```text
Apple RSS
  → scripts/sync-apple-podcast.ts
  → 下載 metadata/audio
  → 可用時執行 Whisper 字幕
  → scripts/verify-episodes.ts
  → unit tests + production build
  → bot commit/push
  → scripts/sync-alert.ts 通知
```

`.github/workflows/sync-watchdog.yml` 另以 `scripts/check-sync-fresh.ts` 比對 RSS 與 repo 最新集數。這兩支腳本由 GitHub Actions 直接執行，不一定出現在 TypeScript import graph 中，必須保留。

字幕與插圖人工流程為：

```text
scripts/transcribe.ts
  → data/subtitles/<slug>.json
  → scripts/proofread-subtitles.ts --mark
  → data/scenes/<slug>.json
  → scripts/illustrate.ts
  → public/.illustrate-staging/
  → 人工審圖
  → --approve
  → public/stories/<slug>/
```

Landing Hero 由 `scripts/generate-landing-art.ts` 產生到 `public/.landing-staging/`，人工審圖後才複製至 `public/landing/`。staging 是可重建草稿，不是部署素材。

## Game architecture

遊戲入口集中於 `app/games/`：

- `car-adventure`：`components/games/CarPlatformer.tsx`
- `block-drop`：`components/games/BlockDropGame.tsx`
- `candy-match`：`components/games/CandyMatchGame.tsx`
- `candy-kart`：`components/games/CandyKartIframeHost.tsx` 載入 `public/candy-kart/` 的 Godot Web export

`components/games/GamePageShell.tsx` 提供遊戲頁共同的可及性、返回導覽與資產預載。遊戲 metadata 的唯一來源是 `data/games.ts`。

Game Kit 已收斂為單一、無 barrel 的明確分層：

- `lib/gamekit/react/`：React hooks、音效橋接、最佳分數、觸控控制與可見性暫停。
- `lib/gamekit/runtime/`：固定步進 loop、輸入、像素渲染、調色盤、音訊與程序圖塊。
- `lib/gamekit/progress/`：存檔 migration、設定、獎牌、車庫與 session 回報。
- `lib/gamekit/games/`：大冒險關卡契約與 Candy Kart iframe bridge。

所有消費端直接匯入 leaf module。Godot iframe 完成比賽後，`CandyKartIframeHost` 驗證同源訊息，再經 `games/candy-kart-bridge.ts` 與 `progress/session.ts` 寫入既有進度 schema。

## Automation and verification

主要驗證入口：

- `npm test`：Vitest，掃描 repo 內 `*.test.ts` / `*.test.tsx`。
- `npm run verify:episodes`：檢查故事 metadata、字幕時間、插圖數與完整集標準。
- `npm run build`：Next.js production build 與靜態頁生成。
- `npm run check`：依序執行 unit tests、episode verifier、production build。
- `npm run test:e2e`：Playwright 以 production build 啟動 Chromium smoke tests。
- `npx tsc --noEmit --noUnusedLocals --noUnusedParameters`：本次掃描額外使用的嚴格未使用宣告檢查。

## Dead-code evidence and removals

判定方法：

1. 建立 TypeScript import/export/dynamic-import 引用圖。
2. 將 Next.js 檔案慣例、測試、設定檔、npm scripts 與 GitHub Actions scripts 加入 root set。
3. 對候選檔案再以 `rg` 搜尋符號與路徑，確認沒有字串式或跨層引用。
4. 對檔案內宣告使用 TypeScript `noUnusedLocals` / `noUnusedParameters` 複核。

已移除的孤立模組：

- `lib/game-kit/` 整個舊 React adapter 樹
- `lib/gamekit/index.ts` barrel
- 未出貨的 Game Kit state machine、scene、pool、abilities、tilemap、Tiled loader 與 sprite scaffolding
- 停用的首頁 Continue/Starter 區塊與 Studio 假資料統計
- `components/games/GamePixelBoard.tsx`
- `components/games/GamePixelBoard.module.css`
- `components/games/GameShell.tsx`
- `components/games/GameShell.module.css`
- `hooks/useBestScore.ts`
- `hooks/useGameAudio.ts`
- `hooks/useGameKitProgress.ts`
- `hooks/useGameLoop.ts`
- `hooks/usePixelBoardScale.ts`
- `hooks/useProgress.ts`
- `hooks/useSwipeGesture.ts`

已移除的未使用宣告：

- `components/games/BlockDropGame.tsx`：`MAX_BOARD_W`
- `components/games/CarPlatformer.tsx`：`Enemy`
- `components/landing/LandingScrollContext.tsx`：`RefObject` import
- `lib/gamekit/chiptune-bgm.ts`：`C4`、`D4`、`E4`
- `lib/gamekit/gamekit.test.ts`：session test 內未使用的 `base`

保留的隱式入口包括 `app/games/**/opengraph-image.tsx`、`app/robots.ts`、`app/sitemap.ts`、`scripts/check-sync-fresh.ts` 與 `scripts/sync-alert.ts`。

## Git and worktree status

執行 `git worktree prune --verbose` 後，只有主工作目錄：

```text
/Users/godmosword.eth/Downloads/podcast-website  [main]
```

以下本地分支含未合併提交，因此保留：

- `backup/local-audit-2a68c52`
- `backup/main-before-recommit-kart-20260609`
- `cursor/mobile-layout-optimization-5a81`

`public/.landing-staging/` 已刪除，並新增至 `.gitignore`。正式 `public/landing/` 素材不受影響。

## Remaining maintenance risks

- `components/games/BlockDropGame.tsx` 超過 2,000 行，`CarPlatformer.tsx`、`StoryPlayer.tsx` 與 `CandyMatchGame.tsx` 也偏大；後續修改容易產生跨責任回歸，但本次不做無關重構。
- `tsconfig.json` 尚未預設啟用 `noUnusedLocals` / `noUnusedParameters`，dead declarations 目前不會在一般 build 中阻擋。
- Next.js metadata routes 與 GitHub Actions 腳本屬隱式入口；未來執行 automated dead-code 工具時，必須持續維護 entry-point allowlist。
- 本地 backup/cursor 分支不是 worktree metadata，但仍占用 Git refs；應由維護者確認內容已備份或整合後再刪除。
