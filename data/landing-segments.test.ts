import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LANDING_SEGMENTS } from "./landing-segments";
import { resolveLandingSegments } from "@/lib/landing-query";

describe("landing-segments", () => {
  it("定義四段 segment", () => {
    expect(LANDING_SEGMENTS).toHaveLength(4);
    expect(LANDING_SEGMENTS.map((s) => s.id)).toEqual([
      "stories",
      "bedtime",
      "clay",
      "health",
    ]);
  });

  it("resolve 後每段至少有項目", () => {
    const resolved = resolveLandingSegments();
    expect(resolved).toHaveLength(4);
    for (const seg of resolved) {
      expect(seg.items.length).toBeGreaterThan(0);
    }
  });

  it("stories segment 最多 8 則", () => {
    const stories = resolveLandingSegments().find((s) => s.id === "stories")!;
    expect(stories.items.length).toBeLessThanOrEqual(8);
    expect(stories.items.every((i) => i.kind === "story")).toBe(true);
  });

  it("每段 anchorId 唯一", () => {
    const anchors = LANDING_SEGMENTS.map((s) => s.anchorId);
    expect(new Set(anchors).size).toBe(anchors.length);
  });

  it("每段 heroImage 指向 /landing 且橫版實檔存在", () => {
    for (const seg of LANDING_SEGMENTS) {
      expect(seg.heroImage).toBe(`/landing/segment-${seg.id}.jpg`);
      const fsPath = join(process.cwd(), "public", seg.heroImage);
      expect(existsSync(fsPath), `缺圖：${seg.heroImage}`).toBe(true);

      expect(seg.heroImagePortrait).toBe(
        `/landing/segment-${seg.id}-portrait.jpg`,
      );
      const portraitPath = join(process.cwd(), "public", seg.heroImagePortrait);
      expect(existsSync(portraitPath), `缺直版 placeholder：${seg.heroImagePortrait}`).toBe(
        true,
      );
    }
  });

  it("每段 heroImagePortrait 指向 /landing 直版路徑", () => {
    for (const seg of LANDING_SEGMENTS) {
      expect(seg.heroImagePortrait).toBe(
        `/landing/segment-${seg.id}-portrait.jpg`,
      );
    }
  });

  it("外連 CTA 標記 external（供 rel/target 使用）", () => {
    for (const seg of LANDING_SEGMENTS) {
      const isHttp = /^https?:/i.test(seg.cta.href);
      if (isHttp) expect(seg.cta.external).toBe(true);
      else expect(seg.cta.external ?? false).toBe(false);
    }
  });
});
