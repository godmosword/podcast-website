# 車車遊樂園 podcast-website

Bonbon & 馬米的親子 podcast「看圖聽故事」網站（Next.js App Router + TypeScript）。

- 任務與路線圖：[TODOS.md](./TODOS.md)
- 設計規範：[DESIGN.md](./DESIGN.md)
- 每集營運流程：[docs/EPISODE-WORKFLOW.md](./docs/EPISODE-WORKFLOW.md)
- Agent 流程唯一來源：[docs/AGENT-WORKFLOW.md](./docs/AGENT-WORKFLOW.md)
- 專案紅線與驗證：[docs/AGENT-DOMAIN.md](./docs/AGENT-DOMAIN.md)

## Skill 與命令路由

只有使用者明確要求、任務名稱直接匹配，或風險分級要求時才啟用 Skill／slash command。一般對話不自動進入編排流程，也不因不確定而載入所有 Skill。

- `/agent-plan`：需要 Approved Plan、跨模組規劃或 L2/L3 審查時使用。
- `/agent-action`：已有 Approved Plan，或內容 SOP 明確要求落地與驗證時使用。
- 內容 SOP（字幕、scenes、illustrate）：依 Domain 與 Episode workflow 直接處理或使用 `/agent-action`。
- QA、review、design、ship 等命令只在使用者明確要求或任務風險達到相應門檻時使用。

命令檔是環境適配層；風險分級、審查門檻、Bootstrap 與完成邊界以 `docs/AGENT-WORKFLOW.md` 為準。
