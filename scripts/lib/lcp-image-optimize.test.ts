import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { listLcpJpgTargets } from "./lcp-image-optimize";

describe("listLcpJpgTargets", () => {
  it("含 landing hero、hero-home 與各集 01.jpg", () => {
    const publicDir = join(process.cwd(), "public");
    const targets = listLcpJpgTargets(publicDir);
    expect(targets.some((p) => p.endsWith("hero-home.jpg"))).toBe(true);
    expect(targets.some((p) => p.includes("segment-stories"))).toBe(true);
    expect(targets.some((p) => p.endsWith(`${join("stories", "ep-3", "01.jpg")}`))).toBe(
      true,
    );
  });
});
