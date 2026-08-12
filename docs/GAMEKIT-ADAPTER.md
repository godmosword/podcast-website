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
  getTouchActions?();
}
```

## Host Responsibilities (`lib/gamekit/host/GameHost.tsx`)

- Instantiates the adapter once.
- Owns `GameChrome`, toolbar, settings dialog, tutorial overlay.
- Owns audio bus via `useGameAudio`.
- Owns best-score + `reportGameSession`（每次 `onSession` 都寫入；中關通關可多次，終局由 adapter 去重）。
- Maps keyboard / touch / gamepad → `setAction`.
- Runs the shared `GameLoop` when the instance exposes `fixedUpdate`.
- Renders a generic touch bar when coarse pointer is detected.

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

## Touch / coarse-pointer contract（兒童路徑）

手動 coarse 檢查（PR-A 觸及路徑；各玩 1 短局）：

| 路徑 | 檢查 |
|------|------|
| candy-match | 輕點格可選取；手指微飄仍可 tap；滑出格後抬起不應吞掉有效 tap |
| block-drop | 棋盤拖移／點按旋轉；cancel／失焦後不黏手勢 |

契約要點：

- 虛擬鍵：**capture 後滑出＝續按**；放開三路＝`pointerup`／`pointercancel`／`lostpointercapture`（見 `DESIGN.md` 互動節）。BlockDrop 左右移鍵同約；`HintChips` 暫除外。
- 消消樂格寬：`candyMatchCellPx(availableWidth, cols)`（`ResizeObserver` 量 `boardWrap`）；min 48／max 64；gap／padding 常數見 `lib/games/candy-match/cell-size.ts`。
- 單元測須 shim `setPointerCapture`／`releasePointerCapture` 並**斷言呼叫**（jsdom 無實作）。
- `test:visual` 預設 skip ≠ visual 通過；勿以未 trusted 的 visual 當回歸綠燈。
