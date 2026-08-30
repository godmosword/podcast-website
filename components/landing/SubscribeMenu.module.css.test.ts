import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("SubscribeMenu.module.css trigger 去框", () => {
  const css = readFileSync(
    join(import.meta.dirname, "SubscribeMenu.module.css"),
    "utf8",
  );

  const triggerBlock = css.slice(
    css.indexOf(".trigger {"),
    css.indexOf(".trigger:active"),
  );

  it("trigger 無 border／box-shadow／實心底，字色 inherit", () => {
    expect(triggerBlock).toMatch(/background:\s*transparent/);
    expect(triggerBlock).toMatch(/color:\s*inherit/);
    expect(triggerBlock).toMatch(/border:\s*0/);
    expect(triggerBlock).toMatch(/box-shadow:\s*none/);
    expect(triggerBlock).not.toContain("--landing-nav-cta-fg");
    expect(triggerBlock).not.toContain("--landing-nav-cta-bg");
  });

  it("trigger 維持 44px 與字重 800", () => {
    expect(triggerBlock).toMatch(/min-height:\s*44px/);
    expect(triggerBlock).toMatch(/font-weight:\s*800/);
  });

  it("trigger hover 規則在，dropdown 仍有框", () => {
    expect(css).toMatch(/\.trigger:hover\s*\{[\s\S]*?background:/);
    expect(css).toMatch(/\.dropdown\s*\{[\s\S]*?border:\s*1\.5px solid var\(--line\)/);
  });
});
