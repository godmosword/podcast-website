import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { getStories } from "../data/content";
import { storyAudioPath } from "../lib/story-utils";
import { buildAudioLengthBySlug } from "./generate-audio-lengths";

describe("buildAudioLengthBySlug", () => {
  it("對存在的本地音檔回傳正整數位元組", () => {
    const lengths = buildAudioLengthBySlug();
    const withLocalAudio = getStories().filter((story) => {
      const assetPath = storyAudioPath(story.slug, story.audio);
      if (!assetPath.startsWith("/stories/")) return false;
      return existsSync(join(process.cwd(), "public", assetPath));
    });

    expect(withLocalAudio.length).toBeGreaterThan(0);
    for (const story of withLocalAudio) {
      const size = lengths[story.slug];
      expect(size, story.slug).toBeTypeOf("number");
      expect(size!, story.slug).toBeGreaterThan(0);

      const assetPath = storyAudioPath(story.slug, story.audio);
      const disk = statSync(join(process.cwd(), "public", assetPath)).size;
      expect(size).toBe(disk);
    }
  });

  it("略過不存在的音檔 slug", () => {
    const lengths = buildAudioLengthBySlug([
      {
        ...getStories()[0]!,
        slug: "ep-does-not-exist",
        audio: "missing.mp3",
      },
    ]);
    expect(lengths).toEqual({});
  });

  it("VISUAL_FIXTURE 開啟時略過寫檔（防 prebuild 把全集表寫成子集）", () => {
    const src = readFileSync(
      join(import.meta.dirname, "generate-audio-lengths.ts"),
      "utf8",
    );
    expect(src).toContain("isVisualFixtureEnabled()");
    expect(src).toMatch(/skipped（VISUAL_FIXTURE/);
  });
});
