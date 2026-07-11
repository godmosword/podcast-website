import Image from "next/image";
import Link from "next/link";
import type { Character } from "@/data/characters";
import { getStory } from "@/data/content";
import styles from "./CharacterCard.module.css";

type CharacterCardProps = {
  character: Character;
  recognized: boolean;
};

export default function CharacterCard({
  character,
  recognized,
}: CharacterCardProps) {
  const statusLabel = recognized ? "已認識" : "待認識";

  return (
    <article
      id={character.id}
      className={`${styles.card} ${recognized ? styles.cardRecognized : ""}`}
      aria-label={`${character.name}，${statusLabel}`}
    >
      {character.ref ? (
        <div
          className={`${styles.portraitFrame} ${recognized ? "" : styles.portraitPending}`}
        >
          <div className={styles.portraitMat}>
            <Image
              src={`/${character.ref}`}
              alt={`${character.name} 角色圖`}
              fill
              sizes="(max-width: 720px) 44vw, (max-width: 1100px) 28vw, 220px"
              className={styles.portrait}
            />
          </div>
          <span
            className={`${styles.statusSticker} ${recognized ? styles.stickerKnown : styles.stickerUnknown}`}
            aria-hidden
          >
            {statusLabel}
          </span>
        </div>
      ) : (
        <span
          className={`${styles.statusSticker} ${styles.stickerStandalone} ${recognized ? styles.stickerKnown : styles.stickerUnknown}`}
        >
          {statusLabel}
        </span>
      )}
      <div className={styles.cardBody}>
        <h2 className={styles.cardTitle}>{character.name}</h2>
        <p className={styles.vehicle}>{character.vehicle}</p>
        <p className={styles.personality}>{character.personality}</p>
        {character.appearsIn.length > 0 && (
          <div className={styles.storyLinks} aria-label="出場故事">
            {character.appearsIn.map((slug) => {
              const story = getStory(slug);
              if (!story) return null;
              return (
                <Link
                  key={slug}
                  href={`/story/${story.slug}`}
                  className={styles.storyLink}
                >
                  EP {story.ep}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}
