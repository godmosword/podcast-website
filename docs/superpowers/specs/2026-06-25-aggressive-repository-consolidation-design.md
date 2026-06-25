# Aggressive Repository Consolidation Design

## Goal

保留四款目前可玩的遊戲、正式內容、路由與既有使用者資料相容性，同時刪除未啟用功能、佔位 UI、deprecated API 與未落地的 Game Kit 骨架，將遊戲共用程式收斂到單一 `lib/gamekit/` 架構。

## Scope

本次重整涵蓋兩個互相依賴的範圍：

1. 遊戲共用層：消除 `lib/game-kit/` 與 `lib/gamekit/` 雙架構、barrel exports 與只被測試保活的 Phase 骨架。
2. 產品預留層：刪除永久關閉的功能、沒有資料來源的抽象、deprecated aliases 與「製作中／規劃中」佔位內容。

不重寫四款遊戲的玩法，也不改變 Podcast 內容、自動同步、字幕、插圖、法律文字或正式素材。

## Architecture Decision

### Selected approach

採用「主線收斂」：

- 四款遊戲的現行行為保持不變。
- React adapters 從 `lib/game-kit/` 遷入 `lib/gamekit/react/`。
- 底層 runtime、進度與遊戲領域模組移到清楚的子目錄。
- consumer 全部使用明確檔案路徑，不再依賴 `export *` barrel。
- 只有 production consumer 或必要相容性 consumer 使用的程式可以保留。

### Target layout

```text
lib/gamekit/
├── react/
│   ├── TouchControls.tsx
│   ├── touch-controls.module.css
│   ├── useBestScore.ts
│   ├── useFixedGameLoop.ts
│   ├── useGameAudio.ts
│   ├── useGameLoop.ts
│   ├── useTouchControls.ts
│   └── useVisibilityPause.ts
├── runtime/
│   ├── audio.ts
│   ├── chiptune-bgm.ts
│   ├── constants.ts
│   ├── input.ts
│   ├── juice.ts
│   ├── loop.ts
│   ├── palette.ts
│   ├── preload.ts
│   ├── procedural-sheets.ts
│   ├── renderer.ts
│   ├── style.ts
│   └── tileset-draw.ts
├── progress/
│   ├── economy.ts
│   ├── garage.ts
│   ├── meta.ts
│   ├── save.ts
│   ├── session.ts
│   ├── settings.ts
│   └── stickers.ts
├── games/
│   ├── adventure-level.ts
│   └── candy-kart-bridge.ts
├── iframe-bridge.ts
└── types.ts
```

檔案只在其責任與 consumer 明確時保留。實作期間若 symbol graph 證明某個列入目標 layout 的檔案沒有 production consumer，直接刪除，不為了維持目錄外觀而保留。

### Import policy

- 禁止 `@/lib/game-kit`。
- 禁止從 `@/lib/gamekit` 根目錄匯入。
- 禁止 `lib/gamekit/index.ts` 與廣泛 `export *`。
- consumer 必須匯入明確路徑，例如：

```ts
import { useGameAudio } from "@/lib/gamekit/react/useGameAudio";
import { reportGameSession } from "@/lib/gamekit/progress/session";
import type { GameKitGameId } from "@/lib/gamekit/types";
```

## Game Preservation Contract

以下使用者可見行為必須保留：

- `/games/car-adventure`
- `/games/block-drop`
- `/games/candy-match`
- `/games/candy-kart`
- 遊戲暫停、設定、兒童模式、音效、最佳分數、三星、星星、貼紙與完成回報。
- Candy Kart iframe 的 ready／finish postMessage 驗證。
- Car Adventure 的固定時間步進、關卡資料、觸控控制與像素渲染。
- Block Drop 的鍵盤／觸控操作、hold、難度與分數。
- Candy Match 的關卡、道具、提示、進度與結算。

以下穩定識別不可變更：

- `GameKitGameId` 值。
- localStorage key 與 progress schema。
- `GAMEKIT_PROGRESS_EVENT` 等跨元件事件名稱。
- 路由與 sitemap URL。
- 分數與 medal 計算語意。

## Obsolete Game Kit Removal

### Remove test-only or unimplemented architecture

在刪除前以 production symbol graph 與 Knip 交叉驗證。已盤點為候選的模組包括：

- `lib/game-kit/gameStateMachine.ts`
- `lib/gamekit/abilities.ts`
- `lib/gamekit/scene.ts`
- `lib/gamekit/pool.ts`
- `lib/gamekit/tiled-loader.ts`
- `lib/gamekit/tilemap.ts`
- `lib/gamekit/sprite-defs.ts`
- `lib/gamekit/sprite.ts`

以及只服務上述模組、無 production consumer 的 exports、types 與測試。

`assets.ts`、`procedural-sheets.ts`、`preload.ts` 等目前透過實際渲染鏈使用的模組不可因名稱帶有「Phase」或「placeholder」就直接刪除；需依 symbol-level consumer 證據逐一裁剪未使用 exports。

### Tests

- 刪除只驗證不存在架構本身的測試。
- 保留並更新可證明現行遊戲行為、progress schema、iframe bridge、economy 與 runtime 的測試。
- 不以降低 assertion 或 snapshot 更新掩蓋行為改變。

## Product Feature Cleanup

### Feature flags

刪除永遠關閉的 `goodnightButton` 與所有專屬 props、條件 UI 和測試。

已啟用且有真實 consumer 的功能不再需要 build-time flag 時，直接成為正式功能：

- night mode
- reflection prompt

`starterEpisodes` 對應 section 目前永久 disabled，因此連同 flag 與專屬資料／元件刪除，而不是改成開啟。

如果移除所有 flag 後 `lib/features.ts` 沒有 consumer，刪除整個 feature flag framework 與測試。

### Home sections

首頁 section schema 收斂為實際呈現的三個區塊：

- latest hero
- favorites
- story filter

刪除：

- `continue`
- `starter`
- `subscribeBand`
- `ContinueBanner`
- `StarterEpisodes`
- starter episode data 與專屬測試

收藏與繼續收聽的底層 progress 資料仍需保留；本次只刪除永久未渲染的首頁 Continue Banner。

### Content model

目前內容來源只有 Story，因此：

- 刪除 `CraftStep`、`Craft`、`Printable`、`Content`。
- 刪除 `getAllContent()`。
- 所有 consumer 改用 `getStories()`、`storiesByNewest()` 或其他明確 Story API。
- 保留 `Story` 與 Apple/manual story 合併流程。

### Deprecated APIs

刪除並遷移 consumer：

- `data/content.ts` 的 `stories` alias。
- `components/story-filtering.ts` 的 `filterStoriesForVehicle()`。
- `ThemeProvider` 的 `toggleTheme`。
- `lib/games/catalog.ts` 的舊 `id` 相容欄位；若無 consumer，刪除整個相容層。
- Knip 列出的其他無 consumer exports 與 exported types。

相容性例外：

- localStorage legacy migration。
- 舊故事 slug redirects。

這兩者服務既有使用者資料與外部連結，不能視為 dead code。

### Placeholder UI

刪除 `/games` 的「探索遊戲製作中」區塊與相關 CSS。頁面只呈現實際可玩的遊戲，不承諾不存在的內容。

刪除 `/studio` 中尚未實作的 API 同步與「官網轉換（預留）」說明：

- 保留真實可用的平台後台捷徑。
- 保留本機 engagement metrics。
- 若 `MetricsOverview` 只顯示不存在的 API 規劃，刪除元件、樣式、空資料與相關型別。

## Data Flow After Consolidation

```text
Game route
  → GamePageShell
  → game component
      ├─ gamekit/react hooks
      ├─ gamekit/runtime
      ├─ gamekit/progress
      └─ gamekit/games domain module
  → progress-store/localStorage
```

遊戲元件不再透過兩個 barrel 取得混合責任 API。每個 import 路徑直接表達它使用的是 React adapter、runtime、progress 或 game-specific domain。

## Error Handling and Migration

- 搬移模組時只改 import path 與必要內部相對引用，不同批次不混入玩法重寫。
- 每批搬移後跑相關測試與 TypeScript；失敗時回退該批，不一次移動整棵目錄後才除錯。
- localStorage migration code 保留，並以既有 migration tests 驗證。
- iframe postMessage schema 保留，並以 bridge tests 驗證。
- Next.js route、metadata route 與 Godot static assets 保留。
- `public/candy-kart/index.js`、audio worklet 與 service worker 是否為 runtime 入口，需透過 HTML／registration 實際引用確認，不能只依 Knip 的靜態判定刪除。

## Architecture Enforcement

新增 repository architecture test，至少檢查：

- 不存在 `lib/game-kit/`。
- 不存在 `lib/gamekit/index.ts`。
- source 不匯入 `@/lib/gamekit` 根目錄。
- source 不含已刪 feature symbols。
- source 不重新引入 `Craft`／`Printable` 預留模型。
- `lib/gamekit/` 保留檔案皆有 production consumer，或明確標註為 runtime entry。

## Verification

每批執行：

1. 相關 unit tests。
2. `npx tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false`
3. production symbol graph。
4. `npx knip`，只允許確認過的 framework／binary false positives。

完成後執行：

1. `npm test`
2. `npm run verify:episodes`
3. `npm run build`
4. `npm run test:e2e`
5. 四款遊戲 route smoke test。
6. localStorage migration tests。
7. Candy Kart iframe bridge tests。
8. `git diff --check`
9. 受保護素材與 Podcast metadata 路徑 diff audit。

## Documentation Updates

完成後同步：

- `README.md`：遊戲架構與實際功能。
- `DESIGN.md`：移除已不存在的 GamePixelBoard 描述。
- `TODOS.md`：將歷史 Phase 說明改為簡短歸檔，不再當現行架構文件。
- `CHANGELOG.md`：記錄架構收斂與未啟用功能移除。
- `docs/REPOSITORY-AUDIT.md`：更新清理結果與最終目錄。

## Non-goals

- 不新增第五款遊戲。
- 不改版四款遊戲 UI 或難度。
- 不升級 localStorage schema。
- 不重寫 `BlockDropGame`、`CarPlatformer`、`CandyMatchGame` 的玩法。
- 不刪除正式 Podcast、角色、Landing 或 Candy Kart 部署素材。
- 不刪除未合併 Git branches。
