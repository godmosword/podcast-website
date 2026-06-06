# TODOS

> **成長主戰場（2026-06 共識）：** **A** Spotify／Apple 平台收聽與訂閱 · **B** Threads／IG 短內容導流。
> 官網定位：每集可分享的落地頁 + 訂閱轉換中心；「看圖聽故事」為差異化體驗，不與平台搶完整收聽。

> 格式：每項一段，行末標 `優先序 · 工時(人工) · 依賴`。工時 S/M/L；CC+gstack 約 1/10。
> 來源標記：〔eng〕程式發現 · 〔ceo〕plan-ceo-review · 〔design〕plan-design-review · 〔growth〕成長共識。

---

## 路線圖（單一優先序總表）

| 期 | 主題 | 條目 |
|----|------|------|
| **P0** 地基 + 第一印象 | 看起來完整、被搜尋到 | 首頁渲染修復 · 正式網域 · sitemap/robots · JSON-LD · DESIGN.md 同步 · 首屏精簡 |
| **P1** 訂閱轉換 + 分享 | 「沒看到訂閱」消失、可被轉發 | 單集訂閱 CTA 上移 · 首頁訂閱入口 · ConnectHub 文案/排序 · 每集分享鈕 · 試聽橋接 · 入門三集 · 空狀態 · 錨點導覽 |
| **P2** 信任/合規 + 內容 | 兒童產品權重、內容變深 | 隱私頁 → analytics · 主持人信任區 · 真實插畫 · 親子提示 · 新集通知說明 · 主題頁 SEO · 音檔壓縮 · 縮放/觸控/塗鴉 |
| **P3** 可靠/工程/可選 | 不掛、可回歸、加分 | 監控 · Service Worker · E2E smoke · ESLint CI · 角色圖鑑 · 大圖單欄 · 商業化 |

**相依鏈（務必照序）：** 正式網域 → sitemap/robots + JSON-LD → 隱私頁（先於 analytics）→ analytics。

**已備齊（勿重做）：** 故事牆、全螢幕播放器、每集落地頁 + **每集 OG 圖**（`lib/story-metadata.ts`）、`/topic` 與車種 SEO 頁、RSS `/feed.xml`、`ageRange`、PWA／收藏／繼續收聽、ConnectHub（平台 + 社群連結已填）、相關推薦。

**待決策（實作前定）：** ① 網域（`chechepark.tw` / `checheland.tw` / 其他）② analytics 工具（Vercel Analytics 省事 / Plausible 無 cookie / 不做）③ 縮放（鎖 vs 家長大字模式）④ 角色圖鑑與親子提示是否現在做（需 Bonbon & 馬米 文案）。

---

## P0 — 地基 + 第一印象

### 首頁集數列表渲染修復　`P0 · S · 無`　〔eng〕
`StoryFilter` 把整段故事牆包在 `<Suspense fallback="載入故事中…">`，內層用 `useSearchParams()`，Next.js 15 中此舉使該邊界退化為 client-only → **靜態 HTML 只有最新一集 + 「載入故事中…」，列表要等 JS 才出現**。這正是「看起來很簡陋」+ 首頁 SEO 空洞的根因。
**修法：** `useState` 初值改 `null`（= server 的「全部」），`vehicleParam` 只在 `useEffect` 套用，避免 hydration mismatch；移除把列表藏在 fallback 的結構。影響檔 `components/StoryFilter.tsx`；`app/page.tsx` 已傳完整 `stories`，不動。修完「首頁載入骨架」需求基本消失。

### 設定正式站網域 + `NEXT_PUBLIC_SITE_URL`　`P0 · S · 確認網域`　〔ceo〕
Vercel 設 `NEXT_PUBLIC_SITE_URL=https://正式網域`。OG／Twitter／RSS／sitemap 的絕對連結都靠它；未設時 fallback 到 `VERCEL_URL`／`localhost`。**擋住 sitemap、JSON-LD、每集分享預覽。** `app/layout.tsx` 已讀此變數。

### `sitemap.xml` + `robots.txt`　`P0 · S · 網域`　〔ceo〕
新增 `app/sitemap.ts`（首頁、`/story/[slug]`、`/topic`、`/topic/[tag]`、`/vehicles/[vehicle]`、`/about`）與 `app/robots.ts`（允許爬取、指向 sitemap）。主打「每集落地頁被搜尋到」卻沒給站點地圖，這是 SEO 最低門檻。Next.js 15 原生 `MetadataRoute`；重用 `storiesByNewest()`、`allTags()`、`allVehicles()`、`lib/site-url.ts`。

### Podcast 結構化資料 JSON-LD　`P0–P1 · S · 網域`　〔ceo〕
首頁輸出 `PodcastSeries`、單集頁輸出 `PodcastEpisode`（schema.org `<script type="application/ld+json">`），欄位對應標題／日期／音檔 URL／封面，對齊 `/feed.xml`。協助 Google 理解節目與單集（豐富摘要）。建議抽 `lib/json-ld.ts` 集中產生。

### 同步 DESIGN.md 與實作　`P0 · S · 無`　〔design〕
更新 `DESIGN.md`：`--ink-soft` → `#7a7268`、背景改 `.site-backdrop` + `.site-root`、viewport 鎖縮放說明、StoryFilter 塗鴉現況。設計文件漂移時改版易回到舊 token（例如又寫 body 四角 gradient）。實作見 `app/globals.css`、`app/layout.tsx`。

### 首屏價值主張與資訊架構精簡　`P0 · S–M · 無`　〔design+ceo〕
新訪客需 3 秒內懂「這不是一般 podcast 嵌入頁，是互動繪本」。**已做：** 標頭三行 tagline + 合作/許願/留言圓鈕（見 Completed）。**剩餘：** 檢視區塊順序（Header → ContinueBanner → LatestHero → FavoritesSection → StoryFilter），避免「最新集」與列表長期重複同一集；副標清楚傳達「給誰聽、睡前幾分鐘」。

---

## P1 — 訂閱轉換 + 分享導流

### 單集頁訂閱 CTA 上移　`P1 · S · 無`　〔design〕
`/story/[slug]` 在「看圖聽故事」主按鈕下方加次要區「在 Spotify／Apple 聽完整版並訂閱」，連 `ConnectHub` 平台連結（目前 `PlatformLinks` 在大綱之後）。從社群進單集的人不必滑到底才轉換（goodwill：先給要的、再要訂閱）。可先只做文案 + 連結。

### 首頁可見的訂閱入口　`P1 · S · 無`　〔eng〕
`SiteHeader`／`LatestHero` 區附小型訂閱入口（連 `#connect`）。平台連結已設定（`lib/platforms.ts` 含 Apple/Spotify/KKBOX/YouTube）但只在頁尾 → 首屏看不到被誤判「沒有訂閱」。

### ConnectHub 訂閱文案與平台排序　`P1 · S · 無`　〔growth〕
頁尾「訂閱收聽」加一句價值說明（訂閱後新集自動出現在 Podcast App）；平台順序改 **Spotify、Apple 優先**（對齊 A 多數聽眾）。`components/ConnectHub.tsx`、`lib/platforms.ts` 陣列序。SoundOn／RSS 已移除，勿加回。

### 每集分享鈕（複製連結 / LINE 模板）　`P1 · S · 網域`　〔growth〕
單集頁加「分享這集」：複製連結，可選 LINE 分享文案模板。**OG 預覽圖已備齊**（`lib/story-metadata.ts`），此項只剩分享鈕。B 戰場每則貼文固定連單集。

### 試聽片段 → 平台訂閱橋接　`P1 · M · 無`　〔growth〕
單集頁加 30–60 秒試聽（裁切 `public/stories/<slug>/` 預覽檔或播放器限制 `currentTime`），突出 CTA 導去平台聽完整版。社群進站者先感受聲音氣質再轉換。

### 首頁「入門三集」與本週更新　`P1 · S · 無`　〔growth〕
首頁加「第一次來？從這三集開始」精選區（`data/stories.ts` 標 `featured` 或手動 slug 列表）；最新集 Hero 旁補「本週更新」節奏文案。降低新聽眾選擇成本、建立訂閱期待。

### 首頁／篩選空狀態插畫化　`P1 · M · 素材`　〔design〕
為「載入中／篩選無結果／尚無收藏／尚無繼續收聽」設計吉祥物 + 一句話 + 明確下一步（換車種、聽最新一集）。純文字空狀態在兒童產品像工程預設。`app/page.tsx`、`StoryFilter`、`FavoritesSection`、`ContinueBanner`。

### 首頁錨點導覽（取代手機 sticky 篩選）　`P1 · S–M · 無`　〔design〕
長列表加頁內錨點／捷徑列（最新｜全部故事｜依車車）。iOS 上 StoryFilter 已改 `position: static` 避免合成破圖，犧牲吸頂；錨點補「找得到篩選」而不復活 sticky。集數 >15 優先度提高。

### 每集上線「社群貼文腳本」SOP　`P1 · S · 分享鈕定稿`　〔growth〕（營運，不寫程式）
`README.md`／`docs/` 新增每集 SOP：① 預告 ② 上線貼（官網單集 URL）③ 平台訂閱提醒 ④ 15 秒幕後再導連結。B 靠固定節奏與固定入口。

---

## P2 — 信任/合規 + 內容深化

### 隱私政策頁（analytics 前置）　`P2 · S · analytics 決策`　〔ceo〕
新增 `/privacy`（或把 `DISCLAIMER.md` 升為頁面 + 隱私段）：說明是否收集資料、localStorage 用途、analytics 方案、家長聯絡。**兒童產品一旦加 analytics，個資合規（COPPA/GDPR-K）即法律問題**，順序上必須先於量測。footer 加連結。

### Analytics：平台點擊分析　`P2 · S–M · 隱私頁`　〔ceo+growth〕
追蹤「哪集詳情頁 → 點了哪個收聽平台」（`ConnectHub`／`PlatformLinks` 外連加事件，必要時 UTM），對照 Spotify／Apple 後台完聽率與訂閱來源。下一集選題依數據而非猜測。無 cookie 方案優先（隱私）。

### 主持人信任區（Bonbon & 馬米）　`P2 · S · 照片+文案`　〔growth〕
關於頁或首頁下半加主持人小卡：照片、各一句話、節目理念（為什麼做親子車車故事）。熱門節目靠人格溫度；B 置頂貼可連同一區。家長會問「誰做的、適合我家孩子嗎」。`app/about/page.tsx`。

### 替換真實多頁插畫　`P2 · M · 授權插畫`　〔growth〕
各集 `public/stories/<slug>/` 佔位圖換成官方插畫，視需要提高 `pageCount`。真實繪本強化「看圖聽故事」睡前儀式感。`pageCount` 與 `01.jpg`～`NN.jpg` 對齊；一圖多句時 `captions` 可多於 `pageCount`（播放器重複封面）。

### 每集「給家長的小提示」/ 節目筆記　`P2 · S · 文案`　〔content+design〕
詳情頁大綱下加可選「這集可以聊什麼」2–3 句（`data/stories.ts` 加 `parentNote` 欄）。提升信任、利家長轉發 Threads、可與 JSON-LD description 共用。對標 Circle Round show notes。

### 逐集補 captionTimes（即時字幕對時）　`P2 · S/集 · 無`　〔content〕
即時字幕機制已完成（見 Completed）。逐集用播放頁 `?cue=1` 對時模式產生 `captionTimes` 貼回 `data/stories.ts`，讓字幕精準跟語音。未標的集自動回退平均切換。屬資料輸入、非工程；Apple 自動同步的新集無 captions，需先補字幕才有得對時。

### 新集通知路徑（家長向白話說明）　`P2 · S · 無`　〔growth〕
訂閱區簡短說明「如何訂閱／用 App 收新集」。RSS 技術面已有，家長多不熟 RSS，需白話引導。`ConnectHub` 加一兩句 FAQ 或連關於頁錨點。

### SEO：主題與系列頁擴充　`P2 · S–M · 無`　〔growth〕
延續 `/topic/[tag]`，每主題補一句家長向導語（非僅列表）、補站內連結結構。家長依「勇氣、睡前、安全」搜尋，主題頁是長尾入口。`generateStaticParams` 與 metadata 已具備。

### 壓縮 podcast 音檔　`P2 · S · 無`　〔content〕
ffmpeg 將每集 `audio.mp3` 壓到 mono 128kbps、目標 < 5MB（現每集 5–10MB，總 50MB+）。睡前=手機弱網，載入慢。指令見 README；壓後本機聽確認音質再覆蓋。

### 家長放大閱讀（縮放決策）　`P2 · S–M · 產品決策`　〔design〕
目前 `maximumScale:1, userScalable:false` 鎖縮放，與 DESIGN.md「允許縮放」衝突。二選一：① 放寬縮放（接受孩子誤觸）② 設定內「大字模式」只放大說明/字幕。與 WCAG 對比修復互補；需實機驗證 3–5 歲。

### 篩選 chip 觸控與鍵盤順序　`P2 · S · 無`　〔design〕
實機確認車種 chip 觸控區 ≥ 44×44px；Tab 順序：主 CTA → chip 列 → 第一張故事卡。兒童/家長多觸控，鍵盤使用者需可「選車種 → 開第一集」。`StoryFilter` 已用 `<button>`，`globals.css` 有 `:focus-visible`。

### StoryFilter 區塊塗鴉一致性　`P2 · S · DESIGN.md`　〔design〕
決定「依車車找故事」區補 1–2 個 `Doodle`（與 Header 呼應）或刻意留白，寫入 DESIGN.md 並實作一致。中段全無裝飾時，全站上下塗鴉多、中間素，像兩套設計拼貼。

---

## P3 — 可靠 / 工程 / 可選

### 錯誤／上線監控　`P3 · S · 無`　〔ceo〕
接輕量 client error 上報（Sentry free / Vercel）+ uptime（UptimeRobot），至少涵蓋首頁與一個播放頁。站掛了、播放器某機型崩了要有人知道。純 SSG，client error 為主要風險（播放器、iOS 合成破圖回歸）。

### Service Worker 離線快取　`P3 · M · 無`　〔eng〕
為 PWA 加 SW，快取已播放過的音檔與插圖。已有 `manifest.json` 但無離線能力；睡前弱網常見。評估 `next-pwa` 或自寫最小 SW；注意 MP3 快取容量與更新策略。

### Playwright E2E smoke　`P3 · M · 無`　〔eng〕
首頁 → 詳情 → 播放頁 smoke test。目前只有單元測試，路由與播放器需回歸保護。播放在 headless 跳過實際 decode，至少驗證渲染與連結。`e2e/` 已設定。

### ESLint CI 設定　`P3 · S · 無`　〔eng〕
`next lint` 改非互動設定（`eslint.config.mjs` + `@next/eslint-plugin-next`）以接 CI。目前會跳首次設定精靈，無法在 CI 用。

### 車車角色圖鑑（新頁 `/characters`）　`P3 · M · 角色文案`　〔ceo〕
用既有資料做角色小圖鑑（安安救護車、東東挖土機、鈴鈴清潔車、小紅賽車、小飛無人機、未來電動車…，角色名已在標題）：黏土縮圖 + 一句個性 + 連到該集。新 SEO 落地頁 + 「找下一集」入口。重用 `VehicleClayIcon`、`getVehicleCoverPath()`、`allVehicles()`、`getStoriesByVehicle()`，仿 `/topic` 結構。

### 首頁列表「大圖單欄」模式（可選）　`P3 · M · 年齡定位`　〔design〕
若主攻 3–5 歲，評估故事牆改大封面單欄卡（少文字、大圖磚）或僅窄螢幕啟用。對標 YouTube Kids；現左圖右文在 5+ 較合適。需使用者研究，非必做。`StoryCard`。

### 成長與商業（依階段）　`P3 · L · 營運階段`　〔growth〕
逐步把官網從「連結集合」變「成長與變現中樞」：贊助 landing、周邊／活動、多語等。親子 IP 可先不做電商。

---

## 延後（現階段不優先）

| 項目 | 原因 |
|------|------|
| Email 電子報 / 會員 | 平台 App 已有新集通知；先用 Threads 導流，需後端/第三方與隱私同意 |
| 著色頁／活動單 PDF | IP 成熟後再做，先拉高單集分享率 |
| 部落格長文 SEO | 初期單集頁 + 平台關鍵字效益較直接 |
| 網站內 RSS 播放器 | 訂閱導向 Spotify／Apple 即可 |
| 睡前模式／季節主題皮 | 溫馨感加分，但不擋 A+B 主線 |
| 全站 redesign／換字體 | 現有手繪風格已具辨識度 |
| 首頁 3 欄 icon 功能介紹 | 違反 AI slop 黑名單，與品牌不符 |
| iOS sticky 篩選列復活 | 除非有 fixed 複製列方案且通過 iOS 26 實機 |

---

## Completed

### 即時字幕機制 + 字幕對時模式
`Story` 加選填 `captionTimes`（每句起始秒數）；播放器有提供時精準換句（插圖同步），未提供回退時長平均切換（向下相容）。新增 `?cue=1` 對時模式：邊聽邊記每句秒數、複製貼回資料。播放頁維持 SSG。檔案：`data/stories.ts`、`components/StoryPlayer.tsx`、`app/story/[slug]/play/page.tsx`、README。
**Completed:** main（2026-06，逐集 captionTimes 待補，見 P2）

### 首頁標頭：三行 tagline + 合作/許願/留言 圓鈕
標頭單行副標 → 三行 tagline（用車車故事陪伴孩子成長／融合生活中事件及發揮想像出發／一起探險、學習、勇敢闖關！）；新增三顆圓鈕（連結由 `SiteHeader.tsx` 頂部 `ACTIONS` 陣列維護），維持手繪黏土風與 WCAG 對比；重生中文字型子集含新字。
**Completed:** main @ a8adef8、57433c4（2026-06）

### 頁尾與關於頁資訊架構重整
ConnectHub 分「追蹤我們／訂閱收聽」、圖示下顯示名稱；移除 SoundOn／RSS；關於頁車種 chip 用對應 emoji；減少重複訂閱區塊。
**Completed:** main @ b46379e 起

### 營運就緒：SEO、測試、文件（CEO 審核 B 方案 P1）
每集 SEO metadata、音檔 preload 策略、播放器錯誤提示、README SOP、Vitest 單元測試。新增 `lib/story-metadata.ts`、`lib/story-utils.ts`、`data/stories.test.ts`、`README.md`。
**Completed:** v1.1.0（2026-06-01）

### 主題標籤篩選與 SEO 分類頁
首頁主題 chip client 篩選、`/topic` 索引與 `/topic/[tag]` 靜態頁。
**Completed:** main @ 4d89422 起

### RSS Feed 與 ageRange
`/feed.xml` podcast RSS、`layout` alternates、ConnectHub／PlatformLinks RSS；故事 `ageRange` 與卡片／詳情顯示。
**Completed:** main @ 640ce5f 起

### ConnectHub 頁尾訂閱／追蹤區
圖示卡片式「追蹤我們」「訂閱收聽」分區，取代文字 pill 連結列。
**Completed:** main @ 0b7b0f2 起
