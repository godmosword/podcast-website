import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "../../data/official-release.json";
import { prepareSwRevocations, readRevokedSlugs, withRevokedSlugs } from "./sw-revocations";

const SW = [
  'const CACHE_NAME = "chechecar-v6";',
  "// 說明",
  "const REVOKED_STORY_SLUGS = [];",
  "const SHELL = [];",
].join("\n");

describe("withRevokedSlugs", () => {
  it("只改寫名單那一行，依集數排序", () => {
    const next = withRevokedSlugs(SW, ["ep-12", "ep-3"]);
    expect(next).toBe(SW.replace("= [];\nconst SHELL", '= ["ep-3","ep-12"];\nconst SHELL'));
    expect(readRevokedSlugs(next)).toEqual(["ep-3", "ep-12"]);
  });

  it("名單沒變時輸出一模一樣，sw.js 不會因為核准新集而重裝", () => {
    const once = withRevokedSlugs(SW, ["ep-3"]);
    expect(withRevokedSlugs(once, ["ep-3"])).toBe(once);
    expect(withRevokedSlugs(SW, [])).toBe(SW);
  });

  it("拒絕不是 ep-N 的值，不讓任意字串寫進 Service Worker", () => {
    expect(() => withRevokedSlugs(SW, ['ep-1"];self.close();//'])).toThrow(/ep-N/);
    expect(() => withRevokedSlugs(SW, ["../ep-1"])).toThrow(/ep-N/);
  });

  it("CRLF 換行也找得到名單行，並保留原本的換行", () => {
    const crlf = SW.replace(/\n/g, "\r\n");
    const next = withRevokedSlugs(crlf, ["ep-7"]);
    expect(next).toContain('const REVOKED_STORY_SLUGS = ["ep-7"];\r\nconst SHELL');
    expect(readRevokedSlugs(next)).toEqual(["ep-7"]);
  });

  it("找不到名單行或出現兩次就失敗，不默默略過", () => {
    expect(() => withRevokedSlugs("const CACHE_NAME = 1;", [])).toThrow(/REVOKED_STORY_SLUGS/);
    const twice = `${SW}\nconst REVOKED_STORY_SLUGS = [];`;
    expect(() => withRevokedSlugs(twice, [])).toThrow(/REVOKED_STORY_SLUGS/);
  });
});

describe("prepareSwRevocations", () => {
  function tempRoot(source: string): string {
    const root = mkdtempSync(join(tmpdir(), "sw-revocations-"));
    mkdirSync(join(root, "public"));
    writeFileSync(join(root, "public/sw.js"), source);
    return root;
  }

  it("先算好內容，呼叫回傳的函式才寫檔", () => {
    const root = tempRoot(SW);
    const write = prepareSwRevocations(root, ["ep-5"]);
    expect(readFileSync(join(root, "public/sw.js"), "utf8")).toBe(SW);
    write();
    expect(readRevokedSlugs(readFileSync(join(root, "public/sw.js"), "utf8"))).toEqual(["ep-5"]);
  });

  it("sw.js 有問題時在寫任何檔之前就丟錯", () => {
    const root = tempRoot("const CACHE_NAME = 1;");
    expect(() => prepareSwRevocations(root, ["ep-5"])).toThrow(/REVOKED_STORY_SLUGS/);
  });
});

describe("public/sw.js 與發行清單", () => {
  it("sw.js 的下架名單跟 data/official-release.json 一致", () => {
    const sw = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
    expect(readRevokedSlugs(sw)).toEqual(
      [...manifest.revokedStorySlugs].sort(
        (left, right) => Number(left.slice(3)) - Number(right.slice(3)),
      ),
    );
  });
});
