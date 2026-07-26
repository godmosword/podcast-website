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
- `/for-parents` 固定稱「家長指南」；Threads 外連固定稱「育兒專欄」，兩者不互換。
- 元件與 CSS class 使用當前產品語義，例如 `SiteNavBar`／`SubscribeMenu`；功能改名後不保留已退役的 `More*` 命名。

## 裝置

- **Mobile-first**，內容欄寬 `max-width: 640px` 置中
- 桌面端維持單欄，兩側留白
- PWA：`manifest.json` + Apple Web App meta
- Viewport 允許使用者縮放（未設 `maximum-scale` / `user-scalable=no`），方便家長放大閱讀

## 響應式斷點

- viewport 只使用五層：`480px`（手機／小尺寸控制）、`640px`（內容欄與手機版型）、`768px`（平板雙欄）、`920px`（Landing 桌面版）、`980px`（全站膠囊導覽）。
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
| 地圖不反轉 | 宇宙地圖場景色固定印刷淺色（見紅線） |

meta `theme-color`（夜）對齊 `--bg`：`lib/theme.ts` 的 `NIGHT_THEME_COLOR`。

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
| `GamePageShell` | 街機五款遊戲共同外框，負責返回導覽、可及性與資產預載 |
| `ColoringPageShell` | 繪本著色活動外框（不掛 GameKit） |
| `GameChrome` | 遊戲內暫停、音效與設定對話框 |

## 播放器狀態

1. **字幕跟讀（預設開）**：音檔進度驅動換頁；dots 不可點
2. **手動翻頁**：關閉跟讀後，左右 tap zone + swipe
3. **播放完成**：再聽一次 / 回故事屋 / 下一集
4. **載入中**：封面 skeleton 脈動

## 遊戲架構規範

- `/games` 呈現可玩活動：Car Adventure、Block Drop（繽紛樂園）、Candy Match、Candy Kart、阿蹦雪山衝刺，以及 **繪本著色**（`/games/coloring-book`）；不放「製作中」或未承諾 placeholder。
- 繪本著色為 explore 活動：線稿來自既有定裝／場景圖，不併入 `GameKitGameId` 分數進度。
- Game Kit 只保留單一 `lib/gamekit/` 樹，分為 `react/`、`runtime/`、`progress/`、`games/` 與 `types.ts`（街機五款）。
- Consumer 必須匯入明確 leaf path，例如 `@/lib/gamekit/react/useGameAudio`；不使用 `@/lib/gamekit` 根目錄或 barrel。
- 詳細邊界、import policy 與新增遊戲流程見 [GAMEKIT-ARCHITECTURE.md](./docs/GAMEKIT-ARCHITECTURE.md)。
- 遊戲進度、最佳分數、獎牌、星星、貼紙與 Candy Kart iframe bridge schema 屬相容性契約，不因 UI 或文件整理而變更。

## 新增故事檢查清單

1. `public/stories/<slug>/` 放入 `audio.mp3`、`01.jpg`～`NN.jpg`
2. `data/stories.ts` 更新 `pageCount` 與 `captions`
3. `npm test` + `npm run build`

## 首頁 IA

### Landing Hub（`/`）

Storyline 式**全螢幕分段捲動**：每段一張滿版黏土 hero（桌面 `segment-{id}.jpg` 16:9；行動 ≤768px `segment-{id}-portrait.jpg` 9:16），大圖主導 + 底部漸層遮罩 + 左下標題／副標／CTA。

1. **SiteNavBar**（全站橘色頂欄 + 訂閱 CTA）
   - **桌面（≥980px）**懸浮膠囊主列：全部故事／角色圖鑑／遊樂園／宇宙地圖／育兒專欄（Threads 外連）／**家長指南**（直連 `/for-parents`）。無「更多」下拉。主題切換與訂閱膠囊常駐。**成長主題（`/topic`）不佔桌面主列**（屬家長取向且與 /stories 篩選重疊），僅存在於行動抽屜「探索」組與視覺化的 `/topic` 頁。
   - **行動（＜980px）**漢堡抽屜：單欄依 **探索**（故事／主題／遊樂園／繪本著色／宇宙地圖）→ **家長**（育兒專欄／家長指南）分組；含 `/stories?q=` 搜尋。繪本著色雖為 `/games` 子路徑，仍在探索組獨立列出（兒童動線不應只能從遊樂園內層進入）；active 判定採**最長匹配獨佔**，`/games/coloring-book` 不得讓「遊樂園」同時高亮。
   - 關於我們／聯絡我們在頁尾 meta（聯絡另有 ConnectHub Email icon）。
2. 四段 **LandingSegment** 全螢幕面板（資料：`data/landing-segments.ts`）：車車故事／睡前數綿羊／捏黏土／衛教宣導
3. **SegmentNav**（右側進度點，手機隱藏）＋ 每段往下箭頭錨點；document scroll-snap，reduced-motion 自動停用
4. Segment 1 CTA → **`/stories`**（完整 Podcast 主頁）

Hero 圖走 `images.edit` + `public/characters/` 定裝照參考圖，與單集插畫同流程以維持 on-model。

### 全部故事（`/stories`）

1. **SiteHeader** 大 Hero 黏土插畫
2. **LatestHero** 最新一集
3. **FavoritesSection** 精選
4. **StoryFilter** 找故事（車種／主題篩選）

Landing segment hero 生圖：`npm run generate:landing-art -- --dry-run`（橫版）；直版 `--portrait`；approve 後覆蓋 `public/landing/`。
