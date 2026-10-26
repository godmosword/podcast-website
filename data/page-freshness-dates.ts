// 由 scripts/generate-page-freshness.ts 依 git 歷史產生，請勿手動編輯。
// 更新方式：npm run generate:page-freshness

/** 靜態頁最後內容編輯時間：來源為各頁原始碼／資料檔的最後已提交 git commit。 */
export const STATIC_PAGE_MODIFIED_DATES: Record<string, string> = {
  "/about": "2026-10-18T15:27:47+08:00",
  "/adventures": "2026-07-28T03:43:28+00:00",
  "/characters": "2026-10-17T17:02:29+08:00",
  "/for-parents/dashboard": "2026-10-26T04:42:20+00:00",
  "/for-parents/play-map": "2026-10-26T11:47:25+08:00",
  "/games": "2026-10-26T04:42:20+00:00",
  "/games/candy-match": "2026-10-05T21:27:51+08:00",
  "/games/dino-sushi": "2026-10-15T11:38:11+08:00",
  "/games/orange-express": "2026-10-26T04:42:20+00:00",
  "/games/coloring-book": "2026-10-12T11:32:58+08:00",
  "/legal": "2026-10-16T22:23:32+08:00",
  "/feedback": "2026-10-10T19:20:51+08:00",
};

/** 對應日期的 git commit 與來源檔，供追溯。 */
export const STATIC_PAGE_MODIFIED_DATE_SOURCE: Record<string, string> = {
  "/about": "60aa4ff8 app/about/page.tsx, app/about/page.module.css, components/about/AboutParentFaq.tsx, components/about/AboutParentFaq.module.css, lib/for-parents.ts",
  "/adventures": "c0401581 app/adventures/page.tsx, app/adventures/page.module.css",
  "/characters": "d6ecbf9c app/characters/page.tsx, app/characters/page.module.css, data/characters.json",
  "/for-parents/dashboard": "a8545f44 app/for-parents/dashboard/page.tsx, app/for-parents/dashboard/page.module.css, components/for-parents/ParentDashboard.tsx, components/for-parents/parent-dashboard.module.css, lib/for-parents/dashboard.ts, lib/for-parents/dashboard-next-up.ts",
  "/for-parents/play-map": "ce3cceb5 app/for-parents/play-map/page.tsx, app/for-parents/play-map/page.module.css, components/for-parents/PlayMap.tsx, components/for-parents/PlayMapClient.tsx, components/for-parents/PlayMap.module.css, components/for-parents/PlayMapLeaflet.tsx, lib/playgrounds-query.ts, lib/playground-coverage.ts, data/playgrounds.ts",
  "/games": "a8545f44 app/games/page.tsx, app/games/layout.tsx, app/games/page.module.css",
  "/games/candy-match": "a2fb94f3 app/games/candy-match/page.tsx",
  "/games/dino-sushi": "6e4c991b app/games/dino-sushi/page.tsx",
  "/games/orange-express": "a8545f44 app/games/orange-express/page.tsx",
  "/games/coloring-book": "a5088f15 app/games/coloring-book/page.tsx, components/coloring/ColoringBook.tsx, components/coloring/ColoringPageShell.module.css, data/coloring-pages.ts",
  "/legal": "16072d62 app/legal/page.tsx, app/legal/page.module.css",
  "/feedback": "fba25703 app/feedback/page.tsx, app/feedback/page.module.css, lib/feedback-copy.ts, public/feedback/hero.jpg",
};
