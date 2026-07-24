#!/usr/bin/env npx tsx
/**
 * 同步告警（只用 GitHub Issue）。集中 Issue 互動，供：
 *   - sync workflow：失敗即 `failure` 開／補 sync-job-failure Issue；
 *     push 後 `notify-live`（新集上站＋開 illustrate Issue）；成功 resolve 舊失敗單。
 *   - 本機：`npm run sync:notify`（push 後讀 `.cache/sync-run-report.json` 開 illustrate Issue）
 *   - watchdog：以 import 方式呼叫 openOrCommentIssue / resolveIssue。
 *
 * 紅線：失敗 Issue 只做去重告警與 run 連結，詳細錯誤仍以 Actions logs 為準；
 * Issue 另保留人工動作：待生圖與 RSS stale。
 *
 * notify-live 路徑：dryRun／過期 report 拒絕開單；gh 缺失時 fail-soft（GHA 預設 exit 0）；
 * 本機 `--strict` 且全數 gh 失敗時可 exit 1。可選 `--reconcile` 從 catalog 補開（≤3）。
 *
 * 環境變數：
 *   SYNC_REPORT_PATH      — sync 寫入的 JSON（notify-live 用；未設時 default `.cache/sync-run-report.json`）
 *   SYNC_ISSUE_ASSIGNEES  — 逗號分隔 GitHub username
 *   SYNC_ISSUE_MENTIONS   — Issue 開頭 @mention
 *   SYNC_ALERT_DRY_RUN=1  — 不實際呼叫 gh，只印出將執行的動作
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { getStories } from "../data/content";
import {
  createEmptyReport,
  isIllustrateSlug,
  resolveGitHeadShort,
  resolveSyncReportPath,
  type SyncRunReport,
} from "./lib/sync-report";
import { buildIssueBody } from "./post-sync-notify";

export type AlertKind = "sync-job-failure" | "sync-stale-rss";
export type GhRunner = (args: string[]) => string;
export type SyncAlertDeps = {
  gh?: GhRunner;
  env?: NodeJS.ProcessEnv;
  log?: (message: string) => void;
  warn?: (message: string) => void;
  readFile?: (filePath: string) => string;
  /** 測試用：覆寫 catalog 來源（預設 getStories） */
  getStories?: () => Array<{
    slug: string;
    pageCount: number;
    date: string;
    ep: number;
  }>;
};

export type NotifyLiveOptions = {
  slugs?: string[];
  trigger?: "local" | "gha";
  /** reconcile 無完整 sync report 時，Issue 內文標註人工核對 */
  catalogOnly?: boolean;
};

export type NotifyLiveResult = {
  ok: number;
  skipped: number;
  failed: number;
};

const BASE_LABEL = "sync-alert";
const DRY_RUN = process.env.SYNC_ALERT_DRY_RUN === "1";
const STALE_MS = 24 * 60 * 60 * 1000;
const RECONCILE_MAX = 3;
const RECONCILE_RECENCY_DAYS = 30;

const KIND_META: Record<AlertKind, { color: string; description: string }> = {
  "sync-job-failure": { color: "d73a4a", description: "Apple 同步 workflow 失敗" },
  "sync-stale-rss": { color: "fbca04", description: "RSS 有新集但未上站" },
};

function gh(args: string[]): string {
  if (DRY_RUN) {
    console.log(`[dry-run] gh ${args.join(" ")}`);
    return "";
  }
  return execFileSync("gh", args, { encoding: "utf8" }).trim();
}

function callGh(args: string[], deps: SyncAlertDeps = {}): string {
  return (deps.gh ?? gh)(args);
}

function log(deps: SyncAlertDeps, message: string): void {
  (deps.log ?? console.log)(message);
}

function warn(deps: SyncAlertDeps, message: string): void {
  (deps.warn ?? console.warn)(message);
}

/** 確保 label 存在（已存在則忽略）。 */
function ensureLabel(
  name: string,
  color: string,
  description: string,
  deps: SyncAlertDeps = {},
): void {
  try {
    callGh([
      "label",
      "create",
      name,
      "--color",
      color,
      "--description",
      description,
      "--force",
    ], deps);
  } catch {
    /* label 已存在或無權限：去重改以 list 過濾，仍可運作 */
  }
}

function assigneeArgs(env: NodeJS.ProcessEnv = process.env): string[] {
  const raw = env.SYNC_ISSUE_ASSIGNEES?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap((user) => ["--assignee", user]);
}

function mentionPreamble(env: NodeJS.ProcessEnv = process.env): string {
  const mentions = env.SYNC_ISSUE_MENTIONS?.trim();
  return mentions ? `${mentions}\n\n` : "";
}

function findOpenIssueNumber(
  kind: AlertKind,
  deps: SyncAlertDeps = {},
): number | null {
  try {
    const out = callGh([
      "issue",
      "list",
      "--state",
      "open",
      "--label",
      BASE_LABEL,
      "--label",
      kind,
      "--json",
      "number",
      "--limit",
      "1",
    ], deps);
    const parsed = JSON.parse(out || "[]") as Array<{ number?: number }>;
    return parsed[0]?.number ?? null;
  } catch {
    return null;
  }
}

/** 開單或補 comment（同類去重）。 */
export function openOrCommentIssue(
  opts: {
    kind: AlertKind;
    title: string;
    body: string;
  },
  deps: SyncAlertDeps = {},
): void {
  const { kind, title, body } = opts;
  const env = deps.env ?? process.env;
  try {
    const existing = findOpenIssueNumber(kind, deps);
    if (existing != null) {
      callGh(["issue", "comment", String(existing), "--body", body], deps);
      log(deps, `已補 comment 至 #${existing}（${kind}）`);
      return;
    }
    const meta = KIND_META[kind];
    ensureLabel(BASE_LABEL, "5319e7", "同步告警", deps);
    ensureLabel(kind, meta.color, meta.description, deps);
    const fullBody = `${mentionPreamble(env)}${body}`;
    try {
      const url = callGh([
        "issue",
        "create",
        "--title",
        title,
        "--body",
        fullBody,
        "--label",
        BASE_LABEL,
        "--label",
        kind,
        ...assigneeArgs(env),
      ], deps);
      log(deps, `已開 Issue：${url}`);
    } catch {
      // label/assignee 失敗時，退而不帶它們仍要開單（去重會降級但通知不漏）
      const url = callGh(["issue", "create", "--title", title, "--body", fullBody], deps);
      log(deps, `已開 Issue（無 label）：${url}`);
    }
  } catch (err) {
    warn(deps, `openOrCommentIssue 失敗（忽略）：${(err as Error).message}`);
  }
}

/** 同類失敗單若開啟中 → 補「已恢復」comment 並關閉。 */
export function resolveIssue(
  opts: { kind: AlertKind; comment: string },
  deps: SyncAlertDeps = {},
): void {
  try {
    const existing = findOpenIssueNumber(opts.kind, deps);
    if (existing == null) return;
    callGh(["issue", "comment", String(existing), "--body", opts.comment], deps);
    callGh(["issue", "close", String(existing)], deps);
    log(deps, `已關閉 #${existing}（${opts.kind}）`);
  } catch (err) {
    warn(deps, `resolveIssue 失敗（忽略）：${(err as Error).message}`);
  }
}

function runUrl(env: NodeJS.ProcessEnv = process.env): string {
  const server = env.GITHUB_SERVER_URL ?? "https://github.com";
  const repo = env.GITHUB_REPOSITORY ?? "";
  const runId = env.GITHUB_RUN_ID ?? "";
  return repo && runId ? `${server}/${repo}/actions/runs/${runId}` : "(本機)";
}

function syncFailureBody(env: NodeJS.ProcessEnv = process.env): string {
  const run = runUrl(env);
  const sha = env.GITHUB_SHA?.slice(0, 12) || "(unknown)";
  const ref = env.GITHUB_REF_NAME || env.GITHUB_REF || "(unknown)";
  return `${mentionPreamble(env)}## Apple sync workflow 失敗

- **Run**：${run === "(本機)" ? run : `[查看 Actions log](${run})`}
- **Commit**：\`${sha}\`
- **Branch**：\`${ref}\`

請先查看 Run 裡第一個失敗的 step 與錯誤訊息；本 Issue 只負責把失敗即時集中、去重，不以 watchdog 的 stale 判斷取代原始 CI 證據。
`;
}

type GhIssue = {
  number?: number;
  title?: string;
  url?: string;
  labels?: Array<{ name?: string }>;
};

function hasLabel(issue: GhIssue, label: string): boolean {
  return (issue.labels ?? []).some((l) => l.name === label);
}

function illustrationIssueTitle(slug: string): string {
  return `[illustrate] 新集待生圖：${slug}`;
}

class IllustrationListError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IllustrationListError";
  }
}

function findIllustrationIssuesByState(
  title: string,
  slug: string,
  state: "open" | "closed",
  deps: SyncAlertDeps,
): GhIssue[] {
  try {
    const out = callGh([
      "issue",
      "list",
      "--search",
      `in:title ${slug} 待生圖`,
      "--state",
      state,
      "--json",
      "number,title,url,labels",
      "--limit",
      "20",
    ], deps);
    const parsed = JSON.parse(out || "[]") as GhIssue[];
    return parsed
      .filter((issue) => issue.title === title)
      .sort(
        (a, b) =>
          (a.number ?? Number.MAX_SAFE_INTEGER) -
          (b.number ?? Number.MAX_SAFE_INTEGER),
      );
  } catch (err) {
    // 禁止 fail-open（當成「無 Issue」會誤開重複單）
    throw new IllustrationListError(
      `gh issue list(${state}) 失敗：${(err as Error).message}`,
    );
  }
}

function findOpenIllustrationIssue(
  title: string,
  slug: string,
  deps: SyncAlertDeps,
): GhIssue | null {
  const exact = findIllustrationIssuesByState(title, slug, "open", deps);
  return exact[0] ?? null;
}

/** open 或 closed 任一存在 exact title 即視為已有 Issue（reconcile 用）。 */
export function hasIllustrationIssueAnyState(
  title: string,
  slug: string,
  deps: SyncAlertDeps,
): boolean {
  try {
    for (const state of ["open", "closed"] as const) {
      if (findIllustrationIssuesByState(title, slug, state, deps).length > 0) {
        return true;
      }
    }
    return false;
  } catch (err) {
    // list 失敗時 fail-closed：當作已有 Issue，避免 reconcile 誤開
    warn(
      deps,
      `NOTIFY_LIST_FAILED ${slug}（視為已有 Issue，略過）：${(err as Error).message}`,
    );
    return true;
  }
}

function labelIllustrationIssueIfMissing(
  issue: GhIssue,
  deps: SyncAlertDeps,
): void {
  if (issue.number == null || hasLabel(issue, "illustration")) return;
  try {
    ensureLabel("illustration", "0e8a16", "新集待生圖", deps);
    callGh([
      "issue",
      "edit",
      String(issue.number),
      "--add-label",
      "illustration",
    ], deps);
  } catch (err) {
    warn(
      deps,
      `illustration label 補標失敗（忽略）：${(err as Error).message}`,
    );
  }
}

function createIllustrationIssue(
  title: string,
  body: string,
  env: NodeJS.ProcessEnv,
  deps: SyncAlertDeps,
  slug: string,
): string {
  ensureLabel("illustration", "0e8a16", "新集待生圖", deps);
  try {
    return callGh([
      "issue",
      "create",
      "--title",
      title,
      "--body",
      body,
      "--label",
      "illustration",
      ...assigneeArgs(env),
    ], deps);
  } catch (firstErr) {
    // assignee／label 失敗時，先查是否其實已建單，再決定是否無 label 重試
    try {
      const existing = findOpenIllustrationIssue(title, slug, deps);
      if (existing?.url) return existing.url;
    } catch {
      /* list 失敗則下面再試一次 create */
    }
    try {
      return callGh(
        ["issue", "create", "--title", title, "--body", body],
        deps,
      );
    } catch (secondErr) {
      try {
        const existing = findOpenIllustrationIssue(title, slug, deps);
        if (existing?.url) return existing.url;
      } catch {
        /* ignore */
      }
      throw secondErr instanceof Error ? secondErr : firstErr;
    }
  }
}

export function isReportStale(report: SyncRunReport, nowMs: number = Date.now()): boolean {
  const runAt = Date.parse(report.runAt);
  if (Number.isNaN(runAt)) return true;
  return nowMs - runAt > STALE_MS;
}

export function resolveNotifyTrigger(env: NodeJS.ProcessEnv): "local" | "gha" {
  return env.GITHUB_ACTIONS === "true" ? "gha" : "local";
}

/** 從 effective catalog 挑出待 reconcile 的 ep-N（pageCount=1、無 open/closed Issue）。 */
export function buildReconcilePendingSlugs(
  deps: SyncAlertDeps = {},
  nowMs: number = Date.now(),
): string[] {
  const stories = (deps.getStories ?? getStories)();
  const recencyCutoff = nowMs - RECONCILE_RECENCY_DAYS * 24 * 60 * 60 * 1000;

  const ranked = stories
    .filter((s) => isIllustrateSlug(s.slug) && s.pageCount === 1)
    .sort((a, b) => {
      const aRecent = Date.parse(a.date) >= recencyCutoff ? 1 : 0;
      const bRecent = Date.parse(b.date) >= recencyCutoff ? 1 : 0;
      if (bRecent !== aRecent) return bRecent - aRecent;
      return b.ep - a.ep;
    });

  // 先排序再逐筆查 Issue，湊滿 RECONCILE_MAX 即停（避免全 catalog 亂打 gh）
  const planned: string[] = [];
  for (const story of ranked) {
    if (planned.length >= RECONCILE_MAX) break;
    const title = illustrationIssueTitle(story.slug);
    if (!hasIllustrationIssueAnyState(title, story.slug, deps)) {
      planned.push(story.slug);
    }
  }
  return planned;
}

export function notifyLiveFromReport(
  report: SyncRunReport,
  deps: SyncAlertDeps = {},
  options: NotifyLiveOptions = {},
): NotifyLiveResult {
  const slugs = options.slugs ?? report.illustratePending;
  const trigger = options.trigger ?? resolveNotifyTrigger(deps.env ?? process.env);
  const env = deps.env ?? process.env;
  const result: NotifyLiveResult = { ok: 0, skipped: 0, failed: 0 };

  if (slugs.length === 0) {
    log(deps, "無待生圖 ep-N，略過 notify-live。");
    return result;
  }

  for (const slug of slugs) {
    const title = illustrationIssueTitle(slug);

    try {
      let existing = findOpenIllustrationIssue(title, slug, deps);
      if (existing) {
        labelIllustrationIssueIfMissing(existing, deps);
        const target = existing.url ?? `#${existing.number ?? slug}`;
        log(deps, `NOTIFY_SKIPPED ${slug}（Issue 已存在 → ${target}）`);
        result.skipped += 1;
        continue;
      }

      // create 前二次 list（競態去重）
      existing = findOpenIllustrationIssue(title, slug, deps);
      if (existing) {
        log(deps, `NOTIFY_SKIPPED ${slug}（競態：Issue 已存在）`);
        result.skipped += 1;
        continue;
      }

      const body = buildIssueBody(slug, report, {
        trigger,
        catalogOnly: options.catalogOnly,
      });
      try {
        const url = createIllustrationIssue(title, body, env, deps, slug);
        log(deps, `NOTIFY_OK ${slug} → ${url}`);
        result.ok += 1;
      } catch (err) {
        let duplicate: GhIssue | null = null;
        try {
          duplicate = findOpenIllustrationIssue(title, slug, deps);
        } catch {
          /* list 失敗時下面當 FAILED */
        }
        if (duplicate) {
          log(deps, `NOTIFY_SKIPPED ${slug}（create 競態 duplicate）`);
          result.skipped += 1;
          continue;
        }
        warn(deps, `NOTIFY_FAILED ${slug}：${(err as Error).message}`);
        result.failed += 1;
      }
    } catch (err) {
      if (err instanceof IllustrationListError) {
        warn(deps, `NOTIFY_FAILED ${slug}：${err.message}`);
        result.failed += 1;
        continue;
      }
      warn(deps, `NOTIFY_FAILED ${slug}：${(err as Error).message}`);
      result.failed += 1;
    }
  }

  log(
    deps,
    `NOTIFY 摘要：OK=${result.ok} SKIPPED=${result.skipped} FAILED=${result.failed}`,
  );
  return result;
}

export type NotifyLiveFlags = {
  reconcile?: boolean;
  strict?: boolean;
};

/** push 成功後：為新 ep-N 開 illustrate Issue（沿用 post-sync-notify 的內文）。 */
export function notifyLive(
  deps: SyncAlertDeps = {},
  flags: NotifyLiveFlags = {},
): NotifyLiveResult {
  const env = deps.env ?? process.env;
  const reportPath = resolveSyncReportPath(env);

  const trigger = resolveNotifyTrigger(env);
  let report: SyncRunReport;
  let catalogOnly = false;
  try {
    const read =
      deps.readFile ?? ((filePath: string) => readFileSync(filePath, "utf8"));
    report = JSON.parse(read(reportPath)) as SyncRunReport;
  } catch {
    if (!flags.reconcile) {
      log(deps, `讀不到 sync report（${reportPath}），略過 notify-live。`);
      if (flags.strict) process.exitCode = 1;
      return { ok: 0, skipped: 0, failed: 0 };
    }
    log(
      deps,
      `讀不到 sync report（${reportPath}）；reconcile 改以 catalog 為準。`,
    );
    report = createEmptyReport(false);
    catalogOnly = true;
  }

  // reconcile 以 catalog 為準，不受本次 report 的 dryRun／stale／gitHead 擋住
  if (!flags.reconcile) {
    if (report.dryRun) {
      log(deps, "report.dryRun=true，拒絕開 Issue（略過 notify-live）。");
      return { ok: 0, skipped: 0, failed: 0 };
    }

    if (isReportStale(report)) {
      warn(
        deps,
        `sync report 已過期（runAt=${report.runAt}，超過 24h），拒絕開 Issue。`,
      );
      if (flags.strict) process.exitCode = 1;
      return { ok: 0, skipped: 0, failed: 0 };
    }

    if (report.gitHead) {
      const current = resolveGitHeadShort(process.cwd());
      if (current && report.gitHead !== current) {
        warn(
          deps,
          `sync report gitHead=${report.gitHead} 與目前 HEAD=${current} 不符，拒絕開 Issue（請在對應 commit／push 後再 notify）。`,
        );
        if (flags.strict) process.exitCode = 1;
        return { ok: 0, skipped: 0, failed: 0 };
      }
    }
  }

  let slugs: string[] | undefined;

  if (flags.reconcile) {
    slugs = buildReconcilePendingSlugs(deps);
    log(
      deps,
      `reconcile 將開 Issue（最多 ${RECONCILE_MAX}）：${
        slugs.length > 0 ? slugs.join(", ") : "（無）"
      }`,
    );
  }

  const pendingCount = slugs ?? report.illustratePending;
  const result = notifyLiveFromReport(report, deps, {
    slugs,
    trigger,
    catalogOnly,
  });

  if (
    flags.strict &&
    pendingCount.length > 0 &&
    result.ok === 0 &&
    result.skipped === 0 &&
    result.failed > 0
  ) {
    warn(
      deps,
      "strict：有待生圖但 gh 全數失敗；請 `gh auth login` 後重跑 `npm run sync:notify`。",
    );
    process.exitCode = 1;
  }

  return result;
}

export function runSyncAlertMode(
  mode: string | undefined,
  rest: string[],
  deps: SyncAlertDeps = {},
): void {
  const kindArg = rest
    .find((a) => a.startsWith("--kind="))
    ?.split("=")[1] as AlertKind | undefined;
  const reconcile = rest.includes("--reconcile");
  const strict = rest.includes("--strict");
  const env = deps.env ?? process.env;

  switch (mode) {
    case "notify-live":
      notifyLive(deps, { reconcile, strict });
      break;
    case "resolve":
      resolveIssue({
        kind: kindArg ?? "sync-job-failure",
        comment: `✅ 同步已恢復正常。\n\n- Run：${runUrl(env)}`,
      }, deps);
      break;
    case "failure":
      openOrCommentIssue({
        kind: kindArg ?? "sync-job-failure",
        title: "[sync] Apple Podcast workflow 失敗",
        body: syncFailureBody(env),
      }, deps);
      break;
    default:
      console.error(`未知模式：${mode}（notify-live | resolve | failure）`);
  }
}

function main(): void {
  const [mode, ...rest] = process.argv.slice(2);
  runSyncAlertMode(mode, rest);
}

const entry = process.argv[1]?.replace(/\\/g, "/") ?? "";
if (entry.endsWith("sync-alert.ts")) {
  main();
}
