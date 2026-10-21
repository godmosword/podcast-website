/**
 * RSS stale 告警決策：新集等待下次 sync 時不另開單，
 * 只在「真的卡住」時才開 sync-stale-rss，避免與待生圖 Issue 連發兩次。
 * 固定分支 sync/apple 的 PR 太久沒合入，另外記一筆，不跟 stale 混在同一張單。
 */
import { isSyncBotBranch } from "./sync-outputs";
export type SyncWorkflowRun = {
  status?: string;
  conclusion?: string | null;
  createdAt?: string;
  startedAt?: string;
};

export type StaleRssDecision = {
  action: "resolve" | "silent" | "open";
  reason: string;
};

/** yaml 仍可設 STALE_HOURS=3；未另設 WAIT_FOR_SYNC_HOURS 時，第一次開 stale 至少等 8 小時。 */
const DEFAULT_WAIT_FOR_FIRST_SYNC_HOURS = 8;

export function waitForFirstSyncHoursFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): number {
  const rawWait = env.WAIT_FOR_SYNC_HOURS?.trim();
  if (rawWait) {
    const parsed = Number(rawWait);
    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : DEFAULT_WAIT_FOR_FIRST_SYNC_HOURS;
  }
  const stale = Number(env.STALE_HOURS ?? "3");
  const floor = Number.isFinite(stale) && stale > 0 ? stale : 3;
  return Math.max(floor, DEFAULT_WAIT_FOR_FIRST_SYNC_HOURS);
}

function runStartMs(run: SyncWorkflowRun): number | null {
  const raw = run.startedAt || run.createdAt;
  if (!raw) return null;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? null : t;
}

export function isSyncRunActive(run: SyncWorkflowRun): boolean {
  return run.status === "in_progress" || run.status === "queued";
}

export function runsAfterPubDate(
  runs: SyncWorkflowRun[],
  pubDate: string,
): SyncWorkflowRun[] {
  const pub = Date.parse(pubDate);
  if (Number.isNaN(pub)) return [];
  return runs.filter((run) => {
    const started = runStartMs(run);
    return started != null && started >= pub;
  });
}

/** sync/apple 開超過這麼久還沒合入，看門狗就記一筆。 */
export const DEFAULT_UNMERGED_PR_HOURS = 2;

export type SyncLandingPr = {
  headRefName?: string;
  createdAt?: string;
  url?: string;
  number?: number;
};

export function hasOpenSyncLandingPr(
  prs: Array<{ headRefName?: string }>,
): boolean {
  return prs.some((pr) => isSyncBotBranch(pr.headRefName ?? ""));
}

export function decideUnmergedSyncPr(input: {
  prs: readonly SyncLandingPr[];
  now?: number;
  unmergedAfterHours?: number;
}): { action: "silent" | "open"; reason: string; pr?: SyncLandingPr } {
  const open = input.prs.filter((pr) => isSyncBotBranch(pr.headRefName ?? ""));
  if (open.length === 0) {
    return { action: "silent", reason: "沒有未合入的 sync PR" };
  }
  const now = input.now ?? Date.now();
  const wait = input.unmergedAfterHours ?? DEFAULT_UNMERGED_PR_HOURS;
  const aged = open
    .map((pr) => {
      const created = pr.createdAt ? Date.parse(pr.createdAt) : Number.NaN;
      const hours = Number.isNaN(created) ? null : (now - created) / 3_600_000;
      return { pr, hours };
    })
    .filter((item): item is { pr: SyncLandingPr; hours: number } => item.hours != null && item.hours >= wait)
    .sort((a, b) => b.hours - a.hours);
  if (aged.length === 0) {
    return { action: "silent", reason: "sync PR 還在等待 checks／auto-merge" };
  }
  const oldest = aged[0];
  return {
    action: "open",
    reason: `sync PR 已開 ${oldest.hours.toFixed(1)}h 仍未合入`,
    pr: oldest.pr,
  };
}

export function decideStaleRssAlert(input: {
  onSite: boolean;
  hours: number | null;
  syncActive: boolean;
  postPublishRuns: SyncWorkflowRun[];
  waitForFirstSyncHours: number;
  /** 已有 sync/apple-* PR 等 checks／auto-merge，集數還沒在 main。 */
  syncLandingPending?: boolean;
}): StaleRssDecision {
  if (input.onSite) {
    return { action: "resolve", reason: "RSS 最新集已上站" };
  }
  if (input.hours == null) {
    return { action: "silent", reason: "pubDate 缺失／未來／invalid，不告警" };
  }
  if (input.syncActive || input.postPublishRuns.some(isSyncRunActive)) {
    return { action: "silent", reason: "sync workflow 正在跑／排隊，看門狗靜默" };
  }
  if (input.syncLandingPending) {
    return {
      action: "silent",
      reason: "sync PR 已開、尚未合入 main，看門狗靜默",
    };
  }
  if (input.hours <= input.waitForFirstSyncHours) {
    return {
      action: "silent",
      reason: `新集仍在等待第一次 sync／合入（${input.hours.toFixed(1)}h ≤ ${input.waitForFirstSyncHours}h）`,
    };
  }
  return {
    action: "open",
    reason: `RSS 新集已 ${input.hours.toFixed(1)}h 未上站，且已超過等待窗 ${input.waitForFirstSyncHours}h`,
  };
}
