#!/usr/bin/env tsx
// ============================================================
// 驗證各集是否符合 ep-9／ep-10 全幕插圖 workflow
// ============================================================

import { getStories } from "../data/content";
import {
  formatWorkflowReport,
  REFERENCE_ILLUSTRATED_SLUGS,
  verifyStoryWorkflow,
  type WorkflowIssue,
} from "./lib/episode-workflow";

function main(): void {
  // --strict：warn 也視為失敗（本機 illustrate --approve 前的最後把關用）。
  const strict = process.argv.includes("--strict");
  const stories = getStories();
  const allIssues: WorkflowIssue[] = [];

  for (const story of stories) {
    allIssues.push(...verifyStoryWorkflow(story));
  }

  const refIssues = REFERENCE_ILLUSTRATED_SLUGS.flatMap((slug) => {
    const story = stories.find((s) => s.slug === slug);
    if (!story) {
      return [
        {
          slug,
          level: "error" as const,
          code: "missing-story",
          message: "範本集不在目錄中",
        },
      ];
    }
    return verifyStoryWorkflow(story).filter((i) => i.level === "error");
  });

  console.log("=== 車車遊樂園 · 單集 workflow 驗證（範本 ep-9／ep-10）===\n");
  console.log(formatWorkflowReport(allIssues));

  if (refIssues.length > 0) {
    console.log("\n範本集必須零錯誤：");
    console.log(formatWorkflowReport(refIssues));
  }

  const errors = allIssues.filter((i) => i.level === "error");
  const warns = allIssues.filter((i) => i.level === "warn");
  const refErrors = refIssues.length;

  if (errors.length > 0 || refErrors > 0 || (strict && warns.length > 0)) {
    if (strict && warns.length > 0) {
      console.log("\n--strict：警告視為失敗");
    }
    process.exit(1);
  }
}

main();
