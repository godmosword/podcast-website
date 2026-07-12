---
description: podcast-website 專用 Plan 委員會（Claude Code：Codex CLI gpt-5.6 工程審；Cursor 對標見 .cursor 版 Luna MAX fast）——只規劃、審核，不實作。
---

# Agent Plan（podcast-website 委員會版）

你（Claude，**leader**）主持這次規劃。任務描述：

$ARGUMENTS

本指令**只規劃、不實作、不 commit**。實作請接 `/agent-action`。

**執行期追蹤：** **固定全表 #0–#5 必列**；Grok／Opus 列禁止標 `跳過`。

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
| 純 docs／命令對齊 | 可降級；**§6 固定全表 Grok／Opus 列仍須列出** |
| 一般 L1／L2 | **固定三審**（Codex CLI 工程審 + Grok + Opus 設計） |

## 2. Draft Plan（leader 撰寫全文）

依 AGENT-WORKFLOW Plan 模板寫入 `/tmp/agent-plan-<unix_ts>.md`。

## 3. 委員會審查（固定三審，全部唯讀）

| 委員 | 角度 | 呼叫方式 |
|------|------|----------|
| **Codex CLI 工程審** | 工程可行性／驗證／漏檔 | `codex exec -m gpt-5.6 -c model_reasoning_effort="medium" "…$(cat /tmp/agent-plan-<ts>.md)" </dev/null`（**Claude Code 專用**；非 Cursor Task slug） |
| **Grok 4.5 Fast Medium** | 對抗審 | `grok -p "<prompt + plan>" -m grok-4.5-fast --effort medium --no-plan` |
| **Opus 4.8 設計審** | **設計／UX**：`DESIGN.md`、兒童主路徑、觸控、a11y 視覺、動畫原則；L3 加架構／紅線 | Agent tool：`architect`（readonly）+ `model: "opus"`，prompt 附 `DESIGN.md` |

## 4. Leader 綜合

| 來源 | 關鍵意見 | 採納決定 |
|------|----------|----------|
| Codex CLI 工程審 | … | … |
| Grok 4.5 Fast Medium 對抗審 | …／缺席 | … |
| Opus 4.8 設計審 | …／缺席 | … |

覆寫 **Approved Plan** → 提示 **`/agent-action`**

## 5. 缺席規則

至少 GPT／Grok／Opus 之一成功才可 Approved。Grok 缺席標「對抗審缺席／對抗性降級」。

## 6. 最終輸出：固定 Agent 執行分配表（必附）

| # | 角色 | 執行方式 | subagent_type | model slug | 做了什麼 | 產出 | 狀態 |
|---|------|----------|---------------|------------|----------|------|------|
| 0 | Leader | 當前 session | — | （leader model） | Draft Plan、綜合 | plan 檔 | 完成 |
| 1 | Codex CLI 工程審 | `codex exec` | — | `gpt-5.6`（CLI model） | 審工程面 | 審查意見 | 完成／缺席 |
| 2 | Grok 4.5 Fast 對抗審 | `grok -p` | — | `grok-4.5-fast`（CLI） | 找漏洞 | 審查意見 | 完成／缺席 |
| 3 | Opus 4.8 設計審 | Agent tool | `architect` | `opus` | 審 UX／DESIGN.md | 審查意見 | 完成／缺席 |
| 4 | Composer 可行性審 | `cursor-agent` | — | `composer-2.5-fast` | L3 成本 | 自審 | 完成／未派 |

**#2 Grok、#3 Opus 禁止標 `跳過`。**

## 輸出語言

繁體中文。
