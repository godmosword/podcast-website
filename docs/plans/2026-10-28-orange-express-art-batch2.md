# 小橘特快車美術／UX 第二批

> 狀態：草稿，等審查與核准。2026-10-28，起點 `main` @ `2c6f340`。
> 來源：`TODOS.md`「小橘特快車美術／UX 審查的後續」、接手時看 10/27 視覺基準找到的三項。編號對齊儀表板（B1–B17）。
> 已拍板（2026-10-28）：B1 選 A、B5 選 A、B6 選 A。

## Goal

讓 3–7 歲的孩子不用識字就看得懂前窗提示、按得到每個鈕，結算只有一套星星；順手收掉審查列的小美術問題。不改獎章規則、不改車的物理。

## Scope / Out of scope

**In（13 項）**

| 編號 | 項目 | 做法摘要 |
| --- | --- | --- |
| B2 | 前窗提示只有字 | 提示改圖示在前；出現時念一次；速限牌改等高直條 |
| B3 | 進站時前窗被蓋住 | 指差確認鈕縮小、只留手勢圖示和要喊的話；前窗中間那條留空 |
| B4 | 小螢幕要捲才按得到車門 | 視窗高 ≤600px 的直式手機再縮一階 |
| B5 | 結算兩套星（拍板 A） | 每站等級改綠／黃色塊加「剛好」「差一點」；星星只留整趟獎章 |
| B6 | 慢慢看的煞車（拍板 A） | 慢慢看的煞車桿只排三格：鬆（B0）、停（B3）、緊急 |
| B7 | 速度表紅帶太大、速度旗太小 | 紅帶只畫旗子後面一小段；旗子放大 |
| B8 | 難度卡沒有圖示 | 烏龜、動力桿、站長帽三個向量黏土圖示 |
| B9 | 司機說明框像第四張卡 | 收進「自己開」卡片裡，不再另外一個框 |
| B11 | 乘客上車只變半透明 | 往車門滑走再消失，留一個勾 |
| B12 | 月台出現「色塊」 | 這位乘客卡上不印名字，讀屏念「一位朋友」 |
| B13 | 停車柱和線柱疊成雙桿 | 停車柱前後一段不畫門形線柱 |
| B14 | 寬畫面鄰線鋼軌變形 | 鋼軌改成跟著遠近變細的面，不再是固定粗細的線 |
| B16 | 「指差確認 1/9」 | 改成「指差確認 1 次」，0 次就不列 |

**Out**

- B1 封面與小橘貼紙：只在本文最後列 prompt 與張數，等你確認才生圖。這個環境沒有 `OPENAI_API_KEY`，生圖要在你的 Mac 跑，或在環境設定加金鑰。
- B10（結算放小橘）、B15（桌機儀表放大徽章）：等 B1 的貼紙，下一批做。
- 獎章規則、星星 bit、存檔形狀、`GameSessionResult`、速度與停車判定的數字。
- 車內廣播錄音、實機試聽、service worker、新依賴。

## Task DAG

一個分支、一個 PR，視覺基準只要你在 Mac 重錄一次。依賴標在每一項後面；沒有依賴的可以照順序一個一個做（同一檔案不並行）。

- [ ] **T1 停車等級與結算文字**（B5、B16，L1）— 依賴：無
  - `copy.ts`：`GRADE_TEXT` 改「剛好停在綠區」「停在黃區，差一點」；新增 `GRADE_WORD`（剛好／差一點）；`pointsResultText(done)` 改「指差確認 N 次」。
  - `OrangeExpressStopBar.tsx`：拿掉 ★★★／★★。`OrangeExpressResult.tsx`：站卡是色塊＋站名＋「剛好／差一點」，不出現星號；指差確認 0 次不列。
  - `types.ts` 的 `StopGrade` 註解、設計文件第 4 節改寫。
- [ ] **T2 慢慢看煞車三格**（B6，L2）— 依賴：無
  - `reducer.ts`：新增 `brakeNotches(level)`（慢慢看 `[0, 3, 5]`，其他 `[0…5]`）與 `snapBrake(level, n)`、`stepBrake(level, from, dir)`。`set-brake` 與 `withHook` 都吸到最近的允許格。
  - `OrangeExpressCab.tsx`：`Lever` 改收 `notches` 陣列（位置是陣列索引），動力桿傳 `0…powerCap`，煞車桿傳 `brakeNotches`。拖曳、點格、↑↓／Home／End 都走索引。
  - `OrangeExpressView.tsx`：←→ 用 `stepBrake`。
  - 慢慢看的「停」選 B3：減速 0.60，比自動停車的爬行速度強，孩子拉了會覺得「真的慢了」。
- [ ] **T3 前窗提示看圖就懂**（B2，L2）— 依賴：無
  - 新檔 `components/games/OrangeExpressGlyphs.tsx`：鐵橋、對向列車、隧道、喇叭打招呼四個提示圖示（向量黏土：圓角、左上高光、下緣暗帶），`SignGlyph` 搬進來。
  - `OrangeExpressWindshield.tsx`：每種提示都有 32px 圖示在前，字在後。
  - `windshield.ts`：抽出純函式 `signBarRects(r, bars)`，條是等高粗直條、整組置中；`drawSigns` 和 `SignGlyph` 共用。
  - `notice.ts`：新增 `noticeSpeechKey(notice)`；`OrangeExpressView.tsx` 在 key 變成新的非空提示時用 `speakText(text, { interrupt: false })` 念一次，指差確認出現時念要喊的話（「號誌，綠燈！」）。跟車內廣播同一個開關（音效、「念出來」、遊戲音量）。
  - `GameChrome.tsx` 的說明改「車內廣播和前窗提示用聲音念出來；關掉後音效照常。」
- [ ] **T4 進站不蓋前窗**（B3、B12，L2）— 依賴：T3（同檔 `OrangeExpressWindshield.tsx`）
  - 指差確認鈕：手勢圖示＋要喊的話，「指差確認」小標改成讀屏文字；仍 ≥52px 高，寬度上限前窗的 34%，貼右下。
  - `routes.ts`／`types.ts`：`Passenger` 加 `showName?: boolean`；第四位乘客名字改「一位朋友」、`showName: false`，卡上只留頭像。
- [ ] **T5 小螢幕不用捲**（B4，L2）— 依賴：T2（煞車格數影響桿高）
  - `orange-express.module.css`：`(orientation: portrait) and (max-height: 600px)` 時桿高下限 276→248px、前窗下限 140→112px、駕駛台內距與間距各收一階、速度表縮一階。慢慢看只有三格，每格仍遠大於 48px。
  - 目標：375×553、320×568 不捲就按得到車門；煞車六格每格 ≥40px；743px 以上的高度維持現況（每格 ≥48px）。
- [ ] **T6 速度表**（B7，L2）— 依賴：無
  - `gauge.ts`：紅帶 `[旗, 旗＋0.12]`，再往後是淡灰的「用不到」帶（新 `rest` 帶）。
  - `OrangeExpressGauge.tsx`：速度旗放大約一倍、深色描邊，整面旗留在 200×200 viewBox 裡。
- [ ] **T7 標題**（B8、B9，L2）— 依賴：T3（圖示放同一個新檔）
  - 三張難度卡左側 44px 圖示：慢慢看烏龜、自己開動力桿、小站長站長帽。
  - 拿掉虛線 `driverNote`，司機說明變成「自己開」卡片裡的一行小字，`data-testid="orange-express-driver-note"` 跟著搬。
- [ ] **T8 前窗美術**（B13、B14，L2）— 依賴：T3（同檔 `windshield.ts`）
  - 純函式 `portalVisible(portalWorld, postWorld)`：停車柱前後 12 公尺內不畫門形線柱。
  - 鋼軌改用世界寬度約 0.12 公尺的梯形，近粗遠細，最細 1px；鄰線從 z=4 開始畫，不再從畫面右下角掃過去。
- [ ] **T9 乘客上車**（B11，L2）— 依賴：T4（同一塊乘客卡）
  - 上車的乘客頭像往車門方向滑 24px 並淡出（約 420ms），原位留一個綠勾；`prefers-reduced-motion` 時不滑，直接換勾。
- [ ] **T10 文件**（L1）— 依賴：T1–T9
  - `docs/SHINKANSEN-SIM-DESIGN.md`：第 3、4 節同步，新增第 17 節「美術與 UX 第二批」。`CHANGELOG.md`、`TODOS.md`（打勾附 hash、列要重錄的基準）。新增中文字跑 `npm run font:subset` 檢查（需要 `/tmp/huninn.ttf`，這個環境沒有就列待辦）。
- [ ] **T11 驗證**（shell）— 依賴：T1–T10，見下一節。
- [ ] **T12 實作後審查** — 依賴：T11
  - 工程審：diff＋只准讀的檔案清單。
  - Opus 設計審：在這個環境用 Linux Chromium 截 390×844、375×553、844×390、1280×800 的開車、進站、結算畫面（只給審查看，不當基準）。

## Files likely touched

- `lib/games/orange-express/`：`copy.ts`、`types.ts`、`reducer.ts`、`routes.ts`、`notice.ts`、`gauge.ts`、`windshield.ts`、`lever.ts`，與各自的 `*.test.ts`
- `components/games/`：`OrangeExpressView.tsx`、`OrangeExpressCab.tsx`、`OrangeExpressWindshield.tsx`、`OrangeExpressStopBar.tsx`、`OrangeExpressResult.tsx`、`OrangeExpressGauge.tsx`、`orange-express.module.css`、新檔 `OrangeExpressGlyphs.tsx`、`GameChrome.tsx`（一句說明）
- `e2e/orange-express.spec.ts`
- `docs/SHINKANSEN-SIM-DESIGN.md`、`CHANGELOG.md`、`TODOS.md`

不碰：`GamePageShell`、Game Kit runtime、其他三款遊戲、`data/games.ts`、`public/`。

## Verification

這個環境（Linux）：

```bash
npm ci
npx vitest run lib/games/orange-express lib/gamekit/games/orange-express lib/gamekit/progress/orange-express-prefs.test.ts components/games/GameChrome.test.tsx
npm run typecheck
npm run lint
npm run audit:colors
npx playwright test e2e/orange-express.spec.ts e2e/games.spec.ts
```

e2e 新增或改寫：

- 停車目標條與結算：「剛好停在綠區」「停在黃區，差一點」；結算沒有 ★；指差確認寫「N 次」。
- 慢慢看煞車桿只有三格、每格 ≥48px，←→ 依序是鬆、停、緊急。
- 390×844 進站：停車目標條以下，前窗中間 30%–70% 那條沒有被任何提示或按鈕蓋到；提示、指差確認鈕、乘客卡彼此不重疊。
- 375×553、320×568：不捲就看得到整顆車門，煞車每格 ≥40px，前窗 ≥110px。
- 頁面上找不到「色塊」。
- 前窗提示都有圖示；開著音效時念一次提示，關掉音效不念（沿用車內廣播那條測試的 `speechSynthesis` 替身）。

你的 Mac（視覺基準是 darwin，Linux 錄不出來）：

```bash
npm run test:visual:trusted -- -g 小橘特快車 --update-snapshots
```

預計 24 張小橘特快車基準都會變：標題 4 張（圖示、司機說明）、開車中 17 張（鋼軌、線柱、提示圖示、速度表；含速度表特寫）、結算 2 張（色塊、指差確認次數）、遊戲設定 1 張（背後的前窗）。遊樂園卡片不變。逐張看過再收。

## Risks & rollback

- **慢慢看煞車改格數**：動到 reducer 的輸入。吸附在 `step` 和 `withHook` 兩個入口都做，單元測試涵蓋鍵盤、點格、拖曳的索引換算。出問題就單獨 revert T2 的 commit。
- **朗讀太多**：同一個提示只念一次，用排隊不打斷；開關全部跟車內廣播一樣。
- **鋼軌改畫法**：效能與現在相近（同樣是填色多邊形）。看起來不對就單獨 revert T8。
- **視覺基準**：這批一定讓基準過期，Linux 改不了。PR 開成草稿，等你在 Mac 重錄並逐張看過才轉正式。推分支時 pre-push 閘門會擋，需要 `SKIP_VISUAL_GATE=1`；我推之前會先問你。
- **共用元件**：`GameChrome.tsx` 只改一句說明文字，不動樣式。

每個任務一個 commit，可以分開 revert。

## Review decision

- 分級：**L2**（多檔、可見行為；動到 `transform`、`animation`、`prefers-reduced-motion` 與版面 → UI 風險，Opus 設計審不可跳過）。
- 計畫審查：工程審一次、Opus 設計審一次。這個環境沒有 `codex`、`cursor-agent`、`grok`，工程審改由一個只讀的 Claude 子代理擔任，並記錄 Codex 缺席。
- 實作後再審一次（T12）。
- 狀態：**待審查**。

## B1：生圖 prompt 與張數（等你確認）

共 **2 張**，各生 **1 輪**。不滿意要重抽，我會先列出哪一張、幾張，等你說可以。

**1. 遊樂園封面**：`public/games/v2/orange-express/cover.webp`，1536×1024，不透明，`gpt-image-2`。參考圖：遊樂園 hero（畫風）、`小橘高鐵.jpg`（車的長相）。

> Children's picture-book illustration in soft claymation / plasticine stop-motion style, matching the attached park hero: rounded clay shapes, smooth matte surfaces, soft studio light, gentle shadows, pastel palette on a clean off-white sky. The character 小橘 from the second reference image, kept on-model: a cream-white bullet train with a dark rounded windshield cap on top of the nose, a long smooth bullet nose, big round eyes, pink cheeks, a gentle smile, a bold orange stripe that sweeps from under the face along the side, dark grey lower body. Three-quarter front view, 小橘 coming toward the viewer around a gentle curve on a clay track through soft green hills, a small clay platform with a yellow edge line on the left, the amusement-park ferris wheel small in the far background. Absolutely no arms, hands or limbs on the train. No station signs, no text, no letters, no numbers, no logos, no "HSR", no real railway markings or liveries beyond the character's own colors. No people. No photorealism. Leave soft sky at the top so the image can be cropped shorter.

**2. 小橘貼紙**：`public/games/v2/orange-express/xiaoju-sticker.webp`（另做 `sm/` 縮小副本），1024×1024 透明底，`gpt-image-1.5`。用在儀表徽章（B15）與結算（B10）。

> A single claymation sticker of the character 小橘 from the reference image, kept on-model: cream-white bullet train head with a dark rounded windshield cap, long smooth bullet nose, big round eyes, pink cheeks, happy open smile, bold orange stripe sweeping from under the face along the side, dark grey lower body, only the front car visible. Three-quarter front view facing right. Soft matte plasticine texture, soft top-left light, gentle contact shadow only. Transparent background, clean edges, centered with padding. Absolutely no arms, hands or limbs. No track, no platform, no text, no letters, no numbers, no logos, no "HSR".

生完先給你看 contact sheet，你核准才進儲存庫，並登記在 `public/games/v2/orange-express/SOURCES.md`（比照多多壽司屋）。
