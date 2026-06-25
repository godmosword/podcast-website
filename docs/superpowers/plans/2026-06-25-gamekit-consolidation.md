# Game Kit Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve all four playable games while replacing the `lib/game-kit/` plus root-level `lib/gamekit/` tangle with one explicit `lib/gamekit/{react,runtime,progress,games}` architecture and deleting unimplemented Phase scaffolding.

**Architecture:** First establish a failing import-boundary test, then delete test-only scaffolding, move React adapters, runtime modules, progress modules, and game-specific modules in separate verified batches. All consumers use explicit leaf imports; no root barrel survives.

**Tech Stack:** React 19、TypeScript、Vitest、Playwright、Godot Web export

**Prerequisite:** Complete `docs/superpowers/plans/2026-06-25-product-surface-cleanup.md` first.

**Commit policy:** This repo defaults to no commit. Use test and diff checkpoints; commit only if the user explicitly requests it.

---

### Task 1: Extend the architecture guard for Game Kit boundaries

**Files:**
- Modify: `scripts/lib/repository-architecture.test.ts`

- [ ] **Step 1: Add failing Game Kit assertions**

Add `readdirSync` to the existing `node:fs` import, add this helper after `source()`, and append the test:

```ts
function walk(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    return entry.isDirectory() ? walk(child) : [child];
  });
}

it("uses one explicit Game Kit module tree", () => {
  expect(existsSync(join(ROOT, "lib/game-kit"))).toBe(false);
  expect(existsSync(join(ROOT, "lib/gamekit/index.ts"))).toBe(false);

  const sources = ["app", "components", "hooks", "lib", "data", "scripts"]
    .flatMap((dir) => walk(join(ROOT, dir)))
    .filter((path) => /\.(ts|tsx)$/.test(path))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");

  expect(sources).not.toMatch(/@\/lib\/game-kit(?:["'/])/);
  expect(sources).not.toMatch(
    /from\s+["']@\/lib\/gamekit["']/,
  );
});
```

- [ ] **Step 2: Verify the guard fails**

Run:

```bash
npx vitest run scripts/lib/repository-architecture.test.ts
```

Expected: FAIL because `lib/game-kit/`, `lib/gamekit/index.ts`, and root imports still exist.

### Task 2: Delete test-only and unimplemented Game Kit scaffolding

**Files:**
- Delete: `lib/game-kit/gameStateMachine.ts`
- Delete: `lib/game-kit/gameStateMachine.test.ts`
- Delete: `lib/gamekit/abilities.ts`
- Delete: `lib/gamekit/abilities.test.ts`
- Delete: `lib/gamekit/bridge.ts`
- Delete: `lib/gamekit/pool.ts`
- Delete: `lib/gamekit/scene.ts`
- Delete: `lib/gamekit/sprite-defs.ts`
- Delete: `lib/gamekit/tiled-loader.ts`
- Delete: `lib/gamekit/tilemap.ts`
- Modify: `lib/gamekit/gamekit.test.ts`
- Modify: `lib/gamekit/types.ts`
- Modify: `lib/game-kit/index.ts`
- Modify: `lib/gamekit/index.ts`

- [ ] **Step 1: Reconfirm no production consumer**

Run:

```bash
for symbol in \
  createGameStateMachine VEHICLE_ABILITIES canvasPaletteFromKit ObjectPool \
  SceneManager tiledToAdventureJson Tilemap emptyTilemap SpriteAnimator \
  TRUCK_IDLE TRUCK_DRIVE FIREFLY_BLINK
do
  rg -n "\\b${symbol}\\b" app components hooks lib data scripts \
    -g '!**/*.test.ts' \
    -g '!lib/gamekit/index.ts' \
    -g '!lib/game-kit/index.ts' || true
done
```

Expected: no production consumer outside the defining/soon-deleted modules.

- [ ] **Step 2: Remove test-only test blocks**

From `lib/gamekit/gamekit.test.ts`, remove imports and describe blocks for:

```text
ObjectPool
emptyTilemap
tiledToAdventureJson / normalizeAdventureLevelJson
sprite definitions / SpriteAnimator
```

Keep runtime, progress, settings, session, preload, adventure-level, audio, and juice tests.

- [ ] **Step 3: Remove obsolete type**

Delete `GameSceneId` from `lib/gamekit/types.ts`. Keep all storage and input types.

- [ ] **Step 4: Remove deleted modules from temporary barrels**

Remove the `gameStateMachine` export block from `lib/game-kit/index.ts`. Remove exports for `pool`, `tilemap`, `abilities`, `scene`, `sprite-defs`, and `tiled-loader` from `lib/gamekit/index.ts`.

- [ ] **Step 5: Delete scaffolding files**

Delete exactly the ten files listed above.

- [ ] **Step 6: Verify remaining tests and strict TypeScript**

Run:

```bash
npx vitest run lib/gamekit/gamekit.test.ts lib/gamekit/economy.test.ts
npx tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false
```

Expected: pass.

### Task 3: Simplify the tile rendering chain before moving runtime

**Files:**
- Modify: `lib/gamekit/tileset-draw.ts`
- Modify: `lib/gamekit/index.ts`
- Delete: `lib/gamekit/assets.ts`
- Delete: `lib/gamekit/sprite.ts`

- [ ] **Step 1: Inline the only production asset helper**

Replace the `drawKitTile` import with a private helper:

```ts
function drawKitTile(
  ctx: CanvasRenderingContext2D,
  sheetId: SheetId,
  tileCol: number,
  dx: number,
  dy: number,
  scale = 1,
): void {
  const sheet = getGameSheet(sheetId);
  const size = TILE_SIZE * scale;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    sheet,
    tileCol * TILE_SIZE,
    0,
    TILE_SIZE,
    TILE_SIZE,
    dx,
    dy,
    size,
    size,
  );
  ctx.restore();
}
```

Keep existing public `drawAdventureGroundTile`, `drawAdventureCoin`, and `drawAdventureSpike`. Remove unused exported `blitFromSheet`.

- [ ] **Step 2: Delete the obsolete asset/sprite adapter**

Delete `lib/gamekit/assets.ts` and `lib/gamekit/sprite.ts`.

- [ ] **Step 3: Remove the temporary asset barrel export**

Remove `export * from "./assets";` and `export * from "./sprite";` from `lib/gamekit/index.ts`.

- [ ] **Step 4: Verify Car Adventure rendering dependencies**

Run:

```bash
npx vitest run lib/games/game-logic-regressions.test.ts
npx tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false
```

Expected: pass.

### Task 4: Move React adapters into `lib/gamekit/react`

**Files:**
- Move: `lib/game-kit/TouchControls.tsx` → `lib/gamekit/react/TouchControls.tsx`
- Move: `lib/game-kit/touch-controls.module.css` → `lib/gamekit/react/touch-controls.module.css`
- Move: `lib/game-kit/useBestScore.ts` → `lib/gamekit/react/useBestScore.ts`
- Move: `lib/game-kit/useFixedGameLoop.ts` → `lib/gamekit/react/useFixedGameLoop.ts`
- Move: `lib/game-kit/useGameAudio.ts` → `lib/gamekit/react/useGameAudio.ts`
- Move: `lib/game-kit/useGameLoop.ts` → `lib/gamekit/react/useGameLoop.ts`
- Move: `lib/game-kit/useGameLoop.test.ts` → `lib/gamekit/react/useGameLoop.test.ts`
- Move: `lib/game-kit/useTouchControls.ts` → `lib/gamekit/react/useTouchControls.ts`
- Move: `lib/game-kit/useVisibilityPause.ts` → `lib/gamekit/react/useVisibilityPause.ts`
- Delete: `lib/game-kit/index.ts`
- Modify: `components/games/BlockDropGame.tsx`
- Modify: `components/games/CarPlatformer.tsx`
- Modify: `components/games/CandyMatchGame.tsx`

- [ ] **Step 1: Move files without changing behavior**

Create `lib/gamekit/react/` and move the nine adapter/test files. Preserve the CSS import as `./touch-controls.module.css`.

- [ ] **Step 2: Replace barrel imports with leaf imports**

Block Drop:

```ts
import { useBestScore } from "@/lib/gamekit/react/useBestScore";
import { useGameAudio } from "@/lib/gamekit/react/useGameAudio";
import { useGameLoop } from "@/lib/gamekit/react/useGameLoop";
import { useTouchControls } from "@/lib/gamekit/react/useTouchControls";
import { useVisibilityPause } from "@/lib/gamekit/react/useVisibilityPause";
```

Car Adventure:

```ts
import {
  BarTouchButton,
  touchControlStyles,
} from "@/lib/gamekit/react/TouchControls";
import { useBestScore } from "@/lib/gamekit/react/useBestScore";
import { useFixedGameLoop } from "@/lib/gamekit/react/useFixedGameLoop";
import { useGameAudio } from "@/lib/gamekit/react/useGameAudio";
import { useTouchControls } from "@/lib/gamekit/react/useTouchControls";
import { useVisibilityPause } from "@/lib/gamekit/react/useVisibilityPause";
```

Candy Match:

```ts
import { useGameAudio } from "@/lib/gamekit/react/useGameAudio";
```

- [ ] **Step 3: Preserve current runtime leaf imports during this move**

Keep these imports until Task 5 moves runtime modules:

```ts
// useFixedGameLoop.ts
import { GameLoop, type GameLoopCallbacks } from "@/lib/gamekit/loop";

// useGameAudio.ts
import { GameKitAudioBus } from "@/lib/gamekit/audio";
import type { GameKitGameId } from "@/lib/gamekit/types";

// useBestScore.ts
import type { GameKitGameId } from "@/lib/gamekit/types";
```

- [ ] **Step 4: Delete the old adapter barrel**

Delete `lib/game-kit/index.ts`. Confirm `lib/game-kit/` contains no files and remove the empty directory.

- [ ] **Step 5: Verify adapter migration**

Run:

```bash
rg -n "@/lib/game-kit" app components hooks lib data scripts
npx vitest run lib/gamekit/react/useGameLoop.test.ts lib/games/game-logic-regressions.test.ts
npx tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false
```

Expected: no old imports; tests and TypeScript pass.

### Task 5: Move runtime modules

**Files:**
- Move these `lib/gamekit/*.ts` files into `lib/gamekit/runtime/`:
  `audio.ts`, `chiptune-bgm.ts`, `constants.ts`, `input.ts`, `juice.ts`,
  `loop.ts`, `palette.ts`, `preload.ts`, `procedural-sheets.ts`,
  `renderer.ts`, `style.ts`, `tileset-draw.ts`
- Modify: `hooks/useDomJuice.ts`
- Modify: `hooks/useGameAssetPreload.ts`
- Modify: `hooks/useGameInput.ts`
- Modify: `hooks/usePixelRenderer.ts`
- Modify: `components/games/CarPlatformer.tsx`
- Modify: `components/games/PixelGameCanvas.tsx`
- Modify: `lib/gamekit/save.ts`
- Modify: `lib/gamekit/session.ts`
- Modify runtime-relative imports
- Delete: `lib/gamekit/index.ts`

- [ ] **Step 1: Move the twelve runtime files**

Create `lib/gamekit/runtime/` and move exactly the listed files.

- [ ] **Step 2: Update runtime internal imports**

Within runtime:

```text
audio.ts              ./chiptune-bgm, ../types
chiptune-bgm.ts       ../types
constants.ts          ../types
input.ts              ../types
juice.ts              ./palette
loop.ts               ./constants
palette.ts            ../types
preload.ts            ../types, ./procedural-sheets
procedural-sheets.ts  ./palette
renderer.ts           ./constants, ./palette, ../types
style.ts              ./palette
tileset-draw.ts       ./palette, ./procedural-sheets
```

- [ ] **Step 3: Update consumers**

Use explicit paths:

```text
hooks/useDomJuice.ts                 runtime/juice
hooks/useGameAssetPreload.ts         runtime/preload
hooks/useGameInput.ts                runtime/input
hooks/usePixelRenderer.ts            runtime/renderer and ../types
components/games/CarPlatformer.tsx    runtime/juice, runtime/style, runtime/tileset-draw
components/games/PixelGameCanvas.tsx  types + runtime/constants/palette
lib/gamekit/save.ts                   runtime/constants
lib/gamekit/session.ts                runtime/constants
```

Replace the two imports from `@/lib/gamekit` root in `hooks/usePixelRenderer.ts` and `PixelGameCanvas.tsx` with leaf imports.

- [ ] **Step 4: Update runtime tests**

Move runtime-related imports in `lib/gamekit/gamekit.test.ts` to `runtime/*`.

- [ ] **Step 5: Replace the remaining root barrel imports and delete the barrel**

Change the initial root import block in `lib/gamekit/gamekit.test.ts` to explicit imports from `types`, `runtime/constants`, `runtime/palette`, `runtime/renderer`, and `runtime/loop`. Confirm:

```bash
rg -n "from [\"']@/lib/gamekit[\"']" app components hooks lib data scripts
```

returns no matches, then delete `lib/gamekit/index.ts`.

- [ ] **Step 6: Verify runtime migration**

Run:

```bash
npx vitest run lib/gamekit/gamekit.test.ts lib/gamekit/react/useGameLoop.test.ts
npx tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false
```

Expected: pass.

### Task 6: Move progress modules

**Files:**
- Move these files into `lib/gamekit/progress/`:
  `economy.ts`, `economy.test.ts`, `garage.ts`, `meta.ts`, `save.ts`,
  `session.ts`, `settings.ts`, `stickers.ts`
- Modify: `lib/progress-store.ts`
- Modify: `hooks/useGameKitSettings.ts`
- Modify: `components/games/BlockDropGame.tsx`
- Modify: `components/games/CarPlatformer.tsx`
- Modify: `components/games/CandyMatchGame.tsx`
- Modify: `components/games/CandyKartIframeHost.tsx`
- Modify: `components/games/GameChrome.tsx`
- Modify: `lib/gamekit/iframe-bridge.ts`
- Modify: `lib/gamekit/candy-kart-bridge.test.ts`
- Modify: `lib/gamekit/iframe-bridge.test.ts`

- [ ] **Step 1: Move progress files**

Create `lib/gamekit/progress/` and move the eight modules plus economy test.

- [ ] **Step 2: Update progress internal imports**

Use:

```text
economy.ts  ../types, ./garage
meta.ts     ../types, ./save
save.ts     ../types, ./economy, ../runtime/constants
session.ts  ../types, ./garage, ./economy, ./save, ./meta,
            ../runtime/constants, @/lib/progress-store
settings.ts @/lib/progress-store
```

- [ ] **Step 3: Update consumers**

Use explicit `progress/*` paths for:

```text
lib/progress-store.ts
hooks/useGameKitSettings.ts
BlockDropGame.tsx
CarPlatformer.tsx
CandyMatchGame.tsx
CandyKartIframeHost.tsx
GameChrome.tsx
lib/gamekit/iframe-bridge.ts
lib/gamekit/candy-kart-bridge.test.ts
lib/gamekit/iframe-bridge.test.ts
```

- [ ] **Step 4: Update tests**

Update `lib/gamekit/gamekit.test.ts`, `economy.test.ts`, progress-store tests, and bridge tests to new progress paths.

- [ ] **Step 5: Verify storage compatibility**

Run:

```bash
npx vitest run lib/progress-store.test.ts lib/gamekit/progress/economy.test.ts lib/gamekit/gamekit.test.ts
npx tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false
```

Expected: legacy migrations and progress tests pass without schema/key changes.

### Task 7: Move game-specific modules and Candy Kart bridge

**Files:**
- Move: `lib/gamekit/adventure-level.ts` → `lib/gamekit/games/adventure-level.ts`
- Move: `lib/gamekit/iframe-bridge.ts` → `lib/gamekit/games/candy-kart-bridge.ts`
- Move: `lib/gamekit/iframe-bridge.test.ts` → `lib/gamekit/games/candy-kart-bridge.test.ts`
- Move: `lib/gamekit/candy-kart-bridge.test.ts` → `lib/gamekit/games/candy-kart-session.test.ts`
- Modify: `lib/games/car-adventure/levels.ts`
- Modify: `components/games/CarPlatformer.tsx`
- Modify: `components/games/CandyKartIframeHost.tsx`

- [ ] **Step 1: Move domain files and tests**

Create `lib/gamekit/games/` and perform the four moves.

- [ ] **Step 2: Update imports**

Use:

```ts
import type { AdventureLevelJson } from "@/lib/gamekit/games/adventure-level";
import {
  candyKartSessionFromFinish,
  isCandyKartFinishMessage,
  isCandyKartReadyMessage,
} from "@/lib/gamekit/games/candy-kart-bridge";
```

In the bridge module, import `GameSessionResult` from `../progress/session`.

- [ ] **Step 3: Verify game-specific contracts**

Run:

```bash
npx vitest run \
  lib/gamekit/games/candy-kart-bridge.test.ts \
  lib/gamekit/games/candy-kart-session.test.ts \
  lib/games/game-logic-regressions.test.ts
npx tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false
```

Expected: pass.

### Task 8: Prune unused Game Kit exports and verify barrel removal

**Files:**
- Modify: `lib/gamekit/runtime/audio.ts`
- Modify: `lib/gamekit/runtime/chiptune-bgm.ts`
- Modify: `lib/gamekit/runtime/constants.ts`
- Modify: `lib/gamekit/runtime/juice.ts`
- Modify: `lib/gamekit/runtime/palette.ts`
- Modify: `lib/gamekit/runtime/preload.ts`
- Modify: `lib/gamekit/runtime/procedural-sheets.ts`
- Modify: `lib/gamekit/progress/garage.ts`
- Modify: `lib/gamekit/progress/meta.ts`
- Modify: `lib/gamekit/progress/save.ts`
- Modify: `lib/gamekit/progress/session.ts`
- Modify: `lib/gamekit/progress/settings.ts`
- Modify: `lib/gamekit/progress/stickers.ts`
- Modify: `lib/gamekit/games/adventure-level.ts`

- [ ] **Step 1: Confirm both barrels are absent**

Run:

```bash
test ! -e lib/game-kit
test ! -e lib/gamekit/index.ts
rg -n "from [\"']@/lib/gamekit[\"']|@/lib/game-kit" app components hooks lib data scripts && exit 1 || true
```

Expected: both paths are absent and there are no root/old imports.

- [ ] **Step 2: Prune the known unused exports**

Remove these public exports or whole helpers if they have no internal consumer:

```text
runtime/audio.ts: createAudioBus, BGM_THEMES re-export
runtime/chiptune-bgm.ts: BgmStep exported type
runtime/constants.ts: GAMEKIT_VERSION
runtime/juice.ts: ParticlePool, ScreenShake, Hitstop, easeOutBack, applyCanvasShake
runtime/palette.ts: GAME_PALETTE_INDICES, snapChannel
runtime/preload.ts: preloadGameAssetsSync, preloadAllGameAssets, resetPreloadCacheForTests
runtime/procedural-sheets.ts: clearGameSheetCache, sheetTileDataUrl, tileUrl, blockUrl
progress/garage.ts: nextGarageUnlock
progress/meta.ts: MetaProgress
progress/save.ts: syncLegacyScores, getEconomy, grantStars, spendStars, subscribeEconomy
progress/session.ts: totalMedalStars
progress/settings.ts: GAMEKIT_SETTINGS_KEY
progress/stickers.ts: GAME_STICKERS, stickerDef, StickerDef
games/adventure-level.ts: levelToJson and unused exported structural subtypes
```

Keep internal helpers private when still used within the same file.

- [ ] **Step 3: Run Knip and classify only real runtime false positives**

Run:

```bash
npx --yes knip --reporter compact > /tmp/gamekit-knip.txt || true
sed -n '1,260p' /tmp/gamekit-knip.txt
```

Expected: no unused `lib/game-kit` or `lib/gamekit` files/exports. Godot generated JS/audio worklet and `public/sw.js` are allowed because HTML/service-worker registration proves runtime use.

- [ ] **Step 4: Make the architecture guard pass**

Run:

```bash
npx vitest run scripts/lib/repository-architecture.test.ts
```

Expected: PASS; no old directory, barrel, or root import remains.

### Task 9: Update documentation for the consolidated architecture

**Files:**
- Modify: `README.md`
- Modify: `DESIGN.md`
- Modify: `TODOS.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/REPOSITORY-AUDIT.md`
- Modify: `lib/gamekit/ART-BIBLE.md` or move it to `docs/` if it remains current

- [ ] **Step 1: Document the final four-layer tree**

README and repository audit must describe:

```text
lib/gamekit/react
lib/gamekit/runtime
lib/gamekit/progress
lib/gamekit/games
```

Remove mentions of `lib/game-kit`, `GamePixelBoard`, retired Phase skeletons, and barrel imports.

- [ ] **Step 2: Archive the Phase history**

Condense TODOS Phase 0–8 into a historical note with links to CHANGELOG and the final architecture. Do not leave removed modules presented as current implementation guidance.

- [ ] **Step 3: Record the consolidation**

Add CHANGELOG bullets covering:

- one Game Kit tree;
- explicit leaf imports;
- removal of unimplemented Phase scaffolding;
- preservation of four routes and storage schema.

### Task 10: Full verification and completion audit

**Files:**
- Verify all files changed in Tasks 1–9

- [ ] **Step 1: Run strict static checks**

Run:

```bash
npx tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false
npx --yes knip --reporter compact
npx vitest run scripts/lib/repository-architecture.test.ts
```

Expected: TypeScript and architecture tests pass; Knip reports no application/Game Kit unused files or exports.

- [ ] **Step 2: Run all unit and content tests**

Run:

```bash
npm test
npm run verify:episodes
```

Expected: all tests pass; episode verifier has zero errors.

- [ ] **Step 3: Build and run browser smoke tests**

Run:

```bash
npm run build
npm run test:e2e
```

Expected: production build and Playwright pass.

- [ ] **Step 4: Verify all four game routes**

Run after starting production server:

```bash
for route in \
  /games/car-adventure \
  /games/block-drop \
  /games/candy-match \
  /games/candy-kart
do
  curl -fsS "http://127.0.0.1:3000$route" >/dev/null
done
```

Expected: all four return success.

- [ ] **Step 5: Audit runtime assets and protected paths**

Run:

```bash
test -f public/candy-kart/index.html
test -f public/candy-kart/index.js
test -f public/candy-kart/index.audio.worklet.js
test -f public/candy-kart/index.wasm
test -f public/sw.js
rg -n '<script src="index\\.js">' public/candy-kart/index.html
rg -n 'register\\("/sw\\.js"\\)' components/ServiceWorkerRegister.tsx
git diff --check
git diff --name-only | rg '^(public/(stories|characters|landing|candy-kart)/|data/(apple-synced|apple-sync-state|apple-sync\\.defaults|stories)\\.(json|ts)|app/legal/|DISCLAIMER\\.md)$' && exit 1 || true
```

Expected: generated/runtime assets remain; no protected content changes.

- [ ] **Step 6: Review the final diff**

Run:

```bash
git status --short --branch
git diff --stat
git diff --name-status
```

Expected: only approved product cleanup, Game Kit consolidation, tests, and documentation changes.
