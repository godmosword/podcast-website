# Agent Domain Sheet — 車車遊樂園（podcast-website）

> Domain 一頁：Bootstrap、紅線、驗證矩陣、Ship。  
> Meta 流程見 [`AGENT-WORKFLOW.md`](AGENT-WORKFLOW.md)。  
> 單集插圖 domain playbook 見 [`EPISODE-WORKFLOW.md`](EPISODE-WORKFLOW.md)。

---

## 專案識別

| 欄位 | 值 |
|------|-----|
| **專案名稱** | 車車遊樂園（chechecar / podcast-website） |
| **主要技術棧** | Next.js 16 SSG、React 19.2 stable、TypeScript、Vitest、Playwright |
| **回應語言** | 繁體中文 |

---

## Bootstrap（Plan / Action 必讀）

大任務或不熟模組時依序讀：

| 優先 | 檔案 | 用途 |
|------|------|------|
| 1 | [`README.md`](../README.md) | 建置、指令、illustrate SOP、部署 |
| 2 | [`TODOS.md`](../TODOS.md) | 待辦與產品路線（**檔首可能落後**，以 CHANGELOG／程式為準） |
| 3 | [`CHANGELOG.md`](../CHANGELOG.md) | 已 ship 事實 |
| 4 | [`DISCLAIMER.md`](../DISCLAIMER.md) | 內容版權、兒童產品、素材禁止散布 |

呼叫任何外部 model（委員審／Task 派工）前，另讀 [`AGENT-FAILURES.md`](AGENT-FAILURES.md)（探活協議＋缺席判定）。

### 依任務加讀

| 任務類型 | 加讀 |
|----------|------|
| **單集插圖全流程** | [`EPISODE-WORKFLOW.md`](EPISODE-WORKFLOW.md)、[`SUBTITLE-PROOFREAD.md`](SUBTITLE-PROOFREAD.md) |
| **字幕校對** | [`SUBTITLE-PROOFREAD.md`](SUBTITLE-PROOFREAD.md)、`data/subtitles/<slug>.json` |
| **生圖 / 切場景** | README § illustrate、`scripts/lib/illustrate-core.ts`、`data/characters.json` |
| **Apple 同步 / CI** | [`.github/workflows/sync-apple-podcast.yml`](../.github/workflows/sync-apple-podcast.yml) |
| **小遊戲** | [`app/games/`](../app/games/)、[`RESEARCH.md`](../RESEARCH.md) |
| **前端 / 播放器** | `app/`、`components/`、`data/content.ts` |
| **字型 / 中文子集** | README § 字型維護、`npm run font:subset` |

---

## 內容管線（跳過委員會）

以下任務**預設不進** `/agent-plan` 委員會；直做或只 `/agent-action`，靠 Domain 紅線 + 驗證矩陣把關：

| 任務 | 必守 | 必驗 |
|------|------|------|
| 字幕校對 | [`SUBTITLE-PROOFREAD.md`](SUBTITLE-PROOFREAD.md)；`--mark` 後才可 illustrate | 人工校對品質 |
| 切場景／scenes | 對齊 ep-9／ep-10 全幕契約；中文 → Sonnet | `verify:episodes` |
| illustrate 出圖（SOP 內） | 未 `--mark` 不得生圖；**一輪**生圖後停；重抽須先列幕號等文字確認；暫存 → 人工審 contact → 才 `--approve` | `verify:episodes`；strict 於 approve 前 |

仍須開 `/agent-plan` 的例外：改 `scripts/illustrate*`、改 sync workflow、改全幕契約／schema、或跨模組發佈路徑。

---

## 紅線（Plan 違反 → CRITICAL）

| 紅線 | 說明 |
|------|------|
| **素材禁止再散布** | `public/stories/`、`public/characters/` 音訊／插圖／字幕屬 Bonbon & 馬米；禁止複製到外站、CDN 或第三方 repo |
| **illustrate 前必校對字幕** | 未 `--mark` 不得跑 `npm run illustrate`（兒童產品、專名正確性） |
| **AI 插圖須人工審圖** | 暫存 → 審 contact sheet → 才 `--approve` 上線；CI **不放** `OPENAI_API_KEY`、不自動生圖 |
| **生圖／重抽禁止自行連抽** | 圖像 API 付費。使用者准許的整集出圖＝**一輪**；之後任何 `--scene`／`--char`／定裝重生／自寫 regen，須先在聊天列出幕號或 slug＋張數，等文字確認才可呼叫。Timeout 同張最多重試 1 次。「修正／檢查」≠ 准許重抽。見 alwaysApply `podcast.mdc`、[`EPISODE-WORKFLOW.md`](EPISODE-WORKFLOW.md) |
| **音檔不外送** | 轉錄／生圖管線只送**已公開劇本文字**（字幕側車），不送 `audio.mp3` |
| **全幕集對齊 ep-9／ep-10** | `pageCount`、`captions`、`captionTimes`、插圖數、scenes 幕數必須一致；不得跳步 |
| **保留 Apple 封面** | 重抽單幕時勿用 `--approve` 覆蓋 `01.jpg`；單張 `cp` 進 `public/stories/<slug>/` |
| **禁止 `git add -A`** | 只 stage 本次相關檔（曾混入無關 WIP） |
| **Production URL** | 正式環境須設 `NEXT_PUBLIC_SITE_URL`（OG、RSS、絕對連結） |

---

## 驗證矩陣

依 **變更觸及面** 跑最小集合（未全綠不得宣稱完成）：

| 觸及 | 必跑（最小） |
|------|----------------|
| **全 repo 預設** | `npm test` |
| **Lint** | `npm run lint` |
| **故事／插圖／字幕／metadata** | `npm run verify:episodes` |
| **找車車／主題索引** | `npm run verify:browse-index` |
| **approve 前最後把關** | `npm run verify:episodes -- --strict` |
| **上線前完整檢查** | `npm run check`（test + verify + build，與 CI 同一套） |
| **新增中文文案** | `npm run font:subset`（需 `/tmp/huninn.ttf`） |
| **E2E（若改關鍵 UI 流程）** | `npm run test:e2e` |
| **視覺回歸（改樣式／版面時）** | `npm run test:visual:trusted`（**本機 pre-push 工具，刻意不進 CI**：baseline 為 `-chromium-darwin`，CI 跑 ubuntu，像素不可能相符）。預設 `npm run test:visual` 會 skip，**skip ≠ 通過**；重產須 `-- --update-snapshots` 並逐張人工目檢。**已加機械閘門**（VIS-DEBT-3）：`.githooks/pre-push` 會在「動到 `components/`／`app/` 的 tsx／css 但零 baseline 變更」時擋下 push，逃生門 `SKIP_VISUAL_GATE=1`；`npm run prepare` 負責把 `core.hooksPath` 指到 `.githooks`，契約測試 `scripts/lib/visual-baseline-gate.test.ts` 守住它不被靜默拿掉 |
| **Production build** | `npm run build` |

對齊 CI：`.github/workflows/sync-apple-podcast.yml` — sync 有變更時跑 `npm test` + `npm run build`；每次 sync 後跑 `npm run verify:episodes`（error 擋 push，warn 寫 Job Summary）。

---

## Protected paths / models

高風險路徑禁止派給 explore／shell 或廉價模型；由 Leader 或 L3 處理：

| 路徑／領域 | 要求 |
|------------|------|
| `scripts/illustrate.ts`、`scripts/lib/illustrate-core.ts` | Leader 或 Opus；生圖前確認 `--mark`、成本 |
| `data/apple-synced.json`、`data/apple-sync.defaults.json`、`data/stories.ts` | 改 metadata 必跑 `verify:episodes` |
| `.github/workflows/sync-apple-podcast.yml`、`.github/workflows/sync-watchdog.yml` | **禁止非同步任務改動**；契約見 `scripts/lib/sync-workflow-contract.test.ts` |
| `scripts/sync-apple-podcast.ts`、`scripts/lib/sync-catalog-sidecars.ts` | 新集必須 `upsertCatalogSidecars`；`git add` 必含四 sidecar（`story-zones`／`reflection-prompts`／`story-dates`／`episode-faqs`）＋ `data/audio-lengths.json`（#46／#60／#61；同契約測試） |
| `data/story-zones.ts`、`data/reflection-prompts.ts`、`data/story-dates.ts`、`data/episode-faqs.ts` | 完備測試以 `getStories()` 全集覆蓋；勿從 sync `git add` 拿掉；人工 refinement 可覆寫 stub |
| `package.json` `prebuild` | 新增腳本必先登錄 `PREBUILD_OUTPUT_REGISTRY`（`sync-workflow-contract.test.ts`），並依 disposition 補白名單或 gitignore；sync Production build **不得**設 `INDEXNOW_KEY` |
| `data/subtitles/`、`data/scenes/`、`data/characters.json` | 中文校對／切場景 → Sonnet 4.6，**不要** Grok |
| `public/stories/`、`public/characters/` | 素材上線須人工審圖；禁止自動 bulk approve |
| `app/legal/`、`DISCLAIMER.md` | Leader；法律文案不可 LLM 臆造 |

---

## Docs sync（可見行為變更時）

| 變更類型 | 同步 |
|----------|------|
| 使用者可見行為 | [`CHANGELOG.md`](../CHANGELOG.md) |
| 待辦／完成度 | [`TODOS.md`](../TODOS.md) |
| 指令／SOP | [`README.md`](../README.md) |
| 插圖 workflow | [`EPISODE-WORKFLOW.md`](EPISODE-WORKFLOW.md) |

---

## Ship 政策

| 情境 | 行為 |
|------|------|
| 預設 | **不** commit / push |
| 使用者說「commit」 | 只 stage **本次相關檔**；禁止 `git add -A` |
| 插圖 commit 範例 scope | `public/stories/`、`data/scenes/`、`data/subtitles/`、`data/subtitles/_proofread/`、`data/apple-synced.json`、`data/apple-sync.defaults.json`、`data/stories.ts`、`data/characters.json` |
| 使用者說「ship／push」 | `npm run check` 全綠後 push；Vercel 自動部署 |
| TODOS 完成態 + hash | 功能／chore **一併**更新 TODOS 完成標記（勿隔輪才補）。短 hash：可於該 commit 內寫「見本 commit」或緊接**一次**僅回填 hash 的 `docs(todos)`；**禁止**例行多輪堆疊補 hash。跨 PR／事後回填可例外 |
| GHA sync | 僅 bot 可 push sync 產物；人工 push 走一般 PR／main 流程 |
| branch protection | 若 push 被擋，報錯改人類處理 |

---

## 專案反模式

| 反模式 | 為什麼 |
|--------|--------|
| 跳過字幕校對直接 illustrate | 專名錯誤、兒童內容品質 |
| 用 Grok 做中文校對 | 專名／語氣錯誤率高 |
| 多 agent 改同一檔 | merge 衝突 |
| `--approve` 覆蓋 Apple 封面 `01.jpg` | 破壞 RSS 同步封面 |
| CI 放 `OPENAI_API_KEY` 自動生圖 | 成本失控、無人工審圖 |
| 審圖不滿意就自行多輪 `--scene`／regen | **付費越權**；先報幕號等確認（2026-07-31 ep-23） |
| MVP（`pageCount=1`）靜默當完成 | `verify:episodes` 會列 warn，須依 EPISODE-WORKFLOW 升級 |
| 每個 typo 都跑 `/agent-plan` 雙審 | 太慢；typo 直接做 |
| SOP 內單集字幕／出圖硬開完整委員會 | 成本浪費；應走內容管線 + verify |
| 一般 L1／L2 預設 Opus+GPT 雙審 | 已改為 **GPT + Composer 對抗審 + Opus 設計固定三審**；Leader＝Grok High Fast；L1／L2 實作＝Composer |
| 小型視覺／樣式微調硬開固定三審 | 成本浪費；&lt;80 行、不碰 Protected、不觸發 UI 風險規則 → **中間級**工程單審 + 截圖目檢（見 agent-plan §1、WORKFLOW） |
| 呼叫 AskQuestion／AUQ MCP | 預設 blocking 乾等 UI，整輪卡住（Grok 尤甚）；改聊天文字 A/B/C；hook 見 `.cursor/hooks/block-auq.mjs` |

---

## 修訂紀錄

| 日期 | 說明 |
|------|------|
| 2026-06-19 | 初版 Domain sheet（bootstrap 後填寫） |
| 2026-07-09 | Bootstrap 掛接 `AGENT-FAILURES.md`（model-call 探活＋缺席判定） |
| 2026-07-09 | 內容管線跳過委員會；反模式補「SOP 內出圖硬開委員會」「預設雙審」 |
| 2026-07-12 | 反模式補「小型視覺／樣式微調硬開固定三審」（中間級工程單審，對齊 agent-plan §1） |
| 2026-07-17 | 反模式補「呼叫 AskQuestion／AUQ MCP」；專案 hook + alwaysApply 規則硬擋 |
| 2026-07-31 | 紅線「生圖／重抽禁止自行連抽」；alwaysApply `podcast.mdc` + EPISODE-WORKFLOW 審圖閘門（ep-23 越權連抽） |
| 2026-08-24 | 驗證矩陣補「視覺回歸」列；VIS-DEBT-1 結案（根因是 baseline 拍進隨集數變動的內容，非環境漂移） |
| 2026-08-30 | VIS-DEBT-3：視覺回歸加 `.githooks/pre-push` 機械閘門。根因不是 VIS-DEBT-1 復發（遮罩修法有效），而是**沒有人在 push 前跑它**——2026-08-25 重錄後 4 天內約 20 個 UI commit 直接 ship，44 張 baseline 全過期。文件規範已證實擋不住，故改硬擋 |
