# Agent Plan（GrokBot：規劃 + 場內委員會）

**本指令啟用 GrokBot Orchestration**（一般對話不自動套用）。

依 [`docs/AGENT-WORKFLOW.md`](../../docs/AGENT-WORKFLOW.md) 的 `/agent-plan` 流程，執行方式改為 [`docs/GROKBOT-TEAM.md`](../../docs/GROKBOT-TEAM.md)。

本指令**只規劃、不實作**（除非使用者明確要求跳過審核直接做）。typo 級小事不進本命令。

**Domain：** [`docs/AGENT-DOMAIN.md`](../../docs/AGENT-DOMAIN.md)  
**失敗案例簿：** [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md)  
**花名冊：** [`../team/roster.md`](../team/roster.md)

## 你要做的事

從 Bootstrap 起維護 **Agent 執行分配表**（§7）。固定全表 #0–#5；對抗審／設計審禁止標 `跳過`。

### 0. Bootstrap

用 GitHub 讀：

1. `docs/AGENT-WORKFLOW.md`
2. `docs/AGENT-DOMAIN.md`
3. `docs/AGENT-FAILURES.md`
4. `docs/GROKBOT-TEAM.md`
5. `DESIGN.md`（黏土車必讀）
6. Domain「依任務加讀」

### 1. 要不要開委員會

| 任務 | 做法 |
|------|------|
| typo／小於 10 行 | 直接做 |
| 字幕／scenes／illustrate（SOP 內） | 跳過本命令；字幕車拒絕 Grok 定稿中文 |
| 純 docs／命令對齊 | 可降級隊長 + 工程車；§7 對抗審／設計審列仍須列出 |
| 視覺／樣式微調（預估 diff 小於 80 行、不碰 Protected、無 UI 風險） | 中間級：工程單審；對抗審／設計審標 `按級距免派` |
| 一般 L1／L2 | 固定三審（工程車 + 找碉車 + 黏土車） |
| L3／紅線／Protected | 三審 + 隊長自審；必要時建議切回 Cursor／Opus |

### 2. Draft Plan

隊長只寫 Goal、Scope、Risks 骨架。工程車另開一節填 Task DAG、Files、Verification、Model routing。

工程審必須是**另一節**，開頭寫「你未撰寫此 Plan」，反駁 DAG ≥3 點並附檔名／命令證據。

Plan 可寫在回覆中，並以 GitHub 落到 `plans/grokbot-<unix_ts>.md`（若使用者要求落檔）。

### 3. 場內三審（唯讀、分節）

| 委員 | 角色卡 | 角度 |
|------|--------|------|
| 工程車 | [`../team/engineer.md`](../team/engineer.md) | 可行性、驗證命令、漏檔 |
| 找碉車 | [`../team/adversary.md`](../team/adversary.md) | 漏洞、edge case、付費越權、素材外流 |
| 黏土車 | [`../team/designer.md`](../team/designer.md) | DESIGN.md、兒童主路徑、觸控 ≥44px、reduced-motion |

禁止把三審合成一段。禁止宣稱 Cursor Task slug 已執行。

### 4. 隊長綜合 → Approved Plan

工程審無實質產出不得 Approved。找碉／黏土無法做獨立審查時標 `缺席（跨環境模型不可呼叫）`，工程審仍須成功。

下一步提示 `/agent-action`。

### 5. CRITICAL

A 現在修／B 已知悉暫不修／C 誤判略過。僅 A 改檔。

### 6. 禁止

- 禁止呼叫 Fable 5（任何 `claude-fable-5-*`）
- 禁止 commit／push
- 禁止跳過 Review 直接實作（使用者說「直接做」除外）
- 禁止省略對抗審／設計審列
- 禁止用 Grok 定稿 `data/subtitles/`、`data/scenes/`、面向幼兒的中文文案

### 7. 分配表（必附）

| # | 角色 | 執行方式 | subagent_type | model slug | 做了什麼 | 產出 | 狀態 |
|---|------|----------|---------------|------------|----------|------|------|
| 0 | 隊長 Grok | GrokBot session | leader | `cursor-grok-4.5-high-fast` | 骨架、綜合 | Approved Plan | 完成（GrokBot 場內代行） |
| 1 | Plan 細節 | 場內代行 | engineer | `gpt-5.6-luna-max-fast` | DAG／Files／Verify | plan 區塊 | 完成（GrokBot 場內代行）／未派 |
| 2 | 工程審 | 場內代行 | engineer | `gpt-5.6-luna-max-fast` | 可行性、漏檔 | 審查意見 | 完成（GrokBot 場內代行）／缺席（跨環境模型不可呼叫） |
| 3 | 對抗審 | 場內代行 | adversary | `composer-2.5-fast` | 漏洞、edge | 審查意見 | 完成（GrokBot 場內代行）／缺席（跨環境模型不可呼叫） |
| 4 | 設計審 | 場內代行 | designer | `claude-opus-5-thinking-high` | UX／DESIGN.md | 審查意見 | 完成（GrokBot 場內代行）／缺席（跨環境模型不可呼叫） |
| 5 | 隊長自審 | Leader 自審 | leader | `cursor-grok-4.5-high-fast` | L3 成本／範圍 | 自審 | 完成／未派 |

## 輸出語言

繁體中文。
