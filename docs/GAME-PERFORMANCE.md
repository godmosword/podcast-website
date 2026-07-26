# 遊戲載入性能

本文件記錄五款小遊戲的資源載入策略與 2026-07 優化結果。

## 資產規模概覽

| 遊戲 | 主要資產 | 載入策略 |
|------|----------|----------|
| **Candy Kart** | `index.wasm` ~34MB、`index.pck` ~1.4MB | **按需**：進頁不載入；點「出發！開始遊戲」才掛 iframe |
| **Bonbon Snowboard** | `index.wasm` ~34MB、`index.pck` 目標 <2MB | **按需**：進頁不載入；點「出發！開始滑雪」才掛 iframe |
| Car Adventure | 程序生成 sheet `tiles-common` | `GameLoadingGate` 自動 idle 預載（`requestIdleCallback`） |
| Block Drop | sheet `blocks-drop` | 同上 |
| Candy Match | 全 SVG/DOM | 無 sheet 預載 |

## 標準載入流程

```text
idle（可選：顯示「開始遊戲」）
  → loading（預載 sheet / 掛 iframe）
  → ready（渲染遊戲）
  → timeout | error（重試）
```

共用模組：

- `lib/gamekit/react/game-load.ts` — 階段型別、Godot progress 讀取
- `lib/gamekit/react/useGameLoadGate.ts` — 狀態機 hook
- `hooks/useGameAssetPreload.ts` — canvas 遊戲 sheet 預載
- `components/games/GameLoadOverlay.tsx` — 開始／進度／重試 UI

## Candy Kart 細節

- **宿主**：`components/games/CandyKartIframeHost.tsx`
- **Bridge**：維持 `cheche-candy-kart` postMessage（`ready`、`race-finish`），未改 Godot 專案
- **進度**：同源輪詢 iframe 內 `#status-progress`（Godot `Engine.startGame.onProgress`）
- **逾時**：45s；失敗可「再試一次」重新掛 iframe
- **首屏收益**：遊戲頁 HTML/CSS 立即可互動，~35MB WASM 延後至使用者意圖明確時

## Canvas 遊戲擴充

`GameLoadingGate` 支援 `manualStart`（預設 `false`）。若未來某款 canvas 遊戲 sheet 變大，可設：

```tsx
<GameLoadingGate gameId="block-drop" manualStart>
  <BlockDropGame />
</GameLoadingGate>
```

## 驗證

```bash
npm test -- game-load export-video-core   # 單元
npm run build
npx playwright test e2e/smoke.spec.ts   # 含五款遊戲 smoke
```

## 後續建議（非本次範圍）

1. **Service Worker / HTTP cache**：對 `index.wasm` 做長快取，二次造訪更快
2. **Brotli 壓縮**：Vercel 靜態資源已 gzip；可評估預壓 wasm 或 CDN brotli
3. **Godot export 瘦身**：關閉未用功能、壓紋理，從源頭縮 wasm
4. **Bridge 進度**：若需更精準進度，可在 `bridge.gd` 加 `type: "load-progress"`（需重匯出）
