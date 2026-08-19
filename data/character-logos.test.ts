import { describe, expect, it } from "vitest";
import { getCharacters } from "./characters";
import {
  LOGO_COLLISION_SETS,
  LOGO_EYE_HEX,
  LOGO_FAMILIES,
  NON_VEHICLE_SLUGS,
  PILOT_SLUGS,
  TIER1_SLUGS,
  contrastRatio,
  faceSurfaceHex,
  familyBackgroundHex,
  getCharacterLogo,
  getCharacterLogos,
} from "./character-logos";

const ASSIGNMENT: Record<
  string,
  { name: string; family: string; feature: string }
> = {
  "an-an": { name: "安安", family: "rescue", feature: "十字" },
  "liang-liang": { name: "亮亮", family: "rescue", feature: "車頂警示燈條" },
  "quan-quan": { name: "圈圈", family: "rescue", feature: "雲梯" },
  "dian-dian": { name: "點點", family: "rescue", feature: "水砲" },
  "pen-pen": { name: "噴噴", family: "rescue", feature: "噴嘴" },
  "ling-ling": { name: "玲玲", family: "construction", feature: "旋轉刷" },
  "dong-dong": { name: "東東", family: "construction", feature: "挖斗" },
  "diao-che": { name: "老爺爺", family: "construction", feature: "吊鉤臂" },
  "a-ku": { name: "阿酷", family: "construction", feature: "鑽頭" },
  "a-ni": { name: "阿尼", family: "construction", feature: "滾筒" },
  "xiao-hong": { name: "小紅", family: "speed", feature: "單一尾翼" },
  "xiao-chong": { name: "小衝", family: "speed", feature: "雙進氣口" },
  "xiao-hong-dad": {
    name: "紅爸",
    family: "speed",
    feature: "尾翼 + 一道眉線",
  },
  "xiao-hong-baby": { name: "小小紅", family: "speed", feature: "奶嘴" },
  "xiao-hong-dad-young": {
    name: "年輕紅爸",
    family: "speed",
    feature: "小尾翼",
  },
  "lan-ba-shi": {
    name: "小巴士",
    family: "transit",
    feature: "方形連續車窗帶",
  },
  "huang-ji-cheng": { name: "計程", family: "transit", feature: "車頂燈箱" },
  "zhi-zhi": { name: "知知", family: "transit", feature: "車頂 LiDAR 圓罩" },
  "xiao-ju-hsr": { name: "小橘", family: "transit", feature: "流線頭錐" },
  "xiao-nan": { name: "小南", family: "transit", feature: "圓弧車頭 + 車門" },
  "san-lun-che": { name: "三輪", family: "transit", feature: "單前輪" },
  "xiao-fei": { name: "無人機", family: "transit", feature: "螺旋槳環" },
  "xiang-xiang": { name: "香香", family: "joy", feature: "斜向遮陽棚" },
  "popcorn-truck": { name: "花餐", family: "joy", feature: "爆米花桶" },
  "pu-pu-pig": { name: "噗噗", family: "joy", feature: "豬鼻" },
  "xiao-rou": { name: "小柔", family: "joy", feature: "車頂帳篷" },
  "gao-gao": { name: "高高", family: "joy", feature: "輪圈輻條" },
  dudu: { name: "嘟嘟", family: "joy", feature: "圓拱車頂" },
  "duo-duo": { name: "多多", family: "fantasy", feature: "背鰭" },
  "monster-truck": { name: "萌萌", family: "fantasy", feature: "巨型輪" },
  "dirty-germs": { name: "小怪獸", family: "fantasy", feature: "一對圓鈍角" },
  "nuan-nuan-turtle": { name: "暖暖", family: "fantasy", feature: "龜殼" },
  "bong-bong": { name: "阿蹦", family: "people", feature: "呆毛" },
  mami: { name: "媽咪", family: "people", feature: "麥克風" },
  watt: { name: "沃特", family: "people", feature: "天線圓球" },
};

describe("character logos", () => {
  const logos = getCharacterLogos();

  it("35 筆且 slug 與角色名冊 1:1", () => {
    expect(logos).toHaveLength(35);
    const characterIds = getCharacters().map((character) => character.id).sort();
    const logoSlugs = logos.map((logo) => logo.slug).sort();
    expect(logoSlugs).toEqual(characterIds);
  });

  it("slug 不重複", () => {
    const slugs = logos.map((logo) => logo.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("分配表的名稱／家族／特徵不得自行改", () => {
    expect(Object.keys(ASSIGNMENT)).toHaveLength(35);
    for (const logo of logos) {
      const assigned = ASSIGNMENT[logo.slug];
      expect(assigned, logo.slug).toBeDefined();
      expect(logo.name).toBe(assigned.name);
      expect(logo.family).toBe(assigned.family);
      expect(logo.feature).toBe(assigned.feature);
    }
  });

  it("小南名稱用分配表短名，不是圖鑑顯示名", () => {
    expect(getCharacterLogo("xiao-nan")?.name).toBe("小南");
  });

  it("家族 key 皆在七色表內", () => {
    for (const logo of logos) {
      expect(logo.family in LOGO_FAMILIES).toBe(true);
    }
  });

  it("IP 色為大寫 #RRGGBB", () => {
    const hex = /^#[0-9A-F]{6}$/;
    for (const logo of logos) {
      expect(logo.ipColorPrimary).toMatch(hex);
      expect(logo.ipColorSecondary).toMatch(hex);
    }
  });

  it("剪影主色對家族背景 ≥ 3:1", () => {
    for (const logo of logos) {
      const ratio = contrastRatio(
        logo.ipColorPrimary,
        familyBackgroundHex(logo.family),
      );
      expect(ratio, `${logo.slug} ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("較亮 IP 色對深色眼標記 ≥ 4.5:1", () => {
    for (const logo of logos) {
      const ratio = contrastRatio(faceSurfaceHex(logo), LOGO_EYE_HEX);
      expect(ratio, `${logo.slug} ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });

  it("產圖前 status 皆 pending", () => {
    expect(logos.every((logo) => logo.status === "pending")).toBe(true);
  });

  it("Tier 1 十位與 Pilot 三位對齊生產分級", () => {
    expect(TIER1_SLUGS).toHaveLength(10);
    expect(PILOT_SLUGS.every((slug) => TIER1_SLUGS.includes(slug))).toBe(true);
    for (const logo of logos) {
      const expectedTier = (TIER1_SLUGS as readonly string[]).includes(logo.slug)
        ? 1
        : 2;
      expect(logo.tier, logo.slug).toBe(expectedTier);
    }
  });

  it("小衝主色不得偏紅", () => {
    const chong = getCharacterLogo("xiao-chong");
    expect(chong).toBeDefined();
    const [r, g, b] = [
      parseInt(chong!.ipColorPrimary.slice(1, 3), 16),
      parseInt(chong!.ipColorPrimary.slice(3, 5), 16),
      parseInt(chong!.ipColorPrimary.slice(5, 7), 16),
    ];
    expect(g).toBeGreaterThan(r * 0.6);
    expect(b).toBeLessThan(g);
  });

  it("五組撞型成員都存在", () => {
    for (const set of LOGO_COLLISION_SETS) {
      for (const slug of set.slugs) {
        expect(getCharacterLogo(slug), slug).toBeDefined();
      }
    }
  });

  it("非車類 8 位都在名冊", () => {
    expect(NON_VEHICLE_SLUGS).toHaveLength(8);
    for (const slug of NON_VEHICLE_SLUGS) {
      expect(getCharacterLogo(slug), slug).toBeDefined();
    }
  });
});
