import { describe, expect, it } from "vitest";
import {
  auditCssSource,
  nearestFontSizeToken,
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
