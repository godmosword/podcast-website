# Mobile Performance Gate

Status: **FAIL**

測試為 production build + next start 的 headless Chromium lab/simulated 結果；不是實體 iPhone Safari、Android Chrome 或 CrUX field metrics。

Build: xrWmfIcopNtN49SdGm-uV  · 測量時間: 2026-09-12T13:30:58.810Z

## Page summary

以下是每頁所有模擬條件中「median 的最差值」；完整每次 cold run、條件與資源在 latest.json。

| Page | 條件 | LCP ms | CLS | interaction ms | longest task ms | transfer | JS | images |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Intro | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 1624 | 0 | 104 | 272 | 1616.33 KB | 256.3 KB | 308.7 KB |
| Landing | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 1432 | 0 | 96 | 275 | 1616.34 KB | 256.3 KB | 308.7 KB |
| Stories | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 1212 | 0 | 88 | 278 | 1592.77 KB | 266.3 KB | 271.0 KB |
| Story detail | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 852 | 0 | 96 | 288 | 1634.91 KB | 383.5 KB | 162.7 KB |
| Interactive main page | iPhone-like / 1.6 Mbps down / 750 Kbps up / 150 ms | 2464 | 0 | 56 | 188 | 392.9 KB | 229.7 KB | 72.5 KB |

## Before / after evidence

before.json 是初次 baseline；以下對照同一測試條件下的每頁最差 median，保留 threshold 未被放寬的證據。

| Page | before LCP | after LCP | before CLS | after CLS | before longest task | after longest task |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Intro | 3824 | 1624 | 0 | 0 | 147 | 272 |
| Landing | 2860 | 1432 | 0 | 0 | 201 | 275 |
| Stories | 3528 | 1212 | 0 | 0 | 368 | 278 |
| Story detail | 964 | 852 | 0 | 0 | 273 | 288 |
| Interactive main page | 2740 | 2464 | 0.9 | 0 | 143 | 188 |

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
| intro | android-mid | local | 1 | 179 | unknown |
| intro | android-mid | local | 1 | 142 | unknown |
| intro | android-mid | local | 2 | 174 | unknown |
| intro | android-mid | local | 2 | 143 | unknown |
| intro | android-mid | local | 3 | 173 | unknown |
| intro | android-mid | local | 3 | 144 | unknown |
| intro | android-low | local | 1 | 270 | unknown |
| intro | android-low | local | 1 | 213 | unknown |
| intro | android-low | local | 2 | 272 | unknown |
| intro | android-low | local | 2 | 218 | unknown |
| intro | android-low | local | 3 | 274 | unknown |
| intro | android-low | local | 3 | 212 | unknown |
| landing | android-mid | local | 1 | 180 | unknown |
| landing | android-mid | local | 1 | 145 | unknown |
| landing | android-mid | local | 2 | 170 | unknown |
| landing | android-mid | local | 2 | 139 | unknown |
| landing | android-mid | local | 3 | 174 | unknown |
| landing | android-mid | local | 3 | 144 | unknown |
| landing | android-low | local | 1 | 282 | unknown |
| landing | android-low | local | 1 | 212 | unknown |
| landing | android-low | local | 2 | 273 | unknown |
| landing | android-low | local | 2 | 221 | unknown |
| landing | android-low | local | 3 | 275 | unknown |
| landing | android-low | local | 3 | 217 | unknown |
| stories | android-mid | local | 1 | 227 | unknown |
| stories | android-mid | local | 1 | 108 | unknown |
| stories | android-mid | local | 1 | 146 | unknown |
| stories | android-mid | local | 1 | 180 | unknown |
| stories | android-mid | local | 2 | 225 | unknown |
| stories | android-mid | local | 2 | 141 | unknown |
| stories | android-mid | local | 2 | 174 | unknown |
| stories | android-mid | local | 3 | 227 | unknown |
| stories | android-mid | local | 3 | 143 | unknown |
| stories | android-mid | local | 3 | 181 | unknown |
| stories | android-low | local | 1 | 267 | unknown |
| stories | android-low | local | 1 | 225 | unknown |
| stories | android-low | local | 1 | 168 | unknown |
| stories | android-low | local | 1 | 284 | unknown |
| stories | android-low | local | 2 | 249 | unknown |
| stories | android-low | local | 2 | 228 | unknown |
| stories | android-low | local | 2 | 166 | unknown |
| stories | android-low | local | 2 | 265 | unknown |
| stories | android-low | local | 3 | 268 | unknown |
| stories | android-low | local | 3 | 236 | unknown |
| stories | android-low | local | 3 | 165 | unknown |
| stories | android-low | local | 3 | 278 | unknown |
| story-detail | android-mid | local | 1 | 205 | unknown |
| story-detail | android-mid | local | 1 | 155 | unknown |
| story-detail | android-mid | local | 1 | 194 | unknown |
| story-detail | android-mid | local | 2 | 192 | unknown |
| story-detail | android-mid | local | 2 | 151 | unknown |
| story-detail | android-mid | local | 2 | 188 | unknown |
| story-detail | android-mid | local | 3 | 193 | unknown |
| story-detail | android-mid | local | 3 | 154 | unknown |
| story-detail | android-mid | local | 3 | 197 | unknown |
| story-detail | android-low | local | 1 | 196 | unknown |
| story-detail | android-low | local | 1 | 140 | unknown |
| story-detail | android-low | local | 1 | 236 | unknown |
| story-detail | android-low | local | 1 | 288 | unknown |
| story-detail | android-low | local | 2 | 189 | unknown |
| story-detail | android-low | local | 2 | 163 | unknown |
| story-detail | android-low | local | 2 | 240 | unknown |
| story-detail | android-low | local | 2 | 347 | unknown |
| story-detail | android-low | local | 3 | 195 | unknown |
| story-detail | android-low | local | 3 | 175 | unknown |
| story-detail | android-low | local | 3 | 236 | unknown |
| story-detail | android-low | local | 3 | 283 | unknown |
| interactive | android-mid | local | 1 | 125 | unknown |
| interactive | android-mid | local | 2 | 124 | unknown |
| interactive | android-mid | local | 3 | 125 | unknown |
| interactive | android-low | local | 1 | 188 | unknown |
| interactive | android-low | local | 2 | 186 | unknown |
| interactive | android-low | local | 3 | 192 | unknown |

## Image audit

首屏圖片、intrinsic/rendered 尺寸、transfer bytes、format、eager/lazy 與 width/height 契約在 latest.json 的 imageAudit。

## Interpretation

- before.json 是此 gate 第一次執行的 baseline；若後續只因 FAIL 做優化，請以它和本檔比較 before/after。
- JS heap 是 browser performance.memory 的 GC-dependent trend，不能代表 GPU memory。
- 實體裝置仍需確認 Safari/Chrome 的合成器、圖片 decode、電池／熱 throttling、觸控輸入與真實網路。

