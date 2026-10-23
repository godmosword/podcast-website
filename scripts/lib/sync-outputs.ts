/**
 * Apple sync 允許寫回 git 的路徑，清單在 scripts/ci/sync-output-paths.txt（shell 與 TS 共用）。
 * 不能整個放行 data/：那裡有手寫的 content.ts、games.ts 和測試，
 * sync PR 又會跳過 lint／typecheck／單元測試，放行等於讓它們不經檢查進 main。
 * 禁止 git add -A：那會把無關的工作區變更一起捲進去。
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SYNC_OUTPUT_PATHS_FILE = fileURLToPath(
  new URL("../ci/sync-output-paths.txt", import.meta.url),
);

/** 去掉註解與空行。結尾是 / 的是目錄前綴，其餘要一字不差。 */
export function parseSyncOutputPaths(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

export const SYNC_OUTPUT_PATHS: readonly string[] = parseSyncOutputPaths(
  readFileSync(SYNC_OUTPUT_PATHS_FILE, "utf8"),
);

export const SYNC_BRANCH = "sync/apple";

export function normalizeRepoPath(filePath: string): string {
  return filePath.replaceAll("\\", "/").replace(/^\.\//, "");
}

export function isSyncOutputPath(filePath: string): boolean {
  const normalized = normalizeRepoPath(filePath);
  return SYNC_OUTPUT_PATHS.some((entry) =>
    entry.endsWith("/") ? normalized.startsWith(entry) : normalized === entry,
  );
}

/** sync bot 的固定分支，以及第一階段仍可能留下的 sync/apple-<run-id>。 */
export function isSyncBotBranch(branch: string): boolean {
  return branch === SYNC_BRANCH || branch.startsWith(`${SYNC_BRANCH}-`);
}

export function pathsOutsideSyncOutputs(paths: readonly string[]): string[] {
  return paths.filter((filePath) => !isSyncOutputPath(filePath));
}

export type SyncPathDecision = {
  /** sync bot 分支，而且沒有改到允許路徑以外。人開的 PR 一律是 false。 */
  syncOnly: boolean;
  outside: string[];
};

/** 空 diff 的 sync 分支也算路徑有限。超出允許路徑時 syncOnly 為 false，outside 列出那些檔。 */
export function classifySyncDiff(
  branch: string,
  paths: readonly string[],
): SyncPathDecision {
  if (!isSyncBotBranch(branch)) return { syncOnly: false, outside: [] };
  const outside = pathsOutsideSyncOutputs(paths);
  return { syncOnly: outside.length === 0, outside };
}
