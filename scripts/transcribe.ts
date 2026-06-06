#!/usr/bin/env tsx
// ============================================================
// 車車遊樂園 — 音檔自動轉錄成「即時字幕」（本機 whisper.cpp）
// ============================================================
// 從 public/stories/<slug>/audio.mp3 產生帶時間軸的字幕，寫入
// data/subtitles/<slug>.json（播放器自動套用，獨立於翻頁）。
// 隱私：音檔不外送，全程本機。
//
// 需求（一次性）：
//   brew install whisper-cpp
//   mkdir -p models && curl -L -o models/ggml-large-v3.bin \
//     https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin
//
// 用法：
//   npm run transcribe -- ev                  # 單集
//   npm run transcribe -- ev drone ep-7       # 多集
//   npm run transcribe -- --all               # 全部 public/stories/* 有 audio.mp3 的集
//   WHISPER_MODEL=models/ggml-small.bin npm run transcribe -- ev
//
// 輸出為草稿（逐字、可能誤聽人名、偶有簡體），上架前請人工校對。
// ============================================================

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  ROOT,
  transcribeToSidecar,
  whisperAvailable,
} from "./lib/transcribe-core";

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function allSlugsWithAudio(): string[] {
  const base = join(ROOT, "public", "stories");
  return readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((slug) => existsSync(join(base, slug, "audio.mp3")))
    .sort();
}

function main(): void {
  const args = process.argv.slice(2);
  const slugs = args.includes("--all")
    ? allSlugsWithAudio()
    : args.filter((a) => !a.startsWith("--"));

  if (slugs.length === 0) {
    fail("用法：npm run transcribe -- <slug...> 或 --all");
  }
  if (!whisperAvailable()) {
    fail(
      "找不到 whisper-cli / ffmpeg / 模型。\n" +
        "  brew install whisper-cpp ffmpeg\n" +
        "  下載模型到 models/（見檔頭），或設 WHISPER_MODEL。",
    );
  }

  let ok = 0;
  for (const slug of slugs) {
    const audio = join(ROOT, "public", "stories", slug, "audio.mp3");
    if (!existsSync(audio)) {
      console.error(`✗ 略過 ${slug}：找不到 ${audio}`);
      continue;
    }
    console.error(`→ 轉錄 ${slug}…`);
    try {
      const { count, file } = transcribeToSidecar(slug, audio);
      console.log(`✓ ${slug}：${count} 句 → ${file}`);
      ok += 1;
    } catch (err) {
      console.error(`✗ ${slug} 失敗：${(err as Error).message}`);
    }
  }

  console.error(
    `\n完成 ${ok}/${slugs.length} 集。字幕為草稿，請人工校對（刪誤聽、簡轉繁）。`,
  );
}

main();
