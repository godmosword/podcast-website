# ADR-0002：星星經濟帳本（Star Ledger）

- **決策**：`PlayerProfile` 升級至 **v3**，新增 `economy`（`lifetimeStars` / `balance` / `ledger`）。
- **語意**：`lifetimeStars` 只增（車庫解鎖門檻）；`balance` 可花；`profile.stars` 與 `lifetimeStars` 保持同步。
- **API**：`lib/gamekit/economy.ts` — `grantStars`（冪等）、`spendStars`（餘額不足回傳 `{ ok: false }`）、`getEconomy`、`subscribeEconomy`。
- **遷移**：v2 `profile.stars` → `lifetimeStars` + `balance`，並寫入 `system:migrated-v2` 帳目；ledger 上限 200。
- **給星**：`reportGameSession` 改走 `applyGrantStars`；每枚新 medal bit 一筆冪等帳目（`medal:{gameId}:{level}:{bit}`）；數值規則不變。
- **不變**：玩法數值、garage 門檻、stickers 內容、玩家可見 UI（本批零變更）。
