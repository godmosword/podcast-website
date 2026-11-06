# 多多壽司屋：領獎、進展與客人圖片（PR-D1，2026-11-06）

## Context

外部評估指出美術與入門都不錯，但關卡進展、獎勵規則和資訊層級有問題。對照程式後屬實：

| 問題 | 程式裡的原因 |
|---|---|
| 一盤都沒送也能一直領貼紙，連成就貼紙都送得出去 | 自由做的 `finish` 不看盤數（`lib/games/dino-sushi/round.ts`）；保底只看回合結束，池子含 `surprise-*`（`stickers.ts` 的 `collectStickers`） |
| 通關後最大的按鈕仍是重玩同一天 | `DinoSushiResult` 只給 `onReplay`；`begin` 帶回原本的天數 |
| 第 5–8 天看起來要達標，其實打不開 | `isDayPlayable` 限第 4 天，標題卻用同一個鎖頭 |
| 同一位客人有兩種樣子 | 感謝泡泡與貼紙書用 `/characters/*.jpg`（帶背景），排隊與點餐用去背貼紙 |
| 標題頭像 28px、小舞台訂單格 30px；上一位的謝謝留到下一單 | `.dayFace`、`.bubbleItem --cell`；謝謝跟著 `CAPTION_LINGER_MS` 多留 1.8 秒 |

使用者拍板（2026-11-06）：**送過一盤才能結束**、保底不送成就貼紙；**先只顯示可玩的 4 天**；這批**做到統一圖片**，後期玩法另開。這推翻 10-16「貼紙規則不改」的適用範圍（當時談收集節奏，這次修漏洞）。長線成就仍不做。

級別 **L2**（多檔、可見行為），`padding`／動畫有改，加設計審：工程審（Codex）、設計審（Opus）。不生圖、不改 AI 美術圖檔、不動存檔結構、星星規則與共用元件 `GameEndStation`。

## 改動

### 1. 空白回合不再領獎
- `round.ts`：`finish` 只在自由做且 `plates.length > 0` 時生效。
- `DinoSushiKitchen.tsx`：第一盤送出前不顯示「多多吃飽了」；想走用外框的返回。
- `stickers.ts`：保底只從非 `surprise` 群組挑；已拿到的貼紙不收回，規則文字不變。

### 2. 通關後接下一天
- `day-progress.ts` 加純函式 `nextDayAfter(day, days, classicFlags)`：下一天玩得到且還沒通關才回傳。
- `DinoSushiResult`：有下一天時用 `GameEndStation` 現成的 `mainAction`（箭頭大鈕「開始第 N 天」），「再做一輪」變次鈕。沒有下一天維持原樣。
- 第一次通關時標題換成「第 N 天開了！」並念出來（跟貼紙那句併成一句，`speakText` 只留一句等待）；重玩舊的天不這樣說。不多加一列，結算版面不變高。
- `DinoSushiView` 的 `restart`（外框 Enter）跟主鈕走同一天。

### 3. 只顯示可玩的 4 天
- `DinoSushiView` 的 `titleDays` 只取 `isDayPlayable`；拿掉用不到的 `playable` 欄位。`DAY_CARDS`、存檔、`SUSHI_DAY_COUNT` 不動，之後第 5 天做好再放回來。
- 第 2–4 天還沒解開仍維持鎖頭。

### 4. 統一圖片與資訊層級
- 感謝泡泡、貼紙書的客人改用 `customer.sticker`（圓框內 `contain`），刪掉用不到的 `avatar`。結算的新貼紙格跟著改。
- 標題 `.dayRow` 固定一排 4 張，拿掉 8 欄規則、限制最大寬度；頭像 28 → 44px，矮橫向視實測縮小。
- 小舞台訂單格 30 → 34px，以 320×568、375×553、844×390 不溢出為準；放不下就維持 30 並回報。
- 謝謝膠囊改用獨立的 `THANKS_LINGER_MS = 600`，下一單出來約 0.6 秒就收。多多的字卡與朗讀不變。

### 5. 文件
`DESIGN.md` 壽司屋段落改成現況（1–4 天固定配置、閒置 4.5 秒；自動升降沒有接到正常入口）；`TODOS.md`、`CHANGELOG.md`；計畫複製到 `docs/plans/2026-11-06-dino-sushi-progress.md`。

### 審查後加入

- 量到一般手機在瀏覽器裡（393×659 等，舞台 152px）多多只剩約 30px：`--queue-now` 只看舞台寬度。改成也看高度，至少約 58px。這是既有問題，不是這批造成的。
- 第一次通關時，下一天的朋友站到結算的多多旁邊（關聲音也看得出有新東西）。
- 「多多吃飽了」第一盤後彈出來；沒拿到的星星退色；貼紙書圓框內留邊與底部文字。
- 320 寬訂單格維持 30px，34px 會壓到客人貼紙。

## 測試（先寫、看它紅）

- `round.test`：0 盤 `finish` 不變，送一盤後才結束。
- `stickers.test`：保底不出 `surprise-*`；其他都拿到時不送。
- `day-progress.test`：`nextDayAfter` 的第 1–3 天、第 4 天、下一天已通關、舊存檔。
- `useDinoSushiPlay.hint.test`：下一單出來 600ms 後膠囊收掉，字卡仍留 1.8 秒。
- 元件測試：感謝泡泡與貼紙書的客人圖是 `customers/*.webp`。
- e2e：
  - 自由做第一盤前沒有「多多吃飽了」，送一盤才有。
  - 標題只有 4 天，沒有第 5 天（改 `dino-sushi-days.spec`）。
  - 第 1 天通關：標題「第 2 天開了！」、主鈕進第 2 天、次鈕重玩第 1 天、Enter 進第 2 天。第 4 天通關與重玩舊天維持「再做一輪」主鈕。
  - `dino-sushi-result.spec` 七個尺寸書鈕仍在畫面內。

## Verification

`NODE_OPTIONS=--no-experimental-webstorage caffeinate -i npm run check`、`npm run lint`，跑 `e2e/dino-sushi-*.spec.ts`、`e2e/games-lifecycle.spec.ts`。先清 `.next/cache/images`、不帶 `PW_REUSE_SERVER` 重 build，再 `npm run test:visual:trusted -- --update-snapshots=all`，只收壽司屋標題、結算（必要時廚房）的基準並逐張目檢。工程審與設計審通過後分 commit 推 main、刪分支。

## Out of scope（記進 TODOS）

- 後期玩法與難度：等兒童試玩後另開計畫。`difficulty.ts` 的舊檔位是否刪除一起決定。
- 排隊角色的地面、桌面店面上方留白。
- 「點成品換飯、點小盤移除配料」的操作暗示。
- 「一次做對」只看第一次送出，不代表獨立掌握，星星規則不動。
- 長線成就：10-17 決定不做。

## Risks／rollback

- 自由做沒有「結束」鈕時，孩子可能不知道怎麼離開：外框返回仍在，實玩或設計審確認。
- 保底縮小後，集滿其他貼紙的孩子不再每輪拿到新貼紙，這是預期結果。
- 尚未真機與兒童試玩，辨識難度仍是設計判斷。
- 四塊分開 commit，可單獨 revert。
