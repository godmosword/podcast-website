import rawLogos from "./character-logos.json";

/** 七個 logo 家族。OKLCH 為權威，hex 為生圖／CSS 參考。 */
export const LOGO_FAMILIES = {
  rescue: {
    label: "緊急救援",
    oklch: { l: 0.28, c: 0.06, h: 250 },
    hex: "#1B2A44",
  },
  construction: {
    label: "工程建設",
    oklch: { l: 0.32, c: 0.06, h: 300 },
    hex: "#382B4D",
  },
  speed: {
    label: "速度競賽",
    oklch: { l: 0.3, c: 0.05, h: 200 },
    hex: "#023538",
  },
  transit: {
    label: "大眾運輸",
    oklch: { l: 0.45, c: 0.09, h: 235 },
    hex: "#0F5C80",
  },
  joy: {
    label: "生活歡樂",
    oklch: { l: 0.3, c: 0.06, h: 100 },
    hex: "#352E02",
  },
  fantasy: {
    label: "奇幻夥伴",
    oklch: { l: 0.32, c: 0.06, h: 150 },
    hex: "#193B22",
  },
  people: {
    label: "人與夥伴",
    oklch: { l: 0.52, c: 0.10, h: 320 },
    hex: "#8A5C82",
  },
} as const;

export type LogoFamilyKey = keyof typeof LOGO_FAMILIES;

export type CharacterLogoStatus = "pending" | "pilot" | "accepted" | "rejected";

export type FaceSurface = "primary" | "secondary";

export type CharacterLogo = {
  slug: string;
  name: string;
  vehicle: string;
  family: LogoFamilyKey;
  feature: string;
  ipColorPrimary: string;
  ipColorSecondary: string;
  faceSurface: FaceSurface;
  secondaryTouchesBackground: boolean;
  tier: 1 | 2;
  status: CharacterLogoStatus;
  notes: string;
};

type RawCharacterLogo = {
  slug: string;
  name: string;
  vehicle: string;
  family: string;
  feature: string;
  ipColorPrimary: string;
  ipColorSecondary: string;
  faceSurface: string;
  secondaryTouchesBackground: boolean;
  tier: number;
  status: string;
  notes: string;
};

export const PILOT_SLUGS = [
  "xiao-hong",
  "dong-dong",
  "nuan-nuan-turtle",
] as const;

export const TIER1_SLUGS = [
  "xiao-hong",
  "duo-duo",
  "dong-dong",
  "an-an",
  "liang-liang",
  "pu-pu-pig",
  "nuan-nuan-turtle",
  "bong-bong",
  "mami",
  "watt",
] as const;

export const NON_VEHICLE_SLUGS = [
  "bong-bong",
  "mami",
  "watt",
  "xiao-fei",
  "nuan-nuan-turtle",
  "dirty-germs",
  "duo-duo",
  "monster-truck",
] as const;

export const LOGO_COLLISION_SETS = [
  {
    id: "speed-bloodline",
    slugs: [
      "xiao-hong",
      "xiao-hong-dad",
      "xiao-hong-baby",
      "xiao-hong-dad-young",
    ],
  },
  {
    id: "xiao-hong-vs-xiao-chong",
    slugs: ["xiao-hong", "xiao-chong"],
  },
  {
    id: "fire-brothers",
    slugs: ["quan-quan", "dian-dian"],
  },
  {
    id: "food-trucks",
    slugs: ["xiang-xiang", "popcorn-truck"],
  },
  {
    id: "taxis",
    slugs: ["huang-ji-cheng", "zhi-zhi"],
  },
] as const;

const FAMILY_KEYS = new Set<string>(Object.keys(LOGO_FAMILIES));
const HEX_PATTERN = /^#[0-9A-F]{6}$/;
const STATUS_VALUES = new Set(["pending", "pilot", "accepted", "rejected"]);

function isLogoFamilyKey(value: string): value is LogoFamilyKey {
  return FAMILY_KEYS.has(value);
}

function parseLogo(raw: RawCharacterLogo, index: number): CharacterLogo {
  if (!isLogoFamilyKey(raw.family)) {
    throw new Error(`character-logos.json[${index}] 未知家族：${raw.family}`);
  }
  if (raw.tier !== 1 && raw.tier !== 2) {
    throw new Error(`character-logos.json[${index}] tier 必須是 1 或 2`);
  }
  if (!STATUS_VALUES.has(raw.status)) {
    throw new Error(`character-logos.json[${index}] 未知 status：${raw.status}`);
  }
  if (!HEX_PATTERN.test(raw.ipColorPrimary) || !HEX_PATTERN.test(raw.ipColorSecondary)) {
    throw new Error(`character-logos.json[${index}] IP 色必須是 #RRGGBB`);
  }
  if (!raw.feature.trim()) {
    throw new Error(`character-logos.json[${index}] feature 不可空白`);
  }
  if (raw.faceSurface !== "primary" && raw.faceSurface !== "secondary") {
    throw new Error(
      `character-logos.json[${index}] faceSurface 必須是 primary 或 secondary`,
    );
  }
  if (typeof raw.secondaryTouchesBackground !== "boolean") {
    throw new Error(
      `character-logos.json[${index}] secondaryTouchesBackground 必須是 boolean`,
    );
  }
  return {
    slug: raw.slug,
    name: raw.name,
    vehicle: raw.vehicle,
    family: raw.family,
    feature: raw.feature,
    ipColorPrimary: raw.ipColorPrimary,
    ipColorSecondary: raw.ipColorSecondary,
    faceSurface: raw.faceSurface,
    secondaryTouchesBackground: raw.secondaryTouchesBackground,
    tier: raw.tier,
    status: raw.status as CharacterLogoStatus,
    notes: raw.notes,
  };
}

const LOGOS: CharacterLogo[] = (rawLogos as RawCharacterLogo[]).map(parseLogo);

const LOGO_BY_SLUG = new Map(LOGOS.map((logo) => [logo.slug, logo]));

export function getCharacterLogos(): CharacterLogo[] {
  return LOGOS;
}

export function getCharacterLogo(slug: string): CharacterLogo | undefined {
  return LOGO_BY_SLUG.get(slug);
}

/**
 * 公開 UI 只掛已經 approve、且理論上伴隨 public asset 的 Logo。
 * pending／rejected 仍可供 studio 驗收與生圖管線使用，但不應在正式頁面
 * 先發出必然 404 的圖片請求。
 */
export function isPublishedCharacterLogo(slug: string): boolean {
  const status = getCharacterLogo(slug)?.status;
  return status === "pilot" || status === "accepted";
}

export function familyBackgroundHex(family: LogoFamilyKey): string {
  return LOGO_FAMILIES[family].hex;
}

/** 深色眼標記（恆定層）。 */
export const LOGO_EYE_HEX = "#1A1410";

function srgbToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function parseHexColor(hex: string): readonly [number, number, number] {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ] as const;
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHexColor(hex);
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
}

export function contrastRatio(hexA: string, hexB: string): number {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

/** 眼睛落點：由資料 `faceSurface` 指定，不用較亮者推測。 */
export function faceSurfaceHex(logo: CharacterLogo): string {
  return logo.faceSurface === "primary"
    ? logo.ipColorPrimary
    : logo.ipColorSecondary;
}

/** 角色 schema 必填：缺檔或 feature 空白則模組載入／build 失敗。 */
export function requireCharacterLogo(slug: string): CharacterLogo {
  const logo = getCharacterLogo(slug);
  if (!logo) {
    throw new Error(
      `角色 ${slug} 缺少 logoFamily／logoFeature。請先在 data/character-logos.json 建檔。`,
    );
  }
  if (!logo.feature.trim()) {
    throw new Error(`角色 ${slug} 的 logoFeature 不可空白`);
  }
  return logo;
}

/** 核對 logo slug 與角色名冊 1:1（由 data/characters.ts 在組完名冊後呼叫）。 */
export function assertCharacterLogoRoster(characterIds: readonly string[]): void {
  const ids = [...characterIds].sort();
  const logoSlugs = LOGOS.map((logo) => logo.slug).sort();
  if (ids.join("\n") !== logoSlugs.join("\n")) {
    throw new Error("character-logos.json slug 必須與 getCharacters() id 1:1 對齊");
  }
}
