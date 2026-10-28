# 小橘特快車美術／UX 第二批

> 狀態：2026-10-28 核准並實作完（PR #267，草稿），等 Mac 重錄視覺基準。交接見文末。起點 `main` @ `2c6f340`。
> 來源：`TODOS.md`「小橘特快車美術／UX 審查的後續」、接手時看 10/27 視覺基準找到的三項。編號對齊儀表板（B1–B19）。
> 已拍板（2026-10-28）：B1 選 A、B5 選 A、B6 選 A。

## Goal

讓 3–7 歲的孩子不用識字就看得懂前窗提示、按得到每個鈕，結算只有一套星星；順手收掉審查列的小美術問題。不改獎章規則與存檔形狀。

## Scope / Out of scope

**In（13 項）**

| 編號 | 項目 | 做法摘要 |
| --- | --- | --- |
| B2 | 前窗提示只有字 | 提示改圖示在前；同一件事只念一次；速限牌改成「三格亮幾格」 |
| B3 | 進站時前窗被蓋住 | 指差確認鈕改成貼右邊窗柱的 56px 手勢圓鈕；前窗中間 30%–70% 留空 |
| B4 | 小螢幕要捲才按得到車門 | 先量再定數字；桿高下限 256px；停車目標條縮成一列 |
| B5 | 結算兩套星（拍板 A） | 每站等級改成跟停車目標條同一塊的綠／黃色塊；星星只留整趟獎章 |
| B6 | 慢慢看的煞車（拍板 A） | 慢慢看的煞車桿只排三格：鬆、停、緊急；拉「停」也會停在綠區 |
| B7 | 速度表紅帶太大、速度旗太小 | 紅帶只畫旗子後面一小段；旗子放大 |
| B8 | 難度卡沒有圖示 | 烏龜、動力桿、站長帽三個圖示，加 1–3 個難度小點 |
| B9 | 司機說明框像第四張卡 | 收進「自己開」卡片裡，不再另外一個框 |
| B11 | 乘客上車只變半透明 | 一位一位往左下滑出（約 600ms），原位留一個勾 |
| B12 | 月台出現「色塊」 | 這位乘客卡上不印名字，讀屏念「一位朋友」 |
| B13 | 停車柱和線柱疊成雙桿 | 停車柱前後 12 公尺不畫門形線柱 |
| B14 | 寬畫面鄰線鋼軌變形 | 鋼軌改成近粗遠細的面 |
| B16 | 「指差確認 1/9」 | 改成「指差確認 1 次」，0 次就不列 |

**審查後的兩個調整，請你一起看**

- B5 的字：設計審提醒停在黃區其實算停好了，「差一點」聽起來像失敗。改成綠區「剛剛好」、黃區「停到了」。你要維持「剛好／差一點」就說一聲。
- B6 順手修一個現有的問題：慢慢看的爬行速度（`LOOK_CREEP` 0.08）剛好等於「算停住」的門檻，進站後一拉煞車，車就停在區間最前面（黃區），完美星就沒了。改成爬行 0.10，拉「停」時車會慢慢滑進綠區才停；拉「緊急」仍是馬上停。這是本批唯一動到的手感數字。

**Out**

- B1 封面與小橘貼紙：只在本文最後列 prompt 與張數，等你確認才生圖。這個環境沒有 `OPENAI_API_KEY`，生圖要在你的 Mac 跑，或在環境設定加金鑰。
- B10（結算放小橘）、B15（桌機儀表放大徽章）：等 B1 的貼紙，下一批做。
- B18、B19（設計審新找到，列進儀表板）：
  - B18 對向列車的白車身配藍腰帶，接近真實車種塗裝。等你選；選換色的話只改一個顏色常數，可以併進本批。
  - B19 號誌與月台還沒進畫面就出指差確認題。要補畫號誌，放下一批。
- 獎章規則、星星 bit、存檔形狀、`GameSessionResult`；除了 `LOOK_CREEP` 以外的速度與停車數字。
- 車內廣播錄音、實機試聽、service worker、新依賴。

## Task DAG

一個分支（`claude/orange-express-art-batch2`，PR #267）、每項一個 commit。視覺基準只要你在 Mac 重錄一次。同一檔案不並行。

- [ ] **T1 停車等級與結算文字**（B5、B16，L1）— 依賴：無
  - `copy.ts`：`GRADE_TEXT` 改「剛剛好，停在綠區」「停到了，在黃區」（中間有逗號，320 寬在 `keep-all` 下才換得了行）；新增 `GRADE_WORD`（剛剛好／停到了）；`pointsResultText(done)` 改「指差確認 N 次」。
  - `OrangeExpressStopBar.tsx`：拿掉 ★★★／★★。
  - `OrangeExpressResult.tsx`：站卡＝色塊＋站名＋等級字，色塊跟停車目標條同一塊（全彩，綠色帶白斜紋，抽成共用 class）；不出現星號。指差確認只在 `pointsDone > 0` 時列。
  - `orange-express.module.css`：站卡色塊；更新 `.stopWords` 附近提到星星的註解。
  - `types.ts` 的 `StopGrade` 註解。設計文件第 4 節只在 T10 改，這裡不重複。
  - e2e：`orange-express.spec.ts` 第 27、100、106 行的「三顆星／兩顆星」字串改新字；結算沒有 ★。
  - 用 `fontTools` 查 `app/fonts/huninn-subset.woff2` 有沒有新字（剛、到…）。缺字而這裡沒有 `/tmp/huninn.ttf` 時，**不合併**，先請你在 Mac 跑 `npm run font:subset`。
- [ ] **T2 慢慢看煞車三格**（B6，L2）— 依賴：無
  - `reducer.ts`：
    - `brakeNotches(level)`：慢慢看 `[0, 3, 5]`，其他 `[0, 1, 2, 3, 4, 5]`。
    - `snapBrake(level, n)`：吸到最近的允許格，等距時取小的（B4 吸到 B3，不會誤拉緊急）。`step` 的 `set-brake` 與 `withHook` 都走它。
    - `stepBrake(level, from, dir)`：鍵盤 ←→ 照允許格一格一格走。
    - `LOOK_CREEP` 0.08 → 0.10，必須大於 `stopEpsilon("look")`（0.08）；加單元測試鎖住這個關係。
  - `OrangeExpressCab.tsx`：`Lever` 改收 `notches` 陣列。
    - 位置一律用陣列索引：`--at`、`notchFromY`、`sliderKeyTarget` 都換成索引。
    - `aria-valuemin=0`、`aria-valuemax=notches.length-1`、`aria-valuenow=索引`；`aria-valuetext` 照舊說格名與字。
    - `data-notch` 保留真正的格號（e2e 第 81、570 行靠它找格子）。
    - 慢慢看的煞車格上寫「鬆／停／緊急」，不寫 B3。
  - `OrangeExpressView.tsx`：←→ 用 `stepBrake`。
  - 單元測試：吸附（含等距）、`stepBrake`、慢慢看在 0.30 拉「停」最後停在綠區、拉緊急馬上停。
  - e2e：慢慢看煞車桿只有三格、每格 ≥48px，←→ 依序是鬆、停、緊急。
- [ ] **T3 前窗提示看圖就懂**（B2，L2）— 依賴：無
  - 新檔 `components/games/OrangeExpressGlyphs.tsx`：鐵橋（用喇叭鈕同一個號角圖示，孩子才知道要按哪顆）、對向列車、隧道三個提示圖示（向量黏土：圓角、左上高光、下緣暗帶）；`SignGlyph` 搬進來。
  - 速限牌：牌上永遠三個格子，亮幾格就是多快（沒亮的只描邊），不會像暫停鍵 ⏸。純函式 `signCells(bars)` 給前窗畫布與 `SignGlyph` 共用。
  - `OrangeExpressWindshield.tsx`：每種提示都有 32px 圖示在前，字在後。
  - 朗讀：純函式 `nextSpeech(state, spoken, numbers)`（放 `notice.ts`）挑出要念的那一句，`OrangeExpressView.tsx` 照它念。規則：
    - 去重 key 是「站號:種類:位置」（例如 `1:sign:0.42`），每站一個 Set，不用文字（速度表數字開關會改字）。
    - 速限牌提示和「速限牌，確認！」是同一件事，有指差確認時只念要喊的那句。
    - 「叭叭！跟鐵橋打招呼了」不念，喇叭聲本身就是回饋。
    - 車內廣播「下一站」排在最前面：叮咚到念完之前不念提示（`announce.ts` 回報預估念完的時間，用 `speech.ts` 既有的時長估算）。
    - 輪到某句時，如果那個提示已經消失，就丟掉不念。
    - 開關跟車內廣播一樣（音效、「念出來」、遊戲音量）。
  - `GameChrome.tsx` 的說明改「車內廣播和前窗提示用聲音念出來；關掉後音效照常。」
  - 單元測試：`nextSpeech` 的去重（A→B→A 不重念）、合併、丟棄過期、廣播期間不念。
- [ ] **T4 進站不蓋前窗**（B3、B12，L2）— 依賴：T3（同檔 `OrangeExpressWindshield.tsx`）
  - 指差確認鈕：56px 圓形手勢鈕，貼右邊窗柱內側（right 約 8%），下面一行兩三個字的小標（號誌／速限牌／月台），整顆最寬 20% 前窗寬。要喊的整句改由朗讀與讀屏說。出現時輕輕跳一下，減少動態（系統或遊戲內設定）時不跳。
  - 乘客卡：頭像 40px，卡片右緣不超過前窗 40%。
  - `routes.ts`／`types.ts`：`Passenger` 加 `showName?: boolean`；第四位乘客名字改「一位朋友」、`showName: false`，卡上只留頭像（頭像本來就有眼睛和笑臉）。
  - e2e（390×844）：開車與進站時，停車目標條以下、前窗中間 30%–70% 那一條沒有被任何提示或按鈕蓋到；任何狀態下提示、指差確認鈕、乘客卡、停車目標條彼此不重疊；頁面找不到「色塊」。
- [ ] **T5 小螢幕不用捲**（B4，L2）— 依賴：T4（前窗疊層的大小在 T4 定）
  - 先量：在這個環境用 Playwright 量 375×553、320×568 目前每一塊的高度與要捲多少，把數字寫進 PR，再定 CSS。
  - 方向：`(orientation: portrait) and (max-height: 600px)` 時桿高下限 256px（煞車六格每格 ≥40px）、前窗下限再降、駕駛台內距收一階、中間那格（速度表＋燈）跟著縮，不然整列不會變矮。停車目標條縮成一列。新規則要寫在 `@supports (height: 1dvh)` 那段後面，不然會被蓋掉。
  - 量完若前窗內放不下停車目標條＋指差確認鈕，就把指差確認鈕移到駕駛台下排（喇叭與車門之間）。
  - e2e：375×553、320×568 不捲就看得到整顆車門；煞車每格 ≥40px；前窗疊層彼此不重疊（844×390 也測）。743px 以上高度的既有量測不變。
- [ ] **T6 速度表**（B7，L2）— 依賴：無
  - `gauge.ts`：紅帶 `[旗, 旗＋0.12]`，再往後是淡灰的「用不到」帶（新 `rest` 帶）。指針本來就開不過旗子。
  - `OrangeExpressGauge.tsx`：速度旗放大約一倍、深色描邊，整面旗留在 200×200 viewBox 裡（單元測試檢查旗尖座標）。
- [ ] **T7 標題**（B8、B9，L2）— 依賴：T3（圖示放同一個新檔）
  - 三張難度卡左側 44px 圖示：慢慢看是烏龜，自己開是動力桿，小站長是橘色帽帶加小橘徽記的站長帽（橘白配色，不像警帽）；圖示下 1–3 個難度小點。
  - 拿掉虛線 `driverNote`。司機說明改成「自己開」卡片裡的 `<span>`（按鈕裡不能放 `<p>`），`data-testid="orange-express-driver-note"` 跟著搬。
- [ ] **T8 前窗美術**（B13、B14，L2）— 依賴：T3（同檔 `windshield.ts`）
  - 純函式 `portalVisible(portalWorld, postWorld)`：停車柱前後 12 公尺內不畫門形線柱。單元測試掃過每個規則組的每一站。
  - `drawTrack`：鋼軌與亮線都改成世界寬度的梯形（近粗遠細，最細 1px）。隧道裡的兩次呼叫跟著改；鄰線不截斷。
- [ ] **T9 乘客上車**（B11，L2）— 依賴：T4（同一塊乘客卡）
  - 上車的乘客一位一位往左下滑出並淡出（約 600ms），原位留一個綠勾。
  - 系統減少動態或遊戲內 `data-reduced="true"` 時不滑，直接換勾。
- [ ] **T10 文件**（L1）— 依賴：T1–T9
  - `docs/SHINKANSEN-SIM-DESIGN.md`：第 3 節（慢慢看煞車）、第 4 節（等級字與色塊）同步，新增第 17 節「美術與 UX 第二批」。
  - `CHANGELOG.md`；`TODOS.md` 打勾附 hash、列出要重錄的基準。
- [ ] **T11 驗證**（shell）— 依賴：T1–T10，見下一節。
- [ ] **T12 實作後審查** — 依賴：T11
  - 工程審：diff＋只准讀的檔案清單。
  - Opus 設計審：在這個環境用 Linux Chromium 截 390×844、375×553、320×568、844×390、1280×800 的開車、進站、停好、結算畫面（只給審查看，不當基準）。

## Files likely touched

- `lib/games/orange-express/`：`copy.ts`、`types.ts`、`reducer.ts`、`routes.ts`、`notice.ts`、`announce.ts`、`gauge.ts`、`windshield.ts`、`lever.ts`，與各自的 `*.test.ts`
- `components/games/`：`OrangeExpressView.tsx`、`OrangeExpressCab.tsx`、`OrangeExpressWindshield.tsx`、`OrangeExpressStopBar.tsx`、`OrangeExpressResult.tsx`、`OrangeExpressGauge.tsx`、`orange-express.module.css`、新檔 `OrangeExpressGlyphs.tsx`、`GameChrome.tsx`（一句說明）
- `e2e/orange-express.spec.ts`
- `docs/SHINKANSEN-SIM-DESIGN.md`、`CHANGELOG.md`、`TODOS.md`

不碰：`GamePageShell`、Game Kit runtime、其他三款遊戲、`data/games.ts`、`public/`。

## Verification

這個環境（Linux）：

```bash
npx vitest run lib/games/orange-express lib/gamekit/games/orange-express lib/gamekit/progress/orange-express-prefs.test.ts components/games/GameChrome.test.tsx
npm run typecheck
npm run lint
npm run audit:colors
npx playwright test e2e/orange-express.spec.ts e2e/games.spec.ts
```

e2e 新增或改寫的項目寫在各任務裡。朗讀的排序與去重用單元測試驗：e2e 的 `speechSynthesis` 替身永遠回報「沒在念」，測不出句子被吃掉。

你的 Mac（視覺基準是 darwin，Linux 錄不出來）：

```bash
npm run test:visual:trusted -- -g 小橘特快車 --update-snapshots
```

預計 24 張小橘特快車基準都會變：標題 4 張（圖示、司機說明）、開車中 17 張（鋼軌、線柱、提示圖示、速度表；含速度表特寫）、結算 2 張（色塊、指差確認次數）、遊戲設定 1 張（背後的前窗）。遊樂園卡片不變。逐張看過再收。

## Risks & rollback

- **慢慢看煞車與爬行速度**：動到 reducer 的輸入與一個手感數字。吸附在 `step` 和 `withHook` 兩個入口都做；e2e 用掛鉤設煞車的測試都在「自己開」，不受影響。出問題就單獨 revert T2。
- **朗讀**：最怕跟「下一站」互相吃掉或念過期的事。排程寫成純函式並測，車內廣播永遠優先。
- **鋼軌改畫法**：效能與現在相近（同樣是填色多邊形）。看起來不對就單獨 revert T8。
- **小螢幕數字**：先量再定，量完寫進 PR；達不到就照 T5 的退路移指差確認鈕。
- **視覺基準**：這批一定讓基準過期，Linux 改不了。PR 維持草稿，等你在 Mac 重錄並逐張看過才轉正式。推含畫面改動的 commit 時 pre-push 閘門會擋，需要 `SKIP_VISUAL_GATE=1`；我推之前會先問你。
- **共用元件**：`GameChrome.tsx` 只改一句說明文字，不動樣式。

每個任務一個 commit，可以分開 revert。

## Review decision

- 分級：**L2**（多檔、可見行為；動到 `transform`、`animation`、`prefers-reduced-motion` 與版面 → UI 風險，Opus 設計審不可跳過）。
- 計畫審查（2026-10-28）：
  - 工程審：這個環境沒有 `codex`、`cursor-agent`、`grok`，Codex 缺席，由只讀的 Claude 子代理代審。結論 Approve with changes；必改五項（朗讀排程與去重、B3 幾何、B4 先量且桿高 ≥256px、T2 吸附與 aria 規格、T5 依賴 T4）都已改進本版。
  - Opus 設計審：Approve with changes；必改項（速限牌三格與朗讀去重、B3 寬度、B4 小螢幕疊層與 e2e、結算色塊跟停車目標條同一塊、上車動畫顧到遊戲內減少動態）都已改進本版。小項（鐵橋用號角圖示、難度小點、600ms 一位一位上車、prompt 補玩具比例與拿掉 "HSR" 字樣）也一併採用。
  - 沒採用：「乘客色塊沒有臉」（頭像本來就有眼睛和笑臉，只是名字不印）；速度表灰帶加斜紋（孩子看不到鎖住的格子了，淡灰就夠）。
- 實作後再審一次（T12）。
- 狀態：**已核准**（2026-10-28，連同 B18 A、B1 A）。
- 實作後審查（T12）：
  - 工程審（只讀子代理代 Codex）：Approve with changes。必改：很矮的手機開車時提示與指差確認鈕疊在一起、同一面速限牌念兩次；建議：慢慢看預測停車點沒算爬行、生圖腳本防護（不自動重試、真的透明檢查、manifest 逐張寫、拒收不認得的參數）、e2e 量到動畫途中、暫停時仍會念。全部已修（`55ea01c`）。
  - Opus 設計審：Approve with changes。必改：站長帽帽徽像禁止進入標誌；建議：速限牌小圖沒亮的格、結算色塊放大。全部已修（`7e83aa5`）。

## B1：生圖 prompt 與張數（等你確認）

共 **2 張**，各生 **1 輪**。不滿意要重抽，我會先列出哪一張、幾張，等你說可以。B1 那個 PR 要一併改設計文件第 9 節（那裡寫的是「不生新貼紙」）。

**1. 遊樂園封面**：`public/games/v2/orange-express/cover.webp`，1536×1024，不透明，`gpt-image-2`。參考圖：遊樂園 hero（畫風）、`小橘高鐵.jpg`（車的長相）。

> Children's picture-book illustration in soft claymation / plasticine stop-motion style, matching the attached park hero: rounded clay shapes, smooth matte surfaces, soft studio light, gentle shadows, pastel palette on a clean off-white sky. The character 小橘 from the second reference image, kept on-model but as a short, chubby toy: one single rounded car only, a cream-white body, a dark rounded windshield cap on top of the nose, a short smooth bullet nose, big round eyes on the front of the nose just below the windshield cap, pink cheeks, a gentle smile, one bold orange stripe that runs diagonally from under the face back along the side, dark grey lower body. No pantograph, no thin dark line under the orange stripe. Three-quarter front view, 小橘 coming toward the viewer around a gentle curve on a clay track through soft green hills, a small clay platform with a yellow edge line on the left, the amusement-park ferris wheel small in the far background. Keep the lower right corner calm and simple (a small round badge will sit there). Absolutely no arms, hands or limbs on the train. No station signs, no text, no letters, no numbers, no logos, no real railway markings or liveries beyond the character's own colors. No people. No photorealism. Leave soft sky at the top so the image can be cropped shorter.

**2. 小橘貼紙**：`public/games/v2/orange-express/xiaoju-sticker.webp`（另做 `sm/` 縮小副本），1024×1024 透明底，`gpt-image-1.5`。用在儀表徽章（B15）與結算（B10）。

> A single claymation sticker of the character 小橘 from the reference image, kept on-model as a short, chubby toy: one single rounded car, cream-white body, a dark rounded windshield cap on top of the nose, a short smooth bullet nose, big round eyes on the front of the nose just below the windshield cap, pink cheeks, happy open smile, one bold orange stripe running diagonally from under the face back along the side, dark grey lower body. The face is large and fills most of the front so it still reads at 48 pixels. Three-quarter front view facing right. Soft matte plasticine texture, soft top-left light, gentle contact shadow only. Transparent background, clean edges, centered with padding. No pantograph, no thin dark line under the orange stripe. Absolutely no arms, hands or limbs. No track, no platform, no text, no letters, no numbers, no logos.

生完先給你看 contact sheet，你核准才進儲存庫，並登記在 `public/games/v2/orange-express/SOURCES.md`（比照多多壽司屋）。

## 交接（2026-10-28）

雲端這邊做完、驗完，回本機接手只剩需要 Mac 或金鑰的事。

**分支**：`claude/orange-express-art-batch2`（PR #267，草稿）。推送時用了 `SKIP_VISUAL_GATE=1`：畫面有改，但 darwin 基準 Linux 錄不出來，要在 Mac 補。

**已驗證（Linux）**：小橘特快車相關單元測試 121 項、`npm run typecheck`、`npm run lint`、`npm run audit:colors`、e2e `e2e/orange-express.spec.ts`＋`e2e/games.spec.ts` 128 項全過。小螢幕量測：375×553 前窗 120px、320×568 前窗 139px，都不用捲。

**本機要做（照順序）**

1. `git fetch origin && git switch claude/orange-express-art-batch2`，`npm ci`。
2. 重錄視覺基準：`npm run test:visual:trusted -- -g 小橘特快車 --update-snapshots`。預計 24 張小橘特快車基準都會變（標題 4、開車中 17 含速度表特寫、結算 2、遊戲設定 1），遊樂園卡片不該變。逐張看過再 commit。要特別看的：
   - 標題三張難度卡的圖示（烏龜、動力桿、星星站長帽）與難度小點。
   - 速限牌三格亮幾格、提示前面的圖示、淡紫腰帶的對向列車。
   - 指差確認圓鈕貼右窗柱、前窗中間空著；停車柱旁沒有第二根柱子；鋼軌近粗遠細。
   - 結算站卡是綠／黃色塊加「剛剛好／停到了」，沒有 ★。
3. 實機（iPhone Safari）：375×553 有工具列時不捲就按得到車門；開著音效聽一趟大司機，「下一站」念完才念提示，同一件事只念一次。
4. B1 生圖（付費，已確認 2 張、各 1 輪）：`npm run generate:orange-express-art -- --dry-run` 先看 prompt，再不加參數跑一次；看 `public/.games-staging/orange-express/<run>/` 的併排審稿圖。滿意才 `--approve`，然後登記 `public/games/v2/orange-express/SOURCES.md`、把 `data/games.ts` 的封面改指 `cover.webp`、改設計文件第 9 節。不滿意要重抽，先決定哪一張、幾張。B1 建議另開一個 PR，跟 B10（結算放小橘）、B15（桌機放大徽章）一起做。
5. 基準 commit 推上去後，PR #267 轉成正式、等 CI 綠再合併。

**還沒做的**：B10、B15（等貼紙）；B19（前窗補號誌、指差確認改成看得到才出題）；車內廣播錄音。都在 `TODOS.md`。
