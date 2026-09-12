# Mobile Performance Gate

Status: **FAIL**

測試為 production build + next start 的 headless Chromium lab/simulated 結果；不是實體 iPhone Safari、Android Chrome 或 CrUX field metrics。

Build: E96IxmHmG-ZamlZd20n9v  · 測量時間: 2026-09-12T12:05:36.423Z

## Page summary

以下是每頁所有模擬條件中「median 的最差值」；完整每次 cold run、條件與資源在 latest.json。

| Page | 條件 | LCP ms | CLS | interaction ms | longest task ms | transfer | JS | images |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Intro | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 1636 | 0 | 80 | 219 | 1616.13 KB | 256.2 KB | 308.7 KB |
| Landing | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 1452 | 0 | 72 | 223 | 1616.13 KB | 256.2 KB | 308.7 KB |
| Stories | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 1208 | 0 | 64 | 345 | 1592.53 KB | 266.2 KB | 271.0 KB |
| Story detail | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 872 | 0 | 64 | 320 | 1634.65 KB | 383.3 KB | 162.7 KB |
| Interactive main page | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 2452 | 0 | 56 | 169 | 392.6 KB | 229.6 KB | 72.5 KB |

## Before / after evidence

before.json 是初次 baseline；以下對照同一測試條件下的每頁最差 median，保留 threshold 未被放寬的證據。

| Page | before LCP | after LCP | before CLS | after CLS | before longest task | after longest task |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Intro | 3824 | 1636 | 0 | 0 | 147 | 219 |
| Landing | 2860 | 1452 | 0 | 0 | 201 | 223 |
| Stories | 3528 | 1208 | 0 | 0 | 368 | 345 |
| Story detail | 964 | 872 | 0 | 0 | 273 | 320 |
| Interactive main page | 2740 | 2452 | 0.9 | 0 | 143 | 169 |

Targets: LCP ≤ 2500ms · CLS ≤ 0.1 · representative Event Timing interaction ≤ 200ms · no main-thread task > 200ms.

## Intro animation

Frame interval numbers are simulated headless cadence approximations, not real-device FPS.
若 `/intro` 因 feature flag redirect 到 `/`，Intro runtime 不會拿 Landing DOM 充當證據；hidden/reduced/compositor 檢查改以同一份 parallax CSS 的 contract fixture 驗證。

| Profile | p50 interval | p95 interval | dropped approx | layout delta | style recalc delta | hidden paused | reduced motion | route leave |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| iphone-like | n/a | n/a | 0 | 0 | 2 | yes | yes | n/a |
| android-mid | n/a | n/a | 0 | 0 | 2 | yes | yes | n/a |
| android-low | n/a | n/a | 0 | 0 | 2 | yes | yes | n/a |

## Gate notes

FAIL:
- Intro had a main-thread task over 200ms.
- Landing had a main-thread task over 200ms.
- Stories had a main-thread task over 200ms.
- Story detail had a main-thread task over 200ms.

WARN:
- Long tasks over 100ms require source review.
- Console/page errors were observed; see latest.json.

## Main-thread task source list

以下列出所有 >100ms long task；Chromium Long Tasks attribution 對主文件通常只回報 `window`/`unknown`，因此 unknown 是 API 能提供的來源，而不是省略量測。

| Page | Profile | Network | Run | duration ms | source |
| --- | --- | --- | ---: | ---: | --- |
| intro | android-mid | local | 1 | 142 | unknown |
| intro | android-mid | local | 1 | 115 | unknown |
| intro | android-mid | local | 2 | 145 | unknown |
| intro | android-mid | local | 2 | 113 | unknown |
| intro | android-mid | local | 3 | 143 | unknown |
| intro | android-mid | local | 3 | 114 | unknown |
| intro | android-low | local | 1 | 219 | unknown |
| intro | android-low | local | 1 | 172 | unknown |
| intro | android-low | local | 2 | 229 | unknown |
| intro | android-low | local | 2 | 178 | unknown |
| intro | android-low | local | 3 | 217 | unknown |
| intro | android-low | local | 3 | 172 | unknown |
| landing | android-mid | local | 1 | 144 | unknown |
| landing | android-mid | local | 1 | 118 | unknown |
| landing | android-mid | local | 2 | 146 | unknown |
| landing | android-mid | local | 2 | 116 | unknown |
| landing | android-mid | local | 3 | 147 | unknown |
| landing | android-mid | local | 3 | 116 | unknown |
| landing | android-low | local | 1 | 223 | unknown |
| landing | android-low | local | 1 | 174 | unknown |
| landing | android-low | local | 2 | 225 | unknown |
| landing | android-low | local | 2 | 175 | unknown |
| landing | android-low | local | 3 | 219 | unknown |
| landing | android-low | local | 3 | 173 | unknown |
| stories | android-mid | local | 1 | 310 | unknown |
| stories | android-mid | local | 1 | 125 | unknown |
| stories | android-mid | local | 2 | 250 | unknown |
| stories | android-mid | local | 2 | 124 | unknown |
| stories | android-mid | local | 2 | 116 | unknown |
| stories | android-mid | local | 3 | 285 | unknown |
| stories | android-mid | local | 3 | 115 | unknown |
| stories | android-low | local | 1 | 378 | unknown |
| stories | android-low | local | 1 | 217 | unknown |
| stories | android-low | local | 1 | 179 | unknown |
| stories | android-low | local | 2 | 345 | unknown |
| stories | android-low | local | 2 | 232 | unknown |
| stories | android-low | local | 2 | 133 | unknown |
| stories | android-low | local | 3 | 340 | unknown |
| stories | android-low | local | 3 | 233 | unknown |
| stories | android-low | local | 3 | 134 | unknown |
| story-detail | android-mid | local | 1 | 204 | unknown |
| story-detail | android-mid | local | 1 | 114 | unknown |
| story-detail | android-mid | local | 2 | 208 | unknown |
| story-detail | android-mid | local | 2 | 115 | unknown |
| story-detail | android-mid | local | 3 | 206 | unknown |
| story-detail | android-mid | local | 3 | 114 | unknown |
| story-detail | android-low | local | 1 | 331 | unknown |
| story-detail | android-low | local | 1 | 171 | unknown |
| story-detail | android-low | local | 2 | 320 | unknown |
| story-detail | android-low | local | 2 | 172 | unknown |
| story-detail | android-low | local | 3 | 309 | unknown |
| story-detail | android-low | local | 3 | 172 | unknown |
| interactive | android-mid | local | 1 | 113 | unknown |
| interactive | android-mid | local | 2 | 113 | unknown |
| interactive | android-mid | local | 3 | 114 | unknown |
| interactive | android-low | local | 1 | 169 | unknown |
| interactive | android-low | local | 2 | 169 | unknown |
| interactive | android-low | local | 3 | 170 | unknown |

## Image audit

首屏圖片、intrinsic/rendered 尺寸、transfer bytes、format、eager/lazy 與 width/height 契約在 latest.json 的 imageAudit。

## Interpretation

- before.json 是此 gate 第一次執行的 baseline；若後續只因 FAIL 做優化，請以它和本檔比較 before/after。
- JS heap 是 browser performance.memory 的 GC-dependent trend，不能代表 GPU memory。
- 實體裝置仍需確認 Safari/Chrome 的合成器、圖片 decode、電池／熱 throttling、觸控輸入與真實網路。

