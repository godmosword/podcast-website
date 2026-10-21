import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";
import { ensureStoryCoverBlurs, STORY_IMAGE_BLURS_PATH } from "./story-cover-blur";

const tmpDirs: string[] = [];

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

async function fixtureRoot(): Promise<{
  root: string;
  manifestPath: string;
  coverPath: string;
}> {
  const root = mkdtempSync(join(tmpdir(), "story-blur-"));
  tmpDirs.push(root);
  const coverPath = join(root, "public/stories/ep-35/01.jpg");
  mkdirSync(join(root, "public/stories/ep-35"), { recursive: true });
  mkdirSync(join(root, "data"), { recursive: true });
  const jpeg = await sharp({
    create: {
      width: 24,
      height: 24,
      channels: 3,
      background: { r: 220, g: 60, b: 40 },
    },
  })
    .jpeg()
    .toBuffer();
  writeFileSync(coverPath, jpeg);
  return {
    root,
    manifestPath: join(root, STORY_IMAGE_BLURS_PATH),
    coverPath,
  };
}

describe("ensureStoryCoverBlurs", () => {
  it("缺封面不寫入 manifest", async () => {
    const { root, manifestPath } = await fixtureRoot();
    const result = await ensureStoryCoverBlurs({
      root,
      stories: [{ slug: "ep-36" }],
    });
    expect(result.missingFiles).toEqual(["/stories/ep-36/01.jpg"]);
    expect(result.added).toEqual([]);
    expect(() => readFileSync(manifestPath, "utf8")).toThrow();
  });

  it("有缺檔時不寫入已算好的其他封面", async () => {
    const { root, manifestPath } = await fixtureRoot();
    const result = await ensureStoryCoverBlurs({
      root,
      stories: [{ slug: "ep-35" }, { slug: "ep-36" }],
    });
    expect(result.added).toEqual(["/stories/ep-35/01.jpg"]);
    expect(result.missingFiles).toEqual(["/stories/ep-36/01.jpg"]);
    expect(() => readFileSync(manifestPath, "utf8")).toThrow();
  });

  it("補上缺的封面 blur，並保留既有項目", async () => {
    const { root, manifestPath } = await fixtureRoot();
    const existing = {
      "/stories/ep-1/01.jpg": "data:image/jpeg;base64,already",
    };
    writeFileSync(manifestPath, `${JSON.stringify(existing, null, 2)}\n`);

    const result = await ensureStoryCoverBlurs({
      root,
      stories: [{ slug: "ep-1" }, { slug: "ep-35" }],
    });

    expect(result.missingFiles).toEqual([]);
    expect(result.added).toEqual(["/stories/ep-35/01.jpg"]);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<
      string,
      string
    >;
    expect(manifest["/stories/ep-1/01.jpg"]).toBe(
      "data:image/jpeg;base64,already",
    );
    expect(manifest["/stories/ep-35/01.jpg"]).toMatch(
      /^data:image\/jpeg;base64,/,
    );
  });

  it("都已有 blur 時不重寫檔案", async () => {
    const { root, manifestPath } = await fixtureRoot();
    const existing = {
      "/stories/ep-35/01.jpg": "data:image/jpeg;base64,keep",
    };
    const raw = `${JSON.stringify(existing, null, 2)}\n`;
    writeFileSync(manifestPath, raw);

    const result = await ensureStoryCoverBlurs({
      root,
      stories: [{ slug: "ep-35" }],
    });

    expect(result.added).toEqual([]);
    expect(result.missingFiles).toEqual([]);
    expect(readFileSync(manifestPath, "utf8")).toBe(raw);
  });

  it("dry-run 不寫檔", async () => {
    const { root, manifestPath } = await fixtureRoot();
    const result = await ensureStoryCoverBlurs({
      root,
      stories: [{ slug: "ep-35" }],
      dryRun: true,
    });
    expect(result.added).toEqual(["/stories/ep-35/01.jpg"]);
    expect(result.missingFiles).toEqual([]);
    expect(() => readFileSync(manifestPath, "utf8")).toThrow();
  });
});
