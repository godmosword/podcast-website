#!/usr/bin/env npx tsx
/**
 * GHA 同步後：依 sync report 產生多行 commit 訊息，並為新 ep-N 開 illustrate Issue。
 * 手機推播：維護者安裝 GitHub App，開 Issue 時 assign／@mention 即會收到通知。
 *
 * 環境變數：
 *   SYNC_REPORT_PATH         — sync-apple-podcast 寫入的 JSON
 *   SYNC_COMMIT_MSG_PATH     — 輸出 commit 訊息檔
 *   CREATE_ISSUES            — "1" 時用 gh 開 Issue
 *   SYNC_ISSUE_ASSIGNEES     — 指派對象（逗號分隔 GitHub username；Secret 名稱不可 GITHUB_ 開頭）
 *   SYNC_ISSUE_MENTIONS      — Issue 開頭 @mention（例 @user1 @user2）
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import type { SyncRunReport } from "./lib/sync-report";

function subtitleLine(slug: string, report: SyncRunReport): string {
  if (report.subtitlesCreated.includes(slug)) return "字幕：已轉錄（草稿，請校對）";
  if (report.subtitlesMissing.includes(slug)) return "字幕：缺側車檔";
  return "字幕：已有側車檔";
}

function siteBase(): string {
  return (
    process.env.NOTIFY_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://podcast-website-mu.vercel.app"
  ).replace(/\/+$/, "");
}

export function buildCommitMessage(report: SyncRunReport): string {
  const lines: string[] = ["chore: sync Apple Podcast from RSS", ""];

  if (report.newEpisodes.length > 0) {
    lines.push("## 新集（MVP 已同步，pageCount=1）");
    for (const ep of report.newEpisodes) {
      lines.push(`- ${ep.slug} EP${ep.ep}：${ep.title}`);
      lines.push(`  - ${subtitleLine(ep.slug, report)}`);
      if (/^ep-\d+$/.test(ep.slug)) {
        lines.push(`  - 生圖：npm run illustrate -- ${ep.slug}`);
      }
    }
    lines.push("");
  }

  if (report.metadataUpdated.length > 0) {
    lines.push(`## Metadata 更新：${report.metadataUpdated.join(", ")}`);
    lines.push("");
  }

  if (report.tagBackfill.length > 0) {
    lines.push(`## Tags 補齊：${report.tagBackfill.join(", ")}`);
    lines.push("");
  }

  if (report.vehicleBackfill.length > 0) {
    lines.push(`## 車種補齊：${report.vehicleBackfill.join(", ")}`);
    lines.push("");
  }

  if (report.subtitlesCreated.length > 0) {
    lines.push(`## 本輪新轉錄字幕：${report.subtitlesCreated.join(", ")}`);
    lines.push("（草稿；請校對 Bonbon／馬米等人名）");
    lines.push("");
  }

  if (report.subtitlesMissing.length > 0) {
    lines.push(`## 仍缺字幕：${report.subtitlesMissing.join(", ")}`);
    lines.push("  npm run transcribe -- <slug...>");
    lines.push("");
  }

  if (report.illustratePending.length > 0) {
    lines.push("## 生圖待辦（本機 + OPENAI_API_KEY，審圖後 --approve）");
    for (const slug of report.illustratePending) {
      lines.push(`- ${slug}:`);
      lines.push(`  1. 校對 data/subtitles/${slug}.json`);
      lines.push(`  2. npm run illustrate -- ${slug} --segment-only`);
      lines.push(`  3. npm run illustrate -- ${slug}`);
      lines.push(`  4. 審 public/.illustrate-staging/${slug}/contact.html`);
      lines.push(`  5. npm run illustrate -- ${slug} --approve`);
      lines.push(`  6. npm run sync:apple && npm run build → commit push`);
    }
  }

  if (lines.length === 2) {
    lines.push("（metadata／字幕再處理等例行更新）");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function issueNotifyPreamble(): string {
  const mentions = process.env.SYNC_ISSUE_MENTIONS?.trim();
  if (!mentions) return "";
  return `${mentions}\n\n> 📱 已 @mention；請確認 GitHub App 已開啟 Issue 通知。\n\n`;
}

export function buildIssueBody(slug: string, report: SyncRunReport): string {
  const ep = report.newEpisodes.find((e) => e.slug === slug);
  const title = ep?.title ?? slug;
  const runAt = report.runAt;
  const storyUrl = `${siteBase()}/story/${slug}`;

  return `${issueNotifyPreamble()}## 新集待生圖：${slug}

- **標題**：${title}
- **同步時間**：${runAt}
- **觸發**：Apple RSS（SoundOn）→ GHA \`sync-apple-podcast\`
- **站上狀態**：MVP 已上線（\`pageCount=1\`、Apple 封面 \`01.jpg\`）
- **字幕**：${subtitleLine(slug, report)}

### Checklist

- [ ] 抽查站上 [${slug}](${storyUrl}) 能播、封面正確
- [ ] 校對 \`data/subtitles/${slug}.json\`（Bonbon／馬米等人名）
- [ ] 確認車種／標籤（必要時 \`data/apple-sync.defaults.json\` overrides）
- [ ] \`npm run illustrate -- ${slug} --segment-only\`
- [ ] \`npm run illustrate -- ${slug}\`（需 \`OPENAI_API_KEY\`）
- [ ] 審 \`public/.illustrate-staging/${slug}/contact.html\`
- [ ] \`npm run illustrate -- ${slug} --approve\`
- [ ] \`npm run sync:apple && npm run build\` → commit push
- [ ] 關閉本 Issue

> 生圖在本機執行；CI 不放 OpenAI key、不自動 approve。
`;
}

function gh(args: string[]): string {
  return execFileSync("gh", args, { encoding: "utf8" }).trim();
}

function assigneeArgs(): string[] {
  const raw = process.env.SYNC_ISSUE_ASSIGNEES?.trim();
  if (!raw) return [];
  return ["--assignee", raw];
}

function findOpenIssueUrl(slug: string): string | null {
  try {
    const out = gh([
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
    const parsed = JSON.parse(out) as Array<{ url?: string }>;
    return parsed[0]?.url ?? null;
  } catch {
    return null;
  }
}

function createIllustrateIssue(
  slug: string,
  report: SyncRunReport,
): string | null {
  const existing = findOpenIssueUrl(slug);
  if (existing) {
    console.log(`Issue 已存在，略過：${slug} → ${existing}`);
    return existing;
  }

  const title = `[illustrate] 新集待生圖：${slug}`;
  const body = buildIssueBody(slug, report);
  const baseArgs = ["issue", "create", "--title", title, "--body", body];

  try {
    const url = gh([...baseArgs, "--label", "illustration", ...assigneeArgs()]);
    console.log(`已開 Issue：${url}`);
    return url;
  } catch (err) {
    console.warn(`帶 label 開 Issue 失敗，重試不帶 label（${(err as Error).message}）`);
    try {
      const url = gh([...baseArgs, ...assigneeArgs()]);
      console.log(`已開 Issue：${url}`);
      return url;
    } catch (err2) {
      console.warn(`指派失敗，改不帶 assignee（${(err2 as Error).message}）`);
      const url = gh(baseArgs);
      console.log(`已開 Issue：${url}`);
      return url;
    }
  }
}

function main(): void {
  const reportPath = process.env.SYNC_REPORT_PATH;
  const commitMsgPath = process.env.SYNC_COMMIT_MSG_PATH ?? "sync-commit-msg.txt";

  if (!reportPath) {
    writeFileSync(commitMsgPath, "chore: sync Apple Podcast from RSS\n", "utf8");
    console.log("SYNC_REPORT_PATH 未設，使用預設 commit 訊息。");
    return;
  }

  const report = JSON.parse(readFileSync(reportPath, "utf8")) as SyncRunReport;
  const commitMsg = buildCommitMessage(report);
  writeFileSync(commitMsgPath, commitMsg, "utf8");
  console.log(`Commit 訊息已寫入 ${commitMsgPath}`);

  if (process.env.CREATE_ISSUES !== "1") {
    console.log("CREATE_ISSUES≠1，略過開 Issue。");
    return;
  }

  if (report.illustratePending.length === 0) {
    console.log("無新 ep-N，略過開 Issue。");
    return;
  }

  for (const slug of report.illustratePending) {
    createIllustrateIssue(slug, report);
  }
}

const entry = process.argv[1]?.replace(/\\/g, "/") ?? "";
if (entry.endsWith("post-sync-notify.ts")) {
  main();
}
