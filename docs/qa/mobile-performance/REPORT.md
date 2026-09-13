# Mobile Performance Gate

Status: **FAIL**

測試為 production build + next start 的 headless Chromium lab/simulated 結果；不是實體 iPhone Safari、Android Chrome 或 CrUX field metrics。

Build: mjkTOvRfcaKSHaHXA37uW  · 測量時間: 2026-09-13T09:26:35.290Z

## Page summary

以下是每頁所有模擬條件中「median 的最差值」；完整每次 cold run、條件與資源在 latest.json。

| Page | 條件 | LCP ms | CLS | interaction ms | longest task ms | transfer | JS | images |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Intro | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 1620 | 0 | 80 | 223 | 1618.86 KB | 258.3 KB | 308.7 KB |
| Landing | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 1456 | 0 | 72 | 223 | 1618.85 KB | 258.3 KB | 308.7 KB |
| Stories | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 1264 | 0 | 72 | 226 | 1621.54 KB | 268.3 KB | 296.8 KB |
| Story detail | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 852 | 0 | 64 | 203 | 1637.27 KB | 385.4 KB | 162.7 KB |
| Interactive main page | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 2440 | 0 | 56 | 172 | 393.7 KB | 229.8 KB | 72.5 KB |
| Universe map | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 4468 | 0 | 96 | 269 | 2579.36 KB | 305.4 KB | 1220.67 KB |

## Before / after evidence

before.json 是初次 baseline；以下對照同一測試條件下的每頁最差 median，保留 threshold 未被放寬的證據。

| Page | before LCP | after LCP | before CLS | after CLS | before longest task | after longest task |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Intro | 3824 | 1620 | 0 | 0 | 147 | 223 |
| Landing | 2860 | 1456 | 0 | 0 | 201 | 223 |
| Stories | 3528 | 1264 | 0 | 0 | 368 | 226 |
| Story detail | 964 | 852 | 0 | 0 | 273 | 203 |
| Interactive main page | 2740 | 2440 | 0.9 | 0 | 143 | 172 |
| Universe map | n/a | 4468 | n/a | 0 | n/a | 269 |

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
- Universe map had a main-thread task over 200ms.

WARN:
- Long tasks over 100ms require source review.
- Console/page errors were observed; see latest.json.

## Main-thread task source list

以下列出所有 >100ms long task；Chromium Long Tasks attribution 對主文件通常只回報 `window`/`unknown`，因此 unknown 是 API 能提供的來源，而不是省略量測。

| Page | Profile | Network | Run | duration ms | source |
| --- | --- | --- | ---: | ---: | --- |
| intro | android-mid | local | 1 | 142 | unknown |
| intro | android-mid | local | 1 | 113 | unknown |
| intro | android-mid | local | 2 | 145 | unknown |
| intro | android-mid | local | 2 | 112 | unknown |
| intro | android-mid | local | 3 | 142 | unknown |
| intro | android-mid | local | 3 | 112 | unknown |
| intro | android-low | local | 1 | 220 | unknown |
| intro | android-low | local | 1 | 170 | unknown |
| intro | android-low | local | 2 | 223 | unknown |
| intro | android-low | local | 2 | 171 | unknown |
| intro | android-low | local | 3 | 226 | unknown |
| intro | android-low | local | 3 | 171 | unknown |
| landing | android-mid | local | 1 | 141 | unknown |
| landing | android-mid | local | 1 | 113 | unknown |
| landing | android-mid | local | 2 | 142 | unknown |
| landing | android-mid | local | 2 | 113 | unknown |
| landing | android-mid | local | 3 | 142 | unknown |
| landing | android-mid | local | 3 | 112 | unknown |
| landing | android-low | local | 1 | 221 | unknown |
| landing | android-low | local | 1 | 169 | unknown |
| landing | android-low | local | 2 | 223 | unknown |
| landing | android-low | local | 2 | 169 | unknown |
| landing | android-low | local | 3 | 224 | unknown |
| landing | android-low | local | 3 | 168 | unknown |
| stories | android-mid | local | 1 | 191 | unknown |
| stories | android-mid | local | 1 | 113 | unknown |
| stories | android-mid | local | 1 | 148 | unknown |
| stories | android-mid | local | 2 | 197 | unknown |
| stories | android-mid | local | 2 | 115 | unknown |
| stories | android-mid | local | 2 | 149 | unknown |
| stories | android-mid | local | 3 | 195 | unknown |
| stories | android-mid | local | 3 | 114 | unknown |
| stories | android-mid | local | 3 | 145 | unknown |
| stories | android-low | local | 1 | 214 | unknown |
| stories | android-low | local | 1 | 161 | unknown |
| stories | android-low | local | 1 | 134 | unknown |
| stories | android-low | local | 1 | 225 | unknown |
| stories | android-low | local | 2 | 233 | unknown |
| stories | android-low | local | 2 | 152 | unknown |
| stories | android-low | local | 2 | 173 | unknown |
| stories | android-low | local | 2 | 223 | unknown |
| stories | android-low | local | 3 | 226 | unknown |
| stories | android-low | local | 3 | 158 | unknown |
| stories | android-low | local | 3 | 135 | unknown |
| stories | android-low | local | 3 | 221 | unknown |
| story-detail | android-mid | local | 1 | 110 | unknown |
| story-detail | android-mid | local | 1 | 112 | unknown |
| story-detail | android-mid | local | 1 | 132 | unknown |
| story-detail | android-mid | local | 2 | 112 | unknown |
| story-detail | android-mid | local | 2 | 111 | unknown |
| story-detail | android-mid | local | 2 | 135 | unknown |
| story-detail | android-mid | local | 3 | 118 | unknown |
| story-detail | android-mid | local | 3 | 113 | unknown |
| story-detail | android-mid | local | 3 | 138 | unknown |
| story-detail | android-low | local | 1 | 180 | unknown |
| story-detail | android-low | local | 1 | 171 | unknown |
| story-detail | android-low | local | 1 | 205 | unknown |
| story-detail | android-low | local | 2 | 156 | unknown |
| story-detail | android-low | local | 2 | 168 | unknown |
| story-detail | android-low | local | 2 | 203 | unknown |
| story-detail | android-low | local | 3 | 187 | unknown |
| story-detail | android-low | local | 3 | 171 | unknown |
| story-detail | android-low | local | 3 | 201 | unknown |
| interactive | android-mid | local | 1 | 111 | unknown |
| interactive | android-mid | local | 2 | 112 | unknown |
| interactive | android-mid | local | 3 | 111 | unknown |
| interactive | android-low | local | 1 | 172 | unknown |
| interactive | android-low | local | 2 | 172 | unknown |
| interactive | android-low | local | 3 | 171 | unknown |
| universe-map | android-mid | local | 1 | 172 | unknown |
| universe-map | android-mid | local | 1 | 121 | unknown |
| universe-map | android-mid | local | 1 | 122 | unknown |
| universe-map | android-mid | local | 2 | 176 | unknown |
| universe-map | android-mid | local | 2 | 109 | unknown |
| universe-map | android-mid | local | 2 | 116 | unknown |
| universe-map | android-mid | local | 3 | 166 | unknown |
| universe-map | android-mid | local | 3 | 120 | unknown |
| universe-map | android-mid | local | 3 | 107 | unknown |
| universe-map | android-low | local | 1 | 295 | unknown |
| universe-map | android-low | local | 1 | 193 | unknown |
| universe-map | android-low | local | 1 | 190 | unknown |
| universe-map | android-low | local | 2 | 240 | unknown |
| universe-map | android-low | local | 2 | 185 | unknown |
| universe-map | android-low | local | 2 | 174 | unknown |
| universe-map | android-low | local | 3 | 269 | unknown |
| universe-map | android-low | local | 3 | 184 | unknown |
| universe-map | android-low | local | 3 | 192 | unknown |

## Image audit

首屏圖片、intrinsic/rendered 尺寸、transfer bytes、format、eager/lazy 與 width/height 契約在 latest.json 的 imageAudit。

## Interpretation

- before.json 是此 gate 第一次執行的 baseline；若後續只因 FAIL 做優化，請以它和本檔比較 before/after。
- JS heap 是 browser performance.memory 的 GC-dependent trend，不能代表 GPU memory。
- 實體裝置仍需確認 Safari/Chrome 的合成器、圖片 decode、電池／熱 throttling、觸控輸入與真實網路。

