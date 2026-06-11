import { describe, expect, it } from "vitest";
import {
  buildNotifyCopy,
  shouldMobileNotify,
} from "./sync-notify-channels";
import type { SyncRunReport } from "./sync-report";

const report: SyncRunReport = {
  runAt: "2026-06-11T12:00:00.000Z",
  dryRun: false,
  newEpisodes: [{ slug: "ep-10", ep: 10, title: "高鐵出發囉" }],
  metadataUpdated: [],
  tagBackfill: [],
  vehicleBackfill: [],
  subtitlesCreated: ["ep-10"],
  subtitlesMissing: [],
  illustratePending: ["ep-10"],
};

describe("sync-notify-channels", () => {
  it("有新集時應推播", () => {
    expect(shouldMobileNotify(report)).toBe(true);
    expect(shouldMobileNotify({ ...report, newEpisodes: [] })).toBe(false);
  });

  it("LINE／Email 文案含 slug 與連結", () => {
    const copy = buildNotifyCopy(report, {
      "ep-10": "https://github.com/org/repo/issues/42",
    });
    expect(copy.subject).toContain("ep-10");
    expect(copy.lineText).toContain("ep-10");
    expect(copy.lineText).toContain("/story/ep-10");
    expect(copy.lineText).toContain("issues/42");
    expect(copy.emailHtml).toContain("npm run illustrate");
  });
});
