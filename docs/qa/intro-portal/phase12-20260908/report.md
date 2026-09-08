# Phase 12：Cross-device / Real-device QA（2026-09-08）

## 結論先講

**Phase 12 沒有通過，因為它的核心無法在本環境執行。**
自動化環境是一台沒有 GPU、沒有實體裝置、沒有 `adb`／`xcrun`、也沒有 WebKit engine 的
Linux 容器。實體 iPhone Safari 與 Android Chrome 的效能、VoiceOver／TalkBack、發熱、
Safari 專屬行為（safe-area、100svh、工具列、BFCache、背景恢復）**全部 NOT-RUN**，
而且依照本輪指示，**不以 desktop emulation 冒充真機**。

本輪實際做完的是 Phase 12 中「可以誠實用模擬完成」的那一半（版面矩陣、旋轉、網路情境），
並把真機部分寫成可以照著跑的 [`real-device-runbook.md`](./real-device-runbook.md) 與
[`device-matrix.md`](./device-matrix.md) 範本，讓有裝置的人可以直接接手。

## 1. Device matrix

| 裝置 | 需求 | 本輪狀態 |
|---|---|---|
| iPhone（近年機型）· Safari · 直向＋橫向 | Phase 12 必要 | **NOT-RUN**（無裝置） |
| Android（中階或旗艦）· Chrome | Phase 12 必要 | **NOT-RUN**（無裝置） |
| iPad / Android 平板 | 有則測 | **NOT-RUN** |
| 實體 Safari（macOS） | WebKit engine 驗證 | **NOT-RUN**（容器只有 Chromium；Playwright WebKit 未安裝，且本環境不允許下載瀏覽器） |
| Chromium 141（headless、SwiftShader、Linux 容器） | 模擬用 | 已執行，結果**獨立列**於下方 |

## 2. Performance matrix

**NOT-RUN。** 真機 FPS／median／p10／p95、QualityManager 降級與穩定性、發熱、
2–5 分鐘掉幀、背景恢復、memory pressure 與 context loss 都需要實體裝置。

Phase 10 在 SwiftShader 上量到的 high 2.1 FPS／medium 20 FPS **不是真機成績**，
本報告不引用它做任何判定。量測步驟（含可直接貼進 Web Inspector 的片段）在 runbook §1–§2。

已知可先回答的一件事：小紅 18 秒時間軸與摩天輪 56 秒週期在 2026-09-08 已改為吃**真實時間**
（`ActiveTimeline`），所以慢裝置不會把動畫拉長——但這仍需真機碼表確認，runbook §1 有步驟。

## 3. 版面矩陣（模擬，Chromium）

`emulated/crossdevice.json` ＋ 每個尺寸的 poster／ready／rotated／landing 截圖。
所有列都是 **emulated: true**。

| viewport | 類型 | 場景狀態 | 水平溢出 | Enter 尺寸（在首屏內） | render DPR | 旋轉後溢出 | 進站後 |
|---|---|---|---|---|---|---|---|
| 320×568 | 窄手機 | ready | 0 | 186×52 ✓ | 1.25 | 0 | `/`、溢出 0、focus main、canvas 0 |
| 360×800 | 手機 | ready | 0 | 186×52 ✓ | 1.25 | 0 | 同上 |
| 375×812 | 手機 | ready | 0 | 186×52 ✓ | 1.25 | 0 | 同上 |
| 390×844 | 手機 | ready | 0 | 186×52 ✓ | 1.25 | 0 | 同上 |
| 414×896 | 手機 | ready | 0 | 186×52 ✓ | 1.25 | 0 | 同上 |
| 430×932 | 大手機 | ready | 0 | 186×52 ✓ | 1.25 | 0 | 同上 |
| 844×390 | 短橫向 | ready | 0 | 204×56 ✓ | 1.25 | 0 | 同上 |
| 768×1024 | 平板直向 | ready | 0 | 186×52 ✓ | 1.25 | 0 | 同上 |
| 1024×768 | 平板橫向 | ready | 0 | 204×56 ✓ | 1.25 | 0 | 同上 |
| 1440×900 | 桌機 | ready | 0 | 204×56 ✓ | 1.25 | — | 同上 |

- 十個尺寸都沒有水平捲動，兩個出口都在首屏內且 ≥44px 高。
- 旋轉（直↔橫）後仍然 0 溢出，且沒有第二個 canvas。
- 每個尺寸進站後都落在乾淨的 `/`、focus 在 `#main-content`、canvas 歸零。
- render DPR 在本容器一律 1.25，因為容器回報的 `hardwareConcurrency` 讓 `chooseQuality()`
  選到 medium。**真機的 tier 與 DPR 會不同**，這是 runbook §1 要量的東西。

這些檢查另外寫成常駐測試：`e2e/intro-portal.spec.ts` 的
`Phase 12 cross-viewport layout (emulated)`（6 個尺寸 ＋ 旋轉），避免日後版面回歸。

## 4. 網路情境（模擬，390×844）

| 條件 | 早期狀態 | 最終狀態 | GLB 請求 | Enter | page error |
|---|---|---|---|---|---|
| Wi-Fi（不節流） | poster | ready | 3 | ✓ 77ms | 0 |
| 慢速（400kbps／400ms RTT，CDP 節流） | poster | ready | 3 | ✓ 121ms | 0 |
| 離線 | poster | poster | **0** | ✓ 79ms | 0 |
| Save-Data | poster | poster | **0** | ✓ 81ms | 0 |
| GLB 404 | poster | fallback | **1**（無重試風暴） | ✓ 79ms | 0 |

poster-first、Enter 不等 3D、失敗回 poster／fallback、無重試風暴 → 模擬層全部 PASS。
真機的行動網路（尤其 iOS 低數據模式與實際 3G）仍是 runbook §8。

## 5. Safari 專屬 findings

**NOT-RUN。** safe-area、100svh、工具列展開／收合、旋轉、Back／Forward、BFCache、
WebGL resume、focus handoff 的真機行為都需要 iPhone。runbook §3 是逐項清單。

模擬層可以先說的是：`preventScroll` 的 focus 交接在十個尺寸都成立（見上表），
Back／Forward 的路由行為有 E2E 覆蓋（Phase 9）；但這兩者在 Safari 的實作差異
（尤其 BFCache 與 `svh` 單位）**必須**在真機再確認一次。

## 6. VoiceOver / TalkBack findings

**兩者都 NOT-RUN。** 沒有 iOS／Android 裝置。依指示不以 axe 代替——Phase 11 的 axe 結果
只證明沒有機器可偵測的 violation，不證明朗讀順序與可操作性。runbook §5、§6 是逐項腳本。

## 7. 發熱 / 長時間 findings

**NOT-RUN。** 需要實體裝置與 2–5 分鐘的連續停留。runbook §2。

## 8. Regressions found / fixes made

- **本輪沒有發現回歸。** 模擬層的版面、旋轉、網路、進站與 focus 全部符合預期。
- **沒有修改** Blender、GLB、art direction、Little Red timeline、routing 或 Phase 9 轉場架構
  ——本輪也沒有任何真機證據要求修改。
- 只新增了 QA 工具與測試：`scripts/qa-intro-viewports.mjs`、
  `e2e/intro-portal.spec.ts` 的 Phase 12 describe、以及本目錄的 runbook 與 matrix 範本。

## 9. Phase 12 判定

**FAIL / NOT-RUN（受阻於硬體）。** 模擬層的部分 PASS，但 Phase 12 的定義就是真機驗收，
沒有裝置就不能宣稱通過。不把 emulation 記成 conditional pass，因為指示明確禁止用模擬
冒充真機。

| 區塊 | 判定 |
|---|---|
| 真機效能（iOS／Android） | NOT-RUN |
| 真機視覺 QA | NOT-RUN |
| Safari 專屬 | NOT-RUN |
| VoiceOver / TalkBack | NOT-RUN |
| 發熱／長時間 | NOT-RUN |
| Dynamic Type | NOT-RUN |
| 跨 viewport 版面（模擬） | PASS（10 個尺寸＋旋轉） |
| 網路情境（模擬） | PASS（5 種） |
| 轉場觀感 | 真機 NOT-RUN；模擬層的量測見 Phase 10 |

## 10. Phase 13 前剩餘 blocker

1. **實體 iPhone Safari 與 Android Chrome 的完整 runbook**（本目錄 §1–§9）——Phase 12 本體。
2. **實體 Blender CLI 乾淨重建複驗**（Phase 13 前必做，見 `v3-clean-rebuild-20260908/report.md`）。
3. 上述兩項完成前，Phase 13 的「18 項最終報告」不能宣稱完成。
