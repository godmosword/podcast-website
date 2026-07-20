# GEO 每週 Baseline 記錄（evergreen）

> **用途：** 每週人工填寫 AI 引用實測與搜尋平台指標，追蹤 GEO 成效趨勢。  
> **原則：** 本檔由營運**手動更新**；agent **不得**捏造 ChatGPT／Claude／Perplexity 的引用結果或數字。  
> **相關：** 營運 runbook [`GEO.md`](./GEO.md) §5 · 上線抽查 [`geo-checklist.md`](./geo-checklist.md) · 單次快照 [`metrics/GEO-baseline-2026-07-10.md`](./metrics/GEO-baseline-2026-07-10.md)

---

## 每週測試問題（固定五題）

在 ChatGPT、Claude、Perplexity（至少這三個；Gemini 有空再補）各問一次，記錄是否引用本站、引用哪一頁、摘要是否準確。**勿**硬編特定集數（例如 EP-18），最新一集以當週上線內容為準。

1. 適合 3–6 歲的中文車車 Podcast  
2. 睡前中文兒童故事 Podcast  
3. 車車遊樂園有哪些故事  
4. 車車遊樂園最新一集在講什麼  
5. 適合親子共聽的車車安全故事  

---

## 記錄欄位（每筆實測一行）

| 日期 | 測試平台 | 使用問題 | 是否引用本站 | 引用網址 | 是否引用正確頁面 | 摘要是否準確 | 是否混淆場景字幕與逐字稿 | 備註 |
|------|----------|----------|--------------|----------|------------------|--------------|--------------------------|------|
|      |          |          |              |          |                  |              |                          |      |
|      |          |          |              |          |                  |              |                          |      |

**欄位說明（簡）：**

- **是否混淆場景字幕與逐字稿：** 回答是否把翻頁「場景字幕／故事大綱」說成「完整音檔逐字稿」（契約見 [`GEO-CONTENT-CONTRACT.md`](./GEO-CONTENT-CONTRACT.md)）。
- **引用正確頁面：** 例如問「最新一集」卻只引用舊集或僅引用平台連結而非官網故事頁。

---

## 搜尋平台指標（每週從後台抄錄）

| 日期 | Google indexed pages | Google crawled currently not indexed | Sitemap errors | Bing IndexNow 狀態 | Crawler HTTP 200 率（Vercel logs，AI UA） | 備註 |
|------|----------------------|--------------------------------------|------------------|---------------------|-------------------------------------------|------|
|      |                      |                                      |                  |                     |                                           |      |

**資料來源：**

- **Google：** Search Console → Pages / Indexing、Sitemaps  
- **Bing：** Webmaster Tools → IndexNow 頁籤、URL Submission  
- **Crawler 200 率：** Vercel 專案 logs，篩選 §2 放行 UA（`Claude-SearchBot`、`PerplexityBot` 等），目標為可爬取且非 WAF 阻擋頁  

部署後可輔助跑自動 smoke（**不**取代上表人工記錄）：

```bash
npm run verify:geo-live -- --base-url=https://podcast-website-mu.vercel.app
```

---

## 歷史快照

- [`metrics/GEO-baseline-2026-07-10.md`](./metrics/GEO-baseline-2026-07-10.md) — 2026-07-10 單次 baseline（含 REUSE-1 等工程結論）

---

## 填寫提醒

- 新列加在表格**上方**或**下方**皆可，但請保持日期遞增可讀。  
- 若某週尚未實測，**留空列即可**，勿填「預期會引用」等推測。  
- 正式網域遷移前，Production URL 仍以 [`lib/site-url.ts`](../lib/site-url.ts) 的 `CANONICAL_SITE_URL` 為準。
