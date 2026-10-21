import { describe, expect, it } from "vitest";
import {
  ALERT_AFTER_CONSECUTIVE,
  categoryLabel,
  classifySyncFailure,
  emptyStreak,
  extractErrorExcerpt,
  parseStreak,
  recordFailure,
  shouldOpenAlert,
  stepLabel,
} from "./sync-alert-policy";

describe("sync alert policy", () => {
  it("連續兩次同一分類才通知，換分類就重算", () => {
    const first = recordFailure(emptyStreak(), "validate");
    expect(first.count).toBe(1);
    expect(shouldOpenAlert(first.count)).toBe(false);

    const second = recordFailure(first.next, "validate");
    expect(second.count).toBe(ALERT_AFTER_CONSECUTIVE);
    expect(shouldOpenAlert(second.count)).toBe(true);

    const switched = recordFailure(second.next, "install");
    expect(switched.count).toBe(1);
    expect(switched.next.lastCategory).toBe("install");
  });

  it("壞掉的 streak 檔當成沒有紀錄", () => {
    expect(parseStreak("")).toEqual(emptyStreak());
    expect(parseStreak("{")).toEqual(emptyStreak());
    expect(parseStreak('{"lastCategory":"nope","consecutive":4}')).toEqual(
      emptyStreak(),
    );
  });

  it("依 log 與步驟判斷根因", () => {
    expect(
      classifySyncFailure({
        steps: ["Install dependencies"],
        context: "npm ci 失敗",
      }).category,
    ).toBe("install");
    expect(
      classifySyncFailure({
        steps: ["Commit and push"],
        context: "CI job 失敗：quality（conclusion=failure）",
      }).category,
    ).toBe("validate");
    expect(
      classifySyncFailure({
        steps: ["Commit and push"],
        context: "protect-main-web GH013",
      }).category,
    ).toBe("commit");
    expect(
      classifySyncFailure({
        context: "workflow file issue",
      }).category,
    ).toBe("workflow");
    expect(
      classifySyncFailure({
        steps: ["Sync episodes from Apple Podcast"],
        logExcerpt: "##[error]RSS fetch failed: 503",
      }).category,
    ).toBe("rss");
  });

  it("label 帶分類與步驟，並抽出 ##[error]", () => {
    expect(categoryLabel("validate")).toBe("sync-cat-validate");
    expect(stepLabel("Commit and push")).toBe("sync-step-commit-and-push");
    expect(stepLabel("中文步驟")).toBe("sync-step-unknown");
    const excerpt = extractErrorExcerpt(
      "noise\n2026-01-01T00:00:00Z ##[error]schema：slug 重複\n::error::npm ci failed\n",
    );
    expect(excerpt).toContain("##[error]schema：slug 重複");
    expect(excerpt).toContain("##[error]npm ci failed");
    expect(excerpt).not.toContain("noise");
  });
});
