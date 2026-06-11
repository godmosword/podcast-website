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
});
