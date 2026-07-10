# Agent Plan（規劃 + 委員會審核）

**本 slash command 啟用 Agent Orchestration workflow**（一般對話不會自動套用）。

依 [`docs/AGENT-WORKFLOW.md`](../../docs/AGENT-WORKFLOW.md) 的 **`/agent-plan` 流程**執行。本指令**只規劃、不實作**（除非使用者明確要求跳過審核直接做）。
typo 級小事不進本命令——直接做即可。

**Domain（Bootstrap、紅線、驗證矩陣）：** [`docs/AGENT-DOMAIN.md`](../../docs/AGENT-DOMAIN.md)
**失敗案例簿：** [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md)

## 你要做的事

**執行期追蹤：** 從 Bootstrap 起維護 **Agent 執行分配表**（見 §7）。每派一次 Task／委員審，記下：角色、執行方式、`subagent_type`（若有）、`model slug`、做了什麼、狀態。未派工的列省略；缺席必寫。

### 0. Bootstrap

- 讀 [`docs/AGENT-WORKFLOW.md`](../../docs/AGENT-WORKFLOW.md)（Meta：委員會分工、對標表）
- 讀 [`docs/AGENT-DOMAIN.md`](../../docs/AGENT-DOMAIN.md)（Bootstrap 表、紅線、驗證矩陣）
- 讀 [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md)（30 天內連續 2+ fail 的委員 → 本次直接標缺席，不重試）
- 依 Domain「依任務加讀」表補充 context

### 1. 先判斷要不要開委員會

| 任務 | 做法 |
|------|------|
| typo／&lt;10 行 | **直接做**，不進本命令 |
| 字幕／scenes／illustrate（SOP 內） | **跳過本命令**；直做或 `/agent-action` + Domain verify（見 Domain § 內容管線） |
| 純 docs／命令對齊 | 可進本命令，但審核用 **Leader 自審或 GPT 單審** |
| 一般 L1／L2 工程 | 本命令 + **GPT 單審** |
| 跨模組／紅線／Protected／L3 | 本命令 + 觸發 Opus；L3 再加 Grok |

### 2. Draft Plan（Leader 骨架 + Task 填細節）

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

### 3. 委員會審查（分級，全部唯讀）

#### 預設（一般 L1／L2）：GPT 單審

| 委員 | 角度 | Cursor 派工 |
|------|------|-------------|
| **GPT 5.5** | 工程可行性／驗證命令／漏檔／測試 | Task + `gpt-5.5-medium` |

#### 加 Opus（觸發制，非預設）

觸發條件：跨模組、新架構、觸 Domain 紅線、Protected paths、GPT 標 CRITICAL、或範圍不清。

| 委員 | 角度 | Cursor 派工 |
|------|------|-------------|
| **Opus 4.8** | 架構／紅線／過度工程 | Task `architect` 或 `code-reviewer`（`readonly: true`）+ `claude-opus-4-8-thinking-medium` |

#### L3／Protected paths／跨模組契約：三員對抗組 + Leader 自審

| 委員 | 角度 | Cursor 派工 |
|------|------|-------------|
| **Opus 4.8** | 架構／紅線 | 同上 |
| **GPT 5.5** | 工程審 | 同上 |
| **Grok 4.5** | 對抗審：漏洞、edge case、失敗模式 | Task（`readonly: true`）+ `grok-4.5`；slug 不可用 → **缺席**（見 [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md) § Cursor Task；勿用其他模型頂替） |
| **Composer 2.5** | 可行性／實作成本 | **Leader 自審**（不另派工；**不計入**非 leader 委員） |

**純文件／命令檔對齊：** Leader 自審或 GPT 單審即可，不必 Opus／Grok。

**審查紅線：**

- 審查委員一律 `readonly: true`，不改檔
- Grok 不審中文文案品質（Domain：中文 → Sonnet）
- Plan 違反或弱化 Domain 紅線 → 標 **CRITICAL**
- 委員呼叫失敗 → 追加 [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md) 案例紀錄，摘要表註明缺席

### 4. Leader 綜合

對照摘要表：

| 來源 | 關鍵意見 | 採納決定 |
|------|----------|----------|
| Leader（Composer 可行性審，L3） | … | — |
| GPT 5.5 工程審 | … | 採納 / 不採納 |
| Opus 4.8 架構審（觸發／L3） | …／未派 | … |
| Grok 4.5 對抗審（L3） | …／缺席 | … |

產出 **Approved Plan**（含需使用者決策項）→ 覆寫 plan 檔 → 明確寫：**下一步請用 `/agent-action`**

### 5. 缺席規則

- 委員失敗 → 摘要表註明缺席，照常定稿；Leader **不可省略** Domain 驗證矩陣中的必要項
- **至少一位非 leader 委員**（預設＝GPT；觸發／L3＝Opus 或 GPT）成功審過才可標 Approved；**Composer 自審不計入**；全滅 → 回報使用者，不自行定稿
- **L3 若 Grok 對抗審缺席**：Opus 或 GPT 仍有一人成功即可 Approved，但摘要表必須標 **「對抗審缺席／對抗性降級」**

### 6. CRITICAL 與 Plan mode

- **CRITICAL**：若有 `review-user-choice.mdc`，用 **A/B/C**；僅 **A** 才改檔
- **Cursor Plan mode**：以系統 plan confirm 為準
- 非 Plan mode：全程自主，**不要**逐步詢問批准（CRITICAL 除外）

### 7. 最終輸出：Agent 執行分配表（必附）

收尾回覆**必須**附此表（繁中；slug 保留英文）。與 §4「委員摘要表」分工：§4 記**意見與採納**；本表記**誰跑、用什麼 model、實際產出**（稽核／成本）。

| # | 角色 | 執行方式 | subagent_type | model slug | 做了什麼 | 產出 | 狀態 |
|---|------|----------|---------------|------------|----------|------|------|
| 0 | Leader | 當前 session | — | `composer-2.5-fast` | 寫 Goal／Scope／Risks 骨架、綜合委員意見 | Approved Plan | 完成 |
| 1 | Plan 細節 | Task | `generalPurpose` | `gpt-5.5-medium` | 填 Task DAG、Files、Verification、Model routing | plan 區塊 | 完成／未派 |
| 2 | GPT 5.5 工程審 | Task（readonly） | `generalPurpose` | `gpt-5.5-medium` | 審可行性、驗證命令、漏檔 | 審查意見 | 完成／缺席 |
| 3 | Opus 4.8 架構審 | Task（readonly） | `architect` | `claude-opus-4-8-thinking-medium` | 審架構／紅線 | 審查意見 | 完成／未派／缺席 |
| 4 | Grok 4.5 對抗審 | Task（readonly） | `generalPurpose` | `grok-4.5` | 找 plan 漏洞、edge case | 審查意見 | 完成／未派／缺席 |
| 5 | Composer 可行性審 | Leader 自審 | — | `composer-2.5-fast` | L3 可行性／成本 | 自審結論 | 完成／未派 |

**狀態欄：** `完成`｜`未派`｜`缺席`｜`對抗審缺席／對抗性降級`（L3 Grok 缺席時）。L3 Grok 缺席且仍 Approved → 表內與 §4 皆須標降級。

## 禁止

- 不要 commit / push
- 不要跳過 Review 直接實作（使用者說「直接做」除外）
- 不要為 SOP 內單集字幕／出圖硬開完整委員會

## 輸出語言

依 [`docs/AGENT-DOMAIN.md`](../../docs/AGENT-DOMAIN.md) § 專案識別（技術 slug／路徑可保留英文）。
