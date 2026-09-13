#!/usr/bin/env tsx
/**
 * 硬編 hex 盤點（allowlist 外檔案）。
 *
 *   npm run audit:colors
 *   npm run audit:colors -- --strict-d3   # D3 驗收頁有裸 hex 時一併 exit 1
 *
 * allowlist 已對齊 DESIGN.md 的「固定美術色」政策（見
 * scripts/lib/hardcoded-color-audit.ts 的清單註解），所以清單外出現裸 hex
 * 就是真的漂移——本腳本因此會 exit 1，可以直接當閘門用。
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

if (report.hits.length > 0) {
  console.log(
    "\n✗ allowlist 外出現裸 hex。改用 design token；確實是固定美術色的話，" +
      "請連同理由加進 scripts/lib/hardcoded-color-audit.ts 的 allowlist。",
  );
  process.exit(1);
}

if (strictD3 && d3Violations.length > 0) {
  process.exit(1);
}
