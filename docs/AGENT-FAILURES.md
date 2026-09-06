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
| GPT 5.6 Luna（Claude Code CLI） | `codex exec -m gpt-5.6-luna -c model_reasoning_effort="low" "回覆 OK" </dev/null`；檢查 stdout 與 stderr |
| Cursor Grok Leader／對抗審 | `cursor-agent -p --model cursor-grok-4.5-high-fast --mode ask "回覆 OK"`；拒收或認證失敗依環境使用 `grok -p "回覆 OK" -m grok-4.6 --effort medium --no-plan` |
| Composer 2.5（Cursor Task） | 首次使用派最小 readonly Task 或 `cursor-agent -p --model composer-2.5-fast --mode ask "回覆 OK"`；拒收即對抗審缺席，L1/L2 由 Leader 接手 |
| Opus 設計審 | Agent tool `model: "opus"` 或 Cursor `claude-opus-5-thinking-high`；失敗記錄後依分級降級 |

探活輸出必須含預期回覆，且 stderr 不得有 spawn／auth 錯誤；不可只看 exit code。

## Active 模型狀態

| 模型 | 狀態 | 處理 |
|------|------|------|
| `cursor-grok-4.5-high-fast` | 依最近 30 天記錄判定 | 首次使用先探活；連續未解除失敗則缺席 |
| `grok-4.6` | 備援路徑 | 只有 Cursor slug 拒收或認證失敗才使用 |
| `gpt-5.6-luna` | Claude Code CLI | 使用 `</dev/null`，檢查內容與 stderr |
| `gpt-5.6-luna-max-fast` | Cursor Task | 只在 L2/L3 或實際工程審需要時派 |
| `composer-2.5-fast` | Cursor Task | 只在 L2/L3 對抗審或實作需要時派 |
| `claude-opus-5-thinking-high` | Cursor 設計審 | 只有 UI 風險或 L3 才派 |

## 未解除記錄

以下記錄仍影響目前路由；同一模型達到 30 天門檻時，本次直接標缺席，不再重試：

| 日期 | 命令／模型 | 症狀 | 處置與是否解除 |
|------|------------|------|----------------|
| 2026-09-05 | `cursor-agent`／`cursor-grok-4.5-high-fast` + `grok` 備援 | 主路徑與 CLI 備援皆認證失敗；同一模型近期已有多筆未解除記錄 | 標「對抗審缺席／對抗性降級」；恢復前不重試，需重新登入或設定 API key |
| 2026-08-29 | `cursor-agent`／`cursor-grok-4.5-high-fast` + `grok` 備援 | 主路徑與 CLI 備援認證失敗 | 與 2026-09-05 合併計入缺席判定；保留 Composer／Leader 替代路徑 |

新增案例時沿用上方欄位；解除後移至年度 archive 並標記解除日期。

## 相關安全案例

- AUQ 阻塞防護：`.cursor/hooks/block-auq.mjs` 與 [`no-ask-user-questions.mdc`](../.cursor/rules/no-ask-user-questions.mdc)。
- Fable 5 阻擋：`.cursor/hooks/block-fable.mjs`。
- 付費生圖重抽紅線：[`podcast-image-cost.mdc`](../.cursor/rules/podcast-image-cost.mdc) 與 [`AGENT-DOMAIN.md`](AGENT-DOMAIN.md)。
