# Phase 10：效能與資源收斂（2026-09-08）

原始量測：[`performance.json`](./performance.json)。每一組數字的條件都在下方逐項標註；
本輪不引用 Phase 8 或舊 Hero 的任何數字。

## 量測條件（所有數字共用）

| 項目 | 值 |
|---|---|
| Build | `next build` production，`BUILD_ID 6EkjowPn9pr8QEKP8y6KB`（`NEXT_PUBLIC_SITE_URL=https://podcast-website-mu.vercel.app`），以 `next start` 服務 |
| 瀏覽器 | Chromium 141.0.7390.37（Playwright headless） |
| GPU | **無**。SwiftShader 軟體光柵化——這是本輪最大的限制，FPS 與 frame time 只能用來看「相對關係」與「有沒有停下來」，不能當裝置成績 |
| OS | Linux 6.18.44-fc-v24（容器） |
| 網路 | loopback，未節流 |
| CPU | 未節流，但與建置主機共用 |
| 量測時間 | 2026-09-08 |

## 1. 載入

### `/`（Landing）

| 項目 | 值 | 條件 |
|---|---|---|
| `<script>` 數 | 15 | 1440×900、DPR 1、cold context |
| script transfer | 255,121 bytes | 同上（server gzip 後的實際傳輸量） |
| three / R3F / GLB | **0 個請求** | PASS：Landing 不碰 3D |
| 其他 Intro 相關請求 | `poster-mobile.webp` 28,506 bytes | ADR-0003 的 opt-in 入口縮圖，`loading="lazy"` |

### Intro 在 `/` 的初始 JS 增量

同一棵樹建置兩次（現況 vs 把 `<LandingEntryFocus />` 拿掉；`IntroEntry` 是 server component，不產生 client JS）：

| | scripts | transfer | 磁碟 gzip |
|---|---|---|---|
| 現況 | 15 | 255,121 | 250,309 |
| 無 Intro focus | 15 | 254,659 | 249,847 |
| **差** | 0 | **+462 bytes** | **+462 bytes** |

15 個 chunk 中 14 個完全相同，只有一個 content hash 不同。預算 ≤15 KB gzip → **PASS（用掉 3%）**。

### `/intro`

| 項目 | 值 |
|---|---|
| 初始 script | 12 個，195,076 bytes transfer |
| 延遲 3D chunk | 2 個：249,352 ＋ 6,096 bytes gzip（磁碟 gzip；transfer 249,652 ＋ 6,396）＝ **255,448 bytes gzip** |
| GLB transfer | environment 102,005（解壓 216,428）、little-red 25,767（64,924）、tree 5,673（10,132）＝ **133,445 bytes 傳輸 / 291,484 解壓** |
| poster transfer | `poster.webp` 74,332 bytes，於 20ms 起始 |

預算對照：延遲 3D JS ≤300 KB gzip → **PASS**（255 KB）。GLB <500 KB 目標／<1 MB 硬限制 → **PASS**（傳輸 133 KB）。poster 桌機 ≤180 KB → **PASS**。

### Waterfall（`/intro`，完整清單在 JSON）

```
0–20ms      HTML → CSS → poster.webp（首屏視覺先到）
~20–1500ms  初始 12 個 script（App shell）
~1500ms     900ms 暖身計時器到期 → 動態 import 3D chunk（249 KB gzip）
1587ms      environment.glb  → 1723ms
1737ms      little-red.glb ＋ tree.glb（並行）→ 1829ms
```

順序符合 PLAN §10：HTML → poster → shell → scene JS → 模型，沒有一次 preload 全部模型。

## 2. Renderer（依 tier）

Draw call 與三角形用正式場景與 renderer 量（`render-hero-posters.mjs --qa --qa-only --quality=<tier>`，
關閉／開啟 shadowMap 各算一次以分離 main 與 shadow pass）。FPS 與 frame time 來自 live `/intro`。

| tier | DPR | main pass calls | shadow calls | main triangles | 含 shadow triangles | FPS（軟體算圖） | median frame | p10 / p95 |
|---|---|---|---|---|---|---|---|---|
| High（1440×900，8 cores/8GB 提示） | 1.5 | **52** | 29 | 20,787 | 35,967 | 2.1 | 466.6 ms | 450.0 / 483.3 ms |
| Medium（390×844，4 cores/4GB） | 1.25 | **52** | 0 | 19,803 | 19,803 | 20（QualityManager 自報 21） | 50.0 ms | 33.3 / 50.1 ms |
| Low（390×844，2 cores/2GB） | 1（未取樣，見下） | **52** | 0 | 18,819 | 18,819 | — | — | — |

- **Low tier 沒有 FPS**：不是失敗。Low 不跑小紅、不轉摩天輪、不擺樹，`frameloop="demand"` 下沒有東西要求重繪，10 秒內 rAF 為 0。這正是 SPEC §13.2「Low 靜態」的行為。DPR 由 `QUALITY.low.dpr = 1` 決定，但因為沒有取樣視窗，QualityManager 沒有寫出 runtime 數字。
- **High 的 QualityManager 取樣是 null**：它要 45 幀暖身再連續取樣 2 秒；在 2 FPS 的軟體算圖上那超過 25 秒，取樣視窗沒有成立。frame time 是本輪自行以 rAF 時間戳量的，不依賴它。

### High tier 的 draw calls 是否超標？

SPEC §13.1 的預算是「High <70，**主 pass 與 shadow pass 分開**」。實測 **main 52、shadow 29**，
兩者都在預算內；合計 81 只有在把兩個 pass 加總時才會超過 70，而那不是 SPEC 的計法。

判斷：**不需要改。** 52 個 draw call 來自 23 個環境 primitive、16 個吊艙節點、車與四輪、
以及兩個 InstancedMesh，全部是語意上必須獨立的動態節點（摩天輪吊艙要各自反轉、輪子要各自轉）。
要把它壓下去只能犧牲 pivot 結構或合併吊艙，那會回頭破壞 Phase 6 的階層契約與 Phase 8 的動態，
換到的是一個本來就沒有超標的數字。此處不做任何場景重構。

## 3. 生命周期與資源

### 5 次 `/intro` ↔ `/` 往返（1440×900，high 提示）

| round | live canvas | 離開後 canvas | WebGL context（每個 document） | visibilitychange listener | 累計 GLB 請求 | JS heap |
|---|---|---|---|---|---|---|
| 1 | 1 | 0 | 2 | 1 | 3 | 11.9 MB |
| 2 | 1 | 0 | 2 | 1 | 6 | 15.6 MB |
| 3 | 1 | 0 | 2 | 1 | 9 | 11.5 MB |
| 4 | 1 | 0 | 2 | 1 | 12 | 15.5 MB |
| 5 | 1 | 0 | 2 | 1 | 15 | 19.1 MB |

- canvas 每次都歸零；context 數是「能力偵測 1 ＋ renderer 1」，不隨往返累積。
- listener 穩定在 1，沒有線性成長。
- 每回合固定 3 個 GLB 請求（沒有重試風暴，也沒有重複下載同一版）。
- heap 在 11.5–19.1 MB 之間上下震盪、非單調成長。**這是 GC 時機決定的數字，不是 memory benchmark，
  也不是 GPU memory**；只用來確認沒有明顯洩漏趨勢。

### 是否停止 GPU 工作（rAF 計數）

| 狀態 | 觀察窗 | rAF 次數 |
|---|---|---|
| 正常執行（high、2 FPS） | 3s | 7 |
| `document.hidden` | 3s | **1** |
| 回到可見 | 2s | 6 |
| 使用者按暫停 | 3s | **0** |
| 離開路由到 Landing 之後 | 3s | **0** |

hidden、pause、離頁三種情況都沒有持續排程動畫 → PASS。
24 秒次要動態休眠不在這裡量（在真實時間下要等 24 秒且受幀率影響），由
`e2e/intro-portal.spec.ts` 的 F10（注入時鐘）覆蓋：休眠後不會自行恢復，需明確操作。

## 4. Web 效能

LCP／CLS 各 3 次 cold、3 次 warm（每次量測都用新分頁；cold＝全新 context，warm＝同一 context 已載過一次）。
六次的 LCP 元素都是 poster `<img>`（825,831 px²）。

| | LCP | CLS |
|---|---|---|
| cold 1／2／3 | 148 / 160 / 136 ms | 0 / 0 / 0 |
| warm 1／2／3 | 228 / 220 / 220 ms | 0 / 0 / 0 |

目標 LCP <2.5s、CLS <0.05 → **PASS**（loopback、未節流的實驗室條件）。
`performance.json` 的 `webVitals.lcpCls` 另有一組 warm 480–728ms，那是共用 context 連續量測、
受前一頁殘留工作干擾的版本，已在 JSON 內註明以 `lcpClsDedicated` 為準。

### Enter 互動回饋延遲

| 情境 | 首次可見回饋 | 網址變更 |
|---|---|---|
| live 場景（ready） | 6.6 / 6.4 / 6.9 ms | 519.8 / 518.6 / 500.8 ms |
| poster（未載入 3D） | 53.2 / 61.9 / 64.4 ms | 53.3 / 62.0 / 64.5 ms |

「首次可見回饋」是點擊到 `data-entering="true"`（live）或到網址變更（poster 直接進站）的時間。
目標 ≤100ms → **PASS**。網址變更在 live 路徑上約 0.5 秒，那是 React 在 2 FPS 軟體算圖上完成
路由 commit 的時間，不是等動畫（Phase 9 已把場景在按下當下停掉；同一機器未停算繪時是 1.3 秒）。

**INP: not measured** — 沒有真實使用者資料。上面的數字是實驗室點擊的 Event Timing 代理值，
不是 field INP，也不用 Lighthouse 分數冒充。

## Phase 10 退出條件對照

| 條件 | 狀態 | 備註 |
|---|---|---|
| `/` 不下載 Three／R3F／GLB | PASS | 0 個請求 |
| `/intro` 才 lazy-load 3D | PASS | 900ms 暖身後才 import，模型在 1.6s 之後 |
| 初始 JS 增量 ≤15 KB gzip | PASS | +462 bytes（雙build 對照） |
| lazy 3D JS ≤300 KB gzip | PASS | 255,448 bytes |
| GLB <1 MB 硬限制 / <500 KB 目標 | PASS | 傳輸 133 KB、解壓 291 KB |
| poster ≤180 KB / ≤100 KB | PASS | 74,332 bytes（desktop） |
| High <70 draw calls（主／shadow 分開） | PASS | main 52、shadow 29 |
| triangles High<40k / Medium<30k / Low<20k | PASS | 35,967 / 19,803 / 18,819 |
| DPR 1.5 / 1.25 / 1 上限 | PASS | high 1.5（設定）、medium 1.25（實測）、low 1（設定，靜態故未取樣） |
| 反覆進出無資源累積 | PASS | 5 次往返：canvas、context、listener、GLB 請求都不成長 |
| hidden／pause／離頁不自行 invalidate | PASS | rAF 1／0／0 |
| LCP／CLS | PASS | 136–228ms／0 |
| Enter 回饋 ≤100ms | PASS | 6–65ms |
| FPS：High 接近 60、Medium 30+ | **FAIL（環境）／NOT-MEASURABLE** | 本容器沒有 GPU，high 2.1 FPS、medium 20 FPS。這是軟體光柵化的成績，不能當產品判定，也不能宣稱通過。真機量測是 Phase 12 的必要項目 |

## 尚需 Phase 12 真機確認

1. **FPS 與 frame time**：唯一沒有被本輪證明的硬指標。需要至少一台 iPhone Safari 與一台
   Android Chrome，量 High／Medium 的 median、p10、p95 frame time 與是否觸發降級。
2. **QualityManager 的降級行為**：本容器所有 tier 都低於 38 FPS 門檻，無法區分「正常降級」
   與「過度降級」。真機上要確認 high → medium 不會來回跳級。
3. **LCP／CLS 在行動網路**：本輪是 loopback。
4. **記憶體**：真機上的 GPU memory 與長時間停留行為。
