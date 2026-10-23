import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  SYNC_OUTPUT_PATHS,
  classifySyncDiff,
  isSyncBotBranch,
  isSyncOutputPath,
  parseSyncOutputPaths,
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

/** 手寫的程式、設定與測試。sync PR 會跳過 lint／typecheck／單元測試，這些絕不能被放行。 */
const HAND_WRITTEN = [
  "data/content.ts",
  "data/games.ts",
  "data/playgrounds.ts",
  "data/stories.ts",
  "data/content.test.ts",
  "data/apple-sync.defaults.json",
  "data/characters.json",
  "data/scenes/ep-1.ts",
  "data/apple-synced.json.bak",
] as const;

describe("sync output paths", () => {
  it("白名單只有同步真的會寫的檔案與兩個目錄", () => {
    expect([...SYNC_OUTPUT_PATHS].sort()).toEqual(
      [
        "data/apple-synced.json",
        "data/apple-sync-state.json",
        "data/audio-lengths.json",
        "data/browse-index.json",
        "data/episode-faqs.ts",
        "data/reflection-prompts.ts",
        "data/story-dates.ts",
        "data/story-image-blurs.json",
        "data/story-zones.ts",
        "data/subtitles/",
        "public/stories/",
      ].sort(),
    );
  });

  it("清單格式：去掉註解與空行，前後空白不算", () => {
    expect(
      parseSyncOutputPaths("# 註解\n\n data/a.json \n  # 縮排的註解\npublic/stories/\n"),
    ).toEqual(["data/a.json", "public/stories/"]);
  });

  it("現有同步產物都落在允許路徑", () => {
    for (const filePath of SIDECARS) {
      expect(isSyncOutputPath(filePath), filePath).toBe(true);
    }
  });

  it("data/ 底下手寫的檔案不算同步產物", () => {
    expect(pathsOutsideSyncOutputs(HAND_WRITTEN)).toEqual([...HAND_WRITTEN]);
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
    expect(classifySyncDiff("sync/apple", ["data/content.ts"])).toEqual({
      syncOnly: false,
      outside: ["data/content.ts"],
    });
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

  function runOnSyncBranch(paths: readonly string[]): { status: number; output: string } {
    return run({
      GITHUB_ACTIONS: "true",
      GITHUB_EVENT_NAME: "pull_request",
      GITHUB_HEAD_REF: "sync/apple",
      GITHUB_REF: "refs/pull/257/merge",
      GITHUB_REF_NAME: "257/merge",
      SYNC_PATH_GUARD_PATHS: paths.join("\n"),
    });
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

  it("sync 分支只動白名單就標成 sync-only", () => {
    const result = runOnSyncBranch(SIDECARS);
    expect(result.status).toBe(0);
    expect(result.output).toContain("sync_only=true");
  });

  it.each(HAND_WRITTEN)("sync 分支改到手寫的 %s 就失敗", (filePath) => {
    const result = runOnSyncBranch(["data/apple-synced.json", filePath]);
    expect(result.status).toBe(1);
    expect(result.output).toContain("sync_only=false");
  });
});

describe("sync_stage_outputs（scripts/ci/lib.sh）", () => {
  const lib = path.join(process.cwd(), "scripts/ci/lib.sh");

  function git(cwd: string, ...args: string[]): string {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: "pipe" });
  }

  function withRepo(test: (repo: string) => void): void {
    const repo = mkdtempSync(path.join(tmpdir(), "sync-stage-"));
    try {
      git(repo, "init", "-q");
      git(repo, "config", "user.email", "test@example.com");
      git(repo, "config", "user.name", "test");
      mkdirSync(path.join(repo, "data/subtitles"), { recursive: true });
      writeFileSync(path.join(repo, "data/apple-synced.json"), "[]\n");
      writeFileSync(path.join(repo, "data/content.ts"), "export {};\n");
      git(repo, "add", ".");
      git(repo, "commit", "-q", "-m", "init");
      test(repo);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  }

  function stage(repo: string): { status: number; stdout: string } {
    try {
      const stdout = execFileSync(
        "bash",
        ["-c", `source "${lib}"; sync_stage_outputs`],
        { cwd: repo, encoding: "utf8", stdio: "pipe", env: { ...process.env, RUNNER_TEMP: repo } },
      );
      return { status: 0, stdout };
    } catch (err) {
      const error = err as { status?: number; stdout?: string };
      return { status: error.status ?? 1, stdout: error.stdout ?? "" };
    }
  }

  it("只 stage 白名單；清單裡不存在的檔案不會讓 git add 失敗", () => {
    withRepo((repo) => {
      writeFileSync(path.join(repo, "data/apple-synced.json"), "[1]\n");
      writeFileSync(path.join(repo, "data/subtitles/ep-9.json"), "[]\n");
      expect(stage(repo).status).toBe(0);
      expect(git(repo, "diff", "--cached", "--name-only").trim().split("\n").sort()).toEqual([
        "data/apple-synced.json",
        "data/subtitles/ep-9.json",
      ]);
    });
  });

  it("事先已 stage 的白名單外變更（刪掉 data/content.ts）也要擋下", () => {
    withRepo((repo) => {
      writeFileSync(path.join(repo, "data/apple-synced.json"), "[1]\n");
      git(repo, "rm", "-q", "data/content.ts");
      const result = stage(repo);
      expect(result.status).toBe(1);
      expect(result.stdout).toContain("data/content.ts");
    });
  });

  it("寫到白名單以外（手寫的 data/content.ts）就失敗，不會被一起 stage", () => {
    withRepo((repo) => {
      writeFileSync(path.join(repo, "data/apple-synced.json"), "[1]\n");
      writeFileSync(path.join(repo, "data/content.ts"), "export const x = 1;\n");
      const result = stage(repo);
      expect(result.status).toBe(1);
      expect(result.stdout).toContain("data/content.ts");
      expect(git(repo, "diff", "--cached", "--name-only")).not.toContain("data/content.ts");
    });
  });
});
