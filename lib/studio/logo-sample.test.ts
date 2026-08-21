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

/** 造一張：家族底 + 內部一塊帶線性漸層的主色區。 */
async function gradientFixture(opts: {
  bg: readonly [number, number, number];
  from: readonly [number, number, number];
  to: readonly [number, number, number];
  size: number;
  inset: number;
}): Promise<{ png: Buffer; mean: readonly [number, number, number] }> {
  const { default: sharp } = await import("sharp");
  const { bg, from, to, size, inset } = opts;
  const raw = Buffer.alloc(size * size * 3);
  let n = 0;
  const sum = [0, 0, 0];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 3;
      const inside =
        x >= inset && x < size - inset && y >= inset && y < size - inset;
      if (!inside) {
        raw[i] = bg[0];
        raw[i + 1] = bg[1];
        raw[i + 2] = bg[2];
        continue;
      }
      const t = (x - inset) / (size - 2 * inset - 1);
      for (let c = 0; c < 3; c += 1) {
        const v = Math.round(from[c] + (to[c] - from[c]) * t);
        raw[i + c] = v;
        sum[c] += v;
      }
      n += 1;
    }
  }
  const png = await sharp(raw, { raw: { width: size, height: size, channels: 3 } })
    .png()
    .toBuffer();
  return { png, mean: [sum[0] / n, sum[1] / n, sum[2] / n] as const };
}

describe("samplePrimaryHex 漸層主色區", () => {
  it("回傳主色區真實均值，而不是某一段量化切片", async () => {
    const { png, mean } = await gradientFixture({
      bg: [2, 53, 56],
      from: [200, 40, 20],
      to: [240, 60, 36],
      size: 96,
      inset: 16,
    });

    const sampled = await samplePrimaryHex(png, "#023538");
    expect(sampled).not.toBeNull();
    const got = [
      parseInt(sampled!.slice(1, 3), 16),
      parseInt(sampled!.slice(3, 5), 16),
      parseInt(sampled!.slice(5, 7), 16),
    ];
    // 漸層均值應落在 from/to 中點附近；容許 ±4 階
    for (let c = 0; c < 3; c += 1) {
      expect(
        Math.abs(got[c] - mean[c]),
        `通道 ${c} 取樣 ${got[c]} 偏離均值 ${mean[c].toFixed(1)}`,
      ).toBeLessThanOrEqual(4);
    }
  });

  it("不把分離的次色區混進主色均值", async () => {
    const { default: sharp } = await import("sharp");
    const base = await gradientFixture({
      bg: [2, 53, 56],
      from: [200, 40, 20],
      to: [240, 60, 36],
      size: 96,
      inset: 16,
    });
    // 疊一塊明顯分離的淺藍次色（面積小於主色區）
    const png = await sharp(base.png)
      .composite([
        {
          input: await sharp({
            create: {
              width: 24,
              height: 18,
              channels: 3,
              background: { r: 197, g: 216, b: 240 },
            },
          })
            .png()
            .toBuffer(),
          left: 36,
          top: 30,
        },
      ])
      .png()
      .toBuffer();

    const sampled = await samplePrimaryHex(png, "#023538");
    const g = parseInt(sampled!.slice(3, 5), 16);
    const b = parseInt(sampled!.slice(5, 7), 16);
    // 若把淺藍混入，g/b 會被大幅拉高
    expect(g).toBeLessThan(90);
    expect(b).toBeLessThan(80);
  });
});
