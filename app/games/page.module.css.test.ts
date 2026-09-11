import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const stripComments = (input: string) => input.replace(/\/\*[\s\S]*?\*\//g, "");

describe("games hub 著色本收進遊樂園後的網格", () => {
  const css = stripComments(
    readFileSync(join(import.meta.dirname, "page.module.css"), "utf8"),
  );

  const narrow = (() => {
    const start = css.indexOf("@media (max-width: 640px)");
    expect(start, "缺少 ≤640 區塊").toBeGreaterThan(-1);
    const end = css.indexOf("@media", start + 1);
    return css.slice(start, end === -1 ? undefined : end);
  })();

  it("桌機維持三欄等寬", () => {
    expect(css).toMatch(
      /\.cardGrid\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/,
    );
  });

  it("手機著色本全寬、另外兩款並排", () => {
    expect(narrow).toMatch(
      /\.cardGrid\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
    );
    expect(narrow).toMatch(/\.lead\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/);
  });
});

describe("games hub 站序", () => {
  const tsx = readFileSync(join(import.meta.dirname, "page.tsx"), "utf8");

  it("著色本為第一站並套 lead", () => {
    expect(tsx).toMatch(
      /HUB_STATION_ORDER[\s\S]*"coloring-book"[\s\S]*"candy-match"[\s\S]*"block-drop"/,
    );
    expect(tsx).toContain("styles.lead");
    expect(tsx).not.toContain("園裡的站");
    expect(tsx).not.toContain("GamesHubProgress");
    expect(tsx).not.toContain("玩完一站");
  });
});
