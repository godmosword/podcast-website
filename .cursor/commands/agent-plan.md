# Agent Plan（規劃 + 委員會審核）

**本 slash command 啟用 Agent Orchestration workflow**（一般對話不會自動套用）。

依 [`docs/AGENT-WORKFLOW.md`](../../docs/AGENT-WORKFLOW.md) 的 **`/agent-plan` 流程**執行。本指令**只規劃、不實作**（除非使用者明確要求跳過審核直接做）。
typo 級小事不進本命令——直接做即可。

**Domain（Bootstrap、紅線、驗證矩陣）：** [`docs/AGENT-DOMAIN.md`](../../docs/AGENT-DOMAIN.md)
**失敗案例簿：** [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md)

## 你要做的事

**執行期追蹤：** 從 Bootstrap 起維護 **Agent 執行分配表**（見 §7）。**固定全表 #0–#5 必列**；缺席必寫；**Grok／Opus 列禁止標 `跳過`**。

### 0. Bootstrap

- 讀 [`docs/AGENT-WORKFLOW.md`](../../docs/AGENT-WORKFLOW.md)（Meta：委員會分工、對標表）
- 讀 [`docs/AGENT-DOMAIN.md`](../../docs/AGENT-DOMAIN.md)（Bootstrap 表、紅線、驗證矩陣）
- 讀 [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md)（30 天內連續 2+ fail 的委員 → 本次直接標缺席，不重試）
- 依 Domain「依任務加讀」表補充 context
- **Opus 設計審必讀：** [`DESIGN.md`](../../DESIGN.md)（設計 token、觸控、動畫、兒童 UX 原則）

### 1. 先判斷要不要開委員會

| 任務 | 做法 |
|------|------|
| typo／&lt;10 行 | **直接做**，不進本命令 |
| 字幕／scenes／illustrate（SOP 內） | **跳過本命令**；直做或 `/agent-action` + Domain verify |
| 純 docs／命令對齊 | 可進本命令；審核可降級 Leader + GPT，但 **§7 固定全表 Grok／Opus 列仍須列出** |
| 一般 L1／L2 工程 | 本命令 + **固定三審**（GPT + Grok + Opus 設計） |
| 跨模組／紅線／Protected／L3 | 固定三審；Opus 設計審**加強**架構／紅線視角；Leader 自審可行性 |

### 2. Draft Plan（Leader 骨架 + Task 填細節）

**Composer 節流：** Leader（Composer）只寫 **Goal、Scope／Out of scope、Risks 骨架**；其餘派 Task。

| 區塊 | 誰寫 | model slug |
|------|------|------------|
| Goal、Scope、Risks 骨架 | Leader | （當前 session） |
| Task DAG、Files、Verification、Model routing | Task | `gpt-5.6-sol-medium` |
| 每個子任務 L0–L3 + slug | Task（同上） | 預設 L2→Grok 4.5 Fast Medium、L1→Grok、L0→shell |

- 使用 AGENT-WORKFLOW 的 **Plan 模板**合併成 Draft Plan
- **Plan 產物：** Cursor Plan 檔，或 `/tmp/agent-plan-<unix_ts>.md`（`date +%s`）

### 3. 委員會審查（固定三審，全部唯讀）

**三委員可並行派工。**

| 委員 | 角度 | Cursor 派工 |
|------|------|-------------|
| **GPT 5.6 Sol** | 工程可行性／驗證命令／漏檔／測試 | Task（`readonly: true`）+ `gpt-5.6-sol-medium` |
| **Grok 4.5 Fast Medium** | 對抗審：漏洞、edge case、失敗模式 | Task（`readonly: true`）+ `grok-4.5-fast-medium` |
| **Opus 4.8 設計審** | **設計／UX**：`DESIGN.md` 對齊、兒童主路徑、親子互動、觸控 ≥44px、`prefers-reduced-motion`、資訊層級、視覺一致性；L3 時加架構／紅線 | Task `architect`（`readonly: true`）+ `claude-opus-4-8-thinking-medium`；prompt 附 `DESIGN.md` 要點 |

**純文件／命令檔對齊：** 可降級 Leader + GPT；**§7 表 Grok／Opus 列仍須出現**（標 `未派` 或嘗試派工後標 `缺席`）。

**審查紅線：**

- 審查委員一律 `readonly: true`，不改檔
- Grok 不審中文文案品質（Domain：中文 → Sonnet）
- Opus 設計審不取代工程驗證矩陣
- Plan 違反 Domain 紅線 → 標 **CRITICAL**
- 委員失敗 → 追加 [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md)

### 4. Leader 綜合

| 來源 | 關鍵意見 | 採納決定 |
|------|----------|----------|
| Leader（可行性自審，L3） | … | — |
| GPT 5.6 Sol 工程審 | … | 採納 / 不採納 |
| Grok 4.5 Fast Medium 對抗審 | …／缺席 | … |
| Opus 4.8 設計審 | …／缺席 | … |

產出 **Approved Plan** → 覆寫 plan 檔 → **下一步請用 `/agent-action`**

### 5. 缺席規則

- **至少一位非 leader 委員**（GPT／Grok／Opus 之一）成功才可標 Approved；全滅 → 回報使用者
- **Grok 缺席**：GPT 或 Opus 仍成功即可 Approved，標 **「對抗審缺席／對抗性降級」**
- **Opus 缺席**：GPT 仍成功即可 Approved，分配表標缺席

### 6. CRITICAL 與 Plan mode

- **CRITICAL**：A/B/C；僅 **A** 改檔
- **Cursor Plan mode**：以系統 plan confirm 為準

### 7. 最終輸出：固定 Agent 執行分配表（必附）

**固定列出 #0–#5 全行，不得省略 Grok／Opus 列。**

| # | 角色 | 執行方式 | subagent_type | model slug | 做了什麼 | 產出 | 狀態 |
|---|------|----------|---------------|------------|----------|------|------|
| 0 | Leader | 當前 session | — | `composer-2.5-fast` | 寫骨架、綜合委員意見 | Approved Plan | 完成 |
| 1 | Plan 細節 | Task | `generalPurpose` | `gpt-5.6-sol-medium` | 填 DAG、Files、Verification | plan 區塊 | 完成／未派 |
| 2 | GPT 5.6 Sol 工程審 | Task（readonly） | `generalPurpose` | `gpt-5.6-sol-medium` | 審可行性、驗證、漏檔 | 審查意見 | 完成／缺席 |
| 3 | Grok 4.5 Fast Medium 對抗審 | Task（readonly） | `generalPurpose` | `grok-4.5-fast-medium` | 找漏洞、edge case | 審查意見 | 完成／缺席 |
| 4 | Opus 4.8 設計審 | Task（readonly） | `architect` | `claude-opus-4-8-thinking-medium` | 審 UX／DESIGN.md／兒童體驗／a11y 視覺 | 審查意見 | 完成／缺席 |
| 5 | Leader 可行性自審 | Leader 自審 | — | `composer-2.5-fast` | L3 成本／範圍 | 自審結論 | 完成／未派 |

**狀態欄：** `完成`｜`未派`｜`缺席`｜`對抗審缺席／對抗性降級`。**#3 Grok、#4 Opus 禁止標 `跳過`**。

## 禁止

- 不要 commit / push
- 不要跳過 Review 直接實作（使用者說「直接做」除外）
- 收尾分配表省略 Grok／Opus 列

## 輸出語言

依 [`docs/AGENT-DOMAIN.md`](../../docs/AGENT-DOMAIN.md) § 專案識別。
