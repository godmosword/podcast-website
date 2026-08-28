import { describe, expect, it } from "vitest";
import {
  auditCssSource,
  findVarFallbackMismatches,
  formatDesignTokenReport,
  formatFallbackMismatchWarnings,
  nearestFontSizeToken,
  parseCssCustomProperties,
  stripDesignCssNoise,
} from "./design-token-audit";

describe("stripDesignCssNoise", () => {
  it("移除註解內的宣告", () => {
    const css = `
      /* font-size: 0.86rem; padding: 8px; color: #fff; */
      .x { font-size: var(--fs-meta); }
    `;
    expect(stripDesignCssNoise(css)).not.toMatch(/0\.86rem/);
    expect(stripDesignCssNoise(css)).not.toMatch(/#fff/);
  });

  it("var() fallback 不論單位都不留在輸出裡", () => {
    const css = ".x { font-size: var(--fs-meta, 0.9rem); border-radius: var(--radius-sm, 12px); }";
    const stripped = stripDesignCssNoise(css);
    expect(stripped).not.toMatch(/0\.9rem/);
    expect(stripped).not.toMatch(/12px/);
    expect(stripped).toMatch(/var\(/);
  });
});

describe("auditCssSource dimensions", () => {
  it("字級能分辨 token 與裸值", () => {
    const report = auditCssSource(`
      .a { font-size: var(--fs-h1); }
      .b { font-size: 0.95rem; }
      .c { font-size: 14px; }
    `);
    expect(report.fontSize).toEqual({ token: 1, bare: 2 });
  });

  it("圓角能分辨 token 與裸值", () => {
    const report = auditCssSource(`
      .a { border-radius: var(--radius-md); }
      .b { border-radius: 8px; }
      .c { border-radius: 999px; }
    `);
    expect(report.radius).toEqual({ token: 1, bare: 2 });
  });

  it("色彩能分辨 token 與裸 hex／rgb／hsl／具名色", () => {
    const report = auditCssSource(`
      .a { color: var(--ink); }
      .b { color: #fff9eb; }
      .c { background-color: rgb(255 0 0); }
      .d { border-color: hsl(20 40% 20%); }
      .e { fill: black; }
      .f { stroke: var(--accent); }
    `);
    expect(report.color).toEqual({ token: 2, bare: 4 });
  });

  it("間距能分辨 token 與裸值，且 0／auto／百分比不計入分母", () => {
    const report = auditCssSource(`
      .a { margin: var(--space-4); }
      .b { padding: 8px; }
      .c { gap: 12px; }
      .d { margin: 0; }
      .e { margin: 0 auto; }
      .f { padding: 10%; }
      .g { row-gap: 0; }
    `);
    expect(report.spacing).toEqual({ token: 1, bare: 2 });
  });
});

describe("auditCssSource 誤報處理", () => {
  it("var(--x, 0.9rem) 的 fallback 不計為裸值", () => {
    const report = auditCssSource(`
      .x { font-size: var(--fs-meta, 0.9rem); }
    `);
    expect(report.fontSize).toEqual({ token: 1, bare: 0 });
    expect(report.fontSizes).toEqual([]);
  });

  it("註解內的宣告不計入", () => {
    const report = auditCssSource(`
      /* font-size: 0.86rem; padding: 8px; color: #abc; */
      .x { color: var(--ink); }
    `);
    expect(report.fontSize).toEqual({ token: 0, bare: 0 });
    expect(report.spacing).toEqual({ token: 0, bare: 0 });
    expect(report.color).toEqual({ token: 1, bare: 0 });
  });

  it("calc(var(--space-4) * 2) 算 token；calc(8px * 2) 算裸值", () => {
    const report = auditCssSource(`
      .a { padding: calc(var(--space-4) * 2); }
      .b { padding: calc(8px * 2); }
    `);
    expect(report.spacing).toEqual({ token: 1, bare: 1 });
  });

  it("@media (min-width: 980px) 的 980px 不計入間距分母", () => {
    const report = auditCssSource(`
      @media (min-width: 980px) {
        .x { padding: var(--space-4); }
      }
    `);
    expect(report.spacing).toEqual({ token: 1, bare: 0 });
  });

  it("padding: 8px 12px 計為一次宣告", () => {
    const report = auditCssSource(`
      .x { padding: 8px 12px; }
    `);
    expect(report.spacing).toEqual({ token: 0, bare: 1 });
  });

  it("簡寫與長寫混用時不重複計數", () => {
    const report = auditCssSource(`
      .x {
        padding: 8px 12px;
        padding-top: var(--space-2);
      }
    `);
    expect(report.spacing).toEqual({ token: 1, bare: 1 });
  });

  it("含 var 的 calc 即使夾著裸 px 仍算 token", () => {
    const report = auditCssSource(`
      .x { padding: calc(8px + var(--safe-bottom)); }
    `);
    expect(report.spacing).toEqual({ token: 1, bare: 0 });
  });

  it("url() 內的 #hex 不計為裸色", () => {
    const report = auditCssSource(`
      .x { background: url("data:image/svg+xml,#fff"); }
    `);
    expect(report.color).toEqual({ token: 0, bare: 0 });
  });

  it("border-top-color 不列入色彩維度（寧可漏報）", () => {
    const report = auditCssSource(`
      .x { border-top-color: #ff0000; color: var(--ink); }
    `);
    expect(report.color).toEqual({ token: 1, bare: 0 });
  });

  it("transparent／none／inherit 不列入色彩裸值", () => {
    const report = auditCssSource(`
      .a { background: transparent; }
      .b { background-color: none; }
      .c { color: inherit; }
    `);
    expect(report.color).toEqual({ token: 0, bare: 0 });
  });
});

describe("nearestFontSizeToken", () => {
  it("0.95rem 最近 --fs-meta", () => {
    const nearest = nearestFontSizeToken("0.95rem");
    expect(nearest?.name).toBe("--fs-meta");
    expect(nearest?.delta).toBeCloseTo(0.17, 4);
  });

  it("complex clamp 不標最近階", () => {
    expect(
      nearestFontSizeToken("clamp(0.98rem, 0.9rem + 0.6vw, 1.12rem)"),
    ).toBeNull();
  });
});

describe("parseCssCustomProperties", () => {
  it("讀取 :root 裡的 token 定義", () => {
    const defs = parseCssCustomProperties(`
      :root {
        --radius-md: 20px;
        --radius-sm: 14px;
      }
    `);
    expect(defs.get("--radius-md")).toBe("20px");
    expect(defs.get("--radius-sm")).toBe("14px");
  });
});

describe("findVarFallbackMismatches", () => {
  const definitions = parseCssCustomProperties(`
    :root {
      --radius-md: 20px;
      --radius-sm: 14px;
      --nav-h: calc(64px + var(--safe-top));
    }
  `);

  it("fallback 與 globals 定義不符時列出警告", () => {
    const hits = findVarFallbackMismatches(
      `
        .x { border-radius: var(--radius-md, 18px); }
        .y { border-radius: var(--radius-sm, 12px); }
      `,
      definitions,
    );
    expect(hits).toEqual([
      { token: "--radius-md", defined: "20px", fallback: "18px" },
      { token: "--radius-sm", defined: "14px", fallback: "12px" },
    ]);
  });

  it("fallback 與定義相同時不警告", () => {
    expect(
      findVarFallbackMismatches(
        ".x { border-radius: var(--radius-md, 20px); }",
        definitions,
      ),
    ).toEqual([]);
  });

  it("globals 未定義的區域變數不警告", () => {
    expect(
      findVarFallbackMismatches(
        ".x { animation-delay: var(--delay, 0s); }",
        definitions,
      ),
    ).toEqual([]);
  });

  it("沒有 fallback 的 var() 不警告", () => {
    expect(
      findVarFallbackMismatches(
        ".x { border-radius: var(--radius-md); }",
        definitions,
      ),
    ).toEqual([]);
  });

  it("註解內的 var() 不警告", () => {
    expect(
      findVarFallbackMismatches(
        "/* border-radius: var(--radius-md, 18px); */ .x { color: red; }",
        definitions,
      ),
    ).toEqual([]);
  });
});

describe("formatFallbackMismatchWarnings", () => {
  it("無不符時不輸出警告段", () => {
    expect(formatFallbackMismatchWarnings([])).toBe("");
  });

  it("有不符時列檔案／token／定義／fallback", () => {
    const text = formatFallbackMismatchWarnings([
      {
        file: "components/StoryPlayer.module.css",
        token: "--radius-md",
        defined: "20px",
        fallback: "18px",
      },
    ]);
    expect(text).toMatch(/警告/);
    expect(text).toContain("components/StoryPlayer.module.css");
    expect(text).toContain("--radius-md");
    expect(text).toContain("20px");
    expect(text).toContain("18px");
  });
});

describe("spacing rem 政策豁免", () => {
  it("rem 間距不計入 spacing 分母；px 與 token 照常計入", () => {
    const report = auditCssSource(`
      .a { padding: 0.5rem; }
      .b { gap: 8px; }
      .c { margin: var(--space-4); }
    `);
    expect(report.spacing).toEqual({ token: 1, bare: 1 });
    expect(report.spacingRem).toBe(1);
  });

  it("多值含 rem 整筆豁免，夾著的 px 不計裸值", () => {
    const report = auditCssSource(`
      .x { padding: 8px 0.5rem; }
    `);
    expect(report.spacing).toEqual({ token: 0, bare: 0 });
    expect(report.spacingRem).toBe(1);
  });

  it("calc 含 rem 豁免；純 px calc 仍為裸值", () => {
    const report = auditCssSource(`
      .a { padding: calc(0.5rem + 8px); }
      .b { padding: calc(8px * 2); }
    `);
    expect(report.spacing).toEqual({ token: 0, bare: 1 });
    expect(report.spacingRem).toBe(1);
  });

  it("報告另列 rem 豁免處數，不把豁免算進採用率", () => {
    const text = formatDesignTokenReport({
      fileCount: 1,
      fontSize: { token: 0, bare: 0 },
      radius: { token: 0, bare: 0 },
      color: { token: 0, bare: 0 },
      spacing: { token: 344, bare: 479 },
      fontSizes: [],
      remBareOccurrences: 0,
      files: [],
      fallbackMismatches: [],
      spacingRem: 165,
    });
    expect(text).toMatch(/spacing.*344 token \/ 479 裸值 → 42%/);
    expect(text).toMatch(/另有 165 處 rem 間距（政策豁免，見 DESIGN\.md）/);
  });
});
