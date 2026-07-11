#!/usr/bin/env tsx
/**
 * 驗證 serverless function trace 體積不超標（Vercel 上限 250MB 未壓縮）。
 *
 * 背景：a3bdca7 前 feed.xml 因 lib/story-og 的
 * `readFile(join(process.cwd(), "public", …))` 動態路徑，被 Next output
 * file tracing 連帶打包整個 public/（341MB）→ 部署失敗。本腳本掃描
 * `.next/server/app/**\/*.nft.json`，任一 function 總體積超過門檻即失敗，
 * 在 push 前就攔下這類依賴汙染。
 *
 *   npm run build && npm run verify:function-size
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

/** 低於 Vercel 250MB 上限的保守門檻；正常 function 約 1–4MB。 */
const LIMIT_MB = 200;
/** public/ 一旦進 trace 幾乎必為依賴汙染，門檻另計更嚴。 */
const PUBLIC_LIMIT_MB = 20;

const APP_DIR = ".next/server/app";
let traceFiles: string[] = [];
try {
  traceFiles = readdirSync(APP_DIR, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith(".nft.json"))
    .map((f) => join(APP_DIR, f));
} catch {
  // APP_DIR 不存在 → 下方以空清單報錯
}

if (traceFiles.length === 0) {
  console.error("verify:function-size 找不到 .nft.json——請先 npm run build");
  process.exit(1);
}

type Row = { route: string; totalMb: number; publicMb: number };
const rows: Row[] = [];

for (const trace of traceFiles) {
  const base = dirname(trace);
  let total = 0;
  let pub = 0;
  const { files } = JSON.parse(readFileSync(trace, "utf-8")) as {
    files: string[];
  };
  for (const rel of files) {
    let size = 0;
    try {
      size = statSync(join(base, rel)).size;
    } catch {
      continue; // 連結目標不存在時略過（與 Vercel 打包行為一致）
    }
    total += size;
    if (rel.includes("/public/")) pub += size;
  }
  rows.push({
    route: trace.split("/app/")[1] ?? trace,
    totalMb: total / 1_048_576,
    publicMb: pub / 1_048_576,
  });
}

rows.sort((a, b) => b.totalMb - a.totalMb);

const offenders = rows.filter(
  (r) => r.totalMb > LIMIT_MB || r.publicMb > PUBLIC_LIMIT_MB,
);

const fmt = (r: Row) =>
  `${r.totalMb.toFixed(1)}MB（public ${r.publicMb.toFixed(1)}MB）${r.route}`;

if (offenders.length > 0) {
  console.error(`❌ ${offenders.length} 個 function trace 超標（上限 ${LIMIT_MB}MB／public ${PUBLIC_LIMIT_MB}MB）：`);
  for (const r of offenders) console.error(`  ${fmt(r)}`);
  console.error(
    "\n常見原因：某個被 route 依賴的模組含 fs 動態路徑（如 join(process.cwd(), \"public\", …)），",
  );
  console.error(
    "Next tracing 會保守打包整個目錄。修法參考 lib/story-og-path.ts：把純函式/常數抽到零依賴葉模組。",
  );
  process.exit(1);
}

console.log(
  `✅ ${rows.length} 個 function trace 全部低於 ${LIMIT_MB}MB（最大：${fmt(rows[0])}）`,
);
