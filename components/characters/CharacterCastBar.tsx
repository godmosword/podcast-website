import Link from "next/link";
import type { Character } from "@/data/characters";
import CharacterLogoMark from "./CharacterLogoMark";
import styles from "./CharacterCastBar.module.css";

type CharacterCastBarProps = {
  characters: readonly Character[];
};

/** 單集出場條：名稱連到圖鑑錨點；logo 有檔才出現在名前。 */
export default function CharacterCastBar({
  characters,
}: CharacterCastBarProps) {
  if (characters.length === 0) return null;

  return (
    <ul className={styles.list}>
      {characters.map((character) => (
        <li key={character.id} className={styles.item}>
          <Link
            href={`/characters#${character.id}`}
            className={styles.link}
          >
            <CharacterLogoMark
              slug={character.id}
              name={character.name}
              size={32}
            />
            {character.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
