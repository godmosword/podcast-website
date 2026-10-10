import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const stripComments = (input: string) => input.replace(/\/\*[\s\S]*?\*\//g, "");

describe("games hub 四張卡的網格", () => {
  const css = stripComments(
    readFileSync(join(import.meta.dirname, "page.module.css"), "utf8"),
  );

  it("預設（<980）排 2×2", () => {
    expect(css).toMatch(
      /\.cardGrid\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
    );
  });

  it("≥980 一排四欄", () => {
    expect(css).toMatch(
      /@media \(min-width: 980px\)\s*\{\s*\.cardGrid\s*\{[^}]*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/,
    );
  });

  it("不再有手機置頂全寬大卡（四張時第 4 張會落單）", () => {
    expect(css).not.toMatch(/\.lead\b/);
  });
});

describe("games hub 站序", () => {
  const tsx = readFileSync(join(import.meta.dirname, "page.tsx"), "utf8");

  it("著色 → 消消樂 → 壽司 → 方塊", () => {
    expect(tsx).toMatch(
      /HUB_STATION_ORDER[\s\S]*"coloring-book"[\s\S]*"candy-match"[\s\S]*"dino-sushi"[\s\S]*"block-drop"/,
    );
    expect(tsx).not.toContain("styles.lead");
    expect(tsx).not.toContain("園裡的站");
    expect(tsx).not.toContain("GamesHubProgress");
    expect(tsx).not.toContain("玩完一站");
  });

  it("JSON-LD 用站序排好的清單", () => {
    expect(tsx).toContain("gameListJsonLd(ORDERED_GAMES)");
  });
});
