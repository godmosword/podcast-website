# Intro / Portal 動態證據（2026-09-07）

補 PLAN §15.3 V03／V04 與自動邀請 ADR 需要的動態證據。靜態 PNG 無法證明減速連續性，因此改用錄影與逐格量測。

- 伺服器：`npm run build && next start -p 3000`（production build，非 dev server）
- 瀏覽器：Playwright Chromium
- 產生指令：
  - `node scripts/render-hero-posters.mjs --qa --qa-only --qa-out=docs/qa/intro-portal/dynamic-evidence-20260907`
  - `node scripts/capture-intro-evidence.mjs`
- `--qa-only` 為本輪新增：只做量測與截圖，不覆寫已發布的 v3 poster 與 manifest。
- **截圖（`*.png`）與錄影（`*.webm`）不入版控**（見 `.gitignore`）：體積大且只供人工判讀。本文與 `renderer-report.json`、`dynamic-evidence.json` 的量測數值即為可審閱的證據；要重現二進位檔請重跑上列兩道指令。

## V03 小紅五階段（錄影）

[`recordings/greeting-and-exit-desktop.webm`](./recordings/greeting-and-exit-desktop.webm)（1440×900，約 13 秒，含 Enter 離場）

實測相位轉換（相對於導航開始）：

| 相位 | 出現時間 |
|---|---|
| approach | 48 ms |
| decelerate | 9,677 ms |
| settle | 10,717 ms |
| acknowledge | 11,137 ms |
| continue | 12,531 ms |

`stop` 相位（`config.ts` 定義為 4.50–4.58 秒，寬度 80 ms）未被取樣到，因為輪詢間隔是 100 ms。這是取樣解析度問題，不是相位缺失——`motionPhase()` 的區間定義與 `decelerate → settle` 的實際轉換時間差 1,040 ms 與規格一致。

錄影同時涵蓋 Enter 離場：`data-scene-state` 為 `ready` 時點「進入車車遊樂園」，360 ms 轉場後 replace 到 `/?enter=1`。

**未涵蓋**：輪胎接地近景、慢幀情境、pause→resume 的錄影。V03 仍非完整通過。

## V04 摩天輪四角度

8 張截圖（desktop 1380×980、mobile 615×490，各 0°／90°／180°／270°）＋ [`renderer-report.json`](./renderer-report.json)。

| tier | 角度 | 吊艙 up 向量最大誤差 | draw calls（含影） | triangles | 其中陰影 calls |
|---|---|---|---|---|---|
| high | 0/90/180/270 | **0.00e+00** | 81 | 35,475 | 29 |
| medium | 0/90/180/270 | **0.00e+00** | 52 | 19,557 | 0 |

- **吊艙朝上**：八個 `GondolaPivot` 的世界空間 up 向量在四個角度都精確等於 `(0,1,0)`，誤差為 0。`World.tsx` 對吊艙施加 `-angle` 反轉，與輪盤的 `+angle` 完全抵銷。
- **支架不動**：由結構保證而非目視——`FerrisRotor` 的子節點只有 `RimAndSpokes_cream`、`RimAndSpokes_pink` 與 8 個 `GondolaPivot`（見 [phase6-rebuild-20260907/report.md](../phase6-rebuild-20260907/report.md) 的階層對照）。支架屬於 `Environment_*` 合併網格，不在旋轉節點下，因此不可能跟著轉。
- **週期**：`World.tsx` 的 `angle = elapsed * 2π / 56` → **56 秒／圈**，落在 V04 要求的 45–60 秒內。
- draw calls：main pass 52、陰影另加 29，合計 81。SPEC §3 的 `<70 calls` 目標是對 visible/main pass 而言，陰影成本依 SPEC 規定「另記」。

## Landing 不下載 3D（waterfall）

[`dynamic-evidence.json`](./dynamic-evidence.json) 的 `landingWaterfall`，載入 `/?enter=1` 至 networkidle：

| 指標 | 結果 |
|---|---|
| 總請求數 | 43 |
| `.glb` 請求 | **0** |
| `/models/hero-world/` 底下任何請求 | **0** |
| 內容含 `THREE.`／`WebGLRenderer`／`react-three-fiber` 的 script | **0**（逐支下載後比對，非只看檔名） |

與第 3 項用 chunk 集合算出的 `/` 初始 JS 增量 +427 bytes 互相印證。

## 自動邀請閃爍（ADR 輸入）

錄影：[`recordings/first-visit-redirect-cpu1x.webm`](./recordings/first-visit-redirect-cpu1x.webm)、[`recordings/first-visit-redirect-cpu6x.webm`](./recordings/first-visit-redirect-cpu6x.webm)（390×844）

`dynamic-evidence.json` 的 `autoInviteFlicker`：每檔 CPU throttling 各三次，量 Landing 的 FCP 與 replace 到 `/intro` 的時間差，即**使用者實際看到 Landing 畫面後才被抽換的時間**。

| CPU throttling | Landing FCP | replace 發生 | 可見 Landing 時間 |
|---|---|---|---|
| 1×（無節流） | 64 ms | 87–92 ms | **23–28 ms** |
| 4× | 132 ms | 280–295 ms | **148–163 ms** |
| 6× | 188–192 ms | 429–435 ms | **241–245 ms** |
| 10× | 304–316 ms | 722–747 ms | **410–431 ms** |

閃爍是真的，而且與 CPU 速度近似線性。10× 節流下使用者會看到超過 0.4 秒的完整 Landing 再被換掉。SPEC §4.4 自承的缺陷在此得到量化。

節流倍率不等於特定機型；這是 Chromium 的 CPU throttling，用來呈現趨勢，不能宣稱「某型號 Android 已測」。

## 順帶確認：low tier 是完全靜態的

第 4 項留下的問題已查證：`quality === "low"` 時 `Vehicle.tsx:32` 不推進時間、`Vehicle.tsx:50` 直接定位到終點、`World.tsx:49` 摩天輪 early return、樹擺動只在 high。low tier 沒有任何持續動態，因此 `HeroWorld.tsx` 不渲染暫停按鈕不違反 SPEC §8。
