import {
  LOGO_COLLISION_SETS,
  LOGO_FAMILIES,
  type CharacterLogo,
  type LogoFamilyKey,
  relativeLuminance,
} from "@/data/character-logos";

export const LOGO_PREVIEW_SIZES = [32, 64, 128, 512] as const;

export type LogoPreviewSize = (typeof LOGO_PREVIEW_SIZES)[number];

export type LogoAuditView = "grid" | "collisions" | "families";

export const LOGO_AUDIT_VIEWS: readonly {
  id: LogoAuditView;
  label: string;
}[] = [
  { id: "grid", label: "Grid 縮圖" },
  { id: "collisions", label: "撞型並排" },
  { id: "families", label: "家族分群" },
];

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

export function logoSourceSize(preview: LogoPreviewSize): 32 | 128 | 512 {
  if (preview <= 32) return 32;
  if (preview <= 128) return 128;
  return 512;
}

export function logoAssetPath(slug: string, preview: LogoPreviewSize): string {
  return `/characters/logo/${slug}-${logoSourceSize(preview)}.webp`;
}

export function familyOnDark(family: LogoFamilyKey): boolean {
  return relativeLuminance(LOGO_FAMILIES[family].hex) < 0.45;
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
