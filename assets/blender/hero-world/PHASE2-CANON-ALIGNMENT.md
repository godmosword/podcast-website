# Phase 2 — Hero 小紅對齊 canon

狀態：**已執行（2026-09-09）。** `build.py` 與 `public/models/hero-world/v3/` 已在同一個 commit 落地，`buildScriptSha256` 與實檔一致。

規格見 [`docs/specs/HERO-PARALLAX-SPEC.md`](../../../docs/specs/HERO-PARALLAX-SPEC.md) §0.3、§0.4 與 §2.5。

---

## 為什麼 `build.py` 必須與重建同一個 commit

`public/models/hero-world/v3/manifest.json` 記著 `buildScriptSha256`。只改 `build.py` 而不重建 GLB，這個雜湊就會與實檔不符 —— 而「來源鏈必須指回 `.blend`／`build.py`，不得再是後製既有 GLB」正是 2026-09-08 v3 乾淨重建要建立的保證（見 [`docs/HERO-WORLD.md`](../../../docs/HERO-WORLD.md)）。

規格 v1 是在沒有 Blender CLI 的容器裡寫的，所以當時只留 patch 不落地。這一輪在維護者的 macOS 本機（`blender` 5.2.1 LTS）執行。

---

## 實際做了什麼

§0.3 逐項核對後，本輪處理三件事。**前兩項是原 patch 的範圍，第三項是執行時才發現的破綻。**

| # | 項目 | 狀態 |
|---|---|---|
| 1 | 缺車門白圓底號碼「2」 | ✅ 補上 |
| 2 | 微笑線過細過深，遠看塌成橫桿 | ✅ 線徑 `.026` → `.036`，嘴角 ±`.17` → ±`.21` |
| 3 | **車頭零件仍釘在舊車頭座標** | ✅ 一併修掉（見下） |
| 4 | 輪徑對車高偏大 | ❌ **刻意不做** |

### 3：為什麼原 patch 直接套用會做出一條更粗的浮空鐵絲

前一個 commit 依定裝照把 `Body` 的 Y 由 `1.65` 縮到 `1.52`，車頭面因此從 `y=-.825` 退到 `-.760`。但四個以車頭面為錨的零件座標沒有跟著移：

| 零件 | 舊座標 | 縮短後的處境 |
|---|---|---|
| `Bumper` | `y=-.78` | protrude 由 `.03` 變成 `.095` |
| `Headlight` | `y=-.81` | 與車身脫離，變成浮在車頭前的兩顆黃球 |
| `Smile` | `y=-.836`～`-.856` | 完全脫離車身，變成懸空的深色線 |
| `Hood stripe` | `y=-.58` | 前端越過車頭面 `.015`，戳出鼻尖 |

原 patch 的座標與幾何依據都是照 **v3 原版**的 `Body`（半寬 `.515`、bevel `.23`）算的。直接套用有兩個後果：

1. `git apply` 失敗 —— context 行 `ball('Mirror',…,'red')` 與 `box('Spoiler',…,'red')` 已改成 `'car_red'`；
2. 就算手動改 context，`BADGE = (.523, …)` 是照半寬 `.515` 推的，而現在半寬是 `.53` —— **號碼牌會整個埋進車身，完全看不見**。

所以本輪的做法是：四個車頭零件一律 `+.065` 重新錨定，`BADGE` 的 x 依新半寬重算為 `.538`，嘴的控制點依新車頭面重新落點。

---

## 實際落地的幾何

```python
# 車頭零件重新錨定（+.065）
ball('Headlight',(x*1.6,-.745,.48),(.095,.047,.095),'yellow')
box('Hood stripe',(x*.33,-.515,.746),(.057,.39,.024),'ivory',.016)
box('Bumper',(0,-.715,.29),(.92,.15,.13),'blue',.06)

# 嘴：加粗加寬，嘴角埋入車頭、嘴心落在保險桿前緣
tube('Smile',[(-.21,-.755,.47),(-.12,-.782,.395),(0,-.791,.375),
              (.12,-.782,.395),(.21,-.755,.47)],.036,'dark')

# 車門號碼「2」
BADGE = (.538, -.02, .47)
DIGIT_TWO = [(-.070,.075),(-.045,.115),(0,.122),(.045,.108),(.062,.075),
             (.050,.035),(0,-.015),(-.045,-.065),(-.068,-.102),(.068,-.102)]
for side in [-1, 1]:
    bx, by, bz = BADGE[0]*side, BADGE[1], BADGE[2]
    ball('Door badge',(bx,by,bz),(.028,.20,.20),'car_white')
    tube('Door number',[(bx+.030*side, by+dy*side, bz+dz) for dy,dz in DIGIT_TWO],.013,'blue')
```

### 幾何依據

- `Body` 是 `(1.06,1.52,.56)`，半寬 `.53`。圓底扁球中心放在 `x=±.538`、半軸 `.028`，所以外緣在 `.566`、內嵌車身 `.02` —— 讀起來像一片貼上去的黏土圓牌，而不是浮在旁邊的薄片。
- `Body` 的 bevel 是 `.26`，側面幾乎整片是圓角，平面圓盤會翹邊，所以用 `ball`（扁球）而非 `rod`（圓柱）。
- 數字 tube 中心在 `x=±.568`、半徑 `.013`，比圓底外緣再凸 `.015`。
- 嘴角在 `z=.47`（車頭面的平坦帶）中心 `y=-.755`，tube 半徑 `.036` → 埋入車頭 `.041`，露出約四成；嘴心在 `z=.375`、`y=-.791`，正好落在 `Bumper` 的前緣 `-.79`。兩端靠車身、中段靠保險桿，全段貼合。
- 材質沿用既有 `car_white`（同 `Eye white`）與 `blue`（同 `Bumper`），不新增材質槽 —— `merge('Vehicle')` 是依材質分組合併的。

### 為什麼不動輪徑

`WHEEL_RADIUS = .275` 同時出現在兩個地方，且是**行進距離與輪子轉速的換算基準**：

- `assets/blender/hero-world/build.py`：`rod('Tire',(x-.10,y,.28),(x+.10,y,.28),.275,…)`
- `components/landing/hero-world/config.ts`，餵給 `wheelAnimationTime()` = `distanceAtProgress(progress) / (2π × WHEEL_RADIUS) × clipDuration`

改動會連鎖三件事：

1. 兩處數值必須同步，否則輪子轉速與路面前進距離脫鉤（車子會「打滑」）；
2. 輪心現在在 `z=.28`、半徑 `.275`，輪底剛好落在車體本地 `z≈.005`；縮小半徑不同步下移輪心，車就會浮空；
3. 車身高度與相機取景是照現行剪影調的，比例一動就要重新目視驗收。

這是獨立的一輪美術調整，不該跟「補號碼、加粗嘴」這種確定性修補混在同一個 patch。

---

## 重建步驟（下次改 `build.py` 照這個跑）

```bash
# 1. 先看一眼 Cycles 預覽，確認字形、嘴的粗細與零件有沒有浮空
blender -b --python assets/blender/hero-world/build.py -- --preview
#    → assets/blender/hero-world/export/preview.png（不進 public/）

# 2. 產出 v3 上線資產（optimize → render posters → validate）
npm run release:hero-world

# 3. 全站檢查
npm run check

# 4. 視覺 baseline 只能在 macOS 錄
npm run test:visual:trusted -- --update-snapshots
```

`build.py` 與重建產物**必須在同一個 commit**，否則 `buildScriptSha256` 會與實檔不符。

### 目視驗收：浮空幾何抓不到

`npm run validate:hero-world` 只驗三角面預算（40,000）與 glTF 合規，**抓不到脫離車身的零件**。§0.4 的錨定破綻是靠 Cycles 預覽目視才發現的。

改動 `Body`／`Cabin` 尺寸時，務必逐一檢查以車頭／車尾面為錨的零件：`Bumper`、`Headlight`、`Smile`、`Hood stripe`、`Spoiler`、`Mirror`、`Door badge`。

近拍檢視可以用一支臨時腳本從車頭 3/4 角度算圖，比整島預覽看得清楚得多。

---

## 本輪的驗證結果

- `validate:hero-world`：`pass: true`、`failures: []`
- `little-red` 4,924 三角面；全場 17,557（預算 40,000）
- glTF validator warnings：0（environment／little-red／tree 三個模型皆是）
- `buildScriptSha256` 與 `build.py` 一致
