import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildCommitMessage, buildIssueBody } from "../post-sync-notify";
import {
  DEFAULT_SYNC_REPORT_RELATIVE,
  isReportGitHeadAcceptable,
  resolveGitHeadShort,
  resolveSyncReportPath,
  type SyncRunReport,
} from "./sync-report";

const tempRepos: string[] = [];

afterEach(() => {
  for (const dir of tempRepos.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

/** Apple sync GHA checkout 預設 fetch-depth:1，工作區可能沒有 HEAD~1。 */
function initTempRepo(commitCount: number): string {
  const dir = mkdtempSync(join(tmpdir(), "sync-report-git-"));
  tempRepos.push(dir);
  execFileSync("git", ["init", "-b", "main"], { cwd: dir });
  execFileSync("git", ["config", "user.email", "sync-test@example.com"], {
    cwd: dir,
  });
  execFileSync("git", ["config", "user.name", "sync-test"], { cwd: dir });
  execFileSync("git", ["config", "commit.gpgsign", "false"], { cwd: dir });
  for (let i = 0; i < commitCount; i += 1) {
    writeFileSync(join(dir, "note.txt"), `commit ${i}\n`);
    execFileSync("git", ["add", "note.txt"], { cwd: dir });
    execFileSync("git", ["commit", "-m", `c${i}`], { cwd: dir });
  }
  return dir;
}

function gitShort(rev: string, cwd: string): string {
  return execFileSync("git", ["rev-parse", "--short", rev], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

const sampleReport: SyncRunReport = {
  runAt: "2026-06-11T12:00:00.000Z",
  dryRun: false,
  newEpisodes: [{ slug: "ep-10", ep: 10, title: "測試新集" }],
  metadataUpdated: [],
  tagBackfill: [],
  vehicleBackfill: [],
  subtitlesCreated: ["ep-10"],
  proofreadAutoFixed: { "ep-10": 3 },
  proofreadPendingLint: { "ep-10": 2 },
  subtitlesMissing: [],
  illustratePending: ["ep-10"],
  browseIndexVehicles: [],
  browseIndexTopics: [],
  emojiSync: [],
  episodeFaqStubs: ["ep-10"],
};

describe("post-sync-notify", () => {
  it("commit 訊息含新集與 illustrate 指令", () => {
    const msg = buildCommitMessage(sampleReport);
    expect(msg).toContain("ep-10");
    expect(msg).toContain("npm run illustrate -- ep-10");
    expect(msg).toContain("proofread:subtitles");
    expect(msg).toContain("GHA 已自動 --fix");
    expect(msg).toContain("字幕自動校稿");
    expect(msg).toContain("FAQ MVP 待人工改寫");
  });

  it("Issue body 含 checklist 與故事連結", () => {
    const body = buildIssueBody("ep-10", sampleReport);
    expect(body).toContain("## 新集待生圖：ep-10");
    expect(body).toContain("proofread:subtitles");
    expect(body).toContain("--mark");
    expect(body).toContain("GHA 已自動 proofread --fix");
    expect(body).toContain("修正 lint 待辦 2 項");
    expect(body).toContain("--approve");
    expect(body).toContain("contact.html");
    expect(body).toContain("/story/ep-10");
    expect(body).toContain("FAQ MVP stub");
  });
});

describe("resolveSyncReportPath", () => {
  it("SYNC_REPORT_PATH 非空時原樣回傳（GHA 優先）", () => {
    const envPath = "/runner/temp/sync-run-report.json";
    expect(
      resolveSyncReportPath({ SYNC_REPORT_PATH: envPath }, "/repo/root"),
    ).toBe(envPath);
  });

  it("未設定 SYNC_REPORT_PATH 時落地至 rootDir 下的預設路徑", () => {
    const resolved = resolveSyncReportPath({}, "/repo/root");
    expect(resolved).toBe(`/repo/root/${DEFAULT_SYNC_REPORT_RELATIVE}`);
    expect(resolved.endsWith(".cache/sync-run-report.json")).toBe(true);
  });

  it("SYNC_REPORT_PATH 為空字串時視為未設定", () => {
    const resolved = resolveSyncReportPath({ SYNC_REPORT_PATH: "  " }, "/repo/root");
    expect(resolved.endsWith(".cache/sync-run-report.json")).toBe(true);
  });
});

describe("isReportGitHeadAcceptable", () => {
  it("接受目前 HEAD（GHA 無新 commit 時）", () => {
    const head = resolveGitHeadShort();
    expect(head).toBeTruthy();
    expect(isReportGitHeadAcceptable(head!)).toEqual({ ok: true });
  });

  it("接受 HEAD 的近期祖先（sync 先寫 report 再 commit）", () => {
    const root = initTempRepo(2);
    const parent = gitShort("HEAD~1", root);
    expect(parent).toBeTruthy();
    expect(isReportGitHeadAcceptable(parent, root)).toEqual({ ok: true });
  });

  it("單顆 commit（淺 clone）仍接受相同 HEAD", () => {
    const root = initTempRepo(1);
    const head = gitShort("HEAD", root);
    expect(isReportGitHeadAcceptable(head, root)).toEqual({ ok: true });
  });

  it("拒絕無關 sha", () => {
    const result = isReportGitHeadAcceptable("deadbeef");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/gitHead=deadbeef/);
      expect(result.reason).toMatch(/HEAD=/);
    }
  });
});

describe("buildIssueBody trigger", () => {
  it("local trigger 文案", () => {
    const body = buildIssueBody("ep-10", sampleReport, { trigger: "local" });
    expect(body).toContain("本機 sync:notify（push 後）");
  });
});
