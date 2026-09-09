# ADR-0004：3D Intro 改為首頁同頁覆蓋層

- **狀態**：已決定（2026-09-08）。**部分取代** [ADR-0003](./0003-intro-auto-invite.md)。
- **決策**：`/` 仍然回傳完整 Landing HTML，3D Intro 以**同頁覆蓋層**在首次繪製前出現；按「進入車車遊樂園」後覆蓋層消失，露出底下的 Landing。**沒有導航、沒有 redirect、網址與 canonical 都不變。**
- **保留 ADR-0003 的第 1 條不變**：`/` 永遠回傳完整 Landing HTML、零 client redirect、零 middleware、canonical 仍是 `/`、仍是 CDN 靜態預渲染。
- **取代 ADR-0003 的第 3 條**：Landing 首段的 opt-in SSR 連結（`IntroEntry`）移除。

## 問題

ADR-0003 把「首次訪客自動導向 `/intro`」砍掉，改成 Landing 上一顆 opt-in 膠囊。實機使用後的結論是：Intro 應該是**第一眼看到的東西**，Landing 是下一層。opt-in 膠囊做不到這件事——它只是頁面角落的一個連結。

但 ADR-0003 砍掉自動導向的理由仍然成立，不能單純回退。

## 為什麼這不是「偷偷改回自動導向」

ADR-0003 明文要求：改回自動導向必須寫新 ADR 並附證據。這份 ADR 不是要改回導向——**它消滅了導向本身**。

ADR-0003 的兩項核心反對意見，在同頁覆蓋層下的處境完全不同：

### 反對意見一：閃爍（量測到 23–431 ms 的「看到 Landing 才被抽換」）

那個時間窗的成因是「Landing 先繪製 → client 判斷 → `replace()` 導航」。同頁覆蓋層沒有導航：覆蓋層的存在與否由 `<head>` 裡的同步 inline script 在**首次繪製之前**決定。時間窗是被架構消滅，不是被縮小。

這與專案既有的 `THEME_INIT_SCRIPT`（`lib/theme.ts`）和 `STORIES_VIEW_INIT_SCRIPT`（`lib/stories-view.ts`）是同一個模式，兩者都已在 production 驗證過無閃爍。

### 反對意見二：把「明確表達不要動畫的人」推去看靜態圖

這是 ADR-0003 最有力的證據，也是它否決「方案 B：保留自動邀請＋加前置檢查」的原因。原文的否決理由是：

> 這些檢查全部需要 client 端執行，所以閃爍完全不會消失，只是讓被閃的人少一點。

**這個推理在同頁覆蓋層下不成立。** 因為沒有導航要閃，`prefers-reduced-motion`、`navigator.connection.saveData`、`effectiveType === "2g"`、`NEXT_PUBLIC_HERO_3D === "0"` 這四個檢查全部可以在同一支同步 script 裡跑完，在第一次繪製前決定覆蓋層存不存在。表達了限制偏好的使用者**看到的第一個畫面就是 Landing**，不多一次點擊、不看靜態圖、也不閃爍。

ADR-0003 否決方案 A（cookie + middleware）的三個理由在這裡也全部不適用：不需要 server 端讀 `prefers-reduced-motion`、`/` 不會失去純靜態、不需要新增任何 cookie。

## 決策內容

1. 新增 `lib/intro-gate.ts`：`shouldOpenIntroGate()` 純函式為唯一真相，`INTRO_GATE_INIT_SCRIPT` 掛在 `app/layout.tsx` 的 `<head>`，比照既有兩支 no-flash script。
2. **預設隱藏、script 決定打開**（`html[data-intro-gate="on"]`），不是反過來。見下方「失效方向」。
3. 覆蓋層每個瀏覽分頁出現一次（`sessionStorage`，key `cheche:intro-seen-v1`，新 key 不復用已刪除的 `cheche-intro-visited-v1`）。頻率是一個常數，可切換為每次都出現。
4. 移除 `components/landing/IntroEntry.tsx`。
5. `/intro` 路由**保留**：無 JS 時的唯一入口、可分享的深連結、想重看的人的去處，且維護成本近乎零（已 noindex/follow、已有完整 F01–F13 fallback 覆蓋）。它與覆蓋層共用同一個 `HeroWorld` 元件，不是第二套實作。
6. `/intro` 按進入導向 `/?enter=1` 時要先寫入 gate 標記，且 gate 條件把 `?enter=1` 視為已表達進站意圖，否則使用者會看完 `/intro` 又被覆蓋層蓋一次。

## 失效方向：為什麼是「預設隱藏」

覆蓋層預設可見、script 決定隱藏，也能做到零閃爍。但兩者的失效方向天差地遠：

| | 預設可見＋script 隱藏 | 預設隱藏＋script 打開（選定） |
|---|---|---|
| 無 JS | 覆蓋層永遠關不掉，Landing 被鎖死 | 直接看到 Landing |
| script 丟例外或被擋 | 同上，網站等於壞掉 | 直接看到 Landing |
| 閃爍 | 無 | 無 |

`app/globals.css` 有 `html:has([data-landing-root]) { overflow: hidden }`，會讓「被覆蓋層鎖死」變成真正無法捲動的死頁。這個風險不值得換取任何東西。另加 `<noscript>` 樣式當第二道保險。

## 承擔的代價

- `/` 的初始 HTML 變重（多一組 hero 文案與 poster `<picture>`），初始 JS 也會增加（3D 程式碼原本只在 `/intro` 載入）。必須重新量測並記錄，不能用估的。
- 首次進站多一次點擊。這是這個決策要買的東西，不是副作用。
- 首頁同時有 hero poster 與 landing 第一段圖兩張高優先圖，可能互搶頻寬，需量 LCP。
- Googlebot 會在渲染後看到覆蓋層。判斷是標準 modal 不構成 cloaking（HTML 完整、內容沒有 `display:none`、沒有 UA 判斷），但這是判斷不是已驗證事實，上線後要用 Search Console 即時網址測試複核。**不得**用 `navigator.webdriver` 之類的手法規避——那反而更像 cloaking，也會讓 e2e 測不到真實行為。
- `inert` 的瀏覽器支援是 Safari 15.5+／Chrome 102+／Firefox 112+。更舊的 Safari 會退化成「背景可以 Tab 到」，但 `aria-modal` 與視覺遮蔽仍在。可接受。
- 移除 `IntroEntry` 後站內沒有任何連結指向 `/intro`，它的曝光實質歸零。這是刻意的：覆蓋層已經接手了曝光的工作。

## 這個決策不影響的東西

Landing 的內容、canonical、JSON-LD 與 sitemap；`/intro` 自身的 poster-first 與 F01–F13 fallback 行為；3D 資產管線；ADR-0003 對「不要用 redirect、不要用 middleware、不要為此加 cookie」的結論。
