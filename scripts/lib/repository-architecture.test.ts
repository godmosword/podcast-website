import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function source(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

function walk(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    return entry.isDirectory() ? walk(child) : [child];
  });
}

describe("repository architecture", () => {
  it("does not keep retired product feature symbols", () => {
    const files = [
      "app/layout.tsx",
      "app/story/[slug]/page.tsx",
      "app/story/[slug]/play/page.tsx",
      "components/StoryPlayer.tsx",
      "components/ThemeProvider.tsx",
      "components/ThemeModeSwitch.tsx",
      "components/story-filtering.ts",
      "components/games/GameResultActions.tsx",
      "components/home/HomeSectionRenderer.tsx",
      "data/content.ts",
      "data/home-sections.ts",
    ];
    const combined = files.filter(existsSync).map(source).join("\n");

    for (const retired of [
      "FEATURES.",
      "goodnightButton",
      "CraftStep",
      "Printable",
      "getAllContent",
      "filterStoriesForVehicle",
      "toggleTheme",
      "subscribeBand",
    ]) {
      expect(combined).not.toContain(retired);
    }
  });

  it("does not keep retired placeholder modules", () => {
    for (const path of [
      "components/ContinueBanner.tsx",
      "components/ContinueBanner.module.css",
      "components/StarterEpisodes.tsx",
      "components/StarterEpisodes.module.css",
      "data/starter-episodes.ts",
      "data/starter-episodes.test.ts",
      "components/studio/MetricsOverview.tsx",
      "components/studio/MetricsOverview.module.css",
      "data/studio-metrics.json",
      "lib/studio/metrics.ts",
      "lib/studio/types.ts",
      "lib/games/catalog.ts",
    ]) {
      expect(existsSync(join(ROOT, path)), path).toBe(false);
    }
  });

  it("uses one explicit Game Kit module tree", () => {
    expect(existsSync(join(ROOT, "lib/game-kit"))).toBe(false);
    expect(existsSync(join(ROOT, "lib/gamekit/index.ts"))).toBe(false);

    const sources = ["app", "components", "hooks", "lib", "data", "scripts"]
      .flatMap((dir) => walk(join(ROOT, dir)))
      .filter((path) => /\.(ts|tsx)$/.test(path))
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");

    expect(sources).not.toMatch(/@\/lib\/game-kit(?:["'/])/);
    expect(sources).not.toMatch(/from\s+["']@\/lib\/gamekit["']/);
  });
});
