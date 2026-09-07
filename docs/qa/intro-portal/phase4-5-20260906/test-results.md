# Intro Portal Phase 4／5 實作證據

日期：2026-09-06  
基準：`f6ea724` + dirty working tree  
瀏覽器：Playwright 1.60.0／Chromium  
Node：v25.8.0  
範圍：Phase 1、Phase 4、Phase 5；沒有執行 Blender 美術修改、commit 或 push。

## Pass

| 檢查 | 命令／證據 | 結果 |
|---|---|---|
| Intro route／SSR shell | `e2e/intro-portal.spec.ts` route test；`curl /intro` | PASS：200、SSR h1／短句／Enter／Skip、poster URL、`noindex, follow`、canonical `/intro` |
| Landing preservation | `PW_REUSE_SERVER=1 npm run test:e2e:public` | PASS：17/17；root smoke 以 `/?enter=1` 明確測 Landing |
| Intro targeted E2E | `PW_REUSE_SERVER=1 npx playwright test e2e/intro-portal.spec.ts --project=chromium` | PASS：13/13 |
| Session／history／deep link | Intro E2E route test + `IntroVisit.test.ts` | PASS：首次裸 `/` 邀請一次；`enter=1`、hash、deep link、回訪、Back、storage blocked、JS disabled bypass |
| Poster／lazy scene | Intro E2E reduced motion、Save-Data、live branch | PASS：poster 先出；live host ready 後才有 Canvas；reduced motion 無 GLB request |
| WebGL／模型失敗 | WebGL unavailable、GLB 404、HTML 200 偽 GLB fixtures；offline／2G | PASS：回 poster/fallback，Enter 仍可用，沒有無限重試 |
| Live interaction | Intro E2E live branch | PASS：poster→ready、Canvas 單例、pause/resume、Enter 導航 |
| Unit／quality policy | `npx vitest run components/intro/IntroVisit.test.ts components/landing/hero-world/config.test.ts` | PASS：4/4 |
| Full unit suite | `npm test` | PASS：288 files、1,813 tests |
| TypeScript | `npm run typecheck` | PASS |
| Lint | `npm run lint` | PASS |
| Production build | `npm run build` | PASS：Next.js 16.3.2，`/intro` static route 生成 |
| Service worker syntax | `npm run verify:service-worker` | PASS |
| Intro accessibility | Intro E2E axe scan | PASS：無 critical／serious 違規 |

## 已知 blockers／限制

- `public/models/hero-world/v2/` 仍只有 `poster.png`，没有 matching GLB／WebP／manifest。本輪以完整 v1 `/models/hero-world` 資產支撐 Phase 5；v2 需 Phase 6 重新導出後才可切換。
- 尚未做 Phase 6–13：Blender 美術、GLB 最終優化／hash manifest、效能正式量測、真機 Safari／Android、跨 viewport 視覺 QA、field INP、正式部署。
- live 分支已在目前 Chromium host 通過；沒有 WebGL 的平台以同一套 fallback 通過，不把 emulated Chromium 結果當真機驗收。
- 工作樹原有產品／資產草稿與 package lock 變更保持 dirty，未重置也未提交；完整基線見 `../phase1-20260906/baseline.md`。

## 未完成事項

Phase 5 已完成其 exit criteria 所需的靜態入口、lazy WebGL、poster 保持、能力／網路降級、模型錯誤 fallback、資源 owner／abort／dispose 與 demand loop。Phase 6 之後的美術與正式發布驗收保留給後續工作，不在本輪擴張。
