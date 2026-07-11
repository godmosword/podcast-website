# Agent Model-Call 失敗案例簿

> `/agent-plan`、`/agent-action` Bootstrap 時**必讀**本檔；任何外部 model call 失敗後**必追加**。
> 紅線與驗證矩陣見 [`AGENT-DOMAIN.md`](AGENT-DOMAIN.md)；流程見 [`AGENT-WORKFLOW.md`](AGENT-WORKFLOW.md)。

---

## 讀取協議

1. 呼叫任何外部 model 前先掃本檔「案例紀錄」表——Claude Code 的 CLI 呼叫（codex／grok／cursor-agent）與 **Cursor 的 Task 派工**（`gpt-5.6-sol-medium`／`grok-4.5-fast-medium` 等 slug）都算；Task 失敗同樣追加。
2. **缺席判定（可操作定義）**：掃「案例紀錄」表，同一**模型**（不分呼叫命令）在最近 30 天內有 **≥2 列**且**未標「已解除」** → 本次直接標「缺席」，不重試、不浪費額度。
3. 缺席不豁免驗證：委員缺席時，[`AGENT-DOMAIN.md`](AGENT-DOMAIN.md) 驗證矩陣的必要項照跑。
4. 失敗後追加一列到「案例紀錄」，格式見下。

## 探活命令（唯讀、低成本）

**判定標準：看輸出內容，不可只看 exit code**——codex 的 npm wrapper 曾在 binary 遺失時仍回 exit 0（見案例紀錄）。stdout 須含預期回覆（如 `OK`）、stderr 無 spawn／auth 錯誤才算存活。

| 模型 | 探活 |
|------|------|
| GPT 5.6 Sol（codex） | `codex exec -m gpt-5.6 -c model_reasoning_effort="low" "回覆 OK" </dev/null`（spawn ENOENT → 缺席；**須加 `</dev/null`** 防 stdin 掛起） |
| Grok 4.5 Fast Medium（CLI） | `grok models`（出現 `You are not authenticated` → 缺席）；單輪：`grok -p "<prompt>" -m grok-4.5-fast --effort medium --no-plan` |
| Grok 4.5 Fast Medium（Cursor Task） | **無 CLI 探活**；第一次 Task 拒收 slug／派工失敗 → 追加案例紀錄並標**對抗審缺席**，勿用 `grok-4.3` 頂替 |
| Cursor Task（其他 slug） | 無低成本探活；第一次拒收／失敗 → 追加案例並標缺席（對抗審 slug 同上規則） |
| Composer 2.5（cursor） | `cursor-agent -p --model composer-2.5-fast --mode ask "回覆 OK"` |
| Opus 4.8／Sonnet／Haiku | Claude Code Agent tool，不需探活 |

---

## 已知案例（初始種子）

| 案例 | 教訓 → 紅線 |
|------|-------------|
| Grok 做中文校對，專名／語氣錯誤率高 | **Grok 永不碰** `data/subtitles/`、`data/scenes/`、中文文案（同 AGENT-DOMAIN 反模式） |
| Codex 共用 ChatGPT 額度用罄，審查中斷 | 走缺席分支，改 Composer／Opus 頂審；**不得**降級成「未審直接過」 |
| `git add -A` 混入無關 WIP | 只 stage 本次相關檔（AGENT-DOMAIN 紅線） |
| `--approve` 覆蓋 Apple 封面 `01.jpg` | 重抽單幕改用單張 `cp`，勿全量 approve |
| CI 放 `OPENAI_API_KEY` 自動生圖 | 成本失控、無人工審圖；CI 永不持有生圖 key |
| Grok CLI 曾探到未登入（同日稍後已登入） | 呼叫前先 `grok models` 探活；未登入 → 缺席並提醒使用者 `grok login` |
| Grok `-p` 語法：`grok -p -m grok-4.5-fast "<prompt>"` 會報 `a value is required for '--single <PROMPT>'` | prompt 必須緊跟 `-p`：`grok -p "<prompt>" -m grok-4.5-fast --effort medium --no-plan` |
| Cursor Task `grok-4.5-fast-medium` slug 不可用或拒收 | 對抗審標缺席；**勿**用 `grok-4.3` 頂替；分配表仍須列出 Grok 列 |
| `codex exec` 在 Cursor shell 掛起於 `Reading additional input from stdin...` | 命令尾加 **`</dev/null`** 關閉 stdin |

## 案例紀錄（依時間追加）

| 日期 | 命令／模型 | 症狀（exit code／timeout／額度／輸出品質） | 處置 |
|------|------------|---------------------------------------------|------|
| 2026-07-09 | `grok models` / grok-4.5 | `You are not authenticated` | 同日稍後探活已登入、單輪呼叫成功 → 已解除 |
| 2026-07-09 | `codex exec` / gpt-5.5 | spawn ENOENT：`@openai/codex-darwin-arm64` vendor binary 遺失（npm wrapper 在但原生執行檔不在；exit code 仍為 0，須看 stderr 判斷） | 同日 `npm i -g @openai/codex` 重裝後探活回 OK → 已解除 |
| 2026-07-09 | `grok -p` / grok-4.5 | 預設 plan 模式下只輸出一行開場白即結束（exit 0，無審查內容）；另 `--disallowed-tools` 移除 read 工具會使 agent 建構失敗 | 加 **`--no-plan --max-turns 6`** 重試成功 → 已解除；對抗審呼叫一律帶 `--no-plan` |
| 2026-07-09 | `cursor-agent -p --mode plan` / composer-2.5-fast | `--mode plan` 配 `-p` 輸出為空（exit 0） | 改 **`--mode ask`** 重試成功 → 已解除；headless 審查一律用 `--mode ask` |
| — | Task `model=grok-4.5-fast-medium`（Cursor） | slug 不可用或 Task 拒收（待驗證） | 對抗審缺席；分配表仍列 Grok 行；勿用 grok-4.3 頂替 |
| 2026-07-11 | `codex exec` / gpt-5.6 | Cursor shell 未關 stdin → 逾時掛起（`Reading additional input from stdin...`） | 加 **`</dev/null`** 重試成功 → 已解除 |
