# 宇宙地圖小車呈現定版設計（2026-07-28）

## Goal

宇宙地圖架構已定版；本 spec 只重新定義 **小車（roamer）呈現語意**，解決：

1. 閉合步道繞圈像巡邏，不像樂園裡的角色。
2. 遠看太搶戲／太吵；近看不夠像可互動的角色展示。
3. 島內步道 vs 跨島橋的定位不清。

小車的工作是：**氣氛（樂園是活的）＋小互動（點車）＋角色辨識**。  
**不是**導覽箭頭（不負責引導點島／開 `ZoneSheet`）。

## Decisions（已確認）

| 題目 | 決策 |
|---|---|
| 小車工作 | 氣氛 A ＋ 小互動 C ＋ 角色展示 D（不做導覽 B） |
| 出現位置 | 依縮放 LOD：遠看橋／岸 1～2 台；放大島後見島內招牌車 |
| 遠景動作 | 幾乎靜止 idle ＋ 極偶爾跨島過橋（B＋D） |
| 近景動作 | 定點 idle；點了才短暫動一下（D） |
| 實作路線 | 方案 1「靜態角色＋稀有過場」（非事件導演大重寫、非沿用巡邏改編舞） |

## Current State（現況）

- 資料：`data/universe-roamers.ts`（島內 walkway path、`ZONE_OCCLUDERS`、bridge map routes）
- 引擎：`components/universe/useRoamerSim.ts`（path 取樣、front/rear、bob／bank）
- 層：`MapRoamerLayer`（map／橋）、`IslandRoamerLayer`（島內）
- UI：`RoamerVehicle` 點擊 → 喇叭＋打招呼泡泡；`trackUniverseRoamerTap`
- Prod：主島小紅／恐龍島兩台走閉合步道；map 層無指派 roamer（橋線僅 `?devRoamers=1`）
- 美術契約：`docs/UNIVERSE-ART-BIBLE.md` §12.8、§13

## Presentation Model

### 三種模式

| 模式 | 用途 | 移動 |
|---|---|---|
| `idleSpot` | 遠景定點／近景招牌位 | 微幅 idle（transform／opacity）；不走連續 path 迴圈 |
| `rareCrossing` | 遠景稀有跨島 | 沿既有 bridge `d` 從 A→B；結束回 idleSpot |
| `tapJoyride` | 近景點擊回饋 | 短行程移動後回原位；沿用喇叭＋greeting |

### LOD

- **遠景（未聚焦島）：** 只渲染 map 層；同時最多 **1～2** 個可見角色；預設 `idleSpot`（橋頭／岸邊）；`rareCrossing` 間隔長、同時最多一台在動。
- **近景（已 fly-to／聚焦某島）：** 隱藏 map 層移動中的車；該島顯示 **一台** 招牌車於地標前固定位（`idleSpot`）；點擊觸發 `tapJoyride`（可選）。
- LOD 邊界優先接現有鏡頭語意（`bucketMapScale`、是否聚焦 zone），**不改** `useMapCamera` 核心。

### 互動

- 點車：真正 `<button>`＋`aria-label`；喇叭＋「嗨！我是{角色}！」；可接短 `tapJoyride`。
- 不做：用車引導點島、海面多車同時繞、prod 閉合步道巡邏圈。

## Architecture

### 分層（維持既有，改語意）

```
data/universe-roamers.ts
  → idleSpot / rareCrossing / tapJoyride 資料
components/universe/MapRoamerLayer.tsx     # 遠景
components/universe/IslandRoamerLayer.tsx  # 近景
components/universe/useRoamerSim.ts        # 僅 driving（crossing / joyride）
components/universe/RoamerVehicle.tsx      # sprite + tap + greeting（沿用）
```

### `useRoamerSim` 邊界

- **保留**給真的在路徑上移動的幀（crossing／joyride）：朝向遲滯、shadow、depth、（島內可選短程 bank）。
- **idle** 不跑連續 path 迴圈；微動用 CSS／極輕量 rAF，受 reduced-motion 控管。
- map 層繼續關 bob／bank（少搶戲）；與現況 `0f44f7c` 精神一致。

### 紅線（本輪禁止）

- `useMapCamera`／`ZoneSheet` 核心互動邏輯
- zones 座標、zone-art-tile 契約
- 地圖場景色（印刷地圖固定淺色、日夜不反轉海圖／島 tile）
- Apple sync workflow／`scripts/sync-apple-podcast.ts`
- 新產一整批角色圖、改橋／島美術

## Motion / A11y / Perf

- 動畫只用 `transform`／`opacity`（含既有 path 位移的 transform 寫入）。
- `prefers-reduced-motion`：關閉 `rareCrossing` 與 `tapJoyride` 位移；保留靜態角色＋點擊打招呼（可選極短 opacity，不用位移）。
- 分頁隱藏、地圖離屏、`isInteracting`：暫停移動與非必要動畫（沿用 `UniverseMap` 的 `paused`）。
- 裝飾陰影／純視覺 idle：`aria-hidden`；不靠顏色 alone 傳達狀態。

## Data Sketch（實作時對齊，非最終 API）

```ts
type RoamerPresentation =
  | { mode: "idleSpot"; spot: { x: number; y: number }; facing?: RoamerDir }
  | { mode: "rareCrossing"; bridgeRouteId: string; minIntervalMs: number }
  | { mode: "tapJoyride"; path: string; durationMs: number };
```

- 島內招牌位：每座 open／可見島最多一台 `enabled` 招牌車。
- 遠景角色池：從已開放（open）島角色抽 1～2；building／coming 島角色不進遠景池（避免未開放劇透）。
- 既有 `ROAMER_ROUTES` bridge path **重用**於 `rareCrossing`；島內閉合 `CAR_PARK_WALKWAY_PATH` 等 **不再作為 prod 巡邏**（可留 dev 或改短 joyride path）。

## Art Bible 對齊

- §12.8「會面向行進方向的 2.5D unit」→ **移動時**才依切線選 front／rear／鏡像；`idleSpot` 用預設 facing。
- §13 `mapDepthZ`／bridge／roamer band 不變；crossing 期間仍走 roamer band。
- `ZONE_OCCLUDERS`：joyride 若短程鑽地標後方可沿用；idle 招牌位應放在 baseline 前方可讀區。

## Testing

- **單元：** LOD 可見性；idle／crossing／joyride 狀態轉換；reduced-motion 關閉位移；同時最多 1～2（遠景）／每島 1（近景）。
- **既有測試：** 更新假設「閉合巡邏／連續 path」的契約（`useRoamerSim`、`IslandRoamerLayer`、`MapRoamerLayer`、相關 e2e）。
- **e2e：** 遠景不連續繞圈；點車有打招呼；reduced-motion 下仍可點且無位移過場。
- 品質閘門：`npm test`、`npm run build`、`npx tsc --noEmit`（實作 PR 必跑）。

## Out of Scope

- 導覽／教學用車、多車編隊、海面航線巡邏
- 新角色產圖管線大改（沿用現有 roamers PNG／WebP）
- 相機、sheet、島座標、tile 契約重構
- 把方案升級成完整「事件導演」佇列（方案 2）— 若日後 rareCrossing 規則變複雜再評估

## Rollout

1. 本 spec 審查通過 → 另開 implementation plan（`writing-plans`）。
2. 實作 PR：先資料語意＋LOD＋關巡邏；再接 rareCrossing；最後 tapJoyride polish。
3. 實作完成後同步更新 `docs/UNIVERSE-ART-BIBLE.md` §12.8 一句話（移動時才面向），並在 `TODOS.md` 標記。

## Success Criteria

- 遠看：樂園有生命感，但不像多台車巡邏。
- 近看：能認出角色；點一下有可愛回饋。
- 兒童／家長都不會把車誤當成「下一步該點哪裡」的導覽。
- reduced-motion 與效能契約不退步。
