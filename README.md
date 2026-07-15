# 車車遊樂園

Bonbon & 馬米親子 Podcast《車車遊樂園》的官方 **看圖聽故事** 網站。

面向 **學齡前～低年級** 親子：每集音檔 + 黏土風插圖翻頁 + 逐字字幕 + **網頁小遊戲**（純 Podcast 做不到的互動層）。產品路線見 [TODOS.md — 產品路線圖](./TODOS.md#產品路線圖互動--stem--商業)。

| | |
|---|---|
| **正式站** | [podcast-website-mu.vercel.app](https://podcast-website-mu.vercel.app) |
| **版本** | [1.3.0](./CHANGELOG.md) |
| **待辦** | [TODOS.md](./TODOS.md) |
| **設計** | [DESIGN.md](./DESIGN.md) · [RESEARCH.md](./RESEARCH.md) |
| **儲存庫** | [GitHub](https://github.com/godmosword/podcast-website)（程式碼 MIT） |
| **授權** | [MIT](./LICENSE) · [/legal](./app/legal/page.tsx) · [DISCLAIMER.md](./DISCLAIMER.md) |

> `public/stories/`、`public/characters/` 內音訊與插圖**禁止再散布**（見授權與免責）。

## 技術棧

- **Next.js 16** App Router、**React 19.3 canary**（ViewTransition）、**TypeScript strict**、**CSS Modules**（無 Tailwind）
- 以 **SSG 預渲染** 為主；少數 **Route Handler**（許願／email 訂閱 API，可選 Neon Postgres）
- **Vitest** 單元測試 + **Playwright** E2E
- 部署：**Vercel**（`@vercel/analytics`）

## 功能概覽

| 區塊 | 路由 | 說明 |
|------|------|------|
| Landing Hub | `/` | Storyline 式四段 scroll-snap 入口（故事／睡前／黏土／衛教） |
| 全部故事頁 | `/stories` | 最新集 Hero、收藏區、車種／主題篩選（`?vehicle=`、`?tag=`） |
| 故事詳情 | `/story/[slug]` | SEO 落地頁、分享、收藏、訂閱收聽 CTA、ShowNotes、親子延伸、完播反思、地圖島徽章 |
| 播放器 | `/story/[slug]/play` | 全螢幕翻頁、逐字字幕、進度條、字幕字級 |
| 逐字稿 | `/story/[slug]/transcript.vtt` | WebVTT 端點（無障礙／GEO） |
| 新集通知 | `/subscribe` | Email 訂閱表單（Neon；未設 DB 時引導至收聽平台） |
| 主題 | `/topic`、`/topic/[tag]` | 主題索引與分類頁（SSG + FAQ schema） |
| 車種 | `/vehicles/[vehicle]` | 車種分類頁（SSG + GEO FAQ） |
| 宇宙地圖 | `/adventures` | 五島滿版海洋、pan/zoom/fly-to、ZoneSheet、漫遊 NPC、鎖島許願（`?zone=` deep link） |
| 角色圖鑑 | `/characters` | `data/characters.json` 定裝照與出場故事 |
| 家長指南 | `/for-parents` | answer-first FAQ、代表性集數（GEO／STEM-P3） |
| 家庭儀表板 | `/for-parents/dashboard` | 本機 localStorage 收聽／遊戲摘要（不上傳） |
| 小遊戲 | `/games` | 街機四款 hub + 繪本著色；canvas 遊戲預載 sheet，**Candy Kart（Godot WASM ~35MB）進頁按需載入** |
| 節目數據 | `/studio` | 製作團隊專用（`noindex`、不在 sitemap） |
| 關於／法律 | `/about`、`/legal` | 關於我們、使用條款 |
| RSS | `/feed.xml` | Podcast feed（含 Podcasting 2.0 擴充） |
| PWA | `manifest.json`、`sw.js` | 主畫面圖示；收藏、繼續收聽、遊戲進度、主題偏好（`cheche:progress` localStorage） |
| GEO | `public/llms.txt`、`llms-full.txt` | AI 引用語料（build 前 `prebuild` 自動生成 `llms-full`）；`robots.ts` 分流檢索／訓練爬蟲 |

### 遊樂園活動（`data/games.ts`）

| 路由 | 名稱 | 備註 |
|------|------|------|
| `/games/car-adventure` | 車車大冒險 | canvas 橫向跑跳（GameKit） |
| `/games/block-drop` | 繽紛樂園 | 落下方塊消除（GameKit） |
| `/games/candy-match` | 繽紛消消樂 | 關卡地圖 + 消除棋盤（GameKit） |
| `/games/candy-kart` | 繽紛卡丁車 | Godot HTML5 iframe，見 [GAME-PERFORMANCE.md](./docs/GAME-PERFORMANCE.md) |
| `/games/coloring-book` | 繪本著色 | 定裝／場景線稿著色（不掛 GameKit）；線稿：`npm run generate:coloring-lineart` |

GameKit 跨遊戲進度（星星、獎牌、車庫）見 [GAMEKIT-ARCHITECTURE.md](./docs/GAMEKIT-ARCHITECTURE.md)。

## 本機開發

```bash
npm install
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)。

## 指令

### 日常

| 指令 | 用途 |
|------|------|
| `npm run dev` | 開發伺服器 |
| `npm run build` | 正式建置（`prebuild` 自動跑 `generate:llms-full`） |
| `npm run start` | 執行建置結果 |
| `npm run lint` | ESLint（零 warnings） |
| `npm test` | Vitest 單元測試 |
| `npm run test:e2e` | Playwright E2E（需先 build） |
| `npm run check` | 品質閘門：test + verify:episodes + verify:zone-art + verify:map-art + build |
| `npm run font:subset` | 重新子集化中文字型（新增文案後） |

### 內容管線

| 指令 | 用途 |
|------|------|
| `npm run sync:apple` | 從 Apple Podcasts RSS 同步新集（見下方） |
| `npm run transcribe` | whisper.cpp 本機轉錄字幕 → `data/subtitles/<slug>.json` |
| `npm run proofread:subtitles` | 字幕 lint／fix／`--mark`（illustrate 前必做） |
| `npm run illustrate` | OpenAI 切場景 + 生圖（需 `OPENAI_API_KEY`，CI 不生圖） |
| `npm run verify:episodes` | 對照 ep-9／ep-10 標準驗證集數接線 |
| `npm run verify:browse-index` | 驗證 `browse-index.json` 與故事資料一致 |
| `npm run generate:story-blurs` | 故事圖 blur placeholder |
| `npm run generate:coloring-lineart` | 由定裝／場景 JPG 產生著色線稿 PNG |

### 地圖／資產（維護者）

| 指令 | 用途 |
|------|------|
| `npm run verify:zone-art` / `verify:map-art` | 驗證島嶼／地圖美術資產契約 |
| `npm run generate:map-art` / `generate:forest-zone` | AI 生地圖／森林島美術 |
| `npm run generate:roamer-assets` | 漫遊 NPC 精靈 |
| `npm run generate:llms-full` | 手動重生 `public/llms-full.txt` |
| `npm run migrate` | 執行 DB migration（`scripts/migrations/`） |

## Agent 編排（維護者）

本 repo 用 **Meta + Domain** 兩層規範 AI agent 分工。一般 chat **不會**自動派子 agent；只有打出 slash command 才進入編排模式。

| 指令 | 用途 | 指令檔 |
|------|------|--------|
| `/agent-plan` | 規劃 + 分級委員會審核 → **Approved Plan**（預設不實作） | [`.cursor/commands/agent-plan.md`](./.cursor/commands/agent-plan.md) · [`.claude/commands/agent-plan.md`](./.claude/commands/agent-plan.md) |
| `/agent-action` | 依 Plan **Task 派工** → 整合 → Verify →（可選）Ship | [`.cursor/commands/agent-action.md`](./.cursor/commands/agent-action.md) · [`.claude/commands/agent-action.md`](./.claude/commands/agent-action.md) |

**收尾必附 [Agent 執行分配表](docs/AGENT-WORKFLOW.md#收尾輸出agent-執行分配表)：** 各 agent 做了什麼 + `model slug` + 狀態。

| 文件 | 內容 |
|------|------|
| [docs/AGENT-WORKFLOW.md](./docs/AGENT-WORKFLOW.md) | Meta：模型分工、L0–L3、Plan 模板 |
| [docs/AGENT-DOMAIN.md](./docs/AGENT-DOMAIN.md) | Domain：紅線、驗證矩陣、Protected paths |
| [docs/AGENT-FAILURES.md](./docs/AGENT-FAILURES.md) | 模型呼叫失敗案例簿 |

## 部署與環境變數

適合 Vercel、Netlify 等靜態/Edge 平台。

**Production 請設定：**

```bash
NEXT_PUBLIC_SITE_URL=https://你的網域
```

用於 Open Graph、RSS、canonical 與站內絕對連結。未設時 production fallback 到 `lib/site-url.ts` 的 `CANONICAL_SITE_URL`。

| 變數 | 用途 |
|------|------|
| `NEXT_PUBLIC_SITE_URL` | 站點 canonical URL（**必填於 production**） |
| `DATABASE_URL` | 樂園許願 + email 訂閱 API（Neon）；未設則表單降級（許願→mailto、訂閱→`#connect`） |
| `OPENAI_API_KEY` | 僅本機 `illustrate`／地圖資產生成；**CI 不放** |
| `SYNC_ISSUE_*` | GHA 同步後 GitHub Issue 通知（見 `.env.example`） |

完整說明見 [`.env.example`](./.env.example)。

## 新增一集故事（SOP）

> **SoundOn 新集：** 多數由 [Apple Podcasts 自動同步](#apple-podcasts-自動同步) 每日上架（`ep-N` slug、`pageCount: 1`）。以下為**手動**在 `manualStories` 新增完整繪本時使用。

1. **建立資料夾** `public/stories/<slug>/`（slug 英文小寫，與網址一致）
2. **放入** `audio.mp3`、`01.jpg`（多頁：`02.jpg`…）
3. **編輯** `data/stories.ts` — 在 `manualStories` 加一筆（`pageCount` 與插圖張數一致）
4. **字型** — 有新中文 → `npm run font:subset`
5. **驗證** — `npm test && npm run build`
6. **部署** — push 後 CI 自動建置

### 檢查清單

- [ ] `slug` 與資料夾名稱一致
- [ ] `audio.mp3` 可播放、`01.jpg` 存在
- [ ] `ep` 為目前最大集數 + 1
- [ ] `pageCount` 與插圖張數一致
- [ ] 分享預覽正常（title／描述／封面）
- [ ] `/feed.xml` 含新集

## 節目數據中心（`/studio`）

製作團隊專用，**不在首頁曝光**；頁尾極小字「節目數據」或書籤 `/studio`。`noindex`，不在 sitemap。

| 檔案 | 用途 |
|------|------|
| `app/studio/page.tsx` | 節目數據中心 |
| `lib/studio/platforms.ts` | 各平台後台 URL（含 SoundOn，不進公開 ConnectHub） |
| `components/studio/EngagementMetricsPanel.tsx` | 本機 localStorage 互動驗收 |

## Apple Podcasts 自動同步

官網與 SoundOn **不會**自動連動；管線只讀 **Apple Podcasts** 公開 RSS（iTunes Lookup，無需 API key）。

| 檔案 | 用途 |
|------|------|
| `data/apple-synced.json` | sync 腳本追加的新集 metadata |
| `data/apple-sync-state.json` | 已處理 RSS `guid` |
| `data/apple-sync.defaults.json` | 新集預設；`overrides.<slug>` 可覆寫單集 |
| `data/browse-index.json` | 車種／主題關鍵字推斷（CI 會 commit） |

**每日 GHA 上架框架：**

- 資產：`public/stories/ep-N/audio.mp3` + Apple 封面 `01.jpg`
- 資料：`pageCount: 1`（單圖 MVP）；摘要自動去 SoundOn 尾註
- CI：**安裝 whisper-cpp + 快取 large-v3**，同步後自動轉錄 → `data/subtitles/`
- 通過 `verify:episodes`、`verify:browse-index`、`npm test`、`npm run build` 後 commit push `main`

```bash
npm run sync:apple -- --dry-run   # 預覽不寫檔
npm run sync:apple                # 實際同步
```

**Workflow：** [`.github/workflows/sync-apple-podcast.yml`](.github/workflows/sync-apple-podcast.yml)（`repository_dispatch` 準時觸發 + cron 後備）、[`.github/workflows/sync-watchdog.yml`](.github/workflows/sync-watchdog.yml)（RSS 逾時告警）。

> GitHub 內建 `schedule` 為 best-effort，常延遲。要準時請用外部 cron 打 `repository_dispatch`（`sync-now`／`watchdog-now`），設定見下方舊版說明或 workflow 註解。

### 同步通知

| 情況 | 行為 | Issue label |
|------|------|-------------|
| 新集 push 成功 | 開「待生圖」Issue | `illustration` |
| RSS 有新集但逾時未上站 | 看門狗開告警 Issue | `sync-alert` |
| 單次 CI 失敗 | 細節在 Actions logs，不開 Issue | — |

## 專案結構

```
app/
  page.tsx                    Landing Hub（四段 scroll-snap）
  stories/page.tsx            全部故事頁
  story/[slug]/               故事詳情 + play 播放器 + transcript.vtt
  adventures/page.tsx         車車宇宙地圖
  characters/page.tsx         角色圖鑑
  for-parents/                家長指南 + dashboard
  subscribe/page.tsx          新集 email 訂閱
  games/                      街機四款 + 繪本著色
  topic/、vehicles/           主題／車種索引
  studio/、about/、legal/     數據中心、關於、條款
  api/zone-wish/              許願 API（可選 Neon）
  api/subscribe/              email 訂閱 API（可選 Neon）
  feed.xml/、robots.ts、sitemap.ts
components/
  landing/                    Landing Hub、頂欄、嘟嘟吉祥物
  universe/                   地圖、島嶼、ZoneSheet、漫遊者
  games/                      遊戲 shell、canvas、Candy Kart iframe
  story/                      ShowNotes、反思提問、親子延伸、島徽章
  home/                       /stories 區塊渲染
  studio/、for-parents/、decor/
data/
  content.ts                  Story 查詢 API（合併手動 + Apple + sidecar）
  stories.ts                  手動維護集（完整繪本）
  apple-synced.json           GHA 同步集
  characters.json、scenes/、subtitles/
  universe-zones.ts 等        地圖五島、漫遊、故事↔島對應
  reflection-prompts.ts、family-activities.ts、parent-guides.ts
hooks/                        遊戲、地圖、無障礙、家長儀表板 hooks
lib/
  gamekit/                    遊戲 runtime、進度、React hooks
  universe/                   地圖美術、deep link、OG
  story-geo.ts、for-parents.ts  GEO／家長端 resolver
  progress-store.ts           localStorage 收藏、繼續收聽、遊戲進度
  platform-utm.ts             收聽平台外連 UTM 歸因
  zone-wish-*.ts              許願 schema／DB／rate limit
  subscribe-*.ts              訂閱 schema／DB／rate limit
scripts/
  sync-apple-podcast.ts       Apple RSS 同步
  transcribe.ts、illustrate.ts
  generate-llms-full.ts       GEO llms-full 生成
  verify-*.ts                 集數／索引／地圖資產驗證
  lib/                        apple-rss、illustrate-core、subtitle-proofread 等
docs/                         見下方「文件索引」
public/
  stories/<slug>/             每集音檔與插圖
  adventures/                 地圖／島嶼／漫遊者資產
  characters/、landing/、candy-kart/
  llms.txt、llms-full.txt
candy-kart-game/              Godot 原始專案（匯出到 public/candy-kart/）
.cursor/、.claude/             Agent slash commands 與規則
```

架構分層慣例：`data/*.ts`（型別＋常數＋`*.test.ts`）→ `lib/*-query.ts`（resolver）→ `components/<area>/` + CSS Modules。

## 自動字幕（`npm run transcribe`）

逐字字幕在側車檔 `data/subtitles/<slug>.json`，由 **whisper.cpp 本機轉錄**（音檔不外送）。播放器有側車檔即自動套用；否則回退 `captions`／`captionTimes`。

```bash
brew install whisper-cpp
mkdir -p models && curl -L -o models/ggml-large-v3.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin

npm run transcribe -- ep-7          # 指定集
npm run transcribe -- --all         # 全部有 audio.mp3 的集
```

**草稿必校對**（illustrate 前必做）：[docs/SUBTITLE-PROOFREAD.md](./docs/SUBTITLE-PROOFREAD.md)

```bash
npm run proofread:subtitles -- ep-N --mark
```

GHA 同步 workflow 已內建 whisper；本機缺工具或 `SKIP_TRANSCRIBE=1` 會跳過、不中斷。

## 每集劇情插圖（`npm run illustrate`）

讓 `pageCount:1` 的集數依台詞自動產生黏土風插圖系列。播放器依 `captionTimes` + `pageCount` 換圖，**不改播放器**。

> 唯一需 **OpenAI API** 的付費功能；**本機手動、人工審圖後才上線**。

**標準範本：** [ep-9、ep-10](./docs/EPISODE-WORKFLOW.md)。驗證：`npm run verify:episodes`。

```bash
OPENAI_API_KEY=sk-... npm run illustrate -- ep-9 --segment-only  # 只切場景
OPENAI_API_KEY=sk-... npm run illustrate -- ep-9                 # 生圖到暫存
open public/.illustrate-staging/ep-9/contact.html                  # 審圖
npm run illustrate -- ep-9 --approve                               # 上線
```

| 旗標 | 作用 |
|------|------|
| `--segment-only` | 只產 `data/scenes/<slug>.json` |
| `--scene N` | 重抽第 N 幕 |
| `--approve` | 暫存 → `public/` + 寫接線 |

角色名冊 `data/characters.json`、定裝照 `public/characters/`、跨集一致性見 README 舊節或 [EPISODE-WORKFLOW.md](./docs/EPISODE-WORKFLOW.md)。

## 字型維護

中文用自託管 **jf-open 粉圓（huninn）** 子集（`app/fonts/huninn-subset.woff2`）。新增文案後：

```bash
curl -sL https://github.com/justfont/open-huninn-font/releases/download/v2.1/jf-openhuninn-2.1.ttf -o /tmp/huninn.ttf
npm run font:subset
```

## 產品路線（摘要）

| 階段 | 重點 |
|------|------|
| STEM-P1 互動故事 | 完播反思提問、重訪量測（**當務之急**） |
| STEM-P2 實驗室 | 組裝車、斜坡物理、開放式探索 |
| STEM-P3 家長端 | `/for-parents`、家庭儀表板、共讀指引 |
| STEM-P4 商業化 | freemium + 家長訂閱 |

原則：**玩不像作業** · **幼兒不競賽計時** · **家長信任與透明付費**。完整條目見 [TODOS.md](./TODOS.md)。

## 文件索引

| 文件 | 說明 |
|------|------|
| [EPISODE-WORKFLOW.md](./docs/EPISODE-WORKFLOW.md) | 單集全幕插圖標準流程 |
| [SUBTITLE-PROOFREAD.md](./docs/SUBTITLE-PROOFREAD.md) | 字幕校對 SOP |
| [VIDEO-EXPORT.md](./docs/VIDEO-EXPORT.md) | YouTube 整集影片匯出 |
| [GAMEKIT-ARCHITECTURE.md](./docs/GAMEKIT-ARCHITECTURE.md) | GameKit 分層與新增遊戲 |
| [GAME-PERFORMANCE.md](./docs/GAME-PERFORMANCE.md) | 遊戲載入策略 |
| [UNIVERSE-ART-BIBLE.md](./docs/UNIVERSE-ART-BIBLE.md) | 樂園地圖美術聖經 |
| [FOR-PARENTS-DATA.md](./docs/FOR-PARENTS-DATA.md) | 家長端資料盤點 |
| [GEO-CONTENT-CONTRACT.md](./docs/GEO-CONTENT-CONTRACT.md) | GEO 內容欄位契約 |
| [geo-checklist.md](./docs/geo-checklist.md) | GEO 上線後人工檢查 |
| [metrics/README.md](./docs/metrics/README.md) | 成長量測週報模板與 UTM 對照 |
| [AGENT-WORKFLOW.md](./docs/AGENT-WORKFLOW.md) | Agent 編排 Meta |
| [AGENT-DOMAIN.md](./docs/AGENT-DOMAIN.md) | Agent Domain 紅線 |
| [proposals/](./proposals/) | 每週設計評審週報 |

## 授權與免責

| 文件 | 說明 |
|------|------|
| [LICENSE](./LICENSE) | 網站**程式碼** MIT |
| [DISCLAIMER.md](./DISCLAIMER.md) | 節目內容版權、禁止散布、建議年齡 |
| [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) | 字型與商標摘要 |
| [/legal](./app/legal/page.tsx) | 對外使用條款 |

Podcast 音檔、插圖、字幕與品牌內容屬 Bonbon & 馬米；**未經書面同意禁止轉載、下載或散布**。AI 插圖須人工審圖後才 `--approve` 上線。
