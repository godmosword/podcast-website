import { describe, expect, it } from "vitest";
import { getCharacterLogos } from "@/data/character-logos";
import sitemap from "@/app/sitemap";
import {
  BLOODLINE_COLLISION_HINT,
  LOGO_AUDIT_VIEWS,
  LOGO_COLLISION_LABELS,
  LOGO_PREVIEW_SIZES,
  familyOnDark,
  logoAssetPath,
  logoAuditTiles,
  logoSourceSize,
  logosByFamily,
  resolveCollisionSets,
} from "./logo-audit";

describe("logo audit helpers", () => {
  it("預覽尺寸對到 32／128／512 資產", () => {
    expect(LOGO_PREVIEW_SIZES).toEqual([32, 64, 128, 512]);
    expect(logoSourceSize(32)).toBe(32);
    expect(logoSourceSize(64)).toBe(128);
    expect(logoSourceSize(128)).toBe(128);
    expect(logoSourceSize(512)).toBe(512);
    expect(logoAssetPath("xiao-hong", 64)).toBe(
      "/characters/logo/xiao-hong-128.webp",
    );
  });

  it("五組撞型都解析得出且有中文標籤", () => {
    const sets = resolveCollisionSets(getCharacterLogos());
    expect(sets).toHaveLength(5);
    expect(sets.map((set) => set.id)).toEqual(Object.keys(LOGO_COLLISION_LABELS));
    expect(sets[0]?.id).toBe("speed-bloodline");
    expect(sets[0]?.logos.map((logo) => logo.slug)).toEqual([
      "xiao-hong",
      "xiao-hong-dad",
      "xiao-hong-baby",
      "xiao-hong-dad-young",
    ]);
  });

  it("家族分群覆蓋 35 人且順序固定", () => {
    const groups = logosByFamily(getCharacterLogos());
    expect(groups.map((group) => group.family)).toEqual([
      "rescue",
      "construction",
      "speed",
      "transit",
      "joy",
      "fantasy",
      "people",
    ]);
    expect(groups.reduce((sum, group) => sum + group.logos.length, 0)).toBe(35);
    expect(familyOnDark("rescue")).toBe(true);
    expect(familyOnDark("joy")).toBe(false);
  });

  it("驗收頁不進 sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.some((url) => url.includes("/studio"))).toBe(false);
    expect(LOGO_AUDIT_VIEWS).toHaveLength(4);
    expect(LOGO_AUDIT_VIEWS.map((view) => view.id)).toContain("sample");
    expect(BLOODLINE_COLLISION_HINT).toContain("#E4402E");
  });

  it("無正式檔時 32px grid 改吃 staging 候選", () => {
    const logo = getCharacterLogos().find((item) => item.slug === "xiao-hong");
    expect(logo).toBeDefined();
    const tiles = logoAuditTiles(logo!, 32, null, [
      { src: "/studio/logo-staging/xiao-hong/01.png", file: "01.png" },
      { src: "/studio/logo-staging/xiao-hong/02.png", file: "02.png" },
    ]);
    expect(tiles).toHaveLength(2);
    expect(tiles.every((tile) => tile.kind === "staging")).toBe(true);
    expect(tiles[0]?.src).toBe("/studio/logo-staging/xiao-hong/01.png");
  });
});
