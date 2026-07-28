# 車車宇宙 · 樂園地圖 美術聖經（Art Bible）v5

> 唯一目的：**讓各自獨立產出的「島」（不論誰畫、AI 生、還是 Blender 算）看起來像同一個世界。**
> 剪貼感幾乎都來自三件事不一致：**相機角度、光線、材質光澤**。把這份數值定死，再開始量產資產。
>
> 對接對象：`data/universe-zones.ts`（`MAP_STAGE` 1000×720、`ZoneId`、`ZoneStatus`、`ZONE_TERRAIN`）、`components/universe/ZoneIsland.tsx`、`components/universe/ZoneLandmark.tsx`、`lib/universe/zone-art-tile.ts`、`lib/universe/map-art-src.ts`。
>
> 版本：**v5（2026-07-01）**。
> **v4→v5：全面黏土世界。海面與天空（雲、遠景島、日月）不再是平面 SVG，改為與島同管線的黏土 PNG 素材（`public/adventures/map/`）；新增 §14 海／天黏土化規格。島底接地由「雙重（PNG 烘焙陰影＋白硬 foam 環）」統一為「單一短柔接地陰影」。§0、§4 隨之改寫。**
> **v3→v4：同步程式現況「四島皆為 island PNG」；新增 §13 共享 2.5D 深度舞台規格（`mapDepthZ`、bridge landing ports、map roamer 與 island 共用 body/shadow frame）。**
> **v2→v3：新增 §12 動畫綁定規格（motionParts／sprite／日夜態），讓靜態黏土資產可動而不需重畫整張。** 相機／光／材質沿用 v2。
> **v1→v2：鎖定 car-park 黃金樣本為全宇宙標準。** 相機由「正交 50°」改為繼承黃金樣本的「3/4 高視角＋輕透視」；燈光由「左上硬主光＋右下長投影」改為「柔和均勻光＋短柔接地陰影」。其餘材質／品牌色／狀態變體／程式契約沿用 v1。

---

## ★ 黃金樣本（最高權威，先看這個）
- **標準檔：`public/adventures/zones/car-park.png`**（已核准 2026-06-27）。
- **本聖經所有文字規格都是在描述這張圖。任何描述與這張衝突時，以圖為準。**
- 量產其餘三島（dino／rescue／ocean）時：**以這張當 image／style reference、沿用同一 seed 家族**，只換「中央地標＋點綴色」，其餘（沙岸＋綠草頂＋相機＋光＋材質）必須完全相同。
- 判斷新島合不合格的唯一方法：**和 car-park.png 並排比對**，四項（角度／光／材質／色）一致才算過。

> **實測補註（以圖為準）：** `car-park.png` 去背 trim 後外框 ≈ **228×253（比例 ~0.90，近正方）**，非 3:2 橫幅——因摩天輪佔上半使整體偏方。§5 的 `stageSize` 一律以此實測比例為準，避免 R1 渲染變形。

---

## 0. 世界觀一句話
一片淺海上的**黏土群島**：每座島是一個主題園區，跨海棧道相連；世界從「車車樂園」往外一座一座長出來。整體像一張**會呼吸的定格動畫立體地圖**——手捏質感、暖色童書調、迷你模型尺度。

> **全面黏土世界（v5 定調）：** 島是低角度 3/4 立體 diorama，海／天則是**近俯視的黏土平面**——但**同樣是黏土材質**（霧面、手捏波紋、柔光、無光澤），不是向量漸層。海與島的視角可以不同（島立體、海俯視），這種立體書式的錯落很可愛可保留；**但材質、色溫、光的柔度必須同一個世界**。目標是：把海面貼圖與島並排看，看不出是兩支不同筆做的。
>
> **接地（v5 統一）：** 島「坐進水裡」用**單一短柔接地陰影**賣（聖經 §2），**不再疊白硬泡沫環**——PNG 島已自帶烘焙接地陰影，前端只補一層低對比柔影統一光向，避免雙重接地的剪貼感。

---

## 1. 相機與視角（第一一致性槓桿，零妥協）— v2 已改
- **視角：高角度 3/4 立體 diorama（isometric 玩具視角）。** 離水平面約 **30–35°**（看得到島頂，也露出不少地標正面）。
- **輕微透視（非嚴格正交）：** 允許很小幅度的近大遠小，如黃金樣本；不要做成扁平正交，也不要強烈廣角透視。
- **方位：島大致正面朝向觀者**（入口拱門／前緣在下方靠近鏡頭，地標在後方中央）。所有島用**同一台相機、同一方位**，不可單獨轉向。
- **規則：** 任何新島角度對不上黃金樣本 → 直接退件重做，不要事後 P。

---

## 2. 燈光（v2 已改：柔和均勻，不是硬方向光）
黃金樣本是**柔和均勻的漫射光**，低對比、無長硬投影。照這個來：

| 角色 | 設定 | 備註 |
|---|---|---|
| 主光 | 柔和、大面積、略偏上方 | **弱方向性**；不要 10 點鐘硬主光 |
| 環境光／補光 | 高、均勻、暖白 | 讓暗部仍明亮通透（童書調） |
| AO | 縫隙、接地處淺淺一圈 | 增加黏土厚實感 |
| 接地陰影 | **短、柔、低對比**，落在物件正下方略偏前 | 不是長而硬的方向影 |

> **鐵律（v2）：全部島維持同一套柔和均勻光、低對比。** 任何島若突然出現硬方向主光或長投影＝一眼出戲，退件。
> **與前端 R0.5 的關係：** 整島貼到海面上的「接地陰影」（`UniverseMap` SVG 那層）保持**柔、短、低對比**即可，方向不必死守右下；重點是低對比的「浮在水上」感，與島內部的均勻光不衝突（兩者是不同陰影：島內元件 vs 整島貼海）。

---

## 3. 黏土材質（v1 沿用，與黃金樣本相符）
- **霧面油土／聚合黏土**：高粗糙度、**無玻璃／金屬光澤**、無銳利反光，只能有極微弱的大面積柔光。
- **手捏邊**：所有邊角圓潤帶微倒角，半徑一致。
- **指紋與工具壓痕**：表面有細微指腹／壓棒紋理、零星小坑與棉絮感。
- **顏色是材質本身**（染色黏土），不是後製上色；略帶粉彩、比純色去飽和約 10–20%。
- **接縫**：不同塊黏土接合處留可見縫隙，強化「拼出來的模型」感。
- 參考技法：**定格動畫黏土模型 / claymation diorama**（描述技法，不臨摹任何特定作品或角色）。

---

## 4. 配色

**環境／地形色（以黃金樣本為準，約值；未來 PNG 資產的色票真相）**

| 用途 | Hex（約） | 來源 |
|---|---|---|
| 海（淺／中／深） | `#cfe8f3` / `#bfe0ef` / `#a7d2e8` | **黏土海面 `map/sea.png`（v5）**；色票即此三段 |
| 海（夜） | 深藍紫低飽和 | `map/sea-night.png`（對應 `data-theme="night"`） |
| 島緣奶油沙 | `#ead7ac` | 取樣自黃金樣本 |
| 草地（亮／中／暗） | `#c4e59a` / `#a0c96a` / `#7fae54` | 取樣自黃金樣本 |
| 步道 | `#d7c596` | 取樣自黃金樣本 |
| 池塘水 | `#a9d8ee` | 取樣自黃金樣本 |
| 接地陰影 | `#6b5a48` @ 低不透明、柔 | — |

> **island PNG 內的沙／草／步道色，以黃金樣本為唯一真相**（上表為近似量測值）。
> **v5：海面改吃黏土 PNG `map/sea.png`**（見 §14），原 SVG `seaGrad` 漸層退役；`ZONE_TERRAIN` SVG fallback 僅保留給未升級為 island 模式的假想 zone，現況四島皆 island、不觸發。

**各園區主色（沿用網站品牌 token，每島一個主導色＝視覺分區）**

| Zone | 主色 | 點綴 |
|---|---|---|
| car-park 車車樂園 | 品牌橘 `#ff8c2b` | 多彩設施 `#f7a8c4` / `#ffd866` / `#b7df9b` / `#8fcde8` / `#c5b3e6` |
| dino 恐龍島 | 叢林綠 `#8fc04f` | 火山岩 `#9a8d6e`、岩漿 `#e0573a` |
| rescue 英雄救援隊 | 警示紅 `#e0573a` + 制服藍 `#5b9fc4` | 米白建築 |
| ocean 未來夢想島 | 湖水 `#79c8c1` | 霧 `#d6e6ee`、薰衣草告示 `#c5b3e6` |

**材質明度規則**：給 3–7 歲，整體明亮、中高明度；**避免純螢光／高飽和**，維持粉彩童書調（黃金樣本即標準）。

---

## 5. 比例與版位（接 R0 座標系）— v2 微調
- 座標空間＝ `MAP_STAGE` **1000 × 720**（解析度無關）。
- **人物比例尺＝小紅賽車**（黃金樣本內的那台紅車）：所有島的設施都以「相對於小紅車」的大小來畫，跨島一致。
- **car-park 黃金樣本實測近正方（trim 約 228×253，比例 ~0.90）**，非早期估算的 3:2 橫幅。四島統一使用 `stageSize 264×260` 的同畫框 PNG。
- **`stageSize` 量法：** 對 PNG **去背 trim 後**量外框寬高比，換算成 stage 單位填入 `IslandTile.stageSize`（car-park 約 `{ w: 300, h: 200 }`，以實際 trim 為準）。
- **錨點＝沙岸底部中心**（島與海接觸的最前緣中點）。此錨點對應 `zone.coord`；陰影含在 padding 內、不可推移錨點。
- **輸出**：透明 PNG（RGBA）。主檔建議長邊 ≥ 1500px（足夠 @最大縮放×3 DPR），長寬比＝trim 後比例避免變形；交 `next/image` 產 @2x/@3x。

> **與現況關係（v4）：** 四島皆已切到 **整島 diorama PNG**（沙＋草＋地標一張、錨點＝沙岸底中心）。`landmark` 模式僅保留作歷史 fallback；新島預設走 `island` tile 契約。

---

## 6. 狀態變體美術（對應 `ZoneStatus`）
| 狀態 | 美術做法 |
|---|---|
| `open` 開放 | 完整、飽和、設施「亮燈」、可加 mascot 或微動態點綴（如黃金樣本） |
| `building` 建造中 | **open 島底 ＋ 可拆卸 overlay**（吊車／鷹架／橘色圍籬／土堆／工程錐）；部分結構是未烤的灰白黏土。overlay 獨立成一張可重用 |
| `coming` 即將登場 | 島已成形但「沉睡」：彩度 −15%、設施未亮燈、罩極淡晨霧。可由 open 圖後製 |
| `planned` 規劃中 | **還不是島**：海上一塊霧色未成形黏土地基／藍圖，插一支「?」告示牌浮標。最省美術 |

> 現況 SVG fallback 已用 `status` 做 `coming`/`planned` 降彩度（`ZoneLandmarkArt` 的 `dimmed`），整島 PNG 導入後沿用同一狀態語意。

---

## 7. 每張資產交付前的一致性檢查表（v2）
- [ ] **與 `car-park.png` 並排**：角度、光、材質、色四項一致
- [ ] 視角：高 3/4、離水平 ~30–35°、輕微透視（非扁平正交、非廣角）
- [ ] 光：柔和均勻、低對比；**無硬方向主光、無長硬投影**；接地陰影短而柔
- [ ] 材質：霧面黏土、無光澤、手捏圓邊、有指紋紋理
- [ ] 配色：在第 4 節範圍內，主導色正確，無螢光／過飽和
- [ ] 尺度：以小紅車比例尺檢查，跨島一致
- [ ] 主地標：縮小後仍讀得出（細節如睡蓮屬加分，可糊）
- [ ] 錨點：沙岸底部中心；陰影含在 padding 內
- [ ] 輸出：透明 PNG、長邊 ≥1500px、長寬比＝trim 後比例

---

## 8. 生產管線 A — AI 生圖（v2：已對齊黃金樣本）
> prompt 用**英文**。流程：固定 base style block ＋ 每島 subject ＋ 固定 negative。**生新島時務必把 `car-park.png` 當 image/style reference 並沿用 seed 家族。**

**Base style（每張都附在最後）**
```
claymation diorama, handmade matte polymer clay, soft rounded pressed edges,
subtle thumbprint texture, miniature theme-park island on a clay base,
high three-quarter isometric toy view, about 30 degrees elevation, gentle slight
perspective, soft even diffuse lighting, low contrast, short soft contact shadow,
pastel storybook palette, bright and friendly for kids, no gloss, no reflections,
stop-motion model aesthetic, isolated on transparent background, centered,
single object
```

**Negative（每張都加）**
```
glossy, plastic shine, harsh shadows, hard directional light, long cast shadow,
strong perspective, flat orthographic, top-down, photographic realism, text,
letters, watermark, neon colors, oversaturated, sharp hard edges, cluttered,
multiple objects, picture frame, drop shadow box, branded characters
```

**各島 subject（接在 base 前）**
- **car-park 車車樂園（＝黃金樣本，已定）**：`a small clay island amusement park with a pastel clay ferris wheel (orange frame, cabins in pink, lavender, yellow, mint, sky blue), a striped orange entrance arch, winding sandy paths, a small pond with lily pads, rounded clay trees, colorful flag bunting on little posts, and one small red toy car as the mascot,`
- **dino 恐龍島**：`a small clay jungle island with a clay volcano and soft lava glow, ferns and rounded trees, one friendly chubby cartoon dinosaur as the centerpiece, same sandy shore and green grass base, green and earthy accents,`
- **rescue 英雄救援隊**：`a small clay town island with a clay fire station and a watchtower with a tiny flag, two generic rounded rescue trucks, same sandy shore and green grass base, red and blue accents,`
- **ocean 未來夢想島（planned）**：`an undeveloped misty clay land plot on the same sandy base, a blueprint signpost with a question-mark buoy, foggy muted teal and lavender, unfinished, sleepy,`

**建造中 overlay（獨立可重用）**
```
isolated clay construction kit: a tiny crane, scaffolding, an orange safety
fence, dirt mounds and traffic cones, matte clay, [Base style], transparent background
```

> 工作流：car-park 已鎖。生其餘島時 → 餵 `car-park.png` 當 reference ＋固定 base/negative ＋換 subject → 每島生 6–8 張 → 用第 7 節檢查表並排 car-park 挑選。

---

## 9. 生產管線 B — Blender 黏土渲染（v2：相機／光已對齊黃金樣本）
**相機**：高 3/4 玩具視角，俯角離水平約 30–35°（Blender `Rotation X ≈ 58–60°`、`Z = 0°`）；**用 Perspective＋長焦（如 85–135mm）做出黃金樣本那種輕透視**，而非嚴格 Ortho。一個 .blend 一台相機，所有島共用。

**燈光**：**柔和均勻**為主——大面積柔光／HDRI 環境光、低對比、暗部仍明亮；**不要強方向 Sun**。接地陰影短而柔（軟陰影＋AO）。光一旦定好不再動。

**黏土 Shader（Principled BSDF）**
- Base Color：園區主色（第 4 節）
- Roughness ≈ 0.65；Specular ≈ 0.2（無金屬無清漆）
- Subsurface ≈ 0.05（柔軟感）
- Bump：接 Noise/Voronoi（小尺度）做指紋／壓痕
- 圓邊：Bevel modifier 或 shader Bevel，半徑一致

**渲染／輸出**：Film → Transparent 開；Cycles（細）或 Eevee（快）＋柔陰影＋AO；輸出 PNG RGBA；框取讓**錨點＝沙岸底部中心**置於畫布固定位置。新園區＝換模型、相機燈光不動。

---

## 10. 與程式對接（現況契約，v1 沿用）
- 資產路徑（**採 `/adventures/`，與路由一致**）：
  - `public/adventures/zones/{zoneId}.{svg|png}`（對應 `ZoneArtTile.src`）
  - `public/adventures/zones/{zoneId}-building.png`（建造中 overlay 合成版，選用）
  - `public/adventures/overlays/construction.png`（共用 overlay，選用）
- **tile 詮釋資料契約**（`lib/universe/zone-art-tile.ts`，discriminated union）：
  ```ts
  type ZoneArtMode = "landmark" | "island";
  type ZoneTileAnchor = "center" | "sand-bottom-center";
  // landmark：以島中心對齊 coord；island：以沙岸底中心對齊 coord，必填 stageSize
  ```
  - 現況四島皆 `mode: "island"`、`anchor: "sand-bottom-center"`、`stageSize: { w: 264, h: 260 }`、`anchorUV: [0.5, 0.84]`。
  - `ZoneIsland` 以 `anchorUV` 對齊 `zone.coord`，`UniverseMap` 對 island 島跳過 SVG 沙／草橢圓，避免整島 PNG 和 fallback 底座疊圖。
  - **副檔名現況**：`zoneArtTilePath()` 回傳 `.png`（1x fallback）；`getZoneArtSrcSet()` 組 width-descriptor srcset 接 `@2x/@3x`（SSG 無 Image Optimizer，不用 `next/image`）。同名 `.svg` 僅保留作 fallback / 歷史資產。
- **漫遊者交付**：`public/adventures/roamers/{id}.png` + 同名 `.webp`（`npm run optimize:roamer-assets`）；前端 `<picture>` WebP 優先、PNG fallback；rear `fetchPriority="low"`。
- **新島升級規則**：先建立同畫框 PNG + sidecar 數值，再登錄 `ZONE_ART_TILES`；不要回到 landmark/center 的舊契約。

> **R1 接線補註（來自 v1.1 規劃審查，HIGH）：** island 模式渲染須以**錨點在圖內的相對位置 `anchorUV`** 對齊 `zone.coord`，而非「圖底中心」，否則島會上移約 16%。car-park 黃金樣本的 `anchorUV=(0.50, 0.84)` 已記於 sidecar `public/adventures/zones/car-park.tile.json`；R1 時於 `ZoneArtTile` 補 `anchorUV?: [number, number]` 欄位。

---

## 11. 命名與版本
- 島：`zones/{id}.png`（@2x/@3x 經 `getZoneArtSrcSet` + `<img srcSet>`）
- 漫遊者：`roamers/{id}.png` + `{id}.webp`（rear：`{id}.rear.png` / `.rear.webp`）
- 可動部位：`zones/{id}.{part}.png`（如 `car-park.wheel.png`，與 base 同畫布同錨點；見 §12.6）
- 狀態變體：`zones/{id}-{status}.png`
- 共用件：`overlays/construction.png`、`overlays/fog.png`
- **黃金樣本 `car-park.png`（含原始生圖 seed／參數）收進 repo 或設計庫**；改規格時更新本檔 vN 並記 CHANGELOG。

---

## 12. 動畫綁定規格（Rigging & Motion）— v3 新增
> 單張死 tile 動不了。要讓島會動，**產島時就把「會動的部位」輸出成獨立透明圖層、並標好軸心**；前端再用 transform 驅動，島底完全不動。

### 12.1 可動部位 motionParts
- 每座有動態的島，除了 `base`（靜止島底）外，把可動部位各自輸出成**獨立透明 PNG**，與 base **同畫布、同錨點、1:1 疊放**，且用**同一台相機／光／材質**（§1–3）渲染，才能無縫合成。
- **鐵律：base 不可包含可動部位**（否則會疊影）。
- car-park 範例拆法：
  - `base`（島底＋步道＋池塘＋樹＝靜止）
  - `wheel`（摩天輪，spin，軸心＝輪轂）
  - `flags`（彩旗串，sway）
  - `mascot-car`（小紅車，path，沿步道行進）
- **軸心標記**：spin／sweep 類，要記下旋轉中心在該部位圖內的歸一化座標（如輪轂在 50%, 46%），前端繞它旋轉。

### 12.2 轉不出來的動作 → sprite 循環
- 走路的恐龍、冒泡岩漿等無法用單一 transform 模擬者，用 Blender **只動該部位、固定相機／光**批次出 12–24 幀透明循環（sprite sheet 或 APNG/animated WebP），可無縫 loop。少量精用。

### 12.3 動作語彙與預設（讓四島像同一個世界）
| 動作 | 預設 | 用於 |
|---|---|---|
| spin | 8–12s/圈、等速 | 摩天輪 |
| sway | ±3–6°、3–4s ease-in-out | 旗、樹 |
| bob | ±2–4px、3s | 浮標、船 |
| drift | 線性、長週期 | 雲、魚 |
| sweep | ±角度、4s | 燈塔光 |
> 一律**輕柔**（幼兒、低干擾）。

### 12.4 靜止即英雄姿
- 每個可動部位的**靜止幀（resting pose）必須單獨看也好看**——因為 `prefers-reduced-motion` 時就停在這一幀。設計時以靜止姿為主視覺。

### 12.5 日夜態（選用）
- 可動部位可附 `srcNight`（夜晚版：船艙／窗戶／摩天輪點燈發光），配合網站日夜主題切換。

### 12.6 交付清單與命名
- `zones/{id}.png`（base）、`zones/{id}.{part}.png`（如 `car-park.wheel.png`、`car-park.flags.png`），同畫布同錨點。
- 隨附一份部位描述（餵前端 R-anim 1），型別如下：
```ts
type MotionType = "spin" | "sway" | "bob" | "drift" | "sweep" | "sprite";
type MotionPart = {
  name: string;                 // "wheel" | "flags" | "mascot-car"
  src: string;                  // 與 base 同畫布、同錨點
  srcNight?: string;
  pivot?: { x: number; y: number };   // 0..1，spin/sweep 用
  motion: MotionType;
  periodMs?: number;            // 一圈/一循環
  amplitudeDeg?: number;        // sway/sweep
  amplitudePx?: number;         // bob
  sprite?: { frames: number; fps: number }; // motion==="sprite"
};
```

### 12.7 與程式對接
- base 走 §10 的 `island` tile 契約；motionParts 由 R-anim 1 的渲染器讀上表、用 CSS/WAAPI 驅動，全部受 reduced-motion 控管。產島時把零件＋此描述一起交付即可。

### 12.8 漫遊小車＝2.5D unit（R-anim 3 新增）

島上漫遊小車不是貼紙，是**2.5D unit**：預設定點 idle，**移動時**（tapJoyride／rareCrossing）才依行進方向面向。資料層 `data/universe-roamers.ts`、LOD `lib/universe/roamer-presentation.ts`、引擎 `components/universe/useRoamerSim.ts`。呈現定版見 `docs/superpowers/specs/2026-07-28-universe-roamer-presentation-design.md`。

- **4 向 sprite：** 每角色生 **2 張面朝畫面左**的視圖 → `{id}.png`（¾ 前視、車頭朝觀者）、`{id}.rear.png`（¾ 後視、車尾朝觀者）。左右向由前端 `scaleX(-1)` 鏡像，共 4 朝向。`RoamerSprites` 契約；rear 未到位時回退 front（不渲染破圖）。
- **生圖管線：** `npm run generate:roamer-assets`（front + rear 兩視圖）。模型回傳近白底而非約定 magenta 時，postProcess 以**邊界 flood 去背保險絲**（`scripts/lib/roamer-alpha.ts`）救回；既有資產用 `npm run fix:roamer-alpha` 就地修補（保留牙齒／眼白等內部白）。
- **呈現：** 遠景 map 層最多 1～2 台 idle（open 島池）＋極少跨島；近景聚焦島一台招牌 `idleSpot`；點擊打招呼，可選短 joyride。不做閉合巡邏、不做導覽箭頭。
- **朝向：** `idleSpot` 用預設 `facing`／`flip`；移動時依 path 切線 `hx/hy` 選 front/rear 與左右鏡像（遲滯，零附近維持原朝向）。
- **接地：** 陰影是**獨立地面橢圓**（不隨 bob 浮動，只隨 hop 微縮），維持 §2「短柔接地陰影」；sprite 本身只留極淡形狀陰影。idle 微晃掛在 img（transform），受 `prefers-reduced-motion` 關閉。
- **景深：** tile 內越上（遠）越小、越下（近）越大；過彎輕微 bank（map 層關閉）。
- **深度遮擋：** `ZONE_OCCLUDERS` 用**同一張 tile 的 clip-path 複製**露出地標剪影、疊在 roamer 上方（z-index = `baselineY`）。roamer `z-index = groundY`：groundY < baselineY（在地標後方）即落到剪影下被擋住，呈現立體書式「鑽到地標後方」。招牌 idle 應放在 baseline **前方**（y 更大）。新島若要遮擋，量好地標剪影 `clipPath` 與接地基線 `baselineY` 即可，**無需另畫前景圖**。

## 13. 共享 2.5D 深度舞台（v4）

地圖層不再只靠 DOM 順序疊放；舞台內的實體物件共用 `y → z-index` 規則：

- **核心規則：** `mapDepthZ(y, band)` 由 stage y 決定前後，y 越大越靠近觀者；`band` 只處理同一條地面線上的 tie-break（bridge < island < roamer）。`label` 是 UI band，永遠高於實體世界，確保島名與狀態 pill 可讀。
- **島：** `resolveUniverseMap()` 對每座島輸出 `tileBox` 與 `depthY`。island PNG 的 `depthY` 即 `zone.coord.y`（沙岸底中心），`ZoneIsland` body 使用 `island` band，label 使用 `label` band。
- **橋：** bridge 不再從島中心畫到島中心，而是由 resolver 算出 `fromPort` / `toPort`，落在沙岸附近；每座橋獨立成一個 SVG layer，使用 `bridge` band 排序。
- **漫遊車：** map-level roamer 與 island roamer 共用 `computeFrame()` / `applyFrame()` 的 body、shadow、front/rear、depthScale 與 bank 邏輯；map 層只把 frame 的 `groundY` 轉成 `mapDepthZ(groundY, "roamer")`。
- **海面與裝飾：** sea SVG 是底層；水面裝飾仍屬海面視覺，不應蓋過島與車。若未來要讓船或魚穿過橋前後，需把該 decor 拆成獨立 DOM/SVG layer 並套 `waterDecor` band。

---

## 14. 海面與天空黏土化（v5 新增）

> 島已達標，但過去承載島的海／天是平面向量（`seaGrad` 漸層、白橢圓雲、半透明橢圓遠山），與黏土島並排會剪貼出戲。v5 把它們全部升級為**與島同管線的黏土 PNG 素材**。

### 14.1 素材清單與契約（`public/adventures/map/`）
| id | 檔案 | 底 | 視角 | 用途 |
|---|---|---|---|---|
| `sea` | `sea.png`(+`@2x`) | 實底 | 近俯視、**無縫可平鋪** | 舞台海面（取代 `seaGrad`） |
| `sea-night` | `sea-night.png`(+`@2x`) | 實底 | 同上，深藍紫低飽和 | 夜間海面（`data-theme="night"`） |
| `cloud-a/b/c` | `cloud-*.png` | 透明 RGBA | 遠景、無投影盒 | 視差雲層（取代向量橢圓雲） |
| `sun` / `moon`（選用） | `sun.png` / `moon.png` | 透明 RGBA | 霧面黏土日月 | `SkyBodies`（選用升級） |

> `far-island-a/b`（地平線遠景剪影，曾含 `@2x`）已於 2026-07 移除：parallax 層改以前景雲承載景深，遠島剪影與海面滿版視覺衝突。移除範圍見 `lib/universe/map-art-src.ts`、`scripts/generate-map-art.ts`、`scripts/verify-map-art.ts`、`scripts/fix-map-art.ts`；`UniverseMapParallax.test.tsx` 保留「不再輸出 far-island」的防護測試。

- 路徑集中於 `lib/universe/map-art-src.ts`（比照 `lib/universe/zone-art-src.ts`），前端不散寫字串。
- 海面需 `@2x`（跟隨 pan/zoom 放大）；雲可只 1x。

### 14.2 材質一致性（與島同世界）
- **鐵律同 §8：生任何 map 素材都餵 `car-park.png` 當 image/style reference**，共用 `CLAY_STYLE_PREFIX` + `CLAY_NEGATIVE`。
- 海面例外於「島相機」：海是**近俯視平面**（非 3/4），但材質光/色溫必須同島。base block 覆寫視角為 top-down、其餘沿用。
- 海面**必須無縫可平鋪**（水平＋垂直邊接得起來），否則大 stage 會露接縫。
- 雲／遠島維持黏土霧面、圓潤邊、無光澤、**遠景去飽和**（比島低 15–25%）。

### 14.3 生產管線
- 腳本 `scripts/generate-map-art.ts`：`--dry-run` / `--only <id>` / `--approve` / `--night`（day/night 變體集切換，比照 landing 的 `--portrait`）。
- 流程：生圖 → 審 `public/.map-staging/contact-sheet.jpg` → `--approve` 覆蓋 `public/adventures/map/`。
- 驗證：`scripts/verify-map-art.ts` 檢查必要素材與 `@2x` 齊備。

### 14.4 前端接線與深度
- 海面走 `sea` band（`mapDepthZ(0,"sea")`），為最底層；雲／遠島在 `UniverseMapParallax`（視差係數 `0.38`）。
- 島接地：**單一短柔接地陰影**（§2、§0 v5），移除白硬 foam 環。
- 日夜：海面 day/night 兩張交叉淡入；reduced-motion 時雲 drift 停於好看靜止幀。

### 14.5 一致性檢查表（每張 map 素材交付前）
- [ ] 與 `car-park.png` 並排：**材質、色溫、光的柔度**同一世界（視角海面可俯視）
- [ ] 霧面黏土、無光澤、手捏圓邊/波紋壓痕
- [ ] 海面上下左右**無縫平鋪**、無明顯接縫
- [ ] 遠景（雲/遠島）去飽和、柔邊，不搶島
- [ ] 透明底素材為乾淨 RGBA，無白邊殘留
- [ ] 海面/遠島 `@2x` 已生、尺寸對齊契約

---

### TL;DR 給美術／AI 的一句話
> 霧面手捏黏土、柔和均勻光、短柔接地陰影、**3/4 高視角輕透視**、粉彩童書色、迷你模型尺度——**島、海、天都對齊 `car-park.png` 黃金樣本，整個世界（含海與天）才會是同一支筆捏出來的。**
