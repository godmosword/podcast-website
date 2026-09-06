---
description: podcast-website Agent Plan；依 canonical workflow 風險分級，Claude Code 僅保留模型呼叫適配
---

# Agent Plan（Claude Code 適配）

本命令只有使用者明確要求規劃、或任務依 [`docs/AGENT-WORKFLOW.md`](../../docs/AGENT-WORKFLOW.md) 判定為 L2/L3 時使用；只產生 Approved Plan，不實作、不 commit。

## 流程

1. 讀 canonical workflow 與 Domain 對應段落。
2. 只有實際需要外部模型時才讀 [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md) active 區段。
3. L0/L1 不建立本 Plan；L2 至少安排獨立 readonly 工程審；L3／Protected／schema／sync／發布／外部模型／付費 API 安排工程、對抗、設計三審。
4. UI 風險（Opus 設計審不可跳過）包含 `StoryPlayer`、`PlayButton`、`StoryCard`、`Chip`、`GamePageShell`、`LandingSegment`、`SiteNavBar`，以及 `padding`、`gap`、`animation`、`transition`、`transform`、`z-index`、`prefers-reduced-motion`。
5. 字幕、scenes、illustrate 依內容 SOP 直接處理或使用 `/agent-action`。

## Draft、審查與輸出

Plan 必須包含 Goal、Scope／Out of scope、Task DAG、Files、Verification、Risks／rollback。L2 工程審 prompt 必須明寫「你未撰寫此 Plan」、readonly，並逐條反駁 DAG ≥3 點；L3 委員缺席時記錄原因並保留 Domain 必要驗證。

Claude Code 模型適配：

- Leader：當前 Claude Code session，通常為 Opus。
- 工程審：`codex exec -m gpt-5.6-luna -c model_reasoning_effort="medium" "<prompt>" </dev/null`。
- 對抗審：`cursor-agent --model cursor-grok-4.5-high-fast`；拒收或認證失敗時依 active 表使用 `grok -m grok-4.6` 備援。
- 設計審：Agent tool `model: "opus"`，readonly。

Leader 綜合實際審查意見，標記 Approved 或待決策，列出最小驗證命令並提示 `/agent-action`。收尾只列實際派出的角色；L2 不建立固定空白委員表，L3 列所有實際委員和缺席原因。

## 禁止

- 禁止 Fable 5（`claude-fable-5-*`）；hook `.cursor/hooks/block-fable.mjs` 仍硬擋。
- 禁止使用過期模型 slug 或把 Cursor Task slug 傳給 `codex exec`。
