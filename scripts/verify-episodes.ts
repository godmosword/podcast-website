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
  const refErrors = refIssues.length;

  if (errors.length > 0 || refErrors > 0) {
    process.exit(1);
  }
}

main();
