# GrokBot 團隊（xAI / Grok chat 適配層）

> 本檔是 **第三環境**（Grok 對話、Grok skill）的團隊編排。  
> Meta 仍以 [`AGENT-WORKFLOW.md`](AGENT-WORKFLOW.md) 為單一來源；Domain 紅線見 [`AGENT-DOMAIN.md`](AGENT-DOMAIN.md)。  
> **不改** Cursor／Claude Code 的 model slug。本檔只定義「Grok 場內如何代行委員會」。

**啟用：** 使用者在 Grok 說 `/agent-plan`、`/agent-action`、或「GrokBot／隊長開工」。一般閒聊不自動拆任務。

**指令檔：** [`.grok/commands/agent-plan.md`](../.grok/commands/agent-plan.md) · [`.grok/commands/agent-action.md`](../.grok/commands/agent-action.md)  
**花名冊：** [`.grok/team/roster.md`](../.grok/team/roster.md)

---

## 為什麼要有 GrokBot

Cursor 與 Claude Code 已分家（2026-07-18）：

| 環境 | Leader | 工程審 | 對抗審 | 設計審 | L1／L2 實作 |
|------|--------|--------|--------|--------|-------------|
| Cursor | Grok 4.5 High Fast | GPT 5.6 Luna MAX fast | Composer 2.5 | Opus 5 | Composer 2.5 |
| Claude Code | Opus 5 Thinking High | Codex CLI `gpt-5.6-luna` | Grok 4.5 High Fast（備援 `grok-4.6`） | Opus | Grok patch → Leader 落檔 |
| **GrokBot（本檔）** | 本 session＝隊長 Grok | 場內「工程車」代行 | 場內「找碉車」代行 | 場內「黏土車」代行 | 場內「施工車」草案 + GitHub 落檔 |

Grok chat **呼叫不了** Cursor Task slug。若分配表寫 `composer-2.5-fast 完成` 卻沒有 Cursor Task，即為造假。GrokBot 強制標 `完成（GrokBot 場內代行）` 或 `缺席（跨環境模型不可呼叫）`。

---

## 團隊編制

| 代號 | 顯示名 | Canonical slug（稽核欄） | 場內職責 |
|------|--------|--------------------------|----------|
| `leader` | 隊長 Grok | `cursor-grok-4.5-high-fast` | 骨架、綜合、整合、git scope、小於 10 行 |
| `scout` | 探路車 | `grok-4.3` | 只讀探路 + Handoff |
| `engineer` | 工程車 | `gpt-5.6-luna-max-fast` | Plan 細節、工程審、TS/React diff |
| `adversary` | 找碉車 | `composer-2.5-fast` | 對抗審（每輪 plan 必列） |
| `designer` | 黏土車 | `claude-opus-5-thinking-high` | DESIGN.md、兒童 UX、觸控、a11y 視覺 |
| `builder` | 施工車 | `composer-2.5-fast` | L1／L2 實作草案 |
| `verifier` | 驗車 | `grok-build-0.1` | 驗證矩陣對照（本機命令列出） |
| `scribe` | 字幕車 | `claude-4.6-sonnet-medium-thinking` | **拒絕**用 Grok 定稿中文 |

角色卡：`.grok/team/<id>.md`。

---

## 誠實標記

| 實際發生 | 狀態欄 |
|----------|--------|
| 本 session 已用該角色視角產出審查／草案 | `完成（GrokBot 場內代行）` |
| 無法呼叫 Cursor／Codex／Opus Task | `缺席（跨環境模型不可呼叫）` |
| 中間級視覺微調未派對抗／設計 | `按級距免派`（列仍須在） |
| Ship 使用者沒要求 | `未執行` |
| `/agent-plan` 的對抗審／設計審 | **禁止**寫 `跳過` |

工程審必須有一份獨立、可反駁 DAG 的產出，才可標 **Approved**。不得「未審直接過」。

若任務觸及 Protected paths 或需要真・Opus／Composer／Sonnet：隊長應建議切回 Cursor／Claude Code，不要硬撐。

---

## 流程

```
/agent-plan                 /agent-action
    │                            │
    ▼                            ▼
骨架（隊長）→ 細節（工程車）→ 三審 → Approved
                                 │
                                 ▼
                    探路／施工 → 整合 → 驗車 →（可選）Ship
```

內容管線（字幕／scenes／illustrate SOP 內）跳過委員會；字幕車拒絕代做中文定稿。

CRITICAL：聊天文字 A/B/C；僅 A 改檔。禁用 AUQ。

Ship：預設不 commit／push；使用者說 commit 才 scoped stage。GrokBot 優先推 `feat/*` 分支再開 PR，不預設直推 `main`。

---

## 與既有契約的關係

- slug 對照表、L0–L3、Plan／Handoff 模板、固定分配表欄位：**全部沿用 AGENT-WORKFLOW**。
- 本檔只新增「執行方式 = GrokBot 場內代行」這一列語意。
- 契約測試若掃 active 路由檔：`.grok/commands/*` 必須繼續禁止 Fable 5 正向派工。

---

## 修訂紀錄

| 日期 | 說明 |
|------|------|
| 2026-08-26 | 初版：為 xAI Grok chat 補第三環境團隊，不改 Cursor／Claude slug |
