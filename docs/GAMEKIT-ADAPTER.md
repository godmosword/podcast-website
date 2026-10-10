# GameKit Adapter Architecture

## Goal

Keep the two arcade games (Candy Match and Block Drop) behind a single
`GameAdapter` contract so that:

1. Lifecycle, input, audio, pause, progress and chrome live in one place (`GameHost`).
2. Each game only owns its pure logic + rendering.
3. Future AI-generated games can be dropped in by implementing the same interface.

## Core Types

See `lib/gamekit/adapter.ts`.

```ts
interface GameAdapter {
  id: GameKitGameId;
  create(options: GameCreateOptions): GameInstance;
}

interface GameInstance {
  getStatus(): GameStatus;
  getScore(): number;
  start / pause / resume / restart / dispose;
  setAction(action: GameAction, pressed: boolean);
  fixedUpdate?(dt: number);   // canvas / physics
  render?(ctx, alpha);        // canvas
  renderOverlay?(props);      // menus, HUD, result
}
```

## Host Responsibilities (`lib/gamekit/host/GameHost.tsx`)

- Instantiates the adapter once.
- Owns `GameChrome`, toolbar, settings dialog, tutorial overlay.
- Owns audio bus via `useGameAudio`.
- Owns best-score + `reportGameSession`（每次 `onSession` 都寫入；中關通關可多次，終局由 adapter 去重）。
- Maps keyboard / touch / gamepad → `setAction`.
- Runs the shared `GameLoop` when the instance exposes `fixedUpdate`.
- 不提供共用觸控列：觸控鍵由各遊戲 View 自己做（消消樂點格、方塊轉轉井下鍵列），Host 只接 `setAction`。

## Migration Order

1. **Candy Match** – ✅ overlay adapter（`lib/gamekit/games/candy-match/`）
2. **Block Drop** – ✅ overlay adapter（DOM board）

## Compatibility Rules

- Do **not** change localStorage schema or `reportGameSession` payload shape.
- Keep existing `GameKitGameId` string values unchanged.
- Existing component routes stay as thin wrappers that just pass the adapter
  into `<GameHost adapter={...} />`.

## Adding a New (or AI-generated) Game

1. Implement `GameAdapter` + `GameInstance` under `lib/gamekit/games/<id>/`.
2. Register the adapter (or import it directly in the page).
3. Create a one-line page:

```tsx
export default function Page() {
  return <GameHost adapter={myAdapter} title="..." tutorial={...} />;
}
```

No new chrome / audio / progress code required.

### 新增遊戲 checklist（以 dino-sushi 為例，2026-10-10）

新增 Game Kit 遊戲 id 會改變存檔 key 範圍與 analytics payload，屬 L3（見 `docs/AGENT-WORKFLOW.md`）。

1. `lib/gamekit/types.ts` 的 `GAMEKIT_GAME_IDS` 加 id。TS 會強制補齊：`GameLoadingGate.tsx` 的 `LABELS`、`runtime/preload.ts` 的 `GAME_PRELOAD_SHEETS`、`runtime/chiptune-bgm.ts` 的 `BGM_THEMES`。
2. `data/games.ts`：新 `GameMeta`（新的 `GameType` 要補 `app/games/page.tsx` 的 `GAME_TYPE_LABEL` 與 `components/games/GamePlayIcon.tsx`）、`GAME_NEXT` 單環插入。
3. 不會編譯失敗、漏加只會靜默失效的名單，由 `lib/gamekit/progress/game-id-registry.test.ts` 對照 `GAMEKIT_GAME_IDS`：`lib/activity-log.ts`（已直接用 `GAMEKIT_GAME_IDS`）、`lib/for-parents/dashboard.ts` 遊戲列、`lib/gamekit/progress/stickers.ts` 的 `played-<id>` 貼紙名。
4. 手寫清單：`app/games/page.tsx` 的 `HUB_STATION_ORDER`、`app/sitemap.ts`、`scripts/generate-page-freshness.ts`（route 第一次 commit 後跑 `npm run generate:page-freshness`）、`components/games/GamePageShell.tsx` 的 `CONTROL_ICONS`（對齊 `controls` 文案）、`GamePageShell.module.css` 的版面與夜間覆寫。
5. e2e：`e2e/games.spec.ts` 的 `SHELL_ROUTES`、`e2e/a11y.spec.ts` 的 `PAGES`、`e2e/smoke.spec.ts`、`e2e/games-lifecycle.spec.ts`；視覺 baseline 由使用者在 Mac 補錄。
6. 新文案重跑 `npm run font:subset`；遊樂園卡片封面放 `public/games/v2/<id>/cover.webp`（1448×1086）。
7. DOM 遊戲（無 `fixedUpdate`）不開 GameLoop，天生沒有計時；只呼叫 `options.onSession`，由 GameHost 寫存檔，不自己呼叫 `reportGameSession`。Host 在 ready/won/over 按 Enter 會呼叫 `start()`，`start`／`restart` 必須冪等。medal bit 是存檔相容性契約，上線後不要改條件。

## Touch / coarse-pointer contract（兒童路徑）

手動 coarse 檢查（PR-A 觸及路徑；各玩 1 短局）：

| 路徑 | 檢查 |
|------|------|
| candy-match | 輕點格可選取；手指微飄仍可 tap；滑出格後抬起不應吞掉有效 tap |
| block-drop | 棋盤拖移／點按旋轉；cancel／失焦後不黏手勢 |

契約要點：

- 虛擬鍵：**capture 後滑出＝續按**；放開三路＝`pointerup`／`pointercancel`／`lostpointercapture`（見 `DESIGN.md` 互動節）。BlockDrop 左右移鍵同約；`HintChips` 暫除外。
- 消消樂格寬：`candyMatchCellPx(availableWidth, cols)`（`ResizeObserver` 量 `boardWrap`）；min 44／max 64；gap／padding 常數見 `lib/games/candy-match/cell-size.ts`。
- 單元測須 shim `setPointerCapture`／`releasePointerCapture` 並**斷言呼叫**（jsdom 無實作）。
- `test:visual` 預設 skip ≠ visual 通過；勿以未 trusted 的 visual 當回歸綠燈。
