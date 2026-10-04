# 車車遊樂園換自訂網域前檢查

檢查日期：2026-10-02  
檢查對象：這個程式庫的 `main`（commit `c4c313d7`），以及目前線上站 [https://podcast-website-mu.vercel.app](https://podcast-website-mu.vercel.app)（只讀，沒有改 Vercel、DNS 或任何密語）。  
網域名稱：還沒有。這份報告不替你選網址。

給非工程讀者的一句話：**網站可以搬家，但新門牌要一次改對、部署完成，再打開「舊網址跳到新網址」。** 插圖還沒做完的集數，不擋換門牌；若你想趁換網域對外說「正式完成版」，要先處理下面「建議修」的兩集。

## 結論

正式網址已經集中成一個開關，目前開關指著 Vercel 給的暫用網址 `podcast-website-mu.vercel.app`。搜尋引擎用地圖（sitemap）、給 Podcast 軟體的清單（RSS）、分享到 LINE／Facebook 時的網址，都吃這個開關。網域決定之後，程式、Vercel 環境變數、GitHub 自動作業要同一批改完再部署。先打開跳轉、程式還沒改，自動檢查會失敗，分享出去的連結也會繼續寫舊網址。

自己的「內容能不能發布」檢查目前是紅燈：`ep-28`、`ep-30` 已經切好很多幕，網站上卻只有一張圖。最新集 `ep-32` 是單圖上架，程式把這種情況當成可以接受的過渡，不是紅燈。

這次沒有在程式庫或文字歷史裡找到需要立刻作廢的 API 金鑰。`.env.example` 裡的 `sk-...` 是說明用的假字，不是真的鑰匙。

## 1. 建置健康

在這台檢查機上，從乾淨安裝開始跑。`npm ci` 用了 `--ignore-scripts` 再 `npm rebuild sharp`，因為圖像套件需要本機編譯。

| 檢查 | 結果 | 證據 |
| --- | --- | --- |
| 安裝套件 | 通過 | `npm ci`：703 個套件，約 12 秒 |
| 型別檢查（typecheck，確認 TypeScript 沒有對不上的型別） | 通過 | `npm run typecheck`，exit 0 |
| 程式風格（lint） | 通過 | `npm run lint`（`eslint . --max-warnings=0`），exit 0 |
| 單元測試 | 通過 | `npm test`：318 個檔、2089 則，約 36 秒 |
| 正式建置（production build） | 通過 | Next.js 16.3.8，357 個靜態頁，約 29 秒。建置時設了 `NEXT_PUBLIC_SITE_URL=https://podcast-website-mu.vercel.app` |
| 公開頁端對端測試 | 通過 | `npm run test:e2e:public`：17 則通過（含無障礙掃描、品牌 404、手機寬度） |
| 兒童主路徑端對端測試 | 1 則失敗 | `npm run test:e2e:ci`：147 則中 142 通過、1 失敗、4 則沒跑到。見下方說明 |
| 內容發布檢查 | 失敗 | `npm run verify:release-content`：blockers 2、可接受警告 5 |
| 正式環境套件漏洞 | 通過 | `npm run audit:production`：0 個漏洞 |
| 含開發工具的漏洞掃描 | 有低／中風險，不在正式網站裡 | 共 3 項：vitest 相關 2 個 moderate、esbuild 1 個 low。都是本機／測試工具，不是上線程式 |

兒童主路徑那 1 則失敗在 `e2e/smoke.spec.ts`「日間漢堡抽屜選中底」：手機寬度 390 的選單面板取色，預期偏暖的紅色分量至少 248，實際取到 43。同一檔案設成必須照順序跑，所以它後面 4 則「首頁手機換段」被跳過。那 4 則單獨再跑，4 則都通過。這次沒有改選單外觀，失敗與換網域無關。請對一下 GitHub 上 CI 的同一則：若那邊是綠的，就是這台檢查機的畫面取色和正式環境不同；若那邊也紅，再修選單底色。

沒有重跑整站手機測速（Lighthouse）。2026-09-05 的舊報告寫過首頁手機載入偏慢；那份數字不能直接當成今天的成績。

## 2. 換網域時，網址從哪裡來

站上所有「完整網址」走 `lib/site-url.ts` 的 `getSiteUrl()`，優先順序是：

1. 環境變數 `NEXT_PUBLIC_SITE_URL`（Vercel 上為這個網站設定的正式網址）
2. 若是正式環境又沒設上面那個，就用程式裡的 `CANONICAL_SITE_URL`
3. 預覽部署才用當次的暫時網址
4. 自己電腦開發才用 `http://localhost:3000`

目前第 2 點寫死為：

```11:11:lib/site-url.ts
export const CANONICAL_SITE_URL = "https://podcast-website-mu.vercel.app";
```

線上首頁已確認：語言是 `zh-Hant`，標準網址（canonical，告訴搜尋引擎「這一頁的正式地址」）是 `https://podcast-website-mu.vercel.app`。`/sitemap.xml` 有 207 筆，主機名都是這個 Vercel 網址。`/robots.txt` 有在，最後一行指向同一站的 sitemap。`/feed.xml` 回 200，頻道編號（podcast:guid）是 `2ee84390-ddf1-5c7a-9009-6e959b528a81`。

Apple Podcasts 真正的訂閱清單不在這個網站。iTunes 查詢結果的 feed 是 SoundOn：

`https://feeds.soundon.fm/podcasts/c478dbec-701a-4f1c-8c4a-736c52e7c4f5.xml`

換官網網域不會改到聽眾在 Apple／Spotify 的訂閱。SoundOn 那條網址要維持原樣。

### 網域定了之後要改的地方

正牌網址請含 `https://`、不要結尾斜線。例如最後決定用 `https://你的網域.tw`，下面每一格都要是同一串。

| 位置 | 為什麼要改 |
| --- | --- |
| `lib/site-url.ts` 的 `CANONICAL_SITE_URL` | 正式環境忘了設環境變數時的保底。也是著色作品下載圖上印的網址（`lib/coloring/export-frame.ts`） |
| Vercel → 這個專案 → Settings → Environment Variables → Production 的 `NEXT_PUBLIC_SITE_URL` | 真正部署出去的頁面、sitemap、RSS、分享網址都先看它。改完要重新部署，舊部署不會自己變 |
| `.github/workflows/sync-apple-podcast.yml` 兩處 `NEXT_PUBLIC_SITE_URL` | 必須和 `CANONICAL_SITE_URL` 字面完全相同。`scripts/lib/sync-workflow-contract.test.ts` 會核對；不一樣的話，每週自動同步的測試會失敗。第二處是通知搜尋引擎（IndexNow）時用的網址 |
| `.github/workflows/ci.yml` 的 `NEXT_PUBLIC_SITE_URL` | CI 建出來的網站會把這個網址寫進頁面。不改的話，自動測試仍可能綠燈，但測的是舊網址 |
| `.github/workflows/verify-geo-live.yml` 的預設網址，以及 GitHub 變數 `PRODUCTION_URL`（若有設） | 每次正式部署成功後，這支作業會檢查線上站。它只接受「程式裡的正式網址」。網址不一致就會紅燈 |
| GitHub secret `NOTIFY_SITE_URL`（若有設） | 新集上站時，GitHub Issue 裡的故事連結。有設的話會蓋過程式常數，所以要改成新網址，或刪掉讓程式用 `CANONICAL_SITE_URL` |

不用改、改了會害到聽眾的：

- `lib/feed-constants.ts` 的 `CHANNEL_PODCAST_GUID`。註解裡的舊網址只是說明這個編號當初怎麼算出來，編號本身要永久不變。
- SoundOn／Apple 的節目 RSS 網址。
- `lib/platforms.ts` 的 Apple Podcasts 節目連結（節目 ID `1896610920`）。

程式裡已經有的跳轉（舊故事網址、退休小遊戲）寫在 `next.config.ts`，換網域後仍會在新網站上生效。它們不會把 `vercel.app` 轉到新網域。那一種「整站換門牌」要在 Vercel 的 Domains 設定，不在這個程式庫。

### 舊網址跳轉與 www

請在 Vercel 做這三件事：

1. 加入你買的網域，DNS 照 Vercel 畫面指（通常是一筆 A 或 CNAME。CNAME 是「這個名字的背後其實是另一台主機」）。
2. 選定一個正牌：有 `www` 或沒有 `www`，只能有一個當主網址。另一個設成永久跳轉（HTTP 301，瀏覽器與搜尋引擎會記住「以後都去新地址」）。
3. 把 `podcast-website-mu.vercel.app` 也跳到正牌網址。SoundOn 舊的「看圖聽故事」連結、已經貼出去的貼文，都還指著舊網址。

安全標頭裡的 HSTS（強制之後都走加密的 https）已經在正式環境打開，而且包含子網域（`includeSubDomains`，見 `next.config.ts`）。意思是：這個網域下面的名字也要能開 https。還沒準備好的子網域先不要指過來。標頭裡沒有 `preload`，代表還沒有申請寫進瀏覽器的預載清單，這樣是對的，等網域穩定再考慮。

### 分享圖（Open Graph）

首頁、全部故事、親子指南、角色、訂閱、開場、主題索引、部分遊戲頁，線上 HTML 沒有 `og:image`。Facebook、LINE 分享時可能沒有圖。原因是這些頁面自己寫了一段 Open Graph，整段蓋掉版面預設的吉祥物圖，卻沒有再附圖。`/about`、`/games`、`/adventures`、單集故事頁有圖。單集故事用的是每一集自己的分享卡（`/story/[slug]/opengraph-image`）。

這次只補了首頁，因為換網域當天最常被貼出去的是首頁。其餘頁面列在「建議修」。合併並部署之後，線上首頁才會帶圖；現在的線上站還沒有這次修改。

### 網站自己的 RSS

`/feed.xml` 每一集的 guid（Podcast 軟體用來辨認「這是不是同一集」的編號）目前是該集頁面的完整網址，而且標成永久連結（`lib/feed.ts`）。官網網址一換，每一集的編號都會變。訂閱「這個網站的 RSS」的人，軟體可能把 32 集全部當成新集再下載一次。

Apple／Spotify 聽眾走的是 SoundOn，不受影響。若你不確定有沒有人用官網這條 RSS，換網域前可以把 guid 凍結成現在的舊網址（或集數編號），並把 `isPermaLink` 改成 false。這次沒改，因為它會影響已經在用的訂閱，不適合在網域還沒定案時先動。

### 離線快取（service worker）

每一頁都會註冊 `public/sw.js`。一般頁面是「先問網路，失敗才用快取」。已經開過網站的瀏覽器，舊網址上會留著這支快取程式。Vercel 若把舊網址 301 到新網域，這支程式有可能把跳轉吃掉，舊網址變成錯誤頁，而不是順順進新網站。沒開過網站的人不受影響。

這次沒改 `sw.js`。改錯會影響離線聽故事。上線當天要用「以前開過網站的手機」實際點舊網址。若打不開，再改 service worker：導覽請求遇到跳轉時，把瀏覽器送到新網址，不要自己把跳轉回應交回去。

## 3. 安全與兒童隱私

### 密語

- 版控裡只有 `.env.example`，沒有 `.env`、`.pem`、私鑰。
- 文字檔的 git 歷史裡，沒有掃到 OpenAI 真鑰匙、Resend 鑰匙、GitHub 個人權杖、雲端資料庫連線密碼。測試檔 `lib/feedback-admin.test.ts` 用的是 `postgresql://user:pw@localhost/db` 這種假資料。
- 真的鑰匙應只放在本機 `.env.local`、Vercel、GitHub Secrets。這次沒有讀那些值，也不需要因為「出現在程式庫」而輪替。若你懷疑鑰匙曾貼到聊天或截圖，再另外作廢重發。

### 瀏覽器安全標頭

線上首頁已有：

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`（跨站時少帶完整網址）
- `Permissions-Policy`：不開相機、麥克風、付款；定位只允許自己這個網站
- `X-Frame-Options: SAMEORIGIN` 與 `Content-Security-Policy: frame-ancestors 'self'`：別的網站不能把整站嵌進自己的頁面
- 正式環境才有 `Strict-Transport-Security`

內容安全政策（CSP，規定頁面可以載入哪些腳本與圖片）目前只有「誰可以嵌這個網站」，沒有限制腳本來自哪裡。這是縱深防禦的缺口，不是已經被入侵的證據。要補完整 CSP 得先列清楚 Vercel Analytics、Sentry、地圖圖磚，做不好會讓網站空白。列在建議修，不要在換網域當天一起大改。

線上回應還有 `access-control-allow-origin: *`（任何網站都能用程式讀這些回應）。程式庫的 `next.config.ts` 沒有自己加這一行，比較像 Vercel 平台加上的。公開頁與公開留言牆的 JSON 有把信箱擋在外面（`app/api/feedback/route.ts` 的欄位白名單）。之後若 API 開始回個人資料，要先收緊這一行。

### 這個兒童網站實際收集什麼

隱私說明在 [https://podcast-website-mu.vercel.app/legal](https://podcast-website-mu.vercel.app/legal)（`app/legal/page.tsx`），頁首語言是繁體中文。重點：

- 沒有兒童帳號。收藏、進度、遊戲分數在裝置的 `localStorage`（瀏覽器裡的本機記事本），不上傳。
- 全站載入 Vercel Web Analytics（`app/layout.tsx` 的 `<Analytics />`）。政策寫的是匿名瀏覽與事件（點了哪個平台、聽完哪一集的編號、隔幾天回來），不記孩子姓名。沒有「先同意才載入」的彈窗。Vercel 這項分析一般不使用 cookie。是否符合你要上架的地區法規，需要你或懂個資的人點頭，程式無法代替法律判斷。
- 訂閱、園區許願、留言牆都要求由家長填。線上 `GET /api/subscribe` 與 `GET /api/zone-wish` 目前都是 `{"available":false}`：表單功能沒打開。沒設定資料庫時，程式會拒絕收件，而不是悄悄改存記憶體。
- 留言牆審核在 `/studio/feedback`，要密語，cookie 是 HttpOnly。`robots.txt` 禁止爬 `/studio/feedback` 與 `/api/studio/`。
- `/studio` 節目數據中心沒有登入，只靠頁面自己寫 `noindex`（請搜尋引擎不要收錄）。知道網址的人仍打得開。裡面是平台後台連結、這台裝置的本機統計、哪些集還是單圖。沒有 API 鑰匙，但也不該當成秘密頁。
- 親子地圖可向瀏覽器要定位（`components/for-parents/usePlayMapFilters.ts`），地圖圖磚來自 OpenStreetMap（`components/for-parents/PlayMapLeaflet.tsx`）。隱私頁沒有寫定位，也沒有寫這張地圖。定位是家長按了才問，不是進站就抓。
- 錯誤監控 Sentry 是選用的，有設 DSN 才會送。隱私頁沒有提到 Sentry。程式有把信箱、網址參數等清掉再送（`lib/sentry-options.ts`），但若正式環境有開，政策文字要補一句。

第三方腳本：分析來自 Vercel；字型在建置時打包，不是每次開頁都去問 Google。沒有廣告追蹤碼。

## 4. 品質

做得好的部分：

- `<html lang="zh-Hant">`，manifest 也是 `zh-Hant`。
- 可以放大，沒有鎖死縮放（對家長共讀重要）。
- 有「跳到主內容」。
- 找不到的網址會到品牌 404（「這裡還沒有故事」），線上不存在的路徑回 HTTP 404，不是一片空白。
- 公開頁無障礙掃描（axe，抓明顯的對比、按鈕名稱等問題）這次 17 則裡相關頁面沒有 critical／serious。
- 單集播放頁設成不要被搜尋引擎當獨立頁收錄，標準網址指回故事頁。

### 程式庫為什麼這麼大

工作目錄大約 1.5 GB。主人看到的約 990 MB，對得上 `.git` 壓縮包約 966 MB。

| 區塊 | 大約大小 | 說明 |
| --- | --- | --- |
| `.git` | 966 MB | 歷史裡留著每一集音檔。曾經有 `public/candy-kart/index.wasm`（約 35 MB），現在工作目錄已經沒有這個檔，歷史還在 |
| `public/stories` 音檔 | 32 個 mp3，約 202 MB | 故事本體。網站已預留 `NEXT_PUBLIC_AUDIO_BASE_URL`，以後可以改放到專門放音檔的網址，不必整包進 git |
| 故事圖 jpg／webp／avif | 約 133／66／51 MB | 同一張圖存三種格式，是為了讓瀏覽器少傳一點。不是誤複製了三份垃圾，但 git 因此變重 |
| 其餘圖與模型 | 地圖、角色、遊戲，几十 MB 以內 | `public/adventures/map/sea.png` 約 2.0 MB、`sea-night.png` 約 1.1 MB，是單檔偏大的例子 |

沒有用 Git LFS（把大檔移出一般 git 歷史的做法）。現在還部署得上去，因為網站已經在線上。這是成本與複製程式庫的速度問題，不擋換網域。

`ep-29` 有兩對完全相同的圖：`02` 與 `14`、`03` 與 `15`（jpg 與 webp 都一樣）。看起來像同一幕存了兩次。不影響換網域，之後可對一下那集畫面。

### 內容檢查紅燈

`npm run verify:release-content`：

- 紅燈：`ep-30` 已切 18 幕但 `pageCount=1`；`ep-28` 已切 17 幕但 `pageCount=1`。場景檔在，正式圖沒有核准進站。
- 可接受的單圖過渡：`ep-32`、`ep-31`、`ep-27`、`ep-26`、`ep-25`。

最新一集是 `ep-32`（2026-10-01）。單圖集在網站上仍可聽、可看封面。

## 5. GitHub Actions（自動作業）

| 作業 | 換網域會不會壞 | 要做的事 |
| --- | --- | --- |
| `ci.yml` | 測試多半仍會過，但建置用的是舊網址 | 改檔案裡的 `NEXT_PUBLIC_SITE_URL` |
| `sync-apple-podcast.yml` | 會。單元測試要求建置用的網址等於 `CANONICAL_SITE_URL`。IndexNow 也會拿這個網址去通知 Bing | 兩處一起改。IndexNow 的鑰匙（`INDEXNOW_KEY`）不用因為換網域而換一把新的；部署後新網域要能打開 `https://新網域/<鑰匙>.txt`，這支檔是建置時產生的，不在 git 裡 |
| `verify-geo-live.yml` | 會。它拒絕「檢查的網址」和「程式正式網址」不同。舊網址一開始 301，若還用舊網址去測，也會因跳到別的網域而失敗 | 改 YAML 預設值，或設定 GitHub 變數 `PRODUCTION_URL`。部署完成、跳轉打開之後，用新網址手動跑一次 |
| `sync-watchdog.yml` | 不會因為官網網域壞掉 | 它比較的是 Apple RSS 和程式庫裡的集數目錄，不打官網網址 |

看門狗與 Apple 同步的排程本身不用為了換門牌而改 cron。

## 6. 這次一併改了的程式

都是小改，沒有改視覺設計，也沒有把網址改成一個還沒決定的網域。

1. `app/page.tsx`：首頁 Open Graph 補上預設吉祥物圖，避免分享首頁沒有圖。
2. `app/layout.tsx`：全站預設分享圖改走 `DEFAULT_OG_IMAGE`（`/mascot.png`），避免圖的路徑再寫死一次。
3. `scripts/post-sync-notify.ts`：GitHub Issue 裡的故事連結，在沒有環境變數時改用 `CANONICAL_SITE_URL`，不再自己寫死一串 Vercel 網址。
4. `lib/home-geo.test.ts`：鎖住首頁一定要有分享圖。

還沒做、建議之後做的：其餘缺少 `og:image` 的頁面、凍結 RSS guid、service worker 遇到 301 的行為、完整 CSP、`/studio` 加上密碼。

## 7. 上線當天清單

照順序做。第 4 步之前，先確認新網址打開時，網頁裡的標準網址已經是新網域。

1. 決定正牌網址（含不包含 `www`）。另一個名字只做跳轉。
2. 改第 2 節表格裡的程式與變數，合併到 `main`，等 Vercel 部署成功。
3. 打開新網址，看這幾頁的網址是不是新網域：首頁、最新一集 `/story/ep-32`、`/robots.txt`、`/sitemap.xml`、`/feed.xml`。分享到 LINE 看首頁有沒有圖（要等這次首頁修改也部署了）。
4. 在 Vercel Domains：接上網域、設成主要網址、舊的 `podcast-website-mu.vercel.app` 永久跳到新網址、`www` 與沒有 `www` 也要有一個跳到另一個。
5. 用以前開過這個網站的手機，點舊網址。要能進新網站。若是錯誤頁，先不要對外公告，回來改 service worker。
6. 用沒開過的瀏覽器再點一次舊網址，確認一般跳轉是好的。
7. GitHub Actions 手動跑 `verify-geo-live`，網址填新網域。
8. SoundOn 後台把節目的「網站」改成新網址。RSS 網址不要改。舊集說明文字裡若已貼官網連結，有 301 就能繼續用；有空再批次改。
9. Google Search Console 用新網址新增資源，提交 `https://新網域/sitemap.xml`。
10. 若當天要收 Email 訂閱或園區許願，才設定 `DATABASE_URL`、`RESEND_API_KEY`、`SUBSCRIBE_FROM_EMAIL`、`UPSTASH_REDIS_REST_URL`、`UPSTASH_REDIS_REST_TOKEN`，並實際送一筆測試。不收的話維持現狀即可，畫面上應保持「目前沒有開啟」。

## 8. 請你決定的事

1. 正牌網址的完整寫法，以及 `www` 要不要出現在網址列。
2. 這次是「現在的網站換門牌」，還是「等 `ep-28`、`ep-30` 的插圖補完，再對外說正式上線」。換門牌不必等插圖；內容檢查會繼續紅燈。
3. 上線當天要不要開始收家長 Email，以及園區「通知我開幕」。現在兩支線上介面都是關閉的。
4. 舊的 `vercel.app` 網址是否永久跳到新網域。建議要跳，否則已經貼出去的連結會斷。
5. `/studio` 要不要加密碼。現在知道網址就能看製作清單。
