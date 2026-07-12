# 車車遊樂園 podcast-website

Bonbon & 馬米的親子 podcast「看圖聽故事」網站（Next.js App Router + TypeScript）。

- 任務與路線圖：[TODOS.md](./TODOS.md)（條目完成須附 commit hash）
- 設計規範：[DESIGN.md](./DESIGN.md)
- 每集營運流程：TODOS.md「營運管線」段 + [docs/EPISODE-WORKFLOW.md](./docs/EPISODE-WORKFLOW.md)

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- 結構化規劃＋委員會審核 → invoke /agent-plan（本 repo `.claude/commands` 版；user-level 通用版已改名 /qs-agent-plan，本專案勿用）
- 依 Approved Plan 實作＋驗證 → invoke /agent-action（同上）
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
