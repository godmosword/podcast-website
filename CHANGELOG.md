# Changelog

本專案變更紀錄。格式參考 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)。

## [Unreleased]

### Fixed

- **本機 sync 繞過 Actions 漏開待生圖通知**：`npm run sync:apple` 本機 push 後新增 `npm run sync:notify`（複用 GHA `notify-live` 同一路徑，讀 `.cache/sync-run-report.json` 開／去重「待生圖」Issue），修正先前只有 GHA 觸發同步時才會通知、本機上架容易漏掉 `[illustrate]` Issue 的缺口；另補可選 `npm run sync:notify:reconcile`（掃 catalog 補漏，上限 3 筆、跳過已存在 open/closed 同標題單）、`SYNC_ALERT_DRY_RUN=1` 預覽、`--strict` 供本機非 0 檢查；`dryRun`／逾 24h 的 stale report 一律拒絕開單。GHA workflow 未變動。

### Security

- **法務／隱私強化**：
  - **瀏覽器安全標頭**：`next.config.ts` 為全站 `/:path*` 加 `X-Content-Type-Options: nosniff`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy: camera=()/microphone=()/geolocation=()/payment=()`、`X-Frame-Options: SAMEORIGIN` 與 CSP `frame-ancestors 'self'`（禁第三方嵌入整站，保留本站遊戲 iframe）；`Strict-Transport-Security` 僅在 `VERCEL_ENV=production` 附掛。新增 `next.config.test.ts` 契約鎖定基線標頭。
  - **同意留痕（consent audit）**：新增 `lib/legal-policy.ts`（`LEGAL_POLICY_VERSION`／`LEGAL_POLICY_UPDATED_AT` = `2026-07-22`）；許願與 Email 訂閱送出時以伺服器時間寫入 `consent_version` + `consented_at`，僅用於證明告知版本與資料治理，不建帳號、不做跨裝置識別。migration `005_legal_consent_audit.sql` 以 `ADD COLUMN IF NOT EXISTS` 加欄，舊資料維持 `NULL`（不回填、不推定同意版本）。
  - **資料最小化**：訂閱與許願 API 不再收集或寫入瀏覽器 `user-agent`；IP／user-agent 僅暫時用於防濫用速率限制，不入內容資料庫（`lib/subscribe-db.ts`、`lib/zone-wish-db.ts` 及對應路由測試同步）。

### Added

- **/legal 版權隱私頁全面擴充**：頁標改「版權、隱私與使用條款」，加章節錨點導覽與政策版本／日期標示；新增「可接受的分享方式」「侵權通知與處理（`/legal#takedown` 流程與必附資料）」「許願、建議與投稿內容」「第三方服務與資料處理者（Vercel／Neon／Resend／外部平台）」「兒少與家長使用」「安全與政策變更」章節。`DISCLAIMER.md`、`public/llms.txt` 同步侵權通知與分享／訓練限制措辭；訂閱與許願表單同意句更新（含「勿填孩子個資」提示）。

### Changed

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
