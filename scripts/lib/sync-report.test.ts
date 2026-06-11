import { describe, expect, it } from "vitest";
import { buildCommitMessage, buildIssueBody } from "../post-sync-notify";
import type { SyncRunReport } from "./sync-report";

const sampleReport: SyncRunReport = {
  runAt: "2026-06-11T12:00:00.000Z",
  dryRun: false,
  newEpisodes: [{ slug: "ep-10", ep: 10, title: "測試新集" }],
  metadataUpdated: [],
  tagBackfill: [],
  vehicleBackfill: [],
  subtitlesCreated: ["ep-10"],
  subtitlesMissing: [],
  illustratePending: ["ep-10"],
};

describe("post-sync-notify", () => {
  it("commit 訊息含新集與 illustrate 指令", () => {
    const msg = buildCommitMessage(sampleReport);
    expect(msg).toContain("ep-10");
    expect(msg).toContain("npm run illustrate -- ep-10");
    expect(msg).toContain("草稿，請校對");
  });

  it("Issue body 含 checklist 與故事連結", () => {
    const body = buildIssueBody("ep-10", sampleReport);
    expect(body).toContain("## 新集待生圖：ep-10");
    expect(body).toContain("--approve");
    expect(body).toContain("contact.html");
    expect(body).toContain("/story/ep-10");
  });
});
