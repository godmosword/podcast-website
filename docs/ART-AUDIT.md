# 車車遊樂園美術稽核

> 2026-10-22 稽核。同日 Kaiyi 拍板 1A 2B 3A 4B 5B 6B 7B 8A 9A 10A，並在 `cursor/art-unify-2c6d` 落地。沒有生圖。
> 基準：`main` `655107b3`（fix(sync): 加上 sync-validate check 與路徑閘門）。
> 標準：[`STYLE-BIBLE.md`](STYLE-BIBLE.md)、[`VISUAL-ACCEPTANCE.md`](VISUAL-ACCEPTANCE.md)，元件規格對 [`DESIGN.md`](../DESIGN.md)。
> 衝突時以上線畫面與風格聖經的「程式確認」為準；本檔把還沒拍板的分裂列成文末決定題。

嚴重程度：

| 級 | 意思 |
|----|------|
| 高 | 同一條孩子動線上，主色、按鈕或畫風換了一套 |
| 中 | 同一種元件有多種寫法；有的已在文件登記為例外 |
| 低 | 文件過期、隱藏路由、內部工具，或已知尚未收斂的 token |

截圖是本機 `next dev` 第一屏，寬度 390×844 與 1280×800，日間由 `localStorage` 鎖定 `theme: light`（避免 19:00–06:00 睡前自動夜色）。夜間另拍對照。方塊轉轉的網址會永久轉到 `/games`，沒有把它拍成公開頁。圖檔在稽核產物，不進 git。

---

## 1. 現況實際上長什麼樣子

全站沒有 Tailwind 設定檔。設計 token 集中在 `app/globals.css`，元件用 CSS Modules。`npm run audit:colors` 在這次 `main` 上是綠的（allowlist 外的 CSS 模組沒有裸 hex，D3 驗收頁已 token 化）。這不代表畫面只有一套色：遊戲、地圖、播放器在 allowlist 裡，TSX 裡的色碼閘門看不到。

### 日間，孩子在「網站」上看見的

| 角色 | 實際色 | 出處 |
|------|--------|------|
| 頁底 | `#ffffff` | `--bg`，`app/globals.css` 78 |
| 字 | `#34302b`／次要 `#7a7268` | 81–82 |
| 頂欄 | 桃色底 `#fff8f2`，字 `#7a4012` 這一系 | `--landing-nav-cta-bg` 214、`--landing-cta-fg` 212；`.bar` 在 `components/landing/SiteNavBar.module.css` 6 |
| 品牌橘 | `#ff8c2b` | `--landing-brand` 198。聖經寫它用在頂欄；畫面上頂欄是桃色底，橘是品牌色票，不是整條填色 |
| 主按鈕墨 | `#3a2410` 白字 | `--cta-solid-bg` 247，等於 `--landing-brand-ink` |
| 強調青綠 | `#2a9d8f`，文字必須改 `#1f7268` | `--landing-heading` 203、`--accent-ink` 265 |
| 粉彩點綴 | 粉 `#f7a8c4`、黃 `#ffd866`、薄荷 `#b7df9b`、天藍 `#8fcde8`、青 `#79c8c1`、紫 `#c5b3e6` | 102–107 |
| 夜間頁底 | `#141312`，字 `#f0ead8`，品牌橘降成 `#d9701a` | 318–321、363 |

字：拉丁 Fredoka、中文內文 jf-open 粉圓 huninn、標題源泉圓體 TW Bold、拉丁點綴 Gochi Hand。堆疊在 `app/layout.tsx` 20–54 與 `--font-stack-body`／`--font-stack-display`（`app/globals.css` 72–74）。

圓角階梯 8／14／20／28／32／膠囊 999／圓 50%（120–126）。陰影是柔的 `--elev-1/2/3`（132–134）。

`npm run audit:design-tokens`（141 個 CSS module）：字級 token 72%（449 token／176 裸值）、圓角 72%（345／132）、色彩 75%（1058／345）、間距 px 33%（417／838）。另有 172 處 rem 間距，DESIGN 規定不得換成 `--space-*`。間距低採用率是既定政策，不是這次要收的畫風問題。裸字級大量落在遊戲 CSS（消消樂、壽司屋、方塊轉轉採用率接近 0）。

### 和聖經岔開的地方（摘要）

網站 chrome 大致照三色分工。岔開來的是四套「另一個房間」：

1. **每集色** `data/episode-colors.ts`：ep-1–12 是飽和色（`#e03131`、`#4263eb`、`#0ea5e9`…），ep-13–35 共 23 集落到預設 `#7048e8`。這些色不在風格聖經，也不在 `--c-*`。
2. **消消樂馬卡龍**：墨 `#5d4a67`、強調粉 `#a5567a`、奶油殼 `#fff7ed`、主鈕黃漸層 `#ffe889`→`#ffbd6f`。卡面夜間不反轉。
3. **壽司屋**：墨 `#4a3722`、樹林綠 `#3f7f2a`、奶油 `#fff8ea`。和消消樂不是同一張卡。
4. **著色**：主鈕磚紅 `#c94a1e`（已登記例外），色票是另一組 12 色粉彩，工具圖示又是高飽和蠟筆色。

方塊轉轉仍是第五套（井底深藍紫 `#3d3f82`／`#2a2c5e`，方塊圓角 7），路由已隱藏。

---

## 2. 主色

### 2.1 頂欄是桃色，品牌橘不是頂欄填色

- 嚴重：中。1 個表面（全站頂欄），token 2 個。
- 聖經 §1：品牌 `#FF8C2B` 用在頂欄。實作頂欄填的是 `--landing-nav-cta-bg` `#fff8f2`（`SiteNavBar.module.css` 6、26–29）。`#ff8c2b` 的消費點在 `app/globals.css` 198 與少數混色，不是整條列的底。
- 截圖：`home_light_mobile.png` 頂列取樣約 rgb(253, 246, 240)，對得上桃色，對不上 `#ff8c2b`。
- 建議規則：頂欄填色就叫「桃色頂欄」`#fff8f2`；`#ff8c2b` 只當字標、小圓點或插畫裡的橘，不要再寫成頂欄底色。兩個角色都保留，文件改對齊畫面。

### 2.2 故事頁主按鈕跟著每集色走

- 嚴重：高。每一集一個主按鈕，29 集同步目錄裡 23 集同一紫、12 集各一種飽和色。
- `app/story/[slug]/page.tsx` 115–118 把 `story.color` 傳進 `PlayButton`。`components/PlayButton.module.css` 16 用 `color-mix(… var(--play-bg) 56%, black)` 當底，白字。這顆鈕是該頁唯一主行動。
- 聖經 §1：唯一主按鈕是 `#3A2410`。DESIGN「CTA 三階」寫明 `PlayButton` **不吃** `--cta-solid-*`（`DESIGN.md` 色彩一節）。兩份規範互相打架，畫面上是 PlayButton 贏。
- `/stories` 的 LatestHero「立即看故事」已改深墨；EP chip 也已固定 `.marker-lilac`，不跟 `story.color`（`components/StoryCard.tsx` 91–93）。同一條「看故事」動線，列表主鈕和集內主鈕不是一種東西。
- `story.color` 還染縮圖墊色與箭頭圓（`StoryCard.tsx` 63、122–124）和標籤（114）。
- 建議規則：集內「開始看故事」改綁 `--cta-solid-bg`。每集色若要留，只做 18% 以下的墊色，不拿來當白字按鈕的底。色碼改到 `--c-*` 或新的一列 token，停用飽和色與 `#7048e8` 預設。

### 2.3 遊戲各自重寫 `--ink`／`--cta-*`

- 嚴重：高。三個公開遊戲各一份本地色票，再加隱藏的方塊轉轉。
- 消消樂 `components/games/CandyMatchView.module.css` 2–6：`--candy-ink: #5d4a67`、`--candy-accent: #a5567a`，焦點環改綁糖果墨。主鈕 `CandyMatchView.module.css` 180–191：圓形、黃漸層 `#ffe889`→`#ffbd6f`、字 `#614018`、硬影 `0 8px 0`。
- 壽司屋 `components/games/DinoSushiView.module.css` 7–29：本地 `--sushi-ink: #4a3722`、`--sushi-accent: #3f7f2a`，同時把 `--ink`、`--cta-solid-bg`、`--cta-warm-*` 釘成另一組日間值。綠色實心出現在疊盤數字（`DinoSushiKitchen.module.css` 1141）、現在這單的小盤（861）、貼紙書新標（`DinoSushiView.module.css` 525）。
- 著色主鈕 `components/coloring/ColoringCover.module.css` 143–159：`--coloring-accent`（來自 `--support-from` `#c94a1e`），硬影 `0 6px 0`，hover 加到 `0 8px 0`。這條聖經 §1 已登記為例外。
- 方塊轉轉 `components/games/blockDropTheme.ts` 18–41、77–91：與消消樂同族黃鈕，井與方塊另有 7 色。
- 建議規則：遊戲**舞台**（方塊、食物、棋盤、著色紙）可以有自己的美術色。遊戲**主按鈕**只准兩種：深墨 `--cta-solid-bg`，或著色頁已登記的磚紅。黃漸層與樹林綠降成次要鈕。本地 `--ink` 若為了淺卡對比，改名 `--game-ink`，不要覆寫全站 `--ink`／`--cta-solid-bg`。

### 2.4 著色有三組「彩色」

- 嚴重：中。色票 12 色、工具圖示 1 套、完成彩帶又 1 套。
- 塗上去的色在 `lib/coloring/tools.ts` 15–33：粉紅 `#e7a8a0`、橘 `#f4c7a4`、黃 `#f7e6ae`、草綠 `#5e9e72`、綠 `#2c6b4e`… 黑是 `#3a342e` 不是 `#000`。
- 蠟筆／油漆桶／橡皮擦圖示 `components/coloring/ColoringToolbarIcons.tsx` 21–28：`#f2c94c`、`#e85d4c`、`#2d9cdb`、`#f781c6`、`#9b9b9b`。飽和度高於色票，也高於 `--c-*`。
- 完成彩帶 `components/coloring/ColoringDoneSheet.tsx` 15：`#f2c94c`、`#e85d4c`、`#56ccf2`、`#6fcf97`、`#f781c6`。和色票、和 `--c-*` 都不同。
- 建議規則：色票維持這 12 色（已上線）。工具圖示與彩帶若要「看起來像蠟筆」，在聖經加一列「道具色」，禁止再長出第三組 hex。否則道具色改採色票。

### 2.5 親子景點與開場世界還有自己的色

- 嚴重：低到中。景點頁是家長工具；開場目前不在產品路徑。
- 景點頁底 `--pm-page: #fff9ee`（`app/globals.css` 89），和全站純白 `--bg` 不同。情境插畫是程式 SVG，另有一組 hex（例如 `components/for-parents/scene-art/EnergyScene.tsx` 的 `#ffd45e`）。聖經不管單頁插畫色，VISUAL-ACCEPTANCE 要求色碼在 token 或聖經裡。
- 開場 `components/landing/hero-world/HeroWorld.module.css` 10–17：底 `#f2ecd8`、標題 `#28776e`、內文 `#78553c`、字級 `clamp(2.4rem, 4vw, 4.8rem)`。`#28776e` 接近強調色 `#2a9d8f` 但不是同一個。`INTRO_PORTAL_ENABLED` 關閉後這頁不在主動線。
- 建議規則：景點頁奶油底維持 `--pm-page`，寫進聖經的「頁底例外」。情境 SVG 的色收成一張 `scene-art` 色表，新色先加表。開場標題改 `--accent-ink`，或標成休眠畫面、不跟全站一起改。

### 2.6 未使用的像素色盤還在程式裡

- 嚴重：低。1 個檔案，32 色。
- `lib/gamekit/runtime/palette.ts` 5–38 的 `MASTER_PALETTE` 含 `#e94560`、`#7c3aed` 等高飽和色。聖經 §2 寫明沒有上線遊戲在用。
- 建議規則：維持「不上線畫面」。文件繼續聲明它不是網站色票，避免之後有人把它當統一色盤。

---

## 3. 按鈕

孩子會連續碰到至少四種主按鈕：

| 表面 | 長相 | 出處 |
|------|------|------|
| 首頁分區 CTA、關於／列表的深墨鈕 | 暖深墨、白字、柔影 `--elev-*`、按下 `scale(0.98)` | `--cta-solid-*`；首頁另加 `--gloss` |
| 故事「開始看故事」 | 每集色壓暗、圓角 `--radius-lg`、柔影 | `PlayButton.module.css` 8–26 |
| 遊樂園卡片上的圓鈕 | 56px 圓、淺奶油混該遊戲 accent、柔影、第一張會呼吸放大到 1.08 | `app/games/page.module.css` 146–178 |
| 消消樂「開始」 | 大圓、黃漸層、`0 8px 0` 硬底邊 | `CandyMatchView.module.css` 180–191 |
| 著色「開始塗」 | 磚紅、`0 6px 0`，按下改成往下沉 | `ColoringCover.module.css` 171–178 |
| 壽司屋結束／回去語彙 | 實心綠 `#3f7f2a` | `DinoSushiView.module.css` 9、525 |
| 景點情境卡、位置鈕 | 白卡、`0 4px 0`／`0 3px 0`，選中下沉 2px | `PlayMapScenarioGrid.module.css` 28–42、`PlayMapLocationBar.module.css` 71 |

聖經 §5 已決定：一般頁柔影，遊戲與著色保留硬底邊，景點卡是 2026-10-19 的例外。還沒決定的是**硬底邊有多厚**，以及**進遊戲前的圓鈕要不要算硬底邊家族**。

硬底邊（`box-shadow: 0 Npx 0`）在 CSS 模組裡約 40 處，厚度有 1、2、3、4、5、6、8px。代表：

- 遊戲抬頭方鈕 4px：`components/games/GamePageShell.module.css` 153、179；`GameChrome.module.css` 31
- 著色色票 2px：`ColoringPalette.module.css` 42；著色主鈕 6／8／2px：`ColoringCover.module.css` 159、173、178
- 消消樂開始 8px：`CandyMatchView.module.css` 191；地圖開始 5px：`CandyMatchMap.module.css` 327
- 方塊轉轉開始 8px：`BlockDropTitle.module.css` 178（隱藏）
- 景點 4px／3px：見上表
- 宇宙地圖控制 3–5px：`components/universe/MapControls.module.css` 29、56、67；島選擇列 `IslandPickerStrip.module.css` 62–75

按下的動作也不統一：DESIGN 規定 `scale(0.98)` 或透明度，避免厚底下沉。著色主鈕用 `translateY(2px)` 把底邊吃掉（`ColoringCover.module.css` 176–178）。遊樂園圓鈕用放大，不是縮小。

- 嚴重：高（動線上的主鈕）、中（硬底邊厚度）。
- 建議規則：主行動全站一種墨鈕。硬底邊只留在「孩子正在玩」的表面，厚度固定 4px，按下只收成 2px，不另做 5／6／8。遊樂園封面圓鈕用柔影，不呼吸 `box-shadow`（`playFabBreathe` 同時動畫了 `box-shadow`，見第 9 節）。

---

## 4. 圓角、陰影、間距

- 嚴重：中（遊戲卡面），低（其餘裸值）。
- 網站新元件大多用 `--radius-*` 與 `--elev-*`。遊戲 CSS 的圓角 token 採用率是 0%：`CandyMatchPlay.module.css`、`CandyMatchMap.module.css`、`DinoSushiKitchen.module.css`、`BlockDropMap.module.css`、`BlockDropTaskBar.module.css`（見 design-token 報告）。
- 方塊本體 `borderRadius: 7`（`blockDropTheme.ts` 151），不在 8／14／20 階梯上。聖經 §2 已寫明這是方塊轉轉的現況。
- 同檔面板 `borderRadius: 18`（113）、按鈕 999（86、103）。18 介於 `--radius-sm` 14 與 `--radius-md` 20 之間。
- 消消樂卡面自己寫 `border-radius: 28px`（`CandyMatchView.module.css` 15），數值等於 `--radius-lg`，但沒有用 token，陰影是 `0 22px 46px` 不是 `--elev-*`。
- 間距：遊戲檔大量裸 px。DESIGN 說既有 px 只在改到那一行時就近換 token，rem 不換。這次不把 33% 當成缺陷清單。
- 建議規則：遊戲外框圓角改呼 `--radius-lg`／`--radius-xl`。方塊 7px 與硬底邊一起凍結在「局內美術」名單，不外溢到網站卡片。新的遊戲面板不要再出現 18px 這種階梯中間值。

---

## 5. 字型

- 嚴重：中。
- 網站標題／內文的堆疊是對的。遊戲為了少下載全站中文，在 `GamePageShell.module.css` 3–15 另掛 `candyHuninn`／`candyGensen`，進局後才切（30–61）。這是效能子集，字形家族與全站相同。
- 消消樂卡面寫 `var(--font-sans, "PingFang TC", …)`（`CandyMatchView.module.css` 18）。`--font-sans` 在 `globals.css` **沒有定義**。方塊轉轉 HUD 同一寫法：`components/games/BlockDropView.tsx` 78。聖經 §2 已點名方塊轉轉會掉到蘋方／微軟正黑體。消消樂公開頁也走這條 fallback，除非外層 shell 的 `font-family: var(--font-stack-body)` 碰巧繼承到。卡面自己又指定了 `--font-sans`，繼承不可靠。
- 留言輸入 `components/feedback/FeedbackForm.module.css` 28、留言牆暱稱／內文／頭像 `FeedbackWall.module.css` 86、130、144：只有蘋方、正黑、Noto，沒有 Fredoka／粉圓。工作室審核 `FeedbackModerationPanel.module.css` 190–193 用系統黑體，註解寫明 UGC 不混粉圓。
- 播放器提示碼 `StoryPlayer.module.css` 941：`ui-monospace, "SF Mono", Menlo`。這是給時間碼／除錯字串，不是故事字幕。
- 裸字級：報告裡 14px×12、15px×11、12px×7、18px×7、20px×7，多在遊戲。全站 `--fs-meta` 是 0.78rem（約 12.5px），沒有 14／15px 這一階。
- 建議規則：公開遊戲改 `var(--font-stack-body)`／`var(--font-stack-display)`，需要子集時覆寫這兩個變數（shell 已經這樣做），刪掉未定義的 `--font-sans`。留言 UGC 維持系統黑體，在聖經登記為「使用者投稿，不套品牌圓體」。播放器字幕繼續品牌圓體，等寬字只留在非兒童的提示碼。

---

## 6. 圖示與 emoji

- 嚴重：中。
- 網站介面圖示是 `components/ui/Icon`：24 格、線寬約 2、`currentColor`（DESIGN「介面圖示」）。頂欄、返回、主題切換走這套。
- 遊戲另有 `components/games/ClayIcons.tsx` 4–7、40：線寬 2.4，星星／火焰等內建糖果色（火焰預設 `#ff8a5c`，67）。遊樂園卡片的玩法鈕經 `components/games/GamePlayIcon.tsx` 用這套，所以**網站頁上的圓鈕**和**局內 HUD** 是同一套黏土圖示，和頂欄漢堡不是一套。
- 文字當圖示，DESIGN 已禁止，仍留在孩子看得到的地方：
  - `components/games/CandyMatchMap.tsx` 323：`★ 怎麼拿三星？`
  - 同檔 385 一帶站點蓋章用文字 `✓`（稽核掃描命中；線性 `check` 已存在）
  - `components/StoryCuePanel.tsx` 59：`已複製 ✓`（播放器提示，家長／內部）
- 裝飾星號 `✦`／`✧`：`components/celebration/StarBurst.tsx`、`lib/celebration-dom.ts` 20、`components/universe/HotspotLayer.tsx`、`ZoneSheet.tsx`。這是慶祝粒子，不是按鈕圖示。
- Emoji 還在資料裡，多數不再畫到畫面上：`data/games.ts` 53、79、105 的 🍭🍣🖍️ 會被塞進 `GameEndStation` 的資料物件（`components/games/GameEndStation.tsx` 115），註解寫主視覺改走 ClayIcons。故事卡不渲染 `story.emoji`。家長文章 `data/parent-articles.ts` 仍有 🔸🎉🌋🚦 等，那是文章正文。
- `lib/gamekit/progress/garage.ts` 10–14 還有車種 emoji，沒有 tsx 在引用。
- 建議規則：兒童可見的「★」「✓」「✕」改 `Icon`。遊樂園圓鈕可以繼續用 ClayIcons（它坐在封面上），頂欄與文字連結只用 `Icon`。資料層 emoji 不再傳進 UI props。家長文章的 emoji 視為內文，不拿來當介面圖示。

---

## 7. 插畫與資產

聖經 §2 寫上線三種畫風：暖色粉彩黏土、著色黑線、消消樂／壽司的「黏土語彙向量 SVG」。程式已經多走了幾步，聖經有兩句過期。

| 表面 | 現在的畫法 | 和封面黏土的關係 |
|------|------------|------------------|
| 首頁四段、故事插畫、角色定裝 `public/characters/`（36 張 jpg）、宇宙島 `public/adventures/zones/car-park.png` | 暖色粉彩黏土照片／繪圖 | 黃金樣本 |
| 遊樂園 hub `public/games/v2/hub/hero-*.webp`、三款封面 | 同一套黏土 | 一致 |
| 著色線稿 | 純黑粗線、白底 | 故意第二套。入口封面仍是上色黏土（`game_coloring_light_*.png`） |
| 多多與六位客人 | 黏土貼紙 WebP，1024、透明、輪底 92% | 和壽司封面同一套。`public/games/v2/dino-sushi/duoduo/`、`customers/{xiaohong,anan,ale,lingling,dongdong,xiangxiang}.webp` |
| 壽司食物與店面道具 | **也是黏土 WebP**（`lib/games/dino-sushi/art.tsx` 9–30、`public/games/v2/dino-sushi/food/`、`shop/`） | 聖經仍寫「向量 SVG」。店面天空罩還是 CSS 漸層（`DinoSushiShop.module.css` 16–41） |
| 消消樂棋子 | 程式 SVG 正面車臉，高飽和填色（`CandyMatchPieceArt.tsx` 1–6；例如車身 `#ff7a9c`、`#6fc3f0`、`#c9a8ff`） | 語彙叫黏土，材質是向量平塗。淡紫恐龍車不是多多正典（DESIGN 已寫） |
| 消消樂關卡圖 | `public/games/v2/candy-match/places/*.webp` 黏土場景 | 和棋子不是同一種渲染 |
| 景點情境 | 程式 SVG，不畫車、人不畫字 | 第三種「向量黏土」 |
| 方塊轉轉 | CSS 圓角方塊，封面 WebP 仍在 `public/games/v2/block-drop/cover.webp` | 隱藏。路由 `lib/retired-game-redirects.ts` 11 |
| Game Kit 像素 | `palette.ts`、程序圖表 | 未上線 |

多多眉毛：貼紙與封面是暖棕粗眉；`public/characters/恐龍車多多.jpg` 是黑眉。聖經 §2.1 已拍板以暖棕為準，不要用定裝照去改貼紙。角色圖鑑仍會讓家長看到黑眉版。這是已決定的例外，不是待修 bug。小紅車身的「2」仍是圖內文字的唯一例外。

- 嚴重：高（消消樂向量車 vs 黏土封面／壽司貼紙）、中（聖經過期、定裝照眉毛）、低（隱藏方塊、未使用像素盤）。
- 建議規則：對外畫風收成兩句——「故事、封面、壽司角色與食物＝黏土照片／貼紙」「著色＝黑線」。消消樂棋子與景點情境標成「向量黏土」，新圖不得再增加第五種。不要把壽司 WebP 改回 SVG。不要重畫多多。方塊轉轉封面留在 `public/` 但路由維持隱藏，hub 不要放回第四張卡。

遊樂園排版也和 DESIGN 差一拍：DESIGN 仍寫四卡、＜980 為 2×2、≥980 四欄。`app/games/page.tsx` 90–95 只有著色、消消樂、壽司三站。`app/games/page.module.css` 71–83 是兩欄，≥980 三欄。手機上第三張會自己一列。

---

## 8. 分頁

以下依截圖與程式。日間第一屏都已拍到。

### 首頁 `/`

黏土滿版、底部深墨長句 CTA、桃色頂欄。和聖經的「插畫主導、chrome 讓位」一致。桌面與手機是同一段式全螢幕，不是另一套版型。`home_light_mobile.png`、`home_light_desktop.png`。

### 故事 `/story/ep-32`

選 ep-32（換牙／多多）因為它有完整插畫；最新 ep-35 目錄裡 `pageCount` 為 1，看不出插畫系統。版面是白底、封面、深色主鈕、青綠連結。桌面 ≥980 封面在右（`episode_ep32_light_desktop.png`）。主鈕色見 §2.2，不跟首頁那顆墨鈕相同家族以外的「每集染色」。

### 關於 `/about`

單欄、白底、馬米定裝照、深墨返回與連結。最接近 token 化的內容頁（`app/about/page.module.css` 字級與色彩 100% token）。`about_light_mobile.png`、`about_light_desktop.png`。

### 遊樂園 `/games`

黏土海報＋三張封面卡＋彩色圓鈕。海報與封面是黏土；圓鈕的 accent 依遊戲換成粉／薄荷／天藍（`data/games.ts` 54、80、106）。`games_hub_light_mobile.png`、`games_hub_light_desktop.png`。

### 繪本塗塗鴉

入口是上色黏土封面＋磚紅硬底邊鈕（`game_coloring_light_*.png`）。進到畫布才是黑線白紙。兩段畫風是故意的，按鈕色是已登記例外。

### 車車消消樂

封面是黏土，下面的主鈕變成黃圓硬底邊，卡面奶油（`game_candy_light_*.png`）。局內棋子再換成向量車。一條動線三種材質。

### 多多壽司屋

封面與標題頁是黏土，主操作進店後是貼紙＋ WebP 食物（`game_sushi_light_*.png`）。綠色主行動只在店內。和消消樂的黃鈕並排時，遊樂園沒有共同的「開始」色。

### 其他會被看到、這次沒逐頁截圖的表面

- 播放器近黑 `#000000`（`StoryPlayer.module.css` 14–23）。DESIGN 允許播放器黑底。夜間頁底是 `#141312`，只有播放器走到純黑。VISUAL-ACCEPTANCE 的「夜間背景不是 `#000`」對播放器要標例外。
- 宇宙地圖印刷淺色，夜間不反轉（allowlist）。和網站暖炭黑並存是 DESIGN 紅線，不是漏做。
- 親子景點奶油頁＋硬底邊情境卡，見 §2.5、§3。
- 留言牆字型見 §5。

---

## 9. 動效

技術規範允許的動畫屬性是 `transform`、`opacity`、`stroke-dashoffset`、`offset-distance`。全庫 CSS `@keyframes` 裡，真正動到別的屬性的有 11 個：

| 檔案 | 動畫 | 動了什麼 |
|------|------|----------|
| `app/games/page.module.css` | `playFabBreathe` | `box-shadow`（同時有 scale） |
| `components/games/CandyMatchBoard.module.css` | `candySweepColor`、`candySweepBoard` | `filter` |
| `components/games/DinoSushiKitchen.module.css` | `sushiGlow` | `outline` |
| `components/games/DinoSushiShop.module.css` | `beltScroll` | `background-position-x` |
| `components/games/DinoSushiShop.module.css` | `domePopLife` | `animation-timing-function` |
| `components/games/DinoSushiStickerBook.module.css` | `newRing` | `box-shadow`（綠環 `#5fbf85`，241–245） |
| `components/universe/ZoneIsland.module.css` | `islandLightUp`、`clayFlash`、`clayFlashSoft` | `filter` |
| `components/universe/ZoneMotionPart.module.css` | `motionSprite` | `background-position` |

- 嚴重：低到中。沒有用 `left`／`top` 在搬位置的關鍵幀；違規是濾鏡、陰影、背景位置。
- 壽司迴轉帶 `beltScroll` 是常駐動畫。減少動態時店面有停帶的路徑（聖經 §2.1、shop CSS 註解）。`playFabBreathe` 在 `prefers-reduced-motion` 的覆蓋要單獨確認：它讓第一張遊戲卡持續放大，孩子的第一眼焦點在呼吸，而 DESIGN 的按壓是縮小。
- 建議規則：新動畫只留 transform／opacity。既有 `filter` 閃光與迴轉帶背景位移列進「已存在的局內動畫」名單，不複製到網站 chrome。遊樂園圓鈕的呼吸改成只動 `transform`，或只在第一次進頁播一輪。

---

## 10. 日夜

夜間 token 是暖炭黑，不是純黑，頂欄故意不反轉（`SiteNavBar.module.css` 5–6）。截圖對得上：

- 關於頁夜間整頁變炭黑：`about_night_mobile.png` 中段取樣約 rgb(20, 19, 18)，接近 `--bg` `#141312`。
- 首頁夜間仍是滿版黏土，頂欄維持桃色：`home_night_mobile.png` 頂列約 rgb(241, 234, 228)。夜色主要吃在遮罩，不是把插畫反相。
- 故事頁夜間字與頁底變了，封面圖不變：`episode_ep32_night_mobile.png`。
- 消消樂與壽司夜間：頁緣／外框是炭黑（約 rgb(18, 17, 17)），卡面仍是淺奶油（消消樂中段約 rgb(245, 245, 252)，壽司約 rgb(254, 246, 230)）。`game_candy_night_mobile.png`、`game_sushi_night_mobile.png`。這就是「卡面鎖日間」加上「外框跟全站夜間」叠在一起。

睡前 19:00–06:00 在主題為 `system` 時會自動進夜間（`lib/bedtime.ts` 1–8）。家長晚上開站，會直接看到淺色遊戲卡浮在炭黑外框上。

播放器 `--ambient: #000000` 比夜間頁底更黑。

- 嚴重：高（遊戲淺卡＋炭黑外框）、低（播放器純黑已登記、頂欄不反轉已登記）。
- 建議規則：遊戲路由的頁底在夜間改鎖奶油／`--surface-game`，讓外框和卡面同一色族；網站其他頁維持暖炭黑。不要為了統一把棋盤、壽司舞台、著色紙改成夜色。播放器維持近黑，在驗收清單標成例外。

---

## 11. 閘門為什麼沒擋住這些

`scripts/lib/hardcoded-color-audit.ts` 的 allowlist 蓋住播放器、宇宙地圖、消消樂、方塊轉轉、壽司、著色畫布、景點地圖針、Landing。所以 `audit:colors` 全綠時，第 2–3 節的遊戲色票仍然合法。TSX／TS 裡的 hex（`blockDropTheme.ts`、`ColoringToolbarIcons.tsx`、`episode-colors.ts`）不在這個掃描裡。

- 嚴重：低（流程），但它讓「統一」無法靠現有 CI 維持。
- 建議規則：允許名單維持「舞台美術色」。另外加一條：`--cta-solid-bg`、`--landing-brand`、`--accent` 不得在遊戲 CSS 裡被另一個 hex 覆寫，除非檔名在「著色磚紅」例外。每集色改成 token 之後，`episode-colors.ts` 只准引用 token。

---

## 12. 截圖清單

產物目錄：`/opt/cursor/artifacts/screenshots/`。第一屏，不是整頁長圖。

| 檔名 | 頁面 |
|------|------|
| `home_light_mobile.png`／`home_light_desktop.png` | 首頁日間 |
| `home_night_mobile.png`／`home_night_desktop.png` | 首頁夜間（頂欄仍桃色） |
| `episode_ep32_light_mobile.png`／`episode_ep32_light_desktop.png` | `/story/ep-32` |
| `episode_ep32_night_mobile.png` | 同一集夜間 |
| `about_light_mobile.png`／`about_light_desktop.png` | 關於 |
| `about_night_mobile.png` | 關於夜間 |
| `games_hub_light_mobile.png`／`games_hub_light_desktop.png` | 遊樂園 |
| `games_hub_night_desktop.png` | 遊樂園夜間 |
| `game_coloring_light_mobile.png`／`game_coloring_light_desktop.png` | 繪本塗塗鴉 |
| `game_candy_light_mobile.png`／`game_candy_light_desktop.png` | 車車消消樂 |
| `game_candy_night_mobile.png` | 消消樂夜間（淺卡＋暗外框） |
| `game_sushi_light_mobile.png`／`game_sushi_light_desktop.png` | 多多壽司屋 |
| `game_sushi_night_mobile.png` | 壽司屋夜間 |

方塊轉轉未截圖。直接開 `/games/block-drop` 會轉回遊樂園。

---

## 13. 請 Kaiyi 決定

下面每一題都是選擇，不是實作。大改（重畫棋子、改架構、刪功能）只列在選項裡。推薦項是這次稽核的建議，可以整題否決。

### 1. 主按鈕用哪一種？

- A. 全站唯一主按鈕改回深墨 `#3A2410`（含故事「開始看故事」、消消樂開始、壽司的主要送出）。著色磚紅維持例外。
- B. 維持現況：網站深墨、故事頁每集色、遊戲黃圓、壽司綠、著色磚紅。
- C. 改以消消樂的黃圓硬底邊當全站主鈕，首頁與故事頁跟著改。
- D. 另做一組新的主色（要重畫介面，這輪不做）。

推薦 **A**。聖經已經寫深墨是唯一主按鈕，現在裂開的是後來的遊戲鈕和 `PlayButton`。

### 2. 每集 `story.color` 還要不要？

- A. 廢除。EP 膠囊維持固定淡紫，主鈕不再染色，縮圖不加每集色塊。
- B. 留下，但只在 `--c-pink/yellow/mint/sky/teal/lilac` 六色輪替，當 18% 墊色，不當按鈕底。ep-13 之後的 `#7048e8` 廢除。
- C. 維持現況（12 集飽和色、23 集同一紫）。

推薦 **B**。列表需要一點分別，但不需要一套聖經外的飽和色，也不需要 23 集長得一樣紫。

### 3. 硬底邊厚度？

- A. 遊戲、著色、景點情境卡的硬底邊一律 4px，按下收成 2px。其餘頁面維持 `--elev-*` 柔影。
- B. 維持現在的 2／3／4／5／6／8px，各表面自己記在文件裡。
- C. 全站改成硬底邊黏土鈕。

推薦 **A**。硬底邊要留，厚度先收成一種，孩子才學得會「這顆按得下去」。

### 4. 畫風收到幾套？

- A. 對外兩套：黏土照片／貼紙，加上著色黑線。消消樂向量車與景點程式 SVG 標成待收斂的向量黏土，這輪不重畫。
- B. 正式承認四套並寫進聖經：黏土照片、黑線、向量黏土（消消樂棋子＋景點）、隱藏的 CSS 方塊。之後新圖只能落在這四套。
- C. 消消樂棋子與景點情境改成和封面同一套黏土貼紙（重畫，這輪只當提案）。

推薦 **B** 當文件、**C** 不當這輪工作。先停止第五套出現；重畫棋子是另一個專案。壽司已經是貼紙，不要畫回去。

### 5. 圖示用哪一套？

- A. 兒童看得到的介面（含遊樂園圓鈕、局內 HUD）全部改 `components/ui/Icon`。
- B. 頂欄與文字連結用 `Icon`；坐在封面上的遊樂園圓鈕與局內 HUD 繼續 `ClayIcons`。文字「★」「✓」改圖示。
- C. 做一套新的共用圖示，同時有細線與黏土填色（新元件，這輪不做）。

推薦 **B**。圓鈕是貼在插畫上的，細線漢堡圖示放上去會更跳。文字星星和勾勾則沒有理由留著。

### 6. 遊戲與留言的字？

- A. 連留言投稿、播放器提示碼都改粉圓／源泉。
- B. 公開遊戲改用 `--font-stack-body`／`--font-stack-display`（子集可以留），刪掉未定義的 `--font-sans`。留言投稿與審核維持系統黑體。
- C. 維持現況，包含消消樂卡面的蘋方 fallback。

推薦 **B**。子集是為了載入，不是為了另一種字。投稿維持系統字是已經寫在註解裡的理由。

### 7. 夜間的遊戲頁底？

- A. 維持淺色遊戲卡浮在炭黑外框上。
- B. 遊戲路由的頁底夜間改鎖奶油色，和卡面同一色族。其他頁面仍是暖炭黑。棋盤、店面、著色紙不改成夜色。
- C. 為遊戲卡面做一套降飽和的夜間版。

推薦 **B**。夜色應該發生在「離開遊戲的網站」，不該在遊戲卡的四邊露出一圈另一個產品。

### 8. 隱藏的方塊轉轉？

- A. 路由繼續轉回遊樂園。程式與 `cover.webp` 留著，這次統一不動它。
- B. 雖然隱藏，仍把色票與按鈕改成和第 1、3 題相同的規則，避免以後打開又是一套。
- C. 刪掉畫面程式與公開封面（會動到轉址與資產，這輪只當提案）。

推薦 **A**。孩子現在進不去。不要為了一個隱藏遊戲改玩法檔，也不要在沒有決定「它還會不會回來」時刪掉。

### 9. 風格聖經要不要先改對齊程式？

- A. 更新聖經：壽司食物與店面是黏土 WebP；遊樂園是三款、桌面三欄；頂欄填色是 `#fff8f2`；`--font-sans` 標成未定義。不改畫面。
- B. 把壽司改回聖經寫的向量 SVG，頂欄改填 `#ff8c2b`，讓程式遷就文件。

推薦 **A**。文件落後於已上線的壽司貼紙。先改文件，才不會下一輪把 WebP「修」回 SVG，或把桃色頂欄塗成品牌橘。

### 10. 多多的臉以哪一張為準？

- A. 維持 2026-10-13 的決定：遊戲貼紙與封面的暖棕粗眉為準；角色圖鑑的黑眉定裝照不拿來改貼紙，圖鑑也不重拍。
- B. 角色圖鑑改以暖棕眉為準（要重拍定裝，這輪只當提案）。
- C. 遊戲貼紙改回黑眉定裝（先前已否決）。

推薦 **A**。這題是確認統一工程不要重開已拍板的角色。圖鑑與遊戲並存兩張臉，直到你主動要重拍。

---

## 14. 已拍板（2026-10-22）

Kaiyi：1A、2B、3A、4B、5B、6B、7B、8A、9A、10A。第 1 題 A 本來就是推薦。

| 題 | 決定 | 落地 |
|----|------|------|
| 1A | 唯一主按鈕深墨 `#3A2410` | `PlayButton`、故事結束「再聽一次」、消消樂開始、壽司「給多多吃」、載入器開始。著色維持磚紅 |
| 2B | 每集色只當六色粉彩墊色 | `data/episode-colors.ts` 輪替 `--c-*` 日間色碼。不當按鈕底 |
| 3A | 硬底邊 4px，按下 2px | 遊戲、著色、景點情境卡與位置觸發鈕。其餘仍是柔影 |
| 4B | 正式四套畫風，不開第五套 | 風格聖經 §2 |
| 5B | 頂欄用線條 `Icon`；封面與局內留黏土圖示 | 文字「★」「✓」改 `Icon` |
| 6B | 公開遊戲用站上字級與字體堆疊 | 刪掉消消樂未定義的 `--font-sans`。留言維持系統黑體。方塊轉轉的 `--font-sans` 不動 |
| 7B | 遊戲路由夜間頁底鎖奶油 | 消消樂、壽司屋、著色本。棋盤、店面、著色紙不改夜色 |
| 8A | 方塊轉轉維持隱藏、這輪不改 | 程式與封面都留著 |
| 9A | 聖經對齊已上線的畫面 | 壽司是黏土 WebP；公開遊戲三款；頂欄是 `#fff8f2` |
| 10A | 多多暖棕粗眉為準 | 不重畫貼紙、不重拍黑眉定裝 |
