/**
 * 從官網發行清單拿下一集，並記入 Service Worker 只刪該集快取的名單。
 * 用法：npm run release:revoke -- ep-38
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  officialReleaseManifest,
  type OfficialReleaseManifest,
} from "../lib/official-release";
import type { ReleaseAsset } from "./lib/official-release-files";
import { prepareSwRevocations } from "./lib/sw-revocations";

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
    throw new Error("用法：npm run release:revoke -- ep-38");
  }

  const manifest: OfficialReleaseManifest = structuredClone(officialReleaseManifest());
  if (!manifest.stories.includes(slug)) {
    throw new Error(`${slug} 不在發行清單裡。`);
  }
  manifest.stories = manifest.stories.filter((item) => item !== slug);
  if (!manifest.revokedStorySlugs.includes(slug)) manifest.revokedStorySlugs.push(slug);
  manifest.sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
  manifest.approvedAt = today();
  manifest.humanApproved = true;
  manifest.qualityCheck = {
    ...manifest.qualityCheck,
    status: "not-run",
    note: "下架後尚未重跑品質檢查。",
  };

  const assetsPath = join(ROOT, "data/official-release-assets.json");
  const assets = JSON.parse(readFileSync(assetsPath, "utf8")) as {
    sourceCommit: string;
    files: ReleaseAsset[];
  };
  const prefix = `public/stories/${slug}/`;
  assets.files = assets.files.filter((file) => !file.path.startsWith(prefix));
  assets.sourceCommit = manifest.sourceCommit;

  const writeSw = prepareSwRevocations(ROOT, manifest.revokedStorySlugs);
  writeJson("data/official-release.json", manifest);
  writeJson("data/official-release-assets.json", assets);
  writeSw();
  console.log(`${slug} 已從發行清單拿下。官網下次 build 會刪素材，並換上新的 sw.js；回訪者的瀏覽器重裝後只清該集快取。`);
}

main();
