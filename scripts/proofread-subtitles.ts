#!/usr/bin/env tsx
// ============================================================
// 字幕校對 CLI — 新集上架 workflow 步驟 1
// ============================================================
// 用法：
//   npm run proofread:subtitles -- ep-11           # lint 報告
//   npm run proofread:subtitles -- ep-11 --fix     # 自動修正品牌名等
//   npm run proofread:subtitles -- ep-11 --mark    # lint 通過後寫入校對標記
//   npm run proofread:subtitles -- ep-11 --mark --force  # 仍待人工項也強制標記
// ============================================================

import { relative } from "node:path";
import {
  applySafeAutoFixes,
  formatProofreadReport,
  lintSubtitles,
  readSubtitleSegments,
  writeProofreadMarker,
  writeSubtitleSegments,
} from "./lib/subtitle-proofread";
import { ROOT } from "./lib/transcribe-core";

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function rel(p: string): string {
  return relative(ROOT, p);
}

function main(): void {
  const args = process.argv.slice(2);
  const doFix = args.includes("--fix");
  const doMark = args.includes("--mark");
  const force = args.includes("--force");
  const slugs = args.filter(
    (a) => !a.startsWith("--") && a !== "true" && a !== "false",
  );

  if (slugs.length === 0) {
    fail(
      "用法：npm run proofread:subtitles -- <slug...> [--fix] [--mark] [--force]",
    );
  }

  let exitCode = 0;

  for (const slug of slugs) {
    try {
      let segments = readSubtitleSegments(slug);

      if (doFix) {
        const { segments: fixed, fixCount } = applySafeAutoFixes(segments);
        if (fixCount > 0) {
          writeSubtitleSegments(slug, fixed);
          console.log(`✓ ${slug}：自動修正 ${fixCount} 處 → ${rel(`data/subtitles/${slug}.json`)}`);
        } else {
          console.log(`  ${slug}：無需自動修正`);
        }
        segments = fixed;
      }

      const report = lintSubtitles(slug, segments);
      console.log(formatProofreadReport(report));

      if (doMark) {
        if (report.issues.length > 0 && !force) {
          console.error(
            `✗ ${slug}：仍有 ${report.issues.length} 項待校對，修正後再 --mark（或 --mark --force）`,
          );
          exitCode = 1;
          continue;
        }
        const p = writeProofreadMarker(slug, segments.length, report.issues.length);
        console.log(`✓ ${slug}：已標記校對完成 → ${rel(p)}`);
        if (report.issues.length > 0 && force) {
          console.warn(`  ⚠ --force：標記時仍有 ${report.issues.length} 項 lint 提示`);
        }
        continue;
      }

      if (report.issues.length > 0) exitCode = 1;
    } catch (err) {
      fail(`${slug}：${(err as Error).message}`);
    }
  }

  if (exitCode !== 0) {
    console.log("\n下一步：編輯 data/subtitles/<slug>.json → npm run proofread:subtitles -- <slug> --mark");
    console.log("詳見 docs/SUBTITLE-PROOFREAD.md");
    process.exit(exitCode);
  }
}

main();
