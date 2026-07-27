import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const source = (relativePath: string) =>
  readFileSync(join(ROOT, relativePath), "utf8");

describe("snowboard delivery contract", () => {
  it("ships the versioned export and removes the unversioned entry", () => {
    expect(existsSync(join(ROOT, "public/snowboard/v2/index.html"))).toBe(true);
    expect(existsSync(join(ROOT, "public/snowboard/index.html"))).toBe(false);
    expect(source("snowboard-game/export_presets.cfg")).toContain(
      "export_path=\"../public/snowboard/v2/index.html\"",
    );
  });

  it("patches visual args into the generated runtime", () => {
    const html = source("public/snowboard/v2/index.html");
    expect(html).toContain("snowboard-runtime-options");
    expect(html).toContain("visualStage");
    expect(html).toContain("visualPose");
  });

  it("keeps the service worker and HTTP cache split explicit", () => {
    const sw = source("public/sw.js");
    const next = source("next.config.ts");
    expect(sw).toContain('const SNOWBOARD_PREFIX = "/snowboard/v2/"');
    expect(sw).toContain('const CACHE_NAME = "chechecar-v4"');
    expect(next).toContain('source: "/snowboard/v2/index.html"');
    expect(next).toContain("max-age=31536000, immutable");
  });
});
