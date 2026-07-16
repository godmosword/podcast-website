import Image from "next/image";
import Link from "next/link";
import { GAMES, gameParentTip } from "@/data/games";
import type { GameKitGameId } from "@/lib/gamekit/types";
import styles from "./GameIntro.module.css";

const TYPE_LABELS = {
  match: "溫柔探索",
  adventure: "跑跳闖關",
  blocks: "堆疊挑戰",
  racing: "賽道競速",
  coloring: "塗顏色",
} as const;

export function GameIntro({ gameId }: { gameId: GameKitGameId }) {
  const game = GAMES.find((item) => item.slug === gameId);

  if (!game) return null;

  const parentTip = gameParentTip(game);

  return (
    <section className={styles.intro} aria-labelledby="game-page-title" data-game-id={game.slug}>
      <div className={styles.cover}>
        <Image
          src={game.art.cover}
          alt={game.art.alt}
          fill
          priority
          sizes="(max-width: 640px) 100vw, 360px"
          className={styles.coverImage}
          style={{ objectPosition: game.art.position ?? "50% 50%" }}
        />
        <span className={styles.coverLabel}>{TYPE_LABELS[game.gameType]}</span>
      </div>
      <div className={styles.copy}>
        <div className={styles.eyebrow}>
          <span>{game.ageRange}</span>
          <span aria-hidden>·</span>
          <span>約 {game.estMinutes} 分鐘</span>
        </div>
        <h1 id="game-page-title">{game.title}</h1>
        <p>{game.desc}</p>
        {parentTip ? <p className={styles.parentTip}>{parentTip}</p> : null}
        <div className={styles.controls} aria-label="操作提示">
          {game.controls.map((control) => (
            <span key={control}>{control}</span>
          ))}
        </div>
        <Link href="/games" className={styles.moreLink}>
          看其他遊戲 <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
