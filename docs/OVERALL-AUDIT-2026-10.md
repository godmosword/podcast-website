# 車車遊樂園整體稽核（2026-10）

> 唯讀稽核。基準是 `main` `bec252fd`（2026-10-24，`fix(landing): 夜色與嘟嘟表情不再卡在第一段`）。
> 沒有改產品程式，沒有生圖，方塊轉轉維持隱藏、沒有打開它的玩法。
> 標準：[`STYLE-BIBLE.md`](STYLE-BIBLE.md)、[`VISUAL-ACCEPTANCE.md`](VISUAL-ACCEPTANCE.md)、[`ART-AUDIT.md`](ART-AUDIT.md) §14（Kaiyi 2026-10-22 拍板，PR #260 已落地）。
> 這份只記**還在**的問題。#260 已經收掉的項目放在第 2 節，不重複開單。

嚴重程度：

| 級 | 意思 |
|----|------|
| 高 | 孩子主路徑會壞、進度會丟，或同一眼就換成另一套產品 |
| 中 | 會誤導、難點、或和已拍板規則不一致，但還玩得下去 |
| 低 | 邊界、文案、檔案重量、或文件／測試衛生 |

工作量：小＝一個元件或一個函式；中＝跨幾個檔、要補測試；大＝改存檔契約、重排首屏或重做資產。

---

## 1. 怎麼查的

- 程式：三個公開遊戲、著色本、進度存檔、錯誤頁、CI。方塊轉轉只確認 `/games/block-drop` 仍永久轉回 `/games`。
- 畫面：本機 `next dev`（Next.js 16.4.3）。日間用 `localStorage` `cheche:progress.preferences.theme = light`，所以 19:00–06:00 不會自動夜色。夜間另設 `night`。這台機器的當地時間落在睡前時段，夜間截圖同時帶 `data-bedtime=true`。
- 寬度：390×844、1280×800 截圖；另外量了 320×568 與 768×1024 的橫向溢位和可點尺寸。首頁四段用網址 hash 對齊後再量，不是只看第一段。
- 檢查：`npm run lint`、`npm run typecheck`、`npm test`、`npm run audit:production`。本機 Node 是 v22.23.4（`package.json` 要求 `>=24.22.1 <25`，`npm ci` 有 EBADENGINE 警告）。GitHub `quality` 在 Node 24.22.1 上跑。四項在本機都是綠的，見第 3 節。

截圖不進 git，路徑在第 8 節。

---

## 2. PR #260 已經收斂（這次不再列缺陷）

對過目前程式與畫面：

- 故事「開始看故事」、消消樂開始、壽司「給多多吃」是深墨主鈕。著色「開始塗」維持磚紅例外。
- 每集色是六色粉彩墊色，不當按鈕底。
- 遊戲、著色、景點情境卡的硬底邊大多已是 4px、按下 2px。
- 公開遊戲字體走 `--font-stack-body`／`--font-stack-display`。方塊轉轉 HUD 的 `--font-sans` 依 8A 不動。
- 夜間進消消樂、壽司屋、著色本時，`body` 背景是奶油 `rgb(255, 247, 237)`，不是炭黑外框。遊樂園 hub、關於、景點頁夜間仍是暖炭黑 `rgb(20, 19, 18)`，頂欄維持桃色。
- 畫風仍是已拍板的四套。沒有第五套上線畫風。消消樂棋子維持向量黏土，這是 4B，不是新漂移。
- 全站 `button:focus-visible` 有 3px 焦點環（`app/globals.css` 523–527）。播放器進度條自己把 outline 拿掉後有補回自己的環。

---

## 3. CI 與本機檢查

### 3.1 `4c04e75e` 的 `quality` 為什麼紅

Commit `4c04e75e`（2026-10-24，`fix(sync): 同步 PR 不再卡在 required check…`）是 `main` 的祖先。推上 `main` 時 CI run [40040945980](https://github.com/godmosword/podcast-website/actions/runs/40040945980) 失敗。

失敗的只有 **`quality`**。`build-and-public-e2e`、`e2e-child-path`、`sync-validate` 是綠的。`quality` 停在 `npm run audit:production`（`npm audit --omit=dev --audit-level=high`），還沒跑到 lint／typecheck／test。當時生產依賴有 7 個漏洞（2 critical、4 high、1 moderate），擋下的是 high 以上：

| 套件 | 等級 | 公告 |
|------|------|------|
| `next` 16.0.0–16.4.0 | critical | Image Optimization 的 SVG RCE（GHSA-2464-fhr4-w9xw）、Server Actions DoS（GHSA-p3m5-59mp-jv5r）、`use cache` 回傳 typed array 的 RCE（GHSA-673q-mjm6-r5xr） |
| `@sentry/nextjs` 10.0.0-alpha.0–10.75.1 | critical | Tunnel 路由可繞過 middleware（GHSA-mchm-gjx6-7h55） |
| `zod` &lt; 4.6.6 | high | 過大的 constrained collection 可耗盡記憶體（GHSA-mrhx-c7xc-m3w5） |

下一個 `main` commit `d681bee9`（`fix(security): Next.js 升到 16.4.3、zod ≥ 4.6.6`）把這條補上。目前鎖檔 `@sentry/nextjs` 是 10.76.2，已超出當時的有洞範圍。

### 3.2 現在的 `main`

`bec252fd` 的 CI run [40139897322](https://github.com/godmosword/podcast-website/actions/runs/40139897322) 是成功。本機同一套：

| 指令 | 結果 |
|------|------|
| `npm run lint` | 通過（exit 0） |
| `npm run typecheck` | 通過 |
| `npm run audit:production` | `found 0 vulnerabilities` |
| `npm test` | 411 個檔、2928 項通過（約 52 秒） |

`npm test` 預設**不跑** `components/for-parents/PlayMap.test.tsx`（約 53 項）。`vitest.config.ts` 14–31 寫明這支在全庫 runner 裡會讓 `onTaskUpdate` 逾時，要另下 `npm run test:play-map`。全庫還有 `retry: 1`，註解說是偶發的 runner 逾時重跑，失敗不會被洗成綠燈。這是測試衛生，不是這次看到的產品紅燈。見 LOG-08。

---

## 4. 發現

| ID | 領域 | 嚴重度 | 位置 | 問題 | 建議修法 | 工作量 |
|----|------|--------|------|------|----------|--------|
| LOG-01 | 程式 | 中 | `components/games/useCandyMatchPlay.ts:289-314` | 輕鬆模式的閒置提示只在操作時 `armIdle()`。暫停時計時到點會被 `pausedRef` 擋下，恢復後沒有重排。壽司屋在 `useDinoSushiPlay.ts:212-215` 恢復時會重排。孩子暫停去按設定、回來不再點棋盤，可能一直等不到語音和發光提示。手動提示鈕還在。 | 暫停從 true 變 false、人還在局內時重排計時，並補一則對照壽司屋的測試。 | 小 |
| LOG-02 | 程式 | 中 | `lib/gamekit/games/candy-match/adapter.ts:132-143` | `notifyWon` 才回報一局、寫「玩過」。`notifyRetry` 只把狀態設成 `over`，不寫存檔。孩子一直挑戰失敗或沒過關就離開，`gamesPlayed["candy-match"]` 與「玩過消消樂」貼紙不會出現。壽司屋是玩過就記。 | 進局或首局結束（含重試）回報一次不發星的 session；或維持現況並改文案。見決定題 1。 | 小 |
| LOG-03 | 程式 | 中 | `lib/games/dino-sushi/stickers.ts:76-79`、`276`；`components/games/useDinoSushiStickers.ts:73-80` | 貼紙規則寫「每天第一次來玩」。`applyRoundStickers` 呼叫 `factsFromRound` 時沒傳 `firstVisitToday`，引擎那條永遠是 false。實際是標題頁 mount 時無條件 `addDinoSushiStickers(["surprise-daily"])`，這台裝置缺這張就補一張，不是每天。 | 用日期 key 每天發一次，或把規則改成「第一次來」。見決定題 2。 | 中 |
| LOG-04 | 程式 | 中 | `components/games/useDinoSushiStickers.ts:19-48` | `playId` 寫在 `sessionStorage`，模組級 `playState` 也在記憶體共用。兩個分頁同時玩時，結算去重可能把另一頁當成已經結過，少發保底貼紙。 | `beginRound` 用每個分頁自己的 id，不要讀另一頁留下的 key。 | 中 |
| LOG-05 | 程式 | 中 | `lib/gamekit/progress/dino-sushi-stickers.ts:87-98`；`useDinoSushiStickers.ts:91-98` | 存檔 `catch` 時回傳舊檔，但呼叫端仍 `setState(next)`，而 `playState` 已經含這一輪。當下看得到新貼紙，重整後若沒寫進 localStorage 會消失，畫面上沒有「沒存好」。 | 失敗要回傳失敗、不要更新記憶體狀態，結算給一句重試。 | 中 |
| LOG-06 | 程式 | 低 | `components/games/useCandyMatchPlay.ts:389` | 過關勝利音用沒放進 `hornTimersRef` 的 `setTimeout`。`leave()` 清得掉喇叭計時，清不掉這四個音。很快回地圖時，局外還可能聽到尾音。 | 跟 `playHorn` 一樣收進可清除的計時器。 | 小 |
| LOG-07 | 程式 | 低 | `components/coloring/useColoringLeave.ts:22-26` | 畫布上的「換一張／回遊樂園」會先問，有顏色會先收藏。瀏覽器返回與客戶端 `popstate` 不攔。孩子用系統返回，未收藏的顏色可能直接沒了。重新整理才有瀏覽器自己的提示。舊的 IndexedDB `drafts` store 還開著，公開路徑不讀，見 `lib/coloring/storage-db.ts:1-23`。 | 站內返回走同一張離開卡。草稿要不要續塗見決定題 6。 | 中 |
| LOG-08 | 程式 | 低 | `vitest.config.ts:14-31` | 全庫 `retry: 1`，而且親子地圖主測試檔預設排除。`npm test` 全綠不代表景點頁那 53 項剛跑過。 | 把排除原因留在 CI 摘要，或把地圖測試拆成不會卡住 RPC 的幾檔，納回預設。 | 中 |
| ART-01 | 美術 | 中 | `lib/gamekit/react/tutorial-overlay.module.css:95-111` | 三款公開遊戲第一次教學的「開始玩！」仍是黃漸層（`#ffd866`→`#ffa600`），硬底邊 `0 5px 0`、按下 `0 3px 0`。#260 的深墨與 4px／2px 沒蓋到這顆。這是孩子進遊戲後第一顆主鈕。 | `.startBtn` 改 `--cta-solid-*`，陰影改 4px、按下 2px。若要保留黃鈕當教學識別，先登記例外。見決定題 3。 | 小 |
| ART-02 | 美術 | 中 | `components/games/GameChrome.module.css:71`、`103-114` | 遊戲設定的「完成」是天藍／淡紫漸層，不是深墨。對話框還有一層 `0 8px 0` 硬影，比拍板的 4px 厚。 | 主鈕改 `--cta-solid-*`。硬影改 4px，或改回 `--elev-*` 柔影。 | 小 |
| ART-03 | 美術 | 中 | `components/SubscribeForm.module.css:52-67` | 訂閱頁主鈕是品牌橘底、深墨字（實測對比夠），不是聖經的深墨底白字。家長這頁的唯一送出鈕和故事頁主鈕不是同一顆。 | 改綁 `--cta-solid-*`。橘留在品牌標誌與平台列。 | 小 |
| ART-04 | 美術 | 低 | `components/universe/HotspotLayer.tsx:76`；`components/universe/ZoneSheet.tsx:328` | 宇宙地圖故事熱點仍印 Unicode `✦`。#260 的 5B 已把遊戲裡的星星和勾改成圖示，這兩處還沒。 | 改 `Icon`。慶祝粒子 `StarBurst` 若要一起改，見決定題以外的小例外即可，不必重畫。 | 小 |
| ART-05 | 美術 | 低 | `components/games/CandyMatchView.module.css:2-7`、`159` | 消消樂卡面文字仍用糖果紫墨 `#5d4a67`，焦點環也綁這顆色。站上墨色是 `#34302b`。棋子向量色是 4B 允許的舞台色，這顆是卡面 UI 字色。 | 字與焦點環改 `--ink`／站上焦點環。舞台車身色不動。 | 小 |
| UX-01 | 體驗 | 中 | `/games`；`app/games/page.module.css:71-84` | 手機兩欄、桌面三欄。實測 390×844：著色與消消樂卡頂在 y=628，壽司卡頂在 y=820（視口 844），第一屏幾乎看不到第三款。1280×800 三張都在第一屏下緣。海報比例是 1672/941，把卡片壓到很下面。 | 見決定題 4。最小改法是手機把海報變矮，或第三張改全寬接在下面並露出標題。 | 中 |
| UX-02 | 版面 | 中 | `components/landing/LandingSegment.module.css:109-120`、`166-194`；實測 `#segment-bedtime` | 分區主 CTA `white-space: nowrap`，右側嘟嘟槽固定約 80px。320 寬時「數綿羊123．睡前故事」的換段圓鈕（right 248）與嘟嘟槽（left 230）重疊 18px。390 寬字級變大後又重疊 11px。348–360 與 414 這段不重疊。圓鈕仍可點（嘟嘟 `pointer-events: none`），但箭頭會被角色壓到。其他三段的短文案在 320 不重疊。 | 最長那句改短、或窄於 400px 時縮小嘟嘟槽／允許 CTA 略縮字。不要為了箭頭不孤行而讓角色蓋住圓鈕。 | 小 |
| UX-03 | 體驗 | 中 | `components/StoryPlayer.module.css:266-274` | 聽完後「想聊一下」只有 `padding: 8px 12px`，沒有 44px 最小高度。這是家長在結束畫面會點的控制。主鈕「再聽一次」尺寸夠。 | 補 `min-height: 44px`，保持現有焦點環。 | 小 |
| UX-04 | 體驗 | 中 | `components/for-parents/PlayMap.module.css:150-154` | 「更多條件」裡的 `.chipCompact` 最小高度 36px，低於全站 44px。類型列還會橫滑，右緣淡出，390 寬不一定看得出來後面還有。 | chip 改 44px。橫滑列加一個「還有」的箭頭或改換行。 | 小 |
| UX-05 | 體驗 | 低 | `components/games/GameEndStation.tsx:66-69` | 沒過關的標題池有「差一點！再來一次」。另一句是「沒關係，再玩就好」。沒有 Game Over，但「差一點」對 3–5 歲偏催。隨機出現，不是每局都這樣。 | 見決定題 5。 | 小 |
| UX-06 | 體驗 | 低 | `components/SubscribeForm.module.css:45-50` | 同意勾選框是 20×20。整列 label 可點，所以不是唯一熱區，但框本身小於 24px 的目標尺寸。 | 用 44px 的透明熱區包住框，視覺可以維持小勾。 | 小 |
| PERF-01 | 效能 | 中 | `public/stories/ep-29/02.jpg` 與 `14.jpg`（以及 03/15、webp、avif）；`ep-30/05` 與 `11` | 這些檔案位元組完全相同（ep-29 的 02/14 jpg 各 793,341 bytes）。`data/scenes/ep-29.json` 第 2 幕是「宜蘭林場」，第 14 幕是「過了好多年」；第 3 幕與第 15 幕也各說各的。看圖聽故事時，不同句會看到同一張圖。同時單張封面 JPG 仍常在 400KB 以上（`public/hero-home.jpg` 401,724 bytes，`ep-5/01.jpg` 488,285 bytes）。 | 核對這幾幕是不是誤複製。若是，只重抽確認過的幕（先列幕號）。其餘大圖走既有的 WebP／AVIF，並把 JPG fallback 再壓一輪。 | 中 |
| PERF-02 | 效能 | 低 | `public/stories/`、`public/landing/` | 故事圖 jpg 530 張約 148MB、webp 609 張約 77MB、avif 493 張約 53MB，三份都在 repo。首頁直式 fallback `segment-stories-portrait.jpg` 是 309,644 bytes，旁邊已有 webp。播放頁有 `<picture>`，但來源 JPG 仍進版控與 service worker 的體積。 | 確認離線策略還要不要三份。不要的話 JPG 只留需要 fallback 的尺寸。 | 大 |
| PERF-03 | 效能 | 低 | `app/games/page.tsx:110-130`；`components/landing/LandingScrollView.tsx:1` | 遊樂園 hub 卡用 `next/image` 且 `sizes` 正確。Hero 用 `<picture>` 依 media 各一張，沒有寬度 srcset，缺 `sizes` 不會選錯檔。首頁滑動段是 client 元件，hydration 範圍大，這是 Lighthouse 的 TBT 風險，不是這次量到的破圖。metadata、canonical、sitemap、首頁 sr-only `h1`、播放頁 noindex 都在。 | Hero 維持 picture。首頁要不要再拆 client 邊界見決定題以外：現況能玩，拆邊界是大改，這輪不建議動。 | 大 |

沒有標成高的項目。夜間遊戲頁底、主按鈕深墨、方塊轉轉隱藏，都已對上拍板，不再升級。

---

## 5. 優先做這 10 件

1. **ART-01** 教學「開始玩」改深墨、硬底邊 4px／按下 2px。孩子每款遊戲第一次看到的主鈕，改動小。
2. **LOG-03** 把「天天來」做成真的每天，或改規則文案。現在說明和程式相反。
3. **LOG-01** 消消樂暫停結束後重排閒置提示，並補測試。壽司屋已經有這條。
4. **UX-02** 320 與 390 的睡前段，換段圓鈕不要和嘟嘟重疊。
5. **UX-01** 讓手機第一屏能看出遊樂園有三款，壽司屋不要只剩一條邊。
6. **LOG-05、LOG-04** 貼紙寫入失敗要讓孩子知道；兩個分頁不要共用同一個 `playId`。
7. **LOG-02** 決定消消樂「玩過」算不算沒過關的局，再跟壽司屋對齊。
8. **UX-03、UX-04** 播放結束的「想聊一下」、景點篩選 chip，補到至少 44px。
9. **ART-02、ART-03** 設定「完成」和訂閱送出改回深墨；設定對話框的 8px 硬影收成 4px。
10. **PERF-01** 核對 ep-29、ep-30 重複的插圖。看圖聽故事不該用同一張圖講兩句不同的話。壓 JPG 可以跟這次一起排，但不要先重畫。

---

## 6. 請 Kaiyi 決定

下面是會改規則、版面或存檔語意的題。其餘發現可以直接修。

### 1. 消消樂怎樣算「玩過」？

- A. 一進局就記玩過，不因此發星。
- B. 維持現況：只有過關才記。
- C. 失敗也記一局，仍不發星，貼紙文案寫成「有玩過」。

建議 **C**。和壽司屋「有打開並玩完一輪」接近，又不會把失敗算成勝利。

### 2. 「天天來」貼紙是哪一種？

- A. 做成真正的每天第一次，用當地日期。
- B. 維持一生一次，規則改成「第一次來玩」。
- C. 拿掉這張貼紙。

建議 **B**。改文案不用遷移舊存檔。若要每天激勵，再選 A。

### 3. 第一次教學的黃鈕留不留？

- A. 改成和其他主鈕一樣的深墨，硬底邊 4px。
- B. 維持黃鈕，在風格聖經登記「教學唯一例外」。
- C. 拿掉這層教學，直接進標題畫面。

建議 **A**。黃鈕是 #260 漏網的主行動，不是另一套畫風。

### 4. 手機上的遊樂園要先看到海報還是三款遊戲？

- A. 海報變矮，390 寬第一屏能看到三張卡的標題。
- B. 維持大海報，第三張在下一屏。
- C. 手機改成一欄大卡，一屏一款，可以滑。

建議 **A**。海報已經說明這是遊樂園，第三款不該只露出一條。

### 5. 沒過關時可以說「差一點」嗎？

- A. 兩句都改成「再玩一次」「沒關係，再玩就好」。
- B. 維持現在的隨機兩句。
- C. 只留正向句，拿掉催促。

建議 **C**。驗收清單寫明不要 Game Over 式壓力。這句還沒到那裡，但可以更輕。

### 6. 著色本要不要記住沒收藏的畫？

- A. 維持現況：站內按鈕會問，系統返回不攔，舊草稿 store 留著但不讀。
- B. 站內返回也先問；仍不做自動續塗。
- C. 做草稿續塗，並清掉無人讀的舊 store。

建議 **B**。C 會改存檔契約，這輪不必。

---

## 7. 這次沒有當成缺陷的事

- 方塊轉轉的色票、`--font-sans`、5px／8px 硬影。路由仍轉回遊樂園，8A 不動。
- 消消樂向量棋子與黏土封面並存。4B 已承認。
- 夜間頂欄不反轉、播放器近黑、著色磚紅、景點奶油頁底。都是已登記例外。
- 首頁標題用視覺隱藏、畫面靠插畫。這是現行程式註解裡的決定，CTA 在 320–1280 都完整看得到，除了 UX-02 的重疊。
- 全站沒有橫向捲軸。量過首頁、故事、遊樂園、三款遊戲、景點、播放頁。
- 錯誤頁有嘟嘟和「再試一次」，遊戲錯誤頁寫「這個遊戲一時打不開」，沒有把堆疊丟給孩子。

---

## 8. 截圖

產物目錄：`/opt/cursor/artifacts/screenshots/`（52 張，不進 git）。日間鎖定淺色；夜間另拍，且因機器時間在睡前，夜間首頁含睡前遮罩。

| 檔名 | 頁面 |
|------|------|
| `home_light_390.png`、`home_light_1280.png`、`home_light_320.png` | 首頁第一段 |
| `home-bedtime_light_320.png`、`home-bedtime_light_390.png`、`home-bedtime_light_1280.png` | 睡前段（UX-02） |
| `home_night_390.png`、`home_night_1280.png` | 首頁夜間 |
| `stories_light_390.png`、`stories_light_1280.png`、`stories_night_390.png` | 全部故事 |
| `story-ep3_light_390.png`、`story-ep3_light_1280.png`、`story-ep3_night_390.png` | `/story/ep-3` |
| `story-ep32_light_390.png`、`story-ep32_light_1280.png` | `/story/ep-32` |
| `story-play_light_320.png` | `/story/ep-3/play` |
| `games_light_390.png`、`games_light_1280.png`、`games_light_320.png`、`games_night_390.png`、`games_night_1280.png` | 遊樂園 |
| `coloring_light_390.png`、`coloring_light_1280.png`、`coloring_light_320.png`、`coloring_night_390.png` | 繪本塗塗鴉 |
| `candy_light_390.png`、`candy_light_1280.png`、`candy_light_320.png`、`candy_night_390.png`、`candy_night_1280.png` | 車車消消樂 |
| `sushi_light_390.png`、`sushi_light_1280.png`、`sushi_light_320.png`、`sushi_night_390.png`、`sushi_night_1280.png` | 多多壽司屋 |
| `about_light_390.png`、`about_light_1280.png`、`about_night_390.png` | 關於 |
| `play-map_light_390.png`、`play-map_light_1280.png`、`play-map_light_320.png`、`play-map_night_390.png` | 親子景點 |
| `subscribe_light_390.png`、`subscribe_light_1280.png` | 訂閱 |
| `characters_light_390.png`、`characters_light_1280.png` | 角色圖鑑 |
| `adventures_light_390.png`、`adventures_light_1280.png` | 宇宙地圖 |
| `feedback_light_390.png`、`feedback_light_1280.png` | 留言 |

768 寬只量測、沒有另存圖：上述頁面沒有橫向溢位。方塊轉轉沒有截圖。
