import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RETIRED_BLOCK_DROP_BGM } from "@/lib/games/block-drop/retired-bgm";

const ROOT = join(import.meta.dirname, "../../..");
const FORBIDDEN = "E5, B4, C5, D5";

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, acc);
    else if (
      /\.(ts|tsx|js|jsx|css)$/.test(name) &&
      !/\.test\.(ts|tsx)$/.test(name)
    ) {
      acc.push(path);
    }
  }
  return acc;
}

describe("方塊轉轉旋律不上公開 bundle", () => {
  it("播放器原始碼不含那段開頭", () => {
    const source = readFileSync(
      join(import.meta.dirname, "chiptune-bgm.ts"),
      "utf8",
    );
    expect(source).not.toContain(FORBIDDEN);
    expect(source).not.toContain("retired-bgm");
  });

  it("旋律只存在未掛上網頁的檔案", () => {
    expect(RETIRED_BLOCK_DROP_BGM.melody[0]?.slice(0, 4)).toEqual([
      659, 494, 523, 587,
    ]);
    const shippedRoots = ["app", "components", "lib/gamekit"].map((dir) =>
      join(ROOT, dir),
    );
    const hits = shippedRoots
      .flatMap((dir) => walk(dir))
      .filter((path) => readFileSync(path, "utf8").includes("retired-bgm"));
    expect(hits).toEqual([]);
  });
});
