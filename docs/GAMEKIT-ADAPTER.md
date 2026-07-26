# GameKit Adapter Architecture

## Goal

Unify the four playground games (Candy Match, Car Adventure, Block Drop, Candy Kart)
behind a single `GameAdapter` contract so that:

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

1. **Candy Match** – pure function engine already exists → easiest adapter.
2. **Car Adventure** – physics + render already split.
3. **Block Drop** – extract state machine from the large component.
4. **Candy Kart** – iframe adapter wrapping existing postMessage bridge.

## Compatibility Rules

- Do **not** change localStorage schema or `reportGameSession` payload shape.
- Keep existing `GameKitGameId` string values unchanged.
- Candy Kart postMessage contract must remain accepted (old + new) until the
  Godot export and website are deployed together.
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
