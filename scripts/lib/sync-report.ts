import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

export type SyncRunReport = {
  runAt: string;
  dryRun: boolean;
  newEpisodes: Array<{ slug: string; ep: number; title: string }>;
  metadataUpdated: string[];
  tagBackfill: string[];
  vehicleBackfill: string[];
  /** 本輪 Whisper 新產生的側車檔 */
  subtitlesCreated: string[];
  /** 同步內自動 proofread --fix：slug → 修正處數 */
  proofreadAutoFixed: Record<string, number>;
  /** 自動 fix 後仍待人工 lint：slug → 待修項數 */
  proofreadPendingLint: Record<string, number>;
  /** 目錄內有音檔但缺側車檔（同步結束時） */
  subtitlesMissing: string[];
  /** 新集 slug（ep-N），供開 illustrate Issue */
  illustratePending: string[];
  /** 本輪新增至 data/browse-index.json 的車種 */
  browseIndexVehicles: string[];
  /** 本輪新增至 data/browse-index.json 的主題 */
  browseIndexTopics: string[];
  /** emoji 依索引校正 */
  emojiSync: string[];
  /** Apple RSS 新集自動產生的 FAQ MVP，需人工改寫成劇情專屬問答 */
  episodeFaqStubs: string[];
  /** 產生本報告時的 git HEAD short sha（notify 身分比對） */
  gitHead?: string;
};

/** 讀取目前 HEAD short sha；失敗回傳 undefined（不捏造 0000000）。 */
export function resolveGitHeadShort(
  rootDir: string = process.cwd(),
): string | undefined {
  try {
    const sha = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: rootDir,
      encoding: "utf8",
    }).trim();
    return sha || undefined;
  } catch {
    return undefined;
  }
}

/** 未設定 SYNC_REPORT_PATH 時的本機預設報告路徑（相對 repo root） */
export const DEFAULT_SYNC_REPORT_RELATIVE = ".cache/sync-run-report.json";

/**
 * 解析同步報告輸出路徑：
 * - `env.SYNC_REPORT_PATH`（預設讀 `process.env`）非空時 → 原樣回傳（GHA 設 `$RUNNER_TEMP/...` 須維持優先）。
 * - 否則 → `rootDir`（預設 `process.cwd()`）下的 `DEFAULT_SYNC_REPORT_RELATIVE`。
 */
export function resolveSyncReportPath(
  env: NodeJS.ProcessEnv = process.env,
  rootDir: string = process.cwd(),
): string {
  const fromEnv = env.SYNC_REPORT_PATH;
  if (fromEnv && fromEnv.trim() !== "") return fromEnv;
  return path.join(rootDir, DEFAULT_SYNC_REPORT_RELATIVE);
}

export function createEmptyReport(dryRun: boolean): SyncRunReport {
  return {
    runAt: new Date().toISOString(),
    dryRun,
    newEpisodes: [],
    metadataUpdated: [],
    tagBackfill: [],
    vehicleBackfill: [],
    subtitlesCreated: [],
    proofreadAutoFixed: {},
    proofreadPendingLint: {},
    subtitlesMissing: [],
    illustratePending: [],
    browseIndexVehicles: [],
    browseIndexTopics: [],
    emojiSync: [],
    episodeFaqStubs: [],
  };
}

export function isIllustrateSlug(slug: string): boolean {
  return /^ep-\d+$/.test(slug);
}

export async function writeSyncReport(
  report: SyncRunReport,
  filePath: string | undefined,
): Promise<void> {
  if (!filePath) return;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}
