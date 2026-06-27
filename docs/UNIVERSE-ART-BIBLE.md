# 車車宇宙 · 樂園地圖 美術聖經（Art Bible）v1

> 唯一目的：**讓各自獨立產出的「島」（不論誰畫、AI 生、還是 Blender 算）看起來像同一個世界。**
> 剪貼感幾乎都來自三件事不一致：**相機角度、陰影方向、材質光澤**。把這份數值定死，再開始量產資產。
>
> 對接對象：`data/universe-zones.ts`（`MAP_STAGE` 1000×720、`ZoneId`、`ZoneStatus`、`ZONE_TERRAIN`）、`components/universe/ZoneIsland.tsx`、`components/universe/ZoneLandmark.tsx`、`lib/universe/zone-art-tile.ts`。
>
> 版本：v1（2026-06）。改規格時更新版本號並記 CHANGELOG。

---

## 0. 世界觀一句話
一片淺海上的**黏土群島**：每座島是一個主題園區，跨海棧道相連；世界從「車車樂園」往外一座一座長出來。整體像一張**會呼吸的定格動畫立體地圖**——手捏質感、暖色童書調、迷你模型尺度。

---

## 1. 相機與投影（第一一致性槓桿，零妥協）
- **投影：正交（orthographic）。** 不可有透視收斂——島與島之間不能各有滅點。
- **俯角：自水平面起算 50°**（等於離天頂 40°）。看得到島頂、也露出一點點正面。
- **方位：相機正面朝向觀者，旋轉 0°。** 所有島用同一台相機，不可單獨轉向。
- **規則：** 任何新島若俯角／投影對不上 → 直接退件重做，不要事後 P。

---

## 2. 燈光（陰影方向＝一致性鐵律）
| 角色 | 方向 | 強度／色溫 | 備註 |
|---|---|---|---|
| 主光 Key | 左上（約 10–11 點鐘），仰角 ~55° | 暖，5200K，柔邊 | 決定高光與投影 |
| 補光 Fill | 右下對側，天空反彈 | 冷藍，~30% | 壓暗部、給空氣感 |
| 環境 AO | 縫隙、接地處 | 柔和、淺 | 增加黏土厚實感 |
| 接地陰影 | **一律落向右下** | 暖灰 `#6b5a48` @ ~25% 不透明、短而柔 | 落在海／沙上 |

> **鐵律：所有島的陰影都往右下。** 拿到任何資產第一件事就是看陰影方向。

---

## 3. 黏土材質
- **霧面油土／聚合黏土**：高粗糙度、**無玻璃／金屬光澤**、無銳利反光，只能有極微弱的大面積柔光。
- **手捏邊**：所有邊角圓潤帶微倒角，半徑一致。
- **指紋與工具壓痕**：表面有細微指腹／壓棒紋理、零星小坑與棉絮感。
- **顏色是材質本身**（染色黏土），不是後製上色；略帶粉彩、比純色去飽和約 10–20%。
- **接縫**：不同塊黏土接合處留可見縫隙，強化「拼出來的模型」感。
- 參考技法：**定格動畫黏土模型 / claymation diorama**（描述技法，不臨摹任何特定作品或角色）。

---

## 4. 配色

**環境色（全圖共用，固定淺色、日夜皆不反轉）——未來 PNG 資產的色票真相**

| 用途 | Hex |
|---|---|
| 海（淺／中／深） | `#cfe8f3` / `#bfe0ef` / `#a7d2e8` |
| 沙岸 | `#ecdcae` |
| 草地（亮／中／暗） | `#d3e9a8` / `#c6e09a` / `#aacd83` |
| 背景／天紙 | `#f4ecd9` |
| 接地陰影 | `#6b5a48` |

> **與現況關係（D3）：** 上表為**未來整島 PNG 資產**的權威色票。目前 `/adventures` 的 SVG fallback（`ZONE_TERRAIN` 與 `UniverseMap` 海色 `#cfeaff`）已 ship 並測試通過，**本版不回頭改色**；待整島 PNG 導入時，前端海／沙／草改吃本表。若日後要讓 SVG fallback 對齊本表，列為獨立小任務。

**各園區主色（沿用網站品牌 token，讓地圖與站內一致；每島一個主導色＝視覺分區）**

| Zone | 主色 | 點綴 |
|---|---|---|
| car-park 車車樂園 | 品牌橘 `#ff8c2b` | 多彩設施 `#f7a8c4` / `#ffd866` / `#b7df9b` / `#8fcde8` |
| dino 恐龍島 | 叢林綠 `#8fc04f` | 火山岩 `#9a8d6e`、岩漿 `#e0573a` |
| rescue 英雄救援隊 | 警示紅 `#e0573a` + 制服藍 `#5b9fc4` | 米白建築 |
| ocean 未來園區 | 湖水 `#79c8c1` | 霧 `#d6e6ee`、薰衣草告示 `#c5b3e6` |

**材質明度規則**：給 3–7 歲，整體明亮、中高明度；**避免純螢光／高飽和**，維持粉彩童書調。

---

## 5. 比例與版位（接 R0 座標系）
- 座標空間＝ `MAP_STAGE` **1000 × 720**（解析度無關）。
- **人物比例尺＝小紅賽車**：車身約 **34 × 16** stage 單位。所有島的設施都以「相對於小紅賽車」的大小來畫。
- **標準島**沙岸外輪廓 ≈ **230 × 170**；**主島（car-park）** ≈ **300 × 220**；地標（摩天輪）高 ≈ 90 單位。
- **錨點＝沙岸底部中心**（島與海的接觸中點）。此錨點對應 `zone.coord`；陰影不可改變錨點。
- **輸出規格**：透明 PNG（RGBA）。標準島基準畫布 460×360px @2x（即 1×＝230×180），四周預留 ~40px 給陰影；另出 @3x。所有島**同一 stage-units/px**、同一台相機。

> **與現況關係（D2）：** 目前 `ZoneLandmark` 把 `artTile` 當 **小地標 icon**（~96×96，錨點＝島中心）疊在 `UniverseMap` 畫的沙／草橢圓上。本表描述的是**未來整島 diorama**（沙＋草＋地標烤進一張、錨點＝沙岸底中心）。兩者切換點由 `lib/universe/zone-art-tile.ts` 的 `ZoneArtTile.mode`（`landmark` | `island`）決定，見第 10 節。**「整島換皮」不是純換檔，需同步調整渲染與錨點。**

---

## 6. 狀態變體美術（對應 `ZoneStatus`）
| 狀態 | 美術做法 |
|---|---|
| `open` 開放 | 完整、飽和、設施「亮燈」、可加 mascot 或微動態點綴 |
| `building` 建造中 | **open 島底 ＋ 可拆卸 overlay**（吊車／鷹架／橘色圍籬／土堆／工程錐）；部分結構是未烤的灰白黏土。overlay 獨立成一張可重用 |
| `coming` 即將登場 | 島已成形但「沉睡」：彩度 −15%、設施未亮燈、罩極淡晨霧。可由 open 圖後製 |
| `planned` 規劃中 | **還不是島**：海上一塊霧色未成形黏土地基／藍圖，插一支「?」告示牌浮標。最省美術 |

> 現況 SVG fallback 已用 `status` 做 `coming`/`planned` 降彩度（`ZoneLandmarkArt` 的 `dimmed`），整島 PNG 導入後沿用同一狀態語意。

---

## 7. 每張資產交付前的一致性檢查表
- [ ] 相機：正交、俯角 50°、方位 0°
- [ ] 陰影：落向右下、柔、暖灰 ~25%
- [ ] 材質：霧面黏土、無光澤、手捏圓邊、有指紋紋理
- [ ] 配色：在第 4 節範圍內，無螢光／過飽和
- [ ] 尺度：以小紅賽車比例尺檢查，跨島一致
- [ ] 錨點：沙岸底部中心；陰影含在 padding 內，未推移錨點
- [ ] 輸出：透明 PNG、@2x 與 @3x、畫布尺寸符規格
- [ ] 檔名／狀態變體齊全（見第 11 節）

---

## 8. 生產管線 A — AI 生圖（最快取得首批資產）
> prompt 用**英文**（影像模型對英文較穩）。流程：固定 base style block ＋ 每島 subject ＋ 固定 negative。

**Base style（每張都附在最後）**
```
claymation diorama, handmade matte polymer clay, soft rounded pressed edges,
subtle thumbprint texture, miniature theme-park island on shallow water,
orthographic bird's-eye view tilted 50 degrees, no perspective distortion,
soft warm key light from upper-left, gentle cool sky fill, soft contact shadow
falling to lower-right, pastel storybook palette, bright and friendly for kids,
no gloss, no reflections, stop-motion model aesthetic, isolated on transparent
background, centered, single object
```

**Negative（每張都加）**
```
glossy, plastic shine, harsh shadows, perspective, photographic realism, text,
letters, watermark, neon colors, oversaturated, sharp hard edges, cluttered,
multiple objects, drop shadow box
```

**各島 subject（接在 base 前）**
- **car-park 車車樂園**：`a small round island theme park with a clay ferris wheel, a striped entrance arch gate, tiny toy cars on winding sandy paths, a couple of rounded trees, dominant warm orange with pastel pink/yellow/mint accents,`
- **dino 恐龍島**：`a small jungle island with a clay volcano and lava glow, ferns and rounded trees, one friendly chubby cartoon dinosaur, green and earthy clay tones,`
- **rescue 英雄救援隊**：`a small town island with a clay fire station, a watchtower with a tiny flag, two generic rounded rescue trucks, red and blue accents,`
- **ocean 未來園區（planned）**：`an undeveloped misty clay land plot floating on calm water, a blueprint signpost with a question mark buoy, foggy muted teal and lavender tones, unfinished,`

**建造中 overlay（獨立可重用）**
```
isolated clay construction kit: a tiny crane, scaffolding, an orange safety
fence, dirt mounds and traffic cones, matte clay, [Base style], transparent background
```

> 工作流：先用 base + 一個 subject 生 6–8 張選風格 → 鎖定一張當「黃金樣本」→ 後續所有島都對齊它（必要時 image-to-image／參考圖）。

---

## 9. 生產管線 B — Blender 黏土渲染（最一致、可任意解析度重算）
**相機**：Orthographic；`Rotation X = 50°`、`Z = 0°`；固定 Ortho Scale。**一個 .blend 一台相機，所有島共用。**

**燈光**：Sun（主光）方位左上、仰角 ~55°、暖色、柔陰影；Area（補光）對側、冷藍、低強度；World 環境光低 + 開 AO。**太陽角度固定後不再動。**

**黏土 Shader（Principled BSDF）**
- Base Color：園區主色（第 4 節）
- Roughness ≈ 0.65；Specular ≈ 0.2（無金屬無清漆）
- Subsurface ≈ 0.05（柔軟感）
- Bump：接 Noise/Voronoi（小尺度）做指紋／壓痕
- 圓邊：Bevel modifier 或 shader Bevel，半徑一致

**渲染／輸出**：Film → Transparent 開；Eevee（快）或 Cycles（細）皆可，務必柔陰影 + AO；每個 tier 固定解析度；輸出 PNG RGBA；框取讓**錨點＝沙岸底部中心**置於畫布固定位置。新園區＝換模型、相機燈光不動。

---

## 10. 與程式對接（現況契約）
- 資產路徑（**D1：採 `/adventures/`，與路由一致**）：
  - `public/adventures/zones/{zoneId}.{svg|png}`（對應 `ZoneArtTile.src`）
  - `public/adventures/zones/{zoneId}-building.png`（建造中 overlay 合成版，選用）
  - `public/adventures/overlays/construction.png`（共用 overlay，選用）
- **tile 詮釋資料契約**（`lib/universe/zone-art-tile.ts`）：
  ```ts
  type ZoneArtMode = "landmark" | "island";
  type ZoneTileAnchor = "center" | "sand-bottom-center";
  type ZoneArtTile = {
    src: string;                       // 圖檔路徑
    mode: ZoneArtMode;                 // R1 現況皆 "landmark"
    anchor: ZoneTileAnchor;            // landmark→center；island→sand-bottom-center
    stageSize?: { w: number; h: number }; // island 模式必填：tile 在 stage 座標的固有尺寸
  };
  ```
  - 現況四島皆 `mode: "landmark"`、`anchor: "center"`，渲染行為與 R2 完全一致。
  - 未來某島升級整島 diorama：改該島 `mode: "island"` + `anchor: "sand-bottom-center"` + `stageSize`，並由 `ZoneIsland`/`UniverseMap` 對 `island` 模式：①以 stageSize 鋪滿該島、②錨點移到沙岸底中心、③**在 `components/universe/UniverseMap.tsx` 條件關閉該島的兩層 SVG 沙／草橢圓**（與整島圖直接耦合，不關會疊圖）、④渲染從現在的 `<img>` 96px 容器改走 `next/image`（評估尺寸／priority／hit area／name+pill 位置）出 @2x/@3x。
  - **副檔名切換**：整島 PNG 就緒時改 `zoneArtTilePath()` 回傳 `.png`（見該函式 JSDoc）。
- **逐島升級**：先做 car-park（hero 島）精緻整島版，其餘維持 landmark，逐島切換。

---

## 11. 命名與版本
- 島：`zones/{id}.png`（或 `@2x`/`@3x` 後綴交給 `next/image` 處理）
- 狀態變體：`zones/{id}-{status}.png`（building/coming…）
- 共用件：`overlays/construction.png`、`overlays/fog.png`
- 黃金樣本與 .blend 收進 repo 或設計庫，附 `art-bible` 版本號；改規格時更新本檔 vN 並記 CHANGELOG。

---

### TL;DR 給美術／AI 的一句話
> 霧面手捏黏土、暖光從左上、陰影落右下、正交俯角 50°、粉彩童書色、迷你模型尺度——**每座島都這樣，世界才會是同一個世界。**
