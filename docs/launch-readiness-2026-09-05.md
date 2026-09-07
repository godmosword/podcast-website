# Production Launch Readiness Audit

稽核日期：2026-09-05（Asia/Taipei）  
稽核範圍：main、HEAD 157feeab7752eeb3eab6f956562b3e2fd9fc6099  
稽核模式：唯讀；未修改既有檔案、未 commit、未 push、未改 config。稽核期間產生的 build/test 產物均未留下非忽略檔案。

## 1. 判定

**NO-GO**。Repository 自己的 release gate 對最新集數 ep-28 回報 1 項 Release blocker：已有 17 幕 scene sidecar，但 production story 只有 1 張圖。Build、lint、typecheck、production dependency audit、public/child E2E 與 live GEO checks 均通過，但 trusted visual baseline 失敗，且 mobile Lighthouse Performance 為 77、LCP 為 5,594 ms。另有內容授權、兒童資料/Analytics 法遵、production 環境與維運設定等尚未能由 repo 或唯讀 live check 完整驗證的上線條件，須在核准前補證據或明確排除 scope。

## 第 0 步：盤點結果

### 框架、版本與套件管理

- Next.js 16.3.2、React/React DOM 19.2.7；TypeScript strict、App Router、CSS Modules。證據：package.json:68-100、tsconfig.json。
- 套件管理器為 npm；package-lock.json 存在且已追蹤，lockfileVersion 3。CI 使用 npm ci。證據：package.json:5-41、.github/workflows/ci.yml:37-42、git ls-files package-lock.json。
- manifest 仍有多個 caret range，並非所有依賴都 exact pin。證據：package.json:68-100。

### 部署平台與 CI

- 部署平台：Vercel；production URL：https://podcast-website-mu.vercel.app。證據：README.md:9-16、next.config.ts 的 Vercel 自動偵測註解。
- vercel.json 不存在；Vercel dashboard 的 production protection、ignored build step、環境變數與 rollback 設定不在 repo 可驗證範圍。證據：docs/PRODUCTION-RELEASE-GATE.md:57-60,79-87。
- CI：.github/workflows/ci.yml 包含 quality（production audit、lint、typecheck、service worker、unit tests）、build/public E2E 與 child-path E2E。證據：.github/workflows/ci.yml:37-85。

### 環境變數清單（只列 key，不列 value）

Production/runtime：

NEXT_PUBLIC_SITE_URL、NEXT_PUBLIC_AUDIO_BASE_URL、NEXT_PUBLIC_CONTACT_FORM_URL、NEXT_PUBLIC_WISH_FORM_URL、NEXT_PUBLIC_FEEDBACK_FORM_URL、DATABASE_URL、RESEND_API_KEY、SUBSCRIBE_FROM_EMAIL、UPSTASH_REDIS_REST_URL、UPSTASH_REDIS_REST_TOKEN、SENTRY_DSN、NEXT_PUBLIC_SENTRY_DSN、SENTRY_ENVIRONMENT。

Content/maintenance：

OPENAI_API_KEY、OPENAI_TEXT_MODEL、OPENAI_IMAGE_MODEL、INDEXNOW_KEY、WHISPER_BIN、WHISPER_MODEL、WHISPER_LANG、HUNINN_TTF、PYFTSUBSET、FFMPEG、SKIP_TRANSCRIBE。

CI/tooling：

CI、VERCEL、VERCEL_ENV、VERCEL_URL、NODE_ENV、NEXT_RUNTIME、GITHUB_STEP_SUMMARY、NOTIFY_SITE_URL、SYNC_ISSUE_ASSIGNEES、SYNC_ISSUE_MENTIONS、SYNC_ALERT_DRY_RUN、SYNC_COMMIT_MSG_PATH、SYNC_REPORT_PATH、STALE_HOURS、PW_CHROMIUM_PATH、PW_REUSE_SERVER、VISUAL_BASELINE_TRUSTED、VITEST_PLAY_MAP。

來源：.env.example:1-52、.gitignore:20-23。.env.local 被 ignore；本次未輸出任何 secret value。

### 主要路由／頁面

頁面：/、/about、/legal、/stories、/story/[slug]、/story/[slug]/play、/story/[slug]/transcript.vtt、/topic、/topic/[tag]、/vehicles/[vehicle]、/characters、/adventures、/adventures/[zone]、/adventures/[zone]/[hotspot]、/for-parents、/for-parents/dashboard、/for-parents/play-map、/for-parents/play-map/[placeId]、/for-parents/play-map/collections、/for-parents/play-map/collections/[collectionSlug]、/games、/games/block-drop、/games/candy-match、/games/coloring-book、/studio、/subscribe、/subscribe/confirmed。

API/metadata：/api/subscribe、/api/subscribe/confirm、/api/zone-wish、/feed.xml、/robots.txt、/sitemap.xml、/manifest.json、/sw.js；另有 app error、not-found、global-error。

### 資料來源

- 靜態內容：data/*.ts、data/*.json、public/ assets；故事內容合併 data/content.ts 與 data/apple-synced.json。
- 外部內容：Apple RSS/iTunes lookup ingestion；音訊與平台連結（Apple、Spotify、KKBOX、YouTube、Threads、Google Maps）。
- 後端：可選 Neon Postgres（訂閱、zone wishes）、Resend confirmation email、Upstash rate limit；Vercel Analytics、可選 Sentry。
- OpenAI 僅出現在 maintenance/generation scripts，不是 client runtime。證據：package.json:75、scripts/ 匯入結果、client/server sensitive-key 搜尋結果。

### Branch 與最近 10 筆 commit

目前 branch：main，tracking origin/main。git status --short --branch：## main...origin/main。

1. 157feea — 2026-09-03 — docs(todos): 回填 landing 導覽收斂 commit hash
2. f6b29fe — 2026-09-03 — fix(landing): 刪探索區並收斂手機導覽
3. 874d4dd — 2026-09-03 — content(ep-28): 字幕校對 --mark + 手切 17 幕
4. f42f27f — 2026-09-03 — docs(todos): 回填 GH013 status 鏡射 commit hash
5. fc419be — 2026-09-03 — fix(sync): mirror dispatch CI as commit statuses for GH013 auto-merge
6. 11f6d67 — 2026-09-03 — chore: sync Apple Podcasts from RSS
7. 087d6cc — 2026-09-02 — docs(todos): 回填 #141 sync 工程修復 commit hash
8. 341f060 — 2026-09-02 — fix(sync): unblock Apple sync after #141
9. 832f32c — 2026-09-02 — docs: 桌機／手機稽核修復紀錄 + Grok 對抗審缺席案例
10. 08ba718 — 2026-09-02 — fix(nav): 訂閱下拉在窄屏左緣溢出畫面（≤480 改錨定 .inner）

## 稽核計畫與執行範圍

已依 A–F 檢查：本地 build/lint/typecheck/test/audit、release/content gate、靜態搜尋、lockfile/license/secret history、CI/runbook、live production headers/routes/SEO、Lighthouse mobile、Playwright public/child/a11y/多尺寸 overflow，以及 visual trusted baseline。不能由 repo、CI 或唯讀 live check 證明的項目列為 UNKNOWN，沒有以推測補足。

## 2. P0 清單

### P0-1：最新集數 ep-28 未完成 production illustration

- 問題：release gate 判定 ep-28 為 illustrate-incomplete；17 幕已切出，但故事頁只有 1 張 story image。
- 證據：npm run verify:release-content exit 1，輸出「✗ [ep-28] illustrate-incomplete: 已切 17 幕場景但 pageCount=1」與「❌ blockers 1、accepted warnings 3」；data/scenes/ep-28.json:2-6；data/apple-synced.json:3-12；find public/stories/ep-28 -name '[0-9]*.jpg' | wc -l 輸出 1；判定邏輯見 scripts/lib/episode-workflow.ts:254-260、scripts/lib/release-content.ts:29-39、scripts/verify-release-content.ts:43。
- 風險：最新公開內容的 scene metadata 與實際 production 素材不一致，核心內容承諾不完整；repo 自己的正式 release gate 已拒絕此版本。
- 建議修法：依既有 illustrate workflow 產生並人工審核/approve 17 幕素材（或明確移除未完成 scene metadata），再重跑 npm run verify:release-content 與 public/visual checks；不得以 baseline 更新掩蓋內容差異。
- 預估工時：0.5–2 個工作天，取決於素材生成與人工審稿。

### P0-2（條件式）：核心內容授權鏈未被證明

- 問題：repo 有 code license 與部分來源紀錄，但沒有足以逐項證明 production 音訊、插畫、封面、字幕、AI 產出與外部素材商用權利的完整證據；在商業正式上線前，這是 release gate。
- 證據：LICENSE:25-35 明確將 podcast audio、illustrations、covers、mascot、brand、story text/subtitles 排除於 MIT code license；THIRD_PARTY_NOTICES.md:3-4,27-48 只列 code/直接依賴；public/brand/SOURCES.md:5-11 只列平台 logo 來源；app/legal/page.tsx:132-137 僅說 AI art 為工具輔助且人工審核，未提供模型、帳號、服務條款或逐項 asset rights register。
- 風險：無法證明商用、再散布、自架、改作或 attribution 權利；這不是已證實侵權，而是目前證據不足，不能安全核准。
- 建議修法：建立每個 deployed asset 的 rights register，附原作者/供應商、license、購買或授權憑證、AI model/account ToS 與商用條款、attribution 要求及負責人簽核；補齊 THIRD-PARTY-NOTICES，必要時取得法律審查。
- 預估工時：1–3 個工作天起；若資產權利人或 AI 服務文件尚未取得，狀態維持 UNKNOWN。

## 3. P1／P2 清單

### P1-1：/studio 對外可直接開啟，noindex 不是存取控制

- 問題：頁面標示「製作團隊專用」，但沒有在 route 或 middleware 看到身分驗證；live production /studio 回 HTTP 200。
- 證據：app/studio/page.tsx:9-15 僅設定 robots index:false follow:false；app/studio/page.tsx:18-50 顯示製作團隊頁面與 metrics/queue；repo 無 middleware.ts；curl -I https://podcast-website-mu.vercel.app/studio 回 HTTP/2 200。
- 風險：內部工作資訊與操作入口可被知道 URL 的訪客讀取；搜尋引擎 noindex 不會阻擋直接請求。
- 建議修法：加 server-side authentication/authorization 或 Vercel deployment protection；若不需 production，移除 route 或只在 preview 暴露。
- 預估工時：0.5–2 個工作天。

### P1-2：trusted visual regression gate 失敗

- 問題：/stories 在 390px light baseline 與目前畫面不一致。
- 證據：npm run test:visual:trusted exit 1；e2e/visual.spec.ts:356:11 失敗，36585 pixels (ratio 0.12) 不同，門檻 0.02；actual/diff 圖顯示首張 story card 的 artwork 已由 clay kindergarten scene 變為 child drawing image，差異主要是內容素材而非已證明的 layout defect。
- 風險：若是非預期內容變更，視覺回歸未受控；若是刻意換圖，baseline 與 release evidence 仍未同步。
- 建議修法：先由內容 owner 確認 artwork 變更，再修正素材或重新產生經核准的 baseline，重跑完整 visual suite；稽核未更新 baseline。
- 預估工時：0.5–1 個工作天。

### P1-3：mobile 首屏效能未達穩健上線水準

- 問題：live homepage Lighthouse mobile Performance 77，LCP 約 5,594 ms。
- 證據：npx --no-install lighthouse https://podcast-website-mu.vercel.app/ --form-factor=mobile ... 輸出 performance 0.77、lcp_ms 5594.489、cls 0、tbt_ms 95；資源摘要為 44 requests、946,953 transfer bytes，其中 font 429,779 bytes、image 214,811 bytes。
- 風險：行動網路下首屏等待長；LCP 會直接影響首次內容可見與搜尋體驗。
- 建議修法：優化首屏字體與 hero/image loading、檢查不必要的首屏 JS、為關鍵圖片保留尺寸與適當 preload，於主要路由與真機重測。
- 預估工時：1–3 個工作天。

### P1-4：CSP 目前只有 frame-ancestors

- 問題：安全 headers 有基本保護，但 CSP 未提供 default-src、script-src、style-src、connect-src、img-src、font-src、object-src 等內容來源限制。
- 證據：next.config.ts:36-60 的 CSP 值為 frame-ancestors 'self'；live root header content-security-policy: frame-ancestors 'self'。
- 風險：CSP 對 XSS、惡意第三方 script、資源載入與資料外送的縱深防禦有限；新增 script 時也缺少可驗證的來源政策。
- 建議修法：盤點 Next inline theme、Analytics、Sentry、音訊與外部圖片來源後，採 nonce/hash 與最小 allowlist 建立完整 CSP，逐頁驗證不破壞功能。
- 預估工時：0.5–2 個工作天。

### P1-5（條件式）：兒童／家庭網站的 Analytics 同意與法遵依據未驗證

- 問題：Vercel Analytics 在 root layout 全站 render；repo 未找到 cookie consent 機制，政策則聲稱使用匿名事件。是否需要事前同意、兒童資料限制或特定 jurisdiction 控制，無法僅由 repo 判定。
- 證據：app/layout.tsx:4,124 匯入並全域 render @vercel/analytics/react；app/legal/page.tsx:211-217 描述 Vercel Analytics；production source 搜尋未找到 document.cookie 或 cookie consent code；README.md:3-5 將受眾定位為 preschool–lower primary / family。
- 風險：若實際部署或適用法規要求同意，可能在同意前載入追蹤；政策、實際 vendor 設定與資料流可能不一致。
- 建議修法：由 privacy/legal owner 確認 controller、地區、兒童/家長場景與 Vercel Analytics 設定；若需要，先取得同意再載入並更新政策、DPA/retention evidence。
- 預估工時：法律判定後 1–3 個工作天；未取得判定前列 UNKNOWN。

### P1-6（條件式）：live 訂閱與 zone wish 功能目前 disabled

- 問題：production API 回報服務不可用，表單功能不是可驗證的 live ready 狀態。
- 證據：GET https://podcast-website-mu.vercel.app/api/subscribe 回 {"available":false}；GET /api/zone-wish 回 {"available":false}；POST {} 分別回 {"ok":false,"reason":"subscribe_unavailable"} 與 {"ok":false,"reason":"db_unavailable"}。程式會在 app/api/subscribe/route.ts:17-96、app/api/zone-wish/route.ts:8-54 檢查資料庫/郵件設定。
- 風險：若訂閱與投稿是 launch requirement，訪客無法完成核心互動；若本來就是 optional，則 UI/launch copy 必須清楚標示 disabled。
- 建議修法：若納入 scope，補齊並在 Vercel 驗證 DATABASE_URL、RESEND_API_KEY、SUBSCRIBE_FROM_EMAIL、Upstash keys，完成 end-to-end test；否則將其列為明確 deferred feature。
- 預估工時：0.5–1 個工作天加外部服務設定與驗證。

### P1-7：production protection、監控、uptime 與備份還原未取得外部證據

- 問題：repo 文件列出必要的 Vercel protection、Sentry alerts、Upstash 與 uptime monitor，但不能證明 dashboard 已配置；也沒有 backup/restore rehearsal 證據。
- 證據：docs/PRODUCTION-RELEASE-GATE.md:57-60 將 Vercel dashboard 設定列為需 admin verification；:75-87 明列 Sentry DSN/rules/recipients、Upstash、uptime monitor 為 repo 不可驗證或未配置項；README/runbook 沒有可核對的 Neon restore rehearsal。
- 風險：部署可能未受保護，錯誤可能無人接收，資料遺失或 rollback 可能無法在目標時間內處理。
- 建議修法：提供 Vercel、Sentry、uptime、Neon backup/restore 與 on-call evidence；執行一次還原演練並記錄 rollback runbook。
- 預估工時：0.5–2 個工作天，另計外部演練時間。

### P1-8：unit test 曾出現非決定性失敗

- 問題：同一稽核期間第一次完整 npm test 失敗，第二次完整重跑才通過。
- 證據：第一次為 Test Files 1 failed | 257 passed (259)、Tests 1 failed | 1597 passed (1598)，失敗在 lib/universe/roamer-coords.test.ts timeout 15s，並有 2 個 [vitest-worker] timeout unhandled worker errors；隔離測試 3/3 通過，第二次完整 npm test 為 Test Files 259 passed (259)、Tests 1606 passed (1606)、43.46s。
- 風險：CI 可能偶發紅燈或漏出真正的 timing/worker 問題，降低 release gate 的可信度。
- 建議修法：調查 worker/fetch timeout、固定 CI 資源與重試策略；確保失敗可重現或有明確 quarantine/owner。
- 預估工時：0.5–2 個工作天。

### P2-1：預設 npm audit 有一個 dev-only low 漏洞

- 問題：完整 npm audit 不是零風險，但 production dependency audit 為零。
- 證據：npm run audit:production 輸出 found 0 vulnerabilities；預設 npm audit --json 唯一項為 esbuild GH advisory 1120680，severity low，影響 development server Windows range，非 production bundle。
- 風險：本地/CI 開發工具仍有已知低風險漏洞。
- 建議修法：依 lockfile/上游版本更新 dev tooling，並保留 production audit 與 full audit 的區分。
- 預估工時：0.5 個工作天。

### P2-2：第三方 notices 與特殊 license 盤點仍需補齊

- 問題：lockfile license metadata 可解析且沒有 GPL/AGPL/SSPL 命中，但 THIRD_PARTY_NOTICES.md 不是完整的 transitive notice；Noto Sans TC bundled font 也未見列入現有 notices。
- 證據：license scan unknown metadata 0、GPL/AGPL/SSPL hits 0；THIRD_PARTY_NOTICES.md:27-48 只有 direct dependency table，且 react-leaflet Hippocratic-2.1 仍要求 human legal review；app/fonts/OFL-noto-sans-tc.txt:8-9 說明 Google Fonts source/bundled file，但 THIRD_PARTY_NOTICES.md 未列此字體。
- 風險：發布包的 attribution/notice 不完整，或特殊 license 的商用相容性未被正式確認。
- 建議修法：以 lockfile 與實際 shipped assets 產生 notice inventory，補字體及必要 transitive license，完成 Hippocratic-2.1、LGPL、FSL 等法律審查。
- 預估工時：0.5–1 個工作天。

### P2-3：public/private 意圖與文件互相矛盾

- 問題：README 說 code MIT 並指向 GitHub repo，但 disclaimer 又稱 repo 為私人性質。
- 證據：README.md:13；DISCLAIMER.md:13-17；GitHub API readonly response private:false、visibility:"public"；remote 為 https://github.com/godmosword/podcast-website.git。
- 風險：使用者可能誤解可再散布範圍與內容 license；非 code content 的限制也不夠清晰。
- 建議修法：明確決定 repo visibility 與 code/content license，修正 README、DISCLAIMER、LICENSE、legal page 的一致性。
- 預估工時：0.5 個工作天，法律確認另計。

### P2-4：live API 的 CORS 為 wildcard

- 問題：live response 帶 access-control-allow-origin: *；repo source 未看到自訂 CORS policy。
- 證據：live root、robots、sitemap、studio、API headers 均觀察到 access-control-allow-origin: *；next.config.ts:36-60 未設定 CORS。
- 風險：公開 endpoint 若未來加入敏感或有狀態資料，跨 origin 可讀範圍過寬；目前 endpoint 回應為公開/不可用狀態，尚未證明可利用漏洞。
- 建議修法：確認 Vercel platform header 來源；對不需跨 origin 的 API 改為明確 origin 或移除 wildcard，並以測試確認表單不受影響。
- 預估工時：0.5–1 個工作天。

### P2-5：資產與 design-token hygiene

- 問題：有大圖、orphan asset 與部分 token adoption 不完整。
- 證據：npm run audit:assets：1452 tracked images、2 張 JPG 超過 400KB（public/stories/ep-5/01.jpg 477KB、public/stories/ep-28/01.jpg 421KB）、29 orphan assets；npm run audit:design-tokens：font-size 81%、border-radius 97%、color 85%、spacing 42%；npm run audit:colors 有 allowlist 外 hardcoded hex。
- 風險：包體、維護成本與未來一致性風險；不是目前已證明的核心流程 blocker。
- 建議修法：確認 orphan 資產 provenance 後清理，最佳化大圖，逐步提高 spacing/color token adoption。
- 預估工時：0.5–1 個工作天。

### P2-6：Resend fetch 沒有明確 timeout

- 問題：email provider request 可能等待過久。
- 證據：lib/subscribe-email.ts:26-43 使用 fetch 發送 Resend request，未見 AbortSignal.timeout；相較之下 Upstash 有 2 秒 timeout，見 lib/distributed-rate-limit.ts:61-102。
- 風險：第三方服務異常時增加 server action latency 或資源占用。
- 建議修法：加入有限 timeout、可觀測錯誤分類與經驗證的 retry/backoff。
- 預估工時：0.5 個工作天。

## 4. A–F 評分

| 章節 | 分數 | 總評 |
|---|---:|---|
| A 代碼完整度 | 3/5 | Build、lint、typecheck、259 files/1606 tests 與 E2E 大致完整，但 ep-28 release gate blocker 與一次 transient test failure 仍存在。 |
| B 前端排版與操作性 | 3/5 | 35 個 route/viewport 組合沒有 horizontal overflow，a11y 與 touch checks 通過；但 visual baseline 失敗、LCP 5.59s，且未做真機驗證。 |
| C 資安 | 3/5 | gitleaks history、server-side Zod/parameterized SQL/rate limit、Sentry scrubbing 良好；/studio 公開、CSP 弱、CORS wildcard 與外部設定尚未完全驗證。 |
| D 智慧財產權與授權 | 2/5 | code MIT、部分 notices/font/platform source 存在；核心內容權利鏈、AI ToS、特殊 license 與 public/private 意圖未完成確認。 |
| E 法遵與隱私 | 2/5 | legal page、聯絡方式、parent consent、data minimization 有實作；兒童受眾下 Analytics 同意/法律依據與實際 vendor 設定未知。 |
| F 上線工程與可維運性 | 2/5 | CI、Vercel URL、release gate、live SEO/security checks 齊全；platform protection、env completeness、alerts、uptime、backup/restore、custom domain 仍需外部證據。 |

## 5. 已通過或未發現問題的檢查

以下是有命令輸出支持的正面結果，不代表取代 P0/P1：

- npm run lint：exit 0，無 warning/output。
- npm run typecheck：exit 0。
- npm run build：exit 0，Next 16.3.2，static pages 329/329；唯一顯著輸出是未提供 production URL 時的 localhost warning（CI 在 .github/workflows/ci.yml:22-23 注入 URL）。
- npm test：第二次完整重跑 259 passed、1606 passed。
- npm run audit:production：found 0 vulnerabilities。
- gitleaks git --redact --no-banner --log-opts='--all'：1114 commits scanned，no leaks found。
- npm run verify:episodes：error 0、warning 4；warning 是 ep-27/26/25 accepted MVP 與 ep-28 incomplete，後者已列 P0。
- npm run verify:zone-art、verify:map-art、verify:no-public-fs、verify:function-size、verify:geo、verify:service-worker、verify:browse-index：均 exit 0。
- npm run test:e2e:public：16 passed，critical/serious accessibility violations 為 0。
- npm run test:e2e:ci：107 passed。
- live npm run verify:geo-live -- --base-url=https://podcast-website-mu.vercel.app --production：✅ 全部通過。
- live HTTP root 為 308 導向 HTTPS，HTTPS root 為 200；live headers 有 HSTS、X-Content-Type-Options、Referrer-Policy、Permissions-Policy、X-Frame-Options。證據：curl header output、next.config.ts:36-60。
- live multi-size Playwright：7 routes × 5 widths（320/375/768/1024/1440），tested:35、overflows:[]、non200:[]。
- live robots、sitemap、RSS、VTT、JSON-LD、canonical 與 branded 404 通過；verify:service-worker、verify:geo、verify:map-art 亦通過。
- dangerouslySetInnerHTML 只見於 JSON-LD/theme script；components/JsonLd.tsx:9-13 會 escape <、>、&。production source 未找到 console.log、debugger、client 端 sensitive env 使用、SQL string concatenation 或未受保護的 dynamic redirect。

## 6. UNKNOWN 清單

以下項目不是推測為通過或失敗，而是本次權限與唯讀範圍無法證明：

1. Vercel production/preview env 是否齊全且值正確：DATABASE_URL、Resend、Upstash、Sentry、NEXT_PUBLIC_SITE_URL 等；live API 已證明目前不可用，但未能證明這是否為預期。
2. Vercel Production Deployment Protection、Ignored Build Step、preview/production separation、實際 rollback history 與 rollback 時間。
3. Sentry DSN 是否有效、alert rules/recipients/on-call；uptime monitor 是否存在並通知正確人員。
4. Neon backup retention、存取權限最小化、restore rehearsal；object storage/CDN 若另有配置也無 dashboard 證據。
5. Custom domain、DNS、SSL、www/non-www canonical/redirect 與舊網址 301 對照表；本次只證明 Vercel subdomain HTTP→HTTPS 308。
6. 每一個 audio、illustration、cover、subtitle、AI output、font、logo、外部 image 的權利鏈、商用範圍、attribution、撤下流程。
7. 實際使用的 OpenAI/image/audio/AI 服務條款、模型版本、帳戶方案是否允許商用與是否需標示；repo 只有 OPENAI_* 設定與「工具輔助」描述，沒有足夠 ToS evidence。
8. 適用法域、資料 controller/processor、兒童與家長的年齡流程、COPPA/GDPR/台灣個資等義務；本報告僅列風險，不作法律結論。
9. Vercel Analytics 的實際資料設定、DPA、retention、跨境傳輸與是否需要 consent；程式碼只能證明它在 layout 全站載入。
10. iPhone/iPad Safari、實體觸控、旋轉、音訊 mute/autoplay、低網速與真機 CLS；本次為靜態判讀、Chromium Playwright 與 Lighthouse lab data。
11. Lighthouse 只在 homepage 做一次 mobile lab run；其他 route 的實際 field data、CDN/cache header、流量成本與 API call 上限。
12. 完整 dead-code/unused-dependency graph：knip --production 因本地沒有已安裝 knip 而未執行，且沒有安裝依賴。
13. backup/restore 及人工 deployment steps 是否已由實際 operator 演練；README 與 docs/PRODUCTION-RELEASE-GATE.md 只能證明文件要求，不能證明外部狀態。

## 7. 建議核准條件與重跑順序

在 P0 關閉並取得上列必要 UNKNOWN 證據前，不核准 production launch。建議順序：

1. 完成 ep-28 illustration/metadata，重跑 npm run verify:release-content，須 exit 0。
2. 完成全量 asset rights register、AI/第三方 ToS 與 legal signoff；同步更新 notices 與 public/private 文件。
3. 決定 /studio 是否為 production route；若是，先加 authorization/protection，再驗證 live response。
4. 決定 subscribe/zone-wish 是否為 launch scope；若是，補 production services/env 並做成功、失敗、timeout、rate-limit E2E。
5. 補 CSP、Analytics privacy decision、Sentry/uptime/backup/rollback evidence。
6. 修正或正式核准 visual baseline、調整 mobile LCP，重跑 lint、typecheck、build、test、public/child E2E、visual 與 live GEO checks。

## 8. 稽核命令摘要

本次執行的主要唯讀命令包括：

npm run lint  
npm run typecheck  
npm run build  
npm test  
npm run audit:production  
npm audit --json  
npm run verify:release-content  
npm run verify:episodes  
npm run verify:zone-art  
npm run verify:map-art  
npm run verify:no-public-fs  
npm run verify:function-size  
npm run verify:geo  
npm run verify:service-worker  
npm run test:e2e:public  
npm run test:e2e:ci  
npm run test:visual:trusted  
npm run audit:assets  
npm run audit:colors  
npm run audit:design-tokens  
npm run verify:browse-index  
gitleaks git --redact --no-banner --log-opts='--all'  
npx --no-install lighthouse https://podcast-website-mu.vercel.app/ --form-factor=mobile  
npm run verify:geo-live -- --base-url=https://podcast-website-mu.vercel.app --production

除本報告檔外，稽核結束時工作樹應維持乾淨；稽核前 git status --short --branch 為 ## main...origin/main。
