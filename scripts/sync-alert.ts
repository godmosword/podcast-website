#!/usr/bin/env npx tsx
/**
 * 同步告警（只用 GitHub Issue）。集中所有 Issue 互動，供：
 *   - sync workflow：push 後 `notify-live`（新集上站＋開 illustrate Issue）、
 *     成功 `resolve --kind=sync-job-failure`（關閉失敗單）。
 *   - watchdog：以 import 方式呼叫 openOrCommentIssue / resolveIssue。
 *
 * 去重靠固定 label：`sync-alert` + 分類 label（`sync-job-failure` | `sync-stale-rss`）。
 * 失敗每 15 分鐘觸發 → 同類只開一張單，其後 comment，恢復後自動關閉。
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

/** 確保 label 存在（已存在則忽略）。 */
function ensureLabel(name: string, color: string, description: string): void {
  try {
    gh([
      "label",
      "create",
      name,
      "--color",
      color,
      "--description",
      description,
      "--force",
    ]);
  } catch {
    /* label 已存在或無權限：去重改以 list 過濾，仍可運作 */
  }
}

function assigneeArgs(): string[] {
  const raw = process.env.SYNC_ISSUE_ASSIGNEES?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap((user) => ["--assignee", user]);
}

function mentionPreamble(): string {
  const mentions = process.env.SYNC_ISSUE_MENTIONS?.trim();
  return mentions ? `${mentions}\n\n` : "";
}

function findOpenIssueNumber(kind: AlertKind): number | null {
  try {
    const out = gh([
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
    ]);
    const parsed = JSON.parse(out || "[]") as Array<{ number?: number }>;
    return parsed[0]?.number ?? null;
  } catch {
    return null;
  }
}

/** 開單或補 comment（同類去重）。 */
export function openOrCommentIssue(opts: {
  kind: AlertKind;
  title: string;
  body: string;
}): void {
  const { kind, title, body } = opts;
  try {
    const existing = findOpenIssueNumber(kind);
    if (existing != null) {
      gh(["issue", "comment", String(existing), "--body", body]);
      console.log(`已補 comment 至 #${existing}（${kind}）`);
      return;
    }
    const meta = KIND_META[kind];
    ensureLabel(BASE_LABEL, "5319e7", "同步告警");
    ensureLabel(kind, meta.color, meta.description);
    const fullBody = `${mentionPreamble()}${body}`;
    try {
      const url = gh([
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
        ...assigneeArgs(),
      ]);
      console.log(`已開 Issue：${url}`);
    } catch {
      // label/assignee 失敗時，退而不帶它們仍要開單（去重會降級但通知不漏）
      const url = gh(["issue", "create", "--title", title, "--body", fullBody]);
      console.log(`已開 Issue（無 label）：${url}`);
    }
  } catch (err) {
    console.warn(`openOrCommentIssue 失敗（忽略）：${(err as Error).message}`);
  }
}

/** 同類失敗單若開啟中 → 補「已恢復」comment 並關閉。 */
export function resolveIssue(opts: { kind: AlertKind; comment: string }): void {
  try {
    const existing = findOpenIssueNumber(opts.kind);
    if (existing == null) return;
    gh(["issue", "comment", String(existing), "--body", opts.comment]);
    gh(["issue", "close", String(existing)]);
    console.log(`已關閉 #${existing}（${opts.kind}）`);
  } catch (err) {
    console.warn(`resolveIssue 失敗（忽略）：${(err as Error).message}`);
  }
}

function runUrl(): string {
  const server = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  const repo = process.env.GITHUB_REPOSITORY ?? "";
  const runId = process.env.GITHUB_RUN_ID ?? "";
  return repo && runId ? `${server}/${repo}/actions/runs/${runId}` : "(本機)";
}

/** push 成功後：為新 ep-N 開 illustrate Issue（沿用 post-sync-notify 的內文）。 */
function notifyLive(): void {
  const reportPath = process.env.SYNC_REPORT_PATH;
  if (!reportPath) {
    console.log("SYNC_REPORT_PATH 未設，略過 notify-live。");
    return;
  }
  let report: SyncRunReport;
  try {
    report = JSON.parse(readFileSync(reportPath, "utf8")) as SyncRunReport;
  } catch {
    console.log("讀不到 sync report，略過 notify-live。");
    return;
  }
  if (report.illustratePending.length === 0) {
    console.log("無新 ep-N，略過 notify-live。");
    return;
  }
  for (const slug of report.illustratePending) {
    const title = `[illustrate] 新集待生圖：${slug}`;
    try {
      const existing = gh([
        "issue",
        "list",
        "--search",
        `in:title ${slug} 待生圖`,
        "--state",
        "open",
        "--json",
        "url",
        "--limit",
        "1",
      ]);
      const parsed = JSON.parse(existing || "[]") as Array<{ url?: string }>;
      if (parsed[0]?.url) {
        console.log(`Issue 已存在，略過：${slug} → ${parsed[0].url}`);
        continue;
      }
    } catch {
      /* 查詢失敗就照常嘗試開單 */
    }
    const body = buildIssueBody(slug, report);
    try {
      ensureLabel("illustration", "0e8a16", "新集待生圖");
      const url = gh([
        "issue",
        "create",
        "--title",
        title,
        "--body",
        body,
        "--label",
        "illustration",
        ...assigneeArgs(),
      ]);
      console.log(`已開 Issue：${url} ✅ ${slug} 已上站`);
    } catch {
      const url = gh(["issue", "create", "--title", title, "--body", body]);
      console.log(`已開 Issue（無 label）：${url}`);
    }
  }
}

function main(): void {
  const [mode, ...rest] = process.argv.slice(2);
  const kindArg = rest
    .find((a) => a.startsWith("--kind="))
    ?.split("=")[1] as AlertKind | undefined;

  switch (mode) {
    case "notify-live":
      notifyLive();
      break;
    case "resolve":
      resolveIssue({
        kind: kindArg ?? "sync-job-failure",
        comment: `✅ 同步已恢復正常。\n\n- Run：${runUrl()}`,
      });
      break;
    case "failure":
      openOrCommentIssue({
        kind: kindArg ?? "sync-job-failure",
        title: "⚠️ Apple 同步失敗",
        body: `同步 workflow 失敗。\n\n- Run：${runUrl()}\n- 時間：${new Date().toISOString()}`,
      });
      break;
    default:
      console.error(`未知模式：${mode}（notify-live | resolve | failure）`);
  }
}

const entry = process.argv[1]?.replace(/\\/g, "/") ?? "";
if (entry.endsWith("sync-alert.ts")) {
  main();
}
