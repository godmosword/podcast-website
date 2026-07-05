#!/usr/bin/env npx tsx
/**
 * 整集 YouTube 影片匯出：場景插圖換頁 + data/subtitles 原始逐句字幕 burn-in。
 *
 * 用法：
 *   npm run export:video -- ep-9
 *   npm run export:video -- ep-9 --force    # 略過未 --mark 警告
 *   npm run export:video -- ep-9 --dry-run  # 只印 manifest／ffmpeg 計畫
 *
 * 前置：ffmpeg、HUNINN_TTF（預設 /tmp/huninn.ttf）、全幕生圖 + 校稿字幕。
 * 見 docs/VIDEO-EXPORT.md
 */
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { getStory } from "../data/content";
import {
  readScenesFile,
  readSubtitles,
  type ScenesFile,
} from "./lib/illustrate-core";
import {
  buildFfmpegPlan,
  collectSubtitleCharset,
  type ExportManifest,
  exportVideoMode,
  ffmpegFullInstallHint,
  ffmpegSupportsSubtitlesBurnIn,
  huninnDownloadHint,
  huninnTtfPath,
  resolveAudioDuration,
  resolveFfmpegBinary,
  resolveSceneClips,
  subtitlesToAss,
} from "./lib/export-video-core";
import { isSubtitleProofreadMarked } from "./lib/subtitle-proofread";
import { ROOT, STORIES_DIR } from "./lib/transcribe-core";

const EXPORT_ROOT = join(ROOT, "export", "video");

function parseArgs(argv: string[]): {
  slug: string | null;
  force: boolean;
  dryRun: boolean;
} {
  const force = argv.includes("--force");
  const dryRun = argv.includes("--dry-run");
  const slug = argv.find((a) => !a.startsWith("--")) ?? null;
  return { slug, force, dryRun };
}

function commandAvailable(cmd: string): boolean {
  try {
    execFileSync("which", [cmd], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function probeAudioDuration(audioPath: string): number | null {
  try {
    const out = execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        audioPath,
      ],
      { encoding: "utf8" },
    );
    const n = parseFloat(out.trim());
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

/** 依字幕 charset 子集 huninn TTF（供 ffmpeg ass burn-in）。 */
function subsetHuninnForSubtitles(
  sourceTtf: string,
  subtitlesText: string,
  outputTtf: string,
  charsetFile: string,
): void {
  writeFileSync(charsetFile, subtitlesText, "utf8");
  execFileSync(
    "python3",
    [
      "-m",
      "fontTools.subset",
      sourceTtf,
      `--text-file=${charsetFile}`,
      `--output-file=${outputTtf}`,
      "--layout-features=kern,liga,calt,palt",
      "--no-hinting",
      "--name-IDs=",
      "--notdef-outline",
    ],
    { stdio: "inherit" },
  );
}

function assertExportProofread(slug: string, force: boolean): void {
  if (isSubtitleProofreadMarked(slug)) return;
  if (force) {
    console.warn(
      `⚠ ${slug}：字幕尚未 proofread --mark，--force 仍繼續匯出（Whisper 草稿可能含誤字）`,
    );
    return;
  }
  console.error(
    `${slug}：字幕尚未校對標記。請先：\n` +
      `  npm run proofread:subtitles -- ${slug} [--fix] → 人工修 JSON → --mark\n` +
      `或 npm run export:video -- ${slug} --force\n` +
      `（見 docs/SUBTITLE-PROOFREAD.md）`,
  );
  process.exit(1);
}

function loadScenesOptional(slug: string): ScenesFile | null {
  try {
    return readScenesFile(slug);
  } catch {
    return null;
  }
}

function main(): void {
  const { slug, force, dryRun } = parseArgs(process.argv.slice(2));
  if (!slug) {
    console.error("用法：npm run export:video -- <slug> [--force] [--dry-run]");
    process.exit(1);
  }

  const story = getStory(slug);
  if (!story) {
    console.error(`找不到集數 ${slug}`);
    process.exit(1);
  }

  if (!commandAvailable("ffmpeg") && !existsSync(resolveFfmpegBinary())) {
    console.error("找不到 ffmpeg；請 brew install ffmpeg-full（含 libass 字幕 burn-in）");
    process.exit(1);
  }

  const ffmpegBin = resolveFfmpegBinary();
  if (!ffmpegSupportsSubtitlesBurnIn(ffmpegBin)) {
    console.error(
      `目前 ffmpeg 不支援 subtitles filter（無 libass），無法 burn-in 字幕。\n` +
        `  ${ffmpegFullInstallHint()}\n` +
        `  或 export FFMPEG=/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg`,
    );
    process.exit(1);
  }

  const huninnSrc = huninnTtfPath();
  if (!dryRun && !existsSync(huninnSrc)) {
    console.error(`找不到 huninn 字型 ${huninnSrc}`);
    console.error(`下載：${huninnDownloadHint()}`);
    process.exit(1);
  }

  assertExportProofread(slug, force);

  let subtitles;
  try {
    subtitles = readSubtitles(slug);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  const audioPath = join(STORIES_DIR, slug, "audio.mp3");
  if (!existsSync(audioPath)) {
    console.error(`找不到音檔 ${audioPath}`);
    process.exit(1);
  }

  const scenesFile = loadScenesOptional(slug);
  const probed = probeAudioDuration(audioPath);
  const audioDuration = resolveAudioDuration(scenesFile, subtitles, probed);
  const pageCount = story.pageCount ?? 1;

  let clips;
  try {
    clips = resolveSceneClips({
      slug,
      pageCount,
      scenesFile,
      audioDuration,
    });
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  for (const clip of clips) {
    if (!existsSync(clip.imagePath)) {
      console.error(`缺插圖 ${clip.imagePath}`);
      process.exit(1);
    }
  }

  const mode = exportVideoMode(pageCount, scenesFile);
  if (mode === "mvp-single-image") {
    console.warn(
      `⚠ ${slug}：pageCount=${pageCount}，MVP 單圖模式（整集僅 01.jpg）；全幕體驗請先 illustrate --approve`,
    );
  }

  const outDir = join(EXPORT_ROOT, slug);
  const workDir = join(outDir, "_work");
  const assPath = join(workDir, `${slug}.ass`);
  const assFile = `${slug}.ass`;
  const fontsSubDir = join(workDir, "fonts");
  const fontOut = join(fontsSubDir, "huninn-video.ttf");
  const charsetFile = join(workDir, "charset.txt");
  const fontsDir = "fonts";
  const outputFile = `${slug}.mp4`;
  const outputPath = join(outDir, outputFile);

  const manifest: ExportManifest = {
    slug,
    title: story.title,
    audioDuration,
    sceneCount: clips.length,
    subtitleCount: subtitles.length,
    proofreadMarked: isSubtitleProofreadMarked(slug),
    mode,
    output: outputFile,
    generatedAt: new Date().toISOString(),
  };

  const ass = subtitlesToAss(subtitles, audioDuration);
  const plan = buildFfmpegPlan({
    clips,
    audioPath,
    outputPath,
    assFile,
    fontsDir,
  });

  if (dryRun) {
    console.log(JSON.stringify(manifest, null, 2));
    console.log("\nffmpeg", ["ffmpeg", ...plan.args].join(" "));
    console.log("\nfilter_complex:", plan.filterComplex);
    return;
  }

  mkdirSync(workDir, { recursive: true });
  mkdirSync(fontsSubDir, { recursive: true });
  writeFileSync(assPath, ass, "utf8");

  console.log(`字型子集：${fontOut}`);
  subsetHuninnForSubtitles(
    huninnSrc,
    collectSubtitleCharset(subtitles),
    fontOut,
    charsetFile,
  );

  console.log(`合成 ${clips.length} 幕 → ${outputPath}（${audioDuration}s）…`);
  const result = spawnSync(ffmpegBin, plan.args, { stdio: "inherit", cwd: workDir });
  if (result.status !== 0) {
    console.error("ffmpeg 失敗");
    process.exit(result.status ?? 1);
  }

  writeFileSync(
    join(outDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  console.log(`✓ 完成：${outputPath}`);
  console.log(`  manifest：${join(outDir, "manifest.json")}`);
  console.log("  下一步：YouTube Studio 上傳（見 docs/VIDEO-EXPORT.md）");
}

main();
