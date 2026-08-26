# Agent Action（GrokBot：拆分 + 施工 + 驗證）

**本指令啟用 GrokBot Orchestration**。

依 [`docs/AGENT-WORKFLOW.md`](../../docs/AGENT-WORKFLOW.md) `/agent-action`，執行方式見 [`docs/GROKBOT-TEAM.md`](../../docs/GROKBOT-TEAM.md)。

本指令負責實作與驗證，不重做完整 Plan（blocked 除外）。

**Domain：** [`docs/AGENT-DOMAIN.md`](../../docs/AGENT-DOMAIN.md)  
**失敗案例簿：** [`docs/AGENT-FAILURES.md`](../../docs/AGENT-FAILURES.md)

## 前置

- 已有 Approved Plan（`/agent-plan`、使用者貼上、或 `plans/grokbot-*.md`）
- 內容管線 SOP 內可無 Plan，但字幕車仍拒絕 Grok 定稿中文
- 其他任務無計畫 → 列出缺什麼，建議 `/agent-plan`

## 你要做的事

### 0. Bootstrap

同 agent-plan §0。可見行為變更依 Domain § Docs sync。

### 1. 讀 Plan

確認 Task DAG、依賴、Model routing。內容管線對照 `docs/EPISODE-WORKFLOW.md`。

### 2. 派工（場內角色，非 Cursor Task）

| 級別 | 誰做 |
|------|------|
| L3／Protected | 隊長親自，或停下來建議 Cursor／Opus |
| L2 | 施工車 |
| L1 路徑已知 | 施工車 |
| L1 路徑不明 | 探路車 → Handoff → 施工車 |
| L0 | 驗車列出命令；本 sandbox 通常不能代替使用者本機 npm |

禁止多角色敘述上同時改同一檔。小於 10 行且無架構影響 → 隊長直接做。

每個子任務輸出含 Goal、Context paths、Constraints、Do NOT、Verification、Deliverable。探路後必附 Handoff 全欄。

落檔用 GitHub：預設 `feat/*` 分支，不直推 `main`。

### 3. 隊長整合

最小 diff。未在 Plan 寫明不得改對外行為。

### 4. 驗車（必跑對照）

依 Domain 驗證矩陣列出：

- 已在本環境執行的結果
- **須使用者本機執行**的命令（`npm test`、`npm run lint`、`npm run verify:episodes`、`npm run check` 等）
- 未全綠不得宣稱完成

委員缺席不省驗證矩陣。

### 5. Diff 審（分級、唯讀）

- 可標跳過：已有 Approved Plan、diff 約小於 80 行、未碰 Protected／紅線、無 UI 風險
- UI 風險（黏土車不可省略）：`min-height`、`padding`、`gap`、`animation`、`transition`、`transform`、`prefers-reduced-motion`、`z-index`；或元件 `StoryPlayer`、`PlayButton`、`StoryCard`、`Chip`、`GamePageShell`、`LandingSegment`、`SiteNavBar`；或 `useAnimation`／`requestAnimationFrame`／`@keyframes`
- 一般：工程車 + 黏土車
- L3／紅線／Protected：再加找碉車

### 6. Ship（僅使用者要求）

預設不 commit／push。commit 只 stage 本次相關檔。ship／push 前本機 `npm run check` 須綠。完整 VERSION ship 走 gstack `/ship`。

### 7. CRITICAL

A／B／C；僅 A 改檔。

### 8. 禁止

- 禁止 Fable 5
- 禁止無 Plan 擴大 scope（內容 SOP 除外）
- 禁止跳過 Verify 宣稱完成
- 禁止 `git add -A`
- 禁止自動 `--approve` 插圖或連抽場景

### 9. 分配表（必附）

| # | 任務 ID | subagent_type | model slug | 做了什麼 | 產出 | 狀態 |
|---|---------|---------------|------------|----------|------|------|
| 0 | Leader | leader | `cursor-grok-4.5-high-fast` | 讀 Plan、整合 | 變更摘要 | 完成（GrokBot 場內代行） |
| 1 | T1 | builder | `composer-2.5-fast` | （依 Plan） | 檔案路徑 | 完成（GrokBot 場內代行）／缺席（跨環境模型不可呼叫） |
| 2 | Verify | verifier | `grok-build-0.1` | 驗證矩陣對照 | 已跑／須本機跑 | 完成／部分須本機 |
| 3 | 工程 diff 審 | engineer | `gpt-5.6-luna-max-fast` | 工程面 | 意見 | 完成（GrokBot 場內代行）／跳過／缺席（跨環境模型不可呼叫） |
| 4 | 設計審 | designer | `claude-opus-5-thinking-high` | UX／a11y | 意見 | 完成（GrokBot 場內代行）／跳過／缺席（跨環境模型不可呼叫） |
| 5 | 對抗審 | adversary | `composer-2.5-fast` | edge case | 意見 | 完成（GrokBot 場內代行）／跳過／缺席（跨環境模型不可呼叫） |
| 6 | Ship | leader | `cursor-grok-4.5-high-fast` | commit／PR | hash／PR URL | 完成／未執行 |

## 輸出語言

繁體中文。
