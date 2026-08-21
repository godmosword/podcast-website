import { describe, expect, it } from "vitest";
import {
  familyBackgroundHex,
  getCharacterLogos,
} from "@/data/character-logos";
import {
  FACE_CONTRAST_GATE,
  MARGIN_MIN,
  SILHOUETTE_CONTRAST_GATE,
  auditEntry,
  contrastRatio,
  relativeLuminance,
} from "./character-logo-contrast";

describe("relativeLuminance / contrastRatio", () => {
  it("WCAG 白對黑為 21:1，白亮度 1、黑亮度 0", () => {
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 5);
  });

  it("對比與參數順序無關", () => {
    expect(contrastRatio("#1B2A44", "#F0DCC4")).toBe(
      contrastRatio("#F0DCC4", "#1B2A44"),
    );
  });
});

describe("auditEntry", () => {
  it("剪影只用 primary 對背景，不看 secondary", () => {
    const result = auditEntry(
      { ipColorPrimary: "#808080", ipColorSecondary: "#FFFFFF" },
      "#808080",
    );
    expect(result.silhouette).toBeCloseTo(1, 2);
    expect(result.passes).toBe(false);
  });

  it("臉部對比較亮的那塊 IP 色與眼標記", () => {
    const result = auditEntry(
      { ipColorPrimary: "#4A281C", ipColorSecondary: "#F8E8D0" },
      "#5C9070",
    );
    expect(result.face).toBeCloseTo(contrastRatio("#1A1410", "#F8E8D0"), 5);
  });

  it("margin 是剪影對 3.6 閘門的餘裕", () => {
    const result = auditEntry(
      { ipColorPrimary: "#FFFFFF", ipColorSecondary: "#EEEEEE" },
      "#000000",
    );
    expect(result.silhouette).toBeCloseTo(21, 5);
    expect(result.margin).toBeCloseTo(21 - SILHOUETTE_CONTRAST_GATE, 5);
    expect(result.face).toBeGreaterThanOrEqual(FACE_CONTRAST_GATE);
    expect(result.passes).toBe(true);
  });

  it("margin < 0.2 即使過 3.6 也視同未過", () => {
    const result = auditEntry(
      { ipColorPrimary: "#C45A72", ipColorSecondary: "#F4E6D0" },
      "#F7EEDC",
    );
    expect(result.silhouette).toBeGreaterThanOrEqual(SILHOUETTE_CONTRAST_GATE);
    expect(result.margin).toBeLessThan(MARGIN_MIN);
    expect(result.passes).toBe(false);
  });
});

describe("35 筆角色 logo 對比閘門", () => {
  it("每位 silhouette ≥ 3.6、margin ≥ 0.2、face ≥ 5.0，否則列出違規", () => {
    const logos = getCharacterLogos();
    expect(logos).toHaveLength(35);

    const rows = logos.map((logo) => {
      const audit = auditEntry(logo, familyBackgroundHex(logo.family));
      return { slug: logo.slug, family: logo.family, ...audit };
    });

    const failed = rows.filter(
      (row) =>
        !row.passes ||
        row.margin < MARGIN_MIN ||
        row.face < FACE_CONTRAST_GATE ||
        row.silhouette < SILHOUETTE_CONTRAST_GATE,
    );
    expect(
      failed.map(
        (row) =>
          `${row.slug} sil=${row.silhouette.toFixed(2)} face=${row.face.toFixed(2)} margin=${row.margin.toFixed(2)}`,
      ),
    ).toEqual([]);
  });
});
