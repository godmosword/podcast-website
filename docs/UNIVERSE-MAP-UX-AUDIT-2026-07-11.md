# 宇宙地圖 UX 稽核報告（2026-07-11）

> Approved Plan：`/tmp/agent-plan-1783730484.md`  
> 範圍：`/adventures` 互動地圖（實用性、操控、流暢、兒童易用、375px／桌面）

## 紅線（本輪不碰）

- `useMapCamera`／`ZoneSheet` 核心狀態機與 pointer 管線
- `data/universe-zones.ts` 座標、`lib/universe/zone-art-tile.ts` 契約
- 地圖「印刷淺色」場景（日夜不反轉）
- 凍結美術（v5 rear、R-joy 2/3、五島夜間 `hasNightArt`）

## 五維評級

| 維度 | 評級 | 摘要 |
|------|------|------|
| 實用性 | B+ | 點島→飛鏡→sheet、深連結、進度星章、迷路自救成熟 |
| 操控性 | B | slop／rAF／慣性／pinch／wheel／鍵盤齊；缺 drag e2e |
| 流暢性 | B | reduced-motion、WebP、visibility pause 完整 |
| 兒童易用 | B- | disclosure／大故事卡 OK；close／wishToggle 曾 <44px |
| 手機 375px | B | label 淨空 e2e 有；a11y 曾未掃地圖頁 |

**地圖專屬 P0：** 無阻斷級。

## 已具備（勿改壞）

- 單段式點島語意（開放／鎖島皆 fly + sheet）
- `?zone=` 深連結與 StrictMode 門閂測試
- 島木牌 `⭐ n/N`、sheet 故事卡已聽打星
- MapControls 56px+、故事卡 min-height 64px
- 許願／信任收「給爸爸媽媽」disclosure

## 本輪改進（Phase 0–2）

| ID | 內容 | 決策 |
|----|------|------|
| MAP-UX-P1a | close／wishToggle ≥44px + CSS 契約測 | — |
| MAP-UX-P1b | overlay `pointer-events: auto`；modal 期間 MapControls 不可點可接受 | Q2：保留 backdrop 關閉 |
| MAP-UX-P1b+ | `max-height: min(72vh, 34rem)` | Q1：採設計審建議 |
| MAP-UX-P1c | a11y `/adventures`、開 sheet 後 axe、觸控／拖曳 e2e | — |
| MAP-UX-P2a | `prefers-reduced-motion` 點島即開 sheet | — |

## Known gap（文件標記，不為此改核心）

- **Pointer capture 殘留**：flying→sheet 交接若手指仍按在 viewport，理論上可能短暫 pan；穩態 sheet 開啟後 overlay 已擋海面手勢。
- **鍵盤**：需手動 focus viewport 才可用 ±／方向鍵。

## P2 長尾

- `storiesMore`／`softLink` 觸控加大
- smoke 地圖固定 375 viewport
- 進度星章 e2e（localStorage seed）
- `useMapCamera` jsdom 契約測
- Playwright CI（P3）
- T6 點島唸島名（延後）

## MAP-ROAM 文件對帳

| Task | Commit | 備註 |
|------|--------|------|
| MAP-ROAM-1 | `3166cc5` | dock offset 構圖；點擊語意後改單段式 `a2b63fe` |
| MAP-ROAM-2～4 | `3166cc5` | 縮放列、少字 UI、層次升級概念文件 |
| MAP-ROAM-5 | `503ad8b` | 平移核心重寫 |

✅ archive 檔首「待 commit」已改為已入主線（Phase 3 對帳）。
