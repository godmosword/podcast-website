import { describe, expect, it } from "vitest";
import {
  familyBackgroundHex,
  getCharacterLogos,
} from "@/data/character-logos";
import {
  CHROMA_TRACK_MIN,
  FACE_CONTRAST_GATE,
  HUE_DISTANCE_MIN,
  MARGIN_MIN,
  SILHOUETTE_CONTRAST_GATE,
  SILHOUETTE_HUE_TRACK_MIN,
  auditEntry,
  chroma,
  contrastRatio,
  hueAngle,
  hueDistance,
  relativeLuminance,
  trackLabel,
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

describe("OKLCH hue / chroma", () => {
  it("hueDistance 走環形最短距離，範圍 0–180", () => {
    expect(hueDistance("#FF0000", "#FF0000")).toBeCloseTo(0, 0);
    expect(hueDistance("#FF0000", "#00FF00")).toBeGreaterThan(90);
    expect(hueAngle("#FF0000")).toBeGreaterThanOrEqual(0);
    expect(hueAngle("#FF0000")).toBeLessThan(360);
    expect(hueDistance("#FF0000", "#00FFFF")).toBeLessThanOrEqual(180);
  });

  it("無彩度灰的 chroma 接近 0", () => {
    expect(chroma("#808080")).toBeLessThan(0.02);
  });

  it("鮭魚 #FF8A72 與 speed #76382E 色相差約 2 度", () => {
    expect(hueDistance("#FF8A72", "#76382E")).toBeLessThan(10);
    expect(chroma("#FF8A72")).toBeGreaterThan(0.12);
  });
});

describe("auditEntry", () => {
  it("剪影只用 primary 對背景，不看 secondary", () => {
    const result = auditEntry(
      { ipColorPrimary: "#808080", ipColorSecondary: "#FFFFFF" },
      "#808080",
    );
    expect(result.silhouette).toBeCloseTo(1, 2);
    expect(result.track1).toBe(false);
    expect(result.track2).toBe(false);
    expect(result.passes).toBe(false);
    expect(result.track).toBeNull();
  });

  it("臉部對比較亮的那塊 IP 色與眼標記", () => {
    const result = auditEntry(
      { ipColorPrimary: "#4A281C", ipColorSecondary: "#F8E8D0" },
      "#5C9070",
    );
    expect(result.face).toBeCloseTo(contrastRatio("#1A1410", "#F8E8D0"), 5);
  });

  it("軌道 1：亮度分離，margin 是剪影對 3.6 閘門的餘裕", () => {
    const result = auditEntry(
      { ipColorPrimary: "#FFFFFF", ipColorSecondary: "#EEEEEE" },
      "#000000",
    );
    expect(result.silhouette).toBeCloseTo(21, 5);
    expect(result.margin).toBeCloseTo(21 - SILHOUETTE_CONTRAST_GATE, 5);
    expect(result.face).toBeGreaterThanOrEqual(FACE_CONTRAST_GATE);
    expect(result.track1).toBe(true);
    expect(result.passes).toBe(true);
    expect(result.track).toBe(1);
  });

  it("軌道 1 在 margin < 0.2 時失敗，即使過 3.6", () => {
    const result = auditEntry(
      { ipColorPrimary: "#C45A72", ipColorSecondary: "#F4E6D0" },
      "#F7EEDC",
    );
    expect(result.silhouette).toBeGreaterThanOrEqual(SILHOUETTE_CONTRAST_GATE);
    expect(result.margin).toBeLessThan(MARGIN_MIN);
    expect(result.track1).toBe(false);
  });

  it("軌道 2：高彩度 + 色相距離 ≥ 60，剪影可低於 3.6 但不能低於 2.8", () => {
    const result = auditEntry(
      { ipColorPrimary: "#E4402E", ipColorSecondary: "#C5D8F0" },
      "#003737",
    );
    expect(result.hueDist).toBeGreaterThanOrEqual(HUE_DISTANCE_MIN);
    expect(result.chroma).toBeGreaterThanOrEqual(CHROMA_TRACK_MIN);
    expect(result.silhouette).toBeGreaterThanOrEqual(SILHOUETTE_HUE_TRACK_MIN);
    expect(result.track2).toBe(true);
    expect(result.face).toBeGreaterThanOrEqual(FACE_CONTRAST_GATE);
    expect(result.passes).toBe(true);
  });

  it("軌道 2 不給低彩度角色當通用放寬", () => {
    const result = auditEntry(
      { ipColorPrimary: "#6A6A6A", ipColorSecondary: "#EEEEEE" },
      "#1B2A44",
    );
    expect(result.chroma).toBeLessThan(CHROMA_TRACK_MIN);
    expect(result.track2).toBe(false);
  });
});

describe("35 筆角色 logo 對比閘門", () => {
  it("每位 face ≥ 5.0 且軌道 1 或軌道 2 通過，否則列出違規", () => {
    const logos = getCharacterLogos();
    expect(logos).toHaveLength(35);

    const rows = logos.map((logo) => {
      const audit = auditEntry(logo, familyBackgroundHex(logo.family));
      return { slug: logo.slug, family: logo.family, ...audit };
    });

    const failed = rows.filter((row) => !row.passes);
    expect(
      failed.map(
        (row) =>
          `${row.slug} sil=${row.silhouette.toFixed(2)} face=${row.face.toFixed(2)} margin=${row.margin.toFixed(2)} hueDist=${row.hueDist.toFixed(1)} track=${trackLabel(row)}`,
      ),
    ).toEqual([]);
  });
});
