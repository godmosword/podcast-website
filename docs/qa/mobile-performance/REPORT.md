# Mobile Performance Gate

Status: **FAIL**

測試為 production build + next start 的 headless Chromium lab/simulated 結果；不是實體 iPhone Safari、Android Chrome 或 CrUX field metrics。

Build: E_yLB3piP7q8nVXweC83I  · 測量時間: 2026-09-12T03:21:31.723Z

## Page summary

以下是每頁所有模擬條件中「median 的最差值」；完整每次 cold run、條件與資源在 latest.json。

| Page | 條件 | LCP ms | CLS | interaction ms | longest task ms | transfer | JS | images |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Intro | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 1004 | 0 | 32 | 202 | 1473.57 KB | 203.6 KB | 267.8 KB |
| Landing | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 1412 | 0 | 96 | 275 | 1620.18 KB | 256.1 KB | 308.7 KB |
| Stories | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 1300 | 0 | 96 | 453 | 1593.89 KB | 266.1 KB | 271.0 KB |
| Story detail | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 836 | 0 | 72 | 321 | 1636.15 KB | 383.2 KB | 162.7 KB |
| Interactive main page | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 3348 | 0 | 56 | 181 | 1288.67 KB | 229.5 KB | 72.5 KB |

## Before / after evidence

before.json 是初次 baseline；以下對照同一測試條件下的每頁最差 median，保留 threshold 未被放寬的證據。

| Page | before LCP | after LCP | before CLS | after CLS | before longest task | after longest task |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Intro | 3824 | 1004 | 0 | 0 | 147 | 202 |
| Landing | 2860 | 1412 | 0 | 0 | 201 | 275 |
| Stories | 3528 | 1300 | 0 | 0 | 368 | 453 |
| Story detail | 964 | 836 | 0 | 0 | 273 | 321 |
| Interactive main page | 2740 | 3348 | 0.9 | 0 | 143 | 181 |

Targets: LCP ≤ 2500ms · CLS ≤ 0.1 · representative Event Timing interaction ≤ 200ms · no main-thread task > 200ms.

## Intro animation

Frame interval numbers are simulated headless cadence approximations, not real-device FPS.

| Profile | p50 interval | p95 interval | dropped approx | layout delta | style recalc delta | hidden paused | reduced motion | route leave |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| iphone-like | 16.7 | 17.4 | 0 | 0 | 602 | yes | yes | yes |
| android-mid | 16.7 | 17.6 | 0 | 0 | 603 | yes | yes | yes |
| android-low | 16.7 | 17.6 | 0 | 0 | 603 | yes | yes | yes |

## Gate notes

FAIL:
- Intro had a main-thread task over 200ms.
- Landing had a main-thread task over 200ms.
- Stories had a main-thread task over 200ms.
- Story detail had a main-thread task over 200ms.
- Interactive main page LCP median exceeded 2.5s.

WARN:
- Long tasks over 100ms require source review.
- Console/page errors were observed; see latest.json.

## Main-thread task source list

以下列出所有 >100ms long task；Chromium Long Tasks attribution 對主文件通常只回報 `window`/`unknown`，因此 unknown 是 API 能提供的來源，而不是省略量測。

| Page | Profile | Network | Run | duration ms | source |
| --- | --- | --- | ---: | ---: | --- |
| intro | android-mid | local | 1 | 117 | unknown |
| intro | android-mid | local | 2 | 116 | unknown |
| intro | android-mid | local | 3 | 119 | unknown |
| intro | android-low | local | 1 | 211 | unknown |
| intro | android-low | local | 2 | 202 | unknown |
| intro | android-low | local | 3 | 178 | unknown |
| landing | android-mid | local | 1 | 165 | unknown |
| landing | android-mid | local | 1 | 134 | unknown |
| landing | android-mid | local | 2 | 176 | unknown |
| landing | android-mid | local | 2 | 128 | unknown |
| landing | android-mid | local | 3 | 168 | unknown |
| landing | android-mid | local | 3 | 132 | unknown |
| landing | android-low | local | 1 | 265 | unknown |
| landing | android-low | local | 1 | 192 | unknown |
| landing | android-low | local | 2 | 284 | unknown |
| landing | android-low | local | 2 | 203 | unknown |
| landing | android-low | local | 3 | 275 | unknown |
| landing | android-low | local | 3 | 155 | unknown |
| stories | android-mid | local | 1 | 314 | unknown |
| stories | android-mid | local | 1 | 126 | unknown |
| stories | android-mid | local | 2 | 344 | unknown |
| stories | android-mid | local | 2 | 107 | unknown |
| stories | android-mid | local | 2 | 137 | unknown |
| stories | android-mid | local | 3 | 314 | unknown |
| stories | android-mid | local | 3 | 130 | unknown |
| stories | android-mid | local | 3 | 138 | unknown |
| stories | android-low | local | 1 | 453 | unknown |
| stories | android-low | local | 1 | 309 | unknown |
| stories | android-low | local | 1 | 221 | unknown |
| stories | android-low | local | 1 | 111 | unknown |
| stories | android-low | local | 2 | 458 | unknown |
| stories | android-low | local | 2 | 300 | unknown |
| stories | android-low | local | 2 | 128 | unknown |
| stories | android-low | local | 2 | 187 | unknown |
| stories | android-low | local | 3 | 419 | unknown |
| stories | android-low | local | 3 | 261 | unknown |
| stories | android-low | local | 3 | 199 | unknown |
| story-detail | android-mid | local | 1 | 234 | unknown |
| story-detail | android-mid | local | 1 | 128 | unknown |
| story-detail | android-mid | local | 2 | 224 | unknown |
| story-detail | android-mid | local | 2 | 129 | unknown |
| story-detail | android-mid | local | 3 | 232 | unknown |
| story-detail | android-mid | local | 3 | 137 | unknown |
| story-detail | android-low | local | 1 | 321 | unknown |
| story-detail | android-low | local | 1 | 114 | unknown |
| story-detail | android-low | local | 1 | 220 | unknown |
| story-detail | android-low | local | 2 | 334 | unknown |
| story-detail | android-low | local | 2 | 104 | unknown |
| story-detail | android-low | local | 2 | 221 | unknown |
| story-detail | android-low | local | 3 | 313 | unknown |
| story-detail | android-low | local | 3 | 137 | unknown |
| story-detail | android-low | local | 3 | 218 | unknown |
| interactive | android-mid | local | 1 | 118 | unknown |
| interactive | android-mid | local | 3 | 121 | unknown |
| interactive | android-low | local | 1 | 185 | unknown |
| interactive | android-low | local | 2 | 181 | unknown |
| interactive | android-low | local | 3 | 176 | unknown |

## Image audit

首屏圖片、intrinsic/rendered 尺寸、transfer bytes、format、eager/lazy 與 width/height 契約在 latest.json 的 imageAudit。

## Interpretation

- before.json 是此 gate 第一次執行的 baseline；若後續只因 FAIL 做優化，請以它和本檔比較 before/after。
- JS heap 是 browser performance.memory 的 GC-dependent trend，不能代表 GPU memory。
- 實體裝置仍需確認 Safari/Chrome 的合成器、圖片 decode、電池／熱 throttling、觸控輸入與真實網路。

