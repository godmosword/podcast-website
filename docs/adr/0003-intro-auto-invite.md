# ADR-0003：取消首次訪問自動導向 Intro，改為 opt-in 入口

- **狀態**：已決定（2026-09-07）。取代 [INTRO-PORTAL-SPEC](../specs/INTRO-PORTAL-SPEC.md) §4.1／§4.2／§4.4 的自動邀請契約。
- **決策**：**砍掉自動邀請。** `/` 永遠直接是 Landing，零 client redirect；`/intro` 改由 Landing 上一個明確的 SSR 連結進入。
- **本 ADR 的目的是終結反覆討論**：要改回自動導向，必須寫新的 ADR 並附上真機證據，不得在實作中悄悄改掉。

## 問題

SPEC §4.4 自承首次訪客自動 `replace` 到 `/intro` 在慢速裝置上會閃爍。PLAN §15.1 為此定義了 R01–R12 共 12 條必測。問題是：這個代價換得的東西值不值得。

## 證據

### 閃爍是真的，而且可量測

`docs/qa/intro-portal/dynamic-evidence-20260907/`，390×844，每檔 CPU 節流各三次，量 Landing 的 FCP 到 `replace()` 的時間差——也就是使用者**真的看到 Landing 畫面之後**才被抽換掉的時間：

| CPU throttling | 可見 Landing 時間 |
|---|---|
| 1×（無節流） | 23–28 ms |
| 4× | 148–163 ms |
| 6× | 241–245 ms |
| 10× | 410–431 ms |

與 CPU 速度近似線性。節流倍率不對應特定機型，只呈現趨勢。

### 決定性的一點：被推走的人裡，有一整群根本看不到 3D

`shouldInviteToIntro()` 的條件是 pathname、`enter=1`、hash、session、history restore、online——**完全沒有檢查 reduced motion、Save-Data、慢速連線或 WebGL 可用性**。SPEC §4.2 列的條件本身就有這個洞，實作忠實照做。

實測（2026-09-07，production build）：

| 情境 | 自動導向結果 | `/intro` 上實際看到 |
|---|---|---|
| `prefers-reduced-motion: reduce` | → `/intro` | poster（靜態圖） |
| `Save-Data: on` | → `/intro` | poster（靜態圖） |
| `effectiveType: 2g` | → `/intro` | poster（靜態圖） |
| WebGL 不可用 | → `/intro` | fallback（靜態圖） |

也就是說：**我們把明確表達「我不要動畫」「我不要花流量」的使用者，從內容網站推到一張靜態圖加兩個連結的頁面。** 這不是入口體驗，這是多一次點擊。SPEC §0.1 寫的「3D 的成功、下載速度與動畫進度不得成為使用網站的條件」，在自動邀請這條路徑上被違反。

### 測試代價

R01–R12 在投入實作後的實際狀態（見 [route-matrix.md](../qa/intro-portal/route-matrix.md)）：2 PASS、7 PARTIAL、3 NOT-RUN。剩下的缺口——外部 origin 的 Back 行為、BFCache 還原、hash、四種深連結、storage setter throw——每一條都只因為「`/` 會自己跳走」才存在。

## 決策內容

1. `/` 永遠回傳 Landing 並停在 Landing。移除 `components/intro/IntroVisit.tsx`、`INTRO_VISIT_KEY`、`app/layout.tsx` 的掛載點與對應測試。sessionStorage 不再需要。
2. `/intro` 維持現狀：poster-first、SSR 標題與文案、「進入車車遊樂園」與「略過動畫」都指向 `/?enter=1`、noindex／follow。
3. Landing 增加一個明確的 SSR 連結到 `/intro`（文案與位置由 Phase 8 美術定稿決定，但必須是真連結，不是只有 JS 才能用的按鈕）。
4. `/?enter=1` 保留為 Intro 的出口，canonical 仍是 `/`。舊連結不會壞。
5. SPEC §4.1 路由表刪除「符合首次邀請條件才 replace `/intro`」一列；§4.2 整節作廢；§4.4 的閃爍缺陷連同成因一起移除。
6. PLAN §15.1 從 12 條縮到 4 條：R08（Back／Forward 一般導覽）、R09（主動開 `/intro`）、R10（JS disabled）、R11（修飾鍵點 Enter）。R01–R07 與 R12 的 redirect 部分刪除，不是標成 skip。

## 被否決的替代方案

**A. 保留自動邀請，改用 cookie + middleware 做 server redirect（零閃爍）。**
否決。三個理由：`prefers-reduced-motion` 無法在 server 端可靠取得（`Sec-CH-Prefers-Reduced-Motion` 需要 client hint 協商且支援不全），所以「把不要動畫的人推走」這個核心問題原封不動；`/` 會從純靜態 CDN 回應變成每次都要過 middleware；兒童向網站要為一個裝飾性入口新增 cookie，隱私成本不划算。

**B. 保留自動邀請，但加上 reduced motion／Save-Data／2G／WebGL 前置檢查。**
否決。這些檢查全部需要 client 端執行，所以閃爍完全不會消失，只是讓被閃的人少一點。12 條 R 測試一條都不會減少，反而要再加四種組合。付出全部代價，只修掉一半問題。

**C. 維持現狀。**
否決。理由見上方證據。

## 承擔的風險

Intro 的曝光會大幅下降——沒有人被迫看到它。這是本決策**刻意付出**的代價：品牌時刻的價值不足以正當化在 canonical 首頁上的強制轉場，尤其當它同時打到明確表達限制偏好的使用者。

緩解：入口放在 Landing 首屏可見處，用 `poster.webp` 當視覺誘因，讓它看起來值得點。若日後有數據顯示 opt-in 入口的點擊率低到 Intro 失去意義，那是「要不要留 Intro」的問題，不是「要不要自動導向」的問題。

## 這個決策不影響的東西

Intro 的美術、3D 資產管線、Phase 8 之後的視覺定稿、`/intro` 自身的可及性與 fallback 行為（F01–F13 全部保留），以及 Landing 的既有內容與 SEO。
