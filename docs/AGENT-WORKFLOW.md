# Agent 編排 Workflow（全專案通用）

本文件定義 **Meta layer**：誰規劃、誰審核、誰實作、誰驗證。  
Domain 具體步驟見各 playbook，例如 [EPISODE-WORKFLOW.md](./EPISODE-WORKFLOW.md)（單集插圖）。

**入口指令（Cursor slash commands）：**

| 指令 | 用途 |
|------|------|
| **`/agent-plan`** | 規劃 + **Opus / GPT 審核**（不實作） |
| **`/agent-action`** | 依 Approved Plan **拆任務 + 分模型實作** + Verify |

**啟用範圍：** 只有打出上述指令時才進入 Agent Orchestration 模式。一般 chat 不會自動拆任務、派子 agent 或跑雙審。

規則精簡版：`.cursor/rules/agent-orchestration.mdc`（**僅在打出指令時啟用**，`alwaysApply: false`）。

---

## 兩層架構

| 層級 | 文件 | 內容 |
|------|------|------|
| **Meta** | 本文件 | 模型分工、`/agent-plan` & `/agent-action`、路由、prompt 模板 |
| **Domain** | `docs/EPISODE-WORKFLOW.md` 等 | 字幕校對、illustrate、verify 等具體命令與產物 |

原則：**Meta 管「誰做」；Domain 管「做什麼、怎麼驗收」。**

---

## 流程總覽

```
/agent-plan          /agent-action              （使用者要求時）
    │                     │
    ▼                     ▼
 Plan ──► Review ──► Approved Plan ──► Implement ──► Verify ──► Ship
(Composer) (Opus+GPT)                  (分模型派工)    (Grok/shell) (Leader)
```

| 階段 | 指令 | Leader | 子 agent / 模型 |
|------|------|--------|-----------------|
| 規劃 | `/agent-plan` | Composer 2.5 | — |
| 審核 | `/agent-plan` | — | Opus 4.8 + GPT 5.5 並行；Fable 5 備選 |
| 實作 | `/agent-action` | Composer 2.5 拆任務 | 依路由表（Sonnet / Grok / Opus…） |
| 驗證 | `/agent-action` | Composer 整合後 | Grok Build / `shell`；GPT review diff |
| 交付 | `/agent-action` | Composer | commit/push 僅在使用者要求時 |

**跳過 `/agent-plan`：** 單檔 typo、一條命令、使用者說「直接做」→ 可只跑 `/agent-action`（Leader 心裡帶最小 plan 即可）。

---

## `/agent-plan`（規劃 + 審核）

> 指令檔：`.cursor/commands/agent-plan.md`

### 目標

產出 **Approved Plan**，供後續 `/agent-action` 執行。**預設不寫 code、不生圖、不 commit。**

### 步驟

1. **Leader（Composer 2.5）** 讀需求 + 相關 domain playbook，撰寫 Draft Plan（見 [Plan 模板](#plan-模板)）。
2. **並行 Review（必做，各一輪）**
   - **Opus 4.8**（`claude-opus-4-8-thinking-medium`）：範圍、架構、過度工程、與 repo 慣例
   - **GPT 5.5**（`gpt-5.5-medium`）：步驟可執行性、驗證命令、漏檔、測試缺口
   - **Fable 5**（`claude-fable-5-thinking-medium`）：**備選** — 僅在 Opus 與 GPT 意見衝突或邊界模糊時加跑第三意見
3. **Leader 綜合** → **Approved Plan**（含「需使用者決策」項）→ 提示下一步：**`/agent-action`**

### 禁止

- commit / push、全幕生圖、大量刪檔（除非使用者在本輪明確授權）
- 無限輪審（Review 最多 Opus + GPT + 可選 Fable 一輪）

---

## `/agent-action`（拆分 + 分模型實作）

> 指令檔：`.cursor/commands/agent-action.md`

### 前置

- 已有 **Approved Plan**（來自 `/agent-plan` 或使用者貼上的計畫）
- 無 plan → 簡短說明缺什麼，建議先 `/agent-plan`

### 步驟

1. Leader 讀 Approved Plan 的 Task DAG 與 Model routing。
2. **依路由表派 Task 子 agent**（prompt 用 [子任務模板](#子任務-prompt-模板)）。
3. Leader **整合** diff、解衝突、最小改動。
4. **Verify**（Plan 中列出的命令 + 必要時 GPT diff review）。
5. **Ship**：僅使用者要求時 commit/push；**只 stage 本次相關檔**。

### 派工規則

- ✅ 可並行：不同檔案 / 不同目錄
- ❌ 禁止：多 agent 同時改同一檔
- 高成本（全幕生圖、push）需 Plan 已授權或本輪使用者確認

### 何時不派子 agent

- 改動 < 10 行且無架構影響 → Leader 直接做
- 使用者說「不要拆」
- 子 agent context 比 Leader 自做還重

---

## 模型 slug 對照表

Task 的 `model` **只能**用下列 slug：

| UI / 口語 | slug | 主要用途 |
|-----------|------|----------|
| Composer 2.5 | `composer-2.5-fast` | **Leader**、Plan、整合、高判斷決策 |
| Opus 4.8 Thinking Medium | `claude-opus-4-8-thinking-medium` | Plan 架構審核、L3 實作 |
| GPT 5.5 Medium | `gpt-5.5-medium` | Plan 工程審核、TS/React、diff review |
| Sonnet 4.6 Thinking Medium | `claude-4.6-sonnet-medium-thinking` | L2、字幕/scenes/characters |
| Grok 4.3 | `grok-4.3` | 快速 explore |
| Grok Build 0.1 | `grok-build-0.1` | Shell、批次命令、監控長任務 |
| Fable 5 Thinking Medium | `claude-fable-5-thinking-medium` | **備選** Plan 第三意見 |

slug 不可用時：**不要**替換模型；Leader 代做並告知使用者。

---

## 複雜度分級（L0–L3）

| 級別 | 特徵 | `/agent-action` 模型 |
|------|------|----------------------|
| **L3** | 跨模組、pipeline 核心、首次 schema | Composer 2.5 或 Opus 4.8 |
| **L2** | 多檔、模式固定 | **Sonnet 4.6** 或 Composer 2.5 |
| **L1** | 單檔 routine | Sonnet 4.6 或 Grok 4.3 |
| **L0** | 純命令 | Grok Build 0.1 / `shell` |

### 任務類型路由（優先於純 L 級）

| 任務類型 | 首選 | 備選 |
|----------|------|------|
| Plan 撰寫 | Composer（Leader） | — |
| Plan 審核（架構） | Opus 4.8 | Fable 5 |
| Plan 審核（工程） | GPT 5.5 | Sonnet 4.6 |
| 探索 codebase | Composer + `explore` | Grok 4.3 |
| 中文字幕校對 | **Sonnet 4.6** | Composer 2.5 |
| characters / scenes JSON | **Sonnet 4.6** | Composer 2.5 |
| illustrate prompt / ref 鏈 | Composer 或 Opus | — |
| 批次 `--scene N` 生圖 | Grok Build + Leader 監控 | `shell` |
| verify / check | Grok Build 0.1 | `shell` |
| git commit | **Leader only** | — |

中文字幕 / characters / scenes：**不要** Grok。

---

## Plan 模板

`/agent-plan` 產出格式：

```markdown
## Goal
（一句話）

## Scope / Out of scope
- In: ...
- Out: ...

## Task DAG
- [ ] T1（L2, claude-4.6-sonnet-medium-thinking）— 依賴：無 — 可並行：T2
- [ ] T2（L0, grok-build-0.1）— 依賴：T1

## Files likely touched
- path/to/file

## Verification
- `npm run verify:episodes`
- ...

## Model routing
| ID | 任務 | Level | Model slug | Subagent |
|----|------|-------|------------|----------|

## Risks & rollback
- ...

---
## Review summary（/agent-plan 完成後由 Leader 填）
- Opus：...
- GPT 5.5：...
- Fable 5（若有）：...
- **Approved / 待決策：** ...
```

---

## 子任務 Prompt 模板

`/agent-action` 派 Task 時**必填**：

```markdown
## Goal
（單一可驗收目標）

## Context
- Repo: podcast-website
- Approved Plan task ID: T1
- Related files: ...
- Domain: docs/EPISODE-WORKFLOW.md（若適用）

## Constraints
- 最小 diff；不改 unrelated 檔
- 繁體中文（面向使用者的產出）
- 命名慣例（例：藍色小巴士）

## Do NOT
- commit / push
- 全幕生圖（除非授權）
- 修改：...

## Verification
- ...

## Deliverable
- 改了哪些檔、摘要、未解問題
```

---

## Verify & Ship（在 `/agent-action` 內）

```bash
npm run verify:episodes
npm run verify:episodes -- --strict   # approve 前
npm run check                           # 與 CI 一致
```

| 結果 | 動作 |
|------|------|
| error | 修到 0 再宣稱完成 |
| warn | 記錄；`--strict` 視為失敗 |
| diff review | GPT 5.5 或 `code-reviewer` |

**Git：** 只 stage 相關檔；使用者未要求不 commit/push。

Episode staging 範例：

```bash
git add data/subtitles/<slug>.json data/scenes/<slug>.json \
  data/characters.json data/characters.ts \
  data/stories.ts data/apple-sync.defaults.json \
  public/stories/<slug>/ public/characters/
```

---

## Domain：Episode 對照

完整步驟：[EPISODE-WORKFLOW.md](./EPISODE-WORKFLOW.md)、字幕校對：[SUBTITLE-PROOFREAD.md](./SUBTITLE-PROOFREAD.md)。

| 步驟 | Domain | `/agent-plan` 寫入 DAG | `/agent-action` 路由 |
|------|--------|------------------------|----------------------|
| 0 | transcribe（若缺側車） | ✅ | Grok Build / shell |
| 1 | 字幕校對 + `--mark` | ✅ | Sonnet 4.6 |
| 2 | characters + 定裝 | ✅ | Sonnet 4.6；生圖 Leader 決策 |
| 3 | segment + 編輯 scenes | ✅ | Sonnet 4.6 |
| 4 | 生圖 + approve | ✅（標高成本） | Grok Build；Leader 審圖 |
| 5 | verify | ✅ | Grok Build |
| 6 | commit | ✅（可選） | Leader |

**建議用法：** `/agent-plan 處理 ep-7 全流程` → 審核通過 → `/agent-action 依 Approved Plan 執行 ep-7`。

---

## 反模式

| 反模式 | 為什麼 |
|--------|--------|
| 用 `/agent-action` 從零規劃大功能 | 缺審核、scope 漂移 |
| 用 `/agent-plan` 卻偷偷實作 | 指令語意混淆 |
| 每個小改都 `/agent-plan` 雙審 | 太慢 |
| 多 agent 改同一檔 | 衝突 |
| 中文校對 Grok | 專名錯誤 |
| `git add -A` | 混 WIP（曾 kart-game 混入 ep commit） |

---

## 相關文件

- [EPISODE-WORKFLOW.md](./EPISODE-WORKFLOW.md)
- [README — illustrate](../README.md)
- `.cursor/commands/agent-plan.md`
- `.cursor/commands/agent-action.md`
- `.cursor/rules/agent-orchestration.mdc`

---

## 修訂紀錄

| 日期 | 說明 |
|------|------|
| 2026-06-13 | 初版 |
| 2026-06-13 | 改以 `/agent-plan`、`/agent-action` 為入口；Fable 5 備選 review；EPISODE 互連 |
