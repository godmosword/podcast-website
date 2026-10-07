import { describe, expect, test } from "vitest";
import { COLORING_PAGES, type ColoringPageKind } from "@/data/coloring-pages";
import { BACKGROUNDS } from "./coloring-reference-overrides";

const ids = (kind: ColoringPageKind) =>
  COLORING_PAGES.filter((p) => p.kind === kind).map((p) => p.id);

/** 選頁格子（手機 2 欄、桌機 4 欄）裡左右、上下相鄰的兩頁。 */
function neighbours(list: readonly string[], columns: number): [string, string][] {
  const pairs: [string, string][] = [];
  list.forEach((id, i) => {
    if (i % columns !== columns - 1 && list[i + 1]) pairs.push([id, list[i + 1]!]);
    if (list[i + columns]) pairs.push([id, list[i + columns]!]);
  });
  return pairs;
}

describe("參考彩圖底色", () => {
  test("每頁都有底色", () => {
    for (const page of COLORING_PAGES) expect(BACKGROUNDS[page.id], page.id).toBeDefined();
  });

  test("至少用到五種底色", () => {
    expect(new Set(Object.values(BACKGROUNDS)).size).toBeGreaterThanOrEqual(5);
  });

  test.each([2, 4])("%i 欄格子裡相鄰兩頁底色不同", (columns) => {
    for (const kind of ["character", "scene"] as const)
      for (const [a, b] of neighbours(ids(kind), columns))
        expect(BACKGROUNDS[a], `${a} / ${b}`).not.toBe(BACKGROUNDS[b]);
  });

  test("故事頁不跟同一集的角色頁同底色", () => {
    for (const scene of COLORING_PAGES.filter((p) => p.kind === "scene")) {
      const character = COLORING_PAGES.find(
        (p) => p.kind === "character" && p.storySlug === scene.storySlug,
      );
      if (character)
        expect(BACKGROUNDS[scene.id], scene.id).not.toBe(BACKGROUNDS[character.id]);
    }
  });
});
