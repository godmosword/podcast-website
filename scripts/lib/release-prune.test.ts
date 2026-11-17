import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { applyPrune, OFFICIAL_PRUNE_KEEP_FILES, pathsToPrune, unreferencedFiles } from "./release-prune";

describe("release prune", () => {
  it("刪節目數據頁與未核准素材，留下審核頁與 prebuild 腳本", () => {
    const root = mkdtempSync(join(tmpdir(), "official-prune-"));
    mkdirSync(join(root, "app/studio/feedback"), { recursive: true });
    mkdirSync(join(root, "scripts"), { recursive: true });
    mkdirSync(join(root, "public/stories/ep-1"), { recursive: true });
    mkdirSync(join(root, "public/stories/ep-99"), { recursive: true });
    writeFileSync(join(root, "app/studio/page.tsx"), "studio");
    writeFileSync(join(root, "app/studio/feedback/page.tsx"), "feedback");
    writeFileSync(join(root, "app/studio/error.tsx"), "error");
    writeFileSync(join(root, "scripts/illustrate.ts"), "illustrate");
    writeFileSync(join(root, "scripts/generate-llms-full.ts"), "llms");
    mkdirSync(join(root, ".cursor"), { recursive: true });
    writeFileSync(join(root, ".cursor/rules.md"), "agent");
    writeFileSync(join(root, "AGENTS.md"), "agent");
    writeFileSync(join(root, "public/stories/ep-1/a.txt"), "keep");
    writeFileSync(join(root, "public/stories/ep-99/a.txt"), "drop");

    const paths = pathsToPrune(root, ["ep-1"]);
    expect(paths).toContain("app/studio/page.tsx");
    expect(paths).toContain("scripts/illustrate.ts");
    expect(paths).toContain("public/stories/ep-99");
    expect(paths).toContain(".cursor");
    expect(paths).toContain("AGENTS.md");
    expect(paths).not.toContain("app/studio/feedback/page.tsx");
    expect(paths).not.toContain("scripts/generate-llms-full.ts");
    for (const kept of OFFICIAL_PRUNE_KEEP_FILES) {
      expect(paths).not.toContain(kept);
    }

    applyPrune(root, paths);
    expect(existsSync(join(root, "app/studio/page.tsx"))).toBe(false);
    expect(existsSync(join(root, "public/stories/ep-99"))).toBe(false);
    expect(existsSync(join(root, "public/stories/ep-1/a.txt"))).toBe(true);
    expect(existsSync(join(root, "app/studio/feedback/page.tsx"))).toBe(true);
    expect(existsSync(join(root, "scripts/generate-llms-full.ts"))).toBe(true);
    expect(existsSync(join(root, ".cursor"))).toBe(false);
    expect(existsSync(join(root, "AGENTS.md"))).toBe(false);
  });

  it("未核准文章的圖片會刪，核准文章的封面留下", () => {
    const root = mkdtempSync(join(tmpdir(), "official-article-assets-"));
    mkdirSync(join(root, "public/parent-articles"), { recursive: true });
    writeFileSync(join(root, "public/parent-articles/keep.webp"), "keep");
    writeFileSync(join(root, "public/parent-articles/drop.webp"), "drop");
    const extra = unreferencedFiles(
      root,
      "public/parent-articles",
      new Set(["public/parent-articles/keep.webp"]),
    );
    expect(extra).toEqual(["public/parent-articles/drop.webp"]);
  });
});
