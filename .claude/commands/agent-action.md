---
description: 依 Approved Plan 實作＋驗證（podcast-website）；改檔只走 leader／Sonnet／Haiku，外部四模型（Opus 4.8/GPT 5.5/Grok 4.5/Composer 2.5）任唯讀顧問。
---

# Agent Action（podcast-website 行動小組版）

你（Claude，**leader**）主持這次執行。任務或 plan 路徑：

$ARGUMENTS

## 0. Bootstrap

同 [`agent-plan.md`](agent-plan.md) §0：讀 [`docs/AGENT-DOMAIN.md`](../../docs/AGENT-DOMAIN.md)（紅線、驗證矩陣、Protected paths）、[`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md)（失敗案例＋探活協議）、依任務加讀表。

## 1. 載入 Approved Plan

`/tmp/agent-plan-*.md`（取最新）或使用者貼上；無 plan → 簡短列出缺什麼，建議 `/agent-plan`。

## 2. 分級執行

**改檔只有三條路：leader、Sonnet 子 agent、Haiku 子 agent。**

| 級別 | 判準 | 執行者 |
|------|------|--------|
| **L3** | Protected paths、跨模組、schema | **Leader 親自**（`scripts/illustrate*`、sync workflows、`app/legal/` 依 Domain 只能 leader／Opus） |
| **L2** | 多檔、模式固定 | Agent tool `model: "sonnet"`（**中文文案一律 Sonnet**） |
| **L1** | 單檔 routine | Agent tool `model: "haiku"`（機械性）；<10 行 → leader 直接做 |
| **L0** | 純命令 | Bash |

**行動小組（外部顧問，全部唯讀）**：卡關要第二意見、或實作後 diff 審查時呼叫；先依 FAILURES 探活，失敗即記錄＋標缺席。

| 顧問 | 用途 | 呼叫方式 |
|------|------|----------|
| Opus 4.8 | 高風險 diff 審、架構第二意見 | Agent tool `subagent_type: code-reviewer` + `model: "opus"` |
| GPT 5.5 | TS/React diff 審、工程第二意見 | `codex exec -m gpt-5.5 -c model_reasoning_effort="high" "<prompt + diff>"` |
| Grok 4.5 | 對抗審：找 diff 的 edge case | `grok models` 探活 → `grok -p "<prompt>" -m grok-4.5 --effort medium`（prompt 緊跟 `-p`） |
| Composer 2.5 | 快速 sanity check | `cursor-agent -p --model composer-2.5-fast --mode ask "<prompt>"` |

**執行紅線：**
- 禁止用 `codex exec`／`grok`／`cursor-agent` 直接改 repo 檔案——顧問只出建議 patch，由 leader 落檔
- Grok 不碰中文（校對、文案、字幕）
- Haiku 等小模型不碰 Domain **Protected paths**
- 禁止多執行路徑同時改同一檔
- 每個子 agent prompt 必含：Goal、Context paths、Constraints（含 Domain 紅線）、Do NOT、Verification、Deliverable

## 3. Leader 整合

合併結果、解衝突、**最小 diff**；對外介面行為不變（除非 Plan 明確要求）。

## 4. Verify（必跑）

依 [`docs/AGENT-DOMAIN.md`](../../docs/AGENT-DOMAIN.md) § 驗證矩陣挑最小集合：

- 預設：`npm test`
- 故事／插圖／字幕／metadata：`npm run verify:episodes`
- 找車車／主題索引：`npm run verify:browse-index`
- 關鍵 UI 流程：`npm run test:e2e`
- 上線前：`npm run check`

**未全綠不得宣稱完成**；回報逐項對照。委員缺席不可省驗證矩陣。

## 5. Diff 委員審（分級、唯讀）

- 一般：GPT 5.5（codex exec 審 diff）
- L3／觸紅線：加 Opus 4.8（Agent tool code-reviewer + opus）與 Grok 4.5 對抗審
- 呼叫失敗 → 追加 `docs/AGENT-FAILURES.md`，摘要表註明缺席

## 6. Docs sync（可見行為變更時）

依 Domain § Docs sync：可見行為 → `CHANGELOG.md`；待辦 → `TODOS.md`；指令／SOP → `README.md`；插圖 workflow → `docs/EPISODE-WORKFLOW.md`。

## 7. Ship（僅使用者要求）

- 預設**不** commit／push
- 使用者說「commit」→ 只 stage 本次相關檔；**禁止 `git add -A`**
- 使用者說「ship／push」→ `npm run check` 全綠後依 Domain § Ship
- 完整 VERSION + CHANGELOG ship → gstack `/ship`

## 8. CRITICAL

`CRITICAL-n` + Fix + A/B/C；**僅 A** 改檔。

## 禁止

- 無 Plan 擅自擴大 scope
- 跳過 Verify 宣稱完成

## 輸出語言

繁體中文（技術 slug／路徑保留英文）。
