#!/usr/bin/env npx tsx
/**
 * 同步告警（只用 GitHub Issue）。集中 Issue 互動，供：
 *   - sync workflow：push 後 `notify-live`（新集上站＋開 illustrate Issue）、
 *     成功 `resolve --kind=sync-job-failure`（關閉舊版失敗單）。
 *   - watchdog：以 import 方式呼叫 openOrCommentIssue / resolveIssue。
 *
 * 紅線：單次 workflow/test/build 失敗不開 GitHub Issue；錯誤細節留在 Actions logs。
 * Issue 只保留人工動作：待生圖與 RSS stale。
 *
 * 全程 best-effort：找不到 gh / Issue / secret 一律吞掉，永遠 exit 0，不遮蔽原始失敗。
 *
 * 環境變數：
 *   SYNC_REPORT_PATH      — sync 寫入的 JSON（notify-live 用）
 *   SYNC_ISSUE_ASSIGNEES  — 逗號分隔 GitHub username
 *   SYNC_ISSUE_MENTIONS   — Issue 開頭 @mention
 *   SYNC_ALERT_DRY_RUN=1  — 不實際呼叫 gh，只印出將執行的動作
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import type { SyncRunReport } from "./lib/sync-report";
import { buildIssueBody } from "./post-sync-notify";

export type AlertKind = "sync-job-failure" | "sync-stale-rss";
export type GhRunner = (args: string[]) => string;
export type SyncAlertDeps = {
  gh?: GhRunner;
  env?: NodeJS.ProcessEnv;
  log?: (message: string) => void;
  warn?: (message: string) => void;
  readFile?: (filePath: string) => string;
};

const BASE_LABEL = "sync-alert";
const DRY_RUN = process.env.SYNC_ALERT_DRY_RUN === "1";

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

type GhIssue = {
  number?: number;
  title?: string;
  url?: string;
  labels?: Array<{ name?: string }>;
};

function hasLabel(issue: GhIssue, label: string): boolean {
  return (issue.labels ?? []).some((l) => l.name === label);
}

function findOpenIllustrationIssue(
  title: string,
  slug: string,
  deps: SyncAlertDeps,
): GhIssue | null {
  try {
    const out = callGh([
      "issue",
      "list",
      "--search",
      `in:title ${slug} 待生圖`,
      "--state",
      "open",
      "--json",
      "number,title,url,labels",
      "--limit",
      "20",
    ], deps);
    const parsed = JSON.parse(out || "[]") as GhIssue[];
    const exact = parsed
      .filter((issue) => issue.title === title)
      .sort(
        (a, b) =>
          (a.number ?? Number.MAX_SAFE_INTEGER) -
          (b.number ?? Number.MAX_SAFE_INTEGER),
      );
    return exact[0] ?? null;
  } catch {
    return null;
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

export function notifyLiveFromReport(
  report: SyncRunReport,
  deps: SyncAlertDeps = {},
): void {
  if (report.illustratePending.length === 0) {
    log(deps, "無新 ep-N，略過 notify-live。");
    return;
  }

  const env = deps.env ?? process.env;
  for (const slug of report.illustratePending) {
    const title = `[illustrate] 新集待生圖：${slug}`;
    const existing = findOpenIllustrationIssue(title, slug, deps);
    if (existing) {
      labelIllustrationIssueIfMissing(existing, deps);
      const target = existing.url ?? `#${existing.number ?? slug}`;
      log(deps, `Issue 已存在，略過：${slug} → ${target}`);
      continue;
    }

    const body = buildIssueBody(slug, report);
    try {
      ensureLabel("illustration", "0e8a16", "新集待生圖", deps);
      const url = callGh([
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
      log(deps, `已開 Issue：${url} ✅ ${slug} 已上站`);
    } catch {
      const url = callGh(["issue", "create", "--title", title, "--body", body], deps);
      log(deps, `已開 Issue（無 label）：${url}`);
    }
  }
}

/** push 成功後：為新 ep-N 開 illustrate Issue（沿用 post-sync-notify 的內文）。 */
function notifyLive(deps: SyncAlertDeps = {}): void {
  const env = deps.env ?? process.env;
  const reportPath = env.SYNC_REPORT_PATH;
  if (!reportPath) {
    log(deps, "SYNC_REPORT_PATH 未設，略過 notify-live。");
    return;
  }
  let report: SyncRunReport;
  try {
    const read =
      deps.readFile ?? ((filePath: string) => readFileSync(filePath, "utf8"));
    report = JSON.parse(read(reportPath)) as SyncRunReport;
  } catch {
    log(deps, "讀不到 sync report，略過 notify-live。");
    return;
  }
  notifyLiveFromReport(report, deps);
}

export function runSyncAlertMode(
  mode: string | undefined,
  rest: string[],
  deps: SyncAlertDeps = {},
): void {
  const kindArg = rest
    .find((a) => a.startsWith("--kind="))
    ?.split("=")[1] as AlertKind | undefined;
  const env = deps.env ?? process.env;

  switch (mode) {
    case "notify-live":
      notifyLive(deps);
      break;
    case "resolve":
      resolveIssue({
        kind: kindArg ?? "sync-job-failure",
        comment: `✅ 同步已恢復正常。\n\n- Run：${runUrl(env)}`,
      }, deps);
      break;
    case "failure":
      log(deps, "單次 workflow 失敗不開 Issue；請查看 GitHub Actions logs。");
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
