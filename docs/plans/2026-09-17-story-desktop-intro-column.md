# PLAN — 故事頁桌機欄寬統一、本集介紹卡歸位（美術審 M1）

日期：2026-09-17
狀態：**已實作（2026-09-17，T1→T4 完成）**——量測結果記於文末「實作紀錄」。
風險級別：**L2**（多檔、可見行為；UI 風險：`padding`／`gap`／grid 版面，Opus 設計審不可跳過）。不碰 Protected path、不碰 `StoryPlayer`（播放器在 `/story/[slug]/play`，本頁沒有它）。

## Goal

`/story/[slug]` 在 ≥980 只剩**一個欄位系統**：左欄（標題／meta／CTA／共讀連結／本集介紹）＋右欄封面 420px，其下的故事大綱／出場角色／相關故事橫跨 940。「本集介紹」不再是 380px 懸在正中央的孤兒，改靠齊 CTA 正下方、與左欄同寬；同時拿掉 3px 左緣色條（M7 家長頁先例；本次把「容器不做左緣色條」正式寫進 DESIGN.md「Content over chrome」列），卡身語彙與 `contentSection` 統一，**標題不加短槓**。≤979 **版面**不動（寬度、位置、間距零差）；唯一允許的手機差異是介紹卡的 3px 左緣色條消失（M7 先例），內容框因 border 3→1px 左移 2px。

## 起點（量測，2026-09-16 production build，1280×900）

| 元素 | left | width |
|------|------|-------|
| `.main` | 150 | 980 |
| `.article`（grid）| 170 | 940 |
| 左欄（title…actions）| 170 | 488 |
| `.coverWrap` | 690 | 420 |
| `.parentCta`（橫跨、置中）| 170 | 940 |
| **`.introSection`** | **450** | **380**（`max-width: 380px; margin-inline: auto`）|
| `.contentSection` ×2 | 170 | 940 |
| `RelatedStories` | 170 | 940 |

三種寬度：488（左欄）、380（介紹卡）、940（其餘）。設計審重量（ep-3，有 subtitle＋區域徽章＋3 chips）：左欄 title→shareRow 底 ≈ **410px**，封面底 ≈ 565、shareRow 底 ≈ 553 幾乎齊平（v1 寫 ~300 是錯的）。加介紹卡（24＋230）與共讀連結（56）後左欄 ≈ 720，封面右下空出約 300px——側欄比主欄短的正常型態。分享列 `ShareButton .row` 是 `justify-content: center`（`components/ShareButton.module.css:4`），現況在 488 欄內置中（250–576）。T3 要再量一集**短標題**的左欄高度。

## Scope / Out of scope

- In：`app/story/[slug]/page.module.css`（介紹卡樣式＋≥980 grid 區域）、`page.tsx` 零改或只加 class、DESIGN.md 故事頁段落、CHANGELOG、TODOS／看板登記、量測截圖。
- Out：`StoryPlayer`、`PlayButton`、`RelatedStories`／`StoryCard` anatomy（M6 已收）、FAQ JSON-LD（頁面沒有可見 FAQ 區塊，只有 `faqPageJsonLd`）、手機／平板版面、封面尺寸、`content-visibility` 策略、夜間色票。

## 方案

### A. 介紹卡語彙：與 `contentSection` 同一種卡

- `.introSection` 拿掉 `border-left: 3px solid …`（日／夜兩條 override 一起拿）；border／radius／background／box-shadow 改與 `.contentSection` 相同（hairline、`--surface-elevated`、`--shadow-sm`；夜間同 `contentSection` 的 night 規則，`--surface-glass` 換 `--surface-elevated`）。這是**全寬度**的語彙修正（工程審 #1：Goal 已改寫為「版面零差」而非「像素零差」，手機只差左緣條）。**不**加 `content-visibility`（介紹卡在第一屏內）。
- **標題不加短槓**（設計審 #2）：介紹卡在 ≥980 屬 hero 組合，緊貼 CTA 與封面；短槓是正文區塊的段落錨，放進 hero 會在 CTA 正下方多一個 `--accent` 點。三個 h2 共用 `.sectionHeading` 字級／字重即為同一系統；`::before` 規則維持只綁 `.contentSection .sectionHeading`（`page.module.css:192-204` 不動）。
- **夜間**（設計審 #5）：只刪 `border-left-color`、`--surface-glass` → `--surface-elevated`；**不套** `contentSection` 夜規則的 `--warm-card-glow`／黃混 border，維持 `border-color: var(--hairline)`＋`--shadow-sm`——hero 區已有彩色封面框＋飽和 CTA，不能再多一個暖黃亮點。
- 手機規則 `@media (max-width: 640px) .introSection { width: calc(100% - 28px) … }` 維持——那是手機的層次設計，不在本題。

### B. ≥980：介紹卡進左欄

`grid-template-areas` 從 5 列改 7 列，`.parentCta` 與 `.introSection` 都拉進左欄、封面 `cover` 縱貫全部：

```
"title     cover"
"subtitle  cover"
"meta      cover"
"metaStack cover"
"actions   cover"
"intro     cover"
"parent    cover"
```

（設計審 #3：共讀連結放**介紹卡之後**——介紹卡末句「家長可以陪孩子聊…」自然接「家長共讀與延伸 →」，且離開 CTA 叢集就不再像第二個行動。DOM 不動、≤979 零差；`section` 不可聚焦所以 Tab 順序不受影響，只有螢幕閱讀器朗讀順序與視覺相反，語意無損，記錄接受。）

- `.article > .parentCta { grid-area: parent; text-align: left; margin-top: var(--space-3); margin-bottom: 0 }`。`hasParentCoListen` 為 false 時 `parent` 列沒有項目：grid 隱式列高 `auto` 且無內容 → 0 高，但**不靠推論**——T3 用 DevTools 把 `.parentCta` 移除後量 `contentSection.top`（工程審 #3）。目前 30 集全部有 `reflectionPrompt`（`data/reflection-prompts.ts`），false 分支是未來集數的保險。
- `.article > .introSection { grid-area: intro; max-width: none; margin: var(--space-6) 0 var(--space-8) }`——寬度＝左欄 488px，與 CTA 同寬同左緣。**底 margin 保留 `--space-8`**（設計審 #5-2）：現況介紹卡底 32＋`contentSection` 頂 32 = 64px 是 hero→正文的層級間距，v2 寫 `0` 會縮成 32 與大綱→角色相同、層級消失。parent 列在最後時它自己 `margin-bottom: 0`，64px 由介紹卡底＋`contentSection` 頂維持（parent 夾在中間會把間距拆成 32＋parent＋32，可接受，T3 量）。
- **分享列一併靠左**（設計審 #3）：`.actions .shareRow { justify-content: flex-start }` 只在 980 media 內；`className` 掛在 `ShareButton` 的 `.row` 上（`ShareButton.tsx:82`），`.actions .shareRow`（0,2,0）壓過 `.row`（0,1,0）。否則左欄會是「滿寬鈕 → 置中列 → 靠左連結 → 滿寬卡」的混合軸。
- **封面底邊 vs 介紹卡頂邊**（設計審 #5-3）：兩者會差 0–30px（依標題行數）；「差一點對齊」比明顯錯開礙眼。**不加對齊 hack**；T3 記錄 1280／1440 長短標題兩集的 `cover.bottom − intro.top`，若 <8px 才把 `margin-top` 調到 `--space-8` 拉開。
- 選擇器寫 `.article > .introSection`（0,2,0）壓過 `.article > * { grid-column: 1 / -1 }`（0,1,0），不靠檔案順序。
- `align-items: start` 不變：左欄疊高後（約 560px）超過封面 420px，封面停在頂端；下方 `contentSection` 從 grid 下一列開始，`margin-top: var(--space-8)` 不變。
- **不用** `display: contents` 包新東西——`.hero` 的 `display: contents` 已把 hero 子元素攤進 grid，介紹卡本來就是 `article` 直接子元素。

### C. 不做的替代案（記錄）

- 去框改純文字段：會讓「本集介紹」和 `.subtitle` 在左欄變成兩段灰字，`definitionSummary` 是給搜尋引擎／家長的定義句，需要一個標題錨；保留卡。
- 介紹卡橫跨 940：內文 4 行拉到 900px 一行 60 字，可讀性差；且第一屏仍留左欄空白。

## Task DAG

- [x] **T1（L1）** `.introSection` 語彙統一（方案 A）——依賴：無。檔：`app/story/[slug]/page.module.css`。
- [x] **T2（L2）** ≥980 grid 7 列（actions → intro → parent）＋ `introSection`／`parentCta` 進左欄＋ `.actions .shareRow` 靠左（方案 B）——依賴：T1（同檔，序列）。
- [x] **T3（L1）** 量測與截圖：979／980／1280／1440 桌機四張＋**夜間 1280 一張**（before 圖即夜間）；長標題（ep-3）與短標題各一集量 `cover.bottom − intro.top`；390／768 前後 pixel diff **只允許落在介紹卡 bbox 內**（左緣條）、其餘區域 0；`hasParentCoListen` true／false 兩種 DOM（false 以 DOM 移除 `.parentCta` 模擬）各量 `intro.left/width === actions.left/width`、`contentSection.top`、`RelatedStories.top`——依賴：T2。
- [x] **T4（L1）** DESIGN.md：「Content over chrome」列（`DESIGN.md:17`）加「容器不做左緣色條」全站規則（設計審 #1：目前只有 `/feedback` 的「無左緣尺線」與 M7 註解自稱，沒有全站條文）＋故事頁段落（欄位系統、介紹卡階級、分享列靠左）；CHANGELOG Fixed；TODOS 18 項表 M1 → 已修；看板卡片——依賴：T3。

T1→T2 序列（同檔）；T3、T4 序列。無可並行項（單檔為主）。

## Files

- `app/story/[slug]/page.module.css`（主要）
- `app/story/[slug]/page.tsx`（預期零改；`.parentCta`／`.shareRow` 已有獨立 class）
- `components/ShareButton.module.css`（**不改**；靠 `.actions .shareRow` 覆寫）
- `DESIGN.md`、`CHANGELOG.md`、`TODOS.md`

## Verification

```bash
npm run typecheck
npx vitest run app/story lib/json-ld            # 頁面資料契約不動
PW_REUSE_SERVER=1 npx playwright test e2e/smoke.spec.ts -g "單集|故事頁|出場角色"
# 量測（production build :3100）：intro.left === actions.left、intro.width === actions.width（1280／1440）；shareRow 第一顆鈕 left === actions.left
# 手機：390×844、768×1024 全頁截圖 before/after pixel diff 只落在介紹卡 bbox 內（左緣條），其餘 0
```

trusted visual 套件沒有 `/story/[slug]` 頁面基線（`VISUAL_PAGES` 未列），「故事卡」component shot 不受影響；T3 的手動截圖是本題的視覺證據。

## Risks / rollback

- **grid 列數增加**：`grid-template-areas` 多兩列，`.article > *` 的其他子元素（`contentSection`、`RelatedStories`）靠 auto-placement 排在具名列之後——它們仍 `grid-column: 1 / -1`，位置不受具名列數影響。
- **`hasParentCoListen=false`**：`parent` 列沒有元素 → 該列高 0；`intro` 的 `margin-top` 負責與 actions 的距離，不靠 parent 列。
- **左欄變高擠壓封面**：`align-items: start` 下封面不拉伸；若日後 `definitionSummary` 變長只會把 `contentSection` 往下推，不影響封面。
- **回滾**：單檔 CSS，`git revert` 一個 commit；不改資料、不改 DOM 契約（e2e 用 `aria-labelledby` 找區塊）。

## 審查

### 工程審（codex gpt-5.6-luna，readonly，未撰寫 Plan）— v1 判定 **Reject**，四點全部採納

1. v1 Goal「≤979 一個像素都不動」與「全寬度拿掉左緣條」自相矛盾（`page.module.css:164-183` 基礎樣式作用於所有寬度）→ Goal 改寫為「版面零差、只差左緣條」，T3 的 diff 判準改為「差異只落在介紹卡 bbox」。
2. 短槓只加 `::before` 得不到 flex 排版（`page.module.css:192-204` 的 flex／gap 只掛在 `.contentSection .sectionHeading`）→ 兩條規則選擇器一起擴。
3. 空的 `parent` 具名列「自動收 0 高」不能只靠推論；`.parentCta` 是條件渲染（`page.tsx:145-159`）→ T3 加 true／false 兩種 DOM 量測。
4. T1 的全域改動與 980 media 的桌機改動要分清楚，先封裝再測邊界 → T1 明確標「全寬度語彙」、T2 標「只在 980 media」，T3 加 979／980 邊界截圖。

### 設計審（Opus，readonly，未撰寫 Plan）— 判定 **Approve with changes**，七點全部採納

1. DESIGN.md 沒有「左緣色條不做」的全站條文（只有 `/feedback` 的「無左緣尺線」與 M7 註解自稱）→ Plan 措辭改「M7 先例，本次入 DESIGN」，T4 把規則寫進「Content over chrome」列。
2. v1 §起點「左欄 ~300px」量錯：ep-3 實測 ≈410，封面底與 shareRow 底幾乎齊 → 修正並要求 T3 再量一集短標題。
3. **介紹卡 h2 不加短槓**：hero 組合 vs 正文區塊階級不同，`::before` 維持只綁 `contentSection`。
4. grid-areas 改 `actions → intro → parent`：共讀連結接在介紹卡末句之後、離開 CTA 叢集。
5. `.actions .shareRow { justify-content: flex-start }`（僅 ≥980）：否則左欄出現置中列夾在滿寬鈕與靠左連結之間的混合軸。
6. ≥980 介紹卡保留底 margin `--space-8`（hero→正文 64px 層級）；夜間只換 glass→elevated、刪 `border-left-color`，**不套** `--warm-card-glow`／黃混 border。
7. T3 補夜間 1280 截圖＋量 `cover.bottom − intro.top`（長短標題各一集）；<8px 才拉開，不加對齊 hack。

設計審另確認：介紹卡 488×230 中性面＋灰字不會比飽和色 CTA 搶眼，`--shadow-sm` 不必拿掉；內文 456px 約 26 字/行比現況 20 字/行好，不另設 `max-width`；979/980 跳動是既有單欄↔雙欄切換，本案沒新增跳動類型。

### Leader 綜合

- 委員：Leader（Claude Code Opus）、工程審 codex gpt-5.6-luna（readonly，第一次因 CODEX_HOME 被清空失敗、重建後完成）、設計審 Opus subagent（readonly）。對抗審：L2 且無外部模型／安全風險，不觸發。
- 兩審無互相衝突；工程審 #2 的「短槓選擇器要一起擴」因設計審 #3 決定不加槓而作廢，`::before` 規則零改。
- **Approved**。最小驗證：`npm run typecheck`、`npx vitest run app/story lib/json-ld`、smoke e2e `-g "單集|出場角色"`、T3 量測腳本（production :3100）。
- 下一步：`/agent-action` 依 T1→T4 實作；不 commit，完成後回報量測表與截圖。

## 實作紀錄（2026-09-17）

| 量測（production build） | before | after |
|------|--------|-------|
| 1280 `intro.left / width` | 450 / 380 | **170 / 488**（= actions） |
| 1280 `shareRow` 第一顆鈕 left | 251（置中） | **170** |
| 1280 `contentSection.top` | 950 | **787**（頁面短 163px） |
| 1280 `cover.bottom − intro.top` | — | 566 − 481 = 85（並排，無「差一點對齊」問題；ep-30 短標題 566 − 513 = 53） |
| intro 底 → content 頂（parent 在／不在） | — | 108 / **64** |
| 390 / 768 before-after pixel diff | — | 只落在介紹卡 bbox（ep-3 390：x 34–338、y 904–1135），頁高相同 |
| 979 | 單欄 | 單欄零差 |

- 979／980／1280／1440＋夜間 1280 截圖於 session scratchpad `m1/`（after-*.png）。
- 與 Plan 相符，無偏差。共讀連結存在時 hero→正文 108px（32＋44＋32），設計審預告可接受。
- 工程審（codex readonly，實作後）：無 blocker。
