import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { serializeSubtitles, writeSubtitlesIfChanged } from "./subtitle-file";

const SEGMENTS = [
  { t: 0, text: "我們一起出發去" },
  { t: 4.4, text: "嗨我是 Bonbon" },
];

describe("serializeSubtitles", () => {
  it("兩格縮排、結尾換行，跟校稿工具寫出來的一樣", () => {
    expect(serializeSubtitles(SEGMENTS)).toBe(`${JSON.stringify(SEGMENTS, null, 2)}\n`);
  });
});

describe("writeSubtitlesIfChanged", () => {
  let dir: string;
  let file: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "subtitle-file-"));
    file = path.join(dir, "ep-1.json");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("檔案不存在就寫", () => {
    expect(writeSubtitlesIfChanged(file, SEGMENTS)).toBe(true);
    expect(readFileSync(file, "utf8")).toBe(serializeSubtitles(SEGMENTS));
  });

  it("內容和格式都一樣就不碰檔案", () => {
    writeFileSync(file, serializeSubtitles(SEGMENTS), "utf8");
    const before = statSync(file).mtimeMs;
    expect(writeSubtitlesIfChanged(file, SEGMENTS)).toBe(false);
    expect(statSync(file).mtimeMs).toBe(before);
  });

  it("內容一樣但是單行格式，改寫成標準格式（#257 的 939 行假 diff）", () => {
    writeFileSync(file, `${JSON.stringify(SEGMENTS)}\n`, "utf8");
    expect(writeSubtitlesIfChanged(file, SEGMENTS)).toBe(true);
    expect(readFileSync(file, "utf8")).toBe(serializeSubtitles(SEGMENTS));
  });

  it("內容變了就寫", () => {
    writeFileSync(file, serializeSubtitles(SEGMENTS), "utf8");
    const next = [...SEGMENTS, { t: 10.8, text: "我是馬米" }];
    expect(writeSubtitlesIfChanged(file, next)).toBe(true);
    expect(JSON.parse(readFileSync(file, "utf8"))).toEqual(next);
  });
});

describe("data/subtitles 側車檔", () => {
  it("每一集都是 serializeSubtitles 的格式，同步再處理才不會只改縮排", () => {
    const subtitlesDir = path.join(process.cwd(), "data/subtitles");
    const files = readdirSync(subtitlesDir).filter((name) => name.endsWith(".json"));
    expect(files.length).toBeGreaterThan(0);
    const drifted = files.filter((name) => {
      const raw = readFileSync(path.join(subtitlesDir, name), "utf8");
      return raw !== serializeSubtitles(JSON.parse(raw));
    });
    expect(drifted, "這些字幕檔格式跟 serializeSubtitles 不一致").toEqual([]);
  });
});
