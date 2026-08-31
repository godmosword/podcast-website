# 車車遊樂園 — 設計系統 v0.2

Bonbon & 馬米親子 Podcast「看圖聽故事」網站的視覺與互動規範。

## 視覺方針（v0.2：插畫主導＋克制 chrome）

保留黏土插畫與粉嫩品牌色，chrome 依 **Apple Human Interface Guidelines** 升級為清晰、讓位、有深度的產品介面——童趣靠插畫與色彩，不靠麥克筆描邊或密集塗鴉堆可愛。

| 原則 | 落地 |
|------|------|
| Clarity（清晰） | 字階分明、對比足夠、裝飾不搶內容 |
| Deference（讓位） | UI 退讓給黏土插畫／故事封面 |
| Depth（深度） | 柔陰影、`--elev-*` 高度階梯、半透明層；`--hairline` 用於分隔線**與無影像抬升塊**（`ConnectHub.block`、`StoryFilter.filterBar`）；有封面的內容卡（`StoryCard`／`LatestHero`）不用盒子描邊，靠 `--elev-*`。壓在影像上的 chrome 必須有**自身底色或描邊**（不得只靠 scrim）：Landing 分區 CTA 用深色玻璃 `rgba(0,0,0,0.38)`＋白邊＋`--c-yellow` 字；SegmentNav dot 仍可留邊。鍵盤 focus 必須用淺色環（Landing `.cta`／`.next` 用 `var(--on-dark)` outline），不得只靠日間 `--focus-ring`（深墨） |
| Consistency（一致） | 導覽、卡片、CTA、內容頁同一節奏 |
| Feedback（回饋） | 輕 `scale(0.98)`／opacity；取消歪斜 rotate 與厚底影下沉 |
| Aesthetic Integrity | 童趣靠插畫與色彩，不靠麥克筆描邊 |
| Content over chrome | 卡片／篩選無 RoughFrame；Header／Footer 塗鴉 ≤2；`.marker` 僅少數標籤 |
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
- **地圖／儀表板工具頁**（如 `/for-parents/play-map`、`/for-parents/dashboard`）豁免 640px 單欄限制，內容區 `max-width: 1100px` 置中，以容納地圖與並排控制
- **角色圖鑑／親子指南**（`/characters`、`/for-parents`）：不掛 `SiteHeader`（無 `hero-home` 行銷圖）；緊湊頁首用 `--fs-h1`，圖鑑網格／家長工具接在標題下。
- **親子景點頁（`/for-parents/play-map`）— 版型與瀏覽**：不掛 `SiteHeader`（全域 `SiteNavBar` 已顯示品牌，再放一次會出現兩個字標與重複 h1）；工具殼無行銷 hero／長 lede；H1「親子遊樂地圖」在工具頂列。**主瀏覽介面是「縣市色塊圖＋分組名單」，不是 OSM 底圖**：`view=cards`（預設，含桌面）滿版呈現 22 縣市磚牆與分組名單，**任何寬度都不掛 Leaflet**（首屏零 tile 請求，e2e 有正向回歸）。磚牆用 CSS Grid 手排 row/column 近似台灣地理（基隆在上、高屏在下、宜花東在右欄）；**不用 GeoJSON、不用精確縣市界**，磚牆下方須有**可見**文字「示意排列，非實際地理位置」，不得只放進 `aria-label`。色深是 choropleth 但**不得是唯一編碼**，命中數必須同時是可見文字，且不得用 `--ink-soft`（疊在最深的著色磚上只有 3.07:1／夜 4.29:1）。三態（`covered`／`empty` 此條件 0 筆／`uncatalogued` 尚未收錄）必須用邊框樣式＋文字雙重編碼，**不得用 `opacity` 降階**（透明度會連文字對比一起吃掉）。**資料誠實紅線**：資料僅涵蓋 15 縣市，宜蘭／花蓮／台東／屏東／澎湖／金門／連江的磚必須顯性標示「未收錄」且不可點選，並在下方句子重述「不代表當地沒有好去處」。點磚＝選縣市，再點一次取消；**手機 <640px 選定後磚牆收合成一行「桃園市 ✕」**（漸進式揭露），收合時焦點移到該收合鍵，取消時還給原本那塊磚。地圖視圖收起磚牆（地圖有自己的 cluster）。名單依狀態三選一分組（有定位→車程帶 ≤20／20–40／40–60／60 分以上；無定位且未選縣市→縣市，北到南；已選縣市→類型，沿用 `PLAYGROUND_TYPES` 順序），組標題為「20 分鐘內 · 4 個」，空組略過；**車程是直線距離粗估，分組時必須附免責文字，且渲染在第一組標題之上而非頁尾小字**。結果列為句子式「在〔全台〕找〔免費〕→ **12 個地方**」，結果數放大為主資訊；內層 span 全部 `aria-hidden`，h2 的 accessible name 由 `srText` 提供。未顯示卡片一律 `hidden` 遮蔽（以跨組連續的 `displayIndex` 判定），**不得 slice 陣列**（SSR 索引契約）。
- **親子景點頁（`/for-parents/play-map`）— 地圖分頁與美術**：Leaflet + OSM 為**次要分頁**（`view=map`），僅在已選縣市或已定位後按「看地圖」才動態載入，返回名單不重建容器；未選縣市且未定位時不渲染「看地圖」，無縣市的 `?view=map` 進頁軟著陸名單並清掉該參數。手機地圖模式全幅，篩選列留在名單，沒有 bottom sheet snap。縣市／附近地圖走 `fitBounds`；`minZoom` 維持 `TAIWAN_SOFT_MIN_ZOOM`（7），本輪不改。**桌面 ≥980px 名單與地圖並排（名單約 44%）只在 `view=map` 生效**；`view=cards` 為滿版名單（卡片走三欄）。CSS 的 980 並排規則必須 scope 到 `.root[data-split="true"]`，否則名單模式會被 `max-height: 64dvh` 夾住。一列主控制（附近／雨天／免費／放電／室內＋次要「篩選」），`data-quick-filter` 屬性為 e2e 契約不得更名；縣市／類型仍留在可收合篩選面板作為鍵盤／進階備援。無場館照片時以**類型縮圖 plate**（7 種手繪 SVG，置左）與家長筆記構成卡片；Google 導航／顯示位置用頁面場館名＋縣市，不用 lat,lng 圖釘。詳情 sheet 的 full 變體用事實 chip（**車程放第一格**）＋兩層出口（導航／查看完整資訊為主，在地圖看／顯示位置／官網降為文字連結）；compact 變體不動。頁面層篩選 chip 與**縣市色塊圖**一律走 ghost／`--accent`（邊框、底色）／`--accent-ink`（文字、圖示）；`--map-chip*` 只留給地圖 overlay（縮放鍵、spatial cluster、mapHint），色塊圖**不得**借用。**七類型母題有兩個消費點**：卡片 plate（彩色，96 viewBox，`components/for-parents/type-scenes/`）與**地圖針中心剪影**（單色 `currentColor`，24 viewBox，`lib/playground-type-glyph.ts`）。針用圓形黏土容器＋較大剪影（色相＋形狀雙重編碼）。剪影色為**固定美術色** `#34302b`（不隨主題翻轉）；「其他」類的針與卡片 accent 用固定淺沙 `#cfcac2`，不用 `--ink-soft`。針**不**共用 `--map-chip*`。柔化一律用 SVG `feGaussianBlur`，**禁用 `backdrop-filter` 與 CSS `blur()`**。
- 桌面端維持單欄，兩側留白
- PWA：`manifest.json` + Apple Web App meta
- Viewport 允許使用者縮放（未設 `maximum-scale` / `user-scalable=no`），方便家長放大閱讀

## 響應式斷點

- viewport 只使用四層：`480px`（手機／小尺寸控制）、`640px`（內容欄與手機版型）、`768px`（平板雙欄）、`980px`（全站膠囊導覽＋Landing 桌面版；**漢堡不隨此斷點消失**，見首頁 IA）。內容欄最大寬（如家長頁 `min(920px, 100%)`）不屬 viewport 切版斷點。
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

多彩粉嫩 accent（裝飾、chip、邊框輪播）：

| Token | 值 |
|-------|-----|
| `--c-pink` | `#f7a8c4` |
| `--c-yellow` | `#ffd866` |
| `--c-mint` | `#b7df9b` |
| `--c-sky` | `#8fcde8` |
| `--c-teal` | `#79c8c1` |
| `--c-lilac` | `#c5b3e6` |

頁面背景為純白（`--bg`），四角極淡多彩柔光由獨立節點 `.site-backdrop`（`position: fixed`）繪製，內容包在 `.site-root` 內；**不在 `body::before` 上畫 gradient**，避免 iOS Safari 上 sticky／合成層白塊跑版。柔光飽和度刻意偏低。實作見 `app/globals.css`、`app/layout.tsx`。
每則故事另有 `story.color`（hex），用於 CTA、播放鈕（卡片本身不再用極淡色邊）。

### 夜間色票原則（暖夜靛）

睡前主題走「暖夜靛」而非冷產品暗黑。實作僅覆寫 `[data-theme="night"]` token 值，**不改 ThemeProvider API**。

| 原則 | 落地 |
|------|------|
| 暖底＋可讀層次 | `--bg` `#1e2438`；`--bg-2`／`--card`／`--card-2` 拉開明度，搜尋與卡片有浮層 |
| Accent 降飽和 | `--c-*`、`--night-link`、`--landing-heading` 比日間／舊夜版低一檔 chroma |
| 頂欄不反轉 | `SiteNavBar` 桃色玻璃頂欄預設維持日間色。**2026-08-30 產品覆寫**：漢堡改 **最右 icon-only**（刪可見「選單」二字），可及名稱只靠 `aria-label`「開啟選單／關閉選單」；靜止無底板，hover 才圓底（`rgba(107,63,30,0.09)`）。原顧慮仍成立——一般寬度 icon-only 對 3–7 歲辨識度差——此鈕是家長 chrome，兒童主路徑改走內頁 `KidsPlayDock`／首頁 `ExploreGrid`。漢堡**在所有寬度都在**（桌面不得 `display: none`）。開啟時（含桌面＋night）頂欄微暗混入 **`--nav-panel-bg`（佔比 `--landing-nav-cta-bg` 10%）** 銜接面板、**關閉即恢復**——比例寫死是因為它是視覺回歸唯一的書面依據；舊式「38% + `--bg`」會讓頂欄變 rgb(127,125,129)、對面板 rgb(30,36,56) 階差 **3.78:1**（一條灰帶壓在深藍板上，非接縫）。開啟態文字**必須用純 `--ink`**：舊值 `color-mix(--landing-nav-ink 48%, --ink)` 對開啟態底僅 **1.48:1**，抽屜一開頂欄四個詞幾乎看不見（實測改後 9.11:1）——只在 `[data-menu-open]` 為真時套用，故不違反「不反轉」；不改 ThemeProvider。**窄容器收字**：`.inner` 設 `container-type: inline-size`；`@container nav-inner (max-width: 420px)` 品牌字「車車遊樂園」改 `.sr-only` **clip 收合**（仍保留可及名稱，**禁止 `display: none`**）。已無 240px「選單」收字規則。 |
| Emoji 降飽和 | 行動選單／主題切換 glyph 用 `filter: saturate(0.55) brightness(0.92)`，不換成線稿 icon |
| 地圖不反轉 | 宇宙地圖場景色固定印刷淺色（見紅線）。地圖 chrome（縮放鍵／探索點標籤／召喚把手）走 `--map-chip`／`--map-chip-2`／`--map-chip-ink`／`--map-chip-line`，`[data-theme="night"]` **不覆寫**——用 `--card`／`--ink` 會在深靛夜海上失去輪廓。**真實世界地圖**（`/for-parents/play-map`）的 OSM tile 同樣**禁止 invert**；該頁篩選 chip、Sheet 等頁面層 chrome **不**共用 `--map-chip*`（改 ghost／`--accent-ink`），僅縮放鍵、cluster、mapHint 保留 |

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
- 變體：`.marker-pink/sky/mint/lilac`，或以 inline `--marker-color`。

## 字型

- **Baloo 2**（Google Fonts，`next/font`）— 拉丁/數字內文
- **jf-open 粉圓 huninn**（`next/font/local`，子集化）— 中文字
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
| `--gloss` | inset 上緣高光（「打光黏土」）；僅用於**實心** CTA／鈕，不加於內容卡（Content over chrome） |

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
- **Focus**：`:focus-visible { outline: 3px solid var(--focus-ring); outline-offset: 2px }`；日間為主文字色，夜間為黃色。壓在影像上的深色玻璃 chrome 在元件內覆寫為 `var(--on-dark)` outline，不要改全域 token。
- **動效 token**：`--motion-press`（按鈕）、`--motion-page`（翻頁淡入）；另見全域 `.press-squash`
- **`prefers-reduced-motion: reduce`**：關閉吉祥物 bounce 等非必要動畫
- **遊戲虛擬鍵 pointer capture（3–7 歲）**：`TouchControls`（`GridTouchButton`／`BarTouchButton`）與 BlockDrop 左右移鍵按下時 `setPointerCapture`；**手指滑出按鈕仍視為按住**，僅在 `pointerup`／`pointercancel`／`lostpointercapture` 放開（不再用 `pointerleave` 當放開）。契約測須 shim 並斷言 capture API。棋盤類（消消樂／方塊拖移層）同樣以 capture 避免粗指標跨格吞 tap。BlockDrop `HintChips` 長按路徑仍為既有 leave 放開（未納本輪）。

### 色彩分層

- 全站語意色集中在 `app/globals.css`（文字、背景、互動、狀態、品牌色）。
- 遊戲載入器、地圖木牌、播放器黑底等固定美術色可保留為 component-local／allowlist 色，不跨元件複製同一組 hex。
- 新 CSS 不直接寫品牌色、白字或錯誤色；優先使用 `--brand-*`、`--on-dark`、`--status-*` 或既有 `--c-*` token。

## 元件規格

| 元件 | 說明 |
|------|------|
| `SiteHeader` | 吉祥物 + 標題（首頁完整版 / 內頁精簡版） |
| `StoryCard` | 封面、EP meta、elevated surface（`--elev-*`）；摘要 clamp 桌面 2 行、≤480px 3 行 |
| `Chip` | 篩選與標籤 pill，`aria-pressed` |
| `PlayButton` | 全寬 CTA，主題色底 |
| `StoryMeta` | EP / 時長（標註） / 車種 chip |
| `StoryProgressBadge` | 「已聽完」星章，貼封面右上角。語彙與宇宙地圖一致（`⭐` + `aria-label="已聽完"`）；只表達聽完單一狀態，不做「聽到一半」（progress store 的 `continue` 為全站單一欄位，標記會無預警消失） |
| `StoryPlayer` | 全螢幕黑底、字幕底板、底部控制列 |
| `SiteFooter` | 平台連結；不放「給家長：點播放鈕…」導讀、不放遊樂園入口（`/games` 走導覽）、不放安心訊號列；`ConnectHub` 區塊用 `--hairline` + `--elev-1`（頂欄膠囊白邊未改）。親子遊樂地圖仍可傳 `parentNote` |
| `GamePageShell` | 街機兩款遊戲共同外框，負責返回導覽、可及性與資產預載 |
| `ColoringPageShell` | 繪本著色活動外框（不掛 GameKit） |
| `GameChrome` | 遊戲內暫停、音效與設定對話框 |
| `ZoneSheet`／探索抽屜／召喚把手 | 進島後預設收合，底部「來這裡逛逛」召喚把手（觸控 ≥56px、`--map-chip*`）；展開為非模態 `region` 抽屜（`?sheet=1` 深連結）；兒童首屏故事卡、探索點次層；✕／Esc 收合 |

## 播放器狀態

1. **字幕跟讀（預設開）**：音檔進度驅動換頁；dots 不可點
2. **手動翻頁**：關閉跟讀後，左右 tap zone + swipe
3. **播放完成**：再聽一次 / 回故事屋 / 下一集
4. **載入中**：封面 skeleton 脈動

## 遊戲架構規範

- `/games` 呈現可玩活動：Block Drop（繽紛樂園）、Candy Match，以及 **繪本著色**（`/games/coloring-book`）；不放「製作中」或未承諾 placeholder。
- 繪本著色為 explore 活動：線稿來自既有定裝／場景圖，不併入 `GameKitGameId` 分數進度。
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

四段標題一律視覺隱藏（CSS module `titleHidden`，給輔助科技／`aria-labelledby`）。禁止用 `#segment-stories` 把 `.titleHidden` 或全域 `.sr-only` 解除隱藏。可見前景只留分區 CTA；GEO 導言維持全域 `.sr-only`。不新增行銷卡片或插畫。

Storyline 式**全螢幕分段捲動**：每段一張滿版黏土 hero（桌面 `segment-{id}.jpg` 16:9；行動 ≤768px `segment-{id}-portrait.jpg` 9:16），大圖主導 + 底部漸層遮罩 + 左下分區 CTA。**不**顯示段編號（如 01/04）。段標題仍視覺隱藏（CSS module `titleHidden`，給輔助科技／`aria-labelledby`），不疊在美術上；可見 CTA 為長句段名（本輪 Landing 例外，可超過「CTA ≤ 6 字」）；`href` 不變。分區 CTA 走**深色玻璃 ghost**（`min-height: 56px`、`rgba(0,0,0,0.38)`、白邊），字色 `--c-yellow`，字級桌面 `--fs-h2`、≤768 `--fs-h3`、≤640 `--fs-h4`，**非**橘色實心 pill；段內 `.next` 往下箭點視覺降權（極淡深色玻璃底）。不放「聽最新一集」播放直達鈕。首段 GEO 導言仍用全域 `.sr-only`。

1. **SiteNavBar**（全站橘色頂欄 + 訂閱 CTA）
   - **頂欄常駐列（2026-08-30 同構＋漢堡最右）**：`.inner` 用 `justify-content: flex-start`。**兩斷點同構**——**所有寬度**皆為 `[品牌] [首頁] [訂閱] [留言] [☰]`。`.actions`（`role="group"` `aria-label="常用"`，只含首頁／訂閱／留言）以 `flex: 1; justify-content: space-evenly` 撐滿品牌與漢堡之間，**禁止** `margin-left: auto`（會把三詞推到右側、中間再空一塊）。漢堡 **icon-only、置最右**，是 `.actions` 的下一個兄弟、**不**進常用組；左距 16px（大於舊 gap 10px）。品牌 pill **即首頁入口**（連 `/`），**`.actions` 內另列「首頁」文字連結**（去框：`.homeAction[aria-current]` 底透明，**僅字重 800、不畫任何線**）。**紅線：頂欄 active 不得用 `inset box-shadow`**——`.navLink` 是 `--radius-pill`(999px)，inset 底線會被圓角裁切、沿 22px 圓角往兩側爬升成**碗狀假邊框**（2026-08-31 使用者回報的「首頁的邊框」即此）。且 `.homeAction` 必須**顯式** `box-shadow: none`，只刪該行會讓 `.navLink[aria-current]`(0,2,1) 的 inset 接手、弧線原封不動。「訂閱」trigger 同樣去 border／實心底，`color: inherit`。**選單觸發器所有寬度都在**（桌面不得 `display: none`）。**主題切換移出頂欄**，改在抽屜底部。**頂欄字級角色（2026-08-31）**：品牌 `.brandText` 用 `--fs-h4`（**禁 `clamp()`+vw**，見 `globals.css` 97–98），比控制項大一階以保住字標層級；`.navLink` 與訂閱 `.trigger` 一律 `--fs-body`。**`--fs-meta`／`--fs-label` 不得用於頂欄主控制項**——它們的角色是「最小註記／標籤」，舊碼訂閱用 `--fs-meta`(+`--fs-label` @≥480px) 且字重 800，是同一列出現三種字級兩種字重的來源。`SubscribeMenu` 的 `@media (min-width: 480px)` **不得再覆寫 `font-size`**（會讓 base 修正在幾乎所有桌面失效）。訂閱文案「**訂閱**」；`visiblePlatforms()` 為空時**不得整顆消失**，退為站內 `/subscribe`。
   - **≥980px 懸浮膠囊**：外層 `.bar` 透明，`.inner` 改懸浮玻璃膠囊（`max-width: 960px`、高 56px）；**已移除 `.desktopNav`**——兒童三入口不再佔頂欄主列，改由抽屜與內頁 `KidsPlayDock` 承接。家長取向的親子指南／親子景點收進抽屜；角色圖鑑與繪本著色亦在抽屜（首頁 `ExploreGrid` 磁貼牆另有大圖入口，**本輪未改 ExploreGrid**）。無「更多」下拉。Threads 育兒分享仍由 `/for-parents` 頁內「育兒小筆記」外連卡承接。**成長主題（`/topic`）不佔導覽**，頁面仍可直達。
   - **「留言」在頂欄**（`.actions` 常用組），走 `feedbackHref()`——**恆有目的地**（`NEXT_PUBLIC_FEEDBACK_FORM_URL` 未設時降級 mailto，與 `SiteHeader` 那組 env-gated 圓鈕不同）；外連才加 `target="_blank" rel="noopener noreferrer"`，mailto 不加。**接受**未設 env 時 mailto 與頁尾「聯絡我們」、`ConnectHub` Email **可能同信箱**（CRITICAL-2=A；頁尾雙管道為刻意設計，頂欄留言是第三個可及入口）。
   - **窄容器收字**（見 §99）：`@container nav-inner (max-width: 420px)` 品牌字 `.sr-only` clip（**禁止 `display: none`**，須保留可及名稱）。漢堡已是 icon-only，無 240px 收「選單」規則。
   - 桌面面板**錨定膠囊本體 `.inner`**——面板的 JSX **必須巢狀在 `.inner` 之內**（`.inner` 有 `container-type: inline-size`，本身即 containing block；只加 `position: relative` 但把面板放在 `.inner` 外面**無效**，會退回錨定 `.bar` 變成全寬下拉）。漢堡在最右：`.inner` `padding-right` 與 `.panel { right }` **同一數字（16px）**、`left: auto`，`width: min(360px, calc(100vw - 40px))`。**＜980** `.panel` 維持 `left: 0; right: 0` 全寬 sheet。Landing 桌面 `.bar` 為 `pointer-events: none`，**`.panel` 必須一併還原 `auto`**（否則整片不可點）。
   - **漢堡抽屜**（所有寬度）：**7 列**——**探索** 5 列（全部故事／角色圖鑑／遊樂園／繪本著色／宇宙地圖，**無首頁**）→ **家長** 2 列（親子指南、**📍 親子景點**，**無留言**）；底部放主題切換。**夜間面板底走 `--nav-panel-bg`**（`--card` 50% + `--landing-brand-ink` 50% = rgb(43,38,44)，暖深褐、b−r=+1 藍已中和）：不可用 `--bg`（即使用者反映的深藍底），也不可改用 `--warm-surface`（站內已有 8 處消費）；往 `--c-yellow` 加暖是死路——黃是亮色，加到 16% 本組「給爸媽」小標就掉出 AA(4.49:1)，而藍要到 24% 才中和。抽屜內 `ThemeToggle` 軌道須就地覆寫為「面板色 + 白 8%」——其元件預設是 `--card`(#2c3450 靛藍)，在暖底上會變成唯一的藍色島。**不對稱分組**：探索組**不加**文字標題，**家長組上方加一行 `--fs-label` 小標「給爸媽」**。**連結常駐 DOM、以 CSS `display: none` 隱藏**——`{open && …}` 會讓爬蟲在關閉態讀不到任何站內連結；關閉時另加 `inert`（只靠 `opacity: 0` 不足，只靠 `inert` 也不足）。目前頁與 hover **不得共用同一底色**（色彩不可為唯一編碼）：`[aria-current="page"]` 另加 `inset` accent bar ＋加粗（`.menuLink[aria-current]` 與頂欄 `.actions` 內 `.navLink[aria-current]`，皆有 night override）。抽屜為**兩個 `role="list"`**（`list-style: none` 在 Safari/VoiceOver 會移除清單語意），家長組以 `aria-labelledby` 綁「給爸媽」小標，讓 AT 拿到與視覺分組對等的語意。同時只允許一個浮層開著（`openMenu: "none" | "subscribe" | "nav"`）——兩個 focus trap 同時 active 會互搶 Tab；跨越 980 斷點時關閉抽屜（舊碼會留下 `open=true` 卻不可見的面板，焦點掉到 body）。開啟時焦點移入第一個連結、關閉時還給觸發器；Esc 與點浮層外部皆可關閉。**頂欄內的品牌／常用組連結也必須 `closeAll`**——它們在 `.bar` 內，outside-click 判定不會關閉，client navigation 又保留元件 instance，漏掉會讓抽屜跨頁殘留、focus trap 持續作用。`Shift+Tab` 目前無法從面板回到觸發器（Escape 與點外部可關閉），若日後升級為 modal drawer 再補面板內關閉鈕與 scroll lock。點浮層外部關閉走 `closeFromOutside()`（先 blur 再關）——`pointerdown` 早於 `click`，否則 focus trap 會把焦點從使用者正要點的元素搶回觸發器。
   - **著色本頁 active 態**：抽屜用完整 `internalHrefs` 做**最長匹配獨佔**，高亮「繪本著色」；`KidsPlayDock` 的「遊樂園」在 `/games/coloring-book` **不**標 `aria-current`（hub 僅精確匹配 `/games`，不做子路徑最長匹配）。不含搜尋列（故事搜尋仍在 `/stories`）。「親子景點」連 `/for-parents/play-map`，與「親子指南」並列於家長組。不列「主題分類」。繪本著色雖為 `/games` 子路徑，仍在探索組獨立列出（兒童動線不應只能從遊樂園內層進入）；`/for-parents/play-map` 僅「親子景點」高亮。
   - **KidsPlayDock**（`components/landing/KidsPlayDock.tsx`，掛 `app/layout.tsx` 的 `.site-root` 內）：內頁左下 **fixed**、`z-index: 15`、`aria-label="去玩"`；三顆 **📖 全部故事／🎡 遊樂園／🗺️ 宇宙地圖**，語彙對齊 `ExploreGrid` 磁貼，觸控 **≥48px**。**首頁 `/` 不渲染**；隱藏條件與頂欄相同——`isImmersiveRoute`（著色本 `/games/coloring-book` **仍顯示**；`/games/:slug` 沉浸式遊戲如 candy-match／block-drop **不顯示**）。active 規則：`/games` **僅 hub 精確匹配**（子路徑不得讓「遊樂園」current）；`/adventures` **不藏**且子路徑可 `aria-current`。掛載時 `data-kids-dock` 觸發 `body:has([data-kids-dock]:not([data-kids-dock-flush])) .site-root { padding-bottom: var(--kids-dock-h) }`（`--kids-dock-h: calc(88px + var(--safe-bottom))`），**勿擠 `--nav-h`**。`data-kids-dock-flush`：`/adventures` 及其子路徑、以及**精確** `/for-parents/play-map`（不含 `[placeId]`／collections 等可捲動子頁）。≤480px 僅**精確** `/adventures`（世界層）加 `data-lift="picker"`，把 dock 抬到 IslandPickerStrip（72px）之上；島層子路徑不抬、不藏 🗺️。
   - 關於我們／聯絡我們在頁尾 meta（聯絡另有 ConnectHub Email icon）。**未改** Apple sync workflow、ThemeProvider API、`ExploreGrid`。
2. 四段 **LandingSegment** 全螢幕面板（資料：`data/landing-segments.ts`）；可見 CTA：`車車遊樂園的故事`／`數綿羊123．睡前故事`／`好好玩的捏黏土`／`好習慣故事`
3. **SegmentNav**：桌面右側垂直進度點；**≤768px** 改為底部水平指示列（含 safe area）。導覽點用 `navLabel` 短標（車車故事／睡前／捏黏土／好習慣），避免長 CTA 灌進指示列。每段往下箭點錨點於平板／手機隱藏（改由底列承擔）。document scroll-snap，reduced-motion 自動停用
4. Segment 1 CTA「車車遊樂園的故事」→ **`/stories`**（完整 Podcast 主頁）
5. **ExploreGrid 探索區**（`components/landing/ExploreGrid.tsx`，資料 `data/explore-tiles.ts`）：在 **footer snap pane 之內、頁尾之上**，**不新增第五個 snap 段**——`SegmentNav`／`DuduCompanion`／`LandingBedtimeLayer` 三者皆以 `resolveLandingSegments()` 的四段為唯一來源，插入第五段會同時打破三份映射。區塊標題為**可見 HTML 文字**「都去哪裡玩？」；**刻意不叫「探索」**——該詞已是行動抽屜的分組語彙，同名會混淆兩個層級。左側**地圖大卡**連 `/adventures`（美術沿用既有 `public/adventures/zones/` 島嶼資產，非新生圖）；右側**磁貼牆**六格，兒童組（全部故事／遊樂園／繪本著色／角色圖鑑）在前、視覺權重較大，家長組（親子指南／親子景點）在後、降一階，**非等權網格**。宇宙地圖只出現在地圖大卡，不在磁貼重複。磁貼一律 `<Link>`（非 `div` + onClick），標籤為可見 HTML 文字；圖徽沿用**行動抽屜同一批 emoji**（`aria-hidden` 裝飾，可及名稱由文字承擔），使抽屜與磁貼牆是同一套視覺語言且不新增任何圖片位元組。手機 2 欄、≥768px 兒童組 4 欄。兒童磁貼觸控 **≥48px**（沿用密度底線，不因外部 44px 清單降階），家長磁貼 ≥44px。圖片一律 `loading="lazy"` ＋ CSS 骨架，**不用 `placeholder="blur"`**（多張 blurDataURL 會膨脹首頁 SSR HTML）。**睡前 veil 下的對比已實測**（2026-08-30，線上站 `data-bedtime` 開啟、探索區置於視窗頂端 60px 即 veil 最深段下方）：磁貼標籤 7.22:1、地圖大卡標籤 6.94:1、區塊標題 6.25:1，皆遠高於 4.5:1——`LandingBedtimeLayer` 不需為探索區額外提 z-index 或淡出。
   - `.footerPane` 因此高於一屏，連帶四項調整：(1) `justify-content` 由 `flex-end` 改 `flex-start`（超過一屏時 flex-end 會把頂部推出可視範圍），頁尾改以 `margin-top: auto` 貼底；`min-height` 保留為「至少一屏」下限。(2) **移除 `scroll-snap-stop: always`**——mandatory snap 加強制停駐會攔截滑動，使溢出內容難以抵達（MDN 已知風險）；保留 `scroll-snap-align: start` 讓抵達時仍穩定停駐。(3) 「最後一段 hero → 頁尾」的暖色漸層橋接**上移到 `.footerPane` 頂緣**，`.footer` 回歸純 `--bg`；否則探索區進駐後漸層被推到 pane 中段，滿版 hero 會直接硬切到白面。(4) ≤768px 加 `padding-bottom: calc(44px + var(--safe-bottom))` 為貼底的 `SegmentNav` 實心列留位——本 pane 由「掃過去」變成「會停留操作」。
   - **未關閉風險**：mandatory snap ＋ 超高 pane 的攔截行為**只有 iOS Safari 實機能驗**。Chromium e2e 在移除 `scroll-snap-stop` 前後皆通過，證明該測試對此風險**沒有鑑別力**；Playwright mobile WebKit 亦不支援 `mouse.wheel`。上線前須人工實機驗證可捲到版權列。
   - 地圖大卡素材取 `car-park@3x.webp`（792×780，比例 ~1.015:1，見 `car-park.tile.json` `intrinsicPx`）；**不可**用 x1（264×260）或宣告成 512 方圖——在 280px CSS 寬 ×2–3 DPR 下會被放大糊掉且比例失真。`sizes` 精確宣告 `280px`（CSS 已 `max-width: 280px` 封頂）。
   - 磁貼圖徽字級用 `--fs-h1`（同一批 emoji 在 `SiteNavBar` 為 `--fs-h2`，首頁大一階作為權重差）；兩個 `<ul>` 顯式補 `role="list"`（Safari/VoiceOver 會因 `list-style: none` 移除清單語意）與 `aria-label`（「小朋友的入口」／「給家長」），使 AT 取得與行動抽屜分組對等的語意。
   - **首頁 `<footer>` 不具 `contentinfo` landmark**：整頁包在 `app/page.tsx` 的 `<main data-landing-root>` 內，`<main>` 是該隱含角色的排除祖先——與 `#landing-foot` 用 `section` 或 `div` 無關。這是既有結構事實，e2e 以版權列文字為錨點。

Hero 圖走 `images.edit` + `public/characters/` 定裝照參考圖，與單集插畫同流程以維持 on-model。

### 全部故事（`/stories`）

1. **SiteHeader** 大 Hero 黏土插畫
2. **LatestHero** 最新一集（elevated surface，`--elev-2` resting；無盒子描邊／1px 色環）
   LatestHero 說明最多 3 行（`StoryCard` 桌面 2 行、≤480px 3 行）；來源摘要於 Apple／SoundOn ingest 階段即截斷至約 68 字（CJK），clamp 為保險層。
3. **FavoritesSection** 精選
4. **StoryFilter** 找故事（車種／主題下拉，不另放「車車」「主題」欄位副標；觸發鈕 `aria-label` 已足夠）；`filterBar` 用 `--surface-elevated` + `--hairline` + `--elev-1`

Landing segment hero 生圖：`npm run generate:landing-art -- --dry-run`（橫版）；直版 `--portrait`；approve 後覆蓋 `public/landing/`。
