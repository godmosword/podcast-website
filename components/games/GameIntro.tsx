import Image from "next/image";
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

/**
 * 家長導向的遊戲說明卡，位於遊戲區下方（第二層）。
 *
 * 頁面唯一 `<h1>` 由 `GamePageShell` 的 `.playHeader` 持有；本區用 `<h2>`，
 * `aria-labelledby` 指向自己的標題，避免指到頁面其他區塊。
 * 操作提示屬兒童資訊，已改由 `GamePageShell` 在遊戲正下方呈現。
 */
export function GameIntro({ gameId }: { gameId: GameKitGameId }) {
  const game = GAMES.find((item) => item.slug === gameId);

  if (!game) return null;

  const parentTip = gameParentTip(game);

  return (
    <section
      className={styles.intro}
      aria-labelledby="game-parent-intro-title"
      data-game-id={game.slug}
    >
      <div className={styles.cover}>
        <Image
          src={game.art.cover}
          alt={game.art.alt}
          fill
          sizes="(max-width: 640px) 100vw, 360px"
          className={styles.coverImage}
          style={{ objectPosition: game.art.position ?? "50% 50%" }}
        />
        <span className={styles.coverLabel}>{TYPE_LABELS[game.gameType]}</span>
      </div>
      <div className={styles.copy}>
        {/* 標題不重複遊戲名（那由頁面 h1 持有），改點明這一區是寫給誰看的。 */}
        <h2 id="game-parent-intro-title" className={styles.parentHeading}>
          給家長的說明
        </h2>
        <div className={styles.eyebrow}>
          <span>{game.ageRange}</span>
          <span aria-hidden>·</span>
          <span>約 {game.estMinutes} 分鐘</span>
        </div>
        <p>{game.desc}</p>
        {parentTip ? <p className={styles.parentTip}>{parentTip}</p> : null}
        <div className={styles.playFacts} aria-label="遊玩條件">
          <span>{game.hasTimer ? "⏱ 有計時挑戰" : "🌿 沒有時間壓力"}</span>
          <span>{game.hasScore ? "⭐ 有分數回饋" : "🎨 自由完成"}</span>
        </div>
      </div>
    </section>
  );
}
