import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const stripComments = (input: string) => input.replace(/\/\*[\s\S]*?\*\//g, "");

describe("CharacterCard.module.css 出場故事釘底", () => {
  const css = stripComments(
    readFileSync(join(import.meta.dirname, "CharacterCard.module.css"), "utf8"),
  );

  it("卡片與內容區是直向 flex，同一列等高時下拉才會落在框底", () => {
    expect(css).toMatch(/\.card\s*\{[^}]*display:\s*flex/);
    expect(css).toMatch(/\.card\s*\{[^}]*flex-direction:\s*column/);
    expect(css).toMatch(/\.cardBody\s*\{[^}]*display:\s*flex/);
    expect(css).toMatch(/\.cardBody\s*\{[^}]*flex:\s*1/);
  });

  it("出場故事用 margin-top:auto 推到內容區底部", () => {
    expect(css).toMatch(/\.episodeSelect\s*\{[^}]*margin-top:\s*auto/);
  });
});

describe("CharacterCard.module.css 角色名不截斷", () => {
  const css = stripComments(
    readFileSync(join(import.meta.dirname, "CharacterCard.module.css"), "utf8"),
  );
  const nameRule = css.match(/\.name\s*\{([^}]*)\}/)?.[1] ?? "";

  it("標題列可換行，車種擠不下時掉到第二行", () => {
    expect(css).toMatch(/\.cardTitle\s*\{[^}]*flex-wrap:\s*wrap/);
  });

  it("角色名不用省略號（360 寬時「知…」「小紅豆汽…」看不出是誰）", () => {
    expect(nameRule).not.toMatch(/text-overflow:\s*ellipsis/);
    expect(nameRule).not.toMatch(/overflow:\s*hidden/);
  });
});
