# 小橘特快車：操作因果一致與重玩成長（PR-I1–I4，2026-11-03）

## Context

astra 2026-11-03 審查（以 3–7 歲受眾判斷，不是試玩統計）：骨架成立，最弱的是「操作與結果的因果」和「重玩成長感」。以下根因都已在程式碼確認：

| astra 點 | 根因 |
|---|---|
| 1 慢不會維持慢速 | [physics.ts](lib/games/orange-express/physics.ts) 只有每格加速度 `POWER_ACCEL`，沒有每格目標速度；慢（P2）與快（P4）最後都到 `CRUISE_LIMIT 0.82` |
| 1／3 小鴨自動成功 | [events.ts](lib/games/orange-express/events.ts) `leversDo("ducks")` 只看桿位 `power < max`，高速中撥到慢就立刻算做到 |
| 3 賽跑第一幀就贏 | `leversDo("race")` 只看 `power === max`，之後緊急煞停也保留 done |
| 2 教學教出黃區 | [coach.ts](lib/games/orange-express/coach.ts) 預測停點 ≥ `window.start`（黃區起點）就進 brake 拍；[OrangeExpressView.tsx:684](components/games/OrangeExpressView.tsx#L684) 綠或黃都 `learnCoach`；[coach-record.ts](lib/games/orange-express/coach-record.ts) 大司機與小站長共用 `bigLearned` |
| 4 手機前窗糊 | [OrangeExpressWindshield.tsx:148](components/games/OrangeExpressWindshield.tsx#L148) `cssW < 360` 強制 dpr 1 |
| 6 星星集中兩星 | [medals.ts](lib/games/orange-express/medals.ts) 完成＝cleared＋collectedAll＝兩星，第三星要全綠＋無誤 |
| 7 小站長少旅程、大司機誤觸代價重 | [routes.ts](lib/games/orange-express/routes.ts) `captain.journey=false`；`big.earlyDoorCosts=true` |

使用者已拍板（2026-11-03）：小站長**加旅程**；大司機提早按門**改只提醒**；星星**不動、加進步紀錄**；美術**這輪小修、整體統一另開計畫**。

級別：**L2＋UI 風險**（I2–I4 動版面、animation，Opus 設計審不可跳過）。不生圖、不動 Protected path。I3 新增本機存檔欄位（只加欄位、有 normalize，不是遷移）。實作時把本計畫複製到 `docs/plans/2026-11-03-orange-express-causality.md` 隨 PR-I1 進 repo。

## Goal

孩子做的動作，跟畫面上看到的結果一致：撥到慢就看到變慢、聽到「現在拉」照做就停進綠區、賽跑要真的開快才贏。重玩時看得到「這次比上次好一點」和「下次試試什麼」。小站長升級後不會少掉旅程。

## 順序

I1（邏輯，最優先）→ I2（看得見的樂趣）→ I3（進步紀錄）→ I4（小站長旅程）。I4 依賴 I1 的速度判準；I3 與 I2 互不依賴，可對調。

---

## PR-I1 操作因果（邏輯為主）

1. **「慢」有目標速度**（小小司機、大司機；慢慢看與小站長不動）
   - `physics.ts` 加 `SLOW_CRUISE: Partial<Record<CourseId, number>>`（起始 0.45，測試校準）。`motionStep` 在動力是「慢」格（P2）時：速度到上限就斷動力；高於上限用 `SLOW_EASE`（約 0.25/秒，柔和）降下來。**不走 autoBrake**：不響叮叮、不算 `autoBrakeCount`。
   - `predictStop`、`coachBeat` 共用 `motionStep`，預測自動一致。
2. **小鴨看結果，不看桿位**：提示後、降速區起點（`at - DUCK_ZONE.before`）前，「正在慢下來（動力 < 快或有煞車）且速度 ≤ `DUCK_OK`（約 0.5）」才記 done；過了降速區起點還沒做到就記 met。響鈴與小橘開心落在速度表真的掉下來的那一刻。`earlySlows` 照舊由 duckDone 加。
3. **賽跑在終點判**
   - 提示後推到快：只給「追上去！」的前窗字（`eventDoneText` 原本的「快追上了」改成追趕中的字），不蓋章、不響鈴。
   - 到事件點 `at`：速度 ≥ `RACE_WIN`（約 0.65，介於慢 0.45 與快 0.82 之間）記 done，否則 met（友善、不扣星）。
   - [windshield-events.ts](lib/games/orange-express/windshield-events.ts) `raceGap` 終點前的距離跟車速走：比 `RACE_WIN` 快才看得到追近；減少動態維持靜態位置。
4. **教學對準綠區**（`coach.ts`）
   - watch 拍（進站點）念「快到了，準備煞車」（新 `COPY.coachReady`），停車目標條外圈亮。
   - brake 拍：模擬「再過 `COACH_REACT` 秒（約 0.4，測試校準）才拉停」會停在 ≥ 綠區起點（`target - greenHalf`）時才進；現在拉就會超過綠區尾的話直接進（越晚越要立刻拉）。念「現在拉！」（`COPY.coachBrake` 縮短）。
   - 校準條件寫成測試：大司機、小小司機第一站，在 brake 拍後 0／0.4／0.8 秒拉停都停在綠區；小站長（綠區窄）0.3 秒停在綠區。
5. **學會只算綠區、小站長自己一份**
   - `CoachRecord` 加 `bigRuns`、`captainLearned`、`captainRuns`；三組同一規則：停在綠區才學會，最多示範 3 趟。
   - `normalizeOrangeExpressCoach` 相容舊資料：舊 `bigLearned:true` 保留給大司機，小站長再示範一次。
   - `OrangeExpressView.tsx:684` 改看 `run.grades[i] === "green"`。
6. **大司機提早按門只提醒**：`COURSE_RULES.big.earlyDoorCosts = false`；當下提醒保留，`starMissReason` 的 early-door 只剩小站長。

測試（先寫測試、看它紅）：`physics.test`（慢 4 秒穩在 ≤0.46、快到 0.82、從 0.82 撥慢 1.6 秒內 ≤0.5、不加 autoBrakeCount）、`events.test`（撥慢的當下不算、速度到了才算；一直快 → met；賽跑推快後緊急煞 → met；一直快到終點 → done；慢 → met）、`coach.test`（上面的拉桿時機）、`coach-record.test`（黃區不算學會、小站長分開、舊資料正規化）、`medals.test`（大司機早按門不扣）、`novice.test`／`observe.test` 時間重量。

## PR-I2 看得見的樂趣（UI；Opus 設計審）

1. **前窗清晰度**：dpr 改用像素預算，不用寬度門檻：`min(devicePixelRatio, 2, √(預算 ÷ cssW·cssH))`，saveData 仍是 1。用 H4a 的 4 倍 CPU 60fps 量測確認沒掉格。
2. **把空間還給窗外**（[orange-express.module.css](components/games/orange-express.module.css)）：
   - 390×844 大司機：縮儀表周圍留白、拿掉重複的狀態資訊，前窗加高。
   - 375×553 小站長：獨立整理（目前畫布約 110px，還要放停車條與指差鈕），目標前窗 ≥ 160px。
   - 1280×800 桌機：前窗加高，儀表與控制區不再等比放大。
   - 四個尺寸（含 844×390 橫式）前後量測寫成表。
3. **小橘回應放大**：事件做到、平穩停車時，小橘在前窗角落放大回應 1.6 秒（沿用 H4b 的開心時長），不只儀表小徽章；減少動態只換臉。
4. **停車條示範兩個標記**：示範的 watch 拍，在預測點旁加小箭頭與一次滑動示範「會停在這裡」；學會後不再出。
5. **賽跑小狗重畫**：圓潤玩具風，描邊粗細、陰影跟小橘徽章同一套語言（canvas 程式繪，不生圖）。

驗證：小橘特快車視覺基準 `--update-snapshots=all` 重錄並逐張目檢；axe e2e；減少動態；四尺寸版面量測。

## PR-I3 進步紀錄與見聞收藏（UI＋本機存檔；Opus 設計審）

1. **新存檔** `lib/gamekit/progress/orange-express-journal.ts`，照 [dino-sushi-stickers.ts](lib/gamekit/progress/dino-sushi-stickers.ts) 的寫法存在 gameKit settings：每規則組 `{ runs, lastGreens, bestGreens, lastSmooth }`，加上做到過的事件種類、打過招呼的地標（只加不減），附 normalize 與單元測試。
2. **結算**（守既有版面上限，替換不疊加）：星星下面一列三格「停準」圓點（不寫數字）；一句話有進步時優先說進步（「這次多停準一站」）；「再開一次」上方放**一個**下趟小目標，從這趟挑：沒全綠 → 「下次停在綠色」、有站不平穩 → 「下次試試輕輕停」、有事件沒做到 → 該事件的提示。
3. **標題與任務卡**：大司機、小站長標題放見聞收藏列（四種事件章＋三站地標章，還沒拿到的是虛線框）；任務卡帶上次的小目標一句。

## PR-I4 小站長旅程（Opus 設計審）

1. `COURSE_RULES.captain.journey = true`：風景段、沿途事件、任務卡、路線條。
2. **衝突處理**：
   - 紅燈等待時不出賽跑提示：事件提示點延到號誌轉綠之後（`eventPending`／`judgeEvents` 看 `signal`）。
   - 出發號誌與號誌指差題移到 `legStart`（出站處），速限牌、月台指差留在站段；風景段不出指差、不放速限牌，一次只有一件事。
   - 事件強調桿格：小站長五格桿面，「慢」強調 P1–P2、「快」強調 P4；判準是 I1 的速度，跟桿面格數無關。
3. 新手腳本量小站長一趟時間（目標約 3–3.5 分鐘）；小站長視覺基準重錄。

---

## Out of scope（記 TODOS）

- **整體美術統一**：另開計畫，先用 design-shotgun 選一個代表場景的方向；若要生圖屬付費 L3。
- 平交道與揮手玩法區分（例如揮手改成點前窗的朋友）。
- 第二次兒童試玩：在 [second-round.md](docs/qa/orange-express-playtest/second-round.md) 加四題——自己理解慢速了嗎、照提示停得進綠區嗎、最記得哪個事件、結算後會不會自己再開一次。
- iPhone 真機、車內廣播錄音（維持既有 TODOS）。

## Verification

- 單元：`caffeinate -i env NODE_OPTIONS=--no-experimental-webstorage npm test -- lib/games/orange-express lib/gamekit/progress`（Node 25 要關 webstorage）。
- 重現 astra 的兩個量測，寫成測試：一直慢的平台速度、聽到提示後各時機拉停的停車結果。
- e2e：`npm run test:e2e -- --grep 小橘`（3000 被 dev server 佔住時照記憶的換埠作法）。
- 視覺：`caffeinate -i npm run test:visual:trusted -- --grep 小橘特快車 --update-snapshots=all`，重錄後逐張目檢。
- 每個 PR：Codex 工程審（`scripts/agent-review.sh engineering`，diff 放 `.agent-review/`）；I2–I4 加 Opus 設計審。

## Risks／rollback

- 每個 PR 獨立、可單獨 revert。I1 的數字都是常數；從 `SLOW_CRUISE` 拿掉某組，就退回原本的慢。
- 慢有上限會讓一趟變長：用新手腳本重量（目前中位數 95.8 秒），必要時調 `SLOW_CRUISE`，不調段長。
- 教學時機因裝置幀率略有差異：校準測試用 30fps 與 60fps 各跑一次。
