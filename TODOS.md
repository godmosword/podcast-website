# TODOS

> **成長主戰場（2026-06 共識）：** **A** Spotify／Apple 平台收聽與訂閱 · **B** Threads／IG 短內容導流。
> 官網定位：每集可分享的落地頁 + 訂閱轉換中心；「看圖聽故事」為差異化體驗，不與平台搶完整收聽。
>
> **產品主戰場（2026-06 STEM roadmap）：** 互動故事 × 車車 STEM 實驗室；詳見 [產品路線圖](#產品路線圖互動--stem--商業)。

> 格式：每項一段，行末標 `優先序 · 工時(人工) · 依賴`。工時 S/M/L。
> **紀律：** 條目打 ✅ 時必須附 commit hash。
> **資料基準（2026-07-29）：** `storiesByNewest()` **23 集**、最新 **`ep-23`**（2026-07-28）。
> **出圖落後：** 多頁插圖 **23/23** 集（含 **`ep-23`（26 頁）**）；最新全幕含 **`ep-21`（18 頁）**／**`ep-22`（24 頁）**／**`ep-23`（26 頁）**。
> 完整逐字稿與 episode FAQ 覆蓋皆 **23/23**（`verify:geo`）。`data/games.ts` 見下表。
>
> **現役遊戲（canon，對齊 `data/games.ts`）：** `candy-match` 繽紛消消樂 · `block-drop` 繽紛樂園 · `coloring-book` 繪本著色。
> **歷史 slug：** `kart`／`pirate-kart`／`car-star`／`car-mission` 已退役，見 [archive](./docs/archive/TODOS-completed-2026-07-11.md)。

> **商業化切割（2026-07-17）：** 本輪先完成不依賴會員身份的資產、通知、量測與依賴穩定化；家長會員帳號、會員 entitlement、訂閱付款與 Stripe 明確保留在 [STEM-P4 商業化](#stem-p4--商業化) 待辦，不在本輪誤做半套付費牆。

---

## 現役隊列（2026-07-11）

> **加強優先序（2026-07-16）：** 見 [docs/STRENGTHENING-PRIORITY.md](./docs/STRENGTHENING-PRIORITY.md)（對齊本檔 UX-P0-1／UX-P1-5／LIST-2／P3，不另開任務系統）。
>
> 單一執行優先序；詳情連結各章。Growth-P1a/b、LIST-2、MAP-UX-P1 已於本日收尾。

| # | ID | 類型 | 工時 | 狀態 |
|---|-----|------|------|------|
| 1 | [UX-P0-1](#兒童-ux-與親子互動稽核2026-07-11) 家長閘門 | trust | M | 待做（待決策） |
| 2 | [UX-P1-5](#兒童-ux-與親子互動稽核2026-07-11) 全站 e2e | eng | S | 部分完成 |
| 3 | [UX-P0-4](#兒童-ux-與親子互動稽核2026-07-11) challenge 遊戲提示 | trust | S | ✅ `1c1ca1b` |
| 4 | [Growth-Measure-1](#growth-measure-1-成長量測) SoundOn 回鏈 | ops/growth | S | ✅ `42a9d38` |
| 5 | [UX-P1-2](#兒童-ux-與親子互動稽核2026-07-11) 詳情頁反思收合 | ux | S | ✅ `42a9d38` |

### 宇宙巢狀導覽（M0–M3）

> URL 為導覽唯一來源：世界地圖 → `/adventures/[zone]`。座標 0–1（runtime 轉 px）。

- [x] M0 `data/universe.ts` 單一資料來源 + zod 驗證  `02f2a51`
- [x] M1 `/adventures/[zone]` 路由 + `targetFor()` 相機  `e00483f`
- [x] M2 `@modal` 熱點層 + focus 管理 + prefetch  `e915355`
- [x] M3 逐島填 hotspots（恐龍島優先）  `5c6784a`

### 小車呈現定版（2026-07-28）

- [x] 設計 spec：[宇宙地圖小車呈現定版](#宇宙地圖小車呈現定版2026-07-28)  `130d776`
- [x] LOD 純函式＋資料 idleSpot／每島一台招牌  `4df55fc` `748e760`
- [x] useRoamerSim idle／joyride／crossing  `0206042`
- [x] 層接 LOD＋關巡邏＋稀有跨島  `ddeed40`
- [x] Art Bible §12.8／TODOS 對齊  `8ce39f6`

### 本輪已完成（2026-08-16）

| ID | 說明 |
|----|------|
| fix(for-parents): play-map 補場館 DOM 錨點與選中 marker z-index | `3cd2ffa` |
| polish(pages): 角色圖鑑／親子指南拿掉 SiteHeader hero，改緊湊頁首；家長工具上移、Threads 改細長 callout | `b790677` |
| refactor(for-parents): play-map 針旋轉建 `--pin-rot` SSOT，補 museum 基座、zoo 耳角、`aria-label` 分隔符 | `eb57176` |
| test(data): 修掉逼出「場內有…」尾句的 tips 契約（73 筆全中、47 筆依賴尾句），並擋佔位字串 | `6a7d39f` |
| feat(for-parents): play-map 休園標記（`status`）、17 筆家長筆記改寫、嘉義 9 筆（13 縣市 82 處） | `e4f7076` |
| fix(for-parents): 覆蓋不計休園場館，補桃園第 9 筆（祥儀機器人夢工廠）恢復 Wave 1 達標 | `b1bf63c` |
| docs(editorial): `tips` 品質標準取代字數門檻，記錄 CRITICAL-1 決議與 56 筆改寫 backlog | `981bb09` |
| feat(data): Wave 3 台南 7 筆＋高雄 6 筆入庫（15 縣市 95 處、室內 32 筆；台南 7/8、高雄 6/8 為 partial） | `c9b3f33` |
| fix(a11y): reduced-motion 保留選中態靜態位移；zoo 剪影角改 stroke ≥2 單位並加吻部 | 見本 commit |

### 本輪已完成（2026-08-15）

| ID | 說明 |
|----|------|
| polish(for-parents): play-map 篩選條件徽章、結果標頭與卡片「查看家長筆記」CTA | `3c10938` |
| content(subtitles): ep-25 字幕校對 + `--mark`（刪幻覺／重複、補漏句、專名） | `6d50696` |
| fix(ci): 恢復 `@testing-library/dom` 直接依賴（#82 GHA sync `npm ci` 缺 RTL peer） | 見本 commit |
| fix(config): play-map 定位解封（`Permissions-Policy` 改 `geolocation=(self)`；原 `()` 讓「離我最近」線上全失效） | 見本 commit |
| perf(for-parents): play-map 網址同步改 History API（每次篩選少一次 ~51KB RSC 往返，5 個 prop-sync effect 併為 1） | `bf8b841` |
| docs(agent): 補 slug 對照表 SSOT 缺口（新增 grok CLI 備援列＝`grok-4.6`）、備援觸發含認證失敗、契約測試改無條件斷言 | `fd65c16` |
| feat(for-parents): play-map 地圖針改色相＋剪影雙重編碼（七類型母題對齊卡片 plate，固定深墨過 WCAG 3:1） | `a724197` |

### 本輪已完成（2026-08-14）

| ID | 說明 |
|----|------|
| chore(debt): Wave B 代碼瘦身（knip SSOT、列名死碼、RTL 直接依賴、OG race） | 見本 commit |
| polish(for-parents): play-map 字階／卡片 plate／map-chip 遷移 | `8b13f20` |
| feat(for-parents): play-map 一列篩選與家長筆記 | `36204c6` |

### 本輪已完成（2026-08-13）

| ID | 說明 |
|----|------|
| polish(for-parents): play-map 具名導航、類型場景帶與選中針場館名 | `dedf98c` |
| fix(data): play-map 三筆場館錯置與 mapsQuery／placeId 契約 | `01ace1c` |
| chore(data): play-map 場館名人工複核 | `f277e89` |
| fix(data): play-map 清除地址「附近」 | `bfa10db` |
| fix(for-parents): play-map FitBounds 不再被 parent 重繪拉回鏡頭 | `0a150bd` |
| fix(for-parents): play-map 定位鏡頭框最近 8 筆、地圖分頁保持掛載 | `2b755c0` |
| fix(data): play-map name／mapsQuery 身分與導航分工（湖口、南寮） | `f80a0ff` |
| fix(for-parents): play-map FitBounds 納入 splitLayout、zoomend／moveend 清旗標 | `169a027` |
| chore(data): play-map city／地址用「台」、場館官名用「臺」（麗寶維持一針） | `2644dd8` |
| feat(for-parents): play-map 詳情 sheet 顯示 coverageNote | `bd338d9` |
| polish(for-parents): play-map coverageNote 對比、南寮欄位歸位與 compact CTA e2e | `d5c0734` |
| refactor(for-parents): 移除 FitBounds 不可達的 userMoved／programmatic 旗標 | `4fd54f8` |

### 本輪已完成（2026-08-12）

| ID | 說明 |
|----|------|
| polish(for-parents): play-map 桌面並排、類型色塊、縣市聚合、chip 分級與精簡 sheet | `bfc4e11` |

### 本輪已完成（2026-08-09）

| ID | 說明 |
|----|------|
| feat(for-parents): 親子遊樂地圖 `/for-parents/play-map`（Leaflet + 桃園示範資料） | `32aad0d` |
| polish(for-parents): play-map Google Maps dir 導航 URL（免 Key）＋只顯示位置備案 | `4e41587` |
| feat(for-parents): play-map Wave 0（行動「親子景點」、工具卡、UI 重設、schema／query） | `8847fbe` |
| feat(for-parents): play-map Wave 1 北北基桃覆蓋達標（coverage tier） | `3114164` |
| feat(for-parents): play-map Wave 2 竹苗中彰投雲覆蓋達標（coverage tier） | `9a85e44` |
| polish(nav): 親子景點進桌面 Top bar（路徑維持 `/for-parents/play-map`） | `056c2df` |
| polish(for-parents): play-map 簡潔工具頁（卡片｜地圖互斥＋chip 篩選） | `296fe0e` |
| polish(for-parents): play-map UX 精煉（compact／SSR／主題樂園／摘要） | `08ec732` |
| fix(data): play-map 收費旗標、死連結與 editorial 契約（含 RETIRED_DOMAINS 回歸防護） | `5b4a37e` |
| feat(for-parents): play-map 無障礙、網址狀態與 SEO 修復（nested-interactive／SSR 73 筆／ItemList） | `4b99f6c` |
| feat(for-parents): play-map 意圖優先改版（意圖 chips、縣市可選、sticky 篩選、決策標籤卡片、精簡 sheet） | `ad189d5` |
| refactor(for-parents): play-map 版面重構（1001 行拆 6 元件＋hook、意圖 3 顆、條件 facet、卡片分批 24／DOM 恆 73） | `2162dd6` |
| content(subtitles): ep-24 字幕校對 + `--mark`（重轉錄補尾段、刪幻覺／重複） | `0c4ccf6` |
| content(characters): ep-24 hero 定裝「小紅賽車年幼版」「小紅賽車的爸爸年輕版」（API 2 次） | `0c4ccf6` |
| feat(stories): ep-24 全幕 19 頁插圖 approve（分齡定裝、#15–17 重抽） | `79ca151` |
| fix(stories): ep-24 #12–13 爸改終點旁側（非賽道中央） | `2be9cb5` |
| polish(nav): 育兒專欄整併進 `/for-parents`（導覽家長入口只留一項）；顯示名改「親子指南」；頁內加 Threads「育兒小筆記」外連卡 | `e1bc42a` |

### 本輪已完成（2026-08-08）

| ID | 說明 |
|----|------|
| fix(content): ep-24 補角色圖鑑 alsoIn（小紅賽車、小紅賽車的爸爸） | `00fefee` |
| chore(games): 著色線稿管線硬化（character／scene 分流 prompt、構圖 edgeIou gate、審核清單；**未重產 PNG／未呼叫生圖 API**） | `67020ba` |
| polish(universe): 手機地圖溫和放大（PORTRAIT_MAX_ZOOM=1.15）＋IslandPickerStrip＋tile hit pad | `18ac8d6` |
| content(games): 著色 scene 四頁重產上線（9／3／6／16；API 4 次；character Wave 2 仍 Out） | `60c1e0d` |

> **著色下輪：** Wave 1 scene 四頁已重產並 `--approve`（`scene-ep-9-05`／`3-05`／`6-05`／`16-05`）。**Wave 2 character 四張仍 Out**，須另文字准許 API 後才重產。

### 本輪已完成（2026-07-30）

> 手機宇宙地圖：嚴格 contain + fit 扣 chrome（方案 E）。詳見 [CHANGELOG.md](./CHANGELOG.md) `[Unreleased]`。

| ID | 說明 |
|----|------|
| MAP-MOBILE-CONTAIN | `PORTRAIT_MAX_ZOOM` 1.5→1：直向不再為填高而橫切外側島 | `37e42eb` |
| MAP-MOBILE-CHROME | `fitAvailableViewport` 扣 MapControls 右／下 inset；`fitScaleFor`／`fitScaleForBox` 共用 | `37e42eb` |

### 本輪已完成（2026-07-30 · PLAY-IA）

> 接手 Claude 遊戲升級審修殘留（PR #52 已合入 main，不做 port）＋ PLAY-IA-6／7／8。詳見 [CHANGELOG.md](./CHANGELOG.md) `[Unreleased]`。

| ID | 說明 |
|----|------|
| chore: 確認 `claude/theme-park-game-assessment-ivvwoo` 四筆審修已 cherry-pick 進 main（PR #52）；遠端殘留 ref 已不存在／已 prune | `4224442` |
| PLAY-IA-6 | 方塊／大冒險暫停層補「回遊樂園」 | `4224442` |
| PLAY-IA-7 | sticky 抬頭與 GameHost 工具列合成單列（portal + chrome slot） | `4224442` |
| PLAY-IA-8 | 沉浸遊戲頁抬頭掛 ThemeToggle iconOnly | `4224442` |

### 本輪已完成（2026-07-29）

> 宇宙地圖召喚式探索抽屜＋鎖島減法（移除 `LockedIslandBubble` legacy）。詳見 [CHANGELOG.md](./CHANGELOG.md) `[Unreleased]`。

| ID | 說明 |
|----|------|
| feat(universe): 召喚把手「來這裡逛逛」＋非模態探索抽屜（`?sheet=1`） | `cc299b4` |
| feat(universe): 島星章滿星 chip 進場里程碑 | `cc299b4` |
| chore(universe): 刪除 `LockedIslandBubble` 及契約測（生產零引用） | `cc299b4` |
| docs: DESIGN 元件規格補探索抽屜／召喚把手 | `cc299b4` |
| fix(universe): 召喚抽屜 scrim／焦點／h1／glyph／次層捲動（Opus 必修） | 見本 commit |

### 本輪已完成（2026-07-27）

> 正式站 `/adventures` 實測五點回饋（點島未置中／島上文字擺放／夜間縮放鍵融背景／
> 白色對話框看不清／探險小抄無意義）。詳見下方
> [宇宙地圖回饋修正](#宇宙地圖回饋修正2026-07-27)。

| ID | Commit |
|----|--------|
| fix(universe): 進島焦點改島圖視覺中心（`islandFocus`）＋`fitBox` 夾縮放；再點同島回世界層 | `01b4b07` |
| polish(universe): 探索點標籤／詳情視窗重排字階；標籤反縮放（命中區固定 48px）＋下半島翻上 | `01b4b07` |
| fix(universe): 地圖 chrome `--map-chip*` token（日夜不反轉）——修夜間縮放鍵融背景、鎖島泡泡白字壓白底 | `01b4b07` |
| refactor(universe): 刪除探險小抄面板，`aria-describedby` 改 sr-only 操作說明 | `01b4b07` |
| chore(quality): 清掉 19 個既有 lint warning，`npm run lint` 回到 0（未動 eslint 設定） | `01b4b07` |
| fix(a11y): `RelatedStories` 單集色改底線裝飾＋`--accent-ink`（夜間 2.2:1 → AA）；`GameHost` canvas 補 `role=img`／`aria-label` | `01b4b07` |
| test(universe): 島名木牌 e2e 改測真不變式（垂直完整／不重疊／層深）＋ `LABEL_SCREEN_PAD` 修手機木牌裁切 | `01b4b07` |
| test(visual): 重產 `adventures-*` 四張基準（刪小抄＋奶油鈕＋新構圖） | `01b4b07` |

### 本輪已完成（2026-07-26）

| ID | Commit |
|----|--------|
| feat(games): Hub 主打卡＋GameEndStation 下一站動線 | `5cb3fc6` |
| feat(car-adventure): clay material catalog + sprite polish | `3707cf8` |
| feat(candy-kart): clay material catalog + curve ground stick | `f1652e8` |
| feat(snowboard): rebuild visual presentation（材質／QA 景別） | `b8e8238` |
| feat(snowboard): clay material catalog + visual QA contract（軌道 A） | `5a623ef` |
| feat(snowboard): Bonbon character textures + face detail | `38453aa` |
| feat(gamekit): migrate candy-match to GameAdapter（PR #66） | `ceb92f4` |
| feat(gamekit): migrate car-adventure to GameAdapter（fixedUpdate + render） | `e0d9766` |
| feat(gamekit): migrate block-drop to GameAdapter | `98a6944` |
| feat(gamekit): migrate candy-kart to GameAdapter（iframe） | `6ee3c69` |

### GameKit Adapter 遷移

> 契約：[`docs/GAMEKIT-ADAPTER.md`](./docs/GAMEKIT-ADAPTER.md)。紅線：不改 localStorage／`reportGameSession` payload／GameKitGameId；Candy Kart postMessage dual-accept。

| Phase | 遊戲 | 狀態 |
|-------|------|------|
| 1 | candy-match | ✅ `ceb92f4` |
| 2 | car-adventure | ✅ `e0d9766` |
| 3 | block-drop | ✅ `98a6944` |
| 4 | candy-kart（iframe bridge） | ✅ `6ee3c69` |

### GameKit 手感票

> 票模板：遊戲／裝置／步驟／預期／實際／嚴重度 C\|H\|M\|L／重現。只修 C/H；M/L 僅記票。PR-B／PR-C 另授權。

| ID | 嚴重度 | 狀態 | 說明 |
|----|--------|------|------|
| GK-TOUCH-A | — | ✅ `38c9b6a` | **PR-A**：TouchControls capture、CandyMatch capture＋cell≥48、BlockDrop capture cleanup、契約測／docs |
| GK-GODOT-FOCUS | C | 📋 下一輪 PR-C | candy-kart 補 focus-out 暫停；兩款 Godot 暫停／失焦時清 `touch_*` 旗（防黏鍵）。需 source＋re-export 同 PR |
| GK-PLAYTEST | — | 📋 模板 | 有票才開 PR-B（car assist）／其餘 C/H |

### 本輪已完成（2026-07-25）

| ID | Commit |
|----|--------|
| refactor(universe): M0 `data/universe.ts` 單一資料來源 + zod | `02f2a51` |
| feat(universe): M1 `/adventures/[zone]` + targetFor 相機 | `e00483f` |
| feat(universe): M2 熱點座標層 + @modal + prefetch | `e915355` |
| feat(universe): M3 五島填滿 hotspots（恐龍島優先） | `5c6784a` |
| polish(universe): 主島小紅走 car-park 步道（單車）；map 層關 bob／bank；海面不復辟 | `0f44f7c` |
| fix(universe): P1 島路由接上 sitemap／llms-full／geo contract | `03e3e7c` |
| fix(universe): P2+P3 useMapCamera isMeasured + skipEntryAnimation | `97ba2a2` |
| fix(universe): P4+P5 cache() 與島頁 sr-only 專屬化 | `4235fc1` |
| fix(universe): A 修正 reset 目標為島群中心 | `86f043d` |
| fix(universe): B flyTo durationMs 參數化，雙擊縮放 250ms | `6665989` |
| fix(universe): C sheetReady 閘門，選單等待鏡頭飛抵 | `ae76480` |
| feat(universe): 減法點島改飛鏡頭＋探索點，不再自動開選單 | `87c7359` |
| refactor(universe): 飛行時長改 van Wijk 距離推導；world preset 型別化 | `2158f2a` |

### 本輪已完成（2026-07-24）

| ID | Commit |
|----|--------|
| fix(sync): git add 白名單補 `data/audio-lengths.json`（prebuild 產物，防 #61） | `8e20029` |
| test(sync): prebuild↔whitelist 閉環契約＋禁 Production build `INDEXNOW_KEY`（方案 B） | `48ce0cf` |

### 本輪已完成（2026-07-23）

| ID | Commit |
|----|--------|
| polish(universe): 鎖島 `childHint` 短句＋「去聽車車故事」主 CTA；ZoneSheet 關閉鈕 48px | `f915325` |
| polish(universe): session 首訪「點一座島看看」＋ StrictMode 門閂；MapGuide「鍵盤也可探索」（`pointer:fine`） | `f915325` |
| test(universe): e2e／smoke 對齊兒童極簡（tap hint／鎖島 CTA／關閉鈕契約） | `f915325` |

### 本輪已完成（2026-07-22）

| ID | Commit |
|----|--------|
| polish(story): 單集 Hero 介紹卡精緻化（intro↔cover 間距／較窄寬度；夜態 glass＋去 warm glow；ZoneBadge 夜態降噪） | `8a89f1c` |
| polish(story): 訂閱 CTA＋家長安心／隱私整合進頁尾（中段拿掉；ConnectHub campaign UTM；meta 加隱私說明） | `8a89f1c` |
| polish(story): 單集頁精簡 A——共讀／活動／指引遷 /for-parents#co-listen；FAQ 收合；角色一行；接著聽併 RelatedStories | `8a89f1c` |
| polish(nav/story): 角色圖鑑掛頂欄；單集頁刪常見問題 UI（保留 FAQPage JSON-LD）；修 ZoneBadge／tags 重疊 | `ea10a3a` |
| polish(footer): 家長安心訊號併入頁尾隱私列（拿掉獨立 ParentTrustStrip 卡） | `ea10a3a` |
| fix(content): ep-18/19/21 補角色 alsoIn；ep-10 補 tags（單集頁版面對齊） | `ea10a3a` |
| polish(landing): stories hero 拿掉「3–7 歲親子 Podcast · 每集約 5–10 分鐘」副標 | `18fd027` |
| polish(nav): 家長指南下拉改直連；關於／聯絡移頁尾；移除 framer-motion 死依賴 | `d99ebe2` |
| test(landing): LandingSegment 副標移除後對齊斷言（不期望 5–10 分鐘） | `d99ebe2` |
| [LEGAL-1](#法務隱私強化2026-07-22) security: 全站瀏覽器安全標頭（nosniff／Referrer-Policy／Permissions-Policy／X-Frame-Options／CSP frame-ancestors；HSTS 限 prod）＋ `next.config.test.ts` 契約 | `fdbe8c9` |
| [LEGAL-2](#法務隱私強化2026-07-22) security: 同意留痕（`lib/legal-policy.ts`＋`consent_version`／`consented_at`；migration 005 `IF NOT EXISTS`、舊資料不回填） | `fdbe8c9` |
| [LEGAL-3](#法務隱私強化2026-07-22) security: 資料最小化，訂閱／許願不再收集儲存 `user-agent` | `fdbe8c9` |
| [LEGAL-4](#法務隱私強化2026-07-22) docs: `/legal` 擴充（侵權通知／投稿／第三方處理者／兒少與家長／安全變更）＋ DISCLAIMER／llms.txt／表單同意句同步 | `fdbe8c9` |

### 本輪已完成（2026-07-20）

| ID | Commit |
|----|--------|
| chore(debt): P0–P2 VIS-DEBT／lint／TODOS hash 慣例＋block-fable 誤擋修復 | `0ddcc26` |
| chore(agents): Fable 5 禁令＋`block-fable` hook 硬擋 | `5bf10b8` |
| feat(landing): 尾頁 meta 安靜化＋頂欄 footer 防透字（`data-nav-solid`） | `6511d08` |
| [VIS-W0](#視覺升級2026-07-20agent-plan-三審) fix(a11y): StoryCard／LatestHero 對比＋reduced-motion＋觸控高度 | `fd401a7` |
| chore(agents): active 路由移除 Fable 5，Claude Code Leader 一律 Opus 4.8（含契約測試負向斷言） | `e9225da` |
| [VIS-W1](#視覺升級2026-07-20agent-plan-三審) fix(a11y): `--accent-ink` 修 accent 文字對比 + 字階 token 收斂（a11y e2e 7/9 → 9/9） | `5e46965` |
| [VIS-W2](#視覺升級2026-07-20agent-plan-三審) feat(ux): 故事卡「已聽完」星章（語彙對齊地圖）＋著色本進行動導覽探索組 | `75133f1` |
| [VIS-W3](#視覺升級2026-07-20agent-plan-三審) feat(design): 陰影高度階梯 elev-1/2/3、精選卡浮於目錄、修死碼 hover、CTA gloss | `2f646b8` |
| [VIS-W4](#視覺升級2026-07-20agent-plan-三審) fix(type): 全站關閉字重合成、中文標題去假粗（Baloo 補真 800） | `38392ab` |

### 本輪已完成（2026-07-19）

| ID | Commit |
|----|--------|
| feat(design): 夜間暖夜靛 token＋行動選單質感（emoji 降飽和、搜尋浮層、頂欄銜接） | `8a14f8d` |
| feat(nav): 夜間漢堡開啟時頂欄微暗銜接面板（data-menu-open） | `96c90ae` |
| feat(universe): 縮放 rAF 批次＋島 memo 隔離（CSS --map-scale） | `a34f5b7` |
| feat(universe): ZoneSheet 兒童首屏極簡＋T3b 鏡頭視覺外置（縮放順暢） | `b2ba0a3` |

### 本輪已完成（2026-07-18）

| ID | Commit |
|----|--------|
| docs(agent): Leader→Grok High Fast；對抗審／L1／L2→Composer；Cursor＋Claude Code 命令與契約測試對齊 | `0e261fd` |

### 本輪已完成（2026-07-17）

| ID | Commit |
|----|--------|
| feat(design): Apple 視覺原則升級—克制 chrome 與柔層次（DESIGN.md v0.2；Landing／stories／單集／內容頁） | `306b989` `7fd7d27` |
| fix(agent): 專案層禁用 AskQuestion／AUQ（hook + alwaysApply 規則，防阻塞卡住） | `ceeddc0` |

### 本輪執行隊列（2026-07-17）

| ID | 範圍 | 狀態 |
|----|------|------|
| ASSET-P2 | 音檔 URL 從 repo 路徑抽象成可切換的外部音檔 origin；保留本機 fallback | ✅ `25be373` |
| TRUST-P2 | 新集通知 double opt-in（不等同會員登入驗證） | ✅ `25be373` |
| Growth-Measure-2 | 播放開始／遊戲進入／遊戲完成事件，維持無 PII | ✅ `25be373` |
| INFRA-P2 | 移除 production 對 React canary ViewTransition 的依賴，回到 stable React | ✅ `25be373` |
| CONTENT-P2 | 音檔路徑、RSS、JSON-LD、Landing 與同步／驗證流程使用同一資產契約 | ✅ `25be373` |

### 本輪已完成（2026-07-16）

| ID | Commit |
|----|--------|
| refactor(cleanup): Wave A 代碼瘦身（刪 `GameThumbArt`／`runtime/style`／`tileset-draw`；收斂 games／car-adventure／og 內部 export；修 GAMEKIT-ARCHITECTURE） | `c440d62` |
| fix+refactor(games): 車車大冒險入口 CTA 移出 canvas 裁切＋模組拆分＋封面刷新 | `ccf0fde` |

### 後續（代碼瘦身）

- **Wave B（opt-in）** ✅ 見本 commit：knip 單一來源（`knip.json`；`package.json#knip` 已刪）；刪 `PlayMapLoader`／`chip-scroll`／退役 kart／snowboard iframe CSS；拿掉 `@testing-library/dom` 直接依賴；OG 去掉 test-only `race`。**未**抽 BackLink、**未**拆大檔、**未**動「找一找／溫柔探索」。`TILE_*`／宇宙常數不動。
- **Wave C（另 `/agent-plan`）**：BackLink／遊戲 CTA 抽共用／大檔拆分 — **維持不做**（STRENGTHENING-PRIORITY 明確不做；2026-08-14 委員會否決掛在 Wave B）。開工前仍須先決策「找一找」vs「溫柔探索」文案。

### 本輪已完成（2026-07-15）

| ID | Commit |
|----|--------|
| feat(games): 繪本著色 hero cover 黏土世代對齊（generate:coloring-cover＋卡片層） | `a8451d0` |
| feat(games): 繪本著色封面開場＋線稿閉合重產（Track A/B） | `f1eb44d` |
| fix+feat(games): 著色本塗色不可見修正（multiply 合成）＋引擎硬化（筆觸效能／dirty-rect undo／IndexedDB 草稿）＋手機 UX（筆刷三檔／雙指縮放／游標圈／原圖換角） | `081679f` |
| feat(games): 線上繪本著色 MVP（`/games/coloring-book`，與 STEM-P3 PDF 分開） | `036cb4e` |
| test(sync): catalog sidecar 紅線契約（upsert 呼叫＋git add＋完備測試對齊，#46） | `125664b` |
| fix(sync): catalog sidecar 自動補齊，解除 ep-19+ 被 npm test 擋 push（#46） | `5f9371c` |

### 本輪已完成（2026-07-14）

| ID | Commit |
|----|--------|
| fix(deploy): feed.xml 禁 runtime public fs；enclosure → prebuild audio-lengths；紅線 `verify:no-public-fs` | `dccaf0a` |

### 本輪已完成（2026-07-12）

| ID | Commit |
|----|--------|
| Deploy OG 字型 build ETIMEDOUT | `cbef737` |
| 行動版導覽抽屜 + `/stories?q=` 搜尋 | `d28b392` |
| 頂欄 IA（無「更多」；主列含宇宙地圖／育兒專欄；家長指南下拉；斷點 980px；docs T4） | `6922d2e` |
| Agent 工程模型路由 Luna MAX fast | `847a64a` |
| Agent 框架改進（Grok high、契約測試） | `f31cbfe` |

### 本輪已完成（2026-07-11）

| ID | Commit |
|----|--------|
| UX-P0-2／UX-P0-3 | `964f418` |
| MAP-UX-P1a/b/c、P2a、MAP-ROAM-doc | `80457c4` |
| Growth-P1a／P1b | `eafe30a` |
| Growth-Measure-1a 模板、1b UTM | `6ca8263`、`797de82` |
| LIST-2 email 訂閱 | `6ca8263` |

### 待決策隊列（不進 Top 5）

- **UX-P0-1** 家長閘門範圍（dashboard only vs 含 GameKit）
- **UX-P0-4** challenge 遊戲提示：~~僅文案 vs 隱藏入口~~ → **已採僅文案**（challenge 卡顯示家長陪同提示，不隱藏入口）

### 封存索引

- GEO／地圖完成大段 → [docs/archive/TODOS-completed-2026-07-11.md](./docs/archive/TODOS-completed-2026-07-11.md)
- 2026-07-04 前完成項 → [docs/archive/TODOS-completed-2026-07-04.md](./docs/archive/TODOS-completed-2026-07-04.md)

---

## 視覺升級（2026-07-20，`/agent-plan` 三審）

Plan 經 Codex 工程審 + Grok 對抗審 + Opus 設計審**三審退回修訂**：原 Draft 有三成事實錯誤（封面 `contain` 實為 no-op、stagger／`story.color` 系統／`reflection-prompts`／車種 icon 皆已存在），已刪除。倖存範圍如下。

### VIS-W0　`a11y · S · 無`　✅ `fd401a7`

三項既有違規（非新功能）：`story.color` 不再當前景字色（12 色票 11 個不過 AA，最差 1.93:1 → 修後 10.8–11.8:1）；`prefers-reduced-motion` 補 `:active`／`transition`；`.cta` 37px → `min-height: 48px`。

### VIS-W1　`design · M · VIS-W0`　✅ `5e46965`

字階對齊 spec（`DESIGN.md:125` 寫 1.8–2.3rem，實作僅 1.2–1.3rem）。新增 `--fs-h1/-h2/-body/-meta`，**僅** `LatestHero`／`StoryCard`／`StoriesIndexHeader` 三處換用，不做全站機械替換。LatestHero 提權重但**維持 1:1 封面、不裁切、不壓字**（封面即故事第一頁，無安全區，裁 16:9 必切主體）。

**併入本 Wave（原 CRITICAL-1，決策 B）：** `--landing-heading: #2a9d8f` → `--warm-accent` → `--accent` 對白底僅 **3.32:1**，卻被當**文字色**用於 `for-parents/page.module.css:28,91`、`dashboard:21,46`、`subscribe:37`、`characters:20`、`story/[slug]:195,248`、`FilterSelect:112` 等 10+ 處 —— 與 VIS-W0 同根源的 token 層版本。修法：新增 `--accent-ink`（同色相壓暗至 ≥4.5:1，如 `#1f7268` ≈ 4.9:1）供文字用，`--accent` 只留給邊框／底色／裝飾。這是 `e2e/a11y.spec.ts` 兩個既有 failure（故事詳情頁、宇宙地圖 sheet）的成因，修完應轉綠。

### VIS-W2　`ux · M · VIS-W1`　✅ `75133f1`

兒童無字導航（Opus 設計審提出，對 3–7 歲主受眾 CP 值最高，原 Draft 完全遺漏）。

原定三項，實作前勘查發現 **2.1「`StoryFilter` 掛車種／主題圖示」已經存在**（`VehicleSelect.tsx:31`、`TopicSelect.tsx:22` 早已使用 `VehicleClayIcon`／`TopicIcon`），故只做兩項：

- **已聽完星章**：沿用宇宙地圖既有語彙（`ZoneSheet` 的 `⭐` + `aria-label="已聽完"`），貼封面右上角。只做「聽完」不做「聽到一半」——`continue` 是全站單一欄位，標記至多出現一張且會因改聽別集無預警消失。新增 `useCompletedStories` 集中訂閱（原本每卡各自 parse localStorage，20 張卡 = 20 次）。
- **著色本進行動抽屜「探索」組**：桌面膠囊主列維持四項。順帶修 active 判定為最長匹配獨佔（`/games/coloring-book` 原會讓「遊樂園」同時高亮、輸出兩個 `aria-current="page"`）。

> 遺留設計機會（Opus L2）：對兒童端最有效的是**封面上的大獎勵貼紙**而非小星章；目前星章的實際使用者偏向家長（決定今晚聽哪集）。可另案評估。

### VIS-W3　`design · S · VIS-W1`　✅ `2f646b8`

`--shadow-card` 拆 `--elev-1/2/3`（light+night，`--shadow-card` 反向 alias `--elev-1`，既有 9 處消費零回歸）。實作時勘查發現：

- **`--gloss` 已用於 9 處**（PlayButton/games/SiteFooter…），且兩個 landing CTA 原本**缺** gloss。故「加 gloss」實為補上離群者，非新增裝飾——加於兩個實心黏土鈕（`.playCta`/`.cta`），玻璃 `subscribeCta` 不加。
- **精選卡層級原本被拉平**：`LatestHero` 與下方 compact 列表卡同為 elev-1。升精選卡至 elev-2 建立層級。
- **兩張卡 hover 陰影是死碼**：inline `boxShadow` 覆蓋 `:hover` 規則使其永不生效（Opus 誤判只有 LatestHero，實測 StoryCard 亦然）。改 CSS custom-prop 帶色環、陰影回 stylesheet，形成階梯：列表 elev-1→hover elev-2、精選 elev-2→hover elev-3。
- **刻意不重指派** MapControls（黏土觸感堆疊陰影）、dropdown/menu（暖色調手調陰影）為中性 elev——Grok 當初「命名儀式」警告在此 codebase 成立，硬拆會抹平既有刻意設計。

> 未做（Plan 原列）：hover `scale(1.02)` 確認不做（與 `press-squash` 打架）。**iOS Safari 實機 sticky 捲動**驗證未執行——本輪未動 `.site-backdrop`／sticky 頂欄，無該風險面；留待實際觸及時再驗。

### VIS-W4　`design · S · 無`　✅ `38392ab`（方向 A，免費）

中文標題字型 A/B 實測結論：**真正的缺陷不是「huninn 不夠好」，是「假粗 huninn」**。huninn 單一字重被全站約 90 處 `font-weight:800` 合成假粗，密集字（鬱/龍/邊）內部糊團——傷初學識字兒童辨識（印證 Opus 三審警告）。

方向 A（免費、無新資產）已實作：全域 `font-synthesis-weight: none` + Baloo 補載 800。中文落回 master、去糊團；拉丁拿真 800。

> 未走的方向（若日後想要更重的標題份量）：**B** Noto Sans TC 900（`app/fonts/noto-sans-tc-og.ttf` 已在 repo，需子集化，換掉粉圓童趣）；**C** 付費圓體黑（同時要粗＋圓潤童趣，須確認 web license 可子集化自架）。A/B 比對圖與分析見本 session 對話。

### 明確不做

Draft 的 LatestHero full-bleed 16:9（需 20 集 ×2 版新資產，非計畫寫的 $0.2）、卡片塞 `reflection-prompts`（違反 `DESIGN.md:147`，且已用於 `StoryEndScreen`）、新增 stagger（已存在）、全域紙紋 noise（iOS 合成風險 + 污染宇宙地圖）、重生 filter icon（已存在）、獎項 badge（無素材來源）。

### VIS-DEBT-1　視覺 baseline 全面失效　`eng · M · 無`　已隔離

`npm run test:visual` 的 baseline 已與當前渲染環境脫節（乾淨 HEAD 上抽樣多頁全 fail）。**預設 skip**（`e2e/visual.spec.ts` 需 `VISUAL_BASELINE_TRUSTED=1` 才跑）；`npm run test:visual:trusted` 為 opt-in 重跑。刻意未盲 `--update-snapshots`。

重產／trusted 跑前須對齊 baseline 原始環境：**OS、字型版本、Chromium build**（見上方抽樣說明）。trusted 通過前勿當 CI／agent 硬閘。

**2026-07-27 修正診斷：** 「與渲染環境脫節」至少不是全貌——`home-390`（light／night）與 `home-1280-light` 在本機 trusted 跑**逐像素相符**，字型／OS 若不同不可能全等。逐頁落差（全部故事 21%、遊樂園 44%、宇宙地圖 25%、家長指南 19%、角色圖鑑 23%、關於 9%、訂閱 7%）主要是 **07-12～07-17 產基準後的 UI 演進未重新基準**。`adventures-*` 四張已重產（見[宇宙地圖回饋修正](#宇宙地圖回饋修正2026-07-27)）；其餘 8 頁待逐頁審圖重產，之後即可評估解除預設 skip。注意 `e2e/visual.spec.ts` 是 `mode: "serial"`，首個 fail 會 skip 其餘，逐頁診斷要用 `-g`。

### VIS-DEBT-2　smoke 測試比設計決策舊　`eng · S · 無`　✅ `0ddcc26`

`e2e/smoke.spec.ts` 已對齊 [DESIGN.md](./DESIGN.md) §Landing Hub：桌面膠囊與行動抽屜皆無「主題分類」（`/topic` 仍可直達）；390 開漢堡可見角色圖鑑／繪本著色。Landing 桌面 chrome 與導覽同斷點 ≥980px。

---

## 法務／隱私強化（2026-07-22）

> 對外政策以 [`/legal`](./app/legal/page.tsx)、[DISCLAIMER.md](./DISCLAIMER.md)、[public/llms.txt](./public/llms.txt) 三者同步維護；政策版本統一由 [`lib/legal-policy.ts`](./lib/legal-policy.ts) 的 `LEGAL_POLICY_VERSION` 提供。啟用資料庫時，同意留痕欄位須先跑 migration。

### LEGAL-1　瀏覽器安全標頭　`security · S · 無`　✅ `fdbe8c9`

`next.config.ts` `headers()` 為全站加 `X-Content-Type-Options: nosniff`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy`（關 camera／microphone／geolocation／payment）、`X-Frame-Options: SAMEORIGIN`、CSP `frame-ancestors 'self'`；`Strict-Transport-Security` 僅 `VERCEL_ENV=production` 附掛。`next.config.test.ts` 鎖定基線標頭。

### LEGAL-2　同意留痕（consent audit）　`security · S · DB（選配）`　✅ `fdbe8c9`

`lib/legal-policy.ts` 提供政策版本；`/api/subscribe`、`/api/zone-wish` 送出時寫入 `consent_version` + `consented_at`（伺服器時間）。migration `scripts/migrations/005_legal_consent_audit.sql` 以 `ADD COLUMN IF NOT EXISTS` 加欄，舊資料 `NULL`（不回填、不推定同意版本）；只在啟用 `DATABASE_URL` 時需執行。

### LEGAL-3　資料最小化（移除 user-agent）　`security · S · 無`　✅ `fdbe8c9`

訂閱與許願不再收集或寫入瀏覽器 `user-agent`（`lib/subscribe-db.ts`／`lib/zone-wish-db.ts` 及對應路由測試同步）；IP／user-agent 僅暫時用於防濫用速率限制，不入內容資料庫。

### LEGAL-4　/legal 擴充與文件同步　`docs · S · 無`　✅ `fdbe8c9`

`/legal` 加章節錨點導覽＋政策版本標示，新增侵權通知（`/legal#takedown`）、投稿內容、第三方處理者、兒少與家長、安全與政策變更等章節；`DISCLAIMER.md`、`llms.txt`、訂閱／許願表單同意句同步（含「勿填孩子個資」）。

---

## GEO（已完成 → 已封存）

**Wave 1：** ✅ `e6e45a0` — 聚合頁 GEO 長導言改 `sr-only`（`GeoSrOnlyLede`／`StoriesIndexHeader`）；契約測試 `lib/geo-visibility-contract.test.tsx`；單集本集介紹仍可見（Wave 2 另議）。詳見 `docs/GEO-CONTENT-CONTRACT.md`。

> 全文見 [docs/archive/TODOS-completed-2026-07-11.md](./docs/archive/TODOS-completed-2026-07-11.md#geo-實作計畫--第二階段)。上線後人工檢查：[docs/geo-checklist.md](./docs/geo-checklist.md)。

---

## 名單收集 × 內容再利用（2026-07-03 品牌盤點）

> **Gate：** 本段經人工確認後才開始改 code。每個 Task 完成後單獨 commit，訊息格式 `brand: task-N <描述>`，hash 回填本段。
> **背景：** 品牌盤點結論——最大缺口是「自有名單」（聽眾全在第三方平台）與「內容只用一次」。完整計劃見 plan 檔（podcaster-humble-yeti）。
> **與既有條目關係：** LIST-2 取代「延後」表的「Email 電子報」條目（僅收名單、不寄信，ESP 之後再議）；REUSE-2 與 P2「家長共讀指引（`parentGuide`）」為**同一任務**（勿另建 `parentNote`）；逐字稿可索引已完成（`029b7e6`），REUSE-2 不重做。
> **紅線：** 不動宇宙地圖與 landing 動畫系統、不改既有 URL、不升降依賴版本。

| Task | 狀態 | 主要產出 | 預計影響檔案 | 驗證 | Commit hash |
|------|------|----------|--------------|------|-------------|
| LIST-1 LINE OA CTA | BLOCKED：等 LINE OA | env-gated LINE 加好友 CTA（`NEXT_PUBLIC_LINE_OA_URL` 未設即隱藏，沿用 `visibleSocials()` 空字串隱藏模式）；掛頁尾／單集頁 `SubscriptionCTA` 旁／landing／`/subscribe` | Modify: `lib/social.ts`（`SocialIcon` 加 `"line"`）、`lib/connect-icons.tsx`、`components/SiteFooter.tsx`、`app/story/[slug]/page.tsx`; Create: `components/LineCTA.tsx` | 設/不設 env 切換顯隱；`npm test` + `npm run build` | — |
| LIST-2 新集通知 email 訂閱 | ✅ `25be373` | 保留 zod + rate limit + Neon + 防枚舉；新增 pending／confirmed 狀態、短效 token hash、確認頁與寄信 provider 契約；**不等同會員帳號登入** | Modify: `003/004_subscribers.sql`、`lib/subscribe-db.ts`、`app/api/subscribe/route.ts`; Create: `app/api/subscribe/confirm/route.ts`、`app/subscribe/confirmed/page.tsx`、`lib/subscribe-email.ts` | DB／provider 未設定時明確降級；token 一次性、過期失效；確認前不進可寄送名單；`npm test` + `npm run build` | `25be373` |
| LIST-3 分析事件 | ✅ `25be373` | 保留既有 `story_completed`／`return_visit`／平台／地圖／許願／訂閱／分享事件；補 `story_play_start`、`game_session_start`、`game_session_complete`，不送 PII | Modify: `lib/analytics.ts`、`StoryPlayer`、`GamePageShell`、GameKit session | 事件契約測試；payload 不含 email／兒童識別資料 | `25be373` |
| REUSE-1 校對字幕採用檢查 | 完成 | 確認字幕正文在 `data/subtitles/<slug>.json`、校對標記在 `_proofread/`；`verify:episodes` 全過 | `npm run verify:episodes` passed；見 `docs/metrics/GEO-baseline-2026-07-10.md` | `dbfe7b3` |
| REUSE-2 家長共讀指引呈現（= P2 `parentGuide`） | 完成 | `data/parent-guides.ts` + `ShowNotes` 收合區（ep-1、ep-5 試點）；`enrichStory` 合併 | `data/parent-guides.test.ts` + `npm test` + `npm run build` | `dbfe7b3` |
| REUSE-3 YouTube 整集影片匯出 | 完成 `d9a00fd`（fix 至 `1365fc2`） | 本機 CLI `npm run export:video -- <slug>`：1920×1080 整集 mp4；`data/scenes` 換頁 + `data/subtitles` 原始逐句 ASS burn-in（`jf-openhuninn-2.1`）；`export/video/<slug>/` + manifest（gitignore）；9:16 Shorts 留二期 | Create: `scripts/lib/export-video-core.ts`、`scripts/export-video-assets.ts`、`docs/VIDEO-EXPORT.md`; Modify: `package.json`、`.gitignore` | `export:video -- ep-17`（ep-17 7:15 mp4 驗證）；`npm test -- export-video-core` | `1365fc2` |

### 待使用者提供（不擋開發）

- LINE 官方帳號加好友網址 → Vercel env `NEXT_PUBLIC_LINE_OA_URL`（需先自行建立 LINE OA）
- `DATABASE_URL` 沿用 zone-wish 既有 Neon，同庫加表即可

### Task DAG

1. REUSE-3 已完成（整集 16:9）；REUSE-1 仍待確認。
2. LIST-2 原本等隱私頁；本機驗證 `/legal#privacy` 已由 `a844f20` 上線，現改為 double opt-in；表單旁仍須放明確隱私句與 privacy link，寄信 provider 需由維護者設定。
3. LIST-1 等 LINE OA URL；LIST-3 等 LIST-1／LIST-2 的實際掛點。
4. REUSE-2 先完成 `familyActivity`／`parentGuide` 邊界定義，避免與 HOOKS-1 重疊。

---

## 週報 W27 提案（2026-07-04，詳見 [proposals/2026-W27.md](./proposals/2026-W27.md)）

> 首份週報產出，訊號驅動（/for-parents 實測、heuristics 掃描、TODOS 停滯項）。決策記錄請填 proposals 檔底部。

### W27-1 清除 /for-parents 全部「[待確認]」佔位文案　`content · S · 無`　〔review+geo〕 ✅ `dbfe7b3`
集數／角色／車種直出資料層；適合年齡「約 3–7 歲」、同步「每 15 分鐘檢查 Apple Podcasts RSS」定稿。驗收：`lib/for-parents.test.ts` 無「待確認」；部署後 prod grep=0。

### ~~W27-2 許願表單補隱私說明句 + footer 觸控目標~~　`trust · S · 無`　〔review+a11y〕 ✅ `964f418`
**併入 [兒童 UX 稽核 UX-P0-2／UX-P0-3](#兒童-ux-與親子互動稽核2026-07-11)**（2026-07-11 `/agent-plan`）。`ZoneWishForm` 家長向隱私句 + 故事 placeholder；footer「節目數據」「使用條款」≥44px。

### ~~W27-3 森林小島 magenta 暈圈修復~~　`asset · S · 無`　〔review+design〕 ✅
= 下方既有條目「森林小島底部洋紅色暈圈」，W27 週報將其提升優先。`c33ebb3` `ea49200`

---

## 宇宙地圖視覺升級 v6：景深與夜晚（2026-07-28）

> **問題：** 資產層（五島 diorama、海／雲／日月黏土 PNG）本來就好，但合成層幾乎沒做事——
> 海是單一 300px 平鋪、無淺灘、無遠近差；五島共用同一顆硬寫接地橢圓；夜間島身只有
> `brightness(0.93)`。整張圖讀起來像「五張漂亮貼紙貼在一張平鋪海面上」。
> **決策：** Phase A／B 零資產先落地（拿到八成效果），Phase C 才動生圖成本。
> **紅線守住：** 未動座標／`useMapCamera`／`ZoneSheet`／DESIGN.md「地圖不反轉」；
> 未新增 `backdrop-filter`／CSS `blur()`；`MapControls`／`ZoneSheet` 的
> `.module.css` 完全未動（契約測試不受影響）。

| # | 項目 | 處置 | 驗證 |
|---|------|------|------|
| A1 | 島貼在海面上、無水深訊號 | 場景 svg 於接地影**之下**加水色柔散淺灘（非 v5 白硬 foam 環，分界寫進 Art Bible §14.6） | 視覺截圖；DESIGN.md／Art Bible 登記 |
| A2 | 五島共用 `rx=112 ry=34`，hero 島影子偏小而顯得飄 | 新增 `lib/universe/island-ground.ts` 依 tile `stageSize` 推導淺灘＋接地影 | `island-ground.test.ts`（10 案，含「基準島與重構前完全一致」） |
| A3 | 遠島與近島一樣銳利 | `islandHaze(depthY)` → `--island-haze`；filter 掛無 transform 的 `.tileHaze` 層，避開 iOS 重影 | `universe-depth.test.ts`（+5 案）；瀏覽器實測 `saturate(0.9625)` |
| A4 | 海面無縱向景深、視線不收斂 | screen-space `.atmosphere`：上亮下深＋四角暗角；不進 `.stage`（歷史 OOM 點） | 視覺截圖 |
| A5 | 橋漂在水面上 | 每座橋補下移的寬圓頭低透明投影描邊（沿用該層「不用 blur filter」立場） | `MapBridgeLayer.test.tsx` |
| — | ~~7 個滿版橋 svg 合併成 1~~ | **放棄**：每座橋各自帶 `mapDepthZ(depthY,"bridge")` 才能與島**交錯**（同一座橋要能在遠島之前、近島之後）。合併＝只剩一個 z-index，該穿到遠島前的橋會被蓋掉 | 新增回歸測試鎖住「一橋一 svg」與交錯性質 |
| B1 | 夜間水面沒有光源感 | 月心正下方柔光帶，層級**低於島**；與 `SkyBodies` 共用 `.map` 的 `--sky-*` 錨點 | 瀏覽器實測位置對齊 |
| B2 | 夜間島身只是變暗 | `data/universe-zone-lights.ts` ＋ `ZoneNightLights`，每島 ≤3 顆亮核＋柔暈。**`hasNightArt` 翻 true 該島自動退場** | `ZoneNightLights.test.tsx`（9 案，含退場契約） |
| B3 | 日月完全靜止在角落 | `applySkyCamera`（`PARALLAX_FAR = 0.06`）＋`SKY_MAX_DRIFT` 夾住位移——不夾的話月亮會整顆離開視窗；尺寸 56→64px | `map-camera-visual.test.ts`（+4 案） |
| C0 | D4 凍結 | 補記解凍決策：同意人／比較基準／最低樣本數／回滾方式（見上方「地圖進化方向決策」） | — |
| C1 | `sea.png` 1.95MB、Art Bible 說缺 `@2x` | **文件是錯的**：影像 API 方形上限即 1024，`needs2x` 早已是 `false`，再生只會得到另一張 1024 的海。§14.1 改為記錄刻意契約。PNG 壓縮**未做**（見下方待辦） | `verify:map-art` 綠 |
| C2 | 沒有通用島圖生成腳本 | 新增 `scripts/generate-zone-night-art.ts`：參數化五島、`--dry-run`／`--only`／`--approve`、**日圖當 `images.edit` reference**（否則 crossfade 會變成島在變形）、輸出日／夜並排 contact sheet ＋ 剪影 IoU | `--dry-run` 通過；tsc／eslint 綠 |

### 待辦（本輪未完成）

- ~~**C2/C3 實際生圖**~~：已跑，**產出不符契約故不採用**（剪影 IoU 64–73%、沙岸消失、相機壓平）。
  詳見上方「D4 生圖實測結果與再凍結」。夜間視覺維持 CSS 點燈；重開需換技術路線。
- **`sea.png`／`sea-night.png` 無損壓縮**（3.0MB）：sharp 的 PNG 重編碼**並非逐像素無損**
  （實測 maxdiff 35），而環境無 `oxipng`／`zopflipng`／`optipng`。改動一張平鋪全圖的海會有
  可見風險，且該 PNG 只是 WebP（57KB／18KB）之外的 fallback 路徑，實務上近乎沒人走。
  要做應加 `oxipng` devDependency，另案評估。
- **視覺基準重產**：4 張 `/adventures` 基準預期全部漂移，待人工比對後重新產生（VIS-DEBT-1）。

---

## 宇宙地圖瀏覽簡化（2026-07-28）

> Commit：`c040158`

| 項目 | 說明 |
|------|------|
| 島尺寸 | 車車樂園維持 hero；其餘島與恐龍島同尺 264×260 |
| 浮標 | 移除紅色海面浮標 |
| 探索點 | 地圖不再鋪 pin；改靠 ZoneSheet／深連結 |
| 狀態字 | 建造中／規劃中／開放中等可見字樣與鎖島泡泡移除 |
| 橋 | 一律淺色棧道（虛線改淡色實橋） |

## 宇宙地圖微調（2026-07-28）

> Commit：`15eac7f`

| 項目 | 說明 |
|------|------|
| 動圖 | 停用主島小紅／恐龍島阿酷等漫遊車（含遠景 map 小紅） |
| 探索點 | 恢復選中島的 `HotspotLayer` pin |
| 木牌 | （已由後續座標挪移取代木牌 CSS 上移） |
| 橋 | （已由後續中樞＋外環取代完全圖） |

## 宇宙地圖佈局修正（2026-07-28）

> Commit：`c0bc723`· CRITICAL-1 B／CRITICAL-2 B

| 項目 | 說明 |
|------|------|
| 森林 | 座標 `(500,215)` → `(580,175)` 偏東北，錯開摩天輪 |
| 木牌 | 撤銷 forest 木牌 CSS 上移 hack |
| 橋 | 中樞 4 輻＋外環 3（共 7）；禁對角穿越 |

## 探索點泡泡標籤（2026-07-28）

> Commit：`ab50a4f` · CRITICAL-3 C

| 項目 | 說明 |
|------|------|
| 版位 | 探索點字永遠在圓點上方 |
| 進場 | 泡泡上飄淡入＋錯開 delay |
| 圓點 | 微浮＋呼吸光暈（鎖定點較淡） |
| 動效 | 僅 transform／opacity；reduced-motion／paused 控管 |

---

## 宇宙地圖小車呈現定版（2026-07-28）

> **狀態：** 實作已落地（分支 `cursor/universe-roamer-presentation-design-f0ac`）。  
> **Spec：** [docs/superpowers/specs/2026-07-28-universe-roamer-presentation-design.md](./docs/superpowers/specs/2026-07-28-universe-roamer-presentation-design.md)  
> **Plan：** [docs/superpowers/plans/2026-07-28-universe-roamer-presentation.md](./docs/superpowers/plans/2026-07-28-universe-roamer-presentation.md)

| 項目 | 說明 | Commit |
|------|------|--------|
| 決策 | 方案 1：靜態角色＋稀有過場；氣氛／點擊／角色辨識，不做導覽 | `130d776` |
| LOD／資料 | 遠景最多 2；近景每島 1；idleSpot；關巡邏 | `4df55fc` `748e760` |
| 引擎／層 | idle 預設；joyride；rareCrossing；聚焦切換 | `0206042` `ddeed40` |
| 紅線 | 未動 `useMapCamera`／`ZoneSheet`／zones 座標／zone-art-tile／地圖淺色 | — |

---

## 宇宙地圖回饋修正（2026-07-27）

> **來源：** 正式站 `/adventures` 使用者實測五點回饋。
> **決策：** 第 2 點兩處都重排（島上標籤＋詳情視窗）· 第 5 點探險小抄直接刪除 ·
> 第 3／4 點夜間對比走「固定奶油色實體按鈕」（對齊 `.tapHint` 與島名木牌，符合
> DESIGN.md「地圖不反轉」紅線）。
> **紅線守住：** 未動 `data/universe.ts` 座標與 `camera.center`、`zone-art-tile` 契約、
> `useMapCamera` pointer／慣性管線、海圖與島 tile 美術。

| # | 回饋 | 根因 | 處置 | 驗證 |
|---|------|------|------|------|
| 1 | 點小島未置中；想再點一次回原尺寸 | `targetToFlyParams` 把 `zone.camera.center`（＝`anchorUV [0.5, 0.84]` 的**沙岸底錨點**）當島心置中，84% 島高落在畫面上緣（1280×800 下 car-park 島頂被切約 117px） | 新增 `islandFocus(zoneId)`：焦點＝tile box 視覺中心＋木牌讓位 14px；`flyTo` 新增 `fitBox` 夾住「島放得進畫面」的縮放上限（桌面 >1.6 故手感不變，390 手機落到約 1.15）；`handleActivate` 對同島改 `router.push("/adventures")` | `lib/camera.test.ts`、`map-camera-utils.test.ts`、`useMapCamera.test.tsx`、e2e「點島後島真的置中」「再點一次同一座島」 |
| 2 | 島上各位置介紹的文字擺放不夠簡潔有力 | 探索點標籤 0.72rem 同權重、隨鏡頭縮放變形（fit 下命中區僅約 29px）、被木牌壓在下層；詳情視窗兩顆同重量全寬按鈕 | 標籤改印刷 chip 13px/800＋反縮放（命中區固定 48px）＋`hotspot` 層深＋下半島 `data-flip="up"`＋鎖定點降權；詳情視窗置中單欄、島名降為徽章、標題升 1.7rem、只留一顆膠囊主 CTA、回島降為文字鈕 | `HotspotLayer.test.tsx` |
| 3 | 夜間右下縮放鍵與背景融合 | `.btn` 吃 `--card`／`--cta-warm-fg`：夜間深靛底壓深靛夜海、字為 `#2a1808`（約 1.4:1） | 新增 `--map-chip*`（日夜不反轉）；`.btn` 改奶油底＋深棕字（字底 5.4:1、鈕對夜海約 7.9:1） | `MapControls.module.css.test.ts` |
| 4 | 白色對話框「還在蓋」非常不清楚 | 硬白底＋`var(--ink)`（夜間近白字壓白底）；在島 button 的 stacking context 內被木牌永久遮蓋；不反縮放；`top: 8%` 配上第 1 點常已被切出畫面 | 改 `--map-chip*` 色票＋反縮放（後續整體移除鎖島泡泡，改果凍回饋） | `ZoneIsland.bubble.test.tsx`、`universe-depth.test.ts` |
| 5 | 探險小抄沒意義 | 面板 `pointer-events: none`、≤480px 本就 sr-only、狀態圖例島木牌 pill 已有 | 刪除 `MapGuide.{tsx,module.css}` 與兩支測試；`aria-describedby="universe-map-guide"` 改指 sr-only 操作說明 | `e2e/a11y.spec.ts`（`/adventures` 2 案綠） |

### 同輪順手清掉的既有紅燈

驗證這五點時發現 repo 的品質閘門本來就是紅的，且都不是本輪造成，一併修掉：

| 項目 | 既有狀況 | 處置 |
|------|---------|------|
| `npm run lint` | `--max-warnings=0` 被 19 個既有 warning 擋住（死 import／`exhaustive-deps`） | 全部修到 0。`CandyMatchView` 的 `ensureAudio`／`tone` fallback 改模組層 noop（原 `?? (() => {})` 每 render 產新函式，9 個 `useCallback` 依賴每幀失效）；`BlockDropView` 用 `liveFnsRef` 鏡射迴圈函式（鍵盤訂閱不再每 render 重掛）；`GameHost` 移除未接線的 `resumeBgm`。**未動 `eslint.config.mjs`**（config-protection hook 亦擋） |
| `e2e/universe-map.spec.ts` label 淨空 ×4 | M0（`02f2a51`）重排座標後，「恐龍島木牌 ↔ 森林小島圖頂」不再垂直相鄰，斷言恆為 −364px | 改測真不變式（垂直完整可見／木牌互不重疊／層深高於所有島身／橫向可見比例 ≥0.7）；並新增 `LABEL_SCREEN_PAD` 修掉手機木牌被裁（375px 恐龍島 0.66 → 完整） |
| `e2e/a11y.spec.ts` 故事詳情頁 | `RelatedStories` 拿 `story.color` 當文字色，夜間對 `--card` 僅 2.2:1（axe serious） | 單集色改底線裝飾、文字走 `--accent-ink`。a11y 11/11 綠 |
| `e2e/smoke.spec.ts` car-adventure | 找不到 `role=img[name=遊戲畫面]`——GameAdapter 遷移時 `GameHost` canvas 漏了可及名稱（讀屏會念成無名 canvas） | 補回 `role="img" aria-label="遊戲畫面"`。smoke 18/18 綠 |

**全庫現況：** lint 0 warning · `tsc` 綠 · vitest 1041 綠 · playwright **83 passed / 0 failed**（39 個 visual 依政策 skip）。

### 視覺基準

`adventures-*` 四張已重產並逐張審圖（刪小抄／奶油鈕／新構圖）。

順手釐清 **VIS-DEBT-1**：它的理由寫「baseline 與本機渲染環境脫節」，但 `home-390` 三張在本機**逐像素相符**——字型／OS 若不同不可能全等。逐頁量到的落差（全部故事 21%、遊樂園 44%、宇宙地圖 25%、家長指南 19%、角色圖鑑 23%、關於 9%、訂閱 7%）主要是 07-12～07-17 產基準後兩週的 UI 演進沒有重新基準（例：`adventures-390-night` 舊圖還有探險小抄與「👆點點看！」）。**待辦：** 其餘 8 頁逐頁審圖重產後，再評估是否解除 `test.beforeEach` 的預設 skip。

---

## 遊樂園動線重構（2026-07-26）

> **Gate：** `/agent-plan` 三審（Codex 工程／Grok 對抗／Opus 設計，v1 兩票 Reject 後改寫）；Approved Plan：[`/tmp/agent-plan-1785073210.md`](/tmp/agent-plan-1785073210.md)。
> **決策：** D1-A（`GameIntro` 下移、操作提示留在遊戲旁）· D2-C（取消 featured 區塊，主打改分類內大卡）· D3-A（只做遊樂園動線）· D4-A（遊戲頁隱藏全站導覽）· D5-A（`coloring-book` 不動）。
> **紅線守住：** 未動 `lib/gamekit/progress/**` 進度／最佳分數／星星／貼紙 schema、未動 Candy Kart iframe bridge、未改 canvas 背景與遊戲內美術色。

| ID | 優先 | 狀態 | 摘要 | 主要檔案 | 驗證 |
|----|------|------|------|----------|------|
| PLAY-IA-1 | P0 | ✅ `40c951b` | **遊戲頁兒童優先重排**：`#game-play` 前移；單一 52px **sticky** 抬頭持有唯一 h1 與唯一返回；`GameIntro` 降為「給家長的說明」第二層；操作提示留在遊戲正下方 | `GamePageShell.tsx`／`.module.css`、`GameIntro.tsx`／`.module.css` | `e2e/games.spec.ts`（首屏 <160px、DOM 順序、唯一 h1） |
| PLAY-IA-2 | P0 | ✅ `40c951b` | **`GameHost` 工具列解耦**：改無條件渲染，修正 `hasScore:false` 遊戲會失去暫停／靜音／設定的缺陷；inline style → `GameHost.module.css` | `lib/gamekit/host/GameHost.tsx`、`GameHost.module.css` | 反向契約回歸測試 |
| PLAY-IA-3 | P0 | ✅ `40c951b` | **沉浸式路由**：`/games/:slug` 隱藏 `SiteNavBar`；hub 與 `coloring-book` 除外 | `lib/is-story-play-route.ts`、`SiteNavBar.tsx` | `is-story-play-route.test.ts`（含巢狀／著色本負向） |
| PLAY-IA-4 | P1 | ✅ `40c951b` | **hub 四層扁平為兩層**：取消 featured 區塊，主打改分類內大卡（桌面跨兩欄、圖左文右）；卡片補「約 N 分鐘／有無計時」；行動 hero `min(48svh, 340px)` | `app/games/page.tsx`／`page.module.css` | `e2e/games.spec.ts`（第一張卡 <560px、入口不重複） |
| PLAY-IA-5 | P1 | ✅ `40c951b` | **DESIGN v0.2 收斂**：移除 hover rotate、厚底影下沉、內容卡 `--gloss`、麥克筆 `text-shadow`；`RoughFrame`／`SvgDefs` 整條刪除；`DESIGN.md` 刪 `/games` carve-out | `page.module.css`、`GameChrome.module.css`、`GameEndStation.module.css`、`components/decor/*`、`DESIGN.md` | `npm test` + `decor.module.css.test.ts` |
| PLAY-IA-6 | P2 | ✅ `4224442` | **暫停覆蓋層補「回遊樂園」**：sticky 抬頭已保證出口可達，但「暫停 → 我要離開」仍是最自然的兒童動線 | `BlockDropView.tsx`、`car-adventure/CarAdventureMenu.tsx` | 手動 390×844 |
| PLAY-IA-7 | P2 | ✅ `4224442` | **抬頭與 `GameHost` 工具列合成單列**（portal + context，約 30 行，不動 GameKit 對外契約）：目前遊戲上方仍是 52+48 兩列 | `GamePageShell.tsx`、`lib/gamekit/host/GameHost.tsx` | 手動 + e2e |
| PLAY-IA-8 | P2 | ✅ `4224442` | **遊戲頁無法切換日／夜**：`ThemeToggle` 只掛在已隱藏的 `SiteNavBar` | `GamePageShell.tsx` | 手動 |
| PLAY-IA-9 | P2 | 待做 | **視覺基準線重拍**：本次改動會推翻 `games-*` 4 張快照，但 `e2e/visual.spec.ts` 明文禁止在未對齊環境盲跑 `--update-snapshots`（VIS-DEBT-1） | `e2e/visual.spec.ts-snapshots/` | 對齊產生環境後 `npm run test:visual:trusted` |

---

## 兒童 UX 與親子互動稽核（2026-07-11）

> **Gate：** `/agent-plan` 稽核；Approved Plan：[`/tmp/agent-plan-1783699379.md`](/tmp/agent-plan-1783699379.md)。**紅線：** 不更動主架構與版面（Landing scroll-snap、地圖骨架、故事詳情 grid、路由、zone 座標／art-tile 契約）。
> **總判斷：** 兒童主路徑 **B+**、親子互動 **B**、家長信任 **A-**。播放／地圖 disclosure／`kidsMode` 已達基線；缺口為 **信任 polish + 觸控補強 + 共讀內容覆蓋**（不需架構手術）。
> **與既有條目：** W27-2 → UX-P0-2／UX-P0-3；STEM-P3 家長閘門 → UX-P0-1；STEM-P3 共讀指引擴充 → UX-P1-3（REUSE-2 試點已完成）；footer 觸控（小項 polish）→ UX-P0-2。

### 稽核結論（保留，實作時勿改壞；對齊 [DESIGN.md](./DESIGN.md) 觸控／reduced-motion／viewport）

- **StoryPlayer**：主控制 60–68px、字幕三檔、睡前定時、結尾反思需點「想聊一下」才展開
- **ZoneSheet**：許願／信任收「給爸爸媽媽」；故事卡 ≥64px；close／wishToggle ≥44px（MAP-UX-P1a）；sheet 開時 overlay 擋 pan（MAP-UX-P1b）
- **遊戲**：繽紛消消樂 `explore` 無分數計時；GameKit `kidsMode` 預設 true
- **刻意不做：** 獨立逐字稿頁（新頁型）、故事詳情大改版面、tap-to-explore（已移除）

| ID | 優先 | 狀態 | 摘要 | 主要檔案 | 驗證 |
|----|------|------|------|----------|------|
| UX-P0-1 | P0 | 待做 | **家長閘門**：進 `/for-parents/dashboard`（或切兒童模式）前簡單算術題；session 通過後放行 | 新 `ParentGate.tsx`；`dashboard/page.tsx` | 手動 375px；`npm test` |
| UX-P0-2 | P0 | ✅ `964f418` | **Footer 觸控 ≥44px**（= W27-2 後半） | `SiteFooter.module.css` | CSS 契約 + 手動 |
| UX-P0-3 | P0 | ✅ `964f418` | **許願隱私一句話**（= W27-2 前半）：送出鈕下 inline 說明、message placeholder 勿含個資 | `ZoneWishForm.tsx` | vitest |
| UX-P0-4 | P0 | ✅ `1c1ca1b` | **Challenge 遊戲家長提示**：列表卡加「建議 6 歲以上 · 家長陪同」（僅文案，不隱藏入口） | `data/games.ts`、`app/games/page.tsx` | `npm test` + build ✅ |
| UX-P1-1 | P1 | 部分完成 | **補齊 &lt;44px 按鈕**（只改 CSS）：~~ZoneSheet 關閉／wishToggle~~ → MAP-UX-P1a；StoryPlayer 定時、Landing 箭頭待做 | 各 `*.module.css` | 手動＋e2e |
| UX-P1-2 | P1 | ✅ `42a9d38` | **詳情頁反思收合**：比照 `StoryEndScreen`，家長句不預設露出 | `StoryDetailReflection.tsx`、`app/story/[slug]/page.tsx` | `npm test` |
| UX-P1-3 | P1 | 待做 | **共讀 sidecar 擴至全集**：`parent-guides`／`family-activities` 從 ep-1/ep-5 擴充（內容營運，可分批） | `data/parent-guides.ts`、`data/family-activities.ts` | 同名 `*.test.ts` |
| UX-P1-4 | P1 | 待做 | **播放進度條拇指加大**（CSS 變數，不動控制列 layout） | `StoryPlayer.module.css` | 手動播放頁 |
| UX-P1-5 | P1 | 部分完成 | **e2e 兒童 UX 回歸**：`/adventures` a11y + 地圖觸控 e2e ✅（MAP-UX-P1c）；遊樂園 hub + 五款遊戲頁首屏／heading／返回動線 ✅（PLAY-IA-1）；`/for-parents`、播放頁待補 | `e2e/a11y.spec.ts`、`e2e/universe-map.spec.ts`、`e2e/games.spec.ts` | `npm run test:e2e` |
| UX-P2-1 | P2 | ✅ `eb19c86` | 方塊／卡丁車接 `kidsMode` 或標「挑戰模式」：kidsMode 預設＝relaxed 耦合鎖定（回歸測試）；GameIntro 統一 challenge 家長提示 | `BlockDropGame.tsx`、`GameIntro.tsx`、`settings.ts` | test + 手動 |
| UX-P2-2 | P2 | 待做 | 儀表板「最佳分數」改低壓文案（「探索紀錄」等） | `ParentDashboard.tsx` | 手動 |
| UX-P2-3 | P2 | ✅ `eb19c86` | 遊戲頁年齡標示一致（metadata vs chip）：五款稽核無矛盾；challenge 提示由 GameIntro 統一呈現 | `app/games/page.tsx` | build |
| UX-P2-4 | P2 | 待做 | Dudu 鍵盤可及（內層 `tabIndex={0}`） | `DuduCompanion.tsx` | a11y |
| UX-P2-5 | P2 | 待做 | `reflectionShown` 加 `source: detail \| end-screen` 精準量測 | `progress-store.ts`、`ReflectionPrompt.tsx` | test |
| UX-P2-6 | P2 | 待做 | **car-adventure 封面重製 4:3**：現 16:9 素材於 4:3 卡框置中裁切可用（太陽／主角車／終點旗完整），重製走生圖 SOP＋人工審圖，對齊其他四款 1448×1086 | `public/games/v2/car-adventure/cover.webp` | 人工審圖 |
| UX-P2-7 | P2 | 待做（併 VIS-DEBT-1） | **`/stories` visual baseline 既存 drift**：trusted 跑時 `visual：全部故事 390 light` 即 fail——目檢 diff 後對齊環境再刷新 baselines；**預設 `test:visual` 為 skip≠通過** | `e2e/visual.spec.ts-snapshots/stories*` | `npm run test:visual:trusted`（勿用預設 `test:visual` 當通過證明） |

### Task DAG（建議 `/agent-action` 順序）

1. ~~**UX-P0-2 + UX-P0-3**~~ ✅ `964f418`（W27-2）→ ~~**MAP-UX-P1a/b/c／P2a**~~ ✅ `80457c4` → **UX-P1-5**（全站 e2e）
2. **UX-P0-1** 可並行（新元件，需使用者決策：是否含 GameKit 兒童模式開關）
3. **UX-P1-1**（ZoneSheet 部分併入 MAP-UX-P1a）、P1-2、P1-4 CSS／元件微調
4. **UX-P1-3** 內容分批，不擋工程項
5. **UX-P2-\*** 擇機

### 宇宙地圖 UX（2026-07-11，`/tmp/agent-plan-1783730484.md`）

> 五維稽核見 [docs/UNIVERSE-MAP-UX-AUDIT-2026-07-11.md](./docs/UNIVERSE-MAP-UX-AUDIT-2026-07-11.md)。**紅線：** 不動 `useMapCamera`／`ZoneSheet` 核心、zones 座標、art-tile。

| ID | 優先 | 狀態 | 摘要 | 主要檔案 | 驗證 |
|----|------|------|------|----------|------|
| MAP-UX-P1a | P1 | ✅ `80457c4` | close／wishToggle ≥44px | `ZoneSheet.module.css` | CSS 契約測 + e2e |
| MAP-UX-P1b | P1 | ✅ `80457c4` | sheet 開時 overlay 擋地圖手勢 + 動態 max-height（後續首屏極簡改 `min(64vh,30rem)`） | `ZoneSheet.module.css` | e2e 拖曳／backdrop |
| MAP-UX-P1c | P1 | ✅ `80457c4` | a11y `/adventures` + 開 sheet axe + 觸控 assertion | `e2e/a11y.spec.ts`、`e2e/universe-map.spec.ts` | `test:e2e` 24 綠 |
| MAP-UX-P2a | P2 | ✅ `80457c4` | reduced-motion 點島即開 sheet | `e2e/universe-map.spec.ts` | `test:e2e` |
| MAP-MOBILE-FIT | P1 | ✅ `6824d12` | 手機首屏：隱藏標題 pill／探險小抄（sr-only）＋ `FIT_MARGIN` 0.96 | `MapGuide.module.css`、`UniverseMap.module.css`、`map-camera-utils.ts` | 單元＋CSS 契約＋`universe-map` e2e 16 綠 |
| MAP-MOBILE-BBOX | P1 | ✅ `88b0f67` | 預設 fit 改島群 bbox（`islandContentBounds`），五島首屏更飽滿；不動 `useMapCamera` | `map-camera-utils.ts` | 單元＋e2e 五島 inViewport 17 綠 |
| MAP-MOBILE-CONTAIN | P1 | ✅ `37e42eb` | 直向嚴格 contain：`PORTRAIT_MAX_ZOOM` 1.5→1，首屏不橫切外側島／木牌 | `map-camera-utils.ts` | 單元＋e2e 木牌可見比 ≥0.98 |
| MAP-MOBILE-CHROME | P1 | ✅ `37e42eb` | fit 扣右下 MapControls／召喚把手 inset（`fitAvailableViewport`） | `map-camera-utils.ts` | 單元 |
| MAP-ROAM-doc | ops | ✅ `80457c4` | archive「待 commit」→ `3166cc5`／`503ad8b` 對帳 | `docs/archive/…` | 文件 only |

### 待使用者決策（實作前）

1. **家長閘門範圍**：僅 dashboard，或含 GameKit「兒童模式」開關？
2. **UX-P1-3 節奏**：一次寫完全集，或每週 3 集？
3. ~~**UX-P0-4**：僅文案提示 vs 對幼兒隱藏 challenge 入口~~ → **已採僅文案**（`gameParentTip` + 列表卡）

---
## 成長量測（Growth-Measure-1）

> 合併原「成長量測缺口」兩條 + Analytics 後續；對齊現役隊列 #4。

### Growth-Measure-1a 平台後台基線記錄　`growth-measurement · S · 無`　〔growth〕 ✅ `6ca8263`（模板）
每週記錄 Spotify／Apple／YouTube／SoundOn 後台基線（訂閱、播放、完播、來源）；截圖或 CSV 存 `docs/metrics/`（不 commit 個資）。見 `docs/metrics/README.md`。

### Growth-Measure-1b UTM 歸因規格　`growth-measurement · S · 平台外連`　〔growth+eng〕 ✅ `797de82`
`utm_source=cheche_web`、`utm_medium=story_page|footer|subscribe_cta|social`、`utm_campaign=<slug|site>`；實作於 `lib/platform-utm.ts`／`TrackedPlatformLink`／`ConnectHub`／`SubscribeMenu`。

### SoundOn show notes 回鏈　`growth · S · sync 管線`　〔growth+ops〕 ✅ `42a9d38`
`lib/soundon-backlink.ts` + `docs/metrics/README.md`／`docs/EPISODE-WORKFLOW.md` 營運步驟；SoundOn 後台手動貼入（sync 管線不寫入）。

---

## 遊樂園品質打磨 Wave 2（2026-08-13）

> 再玩一次＋收藏看得見。不解凍方塊模式、不燒著色生圖、不改 GameKit schema。

| 項目 | 狀態 | 摘要 |
|------|------|------|
| polish(games): 消消樂 4 連掃把糖／5 連彩虹糖 | 完成 | `planWaveClears`、棋盤徽章 |
| polish(games): Hub 車庫五格＋貼紙列 | 完成 | 不改 progress schema、不開新路由 |
| chore(games): 刪 `GameMeta.featured` 死欄位 | 完成 | PLAY-IA-4 後未再使用 |
| 驗證 | ✅ `3abe632` | `npm test` 1145／`build`／`tsc` |

---



> 手感＋完成儀式＋hub 進度露出。不解凍方塊 Marathon／Sprint、不燒生圖、不改 GameKit schema。

| 項目 | 狀態 | 摘要 |
|------|------|------|
| polish(games): 消消樂 swap／掉落／連鎖 toast、地圖三星說明、過關 confetti | 完成 | `CandyMatchBoard` motion、`planGravity` |
| polish(games): 著色「我塗好了」＋本機作品牆 | 完成 | `GameEndStation`、IndexedDB 草稿列 |
| polish(games): GameChrome 依 gameId 隱藏方塊選項；方塊開場露出難度／彩虹 | 完成 | |
| polish(games): Hub 低壓星星／已玩／車庫下一輛 | 完成 | 不改 progress schema |
| 驗證 | ✅ `728af8c` | `npm test` 1125／`build`／`tsc` |

---



> 已完成地圖／設計審查見 [archive](./docs/archive/TODOS-completed-2026-07-11.md)。對齊 [DESIGN.md](./DESIGN.md)。

### Landing 無 `<h1>`　`design · S · 無`　〔seo+a11y〕
首頁 headings 從 h2 開始（四段 segment 標題）；第一段標題可升級 h1 或另加 sr-only h1。`components/landing/LandingSegment.tsx`。

### 小項（polish）
- ~~鎖定島 sheet「🔔」emoji 圖示與全站 SVG 語彙不一致，改 inline SVG 鈴鐺。~~〔design〕 ✅ `4350ce2`
- ~~鎖島「看看」pill 預設縮放下被島名木牌完全遮住（功能隱形，正式站既有）；併入木牌欄第三行（島名→狀態→看看），繼承反縮放與 label 層深。~~〔design〕 ✅ `8f35732`
- StatusOverlay 對 planned/coming 維持現狀裁決：coming 用島體濾鏡、planned 留白皆正確，方形 overlay 會在透明島邊對海面露框；planned 專屬美術（霧基＋「?」浮標）仍屬凍結資產項。〔design〕（已裁決不做 CSS 折衷）
- 單集頁車種 chip 顯示「其他」= 資料 fallback 外洩到 UI；無車種時隱藏 chip。〔content+eng〕
- ~~footer「節目數據」「使用條款」觸控高度 20px（<44px）~~ ✅ `964f418`（UX-P0-2）。〔a11y〕
- ~~landing hero jpg（~300KB/張）可轉 WebP 降首屏灰底時間~~ ✅ 併入 D1（`optimize:lcp-images`；首頁 LCP `segment-stories*` AVIF 約 73–79KB）。〔perf〕
- ~~`app/characters/page.module.css` 自成一套 slate/teal 色系（13 個硬編 hex、無 token、不支援夜間模式），與 DESIGN.md 色票脫鉤；建議改 `var(--token, #fallback)` 慣例（參照 `components/landing/*`）。~~ ✅ 併入 D3。〔design+eng〕


---

## 視覺化升級（2026-07-11 審核通過）

> 來源：`/agent-plan` 視覺升級委員會（leader + Codex gpt-5.5 工程審）→ **2026-07-11 使用者＋程式庫對帳審核通過**（Conditional Approve）。完整初稿見 plan 檔（agile-stirring-kernighan）。
> **與現役隊列關係：** 本段為**並行軌 B（視覺）**，不取代檔首信任／成長 Top 5（並行軌 A）。交集：D14↔UX-P1-1 觸控、D9↔UX-P2-4 Dudu 鍵盤。
> **分層：** L0 治理地基 → L1 核心體驗地基 → L2 高價值體驗 → L3 系統化回饋 → L4 品牌亮點（對應工程 P1→P3）。
> **建議執行順序：** D0 → D2（smoke baseline 先）→ 修正版 D1 → D13 剩餘 → D3 → D14 → D6 ∥ D12 → L2 其餘 → L3 → L4。
> **驗證矩陣：** `npm test` + `npm run build` + `test:e2e`（axe 零新增 critical/serious）+（D2／VIS-DEBT-1）視覺 diff 用 `npm run test:visual:trusted`（預設 `test:visual`＝skip、exit 0≠通過）；視覺類不進 `npm run check`。新動效僅 transform/opacity（含 stroke-dashoffset），一律 `prefers-reduced-motion` + visibility pause。
> **紅線：** 宇宙地圖場景固定淺色、不反轉海圖／島 tile；不動 `useMapCamera`／ZoneSheet 核心、landing scroll-snap 骨架；D12 不碰播放／地圖 runtime（OG 動態 route 或 build-time 產圖除外）。

### 狀態圖例

| 標記 | 意義 |
|------|------|
| 待實作 | 審核通過，可 `/agent-action D<n>` |
| 部分完成 | 既有能力已具備，本項只補缺口 |
| spike | 驗證通過才擴大 |

---

### L0 治理地基

#### D0 資產治理　`eng · S · 無`　〔perf+ops〕 ✅ `1c1ca1b`
`scripts/audit-assets.ts`：**四類 taxonomy**——(1) 部署資產（git tracked）(2) staging／gitignore（如 `.illustrate-staging`）(3) 動態推導引用（`storyCoverPath`、`getZoneArtSrcSet` 等）(4) 孤兒資產。不可只 grep 靜態字串路徑。
**基線數字（2026-07-11 量測）：** tracked JPG **358**（其中故事插圖 **319**）；ignored staging **262**。單檔大小上限 + PR 新增大 jpg 警示。先量再改。
**落地：** `npm run audit:assets`（`--strict` 阻擋超大 JPG）；核心 `scripts/lib/audit-assets-core.ts` + vitest。

#### D2 視覺回歸安全網　`eng · M · 無`　〔eng+design〕**Phase A** ✅ `1c1ca1b`　**Phase B** ✅ `42a9d38`
現況：`playwright.config.ts` 僅 **Desktop Chromium**（無 mobile project）。目標：`e2e/visual.spec.ts` + `toHaveScreenshot`——8 主頁 × 390/1280 × light/night ＝ **32 組**完整矩陣。
**分階：** Phase A／B 曾落地（✅ `42a9d38`），但 **VIS-DEBT-1**：baseline 已脫節 → 預設 `npm run test:visual` **skip**；真跑／重產用 `npm run test:visual:trusted`。不進 CI gate；視覺類 agent-action **必跑 `:trusted` 並回貼 diff**（不可把預設 skip 當通過）。

---

### L1 核心體驗地基

> 原名「效能地基」不準確：本層含夜間、字幕、圖示，非純 perf。

#### D1 圖像管線現代化（修正版・雙軌 LCP）　`perf · M · D0`　〔perf〕 ✅ `d42fae1`
**雙軌 LCP（勿再把 `hero-home.jpg` 當首頁 LCP）：**
- **(a) 首頁 `/`：** `segment-stories*.jpg`／portrait，原生 `<picture>` + 預生成 WebP/AVIF（`LandingSegment`、`lib/modern-image-src.ts`）；`npm run optimize:lcp-images`
- **(b) 內頁 header：** `SiteHeader` `hero-home` 同管線 `<picture>` + WebP/AVIF
- **(c) Next `Image`：** `next.config.ts` `images.formats` AVIF；`StoryImage` + `data/story-image-blurs.json` blur-up（`npm run generate:story-blurs`）
- ~~landing hero jpg 小項~~ 併入本項

#### D14 圖示與控制一致性　`design · S–M · 無`　〔design+a11y〕 ✅ `50f3885`
**落地：** `components/ui/Icon` + `IconButton`（≥44px、hover／active／focus-visible）；`data/icons.ts` 名稱契約。替換 StoryCard／PlayButton／games hub `▶`、SiteNavBar 漢堡、ZoneSheet／StoryPlayer 關閉、GameChrome 暫停／音量／設定、ZoneWishForm 鈴鐺。保留鍵盤 `←` `→`、GameChrome 🎡 等童趣 emoji。

#### D3 Night 主題全站打磨　`design · M · 無`　〔design〕 ✅ `50f3885`
**落地：** `globals.css` 頁級暖色 token（`--page-warm-*`、`--warm-surface`、`--warm-card-glow` 等）；`characters`／`for-parents`／dashboard 硬編 hex 全改 token；stories／詳情／games hub 夜間暖燈卡片；`SiteFooter` support CTA token 化。`npm run audit:colors` + `scripts/lib/hardcoded-color-audit.ts`（`--strict-d3` gate D3 驗收頁）。地圖海圖仍固定淺色不反轉。

#### D13 字幕閱讀排版（剩餘）　`ux · S–M · 無`　〔ux+content〕 ✅ `d42fae1`
**已有（勿重做）：** 三段 `captionSize`、對比遮罩（`.caption` blur 底）、行高／字級階梯、句級 `{t,text}` 切換（`data/subtitles/*.json`）。
**本輪 ✅：** `lib/subtitle-cue.ts` 前／當前／後一句 + `StoryCaptionStack` cue 過渡；即時字幕軌與翻頁 `captions`／`captionTimes` 對齊（`resolveCaptionStackState`）。`prefers-reduced-motion` 關閉動畫。
**另開 spike（非本輪 M）：** 逐字卡拉 OK——需 word-level timestamps／VTT 擴充，工作量 **L**，單獨 ticket。

---

### L2 高價值體驗

#### D6 播放器沉浸升級　`ux · M · D2+D13`　〔ux〕 ✅ `76f91c1`
**落地：** `story.color` ambient 漸層底（`--ambient`）；Ken Burns 僅 `isPlaying` + 分頁可見 + 非 reduced-motion（`lib/player-stage.ts`）；夜間振幅／亮度降檔（`.playerNight`）。播放器狀態契約不動。

#### D12 分享卡（OG image）升級　`growth · S · 無`　〔design+growth〕 ✅ `76f91c1`
**落地：** `app/story/[slug]/opengraph-image.tsx` + `lib/story-og.tsx`（1200×630、Noto Sans TC TTF、黏土相框＋EP＋角色＋品牌條）；`story-metadata` 改指向動態 OG；`trackShareClick`（copy_link／line）+ `ShareButton.storySlug`。

#### D10 圖鑑「已認識」狀態　`ux · S · D3`　〔ux+design〕 ✅ `3ac73a3`
**落地：** `lib/character-recognition.ts`（`storiesCompleted` ∩ `appearsIn` 或 `unlocks.characters`）；`hooks/useRecognizedCharacters.ts`（SSR 空集合 → mount 讀 store）；`CharacterCatalogGrid`／`CharacterCard` 統一定裝照相框＋已認識／待認識貼紙、`aria-label` 含狀態。3D tilt 仍列 **L4 D10-tilt**。

#### D4 View Transitions（spike）　`ux · S(spike) 可能升至 M · D2`　〔eng+ux〕 ✅ `3ac73a3`＋`42a9d38`；**驗收矩陣 #1–#7 全過**（2026-07-11）
**落地：** `experimental.viewTransition`（Next 16.2.10）+ `StoryCoverMorph`（React 19.3 canary `ViewTransition`）故事卡封面↔詳情 hero；`sharedCoverMorph` 防同頁重複 slug；`app/view-transitions.css` + reduced-motion。驗收紀錄見 `docs/D4-VIEW-TRANSITIONS-SPIKE.md`（Chromium＋WebKit＋Firefox；#7 揪出並修復 `theme.ts ↔ progress-store.ts` 循環相依 TDZ → 抽 `lib/progress-keys.ts`）。未啟用 `Link transitionTypes`；iOS 真機滑動返回目視留日常觀察。**已達擴大門檻**。

#### D5 Scroll-driven 進場（CSS-only）　`ux · S · D2`　〔ux〕 ✅ `bed866e`
**落地：** `app/scroll-driven.css`（`@supports (animation-timeline: view())` 才啟用 `.scrollEnter`；預設靜態可見）；`StoryCard`／games hub 改 scroll 進場並關閉支援內 `popIn` 雙跳；`LandingSegment` 標題／CTA 錯落 `scrollEnterStagger1–3`；`prefers-reduced-motion` 關閉。

---

### L3 系統化回饋

#### D8 慶祝回饋（縮小範圍）　`ux · M · 無`　〔ux〕 ✅ `bed866e`
**落地：** `data/celebration.ts` 事件語意＋強度檔；`lib/celebration.ts` 冷卻／合併／burst 預算；`StarBurst`＋`useCelebrationBurst` DOM adapter；`lib/celebration-iframe.ts` postMessage 契約。接線：FavoriteButton、ZoneIsland、CandyKart finish。

#### D9 嘟嘟微互動（重構）　`brand · S–M · 無`　〔brand+ux〕 ✅ `bed866e`
**落地：** `data/dudu-emotions.ts`；`DuduSprite` primitive＋`DuduMoment` wrapper（inline／badge／companion）；`DuduCompanion` 重構（`tabIndex` 可聚焦）；擴 404、GameLoadOverlay 載入、StoryEndScreen 完播。

---

### L4 品牌亮點

#### D11 時間感知首頁　`brand · S · D3+D2`　〔brand〕 ✅ `bed866e`
**落地：** `lib/bedtime.ts`（19:00–06:00）；`THEME_INIT_SCRIPT`＋`ThemeProvider` 同步 `data-bedtime`（`light` 優先）；`LandingBedtimeLayer` CSS 疊層夜色＋重用 `moon.png`（不換 hero）。

#### D7 手繪體驗深化　`design · M · D2`　〔design〕 ✅ `bed866e`
**落地：** `Doodle` `draw` prop（`stroke-dashoffset` 描邊進場）；`RoughFrame` `shiftFilter`（`#rough-1/2/3` 輪替）；`LatestHero`／games header 首屏 `draw`；`decor.module.css.test.ts` 契約。

#### D10 圖鑑 3D tilt（可選 polish）　`ux · S · D10 貼紙上線後`　〔ux〕 ✅ `42a9d38`
手機價值低；列為可選。依賴 D10 貼紙狀態已穩定。

---

### 執行順序（審核定稿）

```
D0 → D2-A(smoke) → D1 → D13-剩餘 → D3 → D14 → D6 ∥ D12
  → D10-貼紙 → D4(spike) → D5 → D8 → D9 → D11 → D7 → D10-tilt?
```

通過單項後以 `/agent-action D<n>` 實作；完成附 commit hash 回填本段。

---

## 產品路線圖（互動 + STEM + 商業）

> 依據：兒童數位產品研究共識（Thinkrolls／DragonBox／Khan Kids／Sago Mini 等）、台灣市場（《顛覆！故事 STEAM》、Firstory 付費成長、叮噹家族 VIP 月 99／年 999）、競品拆解（[RESEARCH.md — Hey Clay](./RESEARCH.md#2026-06-09hey-clay-app-架構拆解與適用性評估)）、以及本站現況（Next.js SSG、逐字字幕、4 款小遊戲、private 素材庫）。

### 三個貫穿原則

1. **不要做成「作業」，要做成「玩」** — 益智與適性任務包裝成遊戲；車車主題是優勢，別把 STEM 變講課。
2. **學齡前：開放式探索，避免計時與競爭計分** — 沙盒、獎勵發現與創造；無廣告、無時間壓力（對齊 Sago Mini／Khan Kids）。
3. **商業：家長信任 > 一切** — 費用購前透明、無 dark patterns；付費牆只在家長區，不讓孩子誤觸。
4. **螢幕是手段，動手是目的（phygital）** — 引導孩子離開螢幕做線下手作／實驗；反「純螢幕時間」賣點（見 Hey Clay 研究）。

### 台灣市場定位

| 面向 | 說明 |
|------|------|
| 對標 | 《顛覆！故事 STEAM》已驗證「故事 + STEM」；我們用**車車**更聚焦、更有畫面 |
| 付費範本 | 叮噹家族 VIP（月 99／年 999）：會員故事合輯、限定無廣告原創 |
| 護城河 | **自製音檔 + 看圖翻頁 + 逐字字幕 + 網頁互動 + phygital 手作引導** — 純 Podcast（叮噹、信誼）做不到；roadmap 放大「翻頁引導 → 線下動手」 |

### 四階段總表（一頁摘要）

| 階段 | 核心 | STEM 連結 | 商業 |
|------|------|-----------|------|
| **P1** 互動故事 | 結尾開放提問、完播／重訪量測 | 提問啟蒙、因果 | 純留存驗證，零訂閱 |
| **P2** 車車 STEM 實驗室 | 組裝車沙盒、斜坡實驗、路徑編碼、分類數數 | 工程、物理、運算思維、數學 | 差異化價值主張 |
| **P3** 家長端 | 儀表板、家長閘門、共讀指引、列印物 | 延伸到現實 | 提升轉換與信任 |
| **P4** 商業化 | freemium + 訂閱（家長付費） | 會員進階實驗 | 對標月 99／年 999；進度綁定收費 |

**最該優先做的一件事：** STEM-P1「**每集結尾開放提問 + 完播／重訪量測**」— 成本最低、最快驗證互動意願，並鋪路 P2。

### 命名對照（避免 Growth-P1 與 STEM-P1 混淆）

| 前綴 | 含義 | 範例 |
|------|------|------|
| **P0–P3**（無 STEM 前綴） | **成長／官網** — 訂閱轉換、SEO、信任、工程 | P1 分享鈕、P2 隱私頁 |
| **STEM-P1–P4** | **產品／互動** — 互動提問、STEM 實驗室、家長端、商業化 | STEM-P1 reflectionPrompt |


### 現役 Top 5

**見檔首 [現役隊列](#現役隊列2026-07-11)。** 2026-06 對照：

### 本季 Top 5（2026-06 執行優先序）

1. ~~**STEM-P1** 每集結尾開放提問內容回填~~ ✅ `6ed7758`（全集覆蓋）
2. **Growth-P1** 單集頁訂閱 CTA 上移（主按鈕下方）
3. **Growth-P1** 首頁可見訂閱入口（Header／Hero → `#connect`）
4. ~~**Growth-P2** W27 信任收尾（許願隱私＋footer 觸控）~~ ✅ `964f418`；`/for-parents` 佔位 ✅ `dbfe7b3`
5. ~~**STEM-P1** 完播／重訪量測口徑驗證~~ ✅ `d2ac15c` `9bba1dd`（story_completed＋return_visit，口徑見 lib/analytics.ts）

> **STEM-P1 全數完成（2026-07-06）→ gate 解鎖**：凍結中的地圖美術長尾與遊戲 polish 可依數據擇機重開（建議先看兩週 story_completed／return_visit 基線再決定）。

> **地圖進化方向決策（2026-07-09，委員會 plan `61d098b` 後）**：
> ① ~~**T3b camera 視覺更新外置**（zoom 期間重渲染隔離）~~——使用者回饋縮放些微卡頓後落地：`bindVisual` 命令式寫 stage／海面／視差，React cam 僅在 bucket／zoom 限／手勢結束 commit；`isInteracting` 暫停漫遊與島待機動畫。見本輪已完成。
> ② ~~**D4 五島夜間美術**（`hasNightArt` 管線已 wired、零資產）——**等數據解凍**~~：**已解凍（2026-07-28）**，見下方解凍紀錄。

> **D4 解凍紀錄（2026-07-28）**
> - **同意人**：專案負責人（本輪視覺升級決策，選項「全開，含五島夜間島圖」）。
> - **解凍理由**：本輪目標是把地圖從「五張貼紙貼在平鋪海面上」提升為有水深／空氣／夜晚的世界。
>   零資產手段（淺灘、大氣透視、暗角、CSS 點燈、水面月光）已全部落地，
>   夜間島身仍只是 `brightness(0.93)`，**剩下的天花板只能由夜圖突破**。
> - **比較基準**：解凍前 4 週 `story_completed`／`return_visit`（夜間時段佔比）為 baseline。
> - **最低樣本數**：夜圖上線後至少 2 週且 `return_visit` ≥ 100 筆才做結論；未達門檻不做加減碼判斷。
> - **回滾**：把該島 `hasNightArt` 翻回 false 即恢復日圖（`ZoneIslandTileArt` 已有降級路徑，
>   且 `ZoneNightLights` 的 CSS 點燈會自動回場），不需回滾程式碼。
> - **管線**：`scripts/generate-zone-night-art.ts`（新增；`generate-map-art.ts` 只管 map 素材、不含 zone）。
>   走 `--dry-run` 估量 → 生圖到 staging → 人工審 contact sheet（日／夜並排＋剪影 IoU）→ `--approve` → 翻 `hasNightArt`。

> **D4 生圖實測結果與再凍結（2026-07-29）** — 管線可用，**但模型產出不符契約，未 `--approve`，public 未動。**
>
> | 檢查項 | 結果 |
> |---|---|
> | 剪影 IoU（crossfade 前提） | car-park 71.1%／dino 73.3%／rescue 68.3%／ocean 63.8%／**forest 94.4%**（門檻 90%） |
> | 是否僅留白差異 | 否。日／夜 trim 後長寬比 **1.126 vs 1.313**；離線 trim 正規化僅 71.9%，強制拉伸才 84%（會變形） |
> | 奶油沙岸 `#ead7ac`（§4） | **消失**，整條變深紫，島像被染色 |
> | 3/4 高視角（§1） | **被壓平**，夜圖明顯更俯視，跨島一致性破功 |
>
> **踩到的坑（已修進管線，勿重蹈）**：`input_fidelity` 與 `background:"transparent"`
> **只有 `gpt-image-1`／`gpt-image-1.5` 支援**，`gpt-image-2`（repo 預設）送了直接 400。
> 首輪等於在預設 `input_fidelity: "low"` 下跑。改 1.5 + `high` 重測：
> ocean 63.8→72.7%、rescue 68.3→72.1% —— 有進步但遠低於門檻。
>
> **結論**：壞的是三個 Art Bible 契約（剪影／沙岸／相機），不是單一參數，**不是靠調 prompt 能收斂的**。
> 本輪成本共 7 次影像呼叫。重開時應**換技術路線**（區域遮罩編輯，或人工繪製夜圖），
> 而不是繼續同一套 text-prompt roulette。夜間視覺暫由 `ZoneNightLights` 的 CSS 點燈承擔。

> 分享鈕、平台排序、訂閱文案、viewport 縮放、sitemap 擴充等已上線，見 Completed；不再佔 Top 5 名額。
---

### STEM-P1 — 互動故事（1–2 個月）

目標：不重做架構，在現有故事頁加輕互動，驗證孩子是否更願回訪。

#### ~~故事頁點按熱點（tap-to-explore）~~　`STEM-P1 · M · 插畫座標`　〔stem+eng〕 — **已移除（2026-06）**：虛線提示體驗不佳，待重新設計後再評估。`0d77d7f`

#### ~~每集結尾開放式「小提問」~~　`STEM-P1 · S · 文案`　〔stem+content〕 ✅
框架與 UI（`ReflectionPrompt`、詳情頁＋播放結束畫面）`10746b5`；ep-10～ep-17 文案回填完成（無標準答案＋親子延伸一句，角色名對 apple-synced summary 核實），`data/reflection-prompts.ts` 全集覆蓋＋測試。`6ed7758`

#### ~~互動正向回饋（音效／星星動畫）~~　`STEM-P1 · S · 收藏／提問`　〔stem+eng〕 ✅
收藏：星星動畫既有，補 `playSfx("collect")` 溫和音（reduced-motion 關動畫保留音效；取消收藏不出聲）。`f107a42`

#### ~~互動留存簡易量測（本機 + 可選 analytics）~~　`STEM-P1 · S · reflection 上線`　〔stem+ceo〕 ✅
本機紀錄 `10746b5` `a844f20`。**完播口徑已定案**（single source of truth：`lib/analytics.ts` `trackStoryCompleted` JSDoc）：native `ended` 且非 repeat 觸發；對外每次完整播放計一次（含重聽）、本機維持 unique 去重；payload 只送 `{ slug }`。`story_completed` 事件 `d2ac15c` `5e2db59`；`return_visit` 回訪訊號（≥6h、只送天數 bucket、每 session 一次；FE-04 minimal）`9bba1dd`。legal 與 `docs/FOR-PARENTS-DATA.md` 已同步揭露。
**量測品質備註**：`reflectionShown` 於 `ReflectionPrompt` mount 即記錄，而詳情頁無條件渲染 → 訊號≈pageview；後續可加 `source: "detail"|"end-screen"` 只記 end-screen 展開。

---

### STEM-P2 — 車車 STEM 實驗室（2–4 個月）

目標：系統性把「車」連到 STEM；**全部開放式、不計時、不排名**（canon 遊戲中 block-drop／car-adventure 計分僅作參考，新模組預設無競賽）。

#### 「組裝你的車」沙盒　`STEM-P2 · L · 無`　〔stem+eng〕
拖拉輪子、車身、引擎組車，組好可動。工程／結構直覺（對標 marshmallow 橋 + Sago 機器人組裝的車車版）。`/games` hub 新入口。

#### 「斜坡實驗」互動　`STEM-P2 · M · 無`　〔stem+eng〕
調坡度看車滑多遠／多快，玩因果與簡單物理。Canvas 或 DOM + 輕物理即可。

#### 無螢幕式路徑編碼（強化 Car Mission）　`STEM-P2 · M · 無`　〔stem+eng〕
方向箭頭排路徑讓車到終點；獨立關卡編輯器（**已移除** car-mission，不擴充舊元件）。適齡演算法啟蒙。

#### 分類／數數小遊戲　`STEM-P2 · M · 車種素材`　〔stem+eng〕
依顏色、大小、車種分類；符號功能與數學啟蒙。可重用 `VehicleClayIcon`、`/vehicles` 資料。

#### 「車車 DIY」手作教學（`craft` 內容類型）　`STEM-P2 · M · 插畫素材`　〔stem+research〕
新增與 `Story` 並存的 **`craft`** 型別：分步 `steps[]`（每步示意圖 + 語音引導句），複用 `StoryPlayer` 翻頁與字幕同步（同 `captions`／`captionTimes` 時間序列）。例：色紙摺救護車、回收物做垃圾車。架構成本近零，產品從「聽故事」升級為 phygital 引導平台。見 [RESEARCH.md](./RESEARCH.md)。研究見 [RESEARCH.md 2026-06-11 節](./RESEARCH.md#2026-06-11逐步共作模式--lego-說明書--hey-clay-的共同機制與本站轉譯)。

#### Phygital 故事延伸（聽完 → 線下手作）　`STEM-P2 · S · craft 上線`　〔stem+research+content〕
每集故事結尾、`parentGuide` 或詳情頁 CTA 連結對應 `craft` 教學；明確傳達「螢幕引導你動手做」。車車版循環：聽故事（線上）→ 跟著做（線下）→ 完成後解鎖圖鑑（見 STEM-P3）。

**設計紀律：** 新遊戲 checklist — 無計時、無排行榜、可隨時離開、觸控 ≥ 44px、reduced-motion 可玩。

---

### STEM-P3 — 家長端與信任（3–5 個月，可與 P2 並行）

#### 車車圖鑑養成（完成度解鎖）　`STEM-P3 · M · /characters 頁`　〔stem+research〕
聽完一集／完成對應 `craft` → 解鎖該集車進「車庫圖鑑」（localStorage 進度）。純數位版取代 Hey Clay 實體 code：用**完成度解鎖**驅動回訪；進階車款預留**會員解鎖**（STEM-P4）。與下方 `/characters` 角色圖鑑頁合併規劃。
**地圖進度中樞已上線（2026-07-06）**：18 集全數對映 zone（`data/story-zones.ts` `00feab9`）＋`useZoneProgress`/`useCompletedSlugs` hook（`ba7fd7e`）＋**可見層**（島嶼木牌 `⭐ n/N` 星章＋淡暖光暈＋sheet 已聽打星，`cbbe28d`）。「聽完」口徑由 `recordStoryCompleted` 單點定義——STEM-P1 完播口徑定案後只動寫入端，地圖不用改。圖鑑本體（車款解鎖 UI）仍待 P3。

#### 家長簡易儀表板　`STEM-P3 · M · localStorage 或帳號決策`　〔stem+design〕
用星星／笑臉呈現「聽了哪幾集、玩了什麼、解鎖了幾台車」，不做成績單。可先讀現有收藏／繼續播放／遊戲 best 分／圖鑑解鎖（localStorage）。**MVP 已上線**（`/for-parents/dashboard`）；文案 polish 見 [UX-P2-2](#兒童-ux-與親子互動稽核2026-07-11)。

#### 家長閘門（parent gate）　`STEM-P3 · S · 付費／設定頁`　〔stem+eng〕
設定、未來付費頁前簡單算術題，防孩子誤觸（對齊 Sago Mini）。**實作任務：** [UX-P0-1](#兒童-ux-與親子互動稽核2026-07-11)（2026-07-11 稽核具體化：先擋 `/for-parents/dashboard`）。

#### 每集「家長共讀指引」　`STEM-P3 · S · P2 parentGuide 上線`　〔stem+content〕
REUSE-2 試點已完成 `dbfe7b3`；**擴充全集：** [UX-P1-3](#兒童-ux-與親子互動稽核2026-07-11)。P3 階段另評估儀表板摘要、列印物連結。

#### 可下載列印物（著色、剪貼、迷宮）　`STEM-P3 · M · 插畫素材`　〔stem+growth〕
PDF printables 作加值；低成本高感知。會員可全解鎖（P4）。
**線上著色本**（`/games/coloring-book`）已另開 MVP，與本列印物分開；本條仍指 PDF／下載包。
線上著色本候選進化（未列管、擇機開案）：Web Share 分享成品、已完成作品畫廊、每集故事連動著色頁（lineart 管線已可批量產）、自訂色票。
（2026-07-15）線稿品質改善混合管線已落地（`ef803c1`）：Phase 1 despeckle＋品質 gate 重產 character 4 頁；Phase 2 `generate:coloring-ai-lineart`（images.edit staging→人工審→`--approve` 逐頁上線）；scene 頁待 AI 版過審前維持現狀，不以演算法版充數。
（2026-07-15）封面開場＋線稿閉合漏色已做；稀疏輪廓（如恐龍車多多）改由主體外輪廓 ∪ morph close 管線處理。

#### KidSAFE／隱私行銷賣點　`STEM-P3 · S · /legal 已有`　〔stem+ceo〕
對外強調：無廣告、不蒐集兒童帳號、進度在裝置本機；若未來跨裝置帳號，需家長同意與最小蒐集。

---

### STEM-P4 — 商業化（5 個月後，留存與信任跑通後）

> **本輪不實作：** 以下四項是會員帳號／付費範圍；先完成 ASSET-P2、TRUST-P2、Growth-Measure-2 與穩定依賴，再由家長端產品決策開工。

### 車車遊樂園 2.0 升級方案審核（2026-07-18）

> **審核結論：條件通過。** 產品方向（家長付費、孩子端免費、家長閘門、單一會員層級、無 dark pattern）與既有原則一致；但 M0／M1／M2 尚不可照原案直接開工。下列 blocker 關閉前，不得宣稱 2.0 可收款上線。

#### 開工前 blocker

- **基準與時程：** 方案寫 18 集，但目前資料基準是 20 集（手動 6 集 + Apple 同步 EP7–20）；M0-5 要收 14 天基線，不能同時宣稱 M0 一週完成且「M0 未完成不得開 M1」。基礎設施與 14 天觀察須拆開，後者可與 M1 並行。
- **R2／Git／CI 契約：** `storyAudioUrl()` 已支援外部 origin，但 `generate:audio-lengths`、Apple sync、轉錄與影片匯出仍直接讀 `public/stories`。移除音檔前須建立 R2 manifest（key／bytes／checksum／content-type），改造 build、RSS、`verify:geo`、sync CI，並完成從 R2 還原工作的演練；不可標示為「程式碼零改動」。
- **歷史瘦身：** archive branch 若長期保留，舊 blob 仍可達，不能保證 `.git` 會降至 `<50MB`。先完成 R2 checksum、冷備份、CI／部署驗證，再重寫所有必要 refs；協作端需明確 re-clone／force-push 通知。
- **登入與閘門：** `parents.login_token_hash` 不足以表達一次性 token、多裝置 session、撤銷與過期。需獨立 login-token／session 記錄、rate limit、Secure／HttpOnly／SameSite cookie、token prefetch 防護與帳號刪除流程。算術題只是 UX gate，付費 API 與私有資產仍須 server-side session／entitlement 驗證。
- **進度同步：** 目前實際 key 是 `cheche:progress`。上雲前需用 allowlist schema、大小上限與版本號驗證 payload，定義首次登入的 local/server merge、離線重試、衝突與登出降級策略；不要直接把任意 localStorage JSON 寫入 JSONB。
- **金流可行性：** Stripe 目前官方支援地區清單未列台灣；台灣主體不得把 Stripe 視為現成海外備援，須先確認受支援國家的合法實體、稅務與銀行條件。M2 v1 應先選定單一可落地 provider（預設綠界），Stripe 只在資格確認後加入。
- **會員帳務：** `memberships` 不能只有 `status`／`current_period_end`／`provider_ref`。至少要有 provider customer／price ref、取消／退款／付款失敗狀態、webhook event idempotency、事件順序處理與人工對帳欄位；不得依賴 checkout success 頁面授權。
- **內容切線：** 目前 Apple sync 與 RSS 是公開發布管線。必須先決定「7 天早鳥」是否不進公開 Apple/RSS，或改成僅會員 Web 內容；`access`／`availableAt` 需同步控制故事頁、播放器、RSS、sitemap、OG、JSON-LD 與私有 PDF，不能只把物件放進 private bucket。

#### 修正版執行順序

1. **M0a（1 週）：** 自訂網域、Resend、公開 R2、R2 manifest、build／RSS／sync CI 改造與 smoke test。
2. **M0b（並行 14 天）：** 收集 `story_play_start → story_completed → return_visit → subscribe_submit` 基線；先定事件資料匯出方式與最小樣本／決策門檻。
3. **M1：** parent session、server-side gate、guest localStorage 保留、進度同步與隱私／條款更新；不把付款混入身份層。
4. **M2：** 單一 provider 的 hosted checkout、簽章 webhook、會員狀態／對帳、取消／退款與一種私有內容；完成一筆測試付款到失效的完整循環後才開放真實收款。
5. **M3：** 依轉換、留存與會員內容使用數據排序價值迭代。TTS 姓名客製、實體包裹、具名感謝先不列核心交付。
6. **M4：** YouTube、短影音、平台付費與實體包裹移出會員核心時程；它們需要獨立的內容、平台、客服與營運驗收。

#### 驗收紅線

- 無本機音檔仍可完成 production build，RSS enclosure bytes 正確，Apple sync／轉錄／影片匯出有明確本機快取或 R2 下載流程。
- 未登入、gate bypass、過期 session、重放 magic link、撤銷 session、無 entitlement 的請求全部不能取得會員資產。
- webhook 重送、亂序、付款失敗、取消、退款、續期與 provider downtime 不會錯誤授權或永久保留權限。
- 私有內容不出現在公開 RSS／sitemap／OG／JSON-LD；signed URL 具短 TTL、Range／CORS／cache 行為測試，且明白其為 bearer token。
- 首次登入、跨裝置合併、登出、刪除帳號與隱私政策均有測試與可觀測紀錄。

#### 官方技術參考

- [Cloudflare R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)：presigned URL 使用 S3 API domain，不能直接使用 custom domain。
- [Stripe global availability](https://stripe.com/global)／[海外帳戶要求](https://support.stripe.com/questions/requirements-to-open-a-stripe-account-in-another-country)。
- [綠界信用卡定期定額訂單作業](https://developers.ecpay.com.tw/12136/)：停用後不能重新啟用，只能建立新訂單。
- [Stripe subscription webhooks](https://docs.stripe.com/billing/subscriptions/webhooks)：訂閱狀態與存取權應由 webhook 驗證與同步。
- [Vercel custom events](https://vercel.com/docs/analytics/custom-events)：確認目前 Vercel plan 是否支援自訂事件與所需報表。

#### AUTH-P4 家長會員帳號與跨裝置進度　`STEM-P4 · L · Neon + email provider`　〔trust+eng〕　⏸ 延後
家長限定 magic link／session；保留 guest localStorage，登入後 merge 收藏、續播、遊戲摘要與圖鑑進度。不可要求孩子建立帳號；需補資料刪除、匯出、保留期限與家長閘門。

#### ENT-P4 會員 entitlement 與私有內容　`STEM-P4 · M · AUTH-P4`　〔eng〕　⏸ 延後
定義免費／會員／早鳥內容矩陣；以家長帳號與訂閱狀態控制私有音檔、進階互動與列印物，付費牆不得出現在孩子主流程。此條不等同本輪 ASSET-P2 的公開音檔 origin 抽離。

#### BILL-P4 訂閱付款與 Stripe　`STEM-P4 · L · AUTH-P4 + ENT-P4`　〔ceo+eng〕　⏸ 延後
待網域、付款主體、退款／取消／發票與台灣稅務流程確認後，才接 Checkout、Customer Portal、webhook 與訂閱狀態同步；不得先做只收款不授權的半成品。

#### AUTH-P4 價格與內容方案驗證　`STEM-P4 · S · Growth-Measure-2`　〔growth+ceo〕　⏸ 延後
先用播放、完播、遊戲與通知訂閱基線驗證價值，再決定月／年方案與會員內容，不把現有月 99／年 999 對標文字視為已驗證價格。

#### Freemium + 家長端訂閱　`STEM-P4 · L · P3 閘門`　〔stem+ceo〕
免費＝基本故事 + 部分互動；會員＝無廣告、限定故事、進階 STEM 實驗、列印物全解鎖。**付費牆不出現在孩子主流程。**

#### 收費時機綁「進度／累積」　`STEM-P4 · M · 訂閱基建`　〔stem+growth+research〕
累積收聽／收藏／圖鑑解鎖／craft 完成後再推會員，非註冊當下；中斷會可惜時轉換較高。進階車款、進階 craft、列印物全解鎖可作會員差異（取代 Hey Clay 實體 code 內購）。

#### 訂閱價格帶驗證　`STEM-P4 · S · 營運`　〔stem+growth〕
對標台灣已驗證 **月 99／年 999**；內容節奏靠 Apple 同步新集 + 會員限定互動模組。

#### 持續新鮮內容管線　`STEM-P4 · 持續 · 既有 sync`　〔stem+eng〕
每季 1–2 個新 STEM 小遊戲或互動故事功能；依 P1 留存數據排優先序。

---

## 路線圖（單一優先序總表）

| 期 | 主題 | 條目 |
|----|------|------|
| **P0** 地基 + 第一印象 | 看起來完整、被搜尋到 | 首頁渲染修復 · 正式網域 · sitemap/robots（含 `/games`、`/legal`）· JSON-LD · DESIGN.md 同步 · 首屏精簡 |
| **P1** 訂閱轉換 + 分享 | 「沒看到訂閱」消失、可被轉發 | ~~Growth-P1a/b~~ `eafe30a` · ~~ConnectHub 文案/排序~~ · ~~每集分享鈕~~ · 試聽橋接 · 入門三集 · 空狀態 · 錨點導覽 |
| **P2** 信任/合規 + 內容 | 兒童產品權重、內容變深 | ~~隱私專章 + analytics~~ · 主持人信任區 · 真實插畫 · ~~家長共讀指引試點~~ · UX-P1-3 擴充 · 新集通知說明 · 主題頁 SEO · 音檔壓縮 · ~~縮放~~/觸控/塗鴉 |
| **P3** 可靠/工程/可選 | 不掛、可回歸、加分 | 監控 · E2E CI · ESLint CI · 生圖佇列 · 車車圖鑑養成 |
| **STEM-P1→P4** 互動×STEM×商業 | 差異化與變現 | 見上表；**當務之急：結尾提問 + 完播量測** |

**相依鏈（現況修正）：** 正式網域 → sitemap/robots + JSON-LD 已完成；既有 analytics 與 `/legal#privacy` 已上線（`a844f20`）。本輪先完成音檔 origin 契約、double opt-in、播放／遊戲量測與 stable React；AUTH-P4 → ENT-P4 → BILL-P4 嚴格依序，會員付費不提前混入免費流程。

**已備齊（勿重做）：** 全部故事頁、全螢幕播放器、每集落地頁 + **每集 OG 圖**（`lib/story-metadata.ts`）、**每集分享鈕**（`ShareButton`）、`/topic` 與車種 SEO 頁、RSS `/feed.xml`、`ageRange`、PWA／收藏／繼續收聽、ConnectHub（Spotify／Apple 優先 + 訂閱文案）、相關推薦、**`/games` 遊樂園**（繽紛消消樂／車車大冒險／繽紛樂園／繽紛卡丁車）、`/legal#privacy` 與版權合規、Vercel Analytics + 平台點擊事件、逐字字幕管線、角色定裝照名冊、`/characters` 公開角色頁、Apple 15 分鐘同步 + GitHub Issue 通知、**viewport 開放縮放**。

**待決策（實作前定）：** ① 自訂網域最終選擇（`chechepark.tw` / `checheland.tw` / 其他）— **基建已就緒**（`NEXT_PUBLIC_SITE_URL` + `CANONICAL_SITE_URL` fallback，P0 ✅）；② ~~`parentGuide` 與 `familyActivity` 邊界~~ → 已決（[GEO-CONTENT-CONTRACT](./docs/GEO-CONTENT-CONTRACT.md)）；擴充見 UX-P1-3；③ ~~縮放（鎖 vs 家長大字模式）~~ → **已決：開放縮放**（`app/layout.tsx`，P2 ✅）；④ **現有 4 款遊樂園遊戲與 STEM 原則** — 見下方「產品決策」；⑤ **兒童拍照分享** — 是否做、如何去識別化；跨裝置圖鑑是否需帳號與家長同意（見 [RESEARCH.md](./RESEARCH.md) 風險段）。

### 產品決策：現有遊樂園 vs STEM「不計時、不競爭」

現有 4 款遊戲（繽紛消消樂、車車大冒險、繽紛樂園、繽紛卡丁車）中，block-drop／car-adventure 含 **localStorage 最佳分／生命數** 等競賽元素，與 STEM 路線「學齡前避免計時與競爭計分」不完全一致。

**建議方向（擇一或混合，實作 STEM-P2 前定案）：**

| 選項 | 說明 |
|------|------|
| **A. 分層** | 現有 4 款保留為「遊樂園經典區」；STEM-P2 新模組嚴守無計時／無排行榜 checklist |
| **B. 漸進淡化** | 保留 best 分顯示但移除生命／Game Over 壓力；大冒險改為無限續關或探索模式 |
| **C. 雙模式** | 每款加「輕鬆玩」（無分數）／「挑戰玩」（可選，預設輕鬆） |

**已決策（2026-07-16，使用者拍板）：採方案 A 分層**——現有 4 款維持「遊樂園經典區」定位（保留生命制／Game Over／最佳分；大冒險不改無限續關），卡面維持 6–12 挑戰標示；配套改善走教學示範 overlay＋kidsMode 預設 relaxed（UX-P2-1）＋GameIntro 家長提示。STEM-P2 新模組仍嚴守無計時／無排行榜 checklist。

**新遊戲預設：** 無計時、無排行榜、可隨時離開（見 STEM-P2 設計紀律）。舊遊戲是否改版依上表決策後排入 P2 或 P3。**市售 pixel 精進**（Game Kit、三星、高分）已移至 [RESEARCH.md — 四款小遊戲精進](./RESEARCH.md#2026-06-09四款小遊戲精進方案對標可市售-pixel-game)，待 STEM-P1 gate 後再解凍。


## P0 — 地基 + 第一印象

### ~~首頁集數列表渲染修復~~　`P0 · S · 無`　〔eng〕 ✅
`StoryFilter` 把整段全部故事頁包在 `<Suspense fallback="載入故事中…">`，內層用 `useSearchParams()`，Next.js 15 中此舉使該邊界退化為 client-only → **靜態 HTML 只有最新一集 + 「載入故事中…」，列表要等 JS 才出現**。這正是「看起來很簡陋」+ 首頁 SEO 空洞的根因。
**修法：** `useState` 初值改 `null`（= server 的「全部」），`vehicleParam` 只在 `useEffect` 套用，避免 hydration mismatch；移除把列表藏在 fallback 的結構。影響檔 `components/StoryFilter.tsx`；`app/page.tsx` 已傳完整 `stories`，不動。修完「首頁載入骨架」需求基本消失。

### ~~設定正式站網域 + `NEXT_PUBLIC_SITE_URL`~~　`P0 · S · 確認網域`　〔ceo〕 ✅
Vercel 設 `NEXT_PUBLIC_SITE_URL=https://正式網域`。OG／Twitter／RSS／sitemap 的絕對連結都靠它；未設時 fallback 到 `VERCEL_URL`／`localhost`。**擋住 sitemap、JSON-LD、每集分享預覽。** `app/layout.tsx` 已讀此變數。

### ~~`sitemap.xml` + `robots.txt`~~　`P0 · S · 網域`　〔ceo〕 ✅
新增 `app/sitemap.ts`（首頁、`/story/[slug]`、`/topic`、`/topic/[tag]`、`/vehicles/[vehicle]`、`/about`、**`/games` hub + 各遊戲頁**、**`/legal`**）與 `app/robots.ts`（允許爬取、指向 sitemap）。主打「每集落地頁被搜尋到」卻沒給站點地圖，這是 SEO 最低門檻。Next.js 15 原生 `MetadataRoute`；重用 `stories()`、`allTags()`、`allVehicles()`、`lib/site-url.ts`。

### ~~Podcast 結構化資料 JSON-LD~~　`P0–P1 · S · 網域`　〔ceo〕 ✅
首頁輸出 `PodcastSeries`、單集頁輸出 `PodcastEpisode`（schema.org `<script type="application/ld+json">`），欄位對應標題／日期／音檔 URL／封面，對齊 `/feed.xml`。協助 Google 理解節目與單集（豐富摘要）。建議抽 `lib/json-ld.ts` 集中產生。

### ~~同步 DESIGN.md 與實作~~　`P0 · S · 無`　〔design〕 ✅
更新 `DESIGN.md`：`--ink-soft` → `#7a7268`、背景改 `.site-backdrop` + `.site-root`、StoryFilter 塗鴉現況，且 viewport 段落已同步為「允許使用者縮放」（實作見 `app/layout.tsx`）。設計文件漂移時改版易回到舊 token。實作見 `app/globals.css`。

### ~~首屏價值主張與資訊架構精簡~~　`P0 · S–M · 無`　〔design+ceo〕 ✅
新訪客需 3 秒內懂「這不是一般 Podcast 嵌入頁，是互動繪本」。**已做：** 標頭三行 tagline + 合作/許願/留言圓鈕（見 Completed）。**剩餘：** 檢視區塊順序（Header → LatestHero → FavoritesSection → StoryFilter），避免「最新集」與列表長期重複同一集；副標清楚傳達「給誰聽、睡前幾分鐘」。

---

## P1 — 訂閱轉換 + 分享導流

### ~~ConnectHub 訂閱文案與平台排序~~　`P1 · S · 無`　〔growth〕 ✅
頁尾「訂閱收聽」已加「訂閱後，新集會自動出現在你的 Podcast App」；`lib/platforms.ts` 陣列序為 **Spotify → Apple → KKBOX → YouTube**。`components/ConnectHub.tsx`。SoundOn／RSS 已移除，勿加回。

### ~~每集分享鈕（複製連結 / LINE）~~　`P1 · S · 網域`　〔growth〕 ✅
單集頁 `ShareButton`：複製連結 + LINE 分享（`lib/share-story.ts` 組 URL）；可插 `leading` 放收藏鈕。OG 預覽圖已備齊（`lib/story-metadata.ts`）。B 戰場每則貼文固定連單集。

### Growth-P1a 單集訂閱 CTA 上移　`P1 · S · 無`　〔design〕 ✅ `eafe30a`
單集頁主 CTA（收藏／分享）下方加「訂閱收聽」區塊，視覺層級低於主按鈕但高於次要連結。見現役隊列 #2。

### Growth-P1b 首頁訂閱入口　`P1 · S · 無`　〔eng〕 ✅ `eafe30a`
Header 或 Hero 加明確「訂閱」按鈕連 `#connect`（或 `/subscribe`）。見現役隊列 #3。首段 Hero 加 `#connect` 捷徑；頂欄 SubscribeMenu 維持。

### 試聽片段 → 平台訂閱橋接　`P1 · M · 無`　〔growth〕
單集頁加 30–60 秒試聽（裁切 `public/stories/<slug>/` 預覽檔或播放器限制 `currentTime`），突出 CTA 導去平台聽完整版。社群進站者先感受聲音氣質再轉換。

### 首頁「入門三集」與本週更新　`P1 · S · 無`　〔growth〕
首頁加「第一次來？從這三集開始」精選區（`data/stories.ts` 標 `featured` 或手動 slug 列表）；最新集 Hero 旁補「本週更新」節奏文案。降低新聽眾選擇成本、建立訂閱期待。

### 首頁／篩選空狀態插畫化　`P1 · M · 素材`　〔design〕
為「載入中／篩選無結果／尚無收藏」設計吉祥物 + 一句話 + 明確下一步（換車種、聽最新一集）。純文字空狀態在兒童產品像工程預設。`app/page.tsx`、`StoryFilter`、`FavoritesSection`。

### 首頁錨點導覽（取代手機 sticky 篩選）　`P1 · S–M · 無`　〔design〕
長列表加頁內錨點／捷徑列（最新｜全部故事｜依車車）。iOS 上 StoryFilter 已改 `position: static` 避免合成破圖，犧牲吸頂；錨點補「找得到篩選」而不復活 sticky。集數 >15 優先度提高。

### 每集上線「社群貼文腳本」SOP　`P1 · S · 分享鈕定稿`　〔growth〕（營運，不寫程式）
`README.md`／`docs/` 新增每集 SOP：① 預告 ② 上線貼（官網單集 URL）③ 平台訂閱提醒 ④ 15 秒幕後再導連結。B 靠固定節奏與固定入口。

---
## P2 — 信任/合規 + 內容深化

### ~~隱私專章 + analytics 基礎事件~~　`P2 · S · 無`　〔ceo〕 ✅
`/legal#privacy` 已說明 localStorage、完播紀錄、平台點擊、Vercel Web Analytics 與第三方平台外連；`app/layout.tsx` 已掛 `<Analytics />`，平台外連走 `TrackedPlatformLink` + `trackPlatformClick`。`a844f20`
**剩餘 W27 信任收尾：** ~~許願隱私＋footer 觸控~~ ✅ `964f418`；LIST-2 email 訂閱實作時同步連回 `/legal#privacy`。

### Analytics 後續：UTM + 平台後台對照　`P2 · S–M · 量測基線`　〔ceo+growth〕
站內平台點擊事件已上線（`a844f20`）；UTM 規格與週報模板已補（`797de82`、`docs/metrics/README.md`）；待補 SoundOn show notes 回鏈與平台後台週報實記。見 [Growth-Measure-1](#growth-measure-1-成長量測)。

### 主持人信任區（Bonbon & 馬米）　`P2 · S · 照片+文案`　〔growth〕
關於頁或首頁下半加主持人小卡：照片、各一句話、節目理念（為什麼做親子車車故事）。熱門節目靠人格溫度；B 置頂貼可連同一區。家長會問「誰做的、適合我家孩子嗎」。`app/about/page.tsx`。

### 替換真實多頁插畫　`P2 · M · 授權插畫`　〔growth〕
各集 `public/stories/<slug>/` 佔位圖換成官方插畫，視需要提高 `pageCount`。真實繪本強化「看圖聽故事」睡前儀式感。`pageCount` 與 `01.jpg`～`NN.jpg` 對齊；一圖多句時 `captions` 可多於 `pageCount`（播放器重複封面）。

### ~~每集「家長共讀指引」（`parentGuide` 試點）~~　`P2 · S · 文案`　〔content+design+stem〕 ✅ `dbfe7b3`
REUSE-2 試點（ep-1/ep-5 + ShowNotes）已完成。**擴充全集：** [UX-P1-3](#兒童-ux-與親子互動稽核2026-07-11)（勿在此重開待做條目）。

### 字幕人名校對　`P2 · S/集 · 無`　〔content〕
EP1–7 已用 `large-v3` 轉錄 + 自動簡轉繁（`data/subtitles/*.json`）。**剩**：校對品牌/人名誤聽——Bonbon→寶寶、馬米→媽咪等（Whisper 無從得知），直接改側車 JSON。屬資料校對、非工程。

### 新集通知路徑（家長向白話說明）　`P2 · S · 無`　〔growth〕
訂閱區簡短說明「如何訂閱／用 App 收新集」。RSS 技術面已有，家長多不熟 RSS，需白話引導。`ConnectHub` 加一兩句 FAQ 或連關於頁錨點。

### SEO：主題與系列頁擴充　`P2 · S–M · 無`　〔growth〕
延續 `/topic/[tag]`，每主題補一句家長向導語（非僅列表）、補站內連結結構。家長依「勇氣、睡前、安全」搜尋，主題頁是長尾入口。`generateStaticParams` 與 metadata 已具備。

### GEO 營運基礎（crawler 政策／IndexNow／逐字稿／verify:geo）　`P2 · M · 無`　〔eng+growth〕　de2774b／165b44e
本輪已實作：`app/robots.ts` AI 檢索型 crawler（`OAI-SearchBot`／`ChatGPT-User`／`Claude-SearchBot`／`Claude-User`／`PerplexityBot`／`Perplexity-User`）放行、訓練型（`GPTBot`／`ClaudeBot`／`Google-Extended`／`Applebot-Extended`／`CCBot`／`Bytespider`／`meta-externalagent`）拒絕；`lib/json-ld.ts` 補 `PodcastSeries.sameAs`、`breadcrumbListJsonLd`（純 JSON-LD，無可見 UI）、`PodcastEpisode.associatedMedia` 逐字稿 MediaObject；`lib/feed.ts`／`app/feed.xml/route.ts` 補 RSS enclosure length（建置時 `generate:audio-lengths` → `data/audio-lengths.json`，route 禁止 runtime 掃 public/）；新增 `scripts/generate-indexnow-key.ts`（prebuild）＋ `scripts/submit-indexnow.ts`（sync 後 best-effort、fail-soft、`--dry-run`）＋ `.github/workflows/sync-apple-podcast.yml` 新步驟；新增 `scripts/verify-geo.ts`（`npm run verify:geo`，已入 `npm run check` 尾端）。完整營運手冊見 [docs/GEO.md](./docs/GEO.md)。
**剩餘（使用者手動）：** 設定 `INDEXNOW_KEY`（GitHub Secret + Vercel env，須同值，見 docs/GEO.md §3）；Google Search Console／Bing Webmaster 提交（見 docs/GEO.md §6）；每週量測記錄（GSC／Bing Webmaster／Vercel logs／AI prompt baseline 五題，見 [docs/GEO-BASELINE.md](./docs/GEO-BASELINE.md)）；部署後可跑 `npm run verify:geo-live -- --base-url=…`（見 docs/GEO.md §7）。

### 壓縮 Podcast 音檔　`P2 · S · 無`　〔content〕
ffmpeg 將每集 `audio.mp3` 壓到 mono 128kbps、目標 < 5MB（現每集 5–10MB，總 50MB+）。睡前=手機弱網，載入慢。指令見 README；壓後本機聽確認音質再覆蓋。

### ~~每集專屬 FAQ（episodeFaq sidecar）~~　`P1 · M · 無`　〔content+eng〕 ✅ `165b44e`
新增 `data/episode-faqs.ts` sidecar：每集 1 題緊扣該集劇情／主題的 FAQ（非模板換名），`data/content.ts` `enrichStory()` 合併進 `Story.episodeFaq`；`lib/story-geo.ts` `storyFaqs()` 有值時放最前面，其餘 3 題通用 FAQ 順序不變（可見區＝FAQPage JSON-LD 同一份資料）；有則附 1 行到 `llms-full`。契約補進 [docs/GEO-CONTENT-CONTRACT.md](./docs/GEO-CONTENT-CONTRACT.md#episodefaq已上線)。目前 `getStories()` 23 集**全數覆蓋**（`episodeFaqCoverage()`／`verify:geo` 摘要「Unique episode FAQ coverage」皆 23/23，2026-07-29 覆核）；`verify:geo` 對 FAQ 缺漏／多餘 slug 會 fail，不得逐字重複 `familyActivity`／`reflectionPrompt`／`parentGuide`（`hasDuplicateGuideText` 迴歸測試）。測試：`data/episode-faqs.test.ts`、`lib/story-geo.test.ts`、`scripts/generate-llms-full.test.ts`。**待補齊：** 無（全數覆蓋）；新增集數時若暫無空寫優質題目，寧可留白，缺漏 slug 補在本行下次更新。

## 待議：主持人／創作者實體強化

> **狀態：待議** — 以下**非**已核准工項；正式上線前再決定是否實作。**本階段不實作 Person JSON-LD／主持人照片／社群 sameAs。**

- 討論馬米的公開定位：創作者、編劇、主持人、製作人
- 討論 Bonbon 的公開定位與兒童隱私邊界
- 評估 About 頁創作者介紹
- 評估 Person JSON-LD 固定 `@id`
- 評估 creator／author／contributor 的分工
- 評估創作者社群 sameAs
- 正式上線前再決定是否實作

### ~~家長放大閱讀（viewport 縮放）~~　`P2 · S · 產品決策`　〔design〕 ✅
**已決並實作：** `app/layout.tsx` 移除 `maximumScale`／`userScalable: false`，開放 pinch-zoom，家長共讀可放大文字／插圖（WCAG 1.4.4）；`DESIGN.md` 已同步 viewport 原則。**剩餘（可選）：** 實機驗證 3–5 歲誤觸縮放是否影響操作；若困擾再評估「大字模式」而非重新鎖縮放。

### 篩選 chip 觸控與鍵盤順序　`P2 · S · 無`　〔design〕
實機確認車種 chip 觸控區 ≥ 44×44px；Tab 順序：主 CTA → chip 列 → 第一張故事卡。兒童/家長多觸控，鍵盤使用者需可「選車種 → 開第一集」。`StoryFilter` 已用 `<button>`，`globals.css` 有 `:focus-visible`。

### ~~StoryFilter 區塊塗鴉一致性~~　`P2 · S · DESIGN.md`　〔design〕 ✅ `306b989`
**裁決：刻意留白。** DESIGN.md v0.2 改為插畫主導＋克制 chrome；StoryFilter／LatestHero／StoryCard 無 Doodle；Footer ≤2 極淡點綴。不再補中段塗鴉。

## 車車宇宙樂園地圖（已完成 → 已封存）

> R0–R2、MAP-UX、遨遊升級、兒童易用性全文見 [archive](./docs/archive/TODOS-completed-2026-07-11.md)。MAP-ROAM-2～5 已入主線（`3166cc5`、`503ad8b`）。

**紅線（勿動）：** `useMapCamera`／`ZoneSheet` 核心、zones 座標、zone-art-tile 契約、地圖固定淺色場景。

---

## P3 — 可靠 / 工程 / 可選

### 錯誤／上線監控　`P3 · S · 無`　〔ceo〕
接輕量 client error 上報（Sentry free / Vercel）+ uptime（UptimeRobot），至少涵蓋首頁與一個播放頁。站掛了、播放器某機型崩了要有人知道。純 SSG，client error 為主要風險（播放器、iOS 合成破圖回歸）。

### Playwright E2E CI 接入 + 擴充　`P3 · M · 無`　〔eng〕
本地已有 `e2e/smoke.spec.ts`、`e2e/a11y.spec.ts`、`e2e/universe-map.spec.ts`（25 tests）。待做：CI workflow 接入 + [UX-P1-5](#兒童-ux-與親子互動稽核2026-07-11) 觸控 assertion 擴充。

### ESLint CI 設定　`P3 · S · 無`　〔eng〕
`next lint` 改非互動設定（`eslint.config.mjs` + `@next/eslint-plugin-next`）以接 CI。目前會跳首次設定精靈，無法在 CI 用。

### 車車圖鑑養成（疊加於已上線 `/characters`）　`P3 · M · craft / 進度規格`　〔ceo+research+stem〕
`/characters` SEO 角色頁與 JSON-LD 已上線（`f3687e0`），角色資料讀 `data/characters.json`，故事頁也已可連到角色錨點。不要再另開「新頁 `/characters`」任務；剩餘產品工作併入 STEM-P3 車庫養成：聽完／完成 craft 後以 localStorage 解鎖角色或車款、補一句中文個性文案、決定灰階/問號/貼紙呈現。

### 成長與商業（依階段）　`P3 · L · 營運階段`　〔growth〕
逐步把官網從「連結集合」變「成長與變現中樞」：贊助 landing、周邊／活動、多語等。親子 IP 可先不做電商。**訂閱與 freemium 細節見 STEM-P4，勿在 P1 互動驗證前上付費牆。**

### ~~同步後生圖通知（GitHub Issue）~~　`P2 · S · 新集偵測`　〔eng+ops〕 ✅
GHA 同步新集並 push 成功後，`scripts/sync-alert.ts notify-live` 會開 `[illustrate] 新集待生圖：ep-N` Issue（標籤 `illustration`，可 assign／@mention 觸發 GitHub App 手機通知）；失敗與 RSS stale 也走 GitHub Issue 告警。`113680a`

**缺口已補（本機繞過 Actions 漏通知）：** 本機 `npm run sync:apple` push 後另跑 `npm run sync:notify`（同一 `notify-live` 路徑，讀 `.cache/sync-run-report.json` 開／去重 Issue）；可選 `npm run sync:notify:reconcile` 補漏（≤3 筆、跳過已存在 open/closed 同標題單）；`SYNC_ALERT_DRY_RUN=1` 預覽、`--strict` 讓本機失敗可非 0；`dryRun`／逾 24h stale report 拒絕開單。GHA workflow 未變動。詳見 README「同步通知」。`9586153`

### ~~同步 commit 訊息帶生圖提示~~　`P2 · S · 無`　〔eng+ops〕 ✅
GHA commit body 已由 `scripts/post-sync-notify.ts` 產生，列出本輪新 slug、字幕狀態、`npm run illustrate -- ep-N` 與完整生圖 checklist。`95ba69a`

### 生圖佇列 `data/illustration-queue.json`　`P3 · S · 通知基建`　〔eng+ops〕
`sync-apple-podcast.ts` 新集寫入 `{ slug, ep, syncedAt, subtitleReady, status: awaiting-illustrate }`；`illustrate --approve` 改 `approved` 或移除。Issue／webhook／未來 Studio 儀表板共用單一真相來源。

### Game Kit 歷史路線（Phase 0–8） ✅

Phase 0–8 的探索已完成並在 2026-06-25 收斂。現行架構只保留四款已出貨遊戲真正使用的能力：

- `lib/gamekit/adapter.ts` + `lib/gamekit/host/GameHost.tsx`：統一生命週期（遷移中，見上表）
- `lib/gamekit/react/`：React hooks 與觸控控制
- `lib/gamekit/runtime/`：loop、輸入、渲染、音訊、juice、程序圖塊
- `lib/gamekit/progress/`：設定、存檔 migration、獎牌與 session
- `lib/gamekit/games/`：大冒險關卡、各遊戲 Adapter、Candy Kart bridge

舊 Phase scaffolding（state machine、scene、pool、abilities、tilemap、Tiled loader、sprite adapter）已移除。歷史變更見 [CHANGELOG.md](./CHANGELOG.md)，現行規範見 [GAMEKIT-ART-BIBLE.md](./docs/GAMEKIT-ART-BIBLE.md)／[GAMEKIT-ADAPTER.md](./docs/GAMEKIT-ADAPTER.md)。

### ~~車車卡丁車 Kart P0 — Scaffold~~　`P3 · M · 無`　〔eng〕 ✅
`kart-game/`（Vite+TS+Three）：固定步進、kinematic 方塊車、spline 練習道、跟隨相機、HUD；`npm run build:kart` → `public/kart/`；`/games/kart` iframe 嵌入。

### ❄️ FROZEN — 待 STEM-P1 Gate 之後｜四款 pixel 精進

> **玩法凍結：** 下列精進、kart P1–P6、多人功能暫不實作。canon 四款維持現況。

### ① 車車吃星星精進　`已移除 · car-star`　〔eng+design〕
（遊戲已下架；歷史規格僅供對照。）

### ② 繽紛方塊精進　`P3 · M · Game Kit Phase 2`　〔eng+design〕 ❄️ FROZEN
像素方塊皮膚、Marathon/Sprint/Ultra/**兒童模式**（慢速、不會輸）、消行音畫 juice（依音階奏音）、T-spin/combo 計分（挑戰模式）。

### ③ 車車大冒險精進　`P3 · L · Game Kit + Tiled`　〔eng+design〕 ❄️ FROZEN
Tiled 關卡管線、6–10 關+世界地圖、檢查點、多敵人類型、視差背景、boss 關。

### ④ 溫柔任務（car-mission）精進　`已移除 · car-mission`　〔eng+design〕
（遊戲已下架；歷史規格僅供對照。）

### kart P1–P6、多人　`❄️ FROZEN — 待 STEM-P1 Gate 之後`

### ~~遊樂園 hub 世界地圖化~~　`P3 · M · Phase 6 meta`　〔design+eng〕 ✅
`/games` 新增 `GamesWorldMap`（星星、三星、車庫、貼紙簿、各款最佳）；保留遊戲卡片入口。

---
## 營運管線：SoundOn／Apple 同步 × 生圖

> **關係：** SoundOn 上架 → Apple Podcasts RSS（SoundOn 託管 feed）→ `npm run sync:apple`（GHA 每 15 分或手動）→ 站上 **MVP**（單封面）→ **人工**生圖 → 完整繪本版。官網與 SoundOn **不直連**；只讀 Apple 公開 RSS。詳見 [README — Apple Podcasts 自動同步](./README.md#apple-podcasts-自動同步)。

### 觸發來源

| 來源 | 準時性 | 用途 |
|------|--------|------|
| `repository_dispatch`（外部 cron 打 API） | 準時 | 主要定時（cron-job.org 等） |
| `schedule`（GitHub cron `*/15`） | best-effort，常延遲 | 後備 |
| `workflow_dispatch` | 即時 | SoundOn 上架後手動 Run |

### Phase 1 — CI 自動（GHA，已實作）

| # | 項目 | 產出 | 備註 |
|---|------|------|------|
| 1 | Checkout + `npm ci` | — | Node 22 |
| 2 | Whisper 安裝（ffmpeg + large-v3） | `models/ggml-large-v3.bin` | 快取 ~3GB |
| 3 | iTunes Lookup → RSS | SoundOn 託管 feed URL | 無 API key |
| 4 | 解析 RSS、比對 `seenGuids` | — | 每輪最多 **3 集**新集 |
| 5 | 更新既有集 metadata | title／date／duration／summary | 不重下載音檔 |
| 6 | 下載新集音檔 | `public/stories/ep-N/audio.mp3` | 上限 50MB |
| 7 | 下載 Apple 封面 | `01.jpg` | 單圖 MVP |
| 8 | Whisper 轉錄 | `data/subtitles/ep-N.json` | 草稿，需人名校對 |
| 9 | 寫入 metadata | `data/apple-synced.json` | `pageCount: 1` |
| 10 | 更新狀態 | `data/apple-sync-state.json` | guid 對照 |
| 11 | 車種／標籤推斷 | vehicle、tags | 關鍵字或「其他」 |
| 11b | **找車車索引** | `data/browse-index.json` | 新車種 emoji、新主題 symbol；`npm run verify:browse-index` |
| 11c | **catalog sidecar** | `story-zones`／`reflection-prompts`／`story-dates` | 缺 key 才 upsert；解除完備測試擋 push |
| 12 | 字幕 backfill | 缺字幕的舊集補轉 | 同 run 內 |
| 12b | 簡轉繁 + 幻覺過濾 | `relocalizeSidecars` | 同 run 內 |
| 12c | **字幕自動 `--fix`** | 本輪新集／新轉錄 `ep-N` 品牌名修正 | 不 `--mark`；report 寫入 `proofreadAutoFixed` |
| 13 | `npm test` + `npm run build` | — | 有變更才跑 |
| 14 | Commit + push `main` | Vercel 部署 MVP | 見下方 commit 範圍 |
| 15 | **生圖通知** | GitHub Issue | 已實作：push 成功後開 `[illustrate]` Issue（`113680a`） |

**GHA 目前 `git add` 範圍：** `data/apple-synced.json`、`data/apple-sync-state.json`、`data/browse-index.json`、`public/stories/`、`data/subtitles/`、`data/story-zones.ts`、`data/reflection-prompts.ts`、`data/story-dates.ts`、`data/episode-faqs.ts`、`data/audio-lengths.json`。

**GHA 不會碰：** `public/.illustrate-staging/`、`data/apple-sync.defaults.json`（approve 寫入 overrides）、`data/characters.json`、`data/scenes/` — 生圖產物需**人工 commit**。

> **根因備註（#46，2026-07-15）：** 先前 sync 已成功下載／轉錄 ep-19，但 `npm test` 因缺 zone／reflection／dates 三 sidecar 失敗而永不 push。現改由 `scripts/lib/sync-catalog-sidecars.ts` 在新集寫入時自動 upsert，並納入上列 `git add`。

### Phase 2 — 同步後人工（生圖前）

| # | 項目 | 負責 |
|---|------|------|
| 16 | 收到 GitHub Issue 通知 | 維護者 |
| 17 | 抽查站上 MVP | `/story/ep-N` 能播、封面正確 |
| 18 | 最終校稿 + `--mark` | GHA 已跑 `--fix`；人工抽查後 `npm run proofread:subtitles -- ep-N --mark`（[SUBTITLE-PROOFREAD.md](./docs/SUBTITLE-PROOFREAD.md)） |
| 18b | 覆寫反思 stub＋確認 zone | sync 寫入的 MVP stub／推斷 zone；改寫 `reflection-prompts.ts`、必要時改 `story-zones.ts` |
| 19 | 確認車種／標籤 | `apple-sync.defaults.json` overrides；必要時手動補 `data/browse-index.json` patterns |
| 20 | （可選）`npm run font:subset` | 新摘要有生僻字時 |

### Phase 3 — 生圖管線（本機，需 `OPENAI_API_KEY`）

| # | 指令／步驟 | 產出 |
|---|-----------|------|
| 21 | `npm run illustrate -- ep-N --segment-only` | `data/scenes/ep-N.json` |
| 22 | `npm run illustrate -- ep-N` | staging 圖 + `contact.html` |
| 23 | 審圖 | 逐幕檢查走樣／角色 |
| 24 | `--scene N`／`--char 名` | 單張重抽（可選） |
| 25 | `npm run illustrate -- ep-N --approve` | `02.jpg`～`NN.jpg` + `pageCount` + `captionTimes` + `captions` |
| 26 | `npm run verify:episodes` | 對照 ep-9／ep-10 標準（見 [docs/EPISODE-WORKFLOW.md](./docs/EPISODE-WORKFLOW.md)） |
| 27 | `npm run sync:apple && npm run build` | overrides 併入 synced |
| 28 | Commit + push | 含 `public/stories/`、`defaults`、`characters`、`scenes` |
| 29 | 關 Issue／清佇列 | 標記生圖完成 |

詳見 [README — 每集劇情插圖自動生成](./README.md#每集劇情插圖自動生成npm-run-illustrate)。

### Phase 4 — 營運（可選）

| # | 項目 |
|---|------|
| 29b | **YouTube 整集 mp4** | `npm run export:video -- ep-N` → Studio 手動上傳（[VIDEO-EXPORT.md](./docs/VIDEO-EXPORT.md)） |
| 30 | Threads／IG 貼文（單集 URL + OG） |
| 31 | 平台訂閱提醒 |
| 32 | 家長向新集說明（見 P2「新集通知路徑」） |

### 端到端時序（一集新故事）

```
T+0     SoundOn 上架
T+15m   外部 cron → GHA sync
T+20m   ep-N MVP 上線（1 封面 + 字幕草稿 + GHA 自動 --fix）
T+20m   GitHub Issue：「請生圖 ep-N」
T+1d    最終校稿 → --mark → illustrate → 審圖 → approve
T+1d    push 完整繪本版
T+2d    社群貼文（B 戰場）
```

### 生圖通知方案（實作優先序）

| 期 | 方案 | 說明 |
|----|------|------|
| **一期** | D commit 訊息強化 + A GitHub Issue | 已實作，零／低依賴，可追蹤 checklist |
| **二期** | C `illustration-queue.json` + Studio 顯示 | 機器可讀佇列 |

**已砍：** 外部 webhook 即時推播。LINE 舊推播服務已於 2025-03-31 終止；現行 GitHub Issue + GitHub App 手機通知已足夠，不再新增 secret 或 webhook 維護面。

**GitHub Issue 範本（一期）：**

```markdown
## 新集待生圖：ep-N

- 同步：{ISO 時間} · 觸發：Apple RSS（SoundOn）
- 狀態：MVP 已上線（pageCount=1），待多頁插圖

### Checklist
- [x] GHA 已自動 proofread --fix（Bonbon／馬米等品牌名）
- [ ] 最終校稿 `data/subtitles/ep-N.json` → `npm run proofread:subtitles -- ep-N --mark`
- [ ] npm run illustrate -- ep-N --segment-only
- [ ] OPENAI_API_KEY=... npm run illustrate -- ep-N
- [ ] 審 public/.illustrate-staging/ep-N/contact.html
- [ ] npm run illustrate -- ep-N --approve
- [ ] npm run sync:apple && npm run build → commit push
```

### ep-18 上架進度（2026-07-07）

| 步驟 | 狀態 | 備註 |
|------|------|------|
| 字幕校對 + `--mark` | ✅ | 189 句；噗噗豬／飄飄河／靛紫／鞦韆；刪除 Whisper 幻覺段；補收尾反思台詞 → `3cbb28d` |
| `illustrate --segment-only` → 生圖 → `--approve` | ✅ | 18 幕全幕繪本；場景手修 ep-16/17 標準；`verify:episodes` 全過 → `7d85fd3` |

### ep-19 上架進度（2026-07-15）

| 步驟 | 狀態 | 備註 |
|------|------|------|
| 字幕校對 + `--mark` | ✅ | 115 句；重轉錄補齊 0–120s；刪幻覺／重複；`_proofread/ep-19.json` |
| `illustrate --segment-only` → 生圖 → `--approve` | ✅ | 17 幕全幕繪本；定裝手修；幕 6／7 改單純相撞（多多無車門）；`verify:episodes` 全過 → `0dd9705` |

### ep-22 上架進度（2026-07-24）

| 步驟 | 狀態 | 備註 |
|------|------|------|
| 字幕校對 + `--mark` | ✅ | 184→180 句；刪「我叫Bonbon」幻覺；海龜老師暖暖／挖土機東東／笑話呢／又驚又喜；補「三號是誰」→ `_proofread/ep-22.json` |
| `illustrate --segment-only` → 生圖 → `--approve` | ✅ | 24 幕全幕繪本；車無手／#4#5 單臉／#11–12 多多不在台；見本 commit |

### ep-23 上架進度（2026-07-30）

| 步驟 | 狀態 | 備註 |
|------|------|------|
| 字幕校對 + `--mark` | ✅ | 167 句；補開場「車車遊樂園」；再到／速限／勿拉長／蘭陽平原；刪幻覺句 → `_proofread/ep-23.json` |
| 定裝照 | ✅ | 小紅賽車的爸爸（俏皮翹鬍子在車前臉、號碼 1）；小紅 alsoIn +ep-23 |
| `illustrate --segment-only` → 生圖 → `--approve` | ✅ | 26 幕全幕繪本；禁手；定裝對齊；23／24 頁序對調 → `6d9012b` |

### ep-24 上架進度（2026-08-09）

| 步驟 | 狀態 | 備註 |
|------|------|------|
| 字幕校對 + `--mark` | ✅ | 134→133 句；整集重轉錄補尾段；刪害羞重複句／「第一次發現」；修找找看／她／語病 → `_proofread/ep-24.json` → `0c4ccf6` |
| 定裝照（年齡變體） | ✅ | hero isolate：小紅賽車年幼版（青綠奶嘴）、小紅賽車的爸爸年輕版（正面翹鬍子）；年輕爸審後重抽 → `0c4ccf6` |
| `illustrate --segment-only` → 生圖 → `--approve` | ✅ | 19 幕全幕繪本；分齡定裝（回憶年幼／年輕爸、當下現在版）；#15–17 爸臉 FACE LOCK 重抽；keepCover 01 → `79ca151` |

### ep-21 上架進度（2026-07-29）

| 步驟 | 狀態 | 備註 |
|------|------|------|
| 字幕校對 + `--mark` | ✅ | 132 句；彭彭→Bonbon、芝芝→知知；補開場「車車遊樂園」；修「上的車／出車／到鄉去／我還以為人家在開車」→ `_proofread/ep-21.json` |
| 定裝照 | ✅ | 自動駕駛計程車知知（ep-21 hero 隔離）；與 ep-3 黃色計程車分離 |
| `illustrate --segment-only` → 生圖 → `--approve` | ✅ | 18 幕全幕繪本；知知白車定裝；禁手；審後重抽 #2／6／8–11／12–14／17–18；見本 commit |

### ep-20 上架進度（2026-07-18）


| 步驟 | 狀態 | 備註 |
|------|------|------|
| 字幕校對 + `--mark` | ✅ | 137 句；阿妮→阿尼、觀景台／TOMICA／玩完；`_proofread/ep-20.json` |
| 定裝照 | ✅ | 水泥車阿尼（封面 ref）；吊車阿公別名→吊車老爺爺；東東 alsoIn |
| `illustrate` → 審圖 → `--approve` | ✅ | 18 幕全幕繪本；重抽 06／11／14／15／18（去手臂、彩虹 101）；`verify:episodes` 全過 → `0e352f9` |

### 現況缺口（勿忘）

- 同步與 `illustrate` **完全脫鉤**；腳本僅 log「請視需要補 overrides」。
- 無 `illustrationStatus` 欄位；`ep-8`（1 頁）vs `ep-9`（8 頁）即典型落差。
- CI **不放** `OPENAI_API_KEY`；生圖永遠本機手動 + 人工審圖（設計如此）。

---

## 延後（現階段不優先）

| 項目 | 原因 |
|------|------|
| ~~Email 電子報~~ / 會員 | **名單收集已升級為主動任務**（見 [名單收集 × 內容再利用](#名單收集--內容再利用2026-07-03-品牌盤點) LIST-2：僅收名單不寄信）；**正式會員制見 STEM-P4** |
| 著色頁／活動單 PDF | **已納入 STEM-P3 列印物**；線上著色本 `/games/coloring-book` 已另開（與 PDF 分開） |
| 部落格長文 SEO | 初期單集頁 + 平台關鍵字效益較直接 |
| 網站內 RSS 播放器 | 訂閱導向 Spotify／Apple 即可 |
| Service Worker 離線快取 | 弱網需求成立但 MP3 快取容量／更新策略風險高；P1–P2 先做信任、訂閱與量測 |
| ~~睡前模式／季節主題皮~~ | **已完成夜晚模式＋跟隨系統**（見 Completed）；季節主題皮仍延後 |
| 全站 redesign／換字體 | 字型維持 Baloo＋huninn；chrome 已依 Apple 原則升級（2026-07-17），不做 SF Pro／成人產品換皮 |
| 首頁 3 欄 icon 功能介紹 | 違反 AI slop 黑名單，與品牌不符 |
| 首頁列表「大圖單欄」模式 | 需先確認主攻 3–5 歲與實際瀏覽行為；現左圖右文在 5+ 較合適，非本季主戰場 |
| 四款 pixel 精進 | 已移至 [RESEARCH.md — 四款小遊戲精進](./RESEARCH.md#2026-06-09四款小遊戲精進方案對標可市售-pixel-game)；玩法與美術升級全部 ❄️ FROZEN，待 STEM-P1 gate 後再排 |
| iOS sticky 篩選列復活 | 除非有 fixed 複製列方案且通過 iOS 26 實機 |
| 兒童照片上傳／分享手作作品 | COPPA／兒童隱私風險高；見 [RESEARCH.md](./RESEARCH.md) 待確認；可先只做本機「完成」勾選不傳圖 |

---

## 車車宇宙樂園地圖改善（資產／互動／許願／埋點）　`feature · M · /adventures`　〔eng+design〕

> **Gate：** 已核可並完成實作（2026-07-02）。

| Task | 狀態 | 主要產出 | Commit hash |
|------|------|----------|-------------|
| task-1 資產減重 WebP | 完成 | `optimize:adventures`、島 tile `<picture>`、SVG 海面 WebP 偵測 | `a527411` |
| task-2 鎖島微互動 | 完成 | 果凍晃動 + `playSfx(tap)` + 狀態泡泡 | `9eab5fd` |
| task-3 許願表單 + API | 完成 | `POST /api/zone-wish`、Neon schema、`ZoneWishForm` | `8a490c7` |
| task-4 埋點 | 完成 | `universe_zone_tap` 等四事件 | `5673f19` |
| task-5 深連結 | 完成 | `/adventures?zone=dino` + `router.replace` | `5673f19` |
| task-6 收尾 | 完成 | 本段 + 首屏傳輸對照 | `d54453d` |

### 首屏傳輸量（spec 定義：car-park@DPR + sea + 遠景 1x + map roamers）

| 資產 | PNG（改前） | WebP（改後） |
|------|------------|-------------|
| sea | 1952 KB | 56 KB |
| car-park@2x | 287 KB | 46 KB |
| far-island-a + b（1x） | 212 KB | 19 KB |
| xiao-hong + duo-duo | 67 KB | 67 KB（已有） |
| **合計** | **~2518 KB** | **~188 KB** |

### Vercel 後台 env

| 變數 | 用途 |
|------|------|
| `DATABASE_URL` | Neon Postgres（未設時許願表單降級 mailto） |

Migration：`scripts/migrations/001_zone_wishes.sql`

---

## 注意力鉤子三件套（familyActivity / 故事許願 / 集數↔地圖）　`feature · M · feat/attention-hooks`　〔eng+growth〕

> **Gate：** 已核可（plan-first）。分支 `feat/attention-hooks`；每 Task 獨立 commit，前綴 `feat(hooks):`。

| Task | 狀態 | 主要產出 | 驗證 | Commit hash |
|------|------|----------|------|-------------|
| HOOKS-1 familyActivity 三通路 | 完成 | `data/family-activities.ts` sidecar、`FamilyActivityCard`、RSS／FAQPage JSON-LD／llms-full 附加 | `npm test` + `npm run build` 全綠 | `ef1795e` |
| HOOKS-2 故事許願類型 | 完成 | `002_zone_wishes_category_message.sql`、表單 segmented control、`wish_submitted` 事件 | migration 冪等；無 DB 降級 | `d9524c3` |
| HOOKS-3 集數↔地圖互連 | 完成 | `data/story-zones.ts`、`getStoriesByZone`、`ZoneBadge`、ZoneSheet 故事清單、RSS 地圖深連結 | 雙向連結；首屏 bundle 不增重 | `2893e96` |

### 手動步驟（HOOKS-2 上線後）

- Neon：`psql "$DATABASE_URL" -f scripts/migrations/002_zone_wishes_category_message.sql`
- Vercel：沿用既有 `DATABASE_URL`，無新 env

---
## Completed（已歸檔）

- [docs/archive/TODOS-completed-2026-07-11.md](./docs/archive/TODOS-completed-2026-07-11.md)
- [docs/archive/TODOS-completed-2026-07-04.md](./docs/archive/TODOS-completed-2026-07-04.md)
