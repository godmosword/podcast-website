import Image from "next/image";
import Link from "next/link";
import type { Character } from "@/data/characters";
import styles from "./CharacterCastBar.module.css";

type CharacterCastBarProps = {
  characters: readonly Character[];
};

/** 單集出場條：角色插畫加名稱，連到圖鑑錨點。 */
export default function CharacterCastBar({
  characters,
}: CharacterCastBarProps) {
  if (characters.length === 0) return null;

  return (
    <ul className={styles.list}>
      {characters.map((character) => (
        <li key={character.id} className={styles.item}>
          <Link href={`/characters#${character.id}`} className={styles.link}>
            {character.ref && (
              <Image
                src={`/${character.ref}`}
                alt=""
                width={32}
                height={32}
                className={styles.avatar}
              />
            )}
            {character.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
