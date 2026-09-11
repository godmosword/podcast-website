import Image from "next/image";
import type { Character } from "@/data/characters";
import { catalogEpisodesFor } from "@/lib/character-catalog";
import CharacterEpisodeSelect from "./CharacterEpisodeSelect";
import CharacterPortraitTilt from "./CharacterPortraitTilt";
import styles from "./CharacterCard.module.css";

type CharacterCardProps = {
  character: Character;
  recognized: boolean;
};

function identityLabel(character: Character): string {
  return character.vehicle === character.name
    ? character.name
    : `${character.name}，${character.vehicle}`;
}

export default function CharacterCard({
  character,
  recognized,
}: CharacterCardProps) {
  const episodes = catalogEpisodesFor(character.appearsIn);
  const articleLabel = recognized
    ? `${identityLabel(character)}，已認識`
    : identityLabel(character);

  return (
    <article
      id={character.id}
      className={`${styles.card} ${recognized ? styles.cardRecognized : ""}`}
      aria-label={articleLabel}
    >
      {character.ref ? (
        <div className={styles.portraitFrame}>
          <CharacterPortraitTilt className={styles.portraitMat}>
            <Image
              src={`/${character.ref}`}
              alt={`${character.name} 角色圖`}
              fill
              sizes="(max-width: 720px) 44vw, (max-width: 1100px) 28vw, 220px"
              className={styles.portrait}
            />
          </CharacterPortraitTilt>
          {recognized && (
            <span className={`${styles.statusSticker} ${styles.stickerKnown}`} aria-hidden>
              已認識
            </span>
          )}
        </div>
      ) : (
        recognized && (
          <span
            className={`${styles.statusSticker} ${styles.stickerStandalone} ${styles.stickerKnown}`}
          >
            已認識
          </span>
        )
      )}
      <div className={styles.cardBody}>
        <h2 className={styles.cardTitle}>
          <span className={styles.name}>{character.name}</span>
          {character.vehicle !== character.name && (
            <>
              {" "}
              <span className={styles.vehicle}>{character.vehicle}</span>
            </>
          )}
        </h2>
        <p className={styles.personality}>{character.personality}</p>
        <CharacterEpisodeSelect
          characterName={character.name}
          episodes={episodes}
        />
      </div>
    </article>
  );
}
