# 車車遊樂園

Bonbon & 馬米親子 podcast《車車遊樂園》的官方 **看圖聽故事** 網站。Next.js 15 全靜態（SSG），零後端。

- **正式站（範例）：** [https://podcast-website-mu.vercel.app](https://podcast-website-mu.vercel.app)
- **版本：** [1.2.1](./CHANGELOG.md) — 詳見 [CHANGELOG.md](./CHANGELOG.md)
- **待辦與路線圖：** [TODOS.md](./TODOS.md)
- **儲存庫：** **private** — `public/stories/`、`public/characters/` 內音訊與插圖**禁止再散布**（見下方授權與免責）
- **授權：** 程式碼 [MIT](./LICENSE) · 網站條文 [/legal](./app/legal/page.tsx) · 維護者全文 [DISCLAIMER.md](./DISCLAIMER.md)

## 功能概覽

| 功能 | 說明 |
|------|------|
| 故事牆 | 首頁網格列出全部分集；**依車車找故事**（車種 chip + `?vehicle=`）；主題見 `/topic` |
| 看圖聽故事 | 全螢幕播放器、逐字即時字幕、可拖曳進度條 |
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

用於 Open Graph、Twitter 卡片、RSS 與站內絕對連結。**Production 請務必設 `NEXT_PUBLIC_SITE_URL`**；未設時 production 會 fallback 到 canonical 網域（`lib/site-url.ts` 的 `CANONICAL_SITE_URL`）而非每次部署的臨時 Vercel 網域，preview／本機才用 `VERCEL_URL`／`localhost`。

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

## 節目數據中心（`/studio`）

製作團隊專用頁面，**不在首頁 Hero 曝光**；頁尾有極小字連結「節目數據」可進入，或直接書籤 `/studio`。頁面設 `noindex`，且不在 `sitemap.xml`。

| 檔案 | 用途 |
|------|------|
| `app/studio/page.tsx` | 節目數據中心頁面 |
| `lib/studio/platforms.ts` | 各平台**後台** URL（含 SoundOn，不進公開 ConnectHub） |
| `data/studio-metrics.json` | API 指標快照（初期為空，結構見 `lib/studio/types.ts`） |

**第二期（規劃）：** `scripts/sync-studio-metrics.ts` 從各平台 API 寫入 `studio-metrics.json`，卡片上的播放／聽眾等數字會自動顯示。目前請用各平台「開啟後台」捷徑查看完整報表。

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

**GitHub Actions：** [`.github/workflows/sync-apple-podcast.yml`](.github/workflows/sync-apple-podcast.yml)（feed 來源即 SoundOn 官方 RSS）。同步腳本會**追加新集**並**更新已同步集數的 title / date / duration / summary**；僅在 RSS 與 repo 完全一致時早退（`git status` 乾淨）。有變更時通過測試與 build 後 **commit 並 push 到 `main`**。`concurrency` 鎖避免交疊。三個觸發來源：

| 來源 | 準時性 | 用途 |
|------|--------|------|
| `repository_dispatch`（外部排程打 API） | ✅ 準時 | 主要、可靠的定時觸發（見下方設定） |
| `schedule`（GitHub 內建 cron `*/15`） | ⚠️ best-effort，常延遲數小時甚至跳過 | 後備，幾小時內會補到 |
| `workflow_dispatch`（Actions 頁 Run workflow） | ✅ 即時 | 上架後想立刻上站時手動按 |

> ⚠️ **GitHub 內建 `schedule` 不可靠**：官方為 best-effort，高負載時延遲數小時或整次跳過、不補跑（本 repo 實測 `0 1` 的 cron 常跑在 05:00 左右）。要真正準時，請設定下方外部排程。

#### 外部排程觸發（可靠定時，免費）

讓外部 cron 服務定時打 GitHub API 觸發 workflow，繞過內建 schedule 的不可靠：

1. **建 token**：GitHub → Settings → Developer settings → **Fine-grained personal access tokens** → 只授權本 repo、權限 **Contents: Read and write**（`repository_dispatch` 端點所需），複製 token。
2. **註冊免費 cron**（如 [cron-job.org](https://cron-job.org)）→ 新增 job：
   - **URL**：`https://api.github.com/repos/godmosword/podcast-website/dispatches`
   - **Method**：`POST`
   - **Headers**：`Authorization: Bearer <你的 token>`、`Accept: application/vnd.github+json`
   - **Body**：`{"event_type":"sync-now"}`
   - **間隔**：每 15 分（或你要的頻率）
3. 本機驗證指令（把 `<TOKEN>` 換掉跑一次，應觸發一次 sync）：
   ```bash
   curl -X POST \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Accept: application/vnd.github+json" \
     https://api.github.com/repos/godmosword/podcast-website/dispatches \
     -d '{"event_type":"sync-now"}'
   ```

> token 是密鑰：只放進 cron 服務的 request header，**不要 commit 進 repo**。權限只給單一 repo + Contents，外洩風險最小。

若 repo 有 branch protection，需允許 `github-actions[bot]` 寫入。

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

## 自動字幕：逐字即時字幕（`npm run transcribe`）

每集的即時字幕存在**側車檔** `data/subtitles/<slug>.json`（`[{ "t": 秒數, "text": "…" }]`），由音檔**本機轉錄**（whisper.cpp）產生，音檔不外送、免費、零金鑰。轉錄時**自動簡轉繁**（OpenCC `cn→twp`，台灣用語）並過濾常見幻覺鳴謝。播放器**有側車檔就自動套用**（依音檔時間顯示字幕，獨立於翻頁）；沒有則回退舊的 `captions`/`captionTimes` 邏輯。

**一次性安裝：**

```bash
brew install whisper-cpp          # 提供 whisper-cli（已驗證 1.8.x）
mkdir -p models
# 繁中品質建議 large-v3（約 3GB）；要快可先用 small（約 465MB）
curl -L -o models/ggml-large-v3.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin
```

**產生字幕（寫入 `data/subtitles/<slug>.json`）：**

```bash
npm run transcribe -- ev drone ep-7    # 指定數集
npm run transcribe -- --all            # 全部 public/stories/* 有 audio.mp3 的集
WHISPER_MODEL=models/ggml-small.bin npm run transcribe -- ev   # 指定模型
npm run transcribe -- --convert --all  # 只對既有側車檔重跑簡轉繁/過濾（不跑 Whisper）
```

**新集自動上字幕：** `npm run sync:apple` 下載新集音檔後，**本機若有 whisper-cli + 模型會自動轉錄**並寫側車檔；缺工具/模型（如一般 CI）或設 `SKIP_TRANSCRIBE=1` 會自動跳過、不中斷同步。CI 要自動上字幕，需在 workflow 安裝 `whisper-cpp` 並快取模型。

**草稿必校對（兒童產品上架前）：**

- Whisper 在音樂/靜音段常加**假字幕鳴謝**（如「字幕:XXX」「請訂閱…」）；腳本已自動過濾常見幻覺，仍建議抽查。
- 輸出為**逐字稿**（語氣詞、口語）；**品牌/人名仍會誤聽**（Bonbon→寶寶、馬米→媽咪，Whisper 無從得知），直接編輯側車 JSON 修正即可。
- 簡轉繁已自動（OpenCC）；偶有未涵蓋詞仍需抽查。
- `small` 模型誤字較多；目前 EP1–7 用 `large-v3`（繁中較準，建議正式用）。

> 模型檔放 `models/`（已 gitignore，勿入庫）。側車檔 `data/subtitles/*.json` 會入庫（即字幕內容）。

### 舊式：頁綁定字幕（captionTimes，`?cue=1`）

沒有側車字幕時，播放器用 `data/stories.ts` 的 `captions`（每頁一句）；可加 `captionTimes`（每句起始秒數）讓它精準換句，否則時長平均切換。手動對時：開播放頁加 `?cue=1` 進入「字幕對時模式」，邊聽邊點記下秒數再複製貼回。一旦該集有側車字幕，會優先用側車字幕。

## 每集劇情插圖自動生成（`npm run illustrate`）

讓只有單封面的集數（`ep-N`，`pageCount:1`）依台詞自動產生**一系列黏土風插圖**，播放時隨音檔時間切換（理想每 30–60 秒一張，依劇情轉折）。播放器既有的「依時間換圖」邏輯（`captionTimes` + `pageCount`）直接套用，**不改播放器**。

> ⚠️ 這是專案**唯一需要外部付費 API 的功能**，需 `OPENAI_API_KEY`。送出的是**已公開的劇本文字**（由本機字幕來，非音檔，仍守「音檔不外送」）。**本機手動執行、人工審圖後才上線；CI 不放此 key、不生圖。**

**資料流：** `data/subtitles/<slug>.json`（whisper 本機已產）→ 切場景 `data/scenes/<slug>.json` → 生圖到暫存 `public/.illustrate-staging/<slug>/`（gitignore）→ 人工審 `contact.html` → `--approve` 進 `public/stories/<slug>/NN.jpg` 並寫 `overrides.<slug>` 的 `pageCount`/`captionTimes`。

```bash
# 1) 切場景（可先 --segment-only --deterministic 免 key 看切分節奏）
OPENAI_API_KEY=sk-... npm run illustrate -- ep-9 --segment-only

# 2) 生圖到暫存 + contact sheet（停在這審圖）
OPENAI_API_KEY=sk-... npm run illustrate -- ep-9
open public/.illustrate-staging/ep-9/contact.html   # 逐幕檢查走樣／不適／文字

# 3) 壞幕單張重抽
OPENAI_API_KEY=sk-... npm run illustrate -- ep-9 --scene 4

# 4) 全部 OK → 上線（複製進 public + 寫 pageCount/captionTimes）
npm run illustrate -- ep-9 --approve
npm run sync:apple && npm run build      # overrides 併入 apple-synced.json
```

| 旗標 | 作用 |
|------|------|
| `--segment-only` | 只產 `data/scenes/<slug>.json`，不生圖（便宜，先審切分） |
| `--deterministic` | 本機切場景（不呼叫文字模型，免 key；切分較不貼劇情，當後備/測試用） |
| `--scene N` | 重抽第 N 幕（暫存），不用整集重生 |
| `--approve` | 暫存 → `public/` + 寫接線 |

**風格一致性**：每幕以該集既有 `01.jpg` 當**參考圖**（OpenAI image edit）+ 固定黏土風前綴（`CLAY_STYLE_PREFIX`，萃取自 DESIGN.md），讓材質／配色／主角車跨幕一致。

**跨集角色一致**：名冊 `data/characters.json`（每角色 `name`／`aliases`(誤聽別名)／`vehicle`／`desc`(英文外觀)／`ref`(定裝照)）。切場景時文字模型**從台詞認出每幕出場角色**並標 `characters`；生圖時把該幕角色的**定裝照**（`public/characters/<名>.jpg`）當參考圖（可多張同框），跨集維持同一形象。**新角色首次登場自動生定裝照**進暫存，contact sheet 有「新角色」區，`--approve` 後存進名冊成 canonical（之後各集引用）。定裝照不好用 `--char 名字` 重抽。已登記角色不會被覆寫。

### 手動補定裝照（自己畫／外部生圖時）

不想讓管線自動生定裝照、想用自己準備的圖時：

1. 把圖放進 `public/characters/`，正規化成 **1400×1400 JPEG、小寫 `.jpg`**（對齊既有資產）：
   ```bash
   npx tsx -e 'import sharp from "sharp";import{readFileSync,unlinkSync}from"node:fs";
   (async()=>{const s="public/characters/原檔.JPG";const b=readFileSync(s);unlinkSync(s);
   await sharp(b).resize(1400,1400,{fit:"cover"}).jpeg({quality:90}).toFile("public/characters/角色名.jpg");})()'
   ```
2. **檔名要等於 `safeName(角色名)`**：去掉空白與符號、保留中日韓字與英數（例：「怪獸卡車 Monster Truck」→ 角色名取 `怪獸卡車`、英文放 `aliases`）。
3. 在 `data/characters.json` 加一筆 `{ name, aliases, vehicle, desc(英文外觀), ref:"characters/<名>.jpg" }`。`aliases` 放台詞可能的誤聽／別稱，讓切場景時認得出。

### 重抽單幕並指定角色（保留 Apple 封面）

這次 ep-9 #6 的流程——把某幕換成指定角色、**但封面 `01.jpg` 要保留 Apple 原圖**時，**不要用 `--approve`**（它會把暫存全 8 張連封面一起蓋進 `public/`）：

```bash
# 1) 在 data/scenes/<slug>.json 的該幕加 "characters": ["角色A","角色B"]（名字需與名冊 name 一致）
# 2) 用定裝照當參考重抽該幕到暫存
npm run illustrate -- ep-9 --scene 6
open public/.illustrate-staging/ep-9/06.jpg          # 審圖
# 3) 滿意後「只」單張複製進 public（不動 01.jpg、不重寫接線）
cp public/.illustrate-staging/ep-9/06.jpg public/stories/ep-9/06.jpg
```

`pageCount`／`captionTimes` 不變時無需 `sync:apple`／改 overrides；直接 commit 該張圖即可。

**model id**：預設 `OPENAI_TEXT_MODEL=gpt-4o`、`OPENAI_IMAGE_MODEL=gpt-image-2`；圖像模型若當下不可用，設 `OPENAI_IMAGE_MODEL=gpt-image-1`（程式不改）。

**手動集**（ambulance/ev 等已有手繪 6 頁）：`--approve` 會印出要手填到 `data/stories.ts` 的 `pageCount`/`captionTimes`（不自動改 TS）。

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
| [DISCLAIMER.md](./DISCLAIMER.md) | 節目內容版權、禁止散布、字幕說明、建議年齡、第三方連結、免責條款 |
| [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) | 字型（含 [OFL-huninn.txt](./app/fonts/OFL-huninn.txt)）與商標指示性使用摘要 |
| [/legal](./app/legal/page.tsx) | 對外網站使用條款與免責聲明頁 |

Podcast 音檔、插圖、字幕與品牌內容屬 Bonbon & 馬米；**未經書面同意禁止轉載、下載或散布**。AI 插圖須人工審圖後才 `--approve` 上線（見 `scripts/lib/illustrate-core.ts`）。
