# 車車遊樂園 Hero 視覺改版規格 v1 — 橫向 2.5D 視差帶

版本：1.0 · 日期：2026-09-09 · 狀態：**設計規格，尚未實作**。文件中的「應」「必須」「驗收」均表示未來實作要求，不表示目前程式已達成。

把 Hero 從等距（isometric）3D diorama 改為橫向 2.5D 視差帶。本文包含現版問題診斷、小紅賽車角色一致性規範、分層實作規格，以及與現有 repo 的落差核對。

配套文件：[`HERO-WORLD.md`](../HERO-WORLD.md)（現版 v3 架構）、[`INTRO-PORTAL-SPEC.md`](INTRO-PORTAL-SPEC.md)（`/intro` 產品規格）、[`UNIVERSE-ART-BIBLE.md`](../UNIVERSE-ART-BIBLE.md)（地圖與 roamer 美術）。

---

## 0. 交付邊界與現況核對

### 0.1 本輪交付

本輪**只交付規格文件**，不改 `components/`、不改 `public/` 素材、不呼叫任何生圖 API。理由見 §6 阻擋項。

### 0.2 規格與 repo 現況的四項落差

規格撰寫時的假設與 repo 實況有四處不符，實作前必須先吸收，否則會修錯地方：

| # | 規格假設 | Repo 實況 | 影響 |
|---|---|---|---|
| 1 | Hero 的車是生圖產物，根因是 prompt 太短（「`red race car, clay style`」） | Hero 的車是 **Blender 程序化建模**，來源為 [`assets/blender/hero-world/build.py`](../../assets/blender/hero-world/build.py)（`box('Body')`／`ball('Eye')`／`tube('Smile')`…），非 AI 生圖 | **根因判斷需改寫**。Hero 角色偏移的修法是改 `build.py` 幾何，不是 prompt 工程；Do-NOT 清單對 Hero 無效 |
| 2 | 現版車「沒有嘴，只有一根深色橫桿」 | `build.py:292` 有 `tube('Smile', …, .026, 'dark')`，且位於下保險桿（`box('Bumper')` 在 `build.py:291`）上方，弧線中央下凹＝微笑 | 嘴**存在且位置正確**。問題是**線徑 .026 太細、色票 `dark` 太重**，遠看塌成一根橫桿。屬「可讀性」而非「缺件」 |
| 3 | 尾翼「對應 logo 系統中 小紅 的識別特徵」 | 角色 Logo 識別系統**已移除**，程式保存於 tag `archive/character-logo-system`（見 [`TODOS.md`](../../TODOS.md) §角色 Logo 識別系統） | §3.1「與 logo 系統講同一種語言」的論證前提已不存在。橫向構圖的理由改以 §3.2／§3.3／§3.4 承擔即可，結論不變 |
| 4 | 生圖 prompt 缺 Do-NOT 清單是 Hero 的問題 | 真正缺 Do-NOT 的是**地圖 roamer sprite**：[`scripts/generate-roamer-assets.ts`](../../scripts/generate-roamer-assets.ts) 的 `xiao-hong` prompt 寫「a friendly face with two big round eyes and a cheerful smile on the front」，未鎖眼睛位置與車身剪影、無星星天線、無黃條紋（號碼 2 與白條紋原本就有）；negative 只有 `Pixar Cars, Lightning McQueen`，沒有號碼 95／閃電貼紙／低趴車身等項 | §2.4 的對策**該掛在 roamer／character 生圖管線上**，不是 Hero |
| 5 | §2.1 是「既有規格，不可變動」 | 設定書九項中有**三項與既有 canon 牴觸**：定裝照 [`public/characters/小紅賽車.jpg`](../../public/characters/小紅賽車.jpg) 是**擋風玻璃眼**（另有分離的黃色圓大燈）、**白色**雙條紋、**無**車頂天線 | 「眼睛放大燈／加黃條紋／加星星天線」不是回歸規格，而是**推翻既有 canon**。**已裁決：follow 定裝照**，該三項作廢（§2.5） |

### 0.3 逐項核對現版 Hero 車（`build.py` v3 對 canon）

> 基準是**定裝照** `public/characters/小紅賽車.jpg`（§2.5 裁決），不是原稿設定書。

| canon 項目 | `build.py` 實況 | 判定 |
|---|---|---|
| 擋風玻璃大眼 | `ball('Eye',(x,-.323,.92))` 貼在 `box('Windshield',(0,-.274,.90))` 上，含瞳孔與高光 | ✅ 符合（`build.py:281`／`283`／`285`） |
| 分離的黃色圓大燈 | `ball('Headlight',(x*1.6,-.81,.48),…,'yellow')`，與眼睛分屬不同高度與前後位置 | ✅ 符合（`build.py:286`） |
| 下保險桿微笑線 | `tube('Smile')` 在 `build.py:292`，位於 `box('Bumper')`（`:291`）上方，弧線中央下凹 | ⚠️ 位置正確，但線徑 `.026`＋色票 `dark` 過重，遠看塌成橫桿 |
| 白色引擎蓋條紋 | `box('Hood stripe', …, 'ivory')`（`build.py:287`） | ✅ 符合 |
| 白圓底車門號碼「2」 | 無任何號碼幾何 | ❌ 缺 — canon 的主要自有識別 |
| 圓潤高車身 Q 版 | `Body` 1.03×1.65×0.51 ＋ `Cabin` 0.90×0.84×0.57；輪半徑 0.275 | ⚠️ 車身尚可，輪徑相對車高偏大，剪影比 canon 更像越野車 |
| 單一尾翼 | `box('Spoiler')` ＋兩支 `Spoiler stem`（`build.py:293`） | ✅ 符合 |
| 無車頂天線 | 無 | ✅ 符合 |
| 無黃色條紋 | 無 | ✅ 符合 |
| 紅色主色 | `'red'` 色票 | ✅ 符合 |

**結論：Phase 2 的實際範圍只剩三項** — 補車門號碼「2」、微笑線加粗提亮、輪徑對車高的比例收斂。原稿判定的「眼睛違規」不成立。前兩項的 patch 已備妥於 [`assets/blender/hero-world/PHASE2-CANON-ALIGNMENT.md`](../../assets/blender/hero-world/PHASE2-CANON-ALIGNMENT.md)；第三項因與 `components/landing/hero-world/config.ts` 的 `WHEEL_RADIUS` 耦合（輪子轉速換算基準）而另案處理。

## 1. 現版等距圖的問題診斷

### 1.1 構圖

| 問題 | 說明 |
|---|---|
| 畫布過寬 | 主體只佔中央一小塊，左右大量留白。手機端縮放後車車小到無法辨識。 |
| 焦點錯置 | 小紅賽車偏左下、體積偏小，視覺重量輸給紅屋頂與摩天輪。品牌主角不是視覺主角。 |
| 空間分配不均 | 右下大片空草地無內容，左上樹叢擁擠。缺乏文字安全區。 |

### 1.2 細節破綻

- 摩天輪支架與輪圈的連接處未接合，輪圈下緣同時像插入地面又像浮空。
- 光影方向不一致：房子影子偏左下、樹影偏右、摩天輪又是第三個方向。
- 車頭前方的白色橫條壓到保險桿，讀起來像穿模。
- 四輪未確實踩在路面上，與道路虛線的相對位置錯位。

> 核對備註：以上為對 `public/models/hero-world/v3/poster.webp` 的目視診斷。四項若成立，修法都在 `build.py` 的幾何與 `contact shading`，不在前端 CSS。

### 1.3 色彩

整體明度過於平均，草地／道路／房體對比接近，導致沒有主次階層。紅屋頂與紅車身撞色，互相削弱。

**修正方向：** 背景元素統一壓灰降飽和，只保留主角車的飽和度。屋頂改偏橘或磚紅拉開層次。對應 `build.py` 的 `WORLD_COLORS`／`WORLD_ROUGHNESS`。

---

## 2. 小紅賽車角色一致性

### 2.1 角色設定書（canonical — 以定裝照為準）

> **2026-09-09 裁決：必須 follow 定裝照。** 原稿此表把「眼睛放大燈／白＋黃條紋／車頂星星天線」列為不可變動，但那三項與定裝照 [`public/characters/小紅賽車.jpg`](../../public/characters/小紅賽車.jpg) 相反（見 §0.2 #5）。裁決結果是**定裝照為唯一基準**，該三項作廢。下表為現行唯一版本。

| 項目 | 規格 | 來源／理由 |
|---|---|---|
| 眼睛位置 | **擋風玻璃**面板上的大圓眼（黑瞳＋高光） | 定裝照即此配置；同族三變體的 `desc` 已明文鎖死，ep-23／ep-24 已依此出圖 |
| 大燈 | 車頭小圓**黃**大燈，與眼睛**分離並存** | 定裝照。大燈自成一組，杜絕「大燈＝眼睛」的讀法 |
| 嘴巴 | 下保險桿一道柔和微笑線 | 避開水箱罩格柵嘴 |
| 車身比例 | 圓潤高車身 Q 版剪影 | 避開低趴流線跑車輪廓 |
| 主色 | 紅色 | 角色名即「小紅」；紅色本身非侵權點 |
| 條紋 | 引擎蓋**白色**雙條紋 | 定裝照（**無**黃條紋） |
| 車門 | 白圓底號碼「2」 | 自有識別（非麥坤的 95） |
| 車頂 | **無天線** | 定裝照（**無**星星天線） |
| 尾翼 | 單一尾翼 | 自有識別特徵 |
| 飾件 | 藍色保險桿與飾條 | 定裝照 |

**版權區隔改由這五項承擔：** 圓潤高車身剪影、白圓底號碼 2、單一尾翼、與眼睛分離的黃大燈、§2.4 Do-NOT 清單。眼位不再是區隔手段。

### 2.2 現版 Hero 車對 canon 的偏移

基準是定裝照，不是原稿設定書。逐項見 §0.3。

**偏移：**

- **缺車門號碼「2」** — canon 的主要自有識別，`build.py` 完全沒有對應幾何
- **微笑線過細過深** — `tube('Smile')` 線徑 `.026`＋色票 `dark`，遠看塌成一根橫桿
- **輪徑相對車高偏大** — 輪半徑 `.275` 對車身高 `.51`，剪影比 canon 更像越野車

**符合 canon：** 擋風玻璃大眼、分離的黃色圓大燈、白色引擎蓋條紋、單一尾翼、紅色主色、無天線、黏土質感。

**核對修正：** 原稿列的「眼睛跑到擋風玻璃區域 — 最嚴重」與「沒有嘴，只有一根深色橫桿」兩項皆不成立 — 擋風玻璃眼正是 canon；嘴存在且位置正確，只是可讀性衰減。

### 2.3 根因與對策

**Hero（Blender 管線）根因：** `build.py` 的小紅是 2026-09-08 v3 乾淨重建時的自製幾何，當時只照「圓車身、藍窗、大眼」的直覺造型做，**沒有把 §2.1 設定書寫進建模腳本**，也沒有出圖後核對表。與生圖 prompt 無關。

**Roamer／定裝照（生圖管線）根因：** `generate-roamer-assets.ts` 與 `data/characters.json` 的 `desc` 都只描述「big round eyes and a cheerful smile」，未附設定書與 Do-NOT 清單，模型回落到通用卡通車樣板（該樣板訓練資料大量來自《Cars》）。

**對策：**

1. Hero 場景中的車**不重新生成**，直接沿用已清背景的角色 sprite 合成，確保正圖與場景圖是同一台車。現成候選：`public/adventures/roamers/xiao-hong.webp`（29,810 bytes，含 alpha，近側 3/4，已用於地圖 roamer）。
2. 建立角色一致性檢查表（見附錄），每張新素材出圖後逐項核對。
3. 所有生圖 prompt 一律附掛 Do-NOT 清單 — 落點是 `generate-roamer-assets.ts` 的 `NEG_BASE`（`:74`）與 `data/characters.json` 的 `desc`，**不是** `build.py`。
4. `build.py` 的小紅幾何依 §0.3 逐項補齊，並加建模端契約測試。

### 2.4 Do-NOT 清單（每次生圖必附）

- 眼睛不可被大燈取代，大燈也不可當成眼睛 — 兩者必須並存且分離
- 不加車頂天線、不加黃色條紋（canon 沒有，加了就與圖庫不一致）
- 嘴巴不做在水箱罩格柵上
- 不用低趴流線型跑車車身
- 不出現號碼 95 或閃電貼紙
- 整體不得讓人一眼聯想到《Cars》

**驗收：瞇眼測試。** 剪影需明顯不同於麥坤（圓潤高車身＋白圓底號碼 2 ＋單一尾翼），小朋友要能認成「車車遊樂園的賽車」而非麥坤。

### 2.5 canon 裁決（已定案）

**2026-09-09 維護者裁決：必須 follow 定裝照。** 即 §2.5 原列三案中的 **C**：定裝照 `public/characters/小紅賽車.jpg` 是唯一基準，設定書中與它相反的三項（眼睛放大燈、黃色條紋、車頂星星天線）作廢，不重抽任何素材。

裁決理由（本文件核對出的事證）：

1. 定裝照本身是擋風玻璃眼（黃色圓大燈另外分離存在）、白色雙條紋、無天線；
2. 同族三個變體的 `desc` 明文寫死臉部配置，作為對 ep-23／ep-24 已出圖的**連貫性鎖** — `小紅賽車的爸爸`「eyes ONLY on the windshield」、`小紅賽車年幼版`「eyes are NOT headlights on the bumper」、`小紅賽車的爸爸年輕版`「copy reference dad 1:1」；
3. 小紅賽車出現於 ep-3／15／16／18／23／24，改臉會讓同一角色在故事庫中前後不一致 — 兒童繪本產品裡角色恆常性的代價很高；
4. 生圖管線會把 `ref` 定裝照連同文字一起送出，文字與參考圖牴觸時結果不可預期。

#### 落地內容

canon 已寫成單一來源 [`scripts/lib/character-sheet.ts`](../../scripts/lib/character-sheet.ts)，並掛進兩條生圖管線：

- `data/characters.json` 的 `小紅賽車` `desc`（該管線無獨立 negative 欄位，故內嵌）
- `scripts/generate-roamer-assets.ts` 的 `xiao-hong` front／rear（正向掛設定書、負向掛 Do-NOT）

正向鎖定 canon 臉部配置（擋風玻璃大眼、分離黃大燈、下保險桿微笑線）與識別特徵（圓潤高車身、白圓底號碼 2、白色引擎蓋條紋、單一尾翼、藍色飾件）；負向除 §2.4 五項外，另擋下「大燈當眼睛」「車頂天線」「黃色條紋」三種會偏離 canon 的漂移。契約由 [`scripts/lib/character-sheet.test.ts`](../../scripts/lib/character-sheet.test.ts) 守住。

`desc` 只被生圖腳本讀取（`illustrate-core`／`generate-character-portraits`／`generate-landing-art`／roamer），**網站 UI 完全不渲染**，故本次改動零像素影響，只影響下一次生圖 — 而生圖本身仍受付費紅線的逐次確認閘門管制。

## 3. 為什麼改橫向 2.5D

1. **角色識別更強。** 角色識別建立在「剪影 ＋ 單一識別特徵」上，剪影在正側面或近側 3/4 最清楚。等距視角會把車壓成小方塊，尾翼、輪子、臉全擠在一起。
2. **符合兒童認知。** 四五歲小孩認車、畫車的預設就是側視圖。等距是設計師的語彙，不是小孩的。
3. **RWD 可延展。** 等距 diorama 是固定比例的整塊素材，寬螢幕留白、手機看不清，只能換圖。橫向分層帶可以桌機往左右延伸背景層、手機裁掉遠景只留主體，同一組素材通吃。
4. **動畫成本低一個量級。** 橫向分層只需對每層做 `translateX` ＋ 不同速度，純 CSS transform、GPU 合成，天然支援無限循環。等距場景要動起來得做真 3D 或預渲染影片，體積與 LCP 都會痛 — 現版正是為此揹了 R3F／Three、品質分級、`SceneLoader` 生命週期與 poster fallback 一整套機器。

### 3.5 投影法並存的處理

網站已有等距風的宇宙島嶼地圖（`components/universe/`）。兩種投影法並存需要是**刻意的分工**：

- Hero = 橫向，語意是「旅程 / 一直往前開」
- 地圖 = 俯視，語意是「世界 / 全貌」

角色 sprite 統一做**近側 3/4**，此角度在橫向帶中自然，縮小到地圖上當 roamer 也仍可辨識。現有 `xiao-hong.webp` 已是此角度。

---

## 4. 分層規格

### 4.1 層級與捲動速度

由遠到近，速度以路面層為基準 1.0x：

| 層 | 內容 | 速度 | 手機保留 |
|---|---|---|---|
| L0 天空 | 純色或雙色漸層色帶 | 0x | 部分 |
| L1 遠景地標 | 摩天輪、房子、遠樹 | 0.3x | 裁切 |
| L2 中景 | 樹叢、柵欄、路牌 | 0.6x | 保留 |
| L3 路面 | 路面與中線虛線（速度基準） | 1.0x | 保留 |
| L4 主角 | 小紅賽車 | 0x（定點） | 保留 |
| L5 近景 | 草叢、石頭、路緣 | 1.6x | 保留 |

主角固定不動、背景往左捲，即為「一直往前開」的錯覺。

### 4.2 主角層的細部動態

- 上下浮動：`translateY` ±3px，週期約 1.2s，ease-in-out
- 輪子旋轉：獨立元素 `rotate`，線性無限循環
- 車身固定水平位置，永遠不隨背景移動

### 4.3 素材規格

- 每層輸出為**可無縫左右接合的 tile**，寬度 1920px、2x 出圖
- 格式 WebP（含 alpha），天空層可用純 CSS 漸層不出圖
- 主角 sprite 獨立檔案，四輪底緣切齊圖片下緣（roamer 系統的定位錨點依賴此規則）
- 角色 sprite 與地圖 roamer 共用同一份檔案（`public/adventures/roamers/xiao-hong.*`）

> 注意：輪子若要獨立旋轉（§4.2），主角就**不能**是單張合成 sprite — 需拆為「車身」＋「輪子 ×N」。這與「與 roamer 共用同一份檔案」互斥，因為 roamer 用的是整車單張。二選一：**(a)** Hero 用拆件、roamer 用合併，接受兩份檔案；**(b)** Hero 放棄輪子旋轉，只留 §4.2 的浮動，維持單一共用檔案。建議 **(b)**：浮動已足夠傳達行進感，且守住「正圖與場景圖是同一台車」的初衷。

### 4.4 版面與裁切

- Hero 高度：桌機 520–600px，手機 380–420px
- 地平線置於 hero 高度的約 62% 處
- 文字安全區：桌機置於左側約 40% 寬度，該區域內不得有高對比素材
- 手機斷點裁掉 L1，L0 僅留上緣色帶

> 注意：現版 `/intro` 的 `.hero` 是 `height: 100svh; min-height: 480px`（`HeroWorld.module.css`）。改為固定 520–600px 會同時改變 `/intro` 的整頁節奏、`.skip` 的安全區錨定與進站轉場。此為 §5 Phase 3 的獨立決策點。

### 4.5 實作注意

- Hero 圖是 LCP 元素，Next.js `<Image>` 需標 `priority`，並預先指定寬高避免 CLS
- 所有捲動動畫包在 `@media (prefers-reduced-motion: no-preference)` 內，關閉時退回靜態圖
- 只動 `transform`，不動 `left` / `margin`，避免觸發 layout
- 各層加 `will-change: transform`，但層數控制在 6 層以內避免記憶體壓力（§4.1 恰為 6 層，已滿額；不得再加層）

---

## 5. 實作路徑

四個 Phase 可各自獨立驗收；Phase 1 與 2 不互相依賴。

| Phase | 內容 | 主要檔案 | 風險級 | 驗證 |
|---|---|---|---|---|
| **1. 角色設定書入庫** | ✅ **已落地（2026-09-09）**。與 canon 不衝突的部分寫成 SSOT，掛進 roamer prompt 與 `小紅賽車` `desc`；三項推翻 canon 的設定留待裁決（§2.5） | `scripts/lib/character-sheet.ts`、`scripts/generate-roamer-assets.ts`、`data/characters.json` | L2 | `npx vitest run scripts/lib/character-sheet.test.ts`＋`npm run verify:episodes` |
| **2. Hero 車幾何補齊** | 📋 **patch 已備妥待執行** — 見 [`assets/blender/hero-world/PHASE2-CANON-ALIGNMENT.md`](../../assets/blender/hero-world/PHASE2-CANON-ALIGNMENT.md)。補車門白圓底號碼「2」＋微笑線加粗加寬；輪徑刻意不動（與 `config.ts` 的 `WHEEL_RADIUS` 耦合）。**須與 Blender 重建同一輪完成** — manifest 記有 `buildScriptSha256` | `assets/blender/hero-world/build.py` | L3（Protected：改動 v3 發布鏈） | `npm run release:hero-world`（需 Blender CLI）＋ `npm run validate:hero-world` ＋ 視覺 baseline 重錄 |
| **3. 橫向分層帶前端** | 新增 `components/landing/hero-parallax/`，六層 `transform` 視差；`/intro` 改用之或並存 A/B | `components/landing/hero-parallax/*`、`app/intro/` | L3（UI 風險：`transform`／`animation`／`prefers-reduced-motion` 強制 Opus 設計審） | `npm run test:visual:trusted`＋`npm run test:e2e`＋`npm run build` |
| **4. 分層素材產出** | 六層 tile 出圖與接縫驗證 | `public/landing/hero-parallax/` | L3（付費生圖，需逐張人工審） | 人工審 contact sheet；接縫左右對接目檢 |

Phase 3 若成立，現版 R3F／Three 依賴（`HeroScene`／`World`／`Vehicle`／`CameraRig`／`QualityManager`／`SceneLoader`）即可下架，是本改版最大的一筆效能與維護成本回收。**但在 Phase 4 素材到位前不得移除**，否則 `/intro` 無可用畫面。

---

## 6. 阻擋項

| 阻擋 | 說明 |
|---|---|
| **付費生圖紅線** | §4.3 的六層 tile 與任何角色重抽都是付費 API。依 [`AGENT-DOMAIN.md`](../AGENT-DOMAIN.md) 紅線，須先在對話列出張數並取得文字確認，且暫存 → 人工審 contact sheet → 才 `--approve` |
| **無 Blender CLI** | Phase 2 需 `blender -b --python assets/blender/hero-world/build.py`；本容器未安裝，無法產出 GLB 或重錄 poster。且 `public/models/hero-world/v3/manifest.json` 記著 `buildScriptSha256`，單改 `build.py` 會讓它與實檔不符——這正是 v3 乾淨重建要消滅的漂移，故本輪不動 `build.py` |
| **視覺 baseline 為 darwin** | Phase 2／3 動到 `components/` 樣式時，`.githooks/pre-push` 會擋下零 baseline 變更的 push；baseline 只能在 macOS 本機重錄 |
| **§2.5 canon 裁決未定** | 走 A／B 需重抽定裝照並回頭處理 ep-23／ep-24 的連貫性鎖；未裁決前維持 C（零重抽），不動同族三個變體的 `desc` |

---

## 附錄 — 角色一致性檢查表

基準：定裝照 `public/characters/小紅賽車.jpg`（§2.5 裁決）。每張含角色的新素材（生圖或 Blender 出圖）後逐項核對：

- [ ] 大圓眼在**擋風玻璃**面板上（黑瞳＋高光）
- [ ] 車頭有**分離**的黃色圓大燈，未被當成眼睛
- [ ] 下保險桿有微笑線，且遠看仍讀得出是嘴而非橫桿
- [ ] 車身是圓潤高車身 Q 版剪影，輪徑未大到像越野車
- [ ] 車門有白圓底號碼「2」
- [ ] 引擎蓋是**白色**雙條紋（**無**黃條）
- [ ] 車頂**無**天線
- [ ] 單一尾翼
- [ ] 藍色保險桿／飾條
- [ ] 光源方向與同批素材一致
- [ ] 瞇眼測試通過（剪影明顯不同於麥坤）

---

## 修訂紀錄

| 日期 | 說明 |
|---|---|
| 2026-09-09 | **canon 裁決定案：follow 定裝照**（§2.5 的 C 案）。§2.1 改為以定裝照為準並作廢「大燈眼／黃條紋／星星天線」三項；§2.2／§0.3 基準改為 canon，Phase 2 範圍縮為三項；§2.4 與附錄檢查表同步；SSOT 正向加鎖 canon 臉部配置，負向加擋大燈眼／天線／黃條紋 |
| 2026-09-09 | Phase 1 落地：新增 `scripts/lib/character-sheet.ts` SSOT ＋契約測試，掛進 roamer prompt 與 `小紅賽車` `desc`。核對定裝照後新增第 5 項落差（設定書三項與既有 canon 牴觸），§2.5 改寫為「已落地／待裁決」兩段 |
| 2026-09-09 | v1 初版。收錄等距版診斷、角色設定書、橫向 2.5D 分層規格；新增 §0 現況核對（四項落差）、§2.5 跨角色衝突、§4.3 輪子旋轉互斥、§5 實作路徑、§6 阻擋項 |
