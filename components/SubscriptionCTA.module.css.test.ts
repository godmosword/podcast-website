import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** Growth-P1a：訂閱區視覺層級低於主 CTA（扁平卡片、無強陰影）。 */
describe("SubscriptionCTA.module.css visual hierarchy", () => {
  const css = readFileSync(
    join(import.meta.dirname, "SubscriptionCTA.module.css"),
    "utf8",
  );

  it("wrap 無 box-shadow、字級略小於主按鈕區", () => {
    expect(css).toMatch(/\.wrap\s*\{[\s\S]*?box-shadow:\s*none/);
    expect(css).toMatch(/\.lead\s*\{[\s\S]*?font-size:\s*0\.86rem/);
  });
});
