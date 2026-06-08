import type { Metadata } from "next";
import Link from "next/link";
import RoughFrame from "@/components/decor/RoughFrame";
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

      <header className={styles.head}>
        <h1 className={styles.title}>車車遊樂園</h1>
        <p className={styles.subtitle}>
          給 3–7 歲孩子與家長的輕量小遊戲，和故事裡的車車朋友一起練反應、練溫柔。
        </p>
      </header>

      <ul className={styles.grid}>
        {GAMES.map((game, index) => (
          <li key={game.id} className={styles.gridItem}>
            <Link
              href={game.href}
              className={`${styles.card} popIn`}
              aria-label={`${game.title}，${game.ageRange}`}
              style={{
                boxShadow: `var(--shadow-md), 0 6px 0 ${game.accent}`,
                animationDelay: `${Math.min(index, 4) * 55}ms`,
              }}
            >
              <RoughFrame
                color={game.accent}
                rough={index % 2 === 0 ? 1 : 2}
                width={3}
              />
              <div
                className={styles.thumb}
                style={{
                  backgroundColor: `color-mix(in srgb, ${game.accent} 18%, var(--card))`,
                }}
              >
                <span className={styles.thumbEmoji} aria-hidden="true">
                  {game.emoji}
                </span>
              </div>
              <span className={styles.body}>
                <span className={styles.meta}>
                  <span
                    className={`${styles.ageTag} marker`}
                    style={{ ["--marker-color" as string]: game.accent }}
                  >
                    {game.ageRange}
                  </span>
                </span>
                <span className={styles.cardTitle}>{game.title}</span>
                <span className={styles.summary}>{game.desc}</span>
                <span className={styles.footer}>
                  <span className={styles.playLabel}>開始玩</span>
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
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
