import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  listLcpJpgTargets,
  verifyModernSiblings,
  writeModernSiblings,
} from "./lcp-image-optimize";

describe("listLcpJpgTargets", () => {
  it("含 landing hero、hero-home 與各集全部插圖 JPG", () => {
    const publicDir = join(process.cwd(), "public");
    const targets = listLcpJpgTargets(publicDir);
    expect(targets.some((p) => p.endsWith("hero-home.jpg"))).toBe(true);
    expect(targets.some((p) => p.includes("segment-stories"))).toBe(true);
    expect(targets.some((p) => p.endsWith(`${join("stories", "ep-3", "01.jpg")}`))).toBe(
      true,
    );
    expect(targets.some((p) => p.endsWith(`${join("stories", "ep-3", "02.jpg")}`))).toBe(
      true,
    );
  });
});

describe("verifyModernSiblings / writeModernSiblings", () => {
  it("缺 AVIF／WebP 為 false，寫入後同尺寸通過", async () => {
    const dir = mkdtempSync(join(tmpdir(), "lcp-opt-"));
    const jpg = join(dir, "01.jpg");
    try {
      await sharp({
        create: { width: 8, height: 8, channels: 3, background: "#aabbcc" },
      })
        .jpeg()
        .toFile(jpg);
      expect(await verifyModernSiblings(jpg)).toBe(false);
      await writeModernSiblings(jpg);
      expect(await verifyModernSiblings(jpg)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("ep-27 封面有 AVIF／WebP（播放頁 picture 不會 404）", async () => {
    const jpg = join(process.cwd(), "public", "stories", "ep-27", "01.jpg");
    expect(await verifyModernSiblings(jpg)).toBe(true);
  });
});
