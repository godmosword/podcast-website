#!/usr/bin/env tsx
// ============================================================
// 車車遊樂園 — 音檔自動轉錄成「即時字幕草稿」（本機 whisper.cpp）
// ============================================================
// 從 public/stories/<slug>/audio.mp3 產生帶時間軸的字幕草稿：
//   captions[]（每段文字）+ captionTimes[]（每段起始秒數）
// 直接貼回 data/stories.ts 該集即可（請先人工校對）。
//
// 隱私：音檔不外送，全程本機。
//
// 需求（一次性安裝）：
//   brew install whisper-cpp           # 提供 whisper-cli
//   并下載模型，例如 ggml-large-v3（繁中較準）：
//   curl -L -o models/ggml-large-v3.bin \
//     https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin
//
// 用法：
//   npm run transcribe -- ev                 # 轉錄 public/stories/ev/audio.mp3
//   WHISPER_MODEL=models/ggml-medium.bin npm run transcribe -- ev
//   WHISPER_BIN=/opt/homebrew/bin/whisper-cli npm run transcribe -- ev
//
// 注意：
//   - 輸出為「逐字稿草稿」（語氣詞、口語、可能誤聽人名），上架前需人工校對。
//   - Whisper 多輸出簡體；繁中站需做簡轉繁（可用 OpenCC 或手改）。
//   - Apple 自動同步的新集本無字幕，這是補字幕最快的方法。
// ============================================================

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const WHISPER_BIN = process.env.WHISPER_BIN ?? "whisper-cli";
const MODEL = process.env.WHISPER_MODEL ?? "models/ggml-large-v3.bin";
const LANG = process.env.WHISPER_LANG ?? "zh";

type WhisperSegment = {
  offsets?: { from: number; to: number }; // 毫秒
  text?: string;
};
type WhisperJson = { transcription?: WhisperSegment[] };

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function checkBin(bin: string, hint: string): void {
  try {
    execFileSync("which", [bin], { stdio: "ignore" });
  } catch {
    fail(`找不到 ${bin}。${hint}`);
  }
}

function main(): void {
  const slug = process.argv[2];
  if (!slug) fail("用法：npm run transcribe -- <slug>（例：ev）");

  const audio = join("public", "stories", slug, "audio.mp3");
  if (!existsSync(audio)) fail(`找不到音檔 ${audio}`);
  if (!existsSync(MODEL)) {
    fail(
      `找不到模型 ${MODEL}。下載例：\n` +
        `  curl -L -o ${MODEL} https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${MODEL.split("/").pop()}\n` +
        `或設 WHISPER_MODEL 指向既有模型。`,
    );
  }
  checkBin("ffmpeg", "請先 brew install ffmpeg。");
  checkBin(WHISPER_BIN, "請先 brew install whisper-cpp（或設 WHISPER_BIN）。");

  const work = mkdtempSync(join(tmpdir(), "transcribe-"));
  const wav = join(work, `${slug}.wav`);
  const outBase = join(work, slug);

  try {
    // whisper.cpp 需要 16kHz 單聲道 wav
    console.error("→ 轉檔 16kHz wav…");
    execFileSync(
      "ffmpeg",
      ["-i", audio, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", "-y", wav],
      { stdio: "ignore" },
    );

    console.error(`→ 轉錄中（模型 ${MODEL}，語言 ${LANG}）…`);
    execFileSync(
      WHISPER_BIN,
      [
        "-m", MODEL,
        "-f", wav,
        "-l", LANG,
        "-oj", // 輸出 JSON
        "-of", outBase,
        "--print-progress", "false",
      ],
      { stdio: ["ignore", "ignore", "inherit"] },
    );

    const json = JSON.parse(
      readFileSync(`${outBase}.json`, "utf-8"),
    ) as WhisperJson;
    const segments = (json.transcription ?? [])
      .map((s) => ({
        time: Math.round(((s.offsets?.from ?? 0) / 1000) * 10) / 10,
        text: (s.text ?? "").trim(),
      }))
      .filter((s) => s.text.length > 0);

    if (segments.length === 0) fail("轉錄結果為空。");

    const captions = segments.map((s) => s.text);
    const captionTimes = segments.map((s) => s.time);

    console.log(`\n// === ${slug} 字幕草稿（${segments.length} 句，請校對）===`);
    console.log(`captions: ${JSON.stringify(captions, null, 2)},`);
    console.log(`captionTimes: ${JSON.stringify(captionTimes)},`);
    console.error(
      `\n✓ 完成。貼回 data/stories.ts 的「${slug}」那筆，校對後（含簡轉繁）即可。`,
    );
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

main();
