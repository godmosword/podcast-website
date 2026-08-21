import { describe, expect, it } from "vitest";
import {
  familyBackgroundHex,
  getCharacterLogos,
} from "@/data/character-logos";
import {
  FACE_CONTRAST_GATE,
  MARGIN_MIN,
  auditEntry,
  chroma,
  contrastRatio,
  hueAngle,
  hueDistance,
  relativeLuminance,
  silhouetteGate,
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

describe("silhouetteGate", () => {
  it("色相遠（≥ 60）門檻 2.8，中距 3.6，近（＜ 30）4.5", () => {
    expect(silhouetteGate(60)).toBe(2.8);
    expect(silhouetteGate(175)).toBe(2.8);
    expect(silhouetteGate(30)).toBe(3.6);
    expect(silhouetteGate(59.9)).toBe(3.6);
    expect(silhouetteGate(29.9)).toBe(4.5);
    expect(silhouetteGate(0)).toBe(4.5);
  });
});

describe("auditEntry", () => {
  it("剪影只用 primary 對背景，不看 secondary", () => {
    const result = auditEntry(
      { ipColorPrimary: "#808080", ipColorSecondary: "#FFFFFF" },
      "#808080",
    );
    expect(result.silhouette).toBeCloseTo(1, 2);
    expect(result.gate).toBe(4.5);
    expect(result.passes).toBe(false);
  });

  it("臉部對比較亮的那塊 IP 色與眼標記", () => {
    const result = auditEntry(
      { ipColorPrimary: "#4A281C", ipColorSecondary: "#F8E8D0" },
      "#5C9070",
    );
    expect(result.face).toBeCloseTo(contrastRatio("#1A1410", "#F8E8D0"), 5);
  });

  it("色相遠離時剪影門檻 2.8，margin 相對該門檻", () => {
    const result = auditEntry(
      { ipColorPrimary: "#E4402E", ipColorSecondary: "#C5D8F0" },
      "#003737",
    );
    expect(result.hueDist).toBeGreaterThanOrEqual(60);
    expect(result.gate).toBe(2.8);
    expect(result.margin).toBeCloseTo(result.silhouette - 2.8, 5);
    expect(result.face).toBeGreaterThanOrEqual(FACE_CONTRAST_GATE);
    expect(result.passes).toBe(true);
  });

  it("同色相近距即使過 3.6 也要過 4.5", () => {
    const result = auditEntry(
      { ipColorPrimary: "#FF8A72", ipColorSecondary: "#C5D8F0" },
      "#76382E",
    );
    expect(result.hueDist).toBeLessThan(30);
    expect(result.gate).toBe(4.5);
    expect(result.silhouette).toBeGreaterThan(3.6);
    expect(result.silhouette).toBeLessThan(4.5);
    expect(result.margin).toBeLessThan(MARGIN_MIN);
    expect(result.passes).toBe(false);
  });
});

describe("35 筆角色 logo 對比閘門", () => {
  it("列出未過加權門檻的 slug，供任務 I 對帳", () => {
    const logos = getCharacterLogos();
    expect(logos).toHaveLength(35);

    const failed = logos
      .map((logo) => {
        const audit = auditEntry(logo, familyBackgroundHex(logo.family));
        return { slug: logo.slug, ...audit };
      })
      .filter((row) => !row.passes)
      .map((row) => row.slug)
      .sort();

    // 任務 I：預期同色相呼應的 9 筆。J／K 改背景後此陣列應為空。
    expect(failed).toEqual(
      [
        "a-ku",
        "a-ni",
        "diao-che",
        "dong-dong",
        "duo-duo",
        "xiao-hong",
        "xiao-hong-baby",
        "xiao-hong-dad",
        "xiao-hong-dad-young",
      ].sort(),
    );
  });
});
