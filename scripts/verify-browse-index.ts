#!/usr/bin/env tsx
/**
 * 驗證「找車車／找主題」索引（data/browse-index.json）與故事目錄一致。
 */
import { getStories } from "../data/content";
import {
  formatBrowseIndexReport,
  verifyBrowseIndex,
} from "./lib/browse-index";

function main(): void {
  const strict = process.argv.includes("--strict");
  const issues = verifyBrowseIndex(getStories());

  console.log("=== 車車遊樂園 · 找車車／主題索引驗證 ===\n");
  console.log(formatBrowseIndexReport(issues));

  const errors = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");
  if (errors.length > 0 || (strict && warns.length > 0)) {
    if (strict && warns.length > 0) {
      console.log("\n--strict：警告視為失敗");
    }
    process.exit(1);
  }
}

main();
