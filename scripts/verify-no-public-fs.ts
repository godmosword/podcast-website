/**
 * 紅線：禁止 app/ 路由對 public/ 使用動態 cwd 路徑。
 *
 * Next.js output file tracing 看到 `join(process.cwd(), "public", …)` 會保守打包
 * 整個 public/（故事音檔與圖片可 >250MB）→ Vercel Function 部署失敗。
 *
 * 正確作法：建置時預計算寫入 data/（例：generate-audio-lengths），route 只 import 常數。
 * 歷史：a3bdca7（story-og）、de2774b→255MB feed.xml（enclosure length）。
 *
 *   npm run verify:no-public-fs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const APP_DIR = join(ROOT, "app");

/** 動態 cwd + public 路徑（NFT 會打包整目錄）。 */
const FORBIDDEN = [
  {
    id: "join-cwd-public",
    re: /join\(\s*process\.cwd\(\)\s*,\s*["']public["']/,
    hint: '改為建置時預計算；勿 join(process.cwd(), "public", …)',
  },
  {
    id: "resolve-cwd-public",
    re: /resolve\(\s*process\.cwd\(\)\s*,\s*["']public["']/,
    hint: '改為建置時預計算；勿 resolve(process.cwd(), "public", …)',
  },
  {
    id: "cwd-slash-public",
    re: /process\.cwd\(\)\s*,\s*["']public\//,
    hint: "勿把 public/ 子路徑接到 process.cwd()",
  },
] as const;

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...listSourceFiles(full));
      continue;
    }
    // 測試檔可讀 public（本機 vitest），不進 serverless bundle
    if (name.endsWith(".test.ts") || name.endsWith(".test.tsx")) continue;
    if (name.endsWith(".ts") || name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

type Hit = { file: string; id: string; line: number; hint: string };

function scanFile(file: string): Hit[] {
  const text = readFileSync(file, "utf8");
  const hits: Hit[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    for (const rule of FORBIDDEN) {
      if (rule.re.test(line)) {
        hits.push({
          file: relative(ROOT, file),
          id: rule.id,
          line: i + 1,
          hint: rule.hint,
        });
      }
    }
  }
  return hits;
}

function main(): void {
  const files = listSourceFiles(APP_DIR);
  const hits = files.flatMap(scanFile);

  if (hits.length > 0) {
    console.error(
      `❌ verify:no-public-fs：app/ 發現 ${hits.length} 處禁止的 public/ 動態路徑：`,
    );
    for (const h of hits) {
      console.error(`  ${h.file}:${h.line} [${h.id}] ${h.hint}`);
    }
    console.error(
      "\n修法：把需要的檔案 metadata 預計算進 data/，route 只 import 常數。",
    );
    console.error("參考：scripts/generate-audio-lengths.ts、data/audio-lengths.ts");
    process.exit(1);
  }

  console.log(
    `✅ verify:no-public-fs：掃描 ${files.length} 個 app/ 原始檔，無 public/ 動態 cwd 路徑`,
  );
}

main();
