# Phase 11：可及性與靜態體驗（2026-09-08）

## 環境

| 項目 | 值 |
|---|---|
| Build | `next build` production，BUILD_ID 見 `../phase10-20260908/performance.json` |
| 瀏覽器 | Chromium 141.0.7390.37（Playwright，headless，**軟體算圖**） |
| OS | Linux 6.18.44-fc-v24（容器） |
| 測試檔 | `e2e/intro-portal.spec.ts`（Phase 11 三個 describe）、`components/landing/hero-world/enter-transition.test.ts` |
| 執行 | `next start` ＋ `playwright test --workers=1` |

沒有 macOS／iOS，因此 **VoiceOver 與實體 Safari 一律標 NOT-RUN**，不以 axe 或 Chromium 代替。

## 結果

| 項目 | 狀態 | 依據 |
|---|---|---|
| 語意結構：單一 h1、真正的 `<main>`、canvas 不進可及性樹 | PASS | `semantic structure: one h1, a real main, decorative canvas hidden`（`[data-hero-stage]` 為 `aria-hidden="true"`、section 以 `aria-labelledby` 指向 h1） |
| Enter／Skip 是真正的 `<a href>` | PASS | `controls are native elements, not div soup`（`tagName === "A"`、`href="/?enter=1"`） |
| Pause／Resume 是真正的 `<button type="button">` | PASS | 同上 |
| 可見 focus ring | PASS | `every control is focusable, visibly focused and at least 44x44`：用 **鍵盤 Tab** 取得 focus 後讀 computed style（`:focus-visible` 無法用 `getComputedStyle` 查詢，滑鼠 focus 也不會畫 ring），三個控制項的 outline 皆 ≥2px 且非 `none` |
| ≥44×44 觸控目標 | PASS | 同上，量 bounding box |
| 鍵盤操作與 Tab 順序 | PASS | `keyboard only: tab order follows reading order and Enter/Space activate`：順序為 進入 → 暫停 → 略過；Space 切換暫停鈕；鍵盤 Enter 觸發連結並導航一次 |
| focus handoff（進站後落在 main、不捲動） | PASS | Phase 9 的 `focus lands on main after an enhanced entry, without scrolling` |
| Back／Forward 不搶 focus | PASS | Phase 9 的 `Back after entering…`、`a plain Landing visit is never focus-grabbed` |
| 200% 頁面縮放、200% 文字縮放 | PASS | `stays usable at 200% page zoom and 200% text zoom`：640×400（＝1280×800 @200%）與 390×844 且 root font-size 32px 下，兩個出口仍可見、無水平捲動、Enter 仍可用 |
| axe（wcag2a/2aa/21a/21aa） | PASS | `axe finds no serious violation on the intro or on Landing after entering`：/intro 與進站後的 Landing 都沒有 serious／critical violation |
| 無自動播放音訊 | PASS | `no audio is created or played by the intro`：頁面沒有 `<audio>`／`<video>`，且 `AudioContext` 與 `HTMLMediaElement.play` 都沒有被呼叫 |
| VoiceOver／實體 Safari 手動驗證 | **NOT-RUN** | 沒有 macOS／iOS 裝置；Phase 12 必做 |
| 螢幕閱讀器實際朗讀順序 | **NOT-RUN** | 同上（axe 不能代替手測） |

## reduced motion

| 項目 | 狀態 | 依據 |
|---|---|---|
| 不 mount canvas | PASS | `reduced motion loads no 3D at all and still enters instantly` |
| 不下載 GLB | PASS | 同上（模型請求陣列為空） |
| 不載入 3D runtime chunk | PASS | 同上（腳本請求中沒有 three／react-three 的 chunk） |
| 不顯示 Pause 控制 | PASS | 同上（沒有動態就沒有可暫停的東西） |
| 不做 CTA pulse／camera push／exit animation | PASS | `resolveEnterAction` 對 reduced motion 回 `direct`（單元測試），CSS 也在 `prefers-reduced-motion` 下把 `transform`／`transition` 關掉 |
| Enter 立即可用 | PASS | 同一個測試點擊後直接落在 `/` |
| runtime 由 no-preference → reduce | PASS | `switching to reduced motion at runtime unloads the live scene`：canvas 歸零、Pause 控制消失、1.5 秒內 rAF 增量 <10（等於不再排程動畫）、無 pageerror |

## Failure paths

| ID | 情境 | 狀態 | 依據 |
|---|---|---|---|
| F01 | 初始 reduced motion | PASS | Phase 5 既有測試 ＋ 上表 |
| F02 | Save-Data／2G／offline | PASS | Phase 5 既有測試 |
| F03 | WebGL 不可用 | PASS | Phase 5 既有測試 |
| F04 | GLB 404／HTML 200／**二進位截斷** | PASS | 既有兩個測試 ＋ 新增 `F04: a truncated GLB binary is rejected like any other corrupt model` |
| F05 | 15 秒 active-time 逾時 | PASS | 既有（注入時鐘） |
| F06 | ready 前 Enter | PASS | Phase 9 的 `Enter during poster…`、`Enter during loading…` |
| F07 | **context lost** | PASS | 新增 `F07: a lost WebGL context falls back to the poster with a usable exit`（`WEBGL_lose_context`，回 fallback、canvas 歸零、出口可用、無 pageerror） |
| F08 | **runtime 切 reduced motion** | PASS | 新增（見上） |
| F09 | hidden 30 秒 | PASS | 既有（注入時鐘） |
| F10 | pause／resume、24 秒休眠 | PASS | 既有（注入時鐘） |
| F11 | 五次往返無累積 | PASS | 既有 ＋ Phase 10 的 5 次往返量測 |
| F12 | **poster 失敗** | PASS（產品行為） | 新增 `F12: a failed poster still leaves the heading and both exits usable`。註：PLAN 要求「視覺測試 fail」——視覺退化本來就會發生，這裡只保證出口不會壞 |
| F13 | **離頁後才完成的 parse** | PASS | 新增 `F13: a model that arrives after the route change is disposed, not applied`（延後放行模型回應，離頁後才到；canvas 歸零、無 pageerror） |

## 這一輪修過的測試

`runs the signature phases once and pauses active time` 原本逐一 poll 每個 phase。時間軸改成真實時間之後，`stop`（80ms）與 `settle`（320ms）在慢算圖上可能整段落在兩幀之間，poll 不到。改成在頁面內用 `MutationObserver` 記錄每一次屬性變化，然後斷言**順序**：起點是 `approach`、必定經過 `acknowledge`、phase 只能前進不能倒退、`data-greeting` 只會 true 一次。這比原本更嚴格（多了「不倒退、不重播」），而不是放寬。

## 尚需 Phase 12 確認

- VoiceOver（macOS／iOS）與實體 Safari 的朗讀順序、focus 行為、觸控目標。
- Android TalkBack。
- 真機上的 200% 系統字級（iOS Dynamic Type）與橫向短螢幕。
