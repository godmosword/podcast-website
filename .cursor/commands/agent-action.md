# Agent Action（風險分級落地）

本命令依 [`docs/AGENT-WORKFLOW.md`](../../docs/AGENT-WORKFLOW.md) 執行 Approved Plan；內容 SOP 可依 Domain 直接落地。不重做完整 Plan，不 commit，除非使用者明確要求。

## 前置與分級

- 讀 Approved Plan、canonical workflow 與 Domain 對應紅線。
- 只有實際要呼叫外部模型時才讀 [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md) active 區段。
- L0：shell／Leader 直接執行最小命令。
- L1：單一執行者；路徑不明才先只讀 explore。
- L2：`composer-2.5-fast` 實作，配一次獨立 readonly 工程審；UI 或外部模型風險依 workflow 追加審查。
- L3／Protected／schema／sync／發布／付費 API：Leader 或 Opus 實作，工程、對抗、設計三審。
- 同一檔案禁止多 agent 同時修改；顧問建議由實作路徑或 Leader 落檔。

每個子任務 prompt 必須包含 Goal、Context paths、Constraints、Do NOT、Verification、Deliverable。禁止派工 Fable 5（`claude-fable-5-*`）；hook `.cursor/hooks/block-fable.mjs` 仍硬擋。

## Verify

依 Domain 驗證矩陣挑最小集合：規則／命令契約跑 `npx vitest run scripts/check-agent-docs-contract.test.ts`；hook 變更跑對應 hook tests；程式、UI、sync、Protected path 依觸及面追加測試。沒有發布或 L3 風險時，不預設執行完整 `npm run check`。

## 收尾

只列實際執行的 Leader、Task、Verify 與審查角色。L0/L1 可省略分配表；L2 列 Leader、實作與工程審；L3 列所有委員和缺席原因。回報檔案、驗證命令與未解問題。

## Ship

預設不 commit／push。使用者明確要求時只 stage 本次相關檔案，禁止 `git add -A`；push 前依 Domain 執行完整必要驗證。
