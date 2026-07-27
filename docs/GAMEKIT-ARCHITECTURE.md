# GameKit Architecture

GameKit is the shared layer for the five shipped games: Car Adventure, Block Drop,
Candy Match, Candy Kart, and Bonbon Snowboard. It is intentionally small. Game-specific UI can live
in `components/games/`, while reusable loops, input, rendering, audio, progress,
and bridge contracts live under `lib/gamekit/`.

## Architecture Map

```text
app/games/* pages
  -> components/games/* game surfaces
       -> lib/gamekit/react/*       React adapters and controls
       -> lib/gamekit/runtime/*     canvas loop, input, rendering, audio, assets
       -> lib/gamekit/progress/*    save data, settings, economy, sessions
       -> lib/gamekit/games/*       domain translators and game-specific contracts
       -> lib/gamekit/types.ts      cross-layer shared types only

public/candy-kart/*                 Godot static runtime, loaded by iframe
public/snowboard/v2/*              Versioned Godot static runtime, loaded by iframe
lib/games/*                         standalone game data/engines outside GameKit
```

The dependency direction is one-way: app/components may import GameKit leaf
modules; GameKit modules must not import React game screens. Domain modules in
`lib/gamekit/games/` may translate external game data into GameKit progress
results, but they should not own UI.

## Directory Responsibilities

`lib/gamekit/react/`
: React-only adapters for reusable game interaction: hooks, touch controls,
visibility pause, audio hook wrappers, and score hooks. Files in this directory
may use React APIs and CSS modules.

`lib/gamekit/runtime/`
: Browser runtime primitives that do not depend on React components: fixed-step
loops, input mapping, pixel renderer helpers, palettes, audio bus, chiptune BGM,
preloading, procedural sheets, and juice effects.

`lib/gamekit/progress/`
: Persistent player data and cross-game progression: save migration, settings,
economy, garage unlocks, medal bit flags, session reporting, stickers, and the
`GAMEKIT_PROGRESS_EVENT` compatibility event. LocalStorage schema and migration
behavior are compatibility contracts.

`lib/gamekit/games/`
: Game-domain contracts that are shared outside one component. Today this is
Car Adventure level JSON conversion plus the Candy Kart and Snowboard iframe
bridges/adapters.

`lib/gamekit/types.ts`
: Cross-layer TypeScript types only, such as `GameKitGameId`, viewport/input
types, economy ledger entries, and `PlayerProfile`. The root does not expose a
barrel API.

`docs/GAMEKIT-ART-BIBLE.md`
: Visual direction for the GameKit pixel/clay arcade style. It is documentation,
not a runtime module.

## Import Policy

Use explicit leaf-path imports:

```ts
import { useGameAudio } from "@/lib/gamekit/react/useGameAudio";
import { viewportFor } from "@/lib/gamekit/runtime/constants";
import { reportGameSession } from "@/lib/gamekit/progress/session";
import type { GameKitGameId } from "@/lib/gamekit/types";
```

Do not import from the root:

```ts
// Forbidden
import { useGameAudio } from "@/lib/gamekit";
```

Also forbidden:

- `@/lib/game-kit` legacy paths.
- `lib/gamekit/index.ts`.
- Broad `export * from` barrels inside GameKit.
- Test-only exports kept alive without a production consumer.
- New localStorage keys or postMessage fields without migration/compatibility
  tests.

Only add a root-level file such as `iframe-bridge.ts` when the contract is truly
cross-game. A single-game bridge belongs in `lib/gamekit/games/`.

## Current Game Usage

| Game | Main Surface | GameKit Usage | External Runtime |
| --- | --- | --- | --- |
| Car Adventure | `components/games/car-adventure/CarAdventureGame.tsx` | `react/TouchControls`, `useFixedGameLoop`, `useGameAudio`, `useBestScore`, `useVisibilityPause`; `runtime/juice`; `games/adventure-level`; `progress/session` | level/physics／clay draw in `lib/games/car-adventure/`；選單在 canvas 外避免裁切 |
| Block Drop | `components/games/BlockDropGame.tsx` | `useGameLoop`, `useTouchControls`, `useVisibilityPause`, `useBestScore`, `useGameAudio`; `progress/settings`; `progress/session` | local component game logic |
| Candy Match | `components/games/CandyMatchGame.tsx` | `useGameAudio`; `progress/save`, `progress/meta`, `progress/session` | engine/levels in `lib/games/candy-match/` |
| Candy Kart | `components/games/CandyKartView.tsx` via `GameHost` | `games/candy-kart-bridge` validates iframe messages and maps finish data to `progress/session` | Godot export in `public/candy-kart/` |
| Bonbon Snowboard | `components/games/SnowboardView.tsx` via `GameHost` | `games/snowboard-bridge` validates source, origin, window, run id and score fields | Versioned Godot export in `public/snowboard/v2/` |

## Adding a New Game

1. Add the route under `app/games/<id>/` and the playable surface under
   `components/games/`.
2. Add the id to `GameKitGameId` only after deciding the progress behavior.
   Keep existing id strings unchanged.
3. Use `react/` hooks for shared controls, audio, pause, loop, and score UI. Add
   a new hook only if at least two games need the behavior.
4. Use `runtime/` for reusable browser/game primitives. Do not put React state
   or component-specific UI here.
5. Report completion through `reportGameSession()` so stars, medals, stickers,
   best scores, and compatibility events stay centralized.
6. Put game-specific translators in `games/` when a component and tests both
   need the contract. Keep one-off component internals in the component.
7. Add focused tests near the boundary touched: runtime tests in `runtime/`,
   progress tests in `progress/`, and game-domain tests in `games/`.
8. Update this document and repository architecture guards when a new boundary
   is introduced.

## Future Expansion Notes

- Preserve localStorage schema compatibility. Add migrations before changing
  `PlayerProfile`, economy, medals, or settings fields.
- Preserve Candy Kart postMessage compatibility. If Godot changes the message
  contract, accept both old and new payloads until the static export and website
  are deployed together.
- Keep static runtime assets out of dead-code deletion decisions. Godot files in
  `public/candy-kart/` are loaded by the browser, not imported by TypeScript.
- Avoid root convenience APIs. They make future refactors look easy while
  hiding which layer a consumer actually needs.
- Do not add placeholder modules for planned games. Add the smallest real
  module when production code starts using it.
- When a new game needs a runtime primitive, first check whether it belongs in
  the component, `lib/games/<game>/`, or GameKit. Promote to GameKit only after
  the boundary is shared or clearly stable.
