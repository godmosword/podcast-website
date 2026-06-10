# ADR-0001：Shell + Kernel + 可拆卸模組

- **決策**：`app/` 路由僅組裝；業務邏輯在 `components/`、`lib/`、`data/`。
- **實驗功能三要件**：`lib/features.ts` flag → 獨立 module → data 驅動內容。
- **首頁**：`data/home-sections.ts` registry 定序；`SiteHeader` / `SiteFooter` 固定為 shell。
- **遊戲**：route page 保持 Server Component；client 邏輯在 `components/games/*` + `lib/games/*`。
- **不變**：玩法演算法、theme token、progress schema、對外 UI 排版。
