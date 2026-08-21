import {
  LOGO_COLLISION_SETS,
  LOGO_FAMILIES,
  type CharacterLogo,
  type LogoFamilyKey,
  relativeLuminance,
} from "@/data/character-logos";
import {
  characterLogoAssetPath,
  type CharacterLogoPx,
} from "@/lib/character-logo-query";
import { auditEntry } from "@/lib/character-logo-contrast";

export const LOGO_PREVIEW_SIZES = [32, 64, 128, 512] as const;

export type LogoPreviewSize = (typeof LOGO_PREVIEW_SIZES)[number];

export type LogoAuditView =
  | "grid"
  | "collisions"
  | "families"
  | "sample"
  | "contrast";

export const LOGO_AUDIT_VIEWS: readonly {
  id: LogoAuditView;
  label: string;
}[] = [
  { id: "grid", label: "Grid 縮圖" },
  { id: "collisions", label: "撞型並排" },
  { id: "families", label: "家族分群" },
  { id: "sample", label: "取色比對" },
  { id: "contrast", label: "對比檢查" },
];

export const BLOODLINE_COLLISION_HINT =
  "賽車血緣四位共用 #E4402E，剪影差異只剩高寬比與識別記號，是最高風險組。";

export type LogoAuditTileSource = {
  key: string;
  src: string;
  caption: string;
  kind: "approved" | "staging" | "missing";
};

export function logoAuditTiles(
  logo: CharacterLogo,
  size: LogoPreviewSize,
  preferred: { src: string; kind: "approved" | "staging" } | null,
  staging: readonly { src: string; file: string }[] = [],
): LogoAuditTileSource[] {
  if (preferred?.kind === "approved") {
    return [
      {
        key: `${logo.slug}-approved`,
        src: logoAssetPath(logo.slug, size),
        caption: `${logo.name} · ${logo.feature}`,
        kind: "approved",
      },
    ];
  }
  if (staging.length > 0) {
    return staging.map((item) => ({
      key: `${logo.slug}-${item.file}`,
      src: item.src,
      caption: `${logo.name} · ${item.file}`,
      kind: "staging",
    }));
  }
  return [
    {
      key: logo.slug,
      src: logoAssetPath(logo.slug, size),
      caption: `${logo.name} · ${logo.feature}`,
      kind: "missing",
    },
  ];
}

export const LOGO_COLLISION_LABELS: Record<
  (typeof LOGO_COLLISION_SETS)[number]["id"],
  string
> = {
  "speed-bloodline": "賽車血緣",
  "xiao-hong-vs-xiao-chong": "小紅 vs 小衝",
  "fire-brothers": "消防兄弟",
  "food-trucks": "兩台餐車",
  "taxis": "兩台計程車",
};

export function logoSourceSize(preview: LogoPreviewSize): CharacterLogoPx {
  if (preview <= 32) return 32;
  if (preview <= 128) return 128;
  return 512;
}

export function logoAssetPath(slug: string, preview: LogoPreviewSize): string {
  return characterLogoAssetPath(slug, logoSourceSize(preview));
}

export function familyOnDark(family: LogoFamilyKey): boolean {
  return relativeLuminance(LOGO_FAMILIES[family].hex) < 0.45;
}

export type LogoContrastRow = {
  slug: string;
  name: string;
  family: LogoFamilyKey;
  familyLabel: string;
  primary: string;
  secondary: string;
  faceSurface: CharacterLogo["faceSurface"];
  secondaryTouchesBackground: boolean;
  silhouette: number;
  hueDist: number;
  gate: number;
  silMargin: number;
  face: number;
  faceMargin: number;
  secondaryContrast: number;
  secondaryGate: number;
  secondaryMargin: number;
  secondaryVsPrimary: number;
  secondaryVsPrimaryHueDist: number;
  secondaryDistinguishable: boolean;
  passes: boolean;
};

export function auditLogoContrast(
  logos: readonly CharacterLogo[],
): LogoContrastRow[] {
  return logos.map((logo) => {
    const family = LOGO_FAMILIES[logo.family];
    const audit = auditEntry(logo, family.hex);
    return {
      slug: logo.slug,
      name: logo.name,
      family: logo.family,
      familyLabel: family.label,
      primary: logo.ipColorPrimary,
      secondary: logo.ipColorSecondary,
      faceSurface: logo.faceSurface,
      secondaryTouchesBackground: logo.secondaryTouchesBackground,
      silhouette: audit.silhouette,
      hueDist: audit.hueDist,
      gate: audit.gate,
      silMargin: audit.margin,
      face: audit.face,
      faceMargin: audit.faceMargin,
      secondaryContrast: audit.secondary,
      secondaryGate: audit.secondaryGate,
      secondaryMargin: audit.secondaryMargin,
      secondaryVsPrimary: audit.secondaryVsPrimary,
      secondaryVsPrimaryHueDist: audit.secondaryVsPrimaryHueDist,
      secondaryDistinguishable: audit.secondaryDistinguishable,
      passes: audit.passes,
    };
  });
}

export function logosByFamily(
  logos: readonly CharacterLogo[],
): { family: LogoFamilyKey; label: string; logos: CharacterLogo[] }[] {
  return (Object.keys(LOGO_FAMILIES) as LogoFamilyKey[]).map((family) => ({
    family,
    label: LOGO_FAMILIES[family].label,
    logos: logos.filter((logo) => logo.family === family),
  }));
}

export function resolveCollisionSets(logos: readonly CharacterLogo[]): {
  id: (typeof LOGO_COLLISION_SETS)[number]["id"];
  label: string;
  logos: CharacterLogo[];
}[] {
  const bySlug = new Map(logos.map((logo) => [logo.slug, logo]));
  return LOGO_COLLISION_SETS.map((set) => ({
    id: set.id,
    label: LOGO_COLLISION_LABELS[set.id],
    logos: set.slugs.map((slug) => {
      const logo = bySlug.get(slug);
      if (!logo) {
        throw new Error(`撞型組 ${set.id} 缺少 ${slug}`);
      }
      return logo;
    }),
  }));
}
