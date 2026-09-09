# Phase 2 — Hero 小紅對齊 canon（待在有 Blender 的機器上執行）

狀態：**patch 已備妥，尚未套用。** `build.py` 目前仍是 v3 原狀。

規格見 [`docs/specs/HERO-PARALLAX-SPEC.md`](../../../docs/specs/HERO-PARALLAX-SPEC.md) §0.3 與 §2.5。

---

## 為什麼 patch 不直接 commit

`public/models/hero-world/v3/manifest.json` 記著 `buildScriptSha256`。只改 `build.py` 而不重建 GLB，這個雜湊就會與實檔不符 —— 而「來源鏈必須指回 `.blend`／`build.py`，不得再是後製既有 GLB」正是 2026-09-08 v3 乾淨重建要建立的保證（見 [`docs/HERO-WORLD.md`](../../../docs/HERO-WORLD.md)）。

所以 `build.py` 的修改**必須與 `npm run release:hero-world` 在同一個 commit 落地**。撰寫這份 patch 的容器沒有 Blender CLI，因此改動放在這裡等待執行。

---

## 範圍

§0.3 逐項核對後，Hero 對 canon（定裝照 `public/characters/小紅賽車.jpg`）只有三項偏移。本 patch 處理其中兩項：

| # | 偏移 | 本 patch | 理由 |
|---|---|---|---|
| 1 | 缺車門白圓底號碼「2」 | ✅ 補上 | canon 的主要自有識別，`build.py` 完全沒有對應幾何 |
| 2 | 微笑線過細過深，遠看塌成橫桿 | ✅ 加粗加寬 | 線徑 `.026` → `.036`，嘴角由 ±`.17` 拉到 ±`.21` |
| 3 | 輪徑對車高偏大 | ❌ **刻意不做** | 見下 |

### 為什麼不動輪徑

`WHEEL_RADIUS = .275` 同時出現在兩個地方，且是**行進距離與輪子轉速的換算基準**：

- `assets/blender/hero-world/build.py`：`rod('Tire',(x-.10,y,.28),(x+.10,y,.28),.275,…)`
- `components/landing/hero-world/config.ts:24`，餵給 `wheelAnimationTime()` = `distanceAtProgress(progress) / (2π × WHEEL_RADIUS) × clipDuration`

改動會連鎖三件事：

1. 兩處數值必須同步，否則輪子轉速與路面前進距離脫鉤（車子會「打滑」）；
2. 輪心現在在 `z=.28`、半徑 `.275`，輪底剛好落在車體本地 `z≈.005`；縮小半徑不同步下移輪心，車就會浮空；
3. 車身高度與相機取景是照現行剪影調的，比例一動就要重新目視驗收。

這是獨立的一輪美術調整，不該跟「補號碼、加粗嘴」這種確定性修補混在同一個 patch。留待 §2.5 之後另案處理。

---

## Patch

在 repo 根目錄執行：

```bash
git apply <<'PATCH'
--- a/assets/blender/hero-world/build.py
+++ b/assets/blender/hero-world/build.py
@@ -289,7 +289,17 @@
     box('Side window',(x,.2,.89),(.037,.54,.31),'sky',.12)
     ball('Mirror',(x*1.14,-.25,.76),(.11,.10,.085),'red')
 box('Bumper',(0,-.78,.29),(.92,.15,.13),'blue',.06)
-tube('Smile',[(-.17,-.836,.47),(-.10,-.853,.40),(0,-.856,.38),(.10,-.853,.40),(.17,-.836,.47)],.026,'dark')
+tube('Smile',[(-.21,-.828,.47),(-.12,-.851,.395),(0,-.856,.375),(.12,-.851,.395),(.21,-.828,.47)],.036,'dark')
+# 車門號碼「2」：canon 的主要自有識別（定裝照為白圓底藍字）。圓底做成扁球而不是
+# 平面圓盤，才貼得住 Body 的 .23 bevel 圓角側面；數字用 tube 沿折線描出。兩側各自
+# 鏡射 y，讓左右從車外看都正讀。DIGIT_TWO 是相對圓心的 (dy,dz) 偏移。
+BADGE = (.523, -.02, .47)
+DIGIT_TWO = [(-.070,.075),(-.045,.115),(0,.122),(.045,.108),(.062,.075),
+             (.050,.035),(0,-.015),(-.045,-.065),(-.068,-.102),(.068,-.102)]
+for side in [-1, 1]:
+    bx, by, bz = BADGE[0]*side, BADGE[1], BADGE[2]
+    ball('Door badge',(bx,by,bz),(.028,.20,.20),'ivory')
+    tube('Door number',[(bx+.030*side, by+dy*side, bz+dz) for dy,dz in DIGIT_TWO],.013,'blue')
 box('Spoiler',(0,.78,.86),(1.12,.22,.11),'red',.055)
 for x in [-.34,.34]:box('Spoiler stem',(x,.73,.71),(.06,.08,.22),'red',.025)
 merge('Vehicle')
PATCH
```

### 幾何依據

- `Body` 是 `(1.03,1.65,.51)`，半寬 `.515`。圓底扁球中心放在 `x=±.523`、半軸 `.028`，所以外緣在 `.551`、內嵌車身 `.02` —— 讀起來像一片貼上去的黏土圓牌，而不是浮在旁邊的薄片。
- `Body` 的 bevel 是 `.23`，側面幾乎整片是圓角，平面圓盤會翹邊，所以用 `ball`（扁球）而非 `rod`（圓柱）。
- 數字 tube 中心在 `x=±.553`、半徑 `.013`，比圓底外緣再凸 `.015`。
- 材質沿用既有 `ivory`（同 `Windshield`／`Hood stripe`）與 `blue`（同 `Bumper`），不新增材質槽 —— `merge('Vehicle')` 是依材質分組合併的。
- 新增幾何約 900 三角面（現況 16,343，預算上限 40,000），不會逼近 `validate:hero-world` 的預算。

---

## 執行步驟

```bash
# 1. 套用 patch（見上）
# 2. 先看一眼 Cycles 預覽，確認「2」的字形與嘴的粗細
blender -b --python assets/blender/hero-world/build.py -- --preview
#    → assets/blender/hero-world/export/preview.png（不進 public/）

# 3. 滿意後跑完整發布鏈
npm run release:hero-world
#    = optimize:hero-world → render:hero-posters → validate:hero-world

# 4. 全套驗證
npm run check          # test + verify + build，與 CI 同一套
npm run test:visual:trusted -- --update-snapshots   # baseline 只能在 macOS 重錄
```

### commit 範圍

`build.py` 與重建產物**必須同一個 commit**：

```
assets/blender/hero-world/build.py
assets/blender/hero-world/export/*.raw.glb
public/models/hero-world/v3/*.glb
public/models/hero-world/v3/manifest.json
public/models/hero-world/v3/asset-report.json
public/models/hero-world/v3/poster*.webp
e2e/**/*-darwin.png（若視覺 baseline 有變）
```

---

## 目視驗收

跑完 `--preview` 後逐項核對（完整檢查表見規格附錄）：

- [ ] 車門圓牌是**白圓底藍字「2」**，兩側從車外看都正讀（不是鏡像的 S）
- [ ] 圓牌貼合車身圓角，沒有翹邊或穿模
- [ ] 圓牌沒有被前輪或後視鏡遮住
- [ ] 嘴在 hero 尺寸下讀得出是**微笑**，不是一根橫桿
- [ ] 嘴沒有壓到藍色保險桿
- [ ] 眼睛仍在擋風玻璃、黃大燈仍分離存在（本 patch 不應動到這兩者）

### 若「2」字形不對

`DIGIT_TWO` 是一條 10 點折線，沒有經過算圖驗證 —— 這是本 patch 唯一需要人眼調的地方。調整方式：

- **太瘦／太胖**：改 `tube(...)` 的半徑 `.013`
- **太大／太小**：整體縮放 `DIGIT_TWO` 的 `(dy,dz)`（目前字高 `.224`、字寬 `.13`，圓底半徑 `.20`）
- **位置偏移**：改 `BADGE` 的 `(-.02,.47)`
- **上半弧太尖**：在前五點之間補插值點，`tube` 的 `resolution_u=1` 不會自動平滑折線

`ivory`／`blue` 都是既有世界色（`blue` 是 `(.10,.30,.32)` 偏深青，與保險桿同色）。若對比不足以在 hero 尺寸讀出，可考慮改用 `sky`（`(.30,.52,.53)`），但那會讓數字與側窗同色 —— 建議先看預覽再決定。
