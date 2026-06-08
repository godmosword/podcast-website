import Link from "next/link";
import type { GameCatalogEntry } from "@/lib/games/catalog";
import RoughFrame from "@/components/decor/RoughFrame";
import styles from "./GameCard.module.css";

type GameCardProps = {
  game: GameCatalogEntry;
  index?: number;
};

export default function GameCard({ game, index = 0 }: GameCardProps) {
  return (
    <Link
      href={game.href}
      className={`${styles.card} popIn`}
      style={{
        boxShadow: `var(--shadow-md), 0 6px 0 ${game.accent}`,
        animationDelay: `${Math.min(index, 4) * 55}ms`,
      }}
    >
      <RoughFrame color={game.accent} rough={index % 2 === 0 ? 1 : 2} width={3} />
      <div
        className={styles.emojiWrap}
        style={{ backgroundColor: `color-mix(in srgb, ${game.accent} 18%, var(--card))` }}
      >
        <span className={styles.emoji} aria-hidden="true">
          {game.emoji}
        </span>
      </div>
      <span className={styles.body}>
        <span className={styles.title}>{game.title}</span>
        <span className={styles.desc}>{game.desc}</span>
        <span
          className={styles.arrow}
          style={{
            backgroundColor: `color-mix(in srgb, ${game.accent} 14%, var(--card))`,
            color: "var(--ink)",
          }}
          aria-hidden
        >
          ▶
        </span>
      </span>
    </Link>
  );
}
