# Changelog

本專案變更紀錄。格式參考 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)。

## [Unreleased]

### Added

- **首頁新增探索區（`ExploreGrid`）**：在頁尾 snap pane 之上、**不新增第五個 scroll-snap 段**。左側地圖大卡連 `/adventures`（沿用既有島嶼美術，非新生圖），右側六格磁貼牆——兒童組（全部故事／遊樂園／繪本著色／角色圖鑑）在前且權重較大，家長組（親子指南／親子景點）在後降一階。磁貼一律 `<Link>`、標籤為可見 HTML 文字、圖徽沿用行動抽屜同一批 emoji（零新圖片位元組）。首頁 HTML 因此常駐 7 個內容頁入口。**未改** Apple sync workflow。

### Changed

- **頂欄收斂為三入口**：品牌 pill（即首頁）＋帶文字的「選單」觸發器（緊接品牌右側）＋右側「訂閱」「留言」。桌面膠囊主列只留兒童三入口（全部故事／遊樂園／宇宙地圖）；角色圖鑑、繪本著色、親子指南、親子景點改由抽屜承接。主題切換移出頂欄、改在抽屜底部。「訂閱收聽」精簡為「訂閱」，平台清單為空時退為站內 `/subscribe` 而非整顆消失。新增「留言」入口（`feedbackHref()`：`NEXT_PUBLIC_FEEDBACK_FORM_URL` → 未設定降級 mailto，恆有目的地），**放在抽屜「給爸媽」組而非頂欄**——env 未設時它與頁尾「聯絡我們」、ConnectHub Email 指向同一信箱，頂欄再放一個等於首頁有三個同信箱入口。**未改** Apple sync workflow。
- **漢堡抽屜連結改常駐 DOM**：關閉時以 `display: none` ＋ `inert` 隱藏，不再 `{open && …}`——關閉態的 HTML 現在含全部站內連結（爬蟲可讀）。抽屜在所有寬度都可開；新增「首頁」列、「留言」列與家長組小標「給爸媽」（探索組維持無標題），共 9 列。同時只允許一個浮層開著，跨 980 斷點自動關閉，開啟時焦點移入第一個連結、關閉還給觸發器，點外部亦可關閉。目前頁不再與 hover 共用底色（改加 accent bar ＋加粗）。**未改** Apple sync workflow。

### Fixed

- **`.env.example` 修正 `NEXT_PUBLIC_FEEDBACK_FORM_URL` 的契約敘述**：原本只寫「未設定則不顯示該按鈕」，但該變數現有**兩個行為不同的消費點**——`SiteHeader` 圓鈕是 env-gated（未設定不渲染），`SiteNavBar` 抽屜的「留言」走 `feedbackHref()` **恆有目的地**（降級 mailto）。已分別說明，並註記未設定時該 mailto 會與頁尾「聯絡我們」、ConnectHub Email 指向同一信箱。**未改** Apple sync workflow。

- **CI e2e 睡前定時提示受 UTC 睡前窗影響**：`child-ux` 鎖定 `theme: light`，避免 GitHub runner 在 19–06 UTC 把 system 解析成夜晚、對話框不出現。宇宙地圖空白海取點改掃邊緣並在 click-zoom 斷言前略縮，降低島面蓋滿取樣點的 flake。**未改** Apple sync workflow。

### Changed

- **Landing CTA 改標題字級**：分區 CTA 桌面 `--fs-h3`、手機 `--fs-h4`，明確套 Baloo／Huninn，不再用內文／標籤字。**未改** Apple sync workflow。
- **Landing CTA 加大並改奶油黃字**：桌面 `--fs-h2`、膠囊 56px、白邊、玻璃 `0.38`；字色 `--c-yellow`。**未改** Apple sync workflow。
- **頁尾拿掉「給家長：點播放鈕…」導讀**。親子遊樂地圖的資料提醒仍可顯示。**未改** Apple sync workflow。
- **Landing 刪段編號、CTA 改長句＋深色玻璃 ghost**：四段 hero 不再顯示 01/04；可見 CTA 改為長句段名（車車遊樂園的故事／數綿羊123．睡前故事／好好玩的捏黏土／好習慣故事），`href` 不變；SegmentNav 與宇宙地圖 `getCarParkLinks` 用 `navLabel` 短標。分區 CTA 改深色玻璃 ghost（48px、`rgba(0,0,0,0.32)`），非橘 pill；`.next` 往下箭點降權並加極淡深色底；深色玻璃 CTA／往下箭補 `focus-visible`（`--on-dark`）；宇宙地圖黏土外連 `aria-label`「另開 YouTube」。**未改** Apple sync workflow。
- **去框 A′（stories／ConnectHub）**：`StoryCard`、`LatestHero` 等有封面卡移除盒子描邊與 1px 色環，改靠 `--elev-*`；無影像塊（`ConnectHub.block`、`StoryFilter.filterBar`）保留 `--hairline` + elevated surface。`SiteFooter`／`SiteNavBar` 膠囊白邊未動。**未改** Apple sync workflow。
- **頁尾拿掉安心訊號列**：不再顯示「無廣告 · 不收孩子帳號 · …」；宇宙地圖／家長儀表的 ParentTrustStrip 仍在。**未改** Apple sync workflow。
- **頁尾拿掉遊樂園入口**：首頁／全部故事 footer 不再放「去遊樂園玩」；遊樂園仍從頂欄與漢堡進。**未改** Apple sync workflow。
- **找故事拿掉欄位副標**：篩選列不再顯示「車車」「主題」小標；下拉觸發鈕仍有 `aria-label`。**未改** Apple sync workflow。
- **單集摘要 ingest 截短**：Apple／SoundOn ingest 截掉宣傳尾段（IG／五星／linktr.ee／👶 家長註），摘要約 68 字；`LatestHero` 說明最多 3 行。**未改** Apple sync workflow。
- **行動漢堡拿掉搜尋列**：抽屜只留分區連結；故事搜尋仍在 `/stories`。**未改** Apple sync workflow。
- **頁尾拿掉「隱私說明」連結**：安心訊號列只留「無廣告 · 不收孩子帳號 · …」；條款仍從「使用條款與免責聲明」進 `/legal`。**未改** Apple sync workflow。
- **ConnectHub「訂閱追蹤」改「社群」**。**未改** Apple sync workflow。
- **ConnectHub「收聽」改「頻道」**：拿掉「訂閱後，新集會自動出現在你的 Podcast App」副標。**未改** Apple sync workflow。
- **頁尾遊樂園入口拿掉副標**：首頁 footer「去遊樂園玩」不再顯示「小遊戲 · 免下載」。**未改** Apple sync workflow。
- **行動漢堡拿掉外框**：`SiteNavBar` 漢堡鈕改透明底、無邊框，只留 44px 線條 icon，貼齊桃色頂欄；夜間開啟選單時也不再另加玻璃底板。**未改** Apple sync workflow。
- **Landing 拿掉疊圖主標與聽最新一集**：四段 hero 標題改 CSS module 視覺隱藏（不用全域 `.sr-only`，以免跟首段 siteIntro 契約撞車）；不再渲染「聽最新一集／播一集睡前故事」直達鈕，只留分區 CTA（全部故事／睡前故事等）。頂欄品牌「車車遊樂園」不動。**未改** Apple sync workflow。
- **親子遊樂地圖退役全國視角地圖**：未選縣市且未定位時不再提供「看地圖」；無縣市的 `?view=map` 進頁改為名單並清掉該參數。地圖只服務已選縣市或「附近」。縣市內 z9–12 仍用 spatial cluster。**未改** Apple sync workflow。
- **親子遊樂地圖 coverage 文案**：`coverageHeadline` 改為「已收錄 N 縣市、共 M 處可造訪」，有休園時再接「（另 K 處休園整修中）」；K 從資料現算。親子指南工具卡與地圖頁共用。**未改** Apple sync workflow。

### Added

- **家長閘門（UX-P0-1）**：`/for-parents/dashboard` 的 `<ParentDashboard />` 前需解兩位數×一位數算術題（`sessionStorage` per-tab）。頁首、h1、lede、回指南連結與 sitemap 仍可索引。不含 GameKit／`kidsMode`。這是減速帶不是安全機制。**未改** Apple sync workflow。
- **ep-27 草稿字幕**：`data/subtitles/ep-27.json`（Whisper large-v3 草稿、未 `--mark`）。GHA run 32964051895 已轉錄並通過 `npm test`／build，但 `protect-main-web` 無 github-actions bypass，直推 `main` 被 GH013（缺 quality／build-and-public-e2e／Vercel）。本機重跑 `npm run transcribe -- ep-27` 後走 PR 上架。**未改** Apple sync workflow。
- **ep-27 MVP**：本機 `sync:apple` 上架「小紅豆汽車勇敢上學｜想媽媽的時候怎麼辦？」（單封面、`pageCount=1`）。本機無 Whisper，字幕 sidecar 未寫入；GHA 後續可補轉錄。對應 #117（RSS 已有新集、站上未上架）。**未改** Apple sync workflow，也**不**自動生圖。
- **生圖佇列（P3）**：`data/illustration-queue.json` 為機器可讀 overlay；Studio `/studio` 列出 `pageCount=1` 的待生圖集。`illustrate --approve` 與本機 `sync:notify` 寫入狀態。**不改** Apple sync workflow／`sync-apple-podcast.ts`，也不自動生圖。
- **Playwright E2E CI（P3）**：`.github/workflows/ci.yml` 新增 `e2e-child-path`（`npm run test:e2e:ci`：smoke／a11y／宇宙地圖／遊戲／訂閱／UX-P1-5 觸控）。視覺回歸仍不進 CI。**不改** Apple sync workflow。GitHub required merge check 名稱仍是 `build-and-public-e2e`。

### Fixed

- **Apple sync GH013（#129）**：個人倉無法給 GitHub Actions Integration bypass；`Commit and push` 撞 required checks 時改開 `sync/apple-*` PR 並 squash auto-merge。已 `--mark` 字幕不再被 OpenCC 簡轉繁覆寫。**有改** `sync-apple-podcast.yml`（僅 push 失敗路徑）與 `sync-apple-podcast.ts`（略過已校對側車）。
- **release-content 清單含 ep-27**：`docs/PRODUCTION-RELEASE-GATE.md` 的 Episode content／`verify:release-content` 註解改列目前所有 `subtitle-unproofread`（`ep-27`、`ep-26`）。契約測試防止只寫舊集。不 `--mark`、不生圖。
- **GEO live 煙霧 vs MVP 無字幕**：`verify:geo-live` 不再要求最新集一定有 `transcript.vtt` 200。無 `data/subtitles` 側車時改確認**最新 RSS `<item>`** 未宣告任何 `podcast:transcript`、JSON-LD 無 VTT MediaObject，且 VTT 為**直接** 404（`redirected === false`，不接受同 pathname 帶 query 的 redirect）。有側車仍走原契約。**未改** Apple sync workflow。
- **ep-27 播放頁封面**：補 `01.avif`／`01.webp`。StoryPlayer `<picture>` 在 AVIF 瀏覽器會先要 `.avif`，缺檔會 404 且**不會**退回 JPG。`npm run optimize:lcp-images`；**未改** Apple sync workflow。
- **Apple sync `npm test` 淺 clone**：`isReportGitHeadAcceptable` 相關測試不再對工作區跑未保護的 `HEAD~1`（GHA `actions/checkout` 預設 fetch-depth:1 會 `fatal: Needed a single revision`）。改以暫存 git repo 測祖先；**未改** sync workflow／`sync-apple-podcast.ts`。
- **Studio 待生圖面板測試**：改 mock `pendingIllustrationsForStudio`，不再對 live catalog 用 `getByText("字幕尚未校對")`（sync 新 MVP 集會出現第二筆，擋 GHA 無法上架）。**未改** Apple sync workflow。

### Changed

- **LIST-2 訂閱文案誠實化**：`/subscribe` 改為「加入新集通知名單」——目前只收名單、不寄新集上線信或電子報；確認信只用來驗證信箱。`/legal`、`DISCLAIMER.md` 同步，政策版本 `2026-08-26`。ESP／新集上線信另案。

### Removed

- **角色 Logo 識別系統移除**：元件、驗收頁、產圖 CLI、色票與 35 份 prompt 全數移除；`Character` 不再帶 `logoFamily`／`logoFeature`。程式碼保存於 tag `archive/character-logo-system`。

### Added

- **親子遊樂地圖 v2 縣市磚牆＋分組名單**：主瀏覽改成「22 縣市色塊圖＋分組名單」，取代 OSM 底圖當入口。磚牆用 CSS Grid 手排近似台灣地理（不用 GeoJSON），每塊磚同時顯示縣市名與命中數（色深不是唯一編碼）；`covered`／`empty`／`uncatalogued` 三態用邊框與文字雙重編碼，7 個未收錄縣市顯性標示且不可點選，磚牆下方永遠顯示「示意排列，非實際地理位置」與「不代表當地沒有好去處」。手機 <640px 選定縣市後磚牆收合成一行並帶著焦點走。名單依狀態三選一分組（有定位→車程帶／未選縣市→縣市／已選縣市→類型），車程分組必掛直線距離粗估免責。結果列改成句子式「在 全台 → 99 個地方」，結果數放大為主資訊，h2 的 accessible name 由 `srText` 提供。

### Changed

- **親子遊樂地圖 Leaflet 降為次要分頁**：`view=cards`（預設，含桌面）任何寬度都不掛 Leaflet，實測 1280px 首屏 `leaflet`／`tile.openstreetmap` 請求數為 0（e2e 有正向回歸）。桌面 ≥980px 並排只在 `view=map` 生效，CSS 的 980 規則 scope 到 `.root[data-split="true"]`；名單滿版時卡片走三欄。地圖視圖收起磚牆。
- **親子遊樂地圖詳情面板資訊層級**：full 變體把一行 meta 拆成事實 chip 並把**車程放第一格**；出口分兩層（導航／查看完整資訊為主，在地圖看／顯示位置／官網降為文字連結）。compact 變體與所有 `aria-label` 未改。

### Added

- **角色 Logo 次色對主色可辨閘門**：`auditEntry` 對 35 筆要求次色對主色對比 ≥ 1.6 或色相差 ≥ 30（擇一）。識別特徵不得是車身暗一階同色。
- **角色 Logo 對比檢查全欄**：`/studio/logo-audit` 對比表列出 silhouette／hueDist／sil 門檻與 margin／face 與 margin／touches／次色數值與 margin／次色對主色與色相差；單欄未達標標紅。
- **角色 Logo 對比驗證器**：`lib/character-logo-contrast.ts` 以 WCAG 相對亮度計算剪影（primary 對家族背景，硬閘門 3.6）與臉部標記（`#1A1410` 對較亮 IP 色，硬閘門 5.0）。不檢查 secondary 對背景。
- **角色 Logo Phase 5 產圖管線**：`npm run generate:character-logos` 支援 `--pilot`／`--tier`／`--slug`、`--dry-run` 報價、staging contact、`--approve --pick` 寫 512／128／32 webp。預設不呼叫 API；禁止黏土前綴與定裝照路徑；未回填 Pilot 參數前擋 `--tier 2` 生圖。
- **親子遊樂地圖 PR6 editorial recommendation**：新增與景點事實資料分離的 `play-map-editorial-picks` sidecar 與 deterministic resolver；只有在附近／縣市／已提交地圖視野且至少兩筆結果時，依目前意圖、附近距離、編輯優先序與既有結果順序顯示最多一筆「媽米先幫你看」。僅出現在 mobile Card tab 與 desktop 結果欄，點擊沿用既有完整詳情互動，不改 96 筆景點資料、Leaflet、SEO 或其他頁面。
- **親子遊樂地圖 PR5 UX subtraction**：首屏收斂為「附近／雨天／免費／放電／室內」五個主要快捷；好停車／推車 OK／室內外移入進階篩選；全台初始狀態明確標示資料庫與 coverage，行動地圖結果列預設 half，地圖卡片改開 compact preview。保留原有 query 相容性、96 筆資料、SSR hidden-card、SEO 與桌面版行為。
- **親子遊樂地圖 mobile results bottom sheet**：行動版 Map tab 新增 collapsed／half／expanded 三段式景點結果列；沿用既有卡片與 Place Sheet 語意，拖曳只作用於把手，snap 後通知 Leaflet 重算尺寸，不改 URL／SEO／景點資料或桌面並排版面。
- **親子遊樂地圖 contextual quick filters**：快捷列新增「附近／雨天／免費／好停車／推車 OK／放電／戶外／室內」；除「附近」外可組合、可分享並寫入短 query 參數，篩選只使用既有 normalized tags／facilities／indoor 欄位，不改動 96 筆景點資料。覆蓋統計維持 95 筆可造訪資料，休園資料仍保留在 SSR hidden-card 契約中。
- **親子遊樂地圖一列控制＋家長筆記**：意圖與篩選收成同一列（離我最近／免費／室內＋篩選）；縣市／類型進單一面板，拿掉重複的條件 facet。H1 加上手句；卡片露出「帶小孩時」摘錄；詳情核對改年月；`tips` 對到已核對設施。
- **親子遊樂地圖資料範圍聲明**：詳情 sheet 在「帶小孩時」之後顯示 `coverageNote`（標籤「資料範圍」）；無值不渲染。卡片名單不加，避免列表噪音。
- **親子遊樂地圖 `mapsQuery`／`placeId`**：導航／搜尋可用選填搜尋字串覆寫，有 Place ID 時加 `destination_place_id`／`query_place_id`；仍不傳座標、免 API Key。

### Changed

- **效能（故事播放頁快取）**：進 `/story/[slug]/play` 不再背景下載完整 MP3 與全幕 JPG。音訊 `preload="none"`，由 Range／206 隨播放抓取；CACHE_STORY 改 current±1 以外的 AVIF idle queue，離開頁面取消。SW 仍只快取完整 200、維持 v6。Landing autoplay 與 866164a Range 契約不變。
- **效能（Sentry client first-load）**：瀏覽器改用 `@sentry/browser` 同步 init（保留 GlobalHandlers／unhandled error／unhandled rejection 與 error boundary 上報），拿掉 client BrowserTracing。首頁 first-load JS gzip 約 238.1KB → 188.6KB（約 −49.4KB）。Server Sentry、DSN、scrubber 不變；server `tracesSampleRate` 仍為 0.1。
- **效能（StoryPlayer 插圖傳送）**：播放頁所有幕 JPG 預生成 AVIF／WebP（品質 62／84），`<picture>` 依序 AVIF → WebP → JPG；原始 JPG 保留。`npm run optimize:lcp-images` 現含 `public/stories/**/NN.jpg`。SW 背景佇列改見上方「故事播放頁快取」。未改字幕／音訊／換頁架構、地圖、Sentry。
- **效能（宇宙地圖 client bundle）**：`data/universe.ts` 不再 import Zod；契約改到 `universe.schema.ts` 僅測試／CI 驗證。靜態島嶼資料以 typed 常數進 client。未改座標、相機、ZoneSheet、路由、preload、SW。
- **效能（Play Map 靜態殼實驗）**：`/for-parents/play-map` 改靜態殼＋`PlayMapClient` island（對齊 `/stories`）。page 不再 await `searchParams`，可分享 URL 改由 client 解讀；SSR fallback 仍輸出全台名單與 ItemList。未改座標、Leaflet lazy、相機、Sheet、SW。
- **效能（Play Map client bundle）**：`data/playgrounds.ts` 不再 import Zod；契約改到 `playgrounds.schema.ts` 僅測試／CI 驗證。靜態 POI 以 typed 常數進 client。
- **效能（故事列表與播放傳送）**：`/stories` 改靜態殼＋client filter island（保留可分享 URL、canonical 仍為 `/stories`）；LatestHero 不再與 SiteHeader 搶 priority；播放頁封面先走 AVIF／WebP（品質 62／84）。02+ 全幕轉檔見上方「StoryPlayer 插圖傳送」。未改地圖相機、Sentry。
- **效能（Web Performance Audit v3）**：故事列表卡 `sizes` 對齊 80／96px 縮圖；`/games` hub 改 `<picture>`（viewport + AVIF／WebP）；`/adventures` 只 preload car-park WebP；SW shell 改 precache `hero-home.avif`（**維持 v6**，避免 activate 清空離線故事）。未改播放器、地圖相機、Sentry／Analytics。
- **角色 Logo 家族背景壓深**：`construction`／`speed`／`fantasy`／`transit` 改較深 OKLCH，拉開與中明度車身的亮度帶；`rescue`／`joy`／`people` 不變。
- **角色 Logo IP 主色重取樣**：定裝照取樣後只在剪影餘裕不足時沿色相微調；血緣四位共用珊瑚紅；清潔車／暖暖／小怪獸撤回深補償；消防車提亮；噗噗臉部次色提一階。
- **角色 Logo prompt 重產**：35 份 `docs/logo-prompts/` 對齊新家族背景與 IP 色；`_shared.md` 的 style／forbid 區塊未改。
- **角色 Logo 產圖 CLI 可續跑**：既有 staging PNG 跳過不重畫；`moderation_blocked` 同張再試 1 次，仍擋則留下空號並繼續，不再整批 `exit 1`。dry-run 估價扣除已有檔。
- **角色 Logo 對比驗證器雙軌**：剪影可走軌道 1（亮度 ≥ 3.6 且 margin ≥ 0.2）或軌道 2（≥ 2.8 且色相距離 ≥ 60° 且 primary 彩度 ≥ 0.12）。軌道 2 只給高彩度識別色。臉部仍 ≥ 5.0。
- **角色 Logo 對比驗證器單軌加權**：廢除軌道 2。剪影門檻依色相距離：≥ 60° 為 2.8、30–60° 為 3.6、＜ 30° 為 4.5；margin 相對該門檻 ≥ 0.2。背景不得呼應成員識別色相。
- **角色 Logo 家族背景色相分離**：`speed` 改深青 `L 0.30 C 0.05 H 200`／`#023538`；`construction` 改深藍紫 `L 0.32 C 0.06 H 300`／`#382B4D`（不用 H 285，對 rescue 只有 35°）；`fantasy` 維持 H 150、壓到 `L 0.32`／`#193B22`。`rescue`／`transit`／`people` 不動。
- **角色 Logo joy 底改深橄欖**：奶油白 `#F7EEDC` 改 `L 0.30 C 0.06 H 100`／`#352E02`，與其他六家族色相 ≥ 45°。不用暖褐（會呼應粉紅／紅車身）。六位主色沿取樣色相只推到臉部 5.2；次色回歸識別物真實色。
- **角色 Logo IP 色回歸取樣**：色相分離後血緣四位共用真紅 `#E4402E`；工程黃系與玲玲、多多撤回推淺補償。廢 `#FF8A72`／`#FFC9B8`。
- **角色 Logo 臉部也要 margin**：`auditEntry` 要求 face ≥ 5.0 且 faceMargin ≥ +0.2。不改色票；現役僅 a-ku（5.02）未過。
- **角色 Logo 驗收頁**：32px Grid 可載 staging 候選；新增取色比對（產出圖主色 vs `ipColorPrimary` 的 hueDist／silhouette）；撞型並排強調血緣四位共用真紅。
- **親子遊樂地圖 V3 產品簡化**：手機改名單優先（「看地圖」／「返回名單」），拿掉 Cards/Map tabs 與 MobileMapResultsSheet 三段 snap；地圖模式全幅且篩選留在名單。全國鏡頭依容器寬度 `setView`，西緣釘在台灣海峽東側，避免寬圖把福建當主畫面。地圖針改圓形黏土容器＋正向類型剪影；卡片改 Name／區·類型／旗標／家長一句。桌面並排名單約 44%。不改 96 筆資料、URL query、Nearby、搜尋此區域、SSR hidden-card、手機 Leaflet lazy load、PR7/PR8/PR9。
- **親子遊樂地圖探索基礎**：保留全台縣市 aggregate，依 zoom 轉 deterministic spatial clusters／individual markers；新增 client-only「搜尋此區域」commit／清除流程，結果以 structured filters AND committed bounds 收斂，URL／SSR／SEO／Leaflet library 不變。
- **親子遊樂地圖卡片／地圖針互動**：桌面卡片 hover／focus 與 individual marker 互相高亮；marker click 選取對應卡片並在 desktop 名單容器內定位，沿用 full／compact Sheet 與既有 Leaflet／aggregate marker 行為。
- **親子遊樂地圖質感改版（底圖暫停）**：字階改押 token 與 `--ink`／`--ink-soft`；頁面層 chip 改 ghost，`--map-chip*` 只留地圖 overlay；卡片改 1:1 類型 plate、距離獨立、對齊 `StoryCard` elev；夜間旗標對比與控制列改不透明底。底圖 provider 另輪決定。
- **親子遊樂地圖 coverageNote 收尾**：詳情內文改 `--ink`（標籤維持 `--ink-soft`）；`hc-nanliao` 導航落點聲明從 `tips` 歸位到 `coverageNote`；編輯守則補 full／compact 版位與南寮範例。
- **親子遊樂地圖具名導航與類型場景**：Google 導航／顯示位置改用頁面場館名＋縣市，不再傳 lat,lng 圖釘；卡片改 7 種手繪類型場景帶，選中地圖針顯示與名單相同的場館名。
- **親子遊樂地圖質感與操作**：桌面 ≥980 名單與地圖並排；卡片加類型色塊；全國未定位時地圖改縣市聚合；篩選 chip 改次要描邊、意圖列維持主按鈕；精簡詳情含地址與距離，定位後地圖顯示「我」。

### Fixed

- **Landing 聽最新一集 autoplay**：Service Worker 把音檔 Range 206 寫進 Cache Storage 後，`new Audio().play()` 在手勢內以 `NotSupportedError`（Format error）失敗。改為只快取完整 200，cache 失敗不擋播放回應。CACHE_NAME 維持 v6。
- **同步 notify-live gitHead 誤擋**：GHA 與本機都是先跑 `sync:apple` 寫入 report（`gitHead`＝當時 HEAD）再 commit，先前要求 gitHead 必須等於目前 HEAD，導致新集 push 成功卻拒絕開「待生圖」Issue（`ep-25`／`ep-26` 即因此漏單）。改為接受目前 HEAD 或其近期祖先（最多落後 20 commit）。無關 sha 仍拒絕。取代已衝突的 Draft #76。
- **GHA sync 單元測試找不到 `@testing-library/dom`**：Wave B 把 RTL peer 當 knip 死依賴刪掉，`npm ci` 不裝 peer，sync 一跑 `npm test` 就 18 套件失敗（#82）。恢復直接 devDependency，knip 忽略此 peer，並加契約測試。
- **親子遊樂地圖 FitBounds 旗標**：移除 `userMovedRef`／`programmaticRef`——`fitKey` 不變時 effect 本來就不會跑，那些旗標是不可達邏輯。
- **親子遊樂地圖 name／mapsQuery 身分**：`hcx-hukou-sports` 顯示名改回「王爺壟運動公園」並移除多餘 `mapsQuery`；`hc-nanliao` 顯示名改回「南寮親子沙灘」，導航仍指向旅遊服務中心。編輯守則新增「name 與 mapsQuery 的分工」。
- **親子遊樂地圖台／臺用字**：`city`／地址維持「台」；`台中公園`、`台中都會公園` 改對官名「臺中…」。王爺壟幼童遊具待辦撤銷（資料列保留、`ageRange` 仍 `[3, 8]`）。
- **親子遊樂地圖 FitBounds 版面與旗標**：`playMapFitKey` 納入 `splitLayout`，跨過 980px 或手機轉橫向時重算鏡頭；程式觸發的 fit 改聽 `zoomend`／`moveend` 清旗標，避免誤判成使用者拖曳。
- **親子遊樂地圖 FitBounds**：`clusterPoints`／`selectedPad` 改 `useMemo`，鏡頭改 `fitKey` 驅動並尊重使用者拖曳／縮放，避免桌面並排點「載入更多」時把手動平移拉回去。
- **親子遊樂地圖定位鏡頭與地圖生命週期**：「離我最近」未選縣市時鏡頭只框自己＋最近 8 筆，不再 fit 全台；手機切回卡片後地圖保持掛載，避免縮放被重置。
- **親子遊樂地圖地址「附近」**：28 筆地址改為官網／縣市觀光網可導航門牌或路口（風禾慈文路、動物園食品路 66 號、新瓦屋文興路、都會公園都會園路、向山中山路等）；`tips` 的「附近商場」不在此列。臺／台用字另案。
- **親子遊樂地圖場館名複核**：紙教堂與新桃花源農莊拆開；小叮噹地址由湖口德興路改新豐康和路（座標需人工複核）；和平島／麗寶／草悟道／南寮／大都會公園等改對官名，通用名補 `mapsQuery`。
- **親子遊樂地圖三筆場館資料**：`nt-435` 更正為板橋 435 藝文特區（官網不再指向鶯歌美術館）；`ty-casti` 顯示名改「卡司‧蒂菈樂園」並以 `mapsQuery` 導航；`ty-xpark` 改中壢區春德路 105 號（座標需人工複核）。
- **親子遊樂地圖收費資訊更正**：兒童新樂園與十三行博物館原標「免費」，實際入園需購票（全票 30／80 元），改標「需購票」並新增 `feeNote` 說明幼童免票等分層收費。同時修正 10 筆地點失效的官方連結（4 個網域已不存在，多為拼字錯誤），並移除 25 筆場館 `tips` 中與 UI 提示重複的票價免責句。
- **親子遊樂地圖無障礙**：消除地圖標記的巢狀互動元素（8 個 axe serious 違規）；選中卡片改為只加外框，修正夜間主題下卡片標題 3.08:1、區名 1.69:1 的對比問題；資料來源連結補足 44px 觸控高度；瀏覽模式分頁支援方向鍵。
- **親子遊樂地圖地圖控制**：縮放控制改置左下——原本 topleft 被置頂導覽列蓋住，導致最北標記無法點擊；提示膠囊移到左上避免與 OSM 標示疊字。標記圖改為自帶，不再向第三方 CDN 發出請求。

### Added

- **親子遊樂地圖篩選可分享**：縣市／類型／室內／免費／檢視模式進入網址，可加書籤、可分享，瀏覽器上一頁可還原前一組條件。SSR 由 8 筆改為輸出全部 73 筆地點（不符篩選者隱藏）並新增 ItemList 結構化資料，各縣市地點名稱得以被搜尋引擎索引。新增「動物園」分類；類型與縣市 chip 顯示剩餘筆數並停用 0 筆選項，避免點進空結果。

- **親子遊樂地圖 Wave 0（家長工具）**：canonical 維持 `/for-parents/play-map`；行動抽屜家長組新增「📍 親子景點」；`/for-parents` 並排工具卡；PlayMap 列表主路徑＋縣市預設＋Sheet `region`／Esc；`sources`／`lastVerified` 契約與 `lib/playgrounds-query`；editorial SOP（`docs/PLAY-MAP-EDITORIAL.md`）。社群僅候選、不自動爬取。（桌面主列項見後續「親子景點進桌面 Top bar」。）
- **親子遊樂地圖 Wave 1（北北基桃）**：擴充台北／新北／基隆／桃園至分級覆蓋門檻（共約 29 筆）；`lib/playground-coverage` 追蹤 Tier A／B 達標狀態。
- **親子景點進桌面 Top bar**：膠囊主列加入「親子景點」（路徑仍 `/for-parents/play-map`）；與「宇宙地圖」命名區隔，active 最長匹配獨佔。
- **親子遊樂地圖 Wave 2（竹苗中彰投雲）**：擴充新竹市／縣、苗栗、台中、彰化、南投、雲林至分級覆蓋門檻（全庫約 73 筆）；涵蓋文案與 SEO 同步。
- **親子遊樂地圖版面重設**：極簡工具殼（去行銷 header／hero）；卡片｜地圖互斥瀏覽；縣市／類型 chip 篩選；詳情來源摺疊。
- **親子遊樂地圖 UX 精煉（CRITICAL-1／2 A）**：compact SiteHeader；卡片殼可 SSR、Leaflet 僅地圖 tab；`主題樂園` type 與 indoor 契約；預設台北市；chip 選取態／條件摘要／coverage 同源；零結果視野與 zoom ≥44px。
- **手機宇宙地圖底部島選擇列（IslandPickerStrip）**：≤480px 世界層橫滑大 chip（圖＋名、觸控 ≥56×72）；點擊走既有進島路由，不動 `useMapCamera`／`ZoneSheet`。MapControls 隨 `--map-picker-offset` 抬高。
- **ep-23 全幕繪本 + 小紅賽車的爸爸定裝**：26 幕（雪山隧道）；俏皮翹鬍子爸爸定裝；禁手；場景公里牌整數例外於場景 negative；23／24 頁序對調（慶祝↔風景）。
- **PLAY-IA-6：暫停層「回遊樂園」出口**：繽紛方塊與車車大冒險的暫停覆蓋層在「繼續」下方補 `href="/games"` 弱 CTA，對齊抬頭文案；其餘無 React 暫停層的遊戲不動。
- **PLAY-IA-7：遊戲頁 chrome 單列**：`GamePlayChromeSlot` + `createPortal` 把 `GameHost` 工具列掛進 sticky 抬頭右側；無 slot 時 fallback 畫布上方原列。不動 GameKit adapter 契約。
- **PLAY-IA-8：沉浸遊戲頁日夜切換**：抬頭右側掛 `ThemeToggle iconOnly`（沉浸路由隱藏 `SiteNavBar` 後仍可切主題）。
- **宇宙地圖召喚式探索抽屜**：進島後預設只顯示底部「來這裡逛逛」召喚把手（觸控 ≥56px、`--map-chip*`）；點把手或 `?sheet=1` 才展開非模態 `region` 抽屜——兒童首屏故事卡、探索點次層；✕／Esc 收合不清路由。島上星章滿星時 chip 一次性進場慶祝（session 每島一次）。
- **`scripts/generate-zone-night-art.ts`**（D4 五島夜間點燈美術管線）。原本只有寫死 forest 的一次性腳本，`generate-map-art.ts` 又只管 map 素材不含 zone。新腳本參數化五島，支援 `--dry-run`／`--only`／`--approve`，並以**日圖當 `images.edit` 的 image reference**——夜圖與日圖會 crossfade，若夜圖是重新生成的另一座島，淡入時島會變形。另輸出日／夜並排 contact sheet 與**剪影 IoU**，讓審圖的人看得到剪影是否漂移。
- **ep-21 全幕繪本 + 自動駕駛計程車知知定裝**：18 幕（保留 Apple 封面）；名冊新增知知（白車＋藍光 LiDAR，與 ep-3 黃色計程車分離）；車無手臂。

### Changed

- **家長入口收斂為單一「親子指南」**：導覽移除「育兒專欄」（Threads 外連）項，桌面膠囊與行動抽屜的家長組只剩 `/for-parents`（路徑不變），顯示名由「家長指南」改為「親子指南」（頁面 eyebrow／breadcrumb／metadata、`/topic`／`/vehicles` 頁尾連結、儀表板返回鍵一併更名）。Threads 育兒分享改由 `/for-parents` 頁內「育兒小筆記」外連卡承接（`target="_blank"` + `rel="noopener noreferrer"`，Threads 缺席時整卡不渲染）；頁尾 ConnectHub 的 Threads 品牌名不變。
- **GameKit 兒童觸控（PR-A）**：虛擬鍵採 pointer capture（滑出＝續按，up／cancel／lost 才放開）；消消樂棋盤補 capture 避免跨格吞 tap、格寬下限 48px（gap 4／padding 6）；方塊棋盤 cancel／lost 釋放 capture。不動 DAS／bridge／medal。
- **繪本著色 scene 線稿重產（構圖對齊）**：`scene-ep-9-05`／`scene-ep-3-05`／`scene-ep-6-05`／`scene-ep-16-05` 以硬化後 AI 管線（image 0 構圖權威、禁太陽雲替身、edge IoU＋人工 checklist）重產並上線；取代舊「簡化太陽雲」稿。character 四頁未動。
- **手機宇宙地圖溫和放大（銜接 MAP-MOBILE-CONTAIN）**：`PORTRAIT_MAX_ZOOM` 1→1.15，直向島圖更顯著、允許輕微橫向溢出；`fitAvailableViewport` 預留選擇列高度；島 tile 手機 hit pad `::before` inset -12%；e2e 木牌可見比 ≥0.85。不動島座標／zone-art-tile。
- **手機宇宙地圖嚴格 contain + chrome inset（MAP-MOBILE-CONTAIN／CHROME）**：`PORTRAIT_MAX_ZOOM` 1.5→1，直向不再為填滿高度而橫切外側島；新增 `fitAvailableViewport` 從可用視窗扣除木牌 pad 與右下 MapControls（＋召喚把手高度），`fitScaleFor`／`fitScaleForBox` 共用。首屏島略小、上下空海略多，換完整可點與木牌不被裁。不動 `useMapCamera`／`ZoneSheet` 互動核心。
- **宇宙地圖視覺升級 v6：從「五張貼紙」到「有水深／空氣／夜晚的世界」**。地圖的**資產層**（五島整島黏土 diorama、海／雲／日月 PNG）本來就好，但**合成層**幾乎沒做事，所有元素讀在同一個 Z 上。本輪全為 CSS／SVG，零新資產：
  - **淺灘光暈**：島底加一顆更大更柔的水色橢圓（`#cfe8f3` ＋ `feGaussianBlur`，無邊界），島從「貼在海面上」變成「泡在水裡」。與 v5 移除的白硬 foam 環的分界寫進 Art Bible §14.6。
  - **接地陰影不再硬寫**：原本五島共用 `rx=112 ry=34 cy=+30`，1.25× 的 hero 島（car-park）用了一般島的影子，所以看起來在飄。改由新的 `lib/universe/island-ground.ts` 依 tile `stageSize` 推導，基準島輸出與重構前完全一致（測試鎖定）。
  - **大氣透視**：由 `islandHaze(depthY)` 推 `--island-haze`，遠島降飽和 ≤12%／降對比 ≤6%，遠近不再一樣銳利。filter 掛在新的無 transform `.tileHaze` 層，避開既有註解記載的 iOS「filter＋子層 transform 重影」。
  - **海面景深＋暗角**：screen-space `.atmosphere` 兩段極低 alpha 漸層，上亮下深、四角收光。刻意不進 `.stage`（該層歷史上會讓 iOS Safari OOM）。
  - **橋的水面投影**：七座棧道各補一條下移的寬圓頭低透明描邊，橋落在水面上而非漂著。沿用該層「不用 blur filter」的既有立場。
  - **水面月光**（夜間）：月心正下方的柔光帶，層級**低於島**（打在海面上，蓋過島會變成島上蒙霧）。與 `SkyBodies` 共用 `.map` 的 `--sky-*` 錨點單一資料源。
  - **夜間窗燈**（夜間，過渡方案）：`data/universe-zone-lights.ts` 資料驅動，每島 ≤3 顆，亮核＋柔暈雙段漸層。某島 `hasNightArt` 翻 true 後該島**自動退場**，不會與烘進夜圖的燈疊加。`prefers-reduced-motion` 只停呼吸、不熄燈。
  - **日月遠景視差**：`applySkyCamera` 以 `PARALLAX_FAR = 0.06` 並**夾住位移**（`SKY_MAX_DRIFT`）——世界可平移數千 px，不夾的話月亮連同水面月光會整顆離開視窗。日月尺寸 56→64px。
- **`generate-map-art` 的海面 `@2x` 契約澄清**：Art Bible §14.1 原寫「海面需 `@2x`」，但影像 API 方形上限即 `1024×1024`、`SPECS` 與 `verify-map-art.ts` 早已是 `needs2x: false`。再生一張只會得到另一張 1024 的海（零解析度增益，卻要重驗四邊無縫）。文件改為記錄這是刻意契約而非缺件。

### Fixed

- **召喚抽屜設計審必修（Opus／GPT 條件通過後補齊）**：收合態拿掉半透明 scrim（僅展開掛 `overlayScrim`）；展開／收合做 focus move（面板 ↔ 把手）；region 改 `aria-label`、拿掉與島頁重複的 sr-only h1；把手補 👋 glyph；次層展開 `scrollIntoView`＋橫向高度下限；收合把手不掛幽靈 `aria-controls`。
- **宇宙地圖點島沒有置中（正式站回饋）**：`targetToFlyParams` 拿 `zone.camera.center` 當島心，但那是島圖的**沙岸底錨點**（`anchorUV [0.5, 0.84]`）——84% 的島高在錨點上方，於是整座島被推到畫面上緣，1280×800 下車車樂園島頂實際被切掉約 117px。新增 `islandFocus()` 取 tile box 視覺中心並為木牌欄讓位；`flyTo` 新增 `fitBox` 把進島縮放夾到「島放得進畫面」（桌面算出的上限高於 1.6 故手感不變，390 手機從 1.6 落到約 1.15，島不再比螢幕寬）。
- **宇宙地圖再點同一座島沒有反應**：改為回世界層（`router.push("/adventures")`，鏡頭由既有離島 reset 分支收尾），島 `aria-label` 補「再點一次看整片地圖」。
- **夜間地圖 chrome 融進背景**：縮放／回樂園鈕吃 `--card`＋`--cta-warm-fg`，夜間是深靛底壓深靛夜海（輪廓消失）、字 `#2a1808` 對底僅約 1.4:1；鎖島泡泡則是硬白底＋`var(--ink)`，夜間變近白字壓白底。新增一組**日夜不反轉**的地圖印刷色 `--map-chip`／`--map-chip-2`／`--map-chip-ink`／`--map-chip-line`（字底 5.4:1、鈕對夜海約 7.9:1），對齊既有 `.tapHint` 與島名木牌語彙。
- **鎖島泡泡永遠被島名木牌遮住**：泡泡原本在島 `<button>`（有 z-index，自成 stacking context）內，木牌層（`LABEL_BASE`）必定蓋過它；改為 button 的 sibling、走新的 `bubble` 層深、定位在 tile box 頂緣，並補反縮放與尾巴。探索點層同步升到新的 `hotspot` 層深（互動元件不該被裝飾木牌壓住）。（後續已移除鎖島狀態泡泡，改果凍回饋＋召喚抽屜。）
- **手機島名木牌被視窗裁掉**：`CONTENT_FIT_PAD` 是 stage 單位會隨 fit 縮小，但木牌反縮放後是固定螢幕尺寸。新增 `LABEL_SCREEN_PAD` 在螢幕空間預留留白，375×812 下恐龍島木牌由裁掉 24px（可見 0.66）變為完整可見。
- **故事詳情頁「接著聽」連結對比 2.2:1（axe serious）**：`RelatedStories` 把單集色 `story.color`（如 `#7048e8`）當文字色，夜間壓 `--card` 不足 AA。單集色改只當底線裝飾，文字走 `--accent-ink`（分工同 DESIGN.md：accent → 裝飾／邊框，accent-ink → 文字）。
- **GameKit 遊戲畫布沒有可及名稱**：`PixelGameCanvas` 遷移到 `GameHost` 時漏了 `role="img" aria-label="遊戲畫面"`，讀屏會念成無名 canvas。補回。
- **遊戲頁 hasScore:false 會失去所有遊戲控制**：`GameHost` 原本把整條工具列包在 `{(title || best != null) && …}` 內，而主打的 `candy-match` 是 `hasScore: false`（`best` 恆為 null），一旦不傳 title 就會連暫停、靜音、設定一起消失。工具列改為無條件渲染，只有「最佳 ⭐」條件顯示；補反向契約回歸測試鎖住這個條件。
- **`/games/candy-match` 有兩個 `<h1>`**：`GameIntro` 與 `CandyMatchView` 的關卡標題屏各一。頁面唯一 `<h1>` 改由 `GamePageShell` 抬頭持有，其餘降為 `<h2>`；`GameIntro` 的 `aria-labelledby` 一併改指向自己的標題（原本指向已搬走的 id）。
- **遊戲頁對比未達 WCAG AA**：`CarAdventureGame` 的鍵盤說明硬寫 `#3a5a8c`，夜間僅 **1.4:1**；`GameIntro` 的遊玩條件 chip 為 4.41:1。皆改用主題 token。
- **遊戲頁 focus ring 硬寫 `--c-sky`**：改用 `--focus-ring`（夜間為黃色，對比足夠）。
- **本機 sync 繞過 Actions 漏開待生圖通知**：`npm run sync:apple` 本機 push 後新增 `npm run sync:notify`（複用 GHA `notify-live` 同一路徑，讀 `.cache/sync-run-report.json` 開／去重「待生圖」Issue），修正先前只有 GHA 觸發同步時才會通知、本機上架容易漏掉 `[illustrate]` Issue 的缺口；另補可選 `npm run sync:notify:reconcile`（掃 catalog 補漏，上限 3 筆、跳過已存在 open/closed 同標題單）、`SYNC_ALERT_DRY_RUN=1` 預覽、`--strict` 供本機非 0 檢查；`dryRun`／逾 24h 的 stale report 一律拒絕開單。GHA workflow 未變動。

### Security

- **法務／隱私強化**：
  - **瀏覽器安全標頭**：`next.config.ts` 為全站 `/:path*` 加 `X-Content-Type-Options: nosniff`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy: camera=()/microphone=()/geolocation=()/payment=()`、`X-Frame-Options: SAMEORIGIN` 與 CSP `frame-ancestors 'self'`（禁第三方嵌入整站，保留本站遊戲 iframe）；`Strict-Transport-Security` 僅在 `VERCEL_ENV=production` 附掛。新增 `next.config.test.ts` 契約鎖定基線標頭。
  - **同意留痕（consent audit）**：新增 `lib/legal-policy.ts`（`LEGAL_POLICY_VERSION`／`LEGAL_POLICY_UPDATED_AT` = `2026-07-22`）；許願與 Email 訂閱送出時以伺服器時間寫入 `consent_version` + `consented_at`，僅用於證明告知版本與資料治理，不建帳號、不做跨裝置識別。migration `005_legal_consent_audit.sql` 以 `ADD COLUMN IF NOT EXISTS` 加欄，舊資料維持 `NULL`（不回填、不推定同意版本）。
  - **資料最小化**：訂閱與許願 API 不再收集或寫入瀏覽器 `user-agent`；IP／user-agent 僅暫時用於防濫用速率限制，不入內容資料庫（`lib/subscribe-db.ts`、`lib/zone-wish-db.ts` 及對應路由測試同步）。

### Added

- **阿蹦雪山衝刺 P0–P4 完整化**：Snowboard 遷移至 `GameHost`／adapter，加入共享地形座標契約、`FINISHING` 結束流程、跌倒進度回溯、遊戲端分數與 trick／combo、3 條 `CourseData` 雪道、難度／音量／減少動態設定、解鎖與結算站；bridge 升級 protocol v2 並加 source／origin／window／runId／score 驗證。Web export 改為 `public/snowboard/v2/`，搭配 no-cache HTML、immutable runtime、Service Worker runtime cache 與 smoke／contract tests。

- **/legal 版權隱私頁全面擴充**：頁標改「版權、隱私與使用條款」，加章節錨點導覽與政策版本／日期標示；新增「可接受的分享方式」「侵權通知與處理（`/legal#takedown` 流程與必附資料）」「許願、建議與投稿內容」「第三方服務與資料處理者（Vercel／Neon／Resend／外部平台）」「兒少與家長使用」「安全與政策變更」章節。`DISCLAIMER.md`、`public/llms.txt` 同步侵權通知與分享／訓練限制措辭；訂閱與許願表單同意句更新（含「勿填孩子個資」提示）。

### Changed

- **宇宙地圖島上文字重排（正式站回饋）**：探索點標籤改印刷 chip（13px/800、`--map-chip*` 色票）並加反縮放——縮放時字級不再變形，命中區固定 48 螢幕 px（原本 fit 縮放下只有約 29px）；島下半部標籤翻到圓點上方避開木牌與彼此碰撞；未開放的點降權讓可玩的點當主角。探索點詳情視窗改置中單欄：島名降為小徽章、標題升 1.7rem、只留一顆膠囊主 CTA（56px）、回島降為文字鈕、「敬請期待」改小 pill。
- **移除宇宙地圖「探險小抄」面板**：`pointer-events: none`、≤480px 本來就 sr-only 隱藏，狀態圖例資訊島木牌 pill 已有，對孩子等於裝飾。刪除 `MapGuide`；`aria-describedby="universe-map-guide"` 改指向 sr-only 操作說明（點島飛過去／拖曳探索／加減鍵與鍵盤縮放平移）。
- **`e2e/universe-map.spec.ts` 島名木牌測試改測真不變式**：舊版比對「後方島可見圖頂 − 前方島木牌底 ≥16px」，前提是兩島在螢幕上垂直相鄰；M0（`02f2a51`）重排座標後森林小島移到上方中央，該配對失去意義、測試自此長紅（−364px）。改測木牌垂直完整可見、彼此不重疊、層深高於所有島身，橫向則因直向刻意讓島群比畫面寬而要求可見比例 ≥0.7（實測最差 0.76）。
- **`npm run lint` 回到 0 warning**：`--max-warnings=0` 的閘門原本被 19 個既有 warning 擋著。移除死 import／死解構（含 `GameHost` 未接線的 `resumeBgm`）；`CandyMatchView` 的 `ensureAudio`／`tone` fallback 改指模組層 noop（原 `?? (() => {})` 每 render 產新函式，讓 9 個 `useCallback` 依賴每幀失效）；`BlockDropView` 以 `liveFnsRef` 鏡射遊戲迴圈函式，鍵盤訂閱不必每 render 重掛。未動 `eslint.config.mjs`。

- **遊樂園動線重構（兒童優先 + DESIGN v0.2 收斂）**：
  - **遊戲頁改「遊戲 → 操作提示 → 家長說明」**：`#game-play` 前移到 `GameIntro` 之前，390×844 下遊戲區起點由 ~780px 降到 **72px**。`GameIntro` 降為第二層並改標題「給家長的說明」；`game.controls` 屬兒童資訊，留在遊戲正下方不隨之下移。
  - **單一 sticky 抬頭**：`GamePageShell` 改為 `← 回遊樂園 + h1` 的 52px sticky 單列。因為遊戲頁已隱藏全站導覽、畫布可高達 640px，抬頭必須 sticky，否則唯一出口會被捲出畫面。同步移除 `GameChromeToolbar` 的 🎡 與 `GameIntro` 的「看其他遊戲」，全頁只留一個返回。
  - **沉浸式路由**：新增 `isGamePlayRoute`／`isImmersiveRoute`，`/games/:slug` 比照故事播放器隱藏 `SiteNavBar`。`/games` hub 與 `/games/coloring-book`（走 `ColoringPageShell`，無 sticky 出口）不納入。
  - **hub 由四層扁平為兩層**：取消獨立「今天主打」區塊與過場文案，主打改為所屬分類的第一張大卡（桌面跨兩欄、圖左文右）。「小小探索」回到 2 款、每款遊戲只剩一個入口。行動版 hero `min-height` 500px → `min(48svh, 340px)`，第一張卡進入首屏（~513px）。
  - **卡片補家長決策資訊**：「約 N 分鐘」「🌿 沒有時間壓力／⏱ 有計時」由只存在 `aria-label` 改為可見文字。
  - **v0.2 收斂**：移除 hover 歪斜 rotate、厚底影下沉（改 `scale(0.98)`）、內容卡上的 `--gloss`、標題的麥克筆 `text-shadow`；hero Doodle 4 → 2；卡片改 elevated surface + `--hairline` + 極淡 accent 邊。
  - **夜間過渡層**：深藍頁底與高明度黏土畫布之間補一階 surface；不動 canvas 背景（DESIGN.md「不做：改遊戲畫布」）。
  - **移除 `RoughFrame` 與 `SvgDefs`（`#rough-1/2/3` 粗糙濾鏡）**：`/games` 是最後一個消費點，收斂後全站歸零。連同 `decor.module.css` 的 `roughShift`／`roughFrame`、對應契約測試與 `app/layout.tsx` 掛載一併清除；`DESIGN.md` 刪除「`/games` 等非本方針範圍頁面」的 carve-out，改為「日後要恢復須先登記」。
  - **新增 `e2e/games.spec.ts`**（首屏、DOM 順序、唯一 h1、單一返回、hub 入口不重複、橫向／平板），`e2e/a11y.spec.ts` 補兩個遊戲頁。

- **宇宙地圖減法點島**：點任一島改為飛鏡頭＋顯示探索點（pin），不再自動開底部選單；MapGuide／tap hint 改「點一座島飛過去，再點探索點／來這裡逛逛」；島頁保留 GEO sr-only，探索內容改召喚抽屜承載。
- **宇宙地圖兒童探索 polish（T7）**：鎖島 sheet 首屏改 `childHint` 短句＋「去聽車車故事」主 CTA；session 首訪 overlay「點一座島看看」（StrictMode 雙 effect 門閂，僅 dismiss 才寫 session key）；MapGuide 探險小抄補「鍵盤也可探索」（僅 `pointer:fine` 顯示）；ZoneSheet 關閉鈕觸控區 48px；e2e／smoke 對齊兒童極簡斷言。
- **家長指南導覽減法**：導覽「家長指南」改為直連 `/for-parents`；「關於／聯絡」移出導覽，頁尾 meta 補「聯絡我們」；移除已無引用的 `framer-motion` 依賴。
- **中文標題去假粗（VIS-W4）**：huninn 為單一字重，全站 `font-weight:800` 原觸發瀏覽器合成假粗、把密集字（鬱/龍/邊）內部糊成一團。全域 `font-synthesis-weight: none` 讓中文落回 master、拉丁補 Baloo 真 800。密集字辨識度提升；中文標題份量略輕（由字級階梯＋顏色扛）。

### Added

- **陰影高度階梯（VIS-W3）**：新增 `--elev-1/2/3` 三階（light+night），`--shadow-card` 相容別名 `--elev-1`（既有零回歸）。精選最新集卡浮於目錄之上（elev-2 vs 列表卡 elev-1）；兩張故事卡 hover 陰影升階生效（修復原 inline 覆蓋導致永不作用的死碼）；landing 兩個實心黏土 CTA 加 `--gloss` 上緣高光。

- **ep-20 全幕繪本上線**：《水泥車阿尼的101任務》18 幕插圖＋幕級 captions；字幕校對 137 句並 `--mark`；定裝照「水泥車阿尼」；場景手修（去手臂、彩虹 101 對齊封面／LatestHero）；保留 Apple 封面 `01.jpg`。

- **遊樂園教學示範 overlay**：新增 GameKit `TutorialOverlay`（手勢動畫示範 tap/swipe/hold/arrows、`prefers-reduced-motion` 降靜態圖、不落 localStorage）；`data/games.ts` 增 `tutorial` 欄位（五款各 2–3 步、每句 ≤10 字）；大冒險／方塊／消消樂／卡丁車開始畫面加「怎麼玩？」按鈕（≥48px）；大冒險觸控裝置操作提示改裝置感知短句。

- **車車大冒險黏土化＋六關主題背景**：`render.ts` 全面黏土風（草皮帽地形、糖果金幣、軟糖尖刺、車臉造型對齊消消樂車車語彙、白底圓角 HUD 取代像素字；色值 JS 常數鏡射 `--c-*` token）；六關主題視差背景（草原薄荷／粉彩彩虹／海洋藍綠／森林深綠／黃昏星空／夜間嘉年華），reduced-motion 全靜止。未動共享 `lib/gamekit/runtime/`。

- **繽紛樂園方塊形狀標記**：七種方塊各配內嵌符號（圓／方／三角／菱形／十字／半月／星，data-URI SVG 第三層 background），色盲與低對比環境可辨；預設恆開、無設定開關（不動 GameKitSettings schema）。

- **繪本著色 hero cover 黏土世代對齊**：新增 `npm run generate:coloring-cover`（staging＋manifest sha256＋人工審後 `--approve`）；封面改 1448×1086 粉嫩黏土場景（小紅＋多多圍著著色本），與街機四款同世代；移除線稿腳本舊 `--cover` 照片裁切路徑。

- **ep-19 全幕繪本上線**：《恐龍車多多闖禍了》17 幕插圖＋幕級 captions；字幕校對 115 句並 `--mark`；場景手修定裝／劇情弧（多多無車門改單純相撞）；保留 Apple 封面 `01.jpg`。

- **著色線稿品質改善（混合管線）**：
  - Phase 1 演算法去噪：`convertToLineArt` 加 `median(3)` 前濾波＋despeckle（8 鄰域小連通元件去噪，含 bbox 長邊條件防誤刪細線；在與主體外輪廓 merge 前做）；重產 character 4 頁 `line.png`（噪點連通區 17–22 → 0–2）。
  - 品質 gate：新增 `measureLineArtQuality`／`evaluateLineArtGate`（黑覆蓋率、噪點元件計數、雙峰黑白／無 alpha、外框漏色比收緊至 0.5、全 8 頁依 kind 分檔），`generate:coloring-lineart --verify` 與 assets 測試同套契約；generator 支援 `--only`／`--kind`（封面改走 `generate:coloring-cover`）。
  - Phase 2 AI 線稿：新 `npm run generate:coloring-ai-lineart`（OpenAI images.edit＋定裝照 ref；scene 頁新增 `referencePaths` 資料契約）；產出進 `public/.coloring-staging/<run>/`（raw＋後處理＋contact sheet＋manifest），人工審後 `--approve <id>` 逐頁上線（approve 前重跑 gate＋sha256 核對）；成本硬閘每頁 2 次、單 run 16 次 API。
  - e2e 新增油漆桶防漏色測試（character＋scene 各一：點外底不得灌進主體中心）。
  - **AI 線稿全 8 頁上線**：人工審 contact sheet 通過後 `--approve` 覆蓋（噪點連通區全部 0、粗閉合輪廓、簡化背景），character 與 scene 頁全面替換演算法版。

### Changed

- **P0–P2 技術債（165b44e 檢討）：** smoke 對齊桌面膠囊四項 IA（主題分類僅行動抽屜）；`test:visual` 預設 skip（VIS-DEBT-1，`test:visual:trusted` opt-in）；`useMapCamera` 清 unused var；AGENT-DOMAIN Ship 約定 TODOS hash 與功能同 commit；`block-fable` 改只檢查 model 欄（避免 prompt 禁令誤擋）。

- **Agent 路由硬擋 Fable 5：** `/agent-plan`／`/agent-action` 明令禁止呼叫 Fable 5（`claude-fable-5-*`）；新增 `.cursor/hooks/block-fable.mjs`（`preToolUse`＋`subagentStart`）；契約測試改為要求禁令＋hook 註冊。

- **Landing 尾頁／頂欄協調：** 頁尾移除重複主題切換，改安靜文字 meta（關於 · 節目數據 · 條款）；首頁頂欄在 `#landing-foot` 進入視窗時改近實心底（`data-nav-solid`），避免白底透字；連結對比達 AA。

- **GEO Wave 1（聚合導言 sr-only）：** 首頁 `siteIntro` 與 `/stories`、`/topic`、`/topic/[tag]`、`/vehicles/[vehicle]` 的 answer-first 長導言改為 `sr-only`（SSR HTML 保留）；`/stories` 新增可見 `<h1>全部故事</h1>`；Vitest `lib/geo-visibility-contract.test.tsx`；`verify:geo` 標籤改為 HTML 存在性語意。

- **宇宙地圖點島 sheet 兒童首屏極簡**：拿掉 teaser／actionHint；建造進度、exploreNote、softLinks、規劃說明改收進「給爸爸媽媽」；有故事只留故事卡，車車樂園無預覽時才顯示「全部故事」主 CTA。

- **宇宙地圖縮放順暢（T3b）**：連續 pan／zoom／慣性改由 `bindVisual` 命令式更新舞台／海面／視差 DOM；React 鏡頭 state 降為 bucket／縮放限／手勢結束才 commit；手勢中暫停漫遊與島待機動畫；wheel／pinch 焦點改用快取 viewport rect。

- **遊樂園卡片 hero 比例統一 4:3**：`/games` 五款遊戲卡縮圖統一 `aspect-ratio: 4/3`（對齊 StoryCard 封面與素材原生比例），移除 featured 卡滿版（`span 2`）與 2.35:1／4:3 比例特例——首玩引導由 hero CTA「先玩繽紛消消樂」＋「第一次玩推薦」pill 承擔；`GameIntro` 手機 cover 同步改 4:3（桌面雙欄仍隨文字等高，刻意不鎖比例）；games visual baselines ×4 更新。car-adventure 16:9 封面於 4:3 框置中裁切（關鍵元素完整），4:3 重製列 TODOS UX-P2-6。

- **kidsMode／年齡標示接線（UX-P2-1、UX-P2-3）**：鎖定 kidsMode 預設開啟＝Block Drop 新局預設 relaxed 的耦合（含回歸測試；使用者明確選過的難度持久尊重）；`GameIntro` 對 challenge 遊戲顯示與 hub 卡一致的「建議 6 歲以上 · 家長陪同」提示（補齊卡丁車頁缺口）；五款遊戲頁 metadata 年齡稽核無矛盾。消消樂背景依任務型別主題化裝飾。

- **著色草稿世代**：草稿 key 綁 `COLORING_LINEART_REV`；線稿重生後舊草稿自動失效（避免舊塗鴉對不上新線稿），舊 `coloring:v1:*` localStorage 草稿不再遷移。

- **繪本著色封面開場（Track A）**：`/games/coloring-book` 兩段式 `cover → picker → canvas`；新增 `ColoringCover`（品牌標題、一句副標、CTA「打開著色本」、封面主視覺＋線稿塗鴉）；選圖頁改紙感繪本鋪陳並可「回封面」。

### Fixed

- **遊戲文字對比達 WCAG AA**：GameChrome 淺色主題主按鈕文字對比 1.74→7.0（原本近乎不可讀）；Block Drop／Candy Match 次要文字與粉色強調往 ink 加深至 ≥4.5:1（裝飾與方塊本體色相不動，維持粉嫩品牌）。大冒險選單原本即全數通過。

- **著色線稿輪廓稀疏漏色（Track B）**：`convertToLineArt` 合併主體外輪廓（邊框種子色分割）＋ morph close／加粗，重產 8 頁 `line.png`；新增 `estimateBucketLeakRatio` 契約（定裝人物外框可填比上限）。
- **線上著色本塗色不可見**：線稿 `line.png` 為不透明白底 RGB（無 alpha），`ColoringCanvas` 合成時以 source-over 疊在塗色層上方，使用者塗的顏色被白底完全遮住；改以 `multiply` 疊線稿（白底透出塗色、黑線保持黑），同時消除油漆桶填色在抗鋸齒邊緣的白縫（fill 另向暗線內滲入 2px 封縫）。

### Changed

- **線上著色本引擎硬化＋手機 UX（`/games/coloring-book`）**：
  - **筆觸效能**：落筆時只做一次 `getImageData`，pointermove 以共用 buffer 蓋章＋dirty-rect `putImageData`，合成改 `requestAnimationFrame` 節流；支援 `getCoalescedEvents` 取樣，筆畫更平滑。
  - **Undo 改 dirty-rect 補丁**：只保存筆畫觸及區塊（原本 12 份全畫布 ImageData ≈ 48MB → KB 級）。
  - **草稿改 IndexedDB**：存 PNG Blob（不受 localStorage ~5MB 配額限制），舊 localStorage 草稿首次讀取自動遷移；儲存失敗改為畫面提示（aria-live），不再靜默吞掉。
  - **筆刷三檔（細／中／粗）**：半徑以螢幕顯示像素為準、依畫布縮放換算，各裝置視覺粗細一致；橡皮擦同檔略粗。
  - **雙指縮放平移**（1–4×、邊界夾限）＋工具列「縮放還原」；放大後筆刷相對更細，好塗小細節。油漆桶延至 pointerup 判定，避免雙指手勢第一指誤填。
  - **筆刷游標圈**跟隨指標顯示當前筆刷大小；「看原圖」浮層改為可點擊在四角輪換，不再擋住塗色區。

### Added

- **GEO 營運基礎（/agent-plan geo-ticklish-candy 委員會核准）**：
  - **robots AI crawler 分流修正**：檢索／使用者代查型（`OAI-SearchBot`／`ChatGPT-User`／`Claude-SearchBot`／`Claude-User`／`PerplexityBot`／`Perplexity-User`）放行；訓練型補 `ClaudeBot`（Anthropic 現行定義為訓練爬蟲）與 `meta-externalagent`；移除已棄用 `Claude-Web`。測試補 SearchBot／ClaudeBot 交叉斷言。
  - **JSON-LD 強化**：`PodcastSeries.sameAs`（平台節目頁，strip query）；`breadcrumbListJsonLd` 注入 story／topic／vehicles／characters／for-parents（純結構化資料，無可見 UI）；`PodcastEpisode.associatedMedia` 逐字稿 MediaObject（text/vtt、zh-TW，僅有 VTT 集）。
  - **RSS enclosure length**：`buildRssFeed` 注入式 `audioLengthBySlug`（維持純函式）；`generate:audio-lengths`（prebuild）寫入 `data/audio-lengths.json`，`feed.xml` 只讀該表（禁止 runtime 掃 public/）。
  - **內容層級**：topic／vehicles 頁 metadata 補 `dateModified`（與 sitemap 同源）；`/characters` 補家長 FAQ 三題（answer-first、置於角色卡之後）＋ `FAQPage` JSON-LD。
  - **IndexNow 更新迴圈**：`generate-indexnow-key`（prebuild 依 `INDEXNOW_KEY` 產 `public/<key>.txt`，正式環境格式錯誤 fail-fast）＋ `submit-indexnow`（sync push 後 best-effort 通知 Bing 等，fail-soft script 內保證、`--dry-run`）＋ sync workflow 新步驟（main-only）與契約測試。
  - **`verify:geo`**：25 條規則對 build 產物驗 sitemap 覆蓋／llms-full／JSON-LD／dateModified 一致／noindex／robots 名單／sameAs／breadcrumb／transcript／enclosure／IndexNow key；已接入 `npm run check`（build 之後）。
  - **docs/GEO.md 營運 runbook**：資產地圖、crawler 政策（每季對照官方文件）、IndexNow 設定與雙端 env 漂移風險、分引擎量測（Google=GSC／Bing=IndexNow）、AI prompt baseline、部署後煙霧測試。

- **function 體積 gate（`verify:function-size` + `verify:no-public-fs`）**：掃描 build 產物 `.nft.json`，任一 serverless function trace >200MB 或 public/ 進 trace >20MB 或 feed.xml >10MB 即失敗；另以源碼紅線禁止 `app/` 內 `join(process.cwd(), "public", …)`（feed.xml 255MB 部署事故的預防雙閘）；已接入 `npm run check`。
- **新集通知 email 訂閱（LIST-2）**：`/subscribe` 靜態頁 + `SubscribeForm`；`POST /api/subscribe`（zod 驗證、家長同意、IP rate limit、Neon `subscribers` 表 `lower(email)` 冪等）；無 `DATABASE_URL` 時降級引導至 `#connect`；analytics `subscribe_submit`（僅 `source`、無 PII）。Migration：`scripts/migrations/003_subscribers.sql`。
- **成長量測模板（Growth-Measure-1a）**：`docs/metrics/README.md` 週報欄位與 UTM 對照；本機截圖／CSV gitignore。
- **宇宙地圖 UX 稽核與 e2e（MAP-UX-P1）**：`docs/UNIVERSE-MAP-UX-AUDIT-2026-07-11.md`；`e2e/universe-map.spec.ts` 觸控 assertion（overlay 擋 pan、backdrop 關閉、關閉鈕 ≥44px、reduced-motion 點島）；`e2e/a11y.spec.ts` 掃 `/adventures` 與開 sheet。

### Changed

- **頂欄 IA 重整（取代「更多」下拉）**：桌面主列改為全部故事／主題分類／遊樂園／宇宙地圖／育兒專欄（統一外連文案）＋ **NavDropdown「家長指南」**（指南首頁／關於／聯絡）；移除「更多」。膠囊桌面斷點 **≥980px**（原 920）；行動漢堡依探索／家長分組。文件：`DESIGN.md` 首頁 IA。
- **膠囊導覽「更多」下拉改 framer-motion 動畫**：`AnimatePresence` + `motion.div` spring 進退場（原 CSS keyframe 移除，關閉時新增退場動畫）；`useReducedMotion` 於減速偏好時進退場零動畫。新增依賴 `framer-motion@^12.42.2`，First Load JS 實測持平（shared 116→115 kB）。（註：下拉 trigger 已改為「家長指南」，見上條 IA。）
- **頂欄改 1c 懸浮膠囊導覽（桌面 ≥920px）**：`SiteNavBar` 桌面內嵌四個主要項（全部故事／主題分類／遊樂園／家長指南，含 active 態）＋「更多」下拉（宇宙地圖／育兒專欄 ↗／關於／聯絡，Esc 與外部點擊關閉）＋日/夜/系統三態常駐＋訂閱膠囊；半透明膠囊 backdrop-blur、雙層陰影。行動版維持漢堡選單不變。`--nav-h` 於 ≥920px 調為 66px+safe（landing pane／宇宙地圖高度共用）。同步：smoke 斷言分桌面/行動、SiteNavBar 測試包 ThemeProvider、視覺 baseline 36 張重生成（含補 `f47af57` hero 簡化後未更新的 stale baseline）。（**已被上方「頂欄 IA 重整」取代**；斷點與主列結構以新條為準。）
- **全站排版密度與文案精簡（/agent-plan 1783738772 委員會核准）**：`globals.css` 新增 spacing token 階梯（8/12/16/24/32/40px），DESIGN.md 回寫「間距」規範（觸控 ≥44px 只加不減、gap／行高／段寬底線、兒童頁少字原則）。文案精簡：SiteFooter 家長說明一行化、/about 介紹與使用步驟瘦身、/for-parents lede 與欄目列舉句、/characters intro（與 metadata 重複部分移除）、首頁 bedtime 標題縮至 8 字內；/legal 合併兩條重複 MIT 條目與外連重複句（法律效力語句經關鍵詞 grep guard 驗證無刪減）、bump 最後更新日。排版：/for-parents 大標行高 1→1.12、卡片間距 16→24px、StoryCard 摘要行高與 tags gap、/characters mobile 卡片 gap 10→12px。FAQ answer／StoryFilter 留白／RoughFrame padding／topic 膠囊等既定契約不動。驗證：lint + vitest 539 + build + e2e 21（含 axe）+ before/after 截圖 26×2。
- **訂閱轉換（Growth-P1a/b）**：單集頁 CTA 順序改為播放→收藏／分享→訂閱收聽，`SubscriptionCTA` 視覺降權；首段 Landing Hero 加「訂閱收聽」幽靈鈕捲至 `#connect`（頂欄 `SubscribeMenu` 維持）。
- **平台外連 UTM（Growth-Measure-1b）**：`lib/platform-utm.ts` 為 Spotify／Apple 等外連加 `utm_source=cheche_web`、`utm_medium=story_page|footer|subscribe_cta`、`utm_campaign=<slug|site>`；接線 `TrackedPlatformLink`、`ConnectHub`、`SubscribeMenu`；單集 `SubscriptionCTA` 帶 slug campaign。
- **ZoneSheet 觸控與 modal（MAP-UX-P1）**：sheet 開啟時 overlay `pointer-events: auto` 擋地圖 pan；關閉鈕／wishToggle ≥44px；sheet `max-height: min(72vh, 34rem)`。
- **宇宙地圖兒童易用性重構（`/agent-plan` 1783686748 委員會核准，Q3=A′／Q5 統一／Q7 翻 Decision D）**：
  - **單段式點島＋互動狀態機**：點任何島（含建造中／規劃中鎖島本體）一次即飛抵並開介紹 sheet；鎖島小 👀「看看」鈕移除；飛行途中再點同島立即開（連點加速）。內部以單一 `MapInteraction` 狀態機（idle→flying→sheet）取代三個命令式 ref 門閂，deep link／拖曳取消／StrictMode 走同一模型（推翻 2026-07-09「兩段式」決策，使用者明示同意）。
  - **鏡頭馴化（A′）**：`MAX_SCALE` 2.4→2.0；新增迷路自救——鏡頭靜止 700ms 後若所有島心都在視窗外（拖到只剩海）自動飛回樂園（`anyPointVisible` helper＋單元測試＋E2E）。
  - **ZoneSheet 兒童分流**：故事清單改大圖卡（emoji 主體＋EP 大字＋⭐，整卡可點 ≥56px）；許願表單、ParentTrustStrip 與 car-park 次要入口收進「給爸爸媽媽」disclosure，孩子首屏只見故事與主入口。
  - **無文字語意層（推翻 UNIVERSE-PROGRESSION-CONCEPT Decision D）**：狀態 pill 前綴語意 icon（🎉🚧🎁💭）、開放島木牌加飄動氣球🎈、首訪一次性「👆 點點看！」引導泡泡（session 一次、點島或 8 秒即收；deep link 入場不顯示）。
  - **「回樂園」自救鈕**：右下羅盤 icon 鈕改為房子 icon＋「回樂園」文字直排。
  - 動畫僅 transform/opacity、受 `prefers-reduced-motion` 控管；zone id／座標／art-tile 契約、`recordStoryCompleted` 完播口徑不變。E2E 更新：單段式／鎖島統一語意／迷路自救三條新測試，label 淨空改鎖木牌欄定位。

- **未來園區更名為「未來夢想島」**：僅改顯示名／文案（`id: ocean`、deep link、資產路徑不變）。
- **樂園地圖拖曳核心重寫**：pointer pan 加拖曳門檻（slop）、rAF 批次平移、放手慣性（`prefers-reduced-motion` 關閉慣性）；公開 `MapCamera` API 不變。

### Changed

- **樂園地圖遨遊手感（升級宇宙樂園 P1）**：開放島兩段式構圖一致——第一次點擊即套用與 sheet 相同的 dock offset 置中，第二次只開 dock 不再 fly（消除鏡頭上跳）；右下 `＋/－` 加大 hit area／步進並釐清 aria（方向鍵維持平移）；地圖層少字化（島名略放大、狀態 pill 降權、「看看」改圖示鈕，a11y／E2E 選取字串不變）。平移核心未重寫（仍待量測）。新增 `docs/UNIVERSE-PROGRESSION-CONCEPT.md` 層次升級設計概念（本輪不實作養成）。

### Fixed

- **樂園地圖深連結修復三合一**：① `?zone=` deep link 在 dev（StrictMode 雙效應）下 sheet 永不開——門閂改條件式 cleanup 釋放，query 清空即重置（同一 mount 內第二次深連結可再開）② 深連結鏡頭實際飛抵目標島——原本 `flyTo` 在 viewport 未量測（0×0）時靜默 no-op，鏡頭停在車庫 fit；改以 camera ready gate 等量測後再飛 ③ 深連結入場預寫 entry key 跳過進場降落動畫，避免與目標島 fly-to 互搶鏡頭。深連結開 sheet 改走 `revealSheet`（與點擊語意等價：URL 同步＋二次點擊 dock 行為一致）。新增 StrictMode 元件測試（jsdom + fake timers，RED 驗證）與 4 條 deep-link E2E（含 stage transform 斷言）

### Changed

- **樂園地圖平移效能**：`ZoneIsland` memo 化＋callbacks 依賴改穩定 `camera.flyTo`＋`resolveUniverseMap()` useMemo 錨定引用——拖曳平移期間島嶼子樹不再每 tick 重渲染（zoom 期間重渲染屬預期，階段二另議）；島圖 srcset `sizes` 以 0.25 級距 bucket 化（純網路策略，不影響視覺）

### Removed

- **far-island 遠景剪影遺孤資產**：parallax 改前景雲後 runtime 已不引用，刪除 `public/adventures/map/far-island-*`（8 檔約 2.75MB）並同步六處契約（`verify-map-art`、`map-art-src`+test、generate/fix 腳本、Art Bible）

### Added

- **每週設計評審流程（`proposals/`）**：訊號驅動的迭代提案週報——讀取許願/analytics/repo/趨勢四類訊號 + 幼兒 UX／家長信任／效能／品牌 heuristics 掃描，產出 3 個附驗收標準的排序提案；決策記錄（✅/❌/⏸）留檔避免重複提案。首份 `proposals/2026-W27.md`
- **注意力鉤子三件套**：① `familyActivity` 親子延伸活動三通路輸出（episode 頁／RSS／GEO）② 故事許願類型——`zone_wishes` 擴充 `category`（feature/story）+ `message`（≤200 字，story 必填）與表單 segmented control，analytics `wish_submitted` 僅送 category 無 PII ③ 集數×樂園地圖互連（`ZoneBadge` + zone sheet 故事清單 + RSS）
- **樂園地圖 v6**：左下「森林小島」第五島（黏土樹屋+木架整島 tile）、桌面 click-to-zoom（左鍵放大/右鍵縮小）、開放島兩段式互動（首次點 fly-to、再點開 bottom dock）、海天融接修正
- **樂園地圖 R-joy 2/3（密度＋夜間巡遊，純程式部分）**：R-joy 2——`MAP_DECOR` 海面密度包 11 件（帆船×2／浮標×3／魚×2／候鳥×2／螢火×2，密度由 car-park 向外遞減、避開島與標籤帶）；開放橋升級黏土棧道（深木底＋淺木面＋板縫節奏三層描邊）。R-joy 3——`NightFireworks` 夜間煙火（三發交錯 CSS 光效粒子、深度落在摩天輪後方綻放、reduced-motion 不渲染、paused 停格）；開放島夜間點燈（不隨夜色調暗＋海面光暈轉暖金）。黏土 PNG 類（渡輪／鯨魚／srcNight 島／煙火 sprite）仍列資產待產
- **樂園地圖 R-joy 1（歡樂感基建，純程式）**：① car-park 主島放大 1.25× 成 weenie 視覺磁鐵（迪士尼城堡手法；tile-local 步道／遮擋基線同步縮放）② 首次進園「高空降落」動畫（sessionStorage 每 session 一次、reduced-motion 直接定位）③ 點島慶祝：squash & stretch 彈跳＋六色星星迸發（重用 `star-burst-particle`）＋ `playSfx("collect")` 慶祝音（尊重 SfxToggle 與 reduced-motion 只關動畫保留音效）④ 縮放控制鈕接 `tap` 音 ⑤ 地圖左上角「車車宇宙樂園」木牌招牌＋黏土羅盤（裝飾性，語意標題仍為 sr-only h1）⑥ 預設鏡頭 fit 係數 0.96→0.88，視差天空（雲／遠島）從世界邊緣探出；海面舞台加 rx 圓角，退遠讀作漂在天空上的立體模型板
- **樂園地圖 P1 載入體驗**：島 tile 沙草佔位 + 淡入；標籤反相機縮放；car-park tile preload
- **樂園地圖 P0 資產交付**：島 tile 接 `@2x/@3x` srcset（`getZoneArtSrcSet`）；漫遊者 PNG→WebP + `<picture>`；rear `fetchPriority="low"`
- **樂園地圖 P2 收尾**：`getZoneArtSizes(mapScale)` 動態 `sizes`；`verify:zone-art` 四島 PNG 三階齊備；行動版標籤／縮放控制可讀性
- **漫遊小車 map 層級路線 + 接地影（R-anim 1.5c）**：`MapRoamerLayer` 海面環道／開放橋 stage path；獨立接地橢圓影（不翻轉）；y-sort；停用島內 `IslandRoamerLayer`（消除 car-park 重複車）
- **漫遊小車 2.5D 島上步道（R-anim 1.5b P0）**：小車改渲染於 `ZoneIsland` 內 `IslandRoamerLayer`（tile 14% + 接地陰影）；路徑接 `CAR_PARK_WALKWAY_PATH` 島內步道；`roamer-coords` 座標換算；移除全地圖 `CharacterRoamerLayer` 海面環線
- **樂園地圖漫遊者 PNG 資產（R-anim 1.5 資產）**：`public/adventures/roamers/xiao-hong.png`、`duo-duo.png`（gpt-image-2 edit + 定裝照 reference、magenta chroma-key、sharp 後製 ~728px RGBA、底中心錨點）；生圖腳本 `scripts/generate-roamer-assets.ts`（staging → contact sheet → `--approve`）；`MAP_ROAMERS` 啟用小紅＋多多（`car-park-walkway`、`startOffset` 0／0.5）
- **SEO 進階三刀**：逐字稿 VTT route（`/story/[slug]/transcript.vtt`）+ 故事頁 SSR 可索引 `<details>` 逐字稿；RSS 補 Podcasting 2.0（`podcast:transcript`、`podcast:guid`、`itunes:type`、`itunes:owner`、`itunes:episodeType`）；主要索引頁與故事詳情頁補自我 canonical；Episode JSON-LD 可解析 duration 時加 `timeRequired`（不加非標準 transcript）
- **車車宇宙樂園地圖（R0）`/adventures`**：鳥瞰群島園區地圖骨架——資料驅動 `zones`（`data/universe-zones.ts`）、跨海 Bézier 橋與 viewBox resolver（`lib/universe-map.ts`）、手刻 Pointer Events `pan/zoom/pinch/fly-to` 鏡頭（`useMapCamera`，無第三方手勢庫）、點島 fly-to 放大後開內容或「敬請期待」底部 sheet（`ZoneSheet` R0 stub）。R0 用 emoji／黏土塊佔位，海/沙/草為固定淺色（不隨日夜反轉）；每島為真正 `<button>` 含 `aria-label`、鍵盤 Enter 觸發、`prefers-reduced-motion` 瞬跳，並輸出 sr-only 島嶼清單供報讀器／SEO。車車樂園子連結衍生自 `LANDING_SEGMENTS`（單一資料源）。全站選單「宇宙地圖」入口 + `sitemap.xml` 收錄。**不動** `app/page.tsx` 與 `components/landing/*`
- **車車宇宙樂園地圖（R1）**：`ZoneLandmarkArt` 黏土風 SVG 地標取代 emoji（四島：摩天輪／恐龍／救援車／海浪＋火箭）；`ZONE_TERRAIN` 各島沙洲／草地配色；`ZoneIsland`／`ZoneSheet` 接入
- **車車宇宙樂園地圖（R2）**：`/adventures` OG 分享圖；`public/adventures/zones/*.svg` 靜態 artTile + `ZoneLandmark` fallback；`UniverseMapParallax` 視差雲層
- **樂園地圖 R0.5 去貼紙化 + 黏土光影**（純 code）：`ZoneIsland` 地標移除白框改黏土底座（高光／內陰影／接地投影）+ 木牌名稱；`UniverseMap` 海漸層 + 每島五層（接地投影／泡沫圈／沙草／黏土光影）；`MapControls` reset 改自繪 SVG home icon；`UniverseMapParallax` 雲朵蓬鬆化。場景色日夜皆不反轉
- **樂園地圖 car-park 黃金樣本（R1 起手式，純資產）**：`public/adventures/zones/car-park.{png,@2x,@3x}` 整島 diorama 真 RGBA 去背（AI claymation + magenta chroma-key + PIL despill + 後製接地陰影 + LANCZOS 三階），實機疊圖驗證通過；sidecar `car-park.tile.json` 鎖定 `stageSize 264×260`（trim 實測 228×253）／`anchorUV [0.5,0.84]`。**未接 R1 程式**（程式仍指向 `.svg`）
- **樂園地圖 R1 整島黏土化（四島落地）**：dino／rescue／ocean 依 v2 美術聖經 + `car-park.png` reference 產出整島黏土 diorama PNG（同一 magenta chroma-key + PIL 管線、box 264×260、anchorUV 0.5/0.84、三階 @1x/@2x/@3x），與 car-park 同一家族。程式接線：`zone-art-tile.ts` 四島改 `mode:"island"` + `anchorUV`、`zoneArtTilePath()` 回傳 `.png`；`ZoneIsland` 新增 island 模式（以 anchorUV 對齊 coord、stageSize 鋪島、木牌名稱＋狀態 pill 定位於沙岸底中心下方、hover 縮放）；`UniverseMap` 對 island 島跳過 SVG 沙草橢圓避免疊圖。狀態 pill 仍吃 `ZONE_STATUS_META`，海面/橋維持 SVG
- **樂園地圖美術聖經 v2**：鎖定 `car-park.png` 為全宇宙最高權威黃金樣本（「任何描述與圖衝突時以圖為準」）。相機由「正交 50°」改「3/4 高視角 ~30–35°＋輕透視」；燈光由「左上硬主光＋右下長投影」改「柔和均勻光＋短柔接地陰影」。base/negative prompt、檢查表、Blender 相機/光全面對齊黃金樣本；材質／品牌色／狀態變體／程式契約沿用 v1
- **樂園地圖美術聖經（Art Bible v1）**：新增 `docs/UNIVERSE-ART-BIBLE.md`（相機正交俯角 50°、左上暖光／右下陰影、霧面黏土材質、環境色票、小紅賽車比例尺、狀態變體、AI／Blender 生產管線、交付檢查表）讓各自產出的島維持同一世界感；`lib/universe/zone-art-tile.ts` 新增 `ZoneArtTile` 詮釋資料契約（`mode: landmark|island`、`anchor`、`stageSize`），現況全島 `landmark`／`center` **不改視覺**，為未來整島 diorama 預留切換點

### Changed

- **樂園地圖海洋滿版（map-fullbleed）**：海面貼圖鋪滿整個視窗——三個 sea rect 以 `SEA_BLEED=7200` 外擴（MIN_SCALE × 5120px 螢幕仍蓋滿，附推導與 guard 測試）、移除 rx=40 舞台圓角與 `seaHazeTop` 頂部霧帶（滿版後成為橫貫接縫）；視差層改造——刪遠島剪影（無地平線後語意消失）、雲改島群上方近景雲影（視差 0.48→1.15）、日月星改 screen-space 固定天象層（z:3）；相機 fit 行為不變（`fitScaleFor` 抽純函式 + 邊界測試，收斂兩處重複計算）。解決手機 375px letterbox 與桌面舞台硬邊
- **Landing 主標斷行策略**：標題斷行改由資料層 `\n` 控制（`.title` pre-line），主標「車車與遊樂園的故事」整句一行、「數綿羊」「捏黏土」兩段於「·」後斷行；移除以 `ch` 單位限寬造成的 CJK 逐字拆行（22ch 對中文僅 ~205px）
- **宇宙地圖 v5 收尾（黏土世界一致性）**：`SkyBodies` 日月改接黏土 PNG（`map/sun.png`／`moon.png`，取代向量漸層圓）；移除 `moonGlint` 螢幕空間向量月光線、夜間色溫罩減半（海面夜色改由 `sea-night.png` 貼圖本身承擔，罩層僅統一島嶼色溫，避免雙重夜化壓灰黏土紋理）；夜海貼圖惰性載入（日間不再下載 `sea-night.png`，首次切夜後掛載並保留 600ms crossfade）；視差遠島撤出舞台底部（§13 深度文法：y 越大越近，遠景剪影僅保留地平線帶）
- **Landing 手機／平板 CTA 縮小並對齊小紅車**：≤768px 改 auto 寬靠左、縮 padding／字級；≤600px 再縮一級，`content` 底距對齊 `DuduCompanion` 水平線，避開底部進度列
- **Landing nav 與 CTA 統一淡蜜桃橘**：top bar 與「全部故事／睡前故事」CTA 一起改淡蜜桃漸層（`#ffe7cf→#ffd5a8`）+ 暖深棕字（`#7a4012`，非黑）；`.next` 箭頭與 Subscribe pill 改暖深棕、進度小圓點改品牌橘 `#ff8c2b`（淡色在白底會消失）
- **Landing top bar 對齊 CTA 橘色**：nav 漸層改引用 `--landing-cta-*`（與「全部故事／睡前故事」同色），字色維持白；Subscribe pill 改反白
- **Landing top bar 淡橘色調**：`--landing-nav-*` 改蜜桃漸層（`#fff0e0→#ffd9b8`）+ 暖深咖字（`#4a3020`），柔化 shadow／邊框；`SubscribeMenu` pill 改淡 peach 底 + 暖描邊。段內 CTA 維持飽和橘。**不動** hero raster
- **Landing 陽光色系 + 引導按鈕 + 頁尾捲動 + 手機底部排版**（`d6c726f`）：新增 landing 專用色票（`--landing-nav-*` / `--landing-cta-*`，不改全站 `--landing-brand-ink`）。`SiteNavBar` top bar 改日出琥珀漸層（`#ffc857→#ff9f1c`）+ 白字 + 暖色投影，固定不隨 night 反轉。`SubscribeMenu` 訂閱改反白 pill（白底橘字）；hero CTA 改橘黃漸層 + 白字 + 暖 glow；`.next` 改半透明白底 + 琥珀 chevron。`LandingHub` footer 包成全屏 snap pane（`#landing-foot`），最後段 `.next` 可捲至頁尾不再彈回。手機 ≤768px：隱藏 `.next`、CTA 全寬、進度膠囊/嘟嘟分層重排。**不動** hero raster
- **Landing page 去暗沉 + top bar 迭代**（`eeeed4f` `7e42ee5`，top bar/CTA 後續由 `d6c726f` 陽光版取代）：scrim 改底部保護式漸層 + 強化 text-shadow；`.panel`/footer 深咖改 `var(--bg)`；手機進度膠囊改暖色玻璃。中間版 top bar 曾試奶油／木質調 + 品牌橘 CTA。**不動**全站主題 token 與 hero raster

### Fixed

- **樂園地圖 iOS Safari 反覆崩潰（OOM）**：海面貼圖改 screen-space CSS 平鋪（viewport 大小 div 以 `background-position/size` 跟隨鏡頭），移除 stage 內 `SEA_BLEED=7200` 外擴的三個 15400×15120 pattern rect——該 rect 在 `will-change: transform` 合成層 + `overflow: visible` 下把 GPU backing store 撐到視窗數十倍大，iPhone 3× DPR 直接記憶體爆掉、頁面「重複發生問題」。夜海惰性載入與 600ms 日夜 crossfade 行為不變
- **/characters「小衝」production 破圖**：git 追蹤 `.JPG` 大寫副檔名但程式引用 `.jpg`，本機檔案系統不分大小寫看不出、Vercel 上 404——git 改名修正
- **全域 focus ring token 化**：`a/button:focus-visible` 由硬編 `var(--ink)` 改 `var(--focus-ring)`，夜間補丁移除（行為不變：日=ink、夜=c-yellow）
- **車車宇宙地圖外連開窗**：外連島（`route.external`）的 `window.open` 移回使用者手勢同步呼叫棧——原本放在 fly-to 後的 `setTimeout` 內，Safari／iOS 彈窗攔截會靜默擋掉；並在拖曳打斷 fly-to 時取消尚未觸發的開 sheet／導航 timer，避免鏡頭被使用者接管後地圖仍自行開面板
- **車車宇宙地圖 a11y**：sr-only 島嶼清單連結加 `tabIndex={-1}`，鍵盤 Tab 改走可見島嶼 button；`UniverseMap` unmount 時清除 fly-to 後開 sheet 的 `setTimeout`，避免卸載後 setState
- **車車宇宙地圖 pan 手勢**：`useMapCamera` 在島嶼 `<button>` 上不 capture pointer，修復點島無法開 sheet 的問題
- **Storyline 式 Landing Hub**：`/` 為四段 segment 入口（車車故事／睡前數綿羊／捏黏土／衛教宣導）；現 podcast 主頁搬至 **`/stories`**
- **主題跟隨系統**：日間／夜晚切換新增「跟隨系統」選項；首次造訪預設與瀏覽器或手機 `prefers-color-scheme` 同步；`ThemeProvider` 監聽系統配色變更；FOUC 防閃 inline script 同步支援
- **營運管線文件**：`TODOS.md` 新增 SoundOn／Apple 同步四階段工作流、生圖通知方案（Issue／webhook／佇列）與 P2–P3 實作條目
- **版權合規**：`/legal`、字型 OFL、`THIRD_PARTY_NOTICES.md`、品牌圖示指示性使用、禁止素材再散布說明
- **角色名冊擴充至 6 位定裝照**：`public/characters/` 新增 安安救護車／小紅賽車／怪獸卡車／東東挖土機，連同 鈴鈴清潔車／恐龍車多多 全數登記進 `data/characters.json`（含別名、車種、英文外觀描述）。外部準備的圖統一正規化為 **1400×1400 JPEG、小寫 `.jpg`**，檔名對齊 `safeName()`（去空白與符號、保留中日韓字與英數，如「怪獸卡車 Monster Truck」→ `怪獸卡車.jpg`，英文入 `aliases`）
- README「每集劇情插圖」新增兩個實戰流程：**手動補定裝照**（自繪／外部生圖時的放圖＋正規化＋登記步驟）與**重抽單幕並指定角色（保留 Apple 封面）**——透過單張複製而非 `--approve`，避免覆蓋 Apple 原封面與重寫接線

### Changed

- **Repository consolidation**：Game Kit 收斂為 `react/`、`runtime/`、`progress/`、`games/` 四層，根目錄只保留跨層型別並全面使用 leaf imports；移除無 production consumer 的 GameKit test-only exports，新增 `docs/GAMEKIT-ARCHITECTURE.md` 記錄邊界、import policy 與新遊戲擴充注意事項；四款遊戲路由與既有進度 storage schema 保持相容
- **文件現況化**：README、DESIGN、Repository Audit 改寫為現行四款遊戲、Studio local metrics、Story-only content API 與 GameKit import policy。
- 單集頁：收藏改 SVG 愛心圖示，與分享列（複製連結／LINE）同排對齊
- ep-9 第 6 幕重抽為 鈴鈴清潔車＋恐龍車多多 同框（牙齒保健建議），以兩張定裝照當參考圖；封面 `01.jpg` 維持 Apple 原圖、`pageCount`／`captionTimes` 不變

### Removed

- **未出貨產品表面**：移除 feature flags、停用首頁區塊、Studio placeholder metrics、遊戲「製作中」假卡與 Story 以外的內容型別
- **Game Kit dead code**：移除雙目錄與 barrels、state machine、scene、pool、abilities、tilemap、Tiled loader、sprite scaffolding 及其測試專用 API
- **`public/` 清理**：移除已退役「車車吃星星」遺留素材 `public/games/cars/*.svg`（6 檔）、未被引用的 `apple-touch-icon-1024.png`（`gen_icons.py` 同步移除該尺寸）、`public/stories/ep-1〜6/README.txt` 佔位說明（規範改集中於 README「每集劇情插圖自動生成」一節）

## [1.3.0] - 2026-06-06

### Added

- **跨集角色一致（角色名冊 + 定裝照）**：`data/characters.json` 記每角色名／別名／車種／外觀描述／canonical 定裝照；切場景時文字模型辨識每幕出場角色，生圖時以該角色的定裝照（`public/characters/<名>.jpg`，可多張同框）當參考圖，讓同一角色跨集維持形象。新角色首次登場自動生定裝照，審圖後 `--approve` 存進名冊；`--char <名>` 可重抽定裝照
- **每集劇情插圖自動生成管線**（`npm run illustrate -- <slug>`）：由字幕側車檔切場景（OpenAI 文字模型，或 `--deterministic` 免 key 後備）→ 每幕以該集 `01.jpg` 當參考圖生**黏土風插圖**（OpenAI image，固定 `CLAY_STYLE_PREFIX`）→ 暫存 + `contact.html` **人工審圖** → `--approve` 進 `public/` 並寫 `overrides` 的 `pageCount`/`captionTimes`。播放器既有「依時間換圖」邏輯直接套用，**零播放器改動**。本機手動、CI 不放 key 不生圖。`scripts/illustrate.ts`、`scripts/lib/illustrate-core.ts`；修補 `applyDefaults` 讓 `captionTimes` 能從 overrides 傳遞
- **車車吃星星小遊戲** `/games/car-star`：給 3–7 歲的原創迷宮開車吃金幣遊戲（自繪 SVG 車輛、自訂地圖、WebAudio 音效）。方向鍵／WASD／觸控方向盤操作；`prefers-reduced-motion` 停用所有動畫仍可玩；SSR/hydration 安全、分頁切走自動暫停、320px 不溢出；最佳分數存 `localStorage`。`hooks/useReducedMotion.ts`、`components/games/CarStarGame.tsx`；footer 加入口
- **互動音效回饋**：點播放／翻頁／選車種 chip／開音效有輕「啵」聲，用 **WebAudio 振盪器即時合成**（零音檔、零下載、零網路，貼合「音檔不外送」精神）；播放器頂部 🔊／🔇 靜音切換，偏好存 `localStorage`、預設開（`lib/sfx.ts`）
- **動態生命感**：每頁左上吉祥物輕點頭揮手打招呼、首頁最新一集封面緩緩浮動、車種 chip hover 滑步；全部純 CSS、`prefers-reduced-motion` 由 globals 全域關閉
- **新集近即時上架**：Apple／SoundOn 同步排程由每日一次改為**每 15 分鐘**檢查 feed（來源即 SoundOn 官方 RSS），SoundOn 上架後最多約 15 分上站；新增 `concurrency` 鎖避免排程交疊。可在 Actions 頁手動 **Run workflow** 立即上架
- **字幕字級切換**：播放頁頂部新增 **Aa** 鈕，小／中／大三段循環切換字幕字級；偏好存 `localStorage`（`cc:caption-size`）跨集保留（字往上長，不擠壓底部控制列）
- **逐字即時字幕**：每集字幕存側車檔 [`data/subtitles/<slug>.json`](data/subtitles)，播放器依音檔時間顯示、**獨立於翻頁**（`lib/subtitles.ts`、`StoryPlayer` 的 `subtitles` 軌）；無側車檔則回退舊 `captions`/`captionTimes`。EP1–7 已上字幕
- **音檔自動轉錄**（本機 whisper.cpp，音檔不外送、零金鑰）：`npm run transcribe -- <slug...|--all>`、共用核心 [`scripts/lib/transcribe-core.ts`](scripts/lib/transcribe-core.ts)；**自動簡轉繁**（OpenCC `cn→twp`）並過濾幻覺鳴謝；`--convert` 可只重跑簡轉繁/過濾
- **Apple 同步新集自動上字幕**：`npm run sync:apple` 下載新集後本機有 whisper 即自動轉錄；缺工具/模型或 `SKIP_TRANSCRIBE=1` 自動跳過、不中斷同步
- **即時字幕（頁綁定）`captionTimes`** 與**字幕對時模式 `?cue=1`**：邊聽邊記每句秒數、複製貼回；播放頁維持 SSG
- 首頁標頭：三行 tagline 與**合作聯繫／許願投稿／留言給我**圓鈕（連結由 `SiteHeader.tsx` 的 `ACTIONS` 維護）

### Changed

- 字幕跟讀：有逐字字幕軌時優先顯示逐字字幕（依音檔時間），翻頁仍照舊
- 播放器**音樂播放器式底部重設計**：進度條含**目前／總時間**，控制列為 重複｜倒退 10 秒｜播放／暫停｜快進 10 秒｜停止；字幕與控制列拉開距離；移除「跟讀中會自動翻頁」提示
- **睡前定時**改為右上角 ⏱ 精簡選單（睡前 15／30／45 分），點選單外自動收起；移除「家長設定」收合面板
- 首頁圓鈕（合作聯繫／許願投稿／留言給我）改為**黏土質感**（高光漸層 + 貼紙立體陰影 + 按壓回饋）
- 播放器控制列**重新設計為線性圖示風**（Spotify／Apple Podcasts 風）：次級鈕（重複／倒退／快進／停止）改為透明本體 + 白色 SVG 線性圖示（`PlayerIcon.tsx`，取代 emoji，跨平台一致且銳利），hover／按下才浮現淡圓底；中央紫色播放鈕為唯一實心立體鈕，主從分明；倒退／快進的「10」秒數疊在弧線中央，重複開啟態以主題色 + 小圓點標記
- **viewport 開放縮放**：移除 `maximumScale`／`userScalable`，家長共讀可放大文字／插圖，符合 WCAG 1.4.4
- 同步 workflow 加 **`repository_dispatch`（`sync-now`）外部觸發**：可用免費外部 cron 打 GitHub API 準時觸發,繞過 GitHub 內建 `schedule` 的不可靠(best-effort、常延遲數小時);內建 cron 降為後備。設定步驟見 README「外部排程觸發」
- 同步排程加上**無新集早退**：`sync:apple` 在無新集時不再無意義改寫 `apple-sync-state.json`，CI 以 `git status` 判斷早退，省去空轉的 test／build

### Fixed

- **OG／分享網址**：`getSiteUrl()` 在 production 未設 `NEXT_PUBLIC_SITE_URL` 時改用 canonical 網域，不再輸出每次部署的臨時 Vercel 網域；`app/layout.tsx` 統一改用 `getSiteUrl()` 建 `metadataBase`（補 `lib/site-url.test.ts` 單元測試）
- 重生中文字型子集（含首頁圓鈕新字）

## [1.2.1] - 2026-06-03

### Added

- **Apple Podcasts 每日同步**：`npm run sync:apple`、`scripts/sync-apple-podcast.ts`；GHA [`.github/workflows/sync-apple-podcast.yml`](.github/workflows/sync-apple-podcast.yml) 每日 UTC 01:00，有新集時依官網現行框架上架並 push `main`
- `data/apple-synced.json`、`data/apple-sync-state.json`、`data/apple-sync.defaults.json`（含 `overrides.<slug>`）
- `scripts/lib/apple-sync-profile.ts`：標題推斷車種（含高鐵）、`pageCount` 預設 1
- `cleanEpisodeSummary()`：RSS 摘要去除 SoundOn 尾註與節目宣傳段
- 首頁車種 chip **`VehicleClayIcon`**（以該車種故事封面 `01.jpg` 作黏土縮圖）
- EP7（`ep-7`）經同步上架：高鐵、`pageCount: 1`

### Changed

- 首頁篩選改為 **車種 chip 列**（「依車車找故事」），URL `?vehicle=`；主題改由 `/topic` 進入（移除抽屜／主題標籤列）
- 故事內頁 **`StoryMeta`**：僅 EP + **時長**；不再顯示日期與年齡（同步新集亦不寫入 `ageRange`）
- Apple 同步新集預設 **`pageCount: 1`**、單圖 MVP；完整繪本需手動補圖與 overrides
- GHA 同步 workflow 新增 **`npm run build`** 關卡

### Removed

- 故事卡片與封面（Hero、詳情頁）**左下角 emoji 貼紙**
- 首頁故事卡 **縮圖角標 emoji**（`StoryCard`）

### Fixed

- EP7 車種／emoji 鎖定為高鐵 🚄；`overrides.ep-7` 補主題標籤
- RSS 無 `itunes:episode` 時以標題比對，避免重複建立 slug

## [1.2.0] - 2026-06-03

### Added

- 首頁 **ConnectHub**：「追蹤我們」「訂閱收聽」圖示卡片區（Instagram、Threads、Apple Podcasts、Spotify、KKBOX、YouTube、RSS）
- 站內 **RSS Feed**（`/feed.xml`），含 iTunes 延伸欄位與每集 enclosure
- `layout` 的 `<link rel="alternate" type="application/rss+xml">`
- 故事 **`ageRange`** 選填欄位；`StoryCard` 與詳情頁 `StoryMeta` 顯示年齡建議
- **主題標籤** client 篩選（`useState`，不整頁刷新）與 `/topic`、`/topic/[tag]` 靜態分類頁（SEO metadata）
- 首頁 **故事牆網格**（`StoryWall`）、`StoryCard` `grid` 版型
- 首頁 **LatestHero** 黏土風主視覺、`hero-home.jpg`
- 收聽平台圖示列（`PlatformLinks`）於每集故事頁；`lib/platforms.ts`、`lib/connect-icons.tsx`
- 車種分類頁 `/vehicles/[vehicle]`
- 收藏區（`FavoritesSection`）、繼續收聽橫幅（`ContinueBanner`）
- `lib/site-url.ts`、`lib/feed.ts`；RSS 單元測試（`lib/feed.test.ts`）
- `getStoriesByTag`、`getVehicleEmoji`；`allTags` 繁中排序
- Playwright E2E 設定（`npm run test:e2e`）
- `LICENSE`（程式碼 MIT）、`DISCLAIMER.md`（內容與使用聲明）

### Changed

- 首頁故事列表改為 **Server 預渲染**，移除「載入故事中…」Suspense 閃爍
- Open Graph / `metadataBase` 以 **`NEXT_PUBLIC_SITE_URL` 為準**（建置時未設定則不誤用 preview 網域）
- 頁尾由文字 pill 連結改回 **ConnectHub**；RSS 指向站內 `/feed.xml`（非 SoundOn 外鏈）
- 允許 **viewport 縮放**（移除 `maximumScale` / `userScalable: false`）
- 自託管中文圓體 **jf-open 粉圓（huninn）** 子集化（~100KB）
- 設計 tokens、SVG 場景裝飾、卡片／chips／播放器質感與 `prefers-reduced-motion` 守門
- 關於頁車種 chip 顯示各車種 **emoji**
- `TODOS.md`：A+B 成長策略、官網成長腦力激盪待辦

### Removed

- 頁尾 **SoundOn** 外鏈與 SoundOn 官方 RSS（改由站內 feed 提供訂閱）

### Fixed

- 首頁 Hero 圖片比例與置中
- 關於我們頁視覺與首頁 Hero 一致

## [1.1.0] - 2026-06-01

### Added

- 全站與每集故事的 SEO metadata（Open Graph、Twitter 卡片）
- 播放頁 canonical 指向詳情頁；播放頁 `noindex`
- 播放器媒體載入/播放失敗的中文提示
- `lib/story-utils.ts`、`lib/story-metadata.ts` 共用工具
- Vitest 單元測試（`data/stories.test.ts`，9 項）
- `README.md` 開發、部署與新集 SOP
- `TODOS.md`、`CHANGELOG.md` 專案維護文件

### Changed

- 音檔 `preload` 由 `auto` 改為 `metadata`，減少進入播放頁前的流量
- 首頁 title 改為 template 格式（`%s · 車車遊樂園`）
- 支援 `NEXT_PUBLIC_SITE_URL` / Vercel URL 作為 `metadataBase`

## [1.0.0] - 2026-06-01

### Added

- Next.js 15 全靜態站：首頁分類篩選、故事詳情、獨立播放頁
- 6 集《車車遊樂園》真實 SoundOn 音檔與故事資料
- 字幕跟讀與自動翻頁播放器
- 相關故事推薦、Footer podcast 平台連結
- PWA manifest 與 iPhone 主畫面圖示（藍天笑臉卡車）
- 吉祥物、童趣字型（Baloo 2）、每車種主題色
