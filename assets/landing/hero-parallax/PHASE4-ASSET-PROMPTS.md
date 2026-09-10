# Phase 4 — 橫向 2.5D 六層素材生圖 prompts

狀態：**四層素材已生成並合成完畢（2026-09-10）。** 生圖工具為 **ChatGPT Images 2.5**（由維護者在對話介面手動執行，不走 repo 的付費 API 閘門）。

零件表存於 [`props/`](./props)，合成後的 tile 在 `public/landing/hero-parallax/`，接縫對照圖在 [`verify/`](./verify)。
合成由 [`scripts/compose-parallax-tiles.mjs`](../../../scripts/compose-parallax-tiles.mjs) 負責（`npm run compose:parallax`）。

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

第一版的 STYLE 寫了 `miniature tabletop model scale` 與 `as if a child were standing
beside a tabletop model`，模型因此給每個零件配了一塊橢圓草皮底座與一圈灌木。橢圓底座
隱含「從斜上方看桌上擺件」，而橫向視差帶的地面是一條水平線，兩者衝突；合成後會變成
一串浮在路面上的分離草皮。實測也證明裁不掉——灌木比草皮先變寬，任何靠輪廓找轉折的
裁切都會切進房子的門與摩天輪的支架。

下面是修正後、實際採用的版本：

```
Style: handmade matte polymer clay, soft rounded pressed edges, subtle thumbprint
texture, no gloss, no reflections. Soft even diffuse light from the upper left, low
contrast. Pastel storybook palette, desaturated roughly 15% from pure colour, bright
and friendly for young children. Stop-motion claymation aesthetic, as if each piece
were hand-sculpted for a side-scrolling picture-book scene. Viewed from a slight high
angle, about 25 degrees above the horizon.

Ground rule — this is critical: each object stands directly on flat ground and ends
in a clean, straight, horizontal bottom cut. Do NOT give any object its own base,
plinth, pedestal, grass patch, soil mound, oval ground disc, scatter of shrubs or
diorama stand. The ground is supplied separately by another layer.

Every object isolated on a fully transparent background with clean anti-aliased
edges, evenly spaced in one row, not overlapping, not touching the image edges.
Landscape orientation, largest size available.
```

### NEGATIVE

```
Do not include: object base, plinth, pedestal, grass patch under the object, oval
ground disc, soil mound, diorama stand, shrubs or flowers around the base,
transparency checkerboard, checkered or grey background, fake transparency, black
border frame, vignette, shadow cast onto the background, coloured fringe or halo
around the edges, gloss, plastic shine, hard directional shadow, long cast shadow,
photorealism, text, letters, numbers, watermark, signature, neon or oversaturated
colour, sharp hard edges, vector or flat-illustration look, painted-on gradients, any
branded or copyrighted character, human figures, vehicles, faces on the scenery.
```

> `faces on the scenery` 是必要的：站上的車都有臉，模型很容易把童趣風格外溢到樹和石頭上。

---

## 3. 逐層 prompts

以下是**實際採用**的版本。每段前後各貼一次 §2 的 STYLE 與 NEGATIVE。

### L1 遠景地標（0.3x）

```
Create a prop sheet of four separate FAR-DISTANCE landmarks for a side-scrolling
children's picture-book scene, arranged in one horizontal row with generous empty
space between them.

1. A small Ferris wheel — the TALLEST object on the sheet, clearly taller than the
   cottage. A pale dusty-pink closed circular rim, eight thin cream spokes meeting a
   cream hub, mounted on a brown wooden A-frame support. Six rounded gondolas hang
   from the rim in muted blue, yellow, mint and coral. The rim must be fully closed
   and physically joined to the support where they meet, with no gap and nothing
   floating. The two feet of the A-frame end in a clean flat horizontal cut.
2. A storybook cottage — cream-white walls, a terracotta pitched roof, one small
   chimney, two warm-yellow lit square windows, one teal arched door. Just the
   building: no flower beds, no shrubs, no path, no fence, no garden.
3. A tall tree — ONE simple chunky brown trunk, smooth and untextured, under a single
   soft dome of sage-green foliage. Keep the trunk one simple shape: no buttress
   roots, no multiple merged trunks, no bark detail.
4. A shorter bushy tree — the same single simple smooth trunk under two overlapping
   muted-green domes.

Because these sit far away, render them noticeably paler, softer and less saturated
than a foreground object would be, as if seen through a little warm haze. Each
silhouette must stay simple and readable when shrunk to about one fifth of this size.
```

> 「rim must be fully closed and physically joined to the support」對應規格 §1.2 列的既有破綻（「摩天輪支架與輪圈的連接處未接合」）。實測有效，這版的輪圈確實閉合並接上支架。
>
> 「ONE simple chunky trunk… no bark detail」是第二版才加的。第一版沒鎖，模型給了多股並生、帶樹皮紋理的寫實樹幹，在 0.3x 遠景縮小後會糊成一團。

### L2 中景（0.6x）

```
Create a prop sheet of five separate MID-DISTANCE scenery pieces for a side-scrolling
children's picture-book scene, arranged in one horizontal row with generous empty
space between them.

1. A rounded shrub clump of three overlapping soft sage-green domes.
2. A slightly taller shrub with three small coral and yellow clay berries pressed
   into its surface.
3. A white picket fence section: exactly five rounded pickets joined by two
   horizontal rails.
4. A roadside sign: a plain rounded-rectangle board in warm cream on a brown post.
   The board is completely blank — no text, no symbol, no arrow, no picture.
5. A single slim tree with a narrow smooth brown trunk and a small oval green canopy.

Render these midway in saturation: softer than a close foreground object, but clearly
more colourful and more defined than a hazy far background.
```

> 路牌刻意留白。板面上任何文字都會變成無法翻譯、無法無障礙標註的圖像文字。

### L3 路面（1.0x，速度基準）

```
Create a single straight horizontal strip of clay road for a side-scrolling
children's picture-book scene, filling the full width of the image from the extreme
left edge to the extreme right edge with no gap at either end.

- The road surface is warm sandy-brown packed clay, matte, with a subtle hand-pressed
  thumbprint texture.
- A row of evenly spaced cream-white rounded dashes runs along the centre line. Every
  dash is the same small flattened clay bar, at the same spacing.
- A narrow band of muted sage-green clay grass runs along the top edge of the strip.
- The bottom edge of the strip is a clean straight horizontal cut.
- The road is perfectly level and straight: no curve, no bend, no perspective, no
  vanishing point, no corners, no junction, no kerb.

Critical: the left and right edges must be identical in height, colour, texture and
in where the dash pattern falls, so the strip can be repeated side by side with an
invisible join. Put nothing unique or asymmetric anywhere near either edge. The strip
must be one continuous unbroken band — do not draw it as a separate object floating
in the frame.

Transparent background above and below the strip, clean anti-aliased edges. Landscape
orientation, wide and short, largest size available.
```

> **這段的「edges must be identical」沒有生效，也不該指望它生效。** 實測產出的圖首尾各是一截半條虛線，平鋪會併成雙倍長；草皮上緣的手捏輪廓左右也對不上。兩者都由合成腳本解決，見 §6。指令仍保留，因為它至少讓模型畫出了等高、等色的橫幅。

### L5 近景（1.6x）

```
Create a prop sheet of five separate CLOSE-FOREGROUND scenery pieces for a
side-scrolling children's picture-book scene, arranged in one horizontal row with
generous empty space between them.

1. A tuft of tall grass blades, muted green, fanning upward.
2. A low grass clump with three small white and coral clay flowers.
3. Two smooth rounded pebbles side by side, one warm cream and one pale grey.
4. A single larger rounded rock in muted warm grey clay.
5. A kerb piece: a low rounded clay bar in warm cream, straight and level.

These sit closest to the viewer, so render them the most saturated, the largest in
apparent scale and the most crisply detailed of any layer, with the strongest visible
thumbprint texture.
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

## 6. 後製流程（`npm run compose:parallax`）

由 [`scripts/compose-parallax-tiles.mjs`](../../../scripts/compose-parallax-tiles.mjs) 執行，
讀 `props/*.png`，輸出 `public/landing/hero-parallax/*.webp` 與 `manifest.json`；
帶 `--verify` 另外輸出接縫對照圖到 `verify/`。

### 零件層（L1／L2／L5）

1. 掃 alpha 找出每個零件的水平範圍，逐件裁出並依 `LAYERS[].scale` 縮放。
2. 排進 1920px 畫布，**左右各留 120px 空白**，零件間距均分，底部對齊同一條基線。
3. L1 額外套 `saturation: 0.85`。

> 為什麼 L1 要補飽和度：實測 L1 與 L2 的綠色像素平均飽和度是 0.185 對 0.190，
> 幾乎沒有差別，景深階梯只靠亮度撐著（0.495 → 0.426 → 0.363）。生圖裡的
> 「paler and less saturated」只做到了亮度那一半。這是美術旋鈕，調 `LAYERS` 就好，
> 不用重新生圖。

### 路面層（L3）

三道處理，**順序不可調換**：

1. **偵測虛線週期**（實測 163.0px）。必須在校色之前做——校色會把路面提亮到接近奶油色，
   之後虛線的亮色判定會把整條路面都當成虛線，週期會抓成質感斑點的間距（實測 42px）。
2. **色彩校正**：生圖給的是 `#a47846`，明顯比 Art Bible 的步道色 `#d7c596` 更深更橘。
   在 HSL 空間做，不是乘增益——實測線性增益會把路面洗成近白、虛線爆掉失去邊緣、質感全平。
   另加兩道防護：
   - **色相窗**（±0.03）。草／路交界的橄欖色同樣滿足 `r>g>b`，不加窗的話大幅移色相
     會把交界染成一條螢光黃邊。
   - **1px 侵蝕**。緊貼草皮與底緣裁切線的過渡像素若被一起校色，交界會留黃斑。
   - 強度 `0.78`，不做滿。做滿會把手捏質感洗平。校正後路面 `#cfb789`、虛線 `#f1e9cf`，
     對比仍足夠。
3. **裁切 ＋ 交叉淡接**：從「間隙中點」起裁、長度取整數個週期（實測 10 個 = 1630px），
   首尾才不會各留半截虛線；再做一個週期寬的**預乘 alpha** 交叉淡接。
   預乘是必要的——直接混 RGB 會在草皮／透空交界產生半透明的綠色鬼影，因為透空側的
   RGB 是無意義的殘值。

**成效**：左右邊緣 RGBA 平均差從 **11.9 降到 3.6**，接縫的雙倍長虛線、草皮輪廓階差與
鬼影全部消失。

### 驗收

`verify/*-seam.png` 是同一張 tile 左右並排兩份、裁接縫附近放大的對照圖，逐張目檢。
`validate` 這件事沒有自動化——接縫是視覺問題，數值只能當輔助訊號。

---

## 7. 已知風險

| 風險 | 說明 |
|---|---|
| **視角一致性** | 背景零件是 30° 高視角，沿用的小紅 sprite 也是 30°。若某一層生出來明顯是平視或俯視，整條帶會散掉。合成前把該層與 `xiao-hong.png` 並排比對。 |
| **飽和度階梯** | L1 最淡、L2 中間、L5 最濃，是刻意的景深訊號。模型不一定照做，可能三層生出同樣飽和度。合成前把三層並排檢查，必要時用 Sharp 的 `modulate({ saturation })` 補。 |
| **L3 接縫** | 唯一沒有空白緩衝的層。若一兩次生不出對稱邊緣，直接走 §3 的 CSS 備案，不要反覆重抽。 |
| **`.hero` 高度改動** | §4.4 要求 Hero 高度改為桌機 520–600px、手機 380–420px，而現版是 `height: 100svh; min-height: 480px`。這會同時改變 `/intro` 的整頁節奏、`.skip` 的安全區錨定與進站轉場，是 Phase 3 的獨立決策點，不要混進素材這一輪。 |
| **視覺 baseline** | Phase 3 動到 `components/` 樣式時 `.githooks/pre-push` 會擋下零 baseline 變更的 push；baseline 只能在 macOS 本機重錄。 |
