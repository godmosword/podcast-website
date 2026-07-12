# GEO 現況稽核 — 2026-07-10 快照

> 本段為 **post GEO phase-2** 更新；下方 2026-07-02 全文保留作歷史對照。  
> 驗證：`npm test`、`npm run build`、production baseline 見 `docs/metrics/GEO-baseline-2026-07-10.md`。

## 摘要（2026-07-10）

| 類別 | 狀態 |
|------|------|
| AI crawler | ✅ `robots.ts` 檢索型 allow、訓練型 disallow |
| llms.txt / llms-full | ✅ prebuild 自動產生 |
| Schema | ✅ Organization/WebSite、PodcastEpisode、FAQPage、角色頁 |
| 單集頁 | ✅ 低干擾可見層 + `<details>` + 完整 JSON-LD |
| `/for-parents` | ✅ 無 `[待確認]`（W27-1） |
| 主題／車種聚合 | ✅ 短導言 + FAQPage JSON-LD |
| `parentGuide` | ✅ sidecar + ShowNotes（ep-1、ep-5 試點） |
| `ageRange` | ✅ `enrichStory` 預設「約 3–7 歲」 |
| 人工 baseline | ⏳ AI prompt 實測待營運填寫 |

**故事基準：** `getStories().length` 以 build 時資料層為準（≥17 集）。

---

# GEO 現況稽核（2026-07-02 歷史）

日期：2026-07-02  
範圍：Next.js App Router source、build route output、robots/sitemap metadata routes、repo 內 Vercel / middleware 設定。  
驗證命令：`npm test`、`npm run build`、`npx tsx` 讀取 `app/robots.ts` / `app/sitemap.ts` / `data/content.ts`。

## 摘要

本站已有基本 SEO 地基：`app/robots.ts`、`app/sitemap.ts`、全站 metadata、PodcastSeries / PodcastEpisode JSON-LD、單集 SSG 頁與 RSS feed 都存在。主要 GEO 差距不是「完全沒有」，而是 AI crawler 明示規則、可引用的 answer-first 內容、真實 `dateModified`、FAQ/角色/全站 schema、以及新鮮度訊號一致性仍不足。

目前資料基準：

- 故事總數：16
- 最新集：`ep-16`，日期 `2026-06-30`
- 車種數：13
- 角色原始資料：28
- 有 `captions` 的集數：15；缺 captions：`ep-16`
- 有 `ageRange` 的集數：6；缺 `ageRange`：`ep-7` 到 `ep-16`

## Robots / AI Crawler

來源：`app/robots.ts`

現況：

```json
{
  "rules": {
    "userAgent": "*",
    "allow": "/"
  },
  "sitemap": "http://localhost:3000/sitemap.xml"
}
```

| User-Agent | 現況 | 問題 | 對應 Task |
|------------|------|------|-----------|
| `GPTBot` | 被 `* Allow: /` 間接允許 | 未明確列出，AI crawler 政策不夠清楚 | GEO-1 |
| `ClaudeBot` | 被 `* Allow: /` 間接允許 | 未明確列出 | GEO-1 |
| `Claude-Web` | 被 `* Allow: /` 間接允許 | 未明確列出 | GEO-1 |
| `PerplexityBot` | 被 `* Allow: /` 間接允許 | 未明確列出 | GEO-1 |
| `Google-Extended` | 被 `* Allow: /` 間接允許 | 未明確列出 | GEO-1 |
| `CCBot` | 被 `* Allow: /` 間接允許 | 未明確列出 | GEO-1 |
| `Bytespider` | 被 `* Allow: /` 間接允許 | 未明確列出 | GEO-1 |
| `Applebot-Extended` | 被 `* Allow: /` 間接允許 | 未明確列出 | GEO-1 |

其他現況：

- `public/robots.txt` 不存在，robots 由 Next metadata route 產生。
- `public/llms.txt` 不存在。
- `public/llms-full.txt` 不存在。
- sitemap 已指向 `${getSiteUrl()}/sitemap.xml`。

## Vercel / CDN / Middleware

來源：repo root、`.github/`、`next.config.ts`

| 項目 | 現況 | 問題 | 對應 Task |
|------|------|------|-----------|
| `vercel.json` | 不存在 | repo 內沒有可見的 CDN/header/firewall bot 阻擋設定；Vercel dashboard 設定不在 repo，無法由本機驗證 | GEO-0 記錄；GEO-6 上線後人工確認 |
| `middleware.ts` / `middleware.js` | 不存在 | 沒有 middleware 層阻擋 bot | 無需修正 |
| `next.config.ts` | 只設定 `reactStrictMode` 與 legacy story redirects | 未見 bot 阻擋；redirects 需保留既有 URL 相容 | GEO-5 檢查 sitemap/URL 不回歸 |
| `.github/workflows/*` | Apple Podcasts sync / watchdog | 無 bot blocking；不屬 CDN 層 | 無需修正 |

## Route Rendering / Crawler Visibility

`npm run build` route 判定：

- `○` Static：預渲染為靜態內容
- `●` SSG：使用 `generateStaticParams()` 產生靜態 HTML
- `ƒ` Dynamic：server-rendered on demand

| Route | Build 判定 | 主要內容是否在 HTML 中 | Client-only / AI 看不到的內容 | 問題 | 對應 Task |
|-------|------------|-------------------------|-------------------------------|------|-----------|
| `/` | `○` Static | 是。Landing 四段、footer 訂閱區、PodcastSeries JSON-LD 在 HTML | 導覽互動、嘟嘟 companion 狀態 | 缺 Organization / WebSite JSON-LD；首頁非 answer-first 家長查詢頁 | GEO-2, GEO-4 |
| `/stories` | `ƒ` Dynamic | 是。server on demand 產生故事列表與 PodcastSeries JSON-LD | 篩選互動由 client 接手 | 不是 SSG；但 crawler 可取得 SSR HTML。缺 canonical 之外的 FAQ / WebSite schema | GEO-2 |
| `/story/[slug]` | `●` SSG，16 paths | 是。H1、meta、摘要、相關故事、PodcastEpisode JSON-LD 在 HTML | 收藏、分享按鈕互動 | 開頭不是 80-120 字定義式摘要；逐字/大綱區塊若有 captions 目前在 collapsed `<details>`；`ep-16` 無 captions；缺 FAQ；缺 `dateModified` | GEO-2, GEO-3, GEO-5 |
| `/story/[slug]/play` | `●` SSG，16 paths | 只有播放器 shell。metadata `robots: noindex, follow`，canonical 指向詳情頁 | `StoryPlayerClient` 使用 `dynamic(..., { ssr: false })`，播放器內容需 JS | 播放頁本來不應做索引主頁；不作 GEO 主目標 | 無需修正 |
| `/story/[slug]/transcript.vtt` | `●` SSG route，16 paths | VTT route 可回傳 cues | 非 HTML 頁 | 可作 RSS transcript，但不是可引用 HTML 正文 | GEO-3 |
| `/topic` | `○` Static | 是。tag list 在 HTML | 無關鍵內容 client-only | metadata 有 title/description；缺 canonical/OG | GEO-2 或後續 SEO polish |
| `/topic/[tag]` | `●` SSG，17 paths | 是。主題故事列表在 HTML | 無關鍵內容 client-only | 有 title/description/canonical；缺 OG / JSON-LD | GEO-2 |
| `/vehicles/[vehicle]` | `●` SSG，13 paths | 是。車種故事列表在 HTML | 無關鍵內容 client-only | 有 title/description/canonical；缺 OG / JSON-LD | GEO-2 |
| `/about` | `○` Static | 是 | 無關鍵內容 client-only | 有 title/description/canonical；缺 OG / Organization/AboutPage schema | GEO-2 |
| `/adventures` | `○` Static | 有。互動地圖本體為 client component，但 HTML 也有 `sr-only` 島嶼清單 fallback | 地圖 pan/zoom/sheet 互動依賴 client JS | GEO 不應觸碰宇宙地圖；目前已有 SEO fallback | 無需修正；GEO 紅線 |
| `/games` | `○` Static | 是。遊戲卡片與文案在 HTML | 遊戲互動在子頁 client | 有 title/description/OG；缺 canonical | 低優先 |
| `/games/block-drop` | `○` Static | shell / heading 在 HTML | 遊戲畫面 client-only | 非 GEO 主目標 | 無需修正 |
| `/games/car-adventure` | `○` Static | shell / heading 在 HTML | 遊戲畫面 client-only | 非 GEO 主目標 | 無需修正 |
| `/games/candy-match` | `○` Static | shell / heading 在 HTML | 遊戲畫面 client-only | 非 GEO 主目標 | 無需修正 |
| `/games/candy-kart` | `ƒ` Dynamic | iframe host 在 HTML | Godot iframe / game content 不適合 crawler | 非 GEO 主目標；不要碰 Godot export | 無需修正 |
| `/legal` | `○` Static | 是。法律與授權文字在 HTML | 無關鍵內容 client-only | 有 title/description；缺 canonical/OG；可作 llms 授權聲明來源 | GEO-1, GEO-2 |
| `/studio` | `○` Static | 部分是。平台捷徑在 HTML | localStorage metrics 在 client | 已 `noindex, nofollow`，不應進 GEO | 無需修正 |
| `/feed.xml` | `ƒ` Dynamic route | XML feed | 不屬 HTML | RSS 產生邏輯為禁區，只讀不改 | 無需修正 |
| `/robots.txt` | `○` Static metadata route | 是 | 無 | 需要明確 AI crawler allow | GEO-1 |
| `/sitemap.xml` | `○` Static metadata route | 是 | 無 | lastmod 來源不一致 | GEO-5 |

## Metadata / JSON-LD

| 頁面類型 | title | description | canonical | OG/Twitter | JSON-LD | 問題 | 對應 Task |
|----------|-------|-------------|-----------|------------|---------|------|-----------|
| 全站 layout | 有 default/template | 有 default | metadataBase 有 | default OG/Twitter 有 | 無 Organization / WebSite | 缺全站實體與站內搜尋 schema | GEO-2 |
| `/` | 有 | 有 | 無明確 canonical | 有 OG；Twitter 繼承 default | PodcastSeries | 缺 Organization/WebSite；PodcastSeries `inLanguage` 目前為 `zh-TW`，需求為 `zh-Hant` | GEO-2 |
| `/stories` | 有 | 有 | `/stories` | 繼承 default 或不足 | PodcastSeries | route 是 dynamic on demand；缺完整 show landing schema 補強 | GEO-2 |
| `/story/[slug]` | `generateMetadata` | story summary | `/story/${slug}` | 有 story OG/Twitter | PodcastEpisode | 無 `dateModified`；無 FAQPage；`inLanguage` 目前為 `zh-TW`，需求為 `zh-Hant`；summary 混入社群 CTA / 外連字樣，引用品質不穩 | GEO-2, GEO-3, GEO-5 |
| `/story/[slug]/play` | 有 | 有 | canonical 到詳情頁 | 不重點 | 無 | noindex 正確；播放器 SSR false 非 GEO 問題 | 無需修正 |
| `/topic` | 有 | 有 | 無 | 繼承 default 或不足 | 無 | 缺 canonical/OG/CollectionPage schema | GEO-2 或後續 |
| `/topic/[tag]` | 有 | 有 | 有 | 繼承 default 或不足 | 無 | 缺 CollectionPage / Breadcrumb schema | 後續可選 |
| `/vehicles/[vehicle]` | 有 | 有 | 有 | 繼承 default 或不足 | 無 | 缺 CollectionPage schema | 後續可選 |
| `/about` | 有 | 有 | 有 | 繼承 default 或不足 | 無 | 可補 AboutPage / Organization 關聯 | GEO-2 |
| `/adventures` | 有 | 有 | 有 | 有 OG image | 無 | 已有 sr-only SEO fallback；不在 GEO 本輪核心 | 無需修正 |
| `/games*` | 有 | 有 | 多數無 canonical | 多數有 OG | 無 | 非 GEO 主目標 | 低優先 |
| `/legal` | 有 | 有 | 無 | 繼承 default 或不足 | 無 | 可作授權聲明來源；缺 canonical | GEO-1/GEO-2 |
| `/studio` | 有 | 有 | 無 | 不重點 | 無 | noindex/nofollow 正確 | 無需修正 |

## Sitemap

來源：`app/sitemap.ts`

現況：

- sitemap 存在。
- 本機資料層輸出總數：57 entries。
- 包含：首頁、`/stories`、`/topic`、`/about`、`/adventures`、`/games` 與 4 個遊戲頁、`/legal`、16 個故事頁、17 個 topic 頁、13 個 vehicle 頁。
- 不包含：`/story/[slug]/play`（noindex，合理）、`/studio`（noindex，合理）、尚未存在的 `/for-parents`、尚未存在的 `/characters`。
- `lastModified` 有輸出。

問題：

- 靜態頁、topic 頁、vehicle 頁使用 `const now = new Date()`，每次 build 都會產生新的 lastmod，屬於不可靠的新鮮度訊號。
- story 頁 lastmod 目前由 `story.date` 產生，實際上這是 `datePublished`，不是內容修改日期。
- metadata / JSON-LD 尚未輸出 `dateModified`，因此無法與 sitemap `lastmod` 三方一致。

| 現況 | 問題 | 對應 Task |
|------|------|-----------|
| sitemap 有 57 entries 與 lastmod | 新增 `/for-parents`、可能新增 `/characters` 後需納入 | GEO-4, GEO-5 |
| story `lastModified = story.date` | 可能把發布日當修改日；若插圖/字幕後補，日期不準 | GEO-5 |
| static/topic/vehicle `lastModified = now` | 每次部署都像全站更新，可能被視為新鮮度造假 | GEO-5 |

## 內容層差距

| 現況 | 問題 | 對應 Task |
|------|------|-----------|
| 16 集都有 summary | summary 多為 podcast show note，部分混入 IG/Threads/FB 與「五星鼓勵」文案，不是 answer-first 摘要 | GEO-3 |
| 15 集有 captions，`ep-16` 無 captions | 無法保證每集頁都有詳細大綱/逐字稿；`ep-16` 只有 summary | GEO-3 |
| captions 目前顯示於 `<details>` | HTML 有內容，但使用者要求 SSR 純文字、非 tab 隱藏；collapsed details 不符合 | GEO-3 |
| 只有 6 集有 `ageRange` | `/for-parents` 不能硬寫所有集年齡；需用資料層 fallback 或待確認文案 | GEO-3, GEO-4 |
| 角色資料存在於 `data/characters.json` / `data/characters.ts` | 沒有公開角色介紹頁與角色 JSON-LD | GEO-2 |

## Do-Not-Touch 確認

本輪 GEO 應避免修改：

- `components/universe/*`
- `lib/universe*`
- `data/universe-*`
- `public/adventures/*`
- `public/candy-kart/*`
- `candy-kart-game/*`
- `app/feed.xml/route.ts`
- `lib/feed.ts`
- `scripts/sync-apple-podcast.ts`
- `public/stories/*` 音檔與插圖素材

## 建議執行順序

1. GEO-1：補明確 AI crawler allowlist 與 `llms.txt`，授權聲明與 `/legal` 對齊。
2. GEO-2：擴充 JSON-LD helper，補全站 Organization/WebSite、Podcast schema 語言、FAQ helper、角色頁 schema；同時建立真實 `dateModified` 策略。
3. GEO-3：強化 `/story/[slug]` HTML：answer-first 摘要、可見 detailed outline/transcript、FAQ。
4. GEO-4：新增 `/for-parents`，以資料層統計產出可審稿文案。
5. GEO-5：修 sitemap lastmod，讓 sitemap / metadata / JSON-LD 日期一致。
6. GEO-6：補上線後人工檢查清單與 commit hash。
