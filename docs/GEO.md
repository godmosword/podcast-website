# GEO 營運 Runbook（Generative Engine Optimization）

> 目的：讓 AI 搜尋／問答引擎（ChatGPT、Claude、Perplexity、Google AI Overviews）能爬取、理解、引用車車遊樂園內容，並可追蹤成效。
> 本檔是**營運操作手冊**（crawler 政策、IndexNow 設定、量測、部署後煙霧測試）。
> 上線後人工檢查清單（Rich Results／Schema Validator／可見字數量測）另見 [`geo-checklist.md`](./geo-checklist.md)；內容欄位邊界見 [`GEO-CONTENT-CONTRACT.md`](./GEO-CONTENT-CONTRACT.md)。

## 目錄

1. [GEO 資產地圖](#1-geo-資產地圖)
2. [Crawler 政策](#2-crawler-政策)
3. [IndexNow 設定（使用者手動前置）](#3-indexnow-設定使用者手動前置)
4. [明載限制](#4-明載限制)
5. [量測（每週記錄）](#5-量測每週記錄)
6. [Search Console／Bing Webmaster 提交步驟](#6-search-consolebing-webmaster-提交步驟)
7. [部署後煙霧測試清單](#7-部署後煙霧測試清單)

---

## 1. GEO 資產地圖

| 檔案 | 職責 |
|------|------|
| [`app/robots.ts`](../app/robots.ts) | 定義 AI 檢索型 crawler 放行、訓練型 crawler 拒絕、一般搜尋引擎放行（見 §2） |
| [`app/sitemap.ts`](../app/sitemap.ts) | 全站 URL + `lastModified`，供 Google／Bing 排程重新爬取 |
| [`public/llms.txt`](../public/llms.txt) | 站點重點、路由地圖、首頁 sections 摘要（人工維護，AI 代理快速定位用） |
| `public/llms-full.txt` | `llms.txt` 詳細版，含全部故事定義式摘要與角色索引；**prebuild 自動產生**（`npm run generate:llms-full`），不手動編輯 |
| [`app/feed.xml/route.ts`](../app/feed.xml/route.ts) + [`lib/feed.ts`](../lib/feed.ts) | RSS 2.0 feed；enclosure length 來自建置時 `generate:audio-lengths` → [`data/audio-lengths.json`](../data/audio-lengths.json)（禁止 route runtime 掃 `public/`，避免 NFT 打包超標） |
| [`lib/json-ld.ts`](../lib/json-ld.ts) | 結構化資料：`podcastSeriesJsonLd`（含 `sameAs` 平台節目頁連結）、`podcastEpisodeJsonLd`（含逐字稿 `associatedMedia` MediaObject，`encodingFormat: text/vtt`）、`breadcrumbListJsonLd`（五類頁純 JSON-LD，**無可見 UI**，僅供機器解析頁面階層）、`faqPageJsonLd`、`characterCreativeWorkJsonLd` |
| `public/story/<slug>/transcript.vtt`（經 [`lib/transcript.ts`](../lib/transcript.ts) 判定 `hasVtt`） | 逐字稿側車，供 AI 引擎直接讀取對話內容（非僅摘要） |
| [`scripts/verify-geo.ts`](../scripts/verify-geo.ts) + `npm run verify:geo` | build 後護欄：sitemap 涵蓋度、`llms-full.txt` 新鮮度、重點頁 JSON-LD 可解析、`dateModified` 與 sitemap `lastModified` 同源、`noindex` 頁面正確性。已掛在 `npm run check` 尾端 |
| [`scripts/generate-indexnow-key.ts`](../scripts/generate-indexnow-key.ts) | prebuild 依 `INDEXNOW_KEY` env 產生 `public/<key>.txt`（IndexNow key file）；未設定時安靜略過 |
| [`scripts/submit-indexnow.ts`](../scripts/submit-indexnow.ts) + `npm run submit:indexnow` | sync 後 best-effort 通知 IndexNow（Bing 等），fail-soft（見 §4）；支援 `--dry-run` |

---

## 2. Crawler 政策

`app/robots.ts` 依用途分兩組，與 `public/llms.txt` 授權條款（禁止訓練資料集收錄）一致：

### 放行（AI 檢索／使用者代查型）

| User-Agent | 用途 |
|------------|------|
| `OAI-SearchBot` | ChatGPT 搜尋檢索（非訓練用 `GPTBot`） |
| `ChatGPT-User` | ChatGPT 使用者代查 |
| `Claude-SearchBot` | Claude 搜尋檢索（非訓練用 `ClaudeBot`） |
| `Claude-User` | Claude 使用者代查 |
| `PerplexityBot` | Perplexity 索引/檢索 |
| `Perplexity-User` | Perplexity 使用者代查 |

理由：這些 UA 對應「即時檢索並在回答中引用」，放行有利內容被 AI 即時引用（GEO 核心訴求），不涉及訓練資料集收錄。

### 拒絕（訓練／資料集收錄型）

| User-Agent | 用途 |
|------------|------|
| `GPTBot` | OpenAI 訓練 |
| `ClaudeBot` | Anthropic 訓練爬蟲 |
| `Google-Extended` | Gemini/Vertex 訓練 |
| `Applebot-Extended` | Apple 智慧訓練 |
| `CCBot` | Common Crawl 資料集 |
| `Bytespider` | ByteDance 訓練 |
| `meta-externalagent` | Meta AI 訓練 |

理由：兒童內容，與 `llms.txt` 授權「禁止訓練資料集收錄」一致；一般搜尋爬蟲（`Googlebot`、`Applebot` 本體）不受影響，仍由 `*` 規則放行。

> `Claude-Web` 已於 2026-07 棄用；若舊 UA 仍出現，落入 `*` 規則（allow），不特別處理。

### 維護條款

**每季**對照官方 crawler 文件，名單漂移時更新 `app/robots.ts` 的 `AI_RETRIEVAL_CRAWLERS` / `AI_TRAINING_CRAWLERS`：

- OpenAI：<https://platform.openai.com/docs/bots>
- Anthropic：<https://docs.claude.com/en/docs/claude-in-various-web-tools/claude-crawlers>（或 Anthropic 官方 crawler 頁面現行網址）
- Perplexity：<https://docs.perplexity.ai/guides/bots>

檢查重點：新增/改名 UA、放行與訓練用途是否互換、`Google-Extended`／`Applebot-Extended` 是否仍是官方訓練 opt-out 標準寫法。

---

## 3. IndexNow 設定（使用者手動前置）

以下步驟**需人工執行**，CI／agent 不可代為設定 secrets：

1. **產生 key**：8–128 字元，僅 `a-zA-Z0-9-`（`scripts/generate-indexnow-key.ts` 的 `KEY_PATTERN`）。可用 `openssl rand -hex 16` 或任意符合格式的隨機字串。
2. **設定 GitHub Secret**：repo → Settings → Secrets and variables → Actions → 新增 `INDEXNOW_KEY`（值＝步驟 1 產生的 key）。
3. **設定 Vercel env**：專案 → Settings → Environment Variables → 新增 `INDEXNOW_KEY`（Production，值需與步驟 2 **完全相同**）。

> **漂移風險**：GitHub Secret 與 Vercel env 的 `INDEXNOW_KEY` 必須同值。若不一致，CI 提交時用的 key 與線上 `public/<key>.txt` 內容不符（`keyLocation` 指向的檔案內容與提交 payload 的 `key` 欄位對不上），IndexNow 端會判定驗證失敗，長期回 4xx，且不易察覺（fail-soft 設計下 CI 仍綠燈，只在 Job Summary 留警示）。**兩邊改動 key 時務必同步更新，並跑一次下方驗證**。

### 驗證

```bash
# 1. 確認 prebuild 會依 env 產生 key file（key 規格最少 8 字元，勿用 7 字的 testkey）
INDEXNOW_KEY=testkey1 npm run build
ls public/testkey1.txt   # 應存在，內容為 testkey1；驗完請刪除

# 2. 確認提交 payload 組裝正確（不實際發送）
npm run submit:indexnow -- --dry-run
```

---

## 4. 明載限制

- **不保證索引**：IndexNow 只是「通知引擎有新內容」，不保證被索引或被 AI 引用。
- **Google 不支援 IndexNow**：Google 索引靠 `sitemap.xml` 新鮮度（`lastModified`）+ Google Search Console 手動 Request Indexing；`submit:indexnow` 對 Google 無效。
- **提交時機是 best-effort**：`sync-apple-podcast.yml` 的 IndexNow 步驟在 push 後 `sleep 120` 才提交，**不保證** Vercel 部署已完成——引擎收到通知時，線上內容可能還沒更新完畢。
- **無可見 breadcrumb**：`breadcrumbListJsonLd` 只寫入 JSON-LD，頁面上無對應可見 UI 元件，因此**不承諾** breadcrumb rich result 一定顯示於搜尋結果（依各引擎樣式規則而定，本站只保證結構化資料本身合法可解析）。
- **fail-soft 邊界**：`submit-indexnow.ts` 任何錯誤（無 key、API 失敗、逾時）一律 catch 並 exit 0，不擋 sync workflow；代表 CI 綠燈**不等於** IndexNow 真的提交成功，需另外看 Job Summary 或手動 `--dry-run` 排查。

---

## 5. 量測（每週記錄）

指標依引擎分工，避免混用不相關數據：

### Google（Google Search Console）

- Indexed pages（已索引頁數）
- Crawled – currently not indexed（爬到但未索引，觀察是否持續增加）
- Sitemap 錯誤數
- AI Overviews / AI features impressions、clicks（Search Console 的 Search results → Search appearance 篩選，若帳號有該維度）

### Bing（Bing Webmaster Tools）

- URL Submission 狀態（含 IndexNow 提交是否被記錄）
- IndexNow 狀態頁（Bing Webmaster 有專屬 IndexNow 頁籤，可查最近提交與失敗原因）
- Crawl errors

### Vercel（部署與存取層）

- 檢查 Vercel 專案的 Functions / Edge logs，篩選 AI crawler UA（見 §2 放行清單），確認：
  - 回應碼是否 200（而非被 WAF／防護規則擋下）
  - 有無 timeout 或 5xx
  - 有無異常高頻請求觸發 rate limit

### AI Prompt Baseline（五題，每週手動問一次記錄是否被引用/如何被引用）

1. 「適合 3–6 歲的中文車車 Podcast」
2. 「睡前中文兒童故事 Podcast」
3. 「車車遊樂園有哪些故事」
4. 「車車遊樂園 EP-18 在講什麼」
5. 「適合親子共聽的車車安全故事」

在 ChatGPT、Claude、Perplexity（至少覆蓋這三個，Gemini 有空再補）各問一次，記錄是否引用本站、引用哪個頁面、內容是否準確。

### 每週記錄模板

| 週次 | Google Indexed | Google Crawled-not-indexed | Sitemap errors | Bing URL submitted | Bing IndexNow 狀態 | Vercel AI crawler 200 率 | Prompt 1 引用 | Prompt 2 引用 | Prompt 3 引用 | Prompt 4 引用 | Prompt 5 引用 | 備註 |
|------|-----------------|------------------------------|-----------------|----------------------|------------------------|----------------------------|----------------|----------------|----------------|----------------|----------------|------|
|      |                 |                              |                 |                      |                        |                            |                |                |                |                |                |      |

---

## 6. Search Console／Bing Webmaster 提交步驟

以下為**使用者手動**操作（agent 無法登入第三方後台）：

### Google Search Console

1. 確認網域已驗證（Domain 或 URL-prefix property）。
2. Sitemaps → 新增 `https://<domain>/sitemap.xml` → Submit。
3. URL Inspection → 貼上首頁、`/for-parents`、最新單集 `/story/<slug>` → Request Indexing（單集新上線時優先做這步）。
4. 定期查 Coverage / Indexing 報表，對照 §5 指標記錄。

### Bing Webmaster Tools

1. 新增站點（可直接從 Google Search Console 匯入，Bing 提供一鍵匯入）。
2. Sitemaps → 提交 `https://<domain>/sitemap.xml`。
3. IndexNow 頁籤 → 確認站點下有出現 CI 自動提交的紀錄（若 §3 設定正確，這裡會顯示提交歷史）。
4. URL Inspection（Bing 版）→ 對重點頁跑一次，確認可爬取。

---

## 7. 部署後煙霧測試清單

每次正式部署後，人工或腳本跑一輪：

- [ ] `curl -I https://<domain>/robots.txt` → 200
- [ ] `curl -I https://<domain>/sitemap.xml` → 200
- [ ] `curl -I https://<domain>/feed.xml` → 200
- [ ] `curl -I https://<domain>/llms.txt` → 200
- [ ] `curl -I https://<domain>/llms-full.txt` → 200
- [ ] `curl -I https://<domain>/<INDEXNOW_KEY>.txt` → 200（key 見 Vercel env，勿把值寫進本檔或 commit）
- [ ] `curl -A "Claude-SearchBot" https://<domain>/robots.txt` → 200 且非 WAF 阻擋頁（確認放行名單未被 Vercel Firewall／防護規則額外擋下）
- [ ] `curl -A "PerplexityBot" https://<domain>/robots.txt` → 同上
- [ ] `npm run submit:indexnow`（正式 key，非 `--dry-run`）→ 回報 HTTP 200 或 202
- [ ] `npm run check` 全綠（含 `verify:geo`）在 CI 上已通過，作為部署前把關

---

## 相關文件

- [`geo-checklist.md`](./geo-checklist.md) — 上線後人工檢查清單（Rich Results、Schema Validator、單集頁可見字數量測、AI 引用實測 prompt、baseline 記錄表）
- [`GEO-CONTENT-CONTRACT.md`](./GEO-CONTENT-CONTRACT.md) — 內容欄位邊界（可見摘要 vs `<details>` 深挖內容）
- [`geo-audit.md`](./geo-audit.md) — GEO 現況稽核
- [`AGENT-DOMAIN.md`](./AGENT-DOMAIN.md) — 本專案 Bootstrap、紅線、驗證矩陣
- [`EPISODE-WORKFLOW.md`](./EPISODE-WORKFLOW.md) — 單集流程（第 8 步：SoundOn show notes 回鏈，另一個站外 GEO 訊號來源）
