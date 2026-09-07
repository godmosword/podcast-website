# Intro Portal Phase 1 基線

日期：2026-09-06  
基準 commit：`f6ea724 refactor(agent): adopt risk-based routing and trim context`  
分支：`main`  
狀態：dirty tree；本文件是實作前的可追溯基線，不是產品驗收報告。

## 範圍與限制

本輪依 `docs/specs/INTRO-PORTAL-PLAN.md` 執行 Phase 1、4、5。Phase 1 只記錄當時工作樹與受影響系統；沒有清除、重置或覆蓋既存未提交檔案。Blender `.blend`、`build.py` 與既有模型來源列為輸入資產，本輪不修改其美術內容。

## Dirty tree

基準時已有 tracked 修改：

- `app/layout.tsx`
- `components/landing/SiteNavBar.tsx`
- `e2e/public-smoke.spec.ts`
- `package.json`
- `package-lock.json`

基準時已有 Intro／Hero World、Blender、QA 與文件草稿等 untracked 檔案。完整清單以同一工作樹執行 `git ls-files --others --exclude-standard | sort` 為準；本輪只在這些範圍內補上 Phase 4／5 的入口、載入與測試內容，沒有修改其他產品區域。

## 架構整合點

| 系統 | 基線來源 | 本輪保留／整合要求 |
|---|---|---|
| Framework | `package.json`、`next.config.ts` | Next.js 16.3.2、React 19.2.7、App Router |
| Landing | `app/page.tsx`、`components/landing/LandingHub.tsx` | `/` 仍是內容探索頁，保留四段、故事／遊戲／地圖與 `DuduCompanion` |
| Global shell | `app/layout.tsx`、`ThemeProvider` | 保留 provider、字型、analytics、service worker；只加入輕量入口判定 |
| Navigation | `components/landing/SiteNavBar.tsx` | `/intro` 隱藏 Landing chrome，其他路由不變 |
| Intro | `app/intro/page.tsx`、`components/landing/hero-world/` | server metadata／semantic shell + poster + lazy scene |
| WebGL | `@react-three/fiber`、`three`、`three/addons/loaders/GLTFLoader.js` | 只在通過 eligibility 與 capability check 後載入 |
| SEO | route metadata、`app/sitemap.ts`、`app/robots.ts` | `/` canonical 與索引能力保留；`/intro` noindex/follow、不加入 sitemap |
| Offline/cache | `public/sw.js`、`ServiceWorkerRegister` | 不把 Intro GLB 放進故事 precache；HTML fallback 不得當成 GLB |
| Validation | Vitest、Playwright、axe fixtures | 新增 Intro route/fallback/lifecycle smoke；既有 public smoke 用 `/?enter=1` 明確測 Landing |

## 資產基線

`public/models/hero-world/` 已有可供 Phase 5 暫用的完整 v1 資產：

| 檔案 | bytes | 用途 |
|---|---:|---|
| `environment.glb` | 254,428 | 環境 |
| `little-red.glb` | 83,924 | 小紅 |
| `tree.glb` | 10,696 | 樹 |
| `poster.webp` | 45,302 | 桌面 poster |
| `poster-mobile.webp` | 33,888 | 手機 poster |

`public/models/hero-world/v2/` 在基線只有 `poster.png`（957,220 bytes），沒有 matching GLB／WebP／manifest。因此 Phase 5 使用 `/models/hero-world` 的完整資產，不引用 v2 缺檔路徑。v2 仍是待 Phase 6 重新導出與驗證的資產版本，不能在本輪宣稱完成。

## 基線限制與待驗證證據

- 未提交工作樹沒有可代表產品發布的 immutable artifact；測試報告必須記錄 dirty state。
- 舊 Hero 的 bytes、FPS、draw calls 或 triangles 數字只可作歷史參考；Phase 5 不把它們當新驗收結果。
- 真機 iPhone Safari、Android Chrome、長時間 GPU／熱量與 field INP 尚未在本基線測量；後續 Phase 12／最終報告需明列 pass、blocked 或 not-run。
- 本文件不替代 `INTRO-PORTAL-SPEC.md` 的視覺、Blender、性能與最終跨裝置驗收條件。

