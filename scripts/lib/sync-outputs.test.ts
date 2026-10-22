import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  SYNC_OUTPUT_PREFIXES,
  classifySyncDiff,
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

  it("只有 sync 分支、而且路徑都在允許範圍，才算 sync-only", () => {
    expect(classifySyncDiff("main", ["data/apple-synced.json"]).syncOnly).toBe(false);
    expect(
      classifySyncDiff("sync/apple", ["data/apple-synced.json", "public/stories/ep-1/01.jpg"]),
    ).toEqual({ syncOnly: true, outside: [] });
    expect(classifySyncDiff("sync/apple", []).syncOnly).toBe(true);
    expect(classifySyncDiff("sync/apple-9", ["README.md"]).outside).toEqual(["README.md"]);
  });
});

describe("sync-path-guard.sh", () => {
  const script = path.join(process.cwd(), "scripts/ci/sync-path-guard.sh");

  function run(env: NodeJS.ProcessEnv): { status: number; output: string } {
    const dir = mkdtempSync(path.join(tmpdir(), "sync-guard-"));
    const output = path.join(dir, "output");
    try {
      execFileSync("bash", [script], {
        env: { ...process.env, GITHUB_OUTPUT: output, ...env },
        encoding: "utf8",
        stdio: "pipe",
      });
      return { status: 0, output: readFileSync(output, "utf8") };
    } catch (err) {
      const error = err as { status?: number };
      return {
        status: error.status ?? 1,
        output: readFileSync(output, "utf8"),
      };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  it("人開的分支略過，不標成 sync-only", () => {
    const result = run({
      GITHUB_ACTIONS: "true",
      GITHUB_EVENT_NAME: "pull_request",
      GITHUB_HEAD_REF: "cursor/something",
      GITHUB_REF: "refs/pull/255/merge",
      GITHUB_REF_NAME: "255/merge",
      SYNC_PATH_GUARD_PATHS: "app/page.tsx",
    });
    expect(result.status).toBe(0);
    expect(result.output).toContain("sync_only=false");
  });

  it("sync 分支改到允許路徑以外就失敗", () => {
    // quality job 的 GITHUB_HEAD_REF 是這支 PR 的分支，測試只把 GITHUB_REF_NAME 設成 sync/apple。
    // 閘門不能因為環境裡還留著人開的 head ref 就把違規路徑放行。
    const result = run({
      GITHUB_ACTIONS: "true",
      GITHUB_EVENT_NAME: "pull_request",
      GITHUB_HEAD_REF: "cursor/sync-phase3-ruleset-38e7",
      GITHUB_REF: "refs/pull/255/merge",
      GITHUB_REF_NAME: "sync/apple",
      SYNC_PATH_GUARD_PATHS: "data/apple-synced.json\napp/page.tsx",
    });
    expect(result.status).toBe(1);
    expect(result.output).toContain("sync_only=false");
  });

  it("sync 分支只動 data/ 與 public/stories/ 就標成 sync-only", () => {
    const result = run({
      GITHUB_ACTIONS: "true",
      GITHUB_EVENT_NAME: "pull_request",
      GITHUB_HEAD_REF: "sync/apple",
      GITHUB_REF: "refs/pull/255/merge",
      GITHUB_REF_NAME: "255/merge",
      SYNC_PATH_GUARD_PATHS: "data/apple-sync-state.json\npublic/stories/ep-1/audio.mp3",
    });
    expect(result.status).toBe(0);
    expect(result.output).toContain("sync_only=true");
  });
});
