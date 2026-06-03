# TODOS

> **成長主戰場（2026-06 共識）：** **A** Spotify／Apple 等平台收聽與訂閱 · **B** Threads／IG 短內容導流。  
> 官網定位：每集可分享的落地頁 + 訂閱轉換中心；「看圖聽故事」為差異化體驗，不與平台搶完整收聽。

---

## 成長（平台 A + 社群 B）

實作建議順序：**1 → 2 → 3 → 4 → 5 → 7**；第 6 項為營運節奏，可不寫程式。

### 每集「社群分享包」（OG 圖 + 分享鈕）

**What:** 故事詳情頁 `/story/[slug]` 支援每集專屬 Open Graph／Twitter 預覽圖（封面 + 標題 + EP），並加「分享這集」（複製連結；可選 LINE 分享文案模板）。

**Why:** B 戰場每則貼文需固定連到單集；分享預覽像節目單元而非通用吉祥物，點擊率較高。

**Context:** 目前 `app/layout.tsx` 全站 OG 多為 `/mascot.png`；`lib/story-metadata.ts` 可擴充每集 `openGraph.images`。參考 `storyCoverPath(slug)`。

**Effort:** M  
**Priority:** P1  
**Depends on:** `NEXT_PUBLIC_SITE_URL` 正式網域（分享預覽絕對網址）

### 試聽片段 → 平台訂閱橋接

**What:** 單集頁在「看圖聽故事」前後加入 30～60 秒試聽（或精華段），並突出 CTA：「在 Spotify／Apple Podcasts 聽完整版並訂閱」。

**Why:** 社群點進官網的人先感受聲音氣質，再導去平台，有利 A 的收聽與訂閱轉換。

**Context:** 音檔可裁切 `public/stories/<slug>/` 預覽檔，或播放器內限制 `currentTime`；ConnectHub 已集中平台連結。Spotify／Apple 按鈕應最顯眼。

**Effort:** M  
**Priority:** P1  
**Depends on:** None

### 首頁「入門三集」與本週更新提示

**What:** 首頁新增「第一次來？從這三集開始」精選區（可手動在 `data/stories.ts` 或設定檔標記 `featured`）；最新集 Hero 旁補「本週更新」等節奏文案。

**Why:** A 平台新聽眾常從單集進入，官網需降低選擇成本；固定更新感有助訂閱期待。

**Context:** 現有 `LatestHero`、`StoryFilter`；精選集需定義選取規則（主題標籤或手動 slug 列表）。

**Effort:** S  
**Priority:** P1  
**Depends on:** None

### ConnectHub 訂閱文案與平台排序

**What:** 頁尾「訂閱收聽」區加一句價值說明（例：訂閱後新集會自動出現在 Podcast App）；平台圖示順序以 Spotify、Apple Podcasts 為優先。

**Why:** 對齊 A 戰場多數聽眾習慣；家長一眼懂「為什麼要按訂閱」。

**Context:** `components/ConnectHub.tsx`、`lib/platforms.ts` 陣列順序；SoundOn／RSS 已移除，勿再加回除非策略改變。

**Effort:** S  
**Priority:** P2  
**Depends on:** None

### 主持人信任區（Bonbon & 馬米）

**What:** 關於頁或首頁下半新增主持人小卡：照片、各一句話、節目理念（為什麼做親子車車故事）。

**Why:** 熱門節目靠人格溫度；B 長文／置頂貼可連到同一區，減少每則貼重複自我介紹。

**Context:** `app/about/page.tsx` 最自然；素材需主持人照片與核准文案。

**Effort:** S  
**Priority:** P2  
**Depends on:** 照片與文案

### 每集上線「社群貼文腳本」（營運 checklist）

**What:** 在 `README.md` 或 `docs/` 新增每集 SOP：① 預告 ② 上線貼（官網單集 URL）③ 平台訂閱提醒 ④ 15 秒幕後再導連結。

**Why:** B 靠固定節奏與固定入口；不靠網站多加頁面。

**Context:** 非必須寫 React 元件；與工程並行，發片時貼上同一套連結格式。

**Effort:** S  
**Priority:** P2  
**Depends on:** 每集分享包（OG + 分享鈕）完成後定稿 URL 格式

### 輕量數據（官網點擊 + 平台後台）

**What:** 官網加簡易 analytics（例：哪集頁瀏覽、分享鈕點擊）；並定期對照 Spotify／Apple 後台完聽率、訂閱來源集。

**Why:** 下一集選題（車種、主題）依數據而非猜測。

**Context:** 需選工具（Plausible、GA4、Vercel Analytics 等）並注意親子內容隱私；可先做無 cookie 方案。

**Effort:** M  
**Priority:** P3  
**Depends on:** 分享鈕與單集頁穩定

### 延後（A+B 現階段不優先）

| 項目 | 原因 |
|------|------|
| Email 電子報 | 平台 App 已有新集通知；先用 Threads 導流 |
| 著色頁／活動單 PDF | IP 成熟後再做，先拉高單集分享率 |
| 部落格長文 SEO | 初期單集頁 + 平台關鍵字效益較直接 |
| 網站內 RSS 播放器 | 訂閱導向 Spotify／Apple 即可 |
| 睡前模式／季節主題皮 | 溫馨感加分，但不擋 A+B 主線 |

---

## 內容

### 替換真實多頁插畫

**What:** 將各集 `public/stories/<slug>/` 的佔位圖換成官方 podcast 插畫，並視需要提高 `pageCount`。

**Why:** 目前多數集數只有一張圖配多句字幕；真實繪本能強化「看圖聽故事」的睡前儀式感。

**Context:** `data/stories.ts` 的 `pageCount` 與 `01.jpg`～`NN.jpg` 需對齊。若仍是一圖多句，`captions` 長度可大於 `pageCount`，播放器會重複使用封面（見 `app/story/[slug]/play/page.tsx`）。

**Effort:** M  
**Priority:** P1  
**Depends on:** 取得 Bonbon & 馬米授權的插畫素材

### 壓縮 podcast 音檔

**What:** 用 ffmpeg 將每集 `audio.mp3` 壓到 mono 128kbps，目標單檔 < 5MB。

**Why:** 目前 6 集合計約 35MB+，行動網路進入播放頁載入慢。

**Context:** 指令見 `README.md`「音檔體積建議」。壓縮後需在本機播放確認音質可接受，再覆蓋原檔。

**Effort:** S  
**Priority:** P2  
**Depends on:** None

### 本集「給家長的小提示」

**What:** 故事詳情頁加 1～2 句家長向說明（本集可聊什麼、適合年齡），資料可放在 `data/stories.ts`（如 `parentNote` 欄位）。

**Why:** 提升信任與專業感，利於 A 平台家長聽眾訂閱決策。

**Context:** 與播放器內「家長設定」互補；文案需 Bonbon & 馬米確認。

**Effort:** S  
**Priority:** P2  
**Depends on:** None

## 產品

### 設定正式站網域（NEXT_PUBLIC_SITE_URL）

**What:** 在 Vercel（或部署平台）設定 `NEXT_PUBLIC_SITE_URL=https://正式網域`。

**Why:** Open Graph / Twitter 分享需絕對網址；未設定時本機建置會 fallback 到 `localhost`。

**Context:** `app/layout.tsx` 已讀取此變數；Vercel 未設定時會用 `VERCEL_URL` 作為 fallback。**每集 OG 與社群分享包依賴此項。**

**Effort:** S  
**Priority:** P1  
**Depends on:** 確認 production 網域

### Podcast 結構化資料（JSON-LD）

**What:** 在 layout 或單集頁輸出 `PodcastSeries`／`PodcastEpisode` schema.org JSON-LD。

**Why:** 協助搜尋引擎理解節目與單集，對齊 A 戰場被發現需求。

**Context:** 欄位需對應 `data/stories.ts` 標題、日期、音檔 URL、`metadataBase`。

**Effort:** S  
**Priority:** P2  
**Depends on:** `NEXT_PUBLIC_SITE_URL`

### 社群連結維護（lib/social.ts）

**What:** 在 `lib/social.ts` 維護 Instagram／Threads URL；頁尾由 `ConnectHub` 讀取，url 留空則自動隱藏。

**Why:** B 戰場導流；避免在元件內硬編碼多處連結。

**Context:** ~~`SiteFooter` 的 `SOCIAL_LINKS`~~ 已改為 `ConnectHub` + `lib/social.ts` 單一來源。

**Effort:** S  
**Priority:** P2  
**Depends on:** None

## 工程

### Service Worker 離線快取

**What:** 為 PWA 加入 service worker，快取已播放過的故事音檔與插圖。

**Why:** 已有 `manifest.json` 與主畫面圖示，但無離線能力；睡前場景常見弱網。

**Context:** 可評估 `next-pwa` 或自寫最小 SW；需注意 MP3 快取容量與更新策略。

**Effort:** M  
**Priority:** P3  
**Depends on:** None

### Playwright E2E smoke

**What:** 加入首頁 → 詳情 → 播放頁的 smoke test。

**Why:** 目前只有 `data/stories.ts` 單元測試；路由與播放器需回歸保護。

**Context:** 播放需 mock 或 headless 中跳過實際 audio decode；至少驗證頁面渲染與連結。

**Effort:** M  
**Priority:** P3  
**Depends on:** None

### ESLint CI 設定

**What:** 將 `next lint` 改為非互動 ESLint 設定，並可接入 CI。

**Why:** 目前 `npm run lint` 會跳出首次設定精靈，無法在 CI 使用。

**Context:** 依 Next.js 15 文件新增 `eslint.config.mjs` 與 `@next/eslint-plugin-next`。

**Effort:** S  
**Priority:** P3  
**Depends on:** None


## 官網成長（成功 Podcast 官方站參考）

> 成熟 podcast 官網常見投入方向，對照本站「親子、看圖聽故事、多平台收聽」。  
> **現況簡表：** ConnectHub ✅ · 每集詳情 + OG ✅ · `/topic/[tag]` ✅ · RSS `/feed.xml` ✅ · 看圖聽故事 ✅ · `ageRange` ✅

### 首屏：一秒懂、一秒訂

**What:** 強化首屏節目名片——一句話價值、最新一集置頂、明顯「收聽／播放」CTA，訂閱入口與 `ConnectHub` 視覺一致。

**Why:** 從社群或搜尋進站的人應在約 30 秒內能訂閱或開始聽。

**Context:** 已有 `LatestHero`、故事牆；可檢視副標是否清楚傳達「給誰聽、睡前幾分鐘」。

**Effort:** S–M  
**Priority:** P2  
**Depends on:** None

### 每集可分享的 Landing Page（持續優化）

**What:** 每集固定網址、專屬 title/description、OG 圖、大綱、主題標籤、年齡建議、收聽連結、相關集數。

**Why:** 平台頁 SEO 與品牌控制有限；官網每集一頁是轉發與搜尋的基本資產。

**Context:** `app/story/[slug]/`、`lib/story-metadata.ts`、`RelatedStories` 已有；可逐集檢查分享預覽與文案。

**Effort:** S（維護）  
**Priority:** P1  
**Depends on:** `NEXT_PUBLIC_SITE_URL` 正式網域

### 發現與回訪：找下一集

**What:** 強化「聽完還會再來」——主題／車種篩選、收藏與繼續收聽、相關推薦、新集通知路徑。

**Why:** 降低聽完一集就流失；親子節目常靠「下一集睡前故事」留存。

**Context:** 主題 tag 與 client 篩選、`FavoritesSection`、`ContinueBanner` 已有；可評估搜尋、系列頁、首頁「本週推薦」。

**Effort:** M  
**Priority:** P2  
**Depends on:** None

### 品牌與信任（家長向）

**What:** 完善關於我們、使用方式、適齡說明；必要時補隱私／兒童相關說明（若有分析、帳號、留言）。

**Why:** 家長會問「誰做的、適合我家孩子嗎」；信任影響收藏與長期訂閱。

**Context:** `app/about/page.tsx` 已有；可連結 `#connect`、補親子共聽建議與視覺一致性說明。

**Effort:** S  
**Priority:** P2  
**Depends on:** None

### 技術體驗：聽得順、載得快

**What:** 行動優先 UI、播放器可靠（進度、耳機中斷）、圖片與音檔優化、Core Web Vitals、字幕／無障礙（可縮放、對比）。

**Why:** 聽覺產品在網頁上的基本功；睡前場景多為手機與弱網。

**Context:** 見「壓縮 podcast 音檔」「Service Worker」；播放器在 `StoryPlayer`；已允許 viewport 縮放。

**Effort:** M（持續）  
**Priority:** P1–P2  
**Depends on:** None

### 成長與商業（依階段）

**What:** 依階段選做——SEO 結構化資料、社群導流 hub、周邊／活動、贊助 landing、多語等。

**Why:** 成功專案常逐步把官網從「連結集合」變成「成長與變現中樞」。

**Context:** 親子 IP 可先不做電商；贊助與活動 landing 可後補。

**Effort:** L（分項）  
**Priority:** P3  
**Depends on:** 營運階段

### 高 CP 值：平台點擊分析

**What:** 用 GA4 / Plausible 等追蹤「哪集詳情頁 → 點了哪個收聽平台」，必要時 UTM。

**Why:** 官網 hub 策略需知道家長實際從哪裡訂閱，才能優化按鈕順序與文案。

**Context:** `ConnectHub`、`PlatformLinks` 外連可加事件；注意隱私與兒童內容政策。

**Effort:** S–M  
**Priority:** P1  
**Depends on:** None

### 高 CP 值：Podcast 結構化資料（JSON-LD）

**What:** 在首頁與每集頁加入 `PodcastSeries` / `PodcastEpisode`（或 `CreativeWork`）JSON-LD。

**Why:** 改善 Google 對節目與單集的理解，利於搜尋與豐富摘要。

**Context:** 可對齊 `/feed.xml` 的標題、描述、音檔 URL、封面。

**Effort:** M  
**Priority:** P2  
**Depends on:** `NEXT_PUBLIC_SITE_URL`

### 高 CP 值：新集通知路徑（家長向說明）

**What:** 在訂閱區簡短說明「如何訂閱／用 RSS 收新集」；可選電子報或「家長信」。

**Why:** RSS 已有技術面；家長多數不熟悉 RSS，需白話引導。

**Context:** `ConnectHub` 已有 RSS 圖示；可加一兩句 FAQ 或連到關於頁錨點。

**Effort:** S  
**Priority:** P2  
**Depends on:** None

### SEO：主題與系列頁擴充

**What:** 延續 `/topic/[tag]`，視需要加系列頁、車種 hub 內容段落（非僅列表）、站內連結結構。

**Why:** 家長常依「勇氣、睡前、安全」等主題搜尋，主題頁是長尾流量入口。

**Context:** `generateStaticParams` 與 metadata 已具備；可補每主題一句家長向導語。

**Effort:** S–M  
**Priority:** P2  
**Depends on:** None

### 電子報／會員（可選，後期）

**What:** 新集 Email 通知或簡易會員（收藏同步、家長設定雲端備份等）。

**Why:** 部分成功親子 IP 用「家長信」提高回訪；非初期必備。

**Context:** 需後端或第三方（Buttondown、Mailchimp 等）與隱私同意。

**Effort:** L  
**Priority:** P3  
**Depends on:** 營運資源


## Completed

### 頁尾與關於頁資訊架構重整

**What:** ConnectHub 分開「追蹤我們／訂閱收聽」、圖示下顯示名稱；移除 SoundOn／RSS；關於頁車種 chip 用對應 emoji；減少首頁／關於頁重複訂閱區塊。

**Completed:** main @ b46379e 起

### 營運就緒：SEO、測試、文件（CEO 審核 B 方案 P1）

**What:** 每集 SEO metadata、音檔 preload 策略、播放器錯誤提示、README SOP、Vitest 單元測試。

**Why:** 讓站點可被分享/搜尋、載入更省流量、失敗有提示、新集可交接。

**Context:** 新增 `lib/story-metadata.ts`、`lib/story-utils.ts`、`data/stories.test.ts`、`README.md`。

**Effort:** M  
**Priority:** P1  
**Depends on:** None  

**Completed:** v1.1.0 (2026-06-01)


### 主題標籤篩選與 SEO 分類頁

**What:** 首頁主題 chip client 篩選、`/topic` 索引與 `/topic/[tag]` 靜態頁。

**Completed:** main @ 4d89422 起

### RSS Feed 與 ageRange

**What:** `/feed.xml` podcast RSS、`layout` alternates、ConnectHub／PlatformLinks RSS；故事 `ageRange` 與卡片／詳情顯示。

**Completed:** main @ 640ce5f 起

### ConnectHub 頁尾訂閱／追蹤區

**What:** 圖示卡片式「追蹤我們」「訂閱收聽」分區，取代文字 pill 連結列。

**Completed:** main @ 0b7b0f2 起

