import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("沒過關的句子", () => {
  it("只留正向句", () => {
    const src = readFileSync(join(import.meta.dirname, "GameEndStation.tsx"), "utf8");
    expect(src).toMatch(/retry:\s*\["沒關係，再玩就好"\]/);
    expect(src).not.toContain("差一點");
  });
});
