// 由 scripts/generate-page-freshness.ts 依 git 歷史產生，請勿手動編輯。
// 更新方式：npm run generate:page-freshness

/** 靜態頁最後內容編輯時間：來源為各頁原始碼／資料檔的最後已提交 git commit。 */
export const STATIC_PAGE_MODIFIED_DATES: Record<string, string> = {
  "/about": "2026-07-11T11:31:38+08:00",
  "/adventures": "2026-07-10T00:15:08+08:00",
  "/characters": "2026-07-11T11:31:38+08:00",
  "/for-parents": "2026-07-11T11:31:38+08:00",
  "/games": "2026-06-25T23:27:22+08:00",
  "/games/block-drop": "2026-06-12T22:00:16+08:00",
  "/games/car-adventure": "2026-06-09T08:55:28Z",
  "/games/candy-kart": "2026-06-13T07:11:42+08:00",
  "/games/candy-match": "2026-06-13T09:56:24+08:00",
  "/legal": "2026-07-11T11:31:38+08:00",
};

/** 對應日期的 git commit 與來源檔，供追溯。 */
export const STATIC_PAGE_MODIFIED_DATE_SOURCE: Record<string, string> = {
  "/about": "82efc6d app/about/page.tsx, app/about/page.module.css",
  "/adventures": "503ad8b app/adventures/page.tsx, app/adventures/page.module.css",
  "/characters": "82efc6d app/characters/page.tsx, app/characters/page.module.css, data/characters.json",
  "/for-parents": "82efc6d app/for-parents/page.tsx, app/for-parents/page.module.css, lib/for-parents.ts",
  "/games": "460f23c app/games/page.tsx, app/games/layout.tsx, app/games/page.module.css",
  "/games/block-drop": "5113ba7 app/games/block-drop/page.tsx, app/games/block-drop/page.module.css",
  "/games/car-adventure": "88c803b app/games/car-adventure/page.tsx, app/games/car-adventure/page.module.css",
  "/games/candy-kart": "ae0ee20 app/games/candy-kart/page.tsx, app/games/candy-kart/page.module.css",
  "/games/candy-match": "c3870df app/games/candy-match/page.tsx",
  "/legal": "82efc6d app/legal/page.tsx, app/legal/page.module.css",
};
