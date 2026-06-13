# 繽紛卡丁車（Candy Kart）

馬卡龍黏土風 3D 卡丁車，**Godot 4.3.x** 開發、Web export（無 threads，免 COOP/COEP）
嵌入站內 `/games/candy-kart`（iframe，見 `components/games/CandyKartIframeHost.tsx`）。

## 玩法與獲勝標準
- 8 車（觸控裝置 5 車）、3 圈制；單趟 3–5 分鐘。
- **單場**：終點名次，第 1 名獲勝。
- **三星獎牌**（回報父頁 gamekit medals）：前 3 名（cleared）／總時間 ≤ par（flawless）／收齊 7 顆彩虹星星（collectedAll）。
- **大獎賽**：6 站積分 10-8-6-5-4-3-2-1，總分最高奪「繽紛糖果盃」。

## 操作
- 鍵盤：← → 轉向、空白鍵/Shift 漂移（蓄滿放開＝加速）、↓/S 煞車、P/Esc 暫停。
- 觸控：左下 ◀ ▶ 轉向、右下漂移鈕；自動油門。

## 架構
- 純程序生成（無外部美術資產，pck 僅 ~120KB）：
  - `scripts/track_data.gd` — 6 條賽道資料（曲線控制點、主題色、par、星星位置）。
    **與 `lib/games/candy-kart/tracks.ts` 必須對齊**（id/laps/par/starsTotal）。
  - `scripts/track_builder.gd` — 路面網格、護欄糖珠、道具、加速帶（MultiMesh）。
  - `scripts/kart.gd` — 車道模型（progress＋lateral），玩家/AI 共用；漂移、rubber-banding。
  - `scripts/race.gd` — 倒數、ordered checkpoints（8 段防抄圈）、名次、星星/加速帶。
  - `scripts/main.gd` — 流程（標題/選道/結算/大獎賽）、暫停、音訊解鎖。
  - `scripts/bridge.gd` — postMessage（`cheche-candy-kart`，協定見 `lib/gamekit/iframe-bridge.ts`）。
  - `scripts/sfx.gd` — 合成音效＋chiptune BGM（與站內 `chiptune-bgm.ts` 同曲）。
- `fonts/cjk.ttf` — Noto Sans TC 子集（72KB，僅遊戲用字）。新增中文字後執行
  `scripts/subset_font.py` 重新子集化。

## Export（產物入庫）
```bash
./scripts/export-candy-kart.sh   # repo 根目錄執行
```
- 輸出 `public/candy-kart/`，**直接 commit**（Vercel build 無 Godot binary，
  與 `/public/kart/`（gitignore＋npm 重建）策略不同）。
- 工具鏈：Godot 4.3-stable＋Web export templates
  （`~/Library/Application Support/Godot/export_templates/4.3.stable/`）。

## 測試
- Headless 煙霧：`godot --headless --path candy-kart-game -- --smoke`
- e2e 鉤子：`/games/candy-kart?debugFinish=macaron-meadow` 啟動即送一筆結算。
- 站內整合測試：`npx vitest run lib/gamekit/candy-kart-bridge.test.ts`
