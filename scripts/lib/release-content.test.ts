import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getStory } from "../../data/content";
import { classifyReleaseIssues } from "./release-content";

describe("classifyReleaseIssues", () => {
  it("接受 pageCount=1 的 illustrate-pending，但不接受未校對字幕", () => {
    const story = getStory("ep-26");
    if (!story) throw new Error("ep-26 不在目錄中");

    const result = classifyReleaseIssues([story], [
      {
        slug: story.slug,
        level: "warn",
        code: "illustrate-pending",
        message: "待生圖",
      },
      {
        slug: story.slug,
        level: "warn",
        code: "subtitle-unproofread",
        message: "待校對",
      },
    ]);

    expect(result.acceptedWarnings).toHaveLength(1);
    expect(result.acceptedWarnings[0]?.code).toBe("illustrate-pending");
    expect(result.blockers).toHaveLength(1);
    expect(result.blockers[0]?.code).toBe("subtitle-unproofread");
  });

  it("所有 error 與未知 warning 都是 release blocker", () => {
    const story = getStory("ep-26");
    if (!story) throw new Error("ep-26 不在目錄中");

    const result = classifyReleaseIssues([story], [
      { slug: story.slug, level: "error", code: "missing-cover", message: "缺圖" },
      { slug: story.slug, level: "warn", code: "legacy-placeholder", message: "舊集" },
    ]);

    expect(result.blockers.map((issue) => issue.code)).toEqual([
      "missing-cover",
      "legacy-placeholder",
    ]);
    expect(result.acceptedWarnings).toEqual([]);
  });

  it("PRODUCTION-RELEASE-GATE 維持 subtitle-unproofread 通用模板（不點名 live slug）", () => {
    const gate = readFileSync(
      join(process.cwd(), "docs/PRODUCTION-RELEASE-GATE.md"),
      "utf8",
    );
    const episodeRow =
      gate.match(/\| Episode content \|[^|\n]+\|/)?.[0] ?? "";
    const verifyNote =
      gate.match(/npm run verify:release-content\s+#[^\n]+/)?.[0] ?? "";
    const closing = gate.match(/目前[^\n]*subtitle-unproofread[^\n]+/)?.[0] ?? "";

    expect(episodeRow, "找不到 Episode content 列").not.toBe("");
    expect(verifyNote, "找不到 verify:release-content 註解").not.toBe("");
    expect(closing, "找不到 subtitle-unproofread 收尾句").not.toBe("");

    expect(episodeRow, "Episode content 列須含 subtitle-unproofread").toContain(
      "subtitle-unproofread",
    );
    expect(
      episodeRow,
      "Episode content 列須含 proofread:subtitles -- <slug> --mark 模板",
    ).toContain("proofread:subtitles -- <slug> --mark");
    expect(
      episodeRow,
      "Episode content 列須含 verify:release-content",
    ).toContain("verify:release-content");
    expect(verifyNote, "verify 註解須含 verify:release-content").toContain(
      "verify:release-content",
    );
    expect(closing, "收尾句須含 subtitle-unproofread").toContain(
      "subtitle-unproofread",
    );
  });
});
