# 方格子育兒文同步

作者在方格子公開的新文，預設收進 `data/parent-articles.ts`，顯示在 `/for-parents/articles`。閱讀順序就是陣列順序：既有文章不動，新文加在末端（多篇時較早發布的在前）。

文末（圖片說明不算）在拿掉空白、引號與兩端標點之後，以「同步更新至親子出國專欄」結尾的文，改收進 `data/parent-travel-abroad-articles.ts`，顯示在 `/for-parents/travel-abroad`。標記可以自己一行，也可以接在最後一句後面；包住它的 `「」『』“”""`、全形／半形標點、全形空白都認。正文中間提到這句、但文章最後不是這句的，仍進育兒文章分享。

標記不會出現在網站上：自己一行就整段刪掉；跟在句子後面就只刪這句，前面的字留下。請把標記自己放一行，比較不會切到正文。

已經收過的文章，後來加上標記會整篇搬到親子出國；拿掉標記會搬回育兒文章分享的末端。slug 沿用，所以網址改了，舊網址會永久轉到新網址，不會兩區各有一篇。圖片仍在 `public/parent-articles/`。搬走時會用方格子上的最新內文重寫這一頁；若這篇曾在本機手改過，那些手改會被蓋掉。原本屬於育兒系列的 slug 會從系列拿掉，搬回去時不會自動加回系列。

## 列表從哪來

`GET https://api.vocus.cc/api/contents?creatorId=6aa4a7adaa92714642f625a3&num=10&page=1&order=desc&sort=publishAt&status=2`

這是作者頁 `https://vocus.cc/user/6aa4a7adaa92714642f625a3` 的 `__NEXT_DATA__` 裡，SWR fallback 使用的同一支查詢，回應含標題、`publishAt`、Lexical HTML（`post.content`）與 `contentId`。`status=2` 是已發布。一頁 10 篇，依 `count` 翻頁，頁與頁之間停 800ms。

對過、不採用的路徑：

- `https://vocus.cc/user/<id>.md` 與沙龍 `.md` 只有「近期內容」標題，沒有內文與日期。
- `/post/<id>.md` 會把 `.md` 算進 ObjectId，回 400。
- `api.vocus.cc/api/users/<id>/articles` 與 `vocus.cc/api/contents` 是 404。
- 作者頁與沙龍沒有可用的 RSS。

`vocus.cc/robots.txt` 允許 `/user` 與 `/post`。`api.vocus.cc/robots.txt` 是 404。同步只用上面那支公開列表，User-Agent 為 `podcast-website-vocus-sync/1.0`，不抓付費、18+ 或 `spam !== 0` 的文。

## 內文怎麼轉

Lexical HTML 轉成 `ParentArticleBlock[]`，不改寫文字。

- 一個 `<p>` 裡的 `<br>` 是作者換行，各成一個 `paragraph`。
- 只有 `<br>` 或盲文空格 `⠀`（U+2800）的段落是 `spacer`。文首、文末的空行拿掉，中間空行保留。
- `h1`／`h2` → `heading` level 2；`h3` 以上 → level 3（版面的 `h1` 已是篇名）。
- `ul`／`ol` → `list`。粗體、連結只留可見文字。
- `img` 下載成 `public/parent-articles/<slug>-<n>.webp`（最寬 1600、quality 82）。有 `ogImageURL` 時另存封面。
- U+FFFC（嵌入物件佔位）刪除；它不是作者打的字。
- 發布日用 `publishAt` 轉台北日曆日。`slug` 為 `vocus-<contentId>`，用 `sourceUrl` 去重。搬走時 slug 不變。
- 摘要沿用 `lib/parent-articles.test.ts`：第一個 spacer 之前的 paragraph，以換行接起。

## 列表頁怎麼排

`/for-parents/articles` 由 `parentArticlesLayout()` 分三區：發布日最新的一篇當封面故事；`data/parent-article-series.ts` 裡的系列照 `slugs` 順序整組列出；其餘文章依月份新到舊放在「更多文章」。同步進來的新文不用手動處理，會自動成為最新一篇。要把幾篇編成系列時，只改系列檔，不要在 `data/parent-articles.ts` 的 `PARENT_ARTICLES` 之後加陣列：`appendParentArticleSource` 用該檔最後一個 `];` 當插入點（`lib/parent-articles.test.ts` 有守衛）。

## 手動跑

```bash
npm run sync:vocus -- --dry-run
npm run sync:vocus
npm run font:subset
```

第二次再跑應印出「沒有新文」，不改檔。已經在正確區的文章不會因為內文改了而重抓；只有「新文」或「標記讓它換區」才寫入。

## 自動合併

`.github/workflows/sync-vocus-articles.yml` 每 6 小時（台北 02:20、08:20、14:20、20:20）以及 `workflow_dispatch`。有新文才跑字型子集、lint、typecheck、test。

四項都成功才合併：先推 `main`；若 `protect-main-web` 以 GH013 拒絕（目前要求 commit status `quality`、`build-and-public-e2e`、`Vercel`），就開 PR、`gh pr merge --squash --auto`，並用 `workflow_dispatch` 補跑 CI，把前兩個 job 鏡射成 ruleset 認的 status。Vercel 由 GitHub App 在分支 push 時寫入。CI 或 Vercel 失敗會關掉 auto-merge，PR 留著。

lint、typecheck、test 或字型子集有一項失敗：仍把新文推上 `sync/vocus-<run_id>` 並開 PR，**不**啟用 auto-merge。

不需要額外的 repo secret。需要的權限與設定：

- workflow `permissions`：`contents: write`、`pull-requests: write`、`actions: write`、`statuses: write`（用預設 `GITHUB_TOKEN`）。
- Settings → Actions → General：Workflow permissions 為 Read and write，並勾 Allow GitHub Actions to create and approve pull requests。
- Settings → General → Pull Requests：Allow auto-merge（此 repo 已開啟）。
- `protect-main-web` 沒有 required reviewers。若之後加上，auto-merge 會停在等審核，不會自己合併。
- ruleset 的 strict status checks 要求分支含最新 `main`；腳本會先 rebase。

## 風險

方格子若改列表 JSON 或 Lexical HTML 類名／標籤，轉換會失真或整次失敗（失敗不寫入半成品）。排程是 GitHub `schedule`，可能延遲。slug 是貼文 id，不是英文短名。沒有 paragraph 的文會中止這次寫入。

方格子的 `article` 型別（公開網址是 `/article/<id>`，不是 `/post/<id>`）在列表裡沒有內文。同步會再打 `GET https://api.vocus.cc/api/article/<contentId>` 取 HTML。文末若寫成 `<同步更新至親子出國專欄>`，先換成純文字再分類，避免被當成 HTML 標籤吃掉。

`scripts/lib/vocus-article-covers.ts` 裡指定的封面，同步重寫該篇時沿用，不會改去下載方格子縮圖蓋掉檔案。小松之杜這張標了原圖寬高，單篇首圖照直式完整顯示；列表卡仍是 16:9 裁切框。已經在正確區的文章，排程本來就不會重寫。
