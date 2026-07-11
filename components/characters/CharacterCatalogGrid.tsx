"use client";

import type { Character } from "@/data/characters";
import { useRecognizedCharacterIds } from "@/hooks/useRecognizedCharacters";
import CharacterCard from "./CharacterCard";
import styles from "./CharacterCatalogGrid.module.css";

type CharacterCatalogGridProps = {
  characters: Character[];
};

export default function CharacterCatalogGrid({
  characters,
}: CharacterCatalogGridProps) {
  const recognizedIds = useRecognizedCharacterIds(characters);

  return (
    <section className={styles.grid} aria-label="角色清單">
      {characters.map((character) => (
        <CharacterCard
          key={character.id}
          character={character}
          recognized={recognizedIds.has(character.id)}
        />
      ))}
    </section>
  );
}
