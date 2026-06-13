# Agent Action（拆分 + 分模型實作）

**本 slash command 啟用 Agent Orchestration workflow**（一般對話不會自動套用）。

依 `docs/AGENT-WORKFLOW.md` 的 **`/agent-action` 流程**執行。本指令**負責實作與驗證**，不重做完整 Plan（除非計畫缺失或執行中 blocked）。

## 前置條件

- 已有 **Approved Plan**（來自 `/agent-plan` 或使用者在本訊息提供的計畫）
- 若無計畫，先簡短列出缺什麼，建議使用者跑 `/agent-plan`

## 你要做的事

1. **Leader（Composer 2.5）讀 Approved Plan**
   - 確認 Task DAG、依賴、Model routing 表

2. **拆任務並派工**
   - 依 Plan 的 L0–L3 與 `docs/AGENT-WORKFLOW.md` 路由表，用 Task 派子 agent
   - 每個子任務 prompt 必含：Goal、Context paths、Constraints、Do NOT、Verification、Deliverable
   - **可並行**：不同檔案/目錄的任務
   - **禁止**：多 agent 同時改同一檔案

3. **模型路由（Task `model` slug）**
   - L3 → `composer-2.5-fast` 或 `claude-opus-4-8-thinking-medium`
   - L2 → `claude-4.6-sonnet-medium-thinking` 或 `composer-2.5-fast`
   - L1 → Sonnet 4.6 或 `grok-4.3`
   - L0 → `grok-build-0.1` 或 `shell` subagent
   - 中文字幕 / characters / scenes → Sonnet 4.6 或 Composer；**不要** Grok

4. **Leader 整合**
   - 合併子 agent 結果、解衝突、最小 diff

5. **Verify**
   - 依 Plan：`npm run verify:episodes`、`npm run check` 等
   - 必要時派 GPT 5.5 或 `code-reviewer` 審 diff

6. **Ship（僅使用者要求時）**
   - **只 stage 與本次任務相關檔案**；禁止 `git add -A` 混無關 WIP
   - commit / push 依使用者明確指示

## 高成本操作

全幕生圖、大量刪檔、push — 需 Plan 已授權或使用者在本輪確認。

## 禁止

- 不要無 Plan 擅自擴大 scope
- 不要跳過 Verify 就宣稱完成

## 輸出語言

繁體中文。
