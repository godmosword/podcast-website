# D4 View Transitions Spike（故事卡封面 → 詳情）

> 狀態：已回退至穩定版 fallback（2026-07-17）｜保留 DOM 契約，待 React／Next 穩定 API 再評估

## 範圍

- **一組**共享元素：`StoryCard` 縮圖 ↔ `/story/[slug]` hero 封面
- 原 spike 技術：`next.config` `experimental.viewTransition: true` + React 19.3 canary `ViewTransition`
- 目前實作：React 19.2 stable 的普通容器＋CSS／瀏覽器導覽 fallback；不載入 Canary runtime API。
- **不採** `next-view-transitions` 套件
- **未做**（通過 spike 後再議）：全頁 cross-fade、`Link transitionTypes` 方向滑動（需 Next 16+ 型別）

## 接線

| 位置 | 元件 |
|------|------|
| `components/StoryCard.tsx` | `StoryCoverMorph` 包 `StoryImage`（`sharedCoverMorph` 可關） |
| `app/story/[slug]/page.tsx` | 詳情 `coverWrap` 內同 slug 的 `StoryCoverMorph` |
| `lib/story-cover-transition.ts` | `story-cover-${slug}` 命名契約 |
| `components/story/StoryCoverMorph.tsx` | 穩定 DOM 邊界與 `data-story-cover` 契約 |

## 手動驗收矩陣

在 **Chrome／Edge 131+**（支援 View Transitions）執行：

| # | 情境 | 預期 |
|---|------|------|
| 1 | `/stories` 點任一卡 → 詳情 | 封面由縮圖 morph 至 hero |
| 2 | 詳情「← 回故事屋」或瀏覽器返回 | morph 反向（無方向滑動） |
| 3 | 慢網／快取清掉後點卡 | 允許短暫 blur placeholder；不白屏卡死 |
| 4 | 同頁兩張同 slug 卡（如首頁收藏＋其他區） | 僅一張開 `sharedCoverMorph`；收藏區預設關閉 |
| 5 | Tab 聚焦故事卡 Enter 進詳情 | 轉場後 focus 可見、無陷阱 |
| 6 | `prefers-reduced-motion: reduce` | 瞬間切換、無 morph |
| 7 | Safari／Firefox | 無動畫退化、導覽正常 |

## 已知限制

- 原驗收固定 **Next 16.2.10 + React 19.3 canary**；目前已改用 React 19.2 stable，因穩定版沒有 `ViewTransition` runtime export，移除 Canary 型別補充與實驗設定。
- `Link transitionTypes`（nav-forward／back）本 spike **未啟用**（15.5.x Link 型別未暴露）。
- 地圖／播放器／遊戲路由未套用。

## 擴大門檻

手動矩陣 1–7 全過 → 可評估：相關故事卡、首頁 segment、全站 back 方向語意。

## 自動化補強（2026-07-11）

| 類型 | 位置 | 涵蓋 |
|------|------|------|
| e2e 導覽 | `e2e/view-transition.spec.ts` | 列表→詳情→返回、鍵盤 Enter、reduced-motion 導覽 |
| 手動 morph | 本文件矩陣 #1–#7 | Chrome 目視確認封面 morph；Safari／Firefox 退化 |

執行：

```bash
npm run test:e2e -- e2e/view-transition.spec.ts
```

**歷史驗收紀錄（2026-07-11，Playwright 攔截 `startViewTransition` 為客觀證據；引擎：Chromium／WebKit／Firefox headless）**：

| # | 情境 | 結果 | 備註 |
|---|------|------|------|
| 1 | `/stories` → 詳情 morph | ✅ | startViewTransition 呼叫 1 次；詳情頁 morph 容器就位 |
| 2 | 返回 morph 反向 | ✅ | 「回故事屋」連結觸發 VT（反向 morph）；**瀏覽器返回為即時還原（VT 0 次）**——App Router popstate 預期行為，非缺陷 |
| 3 | 慢網／清快取 | ✅ | 新 context＋CDP slow-3G（400ms/1.6Mbps）：h1 可見、封面完成載入，無白屏卡死 |
| 4 | 同 slug 雙卡 | ✅ | `/` 與 `/stories` 掃描 morph 容器 slug 無重複（FavoritesSection `sharedCoverMorph=false` 生效） |
| 5 | Tab Enter + focus | ✅ | Enter 進詳情後 activeElement 正常、scrollY=0、無 focus 陷阱；e2e 覆蓋導覽 |
| 6 | reduced-motion | ✅ | `reducedMotion:"reduce"` 導覽正常；CSSOM 驗證 view-transition 0s media 規則命中 |
| 7 | Safari／Firefox | ✅ | WebKit：VT 支援且觸發、導覽/返回正常、零 pageerror。Firefox：初測拋 `ReferenceError`（`theme.ts ↔ progress-store.ts` 循環相依 TDZ），抽出 `lib/progress-keys.ts` 修復後零 pageerror、VT 正常 |

限制：#7 為 Playwright WebKit/Firefox 引擎，非 iOS 真機 Safari；真機補測（滑動返回手勢＋morph 目視）留待日常使用觀察。矩陣全過，**可開 `/agent-action` 擴大範圍**（相關故事、首頁 segment 等）。

### 附帶修復（#7 發現）

`lib/theme.ts` 頂層以 `THEME_INIT_SCRIPT` 模板嵌入 `PROGRESS_STORAGE_KEY`，而 `lib/progress-store.ts` 又 import `normalizeThemeMode`，形成循環相依；Firefox 的 chunk 評估順序先進 progress-store，theme 模組初始化時讀到 TDZ 中的 const 而拋錯（Chrome 評估順序相反故未顯現）。修法：key 常數抽到零依賴葉模組 `lib/progress-keys.ts`，theme 與 progress-store 皆改從該處 import（progress-store 保留 re-export 相容既有引用）。
