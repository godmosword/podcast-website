/**
 * Apple sync 允許寫回 git 的路徑。
 * 實際產物都在 data/（目錄、字幕、sidecar、blur、音檔長度）與 public/stories/。
 * commit 用這兩個前綴 stage，不再維護一份會漏檔的檔名白名單。
 * 禁止 git add -A：那會把無關的工作區變更一起捲進去。
 */

export const SYNC_OUTPUT_PREFIXES = ["data/", "public/stories/"] as const;

export const SYNC_BRANCH = "sync/apple";

export function normalizeRepoPath(filePath: string): string {
  return filePath.replaceAll("\\", "/").replace(/^\.\//, "");
}

export function isSyncOutputPath(filePath: string): boolean {
  const normalized = normalizeRepoPath(filePath);
  return SYNC_OUTPUT_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

/** sync bot 的固定分支，以及第一階段仍可能留下的 sync/apple-<run-id>。 */
export function isSyncBotBranch(branch: string): boolean {
  return branch === SYNC_BRANCH || branch.startsWith(`${SYNC_BRANCH}-`);
}

export function pathsOutsideSyncOutputs(paths: readonly string[]): string[] {
  return paths.filter((filePath) => !isSyncOutputPath(filePath));
}
