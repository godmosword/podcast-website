# 車車遊樂園風格聖經

> 2026-10-12。對象：約 5 歲的孩子（操作）與家長（決定）。
> 標記：【現況】＝這次對過程式；【已拍板】＝Kaiyi 同意且本輪已落地；【例外】＝明文登記、外觀不改；【提案】＝見 `docs/proposals/`，還沒做；【未確認】＝沒查到，不要當事實。

## 文件適用範圍

| 文件 | 管什麼 | 不管什麼 |
|------|--------|----------|
| [`DESIGN.md`](../DESIGN.md) | 全站 UI：字級、圓角、間距、CTA 三階、互動、無障礙底線 | 單款遊戲的方塊色、宇宙島的相機 |
| **本檔** | 跨網站、著色、遊戲的視覺決策：主色角色、畫風、兒童觸控、圖內文字例外 | 不取代 DESIGN 的元件規格 |
| [`GAMEKIT-ART-BIBLE.md`](GAMEKIT-ART-BIBLE.md) | 還沒接到上線遊戲的像素 runtime | 方塊轉轉、消消樂、壽司屋、著色的實際畫面 |
| [`UNIVERSE-ART-BIBLE.md`](UNIVERSE-ART-BIBLE.md) | 宇宙地圖的島、海、天、漫遊者 | 網站 chrome、著色線稿 |
| [`VISUAL-ACCEPTANCE.md`](VISUAL-ACCEPTANCE.md) | 視覺改動可以勾的驗收清單 | 玩法正確性 |

衝突時：上線遊戲的畫風以本檔的「程式確認」為準，不要用 Game Kit 美術聖經的像素規格去改現有畫面。宇宙島仍以 `public/adventures/zones/car-park.png` 為黃金樣本。

## 1. 主色分工【已拍板】

日間三個角色不要混叫「主色」。夜間同名 token 另有覆寫，角色不變。色碼與註解在 `app/globals.css`。

| 角色 | Token | 日間色碼 | 用在哪 |
|------|--------|----------|--------|
| 品牌 | `--landing-brand` | `#FF8C2B` | 頂欄、品牌識別。不是頁面唯一主按鈕 |
| 唯一主按鈕 | `--cta-solid-bg`（等於 `--landing-brand-ink`） | `#3A2410` | 每頁一顆主行動，白字 |
| 互動強調 | `--accent`（日間等於 `--landing-heading`） | `#2A9D8F` | 邊框、底色、裝飾。對白底約 3.3:1，**不能當文字**。文字用 `--accent-ink` `#1F7268` |

### 著色頁磚紅【例外】

著色頁主按鈕用 `--support-from` `#C94A1E`／`--support-to` `#A93A12`（白字；日間對比約 4.69／6.36:1，門檻在 `app/globals.css.contrast.test.ts`）。支持頁尾同一組色。

這組**不改綁**深墨主按鈕，外觀維持現況。只在 DESIGN、本檔與 token 註解登記為例外。

## 2. 畫風【現況，2026-10-12 讀過程式】

上線是三種畫風，彼此不混：

| 表面 | 畫風 | 依據 |
|------|------|------|
| 故事插畫、Landing、宇宙地圖 | 暖色粉彩黏土（霧面、柔光、低對比） | `DESIGN.md`、`UNIVERSE-ART-BIBLE.md` |
| 著色頁 | 純黑粗線稿＋白底 | `scripts/lib/coloring-ai-prompts.ts` |
| 消消樂、壽司屋 | 黏土語彙的向量 SVG | `CandyMatchPieceArt.tsx`、`lib/games/dino-sushi/art.tsx`；壽司屋店面道具在 `shop-art.tsx`，雨棚、木牆、迴轉帶是 `DinoSushiShop.module.css` 的 CSS 漸層。角色多多的線寬、三階色與光向見下方「多多角色規格」 |
| 方塊轉轉 | **不是像素風。** CSS 格子＋圓角色塊，`borderRadius: 7`，色在 `CLAY_BLOCK_COLORS` | `components/games/BlockDropWell.tsx`、`blockDropTheme.ts` |

方塊轉轉的 adapter 沒有 `fixedUpdate`。`GameHost` 的 `image-rendering: pixelated` 畫布只在有 `fixedUpdate` 時出現，所以上線畫面不會走那條路。`lib/gamekit/runtime/palette.ts` 與 `procedural-sheets.ts` 仍在程式裡，沒有上線遊戲在用。像素規格的適用範圍寫在 Game Kit 美術聖經開頭。

遊戲內字：方塊轉轉 HUD 用 `var(--font-sans)`，這個變數沒有定義，所以落到 PingFang TC／微軟正黑體，不是 8px 點陣字。消消樂與壽司屋按鈕寫 `font-family: inherit`，跟著全站 `--font-stack-body`。

音效：著色等短音在 `lib/sfx.ts`（WebAudio，需手勢）。三款 Game Kit 遊戲在 `playing` 時播程序合成 BGM（`chiptune-bgm.ts`），不是 ogg 檔：方塊轉轉是方波，消消樂與壽司屋是三角波旋律。壽司屋另有合成音效（`lib/games/dino-sushi/sfx.ts`，經 Game Kit `voices()`）與店內環境音（`lib/gamekit/runtime/ambience.ts`，走 music 分軌、只在廚房出現）。真機音量【未確認】。

## 2.1 多多角色規格【已拍板，2026-10-13】

對象約 5 歲。局內向量與封面要認得出是同一台車：綠車身、淺綠吻部、橘刺、暖棕粗眉、圓眼、藍側窗、四顆黑輪，沒有手腳。角度預設四分之三、車頭朝右。

實作：`lib/games/dino-sushi/duoduo-palette.ts`、`duoduo-geometry.ts`、`duoduo-art.tsx`。角色表元件：`duoduo-sheet.tsx`（正面、四分之三、側面；開心、好吃、驚訝、辣辣、喜歡、想睡；站好、吃東西、休息）。

### 線

全角色只用一種描邊色，不再混深綠、近黑、橘線。

| 用途 | 值 |
|------|----|
| 描邊色 | `#4A3C2E` |
| 主輪廓 | `2.75`（viewBox 單位） |
| 細節（輪毂、鼻孔以外的小件、愛心邊） | `1.5` |
| 白貼紙邊 | 填色底下的白描邊 `9`，只露出外圈 |
| 眉毛 | 同一描邊色的填色塊，不用更粗的線 |

牙齒是無描邊的小圓白塊。1.5 的線畫在這麼小的牙上會變粗框，所以牙齒只靠白與 `#E4DDD2` 的底影。

### 三階色

每種顏色都是 light（左上）／base（固有色）／shadow（外緣）。

| 部位 | light | base | shadow |
|------|-------|------|--------|
| 車身 | `#B6E878` | `#5CB83A` | `#3A7A28` |
| 吻部 | `#DFF6AE` | `#8FD14F` | `#6AAA34` |
| 背刺 | `#FFC56A` | `#F28A2E` | `#C86A16` |
| 側窗 | `#D7EEFF` | `#4A90D9` | `#2C6AAD` |
| 輪子 | `#6E6862` | `#2C2A28` | `#161412` |
| 輪毂 | `#F7F4EF` | `#C8C2BA` | `#8A847C` |
| 牙齒 | `#FFFFFF` | `#FFFEFB` | `#E4DDD2` |

嘴裡是 `#F0C2B4`（淡陶土粉）。不畫紅色牙齦、不畫大片舌頭。好吃的表情只在咀嚼時露一點 `#F6C6B4` 舌尖。臉頰 `#FF9FB7`。

### 光

- 主光：左上 45°。體積用 `radialGradient`，中心約在形狀的 28% 寬、26% 高。
- 暗面：左下，`#3A2A1C`、不透明度 0.26，疊在同一塊形狀上。
- 邊緣光：右上，白、不透明度約 0.9，只留在輪廓的右上段。
- 接地影兩層，不跟著身體一起浮動：緊的一層偏左下（`rgba(74, 60, 46, 0.28)`），外圍再一層更淡（`0.14`）。

### 嘴與站位

微笑或微張。張嘴大約是臉寬的三分之一，上排最多四顆小圓白牙（笑的時候可以四顆，平常三顆）。驚訝是小圓嘴，沒有牙。

390px 寬的廚房裡，多多的視圖框（168×132）要完整落在雨棚下緣與櫃台上緣之間，四輪看得到，不被櫃台裁掉。視圖底端可以有一點空白沒入迴轉帶，輪子本身留在帶面上方。

### 動作

只動 transform。待機上下約 2px、2.6 秒一循環；大約每 5.4 秒眨一次眼（中間再補一個小眨）。吃東西（張嘴、咀嚼、笑）改成擠壓：先橫向撐開再縱向拉高。`prefers-reduced-motion: reduce`，以及遊戲的 `data-reduced`／`data-paused`，這些動作都停。

## 3. 兒童觸控【已拍板，只調了著色區的間距】

兒童主操作：可點至少 48px，相鄰可點至少 8px。本輪只調間距與尺寸，沒有改配色，也沒有改版面結構。

已落地：

- 著色色票 `ColoringPalette.module.css`：間距由 4px 改為 `--space-2`（8px）。色塊 `min-width`／`min-height` 維持 48px。欄數用 `auto-fit`，排不下就換行（可以兩排或更多），不把色塊縮到 48px 以下。
- 例外（2026-10-12）：畫面 &lt;340px 時色塊收到 44px，間距仍是 8px。一排 6 個 48px 加間距要 328px，320 寬的色票只剩 308px，會排成 5／5／2 三排，直式 320×568 的畫布只剩 140px；收到 44px（6×44＋5×8＝304px）排回兩排。340px 以上不受影響。
- 著色工具列 `ColoringToolbar.module.css` 的 `.bar` 間距同樣改為 8px，工具鈕維持至少 48px。
- 著色畫布階段的抬頭間距由 6px 改為 8px；完成鈕、色票、工具之間的間距至少 8px（字級放大時仍可跟著長大）。

本輪故意沒改（改了會動版面或不是兒童主操作）：

- 寬度 &lt;360px 的遊戲抬頭仍是 44px、間距 4px。`GamePageShell.module.css` 寫明：返回＋三顆工具＋日夜切換在 320px 寬約需要 325px，畫面只剩約 296px，再放大會把日夜鈕擠出去。
- 著色家長面板的筆刷分段間距仍是 4px。那是家長長按後的面板，不是孩子的主色票。
- 棋盤格子、遊戲內鍵在窄螢幕收到 44px 的既有規則沒動。玩法與內容沒改。

## 4. 圖內文字【已拍板】

圖內不得有文字、字母或數字。

**唯一例外：** 小紅賽車車身的數字「2」（定裝照 `public/characters/小紅賽車.jpg`）。角色在畫面中時只畫這一個描線「2」。沒有這台車的畫面仍然不得出現任何數字。

寫在：

- `scripts/lib/coloring-ai-prompts.ts`（線稿模板）
- `scripts/lib/illustrate-core.ts` 的 `CLAY_NEGATIVE`／`CLAY_NEGATIVE_SCENE`（場景另允許隧道公里牌整數，這是既有規則）
- `plans/2026-10-05-coloring-lineart-prompts.md`
- `docs/art-prompts/games-hub-hero-desktop.txt` 與 `games-hub-hero-mobile.txt`（原本就有這句例外）

## 5. 按鈕陰影【現況登記，外觀未改】

一般頁面用 `--elev-*` 柔影。遊戲抬頭與著色區有一道短的硬底邊（色票是 `0 2px 0`，遊戲方鈕是 `0 4px 0`，著色主鈕約 3–8px，各檔不盡相同）。

遊戲／著色的底邊保留為兒童專用語彙、其餘維持柔影。已決定：維持現狀。見 [`proposals/2026-10-12-button-shadows.md`](proposals/2026-10-12-button-shadows.md)。

## 6. 大幅修改的決定

- 著色 12 色粉彩、圖案與色名：已上線（#206，2026-10-12）。見 [`proposals/2026-10-12-coloring-pastel-swatches.md`](proposals/2026-10-12-coloring-pastel-swatches.md)
- 遊戲畫風：其他遊戲維持現狀。多多壽司屋的角色多多於 2026-10-13 改畫（主人明確同意覆寫「維持現狀」）。見 [`proposals/2026-10-12-game-art-style.md`](proposals/2026-10-12-game-art-style.md) 與上方「多多角色規格」
- 按鈕陰影：已決定：維持現狀。上一節

## 7. 仍【未確認】

- 除了多多以外，其他角色的頭身比（沒有量定裝照）。多多的比例以角色表的視圖 `168×132` 為準，頭大約佔車身長邊的一半
- 全站 disabled／loading／hover 的完整清單（著色色票 hover 是 `scale(1.06)`；故事載入是封面 skeleton。其餘沒有逐頁點過）
- BGM 在真機的音量
- `e2e/coloring-visual` 基線圖的畫面內容（本輪沒有打開那些快照來描述）
