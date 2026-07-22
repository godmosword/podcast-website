import { describe, expect, it } from "vitest";
import {
  notifyLiveFromReport,
  runSyncAlertMode,
  type SyncAlertDeps,
} from "../sync-alert";
import type { SyncRunReport } from "./sync-report";

const sampleReport: SyncRunReport = {
  runAt: "2026-07-07T01:48:08.800Z",
  dryRun: false,
  newEpisodes: [{ slug: "ep-18", ep: 18, title: "小紅賽車" }],
  metadataUpdated: [],
  tagBackfill: [],
  vehicleBackfill: [],
  subtitlesCreated: [],
  proofreadAutoFixed: {},
  proofreadPendingLint: {},
  subtitlesMissing: ["ep-18"],
  illustratePending: ["ep-18"],
  browseIndexVehicles: [],
  browseIndexTopics: [],
  emojiSync: [],
  episodeFaqStubs: [],
};

function makeDeps(
  responses: Record<string, string>,
): { deps: SyncAlertDeps; calls: string[][] } {
  const calls: string[][] = [];
  const deps: SyncAlertDeps = {
    env: {},
    log: () => undefined,
    warn: () => undefined,
    gh: (args) => {
      calls.push(args);
      return responses[args.join(" ")] ?? "";
    },
  };
  return { deps, calls };
}

describe("sync-alert notify-live", () => {
  it("does not create a duplicate illustration issue when an exact labeled issue is open", () => {
    const { deps, calls } = makeDeps({
      "issue list --search in:title ep-18 待生圖 --state open --json number,title,url,labels --limit 20":
        JSON.stringify([
          {
            number: 40,
            title: "[illustrate] 新集待生圖：ep-18",
            url: "https://github.com/example/repo/issues/40",
            labels: [{ name: "illustration" }],
          },
        ]),
    });

    notifyLiveFromReport(sampleReport, deps);

    expect(calls.some((args) => args[0] === "issue" && args[1] === "create")).toBe(false);
    expect(calls.some((args) => args[0] === "issue" && args[1] === "comment")).toBe(false);
  });

  it("labels an existing unlabeled illustration issue instead of creating a duplicate", () => {
    const { deps, calls } = makeDeps({
      "issue list --search in:title ep-18 待生圖 --state open --json number,title,url,labels --limit 20":
        JSON.stringify([
          {
            number: 41,
            title: "[illustrate] 新集待生圖：ep-18",
            url: "https://github.com/example/repo/issues/41",
            labels: [],
          },
        ]),
    });

    notifyLiveFromReport(sampleReport, deps);

    expect(calls).toContainEqual([
      "issue",
      "edit",
      "41",
      "--add-label",
      "illustration",
    ]);
    expect(calls.some((args) => args[0] === "issue" && args[1] === "create")).toBe(false);
  });

  it("creates an illustration issue when no exact title match is open", () => {
    const { deps, calls } = makeDeps({
      "issue list --search in:title ep-18 待生圖 --state open --json number,title,url,labels --limit 20":
        JSON.stringify([
          {
            number: 99,
            title: "[illustrate] 新集待生圖：ep-99",
            url: "https://github.com/example/repo/issues/99",
            labels: [{ name: "illustration" }],
          },
        ]),
    });

    notifyLiveFromReport(sampleReport, deps);

    expect(calls).toContainEqual([
      "issue",
      "create",
      "--title",
      "[illustrate] 新集待生圖：ep-18",
      "--body",
      expect.stringContaining("## 新集待生圖：ep-18"),
      "--label",
      "illustration",
    ]);
  });

  it("opens a deduplicated failure issue while preserving Actions logs as source of truth", () => {
    const { deps, calls } = makeDeps({});

    runSyncAlertMode("failure", ["--kind=sync-job-failure"], deps);

    expect(calls).toContainEqual([
      "issue",
      "create",
      "--title",
      "[sync] Apple Podcast workflow 失敗",
      "--body",
      expect.stringContaining("Apple sync workflow 失敗"),
      "--label",
      "sync-alert",
      "--label",
      "sync-job-failure",
    ]);
  });
});
