import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("StoryCard.module.css 目錄縮圖", () => {
  const css = readFileSync(
    join(import.meta.dirname, "StoryCard.module.css"),
    "utf8",
  );

  const desktopIdx = css.indexOf("@media (min-width: 768px)");
  const mobileIdx = css.indexOf("@media (max-width: 480px)");

  it("目錄直式規則只活在 ≥768，且必須掛 html 旗標", () => {
    expect(desktopIdx).toBeGreaterThan(-1);
    expect(desktopIdx).toBeLessThan(mobileIdx);
    expect(css.slice(0, desktopIdx)).not.toMatch(/\.catalogCard\s*\{/);
    expect(css.slice(desktopIdx, mobileIdx)).toContain(
      'html:not([data-stories-view="list"])',
    );
    expect(css.slice(desktopIdx, mobileIdx)).toContain(".catalogCard");
  });

  it("目錄縮圖不覆寫手機 summary clamp", () => {
    expect(css.slice(desktopIdx, mobileIdx)).not.toContain(".summary");
  });
});
