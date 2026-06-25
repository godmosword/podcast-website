# Repository Audit and Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除已證實無入口的 dead code、清除可重建暫存與 stale worktree metadata，並留下可維護的程式庫邏輯報告。

**Architecture:** 先用現有引用證據刪除孤立模組，再修正 TypeScript 未使用宣告與 ignore 規則；文件只描述實際架構與本次證據。最後以 TypeScript、單元測試、episode verifier、production build 與 Git/worktree 狀態完成全域驗證。

**Tech Stack:** Next.js 15、React 19、TypeScript、Vitest、Git worktree

---

### Task 1: Remove unreachable modules

**Files:**
- Delete: `components/games/GamePixelBoard.tsx`
- Delete: `components/games/GamePixelBoard.module.css`
- Delete: `components/games/GameShell.tsx`
- Delete: `components/games/GameShell.module.css`
- Delete: `hooks/useBestScore.ts`
- Delete: `hooks/useGameAudio.ts`
- Delete: `hooks/useGameKitProgress.ts`
- Delete: `hooks/useGameLoop.ts`
- Delete: `hooks/usePixelBoardScale.ts`
- Delete: `hooks/useProgress.ts`
- Delete: `hooks/useSwipeGesture.ts`

- [x] **Step 1: Reconfirm that each candidate has no external consumer**

Run:

```bash
rg -n "GamePixelBoard|GameShell|useGameKitProgress|usePixelBoardScale|useSwipeGesture|useProgress\(|@/hooks/useBestScore|@/hooks/useGameAudio|@/hooks/useGameLoop" \
  app components hooks lib data scripts \
  -g '!components/games/GamePixelBoard.tsx' \
  -g '!components/games/GameShell.tsx' \
  -g '!hooks/useBestScore.ts' \
  -g '!hooks/useGameAudio.ts' \
  -g '!hooks/useGameKitProgress.ts' \
  -g '!hooks/useGameLoop.ts' \
  -g '!hooks/usePixelBoardScale.ts' \
  -g '!hooks/useProgress.ts' \
  -g '!hooks/useSwipeGesture.ts'
```

Expected: no matches.

- [x] **Step 2: Delete the isolated modules and their private CSS**

Use `apply_patch` to delete exactly the files listed above.

- [x] **Step 3: Confirm no deleted path remains referenced**

Run:

```bash
rg -n "GamePixelBoard|GameShell|useGameKitProgress|usePixelBoardScale|useSwipeGesture|@/hooks/useBestScore|@/hooks/useGameAudio|@/hooks/useGameLoop" \
  app components hooks lib data scripts || true
```

Expected: no source import of a deleted module.

### Task 2: Remove compiler-proven unused declarations

**Files:**
- Modify: `components/games/BlockDropGame.tsx`
- Modify: `components/games/CarPlatformer.tsx`
- Modify: `components/landing/LandingScrollContext.tsx`
- Modify: `lib/gamekit/chiptune-bgm.ts`
- Modify: `lib/gamekit/gamekit.test.ts`

- [x] **Step 1: Capture the failing unused-symbol check**

Run:

```bash
npx tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false
```

Expected: failures naming `MAX_BOARD_W`, `Enemy`, `RefObject`, `C4`, `D4`, `E4`, and the unused `base` in the session test.

- [x] **Step 2: Apply the minimal removals**

Make these exact edits:

```diff
-const MAX_BOARD_W = 396;
```

```diff
-interface Enemy {
-  x: number;
-  y: number;
-  w: number;
-  h: number;
-}
```

```diff
-import { createContext, useContext, type RefObject } from "react";
+import { createContext, useContext } from "react";
```

```diff
-const C4 = 262;
-const D4 = 294;
-const E4 = 330;
```

```diff
   it("reportGameSession 通關發星與貼紙", () => {
-    const base = loadPlayerProfile();
     const cleared = reportGameSession({
```

- [x] **Step 3: Verify the strict unused-symbol check passes**

Run:

```bash
npx tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false
```

Expected: exit code 0 and no output.

### Task 3: Clean generated staging and worktree metadata

**Files:**
- Modify: `.gitignore`
- Delete local generated directory: `public/.landing-staging/`

- [x] **Step 1: Add the landing-art staging directory to ignore rules**

Add beside the existing illustration staging rule:

```gitignore
# Landing Hero 生圖暫存（人工審圖前的草稿，勿入庫）
/public/.landing-staging/
```

- [x] **Step 2: Remove the reproducible local staging directory**

Run:

```bash
rm -rf public/.landing-staging
```

Expected: directory no longer exists; formal images under `public/landing/` remain untouched.

- [x] **Step 3: Prune stale worktree metadata**

Run:

```bash
git worktree prune --verbose
git worktree list --porcelain
git worktree prune --dry-run --verbose
```

Expected: only `/Users/godmosword.eth/Downloads/podcast-website` remains; final dry run prints no stale entries.

- [x] **Step 4: Confirm unmerged branches remain protected**

Run:

```bash
git branch -vv
git branch --merged main
```

Expected: the three local branches with unmerged commits still exist; only `main` appears in the merged list.

### Task 4: Document repository logic and audit findings

**Files:**
- Create: `docs/REPOSITORY-AUDIT.md`

- [x] **Step 1: Write the architecture and data-flow report**

The report must contain these concrete sections:

```markdown
# Repository Audit

## Runtime architecture
## Podcast content flow
## Game architecture
## Automation and verification
## Dead-code evidence and removals
## Git and worktree status
## Remaining maintenance risks
```

Document framework-convention roots (`app/**/page.tsx`, `route.ts`, `opengraph-image.tsx`, `robots.ts`, `sitemap.ts`), workflow-only script roots, the split between `lib/game-kit/` and `lib/gamekit/`, all deleted files, all preserved implicit roots, and the retained unmerged branches.

- [x] **Step 2: Check the report against current paths**

Run:

```bash
rg -n "GamePixelBoard|GameShell|useGameKitProgress|usePixelBoardScale|useSwipeGesture" docs/REPOSITORY-AUDIT.md
test -f app/robots.ts
test -f app/sitemap.ts
test -f scripts/check-sync-fresh.ts
test -f scripts/sync-alert.ts
```

Expected: removed modules appear only in the audit removal list; all protected implicit roots exist.

### Task 5: Full verification and completion audit

**Files:**
- Verify all files changed in Tasks 1–4

- [x] **Step 1: Run unit tests**

Run:

```bash
npm test
```

Expected: all test files and tests pass.

- [x] **Step 2: Verify episode/content invariants**

Run:

```bash
npm run verify:episodes
```

Expected: exit code 0; warnings about known content maturity are allowed by the repository policy.

- [x] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: successful Next.js production build and static route generation.

- [x] **Step 4: Re-run TypeScript strict unused check**

Run:

```bash
npx tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false
```

Expected: exit code 0 and no output.

- [x] **Step 5: Audit final filesystem and Git state**

Run:

```bash
git status --short --branch
git diff --check
test ! -e public/.landing-staging
git check-ignore -q public/.landing-staging
git worktree list --porcelain
git worktree prune --dry-run --verbose
```

Expected: only intentional cleanup/docs changes are present, no whitespace errors, staging is absent and ignored, one active worktree exists, and no stale metadata remains.

- [x] **Step 6: Review the final diff**

Run:

```bash
git diff --stat
git diff -- . ':(exclude)package-lock.json'
```

Expected: no content assets, Podcast metadata, legal text, dependencies, or unrelated behavior changed.
