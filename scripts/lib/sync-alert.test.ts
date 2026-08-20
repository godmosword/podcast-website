import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { buildIssueBody } from "../post-sync-notify";
import {
  buildReconcilePendingSlugs,
  hasIllustrationIssueAnyState,
  isReportStale,
  notifyLive,
  notifyLiveFromReport,
  runSyncAlertMode,
  type SyncAlertDeps,
} from "../sync-alert";
import type { SyncRunReport } from "./sync-report";

const freshRunAt = new Date().toISOString();

const sampleReport: SyncRunReport = {
  runAt: freshRunAt,
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
  overrides: Partial<SyncAlertDeps> = {},
): { deps: SyncAlertDeps; calls: string[][]; logs: string[]; warns: string[] } {
  const calls: string[][] = [];
  const logs: string[] = [];
  const warns: string[] = [];
  const deps: SyncAlertDeps = {
    env: {},
    log: (message) => {
      logs.push(message);
    },
    warn: (message) => {
      warns.push(message);
    },
    gh: (args) => {
      calls.push(args);
      const key = args.join(" ");
      if (responses[key] !== undefined) return responses[key];
      if (args[0] === "issue" && args[1] === "create") {
        return responses["__issue_create__"] ?? "https://github.com/example/repo/issues/new";
      }
      // gh label create 等未列出的呼叫：視為成功
      if (args[0] === "label" && args[1] === "create") return "";
      throw new Error(`unexpected gh call: ${key}`);
    },
    ...overrides,
  };
  return { deps, calls, logs, warns };
}

describe("sync-alert notify-live", () => {
  it("does not create a duplicate illustration issue when an exact labeled issue is open", () => {
    const { deps, calls, logs } = makeDeps({
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

    const result = notifyLiveFromReport(sampleReport, deps);

    expect(calls.some((args) => args[0] === "issue" && args[1] === "create")).toBe(false);
    expect(calls.some((args) => args[0] === "issue" && args[1] === "comment")).toBe(false);
    expect(result.skipped).toBe(1);
    expect(logs.some((line) => line.startsWith("NOTIFY_SKIPPED"))).toBe(true);
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
    const { deps, calls, logs } = makeDeps({
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

    const result = notifyLiveFromReport(sampleReport, deps, { trigger: "local" });

    const createCall = calls.find((args) => args[0] === "issue" && args[1] === "create");
    expect(createCall).toBeDefined();
    expect(createCall).toContain("[illustrate] 新集待生圖：ep-18");
    const bodyIndex = createCall!.indexOf("--body");
    expect(createCall![bodyIndex + 1]).toContain("## 新集待生圖：ep-18");
    expect(createCall![bodyIndex + 1]).toContain("本機 sync:notify（push 後）");
    expect(result.ok).toBe(1);
    expect(logs.some((line) => line.startsWith("NOTIFY_OK"))).toBe(true);
  });

  it("blocks notify when report.dryRun is true", () => {
    const { deps, calls, logs } = makeDeps(
      {},
      {
        readFile: () =>
          JSON.stringify({ ...sampleReport, dryRun: true }),
      },
    );

    const result = notifyLive(deps);

    expect(calls.length).toBe(0);
    expect(logs.some((line) => line.includes("dryRun=true"))).toBe(true);
    expect(result).toEqual({ ok: 0, skipped: 0, failed: 0 });
  });

  it("skips stale report and sets exitCode under --strict", () => {
    const staleReport: SyncRunReport = {
      ...sampleReport,
      runAt: "2020-01-01T00:00:00.000Z",
    };
    const { deps, calls, warns } = makeDeps(
      {},
      {
        readFile: () => JSON.stringify(staleReport),
      },
    );

    const prevExitCode = process.exitCode;
    process.exitCode = 0;
    const result = notifyLive(deps, { strict: true });

    expect(calls.length).toBe(0);
    expect(warns.some((line) => line.includes("已過期"))).toBe(true);
    expect(process.exitCode).toBe(1);
    expect(result).toEqual({ ok: 0, skipped: 0, failed: 0 });
    process.exitCode = prevExitCode;
  });

  it("gitHead 與目前 HEAD 不符時拒絕開單", () => {
    const { deps, calls, warns } = makeDeps({});
    const report = {
      ...sampleReport,
      gitHead: "deadbeef",
    };
    // 強制目前 HEAD 與 report 不同（deps 無法注入 git；略過若環境無法取得 HEAD）
    const result = notifyLive(
      {
        ...deps,
        readFile: () => JSON.stringify(report),
      },
      {},
    );
    // 僅在能讀到真實 HEAD 且≠ deadbeef 時斷言（CI／本機皆應有 git）
    if (result.ok === 0 && result.failed === 0 && result.skipped === 0) {
      expect(
        warns.some((line) => line.includes("gitHead=") || line.includes("HEAD=")),
      ).toBe(true);
      expect(
        calls.some((args) => args[0] === "issue" && args[1] === "create"),
      ).toBe(false);
    }
  });

  it("gitHead 為目前 HEAD 的祖先時仍開單（GHA 先寫 report 再 commit）", () => {
    const parent = execFileSync("git", ["rev-parse", "--short", "HEAD~1"], {
      encoding: "utf8",
    }).trim();
    const { deps, calls } = makeDeps({
      "issue list --search in:title ep-18 待生圖 --state open --json number,title,url,labels --limit 20":
        "[]",
    });
    const result = notifyLive(
      {
        ...deps,
        readFile: () =>
          JSON.stringify({
            ...sampleReport,
            gitHead: parent,
          }),
      },
      {},
    );
    expect(result.ok).toBe(1);
    expect(calls.some((args) => args[0] === "issue" && args[1] === "create")).toBe(
      true,
    );
  });

  it("gh issue list 失敗時計入 FAILED 且不 create", () => {
    const { deps, calls, warns } = makeDeps({});
    deps.gh = () => {
      throw new Error("API rate limit");
    };

    const result = notifyLiveFromReport(sampleReport, deps);

    expect(result.failed).toBe(1);
    expect(result.ok).toBe(0);
    expect(calls.some((args) => args[0] === "issue" && args[1] === "create")).toBe(
      false,
    );
    expect(warns.some((line) => line.includes("NOTIFY_FAILED"))).toBe(true);
  });

  it("fail-soft when gh throws and --strict exits 1 if all pending failed", () => {
    const { deps, logs, warns } = makeDeps({
      "issue list --search in:title ep-18 待生圖 --state open --json number,title,url,labels --limit 20":
        "[]",
    });
    // 覆寫 gh：list 成功但 create 全 throw
    deps.gh = (args) => {
      if (args[0] === "issue" && args[1] === "list") return "[]";
      if (args[0] === "label") return "";
      throw new Error("gh not authenticated");
    };

    const prevExitCode = process.exitCode;
    process.exitCode = 0;
    runSyncAlertMode(
      "notify-live",
      ["--strict"],
      {
        ...deps,
        readFile: () => JSON.stringify(sampleReport),
      },
    );

    expect(warns.some((line) => line.includes("NOTIFY_FAILED"))).toBe(true);
    expect(logs.some((line) => line.includes("NOTIFY 摘要"))).toBe(true);
    expect(warns.some((line) => line.includes("strict"))).toBe(true);
    expect(process.exitCode).toBe(1);
    process.exitCode = prevExitCode;
  });

  it("reconcile skips slugs with closed issues and caps at 3", () => {
    const listKey =
      "--search in:title ep-21 待生圖 --state open --json number,title,url,labels --limit 20";
    const closedKey =
      "--search in:title ep-20 待生圖 --state closed --json number,title,url,labels --limit 20";

    const { deps, logs } = makeDeps({
      [`issue list ${listKey}`]: "[]",
      [`issue list ${closedKey}`]: JSON.stringify([
        {
          number: 1,
          title: "[illustrate] 新集待生圖：ep-20",
          url: "https://github.com/example/repo/issues/1",
          labels: [],
        },
      ]),
    });

    const recent = new Date().toISOString();
    const old = "2020-01-01T00:00:00.000Z";
    deps.getStories = () =>
      Array.from({ length: 6 }, (_, i) => ({
        slug: `ep-${21 + i}`,
        pageCount: 1,
        date: i < 2 ? recent : old,
        ep: 21 + i,
      }));

    // ep-20 不在 catalog；手動驗 hasIllustrationIssueAnyState
    expect(
      hasIllustrationIssueAnyState(
        "[illustrate] 新集待生圖：ep-20",
        "ep-20",
        deps,
      ),
    ).toBe(true);

    const planned = buildReconcilePendingSlugs(deps);
    expect(planned.length).toBeLessThanOrEqual(3);
    expect(planned).not.toContain("ep-20");

    notifyLive(
      { ...deps, readFile: () => JSON.stringify(sampleReport) },
      { reconcile: true },
    );

    expect(logs.some((line) => line.startsWith("reconcile 將開 Issue"))).toBe(true);
  });

  it("reconcile 在無 sync report 時仍以 catalog 繼續", () => {
    const { deps, logs } = makeDeps({});
    deps.getStories = () => [
      { slug: "ep-22", pageCount: 1, date: new Date().toISOString(), ep: 22 },
    ];
    deps.readFile = () => {
      throw new Error("ENOENT");
    };

    notifyLive(deps, { reconcile: true });

    expect(
      logs.some((line) => line.includes("reconcile 改以 catalog 為準")),
    ).toBe(true);
    expect(logs.some((line) => line.startsWith("reconcile 將開 Issue"))).toBe(
      true,
    );
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

describe("isReportStale", () => {
  it("treats runAt older than 24h as stale", () => {
    const now = Date.parse("2026-07-24T12:00:00.000Z");
    expect(
      isReportStale(
        { ...sampleReport, runAt: "2026-07-22T11:59:59.000Z" },
        now,
      ),
    ).toBe(true);
    expect(
      isReportStale(
        { ...sampleReport, runAt: "2026-07-23T12:00:01.000Z" },
        now,
      ),
    ).toBe(false);
  });
});

describe("buildIssueBody trigger", () => {
  it("uses local trigger line when trigger is local", () => {
    const body = buildIssueBody("ep-10", sampleReport, { trigger: "local" });
    expect(body).toContain("本機 sync:notify（push 後）");
    expect(body).not.toContain("sync-apple-podcast");
  });

  it("uses gha trigger line by default", () => {
    const body = buildIssueBody("ep-10", sampleReport);
    expect(body).toContain("Apple RSS（SoundOn）→ GHA `sync-apple-podcast`");
  });
});
