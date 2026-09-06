---
description: podcast-website Agent Action；依 canonical workflow 風險分級，Claude Code 僅保留模型呼叫適配
---

# Agent Action（Claude Code 適配）

本命令依 [`docs/AGENT-WORKFLOW.md`](../../docs/AGENT-WORKFLOW.md) 執行 Approved Plan；字幕、scenes、illustrate 等內容 SOP 可依 Domain 直接落地。不重做完整 Plan，不 commit，除非使用者明確要求。

## 分級與執行

- L0：Bash／Leader 直接執行最小命令。
- L1：單一執行者；路徑不明才先只讀 explore。
- L2：`cursor-agent --model cursor-grok-4.5-high-fast` 產生建議，Leader 落檔；必要時配一次獨立 readonly Codex 工程審。
- L3／Protected／schema／sync／發布／付費 API：Leader 或 Opus 實作，工程、對抗、設計三審。
- 同一檔案禁止多 agent 同時修改；顧問建議由 Leader 落檔；中文 Protected path 依 Domain 使用 Sonnet。

每個子任務 prompt 必須包含 Goal、Context paths、Constraints、Do NOT、Verification、Deliverable。禁止派工 Fable 5（`claude-fable-5-*`）；hook `.cursor/hooks/block-fable.mjs` 仍硬擋。

Claude Code 顧問適配：工程審使用 `codex exec -m gpt-5.6-luna -c model_reasoning_effort="medium" "<prompt>" </dev/null`；Grok slug 拒收或認證失敗時依 active 表使用 `grok -m grok-4.6` 備援；設計審使用 Agent tool `model: "opus"`，全部 readonly。

## Verify、收尾與 Ship

依 Domain 驗證矩陣挑最小集合；規則／命令契約跑 `npx vitest run scripts/check-agent-docs-contract.test.ts`，hook 變更跑對應 hook tests，L3 或發布才追加完整 `npm run check`。只列實際執行的角色：L0/L1 可省略分配表，L2 列實作與工程審，L3 列所有委員和缺席原因。預設不 commit／push；使用者明確要求時只 stage 本次相關檔案，禁止 `git add -A`。
