# Agent Action（拆分 + Task 派工 + 驗證）

**本 slash command 啟用 Agent Orchestration workflow**（一般對話不會自動套用）。

依 [`docs/AGENT-WORKFLOW.md`](../../docs/AGENT-WORKFLOW.md) 的 **`/agent-action` 流程**執行。本指令**負責實作與驗證**，不重做完整 Plan（除非計畫缺失或執行中 blocked）。

**Domain：** [`docs/AGENT-DOMAIN.md`](../../docs/AGENT-DOMAIN.md)
**失敗案例簿：** [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md)

## 前置條件

- 已有 **Approved Plan**（來自 `/agent-plan`、Cursor plan 檔、`/tmp/agent-plan-*.md`，或使用者貼上的計畫）
- **內容管線例外：** 字幕／scenes／illustrate（SOP 內）可無 Plan，依 Domain § 內容管線直做
- 其他任務若無計畫，先簡短列出缺什麼，建議 `/agent-plan`

## 你要做的事

**執行期追蹤：** 從讀 Plan 起維護 **Agent 執行分配表**（見 §10）。每派 Task／顧問審／Verify／Ship，記下：任務 ID、`subagent_type`、`model slug`、做了什麼、產出、狀態。Leader 親手改檔也須入表。

### 0. Bootstrap

同 [`agent-plan.md`](agent-plan.md) §0（含讀 [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md)）；可見行為變更完成前依 Domain § Docs sync。

### 1. Leader 讀 Approved Plan（或 Domain SOP）

- 有 Plan：確認 Task DAG、依賴、Model routing 表
- 內容管線：對照 [`docs/EPISODE-WORKFLOW.md`](../../docs/EPISODE-WORKFLOW.md) 與 Domain 紅線

### 2. 拆任務並派工（Cursor Task）

依 Plan 的 **L0–L3** 與 AGENT-WORKFLOW 路由表，用 **Task** 派子 agent（**不要**用 `codex exec`／`claude -p` 子 process 做實作委派——子 process 無 Cursor 工具鏈）。

**Composer 節流：** Leader **不**做多檔／單檔實作；實作一律 Task 派 Sonnet／Opus／shell。Leader 僅：派工、整合、&lt;10 行微調、git。

| 級別 | 判準 | Cursor 派工 |
|------|------|-------------|
| L3 架構／高風險 | 跨模組、Protected paths | Task + `claude-opus-4-8-thinking-medium`，或 Leader（僅 Domain 要求路徑） |
| L2 多檔實作 | 模式固定 | Task + `claude-4.6-sonnet-medium-thinking`（**預設**；中文文案一律 Sonnet；勿用 Composer） |
| L1 單檔 | 範圍明確 | **路徑已知** → Task + Sonnet；**路徑不明** → Task `explore`（`grok-4.3`）→ Sonnet |
| L0 命令 | lint／test／腳本 | Task `shell` 或 `grok-build-0.1` |

**行動小組（顧問，全部 `readonly: true`）**：卡關要第二意見時派——

| 顧問 | 用途 | Cursor 派工 |
|------|------|-------------|
| Opus 4.8 | 高風險 diff 審、架構第二意見 | Task `code-reviewer`（readonly）+ `claude-opus-4-8-thinking-medium` |
| GPT 5.6 Sol | TS/React diff 審、工程第二意見 | Task（readonly）+ `gpt-5.6-sol-medium` |
| Grok 4.5 Fast Medium | 對抗審：找 diff 的 edge case | Task（readonly）+ `grok-4.5-fast-medium`；slug 不可用 → 缺席（見 [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md) § Cursor Task） |
| Composer 2.5 | 快速 sanity check | Leader 自審（當前 session） |

**禁止：**

- 多 agent **同時改同一檔**
- 違反 Domain § **Protected paths / models**（Grok 不碰中文；explore／shell／廉價模型不碰 Protected paths）
- **gpt-5.4** 作為固定路由（已淘汰）
- 顧問（readonly Task）產出的建議 patch 由實作路徑落檔，顧問本身不改檔

改動 <10 行且無架構影響 → Leader 直接做，不派子 agent。

每個子任務 prompt 必含：**Goal、Context paths、Constraints（含 Domain 紅線）、Do NOT、Verification、Deliverable**（見 AGENT-WORKFLOW 模板）。

### 3. Leader 整合

- 合併子 agent 結果、解衝突、**最小 diff**
- 對外介面行為不可改變（除非 Plan 明確要求）

### 4. Verify（必跑）

依 [`docs/AGENT-DOMAIN.md`](../../docs/AGENT-DOMAIN.md) § **驗證矩陣** 與 Plan 列出的命令。

未全綠不得宣稱完成；回報逐項對照。**委員／子 agent 缺席不可省驗證矩陣。**

### 5. Diff 委員審（分級、readonly，可跳過）

- **可跳過**：已有 Approved Plan、diff 約 &lt;80 行、未碰 Protected paths／紅線 → 只跑 Verify
- **一般**：GPT 5.6 Sol（Task + `gpt-5.6-sol-medium`）；Python → `python-reviewer`；TS/JS → `typescript-reviewer`
- **L3／觸紅線／Protected**：加 Opus 4.8 與 Grok 4.5 Fast Medium 對抗審；Grok 缺席 → 摘要標「對抗審缺席／對抗性降級」
- 呼叫失敗 → 追加 [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md)，分配表註明缺席

### 6. 文件同步

若 scope 含可見行為／隊列／指令 → Domain § Docs sync。

### 7. Ship（僅使用者要求）

- **預設不** commit / push
- 使用者說「commit」→ 只 stage **本次相關檔**；禁止 `git add -A`
- 使用者說「ship／push main」→ scoped tests 全綠後依 **Domain § Ship**
- 完整 VERSION + CHANGELOG ship → gstack **`/ship`**

### 8. CRITICAL

若有 `review-user-choice.mdc`：**CRITICAL-n** + Fix + A/B/C；僅 **A** 改檔。

### 9. 委派缺席

Task 失敗 → 追加 [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md)；Leader 接手，分配表註明，不中斷流程。

### 10. 最終輸出：Agent 執行分配表（必附）

收尾回覆**必須**附此表（繁中；slug 保留英文）。**固定列出** Leader、實作 Task、Verify、diff 審（含 Grok 列）、Ship。

| # | 任務 ID | subagent_type | model slug | 做了什麼 | 產出（檔案／命令結果） | 狀態 |
|---|---------|---------------|------------|----------|------------------------|------|
| 0 | Leader | — | `composer-2.5-fast` | 讀 Plan、派工、整合 diff | 合併後變更摘要 | 完成 |
| 1 | T1 | `generalPurpose` | `claude-4.6-sonnet-medium-thinking` | （依 Plan 填寫） | `path/to/file` | 完成／缺席 |
| 2 | Verify | `shell` | `grok-build-0.1` | `npm test` 等 | 逐項對照結果 | 完成 |
| 3 | GPT diff 審 | `typescript-reviewer` | `gpt-5.6-sol-medium` | 審 diff | 無 CRITICAL／意見摘要 | 完成／跳過／缺席 |
| 4 | Grok 對抗審 | `generalPurpose` | `grok-4.5-fast-medium` | 找 edge case | 審查意見 | 完成／跳過／缺席 |
| 5 | Ship | — | `composer-2.5-fast` | commit／push | commit hash | 完成／未執行 |

**狀態欄：** `完成`｜`跳過`（如小 diff 免 diff 審）｜`缺席`｜`對抗審缺席／對抗性降級`｜`未執行`（Ship 僅在使用者要求時）。

## 禁止

- 不要無 Plan 擅自擴大 scope（內容管線 SOP 內除外）
- 不要跳過 Verify 就宣稱完成

## 輸出語言

依 [`docs/AGENT-DOMAIN.md`](../../docs/AGENT-DOMAIN.md) § 專案識別。
