# 車車遊樂園 — 設計系統 v0.2

Bonbon & 馬米親子 Podcast「看圖聽故事」網站的視覺與互動規範。

## 視覺方針（v0.2：插畫主導＋克制 chrome）

保留黏土插畫與粉嫩品牌色，chrome 依 **Apple Human Interface Guidelines** 升級為清晰、讓位、有深度的產品介面——童趣靠插畫與色彩，不靠麥克筆描邊或密集塗鴉堆可愛。

| 原則 | 落地 |
|------|------|
| Clarity（清晰） | 字階分明、對比足夠、裝飾不搶內容 |
| Deference（讓位） | UI 退讓給黏土插畫／故事封面 |
| Depth（深度） | 柔陰影、`--elev-*` 高度階梯、半透明層；`--hairline` 用於分隔線**與無影像抬升塊**（`ConnectHub.block`、`StoryFilter.filterBar`）；有封面的內容卡（`StoryCard`／`LatestHero`）不用盒子描邊，靠 `--elev-*`。壓在影像上的 chrome 必須有**自身底色或描邊**（不得只靠 scrim）：Landing 分區 CTA 用不透明 `var(--landing-brand-ink)` 底板＋`var(--on-dark)` 白字；**分離度主要由 2px 淺邊＋外圈深棕 ring 承擔**（夜間板身與 scrim 同色族，`--gloss`／`--elev-2` 是黏土語彙而非夜間輪廓主力）；刻意不用 backdrop-filter。鍵盤 focus 必須用淺色環（Landing `.cta`／`.moreSkip` 用 `var(--on-dark)` outline），不得只靠日間 `--focus-ring`（深墨） |
| Consistency（一致） | 導覽、卡片、CTA、內容頁同一節奏 |
| Feedback（回饋） | 輕 `scale(0.98)`／opacity；取消歪斜 rotate 與厚底影下沉 |
| Aesthetic Integrity | 童趣靠插畫與色彩，不靠麥克筆描邊 |
| Content over chrome | 卡片／篩選無 RoughFrame；Header／Footer 塗鴉 ≤2；`.marker` 僅少數標籤；**容器不做左緣色條**（`border-left: 3px solid …` 那種「引言條」——家長頁育兒小筆記 M7、故事頁本集介紹 M1 已拿掉；分隔／強調靠 `--hairline`＋`--elev-*` 與標題階級，不靠一條彩邊） |
| Motion with purpose | 僅 transform／opacity；一律 `prefers-reduced-motion` |
| Accessibility | 觸控 ≥44px、`:focus-visible`；不改 ThemeProvider API |

**不做：** 換成 SF Pro、全站暗黑產品風、改地圖／播放器黑底／遊戲畫布、改 Apple sync workflow。

## 受眾

| 對象 | 需求 |
|------|------|
| 3–7 歲兒童 | 大觸控區、少文字、強視覺回饋、沉浸式播放 |
| 陪同家長 | Footer 使用說明、Podcast 訂閱導流、分享預覽正確 |

## 語言與命名

- 品牌固定寫作「車車遊樂園」；Podcast 固定大寫 `Podcast`，平台名稱固定為「Apple Podcasts」。
- `/stories` 的導覽名稱固定為「全部故事」；「故事屋」只用於兒童向文案或返回 CTA，不作為路由或元件名稱。
- 「播放」指站內播放器；「收聽」指 Podcast 平台或外部連結；「遊樂園」指遊戲入口區，「遊戲」指單款作品。
- `/for-parents` 固定稱「親子指南」（路徑不變）；Threads 外連在頁內固定稱「育兒小筆記」，不再作為導覽項，兩者不互換。
- **親子景點／親子遊樂地圖／宇宙地圖**三者不互換：全站導覽（含行動抽屜）固定稱「**親子景點**」，連至 `/for-parents/play-map`；該頁 H1 固定「**親子遊樂地圖**」；「**宇宙地圖**」僅指 `/adventures` 虛構世界地圖，不得用於真實世界親子場域或 `/for-parents/play-map`。
- 「**縣市色塊圖**」固定指 `/for-parents/play-map` 的 CSS Grid 磚牆，不叫「台灣地圖」「熱區圖」，以免與 `view=map` 的 OSM 底圖混淆；此頁一律不得出現「宇宙地圖」語彙或 `components/universe/` 的島嶼／海／天資產。
- 元件與 CSS class 使用當前產品語義，例如 `SiteNavBar`／`SubscribeMenu`；功能改名後不保留已退役的 `More*` 命名。

## 裝置

- **Mobile-first**，內容欄寬 `max-width: 640px` 置中
- **留言牆（`/feedback`）**：維持 640 單欄、不掛 `SiteHeader`。首屏在標題「留言給馬米跟Bonbon」前放卡丁車賽道實拍照（原生 `<picture>`，`/feedback/hero.jpg`），其下為邀請段落；不畫對話泡泡、不引用角色名冊定裝照。頁底 `--page-warm-*`。表單**一律**在初始 HTML：直接落在頁面暖底上（無信紙卡、無左緣尺線）＋蜜罐 `website`＋可見「暱稱／信箱（選填）／留言」標籤；無雙同意勾選，填完即可送出。留言欄底為實色、不畫橫線。送出「我要留言」用暖深墨底板＋白字（對齊 Landing CTA 色票，非橘色實心）。無 `DATABASE_URL` 或送出回 unavailable 時，表單仍在，mailto「用 email 留言」只當次要備援（可帶入已填暱稱／正文）。牆用 Suspense；空牆只留標題，不放 CTA、不放範例卡、不寫「還沒有公開留言」；有核准留言即列牆。真留言 `--hairline` 列。夜間圓章 `--c-*` 混色約 40%。蜜罐移出畫面，不用 `display: none`。
- **地圖／儀表板工具頁**（如 `/for-parents/play-map`、`/for-parents/dashboard`、`/studio/feedback`）豁免 640px 單欄限制，內容區 `max-width: 1100px` 置中，以容納地圖與並排控制
- **全部故事（`/stories`）桌機 ≥768**：整頁 `.main` 同樣放到 `1100px`（含標題、SiteHeader、LatestHero、收藏、找故事），以容納縮圖網格。`<768` 維持 640。這是欄寬豁免，不是新的全站 chrome 斷點。
- **單集頁（`/story/[slug]`）桌機 ≥980**：`.main` 放到 980、`article` 開 grid（左欄 `minmax(0,1fr)` ≈488px＋右欄封面 420px）。左欄**只有一個對齊軸**＝CTA 的左緣與寬度：標題／meta（EP、時長）／「開始看故事」／分享列（底線文字，`.actions .shareRow` 靠左，覆寫 `ShareButton .row` 的置中；收藏留在同一列）／本集介紹卡／共讀連結依序疊在左欄（grid areas `actions → intro → parent`），封面縱貫全部具名列。首屏不放主題膠囊，也不放島嶼長句。有場景字幕時，「故事大綱」在 grid 之後、預設收合；有出場角色時角色條直接可見；「下一集」封面卡與島名連結在頁尾。本集介紹卡是 hero 組合的一部分（安靜輔助面）：卡框與標題留著，卡身與 `contentSection` 同語彙（hairline＋`--surface-elevated`＋`--shadow-sm`），**標題不加 accent 短槓、夜間不套 `--warm-card-glow`**；介紹卡底 `--space-8`＋下一區頂 `--space-8` 是 hero→正文的 64px 層級間距，不得縮成 32。介紹卡在所有寬度與內容欄同寬同左緣（不再 380px 置中，也不再 ≤640 內縮 28px）。分享列靠左只在 ≥980。「給爸媽」置中只在 <980。`<980` 仍單欄，封面維持置中，不跟介紹卡拉左。手機介紹卡底 `--space-8` 加大綱卡頂 22px 的垂直節奏不在這條對齊裡改。
- **角色圖鑑／親子指南**（`/characters`、`/for-parents`）：不掛 `SiteHeader`（無 `hero-home` 行銷圖）；緊湊頁首用 `--fs-h1`，圖鑑網格／家長工具接在標題下。定裝照有場景圖與奶油白棚拍兩套素材，**用 CSS 統一底墊而不重拍**：日間 `.portrait` 走 `mix-blend-mode: multiply`（白底乘上 `--warm-portrait-bg` 就是底墊色），兩主題 `.portraitMat::after` 疊邊緣暈影（夜間加重成聚光）；新增角色照不必再挑棚拍／場景。
- **親子景點頁（`/for-parents/play-map`）— 版型與瀏覽**：不掛 `SiteHeader`（全域 `SiteNavBar` 已顯示品牌，再放一次會出現兩個字標與重複 h1）；工具殼無行銷 hero／長 lede；H1「親子遊樂地圖」在工具頂列。**主瀏覽介面是「縣市色塊圖＋分組名單」，不是 OSM 底圖**：`view=cards`（預設，含桌面）滿版呈現 22 縣市磚牆與分組名單，**任何寬度都不掛 Leaflet**（首屏零 tile 請求，e2e 有正向回歸）。磚牆用 CSS Grid 手排 row/column 近似台灣地理（基隆在上、高屏在下、宜花東在右欄）；**不用 GeoJSON、不用精確縣市界**，磚牆下方須有**可見**文字「示意排列，非實際地理位置」，不得只放進 `aria-label`。色深是 choropleth 但**不得是唯一編碼**，命中數必須同時是可見文字，且不得用 `--ink-soft`（疊在最深的著色磚上只有 3.07:1／夜 4.29:1）。三態（`covered`／`empty` 此條件 0 筆／`uncatalogued` 尚未收錄）必須用邊框樣式＋文字雙重編碼，**不得用 `opacity` 降階**（透明度會連文字對比一起吃掉）。**資料誠實紅線**：資料僅涵蓋 15 縣市，宜蘭／花蓮／台東／屏東／澎湖／金門／連江的磚必須顯性標示「未收錄」且不可點選，並在下方句子重述「不代表當地沒有好去處」。點磚＝選縣市，再點一次取消；**手機 <640px 選定後磚牆收合成一行「桃園市＋關閉圖示」**（漸進式揭露），收合時焦點移到該收合鍵，取消時還給原本那塊磚。地圖視圖收起磚牆（地圖有自己的 cluster）。名單依狀態三選一分組（有定位→車程帶 ≤20／20–40／40–60／60 分以上；無定位且未選縣市→縣市，北到南；已選縣市→類型，沿用 `PLAYGROUND_TYPES` 順序），組標題為「20 分鐘內 · 4 個」，空組略過；**車程是直線距離粗估，分組時必須附免責文字，且渲染在第一組標題之上而非頁尾小字**。結果列為句子式「在〔全台〕找〔免費〕→ **12 個地方**」，結果數放大為主資訊；內層 span 全部 `aria-hidden`，h2 的 accessible name 由 `srText` 提供。未顯示卡片一律 `hidden` 遮蔽（以跨組連續的 `displayIndex` 判定），**不得 slice 陣列**（SSR 索引契約）。
- **親子景點頁（`/for-parents/play-map`）— 地圖分頁與美術**：Leaflet + OSM 為**次要分頁**（`view=map`），僅在已選縣市或已定位後按「看地圖」才動態載入，返回名單不重建容器；未選縣市且未定位時不渲染「看地圖」，無縣市的 `?view=map` 進頁軟著陸名單並清掉該參數。手機地圖模式全幅，篩選列留在名單，沒有 bottom sheet snap。縣市／附近地圖走 `fitBounds`；`minZoom` 維持 `TAIWAN_SOFT_MIN_ZOOM`（7），本輪不改。**桌面 ≥980px 名單與地圖並排（名單約 44%）只在 `view=map` 生效**；`view=cards` 為滿版名單（卡片走三欄）。CSS 的 980 並排規則必須 scope 到 `.root[data-split="true"]`，否則名單模式會被 `max-height: 64dvh` 夾住。一列主控制（附近／雨天／免費／放電／室內＋次要「篩選」），`data-quick-filter` 屬性為 e2e 契約不得更名；縣市／類型仍留在可收合篩選面板作為鍵盤／進階備援。無場館照片時以**類型縮圖 plate**（7 種手繪 SVG，置左）與家長筆記構成卡片；Google 導航／顯示位置用頁面場館名＋縣市，不用 lat,lng 圖釘。詳情 sheet 的 full 變體用事實 chip（**車程放第一格**）＋兩層出口（導航／查看完整資訊為主，在地圖看／顯示位置／官網降為文字連結）；compact 變體不動。頁面層篩選 chip 與**縣市色塊圖**一律走 ghost／`--accent`（邊框、底色）／`--accent-ink`（文字、圖示）；`--map-chip*` 只留給地圖 overlay（縮放鍵、spatial cluster、mapHint），色塊圖**不得**借用。**七類型母題有兩個消費點**：卡片 plate（彩色，96 viewBox，`components/for-parents/type-scenes/`）與**地圖針中心剪影**（單色 `currentColor`，24 viewBox，`lib/playground-type-glyph.ts`）。針用圓形黏土容器＋較大剪影（色相＋形狀雙重編碼）。剪影色為**固定美術色** `#34302b`（不隨主題翻轉）；「其他」類的針與卡片 accent 用固定淺沙 `#cfcac2`，不用 `--ink-soft`。針**不**共用 `--map-chip*`。柔化一律用 SVG `feGaussianBlur`，**禁用 `backdrop-filter` 與 CSS `blur()`**。
- 桌面端維持單欄，兩側留白。**例外：** `/stories` 找故事目錄在桌機縮圖模式為兩／三欄網格（見「全部故事」）。主題／車種／相關／收藏卡仍是橫式單欄。
- PWA：`manifest.json` + Apple Web App meta
- Viewport 允許使用者縮放（未設 `maximum-scale` / `user-scalable=no`），方便家長放大閱讀

## 響應式斷點

- viewport 只使用四層：`480px`（手機／小尺寸控制）、`640px`（內容欄與手機版型）、`768px`（平板雙欄）、`980px`（全站膠囊導覽＋Landing 桌面版；**漢堡不隨此斷點消失**，見首頁 IA）。內容欄最大寬（如家長頁 `min(920px, 100%)`、`/stories` 桌機 `1100px`、找故事完整模式 `56rem`）不屬 viewport 切版斷點。`/stories` 縮圖欄數在 `1280px` 從兩欄改三欄，只影響找故事目錄。
- 導覽內部依父容器寬度使用 `@container nav-inner (max-width: 300px)`；元件尺寸受父容器影響時優先用 container query，不新增任意 viewport breakpoint。
- 新頁面先用 fluid `clamp()` 與現有 token；只有整體版型切換才使用上述斷點。

## 色彩

多彩粉嫩風（純白底）：白為主，彩色出現在裝飾、卡片邊框與 chip。

| Token | 值 | 用途 |
|-------|-----|------|
| `--bg` | `#ffffff` | 頁面背景（純白） |
| `--bg-2` | `#fbfbfd` | 次背景 / 卡片漸層 |
| `--bg-dot` | `#eef1f6` | 極淡灰藍底紋 |
| `--ink` | `#34302b` | 主文字（中性深灰） |
| `--ink-soft` | `#7a7268` | 次要文字 |
| `--card` | `#ffffff` | 卡片背景 |
| `--surface-elevated` | `var(--card)` | 抬升表面（卡片／區塊） |
| `--surface-glass` | 半透明 card mix | 導覽／次 CTA 玻璃層 |
| `--hairline` | `rgba(0,0,0,0.08)`（夜間白 12%） | 細分隔線；`--line` 別名之 |
| `--accent` | `var(--warm-accent)` | 一般互動強調色；可由單集元件的區域樣式覆寫 |
| `--accent-soft` | `color-mix(in srgb, var(--accent) 18%, transparent)` | 強調色淡底 |
| `--on-dark` | `#ffffff` | 深色／品牌底上的文字與圖示 |
| `--status-error` | `#b42318`（夜間 `#ffb4ab`） | 錯誤訊息 |

CTA 三階（美術審 H1；token 在 `app/globals.css`）。不建共用 React `Button`。`--cta-warm-*` 仍給貼紙／夜色，不是這三階。七處第一刀主鈕改綁 `--cta-solid-*`（計算值仍等於 `--landing-brand-ink`／`--on-dark`）；H1 收尾（2026-09-16）再加 `LatestHero` 「立即看故事」（/stories 唯一主行動，原 `story.color` 22% 淡底）綁 solid、家長頁「另開 Threads」綁 soft。Landing 分區 CTA、留言送出、`PlayButton`、遊戲內 `GameChrome`／`BlockDropView` 不吃這組。未啟用的 `.subscribeCta` 壓在 hero 上走不透明 `--on-dark`＋`--landing-brand-ink`，不吃夜間會翻色的 `--cta-soft-bg`。

| 階 | Token | 長相 | 用途 |
|----|-------|------|------|
| solid | `--cta-solid-bg`／`--cta-solid-fg` | 暖深墨底＋白字（別名 `--landing-brand-ink`／`--on-dark`） | 頁面唯一主行動 |
| soft | `--cta-soft-bg`／`--cta-soft-fg`／`--cta-soft-line` | 卡片底、深墨字、細線、`--elev-1`；無玻璃／橘黃 | 次行動 |
| quiet | `--cta-quiet-fg` | 透明底、底線、`--accent-ink`、觸控 ≥44px | 三次／備援出口 |

美術審 **M1–M8／L1–L7 編號清單不在本檔**（H3 登記時寫「記在看板」，看板未入庫）。對照與 H1–H3 消化狀態見 [TODOS.md](./TODOS.md) 本輪已完成（2026-09-15）。不發明編號。

多彩粉嫩 accent（裝飾、chip、邊框輪播）：

| Token | 值 |
|-------|-----|
| `--c-pink` | `#f7a8c4` |
| `--c-yellow` | `#ffd866` |
| `--c-mint` | `#b7df9b` |
| `--c-sky` | `#8fcde8` |
| `--c-teal` | `#79c8c1` |
| `--c-lilac` | `#c5b3e6` |

頁面背景為純白（`--bg`），四角極淡多彩柔光由獨立節點 `.site-backdrop`（`position: fixed`）繪製，內容包在 `.site-root` 內（`min-height: calc(100% - var(--nav-h))`，扣掉固定頂欄高度，否則短頁 body 會比視窗高一個頂欄、水合前點圓鈕會推頁）；**不在 `body::before` 上畫 gradient**，避免 iOS Safari 上 sticky／合成層白塊跑版。柔光飽和度刻意偏低。實作見 `app/globals.css`、`app/layout.tsx`。
每則故事另有 `story.color`（hex），用於 CTA、播放鈕（卡片本身不再用極淡色邊）。

### 夜間色票原則（暖炭黑）

睡前主題走「暖炭黑」：近黑但帶一點棕（b < r），**不用純黑**（OLED 捲動拖影、卡片無法浮起），也不回到冷調產品暗黑或舊版深靛藍（2026-10-06 由暖夜靛改版，比較預覽見 claude.ai artifact「車車遊樂園夜間色票」）。實作僅覆寫 `[data-theme="night"]` token 值，**不改 ThemeProvider API**。

| 原則 | 落地 |
|------|------|
| 暖底＋可讀層次 | `--bg` `#141312`、`--bg-2` `#1c1a18`、`--card` `#272422`、`--card-2` `#312e2a`。黑底上 `--elev-*` 陰影幾乎看不見，浮層**靠明度階差**（bg→card 1.20:1、card→card-2 1.14:1），不得再把 `--card` 壓暗。`--bedtime-veil` 同步改近黑 `#0d0b0a`，hero 夜間遮罩不再蒙藍 |
| Accent 降飽和 | `--c-*`、`--night-link`、`--landing-heading` 比日間／舊夜版低一檔 chroma |
| 頂欄不反轉 | `SiteNavBar` 桃色頂欄預設維持日間色（不透明底、不用毛玻璃，見下方「SiteNavBar」的 iOS 26 條款）。**2026-08-30 產品覆寫**：漢堡改 **最右 icon-only**（刪可見「選單」二字），可及名稱只靠 `aria-label`「開啟選單／關閉選單」；靜止無底板，hover 才圓底（`rgba(107,63,30,0.09)`）。原顧慮仍成立——一般寬度 icon-only 對 3–7 歲辨識度差——此鈕是家長 chrome，兒童主路徑改走漢堡抽屜。漢堡**在所有寬度都在**（桌面不得 `display: none`）。**＜980 日間**開啟時頂欄維持不透明 `--landing-nav-cta-bg`（與桃色面板同色、不斷層）。**夜間**開啟時（含桌面膠囊 `.inner`）頂欄微暗混入 **`--nav-panel-bg`（佔比 `--landing-nav-cta-bg` 10%）** 銜接面板、**關閉即恢復**——比例寫死是因為它是視覺回歸唯一的書面依據；舊式「38% + `--bg`」會讓頂欄變 rgb(127,125,129)、對面板 rgb(30,36,56) 階差 **3.78:1**（一條灰帶壓在深藍板上，非接縫）。開啟態文字**必須用純 `--ink`**：舊值 `color-mix(--landing-nav-ink 48%, --ink)` 對開啟態底僅 **1.48:1**，抽屜一開頂欄四個詞幾乎看不見（暖炭黑色票計算值 10.09:1）——只在 `[data-menu-open]` 為真時套用，故不違反「不反轉」；不改 ThemeProvider。**窄容器收字**：`.inner` 設 `container-type: inline-size`；`@container nav-inner (max-width: 420px)` 品牌字「車車遊樂園」改 `.sr-only` **clip 收合**（仍保留可及名稱，**禁止 `display: none`**）。已無 240px「選單」收字規則。 |
| 選單圖示 | 漢堡抽屜與主題切換用共用線性 `Icon`（`currentColor`，跟著夜間文字色走），不用 emoji，也不需要降飽和濾鏡（見「互動 › 介面圖示」） |
| 地圖不反轉 | 宇宙地圖場景色固定印刷淺色（見紅線）。地圖 chrome（縮放鍵／探索點標籤／召喚把手／**首訪提示** `.tapHint`）走 `--map-chip`／`--map-chip-2`／`--map-chip-ink`／`--map-chip-line`，`[data-theme="night"]` **不覆寫**——用 `--card`／`--ink` 會在深靛夜海上失去輪廓。`.tapHint`：`z-index: 4`（低於 MapControls 5／IslandPickerStrip 6）；≤480 錨在天象帶之下（`top: calc(var(--sky-top) + var(--sky-size) + 24px)`、左錨含 `--safe-left`，**不可再加 `--safe-top`**——`--nav-h` 已含一次）；可見文案「點一座島，飛過去玩」，**不是** live region（連同內容插入從不播報），完整說明在 `#universe-map-guide`。**真實世界地圖**（`/for-parents/play-map`）的 OSM tile 同樣**禁止 invert**；該頁篩選 chip、Sheet 等頁面層 chrome **不**共用 `--map-chip*`（改 ghost／`--accent-ink`），僅縮放鍵、cluster、mapHint 保留 |

meta `theme-color`（夜）對齊 `--bg`：`lib/theme.ts` 的 `NIGHT_THEME_COLOR`。

### 宇宙地圖景深層（v6，2026-07-28 登記）

地圖過去所有元素讀在同一個 Z 上。以下五個**場景層**負責建立景深，全部是 CSS／SVG、零新資產；
它們屬「固定美術色」允許清單（同木牌），不吃主題 token，但**皆不反轉**——夜間只調整強度，不換語意色。

| 元素 | 位置 | 規則 |
|------|------|------|
| 淺灘光暈 | `UniverseMap.tsx` 場景 svg，接地影**之下** | 水色 `#cfe8f3` 低 alpha ＋ `feGaussianBlur`，**無邊界**。這不是 v5 移除的白硬 foam 環（硬邊／純白／勾邊），是水深漸變。尺寸由 `lib/universe/island-ground.ts` 依 tile `stageSize` 推導，不得硬寫 |
| 接地陰影 | 同上 | Art Bible §2「單一短柔」；尺寸同樣由 `island-ground.ts` 推導，島放大時影子一起放大 |
| 大氣透視 | `ZoneIsland` 的 `.tileHaze` | 由 `islandHaze(depthY)` 寫入 `--island-haze`；遠島降飽和 ≤12%、降對比 ≤6%。**只掛靜態 filter、不放 transform**（同層 filter＋子層 transform 在 iOS 會重影） |
| 海面景深＋暗角 | `.atmosphere`（screen-space） | 兩段極低 alpha 漸層；相機相對而非世界相對（這是空氣／鏡頭效果）。不得放進 `.stage` |
| 水面月光 | `.moonGlitter`（screen-space，**z 低於島**） | 夜間限定。月光打在海面上，蓋過島會變成島上蒙霧。位置與 `SkyBodies` 共用 `.map` 的 `--sky-*` 錨點 |

夜間窗燈（`ZoneNightLights` ＋ `data/universe-zone-lights.ts`）為**過渡方案**：
某島 `hasNightArt` 翻 true 後該島自動退場，避免與烘進夜圖的燈疊加。每島 ≤3 顆，
亮核＋柔暈雙段漸層（純散開會讀成暖霧而非燈）；reduced-motion 只停呼吸、**不熄燈**。

> 不用 `backdrop-filter`／CSS `blur()`：iOS 合成成本高且歷史上在此頁 OOM 過。
> 需要柔化一律走 SVG `feGaussianBlur` 或寬圓頭低透明描邊。

### 宇宙地圖直式舞台（v7，2026-09-15 美術審 H3 登記）

≤480 直向手機的世界層不再把橫式 1000×720 舞台 fit-to-width（五島擠成 335×244、每島 90px、上下各留大片海——zoom 槓桿已量測用盡：fit 被 `MIN_SCALE` 0.34 夾在地板），改用**第二套權威座標**：

| 項目 | 規則 |
|------|------|
| 舞台 | `MAP_STAGE_PORTRAIT` 720×1400（`data/universe.ts`）；`Zone.worldPortrait`／`cameraPortrait` 五島必填（Zod 擋半套）。橫式 `MAP_STAGE`／`ZONES`／`world` 匯出不動：OG、deep link、`story-zones`、桌機與橫向**零差** |
| 構圖（C-1 (b)） | 森林頂端置中、恐龍左／救援右（錯開 20px 高度）、車車樂園中央主島（螢幕約 53% 高）、未來夢想島**正下方偏左**把右下角讓給 MapControls；直式只畫 **6 條橋**（rescue–ocean 會直穿主島，不畫；ocean 是 planned 淡橋，手機另有島選擇列） |
| 版面判準 | `layoutForViewport(w,h)`＝`isMobilePortrait`（≤480 且 h>w）單一式子，SSR 恆橫式；判定與首次 pose 在 `useMapCamera.measure()` 同一 tick，首幀不會先橫式再跳直式。**只在判準翻轉（旋轉）時** instant 重 fit／重對焦（不飛行，免得「島先跳、鏡頭再滑」）；一般 resize（iOS 網址列收放）維持只 clamp |
| chrome-free 盒 | 直式不再扣整欄 `MAP_CHROME_RIGHT`（390 寬的 17%），改「底部帶」：世界層＝島選擇列 72＋8；進島＝控制鈕疊高（`MAP_CONTROLS_STACK_MOBILE`）。pose 置中與 `clampCamera` 都對這個盒算（`viewportInsetFor`）；橫式 inset 為零 |
| 木牌 | `--label-offset-y` 翻到島上的門檻直式降為 0.4（`PORTRAIT_LABEL_FLIP_SCALE`），fit ≈ 0.47 時五張木牌仍下掛 |
| 熱點標牌 | 直式一律收成 **icon 圓牌**（牌面→桿→底座語彙不變、命中區 48px 不變、可及名稱在 `<a aria-label>`）：實算三張帶字標牌在 ~300px 的島上，compact／下移任何擺法都蓋掉島心 33–68%，icon 圓牌 ≤17%。名稱由 hotspot modal 標題與 ZoneSheet 承擔。**不倒掛**（桿朝上會讀成吊牌、底座影變第二個接地） |
| `.tapHint` 直式例外 | 上方「≤480 錨在天象帶之下」的前提「頂部反而是空的」只對橫式成立；直式群島填滿高度，那裡是森林小島的木牌。直式改錨地圖最頂 8px、寬度夾到日／月左緣再留 8px（`.map[data-layout="portrait"] .tapHint`），文字允許換行 |
| 回滾 | `MAP_PORTRAIT_LAYOUT_ENABLED=false`（`lib/universe/dev-map-flags.ts`）恆橫式；資料保留無害 |
| 契約測試 | `lib/universe/map-portrait-layout.test.ts`（footprint 不相交／橋不交叉不穿島／木牌不進他島／島身木牌 ∩ MapControls = ∅／各直向視窗直式不比橫式小）、`e2e/universe-map.spec.ts`「直式版面」組、`adventures-390-*` 視覺基線 |

已知取捨：短機（375×667、360×640、320×568）直式仍被 `MIN_SCALE` 夾住、群島縱向溢出可拖曳（比橫式的橫向溢出小），120px 目標對 390×844／375×812 成立。

## 裝飾（v0.2：克制留白）

插畫與封面是視覺主角；裝飾預設關閉，僅在品牌點綴處極少量使用。

### 麥克筆式粗糙外框（已全站移除）
- `RoughFrame` 與 `SvgDefs`（`#rough-1/2/3` 濾鏡）**已刪除**；`/games` 於 v0.2 收斂後不再是例外，全站無粗糙描邊。
- 卡片一律 elevated surface，靠 `--elev-*` 建立高度；**有封面**的內容卡（`StoryCard`／`LatestHero`）**無**盒子描邊；**無影像**抬升塊（`ConnectHub.block`、`StoryFilter.filterBar`）用 `--hairline` + elevated surface。
- 若日後要恢復手繪描邊，須先在本節登記使用範圍與理由，不得直接復活死碼。

### 塗鴉散布
- `components/decor/Doodle.tsx` 仍可用；**上限**：SiteHeader／SiteFooter 合計各 ≤2 極淡點綴；LatestHero／StoryCard／StoryFilter **無** Doodle。
- 尊重 `prefers-reduced-motion`。

### 標籤底 `.marker`
- 定義於 `app/globals.css`：柔和 pill 底色（無粗糙濾鏡、無歪斜）；僅用於少數標籤（如 StoryCard EP）。
- 變體：`.marker-pink/sky/mint/lilac`，或以 inline `--marker-color`。StoryCard 的 EP chip **固定 `.marker-lilac`**，不隨 `story.color` 逐集變色（美術審 L3：同一列表裡 chip 是導航元件，不是每集的品牌色）。

## 字型

- **Fredoka**（Google Fonts，`next/font`）— 拉丁/數字內文
- **jf-open 粉圓 huninn**（`next/font/local`，子集化）— 中文內文
- **源泉圓體 TW Bold**（`next/font/local`，子集化）— 中文標題真字重
- **Gochi Hand**（Google Fonts，`--font-marker`）— 可點綴拉丁標誌；標題以字重／字級建立層次，**不再**使用 `-webkit-text-stroke` 仿麥克筆描邊。
- Fallback：`PingFang TC`、`Microsoft JhengHei`、`Noto Sans TC`
- 標題 1.8–2.3rem / 內文 1rem / 播放器字幕 1.15rem

字級 token（`app/globals.css`，按角色分階；**新宣告與既有裸 rem 都對到這張表**）：

| Token | 值 | 角色 |
|-------|-----|------|
| `--fs-meta` | 0.78rem | 最小註記 |
| `--fs-label` | 0.85rem | 標籤、eyebrow、更新時間、驗證徽章 |
| `--fs-control` | 0.94rem | 按鈕、chip、返回連結、觸發器 |
| `--fs-body` | 1rem | 內文、導言、段落 |
| `--fs-h4` | 1.05rem | 小標題（h3/h2 級但視覺較小） |
| `--fs-h3-compact` | 1.15rem | 卡片標題密集變體 |
| `--fs-h3` | 1.25rem | 卡片標題 |
| `--fs-h2` | 1.35rem | 頁內 hero |
| `--fs-h1` | 1.85rem | 頁標題 |

## 圓角與陰影

圓角 token（`app/globals.css`）。舊政策「只在觸碰處換用」結構上無法收斂——多數 CSS 行不會再被碰。圓角改為全面收斂：`999px`／`50%` 是膠囊與圓形的慣用寫法（不是漂移），給它們名字；其餘數值對到階梯。`--radius-pill` 沿用既有 `999px`，不改成別的膠囊寫法。

| Token | 值 | 角色 |
|-------|-----|------|
| `--radius-xs` | 8px | 小圓角（小控制項、內嵌區塊） |
| `--radius-sm` | 14px | 小卡片、輸入框 |
| `--radius-md` | 20px | 卡片、面板 |
| `--radius-lg` | 28px | 大卡片、對話框 |
| `--radius-xl` | 32px | 頁級 hero、封面 |
| `--radius-pill` | 999px | 膠囊形（chip、按鈕、標籤） |
| `--radius-circle` | 50% | 圓形（頭像、圖示底、圓點） |

| Token | 值 |
|-------|-----|
| `--elev-1` | 高度階梯第一階：貼地卡片（列表 `StoryCard` resting）。夜間由 token 覆寫 |
| `--elev-2` | 第二階：sticky／焦點面（首頁 hero、精選 `LatestHero` resting、列表卡 hover） |
| `--elev-3` | 第三階：浮層／精選卡 hover。**不**用於 dropdown／`MapControls` 等已有暖色調手調陰影者 |
| `--shadow-card` | `--elev-1` 的相容別名（既有消費點沿用；新元件請直接用 elev 階梯） |
| `--shadow-sm` / `--shadow-md` | 元件互動態陰影（非高度階梯詞彙；量級落在 elev-1～elev-2 間，勿與 elev-* 混用於同一面的層級判斷） |
| `--gloss` | inset 上緣高光（「打光黏土」）；適用 Landing 分區 `.cta` 與 `.playCta`；不加於內容卡（Content over chrome） |

## 間距

Token 階梯（`globals.css`）：`--space-2: 8px`、`--space-3: 12px`、`--space-4: 16px`、`--space-6: 24px`、`--space-8: 32px`、`--space-section: 40px`、`--space-page: 20px`。**全部是 px 值**，不是 rem。

### rem 不得換成 space token（無障礙）

`--space-*` 是固定像素。`0.5rem` 會隨使用者根字級縮放，`var(--space-2)`（8px）不會。把 rem 間距改成現有 space token，在預設 16px 根字級看起來一樣，但放大瀏覽器字級時版面會擠——字變大、間距不跟著長。

因此：

1. **任何 rem 單位的間距宣告一律不得轉換成現有 `--space-*`。**這不是風格偏好，是無障礙行為差異。
2. 新增間距宣告**預設使用 px token**（`--space-2` 等）。
3. 若某處確實需要隨字級縮放（例如緊貼文字的內距），可以用 rem，但**必須在該宣告旁留一行註解說明為什麼**。沒有註解的 rem 間距視為待清理，不是漏轉 token。
4. **不要另立一套 rem 版的 space 階梯。**每則新宣告都會多一個「該用哪套」的問題，成本大於收益。

`7325770` 還原了 20 處 `rem → var(--space-*)`，理由同上。看到「rem 間距沒有 token 化」時，那是本政策，不是遺漏。稽核腳本的 spacing 採用率只計 px 宣告；rem 間距另列為政策豁免。

密度底線（兒童向頁面取括號內較大值）：

- 觸控目標 min-height ≥ 44px（48px）；調整密度時只加不減。
- 相鄰互動元素 gap ≥ 8px（12px）；卡片 grid gap ≥ 12px。
- section 垂直間距 mobile ≥ 24px；內文 line-height ≥ 1.5（標籤型小字豁免）。
- 純文字段落 max-width ≤ 640px。
- 文案密度：兒童動線頁不放超過一行的家長散文（家長說明歸戶 `/for-parents` 與 footer）；標題 ≤ 8 字、CTA ≤ 6 字。Landing 四段分區 CTA 本輪改長句當可見段名（見首頁 IA），其餘兒童 CTA 仍 ≤6 字。`/legal` 精簡不得刪改具法律效力語句。
- 卡片／hero 型摘要：可見上限 2–3 行，且**來源在 ingest 就截到行數對應的字數**（約 68 字 CJK，對齊 390px `--fs-label` 三行），`-webkit-line-clamp` 只是保險而非主要手段。理由：整卡為單一 `<a>` 時，摘要屬連結可及名稱，clamp 對螢幕閱讀器與分享文案（`lib/share-story.ts`）無效。摘要內不得夾帶宣傳／營運訴求（IG、五星好評、linktr.ee），這類文案歸戶 footer 與 `/for-parents`。clamp 區塊不得因此新增「展開更多」控制項（會在 `<a>` 內嵌套互動元素）。`data/apple-sync.defaults.json` 的 overrides **不要放 `summary`**，除非刻意凍結、繞過 RSS 清洗。
- **字級（2026-08 起全面收斂）**：舊政策「既有硬寫僅在觸碰該宣告時順手換 token」結構上無法收斂——多數 CSS 行寫完就不會再被碰。字級改為按角色整批對到 `--fs-*`（見上表），不再等下次改到那一行。階梯用角色命名（`--fs-control` 而不是「0.95rem」），才擋得住之後再漂移。
- **圓角（2026-08 起全面收斂）**：舊政策把圓角跟間距綁在「觸碰時順手換」。膠囊 `999px` 與圓形 `50%` 其實全站寫法一致，缺的是名字；小於 `--radius-sm` 的 6／8／10／12px 也沒有階。圓角改為整批對到 `--radius-*`（見上表）。不對稱多值（島嶼有機形、單邊膠囊）不拆 token。
- **間距／色彩**：新宣告仍優先用 token；既有硬寫 **px** 仍僅在觸碰該宣告時順手換 token（±4px 內就近取整）。**rem 間距不換成 `--space-*`**（見上節）。這兩維尚未全面收斂。

## 互動

- **按壓回饋**：`:active { transform: scale(0.98) }` 或微降 opacity；避免厚底影下沉與 hover 歪斜 rotate
- **Focus**：`:focus-visible { outline: 3px solid var(--focus-ring); outline-offset: 2px }`；日間為主文字色，夜間為黃色。壓在影像上的 chrome（Landing `.cta`／`.moreSkip` 等）在元件內覆寫為 `var(--on-dark)` outline，不要改全域 token。
- **動效 token**：`--motion-press`（按鈕）、`--motion-page`（翻頁淡入）；另見全域 `.press-squash`
- **`prefers-reduced-motion: reduce`**：關閉吉祥物 bounce 等非必要動畫
- **遊戲虛擬鍵 pointer capture（3–7 歲）**：`TouchControls`（`GridTouchButton`／`BarTouchButton`）與 BlockDrop 左右移鍵按下時 `setPointerCapture`；**手指滑出按鈕仍視為按住**，僅在 `pointerup`／`pointercancel`／`lostpointercapture` 放開（不再用 `pointerleave` 當放開）。契約測須 shim 並斷言 capture API。棋盤類（消消樂／方塊拖移層）同樣以 capture 避免粗指標跨格吞 tap。BlockDrop `HintChips` 長按路徑仍為既有 leave 放開（未納本輪）。

### 介面圖示（2026-10-10 線性圖示統一）

- 介面圖示一律用共用 `components/ui/Icon`（名稱登記在 `data/icons.ts`）：24 格、2 單位線、圓角收尾與轉角、跟字色走（`currentColor`）、`aria-hidden`——和漢堡選單同一套圓角單線（Lucide／Feather 一族）。
- **不用文字符號當圖示**：「←」「→」「▾」「▸」「✓」「✕」「×」「↗」「＋」「－」在不同手機字型上大小、粗細、高低都不一樣，排在線條圖示旁一看就不同套。對照：
  - 文字連結與按鈕：返回用 `arrow-left`、前往用 `arrow-right`、離站用 `external`。
  - 列表或卡片整列可點的「進入」標記（地圖熱點、ZoneSheet 列）用 `chevron-right`；麵包屑分隔也用 `chevron-right`（14px、`--ink-soft`，比連結字輕）。
  - 下拉用 `chevron-down`、勾選用 `check`、關閉用 `close`、放大縮小用 `plus`／`minus`。
  - 句子裡的「A → B」與數量「×3」是文字，不在此限。
- 文字旁的圖示：前置用全域 `.icon-lead`、後置用 `.icon-trail`（對齊字的中線、和字之間 0.3em、在 flex 容器裡不被壓縮）。**容器已有 `gap` 時不加這兩個 class**（會疊成兩份間距），改用只有 `flex: none` 的元件 class。按鈕字級隨螢幕變（如首頁四段 CTA）時，圖示用 `em` 寬高跟字走，不固定 px。圖示不進可及名稱：連結名稱就是可見文字，e2e 也用不含箭頭的名稱找。
- 展開收合（`<details>`）：`chevron-right` 配 `icon-lead icon-disclosure`，放在 `<summary>` 第一個子元素，打開時轉 90° 朝下；下拉箭頭打開時轉 180°。兩者在 `prefers-reduced-motion` 時直接切換、不轉場。新寫的 `<summary>` 維持 block、圖示當行內元素放（ShowNotes 註解記載 Safari 對 `<summary>` 改 `display` 會壞開合）；故事大綱沿用既有的 flex 寫法。
- 小尺寸補線寬：Icon 依 `lineWidthFor(size)` 自動加粗小於 20px 的圖示，實際線寬維持約 1.67px（和 20px 一樣），不會比旁邊的粗字淡一截。實心的 `star` 例外：描邊只為圓角，固定 2，否則小星星整顆變胖。
- 元件專屬的圖形（播放器的重播／快轉、著色家長操作列）可以自己畫，但線條一律用 `ICON_LINE`（固定 2，只適合 20px 以上；更小的請加進 Icon）；和 Icon 重複的圖形（播放、暫停、音量、連結、房子）直接用 Icon，不另畫一份。品牌標誌（LINE 等平台 logo）與實物插畫（著色工具的蠟筆、油漆桶）不在此限。
- `components/ui/line-icon-glyphs.test.ts` 守住已改的檔案不再用文字符號、不再自畫重複的圖。

### 色彩分層

- 全站語意色集中在 `app/globals.css`（文字、背景、互動、狀態、品牌色）。
- 遊戲載入器、地圖木牌、播放器黑底等固定美術色可保留為 component-local／allowlist 色，不跨元件複製同一組 hex。
- 新 CSS 不直接寫品牌色、白字或錯誤色；優先使用 `--brand-*`、`--on-dark`、`--status-*` 或既有 `--c-*` token。

## 元件規格

| 元件 | 說明 |
|------|------|
| `SiteHeader` | 吉祥物 + 標題（首頁完整版 / 內頁精簡版）；夜間 `.scene::after` 鋪 `--bedtime-veil` 漸層（上 38%／中 22%／底 12%，同 Landing scrim 配方），讓內頁 hero 亮度對齊 Landing 夜間，不做均勻降亮度 |
| `StoryCard` | 封面、EP meta、elevated surface（`--elev-*`）；摘要 clamp 一律 2 行；≤480px 縮圖 120px（美術審 M5：手機列表圖重於字，像繪本架不像節目目錄）；列表語境（目錄、相關故事）一律 `hideMeta`，只留 EP chip（M6） |
| `Chip` | 篩選與標籤 pill，`aria-pressed` |
| `PlayButton` | 全寬 CTA，主題色底 |
| `StoryMeta` | EP / 時長（標註） / 車種 chip |
| `StoryProgressBadge` | 「已聽完」星章，貼封面右上角。語彙與宇宙地圖一致（`⭐` + `aria-label="已聽完"`）；只表達聽完單一狀態，不做「聽到一半」（progress store 的 `continue` 為全站單一欄位，標記會無預警消失） |
| `StoryPlayer` | 全螢幕黑底、字幕底板、底部控制列；主播放鈕 `--play-size`（72／76／80）比 `--ctrl-size` 大一階，`--controls-block` 必須跟著加同樣的差值；字級鈕圖示是大 A 小 a（不是「AI」） |
| `SubscribeForm` | 登記關閉（API unavailable）時不是空殼：四個收聽平台做成 soft 大按鈕列（2 欄，≤360 單欄）＋一句「新集照常上架」，點擊來源 `subscribe-closed`（美術審 M8） |
| `SiteFooter` | 平台連結；不放「給家長：點播放鈕…」導讀、不放遊樂園入口（`/games` 走導覽）、不放安心訊號列；`ConnectHub` 區塊用 `--hairline` + `--elev-1`（頂欄膠囊白邊未改）。 ≤480 每區塊四個圖示走 4 欄 grid（不折 3+1）；meta 列的法務連結分隔點由 `.metaLegal::before` 畫，法務連結獨立成行時不畫（無孤懸點）。親子遊樂地圖仍可傳 `parentNote` |
| `GamePageShell` | 街機兩款遊戲共同外框，負責返回導覽、可及性與資產預載 |
| `ColoringPageShell` | 繪本著色活動外框（不掛 GameKit） |
| `GameChrome` | 遊戲內暫停、音效與設定對話框 |
| `ZoneSheet`／探索抽屜／召喚把手 | 進島後預設收合，底部「來這裡逛逛」召喚把手（觸控 ≥56px、`--map-chip*`）；展開為非模態 `region` 抽屜（`?sheet=1` 深連結）；兒童首屏故事卡、探索點次層；✕／Esc 收合 |

## 播放器狀態

1. **插圖跟讀（一律開）**：音檔進度驅動換頁（對 `captionTimes`，無則等分）；dots 不可點。控制列與方向鍵跳上一張／下一張插圖，不再 ±10 秒
2. **字幕（預設開）**：只開關跟讀文字。關閉後左右 tap zone + swipe 仍跳插圖（與控制列相同，會帶音檔時間）
3. **播放完成**：再聽一次 / 回故事屋 / 下一集
4. **載入中**：封面 skeleton 脈動

## 遊戲架構規範

- `/games` 呈現可玩活動，站序固定為 **繪本著色** → Candy Match（繽紛消消樂）→ Block Drop（繽紛樂園）；不放「製作中」或未承諾 placeholder。著色本是園內第一站，不佔漢堡獨立列。
- Hub 首圖只放遊樂園底圖，其下直接三張遊戲卡；不疊標題／導言／chip，也不放「園裡的站」、星星進度、車庫或頁尾句。頁面 `h1` 走 sr-only。
- Hub 排版：≥641px 三欄等寬；≤640px 著色本全寬（`.lead`）、另外兩款並排。
- 繪本著色為 explore 活動：線稿來自既有定裝／場景圖，不併入 `GameKitGameId` 分數進度；路由仍為 `/games/coloring-book`。完成面先給作品快照；開場只留一行，不佔畫布上方一張卡；矮視窗（`max-height: 480px`）不顯示快照。
- **繽紛消消樂棋盤**：1–2 關 6×6、3–5 關 6×7、6–10 關 6×8，兩種玩法與各裝置格數相同。格子是按鈕，下限 44px、上限 80px；格寬同時看可用寬與高，高度不夠先縮到 44px，再不夠就整頁捲動（棋盤不內捲、不裁切）。390px 寬的 6 欄靠收緊局內留白做到至少 56px，左右仍留手機返回手勢的邊。夜間局內外框內距為 0。局內閱讀順序固定「任務列 → 棋盤 → 道具列」；≥900px 與橫向手機把任務／道具放左側欄。任務列寫出「收集小紅，還差 12 個」並逐項打勾；道具顯示名稱與次數，先點一格預覽範圍（滑鼠移入即預覽），點亮框裡任一格才用掉，有粉色「取消」鈕（前面是共用關閉圖示）。輕鬆模式任務列右上顯示第三顆星還剩幾次交換。焦點環在卡面內改用深墨色（卡面夜間不反轉）。選關：一行玩法切換（說明只留給讀屏）＋一行列出下一站與任務＋開始鈕＋兩列小路，不重複站點大圖、不放星星說明句，第一屏看得到開始鈕；鎖住的站保持全彩、加鎖頭，點了說明要先完成哪一站。第一次進局用兩格互換動畫教交換（點錯不收，換成功才收）；≤480px 不顯示進度條、地名與難度說明小字。結算：標題＋三顆星一排（由左往右亮、中間大一號）；沒拿滿才在星下列出缺的條件小籤（條件圖＋兩三個字＋「+★」），拿滿只有星星；按鈕一排「回地圖｜下一站｜再挑戰」，主鈕在中線、焦點先落主鈕；結算層和卡面一樣日夜不反轉。
- **車車消消樂標題頁（封面舞台，2026-10-06）**：用遊樂園卡片同一張封面（`gameBySlug("candy-match").art.cover`）填滿標題頁，不再把小塊內容置中在大卡片裡。版型看**卡片寬**（容器查詢 `candy-title`）：<720px 上圖下文，≥720px 左圖右文；矮的直向手機（`max-height: 640px`）封面壓到 24vh，讓「開始冒險」留在首屏。封面本身也能點、進冒險（與「開始冒險」重複，故 `aria-hidden`＋`tabIndex=-1`）。三步圖解「換一換／排一排／消一消」三格同大小圖框，任何一格都不加底色（像被選中）；下方只留一行「完成小任務，就有星星！」。「開始冒險」與「怎麼玩？」同高、同厚度底邊，用顏色分主次；卡片窄於 480px 時上下滿寬；卡片 ≥1100px 時右欄（標題、步驟、按鈕）整體放大。
- **方塊轉轉（2026-10-10，對齊消消樂）**：標題頁用遊樂園卡片同一張封面＋「準備疊方塊！」＋星星總數＋三步圖解「移一移／轉一轉／消一消」（用遊戲方塊畫）＋一顆大圓「開始」；「自由堆疊」是下方小膠囊鈕，速度只在齒輪設定。版型看卡片寬（容器查詢 `block-title`）：<720px 上圖下文，≥720px 左圖右文。地圖：玩法只留葉子「輕鬆」／方塊「挑戰」兩字（說明進 aria-label）；下一站大卡＝迷你起始盤（石頭＋亮黃缺口）＋「第 N 站」＋站名＋任務圖案 ×數字（挑戰再加方塊圖示＋塊數）＋大圓開始鈕；10 站手機直向蛇形、≥760px 兩排；站點沒有插圖，小路圓章寫大站號；不放說明句與「回標題」。冒險任務列：迷你盤＋「第 N 站」（≤480px 收站名）、目標＝大圖案＋大數字（完成打勾）、挑戰模式剩餘塊數＝方塊圖示＋數字（剩 3 塊轉粉紅）；不倒數第三顆星、不放每站概念句；側欄窄卡（容器 ≤200px）目標疊一欄。結算與消消樂共用 `ResultStars`（三星一排、沒拿滿才出小籤「不越黃線 +★」「N 塊內 +★」），按鈕一排「回地圖｜主鈕｜次鈕」；暫停／結算層把 `--ink`、`--cta-*`、`--elev-1`、`--focus-ring` 釘在日間值（卡面日夜不反轉）。
- **遊戲抬頭與操作提示（三款共用）**：抬頭的返回鈕、工具鈕、日夜切換一律 48px（<360px 寬局內四顆方鈕擠不下，才一起收到 44px、間距 4px）、同一種外觀（`--radius-sm`、天藍混色底、1.5px 框、4px 底邊）；返回鈕保留「回遊樂園」文字，前面是共用 `arrow-left` 圖示。工具鈕不用 `aria-pressed` 黃底表示狀態（音效／暫停的圖示本身會換）；設定鈕用齒輪，不用「圓心＋光芒」（那是亮度符號，和日夜切換並排會被看成「切白天」）。操作提示一律「圖示＋可見文字」，不得只靠 `title` 提示（觸控裝置看不到）；遊戲畫面還沒有棋盤時（標題頁、地圖）在遊戲根節點標 `data-play-hints="off"`，外框就收起提示。
- Game Kit 只保留單一 `lib/gamekit/` 樹，分為 `react/`、`runtime/`、`progress/`、`games/` 與 `types.ts`（街機兩款）。
- Consumer 必須匯入明確 leaf path，例如 `@/lib/gamekit/react/useGameAudio`；不使用 `@/lib/gamekit` 根目錄或 barrel。
- 詳細邊界、import policy 與新增遊戲流程見 [GAMEKIT-ARCHITECTURE.md](./docs/GAMEKIT-ARCHITECTURE.md)。
- 遊戲進度、最佳分數、獎牌、星星與貼紙屬相容性契約，不因 UI 或文件整理而變更。

## 新增故事檢查清單

1. `public/stories/<slug>/` 放入 `audio.mp3`、`01.jpg`～`NN.jpg`
2. `data/stories.ts` 更新 `pageCount` 與 `captions`
3. `npm test` + `npm run build`

## 首頁 IA

### Landing Hub（`/`）

四段標題一律視覺隱藏（CSS module `titleHidden`，給輔助科技／`aria-labelledby`）。禁止用 `#segment-stories` 把 `.titleHidden` 或全域 `.sr-only` 解除隱藏。可見前景只留分區 CTA。Landing **沒有**重回開場入口；開場覆蓋層與 `/intro` 已從產品路徑下架（`INTRO_PORTAL_ENABLED`），元件與規格仍保留。GEO 導言維持全域 `.sr-only`。不新增行銷卡片或插畫。

Storyline 式**全螢幕分段捲動**：每段一張滿版黏土 hero（桌面 `segment-{id}.jpg` 16:9；行動 ≤768px `segment-{id}-portrait.jpg` 9:16），大圖主導 + 底部漸層遮罩 + 左下分區 CTA。**不**顯示段編號（如 01/04）。段標題仍視覺隱藏（CSS module `titleHidden`，給輔助科技／`aria-labelledby`），不疊在美術上；可見 CTA 為長句段名（本輪 Landing 例外，可超過「CTA ≤ 6 字」）；`href` 不變。分區 CTA 走**不透明暖深墨板**（外框 `height`／`min-height` 同 `--landing-skip` 56px、`var(--landing-brand-ink)` 底板、`var(--on-dark)` 白字、`--elev-2`＋`--gloss`），字級桌面 `--fs-h2`、≤768 `--fs-h3`、≤640 `--fs-h4`，**非**橘色實心 pill、**非**玻璃 ghost；刻意不用 backdrop-filter。CTA `white-space: nowrap`（「 →」是獨立文字節點，換行會孤行）；<348px 可能與 Dudu 略疊，正解是另開任務把半形空白改成不斷行空白後再拿掉 nowrap。段內換段控制是底列一枚黏土圓鈕（`moreSkip`：`--landing-skip` 與分區 CTA 同高 56px（≤480 起不再縮成 44）、`min` 44×44、`border-radius: 50%`、不透明 `var(--landing-brand-ink)`＋`--gloss`／`--elev-2`、單折線標），與左下分區 CTA、右下嘟嘟同一底列（左群組 `[CTA][skip]`、右欄 `--landing-dudu-slot` 對齊 companion 畫框，三者 `flex-end` 齊底）；鍵盤／輔助科技同一顆連結（可及名稱「捲動到下一個專區」；最後一段改朝上、可及名稱「捲動回第一個專區」），`:focus-visible` 才加上 `var(--on-dark)` 焦點環。禁止玻璃底板。不放「聽最新一集」播放直達鈕。未啟用的 `.subscribeCta` 改不透明 `--on-dark` 底板＋`--landing-brand-ink` 字、`--elev-1`，無 backdrop-filter；不因此啟用 `playCta`。首段 GEO 導言仍用全域 `.sr-only`。

1. **SiteNavBar**（全站橘色頂欄 + 頻道／社群）
   - **頂欄常駐列（2026-08-30 同構＋漢堡最右）**：`.inner` 用 `justify-content: flex-start`。**兩斷點同構**——**所有寬度**皆為 `[品牌] [首頁] [頻道] [社群] [留言] [☰]`。`.actions`（`role="group"` `aria-label="常用"`，含首頁／頻道／社群／留言）以 `flex: 1; justify-content: space-evenly` 撐滿品牌與漢堡之間，**禁止** `margin-left: auto`（會把三詞推到右側、中間再空一塊）。漢堡 **icon-only、置最右**，是 `.actions` 的下一個兄弟、**不**進常用組；左距 16px（大於舊 gap 10px）。品牌 pill **即首頁入口**（連 `/`），**`.actions` 內另列「首頁」文字連結**（去框：`.homeAction[aria-current]` 底透明，**僅字重 800、不畫任何線**）。點品牌或「首頁」時，已在 `/` 必須把 `LandingScrollView` 捲回第一段（`#segment-stories`）——`href="/"` 只動 window，動不到內部 snap。**紅線：頂欄 active 不得用 `inset box-shadow`**——`.navLink` 是 `--radius-pill`(999px)，inset 底線會被圓角裁切、沿 22px 圓角往兩側爬升成**碗狀假邊框**（2026-08-31 使用者回報的「首頁的邊框」即此）。且 `.homeAction` 必須**顯式** `box-shadow: none`，只刪該行會讓 `.navLink[aria-current]`(0,2,1) 的 inset 接手、弧線原封不動。「頻道」「社群」trigger 同樣去 border／實心底，`color: inherit`。**選單觸發器所有寬度都在**（桌面不得 `display: none`）。**主題切換移出頂欄**，改在抽屜底部。**頂欄字級角色（2026-08-31）**：品牌 `.brandText` 用 `--fs-h4`（**禁 `clamp()`+vw**，見 `globals.css` 97–98），比控制項大一階以保住字標層級；`.navLink` 與頻道／社群 `.trigger` 一律 `--fs-body`。**`--fs-meta`／`--fs-label` 不得用於頂欄主控制項**——它們的角色是「最小註記／標籤」，舊碼訂閱用 `--fs-meta`(+`--fs-label` @≥480px) 且字重 800，是同一列出現三種字級兩種字重的來源。`SubscribeMenu` 的 `@media (min-width: 480px)` **不得再覆寫 `font-size`**（會讓 base 修正在幾乎所有桌面失效）。頂欄連接下拉文案為「**頻道**」「**社群**」（取代「訂閱」）；`visiblePlatforms()` 為空時頻道**不得整顆消失**，退為站內 `/subscribe`；社群下拉只放 Instagram／Threads／Facebook（**不含 Email**），清單為空則不渲染。
   - **iOS 26 頂端漸層模糊（2026-10-10）**：iOS 26 起 iPhone／iPad 會在狀態列下方加一道往下淡出的模糊（捲動邊緣效果）。**Safari 分頁**：畫面頂端中點往下 4px 那一點落在 sticky／fixed、夠寬的盒子裡時，WebKit 改用它的底色往上延伸、不加模糊——`.bar` 本來就符合；該盒子**禁止** `backdrop-filter`（會被判成「好幾種顏色」）。**主畫面 App**：頂欄一直符合上述條件，實機仍糊（同一個字上半部比下半部糊），頁面 CSS 關不掉，所以頂欄、遊戲抬頭、故事播放器頂排在 safe-top 之外再空 `--edge-ramp`（`globals.css`；只在 `@supports (-webkit-touch-callout: none)` 的 `display-mode: standalone` 為 32px，其餘 0），字落在模糊帶（實測約狀態列下方 42px）下面；`--nav-h` 已含它。遊戲頁抬頭 `.playHeader` 另以 `--main-pad-top` 往上延伸蓋住 `.main` 上留白、sticky `top` 補同樣距離（內容位置不變），讓 Safari 分頁靜止時頂端那一點也落在抬頭裡；改 `.main` 上留白一律改 `--main-pad-top`（含著色本畫布階段）。CSS 契約測試鎖住以上規則。
   - **≥980px 懸浮膠囊**：外層 `.bar` 透明（首頁例外：landing 規則權重較高，外層是整條桃色），`.inner` 改懸浮膠囊（`max-width: 960px`、高 56px，不用毛玻璃）；**已移除 `.desktopNav`**——兒童三入口不再佔頂欄主列，改由漢堡抽屜承接。家長取向的親子指南／親子景點收進抽屜；角色圖鑑亦在抽屜。繪本著色收在遊樂園內。無「更多」下拉。Threads 育兒分享仍由 `/for-parents` 頁內「育兒小筆記」外連卡承接。**成長主題（`/topic`）不佔導覽**，頁面仍可直達。
   - **「留言」在頂欄**（`.actions` 常用組），走 `feedbackHref()`——**恆為站內 `/feedback`**（頁面即目的地，不再被 `NEXT_PUBLIC_FEEDBACK_FORM_URL` 覆寫）。站內路徑用 `next/link`＋`aria-current`。**active 不得用 `inset box-shadow`**（與首頁同一條碗狀假邊框紅線）；`.actions .navLink[aria-current]` 須顯式 `box-shadow: none`，以底色塊編碼。中文不得只靠 `font-weight`。`SiteHeader`「留言給我」圓鈕仍 env-gated，未設定不渲染。抽屜不加「留言」列。
   - **窄容器收字**（見 §99）：`@container nav-inner (max-width: 420px)` 品牌字 `.sr-only` clip（**禁止 `display: none`**，須保留可及名稱）。漢堡已是 icon-only，無 240px 收「選單」規則。
   - 桌面面板**錨定膠囊本體 `.inner`**——面板的 JSX **必須巢狀在 `.inner` 之內**（`.inner` 有 `container-type: inline-size`，本身即 containing block；只加 `position: relative` 但把面板放在 `.inner` 外面**無效**，會退回錨定 `.bar` 變成全寬下拉）。漢堡在最右：`.inner` `padding-right` 與 `.panel { right }` **同一數字（16px）**、`left: auto`，`width: min(360px, calc(100vw - 40px))`。**＜980** `.panel` 維持 `left: 0; right: 0` 全寬 sheet。Landing 桌面 `.bar` 為 `pointer-events: none`，**`.panel` 必須一併還原 `auto`**（否則整片不可點）。
   - **漢堡抽屜**（所有寬度）：**探索** 5 列（全部故事／角色圖鑑／遊樂園／宇宙地圖／關於我們，**無首頁、無繪本著色**）→ 家長組小標「給爸媽」下先放 4 個與主列同字級（`--fs-h4`、字重 700）的連結（育兒文章分享／親子出國／國內旅遊／故事創作，圖示 `notebook`／`plane`／`mountain`／`pencil`，圖示格與主列相同）→ **家長** 2 列（親子指南、**親子景點**（`map-pin`），**無留言**）；底部放主題切換。**日間面板底走 `--landing-nav-cta-bg`**（與頂欄同桃色；**禁止** `--bg` 白底——白板上再疊褐或不透明 color-mix 都會讀成灰米色島）。**夜間面板底走 `--nav-panel-bg`**（`--card` 50% + `--landing-brand-ink` 50% = rgb(41,30,21)，暖深褐、b−r=−20；`--ink` 13.53:1、「給爸媽」黃字 8.12:1）：不可用 `--bg`（與頁面同色，抽屜沒有邊界），也不可改用 `--warm-surface`（站內已有 8 處消費）；往 `--c-yellow` 加暖是死路——黃是亮色，加多了「給爸媽」小標會掉出 AA。抽屜內 `ThemeToggle` 軌道須就地覆寫為「面板色 + 白 8%」——其元件預設 `--card`(#272422) 對面板只有 1.05:1，會貼平看不出是控制項。**不對稱分組**：探索組**不加**文字標題，**家長組上方加一行 `--fs-label` 小標「給爸媽」**。**連結常駐 DOM、以 CSS `display: none` 隱藏**——`{open && …}` 會讓爬蟲在關閉態讀不到任何站內連結；關閉時另加 `inert`（只靠 `opacity: 0` 不足，只靠 `inert` 也不足）。目前頁與 hover **不得共用同一底色**（色彩不可為唯一編碼）：日間選中底用與頂欄 `.navLink` 同一層 `rgba(107,63,30,0.14)`（疊在桃色板上才對齊，不得再烤成不透明混色），`[aria-current="page"]` 另加 **`::before` 直 accent 條**（禁止 `inset` box-shadow 沿 `--radius-sm` 圓角爬成碗狀）＋加粗，**不加 `--gloss`**（頂緣高光會讓選中列上下不均，且頂欄 `.navLink` 沒有 gloss）。夜間選中底仍走面板抬升＋微黃，左 accent 同一條 `::before`，不加頂緣 inset 高光。。抽屜為**兩個 `role="list"`**（`list-style: none` 在 Safari/VoiceOver 會移除清單語意），家長組以 `aria-labelledby` 綁「給爸媽」小標，讓 AT 拿到與視覺分組對等的語意。同時只允許一個浮層開著（`openMenu: "none" | "channels" | "socials" | "nav"`）——兩個 focus trap 同時 active 會互搶 Tab；跨越 980 斷點時關閉抽屜（舊碼會留下 `open=true` 卻不可見的面板，焦點掉到 body）。開啟時焦點移入第一個連結、關閉時還給觸發器；Esc 與點浮層外部皆可關閉。**頂欄內的品牌／常用組連結也必須 `closeAll`**——它們在 `.bar` 內，outside-click 判定不會關閉，client navigation 又保留元件 instance，漏掉會讓抽屜跨頁殘留、focus trap 持續作用。`Shift+Tab` 目前無法從面板回到觸發器（Escape 與點外部可關閉），若日後升級為 modal drawer 再補面板內關閉鈕與 scroll lock。點浮層外部關閉走 `closeFromOutside()`（先 blur 再關）——`pointerdown` 早於 `click`，否則 focus trap 會把焦點從使用者正要點的元素搶回觸發器。
   - **著色本頁 active 態**：抽屜用完整 `internalHrefs` 做**最長匹配獨佔**。`/games/coloring-book` 歸「遊樂園」（不再獨立列）。不含搜尋列（故事搜尋仍在 `/stories`）。「親子景點」連 `/for-parents/play-map`，與「親子指南」並列於家長組主列。小字分別連 `/for-parents/articles`、`/for-parents/travel-abroad`、`/for-parents/travel-taiwan`、`/for-parents/story-making`；這些路徑以最長匹配獨佔 active，不得同時點亮「親子指南」。不列「主題分類」。`/for-parents/play-map` 僅「親子景點」高亮。
   - **KidsPlayDock 已刪（2026-09-05）**：內頁左下不再掛「去玩」三連；兒童三入口（全部故事／遊樂園／宇宙地圖）只由漢堡抽屜承接。不再有 `--kids-dock-h` 底距、`data-kids-dock`／`data-kids-dock-flush`／`data-lift="picker"`。
   - 關於我們在漢堡抽屜；聯絡走內頁 `SiteFooter`「聯絡我們」。頂欄「社群」不含 Email。**未改** Apple sync workflow、ThemeProvider API。
2. 四段 **LandingSegment** 全螢幕面板（資料：`data/landing-segments.ts`）；可見 CTA：`車車遊樂園的故事`／`數綿羊123．睡前故事`／`好好玩的捏黏土`／`好習慣故事`。首段不放重回開場鈕。
3. **段落切換**：首頁沒有獨立的分段導覽列。桌面右側垂直進度點與 ≤768px 貼底短標列（SegmentNav）已於 ADR-0004 移除——3D 開場接手了首頁的第一印象，底列在四段內容上方再疊一層水平導覽只是重複。換段靠各段底列黏土圓鈕 `moreSkip`（可點、≥44×44、與 CTA／嘟嘟同一底列；最後一段朝上捲回第一屏）以及捲動容器的 snap、觸控滑、方向鍵。點圓鈕、滑鼠滾輪或頂欄回家時先短淡出、`auto` 對齊、再 280ms 淡入＋微縮放（只動 `opacity`／`transform`）；手指滑與方向鍵仍只靠 snap，避免和 mandatory snap 打架。`prefers-reduced-motion` 立刻到位、指引改靜止。≤768 左下 CTA 不抬高，右欄 `--landing-dudu-slot` 仍留給 Dudu。`moreSkip` 聚焦時適用上方 Depth 條款：焦點環用 `var(--on-dark)`。document scroll-snap
4. Segment 1 CTA「車車遊樂園的故事」→ **`/stories`**（完整 Podcast 主頁）
5. **Landing 沒有頁尾 snap pane**：`#landing-foot` 已刪。頻道／社群改由頂欄下拉承擔；版權與條款留在內頁 `SiteFooter`。最後一段（好習慣）是最後一屏。

Hero 圖走 `images.edit` + `public/characters/` 定裝照參考圖，與單集插畫同流程以維持 on-model。

### 全部故事（`/stories`）

1. **SiteHeader** 大 Hero 黏土插畫（置中、`max-width: 420px`；標題在圖下方。M3 桌機並排頁首列已還原）
2. **LatestHero** 最新一集（elevated surface，`--elev-2` resting；無盒子描邊／1px 色環）
   LatestHero 說明最多 3 行（`StoryCard` 一律 2 行）；來源摘要於 Apple／SoundOn ingest 階段即截斷至約 68 字（CJK），clamp 為保險層。
3. **FavoritesSection** 精選
4. **StoryFilter** 找故事（車種／主題下拉，不另放「車車」「主題」欄位副標；觸發鈕 `aria-label` 已足夠）；`filterBar` 用 `--surface-elevated` + `--hairline` + `--elev-1`
5. **桌機列表顯示（僅 ≥768）**：預設「縮圖」——≥768 兩欄、≥1280 三欄直式卡（封面在上、標題最多 2 行、tag 靠底）。「完整」維持橫式一列，列表 `max-width: 56rem` 置中。切換鈕文案「縮圖／完整」，群組 `aria-label="故事列表顯示方式"`，`<768` `display: none`。旗標掛 `<html data-stories-view="list">`（有＝完整，沒有＝縮圖）；偏好 `localStorage` key `cheche:stories-view`。卡片 markup 共用，**不**用 React `variant` 切換。1280 只決定目錄欄數，不是新的全站 viewport 層。

Landing segment hero 生圖：`npm run generate:landing-art -- --dry-run`（橫版）；直版 `--portrait`；approve 後覆蓋 `public/landing/`。

首段橫版 `segment-stories.jpg` 是**合成圖**（美術審 L7，2026-09-17）：生圖原稿左上三分之一是空的奶油底，用同一套 `hero-parallax` 黏土 props（L1 摩天輪／樹、L2 灌木）以 `assets/landing/segment-stories/compose-distant-park.py` 貼成遠景（往天空色混 28–36%、飽和 ≤1.0、摩天輪 blur 1.4，遠景一律比原圖中景灌木更淡；底部垂直淡出×兩端 taper 再 16px 模糊；氣球區保留原圖），原稿存 `assets/landing/segment-stories/original-2026-06-25.jpg`。下次**重生**橫版時要把「左上補遠景遊樂設施」寫進 prompt，並刪掉這段合成；換圖後跑 `npm run optimize:lcp-images` 重出 WebP／AVIF。桌機 `object-position` 維持 `center 40%`——1280×835 會左右各裁 ~100px，偏右裁法會把補上的左側摩天輪切掉。
