import { describe, expect, it } from "vitest";
import {
  LOGO_FAMILIES,
  familyBackgroundHex,
  getCharacterLogos,
} from "@/data/character-logos";
import {
  FACE_CONTRAST_GATE,
  MARGIN_MIN,
  SECONDARY_BG_GATE,
  SECONDARY_INTERNAL_GATE,
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
  it("次色構成外輪廓且溶進背景時不合格", () => {
    const result = auditEntry(
      {
        ipColorPrimary: "#A33A48",
        ipColorSecondary: "#F4E6D0",
        faceSurface: "primary",
        secondaryTouchesBackground: true,
      },
      "#F7EEDC",
    );
    expect(result.silhouette).toBeGreaterThan(5);
    expect(result.secondary).toBeLessThan(SECONDARY_BG_GATE);
    expect(result.passes).toBe(false);
  });

  it("臉部對 faceSurface 指定的那塊，不用較亮者", () => {
    const result = auditEntry(
      {
        ipColorPrimary: "#4A281C",
        ipColorSecondary: "#F8E8D0",
        faceSurface: "primary",
        secondaryTouchesBackground: false,
      },
      "#5C9070",
    );
    expect(result.face).toBeCloseTo(contrastRatio("#1A1410", "#4A281C"), 5);
    expect(result.face).toBeLessThan(4);
  });

  it("色相遠離時剪影門檻 2.8，margin 相對該門檻", () => {
    const result = auditEntry(
      {
        ipColorPrimary: "#E4402E",
        ipColorSecondary: "#C5D8F0",
        faceSurface: "secondary",
        secondaryTouchesBackground: false,
      },
      "#003737",
    );
    expect(result.hueDist).toBeGreaterThanOrEqual(60);
    expect(result.gate).toBe(2.8);
    expect(result.margin).toBeCloseTo(result.silhouette - 2.8, 5);
    expect(result.face).toBeGreaterThanOrEqual(FACE_CONTRAST_GATE);
    expect(result.faceMargin).toBeGreaterThanOrEqual(MARGIN_MIN);
    expect(result.passes).toBe(true);
  });

  it("臉部貼 5.0 線視同未過，faceMargin 須 ≥ 0.2", () => {
    const result = auditEntry(
      {
        ipColorPrimary: "#C1710F",
        ipColorSecondary: "#2A2118",
        faceSurface: "primary",
        secondaryTouchesBackground: false,
      },
      "#382B4D",
    );
    expect(result.face).toBeGreaterThan(FACE_CONTRAST_GATE - 0.15);
    expect(result.face).toBeLessThan(FACE_CONTRAST_GATE + MARGIN_MIN);
    expect(result.faceMargin).toBeLessThan(MARGIN_MIN);
    expect(result.passes).toBe(false);
  });

  it("同色相近距即使過 3.6 也要過 4.5", () => {
    const result = auditEntry(
      {
        ipColorPrimary: "#FF8A72",
        ipColorSecondary: "#C5D8F0",
        faceSurface: "secondary",
        secondaryTouchesBackground: false,
      },
      "#76382E",
    );
    expect(result.hueDist).toBeLessThan(30);
    expect(result.gate).toBe(4.5);
    expect(result.silhouette).toBeGreaterThan(3.6);
    expect(result.silhouette).toBeLessThan(4.5);
    expect(result.margin).toBeLessThan(MARGIN_MIN);
    expect(result.passes).toBe(false);
  });

  it("次色不構成外輪廓時改查對主色，不查對背景", () => {
    const result = auditEntry(
      {
        ipColorPrimary: "#FFD24A",
        ipColorSecondary: "#2A2118",
        faceSurface: "primary",
        secondaryTouchesBackground: false,
      },
      "#023538",
    );
    expect(result.secondaryVsBackground).toBeLessThan(1.5);
    expect(result.secondaryGate).toBe(SECONDARY_INTERNAL_GATE);
    expect(result.secondary).toBeGreaterThan(result.secondaryVsBackground);
    expect(result.passes).toBe(true);
  });
});

describe("家族背景色相分群", () => {
  it("四個暗底兩兩 hueDist ≥ 45，亮度擠在 0.023–0.035", () => {
    const dark = ["rescue", "speed", "construction", "fantasy"] as const;
    const hues = dark.map((key) => LOGO_FAMILIES[key].oklch.h);
    for (let i = 0; i < hues.length; i += 1) {
      for (let j = i + 1; j < hues.length; j += 1) {
        const delta = Math.abs(hues[i]! - hues[j]!);
        const dist = Math.min(delta, 360 - delta);
        expect(dist, `${dark[i]} vs ${dark[j]}`).toBeGreaterThanOrEqual(45);
      }
    }
    const luminances = dark.map((key) =>
      relativeLuminance(LOGO_FAMILIES[key].hex),
    );
    for (const lum of luminances) {
      expect(lum).toBeGreaterThanOrEqual(0.02);
      expect(lum).toBeLessThanOrEqual(0.04);
    }
  });
});

describe("35 筆角色 logo 對比閘門", () => {
  it("35 筆全過，且每道門檻都有 margin ≥ 0.2", () => {
    const logos = getCharacterLogos();
    expect(logos).toHaveLength(35);
    const failed = logos
      .map((logo) => {
        const audit = auditEntry(logo, familyBackgroundHex(logo.family));
        return { slug: logo.slug, ...audit };
      })
      .filter((row) => !row.passes)
      .map((row) => row.slug);
    expect(failed).toEqual([]);
    for (const logo of logos) {
      const audit = auditEntry(logo, familyBackgroundHex(logo.family));
      expect(audit.margin, logo.slug).toBeGreaterThanOrEqual(MARGIN_MIN);
      expect(audit.faceMargin, logo.slug).toBeGreaterThanOrEqual(MARGIN_MIN);
      expect(audit.secondaryMargin, logo.slug).toBeGreaterThanOrEqual(MARGIN_MIN);
    }
  });

  it("joy 六位眼睛落在 primary", () => {
    for (const logo of getCharacterLogos().filter((item) => item.family === "joy")) {
      expect(logo.faceSurface, logo.slug).toBe("primary");
    }
  });

  it("四個識別特徵次色不再收成同一泥灰", () => {
    const diao = getCharacterLogos().find((logo) => logo.slug === "diao-che")!;
    const aku = getCharacterLogos().find((logo) => logo.slug === "a-ku")!;
    const chong = getCharacterLogos().find((logo) => logo.slug === "xiao-chong")!;
    const monster = getCharacterLogos().find((logo) => logo.slug === "monster-truck")!;
    expect(chong.ipColorSecondary).toBe("#2A2118");
    expect(chroma(diao.ipColorSecondary)).toBeGreaterThan(0.1);
    expect(chroma(aku.ipColorSecondary)).toBeGreaterThan(0.1);
    expect(chroma(monster.ipColorSecondary)).toBeGreaterThan(0.08);
    expect(diao.ipColorSecondary).not.toEqual(aku.ipColorSecondary);
    expect(diao.ipColorSecondary).not.toEqual(monster.ipColorSecondary);
  });
});
