import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  assertD3PagesTokenized,
  auditHardcodedColors,
  findHardcodedHex,
  stripCssNoise,
} from "./hardcoded-color-audit";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

describe("hardcoded-color-audit", () => {
  it("stripCssNoise 忽略 var fallback 內 hex", () => {
    const css = ".x { color: var(--accent, #0f766e); }";
    expect(findHardcodedHex(stripCssNoise(css))).toHaveLength(0);
  });

  it("findHardcodedHex 抓出裸 hex", () => {
    const css = ".x { background: #fff9eb; }";
    const hits = findHardcodedHex(css);
    expect(hits).toHaveLength(1);
    expect(hits[0]?.value).toBe("#fff9eb");
  });

  it("D3 驗收頁不得含裸 hex", () => {
    const violations = assertD3PagesTokenized(ROOT);
    expect(violations).toEqual([]);
  });

  it("auditHardcodedColors 回傳結構", () => {
    const report = auditHardcodedColors(ROOT);
    expect(report).toHaveProperty("hits");
    expect(report).toHaveProperty("byFile");
    expect(Array.isArray(report.hits)).toBe(true);
  });
});
