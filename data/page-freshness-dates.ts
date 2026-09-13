// 由 scripts/generate-page-freshness.ts 依 git 歷史產生，請勿手動編輯。
// 更新方式：npm run generate:page-freshness

/** 靜態頁最後內容編輯時間：來源為各頁原始碼／資料檔的最後已提交 git commit。 */
export const STATIC_PAGE_MODIFIED_DATES: Record<string, string> = {
  "/about": "2026-09-05T10:16:07+08:00",
  "/adventures": "2026-07-28T03:43:28Z",
  "/characters": "2026-09-11T04:21:00Z",
  "/for-parents": "2026-08-30T09:34:06+08:00",
  "/for-parents/play-map": "2026-08-30T09:34:26+08:00",
  "/games": "2026-09-11T22:49:54+08:00",
  "/games/block-drop": "2026-08-28T05:55:15Z",
  "/games/candy-match": "2026-07-26T11:12:56+08:00",
  "/games/coloring-book": "2026-08-29T12:26:53+08:00",
  "/legal": "2026-09-11T21:03:12+08:00",
  "/feedback": "2026-09-11T20:24:39+08:00",
};

/** 對應日期的 git commit 與來源檔，供追溯。 */
export const STATIC_PAGE_MODIFIED_DATE_SOURCE: Record<string, string> = {
  "/about": "490fe1c4 app/about/page.tsx, app/about/page.module.css",
  "/adventures": "c0401581 app/adventures/page.tsx, app/adventures/page.module.css",
  "/characters": "e06cce9c app/characters/page.tsx, app/characters/page.module.css, data/characters.json",
  "/for-parents": "647f3ee5 app/for-parents/page.tsx, app/for-parents/page.module.css, lib/for-parents.ts",
  "/for-parents/play-map": "98481241 app/for-parents/play-map/page.tsx, app/for-parents/play-map/page.module.css, components/for-parents/PlayMap.tsx, components/for-parents/PlayMapClient.tsx, components/for-parents/PlayMap.module.css, components/for-parents/PlayMapLeaflet.tsx, lib/playgrounds-query.ts, lib/playground-coverage.ts, data/playgrounds.ts",
  "/games": "baae10dd app/games/page.tsx, app/games/layout.tsx, app/games/page.module.css",
  "/games/block-drop": "2a37cc07 app/games/block-drop/page.tsx, app/games/block-drop/page.module.css",
  "/games/candy-match": "ceb92f4a app/games/candy-match/page.tsx",
  "/games/coloring-book": "0a950de4 app/games/coloring-book/page.tsx, components/coloring/ColoringBook.tsx, components/coloring/ColoringPageShell.module.css, data/coloring-pages.ts",
  "/legal": "1710c9d9 app/legal/page.tsx, app/legal/page.module.css",
  "/feedback": "5ba1a20e app/feedback/page.tsx, app/feedback/page.module.css, lib/feedback-copy.ts, public/feedback/hero.jpg",
};
