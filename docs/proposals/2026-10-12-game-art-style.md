# 提案：遊戲畫風要不要統一成黏土／向量

狀態：2026-10-13 更新。方塊轉轉、車車消消樂、繪本塗塗鴉仍維持現狀。多多壽司屋的角色多多改畫——主人明確同意覆寫本檔原本的「維持現狀」。玩法、訂單、星星沒有改。

## 2026-10-13 覆寫（只動多多）

原本這份提案的決定是：不要為了統一畫風去重畫任何上線遊戲。2026-10-13 主人看過封面與局內的對照（封面是黏土，局內是平面向量；張嘴太大、牙又多又黃，和刷牙的訊息相反），明確同意只把多多這一角改到同一套、適合約 5 歲的樣子。

這一輪做的是：

- 局內 SVG：一種暖深描邊、主線約 2.75、細節 1.5、每色三階，加上左上 45° 的體積光
- 站位：390px 寬時整台車（含輪子）不被櫃台裁切；白貼紙邊、兩層接地影、待機浮動、眨眼、吃東西的擠壓；減少動態時停
- 封面腳本的提示詞與輸出（約 2048 寬、WebP q90）。沒有金鑰的那一輪不呼叫生圖，正式封面檔要等有金鑰並人工審過才換
- 角色表元件 `lib/games/dino-sushi/duoduo-sheet.tsx`，規格寫進 `docs/STYLE-BIBLE.md`

沒有改：方塊轉轉、消消樂、著色、壽司的食物圖、店面結構、玩法規則。

如何回退多多：還原該 PR 的 `duoduo-art.tsx`、`duoduo-geometry.ts`、`duoduo-palette.ts`、`duoduo-sheet.tsx`、廚房與結算的站位 CSS，以及風格聖經裡「多多角色規格」那一節。視覺基線若已在 darwin 上重拍，要一起還原。

## 建議

**不要為了「統一」去重畫任何上線遊戲。** 2026-10-12 讀過程式：上線沒有像素風遊戲。

| 遊戲 | 畫面上是什麼 | 要不要改 |
|------|----------------|----------|
| 方塊轉轉 | CSS 圓角色塊，`borderRadius: 7`，`CLAY_BLOCK_COLORS`。adapter 沒有 `fixedUpdate`，所以像素畫布不會出現 | 不要改 |
| 車車消消樂 | 黏土風 SVG，`components/games/CandyMatchPieceArt.tsx` | 不要改 |
| 多多壽司屋 | 黏土語彙的向量 SVG。2026-10-12 當時不改；2026-10-13 只改角色多多（見上方覆寫） | 角色已改；食物圖與店面不要再為了統一去重畫 |
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
