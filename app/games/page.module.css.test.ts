import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const stripComments = (input: string) => input.replace(/\/\*[\s\S]*?\*\//g, "");

describe("games hub 四張卡的網格", () => {
  const css = stripComments(
    readFileSync(join(import.meta.dirname, "page.module.css"), "utf8"),
  );

  it("預設（<980）排兩欄", () => {
    expect(css).toMatch(
      /\.cardGrid\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
    );
  });

  it("≥980 仍是兩欄，不改成三欄或四欄", () => {
    expect(css).not.toMatch(/\.cardGrid\s*\{[^}]*repeat\(3,/);
    expect(css).not.toMatch(/\.cardGrid\s*\{[^}]*repeat\(4,/);
  });

  it("不再有手機置頂全寬大卡", () => {
    expect(css).not.toMatch(/\.lead\b/);
  });

  it("手機海報改 3/2，第一屏才看得到三款標題", () => {
    expect(css).toMatch(
      /@media \(max-width: 640px\)\s*\{[\s\S]*?\.hero\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*9/,
    );
    expect(css).toMatch(
      /@media \(max-width: 640px\)\s*\{[\s\S]*?\.heroImage\s*\{[^}]*object-fit:\s*cover/,
    );
    expect(css).not.toMatch(/940\s*\/\s*1410/);
  });
});

describe("games hub 站序", () => {
  const tsx = readFileSync(join(import.meta.dirname, "page.tsx"), "utf8");

  it("著色 → 消消樂 → 壽司 → 小橘特快車", () => {
    expect(tsx).toMatch(
      /HUB_STATION_ORDER[\s\S]*"coloring-book"[\s\S]*"candy-match"[\s\S]*"dino-sushi"[\s\S]*"orange-express"/,
    );
    expect(tsx).not.toContain("block-drop");
    expect(tsx).not.toContain("styles.lead");
    expect(tsx).not.toContain("園裡的站");
    expect(tsx).not.toContain("GamesHubProgress");
    expect(tsx).not.toContain("玩完一站");
  });

  it("JSON-LD 用站序排好的清單", () => {
    expect(tsx).toContain("gameListJsonLd(ORDERED_GAMES)");
  });
});
