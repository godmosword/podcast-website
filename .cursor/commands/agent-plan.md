# Agent Plan（風險分級）

本命令只有使用者明確要求規劃、或任務依 [`docs/AGENT-WORKFLOW.md`](../../docs/AGENT-WORKFLOW.md) 判定為 L2/L3 時使用；只產生 Approved Plan，不實作、不 commit。

## 0. Bootstrap

- 讀 [`docs/AGENT-WORKFLOW.md`](../../docs/AGENT-WORKFLOW.md) 的分級、審查與完成邊界。
- 依任務需要讀 [`docs/AGENT-DOMAIN.md`](../../docs/AGENT-DOMAIN.md) 對應段落。
- 只有實際要呼叫外部模型時才讀 [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md) active 區段。
- 大型、跨模組或不熟悉模組才讀 README、TODOS、CHANGELOG、DISCLAIMER；不要每次完整載入。

## 1. 判級

- L0/L1：不建立本 Plan；直接處理並執行最小驗證。
- L2：建立 Goal、Scope、Task DAG、Files、Verification、Risks；至少安排一個未撰寫 Plan 的 readonly 工程審，審查逐條反駁 DAG ≥3 點並附檔名或命令證據。
- L3／Protected／schema／sync／發布／外部模型／付費 API：安排工程、對抗、設計三審與 Leader 綜合。
- UI 風險（Opus 設計審不可跳過）包含 `StoryPlayer`、`PlayButton`、`StoryCard`、`Chip`、`GamePageShell`、`LandingSegment`、`SiteNavBar`，以及 `padding`、`gap`、`animation`、`transition`、`transform`、`z-index`、`prefers-reduced-motion`。
- 字幕、scenes、illustrate 依內容 SOP 直接處理或使用 `/agent-action`，不建立完整委員會 Plan。

## 2. Draft 與審查

Leader 先寫範圍骨架，再補齊：

```markdown
## Goal
## Scope / Out of scope
## Task DAG
## Files likely touched
## Verification
## Risks & rollback
## Review decision
```

- Plan 細節／工程審：`gpt-5.6-luna-max-fast`。
- UI 設計審：`claude-opus-5-thinking-high`，readonly，附 DESIGN.md 要點。
- 對抗審：`composer-2.5-fast`，只在風險分級要求時派出。
- 每個審查 prompt 必須寫明：「你未撰寫此 Plan」，並要求只讀、不改檔。
- 委員缺席時記錄原因；仍須保留 Domain 驗證矩陣必要項，不因缺席直接批准高風險 Plan。

## 3. Approved Plan

Leader 綜合實際審查意見，標記 Approved 或待決策，列出模型路由與最小驗證命令，然後提示 `/agent-action`。收尾只列實際派出的角色；L2 不建立固定空白委員表，L3 列所有實際委員和缺席原因。

## 模型與安全

- Cursor Leader：`cursor-grok-4.5-high-fast`
- Claude Code CLI 工程審：`codex exec -m gpt-5.6-luna`
- Cursor 工程審／Plan 細節：`gpt-5.6-luna-max-fast`
- L1/L2 實作與對抗審：`composer-2.5-fast`
- 設計審：`claude-opus-5-thinking-high`
- 禁止 Fable 5（`claude-fable-5-*`）；hook `.cursor/hooks/block-fable.mjs` 仍硬擋。
- 不使用 workflow SSOT 以外的舊路由；模型 slug 以 workflow SSOT 為準。
