# Intro / Portal 測試矩陣對照表

對照 [PLAN §15](../../specs/INTRO-PORTAL-PLAN.md) 的 R08–R11（路由與入口，ADR-0003 之後）與 F01–F13（載入與生命周期），共 17 個必測 ID。

- 產生日期：2026-09-07
- 測試檔：[`e2e/intro-portal.spec.ts`](../../../e2e/intro-portal.spec.ts)、[`components/landing/hero-world/active-clock.test.ts`](../../../components/landing/hero-world/active-clock.test.ts)
- 執行環境：本機 macOS 26.6、Chromium（Playwright）、`npm run build` 後 `next start -p 3000`，`--workers=1`
- 結果：自動邀請測試已依 ADR-0003 改寫；以本次實作後的 e2e／單元為準

## 狀態定義

| 標記 | 意義 |
|---|---|
| PASS | 有具名 test 覆蓋該 ID 的全部應有結果，且本次執行通過 |
| PARTIAL | 有 test 覆蓋部分應有結果；未覆蓋的部分逐列寫明 |
| NOT-RUN | 沒有任何自動或人工證據。**空白不算 pass** |

## R08–R11 路由與入口

> [ADR-0003](../../adr/0003-intro-auto-invite.md) 已實作：取消自動邀請。R01–R07 與 R12 的 redirect 部分已刪除。

| ID | 應有結果 | 狀態 | 對應 test／缺口 |
|---|---|---|---|
| R08 | Landing→story→Back／Forward 正常且無重播 | PARTIAL | `Landing to story back and forward stays on content` 驗證 goBack／goForward。**缺**：捲動位置與「無重播」未斷言 |
| R09 | 主動開 `/intro` 可重看且可直接進站 | PASS | `serves a semantic, poster-first intro…` 與 `F11: five Intro↔Landing round trips…` 連續 `goto('/intro')` 都拿到可用場景與可用出口 |
| R10 | JS disabled 時 `/` 有內容與 Intro 連結、`/intro` 有原生 Enter | PASS | `keeps both content and the native intro link usable without JavaScript` |
| R11 | 中鍵／Cmd／Ctrl 點 Enter 走原生新頁語意 | NOT-RUN | `HeroWorld.tsx` 的 `enter()` 有 `metaKey/ctrlKey/shiftKey/altKey/button` 早退，但無 test 覆蓋 |

## F01–F13 載入與生命周期

| ID | 應有結果 | 狀態 | 對應 test／缺口 |
|---|---|---|---|
| F01 | reduced motion：poster、無 3D 請求、立即 Enter | PASS | `reduced motion keeps the poster and makes no GLB request`（spec:84） |
| F02 | Save-Data／slow-2g／2g：poster 且無模型請求 | PASS | `Save-Data keeps the static path available without mounting WebGL`（spec:96）＋`offline and slow connections stay on the poster path`（spec:109） |
| F03 | WebGL 不可用：完整靜態畫面 | PASS | `falls back when WebGL is unavailable`（spec:122） |
| F04 | GLB 404／corrupt／HTML200：回 poster、停止其他工作 | PARTIAL | `falls back for a failed GLB response…`（spec:177）測 404 與重試上限；`rejects an HTML 200 response as a corrupt GLB`（spec:190）測 HTML 200。**缺**：二進位截斷／壞 magic 的 corrupt GLB 未測 |
| F05 | critical load 超 15 秒 active time：timeout fallback，無重試風暴 | PASS | `F05: a stalled model load falls back after 15s of active time without a retry storm`（spec:250）。用可注入時鐘推進 13s → 仍 poster，再推進 3s → fallback，且請求數 <5 |
| F06 | ready 前 Enter：立即離開、abort、不等載入 | PARTIAL | `enters Landing immediately before the scene is ready`（spec:28）驗證立即離開。**缺**：未斷言 in-flight GLB 請求真的被 abort |
| F07 | context lost：回 poster、動畫停、Enter 可用 | NOT-RUN | 需 `WEBGL_lose_context` 或等效注入，目前無 test |
| F08 | runtime 切 reduced motion：卸載 3D，無 exit 動畫 | NOT-RUN | 只測初始 reduced motion（F01），未測執行期 media change |
| F09 | hidden 30 秒再恢復：車位不大跳、不計入 active time | PASS | `F09: 30s hidden does not consume the motion budget and does not jump the car`（spec:272）。hidden 期間推進 30s，phase 不變、恢復後未進入休眠 |
| F10 | pause／resume、24 秒休眠：停止排程，resume 需明確動作 | PASS | `F10: secondary motion sleeps after 24s of active time…`（spec:302）推進 22s 仍在動、再 3s 進休眠、再 10s 不會自己醒、按鈕點擊才恢復。人工 pause／resume 另由 spec:132、spec:157 覆蓋 |
| F11 | 五次 Intro↔Landing：canvas 歸零、無 listener／資源線性累積 | PARTIAL | `F11: five Intro↔Landing round trips…`（spec:323）五次往返，每次離開後 canvas 歸零、visibilitychange listener 淨值 ≤2。**缺**：PLAN 要的 heap 抽查未做（`performance.memory` 只在 Chromium 且受 GC 時機影響，未納入斷言） |
| F12 | poster 失敗：標題／出口仍可用，但視覺測試 fail | NOT-RUN | 無 poster 請求故障注入 test |
| F13 | 離頁後 parse 完成：late 資源立即釋放、無 state update | NOT-RUN | `SceneLoader.ts` 有 abort／dispose 實作，但沒有可控 race 的 test |

## 統計

| 狀態 | R | F | 合計 |
|---|---|---|---|
| PASS | 2 | 6 | **8 / 17**（R 只計 ADR 後的 4 條） |
| PARTIAL | 1 | 3 | **4 / 17** |
| NOT-RUN | 1 | 4 | **5 / 17** |

## 本輪為了關掉 F05／F09／F10 所做的變更

這三個 ID 的判定基準都是 **active time**，而原本 `HeroWorld.tsx` 直接呼叫 `performance.now()` 與 `window.setInterval`，且把 15,000／24,000／250／1000 寫死在 effect 裡，無法在不真的等 15–30 秒的情況下驗證。

新增 [`components/landing/hero-world/active-clock.ts`](../../../components/landing/hero-world/active-clock.ts)：

- 匯出 `LOAD_TIMEOUT_MS`、`SLEEP_AFTER_MS`、`TICK_MS`、`MAX_TICK_DELTA_MS` 四個預算常數，成為 SPEC §8 在程式裡的單一來源。
- 匯出 `ActiveClock` 型別、`systemActiveClock` 與 `getActiveClock()`。後者讀 `globalThis.__chechecarHeroActiveClock`，型別不符就退回系統時鐘；production 程式碼從不寫入該全域。
- `HeroWorld.tsx` 的兩個 active-time 累加器改用 `getActiveClock()` 與上述常數。

Playwright 用 `addInitScript` 安裝假時鐘後即可推進虛擬時間。**注入時鐘不等於假造瀏覽器排程**：900ms 暖身 timer、網路、算繪、React 排程全部維持真實。因此本表把 F05／F09／F10 記為 PASS 是「邏輯預算正確」，不是「真機背景切換已驗證」——真機行為仍屬 PLAN §15 註記的人工項目。

## 執行時的環境注意事項

`fullyParallel: true` 下同時跑 6 個 worker 時，`runs the signature phases once and pauses active time`（spec:157）曾因 CPU 競爭而在 `settle` 階段逾時；`--workers=1` 穩定通過。3D 相關 test 對機器負載敏感，判讀 CI 失敗前先確認是否為併發造成。
