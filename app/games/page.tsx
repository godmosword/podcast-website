import type { Metadata } from "next";
import Link from "next/link";
import GameCard from "@/components/games/GameCard";
import { GAMES } from "@/lib/games/catalog";
import { getSiteUrl } from "@/lib/site-url";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "車車遊樂園",
  description:
    "和故事裡的車車朋友一起玩小遊戲：吃星星迷宮、溫柔任務，適合 3–7 歲親子。",
  openGraph: {
    title: "車車遊樂園 · 小遊戲",
    description:
      "車車吃星星、怪獸卡車溫柔任務——適合 3–7 歲的親子小遊戲。",
    url: `${getSiteUrl()}/games`,
  },
};

export default function GamesHubPage() {
  return (
    <main className={styles.main} aria-label="車車遊樂園小遊戲">
      <Link href="/" className={styles.back}>
        ← 回故事屋
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>車車遊樂園</h1>
        <p className={styles.subtitle}>
          給 3–7 歲孩子與家長的輕量小遊戲，和故事裡的車車朋友一起練反應、練溫柔。
        </p>
      </header>

      <div className={styles.grid}>
        {GAMES.map((game, index) => (
          <GameCard key={game.id} game={game} index={index} />
        ))}
      </div>
    </main>
  );
}
