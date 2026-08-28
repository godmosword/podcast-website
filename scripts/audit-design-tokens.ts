#!/usr/bin/env tsx
/**
 * 設計 token 採用率盤點（字級／圓角／色彩／間距）。永遠 exit 0，不當閘門。
 *
 *   npm run audit:design-tokens
 *   npm run audit:design-tokens -- --json
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  auditDesignTokens,
  designTokenReportToJson,
  formatDesignTokenReport,
} from "./lib/design-token-audit";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const asJson = process.argv.includes("--json");

const report = auditDesignTokens(ROOT);
if (asJson) {
  process.stdout.write(designTokenReportToJson(report));
} else {
  process.stdout.write(formatDesignTokenReport(report));
}

process.exit(0);
