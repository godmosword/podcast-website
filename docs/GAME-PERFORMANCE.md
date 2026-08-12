# 遊戲載入性能

本文件記錄目前三款小遊戲的資源載入策略與 2026-07 優化結果。

## 資產規模概覽

| 遊戲 | 主要資產 | 載入策略 |
|------|----------|----------|
| Block Drop | sheet `blocks-drop` | 同上 |
| Candy Match | 全 SVG/DOM | 無 sheet 預載 |

## 標準載入流程

```text
idle（可選：顯示「開始遊戲」）
  → loading（預載遊戲資源）
  → ready（渲染遊戲）
  → timeout | error（重試）
```

共用模組：

- `lib/gamekit/react/game-load.ts` — 階段型別與逾時預設
- `lib/gamekit/react/useGameLoadGate.ts` — 狀態機 hook
- `hooks/useGameAssetPreload.ts` — canvas 遊戲 sheet 預載
- `components/games/GameLoadOverlay.tsx` — 開始／進度／重試 UI

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
npx playwright test e2e/smoke.spec.ts   # 遊樂園與目前遊戲 smoke
```

## 後續建議（非本次範圍）

1. **Brotli／CDN 壓縮觀測**：確認 Vercel 對版本化 runtime 的實際 content-encoding 與快取命中率
2. **Brotli 壓縮**：Vercel 靜態資源已 gzip；可評估預壓 wasm 或 CDN brotli
