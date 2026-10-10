// 由 scripts/generate-page-freshness.ts 依 git 歷史產生，請勿手動編輯。
// 更新方式：npm run generate:page-freshness

/** 靜態頁最後內容編輯時間：來源為各頁原始碼／資料檔的最後已提交 git commit。 */
export const STATIC_PAGE_MODIFIED_DATES: Record<string, string> = {
  "/about": "2026-10-10T19:20:51+08:00",
  "/adventures": "2026-07-28T03:43:28Z",
  "/characters": "2026-10-08T12:09:01+08:00",
  "/for-parents": "2026-10-10T19:20:51+08:00",
  "/for-parents/play-map": "2026-10-10T19:20:51+08:00",
  "/games": "2026-10-10T22:22:34+08:00",
  "/games/block-drop": "2026-10-05T21:27:51+08:00",
  "/games/candy-match": "2026-10-05T21:27:51+08:00",
  "/games/dino-sushi": "2026-10-10T22:22:34+08:00",
  "/games/coloring-book": "2026-10-10T15:00:26+08:00",
  "/legal": "2026-10-10T19:20:51+08:00",
  "/feedback": "2026-10-10T19:20:51+08:00",
};

/** 對應日期的 git commit 與來源檔，供追溯。 */
export const STATIC_PAGE_MODIFIED_DATE_SOURCE: Record<string, string> = {
  "/about": "fba25703 app/about/page.tsx, app/about/page.module.css",
  "/adventures": "c0401581 app/adventures/page.tsx, app/adventures/page.module.css",
  "/characters": "aa17f0cb app/characters/page.tsx, app/characters/page.module.css, data/characters.json",
  "/for-parents": "fba25703 app/for-parents/page.tsx, app/for-parents/page.module.css, lib/for-parents.ts",
  "/for-parents/play-map": "fba25703 app/for-parents/play-map/page.tsx, app/for-parents/play-map/page.module.css, components/for-parents/PlayMap.tsx, components/for-parents/PlayMapClient.tsx, components/for-parents/PlayMap.module.css, components/for-parents/PlayMapLeaflet.tsx, lib/playgrounds-query.ts, lib/playground-coverage.ts, data/playgrounds.ts",
  "/games": "6ae5faa0 app/games/page.tsx, app/games/layout.tsx, app/games/page.module.css",
  "/games/block-drop": "a2fb94f3 app/games/block-drop/page.tsx, app/games/block-drop/page.module.css",
  "/games/candy-match": "a2fb94f3 app/games/candy-match/page.tsx",
  "/games/dino-sushi": "6ae5faa0 app/games/dino-sushi/page.tsx",
  "/games/coloring-book": "5c6e911f app/games/coloring-book/page.tsx, components/coloring/ColoringBook.tsx, components/coloring/ColoringPageShell.module.css, data/coloring-pages.ts",
  "/legal": "fba25703 app/legal/page.tsx, app/legal/page.module.css",
  "/feedback": "fba25703 app/feedback/page.tsx, app/feedback/page.module.css, lib/feedback-copy.ts, public/feedback/hero.jpg",
};
