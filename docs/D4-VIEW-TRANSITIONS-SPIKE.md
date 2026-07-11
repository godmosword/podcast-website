# D4 View Transitions Spike（故事卡封面 → 詳情）

> 狀態：spike 已接線（2026-07-11）｜擴大前須手動驗收

## 範圍

- **一組**共享元素：`StoryCard` 縮圖 ↔ `/story/[slug]` hero 封面
- 技術：`next.config` `experimental.viewTransition: true` + React `unstable_ViewTransition`
- **不採** `next-view-transitions` 套件
- **未做**（通過 spike 後再議）：全頁 cross-fade、`Link transitionTypes` 方向滑動（需 Next 16+ 型別）

## 接線

| 位置 | 元件 |
|------|------|
| `components/StoryCard.tsx` | `StoryCoverMorph` 包 `StoryImage`（`sharedCoverMorph` 可關） |
| `app/story/[slug]/page.tsx` | 詳情 `coverWrap` 內同 slug 的 `StoryCoverMorph` |
| `lib/story-cover-transition.ts` | `story-cover-${slug}` 命名契約 |
| `app/view-transitions.css` | morph 時長 + `prefers-reduced-motion` 關閉 |

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

- 需 **Next ≥ 15.5.20** 才有 `experimental.viewTransition` schema；執行期 alias 至 `react-experimental`。
- 穩定版 `react` 型別無 `ViewTransition`；見 `types/view-transition.d.ts`。
- `Link transitionTypes`（nav-forward／back）本 spike **未啟用**（15.5.x Link 型別未暴露）。
- 地圖／播放器／遊戲路由未套用。

## 擴大門檻

手動矩陣 1–7 全過 → 可評估：相關故事卡、首頁 segment、全站 back 方向語意。
