# Repository Audit and Cleanup Design

## Goal

掃描程式庫並整理主要代碼邏輯，移除有充分證據支持的 dead code 與可重建暫存物，同時清理 Git worktree metadata；不改變目前網站、遊戲、Podcast 同步與內容製作流程的可見行為。

## Current Architecture

專案是 Next.js 15 App Router 靜態網站，主要資料流如下：

1. `data/stories.ts` 合併手動故事與 `data/apple-synced.json`，供故事列表、分類頁、播放器、RSS 與 sitemap 使用。
2. `app/` 提供 Landing、故事、主題、車種、遊戲、Studio、法律頁與 RSS 等入口。
3. `components/` 實作頁面 UI、播放器、Landing 分段與三款 React 遊戲；Godot Candy Kart 由 `public/candy-kart/` 靜態產物透過 iframe 載入。
4. `lib/game-kit/` 是 React 遊戲共用 hooks；`lib/gamekit/` 是較底層的遊戲狀態、渲染、音效、存檔與橋接工具。
5. `scripts/` 處理 Apple Podcast 同步、字幕、插圖、內容驗證與 GitHub Actions 告警。

## Cleanup Scope

### Dead modules

刪除沒有 Next.js、npm script、測試、設定檔或其他模組入口的檔案：

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

`app/**/opengraph-image.tsx`、`app/robots.ts`、`app/sitemap.ts` 是 Next.js 檔案慣例入口；`scripts/check-sync-fresh.ts` 與 `scripts/sync-alert.ts` 是 GitHub Actions 入口，均保留。

### Unused declarations

移除 TypeScript `noUnusedLocals` / `noUnusedParameters` 可直接證明未使用的宣告：

- `components/games/BlockDropGame.tsx`：`MAX_BOARD_W`
- `components/games/CarPlatformer.tsx`：`Enemy`
- `components/landing/LandingScrollContext.tsx`：未使用的 `RefObject` import
- `lib/gamekit/chiptune-bgm.ts`：`C4`、`D4`、`E4`
- `lib/gamekit/gamekit.test.ts`：未使用的 `base`

### Generated and local artifacts

- 刪除未追蹤的 `public/.landing-staging/`；內容是 `generate-landing-art.ts` 可重建的人工審圖暫存。
- 將 `/public/.landing-staging/` 加入 `.gitignore`，與現有 `.illustrate-staging` 政策一致。
- 不刪除 `public/stories/`、`public/characters/`、`public/landing/`、`public/candy-kart/` 的正式素材與部署產物。

### Git worktree and branches

- 執行 `git worktree prune --verbose` 清除 stale worktree metadata。
- 目前只有主工作目錄，故不移除任何 active linked worktree。
- 保留 `backup/local-audit-2a68c52`、`backup/main-before-recommit-kart-20260609`、`cursor/mobile-layout-optimization-5a81`；它們含未合併提交，分支刪除不屬於安全的 worktree 清理。

## Logic Documentation

新增 repository audit 報告，記錄：

- 路由與主要資料流。
- Podcast 同步、字幕與插圖管線。
- 遊戲架構的兩層 Game Kit 分工。
- dead code 判定方法、刪除清單、保留例外與 Git 狀態。

## Safety and Verification

清理後依序驗證：

1. 重新執行入口引用圖掃描，確認候選 dead modules 已移除，並保留框架／CI 隱式入口。
2. `npx tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false`
3. `npm test`
4. `npm run verify:episodes`
5. `npm run build`
6. `git status --short --branch`
7. `git worktree list --porcelain` 與 `git worktree prune --dry-run --verbose`

若任何驗證失敗，先判斷是否為清理造成；只修復與本次清理直接相關的問題，不擴張到功能重構。

## Non-goals

- 不重寫大型遊戲元件。
- 不合併 `lib/game-kit/` 與 `lib/gamekit/`。
- 不刪除未合併分支。
- 不修改 Podcast metadata、字幕、故事插圖、音訊或法律內容。
- 不 commit、push 或部署，除非使用者另行明確要求。
