# Agent Plan（規劃 + 審核）

**本 slash command 啟用 Agent Orchestration workflow**（一般對話不會自動套用）。

依 `docs/AGENT-WORKFLOW.md` 的 **`/agent-plan` 流程**執行。本指令**只規劃、不實作**（除非使用者明確要求跳過審核直接做）。

## 你要做的事

1. **讀取 context**
   - `docs/AGENT-WORKFLOW.md`（Meta workflow）
   - 若為單集/stories 任務，另讀 `docs/EPISODE-WORKFLOW.md`

2. **Leader（Composer 2.5）撰寫 Plan**
   - 使用 AGENT-WORKFLOW 中的 Plan 模板（Goal、Scope、Task DAG、Files、Verification、Model routing、Risks）
   - 每個子任務標註 **L0–L3** 與建議 **model slug**

3. **並行 Review（必做，各一輪）**
   - 派 **Opus 4.8**（`claude-opus-4-8-thinking-medium`）：架構、範圍、過度工程、與 repo 慣例
   - 派 **GPT 5.5**（`gpt-5.5-medium`）：可執行性、驗證命令、漏檔、測試
   - 若兩者意見衝突或邊界模糊，可選派 **Fable 5**（`claude-fable-5-thinking-medium`）作第三意見（備選，非必須）

4. **Leader 綜合**
   - 合併兩份（或三份）review
   - 產出 **Approved Plan**（含需使用者決策的項目）
   - 明確寫：下一步請用 **`/agent-action`** 執行

## 禁止

- 不要 commit / push
- 不要跑全幕生圖或大量刪檔（除非使用者在本指令中明確授權）
- 不要跳過 Review 直接實作（使用者說「直接做」除外）

## 輸出語言

繁體中文（技術 slug / 路徑可保留英文）。
