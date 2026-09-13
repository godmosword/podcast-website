# Mobile Performance Gate

Status: **FAIL**

測試為 production build + next start 的 headless Chromium lab/simulated 結果；不是實體 iPhone Safari、Android Chrome 或 CrUX field metrics。

Build: dd0hvIeYh9tePhoDXriRp  · 測量時間: 2026-09-13T09:48:24.317Z

## Page summary

以下是每頁所有模擬條件中「median 的最差值」；完整每次 cold run、條件與資源在 latest.json。

| Page | 條件 | LCP ms | CLS | interaction ms | longest task ms | transfer | JS | images |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Intro | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 1572 | 0 | 80 | 237 | 1618.84 KB | 258.3 KB | 308.7 KB |
| Landing | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 1420 | 0 | 88 | 236 | 1618.83 KB | 258.3 KB | 308.7 KB |
| Stories | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 1326 | 0 | 72 | 233 | 1621.52 KB | 268.3 KB | 296.8 KB |
| Story detail | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 820 | 0 | 64 | 224 | 1641.07 KB | 388.4 KB | 162.7 KB |
| Interactive main page | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 2468 | 0 | 64 | 187 | 395.5 KB | 231.6 KB | 72.5 KB |
| Universe map | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 3776 | 0 | 80 | 191 | 2586.69 KB | 308.4 KB | 1220.67 KB |

## Before / after evidence

before.json 是初次 baseline；以下對照同一測試條件下的每頁最差 median，保留 threshold 未被放寬的證據。

| Page | before LCP | after LCP | before CLS | after CLS | before longest task | after longest task |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Intro | 3824 | 1572 | 0 | 0 | 147 | 237 |
| Landing | 2860 | 1420 | 0 | 0 | 201 | 236 |
| Stories | 3528 | 1326 | 0 | 0 | 368 | 233 |
| Story detail | 964 | 820 | 0 | 0 | 273 | 224 |
| Interactive main page | 2740 | 2468 | 0.9 | 0 | 143 | 187 |
| Universe map | n/a | 3776 | n/a | 0 | n/a | 191 |

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
- Universe map LCP median exceeded 2.5s.

WARN:
- Long tasks over 100ms require source review.
- Console/page errors were observed; see latest.json.

## Main-thread task source list

以下列出所有 >100ms long task；Chromium Long Tasks attribution 對主文件通常只回報 `window`/`unknown`，因此 unknown 是 API 能提供的來源，而不是省略量測。

| Page | Profile | Network | Run | duration ms | source |
| --- | --- | --- | ---: | ---: | --- |
| intro | android-mid | local | 1 | 155 | unknown |
| intro | android-mid | local | 1 | 124 | unknown |
| intro | android-mid | local | 2 | 151 | unknown |
| intro | android-mid | local | 2 | 122 | unknown |
| intro | android-mid | local | 3 | 152 | unknown |
| intro | android-mid | local | 3 | 122 | unknown |
| intro | android-low | local | 1 | 240 | unknown |
| intro | android-low | local | 1 | 186 | unknown |
| intro | android-low | local | 2 | 233 | unknown |
| intro | android-low | local | 2 | 186 | unknown |
| intro | android-low | local | 3 | 237 | unknown |
| intro | android-low | local | 3 | 191 | unknown |
| landing | android-mid | local | 1 | 151 | unknown |
| landing | android-mid | local | 1 | 123 | unknown |
| landing | android-mid | local | 2 | 154 | unknown |
| landing | android-mid | local | 2 | 124 | unknown |
| landing | android-mid | local | 3 | 156 | unknown |
| landing | android-mid | local | 3 | 123 | unknown |
| landing | android-low | local | 1 | 235 | unknown |
| landing | android-low | local | 1 | 179 | unknown |
| landing | android-low | local | 2 | 244 | unknown |
| landing | android-low | local | 2 | 184 | unknown |
| landing | android-low | local | 3 | 236 | unknown |
| landing | android-low | local | 3 | 189 | unknown |
| stories | android-mid | local | 1 | 195 | unknown |
| stories | android-mid | local | 1 | 120 | unknown |
| stories | android-mid | local | 1 | 184 | unknown |
| stories | android-mid | local | 2 | 198 | unknown |
| stories | android-mid | local | 2 | 117 | unknown |
| stories | android-mid | local | 2 | 153 | unknown |
| stories | android-mid | local | 3 | 194 | unknown |
| stories | android-mid | local | 3 | 114 | unknown |
| stories | android-mid | local | 3 | 147 | unknown |
| stories | android-low | local | 1 | 231 | unknown |
| stories | android-low | local | 1 | 155 | unknown |
| stories | android-low | local | 1 | 178 | unknown |
| stories | android-low | local | 1 | 233 | unknown |
| stories | android-low | local | 2 | 235 | unknown |
| stories | android-low | local | 2 | 158 | unknown |
| stories | android-low | local | 2 | 171 | unknown |
| stories | android-low | local | 2 | 227 | unknown |
| stories | android-low | local | 3 | 224 | unknown |
| stories | android-low | local | 3 | 172 | unknown |
| stories | android-low | local | 3 | 138 | unknown |
| stories | android-low | local | 3 | 222 | unknown |
| story-detail | android-mid | local | 1 | 128 | unknown |
| story-detail | android-mid | local | 1 | 123 | unknown |
| story-detail | android-mid | local | 1 | 144 | unknown |
| story-detail | android-mid | local | 2 | 125 | unknown |
| story-detail | android-mid | local | 2 | 120 | unknown |
| story-detail | android-mid | local | 2 | 148 | unknown |
| story-detail | android-mid | local | 3 | 128 | unknown |
| story-detail | android-mid | local | 3 | 123 | unknown |
| story-detail | android-mid | local | 3 | 143 | unknown |
| story-detail | android-low | local | 1 | 196 | unknown |
| story-detail | android-low | local | 1 | 192 | unknown |
| story-detail | android-low | local | 1 | 220 | unknown |
| story-detail | android-low | local | 2 | 177 | unknown |
| story-detail | android-low | local | 2 | 187 | unknown |
| story-detail | android-low | local | 2 | 224 | unknown |
| story-detail | android-low | local | 3 | 168 | unknown |
| story-detail | android-low | local | 3 | 184 | unknown |
| story-detail | android-low | local | 3 | 231 | unknown |
| interactive | android-mid | local | 1 | 121 | unknown |
| interactive | android-mid | local | 2 | 122 | unknown |
| interactive | android-mid | local | 3 | 121 | unknown |
| interactive | android-low | local | 1 | 188 | unknown |
| interactive | android-low | local | 2 | 186 | unknown |
| interactive | android-low | local | 3 | 187 | unknown |
| universe-map | android-mid | local | 1 | 123 | unknown |
| universe-map | android-mid | local | 1 | 112 | unknown |
| universe-map | android-mid | local | 1 | 119 | unknown |
| universe-map | android-mid | local | 2 | 123 | unknown |
| universe-map | android-mid | local | 2 | 107 | unknown |
| universe-map | android-mid | local | 2 | 118 | unknown |
| universe-map | android-mid | local | 3 | 126 | unknown |
| universe-map | android-mid | local | 3 | 111 | unknown |
| universe-map | android-mid | local | 3 | 114 | unknown |
| universe-map | android-low | local | 1 | 148 | unknown |
| universe-map | android-low | local | 1 | 191 | unknown |
| universe-map | android-low | local | 1 | 178 | unknown |
| universe-map | android-low | local | 1 | 176 | unknown |
| universe-map | android-low | local | 2 | 153 | unknown |
| universe-map | android-low | local | 2 | 193 | unknown |
| universe-map | android-low | local | 2 | 165 | unknown |
| universe-map | android-low | local | 2 | 175 | unknown |
| universe-map | android-low | local | 3 | 145 | unknown |
| universe-map | android-low | local | 3 | 187 | unknown |
| universe-map | android-low | local | 3 | 167 | unknown |
| universe-map | android-low | local | 3 | 180 | unknown |

## Image audit

首屏圖片、intrinsic/rendered 尺寸、transfer bytes、format、eager/lazy 與 width/height 契約在 latest.json 的 imageAudit。

## Interpretation

- before.json 是此 gate 第一次執行的 baseline；若後續只因 FAIL 做優化，請以它和本檔比較 before/after。
- JS heap 是 browser performance.memory 的 GC-dependent trend，不能代表 GPU memory。
- 實體裝置仍需確認 Safari/Chrome 的合成器、圖片 decode、電池／熱 throttling、觸控輸入與真實網路。

