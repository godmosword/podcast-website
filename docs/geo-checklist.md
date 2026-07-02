# GEO 上線後人工檢查清單

> 目的：確認 AI 搜尋引擎與一般搜尋引擎能爬取、理解、引用車車遊樂園內容。每次正式部署後填一次 baseline。

## 1. 部署與索引

- [ ] 取得 Vercel Preview URL，人工檢查首頁、`/stories`、`/for-parents`、`/characters`、3 個單集頁。
- [ ] Preview 通過後再 merge / promote production。
- [ ] production `https://<domain>/robots.txt` 回傳 200，且保留 AI crawler allowlist。
- [ ] production `https://<domain>/llms.txt` 回傳 200。
- [ ] production `https://<domain>/sitemap.xml` 回傳 200，含 `/for-parents`、`/characters`、全部 `/story/<slug>`。
- [ ] Google Search Console 提交 `https://<domain>/sitemap.xml`。
- [ ] Google Search Console 對 `/for-parents`、最新單集、3 個代表單集執行 URL Inspection / Request Indexing。

## 2. Schema 與 HTML

- [ ] Rich Results Test：`/for-parents` FAQPage 無 error。
- [ ] Schema.org Validator：首頁 / `/stories` PodcastSeries 無 error。
- [ ] Schema.org Validator：任選 3 個 `/story/<slug>` PodcastEpisode + FAQPage 無 error。
- [ ] Schema.org Validator：`/characters` CreativeWork + Person 無 error。
- [ ] `curl -L https://<domain>/story/ep-16` 可在原始 HTML 看到本集介紹、詳細大綱、常見問題。

## 3. AI 引用實測 Prompt

- [ ] ChatGPT：`有哪些適合 3–6 歲的中文車車 Podcast？請列出來源連結。`
- [ ] ChatGPT：`車車遊樂園是什麼？適合幾歲孩子？`
- [ ] Perplexity：`適合幼兒的中文車車 podcast 或兒童故事網站有哪些？`
- [ ] Perplexity：`想找有車車角色、中文、親子共聽的兒童故事網站，推薦哪幾個？`
- [ ] Gemini / Google AI Overviews：`中文車車故事 podcast 兒童 睡前 親子共聽`

## 4. Baseline 記錄

- [ ] 記錄日期：
- [ ] Production URL：
- [ ] Preview URL：
- [ ] sitemap submitted time：
- [ ] indexed URLs count：
- [ ] AI 回答是否引用本站：
- [ ] 被引用頁面：
- [ ] 引用文字是否準確：
- [ ] 需修正文案 / schema：
- [ ] 下一次追蹤日期：
