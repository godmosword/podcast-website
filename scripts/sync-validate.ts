#!/usr/bin/env npx tsx
/**
 * 只驗證同步產物。error 以 exit 1 擋下 commit；warn 印出並寫入 Job Summary。
 *
 *   npm run sync:validate
 */
import {
  appendJobSummary,
  formatSyncValidateReport,
  jobSummaryMarkdown,
  validateSyncRepo,
} from "./lib/sync-validate";

function main(): void {
  const strict = process.argv.includes("--strict");
  const report = validateSyncRepo();
  const text = formatSyncValidateReport(report);
  console.log(text);
  appendJobSummary(jobSummaryMarkdown(report));

  if (report.errors.length > 0 || (strict && report.warnings.length > 0)) {
    process.exit(1);
  }
}

main();
