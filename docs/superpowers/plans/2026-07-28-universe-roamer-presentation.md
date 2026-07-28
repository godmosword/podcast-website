# 宇宙地圖小車呈現 Implementation Plan

> **For agentic workers:** Inline execution（使用者指定不開 PR、直接 commit 實作）。TDD；每任務結束 commit。

**Goal:** 將 roamer 從閉合巡邏改為「靜態角色＋稀有過場」：遠景 1～2 idle／極少跨島，近景每島一台招牌 idle，點擊打招呼＋可選短 joyride。

**Architecture:** 資料層加 `idleSpot`／crossing／joyride 語意；`lib/universe/roamer-presentation.ts` 純函式做 LOD 與可見性；`useRoamerSim` 預設 idle、僅 crossing／joyride 時走 path；`MapRoamerLayer`／`IslandRoamerLayer` 接 `focusedZoneId`。

**Tech Stack:** Next.js 15、TypeScript strict、vitest、CSS Modules。

## Global Constraints

- 註解／文案 zh-TW；禁止 `any`
- 動畫僅 transform／opacity；`prefers-reduced-motion` 關閉位移過場
- 紅線：不动 `useMapCamera`／`ZoneSheet` 核心、zones 座標、zone-art-tile、地圖淺色
- 不做導覽用車；遠景最多 1～2；近景每島 1 台招牌
- 遠景池只含 `status === "open"` 島角色
- 品質閘門：`npm test`、`npm run build`、`npx tsc --noEmit`
- 不開 PR；commit 後可 push branch

## File Structure

| File | Role |
|------|------|
| `lib/universe/roamer-presentation.ts` | LOD／可見性／idle 判定純函式 |
| `lib/universe/roamer-presentation.test.ts` | 上述測試 |
| `data/universe-roamers.ts` | idleSpot、map idle、每島一台招牌、關巡邏 |
| `data/universe-roamers.test.ts` | 資料契約更新 |
| `components/universe/useRoamerSim.ts` | idle 定點；joyride／crossing 才 advance |
| `components/universe/useRoamerSim.test.ts` | idle／advance 契約 |
| `components/universe/MapRoamerLayer.tsx` | focusedZoneId LOD；rareCrossing |
| `components/universe/IslandRoamerLayer.tsx` | focused 才顯示；tapJoyride |
| `components/universe/RoamerVehicle.module.css` | idle 微晃（reduced 關） |
| `components/universe/UniverseMap.tsx`／`ZoneIsland.tsx` | 傳 `focusedZoneId`／`active` |
| `docs/UNIVERSE-ART-BIBLE.md` §12.8 | 移動時才面向 |
| `TODOS.md` | 完成標記＋hash |

---

### Task 1: LOD／可見性純函式

**Files:**
- Create: `lib/universe/roamer-presentation.ts`
- Create: `lib/universe/roamer-presentation.test.ts`

**Interfaces:**
- Produces:
  - `roamerLayer(roamer): "map" | "island"`
  - `selectMapRoamers(roamers, focusedZoneId, opts): Roamer[]` — 未聚焦時回傳最多 2 個 map 層 enabled（或 dev）；聚焦時 `[]`
  - `selectIslandRoamers(roamers, zoneId, focusedZoneId, opts): Roamer[]` — 僅 `focusedZoneId === zoneId` 時回傳該島最多 1 台招牌（`enabled` 優先序）
  - `MAX_MAP_ROAMERS = 2`

- [ ] **Step 1–4:** 先寫測再實作（見測試檔意圖：聚焦隱藏 map；近景每島 1；open 池）
- [ ] **Step 5:** Commit `feat(universe): roamer LOD 可見性純函式`

### Task 2: 資料語意（idleSpot、關巡邏、map idle）

**Files:**
- Modify: `data/universe-roamers.ts`
- Modify: `data/universe-roamers.test.ts`

**資料規則:**
- `Roamer` 新增可選 `idleSpot?: { x; y; facing?: RoamerDir; flip?: 1|-1 }`、`crossingRouteId?: string`、`joyrideRouteId?: string`
- 有 `idleSpot` ＝ prod 預設不巡邏
- 島內招牌：`car-park` 小紅、`dino` 只留阿酷（`roam-monster` `enabled: false`）
- 招牌位在 `ZONE_OCCLUDERS.baselineY` **前方**（y 更大）：car-park ≈ `(168, 230)`、dino ≈ `(132, 185)`（tile 本地）
- map 層新增 1 台 open 島角色 idle 在 `car-park-dino` 的 `fromPort` 附近；`crossingRouteId: "map-bridge-car-park-dino"`
- 島內 walkway path **保留**作 `joyrideRouteId`／dev，不再當 prod 巡邏指派
- 更新測試：不再要求「小紅走步道巡邏」；改要求 idleSpot＋招牌一台

- [ ] Commit `feat(universe): roamer 資料改 idleSpot／每島一台招牌`

### Task 3: useRoamerSim 支援 idle

**Files:**
- Modify: `components/universe/useRoamerSim.ts`
- Modify: `components/universe/useRoamerSim.test.ts`
- Modify: `components/universe/RoamerVehicle.module.css`（`[data-idle]` 微晃）

**行為:**
- sim 增 `drive: "idle" | "joyride" | "crossing"`
- `idle`：`ground`＝`idleSpot`；不 `advanceDistance`；facing／flip 用 spot；bob 僅 CSS（sim bob=0）或極輕
- `reduced`：完全靜止
- 匯出 `startJoyride(id)`／`startCrossing(id, routeId)`（實作 Task 4/5 接）
- 無 `idleSpot` 且有 route → 維持舊 path 行為（dev 相容）

- [ ] Commit `feat(universe): useRoamerSim 預設 idle、移動才走 path`

### Task 4: 層接 LOD＋點擊 greeting（關巡邏）

**Files:**
- Modify: `MapRoamerLayer.tsx`、`IslandRoamerLayer.tsx`、`UniverseMap.tsx`、`ZoneIsland.tsx`

**行為:**
- `UniverseMap` 傳 `focusedZoneId={activeZoneId}` 給 `MapRoamerLayer`；`ZoneIsland` 已有 `active` → 傳給 `IslandRoamerLayer`
- 用 `selectMapRoamers`／`selectIslandRoamers`
- 點擊仍喇叭＋greeting；有 joyride 且 !reduced 時 `startJoyride`

- [ ] Commit `feat(universe): roamer 層接 LOD，關掉 prod 巡邏`

### Task 5: rareCrossing（遠景）

**Files:**
- Modify: `MapRoamerLayer.tsx`、必要時 `useRoamerSim.ts`

**行為:**
- 未聚焦、!reduced、!paused：每 `minIntervalMs`（如 45000）最多一台沿 `crossingRouteId` 過橋，結束回 idleSpot
- 同時最多一台 crossing

- [ ] Commit `feat(universe): map roamer 稀有跨島過場`

### Task 6: 文件／TODOS＋品質閘門

- 更新 Art Bible §12.8 一句；TODOS 完成標記
- `npm test`、`npx tsc --noEmit`、`npm run build`
- Commit `docs(universe): Art Bible／TODOS 對齊小車呈現定版`

---

## Spec coverage

| Spec | Task |
|------|------|
| idleSpot / rareCrossing / tapJoyride | 2, 3, 5, 4 |
| LOD 遠/近 | 1, 4 |
| 不做導覽／關巡邏 | 2, 4 |
| reduced-motion | 3, 5 |
| Art Bible / TODOS | 6 |
