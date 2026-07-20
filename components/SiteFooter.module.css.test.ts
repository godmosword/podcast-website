import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** UX-P0-2：頁尾次要連結觸控高度 ≥44px（CSS 契約，e2e 另驗 layout）。 */
describe("SiteFooter.module.css touch targets", () => {
  const css = readFileSync(
    join(import.meta.dirname, "SiteFooter.module.css"),
    "utf8",
  );

  it("頁尾 meta 連結 min-height 44px", () => {
    expect(css).toMatch(/\.metaLink\s*\{[\s\S]*?min-height:\s*44px/);
  });
});
