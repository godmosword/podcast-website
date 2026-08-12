# Game Kit 美術聖經

> 遊樂園 Game Kit 共用視覺規範。現行程式分為 `react/`、`runtime/`、`progress/`、`games/` 四層。

## 渲染

| 遊戲 id | 內部解析度 | 比例 |
|---------|-----------|------|
| `block-drop` | 200×360 | 5:9 直式井 |

- **放大**：僅整數倍 nearest-neighbor（`image-rendering: pixelated`）。
- **相機**：座標 `Math.round`，禁止次像素漂移。
- **幀率**：邏輯 120Hz 固定步進，顯示 60fps 插值。

## 調色盤

- **主盤**：32 色（`lib/gamekit/runtime/palette.ts` → `MASTER_PALETTE`）。
- **光源**：左上高光、右下陰影；描邊 `#34302b` 1px（內部解析度）。

## 角色 IP（跨遊戲卡司）

- **主角**：小黃（玩家預設車）。
- **配角池**：警車、貨車、賽車、巴士、救護車、清潔車（對齊 podcast 車種／`data/characters.json`）。
- **像素規格**：車身 16×16 或 24×24 tile 為基準；HUD 用 8px 等寬點陣字。

## 動畫最低規格（市售前每款）

| 狀態 | 說明 |
|------|------|
| idle | ≥2 幀循環 |
| move | 4 方向或左右 flip |
| action | 跳躍／吃豆／消行等 |
| hurt | 閃白或 squash |

## UI

- 面板：1px 描邊 + 4px「假像素」內距。
- 轉場：wipe 或 fade（≤300ms；`prefers-reduced-motion` 改 instant）。
- 禁止：emoji 當遊戲內主要 sprite（hub 卡片除外）。

## 音訊

- BGM：chiptune 循環 ogg，每款 1 主題 + 可選緊張層。
- SFX：短促；沿用 WebAudio 合成或 jsfxr 匯出。
- 必備：music/sfx 分軌、靜音、首次觸控解鎖。

## 可及性

- `prefers-reduced-motion`：關粒子／震動／背景視差。
- 色盲：關鍵狀態不靠紅綠 alone（加形狀或圖示）。
- 兒童模式：預設較慢、無 Game Over 壓力（對齊 STEM 分層）。

## 資產流程

1. **佔位**：Kenney CC0 tileset / sprite。
2. **原創**：Aseprite → PNG sprite sheet → `public/games/<id>/`。現行 Canvas 遊戲使用 `lib/gamekit/runtime/procedural-sheets.ts` 的程序圖塊。

## 技術錨點

- 程式入口：`lib/gamekit/`、`components/games/GameHost.tsx`。
- **不引入 Phaser**：維持純 Canvas + 自建 kit。
