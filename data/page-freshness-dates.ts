// 由 scripts/generate-page-freshness.ts 依 git 歷史產生，請勿手動編輯。
// 更新方式：npm run generate:page-freshness

/** 靜態頁最後內容編輯時間：來源為各頁原始碼／資料檔的最後已提交 git commit。 */
export const STATIC_PAGE_MODIFIED_DATES: Record<string, string> = {
  "/about": "2026-07-17T04:27:00Z",
  "/adventures": "2026-07-28T03:43:28Z",
  "/characters": "2026-08-09T11:11:09+08:00",
  "/for-parents": "2026-08-11T21:35:42+08:00",
  "/for-parents/play-map": "2026-08-11T21:35:42+08:00",
  "/games": "2026-07-26T22:54:15+08:00",
  "/games/block-drop": "2026-07-26T11:31:46+08:00",
  "/games/candy-match": "2026-07-26T11:12:56+08:00",
  "/legal": "2026-07-22T21:54:21+08:00",
};

/** 對應日期的 git commit 與來源檔，供追溯。 */
export const STATIC_PAGE_MODIFIED_DATE_SOURCE: Record<string, string> = {
  "/about": "306b989 app/about/page.tsx, app/about/page.module.css",
  "/adventures": "c040158 app/adventures/page.tsx, app/adventures/page.module.css",
  "/characters": "0c4ccf6 app/characters/page.tsx, app/characters/page.module.css, data/characters.json",
  "/for-parents": "08ec732 app/for-parents/page.tsx, app/for-parents/page.module.css, lib/for-parents.ts",
  "/for-parents/play-map": "08ec732 app/for-parents/play-map/page.tsx, app/for-parents/play-map/page.module.css, components/for-parents/PlayMap.tsx, components/for-parents/PlayMap.module.css, components/for-parents/PlayMapLeaflet.tsx, components/for-parents/PlayMapLoader.tsx, lib/playgrounds-query.ts, lib/playground-coverage.ts, data/playgrounds.ts",
  "/games": "40c951b app/games/page.tsx, app/games/layout.tsx, app/games/page.module.css",
  "/games/block-drop": "98a6944 app/games/block-drop/page.tsx, app/games/block-drop/page.module.css",
  "/games/candy-match": "ceb92f4 app/games/candy-match/page.tsx",
  "/legal": "fdbe8c9 app/legal/page.tsx, app/legal/page.module.css",
};
