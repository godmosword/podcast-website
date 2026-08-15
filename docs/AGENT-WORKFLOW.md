# Agent 編排 Workflow（Meta）

本文件定義 **Meta layer**：誰規劃、誰審核、誰實作、誰驗證。  
**Domain**（Bootstrap、紅線、驗證矩陣、Ship）見同 repo 的 [`docs/AGENT-DOMAIN.md`](AGENT-DOMAIN.md)。

**入口指令（Cursor slash commands）：**

| 指令 | 用途 |
|------|------|
| **`/agent-plan`** | 規劃 + **固定三審委員會**（GPT 5.6 Luna MAX fast + Composer 2.5 對抗審 + Opus 5 設計審。預設不實作） |
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

**Cursor Task 探活（Bootstrap 加讀）：** 依 [`AGENT-FAILURES.md`](AGENT-FAILURES.md) 掃缺席表後，若本次將派 `gpt-5.6-luna-max-fast`、`composer-2.5-fast`（對抗審）或 `cursor-grok-4.5-high-fast`（Leader session 探活可選）且該 slug 無 30 天缺席紀錄，可各派一次最小 readonly Task（prompt：`回覆 OK`）確認 slug 可用；失敗即追加案例並標缺席。**勿每次 plan/action 重複探活**——僅 Bootstrap 或缺席解除後。

可見行為變更：依 Domain 的 **Docs sync** 段落更新 changelog／待辦／導航。

---

## CRITICAL 互動

遇 CRITICAL（資料遺失、安全漏洞、無法回復的破壞、需明確授權才改程式）：

1. 列出發現（一行問題、一行建議修復）
2. 每題固定選項：**A** 現在修／**B** 已知悉暫不修／**C** 誤判略過
3. **僅 A** 才改檔

格式：`CRITICAL-n` + Fix +「請回覆 **CRITICAL-n 選 A / B / C**」

**禁止**用 `AskQuestion`／AUQ MCP 收集選項（會阻塞卡住；見 [`.cursor/rules/no-ask-user-questions.mdc`](../.cursor/rules/no-ask-user-questions.mdc)）。一律聊天文字選項。

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
| 審核 | `/agent-plan` | — | **固定三審**（GPT 5.6 Luna MAX fast + Composer 2.5 對抗審 + Opus 5 設計審）；L3 + Leader 自審 |
| 實作 | `/agent-action` | Leader 拆任務 | Cursor **Task** + model slug（L1／L2→Composer） |
| 驗證 | `/agent-action` | Leader 整合後 | `shell`；必要時 reviewer |
| 交付 | `/agent-action` | Leader | commit/push **僅使用者明確要求** |

**Cursor Plan mode：** 以系統 plan confirm 為準（與「全程自主」並存時，Plan mode 優先）。

**Plan 產物路徑：**

- **Cursor**：CreatePlan 產出的 plan 檔，或 `.cursor/plans/*.plan.md`
- **Claude Code**：plan mode 產物 `~/.claude/plans/<name>.md`（harness 強制路徑）；非 plan mode 用 `/tmp/agent-plan-<unix_ts>.md`
- **`/agent-action`** 尋找順位：使用者貼上的路徑／內容 → `~/.claude/plans/`（取最新）→ `/tmp/agent-plan-*.md`（取最新）；非使用者明示的 plan 取用前先摘要向使用者確認（防過期誤用）

---

## `/agent-plan`（規劃 + 審核）

> 指令檔：[`.cursor/commands/agent-plan.md`](../.cursor/commands/agent-plan.md)

### 目標

產出 **Approved Plan**，供 `/agent-action` 執行。**預設不寫 code、不 commit。**

### 步驟

1. **Bootstrap**（[`AGENT-DOMAIN.md`](AGENT-DOMAIN.md)）
2. **Draft Plan** — Leader（**Grok 4.5 High Fast**）寫 Goal／Scope 骨架 → Task **GPT 5.6 Luna MAX fast** 填 Task DAG、Files、Verification、Model routing（見 [Plan 模板](#plan-模板)）
   - **工程審分離**：工程審為**另一個** readonly Task；prompt 明寫「你未撰寫此 Plan」；須逐條反駁 DAG **≥3 點**
3. **委員會審查（固定三審，必做，全部唯讀）** — 呼叫前依 [`AGENT-FAILURES.md`](AGENT-FAILURES.md) 探活；失敗即記錄＋標缺席
   - **預設（一般 L1／L2）：GPT 5.6 Luna MAX fast + Composer 2.5 對抗審 + Opus 5 設計審** — 可並行 Task
     - **GPT 5.6 Luna MAX fast** 工程審：可行性、驗證命令、漏檔
     - **Composer 2.5** 對抗審：漏洞、edge case、失敗模式（中文定稿仍走 Sonnet）
     - **Opus 5 設計審**：`DESIGN.md` 對齊、兒童主路徑、親子 UX、觸控 ≥44px、`prefers-reduced-motion`、資訊層級、視覺一致性
   - **L3／Protected paths**：固定三審 + Leader 自審（Opus 設計審加強架構／紅線視角）
   - **內容管線跳過委員會**（字幕校對、scenes、illustrate SOP 內出圖）：直做或只 `/agent-action`
   - **純文件／命令檔對齊**：可降級 Leader + GPT；**收尾固定分配表 Composer 對抗審／Opus 列仍須列出**（禁止 `跳過`）
   - **中間級——視覺／樣式微調**（預估 diff &lt;80 行、不碰 Protected paths、不觸發 UI 風險規則）：工程審**單審** + 落地後截圖目檢；Composer 對抗審／Opus 標 `按級距免派`（分配表仍全列）
4. **Leader 綜合** → **Approved Plan** → 提示 **`/agent-action`**
   - **工程審（GPT／Codex）必須成功**才可標 Approved；工程審缺席時由 Opus 頂工程審（見 FAILURES 案例），**不得未審直接過**；全滅 → 回報使用者
   - **Leader 可行性自審**不計入「非 leader 委員」
   - **Composer 對抗審缺席**：GPT 或 Opus 仍成功即可 Approved，標 **「對抗審缺席／對抗性降級」**
5. **收尾輸出** → 必附 **Agent 執行分配表**（見 [收尾輸出：Agent 執行分配表](#收尾輸出agent-執行分配表)）

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
   - **可跳過**：已有 Approved Plan、diff 小（約 &lt;80 行）、未碰 Protected paths／紅線、**且未觸發 UI 風險規則** → 只跑 Verify 即可
   - **UI 風險（Opus 設計審不可跳過）**：diff 命中以下任一 → **必派** Opus 5 設計審（即使 &lt;80 行）：
     - **屬性觸發**：`min-height`、`padding`、`gap`、`animation`、`transition`、`transform`、`@media (prefers-reduced-motion)`、`z-index`
     - **元件 allowlist**：`StoryPlayer`、`PlayButton`、`StoryCard`、`Chip`、`GamePageShell`、`LandingSegment`、`SiteNavBar`
     - **動畫相關 TS/JS**：`useAnimation`、`requestAnimationFrame`、`@keyframes`
   - **一般**：GPT 5.6 Luna MAX fast + Opus 5 設計審（Task）；Python → `python-reviewer`；TS/JS → `typescript-reviewer`
   - **L3／觸紅線／Protected**：再加 Composer 2.5 對抗審
6. 可見行為變更 → Domain § Docs sync
7. **Ship**（僅使用者要求）：只 stage 相關檔；預設不 commit/push
8. **收尾輸出** → 必附 **Agent 執行分配表**（見 [收尾輸出：Agent 執行分配表](#收尾輸出agent-執行分配表)）

### 派工規則

- ✅ 可並行：不同檔案／目錄
- ❌ 禁止：多 agent 同時改同一檔
- 改動 &lt;10 行且無架構影響 → Leader 直接做
- **L1 路徑已知** → 直接 **Composer 2.5**（`composer-2.5-fast`），**不必**先 explore
- **L1 路徑不明** → Task `explore`（`grok-4.3`）再 **Composer 2.5**；實作 Task prompt **必附** [Handoff 模板](#handoffexplore--實作)
- 遵守 Domain § **Protected paths / models**（若有）

### Cursor vs Claude Code 對標表

兩環境同一套工作流（分級委員會＋行動小組＋失敗案例簿），只有「怎麼呼叫模型」不同。

**兩環境 agent group 已分家（2026-07-18）**——本表 Claude Code 欄與 Cursor 欄的 **Leader／對抗審／L1・L2 實作**刻意不同；下方主文與「任務類型路由」表的通用敘述以 **Cursor／canonical** 為準，Claude Code 覆寫一律以本表為單一依據：

| 角色 | Claude Code（[`.claude/commands/`](../.claude/commands/agent-plan.md)） | Cursor（[`.cursor/commands/`](../.cursor/commands/agent-plan.md)） |
|------|------|------|
| **Leader** | 當前 session＝**Opus 5 Thinking High**（`claude-opus-5-thinking-high`）（骨架＋綜合；中文 Protected 不直改） | Session／Task 對齊 `cursor-grok-4.5-high-fast`（節流：只寫骨架，細節派 GPT） |
| **Opus 5 設計審** | Agent tool `architect` + `model: "opus"`（附 `DESIGN.md`） | Task `architect`（readonly）+ `claude-opus-5-thinking-high` |
| **GPT 5.6 Luna MAX fast 工程審** | `codex exec -m gpt-5.6-luna -c model_reasoning_effort="medium" "…" </dev/null`（**Claude Code Codex CLI**；裸 `gpt-5.6` 於 ChatGPT 帳號 400，勿用） | Task + `gpt-5.6-luna-max-fast`（**Cursor Task slug**） |
| **對抗審** | Grok 4.5 High Fast：`cursor-agent -p --model cursor-grok-4.5-high-fast --mode ask`（**每輪 plan 必派**）；slug 拒收**或認證失敗** → 備援 grok CLI `-m grok-4.6`；兩路皆失敗 → 缺席 | Composer 2.5：Task（readonly）+ `composer-2.5-fast`（**每輪 plan 必派**；slug 不可用 → 缺席） |
| **Leader 可行性自審（L3）** | Leader 自審 | Leader 自審（**不計入**非 leader 委員） |
| **L3 實作** | Leader 親自 | Task + Opus slug，Protected paths 才 Leader |
| **L2 實作** | Grok patch（`cursor-agent --model cursor-grok-4.5-high-fast` ask）→ Leader 落檔；**中文 → Sonnet** | Task + `composer-2.5-fast` |
| **L1 實作** | 同 L2（Grok patch → Leader 落檔）；&lt;10 行 Leader | 路徑已知 → Composer；不明 → explore → Composer；&lt;10 行 Leader |
| **L0 命令** | Bash | Task `shell` 或 `grok-build-0.1` |
| **改檔權** | Leader 落檔；Composer／Codex／外部 CLI 出 patch 唯讀；中文 Sonnet | 實作 Task（Composer）可改檔；顧問一律 `readonly: true` |
| **失敗記錄** | 兩邊共用 [`AGENT-FAILURES.md`](AGENT-FAILURES.md)：Bootstrap 必讀、call fail 必追加、30 天連續 2+ fail → 標缺席 | 同左 |

---

## 模型 slug 對照表

**本表為全 repo 模型 slug 的單一來源（single source of truth）**——`.claude/commands/`、`.cursor/commands/`、`AGENT-FAILURES.md` 內的 slug 若與本表衝突，一律以本表為準；升級模型時先改本表，再同步命令檔。

Task 的 `model` **只能**用 Cursor 允許的 slug：

| UI / 口語 | slug | 主要用途 |
|-----------|------|----------|
| Grok 4.5 High Fast | `cursor-grok-4.5-high-fast` | **Cursor Leader** 編排、整合、git、&lt;10 行微調；**Claude Code 對抗審／L1・L2 實作**（`cursor-agent -p --model cursor-grok-4.5-high-fast --mode ask`）（**節流**；不直改中文 Protected） |
| Composer 2.5 | `composer-2.5-fast` | **L1／L2 實作預設**；Plan／diff **對抗審**（唯讀；**每輪 plan 必派**；slug 不可用 → 缺席，勿頂替） |
| Opus 5 Thinking High | `claude-opus-5-thinking-high` | Plan／diff **設計審**（UX、`DESIGN.md`、兒童體驗、a11y 視覺；**每輪 plan 必派**）；**Claude Code Leader**（Plan／Action session） |
| GPT 5.6 Luna MAX fast | `gpt-5.6-luna-max-fast` | Plan 細節草稿、工程審、TS/React diff review（Cursor Task） |
| Sonnet 4.6 Thinking Medium | `claude-4.6-sonnet-medium-thinking` | 內容管線中文校對（見 Domain Protected paths） |
| Grok（**grok CLI 備援**，Claude Code） | `grok-4.6` | Claude Code 對抗審備援：`cursor-agent` slug 拒收**或認證失敗**時走此路。**與 `cursor-grok-4.5-high-fast` 是兩套 model id，勿混用**；CLI 不吃 `-fast` 變體。允許清單會漂移（2026-08-15 由 `grok-4.5` 換 `grok-4.6`），呼叫前用 `grok models` 核對「Available models」 |
| Grok 4.3 | `grok-4.3` | explore（只讀） |
| Grok Build 0.1 | `grok-build-0.1` | shell、批次命令 |

**已淘汰／禁止派工：** Fable 5（`claude-fable-5-thinking-medium` 及任何 `claude-fable-5-*`）— `/agent-plan`／`/agent-action` **不得呼叫**；Cursor 機械閘門 [`.cursor/hooks/block-fable.mjs`](../.cursor/hooks/block-fable.mjs)（`preToolUse`＋`subagentStart`）。

slug 不可用時：**不要**替換；Leader 代做並告知使用者。
**例外——對抗審（Composer 2.5，readonly）**：Leader 不代做、其他模型不頂替；缺席標記但仍須出現在**固定分配表**。
**L1／L2 實作（Composer 2.5）**：slug 拒收 → Leader 接手實作，分配表註明缺席。

---

## 複雜度分級（L0–L3）

| 級別 | 特徵 | `/agent-action` |
|------|------|-----------------|
| **L3** | 跨模組、schema、高風險 | Opus 5；Protected paths 才 Leader |
| **L2** | 多檔、模式固定 | **Composer 2.5**（Task 派工） |
| **L1** | 單檔 routine | 路徑已知 → **Composer 2.5**；不明才 explore → Composer |
| **L0** | 純命令 | `shell` 或 Grok Build |

### 任務類型路由

| 任務類型 | 首選 |
|----------|------|
| Plan 骨架（Goal／Scope） | Leader（Grok 4.5 High Fast） |
| Plan 細節（DAG／Files／Verify） | Task + GPT 5.6 Luna MAX fast |
| Plan 工程審（**預設固定**） | GPT 5.6 Luna MAX fast（Cursor）／Codex CLI `gpt-5.6-luna`（Claude Code） |
| Plan **設計審**（**預設固定**） | Opus 5（`architect` readonly；讀 `DESIGN.md`）— UX、兒童體驗、觸控、a11y 視覺 |
| Plan／diff 對抗審（**預設固定**） | Composer 2.5（readonly；每輪必派） |
| 字幕／scenes／illustrate（SOP 內） | **跳過 `/agent-plan`**；直做或 `/agent-action` + Domain verify（Sonnet）。**整集生圖一輪即停**；重抽須先列幕號等文字確認（Domain 紅線／`podcast.mdc`） |
| 純 docs／命令對齊 | Leader 自審或 GPT；分配表 Composer 對抗審列仍須列出 |
| 探索 codebase（路徑不明） | Task `explore`（Grok 4.3） |
| L1／L2 實作 | Task + Composer 2.5 |
| 高風險核心路徑 | Opus 或 Leader（Domain Protected paths） |
| 前端／UI | Composer 2.5；跑 lint + e2e（若 Domain 有） |
| verify / CI 命令 | `shell` |
| 整合 diff、git commit | **Leader only**（Grok 4.5 High Fast） |

### 成本速查（相對「建議路徑」）

| 路徑 | 何時用 | 相對成本 |
|------|--------|----------|
| 內容 SOP 直做 + verify | 字幕／出圖／scenes | **~0.3x** |
| 預設：GPT + Composer 對抗審 + Opus 設計三審 + Composer 實作 | 一般 L1／L2 plan | **1.0x** |
| L3：三審 + Leader 自審 | Protected／schema／跨模組契約 | **~2.0–2.5x** |
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
- [ ] T1（L2, composer-2.5-fast）— 依賴：無 — 可並行：T2
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

## Handoff（explore → 實作）

路徑不明、先 `explore` 再派實作 Task 時，Leader 或 explore agent **必須**在實作 prompt 填入：

```markdown
## Handoff（explore → 實作，必填）
- **目標**：（一句話）
- **已確認路徑**：`path/to/file`（含入口函式／export）
- **錨點**：相關型別、常數、測試檔
- **未知項**：仍需 Leader 決策的點
- **Protected paths**：禁止碰觸的路徑（見 AGENT-DOMAIN）
- **建議 L 級**：L0–L3
```

---

## 收尾輸出：Agent 執行分配表

`/agent-plan` 與 `/agent-action` **收尾回覆必附**（Leader 從派工起即維護）。

**固定全表規則（`/agent-plan`）：** 必列 #0–#5 全行；**不得省略 Composer 對抗審／Opus 列**；禁止標 `跳過`（僅 `完成`／`未派`／`缺席`／`對抗審缺席／對抗性降級`）。

與 Plan 模板內 **Review summary**（委員意見／採納）分工：Review summary 偏決策；分配表偏**稽核／成本**——誰跑、用什麼 model、實際產出。

### `/agent-plan` 表欄位

| # | 角色 | 執行方式 | subagent_type | model slug | 做了什麼 | 產出 | 狀態 |

涵蓋：Leader（Grok High Fast）、Plan 細節、**GPT 5.6 Luna MAX fast 工程審**、**Composer 2.5 對抗審**、**Opus 5 設計審**、Leader 自審。

### `/agent-action` 表欄位

| # | 任務 ID | subagent_type | model slug | 做了什麼 | 產出（檔案／命令結果） | 狀態 |

涵蓋：實作 Task（Composer）、Leader 整合、Verify、diff 審（GPT + Opus 設計 + Composer 對抗審；或標 `跳過`）、Ship。

### 狀態欄慣例

`完成`｜`未派`｜`跳過`｜`缺席`｜`對抗審缺席／對抗性降級`｜`按級距免派`（中間級視覺／樣式微調）｜`未執行`（Ship 僅在使用者要求時）

指令檔範本見 [`.cursor/commands/agent-plan.md`](../.cursor/commands/agent-plan.md) §7、[`.cursor/commands/agent-action.md`](../.cursor/commands/agent-action.md) §10，及 [`.claude/commands/`](../.claude/commands/) 對應章節。

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
| 一般 L1／L2 預設 Opus+GPT 雙審 | 成本偏高；改 **GPT + Composer 對抗審 + Opus 設計固定三審** |
| 收尾分配表省略 Composer 對抗審／Opus 列 | 違反固定全表 |
| 每次硬開舊「四員」當預設 | 浪費；L3 才加 Opus |
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
| 2026-07-11 | Opus 4.8 設計審加入固定三審（`DESIGN.md`、兒童 UX、a11y 視覺）；取代 Opus 觸發制架構審 |
| 2026-07-12 | 工程模型路由：Cursor Task 由 GPT 5.6 Sol Medium 改為 **GPT 5.6 Luna MAX fast**（`gpt-5.6-luna-max-fast`）；Claude Code 仍用 Codex CLI `gpt-5.6` |
| 2026-07-11 | 模型升級：GPT 5.6 Sol Medium、Grok 4.5 Fast Medium；預設改固定雙審；分配表固定全表、Grok 禁止跳過；codex 須 `</dev/null` |
| 2026-07-10 | 收尾必附 Agent 執行分配表（各 agent 做了什麼 + model slug）；指令檔 §7／§10 與本節對齊 |
| 2026-07-11 | L1／L2 實作預設改為 Grok 4.5 Fast Medium（Sonnet 保留給 Domain 內容管線） |
| 2026-07-12 | 框架改進：Grok Cursor slug 改 fast-high（07-16 已再淘汰，見下）；UI 風險觸發 Opus 設計審；explore handoff；Plan 工程審分離；`check-agent-docs-contract` 契約測試 |
| 2026-07-16 | Codex CLI 升 0.144.5 解鎖 `gpt-5.6-luna`：Claude Code codex exec 路由由裸 `gpt-5.6`（ChatGPT 帳號 400）改 `gpt-5.6-luna`；契約測試同步反轉（禁裸 5.6、禁 Cursor luna-max-fast 進 codex exec） |
| 2026-07-16 | Grok slug 對齊：Cursor Task 由 fast-high 改 **`cursor-grok-4.5-medium-fast`**（Cursor 允許清單變更，見 FAILURES 07-16）；Claude Code CLI 呼叫統一 `-m grok-4.5`（07-13 案例正式落表）；顯示名改「Grok 4.5 Medium Fast」 |
| 2026-07-12 | 治理修正：user-level Q-Silicon 命令改名 `qs-agent-plan`／`qs-agent-action`（根除同名注入）；plan 檔順位支援 `~/.claude/plans/`；Approved 門檻改「工程審必須成功」；新增中間級（視覺／樣式 &lt;80 行工程單審，`按級距免派`）；slug 對照表定為單一來源 |
| 2026-07-17 | CRITICAL 互動禁止 AUQ／AskQuestion；改聊天文字 A/B/C（對齊 `no-ask-user-questions.mdc` + `block-auq` hook） |
| 2026-07-18 | 角色對調：Leader → **Grok 4.5 High Fast**（`cursor-grok-4.5-high-fast`）；對抗審與 L1／L2 實作 → **Composer 2.5**（`composer-2.5-fast`）；內容管線仍 Sonnet；契約測試同步 |
| 2026-07-18 | **Claude Code／Cursor agent group 分家**：Claude Code Leader → **Fable 5 Thinking Medium**（`claude-fable-5-thinking-medium`）優先、不可用時 **Opus 4.8 Thinking Medium**；Claude Code 對抗審＋L1／L2 實作 → **Grok 4.5 High Fast**（`cursor-agent --model cursor-grok-4.5-high-fast`）。Cursor 欄維持 Grok Leader＋Composer 對抗審／L1L2 不變；`.claude/commands/*` 同步 |
| 2026-07-20 | **移除 Fable 5**：Claude Code Leader（Plan／Action session）一律 **Opus 4.8 Thinking Medium**（`claude-opus-4-8-thinking-medium`），不再有 fallback 二選一；slug 對照表刪 Fable 5 列、`.cursor/rules/agent-orchestration.mdc` 備選 Plan 審改 Opus；契約測試新增負向斷言（active 路由檔禁 `claude-fable-5-thinking-medium` 與 `Fable 5` 字樣，本修訂紀錄段除外） |
| 2026-07-20 | **Fable 5 硬擋**：active 指令明令禁止呼叫；新增 `.cursor/hooks/block-fable.mjs`（`preToolUse` Task／CallDynamicTool＋`subagentStart`）；契約改為要求禁令＋hook 註冊，並禁止正向 Task 派工 Fable slug |
| 2026-08-08 | **Cursor Opus 設計審升級**：Task slug `claude-opus-4-8-thinking-medium` 拒收（見 FAILURES 07-31／08-08）→ active 路由改 **`claude-opus-5-thinking-high`**（Opus 5 Thinking High）；Claude Code 設計審／Leader 顯示名對齊；契約測鎖 active 段禁 4.8 slug |
| 2026-08-15 | **補上 SSOT 缺口＋grok CLI slug 漂移**：對照表原本只列 Cursor 的 `cursor-grok-4.5-high-fast`，**未列 grok CLI 備援的 model id**，導致 CLI 允許清單漂移時無處可查。本次新增「grok CLI 備援」列並定為 **`grok-4.6`**（2026-08-15 實測 `grok models` 允許清單已無 `grok-4.5`，見 FAILURES 08-15）。同步：探活表、`.claude/commands/agent-plan.md`／`agent-action.md` 備援命令、契約測試改守 `-m grok-4.6`。另把備援觸發條件由「slug 拒收」放寬為「slug 拒收**或認證失敗**」（08-10／08-15 兩次皆為 auth 失敗，舊寫法在字面上不涵蓋）。**`cursor-grok-4.5-high-fast` 未變更**——它是 Cursor slug，失敗原因是 auth 而非 slug |
