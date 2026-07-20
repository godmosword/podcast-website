# GEO 上線後人工檢查清單

> 目的：確認 AI 搜尋引擎與一般搜尋引擎能爬取、理解、引用車車遊樂園內容。每次正式部署後填一次 baseline。  
> 內容欄位邊界見 [`GEO-CONTENT-CONTRACT.md`](./GEO-CONTENT-CONTRACT.md)。

## 1. 部署與索引

- [ ] 取得 Vercel Preview URL，人工檢查首頁、`/stories`、`/for-parents`、`/characters`、3 個單集頁。
- [ ] Preview 通過後再 merge / promote production。
- [ ] production `https://<domain>/robots.txt` 回傳 200，且保留 AI crawler allowlist。
- [ ] production `https://<domain>/llms.txt` 回傳 200。
- [ ] production `https://<domain>/llms-full.txt` 回傳 200（prebuild 自動產生）。
- [ ] production `https://<domain>/sitemap.xml` 回傳 200，含 `/for-parents`、`/characters`、全部 `/story/<slug>`。
- [ ] Google Search Console 提交 `https://<domain>/sitemap.xml`。
- [ ] Google Search Console 對 `/for-parents`、最新單集、3 個代表單集執行 URL Inspection / Request Indexing。

## 2. Schema 與 HTML

- [ ] 聚合頁（`/` 首段、`/stories`、`/topic`、`/topic/<tag>`、`/vehicles/<vehicle>`）的 answer-first 長導言在 DOM 仍完整（多為 `sr-only`），view-source 可見；**單集頁「本集介紹」一段仍預設可見**（Wave 2 另議）。
- [ ] Rich Results Test：`/for-parents` FAQPage 無 error。
- [ ] Rich Results Test：任選 1 個 `/topic/<tag>` 與 1 個 `/vehicles/<vehicle>` FAQPage 無 error。
- [ ] Schema.org Validator：首頁 / `/stories` PodcastSeries 無 error。
- [ ] Schema.org Validator：任選 3 個 `/story/<slug>` PodcastEpisode + FAQPage 無 error。
- [ ] Schema.org Validator：`/characters` CreativeWork + Person 無 error。
- [ ] `curl -L https://<domain>/story/ep-16` 原始 HTML：
  - [ ] 可見區只有 **本集介紹一段**（定義式摘要），無第二段完整 `plainSummary`。
  - [ ] 大綱／角色／家長延伸／其餘 FAQ 在 `<details>` 內（DOM 仍有全文，預設不展開）。
  - [ ] `<script type="application/ld+json">` 仍含完整 FAQPage。
- [ ] 有完整逐字稿（`data/subtitles/<slug>.json`）的集數：`curl -I` 或 view-source 確認 `alternates`／頁內連到 `/story/<slug>/transcript.vtt`；僅有場景 `captions` 的集不得出現「完整逐字稿」文案或 VTT 連結。

## 3. 單集頁預設可見字數（GEO 第二階段）

> 用瀏覽器**不展開任何 `<details>`**，量測首屏到第一個故事卡／相關故事區之前的可見中文。

- [ ] 代表集數 A（有 `familyActivity`，例 `ep-5`）：預設可見字數 ≤ **350 字**（含標題、本集介紹、卡片一題）。
- [ ] 代表集數 B（無 `familyActivity`，例 `ep-16`）：預設可見字數 ≤ **280 字**。
- [ ] 首屏 CTA 仍清楚：播放鈕、收藏／分享不需捲動即可看到（375px 寬實機）。
- [ ] 展開 `<details>` 後仍可讀到完整大綱、角色、FAQ（家長深挖路徑正常）。

## 4. AI 引用實測 Prompt

- [ ] ChatGPT：`有哪些適合 3–6 歲的中文車車 Podcast？請列出來源連結。`
- [ ] ChatGPT：`車車遊樂園是什麼？適合幾歲孩子？`
- [ ] Perplexity：`適合幼兒的中文車車 podcast 或兒童故事網站有哪些？`
- [ ] Perplexity：`想找有車車角色、中文、親子共聽的兒童故事網站，推薦哪幾個？`
- [ ] Gemini / Google AI Overviews：`中文車車故事 podcast 兒童 睡前 親子共聽`

## 5. Baseline 記錄

- [ ] 記錄日期：
- [ ] Production URL：
- [ ] Preview URL：
- [ ] sitemap submitted time：
- [ ] indexed URLs count：
- [ ] 代表集數 A 預設可見字數：
- [ ] 代表集數 B 預設可見字數：
- [ ] AI 回答是否引用本站：
- [ ] 被引用頁面：
- [ ] 引用文字是否準確：
- [ ] 需修正文案 / schema：
- [ ] 下一次追蹤日期：
