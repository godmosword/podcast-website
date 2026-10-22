import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Story } from "../../data/content";
import {
  appendJobSummary,
  validateParsedSync,
  validateSyncRepo,
} from "./sync-validate";

function story(overrides: Partial<Story> = {}): Story {
  return {
    slug: "ep-1",
    ep: 1,
    title: "測試故事",
    date: "2026-01-01",
    vehicle: "消防車",
    emoji: "🚒",
    color: "#7048e8",
    audio: "audio.mp3",
    pageCount: 1,
    kind: "story",
    ...overrides,
  };
}

const synced = [
  {
    slug: "ep-1",
    ep: 1,
    title: "測試故事",
    date: "2026-01-01",
    vehicle: "消防車",
    emoji: "🚒",
    color: "#7048e8",
    audio: "audio.mp3",
    pageCount: 1,
  },
];

const state = {
  seenGuids: ["guid-1"],
  lastRun: "2026-10-01T00:00:00.000Z",
  guidBySlug: { "ep-1": "guid-1" },
};

const browseIndex = {
  vehicles: { 消防車: { emoji: "🚒", patterns: ["消防"] } },
  topics: { 情緒: { symbol: "heart" } },
};

describe("validateParsedSync", () => {
  it("封面、blur、slug、guid 都齊才沒有 error", () => {
    const report = validateParsedSync({
      synced,
      state,
      browseIndex,
      stories: [story()],
      coverExists: () => true,
      blurExists: () => true,
      workflowIssues: [],
      browseIssues: [],
    });
    expect(report.errors).toEqual([]);
  });

  it("slug 或 guid 重複、缺封面、缺 blur 都是 error；缺字幕維持 warn", () => {
    const report = validateParsedSync({
      synced,
      state: {
        seenGuids: ["guid-1", "guid-1"],
        lastRun: null,
        guidBySlug: { "ep-1": "guid-1", "ep-2": "guid-1" },
      },
      browseIndex,
      stories: [story(), story({ slug: "ep-1", ep: 2 })],
      coverExists: (slug) => slug !== "ep-1",
      blurExists: () => false,
      workflowIssues: [
        {
          slug: "ep-1",
          level: "warn",
          code: "mvp-missing-subtitles",
          message: "MVP 集缺字幕側車檔",
        },
      ],
      browseIssues: [],
    });

    expect(report.errors.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "duplicate-slug",
        "duplicate-guid",
        "missing-cover",
        "missing-blur",
      ]),
    );
    expect(report.warnings.map((issue) => issue.code)).toContain(
      "mvp-missing-subtitles",
    );
  });

  it("JSON 不符合 schema 時回 schema error", () => {
    const report = validateParsedSync({
      synced: [{ slug: "" }],
      state: { seenGuids: [], lastRun: null },
      browseIndex: { vehicles: {}, topics: {} },
      stories: [],
      workflowIssues: [],
      browseIssues: [],
    });
    expect(report.errors.some((issue) => issue.code === "schema")).toBe(true);
  });

  it("警告寫進 GITHUB_STEP_SUMMARY", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "sync-validate-"));
    const summary = path.join(dir, "summary.md");
    writeFileSync(summary, "", "utf8");
    appendJobSummary("### sync-validate\n\n- `ep-1` illustrate-pending：待生圖\n", {
      GITHUB_STEP_SUMMARY: summary,
    });
    expect(readFileSync(summary, "utf8")).toContain("illustrate-pending");
  });
});

describe("validateSyncRepo", () => {
  it("目前目錄的同步產物沒有 error", () => {
    const report = validateSyncRepo();
    expect(report.errors, report.errors.map((issue) => issue.message).join("\n")).toEqual(
      [],
    );
  });
});
