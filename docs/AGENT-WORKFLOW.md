# Agent 編排 Workflow（Meta）

本文件定義 **Meta layer**：誰規劃、誰審核、誰實作、誰驗證。  
**Domain**（Bootstrap、紅線、驗證矩陣、Ship）見同 repo 的 [`docs/AGENT-DOMAIN.md`](AGENT-DOMAIN.md)。

**入口指令（Cursor slash commands）：**

| 指令 | 用途 |
|------|------|
| **`/agent-plan`** | 規劃 + **分級委員會審核**（預設 GPT 單審；Opus／Grok 觸發制。預設不實作） |
| **`/agent-action`** | 依 Approved Plan **Task 派工** + Verify +（可選）Ship |

**啟用範圍：** 只有打出上述指令時才進入 Agent Orchestration 模式。一般 chat 不會自動拆任務、派子 agent。

規則精簡版： [`.cursor/rules/agent-orchestration.mdc`](../.cursor/rules/agent-orchestration.mdc)（`alwaysApply: false`）。

**與 gstack 分工：**

| 情境 | 用哪個 |
|------|--------|
| 大 feature、要自動多輪 plan 審核 | `/autoplan`（gstack skill） |
| 自訂 Plan + 委員會審 + 可控切片 | **`/agent-plan`** |
| 已有 Approved Plan 要落地 | **`/agent-action`** |
| bump VERSION + CHANGELOG + push main | `/ship`（gstack skill） |

可攜模板來源：[`templates/agent-orchestration/`](../../templates/agent-orchestration/)（Q-Silicon monorepo 內）。

---

## 兩層架構

| 層級 | 文件 | 內容 |
|------|------|------|
| **Meta** | 本文件 | 模型分工、`/agent-plan` & `/agent-action`、路由、prompt 模板 |
| **Domain** | [`AGENT-DOMAIN.md`](AGENT-DOMAIN.md) | Bootstrap、紅線、驗證矩陣、Ship、專案反模式 |

原則：**Meta 管「誰做」；Domain 管「做什麼、怎麼驗收」。**

---

## Bootstrap（Plan / Action 共通）

大任務或不熟模組時 **必讀**（具體路徑見 [`AGENT-DOMAIN.md`](AGENT-DOMAIN.md) § Bootstrap）。

可見行為變更：依 Domain 的 **Docs sync** 段落更新 changelog／待辦／導航。

---

## CRITICAL 互動

遇 CRITICAL（資料遺失、安全漏洞、無法回復的破壞、需明確授權才改程式）：

1. 列出發現（一行問題、一行建議修復）
2. 每題固定選項：**A** 現在修／**B** 已知悉暫不修／**C** 誤判略過
3. **僅 A** 才改檔

格式：`CRITICAL-n` + Fix +「請回覆 **CRITICAL-n 選 A / B / C**」

（若 repo 有 `.cursor/rules/review-user-choice.mdc`，與其對齊。）

---

## 流程總覽

```
/agent-plan          /agent-action              （使用者要求時）
    │                     │
    ▼                     ▼
 Plan ──► Review ──► Approved Plan ──► Implement ──► Verify ──► Ship
(Leader) (Arch+Eng)                  (Task 派工)     (矩陣)    (可選)
```

| 階段 | 指令 | Leader | 子 agent |
|------|------|--------|----------|
| 規劃 | `/agent-plan` | 當前 session 主模型 | — |
| 審核 | `/agent-plan` | — | 分級委員會（預設 GPT 單審；觸發才 +Opus；L3＝三員對抗組 + Leader 自審） |
| 實作 | `/agent-action` | Leader 拆任務 | Cursor **Task** + model slug |
| 驗證 | `/agent-action` | Leader 整合後 | `shell`；必要時 reviewer |
| 交付 | `/agent-action` | Leader | commit/push **僅使用者明確要求** |

**Cursor Plan mode：** 以系統 plan confirm 為準（與「全程自主」並存時，Plan mode 優先）。

**Plan 產物路徑：**

- **Cursor**：CreatePlan 產出的 plan 檔，或 `.cursor/plans/*.plan.md`
- **Claude Code**：`/tmp/agent-plan-<unix_ts>.md`
- **`/agent-action`** 接受：plan 檔路徑、`@plan`、或使用者貼上的 Approved Plan

---

## `/agent-plan`（規劃 + 審核）

> 指令檔：[`.cursor/commands/agent-plan.md`](../.cursor/commands/agent-plan.md)

### 目標

產出 **Approved Plan**，供 `/agent-action` 執行。**預設不寫 code、不 commit。**

### 步驟

1. **Bootstrap**（[`AGENT-DOMAIN.md`](AGENT-DOMAIN.md)）
2. **Draft Plan** — Leader 寫 Goal／Scope 骨架 → Task **GPT 5.5** 填 Task DAG、Files、Verification、Model routing（見 [Plan 模板](#plan-模板)）
3. **委員會審查（分級，必做，全部唯讀）** — 呼叫前依 [`AGENT-FAILURES.md`](AGENT-FAILURES.md) 探活；失敗即記錄＋標缺席
   - **預設（一般 L1／L2）：GPT 5.5 單審** — Task + `gpt-5.5-medium` 或 codex — 可執行性、驗證命令、漏檔、測試
   - **加 Opus 4.8（觸發制，非預設）** — 跨模組、新架構、觸 Domain 紅線、Protected paths、或 GPT 標 CRITICAL／範圍不清：Task `architect` 或 `code-reviewer`（`readonly: true`）
   - **L3／Protected paths／跨模組契約：三員對抗組 + Leader 自審**（舊稱「四員」易誤解；Composer 自審不另計費也不計非 leader）：
     - **Opus 4.8** 架構／紅線審
     - **GPT 5.5** 工程審
     - **Grok 4.5** 對抗審：找 plan 漏洞、edge case、失敗模式（不審中文文案品質）
     - **Composer 2.5** 可行性審（Cursor＝Leader 自審；Claude Code＝`cursor-agent` CLI）
   - **Fable 5**（`claude-fable-5-thinking-medium`）：**備選** — 僅委員衝突或邊界模糊時
   - **內容管線跳過委員會**（字幕校對、scenes、illustrate SOP 內出圖）：有 [`EPISODE-WORKFLOW.md`](EPISODE-WORKFLOW.md)／Domain 紅線即可直做或只 `/agent-action`；靠 `--mark`、人工審圖、`verify:episodes`，**不要**為 SOP 內單集流程開 `/agent-plan`
   - **純文件／命令檔對齊**（不碰 Protected paths、無 schema／發佈路徑變更）：Leader 自審即可，或 GPT 單審；不必 Opus／Grok
4. **Leader 綜合** → **Approved Plan** → 提示 **`/agent-action`**
   - **至少一位非 leader 委員**（預設路徑＝GPT；觸發／L3 時＝Opus 或 GPT）成功審過才可標 Approved；全滅 → 回報使用者
   - **Cursor 的 Composer 可行性審＝Leader 自審**，不計入「非 leader 委員」
   - **L3 若 Grok 對抗審缺席**：Opus 或 GPT 仍有一人成功即可 Approved，但摘要表必須標 **「對抗審缺席／對抗性降級」**

Plan 若弱化 Domain 紅線 → 審稿標 **CRITICAL**。

### 審稿缺席

子 agent 失敗 → 摘要表註明缺席；Leader 仍須保留 Domain 驗證矩陣中的必要項。Cursor Task slug 失敗協議見 [`AGENT-FAILURES.md`](AGENT-FAILURES.md) § 探活（無 CLI 探活時，第一次拒收即記案例並標缺席）。

---

## `/agent-action`（拆分 + 實作）

> 指令檔：[`.cursor/commands/agent-action.md`](../.cursor/commands/agent-action.md)

### 前置

- 已有 **Approved Plan**
- 無 plan → 簡短說明缺什麼，建議 `/agent-plan`

### 步驟

1. 讀 Approved Plan（Task DAG、Model routing）
2. **Cursor Task 派工**（見 [複雜度分級](#複雜度分級-l0l3)）
3. Leader **整合**（最小 diff；**禁止**多 agent 同檔）
4. **Verify**（[`AGENT-DOMAIN.md`](AGENT-DOMAIN.md) § 驗證矩陣）
5. **分級 diff 委員審**（readonly，可跳過）：
   - **可跳過**：已有 Approved Plan、diff 小（約 &lt;80 行）、未碰 Protected paths／紅線 → 只跑 Verify 即可
   - **一般**：GPT 5.5（Task + `gpt-5.5-medium`；Python → `python-reviewer`；TS/JS → `typescript-reviewer`）
   - **L3／觸紅線／Protected**：加 Opus 4.8 與 Grok 4.5 對抗審。細節以 [`.cursor/commands/agent-action.md`](../.cursor/commands/agent-action.md)／[`.claude/commands/agent-action.md`](../.claude/commands/agent-action.md) 為準
6. 可見行為變更 → Domain § Docs sync
7. **Ship**（僅使用者要求）：只 stage 相關檔；預設不 commit/push

### 派工規則

- ✅ 可並行：不同檔案／目錄
- ❌ 禁止：多 agent 同時改同一檔
- 改動 &lt;10 行且無架構影響 → Leader 直接做
- **L1 路徑已知** → 直接 Sonnet，**不必**先 explore
- **L1 路徑不明** → Task `explore`（`grok-4.3`）再 Sonnet
- 遵守 Domain § **Protected paths / models**（若有）

### Cursor vs Claude Code 對標表

兩環境同一套工作流（分級委員會＋行動小組＋失敗案例簿），只有「怎麼呼叫模型」不同：

| 角色 | Claude Code（[`.claude/commands/`](../.claude/commands/agent-plan.md)） | Cursor（[`.cursor/commands/`](../.cursor/commands/agent-plan.md)） |
|------|------|------|
| **Leader** | 當前 session（含 Draft Plan 全文） | Composer 2.5（節流：只寫骨架，細節派 GPT 5.5） |
| **Opus 4.8 架構審** | Agent tool `architect` + `model: "opus"` | Task `architect`（readonly）+ `claude-opus-4-8-thinking-medium` |
| **GPT 5.5 工程審** | `codex exec -m gpt-5.5 -c model_reasoning_effort="high"` | Task + `gpt-5.5-medium` |
| **Grok 4.5 對抗審（L3）** | `grok -p "<prompt>" -m grok-4.5 --effort medium` | Task（readonly）+ `grok-4.5`（slug 不可用 → 缺席） |
| **Composer 2.5 可行性審（L3）** | `cursor-agent -p --model composer-2.5-fast --mode plan` | Leader 自審（當前 session 即 Composer；**不計入**非 leader 委員） |
| **L3 實作** | Leader 親自 | Task + Opus slug，Protected paths 才 Leader |
| **L2 實作** | Agent tool `model: "sonnet"` | Task + `claude-4.6-sonnet-medium-thinking` |
| **L1 實作** | Agent tool `model: "haiku"`；<10 行 Leader | 路徑已知 → Sonnet；路徑不明 → explore → Sonnet；<10 行 Leader |
| **L0 命令** | Bash | Task `shell` 或 `grok-build-0.1` |
| **改檔權** | 只有 Leader／Sonnet／Haiku 子 agent；外部 CLI 一律唯讀顧問 | 只有實作 Task；顧問一律 `readonly: true` |
| **失敗記錄** | 兩邊共用 [`AGENT-FAILURES.md`](AGENT-FAILURES.md)：Bootstrap 必讀、call fail 必追加、30 天連續 2+ fail → 標缺席 | 同左 |

---

## 模型 slug 對照表

Task 的 `model` **只能**用 Cursor 允許的 slug：

| UI / 口語 | slug | 主要用途 |
|-----------|------|----------|
| Composer 2.5 | `composer-2.5-fast` | **僅** Leader 編排、整合、git、&lt;10 行微調（**節流**） |
| Opus 4.8 Thinking Medium | `claude-opus-4-8-thinking-medium` | Plan 架構審、L3 |
| GPT 5.5 Medium | `gpt-5.5-medium` | Plan 細節草稿、工程審、TS/React diff review |
| Sonnet 4.6 Thinking Medium | `claude-4.6-sonnet-medium-thinking` | **L1／L2 實作預設**、中文文案 |
| Grok 4.5 | `grok-4.5` | Plan／diff **對抗審**（唯讀；slug 不可用 → 缺席，勿頂替）；Claude Code 用 `grok -p "<prompt>" -m grok-4.5 --effort medium` |
| Grok 4.3 | `grok-4.3` | explore（只讀） |
| Grok Build 0.1 | `grok-build-0.1` | shell、批次命令 |
| Fable 5 | `claude-fable-5-thinking-medium` | 備選 Plan 第三意見 |

slug 不可用時：**不要**替換；Leader 代做並告知使用者。
**例外——對抗審（Grok 4.5）**：Leader 不代做、其他模型不頂替，直接標**缺席**（對抗審的價值在異質模型視角，同家模型頂替會失去意義）。

---

## 複雜度分級（L0–L3）

| 級別 | 特徵 | `/agent-action` |
|------|------|-----------------|
| **L3** | 跨模組、schema、高風險 | Opus 4.8；Protected paths 才 Leader |
| **L2** | 多檔、模式固定 | **Sonnet 4.6**（Task 派工） |
| **L1** | 單檔 routine | 路徑已知 → **Sonnet 4.6**；不明才 explore → Sonnet |
| **L0** | 純命令 | `shell` 或 Grok Build |

### 任務類型路由

| 任務類型 | 首選 |
|----------|------|
| Plan 骨架（Goal／Scope） | Leader（Composer） |
| Plan 細節（DAG／Files／Verify） | Task + GPT 5.5 |
| Plan 工程審（**預設**） | GPT 5.5 / codex |
| Plan 架構審（**觸發制**） | Opus 4.8（`architect` readonly）— 跨模組／紅線／Protected／範圍不清 |
| Plan／diff 對抗審（L3） | Grok 4.5（readonly；不審中文） |
| 字幕／scenes／illustrate（SOP 內） | **跳過 `/agent-plan`**；直做或 `/agent-action` + Domain verify |
| 純 docs／命令對齊 | Leader 自審或 GPT 單審；不開 Opus／Grok |
| 探索 codebase（路徑不明） | Task `explore`（Grok 4.3） |
| L1／L2 實作 | Task + Sonnet 4.6 |
| 高風險核心路徑 | Opus 或 Leader（Domain Protected paths） |
| 前端／UI | Sonnet 4.6；跑 lint + e2e（若 Domain 有） |
| verify / CI 命令 | `shell` |
| 整合 diff、git commit | **Leader only**（Composer） |

### 成本速查（相對「建議路徑」）

| 路徑 | 何時用 | 相對成本 |
|------|--------|----------|
| 內容 SOP 直做 + verify | 字幕／出圖／scenes | **~0.3x** |
| 預設：GPT 單審 + Sonnet +（可選）GPT diff | 一般 L1／L2 | **1.0x** |
| 觸發：+Opus | 跨模組／紅線／範圍不清 | **~1.4x** |
| L3：三員對抗組 + Leader 自審 | Protected／schema／跨模組契約 | **~2.0–2.5x** |
| 每次都硬開舊「四員」 | **禁止當預設** | 浪費 |

---

## Plan 模板

```markdown
## Goal
（一句話）

## Scope / Out of scope
- In: ...
- Out: ...

## Task DAG
- [ ] T1（L2, claude-4.6-sonnet-medium-thinking）— 依賴：無 — 可並行：T2
- [ ] T2（L0, shell）— 依賴：T1

## Files likely touched
- path/to/file

## Verification
- （從 AGENT-DOMAIN 驗證矩陣挑選具體命令）

## Model routing
| ID | 任務 | Level | Model slug | Subagent |

## Risks & rollback
- ...

---
## Review summary
- 架構審：...
- 工程審：...
- Fable 5（若有）：...
- **Approved / 待決策：** ...
```

---

## 子任務 Prompt 模板（Task 派工）

```markdown
## Goal
（單一可驗收目標）

## Context
- Repo: <project-name>
- Approved Plan task ID: T1
- Related files: ...
- Domain: docs/AGENT-DOMAIN.md

## Constraints
- 最小 diff；遵守 AGENT-DOMAIN 紅線
- （面向使用者的產出語言，見 Domain）

## Do NOT
- commit / push（除非 Leader 明確授權）
- 修改：...（範圍外）

## Verification
- ...

## Deliverable
- 改了哪些檔、摘要、未解問題
```

---

## Ship 政策（預設 Meta）

| 情境 | 行為 |
|------|------|
| 預設 | **不** commit / push |
| 使用者說「commit」 | 只 stage 本次相關檔；禁止 `git add -A` |
| 使用者說「ship／push main」 | scoped tests 全綠後依 **Domain § Ship** |
| bump VERSION + 完整 ship | gstack **`/ship`** |

專案若直推 main、PR 流程、或 branch protection，寫在 [`AGENT-DOMAIN.md`](AGENT-DOMAIN.md)。

---

## 反模式（Meta）

| 反模式 | 為什麼 |
|--------|--------|
| 用 `/agent-action` 從零規劃大功能 | 缺審核、scope 漂移 |
| 用 `/agent-plan` 卻偷偷實作 | 指令語意混淆 |
| 多 agent 改同一檔 | 衝突 |
| `git add -A` | 混 WIP |
| 跳過 Domain 驗證矩陣 | 回歸 |
| 一般 L1／L2 預設 Opus+GPT 雙審 | 成本偏高；改 GPT 單審，Opus 觸發制 |
| 每次硬開舊「四員」當預設 | 浪費；L3／Protected 才上三員對抗組 |
| SOP 內字幕／出圖硬開 `/agent-plan` | 應走內容管線 + verify |

專案特有反模式見 [`AGENT-DOMAIN.md`](AGENT-DOMAIN.md)。

---

## 相關文件

- [`.cursor/commands/agent-plan.md`](../.cursor/commands/agent-plan.md)
- [`.cursor/commands/agent-action.md`](../.cursor/commands/agent-action.md)
- [`.claude/commands/agent-plan.md`](../.claude/commands/agent-plan.md)（Claude Code 委員會版）
- [`.claude/commands/agent-action.md`](../.claude/commands/agent-action.md)（Claude Code 行動小組版）
- [`.cursor/rules/agent-orchestration.mdc`](../.cursor/rules/agent-orchestration.mdc)
- [`AGENT-DOMAIN.md`](AGENT-DOMAIN.md)
- [`AGENT-FAILURES.md`](AGENT-FAILURES.md)（model-call 失敗案例簿）

---

## 修訂紀錄

| 日期 | 說明 |
|------|------|
| 2026-06-16 | 可攜 Meta 初版（Domain 外置至 AGENT-DOMAIN.md） |
| 2026-06-19 | Composer 2.5 節流：Leader 僅編排／整合；Plan 細節→GPT 5.5；L1/L2 實作→Sonnet |
| 2026-07-09 | 新增 Claude Code 委員會版命令（`.claude/commands/`）與 `AGENT-FAILURES.md` 失敗案例簿 |
| 2026-07-09 | Cursor 版命令對齊委員會工作流（分級雙審／四員全上、FAILURES 協議）；新增兩環境對標表、Grok 4.5 slug |
| 2026-07-09 | 縫隙補強：Meta `/agent-action` 分級 diff 審、Composer 自審門檻、Grok 缺席降級標記、純文件可降級雙審、Cursor Task 失敗協議 |
| 2026-07-09 | 成本優化：預設 GPT 單審、Opus／Grok 觸發制、內容管線跳過委員會、L1 已知路徑免 explore、小 diff 可跳過 action diff 審；L3 改稱三員對抗組 + Leader 自審 |
