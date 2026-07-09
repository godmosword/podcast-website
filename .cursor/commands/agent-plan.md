# Agent Plan（規劃 + 委員會審核）

**本 slash command 啟用 Agent Orchestration workflow**（一般對話不會自動套用）。

依 [`docs/AGENT-WORKFLOW.md`](../../docs/AGENT-WORKFLOW.md) 的 **`/agent-plan` 流程**執行。本指令**只規劃、不實作**（除非使用者明確要求跳過審核直接做）。
typo 級小事不進本命令——直接做即可。

**Domain（Bootstrap、紅線、驗證矩陣）：** [`docs/AGENT-DOMAIN.md`](../../docs/AGENT-DOMAIN.md)
**失敗案例簿：** [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md)

## 你要做的事

### 0. Bootstrap

- 讀 [`docs/AGENT-WORKFLOW.md`](../../docs/AGENT-WORKFLOW.md)（Meta：委員會分工、對標表）
- 讀 [`docs/AGENT-DOMAIN.md`](../../docs/AGENT-DOMAIN.md)（Bootstrap 表、紅線、驗證矩陣）
- 讀 [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md)（30 天內連續 2+ fail 的委員 → 本次直接標缺席，不重試）
- 依 Domain「依任務加讀」表補充 context

### 1. Draft Plan（Leader 骨架 + Task 填細節）

**Composer 節流：** Leader（Composer）只寫 **Goal、Scope／Out of scope、Risks 骨架**；其餘派 Task，避免 Composer 長篇規劃。

| 區塊 | 誰寫 | model slug |
|------|------|------------|
| Goal、Scope、Risks 骨架 | Leader | （當前 session） |
| Task DAG、Files、Verification、Model routing | Task | `gpt-5.5-medium` |
| 每個子任務 L0–L3 + slug | Task（同上） | 預設 L2→Sonnet、L1→Sonnet、L0→shell |

- 使用 AGENT-WORKFLOW 的 **Plan 模板**合併成 Draft Plan
- **Plan 產物：**
  - **Cursor Plan mode**：CreatePlan 產出的 plan 檔（優先）
  - **否則**：寫入 `/tmp/agent-plan-<unix_ts>.md`（`date +%s`）

### 2. 委員會審查（分級，必做，全部唯讀）

#### L1／L2 任務：雙審

| 委員 | 角度 | Cursor 派工 |
|------|------|-------------|
| **Opus 4.8** | 架構／紅線／過度工程 | Task `architect` 或 `code-reviewer`（`readonly: true`）+ `claude-opus-4-8-thinking-medium` |
| **GPT 5.5** | 工程可行性／驗證命令／漏檔／測試 | Task + `gpt-5.5-medium` |

#### L3／觸紅線／Protected paths：四員全上（追加）

| 委員 | 角度 | Cursor 派工 |
|------|------|-------------|
| **Grok 4.5** | 對抗審：找 plan 漏洞、edge case、失敗模式 | Task（`readonly: true`）+ `grok-4.5`；slug 不可用 → **缺席**（依 Meta「slug 不可替換」規則，勿降級改用其他模型頂替對抗審） |
| **Composer 2.5** | 快速可行性／實作成本 | **Leader 自審**（當前 session 即 Composer，不另派工） |

**審查紅線：**

- 審查委員一律 `readonly: true`，不改檔
- Grok 不審中文文案品質（Domain：中文 → Sonnet）
- Plan 違反或弱化 Domain 紅線 → 標 **CRITICAL**
- 委員呼叫失敗 → 追加 [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md) 案例紀錄，摘要表註明缺席

### 3. Leader 綜合

對照摘要表（與 Claude Code 版同格式）：

| 來源 | 關鍵意見 | 採納決定 |
|------|----------|----------|
| Leader（Composer 可行性審） | … | — |
| Opus 4.8 架構審 | … | 採納 / 不採納 |
| GPT 5.5 工程審 | … | 採納 / 不採納 |
| Grok 4.5 對抗審（L3） | …／缺席 | … |

產出 **Approved Plan**（含需使用者決策項）→ 覆寫 plan 檔 → 明確寫：**下一步請用 `/agent-action`**

### 4. 缺席規則

- 委員失敗 → 摘要表註明缺席，照常定稿；Leader **不可省略** Domain 驗證矩陣中的必要項
- **至少一位非 leader 委員成功審過**才可標 Approved；全滅 → 回報使用者，不自行定稿

### 5. CRITICAL 與 Plan mode

- **CRITICAL**：若有 `review-user-choice.mdc`，用 **A/B/C**；僅 **A** 才改檔
- **Cursor Plan mode**：以系統 plan confirm 為準
- 非 Plan mode：全程自主，**不要**逐步詢問批准（CRITICAL 除外）

## 禁止

- 不要 commit / push
- 不要跳過 Review 直接實作（使用者說「直接做」除外）

## 輸出語言

依 [`docs/AGENT-DOMAIN.md`](../../docs/AGENT-DOMAIN.md) § 專案識別（技術 slug／路徑可保留英文）。
