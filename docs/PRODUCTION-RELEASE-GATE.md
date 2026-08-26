# Production Release Gate

這份文件是全站（遊戲之外）正式上線的操作契約。遊戲 baseline 維持既有
`e2e/smoke.spec.ts`、`e2e/a11y.spec.ts` 與遊戲專用測試；本 gate 只跑獨立的
public suite。

## Repository checks

CI 的 required check 名稱是：

- `quality`：production dependency audit、lint、typecheck、Vitest
- `build-and-public-e2e`：production build、public smoke、public axe

另有 `e2e-child-path`（`npm run test:e2e:ci`）會在 PR／`main` 跑兒童主路徑 Playwright；
**不是** ruleset required check 名稱。視覺回歸不進 CI。

public suite 包含首頁、故事、主題、角色、家長頁、訂閱、法律頁、故事播放、地圖入口，
以及 branded 404 與 mobile viewport。它只把未處理 `pageerror`、同源 4xx/5xx resource
與明確頁面錯誤當成 blocking signal；analytics warning 不會單獨擋版。

PR／`main` 另跑 `e2e-child-path`（smoke、axe 兒童路徑、宇宙地圖、遊戲頁、訂閱、
UX-P1-5 觸控）。這份 job **不是** GitHub ruleset `protect-main-web` 目前列出的
required check 名稱；合併阻擋仍以 `quality`／`build-and-public-e2e`／`Vercel` 為準。

`components/for-parents/PlayMap.test.tsx` 是 53 個 jsdom 互動測試的長跑回歸，獨立用
`npm run test:play-map` 執行（fork、single worker），不把它的 Vitest worker RPC
timeout 混進 required quality check；地圖 public smoke/a11y 仍在 required public suite。

## GitHub ruleset / Vercel 外部設定

目前 GitHub repository ruleset `protect-main-web` 已針對 `main` 啟用，要求以下三個
status checks 成功後才能 merge：

- `quality`
- `build-and-public-e2e`
- `Vercel`

這不是只存在於 YAML 的宣告：直接 push `main` 已被 GitHub `GH013` 拒絕，PR #95
及後續 PR 都在上述 checks 通過後 merge。最新 `f448a98` 的 Production deployment
及部署後 `verify-geo-live` 也都成功。

`protect-main-web` 目前沒有 `github-actions[bot]` bypass。因此
`.github/workflows/sync-apple-podcast.yml` 在「有變更 → commit → `git push` main」
時會被同一條 GH013 擋下（3 of 3 required status checks are expected），即使
job 內 `npm test`／`npm run build` 已綠。無工作樹變更的排程仍可成功並 resolve
sync-failure issue。有新產物時改走 PR 上架（見 ep-27 字幕 sidecar），或由倉庫
管理者把 GitHub Actions 加進 ruleset bypass。**不要**為了繞過而改 Apple sync YAML。

GitHub ruleset 已可阻止未通過檢查的 merge；但 Vercel dashboard 的 Production
deployment protection／Ignored Build Step 不在 repository 內，仍需由 Vercel 專案
管理者確認 production deploy 是否也會等待同一組檢查。不能只用 CI YAML 推論這項
外部設定已完成。

## Post-deploy health

`.github/workflows/verify-geo-live.yml` 只在 GitHub `deployment_status` 回報
`environment=production` 且 `state=success` 時自動執行；手動執行也必須明確提供
base URL。`--production` 會拒絕 preview origin。它檢查：

- robots、sitemap、RSS、llms、最新 transcript
- 首頁與最新故事 JSON-LD、canonical、FAQ
- branded 404、security headers、最新集主圖與音檔

不對 production 打人為 500。`app/error.tsx` 與 `app/global-error.tsx` 負責 fallback，
Sentry 負責 client/server exception 與 request error；演練應在本機或 staging 進行。

建議另設一個 uptime monitor：每 5 分鐘 GET production `/robots.txt`（預期 200、
`text/plain`），再把通知目的地（Sentry email、GitHub、或團隊既有告警通道）填入
維運清單。這是外部服務設定，不由 repository 假裝完成。

目前外部配置狀態：

- GitHub required checks：已完成並以實際拒絕 direct push／成功 merge 驗證。
- Vercel production deployment protection：尚未能由 repository 或本機 CLI 驗證。
- Sentry DSN：程式碼與 PII scrubber 已就緒；Production DSN、通知規則與告警收件人
  尚未有可驗證的 repository 證據。
- Upstash Redis：production fail-closed 行為與測試已完成；Production REST URL/token
  尚未有可驗證的 repository 證據。
- Uptime monitor：尚未配置。

## Operator checklist before release

以下項目必須由具備對應服務權限的人完成；repository 內的測試不能替代這些外部
操作。完成時請保留設定頁截圖或服務事件連結，填入團隊維運紀錄：

| Gate | 必做操作 | 完成證據 |
| --- | --- | --- |
| Vercel production protection | 確認 Production deploy 會等待 `quality`、`build-and-public-e2e`、`Vercel`；確認 Production environment 具有 canonical `NEXT_PUBLIC_SITE_URL` | Vercel protection 設定或一次失敗 PR 的阻擋紀錄 |
| Sentry | 設定 Production DSN 與 environment，建立 client/server exception、unhandled rejection 告警；確認 scrubber 不送 email、token、家庭資料、進度 | 一筆 staging/local 演練事件與告警通知 |
| Upstash | 在 Vercel Production 設定 `UPSTASH_REDIS_REST_URL`、`UPSTASH_REDIS_REST_TOKEN`；確認公開表單限流在 Redis 失敗時回 503，而非 memory fallback | Upstash key/TTL 觀測或 staging 契約測試 |
| Uptime | 每 5 分鐘 GET canonical `/robots.txt`，預期 HTTP 200 與 `text/plain`，通知送至團隊告警通道 | Monitor 設定與一次成功探測 |
| Episode content | 人工校對所有 `subtitle-unproofread` 集（目前 `ep-27`）後執行 `npm run proofread:subtitles -- ep-27 --mark`；再確認 `npm run verify:release-content` 無 blocker | proofread marker、release-content exit 0 |
| Physical device QA | 依 `GAME_PHYSICAL_DEVICE_QA.md` 在真實 iPhone、iPad 執行 Safari、旋轉、切 app、畫線、音效與 mute 檢查 | QA checklist 與裝置/OS/日期紀錄 |

P2 的 stories/play-map URL state cache 調查不列入本次 release gate；若日後實作，必須
保留 `?tag=`、`?city=`、返回鍵與 `/topic`、地圖 collection SEO，並以獨立 PR 驗證。

## API safety

訂閱、許願與確認信 endpoint 使用可信 proxy IP + Upstash Redis atomic `INCR/EXPIRE`
limiter。production 缺少 Upstash 或 Redis 失敗時 fail-closed，回 503；429 回
`Retry-After`。email 另有 15 分鐘 cooldown，confirm redirect 使用 `Cache-Control:
no-store`。不要把 email、token、家庭儀表板或故事進度送進 Sentry。

本機驗證：

```sh
npm run lint
npm run audit:production
npm run typecheck
npm test
npm run verify:episodes
npm run verify:release-content   # 目前會指出 ep-27 未校對字幕這個內容 blocker
npm run build
PW_REUSE_SERVER=1 npm run test:e2e:public
PW_REUSE_SERVER=1 npm run test:e2e:ci   # 兒童主路徑；非 ruleset required check
NEXT_PUBLIC_SITE_URL=https://podcast-website-mu.vercel.app \
  npm run verify:geo-live -- --base-url=https://podcast-website-mu.vercel.app --production
```

`verify:episodes` 的 warning 不等於 release blocker：Apple sync 可保留已知的
`illustrate-pending` MVP warning；正式內容發布前則用 `verify:release-content` 分類，
目前 ep-27 的 `subtitle-unproofread` 必須先處理。
