# 車車遊樂園 3D Intro / Portal — 詳細執行計畫

版本：1.0 · 日期：2026-09-06（狀態於 2026-09-07 依工作樹重新核對） · 狀態：Phase 1、4、5 已執行並驗證；Phase 6／7 產出 v2 並通過 validator，build.py 已實跑證明可重建 v2（Blender 4.5.9／5.2.1，證據見 `docs/qa/intro-portal/phase6-rebuild-20260907/`）；但前端已改引用未經 Blender 重建的 v3，該版本的可重建性仍未證明；Phase 2、3、8–13 為後續計畫

配套文件：[產品與技術 SPEC](INTRO-PORTAL-SPEC.md)。本文件把規格拆成可執行的工作、相依關係、測試及交付證據；Phase 1、4、5、6、7 的證據位於 `docs/qa/intro-portal/phase1-20260906/`、`phase4-5-20260906/` 與 `phase6-7-20260906/`。`docs/qa/intro-portal/phase8-20260906/` 已有 v3 的 capture、四角度 poster 與 validator 輸出，但 `capture-report.json` 的 `runtimeMetrics` 為 null、`performanceSampled` 為 false，且無 test-results.md，因此不算 Phase 8 驗收。其餘 checkbox 仍是後續驗收項目。

## 0. 如何執行本計畫

執行順序：盤點 → 三案比較 → 選案 → 路由與靜態入口 → 最小 live scene → 資產管線 → 角色動態 → 環境 → 轉場 → 效能 → 可及性 → 跨裝置 → 最終視覺。

可及性、效能、手機與錯誤處理是每階段的限制；Phase 10–12 是集中驗證與收斂，不是到最後才開始考慮。每階段先滿足退出條件，再擴大場景複雜度。

本次選定 A「書封裡的小樂園」。Intro `/intro`、Landing `/`、直接進入 `/?enter=1`。Blender 產資產，R3F／Three 渲染；語意 HTML 與進站動作始終獨立。不要重做已有的 Landing 內容系統。

### 0.1 執行前阻擋項

| 項目 | 現況／風險 | 執行時解法 | 通過證據 |
|---|---|---|---|
| 未驗收工作樹 | 路由、場景與 Blender 有前次草稿 | 記錄完整 diff 與資產清單，再決定沿用部分 | 基線 commit＋dirty patch＋untracked inventory |
| ~~v2 資產不完整~~（已解除） | 基線只有 poster.png；Phase 6 已補齊完整 v2 | — | v2 manifest、hash 與 validator 通過 |
| 上線資產無 Blender 來源鏈 | build.py 已實跑並證明可重建 v2；但前端引用的是 v3，v3 由 NodeIO 加工 v2 而來，`build.py` 的 `PROD` 仍指向 v2 | 讓 v3 也能由 build.py（或 build.py＋明示的 polish 階段）重建，或把前端切回可重建的版本 | `docs/qa/intro-portal/phase6-rebuild-20260907/`：Blender 4.5.9／5.2.1 執行 log 與 hierarchy 對照表（v2 已通過） |
| 現有 Hero 測試 | 仍有依舊首頁設計的斷言 | 區分移至 Intro 的斷言與保留 Landing 的斷言 | 測試契約變更說明 |
| 字型子集 | 新短句可能缺字 | 檢查 glyph coverage，必要時再生子集 | 目視及字元比對 |
| 真機 | 未確認實體 iPhone／Android 可用 | 執行時確認測試資源；不足標 blocked | 真機型號、OS、瀏覽器與錄影 |

不可使用 `git reset --hard` 或清除 untracked 檔案建立乾淨狀態；先前草稿及使用者工作都需要保留。若建立 worktree，未提交檔案不會自動跟隨，必須明確複製所需草稿並保留來源。

### 0.2 文件與證據目錄

```text
docs/specs/
  INTRO-PORTAL-SPEC.md
  INTRO-PORTAL-PLAN.md
docs/qa/intro-portal/<artifact-id>/
  repository-audit.md
  baseline.json
  asset-report.json
  route-matrix.md
  performance.json
  accessibility.md
  test-results.md
  visual-review.md
  screenshots/<viewport>/<state>.png
  recordings/
  traces/
  final-report.md
```

artifact-id 應可追溯版本與時間；若有 dirty tree，用 diff hash 或封存產物 hash 補足 commit。證據不得含 token、環境檔或家庭／兒童資料。上列是未來產物，不在本次建造空報告來暗示測試完成。

## 1. Phase 1 — Repository audit 與基線

**目的：** 確認實際整合面，保留既有功能，辨認前次草稿與原始設計。

**輸入：** SPEC §1、package／lockfile、目前工作樹、既有 QA 圖。

**工作：**

1. 讀取適用的 AGENTS.md、DESIGN.md、現有開發／部署文件；記錄有效命令與限制。
2. 用 git status／diff 記錄 tracked 變更；另記 untracked 資產。只讀取需要的設定，不輸出秘密。
3. 盤點 App Router 所有 public 路由，追蹤 layout → provider → SiteNavBar／DuduCompanion → Landing 與 Intro 的實際掛載路徑。
4. 追蹤首頁四段內容、snap／anchor、故事播放入口、遊戲、宇宙地圖、親子地圖、theme／bedtime、播放器離頁行為。
5. 盤點 metadata、JSON-LD、sitemap、robots、SW cache 範圍、image headers、analytics、錯誤處理與離線頁。
6. 記錄已安裝 Three／R3F 與 glTF 工具版本、所有模型節點／材質／動畫、Blender 執行方式、poster 生成方式。
7. 閱讀 Vitest／Playwright config、webServer 啟動、受保護頁與測試 fixture，判斷測試是否有外部副作用。
8. 在隔離且可重現的基線上錄影首頁、deep link、Back、音訊、手機與 reduced motion。若基線本身無法 build，記錄原因而不把它當作新變更回歸。
9. 測量現有首頁初始 JS、LCP／CLS、主資產，記錄測試裝置。舊 Hero 文件數字僅作歷史參考。

**產物：** repository-audit.md、路由／掛載表、資產清單、基線截图及量測。

**退出條件：** 每個受影響系統有來源與保留要求；v2 缺檔等阻擋項明列；沒有把「型別通過」視為完整基線。

## 2. Phase 2 — 三個概念深化

**相依：** Phase 1。**輸入：** 現有車輛與品牌資產、SPEC §3。

每案製作 desktop／mobile 構圖草圖與 4–6 格動態分鏡。可以用簡單 blockout 或繪圖表達，不先製作三套完整模型。每案列情緒、世界配置、相機、小紅時刻、環境動態、Blender 清單、複雜度、GLB 預估、手機策略、GPU 成本、優點與風險。

- A 書封裡的小樂園：屋、慢輪、環路、前庭與一次小紅問候；保留世界延伸的裁切。
- B 故事群島的早晨：橋與三地景；評估是否重複 adventures、手機是否太碎。
- C 小紅的送書路：縱深道路與抵達；評估是否需要過長鏡頭或等候。

**退出條件：** 三案可比較，預估明確標為預估；沒有借用既有動畫工作室或受保護角色的外觀作为美術捷徑。

## 3. Phase 3 — 選案與決策鎖定

**相依：** Phase 2。採用已選 A；只有新證據顯示核心限制不可滿足才重新選型。

建立簡短 ADR：品牌延續、手機清晰、載入成本、fallback 一致性、維護成本、SEO 與風險如何支持 A。鎖定：單次問候、56 秒輪速、前庭空間、暖窗、最多兩樹擺動、煙霧選配、無新增音訊。把新物件要求放入 backlog，不自動加入當前範圍。

**退出條件：** 場景各物件有敘事或構圖用途；主要文案與各 viewport 安全區確定；不需要另等概念批准。

## 4. Phase 4 — Intro route／HTML／session

**相依：** Phase 3。先做可用的靜態入口，尚未載入 WebGL 也可完成全部導航。

**實作工作：**

1. `app/intro/page.tsx` 作 server shell：metadata、標題、短句、poster、Enter／Skip。若拆 client boundary，確認初始 HTML 仍有連結。
2. `/` 保持內容、canonical 與 JSON-LD；`/intro` noindex、follow，不放進主 sitemap。不得全站 middleware 強制 Intro。
3. **已由 ADR-0003 取代：** 不再掛 IntroVisit；`/` 零 client redirect。
4. **已由 ADR-0003 取代：** 裸 `/`、`enter=1`、hash、deep link 都停在所請求的內容。
5. **已由 ADR-0003 取代：** 不再寫 session；storage 錯誤也不再影響路由。
6. Enter 為原生 `<a href="/?enter=1">`。正常主鍵點擊可增強；modifier、中鍵、下載／新視窗語意不得被動畫攔截。
7. 只在 Intro 隱藏 SiteNavBar、DuduCompanion、bedtime 視覺層；Landing 保持原位與行為。不能全域卸掉 ThemeProvider。
8. JS disabled 時 `/` 可探索內容、`/intro` 可直接 Enter。不要用 CSS 預設隱藏全站等 hydration。

**驗證：** 執行本文件 R08–R11；檢查原始 response HTML 與 hydration 後 DOM；確認 `/` 無 client redirect。

**退出條件：** 不載模型就能完整使用；無回圈、無 deep-link 攔截、Intro 不疊浮動小紅、首頁保留內容與索引能力。

## 5. Phase 5 — 最小 Scene 與載入殼

**相依：** Phase 4。資產可暫用已存在且可驗證的版本，不引用缺檔 v2。

1. 將 HeroWorld 作漸進增強層；poster 固定容器與比率，先出 HTML／poster，之後才 import scene。
2. 在 import 前判 reduced motion、Save-Data、slow-2g／2g；未知 connection 不當作失敗，採保守品質。
3. Scene 僅有環境、小紅、靜態樹、基本光與一個 camera；沒有 optional particles。
4. 確認成功 render 後才 ready；poster 在此前始終可見。透明 canvas／shader compile 不得觸發提前移除。
5. error boundary、GLB fetch／parse error、context lost、15 秒有效載入 timeout 全部回 poster。
6. 建立唯一資源 owner；離頁停止 mixer、abort fetch、清監聽／RAF／timer、去重 dispose 幾何／材質／紋理。
7. 使用 demand frameloop；動態需要時主動 invalidate，靜止／hidden／離頁不繼續排程。

**驗證：** GLB 404、返回 HTML、corrupt binary、延遲載入、無 WebGL、canvas throw；每種 Enter 都可用。檢查 network waterfall，Landing 不下載 Three／GLB。

**退出條件：** 靜態與 live 可安全切換，任一錯誤有完整畫面，僅一個 Canvas，離頁沒有 late state update 或重複下載。

## 6. Phase 6 — Blender 與 GLB pipeline

**相依：** Phase 5 骨架可用、Phase 3 美術鎖定。

1. 保存原 `.blend`；在 `build.py` 中建立可重現生成流程，固定隨機種子並記錄 Blender 版本。
2. 依 SPEC §9 建立 environment、FerrisRotor、GondolaPivot、Vehicle Body、Wheel、Tree Crown 層級。核對 origin、scale、軸向、單位與接地。
3. Story House 前庭連接道路與門檻；不靠新增大量物件填滿空白。
4. 材質限制到少量可共享 PBR，保留小紅輪廓和眼睛；不用無法 glTF 導出的複雜 procedural shader。
5. 選定必要物件導出 raw GLB；移除隱藏物件、camera／light、重複 action／材質、未使用貼圖。
6. 優化腳本先 validator，再 dedup／weld／quantize／靜態簡化；保留所有動態 pivot，不跨父節點 flatten 動態場景。
7. 以 raw／optimized A/B 核對眼睛、輪胎、屋頂邊緣、吊艙直立、動畫 duration。Meshopt／Draco 僅在完整收益成立時採用。
8. 生成 final validator report、資產大小、geometry／material／clip 清單、hash manifest。
9. 用正式 Three 初始鏡頭與材質生成 desktop／mobile poster；可先產 lossless master，再轉 WebP。若使用 Blender poster，逐地標核對色彩與構圖。
10. 同一版本完整交付所有模型／poster／manifest；封存後不覆蓋 immutable 路徑。

**退出條件：** 無 validator error；所有必需 node／clip 存在；實際GLB <1MB；poster 可用；程式引用與產物一致；可重建得到語意一致資產。二進位不一定逐 byte 相同，差異需能解釋。

**現況（2026-09-07，已實跑驗證）：** 對 **v2** 全部成立——`build.py` 已在 Blender 4.5.9 LTS 與 5.2.1 LTS 實跑，經 `optimize-hero-world.mjs` 後可重建出與上線 v2 語意階層完全一致的資產（節點名稱集合與節點數一致，`Drive` 4 channels／2.0417s 一致），bytes 與 SHA 差異可解釋。證據見 `docs/qa/intro-portal/phase6-rebuild-20260907/`。對 **v3** 仍不成立：v3 由 `polish-hero-world.mjs` 後製 v2 而來，`build.py` 的 `PROD` 仍指向 v2。Phase 6 對 v2 可關閉，對前端實際引用的 v3 未關閉。

## 7. Phase 7 — 小紅角色動畫

**相依：** Phase 6 動態層級。時間表見 SPEC §7.5。

建立以 active time 為基準的單次狀態機。路徑採弧長／距離映射，方向跟切線，輪速跟實際距離。減速与再起步速度連續；停車時輪子停止；Body 的懸吊不拖動輪胎穿地。

問候約發生在 ready 後4.5–6.2秒。若模型無獨立瞳孔，明確使用車身微轉，不聲稱有眼神追蹤。問候一次後繼續，18–24秒安定；不要每次 loop 邊界瞬移車位。

hidden／pause 不累積時間；回來從原姿態繼續。Enter 從任何動畫狀態都能結束，不等待問候；reduced motion 不初始化動畫。

**證據：** approach、stop、settle、acknowledge、continue 五個時間點截图與短錄影；正常／慢幀／pause resume 各一次；輪胎接地近景。

**退出條件：** 問候清楚且克制，沒有滑輪、穿地、突然加速、回 tab 大跳或反覆問候。

## 8. Phase 8 — 環境與光材質

**相依：** Phase 6；與 Phase 7 的視覺合成必須再次核對。

- 摩天輪一圈56秒，輪框／spokes 共用 pivot，支架不動，八個吊艙抵銷 local rotation 保持朝上。錄製或固定到0／90／180／270度驗證。
- 暖窗使用低強度 emissive，不新增多盞 realtime light。屋影與主光方向一致，窗不亮成貼紙。
- 前庭具明確鋪地、步道與門檻關係；保留有意義留白。
- 桌面世界約增加5–10%存在感，偏心與局部底座出框；屋頂、車眼與主要輪廓不可被錯誤裁切。
- High 最多兩株樹冠微擺，樹根不漂移；中低品質簡化。
- 先調光、roughness、材質色差、接觸深度；不先加 triangles、postprocessing。
- 煙霧只作有時間上限的可移除實驗；若不明顯改善敘事則不用。

**退出條件：** desktop／390 mobile 都像同一個原創玩具世界，沒有浮空、貼 PNG 感、過曝窗、倒吊車廂或空白未完成地面；品質切換仍保留角色辨识度。

## 9. Phase 9 — Intro → Landing 轉場

**相依：** Phase 4 路由、Phase 7／8 live 狀態。

正常 live Enter 立即開始路由切換，同時可做最多360ms淡出／最多6.5%相機微推近；不以動畫延後導航請求。Skip、未 ready、fallback、reduced motion 直接 route。視覺效果的時間上限應有獨立保底，不能只等 transitionend 或 R3F frame；若路由更早就緒可提早結束效果。

點擊後只接受一次導航；以可感知樣式回饋，不把原生 link 換成無語意 div。需要 session 標记時同步完成；儲存錯誤仍進站。route 失敗時恢復連結可用，提供正常導航保底；不要把透明 overlay 留住。

到 Landing 後清理 scene、移除覆蓋層、恢復內容捲動，初次 Enter 可將 focus 移到 main／標題。Back 還原既有頁面時不搶焦點、不重設原捲動位置。

**退出條件：** 在 poster、loading、greeting、paused、fallback 五種時刻都可 Enter；慢 CPU／hidden／雙點擊不死鎖；頁面沒有退出後殘留 canvas。

## 10. Phase 10 — 效能與資源收斂

**相依：** 完整功能與資產。遵循 SPEC §13 預算，不把目標值寫成實測。

1. production build 記錄 Intro 額外初始 JS與 lazy 3D chunk；分 raw、gzip、實際 transfer。確認 Landing 未拉入整包 Three。
2. waterfall 核對 HTML → poster → shell → scene JS → critical environment／vehicle → optional；不要同時 preload 全部模型。
3. 首輪使用 mobile Medium；runtime sample 排除 warmup、hidden、parse。持續低於38FPS降級，Low不穩則 poster；不頻繁來回跳級。
4. 測 High1.5／Medium1.25／Low1 DPR，GPU draw calls分主pass和shadow，triangles包含instance。
5. 優化順序：材質合併／重複物件 → shadows → DPR → optional motion → geometry／codec。每次記 bytes／frame-time／視覺變化。
6. 3次冷載與3次暖載，測 LCP／CLS／Enter event latency／long tasks；INP無真實資料標 not measured，不以Lighthouse或一次點擊充當field INP。
7. 五次進出與至少一次較長觀察，驗證 heap無線性成長、dispose執行、renderer計數、canvas歸零。GPU memory不可用JS heap冒充。
8. hidden、pause、24秒休眠測無自發 invalidate；恢復時計時不跳。
9. 確認 versioned cache header、SW 不誤存HTML為GLB、舊版部署仍可取得舊資產。

**退出條件：** 硬限制通過；目標未達有量測差異與修正決定；沒有無情境的「60FPS」宣稱；Landing無可歸因於Intro的重大回歸。

## 11. Phase 11 — 可及性與靜態體驗

**相依：** Phase 9 完成互動；基礎要求已從Phase4開始。

1. 鍵盤依序讀 h1、短句、Enter／Skip／pause；可見focus、無trap、最小44px target。
2. 裝飾canvas和poster不重複朗讀；有正常main／heading，不用WebGL字體呈現必要資訊。
3. 動態超過5秒就提供真實「暫停動態／繼續動態」button；只略過不能替代暫停。若堅持不加控制，全部動態改為5秒內停止。
4. reduced motion 初始與runtime切換都測；不得載入3D／fly-through／持續parallax，退出即時。
5. 200% zoom、200%文字、320px、短橫屏和safe-area，確保出口可見或可正常捲到。
6. VoiceOver／Safari手動讀取與操作；axe輔助檢查但不取代手測。
7. 音訊預設靜音，無AudioContext自動建立、無干擾故事播放器。

**退出條件：** 完全不看動畫、無WebGL、鍵盤或screen reader都能完成相同進站任務；pause狀態名稱與真實動態一致。

## 12. Phase 12 — Cross-device QA

**相依：** Phase10／11無重大阻擋。

| 維度 | 必測條件 | 核對重點 |
|---|---|---|
| 窄手機 | 320×568、360×800 | 標題換行、CTA首屏與自然捲動、車不被裁 |
| 主流手機 | 375×812、390×844、414×896、430×932 | 車／屋／輪構圖、safe-area、觸控 |
| Tablet | 768×1024、1024×768 | 重新構圖、橫豎切換、文字不壓屋 |
| Desktop | 1440×1000 | 世界存在感、負空間、pointer幅度 |
| Large | 1920×1080，能測則2560×1440 | 字體上限、世界不縮成模型商品照 |
| 短橫屏 | 844×390 | 退出控制不被100vh裁掉 |
| 引擎 | Chromium、WebKit、Firefox | load、fallback、routing、keyboard |
| 真機 | iPhone Safari；Android Chrome可取得則必測 | 高DPR、溫度／低耗電、orientation、touch、Back |
| 網路 | 正常、慢速、2G／Save-Data、offline、404、timeout | poster與Enter持續可用 |
| 偏好 | reduced motion、storage blocked、JS disabled | 無強制入口或失效出口 |

所有viewport至少拍 poster／ready／Landing；320、390、tablet、1440另拍問候與exit；slow、reduced及WebGL fail有獨立證據。真機需記型號、OS、browser版本、電源模式與持續測試時間。模擬WebKit結果獨立列，不代替真機Safari。

**退出條件：** 無P0／P1；所有未測平台明列限制，不能以空白當pass。需要修正時回到對應phase，之後只重跑受影響項與必要整合回歸。

## 13. Phase 13 — 最終視覺、報告與交付

**相依：** Phase12完成，所有必要證據可追溯。

逐組並排比較before／poster／ready／問候／Landing。先問是否像車車遊樂園、屋前是否有意圖、小紅是否有性格，再查光影、相機、安全區與速度。美術修改後重新生成poster、更新manifest並重做相應量測，避免海報與live版本分離。

交付包含 `.blend`／生成腳本、GLB／poster／manifest、前端程式、針對性測試、完整18項報告、已知限制與回退方法。更新舊 HERO-WORLD／INTRO-PORTAL 文件，注明新路由與資料版本；不要留互相矛盾的完成宣稱。

本輪只執行 Phase 1、4、5，不做 Blender 美術、不 commit、不 push、不部署。未來進入發布階段時，以當時授權與專案實際 hosting 流程執行；先有可審查 Preview 與證據，再處理 production。不能把 Phase 4／5 完成等同 production-ready。

**退出條件：** 視覺、敘事、產品、工程、效能、手機、可及性、Landing保留八項分別有證據；已知阻擋事項未被藏在「完成」措辭下。

## 14. 變更檔案藍圖與責任邊界

下列為預期整合點；新增檔名可隨現有結構調整，不為套模板搬動所有元件。

| 路徑／範圍 | 預計改動 | 保護範圍 |
|---|---|---|
| app/intro/page.tsx | server入口、metadata、shell | 不取代首頁metadata |
| components/intro/ | session決策與Intro專用殼 | 無故事資料讀取 |
| app/layout.tsx | 僅必要的route-aware chrome整合 | provider、analytics、字體維持 |
| components/landing/SiteNavBar.tsx | Intro上不顯示 | 其餘路由功能不变 |
| Landing首段元件 | 移除Intro職責、保留內容探索 | 不重做其他段與snap系統 |
| components/landing/hero-world/ | scene、camera、vehicle、quality、loader、CSS | 沿用已存在分工 |
| assets/blender/hero-world/ | 可編輯來源與生成腳本 | 不用public raw GLB代替source |
| scripts/optimize-hero-world.mjs | hierarchy保護、報告、一致性檢查 | 不影響其他資產管線 |
| public/models/hero-world/<version>/ | 完整版本化產物 | 舊版本保留 |
| e2e/public-smoke.spec.ts | 更新首頁／Intro責任斷言 | 故事／遊戲／地圖smoke繼續 |
| e2e/intro-portal.spec.ts（建議新增） | 路由、fallback、transition與lifecycle | 不用延時sleep當ready斷言 |
| 相關Vitest檔（按需） | 純session決策、active time與降級等邊界 | 不寫只重述implementation的測試 |
| docs/qa/intro-portal/ | 版本化證據與最終報告 | 舊證據不改成新版結果 |

## 15. 針對性測試矩陣

### 15.1 路由與入口

> **[ADR-0003](../adr/0003-intro-auto-invite.md) 已實作：取消自動邀請。**
> 本表只留 R08、R09、R10、R11。R01–R07 與 R12 的 redirect 部分已刪除，不是 skip。
> 目前狀態見 [route-matrix.md](../qa/intro-portal/route-matrix.md)。

| ID | 設定／動作 | 應有結果 | 方法 |
|---|---|---|---|
| R08 | Landing→story→Back／Forward | 正常內容與既有捲動，無重播 | E2E＋手測 |
| R09 | 主動開/intro | 可重看且可直接進站 | E2E |
| R10 | JS disabled | /有内容與 Intro 連結，/intro有原生Enter | browser context |
| R11 | 中鍵／Cmd或Ctrl點Enter | 原生新頁語意，不錯導當前tab | 瀏覽器手測 |

### 15.2 載入與生命周期

| ID | 故障／條件 | 應有結果 | 方法 |
|---|---|---|---|
| F01 | reduced motion初始啟用 | poster、无3D請求、立即Enter | emulateMedia＋network |
| F02 | Save-Data／slow-2g／2g | poster且无模型請求 | 明確network API fixture |
| F03 | WebGL不可用 | 完整靜態畫面 | context建立失敗注入 |
| F04 | GLB404／corrupt／HTML200 | 回poster、停止其他工作 | route interception |
| F05 | critical load超15秒active time | timeout fallback，无重試風暴 | 可控clock＋實際延遲抽測 |
| F06 | ready前Enter | 立即離開、abort、不等載入 | network延遲＋事件觀測 |
| F07 | context lost | 回poster、動畫停、Enter可用 | loss extension或等效注入 |
| F08 | runtime切reduced motion | 卸載3D，無exit動畫 | media change |
| F09 | hidden30秒再恢復 | 車位不大跳、不計入active time | 手測／instrumentation |
| F10 | pause／resume、24秒休眠 | 停止排程；resume需明確動作 | frame counter |
| F11 | 五次Intro↔Landing | canvas歸零、無listener／資源線性累積 | counters＋heap抽查 |
| F12 | poster失敗 | 標題／出口仍可用，但視覺測試fail | image request故障 |
| F13 | 離頁後parse完成 | late資源立即釋放、無state update | loader可控race |

### 15.3 視覺、動態與操作

| ID | 檢查 | 通過標準 |
|---|---|---|
| V01 | 全viewport構圖 | 屋、車可辨，文字與CTA不遮擋，無非預期水平捲動 |
| V02 | poster→live | anchor偏移≤2%，尺度差≤5%，無明顯亮度／影子跳變 |
| V03 | 小紅五階段 | 減速平滑、懸吊克制、一次問候、輪胎接地 |
| V04 | 摩天輪四角度 | 支架不動、吊艙向上、週期45–60秒 |
| V05 | adaptive tier | 主角與主屋保留、無跳級閃爍、DPR符合上限 |
| V06 | portrait↔landscape | 相機和HTML重新佈局、出口可達、無第二canvas |
| V07 | Enter各狀態＋double click | 一次route、回饋快、視覺轉場≤360ms、導航立即開始、不死鎖 |
| A01 | keyboard／focus | 無trap，focus清楚、進站後合理定位 |
| A02 | VoiceOver／axe | 語意正常、無裝飾物件噪音；問題人工分類 |
| A03 | zoom／文字200% | 內容可重排，所有控制可達 |
| A04 | contrast／target／pause | 正常文字≥4.5:1、44px控制、動態可停止 |
| A05 | audio | 無自動播放、不影響既有故事操作 |
| S01 | SSR／rendered HTML | 首頁內容、links、JSON-LD保留，Intro noindex不污染首頁 |
| S02 | asset cache／SW | 新舊release正確，離線故事可用，HTML不當模型 |
| P01 | cold／warm／tier profiling | 依SPEC預算及完整裝置情境報告 |

故障fixture應明確記錄模擬範圍。模擬Save-Data不能宣稱實際電信2G已測；用fake timer通過不能代替真機背景切換。視覺baseline只有人工確認後才更新，不以自動update snapshots消除差異。

## 16. 專案驗證命令與執行策略

以下命令由目前package.json盤點；正式實作時先確認scripts仍存在。本次文件交付不執行build、測試、API同步或部署。

| 批次 | 命令 | 備註 |
|---|---|---|
| 靜態 | npm run lint；npm run typecheck | 分別執行記exit code |
| 單元 | npm test；npm run test:play-map | 後者為現有專用scope |
| 綜合 | npm run check | 已含test、typecheck、部分verify及build，避免重複全跑 |
| 補充內容 | npm run verify:release-content；npm run verify:browse-index | 檢查實作未破壞內容完整性 |
| SW | npm run verify:service-worker | 語法檢查外仍需S02行為測試 |
| E2E | npm run test:e2e | 先讀config、fixture與外部副作用；使用測試環境 |
| 公開頁子集 | npm run test:e2e:public | 已完整test:e2e覆蓋則不重複，只在debug使用 |
| 視覺 | npm run test:visual | trusted baseline依專案流程，不盲目更新 |
| 資產 | npm run optimize:hero-world | 是生成／修改命令；Phase6使用，非純驗證 |
| 額外audit | audit:assets、audit:colors、audit:design-tokens、audit:production | 按現有專案要求記baseline與新增問題 |

`npm run build` 有prebuild生成音訊長度、llms與indexnow key；執行前確認資料／環境、執行後核對生成diff。`sync:*`、`submit:indexnow`、migration與外部通知不是本案驗證步驟。`verify:geo-live`需要外部服務時記條件與執行理由，不能因離線失敗把Intro判成壞掉。

失敗分為：本次引入、既有baseline、環境／權限、測試資料、未執行。每項附命令、exit code、摘要和證據；不能只寫「大部分通過」。既有失敗若不在範圍內，記錄明確影響而不擴張重寫其他系統。

## 17. 48 項原始需求追蹤

| # | 原始主題 | 規格位置 | 實作／驗收位置 |
|---|---|---|---|
| 01 | Repository inspection | SPEC 1 | Phase1 |
| 02 | Intro與Landing分工 | SPEC 0／2／4 | Phase4、R01–R12 |
| 03 | Brand／audience | SPEC 2／3／6 | Phase2／13 |
| 04 | 核心序列 | SPEC 5／7／11 | Phase5／7／9 |
| 05 | 最小UI | SPEC 5／8 | Phase4／11 |
| 06 | Blender→GLB→R3F | SPEC 9–11 | Phase6 |
| 07 | 技術棧 | SPEC 1／10／11 | Phase1／5 |
| 08 | 不直搬raw scene | SPEC 9／10 | Phase6 |
| 09 | 三個概念 | SPEC 3 | Phase2 |
| 10 | 自主選案 | SPEC 3 | Phase3 |
| 11 | 原創黏土美術 | SPEC 6／7／9 | Phase8／13 |
| 12 | 微敘事 | SPEC 7 | Phase7／8、V03／04 |
| 13 | 重設空白區 | SPEC 7.1 | Phase6／8 |
| 14 | 世界而非商品照 | SPEC 6／7 | Phase8／13、V01 |
| 15 | 相機 | SPEC 6.2／6.3 | Phase5／8、V01／06 |
| 16 | 進站轉場 | SPEC 4／5 | Phase9、V07 |
| 17 | 永不強制等待 | SPEC 5／11 | Phase4／9、F06 |
| 18 | 回訪 | SPEC 4 | Phase4、R02–R12 |
| 19 | Routing／SEO | SPEC 4 | Phase4、S01 |
| 20 | HTML語意 | SPEC 5／14 | Phase4／11、A02 |
| 21 | 手機一級體驗 | SPEC 6／15 | Phase12、V01／06 |
| 22 | 效能預算 | SPEC 13 | Phase10、P01 |
| 23 | 漸進載入 | SPEC 11 | Phase5／10 |
| 24 | Fallback | SPEC 11.4 | Phase5、F01–F08 |
| 25 | Reduced motion | SPEC 8／14 | Phase11、F01／08 |
| 26 | Adaptive quality | SPEC 13.2 | Phase10、V05 |
| 27 | DPR | SPEC 13 | Phase10／12 |
| 28 | Lighting | SPEC 7／9 | Phase8 |
| 29 | Shadows | SPEC 9／13 | Phase8／10 |
| 30 | Materials | SPEC 9.3 | Phase6／8 |
| 31 | Textures | SPEC 9.4 | Phase6／10 |
| 32 | GLB optimization | SPEC 10 | Phase6 |
| 33 | Cache／versioning | SPEC 10.3 | Phase6／10、S02 |
| 34 | Resource cleanup | SPEC 11.3 | Phase5／10、F11／13 |
| 35 | Frame loop | SPEC 8／11 | Phase5／10、F09／10 |
| 36 | Visual QA | SPEC 15 | Phase12／13 |
| 37 | Poster→WebGL | SPEC 12 | Phase6／13、V02 |
| 38 | Performance QA | SPEC 13.3 | Phase10、P01 |
| 39 | Real mobile／WebKit | SPEC 15 | Phase12 |
| 40 | Accessibility | SPEC 8／14 | Phase11、A01–A04 |
| 41 | Audio | SPEC 14 | Phase11、A05 |
| 42 | Landing preservation | SPEC 0／1／4 | Phase4／12、R05／08 |
| 43 | Do not overdesign | SPEC 0.3／10 | Phase3／6／8 |
| 44 | Signature moment | SPEC 7.5 | Phase7、V03 |
| 45 | 13 implementation phases | 本PLAN 1–13 | 各phase退出條件 |
| 46 | Testing | SPEC 15 | 本PLAN 15／16 |
| 47 | Final acceptance | SPEC 15.3 | Phase13／本PLAN19 |
| 48 | Final report | SPEC 15 | 本PLAN18 |

## 18. 未來最終報告模板：18項

每個欄位必填；未知／未測用明確狀態，不以估算填實測欄位。

1. **Repository findings**：框架、受影響路由與provider、原有優點、基線問題、保留項目；附來源路徑。
2. **Three concepts**：A／B／C摘要與比較；附草圖／估算，標明未製作的方案。
3. **Selected concept**：為何選A，實際相對SPEC的改動與理由。
4. **Route／product architecture**：Intro、Landing、query、session、deep-link、Back、SSR／canonical實測結果。
5. **Blender asset strategy**：版本、來源、生成入口、node／origin／clip契約、材質與貼圖決定。
6. **GLB optimization**：raw→final大小、工具／參數、validator結果、動態hierarchy與視覺保持證據。
7. **Cache／versioning**：asset release、hash／manifest、headers、SW、舊版本相容与回退。
8. **Frontend architecture**：client/server界線、lazy import、state機、資源owner、quality與cleanup。
9. **Intro→Landing transition**：實際duration、early Enter、skip、reduced、失敗保底與focus。
10. **Little Red signature moment**：實際時間線、路徑與輪速、懸吊／致意方式、錄影。
11. **Desktop／tablet／mobile**：相機、safe-area、文案排版、品質差異、實際viewport截图。
12. **Performance measurements**：以下量測表逐裝置／tier填寫，不混合條件。
13. **Accessibility**：keyboard、VoiceOver、axe、contrast、zoom、pause、reduced motion結果。
14. **Fallback**：F01–F13情境的pass／fail與截圖、請求是否停止。
15. **Tests run**：命令、版本、exit code、覆蓋與未測／既有失敗；對應矩陣ID。
16. **Files changed**：按產品用途歸組列路徑，模型／來源／測試／文件分明；記生成檔與lockfile變更理由。
17. **Known limitations**：影響、重現條件、暫時處理、是否阻擋發布；特別列無真機或無field INP。
18. **Highest-value future improvements**：按使用者收益排序，列成本／依賴；不把未完成的必要驗收當作可選未來功能。

### 18.1 性能報表欄位

| 類別 | 必填欄位 |
|---|---|
| 情境 | artifact／commit／diff hash、日期、OS、browser精確版、device／GPU可得資訊 |
| 視窗 | viewport CSS px、device DPR、render DPR、quality tier、方向 |
| 條件 | cold／warm、network／CPU throttle、供電／低耗電、取樣區間、次數 |
| Payload | 總初始JS、Intro增量JS、lazy3D JS、GLB、poster、texture；raw／gzip／wire分列 |
| Renderer | FPS median／p10、frame-time p95、主pass／shadow calls、visible triangles |
| UX | LCP、CLS、Enter event timing、long tasks、INP（field或明確未測） |
| Lifecycle | hidden／paused frame count、idle work、5次往返heap／resource計數 |
| 比較 | baseline、candidate、差異、目標、pass／fail、量測限制 |

## 19. 完成門檻、風險與回退

### 19.1 發布前檢查表（未來執行）

- [ ] Intro不是內容目錄，Landing原有故事／遊戲／地圖與浮動小紅保留。
- [ ] Enter在SSR／poster／loading／live／error全部可用；不強制等待。
- [ ] 首頁、deep link、Back、repeat visit、storage blocked不回圈。
- [ ] 原創場景有小紅問候、慢輪、暖窗、前庭與有意義的負空間。
- [ ] 桌面／手機poster與live構圖、色彩、尺度一致。
- [ ] GLB／poster／manifest完整且版本一致；硬預算通過。
- [ ] pause、reduced motion、keyboard、VoiceOver、zoom可用。
- [ ] hidden／idle／離頁不浪費渲染；反覆進出不線性洩漏。
- [ ] 現有專案驗證完成並分類所有失敗；真機限制如實記錄。
- [ ] 18項報告、素材來源、測量條件、證據與回退方案齊備。

### 19.2 主要風險處理

| 風險 | 偵測方式 | 首選處置 |
|---|---|---|
| 首次client redirect閃爍／SEO影響 | 慢速錄影、SSR與rendered HTML | 優化輕量判定；保留內容，必要時暫停自動邀請 |
| 上線版本引用缺檔 | manifest與所有URL實際fetch | 阻止新版引用上線，完成同版產物 |
| 上線資產無法由source重建 | 實跑build.py並比對hierarchy | 修build.py使其產出與上線版本一致，不改資產遷就腳本 |
| 優化破壞pivot／眼睛 | validator＋node assert＋四角度圖 | 限制join／simplify範圍，恢復語意hierarchy |
| 手機發熱／掉幀 | 真機長時間、frame timing | 關shadow／secondary motion，降DPR，再fallback |
| Poster亮度或構圖跳變 | ready前後anchor比對 | 同renderer重產兩構圖poster |
| Session loop／Back不自然 | R01–R12 | 使用replace與enter query保底，儲存失敗留內容 |
| 動態過長無法停止 | A04／F10 | 加pause；若不加則≤5秒停止 |
| 回歸Landing功能 | baseline／public smoke | 局限route-aware改動，移除Intro耦合 |
| Scope膨脹 | phase退出審查 | 刪煙霧／額外物件與新依賴，回到核心問候 |

### 19.3 回退策略

功能回退首選停止首頁自動邀請，保留`/`內容與`/intro`靜態出口；必要時Intro只顯示poster。不得為停用動畫刪除Landing路由或故事快取。

資產回退需程式引用與manifest一起切回已知完整release；不能只換單一GLB留下不匹配poster。已發布immutable目錄不覆蓋、不立即刪除舊版本。部署回退依實際平台保留舊部署；驗證root、story、game、map及Enter仍正常。

### 19.4 工作量規劃

以一位熟悉此repo且能做Blender的工程／美術工作者估算，Phase1–3約1–2工作天、Phase4–6約2–4天、Phase7–9約2–3天、Phase10–13約2–4天，合計约7–13工作天。這是範圍估計，不是交付承諾；真機取得、現有baseline失敗和美術迭代可能延長。若需壓縮，先移除選配煙霧／secondary motion，不刪除fallback、可及性、路由或必要QA。
