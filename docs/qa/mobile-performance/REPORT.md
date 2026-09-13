# Mobile Performance Gate

Status: **FAIL**

測試為 production build + next start 的 headless Chromium lab/simulated 結果；不是實體 iPhone Safari、Android Chrome 或 CrUX field metrics。

Build: 4FAsWeUUuijFXkFeU130_  · 測量時間: 2026-09-13T14:25:28.280Z

## Page summary

以下是每頁所有模擬條件中「median 的最差值」；完整每次 cold run、條件與資源在 latest.json。

| Page | 條件 | LCP ms | CLS | interaction ms | longest task ms | transfer | JS | images |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Intro | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 1600 | 0 | 72 | 168 | 1620.53 KB | 259.0 KB | 308.7 KB |
| Landing | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 1432 | 0 | 80 | 171 | 1620.53 KB | 259.0 KB | 308.7 KB |
| Stories | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 1336 | 0 | 72 | 195 | 1462.22 KB | 269.0 KB | 136.6 KB |
| Story detail | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 852 | 0 | 64 | 201 | 1642.08 KB | 389.2 KB | 162.7 KB |
| Interactive main page | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 2488 | 0 | 56 | 173 | 396.3 KB | 232.2 KB | 72.5 KB |
| Universe map | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 4240 | 0 | 88 | 172 | 2605.75 KB | 309.1 KB | 1238.66 KB |

## Before / after evidence

before.json 是初次 baseline；以下對照同一測試條件下的每頁最差 median，保留 threshold 未被放寬的證據。

| Page | before LCP | after LCP | before CLS | after CLS | before longest task | after longest task |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Intro | 3824 | 1600 | 0 | 0 | 147 | 168 |
| Landing | 2860 | 1432 | 0 | 0 | 201 | 171 |
| Stories | 3528 | 1336 | 0 | 0 | 368 | 195 |
| Story detail | 964 | 852 | 0 | 0 | 273 | 201 |
| Interactive main page | 2740 | 2488 | 0.9 | 0 | 143 | 173 |
| Universe map | n/a | 4240 | n/a | 0 | n/a | 172 |

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
- Story detail had a main-thread task over 200ms.
- Universe map LCP median exceeded 2.5s.

WARN:
- Long tasks over 100ms require source review.
- Console/page errors were observed; see latest.json.

## Main-thread task source list

以下列出所有 >100ms long task；Chromium Long Tasks attribution 對主文件通常只回報 `window`/`unknown`，因此 unknown 是 API 能提供的來源，而不是省略量測。

| Page | Profile | Network | Run | duration ms | source |
| --- | --- | --- | ---: | ---: | --- |
| intro | android-mid | local | 1 | 114 | unknown |
| intro | android-mid | local | 2 | 113 | unknown |
| intro | android-mid | local | 3 | 112 | unknown |
| intro | android-low | local | 1 | 105 | unknown |
| intro | android-low | local | 1 | 167 | unknown |
| intro | android-low | local | 1 | 146 | unknown |
| intro | android-low | local | 2 | 111 | unknown |
| intro | android-low | local | 2 | 173 | unknown |
| intro | android-low | local | 2 | 150 | unknown |
| intro | android-low | local | 3 | 114 | unknown |
| intro | android-low | local | 3 | 168 | unknown |
| intro | android-low | local | 3 | 149 | unknown |
| landing | android-mid | local | 1 | 112 | unknown |
| landing | android-mid | local | 2 | 114 | unknown |
| landing | android-mid | local | 3 | 115 | unknown |
| landing | android-low | local | 1 | 108 | unknown |
| landing | android-low | local | 1 | 173 | unknown |
| landing | android-low | local | 1 | 150 | unknown |
| landing | android-low | local | 2 | 107 | unknown |
| landing | android-low | local | 2 | 171 | unknown |
| landing | android-low | local | 2 | 147 | unknown |
| landing | android-low | local | 3 | 106 | unknown |
| landing | android-low | local | 3 | 168 | unknown |
| landing | android-low | local | 3 | 151 | unknown |
| stories | android-mid | local | 1 | 113 | unknown |
| stories | android-mid | local | 1 | 117 | unknown |
| stories | android-mid | local | 1 | 129 | unknown |
| stories | android-mid | local | 2 | 114 | unknown |
| stories | android-mid | local | 2 | 113 | unknown |
| stories | android-mid | local | 2 | 128 | unknown |
| stories | android-mid | local | 3 | 119 | unknown |
| stories | android-mid | local | 3 | 116 | unknown |
| stories | android-mid | local | 3 | 131 | unknown |
| stories | android-low | local | 1 | 182 | unknown |
| stories | android-low | local | 1 | 136 | unknown |
| stories | android-low | local | 1 | 195 | unknown |
| stories | android-low | local | 2 | 176 | unknown |
| stories | android-low | local | 2 | 122 | unknown |
| stories | android-low | local | 2 | 197 | unknown |
| stories | android-low | local | 3 | 179 | unknown |
| stories | android-low | local | 3 | 171 | unknown |
| stories | android-low | local | 3 | 194 | unknown |
| story-detail | android-mid | local | 1 | 103 | unknown |
| story-detail | android-mid | local | 1 | 116 | unknown |
| story-detail | android-mid | local | 1 | 133 | unknown |
| story-detail | android-mid | local | 2 | 101 | unknown |
| story-detail | android-mid | local | 2 | 113 | unknown |
| story-detail | android-mid | local | 2 | 132 | unknown |
| story-detail | android-mid | local | 3 | 101 | unknown |
| story-detail | android-mid | local | 3 | 114 | unknown |
| story-detail | android-mid | local | 3 | 133 | unknown |
| story-detail | android-low | local | 1 | 163 | unknown |
| story-detail | android-low | local | 1 | 176 | unknown |
| story-detail | android-low | local | 1 | 201 | unknown |
| story-detail | android-low | local | 2 | 164 | unknown |
| story-detail | android-low | local | 2 | 173 | unknown |
| story-detail | android-low | local | 2 | 198 | unknown |
| story-detail | android-low | local | 3 | 188 | unknown |
| story-detail | android-low | local | 3 | 171 | unknown |
| story-detail | android-low | local | 3 | 205 | unknown |
| interactive | android-mid | local | 1 | 113 | unknown |
| interactive | android-mid | local | 2 | 115 | unknown |
| interactive | android-mid | local | 3 | 110 | unknown |
| interactive | android-low | local | 1 | 177 | unknown |
| interactive | android-low | local | 2 | 171 | unknown |
| interactive | android-low | local | 3 | 173 | unknown |
| universe-map | android-mid | local | 1 | 111 | unknown |
| universe-map | android-mid | local | 1 | 110 | unknown |
| universe-map | android-mid | local | 1 | 121 | unknown |
| universe-map | android-mid | local | 2 | 112 | unknown |
| universe-map | android-mid | local | 2 | 109 | unknown |
| universe-map | android-mid | local | 2 | 110 | unknown |
| universe-map | android-mid | local | 3 | 118 | unknown |
| universe-map | android-mid | local | 3 | 111 | unknown |
| universe-map | android-mid | local | 3 | 114 | unknown |
| universe-map | android-low | local | 1 | 145 | unknown |
| universe-map | android-low | local | 1 | 162 | unknown |
| universe-map | android-low | local | 1 | 170 | unknown |
| universe-map | android-low | local | 1 | 165 | unknown |
| universe-map | android-low | local | 2 | 139 | unknown |
| universe-map | android-low | local | 2 | 173 | unknown |
| universe-map | android-low | local | 2 | 171 | unknown |
| universe-map | android-low | local | 2 | 173 | unknown |
| universe-map | android-low | local | 3 | 133 | unknown |
| universe-map | android-low | local | 3 | 172 | unknown |
| universe-map | android-low | local | 3 | 171 | unknown |
| universe-map | android-low | local | 3 | 171 | unknown |

## Image audit

首屏圖片、intrinsic/rendered 尺寸、transfer bytes、format、eager/lazy 與 width/height 契約在 latest.json 的 imageAudit。

## Interpretation

- before.json 是此 gate 第一次執行的 baseline；若後續只因 FAIL 做優化，請以它和本檔比較 before/after。
- JS heap 是 browser performance.memory 的 GC-dependent trend，不能代表 GPU memory。
- 實體裝置仍需確認 Safari/Chrome 的合成器、圖片 decode、電池／熱 throttling、觸控輸入與真實網路。

