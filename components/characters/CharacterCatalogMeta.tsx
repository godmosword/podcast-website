"use client";

import type { Character } from "@/data/characters";
import { useRecognizedCharacterIds } from "@/hooks/useRecognizedCharacters";

type CharacterCatalogMetaProps = {
  characters: Character[];
  className?: string;
};

/** 圖鑑總數；聽過故事認識角色後，補上「已認識 N 位」（SSR 時只有總數）。 */
export default function CharacterCatalogMeta({
  characters,
  className,
}: CharacterCatalogMetaProps) {
  const recognizedCount = useRecognizedCharacterIds(characters).size;

  return (
    <p className={className}>
      {characters.length} 位角色
      {recognizedCount > 0 && ` · 已認識 ${recognizedCount} 位`}
    </p>
  );
}
