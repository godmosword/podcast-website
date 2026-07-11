#!/usr/bin/env tsx
/**
 * D0 資產治理：四類 taxonomy 盤點 + 超大 JPG 警示。
 *
 *   npm run audit:assets
 *   npm run audit:assets -- --strict   # 有超大 JPG 時 exit 1（PR 警示用）
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  auditAssets,
  formatAuditReport,
  MAX_JPG_BYTES,
} from "./lib/audit-assets-core";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");

const report = auditAssets(ROOT);
console.log(formatAuditReport(report));
console.log("");
console.log(`門檻：tracked JPG > ${Math.round(MAX_JPG_BYTES / 1024)} KB 列入警示`);

if (strict && report.deployed.largeJpgs.length > 0) {
  console.error(`✗ strict：${report.deployed.largeJpgs.length} 個超大 JPG`);
  process.exit(1);
}
