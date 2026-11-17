/**
 * 把一集加進官網發行清單。不推 release、不部署。
 * 用法：npm run release:approve -- ep-38
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getCatalogStories } from "../data/content";
import {
  officialReleaseManifest,
  type OfficialReleaseManifest,
} from "../lib/official-release";
import { hashTree, type ReleaseAsset } from "./lib/official-release-files";

const ROOT = process.cwd();
const slug = process.argv.slice(2).find((arg) => !arg.startsWith("--"));

function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei" }).format(new Date());
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(join(ROOT, path), `${JSON.stringify(value, null, 2)}\n`);
}

function main(): void {
  if (!slug || !/^ep-\d+$/.test(slug)) {
    throw new Error("用法：npm run release:approve -- ep-38");
  }
  if (!getCatalogStories().some((story) => story.slug === slug)) {
    throw new Error(`${slug} 不在故事目錄裡。`);
  }

  const manifest: OfficialReleaseManifest = structuredClone(officialReleaseManifest());
  if (manifest.id === "uninitialized") {
    throw new Error("請先建立發行清單。");
  }
  if (!manifest.stories.includes(slug)) manifest.stories.push(slug);
  manifest.stories.sort((left, right) => {
    const leftNumber = Number(left.slice(3));
    const rightNumber = Number(right.slice(3));
    return leftNumber - rightNumber;
  });
  manifest.revokedStorySlugs = manifest.revokedStorySlugs.filter((item) => item !== slug);
  manifest.sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
  manifest.approvedAt = today();
  manifest.humanApproved = true;
  manifest.qualityCheck = {
    status: "not-run",
    command: "npm run verify:release-content",
    note: "這次只核准單集。品質檢查要另外跑，結果不會自動寫進清單。",
  };

  const assetsPath = join(ROOT, "data/official-release-assets.json");
  const assets = JSON.parse(readFileSync(assetsPath, "utf8")) as {
    sourceCommit: string;
    files: ReleaseAsset[];
  };
  const prefix = `public/stories/${slug}/`;
  assets.files = [
    ...assets.files.filter((file) => !file.path.startsWith(prefix)),
    ...hashTree(ROOT, `public/stories/${slug}`),
  ].sort((left, right) => left.path.localeCompare(right.path));
  assets.sourceCommit = manifest.sourceCommit;

  writeJson("data/official-release.json", manifest);
  writeJson("data/official-release-assets.json", assets);
  writeJson("public/sw-revocations.json", { storySlugs: manifest.revokedStorySlugs });
  console.log(`${slug} 已寫進發行清單。請提交後，由負責人把這個 commit 推進 release。`);
  console.log("15 分鐘的 Apple sync 只更新 main，不會更新官網。");
}

main();
