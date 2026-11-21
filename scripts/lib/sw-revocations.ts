import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * 官網下架名單寫在 public/sw.js 的 `const REVOKED_STORY_SLUGS = [...]` 這一行。
 *
 * 放在 sw.js 本身是刻意的：名單一變，sw.js 就有 byte 差異，瀏覽器才會重裝 Service Worker、
 * 在 activate 只刪這幾集的快取；CACHE_NAME 不升，其他集數的離線快取留著。
 * 名單沒變時輸出一模一樣，核准新集不會讓所有人重裝。
 */

export const SW_SOURCE_PATH = "public/sw.js";

const SLUG_PATTERN = /^ep-\d+$/;
const LINE_PATTERN = /^const REVOKED_STORY_SLUGS = (.*?);(\r?)$/gm;

function byEpisode(left: string, right: string): number {
  return Number(left.slice(3)) - Number(right.slice(3));
}

function findLine(source: string): RegExpExecArray {
  const matches = [...source.matchAll(LINE_PATTERN)];
  if (matches.length !== 1) {
    throw new Error(
      `public/sw.js 要剛好有一行 const REVOKED_STORY_SLUGS = [...];，實際找到 ${matches.length} 行。`,
    );
  }
  return matches[0];
}

export function readRevokedSlugs(source: string): string[] {
  const parsed: unknown = JSON.parse(findLine(source)[1]);
  if (!Array.isArray(parsed) || !parsed.every((slug) => typeof slug === "string")) {
    throw new Error("REVOKED_STORY_SLUGS 不是字串陣列。");
  }
  return parsed;
}

export function withRevokedSlugs(source: string, slugs: readonly string[]): string {
  const invalid = slugs.filter((slug) => !SLUG_PATTERN.test(slug));
  if (invalid.length > 0) {
    throw new Error(`下架名單只能放 ep-N：${invalid.join(", ")}`);
  }
  const line = findLine(source);
  const sorted = [...new Set(slugs)].sort(byEpisode);
  const next = `const REVOKED_STORY_SLUGS = ${JSON.stringify(sorted)};${line[2]}`;
  const start = line.index;
  return source.slice(0, start) + next + source.slice(start + line[0].length);
}

/**
 * 先讀、先驗、先算好新的 sw.js，回傳真正寫檔的函式。
 * 發行腳本要在寫任何清單之前呼叫，sw.js 有問題時整個腳本在寫檔前就失敗，不留下一半的結果。
 */
export function prepareSwRevocations(root: string, slugs: readonly string[]): () => void {
  const path = join(root, SW_SOURCE_PATH);
  const source = readFileSync(path, "utf8");
  const next = withRevokedSlugs(source, slugs);
  return () => {
    if (next !== source) writeFileSync(path, next);
  };
}
