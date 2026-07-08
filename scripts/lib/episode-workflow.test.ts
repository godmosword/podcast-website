import { describe, expect, it } from "vitest";
import { getStory } from "../../data/content";
import type { Story } from "../../data/content";
import {
  LEGACY_PLACEHOLDER_SLUGS,
  REFERENCE_ILLUSTRATED_SLUGS,
  buildWorkflowJsonReport,
  verifyIllustratedEpisode,
  verifyStoryWorkflow,
  type WorkflowProbes,
} from "./episode-workflow";

function mockStory(overrides: Partial<Story>): Story {
  const base = getStory("ep-9");
  if (!base) throw new Error("範本 ep-9 不在目錄中");
  return { ...base, ...overrides };
}

function mockProbes(overrides: Partial<WorkflowProbes>): WorkflowProbes {
  return {
    hasSubtitles: () => true,
    hasScenes: () => false,
    imageCount: () => 1,
    sceneCount: () => 0,
    hasProofreadMarker: () => true,
    ...overrides,
  };
}

describe("REFERENCE_ILLUSTRATED_SLUGS", () => {
  it("範本為 ep-9 與 ep-10", () => {
    expect(REFERENCE_ILLUSTRATED_SLUGS).toEqual(["ep-9", "ep-10"]);
  });
});

describe("ep-9 / ep-10 黃金範本", () => {
  for (const slug of REFERENCE_ILLUSTRATED_SLUGS) {
    it(`${slug} 符合全幕插圖標準`, () => {
      const story = getStory(slug);
      expect(story).toBeDefined();
      const errors = verifyIllustratedEpisode(story!).filter(
        (i) => i.level === "error",
      );
      expect(errors).toEqual([]);
    });
  }
});

describe("ep-1 已升級為全幕標準", () => {
  it("ep-1 通過 illustrated 驗證", () => {
    const story = getStory("ep-1");
    expect(story?.pageCount).toBeGreaterThan(1);
    const errors = verifyIllustratedEpisode(story!).filter(
      (i) => i.level === "error",
    );
    expect(errors).toEqual([]);
  });
});

describe("MVP 集（pageCount=1）不靜默通過", () => {
  it("無 scenes → warn illustrate-pending", () => {
    const story = mockStory({ slug: "ep-x", pageCount: 1 });
    const issues = verifyStoryWorkflow(story, mockProbes({}));
    expect(issues.some((i) => i.code === "illustrate-pending")).toBe(true);
    expect(issues.filter((i) => i.level === "error")).toEqual([]);
  });

  it("已切場景但未 approve → warn illustrate-incomplete", () => {
    const story = mockStory({ slug: "ep-x", pageCount: 1 });
    const issues = verifyStoryWorkflow(
      story,
      mockProbes({ hasScenes: () => true, sceneCount: () => 15 }),
    );
    expect(issues.some((i) => i.code === "illustrate-incomplete")).toBe(true);
    expect(issues.some((i) => i.code === "illustrate-pending")).toBe(false);
    expect(issues.filter((i) => i.level === "error")).toEqual([]);
  });

  it("缺封面 → error mvp-missing-cover", () => {
    const story = mockStory({ slug: "ep-x", pageCount: 1 });
    const issues = verifyStoryWorkflow(
      story,
      mockProbes({ imageCount: () => 0 }),
    );
    expect(issues.some((i) => i.code === "mvp-missing-cover")).toBe(true);
  });
});

describe("legacy allowlist 與多頁缺 scenes", () => {
  it("allowlist 內（ep-2..6）→ warn legacy-placeholder", () => {
    for (const slug of LEGACY_PLACEHOLDER_SLUGS) {
      const story = mockStory({ slug, pageCount: 6 });
      const issues = verifyStoryWorkflow(story, mockProbes({}));
      expect(issues).toEqual([
        expect.objectContaining({ code: "legacy-placeholder", level: "warn" }),
      ]);
    }
  });

  it("allowlist 外多頁缺 scenes → error missing-scenes", () => {
    const story = mockStory({ slug: "ep-x", pageCount: 6 });
    const issues = verifyStoryWorkflow(story, mockProbes({}));
    expect(
      issues.some((i) => i.code === "missing-scenes" && i.level === "error"),
    ).toBe(true);
  });
});

describe("全幕標準檢查（mock probes）", () => {
  it("scenes 幕數 ≠ pageCount → error scene-count", () => {
    const story = mockStory({ slug: "ep-x", pageCount: 20 });
    const issues = verifyIllustratedEpisode(
      story,
      mockProbes({
        hasScenes: () => true,
        sceneCount: () => 21,
        imageCount: () => 20,
      }),
    );
    expect(issues.some((i) => i.code === "scene-count")).toBe(true);
  });

  it("插圖張數 ≠ pageCount → error image-count", () => {
    const story = mockStory({ slug: "ep-x", pageCount: 20 });
    const issues = verifyIllustratedEpisode(
      story,
      mockProbes({
        hasScenes: () => true,
        sceneCount: () => 20,
        imageCount: () => 19,
      }),
    );
    expect(issues.some((i) => i.code === "image-count")).toBe(true);
  });
});

describe("真實 repo 狀態（僅黃金範本與 legacy 對照）", () => {
  it("ep-6 已升級全幕插圖（20 頁，無 error）", () => {
    const story = getStory("ep-6");
    expect(story?.pageCount).toBe(20);
    const issues = verifyStoryWorkflow(story!);
    expect(issues.filter((i) => i.level === "error")).toEqual([]);
  });
});

describe("JSON workflow report", () => {
  it("輸出 evaluator 可讀的聚合狀態、checks、normalized issue codes", () => {
    const story = mockStory({
      slug: "ep-json",
      pageCount: 3,
      captions: ["第一幕"],
      captionTimes: [0, 12, 24],
    });
    const probes = mockProbes({
      hasScenes: () => true,
      sceneCount: () => 2,
      imageCount: () => 1,
      hasProofreadMarker: () => false,
    });
    const issues = verifyStoryWorkflow(story, probes);

    const report = buildWorkflowJsonReport([story], issues, {
      probes,
      timestamp: "2026-07-08T21:00:00.000Z",
    });

    expect(report).toMatchObject({
      slug: "all",
      timestamp: "2026-07-08T21:00:00.000Z",
      strict: false,
      passed: false,
      strict_passed: false,
      summary: "有 3 個 error，0 個 warning",
      checks: {
        total_episodes: 1,
        total_errors: 3,
        total_warnings: 0,
        reference_standard: {
          slugs: ["ep-9", "ep-10"],
          passed: true,
        },
      },
      episodes: [
        {
          slug: "ep-json",
          passed: false,
          strict_passed: false,
          checks: {
            subtitle_exists: true,
            subtitle_marked: false,
            scenes_exists: true,
            scenes_count: 2,
            illustrations_count: 1,
            pagecount_alignment: {
              expected: 3,
              actual: 1,
              matched: false,
            },
            scenes_alignment: {
              expected: 3,
              actual: 2,
              matched: false,
            },
            captions_alignment: false,
            caption_times_alignment: true,
            matches_reference_standard: false,
          },
        },
      ],
    });
    expect(report.errors.map((i) => i.code)).toEqual([
      "SCENE_COUNT",
      "IMAGE_COUNT",
      "CAPTIONS",
    ]);
    expect(report.errors[0].details).toMatchObject({
      slug: "ep-json",
      expected: 3,
      actual: 2,
    });
    expect(report.recommendations).toContain(
      "補齊 public/stories/ep-json/ 的 illustration",
    );
  });

  it("strict mode 會讓 warning-only episode 的 strict_passed 為 false", () => {
    const story = mockStory({ slug: "ep-2", pageCount: 6 });
    const probes = mockProbes({ hasScenes: () => false });
    const issues = verifyStoryWorkflow(story, probes);

    const report = buildWorkflowJsonReport([story], issues, {
      probes,
      strict: true,
      timestamp: "2026-07-08T21:00:00.000Z",
    });

    expect(report).toMatchObject({
      strict: true,
      passed: true,
      strict_passed: false,
      summary: "有 0 個 error，1 個 warning",
      warnings: [
        {
          code: "LEGACY_PLACEHOLDER",
          message: "舊式 6 頁 placeholder，需依 ep-9／ep-10 workflow 重做 illustrate",
        },
      ],
      episodes: [
        {
          slug: "ep-2",
          passed: true,
          strict_passed: false,
        },
      ],
    });
    expect(report.recommendations).toContain(
      "執行 npm run illustrate -- ep-2 --segment-only",
    );
  });
});
