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

/**
 * GHA／本機都是「先 `sync:apple` 寫 report（gitHead＝當時 HEAD）再 commit」。
 * notify 時 HEAD 會比 report.gitHead 新一顆（或 rebase 後再多幾顆），
 * 嚴格相等會讓 push 成功卻拒絕開待生圖 Issue（ep-25 即因此漏單）。
 */
export const MAX_NOTIFY_GIT_HEAD_AHEAD = 20;

export type ReportGitHeadCheck =
  | { ok: true }
  | { ok: false; current?: string; reason: string };

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

/**
 * report.gitHead 是否仍代表「這次 sync 之後、尚未跑太遠」的 repo。
 * 接受：相同 HEAD，或 report.gitHead 是 HEAD 祖先且距離 ≤ MAX_NOTIFY_GIT_HEAD_AHEAD。
 * 讀不到目前 HEAD 時不擋（與舊行為一致）。
 */
export function isReportGitHeadAcceptable(
  reportGitHead: string,
  rootDir: string = process.cwd(),
): ReportGitHeadCheck {
  const current = resolveGitHeadShort(rootDir);
  if (!current) return { ok: true };

  const report = reportGitHead.trim();
  if (!report) return { ok: true };
  if (report === current) return { ok: true };

  try {
    execFileSync("git", ["merge-base", "--is-ancestor", report, "HEAD"], {
      cwd: rootDir,
      stdio: "pipe",
    });
    const countRaw = execFileSync(
      "git",
      ["rev-list", "--count", `${report}..HEAD`],
      { cwd: rootDir, encoding: "utf8", stdio: "pipe" },
    ).trim();
    const count = Number(countRaw);
    if (!Number.isFinite(count) || count > MAX_NOTIFY_GIT_HEAD_AHEAD) {
      return {
        ok: false,
        current,
        reason: `gitHead=${report} 落後 HEAD=${current} ${countRaw} commit（上限 ${MAX_NOTIFY_GIT_HEAD_AHEAD}）`,
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      current,
      reason: `gitHead=${report} 與目前 HEAD=${current} 不符（非祖先）`,
    };
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
