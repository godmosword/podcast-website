/**
 * 建置時掃描本地故事音檔，產出 data/audio-lengths.json（slug → bytes）。
 *
 * 紅線：app/feed.xml 禁止 runtime `join(process.cwd(), "public", …)`——
 * Next output file tracing 會把整個 public/ 打進 serverless function
 *（曾致 255MB+ 部署失敗）。enclosure length 只能讀此預計算表。
 *
 *   npm run generate:audio-lengths
 *   （亦掛在 prebuild）
 */
import { existsSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getStories } from "../data/content";
import { storyAudioPath } from "../lib/story-utils";

const OUT_PATH = resolve(process.cwd(), "data/audio-lengths.json");

/** 依故事清單 stat 本地音檔；僅 `/stories/` 路徑納入，缺檔略過。 */
export function buildAudioLengthBySlug(
  stories: ReturnType<typeof getStories> = getStories(),
): Record<string, number> {
  const entries: [string, number][] = [];

  for (const story of stories) {
    const assetPath = storyAudioPath(story.slug, story.audio);
    if (!assetPath.startsWith("/stories/")) continue;

    const filePath = join(process.cwd(), "public", assetPath);
    if (!existsSync(filePath)) continue;

    try {
      const { size } = statSync(filePath);
      if (size > 0) entries.push([story.slug, size]);
    } catch {
      // 讀取失敗略過；feed 端 fallback 0
    }
  }

  return Object.fromEntries(entries);
}

export function writeAudioLengthsJson(
  lengths: Record<string, number> = buildAudioLengthBySlug(),
): string {
  const sorted = Object.fromEntries(
    Object.entries(lengths).sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(OUT_PATH, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
  return OUT_PATH;
}

function main(): void {
  const lengths = buildAudioLengthBySlug();
  writeAudioLengthsJson(lengths);
  console.log(
    `generate-audio-lengths: wrote ${Object.keys(lengths).length} entries → data/audio-lengths.json`,
  );
}

const isDirectRun =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  main();
}
