# Phase 4 — 橫向 2.5D 六層素材生圖 prompts

狀態：**prompts 已備妥，尚未生圖。** 生圖工具指定為 **ChatGPT Images 2.5**（由維護者在對話介面手動執行，不走 repo 的付費 API 閘門）。

規格見 [`docs/specs/HERO-PARALLAX-SPEC.md`](../../../docs/specs/HERO-PARALLAX-SPEC.md) §4（分層規格）與 §6（阻擋項）。風格語彙與角色 canon 的單一來源是 [`scripts/lib/character-sheet.ts`](../../../scripts/lib/character-sheet.ts) 與 [`scripts/generate-roamer-assets.ts`](../../../scripts/generate-roamer-assets.ts) 的 `CLAY_STYLE`／`NEG_BASE`，本文的 STYLE／NEGATIVE 區塊由它們改寫而來。

---

## 0. 為什麼不照 §4.3 直接生 1920px 全景條

規格 §4.3 要求「每層輸出為可無縫左右接合的 tile，寬度 1920px、2x 出圖」。這個要求對影像模型不可行：

1. **尺寸**：ChatGPT Images 只給固定比例（3:2／16:9 之類），出不了 3840×N 的長條。
2. **接縫**：模型無法保證左右邊緣在高度、色相、紋理與圖樣相位上對齊。要求它「做出可平鋪的圖」的成功率極低，而且失敗方式是肉眼難察的漸進色偏，會在平鋪後變成規律的接縫帶。

**改用零件表 → 程式合成：**

生「透明底的個別物件」，再用 Sharp 在 `scripts/compose-parallax-tiles.mjs` 裡把零件排進 1920×H 的畫布，**左右各留 120px 完全空白**。接縫落在空白處，無縫是靠構造保證，不是靠模型。

唯一的例外是 L3 路面 —— 它是連續元素，沒辦法留空白。處理方式見 §3。

---

## 1. 資產清單

四張生圖，不是六張。

| 層 | 速度 | 素材 | 生圖 |
|---|---|---|---|
| L0 天空 | 0x | 沿用 `HeroWorld.module.css` 現有的徑向漸層 `#f2ecd8 → #faf1e4 → #fff8ef` | ❌ CSS |
| L1 遠景地標 | 0.3x | 摩天輪、故事屋、遠樹 ×2 | ✅ 1 張 |
| L2 中景 | 0.6x | 樹叢 ×2、柵欄、路牌、細樹 | ✅ 1 張 |
| L3 路面 | 1.0x | 路面條＋中線虛線 | ✅ 1 張（有 CSS 備案） |
| L4 主角 | 0x | 小紅賽車 | ⚠️ **建議沿用既有 sprite**，見 §5 |
| L5 近景 | 1.6x | 草叢、石頭、路緣 | ✅ 1 張 |

§4.1 的六層已滿額，**不得再加層**（`will-change: transform` 的記憶體壓力）。

---

## 2. 共用區塊

每次生圖都要把 STYLE 貼在最前、NEGATIVE 貼在最後。

### STYLE

```
STYLE: Handmade matte polymer clay, soft rounded pressed edges, subtle thumbprint
texture, no gloss, no reflections. Soft even diffuse light from the upper left, low
contrast, a short soft contact shadow directly under each object only. Pastel
storybook palette, desaturated roughly 15% from pure colour, bright and friendly for
young children. Stop-motion claymation diorama aesthetic at miniature tabletop model
scale. Viewed from a slight high angle, about 30 degrees above the horizon, as if a
child were standing beside a tabletop model. Every object isolated on a fully
transparent background, evenly spaced in one row, not overlapping, not touching the
image edges. Landscape orientation, largest size available.
```

> 「about 30 degrees above the horizon」是刻意的：既有 roamer sprite 的 `POSE_FRONT` 就是「slight high angle about 30 degrees to match a tabletop diorama」。背景若改成純側視平視，會跟沿用的小紅 sprite 視角打架。

### NEGATIVE

```
DO NOT INCLUDE: transparency checkerboard, checkered or grey background, fake
transparency, black border frame, vignette, shadow cast onto the background, gloss,
plastic shine, hard directional shadow, long cast shadow, photorealism, text,
letters, numbers, watermark, signature, neon or oversaturated colour, sharp hard
edges, vector or flat-illustration look, painted-on gradients, any branded or
copyrighted character, human figures, vehicles, faces on the scenery.
```

> `faces on the scenery` 是必要的：站上的車都有臉，模型很容易把童趣風格外溢到樹和石頭上。

---

## 3. 逐層 prompts

### L1 遠景地標（0.3x）

```
A prop sheet of four separate FAR-DISTANCE landmarks for a side-scrolling children's
clay diorama, in one row with generous empty space between them:

1. A small Ferris wheel: a pale dusty-pink closed circular rim, eight thin cream
   spokes meeting a cream hub, mounted on a brown wooden A-frame support. The rim
   must be fully closed and physically joined to the support where they meet, with
   no gap and nothing floating.
2. A storybook cottage: cream-white walls, a terracotta pitched roof, one small
   chimney, two warm-yellow lit square windows, one teal door.
3. A tall tree: a chunky brown trunk under a single soft dome of sage-green foliage.
4. A shorter bushy tree: the same brown trunk under two overlapping muted-green domes.

Because these sit far away, render them noticeably paler, softer and less saturated
than a foreground object would be, as if seen through a little warm haze. Keep every
silhouette simple and readable when shrunk very small. Give each object a flat, level
bottom so it can stand on a road.
```

> 摩天輪的「rim must be fully closed and physically joined to the support」直接對應規格 §1.2 列的既有破綻：「摩天輪支架與輪圈的連接處未接合，輪圈下緣同時像插入地面又像浮空」。
>
> 「paler, softer and less saturated」對應 §1.3 的修正方向：「背景元素統一壓灰降飽和，只保留主角車的飽和度」。

### L2 中景（0.6x）

```
A prop sheet of five separate MID-DISTANCE scenery pieces for a side-scrolling
children's clay diorama, in one row with generous empty space between them:

1. A rounded shrub clump of three overlapping soft sage-green domes.
2. A slightly taller shrub with three small coral and yellow clay berries pressed
   into its surface.
3. A white picket fence section: exactly five rounded pickets joined by two
   horizontal rails, with a flat level bottom.
4. A roadside sign: a plain rounded-rectangle board in warm cream on a brown post.
   The board is completely blank — no text, no symbol, no arrow.
5. A single slim tree with a narrow brown trunk and a small oval green canopy.

Render these midway in saturation: softer than a close foreground object, but
clearly more colourful and more defined than a hazy far background. Every piece must
have a flat, level bottom edge so it can sit on a road.
```

> 路牌刻意留白。板面上任何文字都會在合成後變成無法翻譯、無法無障礙標註的圖像文字。

### L3 路面（1.0x，速度基準）

```
A single straight horizontal strip of clay road for a side-scrolling children's
diorama, filling the full width of the image from the extreme left edge to the
extreme right edge with no gap at either end:

- The road surface is warm sandy-brown packed clay, matte, with a subtle
  hand-pressed thumbprint texture.
- A row of evenly spaced cream-white rounded dashes runs along the centre line.
  Every dash is the same small flattened clay bar, at the same spacing.
- A narrow band of muted sage-green clay grass runs along the top edge of the strip.
- The bottom edge of the strip is a clean straight horizontal cut.
- The road is perfectly level and straight: no curve, no bend, no perspective, no
  vanishing point, no corners, no junction.

CRITICAL: the left and right edges must be identical in height, colour, texture and
in where the dash pattern falls, so the strip can be repeated side by side with an
invisible join. Put nothing unique or asymmetric near either edge.
```

**備案（若接縫做不出來）：** 用 CSS 畫路面，只生一張小面積的黏土質感 swatch 平鋪：

- 路面底色：`#d7c596`（Art Bible §4 的「步道」色）
- 中線虛線：`repeating-linear-gradient`，白色圓角短條
- 草地帶：`#a0c96a`（Art Bible §4 的「草地（中）」）
- 黏土質感：一張 512×512 的無縫 clay texture，`background-blend-mode: multiply` 疊上去

這個備案在接縫上是絕對安全的，代價是路面的手捏起伏感會弱一階。

### L5 近景（1.6x）

```
A prop sheet of five separate CLOSE-FOREGROUND scenery pieces for a side-scrolling
children's clay diorama, in one row with generous empty space between them:

1. A tuft of tall grass blades, muted green, fanning upward.
2. A low grass clump with three small white and coral clay flowers.
3. Two smooth rounded pebbles side by side, one warm cream and one pale grey.
4. A single larger rounded rock in muted warm grey clay.
5. A kerb piece: a low rounded clay bar in warm cream with a flat straight bottom.

These sit closest to the viewer, so render them the most saturated, the largest in
apparent scale and the most crisply detailed of any layer, with the strongest visible
thumbprint texture. Every piece must have a flat, level bottom edge.
```

---

## 4. 色票對照

生圖時如果要指定具體色值，以 [`docs/UNIVERSE-ART-BIBLE.md`](../../../docs/UNIVERSE-ART-BIBLE.md) §4 為唯一真相：

| 用途 | 色值 |
|---|---|
| 島緣奶油沙 | `#ead7ac` |
| 草地（亮／中／暗） | `#c4e59a` / `#a0c96a` / `#7fae54` |
| 步道／路面 | `#d7c596` |
| 接地陰影 | `#6b5a48` @ 低不透明、柔 |
| car-park 主色 | 品牌橘 `#ff8c2b` |
| car-park 點綴 | `#f7a8c4` / `#ffd866` / `#b7df9b` / `#8fcde8` / `#c5b3e6` |
| Hero 底色漸層 | `#f2ecd8` → `#faf1e4` → `#fff8ef` |

---

## 5. 主角層：建議沿用既有 sprite，不重生

[`public/adventures/roamers/xiao-hong.png`](../../../public/adventures/roamers/xiao-hong.png)（625×396，含 alpha）已經完全 on-model —— 擋風玻璃大眼、分離的黃色圓大燈、車門與引擎蓋的白圓底「2」、白色雙條紋、單一尾翼、藍色保險桿與飾條，逐項對得上定裝照 `public/characters/小紅賽車.jpg`。

這正是規格 §2.3 對策 1 要的保證：**Hero 場景中的車不重新生成，確保正圖與場景圖是同一台車。**

### 唯一的障礙與解法

sprite **面朝畫面左**，而 §4.1 寫「主角固定不動、背景往左捲」，那會讓車看起來往右開。鏡像（`scaleX(-1)`）會讓車門與引擎蓋的兩個「2」變成反的 —— 在地圖 roamer 的尺寸下看不出來，在 Hero 尺寸下很明顯。

**解法：背景改往右捲，車維持面朝左。** 純粹是 CSS 位移的正負號。

附帶好處：§4.4 的文字安全區在桌機左側約 40%，車放在右側 60% 且面朝左，角色會看向文案，構圖比背對文案好。

**這個決定同時省下一次付費生圖與一次 canon 風險。**

### 備案：真的要重生時的 image-edit prompt

只有在「625px 寬對 Hero 尺寸不夠」時才走這條。必須用 **image edit**（把既有 sprite 當參考圖送出），不可純文字生成 —— 純文字生成會讓模型回落到通用卡通車樣板，該樣板訓練資料大量來自《Cars》。

```
[attach public/adventures/roamers/xiao-hong.png as the reference image]

Redraw this exact same clay toy race car larger and at higher resolution, keeping
every feature identical to the reference. Do not redesign it.

Mirror the pose so the car faces screen-RIGHT in a gentle driving pose (it currently
faces screen-left). The number 2 on the door, the number 2 on the hood and the white
hood stripes must stay the correct way round and readable — do NOT mirror the
numbers themselves.

FACE LAYOUT (canonical, match the reference exactly): big round eyes with black
pupils and a highlight sit ON THE WINDSHIELD panel; small round yellow headlights sit
separately on the front nose and are NOT the eyes — both must be present at once; a
soft smile line runs low across the front bumper, below the headlights.

Self-identifying features that must all be present: a rounded, tall, chubby
super-deformed toy-car silhouette (NOT a low-slung streamlined sports car); the
number 2 in a white circle on the side door; a white racing stripe down the middle of
the hood; a single rear spoiler; blue accents on the bumper and trim; no roof antenna.

All four wheels sit level on flat ground, and the bottom of the tyres must touch the
very bottom edge of the image (the roamer positioning system anchors on this).

DO NOT DRAW: eyes on the headlights, headlights used as eyes, missing headlights,
roof antenna, star antenna, yellow racing stripe, the number 95, lightning bolt
decal, sponsor decals, low-slung streamlined sports car body, wide flat rally or
off-road stance, oversized wheels, mouth built into the radiator grille, Pixar Cars,
Lightning McQueen, any car that reads at a glance as a Disney/Pixar Cars character.

The silhouette alone must read as this original character and clearly not as
Lightning McQueen.
```

> 正向與負向段落逐字取自 `scripts/lib/character-sheet.ts` 的 `XIAO_HONG_FACE_LAYOUT`／`XIAO_HONG_IDENTITY`／`XIAO_HONG_DO_NOT`／`XIAO_HONG_SILHOUETTE_TEST`。**改 prompt 前先改 SSOT**，否則兩邊會漂移，而契約測試 `scripts/lib/character-sheet.test.ts` 守不到這份文件。

### 輪子旋轉的互斥（§4.3）

§4.2 想讓輪子獨立旋轉，那要求主角拆成「車身＋輪子 ×N」，與「與地圖 roamer 共用同一份檔案」互斥。規格建議 **(b) 放棄輪子旋轉**，只留 ±3px／1.2s 的上下浮動。沿用既有 sprite 就是走 (b)，浮動已足夠傳達行進感。

---

## 6. 拿到圖之後的流程

1. **去背檢查** —— ChatGPT 的透明底不一定乾淨，邊緣常有半透明灰邊。用 Sharp 讀 alpha 通道統計，必要時 threshold 後重存。合成前務必確認，否則灰邊會在深色底上顯形。
2. **切件** —— 從零件表切出個別 PNG，存成 `assets/landing/hero-parallax/props/{layer}-{name}.png`。**原始零件表也一併留檔**，方便日後重切。
3. **合成 tile** —— 寫 `scripts/compose-parallax-tiles.mjs`：把零件按指定 x 座標排進 1920×H 畫布，左右各留 120px 空白，輸出 WebP 到 `public/landing/hero-parallax/`。
4. **接縫驗證** —— 把同一張 tile 左右並排兩份輸出成對照圖，目檢接縫。這是 §5 Phase 4 的驗收條件。
5. **人工審 contact sheet** —— 依 [`docs/AGENT-DOMAIN.md`](../../../docs/AGENT-DOMAIN.md) 的付費生圖紅線，素材進 `public/` 前先出 contact sheet 逐張審。手動在 ChatGPT 生圖雖然不經過 repo 的 `--approve` 閘門，這一步仍要做 —— 半成品進了 git 之後很難清。

---

## 7. 已知風險

| 風險 | 說明 |
|---|---|
| **視角一致性** | 背景零件是 30° 高視角，沿用的小紅 sprite 也是 30°。若某一層生出來明顯是平視或俯視，整條帶會散掉。合成前把該層與 `xiao-hong.png` 並排比對。 |
| **飽和度階梯** | L1 最淡、L2 中間、L5 最濃，是刻意的景深訊號。模型不一定照做，可能三層生出同樣飽和度。合成前把三層並排檢查，必要時用 Sharp 的 `modulate({ saturation })` 補。 |
| **L3 接縫** | 唯一沒有空白緩衝的層。若一兩次生不出對稱邊緣，直接走 §3 的 CSS 備案，不要反覆重抽。 |
| **`.hero` 高度改動** | §4.4 要求 Hero 高度改為桌機 520–600px、手機 380–420px，而現版是 `height: 100svh; min-height: 480px`。這會同時改變 `/intro` 的整頁節奏、`.skip` 的安全區錨定與進站轉場，是 Phase 3 的獨立決策點，不要混進素材這一輪。 |
| **視覺 baseline** | Phase 3 動到 `components/` 樣式時 `.githooks/pre-push` 會擋下零 baseline 變更的 push；baseline 只能在 macOS 本機重錄。 |
