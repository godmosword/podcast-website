# 提案：遊戲畫風要不要統一成黏土／向量

狀態：2026-10-13 更新。方塊轉轉、車車消消樂、繪本塗塗鴉仍維持現狀。多多壽司屋的角色改用和封面同一套的黏土貼紙。玩法、訂單、星星沒有改。

## 2026-10-13 覆寫（只動多多）

原本這份提案的決定是：不要為了統一畫風去重畫任何上線遊戲。主人看過手繪 SVG 改版，認為比原來差，否決那一版。多多現在用已核准的黏土貼紙，和封面是同一套。

這一輪做的是：

- 封面：`public/games/v2/dino-sushi/cover.webp`（主人核准的原檔，1536×1024，不要重畫）
- 局內：`public/games/v2/dino-sushi/duoduo/sticker-*.webp`，對應原來的嘴與表情；進遊戲前先預載
- 站位：390 與 320 寬時整張貼紙（含輪子）在櫃台上方；兩層接地影、待機浮動、吃東西的擠壓。貼紙不眨眼。減少動態時停。牙刷貼紙畫得比較小，按鈕裡放大
- `duoduo-art.tsx` 回到改版前的向量檔，局內畫面不再用它

沒有改：方塊轉轉、消消樂、著色、壽司的食物圖、店面結構、玩法規則。

如何回退多多：還原封面、刪掉 `public/games/v2/dino-sushi/duoduo/`，廚房與結算改回使用 `DuoDuoArt`。

## 建議

**不要為了「統一」去重畫任何上線遊戲。** 2026-10-12 讀過程式：上線沒有像素風遊戲。

| 遊戲 | 畫面上是什麼 | 要不要改 |
|------|----------------|----------|
| 方塊轉轉 | CSS 圓角色塊，`borderRadius: 7`，`CLAY_BLOCK_COLORS`。adapter 沒有 `fixedUpdate`，所以像素畫布不會出現 | 不要改 |
| 車車消消樂 | 黏土風 SVG，`components/games/CandyMatchPieceArt.tsx` | 不要改 |
| 多多壽司屋 | 食物與店面仍是黏土語彙的向量 SVG。角色多多是和封面同一套的黏土貼紙（見上方覆寫） | 食物圖與店面不要再為了統一去重畫 |
| 繪本塗塗鴉 | 黑線稿。這是第三種畫風，和彩色遊戲本來就該分開 | 不要改成黏土 |

`docs/GAMEKIT-ART-BIBLE.md` 裡的 200×360、nearest-neighbor、32 色、8px 點陣字、chiptune ogg，描述的是還沒被這三款接上的 runtime。本輪已在該檔開頭寫明適用範圍。BGM 實際是 `chiptune-bgm.ts` 的 WebAudio 方波，不是 ogg。

若以後還想做的只有「刪掉沒人用的像素 runtime」，那是程式清理，不是畫風統一，應另開一輪，不要跟畫面改動綁在一起。

## 影響範圍

這次若採納「不重畫」：影響範圍是文件（已在風格聖經與 Game Kit 美術聖經寫明）。素材清單為空。

仍留在 repo、但沒有上線遊戲繪製的檔案：

- `lib/gamekit/runtime/palette.ts`（`MASTER_PALETTE`）
- `lib/gamekit/runtime/procedural-sheets.ts`
- `lib/gamekit/runtime/preload.ts`（會呼叫 `getGameSheet`）
- `lib/gamekit/host/GameHost.tsx` 裡 `image-rendering: pixelated` 的 canvas（只有 `fixedUpdate` 存在才渲染）
- `lib/gamekit/runtime/loop.ts`
- `lib/gamekit/runtime/chiptune-bgm.ts`（這個**有**在播，不能當成死碼刪）

`public/games/` 底下是封面與消消樂場景 WebP，沒有像素 sprite sheet。

### 若仍要重畫方塊轉轉（不建議）

會碰到的畫面檔：`BlockDropWell.tsx`、`blockDropTheme.ts`、`BlockDropTitle.module.css`、`BlockDropMap.module.css`、`BlockDropTaskBar.module.css`，以及方塊轉轉的 e2e 視覺基線。色塊上的色盲符號也在 `blockDropTheme.ts`，重畫時要保留「不靠顏色也能分」。

工作量：一款遊戲的局內、標題、地圖、任務列與結算視覺，加上基線更新。玩法引擎（`lib/games/block-drop/`）可以不動，但視覺基線與觸控鍵截圖會全部重拍。

風險：

- 孩子已經認得的方塊顏色與符號會變
- 視覺基線與「窄螢幕鍵仍在畫面內」的 e2e 容易一起紅
- 誤把像素 runtime 的 32 色畫進方塊，會和現在的馬卡龍井底打架
- 刪 `preload.ts`／`procedural-sheets.ts` 若還有測試 import，建置會斷；chiptune 檔刪了會沒聲音

## 如何回退

不重畫就沒有畫面可退。文件若要收回，還原 `docs/GAMEKIT-ART-BIBLE.md` 開頭的適用範圍即可，像素規格正文這輪沒有改寫。

若未來真的重畫了方塊，回退方式是還原該 PR 的元件與 CSS，不要改 `lib/games/block-drop/engine.ts` 這類規則檔。視覺基線要一起還原，否則 e2e 會對不到舊圖。
