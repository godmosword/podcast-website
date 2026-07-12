---
description: 依 Approved Plan 實作＋驗證（podcast-website）；改檔只走 leader／Sonnet／Haiku，外部模型任唯讀顧問；小 diff 可跳過 diff 審。
---

# Agent Action（podcast-website 行動小組版）

你（Claude，**leader**）主持這次執行。任務或 plan 路徑：

$ARGUMENTS

**執行期追蹤：** 從讀 Plan 起維護 **Agent 執行分配表**（見 §9）。每派子 agent／顧問審／Verify／Ship，記下：任務 ID、`subagent_type`、`model slug`、做了什麼、產出、狀態。Leader 親手改檔也須入表。

## 0. Bootstrap

同 [`agent-plan.md`](agent-plan.md) §0：讀 [`docs/AGENT-DOMAIN.md`](../../docs/AGENT-DOMAIN.md)（紅線、驗證矩陣、Protected paths）、[`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md)（失敗案例＋探活協議）、依任務加讀表。

## 1. 載入 Approved Plan（或 Domain SOP）

`/tmp/agent-plan-*.md`（取最新）或使用者貼上；無 plan → 簡短列出缺什麼，建議 `/agent-plan`。
**內容管線例外：** 字幕／scenes／illustrate（SOP 內）可無 Plan，依 Domain § 內容管線與 [`EPISODE-WORKFLOW.md`](../../docs/EPISODE-WORKFLOW.md) 直做。

## 2. 分級執行

**改檔只有三條路：leader、Sonnet 子 agent、Haiku 子 agent。**

| 級別 | 判準 | 執行者 |
|------|------|--------|
| **L3** | Protected paths、跨模組、schema | **Leader 親自**（`scripts/illustrate*`、sync workflows、`app/legal/` 依 Domain 只能 leader／Opus） |
| **L2** | 多檔、模式固定 | Agent tool `model: "sonnet"`（**中文文案一律 Sonnet**） |
| **L1** | 單檔 routine | 路徑已知 → Sonnet 或 Haiku；路徑不明可先探索；&lt;10 行 → leader 直接做 |
| **L0** | 純命令 | Bash |

**行動小組（外部顧問，全部唯讀）**：卡關要第二意見、或實作後需 diff 審查時呼叫；先依 FAILURES 探活，失敗即記錄＋標缺席。

| 顧問 | 用途 | 呼叫方式 |
|------|------|----------|
| Opus 4.8 設計審 | UX／設計／a11y 視覺 | Agent tool `architect` + `model: "opus"` |
| Codex CLI 工程審 | TS/React diff 審、工程第二意見 | `codex exec -m gpt-5.6 -c model_reasoning_effort="medium" "<prompt + diff>" </dev/null`（**Claude Code 專用**；Cursor 對標 `gpt-5.6-luna-max-fast`） |
| Grok 4.5 Fast Medium | 對抗審：找 diff 的 edge case | `grok models` 探活 → `grok -p "<prompt>" -m grok-4.5-fast --effort medium --no-plan`；不可用 → 缺席 |
| Composer 2.5 | 快速 sanity check | `cursor-agent -p --model composer-2.5-fast --mode ask "<prompt>"` |

**執行紅線：**
- 禁止用 `codex exec`／`grok`／`cursor-agent` 直接改 repo 檔案——顧問只出建議 patch，由 leader 落檔
- Grok 不碰中文（校對、文案、字幕）
- Haiku 等小模型不碰 Domain **Protected paths**
- 禁止多執行路徑同時改同一檔
- 每個子 agent prompt 必含：Goal、Context paths、Constraints（含 Domain 紅線）、Do NOT、Verification、Deliverable

## 3. Leader 整合

合併結果、解衝突、**最小 diff**；對外介面行為不變（除非 Plan 明確要求）。

## 4. Verify（必跑）

依 [`docs/AGENT-DOMAIN.md`](../../docs/AGENT-DOMAIN.md) § 驗證矩陣挑最小集合：

- 預設：`npm test`
- 故事／插圖／字幕／metadata：`npm run verify:episodes`
- 找車車／主題索引：`npm run verify:browse-index`
- 關鍵 UI 流程：`npm run test:e2e`
- 上線前：`npm run check`

**未全綠不得宣稱完成**；回報逐項對照。委員缺席不可省驗證矩陣。

## 5. Diff 委員審（分級、唯讀，可跳過）

- **可跳過**：已有 Approved Plan、diff 約 &lt;80 行、未碰 Protected paths／紅線 → 只跑 Verify
- **一般**：Codex CLI 工程審 + Opus 4.8 設計審
- **L3／觸紅線／Protected**：再加 Grok 4.5 Fast Medium
- 呼叫失敗 → 追加 `docs/AGENT-FAILURES.md`，摘要表註明缺席

## 6. Docs sync（可見行為變更時）

依 Domain § Docs sync：可見行為 → `CHANGELOG.md`；待辦 → `TODOS.md`；指令／SOP → `README.md`；插圖 workflow → `docs/EPISODE-WORKFLOW.md`。

## 7. Ship（僅使用者要求）

- 預設**不** commit／push
- 使用者說「commit」→ 只 stage 本次相關檔；**禁止 `git add -A`**
- 使用者說「ship／push」→ `npm run check` 全綠後依 Domain § Ship
- 完整 VERSION + CHANGELOG ship → gstack `/ship`

## 8. CRITICAL

`CRITICAL-n` + Fix + A/B/C；**僅 A** 改檔。

## 9. 最終輸出：Agent 執行分配表（必附）

收尾回覆**必須**附此表（繁中；slug 保留英文）。須涵蓋：實作子 agent、Leader 整合、Verify、diff 委員審（或標跳過）、Ship（若有）。

| # | 任務 ID | subagent_type | model slug | 做了什麼 | 產出（檔案／命令結果） | 狀態 |
|---|---------|---------------|------------|----------|------------------------|------|
| 0 | Leader | — | （leader model） | 讀 Plan、派工、整合 diff | 合併後變更摘要 | 完成 |
| 1 | T1 | （Agent tool type） | `sonnet`／`haiku` | （依 Plan 填寫） | `path/to/file` | 完成／缺席 |
| 2 | Verify | Bash | — | `npm test` 等 | 逐項對照結果 | 完成 |
| 3 | Codex CLI diff 審 | `code-reviewer` | `gpt-5.6`（CLI model） | 審 diff 工程面 | 意見摘要 | 完成／跳過／缺席 |
| 4 | Opus 設計審 | `architect` | `opus` | 審 UX／設計 | 意見摘要 | 完成／跳過／缺席 |
| 5 | Grok 對抗審 | `grok -p` | `grok-4.5-fast-medium` | 找 edge case | 審查意見 | 完成／跳過／缺席 |
| 6 | Ship | — | （leader model） | commit／push | commit hash | 完成／未執行 |

**狀態欄：** `完成`｜`跳過`｜`缺席`｜`對抗審缺席／對抗性降級`｜`未執行`。

## 禁止

- 無 Plan 擅自擴大 scope（內容管線 SOP 內除外）
- 跳過 Verify 宣稱完成

## 輸出語言

繁體中文（技術 slug／路徑保留英文）。
