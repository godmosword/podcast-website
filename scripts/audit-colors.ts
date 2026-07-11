#!/usr/bin/env tsx
/**
 * D3 Night 主題：硬編 hex 盤點（allowlist 外檔案）。
 *
 *   npm run audit:colors
 *   npm run audit:colors -- --strict-d3   # D3 驗收頁有裸 hex 時 exit 1
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertD3PagesTokenized,
  auditHardcodedColors,
  formatHardcodedColorReport,
} from "./lib/hardcoded-color-audit";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const strictD3 = process.argv.includes("--strict-d3");

const report = auditHardcodedColors(ROOT);
console.log(formatHardcodedColorReport(report));
console.log("");

const d3Violations = assertD3PagesTokenized(ROOT);
if (d3Violations.length === 0) {
  console.log("✓ D3 驗收頁均已 token 化");
} else {
  console.log("✗ D3 驗收頁仍有裸 hex：");
  for (const line of d3Violations) {
    console.log(`  ${line}`);
  }
}

if (strictD3 && d3Violations.length > 0) {
  process.exit(1);
}
