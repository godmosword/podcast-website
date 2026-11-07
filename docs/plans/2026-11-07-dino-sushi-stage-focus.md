# 多多壽司屋：短螢幕把舞台讓給主角，結算主鈕帶出下一位朋友（PR-D3，2026-11-07）

狀態：Approved with changes，已實作（見下方「實作時的調整」）。級別 L2＋UI 風險。

審查：工程審 Grok 4.7（Request changes，已收進本版）；設計審 Opus 5.5（Approve with changes，已收進本版）。Codex `gpt-6-luna` 額度用完缺席，記在 `docs/AGENT-FAILURES.md`。

基準：PR-D2（存檔失敗與最愛）先上 main，本計畫再從新的 main 開分支，兩者都動 `DinoSushiResult.tsx`。

## Goal

1. 一般手機在瀏覽器裡（舞台 152–213px），多多的表情看得清。現況圖框 54–65px，比送餐盤還不醒目。
2. 孩子按下「給多多吃」後，多多的臉和吃的因果都在畫面內。
3. 第一次通關、聲音關掉、還不識字的孩子，在短螢幕看得到下一天的朋友，而且它就在主鈕上。

## 已實測（WebKit，注入暫時 CSS，沒改 repo）

| 畫面 | 舞台高 | 多多圖框：現在 | 原型 |
|---|---:|---:|---:|
| 393×659 | 152 | 56 | 121 |
| 390×664 | 152 | 56 | 121 |
| 375×553 | 152 | 56 | 117 |
| 320×568 | 152 | 60 | 100 |
| 414×736 | 164 | 65 | 121 |

Playwright `.click()` 會自動把元素捲進畫面，量到的捲動量比孩子實際的大（320×568 舞台 y −90..62，`touchscreen.tap` 才是 94px）。量捲動一律用 `touchscreen.tap`。

## Scope

### A. 矮舞台：排隊站到多多右邊（`DinoSushiKitchen.module.css`）

只動點餐模式。條件：舞台高 ≤240px **且**寬 ≥280px。568×320 的 164px 左欄、高舞台都不走這條，既有的兩列排隊、`--duo-max-w: 64px`、≤360 寬的 `86px` 全部不改。

做法不用階梯函數。`@container` 改不了容器自己的變數，但可以對舞台的直接子層重新宣告，子孫會繼承，不用改 DOM：

```css
@container duo-stage (max-height: 240px) and (min-width: 280px) {
  .duoArea[data-mode="order"] > * {
    --duo-w: min(34cqw, 116px, calc(100cqh - var(--counter-h) - 8px));
    --serve-left: calc(var(--duo-left) + var(--duo-w) * 0.22);
  }
  .duoArea[data-mode="order"] .queue {
    left: calc(var(--duo-left) + var(--duo-w) + 4px);
    justify-content: flex-start; /* 靠多多：下一位固定貼著多多，隊伍頭不會越排越遠 */
    gap: 4px;
  }
  .queue, .duoArea[data-mode="order"] .talk {
    --queue-now: 50px;
    --queue-wait: 36px; /* 191–240 也固定，393×720 否則溢出約 30px */
  }
  .seat { max-width: max(48px, calc(var(--duo-w) * 0.64)); }
}
```

`--bite-dx`、`--bite-dy` 在 `.servingSushi` 用 `var(--duo-w)` 與 `var(--serve-left)`，繼承到新值，壽司照樣飛進嘴裡。`.seat` 要放在既有 ≤190 的 `max-width: 48px` 之後才蓋得過。

### B. 吃的時候字卡不蓋住客人

字卡 z4 高於座位 z3，原型截圖都拍在字卡出現之前。393 的「小黃瓜，好好吃！」會蓋 18px，兩料換行會整台蓋住。

- `reactions.ts` 加純函數 `shortCaption(reaction)`：取最後一段（「好好吃！」「甜甜的！」「哈哈！」）；`look`（缺料句）不裁，孩子要看缺什麼。
- 字卡同時畫完整句與短句，`@container (max-height: 240px) and (min-width: 280px)` 切換顯示。朗讀與 `setMessage` 仍用完整句。
- 謝謝膠囊「只留頭像」的規則從 ≤190 擴到 ≤240。

### C. 短手機局內抬頭單列（`GamePageShell.module.css`）

消消樂、小橘、方塊已有 G-H1 單列抬頭，壽司屋沒有，「多多壽司屋」這列佔 24px、間距 8px。

```css
@media (max-width: 430px) and (max-height: 700px) and (orientation: portrait) {
  .main[data-game-id="dino-sushi"]:has([data-screen="kitchen"], [data-screen="result"]) .playHeader { /* 同 G-H1 */ }
  .main[data-game-id="dino-sushi"]:has([data-screen="kitchen"], [data-screen="result"]) .playTitle { /* 同 G-H1 */ }
}
```

畫面高 >700px 的手機不變。矮螢幕（高 ≤600）多多上限改 100px。設計審估算的效果：

| 畫面 | 方案 | 選飯後下捲 | 送出上捲 | 加料時頭被蓋 |
|---|---|---:|---:|---:|
| 375×553 | 不收列 | 95 | 71 | 約 49，眼睛被蓋 |
| 375×553 | 收列＋上限 100 | 63 | 0 | 約 6 |
| 320×568 | 不收列 | 94 | 64 | 約 25 |
| 320×568 | 收列 | 62 | 0 | 約 1 |

### D. 送出時讓多多的臉進畫面（`useRevealTray.ts`）

- 純函數 `stageRevealScroll({ duoTop, headerBottom })`：多多可見頭頂（圖框頂＋10%）被抬頭蓋超過 8px 才回傳負值。
- `eating` 變 true 的同一幀開始捲，不延遲：盤子滑 450ms 就張嘴，延遲會錯過這段因果。`look` 不捲，孩子要補料。
- **取消還沒執行的托盤下捲 timer**：選飯後過場還沒跑完就按送出，timer 會在吃的時候往下捲，把多多捲走。hook 收 `eating`，true 時清掉。
- **暫停後繼續要補捲**：平滑捲到一半按暫停會釘在原地，繼續時若還在吃且臉仍被蓋，再捲一次。
- 減少動態用 `instant`。平滑捲動若 450ms 內到不了，改 rAF 280ms ease-out。

### E. 結算一屏放得下（`DinoSushiResult.tsx`）

結算層 `inset: 0`、廚房還掛在底下，結算位置取決於 `scrollY`。捲回舞台後結算會整個往下約 64–71px，「放進貼紙書」會超出 320×568。

結算出現那一幀 `instant` 捲一次：書鈕底當目標、標題頂當上限（重用 `trayRevealScroll`）。沒拿滿星星的小籤、存檔提示都要算進去。

### F. 結算主鈕帶出下一位朋友

`GameEndStation` 的 `mainAction` 加選填 `thumbnail?: { src: string; flip?: boolean }`。沒給就和現在一模一樣。不復用 `.nextThumb`（那是次鈕尺寸、`overflow: hidden`、`cover`），另寫規則：

| 項目 | 值 |
|---|---|
| 外圈 | 88px、`--cta-solid-bg`、`0 4px 0 #2a180c`，不變 |
| 內圈 | 72px 圓，`#ffe58a`：安安白車身在奶油底、輪胎在深墨底都會融掉（ΔE<25 佔 41%／26%），這色都約 1% |
| 貼紙 | 66px、`object-fit: contain`、`translateY(-5%)` |
| 方向 | 安安、鈴鈴車頭朝左，`scaleX(-1)`，朝向箭頭；多多不翻 |
| 徽章 | 外徑 38px（含 3px 白框）、`right: -2px; bottom: -2px`、深墨底 |
| 箭頭 | 白色 `IconArrowRight` 22px，不用 16px chevron（會和 `<` 成對，像翻頁） |

- `DinoSushiResult`：`nextDay !== null` 就傳；無障礙名稱仍是「開始第 N 天」，圖 `alt=""`。
- 朝向資料放 `DAY_CARDS`（`faceFlip`），先目視確認四張的方向。
- 下一天是多多時不畫 `.resultGuest`，高螢幕才不會同時三隻多多。
- DESIGN.md 原本寫「不動共用 `GameEndStation`」，這次是只增不改的選填欄位，文件同步。

## 測試（先寫、看它紅）

- 單元：`stageRevealScroll`；`shortCaption`（缺料句不裁）；`GameEndStation` 有無 `thumbnail`；timer 取消與暫停補捲（`useRevealTray` hook 測試）。
- `e2e/dino-sushi-kitchen.spec.ts`：
  - 刪掉 `duo.top >= queue.bottom - 12`（並排後不成立），改成排隊、多多、泡泡、小喇叭、抬頭互不重疊（沿用 `layout()`）。
  - 尺寸表加 393×659、375×553、393×720。門檻：393、390、414、430 ≥110；375×553 ≥100；320×568 ≥90。
  - `seatH >= duoH * 0.5` 維持。
  - 新增：`react` 階段用「鮪魚沙拉」單斷言字卡不蓋座位（393×659、375×553、320×568）。
  - 新增：t=450ms（`phase=open`）取樣，多多頭頂低於抬頭底；缺料不捲回、托盤還在畫面內。手快送出（托盤 timer 未到）也一樣。全程 `touchscreen.tap`。
  - 舞台 >240px（390×844、844×390、1280×800、568×320）多多寬度與現在相同。
- `e2e/dino-sushi-next-day.spec.ts`：
  - 主鈕、次鈕、書鈕不捲動就在畫面內（拿掉 `scrollIntoViewIfNeeded`），全程 `touchscreen.tap`，含沒拿滿星星。「回遊樂園」可以捲。
  - 320×568、393×659、375×553 第一次通關，主鈕裡看得到朋友；第 3→4 天是多多且不翻。
- `e2e/visual.spec.ts`：新增 393×659 廚房、393×659 第一次通關結算；既有基準（390×844、844×390、1280 都不走新規則）應不變。

## 實作時的調整

- 實際舞台高與設計審的估算不同：393×659、375×553、320×568 收成單列抬頭後舞台仍是 152px（這些尺寸由 `--duo-h` 下限決定），省下的 32px 用在少捲動。393×720 也是 154px，真正落在 191–240 的只有 421–559 寬的手機（192px）。
- WebKit 實測：375×553 選飯下捲 75、送出上捲 25；320×568 下捲 54、送出不用捲；393×659 都不用捲。張嘴那一刻多多頭頂都在抬頭下方。
- 430×739（舞台 192）泡泡兩列會壓到疊盤，這是既有問題。泡泡收成一列、疊盤收緊的門檻從 190 改成 200；店名和燈籠的門檻仍是 190。
- 一顆星結算在最矮的手機放不下：≤640 高再收起彩紙，兩條星星提示只留最接近的那條。
- 實作設計審：152px 舞台的謝謝頭像被切掉 4.5–8.5px、還蓋住金盤（既有問題），舞台 ≤180 不出謝謝，座位上已有同一位朋友和愛心。
- 375×553 加料時多多圖框頂部被蓋約 15px（眉毛看不到、眼睛還在），比原本估的 1–6px 多。這段孩子看泡泡與托盤，接受。
- 實作工程審（Grok 4.7，Codex 額度用完）：缺料字卡的門檻維持 190，不跟泡泡的 200 綁在一起；結算捲動的底邊要算到存檔提示；「選完飯馬上送出」改在張嘴時取樣。
- 結算 390×844 的既有基準用第 4 天，沒有下一天，所以不受主鈕影響；既有基準全部不變。

## Out of scope

- **主鈕閒置提示（手指＋光環）**：設計審建議加，我先不做。朋友臉和 38px 箭頭已提高辨識，要不要再加提示看 `GAME_PHYSICAL_DEVICE_QA.md`「進展引導」的試玩記錄。
- 吃飯動畫 2.15 秒：等多多變大後的試玩再決定。
- 料位 ✕ 暗示、桌面排隊的等候位置（TODOS 已有）。
- 後期玩法與 `difficulty.ts`。
- 不生圖、不改 AI 美術圖檔、不動存檔。

## Task DAG

T1 測試（紅）→ T2 舞台（A、B）→ T3 抬頭（C）→ T4 捲動（D、E）→ T5 主鈕（F，可與 T2–T4 並行）→ T6 WebKit 量測與視覺基準 → T7 文件（`DESIGN.md`、`GAME_PHYSICAL_DEVICE_QA.md` 的「約 58px」、`TODOS.md`、`CHANGELOG.md`、複製到 `docs/plans/2026-11-07-dino-sushi-stage-focus.md`）。

## Verification

`NODE_OPTIONS=--no-experimental-webstorage caffeinate -i npm run check`、`npm run lint`；`npx playwright test e2e/dino-sushi-*.spec.ts e2e/games-lifecycle.spec.ts --project=chromium`；WebKit 另跑一次 393×659、390×664、375×553、320×568、414×736、393×720 的量測腳本（Playwright webkit project 只含 site-nav）；`npm run test:visual:trusted` 確認既有基準不變，新基準逐張目檢。實作後跑一次設計審。真機與兒童理解仍待 `GAME_PHYSICAL_DEVICE_QA.md`。

## Risks／rollback

- `.main` 是 `100dvh`，Safari 工具列收起可能讓舞台跨過 240px，排隊瞬移。併入 QA 第 20 項看，不擋這次。
- 舞台 241px 算出約 106px、240px 是 116px，只差 10px，可接受；量 430×739、414×896。
- 加料階段（SE 尺寸）排隊只露輪子，頭被蓋約 15px（眉毛看不到、眼睛還在）：孩子這時看泡泡與托盤，接受。
- 主鈕內圈 `#ffe58a` 可能和金盤混淆：目檢；`#ffb558` 不是好退路（鈴鈴、多多融掉 21%／31%）。
- 上下捲仍存在時覺得晃：退路是繼續收版面（第 C 段），不是「只在第一單捲」，第 2 單起托盤或臉會看不到。
- Rollback：A＋B、C、D＋E、F 各自獨立 commit，可個別 revert。
