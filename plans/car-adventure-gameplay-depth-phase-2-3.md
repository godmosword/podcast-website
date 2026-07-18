# Blueprint — 車車大冒險 遊戲性與時長升級（Phase 2/3）

> 產出者：blueprint skill（Leader＝Claude Code Fable 5）。日期 2026-07-18。
> 上游 Approved Plan：`/tmp/agent-plan-1784342234.md`（任務2）。Phase 1（render 靜態視覺）已完成落地。
> 本 blueprint 只規劃**多階段、多 PR** 施工；每步自足，冷啟動可執行。

## 目標

- **Phase 2（遊戲性）**：可破壞磚 `breakable`、移動平台、新敵人種類、關卡三星評分（金幣% / 時間 / 無傷）。
- **Phase 3（能力／時長）**：能力門 `abilityGates`、車輛能力（跳更高／衝刺／破磚）、祕密區 `secrets`、新增關卡或新世界。
- **硬約束**：不破壞 GameKit progress／Candy Kart bridge 相容性契約。

## 現況事實（Research 已確認，執行者可信賴）

- 範圍：`lib/games/car-adventure/`（`types.ts` 常數＋GameState、`physics.ts` 迴圈、`render.ts` 繪圖、`levels.ts` 6 關程序生成）、`lib/gamekit/games/adventure-level.ts`（JSON 型別＋`levelFromJson`）、`components/games/car-adventure/`（React 殼、canvas、menu）。
- **`levelFromJson` 尚未把 `breakable`／`abilityGates`／`secrets` 帶入 runtime `AdventureLevel`**（目前僅 JSON 型別存在；`spikes`/`coins`/`enemies`/`finish` 有帶入）。無 `movingPlatforms` 型別。
- **`GameSessionResult`（`lib/gamekit/progress/session.ts`）已含 `flawless?` 與 `collectedAll?` 欄位**——三星的「無傷」「金幣全收」可直接沿用，**只有「時間星」是新語意**。
- 進度存檔 `SAVE_VERSION=3`（`lib/gamekit/progress/save.ts`），有 v1→v2→v3 migration；medal 為 bit flags（`meta.ts` `medalFlags`/`medalCount`）；economy/stars/stickers/garage/vehicles 解鎖已存在。
- Candy Kart 為 Godot 匯出（`public/candy-kart/index.*`）＋ `candy-kart-game/scripts/bridge.gd` ↔ `lib/gamekit/games/candy-kart-bridge.ts`（已有 `candy-kart-bridge.test.ts`）。
- 物理已有 juice：coin/stomp 噴粒子、shake、hitstop；canvas 迴圈在 `reduced` 時完全跳過 shake/粒子（CRITICAL-2 底層已具備）。
- `GameState` 目前**無時間／時鐘欄位**（僅 cam/prevPlayer/renderAlpha）——時間星需新增 `elapsed`。

## 全域不變量（Invariants，每步 PR 後必驗）

1. `npm test` 全綠（含 `physics.test.ts`、`adventure-level.test.ts`、`candy-kart-*`、`progress.test.ts`、`economy.test.ts`）。
2. `npm run lint`、`npm run build` 綠。
3. **GameKit 契約不破**：`GameSessionResult` 既有欄位語意不變；`SAVE_VERSION` 只增不改既有欄位；medal bit flags 不重定義；Candy Kart bridge 欄位雙向一致；`public/candy-kart` 匯出產物不動。
4. **DESIGN.md 紅線**：任何會動的視覺（粒子/移動平台動畫）須 `prefers-reduced-motion` 降級；觸控 ≥44px（兒童 48px）；前景（玩家/金幣/尖刺/敵人）對比不被背景壓低；60fps（粒子上限）。
5. 對外介面／既有 6 關可玩性不回歸；舊存檔（v3）載入不崩、分數/獎牌不遺失。

## 已定案設計決策（審後鎖定，執行者不得重議 C1/C2/H3）

- **D1｜時間星＝display-only，不進 medal/經濟系統（解 C1）**：`meta.ts` 的 `medalFlags` 為 **3-bit 飽和**（cleared=1/flawless=2/collectedAll=4），`session.ts` 授星迴圈 `bit<=4` 每 bit 授 1 顆經濟星並驅動 `vehiclesUnlockedAt` 解鎖與 `checkBonusStickers`。**嚴禁**把「時間達標」加成第 4 個 medal bit（會位移車輛解鎖門檻、漂移 medal-master 語意，違反不變量 3）。時間星只走**獨立顯示層**，不呼叫 `recordMedal`、不授經濟星、不改 `medalFlags`/`medalCount`/授星迴圈。
- **D2｜三星傳遞與持久化路徑（解 C2）**：三星於 client 結算——★金幣＝`taken>=total`（沿用 `collectedAll` 語意）、★無傷＝`lives===本關起始 lives`（沿用 `flawless` 語意）、★時間＝`elapsed<=targetTime`（**新，純 car-adventure 本地**）。持久化每關最佳星數走**獨立** `profile.adventureStars: Record<levelIndex, 0..3>`（save v3→v4，僅新增預設 `{}`，不改既有欄位），由 car-adventure 專用 setter 寫入，**不經 `GameSessionResult`/medal 路徑**。`GameSessionResult` 既有欄位形狀**不變**（不新增 `withinTime`）。若團隊選擇不跨 session 保存 → 跳過 v4，只單次結算顯示（見 S5 mutation）。
- **D3｜車輛能力來源＝A（關卡臨時賦予），不碰 garage（解 H3 決策）**：能力當關生效（`GameState.abilities`），**不**綁 `garage`/`vehiclesUnlockedAt`/progress，避免碰進度契約。garage 綁定（B 案）本 blueprint 不採。
- **D4｜breakable 預設破壞條件（解 M3）**：預設「由下往上頭頂撞碎」即可，**不需**能力；S6a 的破磚能力為**額外**破壞途徑（如水平衝刺破磚），**不改** S2 既有頭頂撞碎分支。

## 工作流

git + gh 可用 → **full branch/PR/CI 模式**。每步一分支一 PR：分支 `feat/car-adv-<step-slug>`，PR 標題見各步；CI（`npm run check` 對應）綠才可 merge；預設不自動 merge，交使用者。base = `main`。

---

## 依賴圖與並行（單一序列鏈，審後修正 H1/M5）

```
S0 契約鎖定(gate) ─> S1 runtime plumbing ─> S2 breakable ─> S3 moving-platform ─> S4 enemy-variety
   ─> S5 three-star(display-only) ─> S6a 能力引擎 ─> S6b 能力 UI/觸控 ─> S7 secrets ─> S8 new-levels ─> S9 e2e+perf
```

- **序列主因**：S2/S3/S4/S5/S6a/S6b/S7/S8 皆改 `physics.ts` 與／或 `render.ts`（共用檔）→ **嚴格單一序列，不得並行**（Domain 紅線：禁多路徑同改一檔）。**declared depends 必等於序列前一步**，執行者不得因「圖上像分岔」而提前開下一步。
- **無真並行窗口**：本專案唯一改檔者為 Leader（Claude Code group），逐 PR 序列即可；共用檔的並行只會製造 rebase 衝突。
- **S5 位置**：排在 S4 後、S6a 前（S2..S4 機制到位才有無傷/時間可驗；S5 為 display-only 不碰 medal，先於能力系統落地）。
- **S8 依賴**：需 S5 的 `targetTime` 概念 → depends=S7（且用到 S2..S7 全機制）。
- S0 是所有觸及 progress 的步驟（S5/S6a）的前置閘門。

---

## Step 0 — GameKit 契約鎖定測試（安全網，先於任何改動）

- **分支/PR**：`feat/car-adv-contract-lock` → PR「test(gamekit): 鎖定 progress/bridge 契約供 car-adventure 擴充」
- **模型層**：strongest（Opus）——契約正確性關鍵。
- **依賴**：無（最先做）。
- **Context brief**：後續 S5 會碰存檔（新增 adventureStars／v4）、S6a 雖依 D3 不碰 garage 但仍需保證未誤觸；先加 characterization 測試把現況鎖死，任何非預期契約漂移即紅。
- **Task**：
  1. `lib/gamekit/progress/save.test.ts`（新增或擴充）：v3 存檔 fixture round-trip；v1→v3、v2→v3 migration 快照；未知欄位不丟失。
  2. `session.test.ts`：`GameSessionResult` 欄位形狀快照（含 `flawless`/`collectedAll`/`levelIndex`/`cleared`）；`reportGameSession` 對 car-adventure 的 medal/star 副作用快照。**加 per-game 語意斷言（解 H2）**：對固定輸入的 car-adventure 結算，斷言 `flawless===(lives===startLives)`、`collectedAll===(taken>=total)`——純 shape 快照抓不到語意漂移（`candy-kart-bridge` 對 flawless 的語意是「時間達標」，與 car-adventure「無傷」不同，見 bridge.ts:86）。
  3. `meta.test.ts`：medal bit flags 值（cleared=1/flawless=2/collectedAll=4，**3-bit 飽和**）與 `medalCount` 對照鎖定；斷言授星迴圈上界 `bit<=4` 未變（守 D1）。
  4. `candy-kart-bridge.test.ts`：TS bridge 欄位集合 ↔ `candy-kart-game/scripts/bridge.gd` 欄位**雙向 parity（解 M4）**：分別取 TS 欄位集合與 `.gd` 欄位集合，assert 兩集合**互為子集**（任一側缺漏/多出即紅），不只單向 substring 存在。
  5. `public/candy-kart` 匯出 smoke：assert 關鍵檔（`index.html/js/wasm/pck`）存在且非空（不重建 Godot）。
- **驗證**：`npm test`（新測試綠且能捕捉刻意破壞——PR 描述附一次「故意改壞→紅」證明）。
- **Exit**：上述 5 類測試存在並綠；`npm run lint` 綠。
- **Rollback**：純新增測試檔，revert 該 PR 即可。

---

## Step 1 — `levelFromJson` runtime plumbing（把新欄位帶入執行期）

- **分支/PR**：`feat/car-adv-level-runtime` → PR「feat(car-adventure): levelFromJson 帶入 breakable/movingPlatforms/abilityGates/secrets」
- **模型層**：default。
- **依賴**：S0。
- **Context brief**：目前 `AdventureLevel` runtime 缺這些集合；先讓資料在 runtime 可用（**行為不變**，僅備妥資料），機制步驟才能各自獨立。
- **Task**：
  1. `adventure-level.ts`：`AdventureLevel` 新增 `breakable: Set<string>`、`secrets: Set<string>`、`abilityGates: {x,y,ability}[]`、`movingPlatforms`（新 JSON 型別：`{x,y,w,dx?,dy?,range?,speed?}`）。
  2. `levelFromJson`：map 上述欄位（缺省 → 空 Set/空陣列，**向後相容**）。
  3. `adventure-level.test.ts`：新增映射測試（含缺省為空）。
- **驗證**：`npm test`；既有 6 關 `levelFromJson` **既有欄位與行為不變、新欄位預設空**（解 M1：物件快照會因新欄位而變，須更新快照；驗的是「既有欄位值不變＋新欄位為空集合」，非整物件快照相等）。
- **Exit**：runtime 型別齊備、預設空、既有關卡零行為差異。
- **Rollback**：revert PR；下游步驟未開始前無耦合。

---

## Step 2 — 可破壞磚 `breakable`（Phase 2 機制①）

- **分支/PR**：`feat/car-adv-breakable` → PR「feat(car-adventure): 可破壞磚（撞碎＋粒子＋加分）」
- **模型層**：default。
- **依賴**：S1。
- **Context brief**：`breakable` tile 玩家可撞碎。**破壞條件依 D4：預設「由下往上頭頂撞碎」，不需能力**（S6a 的破磚能力為額外途徑，不改本步分支）。撞碎→移出 solid/breakable set、噴碎屑粒子（`juice.burst`，reduced 已閘門）、加分/可能藏金幣。
- **Task**：
  1. `physics.ts`：碰撞時偵測 `breakable`；命中條件下移除該格、`fx.juice.burst`（reduced 由 canvas 層閘門，spawn 前仍以 `!fx.reduced` 包）、加分。**不得改既有 solid/spike/coin 判定路徑的既有分支**。
  2. `render.ts`：`breakable` tile 畫成可辨識的「裂紋磚」（與 solid 區隔）。
  3. `types.ts`：GameState 若需記錄已碎格 → 加 `broken: Set<string>`（每關 reset 清空）。
  4. `levels.ts`：於 1–2 關放置 `breakable`（含藏金幣示範）。
  5. `physics.test.ts`：撞碎/未碎、加分、reset 清空。
- **驗證**：`npm test`、`npm run build`；手動試玩撞碎行為；reduced-motion 下無粒子。
- **Exit**：可破壞磚可玩、既有機制零回歸、粒子守 reduced。
- **Rollback**：revert PR（levels 內 breakable 一併移除）。

---

## Step 3 — 移動平台（Phase 2 機制②）

- **分支/PR**：`feat/car-adv-moving-platform` → PR「feat(car-adventure): 移動平台（承載玩家＋reduced 降級）」
- **模型層**：default。
- **依賴**：S2（共用 `physics.ts`，序列）。
- **Context brief**：水平/垂直往復移動的實心平台；玩家站上隨之位移；`reduced` 時平台**靜止於起點**（或極慢）以守動效紅線。
- **Task**：
  1. `types.ts`：runtime moving platform 實體（pos、range、speed、phase）。
  2. `physics.ts`：平台更新（`reduced` → 不移動）；玩家踩踏承載（delta 疊加到玩家 x/y）；下方/側向碰撞。
  3. `render.ts`：畫平台（黏土風）。
  4. `levels.ts`：1–2 關示範。
  5. `physics.test.ts`：承載位移、reduced 靜止、掉落判定。
- **驗證**：`npm test`、`npm run build`；**新增資料層斷言（解 M2）**：含移動平台的關卡，在平台**靜止於起點**（reduced）時仍存在「連續可站的通關路徑」——以測試檢查該關 reduced 佈局的可達性（平台起點位置本身即為可站點，或該關另有地面替代路徑），不靠人工目檢。
- **Exit**：移動平台可玩、reduced 可通關（有自動化斷言）、零回歸。
- **Rollback**：revert PR。

> ⚠ **reduced 可玩性風險**：移動平台是唯一路徑時，reduced 靜止會卡關。設計要求：含移動平台的關卡在 reduced 下仍須可通（靜止位置即為可站點，或提供地面替代）。此為 S3 exit 硬條件。

---

## Step 4 — 新敵人種類（Phase 2 機制③）

- **分支/PR**：`feat/car-adv-enemy-variety` → PR「feat(car-adventure): 新增敵人種類（例：跳躍車／飛行障礙）」
- **模型層**：default。
- **依賴**：S3（共用 `physics.ts`，序列）。
- **Context brief**：既有敵人＝水平巡邏可踩踏。新增 1–2 型（如「跳躍搗蛋車」定點彈跳、或「飄浮氣球」不可踩需閃避），沿用 `enemies` JSON 加 `kind`。
- **Task**：
  1. `adventure-level.ts`/`types.ts`：`enemies` 加 `kind`；runtime 敵人加行為欄位。
  2. `physics.ts`：各 `kind` 的移動與碰撞（可踩/不可踩）；不可踩者觸碰＝受傷。
  3. `render.ts`：各 `kind` 造型區隔（可踩 vs 危險一眼可辨——設計對比紅線）。
  4. `levels.ts`：適度放置。
  5. `physics.test.ts`：各 kind 行為、踩踏/受傷。
- **驗證**：`npm test`、`npm run build`；手動試玩；危險敵人辨識度目檢。
- **Exit**：新敵人可玩、可踩/危險視覺可辨、零回歸。
- **Rollback**：revert PR。

---

## Step 5 — 關卡三星評分（display-only，Phase 2 機制④）

- **分支/PR**：`feat/car-adv-three-star` → PR「feat(car-adventure): 關卡三星（金幣%／時間／無傷，display-only）」
- **模型層**：strongest（Opus）——碰存檔（新增 adventureStars 欄位）。
- **依賴**：S0（契約網）＋ S4（序列前一步；需機制產生無傷/時間情境）。
- **Context brief**：**嚴格依 D1/D2**。三星 client 結算：★金幣＝`taken>=total`、★無傷＝`lives===本關起始 lives`、★時間＝`elapsed<=targetTime`。**時間星不進 medal/經濟（D1）**：不呼叫 `recordMedal`、不改 `medalFlags`/授星迴圈。持久化走**獨立** `profile.adventureStars`（D2），**不動** `GameSessionResult` 形狀。
- **Task**：
  1. `types.ts`：GameState 加 `elapsed`（playing 累加，reset 歸零）；`levels.ts` 每關加 `targetTime`。
  2. `physics.ts`：累加 `elapsed`；完成時算 0–3 星（三條件如上）。**既有 `reportGameSession` 呼叫與參數不變**（S0 語意斷言須續綠）。
  3. **持久化（D2）**：`save.ts` `SAVE_VERSION` 3→4，`migrateV3ToV4` 僅新增 `adventureStars: {}` 預設（不改既有欄位）；新增 car-adventure 專用 setter `recordAdventureStars(levelIndex, stars)`（取 max，寫 `profile.adventureStars`），**不經 medal/economy 路徑**。
  4. `CarAdventureMenu`：關卡選單顯示各關已得星數。
  5. 測試：三星計算三條件、`recordAdventureStars` 取 max、**v3→v4 migration round-trip 且 medal/economy/既有欄位零變動**、舊 v3 存檔載入補 `adventureStars:{}` 不崩。
- **驗證**：`npm test`（S0 shape 快照＋語意斷言仍綠——證明 `GameSessionResult`／medal 未被動到）、`build`；舊 v3 存檔載入不崩。
- **Exit**：三星可得可顯示、`adventureStars` 獨立持久化、**medal/經濟/車輛解鎖零漂移**、存檔向後相容。
- **Rollback**：revert PR。v4 為純加欄位（v3→v4 僅補預設空），revert 後 v4 存檔多出的 `adventureStars` 對 v3 程式為無害未知欄位（`save.ts:40` `...profile` 保留）。

> ⚠ **mutation 選項**：若團隊決定三星不跨 session 保存，跳過 task 3 的 v4 migration，只在完成畫面單次顯示；此時完全不碰 `save.ts`，風險更低。決策記入審計表。

---

## Step 6a — 能力引擎 ＋ 能力門 `abilityGates`（Phase 3，純 car-adventure）

- **分支/PR**：`feat/car-adv-ability-engine` → PR「feat(car-adventure): 車輛能力引擎（跳更高/衝刺/破磚）＋能力門判定」
- **模型層**：strongest（Opus）——跨機制耦合。
- **依賴**：S5（序列前一步）。
- **Context brief**：**能力來源＝D3（關卡臨時賦予，不碰 garage/progress）**。能力＝跳更高/衝刺/破磚，`GameState.abilities` 當關生效；`abilityGates`（S1 已帶入 runtime）需對應能力才可通過。破磚能力為 S2 breakable 的**額外**破壞途徑（D4，不改頭頂撞碎分支）。
- **Task**：
  1. `types.ts`：`GameState.abilities`（當關集合，reset 依關卡設定）。
  2. `physics.ts`：跳更高（改跳躍初速當 ability 生效）、衝刺（輸入映射）、破磚（衝刺撞 breakable）；`abilityGates` 通過/擋下判定。**不碰 garage/`vehiclesUnlockedAt`/progress**。
  3. `render.ts`：能力門與能力生效狀態視覺提示（可辨識）。
  4. `levels.ts`：示範 abilityGates ＋當關 abilities。
  5. `physics.test.ts`：各能力效果、門判定（有/無能力）、破磚串接。
- **驗證**：`npm test`、`build`；無新觸控鍵時沿用既有輸入。
- **Exit**：能力與能力門可玩、**progress 契約零觸碰**、既有機制零回歸。
- **Rollback**：revert PR。

---

## Step 6b — 能力 UI／觸控／教學（Phase 3）

- **分支/PR**：`feat/car-adv-ability-ui` → PR「feat(car-adventure): 衝刺鍵觸控/手把＋能力教學」
- **模型層**：default。
- **依賴**：S6a。
- **Context brief**：S6a 若引入需新輸入的能力（如衝刺鍵），補觸控/手把/教學 UI（與物理拆開，守 mutation 協議「單步 ≤4 檔」）。
- **Task**：
  1. `CarAdventureGame.tsx`/`lib/gamekit/react/TouchControls`：衝刺鍵，觸控 ≥44px（兒童 48px）、不遮既有命中區、手把映射。
  2. `data/games.ts`：tutorial 步驟補能力操作（**繁中**；非 Domain Protected 中文校對範圍，但守繁中一致）。
  3. 測試：觸控鍵存在、輸入映射。
- **驗證**：`npm test`、`build`；觸控/手把試玩；教學正確可讀。
- **Exit**：能力操作可用、觸控合規、教學到位。
- **Rollback**：revert PR。

---

## Step 7 — 祕密區 `secrets`（Phase 3）

- **分支/PR**：`feat/car-adv-secrets` → PR「feat(car-adventure): 祕密區（進入揭示＋獎勵）」
- **模型層**：default。
- **依賴**：S6b（序列前一步，過 physics.ts/render.ts）。
- **Context brief**：`secrets` 格為隱藏獎勵區（額外金幣/星），玩家進入範圍時揭示（前景遮罩淡出，reduced 直接顯示）。
- **Task**：
  1. `physics.ts`：進入 secret 區偵測、給獎勵（加分/金幣）。
  2. `render.ts`：未觸發時遮蓋、觸發後揭示；`reduced` 不做淡出動畫直接顯示。
  3. `levels.ts`：放置 secrets。
  4. 測試：進入觸發、獎勵一次性。
- **驗證**：`npm test`、`build`；reduced 下無動畫但可獲獎。
- **Exit**：祕密區可玩、reduced 合規。
- **Rollback**：revert PR。

---

## Step 8 — 新增關卡／新世界（Phase 3，時長）

- **分支/PR**：`feat/car-adv-new-levels` → PR「feat(car-adventure): 新增關卡運用新機制（延長遊戲時長）」
- **模型層**：default。
- **依賴**：S7（序列前一步；用到 S2..S7 全機制，含 S5 的 `targetTime`）。
- **Context brief**：新增 2+ 關或一個新世界主題，綜合運用 breakable/移動平台/新敵人/能力門/secrets，並為新關設 `targetTime`（S5）；`WORLD_THEMES` 對應新增主題配色（沿用 Phase 1 glow 欄位）。
- **Task**：
  1. `levels.ts`：新關卡程序生成資料（cols/solid/coins/enemies/breakable/movingPlatforms/abilityGates/secrets/targetTime）。
  2. `render.ts`：`WORLD_THEMES` 補對應主題（含 `glow`）。
  3. `types.ts`/HUD：關卡總數 `CAR_ADVENTURE_LEVELS.length` 自動反映；進度條/選單相容。
  4. 測試：新關 `levelFromJson` 有效、可通關路徑存在（含 reduced 可通）。
- **驗證**：`npm test`、`build`；每新關手動通關；reduced 可通。
- **Exit**：新關可玩可通、主題視覺一致、時長提升。
- **Rollback**：revert PR（僅資料/主題新增）。

---

## Step 9 — E2E ＋ 效能冒煙（收尾）

- **分支/PR**：`feat/car-adv-e2e-perf` → PR「test(car-adventure): e2e 通關/重試/進度/手機輸入＋效能預算」
- **模型層**：default。
- **依賴**：S8（序列最後一步）。
- **Context brief**：Codex 工程審指出既有 e2e 未覆蓋 car-adventure 關鍵流程；補冒煙並設效能預算。
- **Task**：
  1. `e2e/`：Playwright — 開始/通關一關、死亡重試、關卡切換、進度保存、觸控輸入（coarse pointer）。
  2. 效能：粒子數上限 assert（單元）＋ e2e 期間無明顯掉幀的可量測 proxy（或記錄手動 60fps 驗收基準於 PR）。
- **驗證**：`npm run test:e2e`、`npm test`、`npm run check`。
- **Exit**：關鍵流程 e2e 綠、效能預算有依據（非僅目檢）。
- **Rollback**：revert PR（純測試）。

---

## Plan 變異協議（mutation）

- **拆分**：某步 diff 過大（>~300 行或跨 >4 檔）→ 拆子步，沿用分支前綴＋`-a/-b`。
- **插入**：發現漏依賴 → 插入新步並更新依賴圖與本表；PR 描述註明插入原因。
- **跳過**：S5 若定案「不持久化三星」則跳過 v4 migration 子任務（記錄決策）。
- **重排**：本鏈為嚴格序列（共用 physics.ts/render.ts）；不建議重排。若確需（如 S7 secrets 先於 S6 能力），須整體更新依賴圖與各步 declared depends，保持「每步 depends＝序列前一步」。
- **放棄**：任一步經審不值得（如新敵人與既有重疊）→ 標放棄並記錄，不留半成品。
- 每次變異在本檔 append 一列審計（日期／步驟／動作／原因）。

## 審計紀錄

| 日期 | 步驟 | 動作 | 原因 |
|------|------|------|------|
| 2026-07-18 | — | 建立 blueprint | Phase 1 已落地，Phase 2/3 需多 PR 拆解 |
| 2026-07-18 | S0/S1/S3/S5/S6 | 審後修正 | Opus 對抗審：C1 時間星撞 3-bit 獎牌契約→D1 display-only；C2 傳遞路徑未定→D2 獨立 adventureStars；H1 依賴矛盾→單一序列鏈；H2 S0 加語意斷言；H3 S6 拆 6a/6b＋鎖能力來源 A；M1–M5 逐項修 |
| 2026-07-18 | S0 | **完成** | 契約鎖定測試落地：`lib/gamekit/progress/contract-lock.test.ts`（8）＋`candy-kart-bridge.test.ts` 擴充（parity/shape/export smoke）。全套 730 測試綠、lint 綠；已實證「meta.ts 加第 4 bit → contract-lock 轉紅」捕捉 C1 漂移。未 commit（Ship 政策）。 |
| 2026-07-18 | S1 | **完成** | `adventure-level.ts`：`AdventureLevel` runtime 帶入 `breakable`/`secrets`（Set）＋`abilityGates`／`movingPlatforms`（pixel，含 x0/y0 起點）；`levelFromJson` tile→pixel 映射、缺省空；新 JSON `movingPlatforms` 型別。`adventure-level.test.ts` +3（新欄位 runtime 鏡射 JSON、映射與缺省）。733 測試綠、lint 綠、build 綠。未 commit。 |
| 2026-07-18 | S2 | **完成** | 可破壞磚：`types.ts` `GameState.broken`（每關 reset 清空）；`physics.ts` `solidAt` 納未撞碎 breakable（既有關卡空→零回歸）、`breakTileIfPossible` 頭頂撞碎（D4，+50 分、粒子守 reduced）、`collide(g,"y",fx)`；`render.ts` `drawBreakableTile` 焦糖裂紋磚（skip broken）；`levels.ts` builder `breakable()`＋level-02 示範（撞磚拿藏金幣）。`physics.test.ts` +5、S1 測試改為鏡射 JSON。738 測試綠、lint 綠、build 綠。未 commit。 |
| 2026-07-18 | S3 | **完成** | 移動平台：`physics.ts` `updateMovingPlatforms`（往復移動、腳貼頂面承載位移、最小穿透 AABB 阻擋；**reduced 靜止於 x0/y0**）＋`collide` 後呼叫；`render.ts` `drawMovingPlatform` 薰衣草黏土板；`levels.ts` builder `movingPlatform()`＋level-03 橫跨 3 格缺口示範（既有關卡 movingPlatforms 空→零回歸）。`physics.test.ts` +3（承載/reduced 靜止/落下接住）；**M2 自動化斷言**：含平台關卡地面缺口 ≤3 格＝平台靜止仍可跳過通關。742 測試綠、lint 綠、build 綠。未 commit。 |
| 2026-07-18 | S4 | **完成** | 新敵人：`adventure-level.ts` `AdventureEnemyKind`（patrol/hopper/floater）＋runtime 欄位（vy/baseY/t/hopTimer），enemies JSON 加 `kind`（預設 patrol→零回歸）；`physics.ts` 敵人迴圈按 kind 分支（hopper 重力＋定點彈跳、floater 浮動不可踩、patrol 原封不動）＋踩踏改 `stompable = kind!=="floater"`；`render.ts` `drawFloater`（紅尖刺球＝危險對比）＋hopper 青綠車身區隔；`levels.ts` `enemy(x,y,kind)`＋level-04 示範 hopper＋floater。`physics.test.ts` +4（patrol/hopper 踩死、floater 受傷、hopper 彈起）、`adventure-level.test.ts` +1（kind 映射）。747 測試綠、lint 綠、build 綠。未 commit。 |
