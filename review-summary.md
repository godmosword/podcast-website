# Adventure Map 視覺 Polish — 審核摘要

日期：2026-07-08　範圍：/adventures 車車宇宙樂園地圖（黏土風一致性 + 微互動 + 光影微互動）
狀態：CSS-only + 裝飾性 SVG 層，**未動任何 pan/zoom/fly-to 邏輯**，未 commit。

## ⓪、光影微互動（第二輪新增）

> 依據說明：prompt 引用的「Art Bible v1.2 微互動光影規則」**在 repo 中不存在**；
> 現行權威為 `docs/UNIVERSE-ART-BIBLE.md` **v5**。本輪以 v5 §0/§2（柔和均勻光、
> 低對比、暖金互動光）落實 prompt 的具體規格（提亮、160ms、低對比）。

### 島嶼 hover：輕微高光增強 + 整體提亮
- `.tileStack` 上 `brightness(1.04)`，transition **160ms** ease。
- 掛在 tileStack（父層）而非 tileImg，與既有狀態濾鏡（coming 降彩、夜間調暗）
  **相乘疊加而非覆蓋**——沉睡島 hover 仍保持降彩，只是整體微亮。
- 不加 contrast、不加 saturate：純亮度位移是最低對比的提亮方式。

### 島嶼 click：短 bounce + 高光微調
- 開放島：既有 islandBounce（squash & stretch）照舊，新增 `clayFlash` **160ms**
  暖光 flash（peak `brightness(1.07)` @ 40%，結束回歸 `filter: none`，平順歸位）。
- 鎖島果凍：`clayFlashSoft`（peak 僅 1.04）——沉睡島不該被「點亮」。
- flash 掛在 `.tileArt`，與 `.tileStack` 的 transform 動畫分屬不同元素，不搶 animation 槽。
- **接地陰影刻意不動**：Art Bible v5 精神——陰影不隨互動移動，只有本體會彈。
- 按住（`:active`）時 `brightness(1.06)`，與按壓下沉 transform 配對成「壓進光裡」。

### 橋梁 hover 高光（可選項，已做）
- 第一輪的光暈/木面微亮 transition 由 240ms 收斂至 **160ms**，光暈峰值 0.5 → **0.45**（更克制）。

### 時長說明
- 本輪所有**光影**變化均為 160ms（120~180ms 區間內）。
- 兩個既有 **transform** 動畫不在此規範內、維持原值：hover 彈跳 300ms（過衝曲線
  需要行程才讀得出彈性）、islandBounce 520ms（已 commit 的慶祝動畫，孩子熟悉的節奏）。
- 後備 `.island` 模式 landmark 同步套 160ms `brightness(1.04)`。
- reduced-motion：所有 filter transition/animation 全關。

## 一、已實作的微互動

### 1. 島嶼 hover 輕彈跳（`components/universe/ZoneIsland.module.css`）
- 原本 hover 只是平淡的 `scale(1.04)` 線性放大；改為**過衝 bezier**（`cubic-bezier(0.34, 1.56, 0.64, 1)`，與既有 islandBounce/islandJelly 同一支彈簧曲線）＋ `translateY(-5px)` 微抬升——島「輕輕跳一下再坐回去」。
- transform-origin 沿用 inline 的沙岸錨點，島是「坐著」彈，與點擊慶祝的 squash & stretch 同語彙。
- 新增 `:active` 按壓態：黏土被壓扁一點（`scale(1.05, 0.95)` + 下沉 1px），形成 press → release → bounce 的完整觸感節奏，手機端也吃得到。
- hover 效果包在 `@media (hover: hover)` 內，避免手機 tap 後殘留 sticky hover。
- 後備 `.island` 模式（非 diorama tile）同步升級為同一曲線。
- `prefers-reduced-motion`：hover/active transform 與 transition 全關。

### 2. 橋梁 hover 柔和光暈（`MapBridgeLayer.tsx` + `UniverseMap.module.css`）
- 開放橋（黏土棧道）：hover 時淡入一層**暖金光暈**（`#ffe9b3` 寬圓頭低透明描邊，opacity 0 → 0.5，240ms）＋淺木面微亮（`#d9b98a` → `#ecd0a5`）。
- 虛線橋（規劃中）：hover 時 opacity 0.7 → 0.95 的顏色微變。
- **不用 blur filter**——寬圓頭低透明描邊本身就讀作柔光，最省 GPU，手機端零負擔。
- 命中方式：每座橋 svg 內加一條透明寬描邊 path（`pointer-events: stroke`），svg 本身維持 `pointer-events: none`；pointer 事件照常冒泡給 viewport，**pan/zoom 拖曳完全不受影響**（命中層 cursor 維持 grab）。
- hover 效果同樣包在 `@media (hover: hover)`；reduced-motion 下 transition 全關（狀態瞬切）。

### 3. 既有微互動（本次盤點確認，未改動）
- 點擊開放島：islandBounce squash & stretch + 星星迸發（BURST_PARTICLES）
- 點擊鎖島：islandJelly 果凍晃動 + tap 音效
- 開放島待機浮動（islandFloat 3.6s）+ 海面柔光暈（openGlow）
- 狀態轉場：islandRise / islandReveal / islandLightUp

## 二、光影規則（前端速查）

權威規範在 **docs/UNIVERSE-ART-BIBLE.md §0/§2**（v5 黏土世界）；前端層速查如下：

| 項目 | 規則 | 代表值 |
|---|---|---|
| 光源 | 柔和均勻光，無硬方向主光；SVG 後備島高光偏**左上（38%, 30%）** | `clayShade` radial-gradient |
| 高光 | 白 @ 低透明，radial 淡出 | `rgba(255,255,255,0.32) → 0` |
| 接地陰影 | 單一、短、柔、低對比；落在正下方略偏前 | `#6b5a48` @ 0.18 + blur 7 |
| 暖光暈（互動回饋） | 金黃家族，radial/寬描邊淡出 | `#ffe9b3`、`rgba(255,214,140,*)` |
| 木質語彙 | 深木描邊 + 淺木面 | `#8a6438` / `#d9b98a` / `#caa063` |
| 夜間 | 開放島不隨夜色調暗（點燈），光暈轉暖金 | `rgba(255,214,140,0.5)` |

原則：**互動光＝暖金、環境影＝低對比暖棕、絕不用純黑陰影與硬 blur 光**。

## 三、驗證結果

- `npm test`：104 檔 487 測試全過
- `npm run lint`：僅 2 個**既有** warning（`useGameAssetPreload.ts`、`repository-architecture.test.ts`），與本次修改無關（stash 驗證過 clean tree 同樣存在）
- `npm run verify:map-art` / `verify:zone-art`：全過
- pan/zoom：未動 `useMapCamera` / viewport 事件邏輯；新增元素僅 CSS transition（opacity/transform/stroke），無新增常駐動畫、無 blur filter

## 四、還需要手動調整的資產

- 無新資產需求（本次全 CSS/SVG）。既有待辦沿用 Art Bible §資產清單：
  - 各鎖島若日後開放，需補夜間點燈版 PNG（`hasNightArt`）
  - 橋梁若要升級成 PNG 黏土棧道貼圖（目前為 SVG 描邊模擬），需依 §14 管線生成

## 五、後續建議

1. **點亮效果**：hover 光暈語彙可延伸為「聽完整島後橋梁常亮」的進度點燈（暖金 glow 已就位，只差狀態驅動）。
2. **季節/節慶變化**：海面 tile 與島光暈色票可做季節主題（冬季偏冷白光暈、節慶偏粉金）。
3. **橋上通行動畫**：漫遊車（MapRoamerLayer）過橋時橋面板縫可做波浪式微亮，強化「棧道被踩」的黏土感。
4. **音效搭配**：橋 hover 目前無音效（正確——hover 不該出聲）；若日後橋可點擊（fly-to 橋中點看風景），可配 wood-tap 音。
