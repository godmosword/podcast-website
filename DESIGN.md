# 車車遊樂園 — 設計系統 v0.2

Bonbon & 馬米親子 Podcast「看圖聽故事」網站的視覺與互動規範。

## 視覺方針（v0.2：插畫主導＋克制 chrome）

保留黏土插畫與粉嫩品牌色，chrome 依 **Apple Human Interface Guidelines** 升級為清晰、讓位、有深度的產品介面——童趣靠插畫與色彩，不靠麥克筆描邊或密集塗鴉堆可愛。

| 原則 | 落地 |
|------|------|
| Clarity（清晰） | 字階分明、對比足夠、裝飾不搶內容 |
| Deference（讓位） | UI 退讓給黏土插畫／故事封面 |
| Depth（深度） | 柔陰影、半透明層、`--hairline`；不用厚塗鴉框 |
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

- viewport 只使用四層：`480px`（手機／小尺寸控制）、`640px`（內容欄與手機版型）、`768px`（平板雙欄）、`980px`（全站膠囊導覽＋Landing 桌面版）。內容欄最大寬（如家長頁 `min(920px, 100%)`）不屬 viewport 切版斷點。
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
每則故事另有 `story.color`（hex），用於極淡色邊、CTA、播放鈕。

### 夜間色票原則（暖夜靛）

睡前主題走「暖夜靛」而非冷產品暗黑。實作僅覆寫 `[data-theme="night"]` token 值，**不改 ThemeProvider API**。

| 原則 | 落地 |
|------|------|
| 暖底＋可讀層次 | `--bg` `#1e2438`；`--bg-2`／`--card`／`--card-2` 拉開明度，搜尋與卡片有浮層 |
| Accent 降飽和 | `--c-*`、`--night-link`、`--landing-heading` 比日間／舊夜版低一檔 chroma |
| 頂欄不反轉 | `SiteNavBar` 桃色玻璃頂欄預設維持日間色；漢堡開啟時（行動＋night）頂欄微暗混入 `--bg` 銜接面板，關閉即恢復；不改 ThemeProvider |
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
- 卡片一律 elevated surface + `--hairline`／極淡主題色邊（`story.color` 或 `--card-accent`）。
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

## 圓角與陰影

| Token | 值 |
|-------|-----|
| `--radius-sm` | 14px |
| `--radius-md` | 20px |
| `--radius-lg` | 28px |
| `--radius-xl` | 32px |
| `--elev-1` | 高度階梯第一階：貼地卡片（列表 `StoryCard` resting）。夜間由 token 覆寫 |
| `--elev-2` | 第二階：sticky／焦點面（首頁 hero、精選 `LatestHero` resting、列表卡 hover） |
| `--elev-3` | 第三階：浮層／精選卡 hover。**不**用於 dropdown／`MapControls` 等已有暖色調手調陰影者 |
| `--shadow-card` | `--elev-1` 的相容別名（既有消費點沿用；新元件請直接用 elev 階梯） |
| `--shadow-sm` / `--shadow-md` | 元件互動態陰影（非高度階梯詞彙；量級落在 elev-1～elev-2 間，勿與 elev-* 混用於同一面的層級判斷） |
| `--gloss` | inset 上緣高光（「打光黏土」）；僅用於**實心** CTA／鈕，不加於內容卡（Content over chrome） |

## 間距

Token 階梯（`globals.css`）：`--space-2: 8px`、`--space-3: 12px`、`--space-4: 16px`、`--space-6: 24px`、`--space-8: 32px`、`--space-section: 40px`、`--space-page: 20px`。

密度底線（兒童向頁面取括號內較大值）：

- 觸控目標 min-height ≥ 44px（48px）；調整密度時只加不減。
- 相鄰互動元素 gap ≥ 8px（12px）；卡片 grid gap ≥ 12px。
- section 垂直間距 mobile ≥ 24px；內文 line-height ≥ 1.5（標籤型小字豁免）。
- 純文字段落 max-width ≤ 640px。
- 文案密度：兒童動線頁不放超過一行的家長散文（家長說明歸戶 `/for-parents` 與 footer）；標題 ≤ 8 字、CTA ≤ 6 字。`/legal` 精簡不得刪改具法律效力語句。
- 新宣告優先用 token；既有硬寫 px 僅在觸碰該宣告時順手換 token（±4px 內就近取整）。

## 互動

- **按壓回饋**：`:active { transform: scale(0.98) }` 或微降 opacity；避免厚底影下沉與 hover 歪斜 rotate
- **Focus**：`:focus-visible { outline: 3px solid var(--focus-ring); outline-offset: 2px }`；日間為主文字色，夜間為黃色。
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
| `StoryCard` | 封面、EP meta、elevated surface + 極淡主題色邊／柔陰影 |
| `Chip` | 篩選與標籤 pill，`aria-pressed` |
| `PlayButton` | 全寬 CTA，主題色底 |
| `StoryMeta` | EP / 時長（標註） / 車種 chip |
| `StoryProgressBadge` | 「已聽完」星章，貼封面右上角。語彙與宇宙地圖一致（`⭐` + `aria-label="已聽完"`）；只表達聽完單一狀態，不做「聽到一半」（progress store 的 `continue` 為全站單一欄位，標記會無預警消失） |
| `StoryPlayer` | 全螢幕黑底、字幕底板、底部控制列 |
| `SiteFooter` | 家長說明 + 平台連結 |
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

Storyline 式**全螢幕分段捲動**：每段一張滿版黏土 hero（桌面 `segment-{id}.jpg` 16:9；行動 ≤768px `segment-{id}-portrait.jpg` 9:16），大圖主導 + 底部漸層遮罩 + 左下標題／副標／CTA。

1. **SiteNavBar**（全站橘色頂欄 + 訂閱 CTA）
   - **桌面（≥980px）**懸浮膠囊主列：全部故事／角色圖鑑／遊樂園／宇宙地圖／**親子景點**／**親子指南**。「親子景點」直連 `/for-parents/play-map`（路徑不另開頂層路由）；「親子指南」直連 `/for-parents`。無「更多」下拉。Threads 育兒分享仍由 `/for-parents` 頁內「育兒小筆記」外連卡承接（Threads 缺席時整卡不渲染）。主題切換與訂閱膠囊常駐。**成長主題（`/topic`）不佔導覽**（屬家長取向且與 /stories 篩選重疊），頁面仍可直達。主列 6 項時維持 980 斷點與既有密度調整，不縮觸控區。
   - **行動（＜980px）**漢堡抽屜：單欄依 **探索**（故事／角色圖鑑／遊樂園／繪本著色／宇宙地圖）→ **家長**（親子指南、**📍 親子景點**）分組；含 `/stories?q=` 搜尋。「親子景點」連 `/for-parents/play-map`，與「親子指南」並列於家長組。與桌面一致不列「主題分類」。繪本著色雖為 `/games` 子路徑，仍在探索組獨立列出（兒童動線不應只能從遊樂園內層進入）；active 判定採**最長匹配獨佔**，`/games/coloring-book` 不得讓「遊樂園」同時高亮；`/for-parents/play-map` 僅「親子景點」高亮。
   - 關於我們／聯絡我們在頁尾 meta（聯絡另有 ConnectHub Email icon）。
2. 四段 **LandingSegment** 全螢幕面板（資料：`data/landing-segments.ts`）：車車故事／睡前數綿羊／捏黏土／衛教宣導
3. **SegmentNav**：桌面右側垂直進度點；**≤768px** 改為底部水平指示列（含 safe area）。每段往下箭點錨點於平板／手機隱藏（改由底列承擔）。document scroll-snap，reduced-motion 自動停用
4. Segment 1 CTA → **`/stories`**（完整 Podcast 主頁）

Hero 圖走 `images.edit` + `public/characters/` 定裝照參考圖，與單集插畫同流程以維持 on-model。

### 全部故事（`/stories`）

1. **SiteHeader** 大 Hero 黏土插畫
2. **LatestHero** 最新一集
3. **FavoritesSection** 精選
4. **StoryFilter** 找故事（車種／主題篩選）

Landing segment hero 生圖：`npm run generate:landing-art -- --dry-run`（橫版）；直版 `--portrait`；approve 後覆蓋 `public/landing/`。
