/**
 * 官網 build 依發行清單刪除排除的路由與未核准素材。
 * 實驗站的 npm run build 不會呼叫這支。
 *
 *   tsx scripts/release-prune.ts              只印將刪除的路徑
 *   tsx scripts/release-prune.ts --apply      真的刪。須 VERCEL=1 或 OFFICIAL_BUILD_UNLOCK=1
 */
import { PARENT_ARTICLES, type ParentArticle } from "../data/parent-articles";
import { PARENT_TRAVEL_ABROAD_ARTICLES } from "../data/parent-travel-abroad-articles";
import { officialReleaseManifest } from "../lib/official-release";
import { applyPrune, pathsToPrune, unreferencedFiles } from "./lib/release-prune";

const rootFlag = process.argv.indexOf("--root");
const root = rootFlag >= 0 ? process.argv[rootFlag + 1] : process.cwd();
const apply = process.argv.includes("--apply");

if (!root) {
  throw new Error("--root 後面要接目錄。");
}

if (apply && process.env.VERCEL !== "1" && process.env.OFFICIAL_BUILD_UNLOCK !== "1") {
  throw new Error(
    "release:prune --apply 會刪除檔案。只在 Vercel 官網 build，或暫時目錄配 OFFICIAL_BUILD_UNLOCK=1 時執行。",
  );
}

if (apply && process.env.SITE_EDITION !== "official") {
  throw new Error("release:prune --apply 只允許 SITE_EDITION=official。");
}

if (apply && !process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
  throw new Error("SITE_EDITION=official 時必須設定 NEXT_PUBLIC_SITE_URL。");
}

const manifest = officialReleaseManifest();
if (apply && (!manifest.humanApproved || manifest.id === "uninitialized")) {
  throw new Error("發行清單尚未人工核准，不能 prune。");
}

const approvedArticleSlugs = new Set([
  ...manifest.parentArticles,
  ...manifest.travelAbroad,
]);

function articleAssetPaths(article: ParentArticle): string[] {
  const urls = [
    article.coverImage,
    ...article.blocks.flatMap((block) => (block.type === "image" ? [block.src] : [])),
  ];
  return urls.flatMap((url) =>
    url?.startsWith("/parent-articles/") ? [`public${url}`] : [],
  );
}

const keptArticleAssets = new Set(
  [...PARENT_ARTICLES, ...PARENT_TRAVEL_ABROAD_ARTICLES]
    .filter((article) => approvedArticleSlugs.has(article.slug))
    .flatMap(articleAssetPaths),
);

const paths = [
  ...pathsToPrune(root, manifest.stories),
  ...unreferencedFiles(root, "public/parent-articles", keptArticleAssets),
];
if (!apply) {
  console.log(paths.length === 0 ? "（沒有要刪的路徑）" : paths.join("\n"));
  process.exit(0);
}

applyPrune(root, paths);
console.log(`已刪除 ${paths.length} 個路徑。`);
