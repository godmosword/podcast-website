import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function walk(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    return entry.isDirectory() ? walk(child) : [child];
  });
}

function sourceFiles(): string[] {
  return ["app", "components", "hooks", "lib", "data", "scripts"]
    .flatMap((dir) => walk(join(ROOT, dir)))
    .filter((path) => /\.(ts|tsx)$/.test(path))
    .filter((path) => !path.endsWith("scripts/lib/repository-architecture.test.ts"));
}

describe("repository architecture", () => {
  it("does not keep retired product feature symbols", () => {
    const combined = sourceFiles().map((path) => readFileSync(path, "utf8")).join("\n");

    for (const retired of [
      "FEATURES.",
      "goodnightButton",
      "CraftStep",
      "Printable",
      "getAllContent",
      "type Content =",
      "interface Content",
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

    const gamekitRootEntries = readdirSync(join(ROOT, "lib/gamekit"), {
      withFileTypes: true,
    });
    const rootGamekitFiles = gamekitRootEntries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort();
    const allowedRootFiles = new Set(["adapter.ts", "types.ts"]);
    expect(rootGamekitFiles.every((file) => allowedRootFiles.has(file))).toBe(true);
    expect(rootGamekitFiles).toContain("types.ts");

    const rootGamekitDirs = gamekitRootEntries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(rootGamekitDirs).toEqual(["games", "host", "progress", "react", "runtime"]);

    const sources = sourceFiles().map((path) => readFileSync(path, "utf8")).join("\n");

    expect(sources).not.toMatch(/@\/lib\/game-kit(?:["'/])/);
    expect(sources).not.toMatch(/from\s+["']@\/lib\/gamekit["']/);

    const gamekitSources = walk(join(ROOT, "lib/gamekit"))
      .filter((path) => /\.(ts|tsx)$/.test(path))
      .filter((path) => !path.endsWith(".test.ts"))
      .map((path) => [relative(ROOT, path), readFileSync(path, "utf8")] as const);
    for (const [path, text] of gamekitSources) {
      expect(text, path).not.toMatch(/export\s+\*\s+from/);
    }
  });
});
