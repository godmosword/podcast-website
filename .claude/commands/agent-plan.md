---
description: podcast-website 專用 Plan 委員會（Claude Code：Leader Opus 5 Thinking High；Codex CLI gpt-5.6-luna 工程審；對抗審 Grok 4.5 High Fast；Cursor 對標見 .cursor 版）——只規劃、審核，不實作。
---

# Agent Plan（podcast-website 委員會版）

你扮演 **Leader（Claude Code：Opus 5 Thinking High）** 主持這次規劃。任務描述：

$ARGUMENTS

本指令**只規劃、不實作、不 commit**。實作請接 `/agent-action`。

**執行期追蹤：** **固定全表 #0–#5 必列**；Grok 對抗審／Opus 列禁止標 `跳過`。

## 0. Bootstrap

1. [`docs/AGENT-DOMAIN.md`](../../docs/AGENT-DOMAIN.md)
2. [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md)
3. [`docs/AGENT-WORKFLOW.md`](../../docs/AGENT-WORKFLOW.md)
4. [`DESIGN.md`](../../DESIGN.md) — **Opus 設計審必讀**
5. 依 Domain「依任務加讀」表補 context

## 1. 先判斷要不要開委員會

| 任務 | 做法 |
|------|------|
| typo／&lt;10 行 | **直接做** |
| 字幕／scenes／illustrate（SOP 內） | **跳過本命令** |
| 純 docs／命令對齊 | 可降級；**§6 固定全表 Grok 對抗審／Opus 列仍須列出** |
| **視覺／樣式微調**（預估 diff &lt;80 行、不碰 Protected paths、不觸發 WORKFLOW UI 風險規則） | **中間級**：Codex 工程單審 + 落地後截圖目檢；Grok 對抗審／Opus 標 `按級距免派`（仍須列出） |
| 一般 L1／L2 | **固定三審**（Codex CLI 工程審 + Grok 4.5 High Fast 對抗審 + Opus 設計） |

## 2. Draft Plan（leader 撰寫全文）

依 AGENT-WORKFLOW Plan 模板寫入 `/tmp/agent-plan-<unix_ts>.md`；**Claude Code plan mode 下**改寫入 harness 指定的 `~/.claude/plans/<name>.md`（`/agent-action` 兩處都會找）。

預設 L2／L1 實作路由（給後續 action）：**Grok 4.5 High Fast**（`cursor-agent -p --model cursor-grok-4.5-high-fast --mode ask`；本環境見 action 命令）。

## 3. 委員會審查（固定三審，全部唯讀）

> 模型 slug 以 [`docs/AGENT-WORKFLOW.md`](../../docs/AGENT-WORKFLOW.md) § 模型 slug 對照表為**單一來源**；下表為快照，衝突時以對照表為準。

| 委員 | 角度 | 呼叫方式 |
|------|------|----------|
| **Codex CLI 工程審** | 工程可行性／驗證／漏檔 | `codex exec -m gpt-5.6-luna -c model_reasoning_effort="medium" "…$(cat /tmp/agent-plan-<ts>.md)" </dev/null`（**Claude Code 專用**；非 Cursor Task slug） |
| **Grok 4.5 High Fast 對抗審** | 對抗審 | `cursor-agent -p --model cursor-grok-4.5-high-fast --mode ask "<prompt + plan>"`；slug 拒收或認證失敗 → 備援 `grok -p "<prompt>" -m grok-4.6 --effort high --no-plan`（見 FAILURES 探活） |
| **Opus 5 設計審** | **設計／UX**：`DESIGN.md`、兒童主路徑、觸控、a11y 視覺、動畫原則；L3 加架構／紅線 | Agent tool：`architect`（readonly）+ `model: "opus"`，prompt 附 `DESIGN.md` |

## 4. Leader 綜合

| 來源 | 關鍵意見 | 採納決定 |
|------|----------|----------|
| Codex CLI 工程審 | … | … |
| Grok 4.5 High Fast 對抗審 | …／缺席 | … |
| Opus 5 設計審 | …／缺席 | … |

覆寫 **Approved Plan** → 提示 **`/agent-action`**

## 5. 缺席規則

**工程審（Codex）必須成功**才可 Approved；Codex 缺席時由 Opus 頂工程審（見 FAILURES 案例「額度用罄」），**不得未審直接過**。Grok 對抗審缺席標「對抗審缺席／對抗性降級」；全滅 → 回報使用者。

## 6. 最終輸出：固定 Agent 執行分配表（必附）

| # | 角色 | 執行方式 | subagent_type | model slug | 做了什麼 | 產出 | 狀態 |
|---|------|----------|---------------|------------|----------|------|------|
| 0 | Leader | 當前 session | — | `claude-opus-5-thinking-high` | Draft Plan、綜合 | plan 檔 | 完成 |
| 1 | Codex CLI 工程審 | `codex exec` | — | `gpt-5.6-luna`（CLI model） | 審工程面 | 審查意見 | 完成／缺席 |
| 2 | Grok 4.5 High Fast 對抗審 | `cursor-agent` | — | `cursor-grok-4.5-high-fast` | 找漏洞 | 審查意見 | 完成／缺席 |
| 3 | Opus 5 設計審 | Agent tool | `architect` | `opus` | 審 UX／DESIGN.md | 審查意見 | 完成／缺席 |
| 4 | Leader 可行性自審 | Leader 自審 | — | `claude-opus-5-thinking-high` | L3 成本 | 自審 | 完成／未派 |

**#2 Grok 對抗審、#3 Opus 禁止標 `跳過`**；中間級任務標 `按級距免派`（列仍不可省略）。

## 禁止

- **禁止呼叫 Fable 5**（`claude-fable-5-thinking-medium`／`claude-fable-5-*`／「Fable 5」顯示名）— Leader／設計審一律 `claude-opus-5-thinking-high`（Cursor 對標另有 `block-fable` hook）

## 輸出語言

繁體中文。
