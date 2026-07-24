import { describe, expect, it } from "vitest";
import { buildCommitMessage, buildIssueBody } from "../post-sync-notify";
import {
  DEFAULT_SYNC_REPORT_RELATIVE,
  resolveSyncReportPath,
  type SyncRunReport,
} from "./sync-report";

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

describe("buildIssueBody trigger", () => {
  it("local trigger 文案", () => {
    const body = buildIssueBody("ep-10", sampleReport, { trigger: "local" });
    expect(body).toContain("本機 sync:notify（push 後）");
  });
});
