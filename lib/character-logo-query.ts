import { getCharacters, type Character } from "@/data/characters";

export const CHARACTER_LOGO_PX = [32, 128, 512] as const;

export type CharacterLogoPx = (typeof CHARACTER_LOGO_PX)[number];

/** 公開路徑；24px 顯示仍吃 32.webp。 */
export function characterLogoAssetPath(
  slug: string,
  size: CharacterLogoPx = 32,
): string {
  return `/characters/logo/${slug}-${size}.webp`;
}

export function characterForPortraitRef(
  ref: string | undefined,
): Character | undefined {
  if (!ref) return undefined;
  return getCharacters().find((character) => character.ref === ref);
}
