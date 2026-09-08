# 動畫時間脫離幀率（2026-09-08）

## 問題

`Vehicle.tsx`、`World.tsx`（摩天輪與樹擺）與 `CameraRig.tsx`（入園推近）都以

```ts
elapsed.current += Math.min(delta, .05);
```

累加 **render delta**，等於把「有效活動時間」定義成幀數乘上最多 50ms。60 FPS 時
每秒推進 1 秒，但 10 FPS 時每秒只推進 0.5 秒：

| 幀率 | 每秒推進的動畫時間 | 18 秒旅程的真實長度 | 問候（4.9–6.2s）實際出現時間 |
|---|---|---|---|
| ≥20 FPS | 1.00s | 18s | 4.9s |
| 10 FPS | 0.50s | 36s | 9.8s |
| 5 FPS | 0.25s | 72s | 19.6s |

摩天輪的 56 秒一圈、樹擺週期與 360ms 的入園推近同樣被拉長。這在
`e2e/intro-portal.spec.ts` 的 `runs the signature phases once and pauses active time`
以軟體算圖執行時直接失敗——測試等 20 秒仍停在 `approach`。

## 修正

`components/landing/hero-world/active-clock.ts` 新增 `ActiveTimeline`：每幀**讀時鐘**
而不是累加 delta，所以動畫速度與幀率無關。

- `advance(limitSeconds?)`：推進到現在，回傳這一幀真正經過的秒數，可選擇夾在終點。
- `suspend()`：離開 active（hidden、pause、離頁、reduced motion 卸載）時切段。
  時間不歸零，恢復後的第一幀只重新開啟一段、不補算空白期間 → **背景 wall time 不計入、
  resume 不跳時間**。
- `reset()`：重播（`run` 改變）時歸零。
- `MAX_FRAME_DELTA_MS = 1000`：單一幀最多推進 1 秒。這不是用來抵銷低幀率（1 FPS 以上都
  不受影響），而是擋掉「頁面仍可見但主執行緒被凍住」（系統休眠、長 task）之後的一次性大跳。

四個動畫點都改用它：小紅時間軸、摩天輪 56 秒、樹擺、入園推近。`QualityManager` 仍然使用
render delta——它量的就是幀率，本來就該看幀。

## 沒有改到的東西

- reduced motion：仍然不建立 canvas、不載 3D chunk（時間軸根本不會被建立）。
- 24 秒次要動態休眠與 15 秒載入逾時：仍由 `HeroWorld.tsx` 的 `getActiveClock()` 間隔計時器
  負責，維持原本的 active-time 語意。
- `frameloop="demand"`：invalidate 的條件與時機未改。
- QA 的 `__HERO_WORLD_QA_TIME` 強制姿勢：改成設定 `timeline.seconds` 後 `suspend()`，
  行為相同（`scripts/capture-intro-polish.mjs` 的六個受控姿勢照常擷取）。

## 回歸測試

`components/landing/hero-world/active-timeline.test.ts`（16 個，全部決定性，不等真實時間）：

- **60／30／10／5 FPS**：每個 signature phase 的出現時間都落在規格值 +1 幀內；時間軸與
  時鐘的最大偏差 0。窄於一幀的 `stop`（80ms）允許被跳過取樣，但前後階段仍須準時。
- 18 秒旅程在 10 FPS 下仍是 18 秒真實時間，且停在終點不超衝。
- 摩天輪 56 秒一圈在四種幀率下的角度誤差 < 0.02 rad。
- hidden 30 秒不累積、恢復不跳；pause 60 秒不累積、恢復維持同一姿勢。
- 單幀 9 秒的凍結只推進 1 秒（`MAX_FRAME_DELTA_MS`）。
- `reset()` 後不借用上一段的時間。
- 來源檢查：`Vehicle.tsx`／`World.tsx`／`CameraRig.tsx` 不得再出現 `Math.min(delta …)`，
  且必須匯入 `ActiveTimeline`——避免日後有人改回幀率累加。
- 另附一條「舊寫法在 10 FPS 下會怎樣」的對照：6.2 秒真實時間時舊時鐘只到 3.1 秒。

## 驗證

修正後在同一台軟體算圖的容器上，`e2e/intro-portal.spec.ts` **20 passed / 0 failed**
（修正前 19 passed / 1 failed，失敗的就是 signature phases）。`npm test` 全過、lint、
typecheck、production build 全過。
