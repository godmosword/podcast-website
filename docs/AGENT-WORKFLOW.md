# Agent 編排 Workflow（Meta）

本文件是本 repo Agent 流程的唯一來源，定義路由、風險分級、審查、Bootstrap、驗證與完成邊界。專案紅線與命令細節分別見 [`AGENT-DOMAIN.md`](AGENT-DOMAIN.md) 及兩環境 command adapter。

## 入口與發現邊界

| 指令 | 用途 |
|------|------|
| `/agent-plan` | L2/L3 或明確需要 Approved Plan 的任務；預設只規劃，不實作 |
| `/agent-action` | 依 Approved Plan 或內容 SOP 實作、整合與驗證 |

一般對話不自動進入編排模式。Skill／Agent 發現只掃描 repository 受版本控制的檔案；排除 `node_modules`、`.next`、`out`、build 產物與第三方套件內的 `SKILL.md`／`AGENTS.md`。

命令檔是 Claude Code／Cursor 的環境適配層；兩套命令使用相同的風險分級與完成條件，只有模型呼叫方式可以不同。

## 風險分級與審查門檻

先依實際 diff、路徑和風險判級，再決定是否建立 Plan 或派 Agent：

| 級別 | 判準 | 預設做法 | 審查 |
|------|------|----------|------|
| **L0** | 一條命令、機械檢查、少量設定或純文字操作 | 直接執行；跑該命令的最小驗證 | 不派委員 |
| **L1** | 單檔、低風險、路徑明確、小範圍 code／style／docs | 單一執行者；只讀取匹配規則 | 不派委員；必要時由 Leader 自查 |
| **L2** | 多檔、可見行為、一般資料流或模式調整 | Approved Plan；一次獨立工程審查 | 工程審查；UI 風險再加 Opus，外部模型／安全風險再加對抗審 |
| **L3** | Protected path、跨模組契約、schema、migration、sync workflow、發布、外部模型或付費 API | Approved Plan；Leader 綜合並保留回滾方案 | 工程、對抗、設計三審；Leader 自審不取代必要審查 |

### 強制升級條件

- UI 風險（Opus 設計審不可跳過）：`StoryPlayer`、`PlayButton`、`StoryCard`、`Chip`、`GamePageShell`、`LandingSegment`、`SiteNavBar`，或涉及 `padding`、`gap`、`animation`、`transition`、`transform`、`z-index`、`prefers-reduced-motion`。
- Protected path、法律文案、Apple sync、資料遷移、公開 API、付費生圖都至少是 L3。
- 字幕、scenes、illustrate 等內容 SOP 預設跳過完整委員會，依 [`AGENT-DOMAIN.md`](AGENT-DOMAIN.md) 與 [`EPISODE-WORKFLOW.md`](EPISODE-WORKFLOW.md) 直接處理或使用 `/agent-action`；生圖成本紅線仍適用。

### 完成邊界

任務完成表示範圍內檔案已修改、受影響驗證已通過、結果已回報。沒有風險升級條件時，不要求完整委員會、全 repo 測試、額外 Bootstrap 或空白分配表。超出原 scope 的想法列為後續項目，不順手加入本次 diff。

## Bootstrap 與外部模型

1. 先讀本文件的分級和 [`AGENT-DOMAIN.md`](AGENT-DOMAIN.md) 對應段落。
2. 只有大型、跨模組或不熟悉模組時，才依 Domain Bootstrap 讀 README、TODOS、CHANGELOG、DISCLAIMER。
3. 只有實際要呼叫外部模型時，才讀 [`AGENT-FAILURES.md`](AGENT-FAILURES.md) 的 active 區段。
4. 模型探活在同一會話首次使用、缺席狀態解除或模型配置變更時執行；不按每次 plan/action 重複探活。失敗即標缺席並依剩餘審查條件繼續，不盲目重試。
5. 路徑不明時先做只讀 explore，然後用 Handoff 內容派實作；路徑已知不派 explore。

## 模型路由（active SSOT）

| 用途 | Cursor／Task slug | Claude Code／CLI |
|------|-------------------|------------------|
| Leader 編排與整合 | `cursor-grok-4.5-high-fast` | 當前 session Leader |
| Plan 細節或工程審 | `gpt-5.6-luna-max-fast` | `codex exec -m gpt-5.6-luna` |
| L1/L2 實作或對抗審 | `composer-2.5-fast` | `cursor-agent --model cursor-grok-4.5-high-fast`；備援 `grok -m grok-4.6` |
| 設計／UX 審 | `claude-opus-5-thinking-high` | Agent tool `model: "opus"` |
| 命令與本機驗證 | `shell` | Bash |

禁止使用 Fable 5（`claude-fable-5-*`）作為任何 active 路由；Cursor hook [`block-fable.mjs`](../.cursor/hooks/block-fable.mjs) 仍硬擋。模型 slug 變更時先更新本表，再同步 adapter 與契約測試。

## `/agent-plan` 合約

`/agent-plan` 只在 L2/L3 或使用者明確要求 Approved Plan 時使用：

1. 依分級判斷所需 context、審查和驗證，不預設三審。
2. 寫出 Goal、Scope／Out of scope、Task DAG、Files、Verification、Risks／rollback。
3. L2 至少安排一個未撰寫該 Plan 的 readonly 工程審；觸發條件成立時再安排 Opus 或對抗審。
4. L3 要安排工程、對抗、設計三審；外部模型缺席時記錄原因並保留 Domain 必要驗證。
5. 產出 Approved Plan 後提示 `/agent-action`；不在 plan 階段修改產品檔案或 commit。

純文件／命令對齊可以由 Leader 自查；若修改安全 hook、模型路由或 Protected path，依實際風險升級，不建立未派出的固定委員列。

## `/agent-action` 合約

1. 讀取使用者提供的 Approved Plan；沒有 Plan 時只接受 Domain 明確允許的內容 SOP。
2. 依 L0–L3 路由實作；不同檔案可並行，同一檔案禁止多 agent 同時修改。
3. 每個子任務 prompt 必須包含 Goal、Context paths、Constraints、Do NOT、Verification、Deliverable。
4. 顧問與審查 agent 一律 readonly；顧問建議由實作路徑或 Leader 落檔。
5. 依 Domain 驗證矩陣執行最小必要檢查；只有發布或 L3 要求時才執行完整 `npm run check`。
6. 預設不 commit／push；使用者明確要求後才由 Leader 只 stage 本次相關檔案。

## CRITICAL 互動

遇到資料遺失、安全漏洞、不可回復破壞或需要明確授權的修改：

1. 以 `CRITICAL-n` 列出問題與修復建議。
2. 提供 A（現在修）、B（暫不修）、C（誤判略過）。
3. 只有使用者回覆 A 才改檔；選項用聊天文字，不使用 AskQuestion／AUQ。

## Plan 模板

```markdown
## Goal
（一句話）

## Scope / Out of scope
- In: ...
- Out: ...

## Task DAG
- [ ] T1（L1/L2/L3，model slug）— 依賴：無

## Files likely touched
- path/to/file

## Verification
- 最小且可重現的命令

## Risks & rollback
- ...

## Review decision
- 需要的審查：...
- Approved / 待決策：...
```

## 子任務 Prompt 模板

```markdown
## Goal
（單一可驗收目標）

## Context
- Repo: podcast-website
- Approved Plan task ID: T1
- Related files: ...
- Domain: docs/AGENT-DOMAIN.md

## Constraints
- 最小 diff；遵守 Domain 紅線與語言規範

## Do NOT
- commit / push
- 修改 scope 外檔案

## Verification
- ...

## Deliverable
- 變更摘要、驗證結果、未解問題
```

## Handoff（explore → 實作）

路徑不明時，實作 prompt 必須包含：

- **目標**：一句話
- **已確認路徑**：檔案、入口函式或 export
- **錨點**：型別、常數、測試檔
- **未知項**：仍需 Leader 決策的點
- **Protected paths**：禁止碰觸的路徑
- **建議 L 級**：L0–L3

## 收尾輸出：Agent 執行分配表

只列實際執行或審查的角色。L0/L1 不需要表；L2 列 Leader 與實際工程審；L3 列所有實際委員與缺席原因。禁止為節省成本而建立固定空白列。

| 任務 ID | subagent_type | model slug | 做了什麼 | 產出 | 狀態 |
|----------|---------------|------------|----------|------|------|
| Leader | — | session model | 編排、整合、收斂 | 變更摘要 | 完成 |
| T1 | ... | ... | ... | ... | 完成／缺席 |
| Verify | shell | — | 最小驗證命令 | 命令結果 | 完成 |
| Review | readonly | ... | 工程／設計／對抗審 | 審查摘要 | 完成／缺席 |
| Ship | — | Leader | 僅在明確要求時 commit／push | hash | 未執行 |

## 驗證與文件同步

依 [`AGENT-DOMAIN.md`](AGENT-DOMAIN.md) 的驗證矩陣選最小集合：

- 規則、命令或文件契約：`npx vitest run scripts/check-agent-docs-contract.test.ts`
- hook：對應 `.cursor/hooks/*.test.ts`
- 單元或型別變更：受影響測試與 `npm run typecheck`
- UI 風險：相關 e2e／視覺檢查
- 發布、sync、Protected path：Domain 指定命令；上線前 `npm run check`

命令／SOP 變更同步 README；可見行為同步 CHANGELOG；待辦狀態同步 TODOS。審查與驗證不通過時，不宣稱完成。

## Ship 政策

預設不 commit／push。使用者說「commit」時只 stage 本次相關檔案，禁止 `git add -A`；使用者說「ship／push」時先通過 Domain 要求的驗證，再依 Ship 政策執行。

## 反模式

- 一般 L0/L1 任務硬開委員會或讀完整 Bootstrap。
- 每次 plan/action 重複探活同一模型。
- 用未匹配的 Skill、`node_modules` 內第三方 Skill 或過期模型 slug 作路由。
- 內容 SOP 硬開完整委員會。
- 顧問直接改檔、多 agent 同檔、跳過必要驗證或把 scope 外工作塞進本次 diff。

## 相關文件

- [`.cursor/commands/agent-plan.md`](../.cursor/commands/agent-plan.md)
- [`.cursor/commands/agent-action.md`](../.cursor/commands/agent-action.md)
- [`.claude/commands/agent-plan.md`](../.claude/commands/agent-plan.md)
- [`.claude/commands/agent-action.md`](../.claude/commands/agent-action.md)
- [`.cursor/rules/agent-orchestration.mdc`](../.cursor/rules/agent-orchestration.mdc)
- [`AGENT-DOMAIN.md`](AGENT-DOMAIN.md)
- [`AGENT-FAILURES.md`](AGENT-FAILURES.md)

## 修訂紀錄

| 日期 | 說明 |
|------|------|
| 2026-09-06 | 依 Astra 成本審計改為風險分級、按需 Bootstrap、短規則與 active/archive 失敗記錄；保留 AUQ、Fable、付費生圖與 Protected path 紅線 |
