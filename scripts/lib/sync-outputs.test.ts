import { describe, expect, it } from "vitest";
import {
  SYNC_OUTPUT_PREFIXES,
  isSyncBotBranch,
  isSyncOutputPath,
  pathsOutsideSyncOutputs,
} from "./sync-outputs";

const SIDECARS = [
  "data/apple-synced.json",
  "data/apple-sync-state.json",
  "data/browse-index.json",
  "data/story-zones.ts",
  "data/reflection-prompts.ts",
  "data/story-dates.ts",
  "data/episode-faqs.ts",
  "data/audio-lengths.json",
  "data/story-image-blurs.json",
  "data/subtitles/ep-34.json",
  "public/stories/ep-34/audio.mp3",
  "public/stories/ep-34/01.jpg",
] as const;

describe("sync output paths", () => {
  it("前綴就是 data/ 與 public/stories/", () => {
    expect(SYNC_OUTPUT_PREFIXES).toEqual(["data/", "public/stories/"]);
  });

  it("現有同步產物都落在允許路徑", () => {
    for (const filePath of SIDECARS) {
      expect(isSyncOutputPath(filePath), filePath).toBe(true);
    }
  });

  it("工作流程、鎖檔與網站程式不在同步產物裡", () => {
    expect(
      pathsOutsideSyncOutputs([
        "package-lock.json",
        ".github/workflows/sync-apple-podcast.yml",
        "app/page.tsx",
        "public/llms-full.txt",
      ]),
    ).toEqual([
      "package-lock.json",
      ".github/workflows/sync-apple-podcast.yml",
      "app/page.tsx",
      "public/llms-full.txt",
    ]);
  });

  it("認得固定分支與舊的逐次分支", () => {
    expect(isSyncBotBranch("sync/apple")).toBe(true);
    expect(isSyncBotBranch("sync/apple-123")).toBe(true);
    expect(isSyncBotBranch("cursor/sync-phase1-validate-38e7")).toBe(false);
  });
});
