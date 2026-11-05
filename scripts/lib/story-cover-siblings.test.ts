import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";
import { ensureStoryCoverSiblings } from "./lcp-image-optimize";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("ensureStoryCoverSiblings", () => {
  it("缺 WebP／AVIF 的封面補上；已齊的不重寫；沒有 01.jpg 的集略過", async () => {
    const root = mkdtempSync(join(tmpdir(), "covers-"));
    roots.push(root);
    const dir = join(root, "stories", "ep-1");
    mkdirSync(dir, { recursive: true });
    mkdirSync(join(root, "stories", "ep-2"), { recursive: true });
    await sharp({ create: { width: 8, height: 8, channels: 3, background: "#f80" } })
      .jpeg()
      .toFile(join(dir, "01.jpg"));

    expect(await ensureStoryCoverSiblings(root)).toEqual(["ep-1"]);
    expect(existsSync(join(dir, "01.avif"))).toBe(true);
    expect(existsSync(join(dir, "01.webp"))).toBe(true);

    const written = statSync(join(dir, "01.avif")).mtimeMs;
    expect(await ensureStoryCoverSiblings(root)).toEqual([]);
    expect(statSync(join(dir, "01.avif")).mtimeMs).toBe(written);
  });
});
