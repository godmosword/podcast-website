# Intro / Portal 測試矩陣對照表

對照 [PLAN §15](../../specs/INTRO-PORTAL-PLAN.md) 的 R01–R12（路由與入口）與 F01–F13（載入與生命周期），共 25 個必測 ID。

- 產生日期：2026-09-07；2026-09-08 依 ADR-0003 實作與 v3 乾淨重建更新
- 測試檔：[`e2e/intro-portal.spec.ts`](../../../e2e/intro-portal.spec.ts)（20 個 test）、[`components/landing/hero-world/active-clock.test.ts`](../../../components/landing/hero-world/active-clock.test.ts)（`IntroVisit.test.ts` 已隨自動邀請一起刪除）
- 執行環境（2026-09-08）：Claude Code 遠端容器 Linux、Chromium（Playwright 1.60，**軟體算圖**）、`npm run build` 後 `next start -p 3000`，`--workers=1`
- 結果：**20 passed / 0 failed**。驗收當下 `runs the signature phases once and pauses active time` 曾在軟體算圖下失敗，追查為既有缺陷（動畫以 `Math.min(delta, .05)` 累加 render delta，低幀率把時間軸拉長），已於 2026-09-08 修正並補回歸測試，見 [`v3-clean-rebuild-20260908/frame-rate-timeline.md`](./v3-clean-rebuild-20260908/frame-rate-timeline.md)

## 狀態定義

| 標記 | 意義 |
|---|---|
| PASS | 有具名 test 覆蓋該 ID 的全部應有結果，且本次執行通過 |
| PARTIAL | 有 test 覆蓋部分應有結果；未覆蓋的部分逐列寫明 |
| NOT-RUN | 沒有任何自動或人工證據。**空白不算 pass** |

## R01–R12 路由與入口

> [ADR-0003](../../adr/0003-intro-auto-invite.md) 取消自動邀請，**已於 2026-09-08 實作**：
> `/` 永遠停在 Landing，`components/intro/IntroVisit.tsx` 與 session key 已刪除，
> Intro 改由 Landing 首段的 SSR 連結（`components/landing/IntroEntry.tsx`）進入。
> R01–R07 與 R12 隨自動導向一起消滅——它們描述的行為已不存在，不是未測。
> 現行必測只剩四條：

| ID | 應有結果 | 狀態 | 對應 test |
|---|---|---|---|
| R08 | Back／Forward 在 Landing↔Intro 間正常往返，無 redirect 迴圈 | PASS | `R08: Back and Forward move between Landing and Intro without a redirect loop` |
| R09 | 新訪客停在 Landing，首段有 SSR `/intro` 連結可點進 Intro | PASS | `R09: a fresh visit stays on Landing and offers an SSR link into the intro`（另檢查 server HTML 內含 `href="/intro"`） |
| R10 | JS disabled：Landing 內容與兩個 Intro 連結都可用 | PASS | `R10: keeps both content and the native intro links usable without JavaScript` |
| R11 | 修飾鍵點 Enter 保留原生連結語意 | PASS | `R11: a modifier click on Enter keeps native link semantics` |
| － | `/`、深連結、`/?enter=1` 都不下載 GLB，且 canonical 仍是 `/` | PASS | `deep links and Landing never download the hero models` |

<details>
<summary>2026-09-07 自動導向時期的 R01–R12 實測（歷史紀錄，行為已移除）</summary>

| ID | 應有結果 | 狀態 | 對應 test／缺口 |
|---|---|---|---|
| R01 | 新 session 開裸首頁邀請一次到 Intro，Enter 立即存在 | PARTIAL | `invites a fresh bare home visit once, while direct and deep links bypass`（spec:35）驗證 `/` → `/intro` 一次。Enter 立即可用由 `serves a semantic, poster-first intro without the Landing chrome`（spec:7）驗證。**缺**：PLAN 要求的錄影未產出（見第 5 項） |
| R02 | 已訪問 session 開首頁，Landing 直接顯示且無 3D 下載 | PARTIAL | spec:35 驗證第二次開 `/` 停在 Landing。**缺**：沒有斷言此時 `/` 沒有 GLB 請求（network 斷言只在 `/intro` 測試裡做） |
| R03 | 新 session 開 `/?enter=1` 留 Landing，canonical 為 `/` | PARTIAL | spec:35 驗證停在 Landing。**缺**：未斷言 `/?enter=1` 的 canonical 是 `/` |
| R04 | 新 session 開首頁 hash，留目標段不跳 Intro | NOT-RUN | 無 test。`IntroVisit` 有 hash 判定邏輯但只有單元層 |
| R05 | 新 session 開 story／game／兩種 map，直接內容且回首頁不攔截 | PARTIAL | spec:35 只涵蓋 `/stories`。**缺**：`/games/*`、`/adventures`、`/for-parents/play-map` 三種深連結未參數化測試 |
| R06 | storage get／set throw 時首頁留內容、Intro Enter 仍可用 | PARTIAL | `fails open when session storage is blocked`（spec:53）只注入 getter throw。**缺**：setter throw 未測；未接著驗證 `/intro` 的 Enter |
| R07 | 外部頁→首頁→Intro→Enter→Back 回到外部頁，無 Intro loop | NOT-RUN | spec:35 的 Back 只在同站 `/stories` ↔ `/?enter=1`，起點不是外部 origin |
| R08 | Landing→story→Back／Forward 正常且無重播 | PARTIAL | spec:35 驗證 goBack。**缺**：goForward 未測；捲動位置與「無重播」未斷言 |
| R09 | 已訪問時主動開 `/intro` 可重看且可直接進站 | PASS | `F11: five Intro↔Landing round trips…`（spec:323）在 session 已標記後連續五次 `goto('/intro')` 都拿到可用場景與可用出口 |
| R10 | JS disabled 時 `/` 有內容、`/intro` 有原生 Enter | PASS | `keeps both content and the native intro link usable without JavaScript`（spec:67） |
| R11 | 中鍵／Cmd／Ctrl 點 Enter 走原生新頁語意 | NOT-RUN | `HeroWorld.tsx` 的 `enter()` 有 `metaKey/ctrlKey/shiftKey/altKey/button` 早退，但無 test 覆蓋 |
| R12 | BFCache 還原、offline、StrictMode 不重導／重播／雙 canvas | PARTIAL | offline 由 `offline and slow connections stay on the poster path`（spec:109）覆蓋。**缺**：BFCache（`pageshow.persisted`）還原與 React StrictMode 雙掛載未測 |

</details>

## Phase 9 進站轉場（2026-09-08 新增）

`e2e/intro-portal.spec.ts` 的 `Phase 9 enter transition and navigation lifecycle`，
共 11 個 test，全部 PASS：

| 檢查 | test |
|---|---|
| poster 時 Enter：立刻離開且完全沒下載模型 | `Enter during poster leaves immediately without loading WebGL` |
| loading 時 Enter：不等模型，晚到的解析不丟錯 | `Enter during loading does not wait for the model to finish` |
| fallback 時 Enter | `Enter during fallback leaves immediately` |
| reduced motion Enter：直接進站、無轉場 | `reduced motion Enter goes straight to Landing with no transition overlay` |
| greeting 中 Enter、暫停中 Enter | `Enter during the greeting, and again while paused, both leave at once` |
| 雙擊只導航一次、history 不增長 | `a double click lands once and leaves a single history entry` |
| 中鍵維持原生語意 | `middle click keeps native link semantics` |
| 進站後 focus 落在 `#main-content` 且不捲動 | `focus lands on main after an enhanced entry, without scrolling` |
| 直接開 `/` 不被搶焦點 | `a plain Landing visit is never focus-grabbed` |
| Back 回到 Intro 之前的頁面、Forward 回 Landing 且不搶焦點 | `Back after entering returns to the page before the intro, then Forward returns to Landing` |
| 離開後 canvas／模型請求／listener 歸零且無例外 | `the route change disposes the canvas, the model requests and the listeners` |

修飾鍵（Shift）另由 R11 覆蓋。單元層的契約測試在
`components/landing/hero-world/enter-transition.test.ts`（25 個）。

## F01–F13 載入與生命周期

| ID | 應有結果 | 狀態 | 對應 test／缺口 |
|---|---|---|---|
| F01 | reduced motion：poster、無 3D 請求、立即 Enter | PASS | `reduced motion keeps the poster and makes no GLB request`（spec:84） |
| F02 | Save-Data／slow-2g／2g：poster 且無模型請求 | PASS | `Save-Data keeps the static path available without mounting WebGL`（spec:96）＋`offline and slow connections stay on the poster path`（spec:109） |
| F03 | WebGL 不可用：完整靜態畫面 | PASS | `falls back when WebGL is unavailable`（spec:122） |
| F04 | GLB 404／corrupt／HTML200：回 poster、停止其他工作 | PASS | 404 與重試上限、HTML 200，2026-09-08 補上 `F04: a truncated GLB binary is rejected like any other corrupt model`（magic 正確但內容截斷） |
| F05 | critical load 超 15 秒 active time：timeout fallback，無重試風暴 | PASS | `F05: a stalled model load falls back after 15s of active time without a retry storm`（spec:250）。用可注入時鐘推進 13s → 仍 poster，再推進 3s → fallback，且請求數 <5 |
| F06 | ready 前 Enter：立即離開、abort、不等載入 | PASS | Phase 9 的 `Enter during poster leaves immediately without loading WebGL`（連請求都沒發出）與 `Enter during loading does not wait for the model to finish`（請求永不完成仍立刻離開，且之後無 pageerror） |
| F07 | context lost：回 poster、動畫停、Enter 可用 | PASS | 2026-09-08 新增 `F07: a lost WebGL context falls back to the poster with a usable exit`（`WEBGL_lose_context`；fallback、canvas 歸零、出口可用、無 pageerror） |
| F08 | runtime 切 reduced motion：卸載 3D，無 exit 動畫 | PASS | 2026-09-08 新增 `switching to reduced motion at runtime unloads the live scene`（canvas 歸零、Pause 消失、1.5 秒內 rAF 增量 <10、無 pageerror） |
| F09 | hidden 30 秒再恢復：車位不大跳、不計入 active time | PASS | `F09: 30s hidden does not consume the motion budget and does not jump the car`（spec:272）。hidden 期間推進 30s，phase 不變、恢復後未進入休眠 |
| F10 | pause／resume、24 秒休眠：停止排程，resume 需明確動作 | PASS | `F10: secondary motion sleeps after 24s of active time…`（spec:302）推進 22s 仍在動、再 3s 進休眠、再 10s 不會自己醒、按鈕點擊才恢復。人工 pause／resume 另由 spec:132、spec:157 覆蓋 |
| F11 | 五次 Intro↔Landing：canvas 歸零、無 listener／資源線性累積 | PASS | `F11: five Intro↔Landing round trips…` ＋ Phase 10 的五次往返量測（canvas、WebGL context、listener、GLB 請求都不成長；heap 11.5–19.1 MB 震盪不單調成長，僅作趨勢） |
| F12 | poster 失敗：標題／出口仍可用，但視覺測試 fail | PASS | 2026-09-08 新增 `F12: a failed poster still leaves the heading and both exits usable`（poster 404）。視覺退化本來就會發生，測的是出口不壞 |
| F13 | 離頁後 parse 完成：late 資源立即釋放、無 state update | PASS | 2026-09-08 新增 `F13: a model that arrives after the route change is disposed, not applied`（扣住模型回應直到離頁後才放行；canvas 歸零、無 pageerror） |

## 統計

現行必測 17 項（R08–R11 + 額外一條迴歸 + F01–F13；R01–R07／R12 已隨自動導向刪除）。
2026-09-08 的 Phase 11 補上 F04 的二進位截斷、F07、F08、F12、F13，並把 F06、F11 補完：

| 狀態 | R（含迴歸） | F | 合計 |
|---|---|---|---|
| PASS | 5 | 13 | **18 / 17→18** |
| PARTIAL | 0 | 0 | 0 |
| NOT-RUN | 0 | 0 | 0 |

（合計 18 是因為 Phase 9 另加了一條「Landing 與深連結不下載 GLB」的迴歸。）
螢幕閱讀器與實體 Safari 仍是 NOT-RUN，列在 [`phase11-20260908/report.md`](./phase11-20260908/report.md)，
不計入這張以自動化測試為範圍的表。

2026-09-08 另加 Phase 12 的**模擬**版面覆蓋（`Phase 12 cross-viewport layout (emulated)`：
320／360／390／430／短橫向／平板各一，加一條旋轉），同樣不能代替真機——真機矩陣見
[`phase12-20260908/device-matrix.md`](./phase12-20260908/device-matrix.md)。

## 本輪為了關掉 F05／F09／F10 所做的變更

這三個 ID 的判定基準都是 **active time**，而原本 `HeroWorld.tsx` 直接呼叫 `performance.now()` 與 `window.setInterval`，且把 15,000／24,000／250／1000 寫死在 effect 裡，無法在不真的等 15–30 秒的情況下驗證。

新增 [`components/landing/hero-world/active-clock.ts`](../../../components/landing/hero-world/active-clock.ts)：

- 匯出 `LOAD_TIMEOUT_MS`、`SLEEP_AFTER_MS`、`TICK_MS`、`MAX_TICK_DELTA_MS` 四個預算常數，成為 SPEC §8 在程式裡的單一來源。
- 匯出 `ActiveClock` 型別、`systemActiveClock` 與 `getActiveClock()`。後者讀 `globalThis.__chechecarHeroActiveClock`，型別不符就退回系統時鐘；production 程式碼從不寫入該全域。
- `HeroWorld.tsx` 的兩個 active-time 累加器改用 `getActiveClock()` 與上述常數。

Playwright 用 `addInitScript` 安裝假時鐘後即可推進虛擬時間。**注入時鐘不等於假造瀏覽器排程**：900ms 暖身 timer、網路、算繪、React 排程全部維持真實。因此本表把 F05／F09／F10 記為 PASS 是「邏輯預算正確」，不是「真機背景切換已驗證」——真機行為仍屬 PLAN §15 註記的人工項目。

## 執行時的環境注意事項

`fullyParallel: true` 下同時跑 6 個 worker 時，`runs the signature phases once and pauses active time`（spec:157）曾因 CPU 競爭而在 `settle` 階段逾時；`--workers=1` 穩定通過。3D 相關 test 對機器負載敏感，判讀 CI 失敗前先確認是否為併發造成。
