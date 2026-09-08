# Phase 9：Intro → Landing 進站轉場（2026-09-08）

## 修正前的狀態

`HeroWorld.tsx` 的 `enter()` 是「**先播 360ms，再導航**」：

```ts
setEntering(true);
exitTimer.current = setTimeout(() => router.replace("/?enter=1"), 360);
```

這違反 SPEC §5.3「不以動畫延後導航請求」——導航被動畫擋住，而且慢裝置上還要再加上
路由切換本身的時間。另外，ADR-0003 拿掉 `IntroVisit` 時，連帶失去了 PLAN §9 要求的
「進站後把 focus 交給 Landing 的 main」。

## 實作

### 1. 決策集中成純函式

`components/landing/hero-world/enter-transition.ts` 的 `resolveEnterAction()`：

| 情境 | 回傳 | 行為 |
|---|---|---|
| 修飾鍵（Cmd／Ctrl／Shift／Alt）、中鍵、非主鍵 | `native` | 完全不攔截，`<a href="/?enter=1">` 原生語意（新分頁／新視窗／複製連結） |
| 已經在導航（雙擊、鍵盤重複） | `ignore` | 吃掉這次觸發，不產生第二次導航 |
| live 場景（ready 且 eligible 且未失敗且非 reduced motion） | `transition` | 立刻導航 ＋ ≤360ms 的淡出與推近 |
| poster／載入中／fallback／ineligible／reduced motion | `direct` | 立刻導航，完全沒有動畫，也不等 WebGL |

`transition` 與 `direct` 都是**先呼叫 `router.replace("/")`**：動畫是同時發生的裝飾，
不是導航的前置條件。轉場沒能完成時（route chunk 失敗）1.5 秒後解除 `data-entering`
並把原生連結還給使用者，不會有人卡在不透明的覆蓋層底下。

### 2. 推近改由合成器做，按下就停止算繪

原本的推近是 `CameraRig` 每幀改 `camera.zoom`，代表轉場期間 WebGL 還在跟路由切換搶主執行緒。
實測（本容器軟體算圖，1440×900，點擊到 `location.pathname === "/"`）：

| 版本 | live 場景 | poster |
|---|---|---|
| 修正前（動畫先播 360ms 再導航） | — | — |
| 立刻導航，但場景繼續算繪 | 1,031／1,048／1,311 ms | 87／95／62 ms |
| 立刻導航，先停算繪 360ms 後才停 | 1,338／1,049／1,292 ms | 80／66／68 ms |
| **定案：立刻導航 ＋ 立刻停算繪 ＋ CSS 推近** | **313／291／299 ms** | **86／81／70 ms** |

（對照組：先手動按「暫停動態」再點進入 → 90／74 ms，證明瓶頸就是算繪。）

所以推近改成 `.hero[data-entering="true"] .canvas/.poster { transform: scale(1.065) }`，
時長吃同一個 `--exit-transition-ms`（＝`EXIT_TRANSITION_MS = 360`）。淡出本來就是 CSS。
`CameraRig` 不再處理 entering，`HeroScene` 也不再收這個 prop。reduced motion 下
transform 與 transition 都關掉。

### 3. focus 交接

進站意圖是一個**分頁內的模組變數**（`markEnterIntent()` / `consumeEnterIntent()`），
不使用 storage——ADR-0003 之後 Intro 不再碰 sessionStorage，而 enhanced navigation 是
同一個 document 的 client 轉場，模組變數就夠，也保證「直接打開 `/`」不會被誤判。

`components/landing/LandingEntryFocus.tsx` 依 `shouldFocusLandingMain()` 決定：

- 從 Intro 進來（意圖）→ focus `#main-content`
- 無 JS／深連結的 `?enter=1` → focus
- `back_forward` 還原 → **不** focus
- 直接開 `/` → **不** focus
- 每個 document 最多一次

`focus({ preventScroll: true })`，Landing 的捲動容器不會被拉走。

### 4. URL

兩個連結的 href 都維持 `/?enter=1`（無 JS 與深連結的語意入口，canonical 仍是 `/`），
但 JS 可用時一律由 router 送到乾淨的 `/`。`/` 本身不做任何 redirect，所以沒有 loop。

## 變更檔案

| 檔案 | 內容 |
|---|---|
| `components/landing/hero-world/enter-transition.ts` | 新增：`resolveEnterAction`、進站意圖、`shouldFocusLandingMain`、`EXIT_TRANSITION_MS` |
| `components/landing/hero-world/HeroWorld.tsx` | 立刻導航、單次導航守衛、按下即停算繪、`--exit-transition-ms`、Skip 也走同一條 |
| `components/landing/hero-world/HeroWorld.module.css` | CSS 推近、淡出時長改吃 custom property、reduced motion 關掉 |
| `components/landing/hero-world/CameraRig.tsx` | 移除 entering 推近（改由 CSS） |
| `components/landing/hero-world/HeroScene.tsx` | 不再傳 `entering` |
| `components/landing/LandingEntryFocus.tsx` | 新增：進站 focus 交接 |
| `components/landing/LandingHub.tsx` | 掛載 `LandingEntryFocus` |
| `components/landing/hero-world/enter-transition.test.ts` | 新增 25 個契約測試 |
| `e2e/intro-portal.spec.ts` | 新增 Phase 9 的 11 個 E2E；既有斷言由 `/?enter=1` 改為 `/` |

## 測試

| 項目 | 結果 |
|---|---|
| `npm test` | **1,863 passed**（290 檔；其中 `enter-transition.test.ts` 25 個） |
| `npm run lint` | pass（0 warnings） |
| `npm run typecheck` | pass |
| production build | pass |
| `e2e/intro-portal.spec.ts` ＋ `public-smoke` ＋ `public-a11y` | **48 passed / 0 failed**（`--workers=1`） |

Phase 9 的 11 個 E2E：poster／loading／fallback／reduced motion／greeting／paused 各自的
Enter、雙擊只導航一次且 history 不增長、中鍵維持原生語意、進站後 focus 落在 main 且不捲動、
直接開 `/` 不被搶焦點、Back／Forward 正確且不搶焦點、離開後 canvas／模型請求／
visibilitychange listener 歸零且無 pageerror（涵蓋晚到的 GLB 解析）。

## Phase 9 退出條件對照

| 退出條件 | 狀態 | 依據 |
|---|---|---|
| poster、loading、greeting、paused、fallback 五種時刻都可 Enter | PASS | 五個 E2E ＋ 25 個單元契約 |
| 慢 CPU 不死鎖 | PASS | 本容器是軟體算圖（約 5 FPS），live 場景點擊到換頁 ~300ms |
| hidden 不死鎖 | PASS | hidden 時 `active=false`，Enter 仍是純 DOM 事件；F09 覆蓋 active-time |
| 雙點擊不死鎖 | PASS | `ignore` 契約 ＋ E2E（history 不增長） |
| 退出後沒有殘留 canvas | PASS | E2E 斷言 canvas 歸零、無模型重抓、listener 歸零、無 pageerror |
| 動畫不延後導航 | PASS | 上表量測；導航是 handler 內第一件事 |
| 原生連結語意 | PASS | 修飾鍵（R11）、中鍵、無 JS（R10）三種 E2E |
| 進站後 focus 到 main | PASS | E2E ＋ 契約測試 |

## 已知限制

- 效能數字來自軟體算圖的容器，只能用來比較「有沒有被算繪擋住」，不是真機成績。
- 沒有實體 iPhone／Android，未做真機 Safari 的轉場與 focus 驗證（屬 Phase 12）。
- 轉場在本機幾乎看不完整（路由太快就緒就提早結束），這是 SPEC §5.3 允許的行為，
  但也代表「360ms 淡出的觀感」尚未在真機上做過視覺確認。
