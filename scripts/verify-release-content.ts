#!/usr/bin/env tsx

import { getStories, storiesByNewest } from "../data/content";
import { verifyStoryWorkflow, type WorkflowIssue } from "./lib/episode-workflow";
import { classifyReleaseIssues } from "./lib/release-content";

function main(): void {
  const json = process.argv.includes("--json") || process.env.npm_config_json === "true";
  const stories = getStories();
  const issues: WorkflowIssue[] = stories.flatMap((story) => verifyStoryWorkflow(story));
  const report = classifyReleaseIssues(stories, issues);
  const latest = storiesByNewest()[0];

  const output = {
    latest_slug: latest?.slug ?? null,
    release_blockers: report.blockers,
    accepted_warnings: report.acceptedWarnings,
    passed: report.blockers.length === 0,
  };

  if (json) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log("=== 車車遊樂園 · release content contract ===\n");
    console.log(`最新一集：${latest?.slug ?? "(無)"}`);
    if (report.blockers.length > 0) {
      console.log("\nRelease blockers：");
      for (const issue of report.blockers) {
        console.log(`✗ [${issue.slug}] ${issue.code}: ${issue.message}`);
      }
    }
    if (report.acceptedWarnings.length > 0) {
      console.log("\nAccepted MVP warnings：");
      for (const issue of report.acceptedWarnings) {
        console.log(`⚠ [${issue.slug}] ${issue.code}: ${issue.message}`);
      }
    }
    console.log(
      `\n${report.blockers.length === 0 ? "✅" : "❌"} blockers ${report.blockers.length}、accepted warnings ${report.acceptedWarnings.length}`,
    );
  }

  if (report.blockers.length > 0) process.exit(1);
}

main();
