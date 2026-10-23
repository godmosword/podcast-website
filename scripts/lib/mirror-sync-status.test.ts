import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { load as parseYaml } from "js-yaml";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const SCRIPT = path.join(process.cwd(), "scripts/ci/mirror-sync-status.sh");

type Job = {
  needs?: string[];
  if?: string;
  permissions?: Record<string, string>;
  steps?: { run?: string; env?: Record<string, string> }[];
};

function readCiJobs(): Record<string, Job> {
  const yaml = readFileSync(path.join(process.cwd(), ".github/workflows/ci.yml"), "utf8");
  return (parseYaml(yaml) as { jobs: Record<string, Job> }).jobs;
}

describe("mirror-sync-status.sh", () => {
  let dir: string;
  let log: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "mirror-status-"));
    log = path.join(dir, "gh.log");
    const fakeGh = path.join(dir, "gh");
    writeFileSync(fakeGh, `#!/usr/bin/env bash\nprintf '%s\\n' "$*" >> "${log}"\n`);
    chmodSync(fakeGh, 0o755);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function run(results: Record<string, string>): string[] {
    execFileSync("bash", [SCRIPT], {
      encoding: "utf8",
      stdio: "pipe",
      env: {
        ...process.env,
        PATH: `${dir}:${process.env.PATH ?? ""}`,
        GITHUB_SHA: "abc1234def",
        GITHUB_REPOSITORY: "godmosword/podcast-website",
        GITHUB_RUN_ID: "42",
        GITHUB_SERVER_URL: "https://github.com",
        ...results,
      },
    });
    try {
      return readFileSync(log, "utf8").trim().split("\n");
    } catch {
      return [];
    }
  }

  it("三個 required check 都成功就各寫一筆同名 success status", () => {
    const calls = run({
      QUALITY_RESULT: "success",
      BUILD_RESULT: "success",
      SYNC_VALIDATE_RESULT: "success",
    });
    expect(calls).toHaveLength(3);
    for (const context of ["quality", "build-and-public-e2e", "sync-validate"]) {
      const call = calls.find((line) => line.includes(`context=${context} `));
      expect(call, context).toBeDefined();
      expect(call).toContain("repos/godmosword/podcast-website/statuses/abc1234def");
      expect(call).toContain("state=success");
      expect(call).toContain("target_url=https://github.com/godmosword/podcast-website/actions/runs/42");
    }
  });

  it("失敗照實寫 failure，PR 上看得到是哪一關", () => {
    const calls = run({
      QUALITY_RESULT: "failure",
      BUILD_RESULT: "success",
      SYNC_VALIDATE_RESULT: "success",
    });
    expect(calls.find((line) => line.includes("context=quality "))).toContain("state=failure");
  });

  it("cancelled／skipped 不寫，等下一次 CI，不能當成通過", () => {
    const calls = run({
      QUALITY_RESULT: "cancelled",
      BUILD_RESULT: "skipped",
      SYNC_VALIDATE_RESULT: "success",
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain("context=sync-validate ");
  });
});

describe("ci.yml 的 mirror-sync-status job", () => {
  const jobs = readCiJobs();
  const job = jobs["mirror-sync-status"];

  it("存在，而且等 quality、build-and-public-e2e、sync-validate 跑完", () => {
    expect(job).toBeDefined();
    expect([...(job.needs ?? [])].sort()).toEqual(
      ["build-and-public-e2e", "quality", "sync-validate"].sort(),
    );
    for (const name of job.needs ?? []) {
      expect(jobs[name], `ci.yml 缺 ${name} job`).toBeDefined();
    }
  });

  it("只在 workflow_dispatch 跑 sync 分支時鏡射，失敗也要寫", () => {
    expect(job.if).toContain("always()");
    expect(job.if).toContain("github.event_name == 'workflow_dispatch'");
    expect(job.if).toContain("github.ref_name == 'sync/apple'");
    expect(job.if).toContain("startsWith(github.ref_name, 'sync/apple-')");
  });

  it("只拿 statuses: write，不放大整支 CI 的權限", () => {
    expect(job.permissions).toEqual({ contents: "read", statuses: "write" });
  });

  it("把三個 job 的結果傳給 mirror-sync-status.sh", () => {
    const step = (job.steps ?? []).find((s) => s.run?.includes("mirror-sync-status.sh"));
    expect(step, "找不到執行 mirror-sync-status.sh 的 step").toBeDefined();
    expect(step!.env).toMatchObject({
      GH_TOKEN: "${{ github.token }}",
      QUALITY_RESULT: "${{ needs.quality.result }}",
      BUILD_RESULT: "${{ needs.build-and-public-e2e.result }}",
      SYNC_VALIDATE_RESULT: "${{ needs.sync-validate.result }}",
    });
  });
});
