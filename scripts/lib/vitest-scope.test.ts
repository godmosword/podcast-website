import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/** 防止 GHA whisper 快取內 *.spec.js 再次被 vitest 掃到、卡住 sync deploy。 */
describe("vitest scope", () => {
  it("僅 include 專案 *.test.ts(x)，排除 whisper .cache 的 *.spec.js", () => {
    const config = readFileSync(
      resolve(__dirname, "../../vitest.config.ts"),
      "utf8",
    );
    expect(config).toMatch(/include:\s*\[/);
    expect(config).toContain("**/*.test.ts");
    expect(config).toContain("**/.cache/**");
  });

  // Wave B 曾把 RTL peer 當 knip 死依賴刪掉。.npmrc 設 legacy-peer-deps=true，
  // npm ci 不會裝 @testing-library/react 的 peer；GHA sync 一跑 npm test
  // 就 18 套件 Cannot find module '@testing-library/dom'（#82）。
  it("將 @testing-library/dom 列為直接 devDependency（RTL peer，npm ci 必裝）", () => {
    const pkg = JSON.parse(
      readFileSync(resolve(__dirname, "../../package.json"), "utf8"),
    ) as { devDependencies?: Record<string, string> };
    const knip = JSON.parse(
      readFileSync(resolve(__dirname, "../../knip.json"), "utf8"),
    ) as { ignoreDependencies?: string[] };
    expect(pkg.devDependencies?.["@testing-library/dom"]).toMatch(/^\^10\./);
    expect(knip.ignoreDependencies).toContain("@testing-library/dom");
  });
});
