# Production Release Gate

這份文件是全站（遊戲之外）正式上線的操作契約。遊戲 baseline 維持既有
`e2e/smoke.spec.ts`、`e2e/a11y.spec.ts` 與遊戲專用測試；本 gate 只跑獨立的
public suite。

## Repository checks

CI 的兩個 required check 名稱是：

- `quality`：production dependency audit、lint、typecheck、Vitest
- `build-and-public-e2e`：production build、public smoke、public axe

public suite 包含首頁、故事、主題、角色、家長頁、訂閱、法律頁、故事播放、地圖入口，
以及 branded 404 與 mobile viewport。它只把未處理 `pageerror`、同源 4xx/5xx resource
與明確頁面錯誤當成 blocking signal；analytics warning 不會單獨擋版。

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
則在上述 checks 通過後 merge。`5cf696b` 的 Production deployment 及部署後
`verify-geo-live` 也都成功。

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
npm run verify:release-content   # 目前會指出 ep-26 未校對字幕這個內容 blocker
npm run build
PW_REUSE_SERVER=1 npm run test:e2e:public
NEXT_PUBLIC_SITE_URL=https://podcast-website-mu.vercel.app \
  npm run verify:geo-live -- --base-url=https://podcast-website-mu.vercel.app --production
```

`verify:episodes` 的 warning 不等於 release blocker：Apple sync 可保留已知的
`illustrate-pending` MVP warning；正式內容發布前則用 `verify:release-content` 分類，
目前 ep-26 的 `subtitle-unproofread` 必須先處理。
