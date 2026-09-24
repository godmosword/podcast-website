# Agent Model-Call 失敗案例簿（Active）

本檔只保留目前仍影響路由的協議與未解除記錄。已解除案例、歷史 slug 與完整時間線移至 [`archive/AGENT-FAILURES-2026.md`](archive/AGENT-FAILURES-2026.md)。

## 讀取協議

1. 只有本次確實要呼叫外部模型時才讀本檔；L0/L1 不需載入。
2. 同一模型最近 30 天有至少 2 筆未標「已解除」記錄時，本次標「缺席」，不重試、不浪費額度。
3. 缺席不豁免 Domain 驗證矩陣；只改變委員配置。
4. 新失敗追加到本檔「未解除記錄」；解除後移入年度 archive，並標明解除日期。
5. 同一會話內同一模型只做一次探活；不按每次 plan/action 重複探活，只有首次使用、缺席解除或配置變更才重探。

## 探活命令（低成本）

| 模型／用途 | 探活與缺席處理 |
|------|------|
| GPT 5.6 Luna MAX fast（Cursor Task） | 無 CLI 探活；實際首次派最小 readonly Task，拒收即記錄並標缺席 |
| GPT 6 Luna（Claude Code CLI 工程審） | `codex exec -m gpt-6-luna -s read-only -c model_reasoning_effort="medium" "Reply with exactly: OK" </dev/null`；需 codex-cli ≥ 0.156（舊版報 `not supported`／`failed to load models cache`）；模型名不加 `openai/` |
| Grok 4.7（Claude Code CLI 對抗審） | `cursor-agent -p --trust --mode ask --model grok-4.7-high-fast "Reply with exactly: OK"`（先 `cursor-agent login`；不用 `--yolo`／`-f`）；失敗改 `grok -m grok-4.7 --permission-mode plan -p "Reply with exactly: OK"`（可用模型以 `grok models` 核對） |
| Composer 2.5（Cursor Task） | 首次使用派最小 readonly Task 或 `cursor-agent -p --model composer-2.5-fast --mode ask "回覆 OK"`；拒收即對抗審缺席，L1/L2 由 Leader 接手 |
| Opus 設計審 | Agent tool `model: "opus"` 或 Cursor `claude-opus-5-thinking-high`；失敗記錄後依分級降級 |

探活輸出必須含預期回覆，且 stderr 不得有 spawn／auth 錯誤；不可只看 exit code。

## Active 模型狀態

| 模型 | 狀態 | 處理 |
|------|------|------|
| `cursor-grok-4.5-high-fast` | 依最近 30 天記錄判定 | 首次使用先探活；連續未解除失敗則缺席 |
| `grok-4.7-high-fast` | Claude Code CLI 對抗審（cursor-agent） | 2026-09-24 探活 OK |
| `grok-4.7` | 備援路徑（grok CLI） | 只有 cursor-agent 失敗才使用 |
| `gpt-6-luna` | Claude Code CLI 工程審 | 2026-09-24 探活 OK（codex-cli 0.156.1）；必加 `-s read-only` 與 `</dev/null` |
| `gpt-5.6-luna-max-fast` | Cursor Task | 只在 L2/L3 或實際工程審需要時派 |
| `composer-2.5-fast` | Cursor Task | 只在 L2/L3 對抗審或實作需要時派 |
| `claude-opus-5-thinking-high` | Cursor 設計審 | 只有 UI 風險或 L3 才派 |

## 未解除記錄

以下記錄仍影響目前路由；同一模型達到 30 天門檻時，本次直接標缺席，不再重試：

| 日期 | 命令／模型 | 症狀 | 處置與是否解除 |
|------|------------|------|----------------|
| 2026-09-16 | `codex exec -m gpt-5.6-luna` readonly 工程審（美術審 Batch B diff，560 行） | 兩次皆超時（600s／480s）未回答：第一次跑去 `rg` 全 repo 撞 `docs/qa/mobile-performance/latest.json`；第二次已限定檔案與 8 次工具呼叫仍在 cat 檔案時逾時 | 模型可探活（同日 Batch A 前已正常審過）、屬單次任務失敗。處置：Leader 自審四項風險點（play-size／controls-block 對齊、_blank rel、multiply 在 preserve-3d 容器、about scale 圖）後入庫；下次工程審先縮 diff 或拆檔提交 |

新增案例時沿用上方欄位；解除後移至年度 archive 並標記解除日期。

## 相關安全案例

- AUQ 阻塞防護：`.cursor/hooks/block-auq.mjs` 與 [`no-ask-user-questions.mdc`](../.cursor/rules/no-ask-user-questions.mdc)。
- 付費生圖重抽紅線：[`podcast-image-cost.mdc`](../.cursor/rules/podcast-image-cost.mdc) 與 [`AGENT-DOMAIN.md`](AGENT-DOMAIN.md)。
