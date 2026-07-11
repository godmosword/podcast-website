import type { Character } from "@/data/characters";
import { canonicalStorySlug } from "@/lib/story-slug-aliases";

type CharacterRecognitionInput = Pick<Character, "id" | "appearsIn">;

/** 角色是否已認識：顯式解鎖或聽完任一齣出場故事。 */
export function isCharacterRecognized(
  character: CharacterRecognitionInput,
  completedSlugs: ReadonlySet<string>,
  unlockedIds: ReadonlySet<string>,
): boolean {
  if (unlockedIds.has(character.id)) return true;
  return character.appearsIn.some((slug) =>
    completedSlugs.has(canonicalStorySlug(slug)),
  );
}

export function computeRecognizedCharacterIds(
  characters: CharacterRecognitionInput[],
  completedSlugs: ReadonlySet<string>,
  unlockedIds: ReadonlySet<string>,
): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const character of characters) {
    if (isCharacterRecognized(character, completedSlugs, unlockedIds)) {
      ids.add(character.id);
    }
  }
  return ids;
}
