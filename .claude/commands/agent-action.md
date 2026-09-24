---
description: podcast-website Agent Action；依 canonical workflow 風險分級，Claude Code 僅保留模型呼叫適配
---

# Agent Action（Claude Code 適配）

本命令依 [`docs/AGENT-WORKFLOW.md`](../../docs/AGENT-WORKFLOW.md) 執行 Approved Plan；字幕、scenes、illustrate 等內容 SOP 可依 Domain 直接落地。不重做完整 Plan，不 commit，除非使用者明確要求。

## 分級與執行

- L0：Bash／Leader 直接執行最小命令。
- L1：單一執行者；路徑不明才先只讀 explore。
- L2：Leader 實作；配一次獨立 readonly Codex 工程審，外部模型或安全風險再加 cursor-agent 對抗審。
- L3／Protected／schema／sync／發布／付費 API：Leader 實作，工程、對抗、設計三審。
- 同一檔案禁止多 agent 同時修改；顧問建議由 Leader 落檔；中文 Protected path 依 Domain 使用 Sonnet。

每個子任務 prompt 必須包含 Goal、Context paths、Constraints、Do NOT、Verification、Deliverable；送給 OpenAI、xAI 的 prompt 不得含個資、使用者資料或金鑰。

Claude Code 顧問適配：工程審使用 `codex exec -m gpt-6-luna -s read-only -c model_reasoning_effort="medium" "<prompt>" </dev/null`；對抗審使用 `cursor-agent -p --trust --mode ask --model grok-4.7-high-fast "<prompt>"`，失敗時備援 `grok -m grok-4.7 --permission-mode plan -p "<prompt>"`；設計審使用 Agent tool `model: "opus"`（Opus 5.5），全部 readonly。

## Verify、收尾與 Ship

依 Domain 驗證矩陣挑最小集合；規則／命令契約跑 `npx vitest run scripts/check-agent-docs-contract.test.ts`，hook 變更跑對應 hook tests，L3 或發布才追加完整 `npm run check`。只列實際執行的角色：L0/L1 可省略分配表，L2 列實作與工程審，L3 列所有委員和缺席原因。預設不 commit／push；使用者明確要求時只 stage 本次相關檔案，禁止 `git add -A`。
