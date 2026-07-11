---
description: podcast-website 專用 Plan 委員會（預設 GPT 5.6 Sol + Grok 4.5 Fast Medium 雙審；Opus 觸發制）——只規劃、審核，不實作。
---

# Agent Plan（podcast-website 委員會版）

你（Claude，**leader**）主持這次規劃。任務描述：

$ARGUMENTS

本指令**只規劃、不實作、不 commit**。實作請接 `/agent-action`。
typo 級小事不進本命令（AGENT-DOMAIN 反模式）——直接做即可。

**執行期追蹤：** 從 Bootstrap 起維護 **Agent 執行分配表**（見 §6）。**固定全表 #0–#5 必列**；Grok 列禁止標 `跳過`；缺席必寫。

## 0. Bootstrap（必讀，不複製、只引用）

1. [`docs/AGENT-DOMAIN.md`](../../docs/AGENT-DOMAIN.md) — 紅線、驗證矩陣、Protected paths（**唯一 source of truth**）
2. [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md) — model-call 失敗案例簿 + 探活協議（30 天內連續 2+ fail → 標缺席不重試）
3. [`docs/AGENT-WORKFLOW.md`](../../docs/AGENT-WORKFLOW.md) — Plan 模板、L0–L3 分級
4. 依 Domain「依任務加讀」表補 context

## 1. 先判斷要不要開委員會

| 任務 | 做法 |
|------|------|
| typo／&lt;10 行 | **直接做** |
| 字幕／scenes／illustrate（SOP 內） | **跳過本命令**；直做或 `/agent-action` + Domain verify |
| 純 docs／命令對齊 | Leader 自審或 GPT；**§6 固定全表 Grok 列仍須列出** |
| 一般 L1／L2 工程 | 本命令 + **GPT 5.6 Sol + Grok 4.5 Fast Medium 雙審** |
| 跨模組／紅線／Protected／L3 | 雙審 + Opus + Composer |

## 2. Draft Plan（leader 撰寫全文）

> 與 Cursor 版差異：Claude Code 的 leader 直接寫完整 Draft；勿照搬 Cursor 的 Composer 節流。

依 AGENT-WORKFLOW **Plan 模板**：Goal、Scope／Out of scope、Task DAG（每項標 L0–L3 與執行者）、Files likely touched、Verification（從 **Domain 驗證矩陣**挑具體命令）、Risks & rollback。

寫入 `/tmp/agent-plan-<unix_ts>.md`（`date +%s`）。

## 3. 委員會審查（分級，全部唯讀）

先依 FAILURES 探活協議確認委員可用；呼叫失敗 → 追加 `docs/AGENT-FAILURES.md` 案例紀錄並標缺席。

### 預設（一般 L1／L2）：GPT 5.6 Sol + Grok 4.5 Fast Medium 雙審

| 委員 | 角度 | 呼叫方式 |
|------|------|----------|
| **GPT 5.6 Sol** | 工程可行性／驗證命令／漏檔 | `codex exec -m gpt-5.6 -c model_reasoning_effort="medium" "你是 podcast-website 資深工程審查者，只審查不改檔。審查以下計劃的可行性、驗證命令、漏檔、紅線：$(cat /tmp/agent-plan-<ts>.md)" </dev/null` |
| **Grok 4.5 Fast Medium** | 對抗審 | 先 `grok models` 探活；可用才 `grok -p "<對抗審 prompt + plan 全文>" -m grok-4.5-fast --effort medium --no-plan`；不可用 → 缺席勿頂替 |

### 加 Opus（觸發制）

觸發：跨模組、新架構、觸 Domain 紅線、Protected paths、GPT 標 CRITICAL、範圍不清。

| 委員 | 角度 | 呼叫方式 |
|------|------|----------|
| **Opus 4.8** | 架構／紅線／過度工程 | Agent tool：`subagent_type: architect`（唯讀）+ `model: "opus"`，prompt 附 plan 全文與 Domain 紅線清單 |

### L3／Protected paths：雙審 + Opus + Composer 可行性審

| 委員 | 角度 | 呼叫方式 |
|------|------|----------|
| **Opus 4.8** | 架構／紅線 | 同上 |
| **GPT 5.6 Sol** | 工程審 | 同上 |
| **Grok 4.5 Fast Medium** | 對抗審 | 同上（**必派**） |
| **Composer 2.5** | 可行性／成本 | `cursor-agent -p --model composer-2.5-fast --mode ask "<可行性審 prompt + plan 全文>"` |

**純文件／命令檔對齊：** 可降級 Leader 自審 + GPT；**§6 表 Grok 列仍須出現**。

**審查紅線：**
- 外部 CLI 一律唯讀；不得讓它們改 repo 檔案
- Grok 不審中文文案品質（Domain：中文 → Sonnet）
- Plan 若弱化 Domain 紅線 → 標 **CRITICAL**（A/B/C 格式，僅 A 改檔）

## 4. Leader 綜合

| 來源 | 關鍵意見 | 採納決定 |
|------|----------|----------|
| Leader | … | — |
| GPT 5.6 Sol 工程審 | … | 採納／不採納 |
| Grok 4.5 Fast Medium 對抗審 | …／缺席 | … |
| Opus 4.8 架構審（觸發／L3） | …／未派 | … |
| Composer 2.5 可行性審（L3） | …／缺席 | … |

覆寫 `/tmp/agent-plan-<ts>.md` 為 **Approved Plan** → 明確提示：**下一步請用 `/agent-action`**

## 5. 缺席規則

- 委員缺席 → 摘要表註明，照常定稿；Domain 驗證矩陣必要項**不可省**
- **至少一位非 leader 委員**（GPT 或 Grok 之一成功）才可標 Approved；全滅 → 回報使用者
- **Grok 缺席**：GPT 仍成功即可 Approved，摘要表與 §6 分配表標 **「對抗審缺席／對抗性降級」**

## 6. 最終輸出：固定 Agent 執行分配表（必附）

**固定列出 #0–#5 全行，不得省略 Grok 列。**

| # | 角色 | 執行方式 | subagent_type | model slug | 做了什麼 | 產出 | 狀態 |
|---|------|----------|---------------|------------|----------|------|------|
| 0 | Leader | 當前 session（Claude） | — | （leader model） | 撰寫完整 Draft Plan、綜合委員意見 | `/tmp/agent-plan-<ts>.md` | 完成 |
| 1 | GPT 5.6 Sol 工程審 | `codex exec` | — | `gpt-5.6` | 審可行性、驗證命令、漏檔 | 審查意見 | 完成／缺席 |
| 2 | Grok 4.5 Fast Medium 對抗審 | `grok -p` | — | `grok-4.5-fast-medium` | 找 plan 漏洞、edge case | 審查意見 | 完成／缺席 |
| 3 | Opus 4.8 架構審 | Agent tool（readonly） | `architect` | `opus` | 審架構／紅線 | 審查意見 | 完成／未派／缺席 |
| 4 | Composer 2.5 可行性審 | `cursor-agent` | — | `composer-2.5-fast` | L3 可行性／成本 | 審查意見 | 完成／未派／缺席 |

**狀態欄：** `完成`｜`未派`｜`缺席`｜`對抗審缺席／對抗性降級`。**#2 Grok 禁止標 `跳過`**。

## 禁止

- 不實作、不 commit／push
- 不跳過審查直接實作（使用者明說「直接做」除外）
- 收尾分配表省略 Grok 列

## 輸出語言

繁體中文（技術 slug／路徑保留英文）。
