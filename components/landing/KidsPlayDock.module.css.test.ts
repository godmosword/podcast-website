import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("KidsPlayDock.module.css", () => {
  const css = readFileSync(
    join(import.meta.dirname, "KidsPlayDock.module.css"),
    "utf8",
  );

  it("dock z-index 為 15", () => {
    expect(css).toMatch(/\.dock\s*\{[\s\S]*?z-index:\s*15/);
  });

  it(".link 觸控底線 min-height 48px", () => {
    expect(css).toMatch(/\.link\s*\{[\s\S]*?min-height:\s*48px/);
  });

  it("prefers-reduced-motion 關閉 :active scale", () => {
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.link:active\s*\{[\s\S]*?transform:\s*none/,
    );
  });

  it("背景用 --surface-elevated，非桃色玻璃頂欄 token", () => {
    expect(css).toMatch(/\.link\s*\{[\s\S]*?background:\s*var\(--surface-elevated\)/);
    expect(css).not.toContain("--landing-nav-cta-bg");
  });

  it("標籤 nowrap，避免「全部故／事」折行", () => {
    expect(css).toMatch(/\.label\s*\{[\s\S]*?white-space:\s*nowrap/);
  });

  it("≤480 宇宙地圖 dock 抬到島選擇列上方", () => {
    expect(css).toMatch(
      /@media \(max-width:\s*480px\)[\s\S]*?\.dock\[data-lift="picker"\]/,
    );
  });
});
