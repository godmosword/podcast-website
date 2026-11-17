/**
 * 把目前目錄寫成第一份官網發行清單。
 * 只在清單仍是 uninitialized，或明確帶 --force 時覆寫。
 * 新集請用 release:approve，不要重跑這支把未核准的集數加回去。
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { getCatalogStories } from "../data/content";
import { NEWSLETTERS } from "../data/newsletters";
import { PARENT_ARTICLES } from "../data/parent-articles";
import { PARENT_TRAVEL_ABROAD_ARTICLES } from "../data/parent-travel-abroad-articles";
import type { OfficialReleaseManifest } from "../lib/official-release";
import { officialReleaseManifest } from "../lib/official-release";
import { hashTree, type ReleaseAsset } from "./lib/official-release-files";

const ROOT = process.cwd();
const force = process.argv.includes("--force");

function episodeSort(left: string, right: string): number {
  const leftNumber = Number(left.replace(/^ep-/, ""));
  const rightNumber = Number(right.replace(/^ep-/, ""));
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber !== rightNumber) {
    return leftNumber - rightNumber;
  }
  return left.localeCompare(right);
}

function main(): void {
  const current = officialReleaseManifest();
  if (current.id !== "uninitialized" && !force) {
    throw new Error("發行清單已存在。新集用 npm run release:approve。若要整份重寫，加 --force。");
  }

  const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();

  const stories = getCatalogStories().map((story) => story.slug).sort(episodeSort);
  const manifest: OfficialReleaseManifest = {
    version: 1,
    id: "2026-11-17-live-catalog",
    sourceCommit,
    humanApproved: true,
    approvedAt: "2026-11-17",
    qualityCheck: {
      status: "not-run",
      command: "npm run verify:release-content",
      note: "第一份清單是目前已公開的目錄，不是 verify:release-content 的結果。那個指令仍只做品質檢查，單圖 MVP 可以是 accepted warning。",
    },
    previousId: null,
    stories,
    parentArticles: PARENT_ARTICLES.map((article) => article.slug),
    newsletters: NEWSLETTERS.map((issue) => issue.slug),
    travelAbroad: PARENT_TRAVEL_ABROAD_ARTICLES.map((article) => article.slug),
    revokedStorySlugs: [],
  };

  const assets: ReleaseAsset[] = stories.flatMap((slug) => hashTree(ROOT, `public/stories/${slug}`));
  writeFileSync(join(ROOT, "data/official-release.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(
    join(ROOT, "data/official-release-assets.json"),
    `${JSON.stringify({ sourceCommit, files: assets }, null, 2)}\n`,
  );
  writeFileSync(join(ROOT, "public/sw-revocations.json"), `${JSON.stringify({ storySlugs: [] }, null, 2)}\n`);
  console.log(`已寫入 ${stories.length} 集、${assets.length} 個素材雜湊。來源 commit ${sourceCommit}。`);
}

main();
