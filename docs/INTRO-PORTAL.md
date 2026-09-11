# 車車遊樂園 Intro / Portal 實作與驗收

狀態：Phase 1、4、5、6、7 已實作並在本機驗證，Phase 8 已完成 v3 的視覺驗收，Phase 9 的進站轉場已實作並驗證，Phase 10／11 已完成本機效能量測與可及性驗證；Phase 12 的模擬部分（跨 viewport 版面、旋轉、網路）已完成，真機部分全部 NOT-RUN（無實體裝置，見 `docs/qa/intro-portal/phase12-20260908/`）；Phase 13 尚待驗收。依 2026-09-05 最新 Ultimate Prompt 全部 48 節驗收；舊 Hero 文件中的歷史數值不代表新版測量。

2026-09-08：前端引用的 v3 已改由 `assets/blender/hero-world/build.py` 乾淨重建（本輪以 PyPI `bpy` 4.5.0 模組實跑，實體 Blender CLI 複驗列為 Phase 13 前必做），後製腳本 `polish-hero-world.mjs` 刪除，`manifest.json` 記載 `blenderCleanRebuild: true`。重建報告、hierarchy 對照、before／after 擷取與影像差分見 [`docs/qa/intro-portal/v3-clean-rebuild-20260908/`](./qa/intro-portal/v3-clean-rebuild-20260908/)；較早的 v2 證據仍留在 [`phase6-7-20260906/`](./qa/intro-portal/phase6-7-20260906/)。v1、v2 目錄保留作回退。

## Repository findings

Next.js 16 App Router、React 19、TypeScript strict、CSS Modules。首頁由 LandingHub、四個 LandingSegment、專用捲動容器、BedtimeLayer 和 DuduCompanion 組成（ADR-0004 移除了 SegmentNav 底列，換段改由 snap／方向鍵與各段美術指引承擔）。全域 SiteNavBar 提供故事、遊戲、角色、宇宙地圖與家長景點；各功能頁直接以 App Router URL 進入。首頁保留原 metadata、canonical `/`、Podcast JSON-LD、可索引導言與 SSR 連結。故事播放有獨立沉浸式介面，音訊須由使用者啟動。Intro 不引入 Audio 或改寫播放器。

視覺沿用粉圓中文字、Baloo、圓角陶土與暖奶油／紅／薄荷綠。ThemeProvider 含夜間與睡前時間規則；Intro 使用自主美術色，Landing 的主題與睡前層保持原狀。既有 service worker、版本化 Next chunks、圖片最佳化及 Vercel analytics 保留。GLB 已拆成環境、車、實例化樹；SceneLoader 管理 abort 與 dispose，QualityManager 降級，CameraRig 處理手機構圖。先保留這些架構，再改善美術与生命週期細節。

本輪開始前重新檢視路由、layout、首頁、導覽、全域設計規範、字型設定、素材／建模腳本、3D 元件、metadata、sitemap、Next 設定、service worker、package scripts 和 Playwright 設定。修改前桌面與手機實拍已存於 `docs/qa/intro-portal/before-*.png`，可見右下浮動 PNG 與世界內的小紅重複，摩天輪靜止，前庭缺乏明確形狀。

## 三個方向（實作前評估）

| 項目 | A 書封裡的小樂園 | B 故事群島的早晨 | C 小紅的送書路 |
|---|---|---|---|
| 情緒 | 開門迎接、親近 | 好奇、遠方故事 | 期待、抵達 |
| 構圖 | 既有故事屋／環路／慢轉摩天輪，放大 8% | 三個地景、微型橋與車站 | 縱深彎路串起三個故事片段 |
| 相機 | 克制正交、輕微入園推進 | 高俯角降落至中央站 | 沿路少量前進 |
| 小紅 | 放慢、懸吊收穩、望向訪客再出發 | 從橋進站、點頭 | 送書後出發 |
| 環境生命 | 窗光、慢輪、兩株樹微擺 | 遠近兩層樹影、火車煙 | 逐站亮窗 |
| Blender 資產 | 保留既有模組，拆出輪盤與車廂軸心 | 新增三種地景／橋 | 新增長路與三個分鏡 |
| 複雜度 | 中，沿用現有架構 | 高 | 高 |
| 估計 GLB | 0.4–0.7 MB | 1.5–2.5 MB | 1–2 MB |
| 手機 | 更正面鏡頭，前景車與屋優先 | 單島裁切 | 單一分鏡 |
| GPU 預算 | <40k triangles、<70 calls | 60k triangles、90 calls | 50k triangles、80 calls |
| 優勢 | 延续品牌、場景容易讀懂、較少新增資產 | 世界感強 | 敘事清楚 |
| 風險 | 需靠節奏與材質脫離模型展示感 | 重複既有宇宙地圖產品 | 較易強迫觀看動畫 |

選 A：以現有場景做微敘事與光材質改善，最符合保留架構、低載入成本、立即入站和安靜世界感。煙霧只在確有視覺收益且預算充足時加入；不為增加物件而加細節。

## 路由決策（2026-09-08 依 ADR-0003 更新）

`/` 永遠回傳完整的 Landing HTML——canonical、Podcast JSON-LD、SSR 內容與所有內部連結一字未改，而且**沒有任何 client redirect**。3D 開場是蓋在它上面的**同頁覆蓋層**（ADR-0004）：`<head>` 的同步 script（`lib/intro-gate.ts`）在首次繪製前決定要不要打開，所以既沒有導航可以閃爍，也不需要 middleware 或 cookie。覆蓋層每個瀏覽分頁出現一次（sessionStorage `cheche:intro-seen-v1`），按「進入車車遊樂園」就地淡出、焦點交給 `#main-content`，網址全程是 `/`。閘門同時檢查 reduced motion、Save-Data 與 2G：明確表達限制偏好的人根本不會遇到覆蓋層，第一眼就是 Landing。無 JavaScript 或 script 出錯時覆蓋層依設計不出現（CSS 預設隱藏），Landing 直接可用。Landing 首段有可見的「看小紅開進遊樂園」：有 JS 時重開同頁覆蓋層（頂欄仍可點），無 JS 才走進 `/intro`。`/intro` 保留為獨立路由：無 JS 時的入口、可分享的深連結、修飾鍵開新分頁的去處，noindex/follow，與覆蓋層共用同一個 `HeroWorld` 元件。從 `/intro` 進站會先寫入閘門標記，回到 `/` 不會再被蓋一次。

取消自動導向的理由、實測到的閃爍數據與被否決的替代方案見 [ADR-0003](./adr/0003-intro-auto-invite.md)。

## 預算（驗收前設定）

| 項目 | 目標 |
|---|---|
| Intro 額外初始 JS | ≤15 KB gzip，不含既有 Next／React 共用殼 |
| 延遲 3D JS | ≤300 KB gzip |
| 三個 GLB | <1 MB，優先 <500 KB |
| Poster | 桌面 <180 KB、手機 <100 KB |
| 紋理 | 優先無 GLB 紋理；不增 4K 資產 |
| 場景 | <40k visible triangles、<70 calls |
| 記憶體 | 離頁卸載 canvas／停止動畫；反覆進入不累積模型、材質與紋理 |
| DPR | 高 1.5、中 1.25、低 1 |
| FPS | 能力足夠裝置 60；低階降級維持 30+ 或靜態 |
| LCP / CLS | 本機冷啟動目標 <2.5s／<0.05；另標註測試條件 |
| 互動 | Enter 立即可用，轉場 ≤450ms；記錄合成互動延遲，不把實驗室測量稱為真實訪客 INP |

## 待驗收清單

- [ ] 獨立 Intro、最小 HTML UI、原 Landing 吉祥物與內容完整。
- [ ] 首次／回訪、直接 Landing、深連結、Back、無 JS 行為。
- [ ] Blender 輪盤慢轉、直立車廂、暖窗、前庭、小紅問候、材質深度、樹擺。
- [x] 入園轉場與立即 Enter／略過、reduced motion。（2026-09-08，Phase 9：導航先發生、動畫 ≤360ms 由 CSS 完成、五種時刻都可 Enter）
- [x] 版本化資產、GLB validator、資源清理與 pause。（2026-09-08，Phase 10：五次往返無累積、hidden／pause／離頁 rAF 為 1／0／0）
- [~] 320/360/375/390/414/430、tablet、1440、短橫向：**模擬**擷取與版面檢查已完成（2026-09-08，Chromium）；**真機實拍仍 NOT-RUN**。
- [ ] Poster → WebGL 光色／相機一致性。
- [x] 全部既有驗證與新 Intro E2E／a11y／fallback 測試。（2026-09-08，Phase 11：F04／F07／F08／F12／F13 補齊，axe、鍵盤、縮放、reduced motion 皆有具名測試）
- [ ] WebKit 與可用的實體裝置測試；不能執行的項目明確記錄，不冒稱完成。（2026-09-08：容器無 WebKit engine、無實體裝置 → 全部 NOT-RUN，runbook 見 `docs/qa/intro-portal/phase12-20260908/real-device-runbook.md`）
- [ ] 前後性能／視覺對照、18 項最終報告與原始碼文件更新。
