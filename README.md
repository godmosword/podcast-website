# 車車遊樂園

Bonbon & 馬米親子 podcast《車車遊樂園》的官方 **看圖聽故事** 網站。Next.js 15 全靜態（SSG），零後端。

- **正式站（範例）：** [https://podcast-website-mu.vercel.app](https://podcast-website-mu.vercel.app)
- **版本：** [1.2.1](./CHANGELOG.md) — 詳見 [CHANGELOG.md](./CHANGELOG.md)
- **待辦與路線圖：** [TODOS.md](./TODOS.md)
- **授權：** 程式碼 [MIT](./LICENSE) · 節目內容與使用條款見 [DISCLAIMER.md](./DISCLAIMER.md)

## 功能概覽

| 功能 | 說明 |
|------|------|
| 故事牆 | 首頁網格列出全部分集；**依車車找故事**（車種 chip + `?vehicle=`）；主題見 `/topic` |
| 看圖聽故事 | 全螢幕播放器、字幕跟讀、進度與家長設定 |
| 主題分類 | `/topic`、`/topic/[tag]` 靜態頁（SEO） |
| 車種分類 | `/vehicles/[vehicle]` |
| 訂閱／追蹤 | 頁尾 `ConnectHub`（平台 + RSS） |
| RSS | [`/feed.xml`](./app/feed.xml/route.ts) podcast feed |
| PWA | `manifest.json`、主畫面圖示、繼續收聽／收藏（localStorage） |

## 本機開發

```bash
npm install
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)。

## 指令

| 指令 | 用途 |
|------|------|
| `npm run dev` | 開發伺服器 |
| `npm run build` | 正式建置（SSG） |
| `npm run start` | 執行建置結果 |
| `npm test` | Vitest 單元測試 |
| `npm run test:e2e` | Playwright E2E（若有設定） |
| `npm run font:subset` | 重新子集化中文字型（新增文案後執行） |
| `npm run sync:apple` | 從 Apple Podcast RSS 同步新集（見下方） |

## 部署

適合 Vercel、Netlify 等靜態/Edge 平台。建置後頁面預渲染，無伺服器需求。

**正式環境請設定：**

```bash
NEXT_PUBLIC_SITE_URL=https://你的網域
```

用於 Open Graph、Twitter 卡片、RSS 與站內絕對連結。未設定時建置可能 fallback 至 `localhost` 或 `VERCEL_URL`，分享預覽可能不正確。

## 新增一集故事（SOP）

> **SoundOn 新集：** 多數情況由 [Apple Podcast 自動同步](#apple-podcast-自動同步) 每日上架（`ep-N` slug、`pageCount: 1`）。以下為**手動**在 `manualStories` 新增完整繪本或多圖體驗時使用。

1. **建立資料夾**  
   `public/stories/<slug>/`  
   - `slug` 用英文小寫，與網址一致（例：`firetruck`）

2. **放入檔案**
   - `audio.mp3` — 該集音檔（建議 mono 128kbps，單檔 < 5MB）
   - `01.jpg` — 封面/第一頁插圖（若有更多頁：`02.jpg`、`03.jpg`…）

3. **編輯 `data/stories.ts`** — 在 `manualStories` 陣列加一筆：

```ts
{
  slug: "firetruck",
  ep: 7,                    // 比現有最大值 +1
  title: "標題",
  date: "2026-06-01",       // ISO 日期
  duration: "5:30",         // 選填
  vehicle: "消防車",
  emoji: "🚒",
  color: "#e03131",
  audio: "audio.mp3",
  pageCount: 6,             // 與 01.jpg～NN.jpg 張數一致
  summary: "一句話大綱",
  ageRange: "3–8 歲",       // 選填；內頁目前不顯示年齡，僅資料用
  tags: ["勇敢", "合作"],
  captions: [               // 選填：字幕跟讀，每句一行
    "第一句…",
    "第二句…",
  ],
},
```

4. **重生中文字型子集**（若新增了標題/大綱/字幕等新文字）

```bash
npm run font:subset   # 需要 /tmp/huninn.ttf，見「字型維護」
```

5. **驗證**

```bash
npm test
npm run build
```

6. **部署** — push 後 CI/平台自動建置即可。

### 檢查清單

- [ ] `slug` 與 `public/stories/<slug>/` 資料夾名稱一致
- [ ] `01.jpg` 存在且可在本機開啟
- [ ] `audio.mp3` 可在播放器播放
- [ ] `ep` 為目前最大集數 + 1
- [ ] `pageCount` 與插圖張數一致
- [ ] 詳情頁分享預覽正常（title / 描述 / 封面圖）
- [ ] 若有新中文字 → 已重跑 `npm run font:subset`
- [ ] `/feed.xml` 含新集（建置後抽查）

## Apple Podcast 自動同步

官網與 SoundOn **不會**自動連動；此管線只讀 **Apple Podcast** 公開 RSS（透過 iTunes Lookup，無需 API key）。

| 檔案 | 用途 |
|------|------|
| `data/apple-synced.json` | 由 sync 腳本追加的新集 metadata |
| `data/apple-sync-state.json` | 已處理的 RSS `guid` |
| `data/apple-sync.defaults.json` | 新集預設與上架框架；`overrides.<slug>` 可覆寫單集 |

**每日 GHA 新集上架框架（與官網現行版面一致）：**

- 資產：`public/stories/ep-N/audio.mp3` + Apple 封面 `01.jpg`
- 資料：`data/apple-synced.json`，`pageCount: 1`（單圖 MVP 播放器）
- 摘要：自動去除 SoundOn 託管尾註；內頁只顯示 EP + **時長**（不寫入 `ageRange`）
- 車種：標題含關鍵字時自動推斷（如「高鐵」→ 高鐵）；否則預設「其他」，可於 `overrides` 手動指定
- 首頁：進入故事列表、車種 chip 篩選、卡片無封面角標 emoji
- CI：通過 `npm test` 與 `npm run build` 後 commit push `main`

**本機預覽（不寫檔）：**

```bash
npm run sync:apple -- --dry-run
```

**實際同步：**

```bash
npm run sync:apple
npm test && npm run build
```

**GitHub Actions：** [`.github/workflows/sync-apple-podcast.yml`](.github/workflows/sync-apple-podcast.yml) 每天 UTC 01:00 執行；有新集時依上列框架上架，通過測試與 build 後 **commit 並 push 到 `main`**。若 repo 有 branch protection，需允許 `github-actions[bot]` 寫入。

新集 slug 規則：`ep-<集數>`（例：`ep-7`）。同步後若要完整看圖體驗：

1. 在 `public/stories/<slug>/` 補 `02.jpg`～`06.jpg`，並在 `data/apple-synced.json`（或 `apple-sync.defaults.json` 的 `overrides`）改 `pageCount` 與 `captions`
2. 有新中文文案時執行 `npm run font:subset`
3. push 後 Vercel 自動部署，抽查 `/feed.xml` 與播放器

## 專案結構

```
app/
  page.tsx              首頁（Hero、篩選、故事牆）
  feed.xml/route.ts     RSS podcast feed
  topic/                主題標籤索引與分類頁
  vehicles/[vehicle]/   車種分類頁
  story/[slug]/         故事詳情（SEO metadata）
  story/[slug]/play/    全螢幕播放器
  about/                關於我們
  fonts/                自託管中文字型子集（huninn woff2）
components/
  ConnectHub.tsx        頁尾追蹤／訂閱圖示區
  StoryFilter.tsx       首頁車種 chip 篩選
  VehicleClayIcon.tsx   車種 chip 黏土封面縮圖
  StoryWall.tsx         故事網格
  StoryMeta.tsx         內頁 EP + 時長
  decor/                SVG 裝飾
data/
  stories.ts            手動集 + apple-synced 合併
  apple-synced.json     GHA／sync 腳本寫入的新集
  apple-sync.defaults.json
scripts/
  sync-apple-podcast.ts Apple RSS 同步
  lib/apple-rss.ts      RSS 解析與摘要清理
  lib/apple-sync-profile.ts
  subset_font.py 等     字型子集、圖示產生器
lib/
  platforms.ts          收聽平台連結
  social.ts             社群連結
  feed.ts               RSS 產生
  site-url.ts           站點絕對網址
  story-metadata.ts     每集 SEO
public/stories/         每集音檔與插圖（含 `ep-N/` 同步目錄）
```

## 音檔體積建議

目前每集 MP3 約 4–7MB。若要優化行動載入：

```bash
# 需安裝 ffmpeg
ffmpeg -i audio.mp3 -codec:a libmp3lame -b:a 128k -ac 1 audio-optimized.mp3
```

播放器使用 `preload="metadata"`，進入播放頁才開始載入完整音檔。

## 字型維護（圓體中文）

中文用自託管的 **jf-open 粉圓（huninn）** 子集（`app/fonts/huninn-subset.woff2`，約 100KB）。拉丁與數字由 Baloo 2 提供。

**新增/修改文案後**，若出現先前沒用過的中文字，需重生子集：

```bash
curl -sL https://github.com/justfont/open-huninn-font/releases/download/v2.1/jf-openhuninn-2.1.ttf -o /tmp/huninn.ttf
npm run font:subset
# commit app/fonts/huninn-subset.woff2
```

子集腳本：`scripts/subset_font.py`（需 `fonttools`、`brotli`）。

## 視覺素材

- **裝飾：** `components/decor/`（SVG）
- **佔位插圖：** `scripts/gen_placeholders.py`
- **PWA / 吉祥物：** `scripts/gen_icons.py`
- **首頁 Hero：** `public/hero-home.jpg`

動效尊重 `prefers-reduced-motion: reduce`（`app/globals.css`）。

## 授權與免責

| 文件 | 說明 |
|------|------|
| [LICENSE](./LICENSE) | 網站**程式碼** MIT 授權 |
| [DISCLAIMER.md](./DISCLAIMER.md) | 節目內容版權、字幕說明、建議年齡、第三方連結、免責條款 |

Podcast 音檔、插畫與品牌內容屬 Bonbon & 馬米；再製或商業使用前請確認授權範圍。
