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
| 消消樂、壽司屋的食物與店面 | 黏土語彙的向量 SVG | `CandyMatchPieceArt.tsx`、`lib/games/dino-sushi/art.tsx`；壽司屋店面道具在 `shop-art.tsx`，雨棚、木牆、迴轉帶是 `DinoSushiShop.module.css` 的 CSS 漸層。角色多多是和封面同一套的黏土貼紙，見下方「多多」 |
| 方塊轉轉 | **不是像素風。** CSS 格子＋圓角色塊，`borderRadius: 7`，色在 `CLAY_BLOCK_COLORS` | `components/games/BlockDropWell.tsx`、`blockDropTheme.ts` |

方塊轉轉的 adapter 沒有 `fixedUpdate`。`GameHost` 的 `image-rendering: pixelated` 畫布只在有 `fixedUpdate` 時出現，所以上線畫面不會走那條路。`lib/gamekit/runtime/palette.ts` 與 `procedural-sheets.ts` 仍在程式裡，沒有上線遊戲在用。像素規格的適用範圍寫在 Game Kit 美術聖經開頭。

遊戲內字：方塊轉轉 HUD 用 `var(--font-sans)`，這個變數沒有定義，所以落到 PingFang TC／微軟正黑體，不是 8px 點陣字。消消樂與壽司屋按鈕寫 `font-family: inherit`，跟著全站 `--font-stack-body`。

音效：著色等短音在 `lib/sfx.ts`（WebAudio，需手勢）。三款 Game Kit 遊戲在 `playing` 時播程序合成 BGM（`chiptune-bgm.ts`），不是 ogg 檔：方塊轉轉是方波，消消樂與壽司屋是三角波旋律。壽司屋另有合成音效（`lib/games/dino-sushi/sfx.ts`，經 Game Kit `voices()`）與店內環境音（`lib/gamekit/runtime/ambience.ts`，走 music 分軌、只在廚房出現）。真機音量【未確認】。

## 2.1 多多【已拍板，2026-10-13】

對象約 5 歲。主人否決了手繪 SVG 改版。局內多多改用和封面同一套的黏土貼紙：綠車身、淺綠吻部、橘刺、暖棕粗眉、圓眼、藍側窗、四顆黑輪，沒有手腳。角度是四分之三、車頭朝右。

檔案在 `public/games/v2/dino-sushi/duoduo/`，畫布 1024、透明底，角色站在同一條底線。不要改這些圖，也不要重畫。

| 檔案 | 什麼時候用 |
|------|------------|
| `sticker-closed.webp` | 待機（閉著的嘴） |
| `sticker-open.webp`、`sticker-chew.webp` | 張嘴、咀嚼 |
| `sticker-love.webp`、`sticker-yum.webp`、`sticker-sweet.webp`、`sticker-fire.webp`、`sticker-look.webp` | 反應表情（芥末是 fire：頭上蒸氣＋嘴噴火） |
| `sticker-laugh.webp` | 貼紙書的圖示與貼紙（局內廚房不用） |
| `sticker-toothbrush.webp` | 刷牙按鈕 |

對應寫在 `lib/games/dino-sushi/duoduo-sticker.tsx`。張嘴、咀嚼比表情優先。芥末用噴火的 `fire`（`sticker-puff.webp` 已不用）。封面是 `public/games/v2/dino-sushi/cover.webp`（主人核准的原檔）。向量版多多已退役（`duoduo-art.tsx` 已刪，2026-10-15）。

**眉毛以暖棕粗眉為準**：遊戲貼紙與封面都是暖棕粗眉；`public/characters/恐龍車多多.jpg` 定裝照是黑眉版，不拿來校正遊戲貼紙。

**貼紙對齊**：九張貼紙的車身姿勢不一，畫面上每張 `<img>` 掛固定的 `translateY`＋`scale`（常數表在 `duoduo-sticker.tsx`，量法寫在表上），讓輪底都落在畫布 92%（`.figure` 原點與接地影的位置），換表情時不上下沉浮；不做水平平移。fire 的車身刻意偏左、右邊留給火焰，只對齊輪底、不縮放。

390 與 320 寬的廚房裡，整張貼紙（含輪子）落在雨棚下緣與櫃台上緣之間。接地影兩層，不跟著身體浮動。待機上下約 2px、2.6 秒一循環。吃東西（張嘴、咀嚼、笑）改成擠壓。貼紙沒有眨眼。`prefers-reduced-motion: reduce`，以及遊戲的 `data-reduced`／`data-paused`，這些動作都停。牙刷在畫布裡畫得比較小，按鈕裡用 CSS 放大。

來店的六位客人（小紅、安安、阿樂、鈴鈴、東東、香香）在排隊、櫃台旁和點餐泡泡用同一套全身貼紙：`public/games/v2/dino-sushi/customers/<id>.webp`，也是 1024 透明、輪底在 92%。多多站在左邊，所以客人朝左。小紅車門上的「2」不鏡像。標題頁、貼紙書、謝謝膠囊仍用定裝照圓頭像。

## 3. 兒童觸控【已拍板，只調了著色區的間距】

兒童主操作：可點至少 48px，相鄰可點至少 8px。本輪只調間距與尺寸，沒有改配色，也沒有改版面結構。

已落地：

- 著色色票 `ColoringPalette.module.css`：間距由 4px 改為 `--space-2`（8px）。色塊 `min-width`／`min-height` 維持 48px。欄數用 `auto-fit`，排不下就換行（可以兩排或更多），不把色塊縮到 48px 以下。
- 例外（2026-10-12）：畫面 &lt;340px 時色塊收到 44px，間距仍是 8px。一排 6 個 48px 加間距要 328px，320 寬的色票只剩 308px，會排成 5／5／2 三排，直式 320×568 的畫布只剩 140px；收到 44px（6×44＋5×8＝304px）排回兩排。340px 以上不受影響。
- 著色工具列 `ColoringToolbar.module.css` 的 `.bar` 間距同樣改為 8px，工具鈕維持至少 48px。
- 提示手指（`components/ui/TapHand.tsx`，著色本與多多壽司屋共用）：指尖落在目標裡面，手身不得壓到其他可點的目標，伸出不超過按鈕間距。手指不接收點擊，壓到別顆時孩子點手指就會點到底下那顆。
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
- 遊戲畫風：其他遊戲維持現狀。多多壽司屋的角色多多於 2026-10-13 改用和封面同一套的黏土貼紙（主人否決手繪 SVG 改版）。見 [`proposals/2026-10-12-game-art-style.md`](proposals/2026-10-12-game-art-style.md) 與上方「多多」
- 按鈕陰影：已決定：維持現狀。上一節

## 7. 仍【未確認】

- 角色頭身比（沒有量定裝照）
- 全站 disabled／loading／hover 的完整清單（著色色票 hover 是 `scale(1.06)`；故事載入是封面 skeleton。其餘沒有逐頁點過）
- BGM 在真機的音量
- `e2e/coloring-visual` 基線圖的畫面內容（本輪沒有打開那些快照來描述）
