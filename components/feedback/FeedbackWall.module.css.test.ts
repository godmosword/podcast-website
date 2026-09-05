import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("FeedbackWall.module.css", () => {
  const css = readFileSync(join(import.meta.dirname, "FeedbackWall.module.css"), "utf8");

  it("公開暱稱／正文／圓章排除 huninn，改系統中黑", () => {
    expect(css).not.toMatch(/--font-huninn/);
    expect(css).toMatch(
      /\.nickname\s*\{[\s\S]*?font-family:\s*"PingFang TC",\s*"Microsoft JhengHei",\s*"Noto Sans TC"/,
    );
    expect(css).toMatch(
      /\.message\s*\{[\s\S]*?font-family:\s*"PingFang TC",\s*"Microsoft JhengHei",\s*"Noto Sans TC"/,
    );
    expect(css).toMatch(
      /\.avatar\s*\{[\s\S]*?font-family:\s*"PingFang TC",\s*"Microsoft JhengHei",\s*"Noto Sans TC"/,
    );
  });

  it("真留言是 hairline 列，示範卡是虛線獨立容器", () => {
    expect(css).toMatch(/\.item\s*\{[\s\S]*?border-bottom:\s*1px solid var\(--hairline\)/);
    expect(css).toMatch(/\.demo\s*\{[\s\S]*?border:\s*1\.5px dashed/);
    expect(css).toMatch(/\.demo\s*\{[\s\S]*?background:\s*var\(--bg-2\)/);
  });

  it("空牆 CTA 觸控區 ≥44px，正文可折行", () => {
    expect(css).toMatch(/\.emptyCta\s*\{[\s\S]*?min-height:\s*44px/);
    expect(css).toMatch(/\.message\s*\{[\s\S]*?overflow-wrap:\s*anywhere/);
  });

  it("牆骨架只動 opacity，且受 reduced-motion 預設關閉", () => {
    expect(css).toMatch(/\.skeleton\s*\{[\s\S]*?opacity:\s*0\.7/);
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: no-preference\)\s*\{[\s\S]*?\.skeleton\s*\{[\s\S]*?animation:/,
    );
    const pulse = css.match(/@keyframes wallPulse\s*\{[\s\S]*?\n\}/);
    expect(pulse?.[0]).toMatch(/opacity:/);
    expect(pulse?.[0]).not.toMatch(/width:|height:|margin:|padding:/);
  });
});
