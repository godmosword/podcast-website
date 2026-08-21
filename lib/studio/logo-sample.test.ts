import { describe, expect, it } from "vitest";
import {
  compareSampledPrimary,
  samplePrimaryHex,
} from "./logo-sample";

describe("samplePrimaryHex", () => {
  it("忽略家族底，取最大面積的非底色當主色", async () => {
    const { default: sharp } = await import("sharp");
    const png = await sharp({
      create: {
        width: 32,
        height: 32,
        channels: 3,
        background: { r: 2, g: 53, b: 56 },
      },
    })
      .composite([
        {
          input: await sharp({
            create: {
              width: 18,
              height: 18,
              channels: 3,
              background: { r: 228, g: 64, b: 46 },
            },
          })
            .png()
            .toBuffer(),
          left: 7,
          top: 7,
        },
      ])
      .png()
      .toBuffer();

    const sampled = await samplePrimaryHex(png, "#023538");
    expect(sampled).toMatch(/^#[0-9A-F]{6}$/);
    const r = parseInt(sampled!.slice(1, 3), 16);
    const g = parseInt(sampled!.slice(3, 5), 16);
    const b = parseInt(sampled!.slice(5, 7), 16);
    expect(r).toBeGreaterThan(180);
    expect(g).toBeLessThan(100);
    expect(b).toBeLessThan(90);
  });
});

describe("compareSampledPrimary", () => {
  it("對資料主色算漂色 hueDist，對家族底算實際 silhouette", () => {
    const row = compareSampledPrimary("#E4402E", "#E4402E", "#023538");
    expect(row.hueDist).toBeCloseTo(0, 0);
    expect(row.silhouette).toBeGreaterThan(3);
    expect(row.sampled).toBe("#E4402E");
    expect(row.intended).toBe("#E4402E");
  });
});
