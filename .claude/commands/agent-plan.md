---
description: podcast-website 專用 Plan 委員會（Opus 4.8/GPT 5.5/Grok 4.5/Composer 2.5，分級制）——只規劃、審核，不實作。
---

# Agent Plan（podcast-website 委員會版）

你（Claude，**leader**）主持這次規劃。任務描述：

$ARGUMENTS

本指令**只規劃、不實作、不 commit**。實作請接 `/agent-action`。
typo 級小事不進本命令（AGENT-DOMAIN 反模式：每個 typo 都雙審太慢）——直接做即可。

## 0. Bootstrap（必讀，不複製、只引用）

1. [`docs/AGENT-DOMAIN.md`](../../docs/AGENT-DOMAIN.md) — 紅線、驗證矩陣、Protected paths（**唯一 source of truth**）
2. [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md) — model-call 失敗案例簿 + 探活協議（30 天內連續 2+ fail → 標缺席不重試）
3. [`docs/AGENT-WORKFLOW.md`](../../docs/AGENT-WORKFLOW.md) — Plan 模板、L0–L3 分級
4. 依 Domain「依任務加讀」表補 context

## 1. Draft Plan（leader 撰寫全文）

> 與 Cursor 版差異：Claude Code 的 leader 直接寫完整 Draft；**勿**照搬 Cursor 的 Composer 節流（骨架＋派 GPT 5.5 填細節），那是 Composer 額度考量，此處不適用。

依 AGENT-WORKFLOW **Plan 模板**：Goal、Scope／Out of scope、Task DAG（每項標 L0–L3 與執行者）、Files likely touched、Verification（從 **Domain 驗證矩陣**挑具體命令）、Risks & rollback。

寫入 `/tmp/agent-plan-<unix_ts>.md`（`date +%s`）。

## 2. 委員會審查（分級，全部唯讀）

先依 FAILURES 探活協議確認委員可用；呼叫失敗 → 追加 `docs/AGENT-FAILURES.md` 案例紀錄並標缺席。

### L1／L2 任務：雙審

| 委員 | 角度 | 呼叫方式 |
|------|------|----------|
| **Opus 4.8** | 架構／紅線／過度工程 | Agent tool：`subagent_type: architect`（唯讀）+ `model: "opus"`，prompt 附 plan 全文與 Domain 紅線清單 |
| **GPT 5.5** | 工程可行性／驗證命令／漏檔 | `codex exec -m gpt-5.5 -c model_reasoning_effort="high" "你是 podcast-website 資深工程審查者，只審查不改檔。審查以下計劃的可行性、驗證命令、漏檔、紅線：$(cat /tmp/agent-plan-<ts>.md)"` |

### L3／觸紅線／Protected paths：四員全上（追加）

| 委員 | 角度 | 呼叫方式 |
|------|------|----------|
| **Grok 4.5** | 對抗審：找 plan 漏洞、edge case、失敗模式 | 先 `grok models` 探活；可用才 `grok -p "<對抗審 prompt + plan 全文>" -m grok-4.5 --effort medium`（prompt 緊跟 `-p`） |
| **Composer 2.5** | 快速可行性／實作成本 | `cursor-agent -p --model composer-2.5-fast --mode plan "<可行性審 prompt + plan 全文>"` |

**審查紅線：**
- 外部 CLI 一律唯讀（codex 只 `exec` 審文字、cursor 用 `--mode plan`/`--mode ask`、grok 用 `-p` 單輪）；不得讓它們改 repo 檔案
- Grok 不審中文文案品質（Domain：中文 → Sonnet）
- Plan 若弱化 Domain 紅線（如跳過字幕校對、CI 放生圖 key）→ 標 **CRITICAL**（A/B/C 格式，僅 A 改檔）

## 3. Leader 綜合

| 來源 | 關鍵意見 | 採納決定 |
|------|----------|----------|
| Leader | … | — |
| Opus 4.8 架構審 | … | 採納／不採納 |
| GPT 5.5 工程審 | … | 採納／不採納 |
| Grok 4.5 對抗審（L3） | …／缺席 | … |
| Composer 2.5 可行性審（L3） | …／缺席 | … |

覆寫 `/tmp/agent-plan-<ts>.md` 為 **Approved Plan**（含需使用者決策項）→ 明確提示：**下一步請用 `/agent-action`**。

## 4. 缺席規則

- 委員缺席 → 摘要表註明，照常定稿；Domain 驗證矩陣必要項**不可省**
- **至少一位非 leader 委員成功審過**才可標 Approved；全滅 → 回報使用者，不自行定稿

## 禁止

- 不實作、不 commit／push
- 不跳過審查直接實作（使用者明說「直接做」除外）

## 輸出語言

繁體中文（技術 slug／路徑保留英文）。
