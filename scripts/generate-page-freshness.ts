import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * 靜態頁 → 決定其「最後內容編輯時間」的原始碼／資料檔。
 * 任一來源檔更動即代表該頁內容更新；取所有來源檔中最新的一筆 git commit。
 */
const ROUTE_SOURCES: Record<string, string[]> = {
  "/about": ["app/about/page.tsx", "app/about/page.module.css"],
  "/adventures": ["app/adventures/page.tsx", "app/adventures/page.module.css"],
  "/characters": [
    "app/characters/page.tsx",
    "app/characters/page.module.css",
    "data/characters.json",
  ],
  "/for-parents": [
    "app/for-parents/page.tsx",
    "app/for-parents/page.module.css",
    "lib/for-parents.ts",
  ],
  "/for-parents/play-map": [
    "app/for-parents/play-map/page.tsx",
    "app/for-parents/play-map/page.module.css",
    "components/for-parents/PlayMap.tsx",
    "components/for-parents/PlayMapClient.tsx",
    "components/for-parents/PlayMap.module.css",
    "components/for-parents/PlayMapLeaflet.tsx",
    "lib/playgrounds-query.ts",
    "lib/playground-coverage.ts",
    "data/playgrounds.ts",
  ],
  "/games": [
    "app/games/page.tsx",
    "app/games/layout.tsx",
    "app/games/page.module.css",
  ],
  "/games/block-drop": [
    "app/games/block-drop/page.tsx",
    "app/games/block-drop/page.module.css",
  ],
  "/games/candy-match": ["app/games/candy-match/page.tsx"],
  "/legal": ["app/legal/page.tsx", "app/legal/page.module.css"],
};

const OUTPUT_PATH = resolve(process.cwd(), "data/page-freshness-dates.ts");

type RouteFreshness = { date: string; source: string };

function lastCommit(files: string[]): { hash: string; date: string } | null {
  const existing = files.filter((file) => existsSync(resolve(process.cwd(), file)));
  if (existing.length === 0) return null;

  const out = execFileSync(
    "git",
    ["log", "-1", "--format=%h %cI", "--", ...existing],
    { encoding: "utf8" },
  ).trim();
  if (!out) return null;

  const [hash, date] = out.split(" ");
  return { hash, date };
}

function deriveFreshness(): Record<string, RouteFreshness> {
  const result: Record<string, RouteFreshness> = {};
  for (const [route, files] of Object.entries(ROUTE_SOURCES)) {
    const commit = lastCommit(files);
    if (!commit) {
      throw new Error(`generate-page-freshness: 找不到 ${route} 的來源檔 commit`);
    }
    result[route] = {
      date: commit.date,
      source: `${commit.hash} ${files.join(", ")}`,
    };
  }
  return result;
}

function renderFile(freshness: Record<string, RouteFreshness>): string {
  const dateEntries = Object.entries(freshness)
    .map(([route, { date }]) => `  ${JSON.stringify(route)}: ${JSON.stringify(date)},`)
    .join("\n");
  const sourceEntries = Object.entries(freshness)
    .map(([route, { source }]) => `  ${JSON.stringify(route)}: ${JSON.stringify(source)},`)
    .join("\n");

  return `// 由 scripts/generate-page-freshness.ts 依 git 歷史產生，請勿手動編輯。
// 更新方式：npm run generate:page-freshness

/** 靜態頁最後內容編輯時間：來源為各頁原始碼／資料檔的最後已提交 git commit。 */
export const STATIC_PAGE_MODIFIED_DATES: Record<string, string> = {
${dateEntries}
};

/** 對應日期的 git commit 與來源檔，供追溯。 */
export const STATIC_PAGE_MODIFIED_DATE_SOURCE: Record<string, string> = {
${sourceEntries}
};
`;
}

export function generatePageFreshness(): void {
  const freshness = deriveFreshness();
  writeFileSync(OUTPUT_PATH, renderFile(freshness), "utf8");
}

generatePageFreshness();
console.log(`generated ${OUTPUT_PATH}`);
