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
import { readFileSync, writeFileSync } from "node:fs";
import type { SyncRunReport } from "./lib/sync-report";

function subtitleLine(
  slug: string,
  report: SyncRunReport,
  catalogOnly?: boolean,
): string {
  if (catalogOnly) {
    return "字幕／校稿狀態請人工核對（無完整 sync report）";
  }
  if (report.subtitlesMissing.includes(slug)) return "字幕：缺側車檔";

  const parts: string[] = [];
  if (report.subtitlesCreated.includes(slug)) {
    parts.push("已轉錄（草稿）");
  } else {
    parts.push("已有側車檔");
  }

  const autoFixed = report.proofreadAutoFixed[slug];
  const pending = report.proofreadPendingLint[slug];
  if (autoFixed !== undefined) {
    if (autoFixed > 0) {
      parts.push(`GHA 已自動 --fix（${autoFixed} 處）`);
    } else {
      parts.push("GHA 已跑 --fix");
    }
  }
  if (pending !== undefined) {
    if (pending > 0) {
      parts.push(`仍待人工 ${pending} 項`);
    } else {
      parts.push("lint 通過，請最終抽查後 --mark");
    }
  } else if (report.subtitlesCreated.includes(slug)) {
    parts.push("請校對");
  }

  return `字幕：${parts.join("；")}`;
}

function proofreadFixNote(slug: string, report: SyncRunReport): string {
  const fixCount = report.proofreadAutoFixed[slug];
  if (fixCount === undefined) return "GHA 已自動 proofread --fix（Bonbon／馬米等品牌名）";
  if (fixCount > 0) {
    return `GHA 已自動 proofread --fix（Bonbon／馬米等品牌名，修正 ${fixCount} 處）`;
  }
  return "GHA 已自動 proofread --fix（Bonbon／馬米等品牌名，無需修正）";
}

function siteBase(): string {
  return (
    process.env.NOTIFY_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://podcast-website-mu.vercel.app"
  ).replace(/\/+$/, "");
}

export function buildCommitMessage(report: SyncRunReport): string {
  const lines: string[] = ["chore: sync Apple Podcasts from RSS", ""];

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

  if (report.episodeFaqStubs.length > 0) {
    lines.push("## FAQ MVP 待人工改寫");
    for (const slug of report.episodeFaqStubs) {
      lines.push(`- ${slug}：sync 已先寫入可驗證的 FAQ stub，請依劇情改寫 \`data/episode-faqs.ts\``);
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

  if (report.browseIndexVehicles.length > 0 || report.browseIndexTopics.length > 0) {
    lines.push("## 找車車／主題索引");
    if (report.browseIndexVehicles.length > 0) {
      lines.push(`- 新車種：${report.browseIndexVehicles.join(", ")}（已寫入 data/browse-index.json + emoji）`);
    }
    if (report.browseIndexTopics.length > 0) {
      lines.push(`- 新主題：${report.browseIndexTopics.join(", ")}（已寫入 data/browse-index.json + 圖示 symbol）`);
    }
    lines.push("");
  }

  if (report.emojiSync.length > 0) {
    lines.push(`## Emoji 校正：${report.emojiSync.join(", ")}`);
    lines.push("");
  }

  if (report.subtitlesCreated.length > 0) {
    lines.push(`## 本輪新轉錄字幕：${report.subtitlesCreated.join(", ")}`);
    lines.push("（GHA 已自動 --fix 品牌名；請最終校稿後 --mark）");
    lines.push("");
  }

  const proofreadSlugs = Object.keys(report.proofreadAutoFixed);
  if (proofreadSlugs.length > 0) {
    lines.push("## 字幕自動校稿（GHA --fix）");
    for (const slug of proofreadSlugs) {
      const fixCount = report.proofreadAutoFixed[slug] ?? 0;
      const pending = report.proofreadPendingLint[slug] ?? 0;
      lines.push(
        `- ${slug}：修正 ${fixCount} 處；仍待人工 ${pending} 項`,
      );
    }
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
      lines.push(
        `  1. 最終校稿 data/subtitles/${slug}.json（GHA 已自動 --fix）→ npm run proofread:subtitles -- ${slug} --mark`,
      );
      lines.push(`  2. npm run illustrate -- ${slug} --segment-only`);
      lines.push(`  3. npm run illustrate -- ${slug}`);
      lines.push(`  4. 審 public/.illustrate-staging/${slug}/contact.html`);
      lines.push(`  5. npm run illustrate -- ${slug} --approve`);
      lines.push(`  6. npm run verify:episodes  # 對照 ep-9／ep-10 標準`);
      lines.push(`  7. npm run sync:apple && npm run build → commit push`);
    }
  }

  if (lines.length === 2) {
    lines.push("（metadata／字幕再處理等例行更新）");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

export type BuildIssueBodyOptions = {
  /** 開單觸發來源：本機 sync:notify 或 GHA workflow（預設 gha 以相容既有行為） */
  trigger?: "local" | "gha";
  /** 覆寫 @mention 前綴；未設時讀 SYNC_ISSUE_MENTIONS */
  mentions?: string;
  /** reconcile 僅有 catalog、無完整 sync report 時標註 */
  catalogOnly?: boolean;
};

function issueNotifyPreamble(mentions?: string): string {
  const resolved = mentions ?? process.env.SYNC_ISSUE_MENTIONS?.trim();
  if (!resolved) return "";
  return `${resolved}\n\n> 📱 已 @mention；請確認 GitHub App 已開啟 Issue 通知。\n\n`;
}

function issueTriggerLine(trigger: "local" | "gha"): string {
  return trigger === "local"
    ? "本機 sync:notify（push 後）"
    : "Apple RSS（SoundOn）→ GHA `sync-apple-podcast`";
}

export function buildIssueBody(
  slug: string,
  report: SyncRunReport,
  options?: BuildIssueBodyOptions,
): string {
  const trigger = options?.trigger ?? "gha";
  const catalogOnly = options?.catalogOnly === true;
  const ep = report.newEpisodes.find((e) => e.slug === slug);
  const title = ep?.title ?? slug;
  const runAt = report.runAt;
  const storyUrl = `${siteBase()}/story/${slug}`;

  const pendingLint = report.proofreadPendingLint[slug];
  const hasFaqStub = report.episodeFaqStubs.includes(slug);
  const catalogNote = catalogOnly
    ? "\n> ⚠️ **report 缺失（catalog-only reconcile）**：標題／字幕／校稿狀態請人工核對站上與 `data/subtitles/`。\n"
    : "";

  return `${issueNotifyPreamble(options?.mentions)}## 新集待生圖：${slug}
${catalogNote}
- **標題**：${title}
- **同步時間**：${catalogOnly ? "（catalog reconcile，無本次 sync report）" : runAt}
- **觸發**：${issueTriggerLine(trigger)}
- **站上狀態**：MVP 已上線（\`pageCount=1\`、Apple 封面 \`01.jpg\`）
- **字幕**：${subtitleLine(slug, report, catalogOnly)}
${hasFaqStub ? "- **FAQ**：已自動補 FAQ MVP stub，待依本集劇情人工改寫" : catalogOnly ? "- **FAQ**：請人工核對" : "- **FAQ**：已有內容契約"}

### Checklist

- [ ] 抽查站上 [${slug}](${storyUrl}) 能播、封面正確
- [${catalogOnly ? " " : "x"}] ${catalogOnly ? "確認字幕側車與校稿狀態（catalog-only，無自動 --fix 紀錄）" : proofreadFixNote(slug, report)}
- [ ] 最終校稿 \`data/subtitles/${slug}.json\` → \`npm run proofread:subtitles -- ${slug} --mark\`（[SUBTITLE-PROOFREAD.md](docs/SUBTITLE-PROOFREAD.md)）${pendingLint !== undefined && pendingLint > 0 ? `\n- [ ] 修正 lint 待辦 ${pendingLint} 項（\`npm run proofread:subtitles -- ${slug}\` 查看）` : ""}
- [ ] 確認車種／標籤（必要時 \`data/apple-sync.defaults.json\` overrides；sync 會自動更新 \`data/browse-index.json\`）
${hasFaqStub ? "- [ ] 改寫 `data/episode-faqs.ts` 的 FAQ MVP stub，確認問題／答案真的對應本集劇情" : ""}
- [ ] \`npm run illustrate -- ${slug} --segment-only\`
- [ ] \`npm run illustrate -- ${slug}\`（需 \`OPENAI_API_KEY\`）
- [ ] 審 \`public/.illustrate-staging/${slug}/contact.html\`
- [ ] \`npm run illustrate -- ${slug} --approve\`（含 pageCount／captionTimes／captions）
- [ ] \`npm run verify:episodes\`（標準範本 ep-9／ep-10，見 docs/EPISODE-WORKFLOW.md）
- [ ] \`npm run sync:apple && npm run build\` → commit push
- [ ] 關閉本 Issue

> 生圖在本機執行；CI 不放 OpenAI key、不自動 approve。全幕 workflow 必與 ep-9／ep-10 一致。
`;
}

function main(): void {
  const reportPath = process.env.SYNC_REPORT_PATH;
  const commitMsgPath = process.env.SYNC_COMMIT_MSG_PATH ?? "sync-commit-msg.txt";

  if (!reportPath) {
    writeFileSync(commitMsgPath, "chore: sync Apple Podcasts from RSS\n", "utf8");
    console.log("SYNC_REPORT_PATH 未設，使用預設 commit 訊息。");
    return;
  }

  const report = JSON.parse(readFileSync(reportPath, "utf8")) as SyncRunReport;
  writeFileSync(commitMsgPath, buildCommitMessage(report), "utf8");
  console.log(`Commit 訊息已寫入 ${commitMsgPath}`);
  // 開 Issue／上站通知改由 push 後的 scripts/sync-alert.ts notify-live 處理，
  // 避免在 push 失敗時誤報「已上站」。
}

const entry = process.argv[1]?.replace(/\\/g, "/") ?? "";
if (entry.endsWith("post-sync-notify.ts")) {
  main();
}
